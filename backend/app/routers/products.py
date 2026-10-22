import uuid
import datetime
import base64
import json
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from app.schemas.products import (
    MurtiOut, MurtiCreate, MurtiUpdate,
    MurtiVariantOut, MurtiVariantCreate, MurtiVariantUpdate,
    CatalogImageItem
)
from app.schemas.common import (
    ApiResponse, PaginatedResponse, RatingDisplayMode,
    CursorPaginatedResponse, CursorPageInfo
)
from app.database import get_supabase, is_supabase_connected, local_store
from app.auth import get_current_admin
from app.logger import logger
from app.errors import NotFoundError, BadRequestError

router = APIRouter(prefix="/api/products", tags=["Product Catalog & Variants (Req #2, #3, #5, #7)"])

# =============================================================================
# ENTERPRISE KEYSET / CURSOR PAGINATION ENCODER & DECODER
# Replaces slow OFFSET queries with O(log N) indexed keyset seeks
# =============================================================================
def encode_cursor(sort_val: int, item_id: str) -> str:
    payload = json.dumps({"s": int(sort_val), "i": str(item_id)})
    return base64.urlsafe_b64encode(payload.encode("utf-8")).decode("utf-8")

def decode_cursor(cursor_str: str) -> tuple[int, str]:
    try:
        raw = base64.urlsafe_b64decode(cursor_str.encode("utf-8")).decode("utf-8")
        data = json.loads(raw)
        return int(data["s"]), str(data["i"])
    except Exception as e:
        logger.warning(f"Malformed cursor encountered: '{cursor_str}' ({e})")
        raise BadRequestError(
            "Malformed cursor string for keyset pagination. Ensure cursor is unmodified from previous response."
        )

@router.get("/cursor", response_model=CursorPaginatedResponse[MurtiOut], summary="High-throughput cursor-paginated product catalog feed")
def list_products_cursor(
    cursor: Optional[str] = Query(None, description="Opaque base64 keyset cursor"),
    limit: int = Query(24, ge=1, le=100, description="Items per page chunk"),
    deity: Optional[str] = Query(None, description="Filter by deity name"),
    group: Optional[str] = Query(None, description="Filter by section group"),
    category_id: Optional[str] = Query(None, description="Filter by category UUID"),
    search: Optional[str] = Query(None, description="Search term in title or description"),
    min_price: Optional[float] = Query(None, ge=0),
    max_price: Optional[float] = Query(None, ge=0),
    include_inactive: bool = Query(False)
):
    """
    Enterprise Keyset (Cursor-Based) Pagination Endpoint.
    Uses compound index on (sort_order, id) to eliminate O(N) database table scans.
    """
    if min_price is not None and max_price is not None and min_price > max_price:
        raise BadRequestError(f"min_price ({min_price}) cannot exceed max_price ({max_price})")

    cursor_sort, cursor_id = (None, None)
    if cursor:
        cursor_sort, cursor_id = decode_cursor(cursor)

    if is_supabase_connected():
        try:
            client = get_supabase()
            query = client.table("murtis").select("*, murti_variants(*, master_sizes(*))")

            if not include_inactive:
                query = query.eq("is_active", True)
            if deity:
                query = query.ilike("deity", f"%{deity}%")
            if group:
                query = query.eq("group_tag", group)
            if category_id:
                query = query.eq("category_id", category_id)
            if min_price is not None:
                query = query.gte("price", min_price)
            if max_price is not None:
                query = query.lte("price", max_price)
            if search:
                query = query.or_(f"title.ilike.%{search}%,material.ilike.%{search}%,description.ilike.%{search}%")

            # Apply keyset condition: seek where sort_order >= cursor_sort
            if cursor_sort is not None:
                query = query.gte("sort_order", cursor_sort)

            fetch_limit = limit + 1
            res = query.order("sort_order", desc=False).limit(fetch_limit).execute()
            raw_items = res.data or []

            if cursor_sort is not None and cursor_id is not None:
                filtered = []
                for it in raw_items:
                    s_val = it.get("sort_order", 0)
                    i_val = str(it.get("id", ""))
                    if s_val > cursor_sort or (s_val == cursor_sort and i_val > cursor_id):
                        filtered.append(it)
                raw_items = filtered

            if len(raw_items) > 0:
                has_next_page = len(raw_items) > limit
                page_items = raw_items[:limit]

                for item in page_items:
                    variants = item.pop("murti_variants", [])
                    item["variants"] = variants

                next_cursor = None
                if has_next_page and len(page_items) > 0:
                    last_item = page_items[-1]
                    next_cursor = encode_cursor(last_item.get("sort_order", 0), str(last_item.get("id", "")))

                return CursorPaginatedResponse(
                    success=True,
                    items=page_items,
                    page_info=CursorPageInfo(
                        next_cursor=next_cursor,
                        has_next_page=has_next_page,
                        count=len(page_items)
                    )
                )
        except Exception as e:
            logger.warning(f"[Supabase Warning: list_products_cursor failed ({e}). Falling back to local store]")

    # Local in-memory store cursor filtering
    items = list(local_store.murtis)
    if not include_inactive:
        items = [i for i in items if i.get("is_active", True)]
    if deity:
        items = [i for i in items if deity.lower() in i.get("deity", "").lower()]
    if group:
        items = [i for i in items if i.get("group_tag") == group]
    if category_id:
        items = [i for i in items if i.get("category_id") == category_id]
    if min_price is not None:
        items = [i for i in items if i.get("price", 0) >= min_price]
    if max_price is not None:
        items = [i for i in items if i.get("price", 0) <= max_price]
    if search:
        s = search.lower()
        items = [i for i in items if s in i.get("title", "").lower() or s in i.get("material", "").lower()]

    items.sort(key=lambda x: (x.get("sort_order", 0), str(x.get("id", ""))))

    if cursor_sort is not None and cursor_id is not None:
        items = [
            i for i in items
            if i.get("sort_order", 0) > cursor_sort
            or (i.get("sort_order", 0) == cursor_sort and str(i.get("id", "")) > cursor_id)
        ]

    has_next_page = len(items) > limit
    page_items = items[:limit]

    next_cursor = None
    if has_next_page and len(page_items) > 0:
        last_item = page_items[-1]
        next_cursor = encode_cursor(last_item.get("sort_order", 0), str(last_item.get("id", "")))

    return CursorPaginatedResponse(
        success=True,
        items=page_items,
        page_info=CursorPageInfo(
            next_cursor=next_cursor,
            has_next_page=has_next_page,
            count=len(page_items)
        )
    )


@router.get("", response_model=PaginatedResponse[MurtiOut], summary="List and filter murtis/products")
def list_products(
    deity: Optional[str] = Query(None, description="Filter by deity name (e.g. Ram, Shiva, Durga)"),
    group: Optional[str] = Query(None, description="Filter by section group ('most-loved', 'navratri', 'sacred', 'baal-roop')"),
    category_id: Optional[str] = Query(None, description="Filter by category UUID"),
    search: Optional[str] = Query(None, description="Search term in title, description, or material"),
    min_price: Optional[float] = Query(None, ge=0),
    max_price: Optional[float] = Query(None, ge=0),
    rating_mode: Optional[RatingDisplayMode] = Query(None, description="Filter by rating mode override"),
    include_inactive: bool = Query(False, description="Admin flag to include draft/inactive products"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100)
):
    """
    Req #2: Product listing with rich filtering (deity, group, price, active status, search).
    Req #3: Includes primary catalog image and catalog images JSONB array for each product.
    Req #5: Includes rating mode and static rating value.
    """
    if min_price is not None and max_price is not None and min_price > max_price:
        raise BadRequestError(f"min_price ({min_price}) cannot exceed max_price ({max_price})")

    if is_supabase_connected():
        try:
            client = get_supabase()
            query = client.table("murtis").select("*, murti_variants(*, master_sizes(*))")
            
            if not include_inactive:
                query = query.eq("is_active", True)
            if deity:
                query = query.ilike("deity", f"%{deity}%")
            if group:
                query = query.eq("group_tag", group)
            if category_id:
                query = query.eq("category_id", category_id)
            if rating_mode:
                mode_str = rating_mode.value if hasattr(rating_mode, 'value') else str(rating_mode)
                query = query.eq("rating_mode", mode_str)
            if min_price is not None:
                query = query.gte("price", min_price)
            if max_price is not None:
                query = query.lte("price", max_price)
            if search:
                query = query.or_(f"title.ilike.%{search}%,material.ilike.%{search}%,description.ilike.%{search}%")
                
            start_idx = (page - 1) * page_size
            end_idx = start_idx + page_size - 1
            res = query.order("sort_order", desc=False).range(start_idx, end_idx).execute()
            
            items = res.data or []
            if len(items) > 0:
                for item in items:
                    variants = item.pop("murti_variants", [])
                    item["variants"] = variants
                    
                return PaginatedResponse(
                    success=True,
                    items=items,
                    total=len(items),
                    page=page,
                    page_size=page_size
                )
        except Exception as e:
            logger.warning(f"[Supabase Warning: list_products failed ({e}). Falling back to local store]")

    items = local_store.murtis
    if not include_inactive:
        items = [i for i in items if i.get("is_active", True)]
    if deity:
        items = [i for i in items if deity.lower() in i.get("deity", "").lower()]
    if group:
        items = [i for i in items if i.get("group_tag") == group]
    if category_id:
        items = [i for i in items if i.get("category_id") == category_id]
    if rating_mode:
        items = [i for i in items if i.get("rating_mode") == rating_mode.value]
    if min_price is not None:
        items = [i for i in items if i.get("price", 0) >= min_price]
    if max_price is not None:
        items = [i for i in items if i.get("price", 0) <= max_price]
    if search:
        s = search.lower()
        items = [i for i in items if s in i.get("title", "").lower() or s in i.get("material", "").lower()]
        
    total = len(items)
    start_idx = (page - 1) * page_size
    end_idx = start_idx + page_size
    paged = items[start_idx:end_idx]
    
    return PaginatedResponse(
        success=True,
        items=paged,
        total=total,
        page=page,
        page_size=page_size
    )

@router.get("/{product_id_or_legacy}", response_model=MurtiOut, summary="Get single product by UUID or legacy ID")
def get_product(product_id_or_legacy: str):
    """
    Req #3: Returns product with primary catalog image and catalog images JSONB array.
    Req #7: Returns linked size variants.
    """
    if is_supabase_connected():
        try:
            client = get_supabase()
            query = client.table("murtis").select("*, murti_variants(*, master_sizes(*))")
            try:
                legacy_int = int(product_id_or_legacy)
                query = query.or_(f"id.eq.{product_id_or_legacy},legacy_id.eq.{legacy_int}")
            except ValueError:
                query = query.eq("id", product_id_or_legacy)
                
            res = query.execute()
            if res.data and len(res.data) > 0:
                item = res.data[0]
                variants = item.pop("murti_variants", [])
                item["variants"] = variants
                return item
        except Exception as e:
            logger.warning(f"[Supabase Warning: get_product failed ({e}). Falling back to local store]")
            
    for p in local_store.murtis:
        if str(p.get("id")) == product_id_or_legacy or str(p.get("legacy_id")) == product_id_or_legacy or str(p.get("slug")) == product_id_or_legacy:
            return p
    raise NotFoundError("Product", product_id_or_legacy)

@router.post("", response_model=ApiResponse[MurtiOut], status_code=status.HTTP_201_CREATED, summary="Add new product (Admin only)")
def create_product(payload: MurtiCreate, admin: dict = Depends(get_current_admin)):
    """
    Req #2: Add product.
    Req #3: Include dedicated catalog image section (primary_catalog_image + catalog_images JSONB).
    Req #5: Set rating mode ('enabled', 'read_only', 'hidden') & static rating override.
    """
    new_id = str(uuid.uuid4())
    now = datetime.datetime.now(datetime.timezone.utc)
    
    product_dict = payload.dict()
    variants_data = product_dict.pop("variants", []) or []
    
    product_dict["id"] = new_id
    product_dict["created_at"] = now.isoformat()
    product_dict["updated_at"] = now.isoformat()
    
    if not product_dict.get("slug"):
        import re
        slug_clean = re.sub(r'[^a-zA-Z0-9\s-]', '', product_dict["title"].lower())
        product_dict["slug"] = re.sub(r'[\s-]+', '-', slug_clean).strip('-')[:80] + f"-{new_id[:6]}"
        
    if is_supabase_connected():
        try:
            client = get_supabase()
            res = client.table("murtis").insert(product_dict).execute()
            if res.data and len(res.data) > 0:
                saved_prod = res.data[0]
                created_variants = []
                for v in variants_data:
                    v["id"] = str(uuid.uuid4())
                    v["murti_id"] = new_id
                    v_res = client.table("murti_variants").insert(v).execute()
                    if v_res.data:
                        created_variants.append(v_res.data[0])
                saved_prod["variants"] = created_variants
                return ApiResponse(success=True, message="Product created in Supabase", data=saved_prod)
        except Exception as e:
            logger.warning(f"[Supabase Warning: create_product failed ({e}). Saving to local in-memory store]")
            
    # Local store fallback
    created_variants = []
    for v in variants_data:
        v["id"] = str(uuid.uuid4())
        v["murti_id"] = new_id
        created_variants.append(v)
    product_dict["variants"] = created_variants
    local_store.murtis.insert(0, product_dict)
    local_store.save()
    
    return ApiResponse(success=True, message="Product created successfully", data=product_dict)

@router.put("/{product_id}", response_model=ApiResponse[MurtiOut], summary="Edit product & catalog image section (Admin only)")
def update_product(product_id: str, payload: MurtiUpdate, admin: dict = Depends(get_current_admin)):
    """
    Req #2: Edit product details, price, listing status.
    Req #3: In every product there is a catalog image section (primary_catalog_image + catalog_images JSONB).
    Req #5: On/off/static rating mode override & static rating value.
    """
    update_data = {k: v for k, v in payload.dict().items() if v is not None}
    update_data["updated_at"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
    clean_id = product_id.replace("legacy-", "")
    
    if is_supabase_connected():
        try:
            client = get_supabase()
            res = client.table("murtis").update(update_data).or_(f"id.eq.{product_id},id.eq.{clean_id},legacy_id.eq.{clean_id}").execute()
            if res.data and len(res.data) > 0:
                return ApiResponse(success=True, message="Product updated in Supabase", data=res.data[0])
        except Exception as e:
            logger.warning(f"[Supabase Warning: update_product failed for {product_id} ({e}). Updating local store]")
        
    for p in local_store.murtis:
        p_id = str(p.get("id", ""))
        p_legacy = str(p.get("legacy_id", ""))
        p_slug = str(p.get("slug", ""))
        if product_id in (p_id, p_legacy, f"legacy-{p_legacy}", p_slug) or clean_id in (p_id, p_legacy, p_slug):
            p.update(update_data)
            local_store.save()
            return ApiResponse(success=True, message="Product updated successfully", data=p)
            
    raise NotFoundError("Product", product_id)

@router.delete("/{product_id}", response_model=ApiResponse[bool], summary="Delete product (Admin only)")
def delete_product(product_id: str, admin: dict = Depends(get_current_admin)):
    """
    Req #2: Delete product.
    """
    clean_id = product_id.replace("legacy-", "")
    deleted = False

    if is_supabase_connected():
        try:
            client = get_supabase()
            res = client.table("murtis").delete().or_(f"id.eq.{product_id},id.eq.{clean_id},legacy_id.eq.{clean_id}").execute()
            if res.data and len(res.data) > 0:
                deleted = True
        except Exception as e:
            logger.warning(f"[Supabase Warning: delete_product failed ({e})]")
        
    orig_len = len(local_store.murtis)
    local_store.murtis = [
        p for p in local_store.murtis 
        if product_id not in (str(p.get("id", "")), str(p.get("legacy_id", "")), f"legacy-{p.get('legacy_id', '')}", str(p.get("slug", "")))
        and clean_id not in (str(p.get("id", "")), str(p.get("legacy_id", "")), str(p.get("slug", "")))
    ]
    if len(local_store.murtis) < orig_len:
        deleted = True
        local_store.save()

    if not deleted:
        raise NotFoundError("Product", product_id)

    return ApiResponse(success=True, message="Product deleted successfully", data=True)

# ============================================================================
# REQ #7: MURTI VARIANTS LINKED TO MASTER SIZES
# ============================================================================
@router.post("/{product_id}/variants", response_model=ApiResponse[MurtiVariantOut], status_code=status.HTTP_201_CREATED, summary="Add size variant to product (Admin only)")
def add_product_variant(product_id: str, payload: MurtiVariantCreate, admin: dict = Depends(get_current_admin)):
    """
    Req #7: Link product to a master size with custom price, discount price, and variant image.
    """
    new_id = str(uuid.uuid4())
    now = datetime.datetime.now(datetime.timezone.utc)
    clean_id = product_id.replace("legacy-", "")
    
    v_dict = payload.dict()
    v_dict["id"] = new_id
    v_dict["murti_id"] = product_id
    v_dict["created_at"] = now.isoformat()
    v_dict["updated_at"] = now.isoformat()
    
    if is_supabase_connected():
        try:
            client = get_supabase()
            res = client.table("murti_variants").insert(v_dict).execute()
            if res.data and len(res.data) > 0:
                return ApiResponse(success=True, message="Size variant added in Supabase", data=res.data[0])
        except Exception as e:
            logger.warning(f"[Supabase Warning: add_product_variant failed ({e})]")
            
    for p in local_store.murtis:
        p_id = str(p.get("id", ""))
        p_legacy = str(p.get("legacy_id", ""))
        if product_id in (p_id, p_legacy, f"legacy-{p_legacy}") or clean_id in (p_id, p_legacy):
            if "variants" not in p:
                p["variants"] = []
            p["variants"].append(v_dict)
            local_store.save()
            return ApiResponse(success=True, message="Size variant added successfully", data=v_dict)
            
    raise NotFoundError("Product", product_id)

@router.delete("/variants/{variant_id}", response_model=ApiResponse[bool], summary="Delete size variant (Admin only)")
def delete_product_variant(variant_id: str, admin: dict = Depends(get_current_admin)):
    """
    Req #7: Remove size variant from product.
    """
    deleted = False
    if is_supabase_connected():
        try:
            client = get_supabase()
            res = client.table("murti_variants").delete().eq("id", variant_id).execute()
            if res.data and len(res.data) > 0:
                deleted = True
        except Exception as e:
            logger.warning(f"[Supabase Warning: delete_product_variant failed ({e})]")
        
    for p in local_store.murtis:
        if "variants" in p:
            orig_len = len(p["variants"])
            p["variants"] = [v for v in p["variants"] if str(v.get("id")) != variant_id]
            if len(p["variants"]) < orig_len:
                deleted = True
                local_store.save()

    if not deleted:
        raise NotFoundError("MurtiVariant", variant_id)
            
    return ApiResponse(success=True, message="Variant deleted successfully", data=True)

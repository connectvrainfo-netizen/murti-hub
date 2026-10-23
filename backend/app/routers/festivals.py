import uuid
import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, status
from app.schemas.festivals import (
    FestivalSectionOut, FestivalSectionCreate, FestivalSectionUpdate,
    FestivalSectionItemCreate, FestivalSectionItemOut
)
from app.schemas.common import ApiResponse
from app.database import get_supabase, is_supabase_connected, local_store
from app.auth import get_current_admin
from app.logger import logger
from app.errors import NotFoundError

router = APIRouter(prefix="/api/festivals", tags=["Festival Section Management (Req #6)"])

@router.get("/active", response_model=Optional[FestivalSectionOut], summary="Get the currently active festival section for storefront")
def get_active_festival():
    """
    Req #6: Public endpoint for frontend to display active festive section.
    Returns title, subtitle, banner, badge, and linked products with override festival pricing!
    """
    if is_supabase_connected():
        try:
            client = get_supabase()
            res = client.table("festival_sections").select("*, festival_section_items(*, murtis(title, price, primary_catalog_image))").eq("is_active", True).order("sort_order", desc=False).limit(1).execute()
            if res.data and len(res.data) > 0:
                fest = res.data[0]
                raw_items = fest.pop("festival_section_items", [])
                items = []
                for item in raw_items:
                    murti_info = item.pop("murtis", {}) or {}
                    items.append({
                        "id": item.get("id"),
                        "festival_id": item.get("festival_id"),
                        "murti_id": item.get("murti_id"),
                        "festival_price": item.get("festival_price"),
                        "custom_tag": item.get("custom_tag"),
                        "sort_order": item.get("sort_order", 0),
                        "murti_title": murti_info.get("title"),
                        "murti_image": murti_info.get("primary_catalog_image"),
                        "original_price": murti_info.get("price"),
                        "created_at": item.get("created_at")
                    })
                fest["items"] = items
                return fest
        except Exception as e:
            logger.warning(f"[Supabase Warning: get_active_festival failed ({e}). Falling back to local store]")
        
    for f in local_store.festival_sections:
        if f.get("is_active", True):
            return f
    return None

@router.get("", response_model=List[FestivalSectionOut], summary="List all festival sections (Admin view)")
def list_all_festivals(admin: dict = Depends(get_current_admin)):
    """
    Req #6: Admin can list all festival campaigns (past, active, and upcoming).
    """
    if is_supabase_connected():
        try:
            client = get_supabase()
            res = client.table("festival_sections").select("*, festival_section_items(*, murtis(title, price, primary_catalog_image))").order("created_at", desc=True).execute()
            fests = res.data or []
            if len(fests) > 0:
                for fest in fests:
                    raw_items = fest.pop("festival_section_items", [])
                    fest["items"] = [
                        {
                            "id": item.get("id"),
                            "festival_id": item.get("festival_id"),
                            "murti_id": item.get("murti_id"),
                            "festival_price": item.get("festival_price"),
                            "custom_tag": item.get("custom_tag"),
                            "sort_order": item.get("sort_order", 0),
                            "murti_title": (item.get("murtis") or {}).get("title"),
                            "murti_image": (item.get("murtis") or {}).get("primary_catalog_image"),
                            "original_price": (item.get("murtis") or {}).get("price"),
                            "created_at": item.get("created_at")
                        }
                        for item in raw_items
                    ]
                return fests
        except Exception as e:
            logger.warning(f"[Supabase Warning: list_all_festivals failed ({e}). Falling back to local store]")
        
    return local_store.festival_sections

@router.post("", response_model=ApiResponse[FestivalSectionOut], status_code=status.HTTP_201_CREATED, summary="Create a new festival section (Admin only)")
def create_festival(payload: FestivalSectionCreate, admin: dict = Depends(get_current_admin)):
    """
    Req #6: Create a new festival section with title, subtitle, banner, badge, and dates.
    """
    new_id = str(uuid.uuid4())
    now = datetime.datetime.now(datetime.timezone.utc)
    
    fest_dict = payload.dict()
    items_data = fest_dict.pop("items", []) or []
    
    fest_dict["id"] = new_id
    fest_dict["created_at"] = now.isoformat()
    fest_dict["updated_at"] = now.isoformat()
    
    if is_supabase_connected():
        try:
            client = get_supabase()
            res = client.table("festival_sections").insert(fest_dict).execute()
            if res.data and len(res.data) > 0:
                saved_fest = res.data[0]
                saved_items = []
                for item in items_data:
                    item["id"] = str(uuid.uuid4())
                    item["festival_id"] = new_id
                    i_res = client.table("festival_section_items").insert(item).execute()
                    if i_res.data:
                        saved_items.append(i_res.data[0])
                saved_fest["items"] = saved_items
                return ApiResponse(success=True, message="Festival section created in Supabase", data=saved_fest)
        except Exception as e:
            logger.warning(f"[Supabase Warning: create_festival failed ({e}). Saving to local store]")
            
    fest_dict["items"] = items_data
    local_store.festival_sections.append(fest_dict)
    local_store.save()
    return ApiResponse(success=True, message="Festival section created successfully", data=fest_dict)

@router.put("/{festival_id}", response_model=ApiResponse[FestivalSectionOut], summary="Update festival section details & active state (Admin only)")
def update_festival(festival_id: str, payload: FestivalSectionUpdate, admin: dict = Depends(get_current_admin)):
    """
    Req #6: Change the festival section area from admin side (title, subtitle, banner, badge, is_active, dates).
    """
    update_data = {k: v for k, v in payload.dict().items() if v is not None}
    update_data["updated_at"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
    
    if is_supabase_connected():
        try:
            client = get_supabase()
            res = client.table("festival_sections").update(update_data).eq("id", festival_id).execute()
            if res.data and len(res.data) > 0:
                return ApiResponse(success=True, message="Festival section updated in Supabase", data=res.data[0])
        except Exception as e:
            logger.warning(f"[Supabase Warning: update_festival failed ({e}). Updating local store]")
        
    for f in local_store.festival_sections:
        if f["id"] == festival_id:
            f.update(update_data)
            local_store.save()
            return ApiResponse(success=True, message="Festival section updated successfully", data=f)
            
    raise NotFoundError("FestivalSection", festival_id)

@router.delete("/{festival_id}", response_model=ApiResponse[bool], summary="Delete festival section (Admin only)")
def delete_festival(festival_id: str, admin: dict = Depends(get_current_admin)):
    deleted = False
    if is_supabase_connected():
        try:
            client = get_supabase()
            res = client.table("festival_sections").delete().eq("id", festival_id).execute()
            if res.data and len(res.data) > 0:
                deleted = True
        except Exception as e:
            logger.warning(f"[Supabase Warning: delete_festival failed ({e})]")
            
    orig_len = len(local_store.festival_sections)
    local_store.festival_sections = [f for f in local_store.festival_sections if f["id"] != festival_id]
    if len(local_store.festival_sections) < orig_len:
        deleted = True
        local_store.save()

    if not deleted:
        raise NotFoundError("FestivalSection", festival_id)

    return ApiResponse(success=True, message="Festival section deleted successfully", data=True)

# ============================================================================
# REQ #6: LINKING PRODUCTS WITH OVERRIDE FESTIVAL PRICING & TAGS
# ============================================================================
@router.post("/{festival_id}/items", response_model=ApiResponse[FestivalSectionItemOut], status_code=status.HTTP_201_CREATED, summary="Link product to festival section with override price (Admin only)")
def link_product_to_festival(festival_id: str, payload: FestivalSectionItemCreate, admin: dict = Depends(get_current_admin)):
    """
    Req #6: Link a product to the festival section with custom override festival price and custom tag.
    """
    new_id = str(uuid.uuid4())
    now = datetime.datetime.now(datetime.timezone.utc)
    
    item_dict = payload.dict()
    item_dict["id"] = new_id
    item_dict["festival_id"] = festival_id
    item_dict["created_at"] = now.isoformat()
    
    # Fetch product info
    murti_title = None
    murti_img = None
    orig_price = None
    murti_found = False
    clean_murti_id = str(payload.murti_id).replace("legacy-", "")
    target_ids = {str(payload.murti_id), clean_murti_id, f"legacy-{clean_murti_id}"}

    for p in local_store.murtis:
        p_id = str(p.get("id", ""))
        p_legacy = str(p.get("legacy_id", ""))
        p_slug = str(p.get("slug", ""))
        if p_id in target_ids or p_legacy in target_ids or f"legacy-{p_legacy}" in target_ids or p_slug in target_ids:
            murti_title = p.get("title")
            murti_img = p.get("primary_catalog_image") or p.get("img") or "/images/products/ram-darbar.png"
            orig_price = p.get("price")
            murti_found = True
            item_dict["murti_id"] = p.get("id") or payload.murti_id
            break

    if not murti_found and is_supabase_connected():
        try:
            client = get_supabase()
            m_res = client.table("murtis").select("title, primary_catalog_image, price").or_(f"id.eq.{payload.murti_id},id.eq.{clean_murti_id}").execute()
            if m_res.data and len(m_res.data) > 0:
                murti_title = m_res.data[0].get("title")
                murti_img = m_res.data[0].get("primary_catalog_image") or "/images/products/ram-darbar.png"
                orig_price = m_res.data[0].get("price")
                murti_found = True
        except Exception as e:
            logger.warning(f"[Supabase] check murti failed: {e}")

    if not murti_found:
        raise NotFoundError("Product", payload.murti_id)
            
    item_dict["murti_title"] = murti_title
    item_dict["murti_image"] = murti_img or "/images/products/ram-darbar.png"
    item_dict["original_price"] = orig_price
    
    if is_supabase_connected():
        try:
            client = get_supabase()
            res = client.table("festival_section_items").insert({
                "id": new_id,
                "festival_id": festival_id,
                "murti_id": payload.murti_id,
                "festival_price": payload.festival_price,
                "custom_tag": payload.custom_tag,
                "sort_order": payload.sort_order
            }).execute()
            if res.data and len(res.data) > 0:
                return ApiResponse(success=True, message="Product linked to festival in Supabase", data=item_dict)
        except Exception as e:
            logger.warning(f"[Supabase] link festival item failed ({e}). Saving to local store")
            
    for f in local_store.festival_sections:
        if f["id"] == festival_id:
            if "items" not in f:
                f["items"] = []
            f["items"] = [i for i in f["items"] if i.get("murti_id") != payload.murti_id]
            f["items"].append(item_dict)
            local_store.save()
            return ApiResponse(success=True, message="Product linked to festival successfully", data=item_dict)
            
    raise NotFoundError("FestivalSection", festival_id)

@router.delete("/{festival_id}/items/{murti_id}", response_model=ApiResponse[bool], summary="Unlink product from festival (Admin only)")
def unlink_product_from_festival(festival_id: str, murti_id: str, admin: dict = Depends(get_current_admin)):
    """
    Req #6: Remove product from festival section.
    """
    clean_id = str(murti_id).replace("legacy-", "")
    target_ids = {str(murti_id), clean_id, f"legacy-{clean_id}"}
    deleted = False

    if is_supabase_connected():
        try:
            client = get_supabase()
            res = client.table("festival_section_items").delete().eq("festival_id", festival_id).or_(f"murti_id.eq.{murti_id},murti_id.eq.{clean_id}").execute()
            if res.data and len(res.data) > 0:
                deleted = True
        except Exception as e:
            logger.warning(f"[Supabase] unlink festival item failed: {e}")
        
    for f in local_store.festival_sections:
        if f["id"] == festival_id and "items" in f:
            orig_len = len(f["items"])
            f["items"] = [
                i for i in f["items"]
                if str(i.get("murti_id", "")) not in target_ids
                and str(i.get("id", "")) != murti_id
            ]
            if len(f["items"]) < orig_len:
                deleted = True
                local_store.save()
            return ApiResponse(success=True, message="Product unlinked successfully", data=True)
            
    return ApiResponse(success=True, message="Product unlinked successfully", data=True)

import uuid
import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, status
from app.schemas.categories import CategoryOut, CategoryCreate, CategoryUpdate
from app.schemas.common import ApiResponse
from app.database import get_supabase, is_supabase_connected, local_store
from app.auth import get_current_admin
from app.logger import logger
from app.errors import NotFoundError, BadRequestError

router = APIRouter(prefix="/api/categories", tags=["Category Management (Req #1: Category Images & Banners)"])

@router.get("", response_model=List[CategoryOut], summary="List all deity categories")
def list_categories(include_inactive: bool = False):
    """
    Returns deity categories with thumbnail images and hero banners (Req #1).
    """
    if is_supabase_connected():
        try:
            client = get_supabase()
            query = client.table("categories").select("*").order("sort_order", desc=False)
            if not include_inactive:
                query = query.eq("is_active", True)
            res = query.execute()
            if res.data and len(res.data) > 0:
                return res.data
        except Exception as e:
            logger.warning(f"[Supabase Warning: list_categories failed ({e}). Falling back to local store]")
        
    cats = local_store.categories
    if not include_inactive:
        cats = [c for c in cats if c.get("is_active", True)]
    return sorted(cats, key=lambda c: c.get("sort_order", 0))

@router.get("/{category_id_or_slug}", response_model=CategoryOut, summary="Get single category by ID or slug")
def get_category(category_id_or_slug: str):
    if is_supabase_connected():
        try:
            client = get_supabase()
            res = client.table("categories").select("*").or_(f"id.eq.{category_id_or_slug},slug.eq.{category_id_or_slug}").execute()
            if res.data and len(res.data) > 0:
                return res.data[0]
        except Exception as e:
            logger.warning(f"[Supabase Warning: get_category failed ({e}). Falling back to local store]")
        
    for c in local_store.categories:
        if c.get("id") == category_id_or_slug or c.get("slug") == category_id_or_slug:
            return c
    raise NotFoundError("Category", category_id_or_slug)

@router.post("", response_model=ApiResponse[CategoryOut], status_code=status.HTTP_201_CREATED, summary="Add category (Admin only)")
def create_category(payload: CategoryCreate, admin: dict = Depends(get_current_admin)):
    """
    Req #1: Add new category with icon image and banner image.
    """
    new_id = str(uuid.uuid4())
    now = datetime.datetime.now(datetime.timezone.utc)
    
    cat_dict = payload.dict()
    cat_dict["id"] = new_id
    cat_dict["created_at"] = now.isoformat()
    cat_dict["updated_at"] = now.isoformat()
    
    if is_supabase_connected():
        try:
            client = get_supabase()
            res = client.table("categories").insert(cat_dict).execute()
            if res.data and len(res.data) > 0:
                return ApiResponse(success=True, message="Category created in Supabase", data=res.data[0])
        except Exception as e:
            logger.warning(f"[Supabase Warning: create_category failed ({e}). Saving to local store]")
            
    local_store.categories.append(cat_dict)
    local_store.save()
    return ApiResponse(success=True, message="Category created successfully", data=cat_dict)

@router.put("/{category_id}", response_model=ApiResponse[CategoryOut], summary="Edit category images section & details (Admin only)")
def update_category(category_id: str, payload: CategoryUpdate, admin: dict = Depends(get_current_admin)):
    """
    Req #1: Edit category images section (icon img, banner_url, name, route, sort order, is_active).
    """
    update_data = {k: v for k, v in payload.dict().items() if v is not None}
    update_data["updated_at"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
    clean_id = category_id.replace("cat-", "")
    
    if is_supabase_connected():
        try:
            client = get_supabase()
            res = client.table("categories").update(update_data).or_(f"id.eq.{category_id},id.eq.{clean_id},slug.eq.{clean_id}").execute()
            if res.data and len(res.data) > 0:
                return ApiResponse(success=True, message="Category updated in Supabase", data=res.data[0])
        except Exception as e:
            logger.warning(f"[Supabase Warning: update_category failed ({e}). Updating local store]")
        
    for c in local_store.categories:
        if c.get("id") in (category_id, clean_id) or c.get("slug") in (category_id, clean_id):
            c.update(update_data)
            local_store.save()
            return ApiResponse(success=True, message="Category updated successfully", data=c)
            
    raise NotFoundError("Category", category_id)

@router.delete("/{category_id}", response_model=ApiResponse[bool], summary="Delete category (Admin only)")
def delete_category(category_id: str, admin: dict = Depends(get_current_admin)):
    clean_id = category_id.replace("cat-", "")
    deleted = False

    if is_supabase_connected():
        try:
            client = get_supabase()
            res = client.table("categories").delete().or_(f"id.eq.{category_id},id.eq.{clean_id},slug.eq.{clean_id}").execute()
            if res.data and len(res.data) > 0:
                deleted = True
        except Exception as e:
            logger.warning(f"[Supabase Warning: delete_category failed ({e})]")
        
    orig_len = len(local_store.categories)
    local_store.categories = [c for c in local_store.categories if c["id"] not in (category_id, clean_id) and c.get("slug") not in (category_id, clean_id)]
    if len(local_store.categories) < orig_len:
        deleted = True
        local_store.save()

    if not deleted:
        raise NotFoundError("Category", category_id)

    return ApiResponse(success=True, message="Category deleted successfully", data=True)

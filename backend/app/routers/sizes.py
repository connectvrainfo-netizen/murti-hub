import uuid
import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, status
from app.schemas.sizes import MasterSizeOut, MasterSizeCreate, MasterSizeUpdate
from app.schemas.common import ApiResponse
from app.database import get_supabase, is_supabase_connected, local_store
from app.auth import get_current_admin
from app.logger import logger
from app.errors import NotFoundError

router = APIRouter(prefix="/api/sizes", tags=["Master Sizes Management (Req #7)"])

@router.get("", response_model=List[MasterSizeOut], summary="List all active master sizes")
def list_sizes(include_inactive: bool = False):
    """
    Returns list of master sizes (e.g. '9 cm (Compact)', '15 cm (Home Mandir)', '24 cm (Grand Temple)', '1.5 Feet').
    """
    if is_supabase_connected():
        try:
            client = get_supabase()
            query = client.table("master_sizes").select("*").order("sort_order", desc=False)
            if not include_inactive:
                query = query.eq("is_active", True)
            res = query.execute()
            if res.data and len(res.data) > 0:
                return res.data
        except Exception as e:
            logger.warning(f"[Supabase Warning: list_sizes failed ({e}). Falling back to local store]")
        
    sizes = local_store.master_sizes
    if not include_inactive:
        sizes = [s for s in sizes if s.get("is_active", True)]
    return sorted(sizes, key=lambda s: s.get("sort_order", 0))

@router.post("", response_model=ApiResponse[MasterSizeOut], status_code=status.HTTP_201_CREATED, summary="Create a new master size tag (Admin only)")
def create_size(payload: MasterSizeCreate, admin: dict = Depends(get_current_admin)):
    """
    Req #7: Admin creates a reusable size tag (e.g., '1 Foot', '18 Inches', 'Mandal 5 Feet').
    """
    new_id = str(uuid.uuid4())
    now = datetime.datetime.now(datetime.timezone.utc)
    
    size_dict = payload.dict()
    size_dict["id"] = new_id
    size_dict["created_at"] = now.isoformat()
    size_dict["updated_at"] = now.isoformat()
    
    if is_supabase_connected():
        try:
            client = get_supabase()
            res = client.table("master_sizes").insert(size_dict).execute()
            if res.data and len(res.data) > 0:
                return ApiResponse(success=True, message="Master size created in Supabase", data=res.data[0])
        except Exception as e:
            logger.warning(f"[Supabase Warning: create_size failed ({e}). Saving to local store]")
            
    local_store.master_sizes.append(size_dict)
    local_store.save()
    return ApiResponse(success=True, message="Master size created successfully", data=size_dict)

@router.put("/{size_id}", response_model=ApiResponse[MasterSizeOut], summary="Update a master size (Admin only)")
def update_size(size_id: str, payload: MasterSizeUpdate, admin: dict = Depends(get_current_admin)):
    """
    Req #7: Edit size label, height in inches, sort order, active status.
    """
    update_data = {k: v for k, v in payload.dict().items() if v is not None}
    update_data["updated_at"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
    clean_id = size_id.replace("size-", "")
    
    if is_supabase_connected():
        try:
            client = get_supabase()
            res = client.table("master_sizes").update(update_data).or_(f"id.eq.{size_id},id.eq.{clean_id}").execute()
            if res.data and len(res.data) > 0:
                return ApiResponse(success=True, message="Master size updated in Supabase", data=res.data[0])
        except Exception as e:
            logger.warning(f"[Supabase Warning: update_size failed ({e}). Updating local store]")
        
    for s in local_store.master_sizes:
        s_id = str(s.get("id", ""))
        s_order = str(s.get("sort_order", ""))
        if size_id in (s_id, f"size-{s_order}") or clean_id in (s_id, s_order):
            s.update(update_data)
            local_store.save()
            return ApiResponse(success=True, message="Master size updated successfully", data=s)
            
    raise NotFoundError("MasterSize", size_id)

@router.delete("/{size_id}", response_model=ApiResponse[bool], summary="Delete a master size (Admin only)")
def delete_size(size_id: str, admin: dict = Depends(get_current_admin)):
    """
    Req #7: Delete a master size tag.
    """
    clean_id = size_id.replace("size-", "")
    deleted = False

    if is_supabase_connected():
        try:
            client = get_supabase()
            res = client.table("master_sizes").delete().or_(f"id.eq.{size_id},id.eq.{clean_id}").execute()
            if res.data and len(res.data) > 0:
                deleted = True
        except Exception as e:
            logger.warning(f"[Supabase Warning: delete_size failed ({e})]")
        
    orig_len = len(local_store.master_sizes)
    local_store.master_sizes = [
        s for s in local_store.master_sizes 
        if size_id not in (str(s.get("id", "")), f"size-{s.get('sort_order', '')}")
        and clean_id not in (str(s.get("id", "")), str(s.get("sort_order", "")))
    ]
    if len(local_store.master_sizes) < orig_len:
        deleted = True
        local_store.save()

    if not deleted:
        raise NotFoundError("MasterSize", size_id)

    return ApiResponse(success=True, message="Master size deleted successfully", data=True)

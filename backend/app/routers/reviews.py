import uuid
import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from app.schemas.reviews import ReviewOut, ReviewCreate, ReviewModerate, SellerReplySchema
from app.schemas.common import ApiResponse, RatingDisplayMode
from app.database import get_supabase, is_supabase_connected, local_store
from app.auth import get_current_admin
from app.logger import logger
from app.errors import NotFoundError, ForbiddenError

router = APIRouter(prefix="/api/reviews", tags=["Reviews & Ratings (Req #5: Rating Mode Enforcement)"])

@router.get("/product/{product_id}", response_model=List[ReviewOut], summary="Get approved reviews for a product (Respects rating_mode)")
def get_product_reviews(product_id: str):
    """
    Req #5: Respects both site_settings.global_rating_mode AND product.rating_mode:
    - If either is 'hidden', returns empty list (reviews turned off).
    - If 'read_only' or 'enabled', returns existing reviews.
    """
    # 1. Check Global Rating Mode
    global_mode = "enabled"
    if is_supabase_connected():
        try:
            client = get_supabase()
            s_res = client.table("site_settings").select("global_rating_mode").eq("id", 1).execute()
            if s_res.data and len(s_res.data) > 0:
                global_mode = s_res.data[0].get("global_rating_mode", "enabled")
        except Exception as e:
            logger.warning(f"[Supabase] site_settings query failed ({e}). Checking local store.")
            global_mode = local_store.site_settings.get("global_rating_mode", "enabled")
    else:
        global_mode = local_store.site_settings.get("global_rating_mode", "enabled")
        
    if global_mode == "hidden":
        return []
        
    # 2. Check Product Rating Mode
    prod_mode = "enabled"
    target_id = product_id
    if is_supabase_connected():
        try:
            client = get_supabase()
            p_res = client.table("murtis").select("id, rating_mode").or_(f"id.eq.{product_id},legacy_id.eq.{product_id}").execute()
            if p_res.data and len(p_res.data) > 0:
                target_id = p_res.data[0]["id"]
                prod_mode = p_res.data[0].get("rating_mode", "enabled")
        except Exception as e:
            logger.warning(f"[Supabase] product rating_mode lookup failed ({e})")
    else:
        for p in local_store.murtis:
            if str(p.get("id")) == product_id or str(p.get("legacy_id")) == product_id:
                target_id = str(p.get("id"))
                prod_mode = p.get("rating_mode", "enabled")
                break
                
    if prod_mode == "hidden":
        return []
        
    # 3. Fetch reviews
    if is_supabase_connected():
        try:
            client = get_supabase()
            r_res = client.table("reviews").select("*").eq("murti_id", target_id).eq("is_approved", True).order("created_at", desc=True).execute()
            if r_res.data and len(r_res.data) > 0:
                return r_res.data
        except Exception as e:
            logger.warning(f"[Supabase Warning: list_reviews failed ({e}). Falling back to local store]")
        
    return [r for r in local_store.reviews if (str(r.get("murti_id")) == target_id or str(r.get("murti_id")) == product_id) and r.get("is_approved", True)]

@router.post("/product/{product_id}", response_model=ApiResponse[ReviewOut], status_code=status.HTTP_201_CREATED, summary="Submit a sacred customer review (Enforces Rating Mode)")
def submit_review(product_id: str, payload: ReviewCreate):
    """
    Req #5: SUBMISSION CHECK:
    Users can ONLY submit reviews if BOTH global_rating_mode is 'enabled' AND product.rating_mode is 'enabled'.
    If either is 'read_only' or 'hidden', returns 403 Forbidden!
    """
    # 1. Verify Global Rating Mode
    global_mode = "enabled"
    if is_supabase_connected():
        try:
            client = get_supabase()
            s_res = client.table("site_settings").select("global_rating_mode").eq("id", 1).execute()
            if s_res.data and len(s_res.data) > 0:
                global_mode = s_res.data[0].get("global_rating_mode", "enabled")
        except Exception:
            global_mode = local_store.site_settings.get("global_rating_mode", "enabled")
    else:
        global_mode = local_store.site_settings.get("global_rating_mode", "enabled")
        
    if global_mode == "read_only":
        raise ForbiddenError(
            "Reviews are currently in Read-Only / Static mode. New review submissions are temporarily disabled."
        )
    if global_mode == "hidden":
        raise ForbiddenError(
            "Review submissions are currently disabled on this store."
        )
        
    # 2. Verify Product Rating Mode
    target_id = product_id
    prod_mode = "enabled"
    product_found = False

    if is_supabase_connected():
        try:
            client = get_supabase()
            p_res = client.table("murtis").select("id, rating_mode").or_(f"id.eq.{product_id},legacy_id.eq.{product_id}").execute()
            if p_res.data and len(p_res.data) > 0:
                target_id = p_res.data[0]["id"]
                prod_mode = p_res.data[0].get("rating_mode", "enabled")
                product_found = True
        except Exception as e:
            logger.warning(f"[Supabase] check product for review failed ({e})")
            
    if not product_found:
        for p in local_store.murtis:
            if str(p.get("id")) == product_id or str(p.get("legacy_id")) == product_id:
                target_id = str(p.get("id"))
                prod_mode = p.get("rating_mode", "enabled")
                product_found = True
                break

    if not product_found:
        raise NotFoundError("Product", product_id)
            
    if prod_mode == "read_only":
        raise ForbiddenError(
            "This product is currently in static / read-only rating mode. New reviews cannot be submitted."
        )
    if prod_mode == "hidden":
        raise ForbiddenError(
            "Reviews are disabled for this product."
        )
        
    # 3. Create Review
    new_id = str(uuid.uuid4())
    now = datetime.datetime.now(datetime.timezone.utc)
    
    review_dict = payload.dict()
    review_dict["id"] = new_id
    review_dict["murti_id"] = target_id
    review_dict["verified"] = True
    review_dict["helpful_count"] = 0
    review_dict["unhelpful_count"] = 0
    review_dict["is_approved"] = True
    review_dict["created_at"] = now.isoformat()
    
    if is_supabase_connected():
        try:
            client = get_supabase()
            res = client.table("reviews").insert(review_dict).execute()
            if res.data and len(res.data) > 0:
                return ApiResponse(success=True, message="Sacred review submitted and published in Supabase", data=res.data[0])
        except Exception as e:
            logger.warning(f"[Supabase Warning: submit_review failed ({e}). Saving to local store]")
            
    local_store.reviews.append(review_dict)
    local_store.save()
    return ApiResponse(success=True, message="Sacred review submitted and published successfully", data=review_dict)

# ============================================================================
# ADMIN REVIEW OPERATIONS & SELLER REPLIES
# ============================================================================
@router.get("/admin/all", response_model=List[ReviewOut], summary="List all reviews for admin moderation (Admin only)")
def list_all_reviews_for_admin(admin: dict = Depends(get_current_admin)):
    """
    Standard admin operation: Moderate all customer reviews across all products.
    """
    if is_supabase_connected():
        try:
            client = get_supabase()
            res = client.table("reviews").select("*").order("created_at", desc=True).execute()
            if res.data and len(res.data) > 0:
                return res.data
        except Exception as e:
            logger.warning(f"[Supabase Warning: list_all_reviews_for_admin failed ({e}). Falling back to local store]")
    return local_store.reviews

@router.put("/admin/{review_id}/moderate", response_model=ApiResponse[ReviewOut], summary="Moderate review approval or helpful count (Admin only)")
def moderate_review(review_id: str, payload: ReviewModerate, admin: dict = Depends(get_current_admin)):
    update_data = {k: v for k, v in payload.dict().items() if v is not None}
    
    if is_supabase_connected():
        try:
            client = get_supabase()
            res = client.table("reviews").update(update_data).eq("id", review_id).execute()
            if res.data and len(res.data) > 0:
                return ApiResponse(success=True, message="Review updated in Supabase", data=res.data[0])
        except Exception as e:
            logger.warning(f"[Supabase Warning: moderate_review failed ({e}). Updating local store]")
        
    for r in local_store.reviews:
        if r.get("id") == review_id:
            r.update(update_data)
            local_store.save()
            return ApiResponse(success=True, message="Review moderated successfully", data=r)
    raise NotFoundError("Review", review_id)

@router.post("/admin/{review_id}/reply", response_model=ApiResponse[ReviewOut], summary="Post seller response to review (Admin only)")
def reply_to_review(review_id: str, reply: SellerReplySchema, admin: dict = Depends(get_current_admin)):
    """
    Admin operation: Add official seller response ("Amol Murti Concierge").
    """
    reply_dict = reply.dict()
    if not reply_dict.get("date"):
        reply_dict["date"] = datetime.datetime.now().strftime("%d %b %Y")
        
    return moderate_review(review_id, ReviewModerate(seller_reply=reply), admin=admin)

@router.delete("/admin/{review_id}", response_model=ApiResponse[bool], summary="Delete review (Admin only)")
def delete_review(review_id: str, admin: dict = Depends(get_current_admin)):
    deleted = False
    if is_supabase_connected():
        try:
            client = get_supabase()
            res = client.table("reviews").delete().eq("id", review_id).execute()
            if res.data and len(res.data) > 0:
                deleted = True
        except Exception as e:
            logger.warning(f"[Supabase Warning: delete_review failed ({e})]")
        
    orig_len = len(local_store.reviews)
    local_store.reviews = [r for r in local_store.reviews if r["id"] != review_id]
    if len(local_store.reviews) < orig_len:
        deleted = True
        local_store.save()

    if not deleted:
        raise NotFoundError("Review", review_id)

    return ApiResponse(success=True, message="Review deleted successfully", data=True)

import datetime
from fastapi import APIRouter, Depends, status
from app.schemas.settings import SiteSettingsOut, SiteSettingsUpdate
from app.schemas.common import ApiResponse, RatingDisplayMode
from app.database import get_supabase, is_supabase_connected, local_store
from app.auth import get_current_admin
from app.logger import logger
from app.errors import BadRequestError

router = APIRouter(prefix="/api/settings", tags=["Site Settings & Global Admin Controls"])

@router.get("", response_model=SiteSettingsOut, summary="Get public site settings (WhatsApp, Rating mode)")
def get_site_settings():
    """
    Public endpoint. Returns site configuration including:
    - Current WhatsApp concierge number & message
    - Global rating display mode ('enabled', 'read_only', 'hidden')
    """
    if is_supabase_connected():
        try:
            client = get_supabase()
            res = client.table("site_settings").select("*").eq("id", 1).execute()
            if res.data and len(res.data) > 0:
                return res.data[0]
        except Exception as e:
            logger.warning(f"[Supabase Warning: get_site_settings failed ({e}). Falling back to local store]")
            
    return local_store.site_settings

@router.put("", response_model=ApiResponse[SiteSettingsOut], summary="Update site settings (Admin only)")
def update_site_settings(payload: SiteSettingsUpdate, admin: dict = Depends(get_current_admin)):
    """
    Admin operation:
    - Req #4: WhatsApp number change
    - Req #5: Global rating mode ('enabled', 'read_only', 'hidden')
    """
    update_data = {k: v for k, v in payload.dict().items() if v is not None}
    update_data["updated_at"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
    
    if is_supabase_connected():
        try:
            client = get_supabase()
            res = client.table("site_settings").update(update_data).eq("id", 1).execute()
            if res.data and len(res.data) > 0:
                return ApiResponse(success=True, message="Site settings updated successfully in Supabase", data=res.data[0])
        except Exception as e:
            logger.warning(f"[Supabase Warning: update_site_settings failed ({e}). Updating local in-memory store]")
            
    # Update local store
    for k, v in update_data.items():
        local_store.site_settings[k] = v
    local_store.save()
        
    return ApiResponse(
        success=True,
        message="Site settings updated successfully",
        data=local_store.site_settings
    )

@router.patch("/whatsapp", response_model=ApiResponse[SiteSettingsOut], summary="Quick update WhatsApp number & message (Admin only)")
def update_whatsapp_number(
    whatsapp_number: str,
    default_message: str = "Namaste! I want to inquire about a Murti on Murti Hub.",
    admin: dict = Depends(get_current_admin)
):
    """
    Req #4: WhatsApp number change by admin.
    """
    clean_number = whatsapp_number.strip().replace(" ", "")
    if len(clean_number) < 8:
        raise BadRequestError("Invalid WhatsApp phone number format. Must contain at least 8 digits.")
        
    return update_site_settings(
        SiteSettingsUpdate(whatsapp_number=clean_number, whatsapp_default_message=default_message),
        admin=admin
    )

@router.patch("/rating-mode", response_model=ApiResponse[SiteSettingsOut], summary="Quick toggle global rating mode (Admin only)")
def update_global_rating_mode(
    mode: RatingDisplayMode,
    admin: dict = Depends(get_current_admin)
):
    """
    Req #5: On/off/static rating section toggle from admin side.
    - 'enabled': Users can view AND submit new ratings
    - 'read_only': Static mode: Users can ONLY see existing ratings, cannot add new ones
    - 'hidden': Rating section is completely turned off on the frontend
    """
    return update_site_settings(
        SiteSettingsUpdate(global_rating_mode=mode),
        admin=admin
    )

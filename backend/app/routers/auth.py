import datetime
from fastapi import APIRouter, Depends, status
from app.schemas.auth import AdminLoginRequest, TokenResponse, AdminProfile
from app.schemas.common import ApiResponse
from app.auth import verify_password, create_access_token, get_current_admin
from app.config import settings
from app.database import get_supabase, is_supabase_connected
from app.logger import logger
from app.errors import UnauthorizedError

router = APIRouter(prefix="/api/auth", tags=["Admin Authentication"])

@router.post("/login", response_model=ApiResponse[TokenResponse], summary="Admin login")
def admin_login(payload: AdminLoginRequest):
    """
    Standard admin operation: Authenticate admin user and issue JWT bearer token.
    Default credentials (configurable via .env):
    - Email: admin@amolmurtibhandar.com
    - Password: admin123
    """
    email = payload.email.strip().lower()
    password = payload.password
    
    # 1. Try Supabase admin_users table if Supabase is connected
    admin_data = None
    if is_supabase_connected():
        try:
            client = get_supabase()
            res = client.table("admin_users").select("*").eq("email", email).eq("is_active", True).execute()
            if res.data and len(res.data) > 0:
                user_record = res.data[0]
                if verify_password(password, user_record.get("password_hash", "")):
                    admin_data = {
                        "id": user_record["id"],
                        "email": user_record["email"],
                        "full_name": user_record.get("full_name", "Admin"),
                        "role": user_record.get("role", "super_admin")
                    }
        except Exception as e:
            logger.warning(f"[Supabase] admin_users query failed: {e}")
                
    # 2. Check environment configured default admin if not found in table
    if not admin_data:
        if email == settings.ADMIN_EMAIL.lower() and password == settings.ADMIN_PASSWORD:
            admin_data = {
                "id": "66666666-6666-6666-6666-666666660001",
                "email": settings.ADMIN_EMAIL,
                "full_name": "Master Sculptor Admin",
                "role": "super_admin"
            }
            
    if not admin_data:
        logger.warning(f"Failed admin login attempt for email: '{email}'")
        raise UnauthorizedError("Invalid admin credentials. Please check email and password.")
        
    access_token = create_access_token(admin_data)
    logger.info(f"Admin logged in successfully: '{email}' ({admin_data.get('role')})")

    return ApiResponse(
        success=True,
        message="Admin authenticated successfully",
        data=TokenResponse(
            access_token=access_token,
            token_type="bearer",
            admin=admin_data
        )
    )

@router.get("/me", response_model=ApiResponse[AdminProfile], summary="Verify active admin session")
def get_me(admin: dict = Depends(get_current_admin)):
    return ApiResponse(
        success=True,
        message="Admin session active",
        data=AdminProfile(
            id=admin.get("id", "admin-1"),
            email=admin.get("email", settings.ADMIN_EMAIL),
            full_name=admin.get("full_name", "Admin"),
            role=admin.get("role", "super_admin"),
            is_active=True
        )
    )

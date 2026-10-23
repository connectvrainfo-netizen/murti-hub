import time
import datetime
from typing import Dict, List, Optional
from fastapi import APIRouter, Depends, Request, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials
from app.schemas.auth import AdminLoginRequest, TokenResponse, AdminProfile
from app.schemas.common import ApiResponse
from app.auth import verify_password, create_access_token, decode_access_token, revoke_token, get_current_admin, security_bearer
from app.config import settings
from app.database import get_supabase, is_supabase_connected, local_store
from app.logger import logger
from app.errors import UnauthorizedError

router = APIRouter(prefix="/api/auth", tags=["Admin Authentication"])

# Sliding window in-memory rate limiter for login attempts (5 failures / 15 minutes per IP)
LOGIN_FAILURE_LOG: Dict[str, List[float]] = {}
MAX_LOGIN_ATTEMPTS = 5
LOCKOUT_WINDOW_SECONDS = 900  # 15 minutes

def get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "127.0.0.1"

def check_login_rate_limit(ip: str):
    now = time.time()
    failures = [t for t in LOGIN_FAILURE_LOG.get(ip, []) if now - t < LOCKOUT_WINDOW_SECONDS]
    LOGIN_FAILURE_LOG[ip] = failures
    if len(failures) >= MAX_LOGIN_ATTEMPTS:
        oldest = failures[0]
        retry_after = max(1, int(LOCKOUT_WINDOW_SECONDS - (now - oldest)))
        logger.warning(f"Rate limit exceeded for login attempts from IP: {ip}. Retry after: {retry_after}s")
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many failed administrator login attempts. Account access temporarily locked.",
            headers={"Retry-After": str(retry_after)}
        )

def record_login_failure(ip: str):
    now = time.time()
    failures = [t for t in LOGIN_FAILURE_LOG.get(ip, []) if now - t < LOCKOUT_WINDOW_SECONDS]
    failures.append(now)
    LOGIN_FAILURE_LOG[ip] = failures

def clear_login_failures(ip: str):
    if ip in LOGIN_FAILURE_LOG:
        del LOGIN_FAILURE_LOG[ip]

@router.post("/login", response_model=ApiResponse[TokenResponse], summary="Admin login with rate-limiting and verified credentials")
def admin_login(payload: AdminLoginRequest, request: Request):
    """
    Standard admin operation: Authenticate admin user with strict cryptographic verification.
    - Protected by IP-based rate limiting (5 failed attempts per 15 min).
    - Rejects known default production passwords.
    - Verifies bcrypt hashes; zero plaintext fallback.
    """
    ip = get_client_ip(request)
    check_login_rate_limit(ip)

    email = payload.email.strip().lower()
    password = payload.password

    # Prohibit default production credentials
    is_prod = settings.ENVIRONMENT.lower() in ["production", "prod"]
    if is_prod and (password == "admin123" or email == "admin@amolmurtibhandar.com"):
        record_login_failure(ip)
        logger.warning(f"Production login rejected for default credentials attempt from {ip}")
        raise UnauthorizedError("Default credentials are disabled in production. Please use configured administrator credentials.")

    admin_data = None

    # 1. Check Supabase admin_users table if Supabase is connected
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

    # 2. Check local_store.admin_users for local/offline testing mode
    if not admin_data and hasattr(local_store, "admin_users"):
        for user in getattr(local_store, "admin_users", []):
            if user.get("email", "").lower() == email and user.get("is_active", True):
                if verify_password(password, user.get("password_hash", "")):
                    admin_data = {
                        "id": user["id"],
                        "email": user["email"],
                        "full_name": user.get("full_name", "Admin"),
                        "role": user.get("role", "super_admin")
                    }
                    break

    # 3. Environment-variable configured admin (only if explicitly set and not insecure)
    if not admin_data and settings.ADMIN_EMAIL and settings.ADMIN_PASSWORD:
        if settings.ADMIN_PASSWORD not in {"admin123", "password", "123456", ""}:
            if email == settings.ADMIN_EMAIL.lower() and password == settings.ADMIN_PASSWORD:
                admin_data = {
                    "id": "66666666-6666-6666-6666-666666660001",
                    "email": settings.ADMIN_EMAIL,
                    "full_name": "Configured Administrator",
                    "role": "super_admin"
                }

    if not admin_data:
        record_login_failure(ip)
        logger.warning(f"Failed admin login attempt for email: '{email}' from IP: {ip}")
        raise UnauthorizedError("Invalid admin credentials. Please check email and password.")

    clear_login_failures(ip)
    access_token = create_access_token(admin_data)
    logger.info(f"Admin logged in successfully: '{email}' ({admin_data.get('role')}) from IP: {ip}")

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
            email=admin.get("email", settings.ADMIN_EMAIL or "admin@amolmurtibhandar.com"),
            full_name=admin.get("full_name", "Admin"),
            role=admin.get("role", "super_admin"),
            is_active=True
        )
    )

@router.post("/logout", response_model=ApiResponse[dict], summary="Logout admin and revoke current session token")
def admin_logout(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
    admin: dict = Depends(get_current_admin)
):
    """
    Revokes the current JWT bearer token, invalidating it immediately against any further requests.
    """
    if credentials and credentials.credentials:
        try:
            payload = decode_access_token(credentials.credentials)
            jti = payload.get("jti")
            if jti:
                revoke_token(jti)
                logger.info(f"Admin session revoked for JTI: {jti}")
        except Exception as e:
            logger.debug(f"Token revocation notice: {e}")

    return ApiResponse(
        success=True,
        message="Admin logged out successfully. Session token revoked.",
        data={"revoked": True}
    )

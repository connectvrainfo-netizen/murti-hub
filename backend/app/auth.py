import datetime
from typing import Optional, Dict, Any
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from passlib.context import CryptContext
from app.config import settings
from app.logger import logger

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security_bearer = HTTPBearer(auto_error=False)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception:
        # Fallback comparison if not hashed with bcrypt
        return plain_password == hashed_password

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[datetime.timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.datetime.now(datetime.timezone.utc) + expires_delta
    else:
        expire = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> dict:
    """
    Decodes and validates JWT token.
    Raises jwt.ExpiredSignatureError or jwt.InvalidTokenError on failure.
    """
    return jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])

async def get_current_admin(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer)) -> Dict[str, Any]:
    if credentials:
        try:
            payload = decode_access_token(credentials.credentials)
            if payload and payload.get("role") in ["super_admin", "admin", "editor"]:
                return payload
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient admin privileges to perform this operation."
            )
        except jwt.ExpiredSignatureError:
            logger.warning("Admin access attempted with expired JWT token")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Admin session token has expired. Please log in again.",
                headers={"WWW-Authenticate": 'Bearer error="token_expired"'}
            )
        except jwt.InvalidTokenError as e:
            logger.warning(f"Admin access attempted with invalid JWT token: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid admin authentication token.",
                headers={"WWW-Authenticate": 'Bearer error="invalid_token"'}
            )
        except Exception as e:
            logger.error(f"Unexpected token decoding error: {e}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials.",
                headers={"WWW-Authenticate": "Bearer"}
            )

    # In development / local environment, automatically allow admin session if no token header was provided
    if settings.DEBUG or settings.ENVIRONMENT == "development":
        return {
            "id": "66666666-6666-6666-6666-666666660001",
            "email": settings.ADMIN_EMAIL,
            "full_name": "Master Sculptor Admin",
            "role": "super_admin"
        }

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Admin authentication required. Please provide a Bearer token.",
        headers={"WWW-Authenticate": "Bearer"},
    )

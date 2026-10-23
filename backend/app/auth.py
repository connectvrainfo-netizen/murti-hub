import datetime
import uuid
from typing import Optional, Dict, Any, Set
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from passlib.context import CryptContext
from app.config import settings
from app.logger import logger

import bcrypt

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security_bearer = HTTPBearer(auto_error=False)

# In-memory revocation cache for invalidated tokens (supports session invalidation and logout)
REVOKED_TOKEN_JTIS: Set[str] = set()

def revoke_token(jti: str) -> None:
    if jti:
        REVOKED_TOKEN_JTIS.add(jti)

def is_token_revoked(jti: str) -> bool:
    return bool(jti and jti in REVOKED_TOKEN_JTIS)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    if not plain_password or not hashed_password:
        return False
    try:
        pw_bytes = plain_password.encode("utf-8")[:72]
        hash_bytes = hashed_password.encode("utf-8")
        return bcrypt.checkpw(pw_bytes, hash_bytes)
    except Exception:
        try:
            return pwd_context.verify(plain_password[:72], hashed_password)
        except Exception as e:
            logger.warning(f"Password hash verification failed: {e}")
            return False

def get_password_hash(password: str) -> str:
    pw_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(pw_bytes, salt).decode("utf-8")

def create_access_token(data: dict, expires_delta: Optional[datetime.timedelta] = None) -> str:
    to_encode = data.copy()
    now = datetime.datetime.now(datetime.timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + datetime.timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    jti = str(uuid.uuid4())
    to_encode.update({
        "exp": expire,
        "iat": now,
        "nbf": now,
        "jti": jti,
        "sub": str(data.get("email") or data.get("id") or "admin")
    })
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> dict:
    """
    Decodes and validates JWT token with claim verification.
    Raises jwt.ExpiredSignatureError or jwt.InvalidTokenError on failure.
    """
    payload = jwt.decode(
        token,
        settings.JWT_SECRET,
        algorithms=[settings.JWT_ALGORITHM],
        options={"require": ["exp", "role"]}
    )
    jti = payload.get("jti")
    if is_token_revoked(jti):
        raise jwt.InvalidTokenError("Token has been revoked.")
    return payload

async def get_current_admin(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer)) -> Dict[str, Any]:
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Admin authentication required. Please provide a Bearer token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        payload = decode_access_token(credentials.credentials)
        role = payload.get("role")
        if role in ["super_admin", "admin", "editor"]:
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
            detail=f"Invalid admin authentication token: {e}",
            headers={"WWW-Authenticate": 'Bearer error="invalid_token"'}
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected token decoding error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials.",
            headers={"WWW-Authenticate": "Bearer"}
        )

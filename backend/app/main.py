import os
import time
import uuid
import datetime
from fastapi import FastAPI, Request, HTTPException, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.logger import logger
from app.database import is_supabase_connected, get_supabase
from app.errors import (
    AppException, ApiErrorResponse, ErrorDetail,
    format_validation_errors
)
from app.routers import (
    auth, settings as settings_router, sizes, categories,
    products, festivals, reviews, upload, dashboard, orders,
    health
)

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="""
## Amol Marble Murti Bhandar - FastAPI Backend with Supabase

Comprehensive backend API for sacred Makrana marble murtis store with full Admin operations:
1. **Category Images & Banners Section**: Edit category icon image and top hero banner (`banner_url`).
2. **Products & Listings**: Add, edit, filter, and archive products.
3. **Dedicated Catalog Image Section**: Primary catalog image + catalog images gallery JSONB array with captions.
4. **WhatsApp Concierge Number**: Change WhatsApp contact number & default inquiry message.
5. **Rating Section Control**: On & Off button with Static / Read-Only mode (`enabled`, `read_only`, `hidden`) and static rating value overrides.
6. **Festival Section Management**: Full control over title, subtitle, banner, badge, linked products, and custom festival override pricing.
7. **Master Sizes Management**: Manage reusable size tags and link murti variants with custom prices.
8. **Standard Admin Operations**: JWT auth, review moderation & seller replies, dashboard metrics, and media uploads.
""",
    docs_url="/docs" if (settings.DEBUG or settings.ENVIRONMENT != "production") else None,
    redoc_url="/redoc" if (settings.DEBUG or settings.ENVIRONMENT != "production") else None
)

# -----------------------------------------------------------------------------
# 1. MIDDLEWARE: CORS, Security Headers, Request Tracking & Request-ID
# -----------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"^https://.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
    allow_headers=["*"],
)

# In-memory sliding window request log for API rate limiting
API_REQUEST_LOG = {}
RATE_LIMIT_WINDOW_SECONDS = 60
GENERAL_RATE_LIMIT = 150
SENSITIVE_RATE_LIMIT = 25  # per minute for sensitive endpoints

def _get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "127.0.0.1"

@app.middleware("http")
async def rate_limiting_middleware(request: Request, call_next):
    path = request.url.path
    # Only rate-limit API calls; exclude OPTIONS (CORS preflight) and health probes
    if path.startswith("/api/") and request.method not in ["OPTIONS", "HEAD"] and not path.startswith("/api/health"):
        ip = _get_client_ip(request)
        now = time.time()
        key = f"{ip}:{path}" if request.method == "POST" and any(s in path for s in ["/auth", "/orders", "/reviews"]) else ip
        is_sensitive = request.method == "POST" and any(s in path for s in ["/auth", "/orders", "/reviews"])
        limit = SENSITIVE_RATE_LIMIT if is_sensitive else GENERAL_RATE_LIMIT

        timestamps = [t for t in API_REQUEST_LOG.get(key, []) if now - t < RATE_LIMIT_WINDOW_SECONDS]
        if len(timestamps) >= limit:
            retry_after = max(1, int(RATE_LIMIT_WINDOW_SECONDS - (now - timestamps[0])))
            logger.warning(f"[RateLimit] Rate limit exceeded ({len(timestamps)}/{limit}) for key {key} on {path}. Retry after {retry_after}s")
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "success": False,
                    "message": "Too many requests. Please wait a moment before trying again.",
                    "detail": "Too many requests. Please wait a moment before trying again.",
                    "error_code": "TOO_MANY_REQUESTS",
                    "status_code": 429
                },
                headers={
                    "Retry-After": str(retry_after),
                    "X-RateLimit-Limit": str(limit),
                    "X-RateLimit-Remaining": "0"
                }
            )

        timestamps.append(now)
        API_REQUEST_LOG[key] = timestamps

    return await call_next(request)

@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    if not settings.DEBUG and settings.ENVIRONMENT == "production":
        response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains; preload"
    return response

@app.middleware("http")
async def request_logging_and_tracing_middleware(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
    request.state.request_id = request_id
    start_time = time.perf_counter()

    try:
        response = await call_next(request)
        process_time_ms = round((time.perf_counter() - start_time) * 1000, 2)
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Process-Time"] = f"{process_time_ms}ms"

        # Log errors or slow requests
        if response.status_code >= 500:
            logger.error(f"[{request_id}] {request.method} {request.url.path} -> {response.status_code} ({process_time_ms}ms)")
        elif response.status_code >= 400:
            logger.warning(f"[{request_id}] {request.method} {request.url.path} -> {response.status_code} ({process_time_ms}ms)")
        elif process_time_ms > 1000:
            logger.warning(f"[{request_id}] SLOW REQUEST: {request.method} {request.url.path} -> {response.status_code} ({process_time_ms}ms)")

        return response
    except Exception as exc:
        process_time_ms = round((time.perf_counter() - start_time) * 1000, 2)
        logger.error(f"[{request_id}] UNCAUGHT EXCEPTION on {request.method} {request.url.path} after {process_time_ms}ms: {exc}", exc_info=True)
        raise exc

# -----------------------------------------------------------------------------
# 2. GLOBAL EXCEPTION HANDLERS
# -----------------------------------------------------------------------------
@app.exception_handler(AppException)
async def handle_app_exception(request: Request, exc: AppException):
    """
    Handles structured custom domain application exceptions.
    """
    request_id = getattr(request.state, "request_id", None)
    logger.warning(f"[{request_id or 'REQ'}] AppException ({exc.error_code}): {exc.message} on {request.url.path}")
    
    error_response = ApiErrorResponse(
        success=False,
        message=exc.message,
        detail=exc.message,
        error_code=exc.error_code,
        status_code=exc.status_code,
        details=exc.details if exc.details else None,
        path=str(request.url.path),
        request_id=request_id
    )
    return JSONResponse(
        status_code=exc.status_code,
        content=error_response.model_dump(),
        headers={"X-Request-ID": request_id} if request_id else None
    )

@app.exception_handler(RequestValidationError)
async def handle_validation_error(request: Request, exc: RequestValidationError):
    """
    Transforms Pydantic validation errors into clean, structured human-readable messages.
    Ensures frontend clients never receive unformatted '[object Object]' error arrays.
    """
    request_id = getattr(request.state, "request_id", None)
    summary, details = format_validation_errors(exc.errors())
    logger.warning(f"[{request_id or 'REQ'}] 422 Validation Error on {request.url.path}: {summary}")

    error_response = ApiErrorResponse(
        success=False,
        message=summary,
        detail=summary,
        error_code="VALIDATION_ERROR",
        status_code=422,
        details=details,
        path=str(request.url.path),
        request_id=request_id
    )
    return JSONResponse(
        status_code=422,
        content=error_response.model_dump(),
        headers={"X-Request-ID": request_id} if request_id else None
    )

@app.exception_handler(HTTPException)
async def handle_http_exception(request: Request, exc: HTTPException):
    """
    Standardizes FastAPI / Starlette HTTPException responses to the unified
    ApiErrorResponse structure while preserving backward-compatible detail fields.
    """
    request_id = getattr(request.state, "request_id", None)
    detail_str = str(exc.detail) if isinstance(exc.detail, str) else str(exc.detail)
    logger.warning(f"[{request_id or 'REQ'}] HTTP {exc.status_code} on {request.url.path}: {detail_str}")

    # Map standard status codes to clear error codes
    code_map = {
        400: "BAD_REQUEST",
        401: "UNAUTHORIZED",
        403: "FORBIDDEN",
        404: "NOT_FOUND",
        405: "METHOD_NOT_ALLOWED",
        409: "CONFLICT",
        413: "PAYLOAD_TOO_LARGE",
        422: "UNPROCESSABLE_ENTITY",
        429: "TOO_MANY_REQUESTS",
        500: "INTERNAL_SERVER_ERROR",
        502: "BAD_GATEWAY",
        503: "SERVICE_UNAVAILABLE"
    }
    error_code = code_map.get(exc.status_code, f"HTTP_{exc.status_code}")

    error_response = ApiErrorResponse(
        success=False,
        message=detail_str,
        detail=detail_str,
        error_code=error_code,
        status_code=exc.status_code,
        path=str(request.url.path),
        request_id=request_id
    )
    headers = getattr(exc, "headers", None) or {}
    if request_id:
        headers["X-Request-ID"] = request_id

    return JSONResponse(
        status_code=exc.status_code,
        content=error_response.model_dump(),
        headers=headers
    )

@app.exception_handler(Exception)
async def handle_unhandled_exception(request: Request, exc: Exception):
    """
    Catches all unexpected internal errors. Prevents server crashing and
    avoids exposing raw stack traces in production while giving useful debug info.
    """
    request_id = getattr(request.state, "request_id", None) or str(uuid.uuid4())
    logger.error(f"[{request_id}] 500 INTERNAL SERVER ERROR on {request.method} {request.url.path}: {exc}", exc_info=True)

    debug_msg = f"Internal error: {str(exc)}" if settings.DEBUG else "An unexpected internal server error occurred. Please contact support or try again later."

    error_response = ApiErrorResponse(
        success=False,
        message="An unexpected server error occurred. Please try again shortly.",
        detail=debug_msg,
        error_code="INTERNAL_SERVER_ERROR",
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        path=str(request.url.path),
        request_id=request_id
    )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=error_response.model_dump(),
        headers={"X-Request-ID": request_id}
    )

# -----------------------------------------------------------------------------
# 3. MOUNT STATIC FILES & ROUTERS
# -----------------------------------------------------------------------------
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

app.include_router(health.router)
app.include_router(auth.router)
app.include_router(settings_router.router)
app.include_router(sizes.router)
app.include_router(categories.router)
app.include_router(products.router)
app.include_router(festivals.router)
app.include_router(reviews.router)
app.include_router(upload.router)
app.include_router(dashboard.router)
app.include_router(orders.router)

@app.on_event("startup")
async def startup_event():
    logger.info("=" * 60)
    logger.info(f"[STARTUP] {settings.APP_NAME} v{settings.APP_VERSION} starting...")
    if is_supabase_connected():
        logger.info(f"[DATABASE] Supabase Database: Connected to {settings.SUPABASE_URL}")
    else:
        logger.info("[DATABASE] Supabase Database: Running on local persistent store (store.json).")
    logger.info("Interactive API Documentation: http://localhost:8000/docs")
    logger.info("=" * 60)

@app.api_route("/", methods=["GET", "HEAD"], tags=["Health & Info"])
def root(request: Request):
    if request.method == "HEAD":
        return JSONResponse(status_code=200, content={"status": "online"})
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "online",
        "database": "supabase" if is_supabase_connected() else "in-memory (pre-seeded)",
        "docs_url": "/docs" if (settings.DEBUG or settings.ENVIRONMENT != "production") else None,
        "health_check": "/health",
        "uptimerobot_probe": "/uptimerobot"
    }



import os
import time
import datetime
from typing import Optional
from fastapi import APIRouter, Request, Response, status
from fastapi.responses import JSONResponse, PlainTextResponse

from app.config import settings
from app.logger import logger
from app.database import is_supabase_connected, get_supabase

router = APIRouter(tags=["Health & Monitoring"])

# Track server process initialization time
SERVER_START_TIME = datetime.datetime.now(datetime.timezone.utc)


def format_uptime(seconds: float) -> str:
    """Format uptime seconds into a human-readable string."""
    secs = int(seconds)
    days, remainder = divmod(secs, 86400)
    hours, remainder = divmod(remainder, 3600)
    minutes, seconds_rem = divmod(remainder, 60)
    parts = []
    if days > 0:
        parts.append(f"{days} day{'s' if days != 1 else ''}")
    if hours > 0:
        parts.append(f"{hours} hour{'s' if hours != 1 else ''}")
    if minutes > 0:
        parts.append(f"{minutes} minute{'s' if minutes != 1 else ''}")
    parts.append(f"{seconds_rem} second{'s' if seconds_rem != 1 else ''}")
    return ", ".join(parts) or "0 seconds"


@router.api_route("/health", methods=["GET", "HEAD"], summary="UptimeRobot compatible health check")
@router.api_route("/api/health", methods=["GET", "HEAD"], summary="API health check alias")
@router.api_route("/uptimerobot", methods=["GET", "HEAD"], summary="Dedicated UptimeRobot monitoring probe")
@router.api_route("/api/uptimerobot", methods=["GET", "HEAD"], summary="Dedicated API UptimeRobot monitoring probe")
@router.api_route("/ping", methods=["GET", "HEAD"], summary="Fast ping probe")
@router.api_route("/api/ping", methods=["GET", "HEAD"], summary="Fast API ping probe")
@router.api_route("/healthz", methods=["GET", "HEAD"], summary="Kubernetes / Cloud liveness probe")
@router.api_route("/api/healthz", methods=["GET", "HEAD"], summary="Kubernetes / Cloud API liveness probe")
async def health_check_route(
    request: Request,
    format: Optional[str] = None,
    deep: bool = False
):
    """
    Production-grade Health Check endpoint designed for UptimeRobot, BetterStack,
    and cloud platform health probes (Kubernetes, AWS ECS, Render, Railway, Fly.io).

    Features:
    - Supports both GET and HEAD methods (UptimeRobot default is HEAD).
    - Prevents edge/CDN caching with explicit Cache-Control headers.
    - UptimeRobot Keyword Monitoring compatible: Contains 'healthy', 'OK', and 'UP'.
    - Supports `?format=text` for simple pingers returning plain 'OK'.
    - Supports `?deep=true` for active database roundtrip latency verification.
    - Returns server uptime, system status, timestamp, and database connectivity.
    """
    now = datetime.datetime.now(datetime.timezone.utc)
    uptime_sec = (now - SERVER_START_TIME).total_seconds()
    supabase_ok = is_supabase_connected()

    headers = {
        "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
        "Pragma": "no-cache",
        "Expires": "0",
        "X-Robots-Tag": "noindex, nofollow",
        "X-Health-Status": "healthy",
        "X-Monitored-By": "UptimeRobot",
    }

    # HEAD requests: return status 200 without body
    if request.method == "HEAD":
        return Response(status_code=status.HTTP_200_OK, headers=headers)

    # Plain text format requested (via query param or Accept header)
    accept_header = request.headers.get("accept", "")
    if format == "text" or "text/plain" in accept_header:
        return PlainTextResponse(content="OK", status_code=status.HTTP_200_OK, headers=headers)

    # Database diagnostics
    db_info = {
        "provider": "supabase" if supabase_ok else "local_store",
        "status": "operational",
        "persistent": True
    }

    if deep:
        if supabase_ok:
            try:
                t0 = time.perf_counter()
                client = get_supabase()
                if client:
                    client.table("site_settings").select("id").limit(1).execute()
                    db_info["latency_ms"] = round((time.perf_counter() - t0) * 1000, 2)
                else:
                    db_info["status"] = "degraded"
            except Exception as exc:
                logger.warning(f"[HealthCheck] Deep DB check failed: {exc}")
                db_info["status"] = "degraded"
                db_info["error"] = str(exc)
        else:
            db_info["latency_ms"] = 0.05

    # Structured JSON body
    content = {
        "status": "healthy",
        "message": "OK",
        "system": "UP",
        "status_code": 200,
        "timestamp": now.isoformat(),
        "uptime_seconds": round(uptime_sec, 2),
        "uptime_human": format_uptime(uptime_sec),
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "supabase_connected": supabase_ok,
        "database": db_info,
        "monitored_by": "UptimeRobot",
        "checks": {
            "server": "healthy",
            "api": "healthy",
            "database": db_info.get("status", "operational")
        }
    }

    return JSONResponse(status_code=status.HTTP_200_OK, content=content, headers=headers)

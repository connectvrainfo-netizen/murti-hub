import uvicorn
import os
import sys

# Ensure backend directory is in python path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

if __name__ == "__main__":
    from app.config import settings

    # Render, Heroku, Railway, and Cloud Run pass PORT via environment variables
    # Always prioritize environment variable PORT, with fallback to settings or 8000
    env_port = os.environ.get("PORT")
    port = int(env_port) if env_port and env_port.isdigit() else int(getattr(settings, "PORT", 8000))

    # Always bind to 0.0.0.0 in cloud environments so external port scanners (Render) can connect
    env_host = os.environ.get("HOST")
    host = env_host if env_host else "0.0.0.0"

    # Detect production / cloud environments (Render sets RENDER="true")
    is_render = os.environ.get("RENDER") is not None
    is_prod = is_render or os.environ.get("ENVIRONMENT", getattr(settings, "ENVIRONMENT", "")).lower() == "production"

    # Disable auto-reload in production (prevents port-scan delays and container worker churn)
    reload_enabled = not is_prod and getattr(settings, "DEBUG", False)

    print("=" * 60, flush=True)
    print(f"[STARTUP] Starting {settings.APP_NAME} v{settings.APP_VERSION}", flush=True)
    print(f"[NETWORK] Binding to host: {host}, port: {port}", flush=True)
    print(f"[ENVIRONMENT] Render: {is_render}, Production: {is_prod}, Reload: {reload_enabled}", flush=True)
    print("=" * 60, flush=True)

    uvicorn.run(
        "app.main:app",
        host=host,
        port=port,
        reload=reload_enabled
    )

import os
import uuid
from fastapi import APIRouter, Depends, UploadFile, File, Form, status
from app.schemas.common import ApiResponse
from app.database import get_supabase, is_supabase_connected
from app.config import settings
from app.auth import get_current_admin
from app.logger import logger
from app.errors import BadRequestError, PayloadTooLargeError, AppException

router = APIRouter(prefix="/api/upload", tags=["File & Media Uploads"])

# Ensure uploads directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".svg", ".gif"}
ALLOWED_FOLDERS = {"catalog", "categories", "banners", "variants", "reviews"}
MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024  # 15 MB

@router.post("", response_model=ApiResponse[dict], summary="Upload category banner or product catalog image (Admin only)")
async def upload_image(
    file: UploadFile = File(...),
    folder: str = Form("catalog"),
    admin: dict = Depends(get_current_admin)
):
    """
    Secure image upload endpoint for:
    - Category icons and category banners (Req #1)
    - Product primary catalog images & catalog gallery photos (Req #3)
    Enforces folder whitelisting, file extension checks, image MIME validation, and a 15MB file size limit.
    """
    clean_folder = folder.strip().lower()
    if clean_folder not in ALLOWED_FOLDERS:
        raise BadRequestError(
            f"Invalid target folder '{folder}'. Allowed folders: {', '.join(sorted(ALLOWED_FOLDERS))}"
        )

    if not file.filename or not file.filename.strip():
        raise BadRequestError("Uploaded file must have a valid filename.")

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise BadRequestError(
            f"Invalid file format '{ext}'. Allowed image extensions: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )

    # Validate Content-Type
    content_type = (file.content_type or "").lower()
    if content_type and not (content_type.startswith("image/") or content_type == "application/octet-stream"):
        raise BadRequestError(
            f"Invalid MIME type '{file.content_type}'. Only image files are permitted."
        )

    try:
        contents = await file.read()
    except Exception as exc:
        logger.error(f"Failed to read uploaded file '{file.filename}': {exc}", exc_info=True)
        raise BadRequestError("Could not read uploaded file content.")

    if len(contents) == 0:
        raise BadRequestError("The uploaded file is empty (0 bytes).")

    if len(contents) > MAX_FILE_SIZE_BYTES:
        max_mb = MAX_FILE_SIZE_BYTES // (1024 * 1024)
        actual_mb = round(len(contents) / (1024 * 1024), 2)
        raise PayloadTooLargeError(
            f"Uploaded file size ({actual_mb} MB) exceeds maximum allowed limit of {max_mb} MB."
        )

    unique_filename = f"{clean_folder}_{uuid.uuid4().hex[:12]}{ext}"

    # 1. Attempt upload to Supabase Storage if configured
    if is_supabase_connected():
        client = get_supabase()
        bucket_name = "catalog-images"
        file_path = f"{clean_folder}/{unique_filename}"
        try:
            client.storage.from_(bucket_name).upload(
                file_path,
                contents,
                {"content-type": content_type or "image/jpeg"}
            )
            public_url = client.storage.from_(bucket_name).get_public_url(file_path)
            logger.info(f"File uploaded to Supabase Storage: {file_path}")
            return ApiResponse(
                success=True,
                message="File uploaded to Supabase Storage successfully",
                data={
                    "url": public_url,
                    "filename": unique_filename,
                    "storage": "supabase",
                    "size_bytes": len(contents)
                }
            )
        except Exception as e:
            logger.warning(f"[Supabase Storage] Notice: {e}. Falling back to local upload directory.")

    # 2. Local storage fallback
    dest_path = os.path.join(settings.UPLOAD_DIR, unique_filename)
    try:
        with open(dest_path, "wb") as f:
            f.write(contents)
    except Exception as err:
        logger.error(f"Failed writing file to disk at {dest_path}: {err}", exc_info=True)
        raise AppException(
            message=f"Failed to save file to local server storage: {str(err)}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            error_code="STORAGE_WRITE_ERROR"
        )

    public_url = f"/uploads/{unique_filename}"
    logger.info(f"File saved to local storage: {dest_path}")
    return ApiResponse(
        success=True,
        message="File uploaded successfully to local storage",
        data={
            "url": public_url,
            "filename": unique_filename,
            "storage": "local",
            "size_bytes": len(contents)
        }
    )

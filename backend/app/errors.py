import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, Field

class ErrorDetail(BaseModel):
    field: Optional[str] = None
    message: str
    type: Optional[str] = None
    value: Optional[Any] = None

class ApiErrorResponse(BaseModel):
    success: bool = False
    message: str
    detail: str
    error_code: str
    status_code: int
    details: Optional[List[ErrorDetail]] = None
    path: Optional[str] = None
    timestamp: str = Field(default_factory=lambda: datetime.datetime.now(datetime.timezone.utc).isoformat())
    request_id: Optional[str] = None

class AppException(Exception):
    """
    Base application exception with standardized status code,
    error code identifier, and optional nested error details.
    """
    def __init__(
        self,
        message: str,
        status_code: int = 400,
        error_code: str = "APPLICATION_ERROR",
        details: Optional[List[ErrorDetail]] = None
    ):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.error_code = error_code
        self.details = details or []

class NotFoundError(AppException):
    def __init__(self, resource: str, identifier: Any = None, message: Optional[str] = None):
        msg = message or (f"{resource} with identifier '{identifier}' was not found" if identifier else f"{resource} not found")
        super().__init__(
            message=msg,
            status_code=404,
            error_code="NOT_FOUND"
        )

class BadRequestError(AppException):
    def __init__(self, message: str, details: Optional[List[ErrorDetail]] = None, error_code: str = "BAD_REQUEST"):
        super().__init__(
            message=message,
            status_code=400,
            error_code=error_code,
            details=details
        )

class UnauthorizedError(AppException):
    def __init__(self, message: str = "Admin authentication required. Please provide a valid Bearer token."):
        super().__init__(
            message=message,
            status_code=401,
            error_code="UNAUTHORIZED"
        )

class ForbiddenError(AppException):
    def __init__(self, message: str = "Operation forbidden by site policy or role."):
        super().__init__(
            message=message,
            status_code=403,
            error_code="FORBIDDEN"
        )

class ConflictError(AppException):
    def __init__(self, message: str, details: Optional[List[ErrorDetail]] = None):
        super().__init__(
            message=message,
            status_code=409,
            error_code="CONFLICT",
            details=details
        )

class ValidationError(AppException):
    def __init__(self, message: str, details: Optional[List[ErrorDetail]] = None):
        super().__init__(
            message=message,
            status_code=422,
            error_code="VALIDATION_ERROR",
            details=details
        )

class PayloadTooLargeError(AppException):
    def __init__(self, message: str = "Uploaded file or payload exceeds maximum allowed limit"):
        super().__init__(
            message=message,
            status_code=413,
            error_code="PAYLOAD_TOO_LARGE"
        )

class DatabaseError(AppException):
    def __init__(self, message: str = "A database error occurred during operation"):
        super().__init__(
            message=message,
            status_code=500,
            error_code="DATABASE_ERROR"
        )

def format_validation_errors(raw_errors: list) -> tuple[str, List[ErrorDetail]]:
    """
    Transforms Pydantic validation error dictionaries into a human-readable
    summary message and a list of clean ErrorDetail objects.
    """
    details: List[ErrorDetail] = []
    messages = []
    
    for err in raw_errors:
        loc = err.get("loc", [])
        # Filter out 'body' or 'query' prefix if present for cleaner field naming
        loc_parts = [str(p) for p in loc if str(p) not in ("body", "query", "path")]
        field_name = ".".join(loc_parts) if loc_parts else (str(loc[-1]) if loc else "field")
        
        msg = err.get("msg", "Invalid value")
        # Clean up pydantic 2.x prefix if present
        if msg.startswith("Value error, "):
            msg = msg.replace("Value error, ", "")
            
        err_type = err.get("type", "value_error")
        input_val = err.get("input")
        
        details.append(ErrorDetail(
            field=field_name,
            message=msg,
            type=err_type,
            value=str(input_val) if input_val is not None and not isinstance(input_val, (dict, list)) else None
        ))
        messages.append(f"{field_name}: {msg}")
        
    summary = f"Validation failed ({len(details)} issue{'s' if len(details) != 1 else ''}): " + "; ".join(messages)
    return summary, details

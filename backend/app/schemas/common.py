from enum import Enum
from typing import Generic, TypeVar, Optional, Any
from pydantic import BaseModel

# Req #1 & Req #5: Enum for rating display modes
class RatingDisplayMode(str, Enum):
    ENABLED = "enabled"      # Users can view AND submit new ratings
    READ_ONLY = "read_only"  # Static mode: Users can ONLY see existing ratings, cannot add new ones
    HIDDEN = "hidden"        # Rating section is completely turned off on the frontend

T = TypeVar("T")

class ApiResponse(BaseModel, Generic[T]):
    success: bool = True
    message: str = "Operation completed successfully"
    data: Optional[T] = None

class PaginatedResponse(BaseModel, Generic[T]):
    success: bool = True
    items: list[T]
    total: int
    page: int = 1
    page_size: int = 50

# Enterprise Keyset / Cursor Pagination Schema
class CursorPageInfo(BaseModel):
    next_cursor: Optional[str] = None
    prev_cursor: Optional[str] = None
    has_next_page: bool = False
    has_prev_page: bool = False
    count: int = 0

class CursorPaginatedResponse(BaseModel, Generic[T]):
    success: bool = True
    items: list[T]
    page_info: CursorPageInfo


from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field

class SellerReplySchema(BaseModel):
    author: str = Field("Amol Murti Concierge (Master Sculptor Team)", description="Responder name/title")
    date: Optional[str] = None
    text: str = Field(..., description="Seller response message")

class ReviewCreate(BaseModel):
    murti_id: str = Field(..., description="UUID of murti being reviewed")
    author: str = Field(..., min_length=2, description="Customer name")
    location: Optional[str] = Field("Jaipur, Rajasthan", description="Customer city & state")
    rating: int = Field(..., ge=1, le=5, description="Star rating (1 to 5 stars)")
    title: str = Field(..., min_length=3, description="Review headline")
    content: str = Field(..., min_length=10, description="Detailed review text")
    tag: Optional[str] = Field("mandir", description="'mandir', 'car-dash', 'travel', 'gift'")
    has_photo: bool = False
    photo_url: Optional[str] = None

class ReviewModerate(BaseModel):
    is_approved: Optional[bool] = None
    helpful_count: Optional[int] = None
    unhelpful_count: Optional[int] = None
    seller_reply: Optional[SellerReplySchema] = None

class ReviewOut(BaseModel):
    id: str
    murti_id: str
    author: str
    avatar_color: Optional[str] = "bg-amber-700"
    location: Optional[str] = None
    rating: int
    title: str
    content: str
    verified: bool = True
    helpful_count: int = 0
    unhelpful_count: int = 0
    tag: Optional[str] = "mandir"
    has_photo: bool = False
    photo_url: Optional[str] = None
    seller_reply: Optional[Dict[str, Any]] = None
    is_approved: bool = True
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

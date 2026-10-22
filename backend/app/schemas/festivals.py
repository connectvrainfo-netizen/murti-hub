from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field

# Join item schema: Product linked to Festival with special override price
class FestivalSectionItemBase(BaseModel):
    murti_id: str = Field(..., description="UUID of the linked Murti")
    festival_price: float = Field(..., ge=0, description="Special festival override price")
    custom_tag: Optional[str] = Field("Festive Offer", description="Tag e.g. 'Early Bird 20% Off', 'Limited Stock'")
    sort_order: int = Field(0, description="Display order within festival section")

class FestivalSectionItemCreate(FestivalSectionItemBase):
    pass

class FestivalSectionItemOut(FestivalSectionItemBase):
    id: str
    festival_id: str
    murti_title: Optional[str] = None
    murti_image: Optional[str] = None
    original_price: Optional[float] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Main Festival Section Schema
class FestivalSectionBase(BaseModel):
    title: str = Field(..., description="Festival headline e.g. 'Navratri Collection', 'Ganeshotsav 2026 Special'")
    subtitle: Optional[str] = Field(None, description="Subtitle / announcement text")
    banner_image_url: Optional[str] = Field(None, description="Banner image URL for the festival background/card")
    badge_text: Optional[str] = Field("Navratri 2026 Special", description="Pill badge e.g. 'Festival Offer'")
    announcement_tag: Optional[str] = Field("FESTIVE EDIT", description="Top pill label")
    is_active: bool = Field(True, description="Toggle festival section ON/OFF from Admin (Req #6)")
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    sort_order: int = 0

class FestivalSectionCreate(FestivalSectionBase):
    items: Optional[List[FestivalSectionItemCreate]] = None

class FestivalSectionUpdate(BaseModel):
    title: Optional[str] = None
    subtitle: Optional[str] = None
    banner_image_url: Optional[str] = None
    badge_text: Optional[str] = None
    announcement_tag: Optional[str] = None
    is_active: Optional[bool] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    sort_order: Optional[int] = None

class FestivalSectionOut(FestivalSectionBase):
    id: str
    items: List[FestivalSectionItemOut] = []
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

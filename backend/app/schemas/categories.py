from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class CategoryBase(BaseModel):
    name: str = Field(..., description="Category display title e.g. 'Gajanan Maharaj', 'Navratri Drop'")
    slug: str = Field(..., description="Unique URL slug e.g. 'gajanan-maharaj'")
    deity: Optional[str] = Field(None, description="Deity filter matching e.g. 'Gajanan Maharaj', 'Durga', 'Shiva'")
    route: str = Field("shop-all", description="Frontend route: 'shop-all', 'navratri', 'sacred', 'baal-roop'")
    img: Optional[str] = Field(None, description="Category circle icon / thumbnail image URL")
    banner_url: Optional[str] = Field(None, description="Category hero banner image URL (Req #1)")
    description: Optional[str] = Field(None, description="Category summary / subtitle")
    sort_order: int = Field(0, description="Sort order in the deity category bar")
    is_active: bool = Field(True, description="Whether this category is displayed on the site")

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    deity: Optional[str] = None
    route: Optional[str] = None
    img: Optional[str] = None
    banner_url: Optional[str] = None
    description: Optional[str] = None
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None

class CategoryOut(CategoryBase):
    id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

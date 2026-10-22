from datetime import datetime
from typing import List, Optional, Any
from pydantic import BaseModel, Field
from app.schemas.common import RatingDisplayMode
from app.schemas.sizes import MasterSizeOut

# Req #3: Dedicated Catalog Image item structure
class CatalogImageItem(BaseModel):
    url: str = Field(..., description="Image URL of the catalog angle or detail")
    caption: Optional[str] = Field(None, description="Caption e.g. 'Front View - 24K Gold Detailing', 'Side Profile'")
    sort_order: int = Field(0, description="Order inside the catalog gallery")

# Req #7: Murti Variant (Size variant)
class MurtiVariantBase(BaseModel):
    size_id: Optional[str] = Field(None, description="Linked master_sizes UUID")
    variant_name: Optional[str] = Field(None, description="Custom label e.g. '15 cm Home Mandir'")
    price: float = Field(..., ge=0, description="Price for this specific size")
    discount_price: Optional[float] = Field(None, ge=0, description="Original strike-through price")
    variant_image_url: Optional[str] = Field(None, description="Specific image for this size variation")
    sku: Optional[str] = None
    stock_quantity: int = Field(10, ge=0)
    is_active: bool = True
    sort_order: int = 0

class MurtiVariantCreate(MurtiVariantBase):
    pass

class MurtiVariantUpdate(BaseModel):
    size_id: Optional[str] = None
    variant_name: Optional[str] = None
    price: Optional[float] = None
    discount_price: Optional[float] = None
    variant_image_url: Optional[str] = None
    sku: Optional[str] = None
    stock_quantity: Optional[int] = None
    is_active: Optional[bool] = None
    sort_order: Optional[int] = None

class MurtiVariantOut(MurtiVariantBase):
    id: str
    murti_id: str
    size: Optional[MasterSizeOut] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Main Murti / Product Schema
class MurtiBase(BaseModel):
    title: str = Field(..., description="Product title")
    slug: Optional[str] = None
    legacy_id: Optional[int] = None
    category_id: Optional[str] = None
    deity: str = Field(..., description="Deity name e.g. 'Ram', 'Krishna', 'Shiva', 'Durga'")
    group_tag: str = Field("most-loved", description="Section grouping: 'most-loved', 'navratri', 'sacred', 'baal-roop', 'similar'")
    price: float = Field(..., ge=0, description="Selling price in INR")
    old_price: Optional[float] = Field(None, ge=0, description="Original strike-through price")
    off_text: Optional[str] = Field(None, description="Discount pill text e.g. '42% off'")
    material: str = Field("Pure White Makrana Marble", description="Material specification")
    description: Optional[str] = None
    dimensions: Optional[str] = "9 cm x 6 cm x 4 cm"
    weight: Optional[str] = "850 grams"
    pran_pratishtha_ready: bool = True
    gold_leaf_karigari: bool = True
    
    # Req #3: Dedicated Catalog Image Section (Primary/Thumbnail + Gallery JSONB Array)
    primary_catalog_image: Optional[str] = Field(None, description="Primary catalog hero image URL")
    catalog_images: List[CatalogImageItem] = Field(
        default_factory=list,
        description="Catalog image section: array of catalog images with captions & sort order"
    )
    
    # Req #5: Per-product rating mode override ('enabled', 'read_only', 'hidden')
    rating_mode: RatingDisplayMode = Field(
        default=RatingDisplayMode.ENABLED,
        description="Rating mode for this product: 'enabled' (view & add), 'read_only' (static view only), or 'hidden'"
    )
    # Admin static rating override value (e.g. 4.95)
    static_rating_value: float = Field(default=5.00, ge=1.0, le=5.0)
    static_reviews_count: int = Field(default=48, ge=0)
    
    stock_status: str = Field("in_stock", description="'in_stock', 'made_to_order', 'out_of_stock'")
    is_featured: bool = False
    is_active: bool = True
    sort_order: int = 0

class MurtiCreate(MurtiBase):
    variants: Optional[List[MurtiVariantCreate]] = None

class MurtiUpdate(BaseModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    category_id: Optional[str] = None
    deity: Optional[str] = None
    group_tag: Optional[str] = None
    price: Optional[float] = None
    old_price: Optional[float] = None
    off_text: Optional[str] = None
    material: Optional[str] = None
    description: Optional[str] = None
    dimensions: Optional[str] = None
    weight: Optional[str] = None
    pran_pratishtha_ready: Optional[bool] = None
    gold_leaf_karigari: Optional[bool] = None
    
    # Req #3: Dedicated Catalog Image Section
    primary_catalog_image: Optional[str] = None
    catalog_images: Optional[List[CatalogImageItem]] = None
    
    # Req #5: Rating mode & static rating value
    rating_mode: Optional[RatingDisplayMode] = None
    static_rating_value: Optional[float] = None
    static_reviews_count: Optional[int] = None
    
    stock_status: Optional[str] = None
    is_featured: Optional[bool] = None
    is_active: Optional[bool] = None
    sort_order: Optional[int] = None
    variants: Optional[List[MurtiVariantCreate]] = None

class MurtiOut(MurtiBase):
    id: str
    variants: List[MurtiVariantOut] = []
    average_rating: Optional[float] = 5.0
    total_reviews: Optional[int] = 0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

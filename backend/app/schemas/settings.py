from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from app.schemas.common import RatingDisplayMode

class SiteSettingsBase(BaseModel):
    whatsapp_number: str = Field(..., description="WhatsApp concierge number e.g. +919876543210 or 917020676423")
    whatsapp_default_message: Optional[str] = Field(
        default="Namaste! I want to inquire about a Murti on Murti Hub.",
        description="Default greeting sent when customer taps WhatsApp inquiry"
    )
    global_rating_mode: RatingDisplayMode = Field(
        default=RatingDisplayMode.ENABLED,
        description="Global rating visibility: 'enabled' (view & add), 'read_only' (view only), or 'hidden' (turned off)"
    )
    site_title: Optional[str] = "Amol Marble Murti Bhandar - Sacred Jaipur Murtis"
    support_email: Optional[str] = "support@amolmurtibhandar.com"
    showroom_address: Optional[str] = "Khazane Walon Ka Rasta, Jaipur, Rajasthan 302001"
    banner_announcement: Optional[str] = "Zero-Breakage Crating Guarantee across all 19,000+ PIN codes across India"
    # Sacred Collection Fields (Req 2.1)
    collection_badge: Optional[str] = "SANCTIFIED SACRED COLLECTION 2026"
    collection_title: Optional[str] = "Shri Ram Darbar"
    collection_subtitle: Optional[str] = "Pure Makrana White Marble"
    collection_description: Optional[str] = "Lord Ram, Mata Sita, Laxman & Hanuman hand-chiseled with 24K gold foil embellishments. Consecrated for home mandir altars and daily pooja."
    collection_price_from: Optional[str] = "1,499"
    collection_old_price: Optional[str] = "2,599"
    collection_discount_text: Optional[str] = "Save 42%"
    collection_tag: Optional[str] = "✦ Hand-Carved Makrana Marble"
    collection_image_url: Optional[str] = "/images/products/ram-darbar.png"

class SiteSettingsUpdate(BaseModel):
    whatsapp_number: Optional[str] = None
    whatsapp_default_message: Optional[str] = None
    global_rating_mode: Optional[RatingDisplayMode] = None
    site_title: Optional[str] = None
    support_email: Optional[str] = None
    showroom_address: Optional[str] = None
    banner_announcement: Optional[str] = None
    collection_badge: Optional[str] = None
    collection_title: Optional[str] = None
    collection_subtitle: Optional[str] = None
    collection_description: Optional[str] = None
    collection_price_from: Optional[str] = None
    collection_old_price: Optional[str] = None
    collection_discount_text: Optional[str] = None
    collection_tag: Optional[str] = None
    collection_image_url: Optional[str] = None

class SiteSettingsOut(SiteSettingsBase):
    id: int = 1
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

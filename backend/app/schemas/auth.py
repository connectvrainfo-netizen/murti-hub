from typing import Optional, Dict, Any
from pydantic import BaseModel, EmailStr, Field

class AdminLoginRequest(BaseModel):
    email: str = Field(..., description="Admin or user email address e.g. admin@amolmurtibhandar.com")
    password: str = Field(..., description="Account password")

class UserRegisterRequest(BaseModel):
    email: str = Field(..., description="Valid email address for registration")
    password: str = Field(..., min_length=6, description="Password (minimum 6 characters)")
    full_name: Optional[str] = Field("Devotee Member", description="Full name or display name")

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    admin: Dict[str, Any]

class AdminProfile(BaseModel):
    id: str
    email: str
    full_name: str
    role: str = "super_admin"
    is_active: bool = True

class DashboardStats(BaseModel):
    total_products: int = 0
    total_categories: int = 0
    total_sizes: int = 0
    total_reviews: int = 0
    pending_reviews: int = 0
    active_festival_title: Optional[str] = None
    festival_is_active: bool = False
    whatsapp_number: str
    global_rating_mode: str

from typing import Optional, Dict, Any
from pydantic import BaseModel, EmailStr, Field

class AdminLoginRequest(BaseModel):
    email: str = Field(..., description="Admin or user email address e.g. admin@amolmurtibhandar.com")
    password: str = Field(..., description="Account password")

class UserRegisterRequest(BaseModel):
    email: str = Field(..., description="Valid email address for registration")
    password: str = Field(..., min_length=6, description="Password (minimum 6 characters)")
    full_name: Optional[str] = Field("Devotee Member", description="Full name or display name")
    role: Optional[str] = Field("devotee", description="Account role (devotee, editor, admin)")

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

class UserProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None

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

class ForgotPasswordRequest(BaseModel):
    email: str = Field(..., description="Registered account email address")

class ResetPasswordRequest(BaseModel):
    token: str = Field(..., min_length=10, description="Cryptographic password reset token")
    new_password: str = Field(..., min_length=8, description="New strong password (min 8 characters)")

class AdminUpdateCredentialsRequest(BaseModel):
    current_password: str = Field(..., min_length=1, description="Current administrator password for verification")
    new_email: Optional[str] = Field(None, description="New administrative email or account ID")
    new_password: Optional[str] = Field(None, min_length=8, description="New strong password (min 8 characters)")



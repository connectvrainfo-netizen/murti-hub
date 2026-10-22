from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field

class OrderItemInput(BaseModel):
    product_id: str = Field(..., description="ID or legacy_id of the murti")
    qty: int = Field(1, ge=1, le=50, description="Quantity")
    selected_size: Optional[str] = Field(None, description="Chosen size variation label")

class ValidatedOrderItem(BaseModel):
    product_id: str
    title: str
    unit_price: float
    qty: int
    subtotal: float
    stock_status: str = "in_stock"
    is_available: bool = True
    img: Optional[str] = None

class OrderValidateRequest(BaseModel):
    items: List[OrderItemInput] = Field(..., min_length=1, description="List of items in cart")
    coupon_code: Optional[str] = Field(None, description="Optional coupon code (e.g. DIVINE15, FESTIVE10)")
    shipping_pincode: Optional[str] = Field(None, description="Delivery PIN code for serviceability")

class OrderValidateResponse(BaseModel):
    is_valid: bool
    items: List[ValidatedOrderItem]
    subtotal: float
    discount_amount: float
    shipping_fee: float = 0.0
    total: float
    coupon_applied: Optional[str] = None
    warnings: List[str] = []

class ShippingAddress(BaseModel):
    full_name: str = Field(..., min_length=2, description="Recipient full name")
    phone: str = Field(..., min_length=10, max_length=15, description="Mobile number for dispatch updates")
    email: Optional[str] = None
    address: str = Field(..., min_length=5, description="Street address")
    city: str = Field(..., min_length=2, description="City")
    state: str = Field("Rajasthan", description="State")
    pincode: str = Field(..., min_length=6, max_length=6, description="6-digit Indian Postal Code")
    notes: Optional[str] = None

class OrderCreateRequest(BaseModel):
    items: List[OrderItemInput] = Field(..., min_length=1)
    shipping: ShippingAddress
    payment_method: str = Field("cod", description="'cod', 'upi', 'card'")
    coupon_code: Optional[str] = None
    idempotency_key: Optional[str] = Field(None, description="Unique client key preventing duplicate orders")

class OrderTimelineStep(BaseModel):
    title: str
    desc: str
    done: bool
    time: str

class OrderOut(BaseModel):
    order_id: str
    items: List[ValidatedOrderItem]
    subtotal: float
    discount_amount: float
    shipping_fee: float = 0.0
    total: float
    shipping: ShippingAddress
    payment_method: str
    payment_status: str = "pending" # 'pending', 'paid', 'cod_verified'
    order_status: str = "confirmed" # 'confirmed', 'sanctified', 'dispatched', 'delivered', 'cancelled'
    tracking_number: Optional[str] = None
    courier: Optional[str] = None
    created_at: str
    timeline: List[OrderTimelineStep] = []

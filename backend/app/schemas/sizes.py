from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class MasterSizeBase(BaseModel):
    label: str = Field(..., description="Display label e.g. '9 cm (Compact)', '15 cm (Home Mandir)', '1.5 Feet (18 Inches)'")
    height_inches: Optional[float] = Field(None, description="Physical height in inches for sorting and filtering e.g. 5.9")
    unit: Optional[str] = Field("in", description="Measurement unit: 'in', 'ft', 'm', 'cm'")
    size_value: Optional[float] = Field(None, description="Physical size measurement value")
    description: Optional[str] = Field(None, description="Short guidance e.g. 'Ideal for travel & office desk'")
    sort_order: int = Field(0, description="Display sort order in dropdowns")
    is_active: bool = Field(True, description="Whether this size is active for selection")

class MasterSizeCreate(MasterSizeBase):
    pass

class MasterSizeUpdate(BaseModel):
    label: Optional[str] = None
    height_inches: Optional[float] = None
    unit: Optional[str] = None
    size_value: Optional[float] = None
    description: Optional[str] = None
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None

class MasterSizeOut(MasterSizeBase):
    id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

from datetime import datetime
from typing import Optional, Any, Dict, List
from pydantic import BaseModel, EmailStr, ConfigDict

class LeadActivityBase(BaseModel):
    activity_type: str # 'note', 'call', 'email', 'whatsapp_sync', 'status_change', 'ai_summary', 'document_generated'
    description: str
    metadata_json: Optional[Dict[str, Any]] = None

class LeadActivityCreate(LeadActivityBase):
    pass

class LeadActivityOut(LeadActivityBase):
    id: str
    lead_id: str
    performed_by: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class LeadBase(BaseModel):
    first_name: str
    last_name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    status: str = "new"
    source: str = "direct"
    academic_interest: Optional[str] = None
    notes: Optional[str] = None
    is_at_risk: bool = False
    risk_reason: Optional[str] = None
    assigned_to: Optional[str] = None

class LeadCreate(LeadBase):
    pass

class LeadUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    status: Optional[str] = None
    source: Optional[str] = None
    academic_interest: Optional[str] = None
    notes: Optional[str] = None
    is_at_risk: Optional[bool] = None
    risk_reason: Optional[str] = None
    assigned_to: Optional[str] = None

class LeadOut(LeadBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class LeadPaginationOut(BaseModel):
    items: List[LeadOut]
    total: int
    skip: int
    limit: int

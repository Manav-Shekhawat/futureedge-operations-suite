from typing import Optional, Dict, Any
from pydantic import BaseModel, ConfigDict

class SettingsBase(BaseModel):
    name: str
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    logo_url: Optional[str] = None
    custom_params: Optional[Dict[str, Any]] = None

class SettingsUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    logo_url: Optional[str] = None
    custom_params: Optional[Dict[str, Any]] = None

class SettingsOut(SettingsBase):
    id: str

    model_config = ConfigDict(from_attributes=True)

from datetime import datetime
from typing import Optional, Any, Dict
from pydantic import BaseModel, ConfigDict

class WhatsAppReportOut(BaseModel):
    id: str
    uploaded_by: str
    file_name: str
    file_size: int
    raw_content: str
    summary: Optional[str] = None
    analysis_results: Optional[Dict[str, Any]] = None
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.lead import Lead
from app.crud.crud_lead import get_lead, get_lead_activities
from app.core.gemini import generate_followup_message

router = APIRouter()

class FollowUpRequest(BaseModel):
    lead_id: str
    channel: str # 'email' or 'whatsapp'
    tone: str # 'professional' | 'supportive' | 'urgent' | 'empathetic'

@router.post("/generate-followup")
def generate_followup(
    payload: FollowUpRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    lead = get_lead(db, lead_id=payload.lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
        
    activities = get_lead_activities(db, lead_id=payload.lead_id)
    
    # Format activities as a quick history text
    history_lines = []
    for act in activities[:5]: # Take recent 5 actions
        history_lines.append(f"- {act.created_at.strftime('%Y-%m-%d')}: {act.activity_type.upper()} - {act.description}")
    history_text = "\n".join(history_lines) if history_lines else "No previous communication recorded."
    
    lead_name = f"{lead.first_name} {lead.last_name}"
    interest = lead.academic_interest or "General Enrollment"
    notes = lead.notes or "No notes available."
    
    message = generate_followup_message(
        lead_name=lead_name,
        lead_interest=interest,
        lead_notes=notes,
        activity_log=history_text,
        channel=payload.channel,
        tone=payload.tone
    )
    
    return {
        "lead_id": payload.lead_id,
        "channel": payload.channel,
        "tone": payload.tone,
        "suggested_message": message
    }

@router.get("/status")
def get_ai_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from app.core.gemini import is_gemini_connected
    status_label = "Connected" if is_gemini_connected() else "Fallback Mode"
    return {"status": status_label}

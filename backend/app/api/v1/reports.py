from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.report import WhatsAppReport
from app.models.lead import Lead
from app.schemas.report import WhatsAppReportOut
from app.core.gemini import analyze_whatsapp_chat
from app.crud.crud_lead import log_lead_activity

router = APIRouter()

@router.post("/upload", response_model=WhatsAppReportOut, status_code=status.HTTP_201_CREATED)
def upload_report(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not file.filename.endswith(".txt"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Please upload a plain text (.txt) WhatsApp export."
        )

    try:
        content_bytes = file.file.read()
        raw_text = content_bytes.decode("utf-8", errors="ignore")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to read file content: {str(e)}"
        )

    # 1. Create Report record
    db_report = WhatsAppReport(
        uploaded_by=current_user.id,
        file_name=file.filename,
        file_size=len(content_bytes),
        raw_content=raw_text,
        status="processing"
    )
    db.add(db_report)
    db.commit()
    db.refresh(db_report)

    # 2. Invoke Gemini analysis
    try:
        analysis = analyze_whatsapp_chat(raw_text)
        
        db_report.summary = analysis.get("summary", "")
        db_report.analysis_results = analysis
        db_report.status = "completed"
        db.add(db_report)
        db.commit()
        db.refresh(db_report)
        
        # 3. Intelligent Link: Auto-flag matching leads in CRM as At-Risk!
        at_risk_list = analysis.get("at_risk_students", [])
        for item in at_risk_list:
            name_query = item.get("name", "")
            reason = item.get("reason", "")
            
            if not name_query:
                continue
                
            # Try to match leads by first name or last name
            # Splitting name e.g. "Sophia Alvarez"
            name_parts = name_query.split()
            lead = None
            if len(name_parts) >= 2:
                first, last = name_parts[0], name_parts[-1]
                lead = db.query(Lead).filter(
                    Lead.first_name.ilike(f"%{first}%"),
                    Lead.last_name.ilike(f"%{last}%")
                ).first()
            if not lead:
                # Try search by full name string
                lead = db.query(Lead).filter(
                    (Lead.first_name + " " + Lead.last_name).ilike(f"%{name_query}%")
                ).first()
                
            if lead:
                # Flag lead as at risk!
                lead.is_at_risk = True
                lead.risk_reason = f"[AI Audit from WhatsApp report '{file.filename}']: {reason}"
                db.add(lead)
                db.commit()
                
                # Log lead activity
                log_lead_activity(
                    db,
                    lead_id=lead.id,
                    performed_by=current_user.id,
                    activity_type="ai_summary",
                    description=f"AI flagged lead as at-risk during review of uploaded WhatsApp report '{file.filename}'. Reason: {reason}",
                    metadata_json={"report_id": db_report.id, "urgency": item.get("urgency_level", "concerned")}
                )

    except Exception as e:
        db_report.status = "failed"
        db_report.summary = f"Analysis failed: {str(e)}"
        db.add(db_report)
        db.commit()
        db.refresh(db_report)
        print(f"[Reports] Error analyzing report: {e}")

    return db_report

@router.get("", response_model=List[WhatsAppReportOut])
def read_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(WhatsAppReport).order_by(WhatsAppReport.created_at.desc()).all()

@router.get("/{report_id}", response_model=WhatsAppReportOut)
def read_report(
    report_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    report = db.query(WhatsAppReport).filter(
        WhatsAppReport.id == report_id
    ).first()
    if not report:
        raise HTTPException(status_code=404, detail="WhatsApp report record not found")
    return report

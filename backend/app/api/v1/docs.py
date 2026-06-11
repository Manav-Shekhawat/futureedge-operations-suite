from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import io
import uuid
from typing import List, Optional
from pydantic import BaseModel

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.document import Document
from app.models.institute import Settings
from app.core.pdf_generator import generate_pdf_document
from app.crud.crud_lead import log_lead_activity

router = APIRouter()

class DocumentGenerateRequest(BaseModel):
    document_type: str # 'acceptance_letter', 'fee_receipt', 'report_card', 'compliance_notice'
    lead_id: Optional[str] = None
    variables: dict

class DocumentOut(BaseModel):
    id: str
    generated_by: str
    lead_id: Optional[str]
    document_type: str
    recipient_name: str
    recipient_email: Optional[str]
    created_at: str

@router.post("/generate")
def generate_document(
    payload: DocumentGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    valid_types = ['acceptance_letter', 'fee_receipt', 'report_card', 'compliance_notice']
    if payload.document_type not in valid_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid document type. Must be one of {valid_types}."
        )

    # 1. Fetch institute name
    settings_rec = db.query(Settings).first()
    inst_name = settings_rec.name if settings_rec else "FutureEdge Education Services"

    # 2. Extract recipient details for database logs
    recipient_name = payload.variables.get("recipient_name", "Payer/Student")
    recipient_email = payload.variables.get("recipient_email", None)

    # 3. Pre-generate ID and reference number
    doc_id = str(uuid.uuid4())
    ref_num = f"FE-{payload.document_type[:3].upper()}-{doc_id[:8].upper()}"

    # 4. Generate PDF content
    try:
        pdf_bytes = generate_pdf_document(
            doc_type=payload.document_type,
            variables=payload.variables,
            institute_name=inst_name,
            ref_number=ref_num
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate PDF layout: {str(e)}"
        )

    # 5. Save to Document Log registry
    db_doc = Document(
        id=doc_id,
        generated_by=current_user.id,
        lead_id=payload.lead_id,
        document_type=payload.document_type,
        recipient_name=recipient_name,
        recipient_email=recipient_email,
        data_payload=payload.variables
    )
    db.add(db_doc)
    db.commit()
    db.refresh(db_doc)

    # 5. Log activity in CRM if lead_id is linked
    if payload.lead_id:
        doc_label = payload.document_type.replace("_", " ").title()
        log_lead_activity(
            db,
            lead_id=payload.lead_id,
            performed_by=current_user.id,
            activity_type="document_generated",
            description=f"Generated administrative PDF: {doc_label} for recipient '{recipient_name}'.",
            metadata_json={"document_id": db_doc.id, "document_type": payload.document_type}
        )

    # 6. Stream file bytes directly back to browser
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=futureedge_{payload.document_type}_{db_doc.id[:8]}.pdf"
        }
    )

@router.get("")
def read_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    docs = db.query(Document).order_by(Document.created_at.desc()).all()
    
    # Map to list representation
    results = []
    for doc in docs:
        results.append({
            "id": doc.id,
            "generated_by": doc.generator.first_name + " " + doc.generator.last_name if doc.generator else "System",
            "lead_id": doc.lead_id,
            "document_type": doc.document_type,
            "recipient_name": doc.recipient_name,
            "recipient_email": doc.recipient_email,
            "created_at": doc.created_at.strftime("%Y-%m-%d %H:%M:%S")
        })
    return results

@router.get("/{document_id}/download")
def download_document(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    settings_rec = db.query(Settings).first()
    inst_name = settings_rec.name if settings_rec else "FutureEdge Education Services"
    
    try:
        pdf_bytes = generate_pdf_document(
            doc_type=doc.document_type,
            variables=doc.data_payload,
            institute_name=inst_name,
            ref_number=f"FE-{doc.document_type[:3].upper()}-{doc.id[:8].upper()}"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to regenerate PDF layout: {str(e)}")
        
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=futureedge_{doc.document_type}_{doc.id[:8]}.pdf"
        }
    )

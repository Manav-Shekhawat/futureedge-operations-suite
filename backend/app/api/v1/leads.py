from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import csv
import io
from typing import List, Optional

from app.core.database import get_db
from app.api.deps import get_current_user, RoleChecker
from app.models.user import User
from app.schemas.lead import LeadCreate, LeadUpdate, LeadOut, LeadActivityOut, LeadActivityCreate, LeadPaginationOut
from app.crud import crud_lead

router = APIRouter()

@router.get("", response_model=LeadPaginationOut)
def read_leads(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    assigned_to: Optional[str] = None,
    is_at_risk: Optional[bool] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    leads, total = crud_lead.get_leads_paginated(
        db,
        skip=skip,
        limit=limit,
        status=status,
        assigned_to=assigned_to,
        is_at_risk=is_at_risk,
        search=search
    )
    return {
        "items": leads,
        "total": total,
        "skip": skip,
        "limit": limit
    }

@router.post("", response_model=LeadOut, status_code=status.HTTP_201_CREATED)
def create_new_lead(
    payload: LeadCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return crud_lead.create_lead(
        db,
        obj_in=payload,
        creator_id=current_user.id
    )

@router.get("/export")
def export_leads_csv(
    status: Optional[str] = None,
    assigned_to: Optional[str] = None,
    is_at_risk: Optional[bool] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Retrieve all matching leads for the institute (without pagination limit)
    leads, _ = crud_lead.get_leads_paginated(
        db,
        skip=0,
        limit=10000, # Large limit to export all matching leads
        status=status,
        assigned_to=assigned_to,
        is_at_risk=is_at_risk,
        search=search
    )

    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow([
        "ID", "First Name", "Last Name", "Email", "Phone", 
        "Status", "Source", "Academic Interest", "At Risk", "Risk Reason", "Created At"
    ])
    
    # Write rows
    for lead in leads:
        writer.writerow([
            lead.id, lead.first_name, lead.last_name, lead.email or "", lead.phone or "",
            lead.status, lead.source, lead.academic_interest or "",
            "Yes" if lead.is_at_risk else "No", lead.risk_reason or "",
            lead.created_at.strftime("%Y-%m-%d %H:%M:%S")
        ])
        
    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode("utf-8")),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=futureedge_leads.csv"}
    )

@router.get("/{lead_id}", response_model=LeadOut)
def read_lead(
    lead_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    lead = crud_lead.get_lead(db, lead_id=lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return lead

@router.put("/{lead_id}", response_model=LeadOut)
def update_lead_details(
    lead_id: str,
    payload: LeadUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    lead = crud_lead.get_lead(db, lead_id=lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return crud_lead.update_lead(db, db_obj=lead, obj_in=payload, updater_id=current_user.id)

@router.delete("/{lead_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_lead_record(
    lead_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    admin_check: User = Depends(RoleChecker(["admin"]))
):
    lead = crud_lead.get_lead(db, lead_id=lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    crud_lead.delete_lead(db, lead_id=lead_id)
    return None

@router.get("/{lead_id}/activities", response_model=List[LeadActivityOut])
def read_lead_activities(
    lead_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    lead = crud_lead.get_lead(db, lead_id=lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return crud_lead.get_lead_activities(db, lead_id=lead_id)

@router.post("/{lead_id}/activities", response_model=LeadActivityOut, status_code=status.HTTP_201_CREATED)
def create_lead_manual_activity(
    lead_id: str,
    payload: LeadActivityCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    lead = crud_lead.get_lead(db, lead_id=lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return crud_lead.log_lead_activity(
        db,
        lead_id=lead_id,
        performed_by=current_user.id,
        activity_type=payload.activity_type,
        description=payload.description,
        metadata_json=payload.metadata_json
    )

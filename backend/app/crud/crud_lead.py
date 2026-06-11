from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.models.lead import Lead, LeadActivity
from app.schemas.lead import LeadCreate, LeadUpdate

def get_lead(db: Session, lead_id: str) -> Optional[Lead]:
    return db.query(Lead).filter(Lead.id == lead_id).first()

def get_leads_paginated(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    assigned_to: Optional[str] = None,
    is_at_risk: Optional[bool] = None,
    search: Optional[str] = None
) -> Tuple[List[Lead], int]:
    query = db.query(Lead)
    
    if status:
        query = query.filter(Lead.status == status)
    if assigned_to:
        query = query.filter(Lead.assigned_to == assigned_to)
    if is_at_risk is not None:
        query = query.filter(Lead.is_at_risk == is_at_risk)
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                Lead.first_name.ilike(search_filter),
                Lead.last_name.ilike(search_filter),
                Lead.email.ilike(search_filter),
                Lead.phone.ilike(search_filter)
            )
        )
    
    total = query.count()
    items = query.order_by(Lead.created_at.desc()).offset(skip).limit(limit).all()
    return items, total

def create_lead(db: Session, obj_in: LeadCreate, creator_id: Optional[str] = None) -> Lead:
    db_obj = Lead(
        first_name=obj_in.first_name,
        last_name=obj_in.last_name,
        email=obj_in.email,
        phone=obj_in.phone,
        status=obj_in.status,
        source=obj_in.source,
        academic_interest=obj_in.academic_interest,
        notes=obj_in.notes,
        is_at_risk=obj_in.is_at_risk,
        risk_reason=obj_in.risk_reason,
        assigned_to=obj_in.assigned_to
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    
    # Log lead creation activity
    log_lead_activity(
        db,
        lead_id=db_obj.id,
        performed_by=creator_id,
        activity_type="note",
        description="Lead created in system."
    )
    
    return db_obj

def update_lead(db: Session, db_obj: Lead, obj_in: LeadUpdate, updater_id: Optional[str] = None) -> Lead:
    update_data = obj_in.model_dump(exclude_unset=True)
    
    # Track status change and assignee changes for audit logs
    old_status = db_obj.status
    old_assignee = db_obj.assigned_to
    
    for field, value in update_data.items():
        setattr(db_obj, field, value)
        
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    
    # Log changes
    if "status" in update_data and update_data["status"] != old_status:
        log_lead_activity(
            db,
            lead_id=db_obj.id,
            performed_by=updater_id,
            activity_type="status_change",
            description=f"Status changed from '{old_status}' to '{db_obj.status}'.",
            metadata_json={"from": old_status, "to": db_obj.status}
        )
    
    if "assigned_to" in update_data and update_data["assigned_to"] != old_assignee:
        log_lead_activity(
            db,
            lead_id=db_obj.id,
            performed_by=updater_id,
            activity_type="note",
            description="Lead re-assigned.",
            metadata_json={"from": old_assignee, "to": db_obj.assigned_to}
        )
        
    return db_obj

def delete_lead(db: Session, lead_id: str) -> Optional[Lead]:
    db_obj = db.query(Lead).filter(Lead.id == lead_id).first()
    if db_obj:
        db.delete(db_obj)
        db.commit()
    return db_obj

def log_lead_activity(
    db: Session,
    lead_id: str,
    performed_by: Optional[str],
    activity_type: str,
    description: str,
    metadata_json: Optional[dict] = None
) -> LeadActivity:
    db_obj = LeadActivity(
        lead_id=lead_id,
        performed_by=performed_by,
        activity_type=activity_type,
        description=description,
        metadata_json=metadata_json or {}
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def get_lead_activities(db: Session, lead_id: str) -> List[LeadActivity]:
    return db.query(LeadActivity).filter(LeadActivity.lead_id == lead_id).order_by(LeadActivity.created_at.desc()).all()

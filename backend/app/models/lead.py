import uuid
from sqlalchemy import Column, String, Boolean, ForeignKey, DateTime, func, JSON, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class Lead(Base):
    __tablename__ = "leads"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    assigned_to = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    status = Column(String(50), nullable=False, default="new") # 'new', 'contacted', 'interview_scheduled', 'admitted', 'rejected', 'lost'
    source = Column(String(100), nullable=False, default="direct")
    academic_interest = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)
    is_at_risk = Column(Boolean, default=False)
    risk_reason = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    assigned_user = relationship("User", back_populates="assigned_leads")
    activities = relationship("LeadActivity", back_populates="lead", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="lead")

class LeadActivity(Base):
    __tablename__ = "lead_activities"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    lead_id = Column(String, ForeignKey("leads.id", ondelete="CASCADE"), nullable=False)
    performed_by = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    activity_type = Column(String(100), nullable=False) # 'note', 'call', 'email', 'whatsapp_sync', 'status_change', 'ai_summary', 'document_generated'
    description = Column(Text, nullable=False)
    metadata_json = Column(JSON, name="metadata", default=dict) # Use metadata_json as Column name, but map it to metadata in DB
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    lead = relationship("Lead", back_populates="activities")
    user = relationship("User", back_populates="activities")

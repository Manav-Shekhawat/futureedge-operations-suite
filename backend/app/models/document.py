import uuid
from sqlalchemy import Column, String, ForeignKey, DateTime, func, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base

class Document(Base):
    __tablename__ = "documents"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    generated_by = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    lead_id = Column(String, ForeignKey("leads.id", ondelete="SET NULL"), nullable=True)
    document_type = Column(String(100), nullable=False) # 'acceptance_letter', 'fee_receipt', 'report_card', 'compliance_notice'
    recipient_name = Column(String(255), nullable=False)
    recipient_email = Column(String(255), nullable=True)
    data_payload = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    generator = relationship("User", back_populates="documents")
    lead = relationship("Lead", back_populates="documents")

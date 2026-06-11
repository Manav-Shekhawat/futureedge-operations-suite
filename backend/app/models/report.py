import uuid
from sqlalchemy import Column, String, Integer, Text, ForeignKey, DateTime, func, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base

class WhatsAppReport(Base):
    __tablename__ = "whatsapp_reports"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    uploaded_by = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_size = Column(Integer, nullable=False)
    raw_content = Column(Text, nullable=False)
    summary = Column(Text, nullable=True)
    analysis_results = Column(JSON, default=dict)
    status = Column(String(50), nullable=False, default="pending") # 'pending', 'processing', 'completed', 'failed'
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    uploader = relationship("User", back_populates="reports")

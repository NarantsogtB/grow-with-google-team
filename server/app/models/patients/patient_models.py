from datetime import datetime
from uuid import uuid4

from sqlalchemy import Column, String, DateTime, Float, Text
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base


class Patient(Base):
    __tablename__ = "patients"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4, index=True)
    full_name = Column(String, nullable=False)
    phone_number = Column(String, nullable=False, unique=True, index=True)
    telegram_chat_id = Column(String, nullable=True, index=True)
    address_text = Column(Text, nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
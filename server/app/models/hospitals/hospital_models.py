import uuid
from sqlalchemy import Column, String, DateTime, Boolean, Enum, func, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base
from app.common_types.enums import HealthcareLevelEnum


class Hospital(Base):
    __tablename__ = 'hospitals'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    hospital_name = Column(String, nullable=False)
    hospital_phone = Column(String, nullable=False, unique=True, index=True)
    address = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    level = Column(Enum(HealthcareLevelEnum, name='hospital_level_enum'), default=HealthcareLevelEnum.PRIMARY)
    doctors = relationship('Doctors', back_populates='hospitals', cascade='all, delete-orphan')
    
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())
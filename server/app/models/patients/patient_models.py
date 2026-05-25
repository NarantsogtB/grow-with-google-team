from sqlalchemy import Column, Integer, String, DateTime, Boolean, Enum, func
from app.database import Base
from sqlalchemy.dialects.postgresql import UUID
from app.common_types.enums import GenderEnum, PatientTypeEnum, ActionTypeEnum

import uuid

class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String, default=lambda: str(uuid.uuid4()), unique=True, index=True)

    name = Column(String, nullable=False)
    phone = Column(String, nullable=False, unique=True, index=True)
    telegram_id = Column(String, nullable=True)
    address = Column(String, nullable=True)

    age = Column(Integer, nullable=True)
    gender = Column(Enum(GenderEnum, name="patient_gender_enum"), nullable=True)

    medical_history = Column(String, nullable=True)
    anamnesis = Column(String, nullable=True)
    symptoms = Column(String, nullable=True)

    is_active = Column(Boolean, default=True)
    action_type = Column(Enum(ActionTypeEnum, name="action_type_enum"), nullable=True)

    guardian_phone = Column(String, nullable=True)
    patient_type = Column(Enum(PatientTypeEnum, name="patient_type_enum"), default=PatientTypeEnum.REGULAR)

    registration_number = Column(String, nullable=True)
    location_coordinates = Column(String, nullable=True)

    risk_level = Column(String, default="low")
    last_visit_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())
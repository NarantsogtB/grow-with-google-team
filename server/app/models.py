import uuid
import enum

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum
from sqlalchemy.sql import func

from app.database import Base


class GenderEnum(str, enum.Enum):
    FEMALE = "FEMALE"
    MALE = "MALE"


class PatientTypeEnum(str, enum.Enum):
    NEWBORN = "NEWBORN"
    ELDERLY = "ELDERLY"
    PALLIATIVE = "PALLIATIVE"
    DISABLED = "DISABLED"
    REGULAR = "REGULAR"


class ActionTypeEnum(str, enum.Enum):
    REGULAR_CHECK = "REGULAR_CHECK"
    FOLLOW_UP = "FOLLOW_UP"
    EMERGENCY = "EMERGENCY"


class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String, unique=True, index=True, default=lambda: str(uuid.uuid4()), nullable=False)

    name = Column(String, nullable=False)
    phone = Column(String, nullable=False, unique=True, index=True)
    telegram_id = Column(String, nullable=True)
    address = Column(String, nullable=True)

    age = Column(Integer, nullable=True)
    gender = Column(Enum(GenderEnum), nullable=True)

    medical_history = Column(String, nullable=True)
    anamnesis = Column(String, nullable=True)
    symptoms = Column(String, nullable=True)

    is_active = Column(Boolean, default=True, nullable=False)
    action_type = Column(Enum(ActionTypeEnum), nullable=True)

    guardian_phone = Column(String, nullable=True)
    patient_type = Column(Enum(PatientTypeEnum), default=PatientTypeEnum.REGULAR, nullable=False)

    registration_number = Column(String, nullable=True, unique=True, index=True)
    location_coordinates = Column(String, nullable=True)

    risk_level = Column(String, default="low")

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    last_visit_at = Column(DateTime(timezone=True), nullable=True)
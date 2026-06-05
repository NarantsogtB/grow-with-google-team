# =============================================================================
# PATIENT SCHEMAS — app/schemas/patient.py
# =============================================================================
# Pydantic V2 schemas for Patient create/update/response.
#
# IMPORTANT SECURITY RULE: The `password` field appears in PatientCreate
# (input) but NEVER in PatientResponse (output). This ensures the hashed
# password is never accidentally serialized and sent to the client.
# =============================================================================

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class PatientBase(BaseModel):
    """Fields shared by create and response schemas."""
    full_name: str
    phone_number: str
    telegram_chat_id: Optional[str] = None
    address_text: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    sector: Optional[str] = None


class PatientCreate(PatientBase):
    """Schema for POST /patients — includes password which gets hashed before storage."""
    password: str


class PatientResponse(PatientBase):
    """
    Schema for reading patient data — password is intentionally excluded.
    `from_attributes=True` enables serialization from SQLAlchemy ORM objects:
        patient = db.query(Patient).first()
        PatientResponse.model_validate(patient)  # works because of from_attributes
    """
    id: UUID
    created_at: datetime

    # Pydantic V2 style — replaces the deprecated `class Config: from_attributes = True`
    model_config = ConfigDict(from_attributes=True)


class PatientUpdate(BaseModel):
    """Schema for PUT /patients/me — all fields optional for partial updates."""
    full_name: Optional[str] = None
    address_text: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    telegram_chat_id: Optional[str] = None


class LoginRequest(BaseModel):
    """Schema for POST /patients/login."""
    phone_number: str
    password: str


class LoginResponse(BaseModel):
    """Schema for successful login response."""
    message: str
    patient_id: UUID
    full_name: str
    address_text: str
    access_token: str
    token_type: str = "bearer"

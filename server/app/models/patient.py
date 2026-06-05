# =============================================================================
# PATIENT MODEL — app/models/patient.py
# =============================================================================
# SQLAlchemy ORM model for the `patients` table.
# This is the canonical (authoritative) Patient model.
#
# WHY UUID PRIMARY KEY instead of Integer?
# UUID (Universally Unique Identifier) is a 128-bit value guaranteed to be
# globally unique without querying the database. Benefits:
#   - Safe to generate client-side before inserting
#   - Cannot enumerate users by guessing incremental IDs (security)
#   - Works safely in distributed systems (no ID collision between replicas)
# =============================================================================

from datetime import datetime
from uuid import uuid4

from app.models.base import Base
from sqlalchemy import Column, DateTime, Float, String, Text
from sqlalchemy.dialects.postgresql import UUID


class Patient(Base):
    __tablename__ = "patients"

    # UUID primary key — generated automatically when a new Patient is created
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4, index=True)

    # Core identity fields
    full_name = Column(String, nullable=False)

    # Phone number is the login identifier (Mongolian users use phone number, not email)
    phone_number = Column(String, nullable=False, unique=True, index=True)

    # Optional: Telegram chat ID for sending automated pre-visit confirmations
    telegram_chat_id = Column(String, nullable=True, index=True)

    # Address in human-readable form (ger district addresses are often descriptive)
    address_text = Column(Text, nullable=False)

    # GPS coordinates for route optimization (What3Words also stored per-visit)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    # Geographic sector matching doctor.assigned_sector (e.g. "14" for district 14)
    sector = Column(String(10), nullable=True, index=True)

    # Bcrypt-hashed password — NEVER store plain-text
    password = Column(String, nullable=False)

    # Automatically set when the record is created
    created_at = Column(DateTime, default=datetime.utcnow)

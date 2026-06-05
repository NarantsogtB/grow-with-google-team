# =============================================================================
# DATABASE BASE — app/models/base.py
# =============================================================================
# Defines the single shared SQLAlchemy Base that ALL models must inherit from.
#
# WHY A SEPARATE FILE FOR BASE?
# SQLAlchemy needs ONE shared Base so that all model classes appear in the
# same metadata registry (Base.metadata). Alembic reads Base.metadata to
# detect schema changes and generate migrations.
#
# If models imported Base from different places, they would register in
# different metadata objects, and Alembic would only see some of the tables.
#
# IMPORT HIERARCHY (no circular imports):
#   models/base.py         ← no imports (standalone)
#   models/enums.py        ← no imports (standalone)
#   models/patient.py      ← imports Base from models/base.py
#   models/doctor.py       ← imports Base + enums
#   repositories/          ← imports models
#   services/              ← imports repositories
#   api/endpoints/         ← imports services
# =============================================================================

from sqlalchemy.orm import declarative_base

# Single shared Base instance.
# Every SQLAlchemy model class must inherit from this:
#   class Patient(Base):
#       __tablename__ = "patients"
#       ...
#
# Base.metadata is the registry of all tables — Alembic uses it to auto-generate migrations.
Base = declarative_base()

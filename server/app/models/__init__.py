# =============================================================================
# MODELS PACKAGE — app/models/__init__.py
# =============================================================================
# Import from the new flat model files.
# These are the canonical model definitions used by Alembic and the application.
#
# OLD nested structure (app/models/doctors/doctor_models.py etc.) is now dead code.
# The flat files (app/models/doctor.py etc.) are the single source of truth.
# =============================================================================

from app.models.consultation import Consultation
from app.models.daily_visit_plan import DailyVisitPlan
from app.models.doctor import Doctor
from app.models.enums import ActionTypeEnum, GenderEnum, PatientTypeEnum
from app.models.hospital import Hospital
from app.models.patient import Patient
from app.models.schedule import DoctorWeeklySchedule

__all__ = [
    "Consultation",
    "DailyVisitPlan",
    "Doctor",
    "Hospital",
    "Patient",
    "DoctorWeeklySchedule",
    "GenderEnum",
    "PatientTypeEnum",
    "ActionTypeEnum",
]

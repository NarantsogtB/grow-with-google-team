# DEPRECATED: This file is kept only for backward compatibility during the migration
# to the enterprise folder structure. Do NOT add new models here.
#
# The canonical locations are:
#   - Enums     → app/common_types/enums.py (and later → app/models/enums.py)
#   - Patient   → app/models/patients/patient_models.py (UUID primary key)
#   - Doctor    → app/models/doctors/doctor_models.py
#   - Hospital  → app/models/hospitals/hospital_models.py
#
# The OLD Patient class below was removed because it conflicted with the new
# Patient model (Integer PK vs UUID PK). Alembic was seeing two `patients`
# tables with different schemas, which would cause schema drift on next migration.

import enum


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

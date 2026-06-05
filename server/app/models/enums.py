# =============================================================================
# CONSOLIDATED ENUMS — app/models/enums.py
# =============================================================================
# All enum types for the entire application live here.
# Previously duplicated in: app/models.py AND app/common_types/enums.py
#
# WHY CONSOLIDATE?
# Having enums in two places caused import confusion and risked subtle bugs:
#   - app/models.py used `import enum` → `enum.Enum`
#   - app/common_types/enums.py used `from enum import Enum as PythonEnum`
# They were functionally identical but different import paths made type-checking
# and IDE tooling unreliable.
#
# New code imports from: app.models.enums
# Old code still imports from: app.common_types.enums (still works, file kept)
# =============================================================================

from enum import Enum


class GenderEnum(str, Enum):
    """Doctor and patient gender classification."""
    FEMALE = "FEMALE"
    MALE = "MALE"


class PatientTypeEnum(str, Enum):
    """
    Patient risk/care classification for prioritizing home visits.
    Newborns, elderly, palliative care, and disabled patients receive
    more frequent visits than REGULAR patients.
    """
    NEWBORN = "NEWBORN"
    ELDERLY = "ELDERLY"
    PALLIATIVE = "PALLIATIVE"
    DISABLED = "DISABLED"
    REGULAR = "REGULAR"


class ActionTypeEnum(str, Enum):
    """Type of scheduled home visit action."""
    REGULAR_CHECK = "REGULAR_CHECK"
    FOLLOW_UP = "FOLLOW_UP"
    EMERGENCY = "EMERGENCY"


class DoctorRoleEnum(str, Enum):
    """Medical specialization of the doctor."""
    GENERAL = "GENERAL"
    PEDIATRICIAN = "PEDIATRICIAN"
    NURSE = "NURSE"


class HealthcareLevelEnum(str, Enum):
    """
    Mongolian healthcare system levels:
    - PRIMARY: Өрхийн эмнэлэг (family clinic — the level this app targets)
    - SECONDARY: Дүүргийн эмнэлэг (district hospital)
    - TERTIARY: Улсын эмнэлэг (national/specialized hospital)
    """
    PRIMARY = "PRIMARY"
    SECONDARY = "SECONDARY"
    TERTIARY = "TERTIARY"


class DayOfWeekEnum(str, Enum):
    """Days of the week for recurring weekly schedules."""
    MONDAY = "monday"
    TUESDAY = "tuesday"
    WEDNESDAY = "wednesday"
    THURSDAY = "thursday"
    FRIDAY = "friday"

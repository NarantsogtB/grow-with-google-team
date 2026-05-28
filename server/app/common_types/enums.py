from enum import Enum as PythonEnum

class GenderEnum(str, PythonEnum):
    FEMALE = "FEMALE"
    MALE = "MALE"
    

class PatientTypeEnum(str, PythonEnum):
    NEWBORN = "NEWBORN"
    ELDERLY = "ELDERLY"
    PALLIATIVE = "PALLIATIVE"
    DISABLED = "DISABLED"
    REGULAR = "REGULAR"

class ActionTypeEnum(str, PythonEnum):
    REGULAR_CHECK = "REGULAR_CHECK"

class DoctorRoleEnum(str, PythonEnum):
    GENERAL = "GENERAL"
    PEDIATRICIAN = "PEDIATRICIAN"
    NURSE = "NURSE"
    
class HealthcareLevelEnum(str, PythonEnum):
    PRIMARY = "PRIMARY"      
    SECONDARY = "SECONDARY"
    TERTIARY = "TERTIARY"
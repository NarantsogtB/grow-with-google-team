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
    EMERGENCY = "EMERGENCY"
    FOLLOW_UP = "FOLLOW_UP"

class DoctorRoleEnum(str, PythonEnum):
    GENERAL = "GENERAL"
    PEDIATRICIAN = "PEDIATRICIAN"
    NURSE = "NURSE"
    
class HealthcareLevelEnum(str, PythonEnum):
    PRIMARY = "PRIMARY"      
    SECONDARY = "SECONDARY"
    TERTIARY = "TERTIARY"
    
class DayOfWeekEnum(str, PythonEnum):
    MONDAY = "monday"
    TUESDAY = "tuesday"
    WEDNESDAY = "wednesday"
    THURSDAY = "thursday"
    FRIDAY = "friday"
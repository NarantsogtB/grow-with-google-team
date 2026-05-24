class WebAppError(Exception):
    """This is root error exception of this project"""
    pass


# Error of Doctor
class DoctorAlreadyExistsError(WebAppError):
    """Doctor already registered by phone"""
    def __init__(self, phone: str):
        self.phone = phone
        super().__init__(f"{phone} энэ утасны дугаартай эмч бүртгэлтэй байна.")
        
class DoctorNotFoundError(WebAppError):
    """Doctor not found from Database"""
    def __init__(self, doctor_id = None):
        self.doctor_id = doctor_id
        msg = f"ID: {doctor_id} тай эмч олдсонгүй." if doctor_id else "Эмч олдсонгүй."
        super().__init__(msg)
        
class DoctorNotActiveError(WebAppError):
    """When doctor is_active field is False cannot assign schedule and examination"""
    def __init__(self, doctor_id: str):
        self.doctor_id = doctor_id
        super().__init__(f"ID: {doctor_id}-тай эмчийн бүртгэл идэвхгүй байна. Системд нэвтрэх боломжгүй.")

class DoctorUpdateEmptyError(WebAppError):
    """When user send empty dict use this exception"""
    def __init__(self) -> None:
        super().__init__("Шинэчлэх мэдээлэл ирээгүй тул хоосон талбараар шинэчлэх боломжгүй.")
        
        
class HospitalAlreadyExistError(WebAppError):
    """Hospital already registered by phone"""
    def __init__(self, hospital_phone:str):
        self.hospital_phone = hospital_phone
        super().__init__(f"{hospital_phone} энэ дугаартай эмнэлэг бүртгэлтэй байна.")

class HospitalNotFoundError(WebAppError):
    """Hospital not found from Database"""
    def __init__(self, hospital_id = None):
        self.hospital_id=hospital_id
        super().__init__(f"{hospital_id} - тай эмнэлэг олдсонгүй")

class HospitalUpdateEmptyError(WebAppError):
    """When admin send empty dict use this exception"""
    def __init__(self) -> None:
        super().__init__("Шинэчлэх мэдээлэл ирээгүй тул хоосон талбараар шинэчлэх боломжгүй.")
    
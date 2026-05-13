

from sqlalchemy import Column, Integer, String

from app.database import Base


class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    phone = Column(String, nullable=False, unique=True, index=True)
    telegram_id = Column(String, nullable=True)
    address = Column(String, nullable=True)
    risk_level = Column(String, default="low")
    
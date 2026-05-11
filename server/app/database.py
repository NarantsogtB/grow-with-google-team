from typing import Annotated
from fastapi import Depends
from sqlalchemy.orm import Session, declarative_base, sessionmaker
from sqlalchemy import create_engine
from app.utils.logger import get_logger
from app.config import settings

logger = get_logger("database")

engine = create_engine(settings.DATABASE_URL)
logger.info("Database engine created")
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db=SessionLocal()
    try:
        yield db
    finally:
        db.close()
        
Database=Annotated[Session, Depends(get_db)]
# =============================================================================
# LEGACY DATABASE MODULE — app/database.py
# =============================================================================
# This file is kept for backward compatibility with existing routers and
# controllers that import `from app.database import Base, get_db, Database`.
#
# The new async database lives in app/core/database.py.
# New code (repositories, services) should import from there.
#
# KEY CHANGE: Base is now imported from app/models/base.py instead of being
# created here. This ensures that models imported by the new code and models
# imported by the old code all share ONE metadata registry, preventing
# Alembic from missing tables during autogenerate.
# =============================================================================

from typing import Annotated

from fastapi import Depends
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.config import settings
from app.models.base import Base  # Single shared Base — replaces declarative_base() here
from app.utils.logger import get_logger

logger = get_logger("database")

# Strip the asyncpg driver marker if present — sync create_engine uses psycopg2, not asyncpg.
# The .env may contain postgresql+asyncpg:// (correct for the new async engine in core/database.py)
# but the legacy sync engine here requires postgresql:// (psycopg2).
_sync_url = settings.DATABASE_URL.replace("+asyncpg", "", 1)

if "sqlite" in _sync_url:
    # check_same_thread=False is required for SQLite with multi-threaded use
    engine = create_engine(_sync_url, connect_args={"check_same_thread": False})
else:
    engine = create_engine(_sync_url)

logger.info("Database engine created")
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    """Sync session dependency for legacy endpoints still using the old router pattern."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Type alias used by old controllers: `def register_doctor(db: Database, ...)`
Database = Annotated[Session, Depends(get_db)]

# Re-export Base so `from app.database import Base` continues working everywhere
__all__ = ["Base", "engine", "get_db", "Database"]
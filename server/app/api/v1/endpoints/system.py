# =============================================================================
# SYSTEM STATUS — app/api/v1/endpoints/system.py
# =============================================================================
# Public health/readiness endpoint. Useful before a demo to confirm the
# backend can reach the DB and that the seed data is in place. No auth so
# operators can curl it from anywhere.
# =============================================================================

from app.api.deps import Database
from app.core.config import settings
from app.models.doctor import Doctor
from app.models.hospital import Hospital
from app.models.patient import Patient
from fastapi import APIRouter
from sqlalchemy import func, select

router = APIRouter(prefix="/system", tags=["System"])


@router.get("/status")
async def system_status(db: Database) -> dict:
    """Backend + DB readiness for demos. No authentication required."""
    db_status = "ok"
    counts = {"doctors": 0, "patients": 0, "hospitals": 0}
    try:
        # SELECT 1 first so DB-down still reports counts=0 cleanly
        await db.execute(select(1))
        counts["doctors"] = (
            await db.execute(select(func.count()).select_from(Doctor))
        ).scalar() or 0
        counts["patients"] = (
            await db.execute(select(func.count()).select_from(Patient))
        ).scalar() or 0
        counts["hospitals"] = (
            await db.execute(select(func.count()).select_from(Hospital))
        ).scalar() or 0
    except Exception as exc:  # pragma: no cover - defensive, surfaces in demo
        db_status = f"error: {exc!s}"

    return {
        "db": db_status,
        "counts": counts,
        "config": {
            "gemini": bool(settings.GOOGLE_GEMINI_API_KEY),
            "telegram": bool(settings.TELEGRAM_BOT_TOKEN),
            "what3words": bool(settings.WHAT3WORDS_API_KEY),
            "env": settings.ENV,
            "version": settings.PROJECT_VERSION,
        },
    }

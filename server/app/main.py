import asyncio
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import models to register them in Base.metadata BEFORE create_all is called.
# This is critical: if models are not imported, Alembic and create_all won't
# know these tables exist.
import app.models.consultation     # noqa: F401 — registers Consultation in Base.metadata
import app.models.daily_visit_plan  # noqa: F401 — registers DailyVisitPlan in Base.metadata
import app.models.doctor      # noqa: F401 — registers Doctor in Base.metadata
import app.models.hospital    # noqa: F401 — registers Hospital in Base.metadata
import app.models.patient     # noqa: F401 — registers Patient in Base.metadata
import app.models.schedule    # noqa: F401 — registers DoctorWeeklySchedule in Base.metadata

from app.database import Base, engine
from app.api.v1.router import api_router
from app.core.config import settings
from app.core.database import AsyncSessionLocal
from app.services.notification_service import bulk_send_reminders
from app.services.visit_service import send_day_before_confirmations
from app.utils.logger import get_logger

logger = get_logger("app")

_UB = timezone(timedelta(hours=8))


async def _daily_reminder_task() -> None:
    """Fires bulk Telegram reminders every day at 08:00 Ulaanbaatar time."""
    while True:
        now = datetime.now(_UB)
        target = now.replace(hour=8, minute=0, second=0, microsecond=0)
        if now >= target:
            target += timedelta(days=1)
        await asyncio.sleep((target - now).total_seconds())
        try:
            async with AsyncSessionLocal() as db:
                result = await bulk_send_reminders(db)
                await db.commit()
            logger.info("Scheduled reminders fired: %s", result)
        except Exception as exc:
            logger.error("Scheduled reminder error: %s", exc)


async def _day_before_confirmation_task() -> None:
    """Fires day-before visit confirmations every day at 18:00 Ulaanbaatar time."""
    while True:
        now = datetime.now(_UB)
        target = now.replace(hour=18, minute=0, second=0, microsecond=0)
        if now >= target:
            target += timedelta(days=1)
        await asyncio.sleep((target - now).total_seconds())
        tomorrow = (datetime.now(_UB) + timedelta(days=1)).date()
        try:
            async with AsyncSessionLocal() as db:
                result = await send_day_before_confirmations(db, tomorrow)
                await db.commit()
            logger.info("Day-before confirmations fired: %s", result)
        except Exception as exc:
            logger.error("Day-before confirmation error: %s", exc)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables synchronously on startup (acceptable for startup — not a request)
    # In production, use `alembic upgrade head` instead of create_all
    Base.metadata.create_all(bind=engine)
    logger.info(
        "%s v%s started (ENV=%s)",
        settings.PROJECT_NAME,
        settings.PROJECT_VERSION,
        settings.ENV,
    )
    _task = asyncio.create_task(_daily_reminder_task())
    _confirm_task = asyncio.create_task(_day_before_confirmation_task())
    yield
    _task.cancel()
    _confirm_task.cancel()
    for t in (_task, _confirm_task):
        try:
            await t
        except asyncio.CancelledError:
            pass


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    lifespan=lifespan,
)

# CORS — allow frontend (localhost:3000 dev + GCP VM IP) to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3002",
        "http://136.114.215.236",  # GCP VM IP (from next.config.ts allowedDevOrigins)
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── New enterprise API routes (v1) ────────────────────────────────────────────
# All new endpoints live under /api/v1/
# e.g. POST /api/v1/patients/  GET /api/v1/doctors/  POST /api/v1/agent/chat
app.include_router(api_router, prefix="/api/v1")

# ── Legacy routes (kept for backward compatibility during migration) ───────────
# The frontend currently calls /patients/login and /patients/ directly.
# Once the frontend is updated to use /api/v1/patients/, remove these.
from app.routers.patients import router as legacy_patients_router
from app.routers import hospital_router
from app.routers.doctors import doctor_routers
from app.routers.doctor_weekly_schedules import router as legacy_schedule_router

app.include_router(legacy_patients_router)       # /patients/
app.include_router(doctor_routers.router)        # /doctors/
app.include_router(hospital_router.router)       # /hospitals/
app.include_router(legacy_schedule_router)       # /schedules/


@app.get("/health")
def health_check():
    return {
        "message": "server is running",
        "status": "online",
        "version": settings.PROJECT_VERSION,
    }
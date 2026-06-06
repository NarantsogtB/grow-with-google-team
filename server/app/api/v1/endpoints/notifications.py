from datetime import date, datetime, timezone
from typing import List

from app.api.deps import Database
from app.core.database import AsyncSessionLocal
from app.repositories.patient_repo import PatientRepository
from app.services.notification_scheduler import ScheduledJob, cancel, list_jobs, schedule
from app.services.notification_service import bulk_send_reminders
from app.services.visit_service import send_day_before_confirmations
from app.utils.telegram import send_telegram_message
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/notifications", tags=["Notifications"])


class ReminderRequest(BaseModel):
    patient_id: str
    message: str | None = None


@router.post("/send-reminder")
async def send_reminder(body: ReminderRequest, db: Database):
    patient = await PatientRepository(db).get_by_id(body.patient_id)
    if not patient:
        raise HTTPException(404, "Өвчтөн олдсонгүй")
    if not patient.telegram_chat_id:
        raise HTTPException(400, "Өвчтөний Telegram холбогдоогүй байна")
    text = body.message or (
        f"Сайн байна уу, {patient.full_name}! "
        "Эмч таны гэрт удахгүй очих болно. Бэлэн байхыг хүсье. 🏥"
    )
    ok = await send_telegram_message(patient.telegram_chat_id, text)
    if not ok:
        raise HTTPException(500, "Telegram мэдэгдэл илгээхэд алдаа гарлаа")
    return {"ok": True}


@router.post("/send-bulk-reminder")
async def send_bulk_reminder(db: Database):
    result = await bulk_send_reminders(db)
    return result


class DayBeforeRequest(BaseModel):
    date: date


@router.post("/send-day-before-confirmations")
async def send_day_before_confirmations_endpoint(body: DayBeforeRequest, db: Database):
    result = await send_day_before_confirmations(db, body.date)
    return result


# ── One-shot scheduled reminders (demo feature) ───────────────────────────────


class ScheduleBulkRequest(BaseModel):
    fire_at: datetime  # ISO 8601 with timezone


class ScheduleDayBeforeRequest(BaseModel):
    fire_at: datetime
    for_date: date


class ScheduledJobResponse(BaseModel):
    id: str
    label: str
    fire_at: datetime


def _to_response(job: ScheduledJob) -> ScheduledJobResponse:
    return ScheduledJobResponse(id=job.id, label=job.label, fire_at=job.fire_at)


def _ensure_future(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    if dt <= datetime.now(timezone.utc):
        raise HTTPException(400, "fire_at нь өнгөрсөн цаг байж болохгүй")
    return dt


@router.post("/scheduled/bulk-reminder", response_model=ScheduledJobResponse)
async def schedule_bulk_reminder(body: ScheduleBulkRequest):
    """Queue a bulk Telegram reminder to fire once at `fire_at` (in UTC or with offset)."""
    fire_at = _ensure_future(body.fire_at)

    async def run() -> None:
        async with AsyncSessionLocal() as db:
            await bulk_send_reminders(db)
            await db.commit()

    job = schedule(fire_at, "Bulk reminder", run)
    return _to_response(job)


@router.post("/scheduled/day-before", response_model=ScheduledJobResponse)
async def schedule_day_before(body: ScheduleDayBeforeRequest):
    """Queue day-before confirmations for `for_date` to fire once at `fire_at`."""
    fire_at = _ensure_future(body.fire_at)
    target_date = body.for_date

    async def run() -> None:
        async with AsyncSessionLocal() as db:
            await send_day_before_confirmations(db, target_date)
            await db.commit()

    job = schedule(fire_at, f"Day-before {target_date.isoformat()}", run)
    return _to_response(job)


@router.get("/scheduled", response_model=List[ScheduledJobResponse])
async def list_scheduled():
    return [_to_response(j) for j in list_jobs()]


@router.delete("/scheduled/{job_id}")
async def cancel_scheduled(job_id: str):
    job = cancel(job_id)
    if not job:
        raise HTTPException(404, "Тохируулсан жобг олдсонгүй")
    return {"ok": True, "cancelled": job.id}

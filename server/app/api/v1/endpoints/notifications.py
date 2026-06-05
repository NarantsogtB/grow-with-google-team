from datetime import date

from app.api.deps import Database
from app.repositories.patient_repo import PatientRepository
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

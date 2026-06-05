import logging

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.patient_repo import PatientRepository
from app.utils.telegram import send_telegram_message

logger = logging.getLogger(__name__)

_DEFAULT_MSG = "Эмч таны гэрт удахгүй очих болно. Бэлэн байхыг хүсье. 🏥"


async def bulk_send_reminders(db: AsyncSession, message: str | None = None) -> dict:
    """Send Telegram reminders to all patients that have a chat_id."""
    patients = await PatientRepository(db).get_with_telegram()
    sent = failed = 0
    for p in patients:
        text = message or f"Сайн байна уу, {p.full_name}! {_DEFAULT_MSG}"
        ok = await send_telegram_message(p.telegram_chat_id or "", text)
        if ok:
            sent += 1
        else:
            failed += 1
    logger.info(
        "Bulk reminders: sent=%d failed=%d total=%d", sent, failed, len(patients)
    )
    return {"sent": sent, "failed": failed, "total": len(patients)}

from app.api.deps import Database
from app.services.visit_service import handle_patient_reply
from app.utils.telegram import send_telegram_message
from fastapi import APIRouter, Request

router = APIRouter(prefix="/telegram", tags=["Telegram"])


@router.post("/webhook")
async def telegram_webhook(request: Request, db: Database):
    body = await request.json()
    message = body.get("message", {})
    chat_id = str(message.get("chat", {}).get("id", ""))
    text = message.get("text", "")
    if not chat_id or not text:
        return {"ok": True}
    reply = await handle_patient_reply(db, chat_id, text)
    await send_telegram_message(chat_id, reply)
    return {"ok": True}

from app.api.deps import Database
from app.repositories.patient_repo import PatientRepository
from app.services.visit_service import handle_patient_reply
from app.utils.telegram import send_telegram_message
from fastapi import APIRouter, Request

router = APIRouter(prefix="/telegram", tags=["Telegram"])


@router.post("/webhook")
async def telegram_webhook(request: Request, db: Database):
    body = await request.json()
    message = body.get("message", {})
    chat_id = str(message.get("chat", {}).get("id", ""))
    text = (message.get("text", "") or "").strip()
    if not chat_id or not text:
        return {"ok": True}

    if text.startswith("/start"):
        await send_telegram_message(
            chat_id,
            "Сайн байна уу! 👋\nТelegram холбохын тулд дараах командыг явуулна уу:\n\n/link <утасны дугаар>\n\nЖишээ: /link 99112233",
        )
        return {"ok": True}

    cmd_parts = text.split(maxsplit=1)
    cmd = cmd_parts[0].lower()
    if cmd == "/link" or cmd.startswith("/link@"):
        phone = cmd_parts[1].strip() if len(cmd_parts) > 1 else ""
        if not phone:
            await send_telegram_message(
                chat_id,
                "Утасны дугаараа оруулна уу.\nЖишээ: /link 99112233",
            )
            return {"ok": True}
        patient = await PatientRepository(db).get_by_phone(phone)
        if not patient:
            await send_telegram_message(
                chat_id,
                "❌ Тус утасны дугаартай өвчтөн олдсонгүй. Дугаараа шалгаад дахин оролдоно уу.",
            )
            return {"ok": True}
        await PatientRepository(db).update(patient, {"telegram_chat_id": chat_id})
        await send_telegram_message(
            chat_id,
            f"✅ {patient.full_name}, Telegram амжилттай холбогдлоо!\nЦаашид эмчийн айлчлалын өмнө энэ хаяг руу мэдэгдэл ирнэ.",
        )
        return {"ok": True}

    reply = await handle_patient_reply(db, chat_id, text)
    await send_telegram_message(chat_id, reply)
    return {"ok": True}

from sqlalchemy.orm import Session

from app.models.patients.patient_models import Patient
from app.controllers.visitations.visitation_controller import (
    confirm_by_token,
    cancel_by_token,
)
from app.utils.telegram_client import answer_callback_query


async def handle_telegram_update(db: Session, update: dict):
    # Empty payload үед test {"ok": True} хүлээж байгаа
    if not update:
        return {"ok": True}

    # 1. Patient /start хийсэн үед chat_id хадгалах
    if "message" in update:
        message = update["message"]
        chat = message.get("chat", {})
        text = message.get("text", "")

        chat_id = str(chat.get("id"))

        # Жишээ: /start patient_uuid
        if text.startswith("/start"):
            parts = text.split()

            if len(parts) == 2:
                patient_id = parts[1]

                patient = db.query(Patient).filter(Patient.id == patient_id).first()

                if patient:
                    patient.telegram_chat_id = chat_id
                    db.commit()

        return {"ok": True}

    # 2. Button дарсан үед confirm/cancel хийх
    if "callback_query" in update:
        callback = update["callback_query"]
        callback_id = callback["id"]
        data = callback.get("data", "")

        if data.startswith("confirm:"):
            token = data.replace("confirm:", "")
            confirm_by_token(db, token)

            await answer_callback_query(
                callback_id,
                "Таны гэрийн эргэлтийн хуваарь баталгаажлаа.",
            )

        elif data.startswith("cancel:"):
            token = data.replace("cancel:", "")
            cancel_by_token(db, token)

            await answer_callback_query(
                callback_id,
                "Таны гэрийн эргэлтийн хуваарь цуцлагдлаа.",
            )

        return {"ok": True}

    return {"ok": True}
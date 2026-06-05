import httpx

from app.config import settings

TELEGRAM_API_URL = "https://api.telegram.org/bot"


async def telegram_request(method: str, payload: dict):
    token = settings.telegram_bot_token

    if not token or "your_bot_token" in token:
        return {
            "ok": False,
            "skipped": True,
            "reason": "Telegram bot token is not configured",
        }

    url = f"{TELEGRAM_API_URL}{token}/{method}"

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.post(url, json=payload)
            response.raise_for_status()
            return response.json()
    except httpx.HTTPError as e:
        return {
            "ok": False,
            "error": str(e),
        }


async def send_visit_message(
    chat_id=None,
    patient_name=None,
    doctor_name=None,
    visit_date=None,
    visit_time=None,
    confirm_url=None,
    cancel_url=None,
    **kwargs,
):
    chat_id = chat_id or kwargs.get("telegram_chat_id")

    if not chat_id:
        return {
            "ok": False,
            "skipped": True,
            "reason": "Telegram chat id is missing",
        }

    text = (
        "Visit appointment created.\n\n"
        f"Patient: {patient_name or kwargs.get('patient_full_name', '')}\n"
        f"Doctor: {doctor_name or kwargs.get('doctor_full_name', '')}\n"
        f"Date: {visit_date or kwargs.get('date', '')}\n"
        f"Time: {visit_time or kwargs.get('time', '')}\n"
    )

    if confirm_url:
        text += f"\nConfirm: {confirm_url}"

    if cancel_url:
        text += f"\nCancel: {cancel_url}"

    payload = {
        "chat_id": chat_id,
        "text": text,
    }

    return await telegram_request("sendMessage", payload)


async def answer_callback_query(
    callback_query_id=None,
    text="OK",
    show_alert=False,
    **kwargs,
):
    callback_query_id = callback_query_id or kwargs.get("callback_query_id")

    if not callback_query_id:
        return {
            "ok": False,
            "skipped": True,
            "reason": "Callback query id is missing",
        }

    payload = {
        "callback_query_id": callback_query_id,
        "text": text,
        "show_alert": show_alert,
    }

    return await telegram_request("answerCallbackQuery", payload)
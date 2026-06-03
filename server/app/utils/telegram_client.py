import httpx
from app.config import settings


TELEGRAM_API_URL = "https://api.telegram.org/bot"


async def telegram_request(method: str, payload: dict):
    url = f"{TELEGRAM_API_URL}{settings.TELEGRAM_BOT_TOKEN}/{method}"

    async with httpx.AsyncClient(timeout=20) as client:
        response = await client.post(url, json=payload)

    response.raise_for_status()
    return response.json()


async def send_visit_message(
    chat_id: str,
    patient_name: str,
    visit_date: str,
    start_time: str,
    end_time: str,
    token: str,
):
    text = (
        f"Сайн байна уу, {patient_name}.\n\n"
        f"Таны гэрийн эргэлтийн хуваарь:\n"
        f"Огноо: {visit_date}\n"
        f"Цаг: {start_time} - {end_time}\n\n"
        f"Та гэртээ байх эсэхээ баталгаажуулна уу."
    )

    payload = {
        "chat_id": chat_id,
        "text": text,
        "reply_markup": {
            "inline_keyboard": [
                [
                    {
                        "text": "✅ Батлах",
                        "callback_data": f"confirm:{token}",
                    },
                    {
                        "text": "❌ Цуцлах",
                        "callback_data": f"cancel:{token}",
                    },
                ]
            ]
        },
    }

    return await telegram_request("sendMessage", payload)


async def answer_callback_query(callback_query_id: str, text: str):
    payload = {
        "callback_query_id": callback_query_id,
        "text": text,
    }

    return await telegram_request("answerCallbackQuery", payload)
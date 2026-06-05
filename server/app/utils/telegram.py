import httpx

from app.core.config import settings


async def send_telegram_message(chat_id: str, text: str) -> bool:
    if not settings.TELEGRAM_BOT_TOKEN:
        return False
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.post(
            f"https://api.telegram.org/bot{settings.TELEGRAM_BOT_TOKEN}/sendMessage",
            json={"chat_id": chat_id, "text": text},
        )
        return r.status_code == 200

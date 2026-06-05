import logging

import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)


async def send_telegram_message(chat_id: str, text: str) -> bool:
    """
    Send a Telegram message via the Bot API.

    Returns True on HTTP 200, False otherwise. Logs the reason for failure
    so silent drops are visible during operation.
    """
    if not settings.TELEGRAM_BOT_TOKEN:
        logger.warning("Telegram skipped: TELEGRAM_BOT_TOKEN is not configured")
        return False
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.post(
                f"https://api.telegram.org/bot{settings.TELEGRAM_BOT_TOKEN}/sendMessage",
                json={"chat_id": chat_id, "text": text},
            )
        if r.status_code != 200:
            logger.warning(
                "Telegram sendMessage failed for chat=%s status=%s body=%s",
                chat_id,
                r.status_code,
                r.text[:200],
            )
            return False
        return True
    except httpx.HTTPError as exc:
        logger.error("Telegram sendMessage network error for chat=%s: %s", chat_id, exc)
        return False

from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.controllers.telegram.telegram_controller import handle_telegram_update


router = APIRouter(prefix="/telegram", tags=["Telegram"])


@router.post("/webhook")
async def telegram_webhook(request: Request, db: Session = Depends(get_db)):
    body = await request.json()
    await handle_telegram_update(db, body)
    return {"ok": True}
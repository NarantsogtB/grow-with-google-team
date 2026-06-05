from fastapi import APIRouter, Body, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.controllers.telegram.telegram_controller import handle_telegram_update


router = APIRouter(prefix="/telegram", tags=["Telegram"])


@router.post("/webhook")
async def telegram_webhook(
    update: dict = Body(default={}),
    db: Session = Depends(get_db),
):
    return await handle_telegram_update(db, update)
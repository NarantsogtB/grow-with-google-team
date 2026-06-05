from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db

from app.schemas.visitations.visitation_schema import (
    VisitationCreate,
    VisitationResponse,
    VisitationUpdateStatus,
    VisitationUpdateSequence,
)

from app.controllers.visitations.visitation_controller import (
    create_visitation,
    get_visitations,
    get_visitation,
    update_visitation_status,
    update_visitation_sequence,
    confirm_by_token,
    cancel_by_token,
)


router = APIRouter(
    prefix="/visitations",
    tags=["Visitations"]
)


@router.post("/", response_model=VisitationResponse)
async def create(data: VisitationCreate, db: Session = Depends(get_db)):
    return await create_visitation(db, data)


@router.get("/", response_model=list[VisitationResponse])
def list_all(db: Session = Depends(get_db)):
    return get_visitations(db)


@router.get("/{visitation_id}", response_model=VisitationResponse)
def detail(visitation_id: UUID, db: Session = Depends(get_db)):
    return get_visitation(db, visitation_id)


@router.patch("/{visitation_id}/status", response_model=VisitationResponse)
def update_status(
    visitation_id: UUID,
    data: VisitationUpdateStatus,
    db: Session = Depends(get_db),
):
    return update_visitation_status(db, visitation_id, data.status)


@router.patch("/{visitation_id}/sequence", response_model=VisitationResponse)
def update_sequence(
    visitation_id: UUID,
    data: VisitationUpdateSequence,
    db: Session = Depends(get_db),
):
    return update_visitation_sequence(db, visitation_id, data.sequence_order)


@router.get("/public/confirm")
def confirm(token: str, db: Session = Depends(get_db)):
    confirm_by_token(db, token)
    return {"message": "Visit confirmed successfully"}


@router.get("/public/cancel")
def cancel(token: str, db: Session = Depends(get_db)):
    cancel_by_token(db, token)
    return {"message": "Visit canceled successfully"}
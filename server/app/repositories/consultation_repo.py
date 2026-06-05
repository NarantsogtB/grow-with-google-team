from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.consultation import Consultation
from app.repositories.base import BaseRepository


class ConsultationRepository(BaseRepository[Consultation]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(Consultation, db)

    async def get_by_doctor(
        self, doctor_id: UUID, page: int = 1, size: int = 20
    ) -> Tuple[List[Consultation], int]:
        offset = (page - 1) * size
        where = Consultation.doctor_id == doctor_id

        total = (
            await self.db.execute(
                select(func.count()).select_from(Consultation).where(where)
            )
        ).scalar()

        items = list(
            (
                await self.db.execute(
                    select(Consultation)
                    .where(where)
                    .order_by(Consultation.created_at.desc())
                    .offset(offset)
                    .limit(size)
                )
            )
            .scalars()
            .all()
        )
        return items, total

    async def get_all_paginated(
        self, page: int = 1, size: int = 20
    ) -> Tuple[List[Consultation], int]:
        offset = (page - 1) * size

        total = (
            await self.db.execute(select(func.count()).select_from(Consultation))
        ).scalar()

        items = list(
            (
                await self.db.execute(
                    select(Consultation)
                    .order_by(Consultation.created_at.desc())
                    .offset(offset)
                    .limit(size)
                )
            )
            .scalars()
            .all()
        )
        return items, total

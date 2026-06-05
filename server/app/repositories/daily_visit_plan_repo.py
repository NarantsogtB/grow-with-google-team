from datetime import date as DateType
from typing import List, Optional

from app.models.daily_visit_plan import DailyVisitPlan
from app.repositories.base import BaseRepository
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession


class DailyVisitPlanRepository(BaseRepository[DailyVisitPlan]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(DailyVisitPlan, db)

    async def get_by_date(self, date: DateType) -> List[DailyVisitPlan]:
        result = await self.db.execute(
            select(DailyVisitPlan)
            .where(DailyVisitPlan.date == date)
            .order_by(DailyVisitPlan.visit_order)
        )
        return list(result.scalars().all())

    async def get_pending_for_patient(
        self, patient_id: str, date: DateType
    ) -> Optional[DailyVisitPlan]:
        result = await self.db.execute(
            select(DailyVisitPlan).where(
                DailyVisitPlan.patient_id == patient_id,
                DailyVisitPlan.date == date,
                DailyVisitPlan.status == "pending",
            )
        )
        return result.scalar_one_or_none()

    async def get_active_by_date_doctor(
        self, date: DateType, doctor_id: str
    ) -> List[DailyVisitPlan]:
        result = await self.db.execute(
            select(DailyVisitPlan)
            .where(
                DailyVisitPlan.date == date,
                DailyVisitPlan.doctor_id == doctor_id,
                DailyVisitPlan.status != "declined",
            )
            .order_by(DailyVisitPlan.visit_order)
        )
        return list(result.scalars().all())

    async def update_status(self, plan_id, status: str) -> None:
        plan = await self.get_by_id(plan_id)
        if plan:
            plan.status = status
            await self.db.flush()

    async def update_order_and_time(self, plan_id, order: int, estimated_time) -> None:
        plan = await self.get_by_id(plan_id)
        if plan:
            plan.visit_order = order
            plan.estimated_time = estimated_time
            await self.db.flush()

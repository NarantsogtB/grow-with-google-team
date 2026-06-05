from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.controllers.doctor_weekly_schedules import (
    create_doctor_weekly_schedule, delete_doctor_weekly_schedule,
    get_doctor_weekly_schedule_by_id, get_doctor_weekly_schedules,
    get_doctor_weekly_schedules_by_doctor_id, update_doctor_weekly_schedule)
from app.database import get_db
from app.models.doctor_weekly_schedules import (DoctorWeeklyScheduleCreate,
                                                DoctorWeeklyScheduleResponse,
                                                DoctorWeeklyScheduleUpdate)

router = APIRouter(
    prefix="/doctor-weekly-schedules",
    tags=["Doctor Weekly Schedules"],
)


@router.post("/", response_model=DoctorWeeklyScheduleResponse)
def create_schedule(
    schedule_data: DoctorWeeklyScheduleCreate,
    db: Session = Depends(get_db),
):
    """
    Эмчийн 7 хоног бүр давтагдах гэрийн эргэлтийн хуваарь үүсгэнэ.
    """

    return create_doctor_weekly_schedule(db, schedule_data)


@router.get("/", response_model=list[DoctorWeeklyScheduleResponse])
def list_schedules(db: Session = Depends(get_db)):
    return get_doctor_weekly_schedules(db)


@router.get("/doctor/{doctor_id}", response_model=list[DoctorWeeklyScheduleResponse])
def list_schedules_by_doctor(
    doctor_id: UUID,
    db: Session = Depends(get_db),
):
    return get_doctor_weekly_schedules_by_doctor_id(db, doctor_id)


@router.get("/{schedule_id}", response_model=DoctorWeeklyScheduleResponse)
def get_schedule(
    schedule_id: UUID,
    db: Session = Depends(get_db),
):
    return get_doctor_weekly_schedule_by_id(db, schedule_id)


@router.put("/{schedule_id}", response_model=DoctorWeeklyScheduleResponse)
def update_schedule(
    schedule_id: UUID,
    schedule_data: DoctorWeeklyScheduleUpdate,
    db: Session = Depends(get_db),
):
    """
    Weekly schedule-ийн мэдээллийг засварлана.
    """

    return update_doctor_weekly_schedule(db, schedule_id, schedule_data)


@router.delete("/{schedule_id}")
def delete_schedule(
    schedule_id: UUID,
    db: Session = Depends(get_db),
):
    """
    Weekly schedule устгана.
    """

    return delete_doctor_weekly_schedule(db, schedule_id)

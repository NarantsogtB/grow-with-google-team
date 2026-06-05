from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.doctor_weekly_schedules import (DoctorWeeklySchedule,
                                                DoctorWeeklyScheduleCreate,
                                                DoctorWeeklyScheduleUpdate)
from app.models.doctors.doctor_models import Doctor


def get_doctor_weekly_schedules(db: Session):
    """
    Бүх weekly schedule-ийн жагсаалтыг авна.
    """

    return db.query(DoctorWeeklySchedule).all()


def get_doctor_weekly_schedule_by_id(
    db: Session,
    schedule_id: UUID,
):
    """
    ID-аар нэг weekly schedule хайж авна.
    """

    schedule = (
        db.query(DoctorWeeklySchedule)
        .filter(DoctorWeeklySchedule.id == schedule_id)
        .first()
    )

    if not schedule:
        raise HTTPException(
            status_code=404,
            detail="Doctor weekly schedule not found",
        )

    return schedule


def get_doctor_weekly_schedules_by_doctor_id(
    db: Session,
    doctor_id: UUID,
):
    """
    Тухайн эмчид хамаарах weekly schedule-үүдийг авна.
    """

    return (
        db.query(DoctorWeeklySchedule)
        .filter(DoctorWeeklySchedule.doctor_id == doctor_id)
        .all()
    )


def update_doctor_weekly_schedule(
    db: Session,
    schedule_id: UUID,
    schedule_data: DoctorWeeklyScheduleUpdate,
):
    """
    Weekly schedule-ийн мэдээллийг засварлана.
    """

    schedule = get_doctor_weekly_schedule_by_id(db, schedule_id)

    update_data = schedule_data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(schedule, field, value)

    db.commit()
    db.refresh(schedule)

    return schedule


def delete_doctor_weekly_schedule(
    db: Session,
    schedule_id: UUID,
):
    """
    Weekly schedule устгана.
    """

    schedule = get_doctor_weekly_schedule_by_id(db, schedule_id)

    db.delete(schedule)
    db.commit()

    return {
        "message": "Doctor weekly schedule deleted successfully",
    }


def create_doctor_weekly_schedule(
    db: Session,
    schedule_data: DoctorWeeklyScheduleCreate,
):
    """
    Эмчийн 7 хоног бүр давтагдах гэрийн эргэлтийн хуваарь үүсгэнэ.
    """

    doctor = db.query(Doctor).filter(Doctor.id == schedule_data.doctor_id).first()

    if not doctor:
        raise HTTPException(
            status_code=404,
            detail="Doctor not found",
        )

    new_schedule = DoctorWeeklySchedule(**schedule_data.model_dump())

    db.add(new_schedule)
    db.commit()
    db.refresh(new_schedule)

    return new_schedule

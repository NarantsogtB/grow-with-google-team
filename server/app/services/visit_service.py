import logging
from datetime import date as DateType
from datetime import datetime, time, timedelta, timezone

from app.repositories.daily_visit_plan_repo import DailyVisitPlanRepository
from app.repositories.patient_repo import PatientRepository
from app.tools.route_tools import haversine_km
from app.utils.telegram import send_telegram_message
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)
_UB = timezone(timedelta(hours=8))


async def send_day_before_confirmations(db: AsyncSession, visit_date: DateType) -> dict:
    plans = await DailyVisitPlanRepository(db).get_by_date(visit_date)
    sent = 0
    for plan in plans:
        if plan.status != "pending":
            continue
        patient = await PatientRepository(db).get_by_id(str(plan.patient_id))
        if not patient or not patient.telegram_chat_id:
            continue
        time_str = plan.estimated_time.strftime("%H:%M") if plan.estimated_time else "?"
        msg = (
            f"Сайн байна уу, {patient.full_name}!\n"
            f"Маргааш {time_str}-д эмч таны гэрт очих болно.\n"
            f"Та гэртээ байх боломжтой юу?\n"
            f"✅ Байна  ❌ Байхгүй гэж хариулна уу."
        )
        ok = await send_telegram_message(patient.telegram_chat_id or "", msg)
        if ok:
            sent += 1
    logger.info("Day-before confirmations sent: %d for date %s", sent, visit_date)
    return {"sent": sent, "date": str(visit_date)}


async def handle_patient_reply(db: AsyncSession, chat_id: str, text: str) -> str:
    patient = await PatientRepository(db).get_by_telegram_chat_id(chat_id)
    if not patient:
        return "Уучлаарай, таны мэдээлэл олдсонгүй."

    tomorrow = (datetime.now(_UB) + timedelta(days=1)).date()
    repo = DailyVisitPlanRepository(db)
    plan = await repo.get_pending_for_patient(str(patient.id), tomorrow)
    if not plan:
        return "Маргаашийн цаг товлолт олдсонгүй."

    intent = _parse_intent(text)
    if intent == "yes":
        await repo.update_status(plan.id, "confirmed")
        return "Баярлалаа! Баталгаажлаа. ✅"
    elif intent == "no":
        await repo.update_status(plan.id, "declined")
        await _recalculate_route(db, plan.date, str(plan.doctor_id))
        return "Ойлголоо. Цагийг шинэчилж байна."
    else:
        return "Уучлаарай, 'Байна' эсвэл 'Байхгүй' гэж хариулна уу."


def _parse_intent(text: str) -> str:
    t = text.lower().strip()
    YES = {"байна", "тийм", "ok", "болно", "ок", "yes", "за"}
    NO = {"байхгүй", "үгүй", "болохгүй", "no", "болдоггүй"}
    for w in YES:
        if w in t:
            return "yes"
    for w in NO:
        if w in t:
            return "no"
    return "unknown"


async def _recalculate_route(db: AsyncSession, visit_date: DateType, doctor_id: str) -> None:
    repo = DailyVisitPlanRepository(db)
    plans = await repo.get_active_by_date_doctor(visit_date, doctor_id)
    patients = [await PatientRepository(db).get_by_id(str(p.patient_id)) for p in plans]
    pairs = [(pl, pt) for pl, pt in zip(plans, patients) if pt and pt.latitude and pt.longitude]
    if len(pairs) <= 1:
        return

    ordered = _nearest_neighbor(pairs)
    first_plan = ordered[0][0]
    base_time = first_plan.estimated_time or time(9, 0)
    for i, (pl, _) in enumerate(ordered):
        new_time = (datetime.combine(visit_date, base_time) + timedelta(minutes=30 * i)).time()
        await repo.update_order_and_time(pl.id, i + 1, new_time)
    logger.info(
        "Route recalculated for doctor %s on %s: %d stops",
        doctor_id,
        visit_date,
        len(ordered),
    )


def _nearest_neighbor(pairs):
    if not pairs:
        return pairs
    result = [pairs[0]]
    remaining = list(pairs[1:])
    current_pt = pairs[0][1]

    while remaining:
        nearest = min(
            remaining,
            key=lambda pair: haversine_km(
                current_pt.latitude or 0.0,
                current_pt.longitude or 0.0,
                pair[1].latitude or 0.0,
                pair[1].longitude or 0.0,
            ),
        )
        result.append(nearest)
        remaining.remove(nearest)
        current_pt = nearest[1]

    return result

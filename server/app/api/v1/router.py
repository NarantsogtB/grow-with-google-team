# =============================================================================
# API V1 ROUTER — app/api/v1/router.py
# =============================================================================
# Aggregates all endpoint routers under the /api/v1 prefix.
#
# WHY VERSION THE API?
# When we need to make breaking changes (e.g., change response schema),
# we create /api/v2/ endpoints while keeping /api/v1/ working for existing
# clients. This lets the frontend upgrade gradually without forcing a
# simultaneous backend+frontend deployment.
#
# Current structure:
#   /api/v1/patients/   ← PatientService (register, login)
#   /api/v1/doctors/    ← DoctorRepository (CRUD)
#   /api/v1/hospitals/  ← HospitalRepository (CRUD)
#   /api/v1/schedules/  ← ScheduleService (weekly schedule templates)
#   /api/v1/agent/chat  ← LangGraph orchestrator (AI endpoint)
# =============================================================================

from app.api.v1.endpoints.agent import router as agent_router
from app.api.v1.endpoints.consultations import router as consultations_router
from app.api.v1.endpoints.doctors import router as doctors_router
from app.api.v1.endpoints.hospitals import router as hospitals_router
from app.api.v1.endpoints.notifications import router as notifications_router
from app.api.v1.endpoints.patients import router as patients_router
from app.api.v1.endpoints.schedules import router as schedules_router
from app.api.v1.endpoints.system import router as system_router
from app.api.v1.endpoints.telegram_webhook import router as telegram_router
from app.api.v1.endpoints.visit_plans import router as visit_plans_router
from fastapi import APIRouter

# The api_router is included in main.py with prefix="/api/v1"
api_router = APIRouter()

api_router.include_router(patients_router)
api_router.include_router(doctors_router)
api_router.include_router(hospitals_router)
api_router.include_router(schedules_router)
api_router.include_router(agent_router)
api_router.include_router(notifications_router)
api_router.include_router(telegram_router)
api_router.include_router(visit_plans_router)
api_router.include_router(consultations_router)
api_router.include_router(system_router)

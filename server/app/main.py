from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.utils.logger import get_logger

from app.routers.patients import router as patients_router
from app.routers import hospital_router
from app.routers.doctors import doctor_routers
from app.routers.doctor_weekly_schedules import router as doctor_weekly_schedule_router
from app.routers.visit_slots.visit_slot_router import router as visit_slot_router
from app.routers.visitations.visitation_router import router as visitation_router
from app.routers.telegram.telegram_router import router as telegram_router

logger = get_logger("app")


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    logger.info("Family medical Core API started")
    yield


app = FastAPI(title="Family medical Core API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Test compatibility routes
# /patients/
# /doctors/
# /hospitals/
app.include_router(patients_router, include_in_schema=False)
app.include_router(doctor_routers.router, include_in_schema=False)
app.include_router(hospital_router.router, include_in_schema=False)
app.include_router(doctor_weekly_schedule_router, include_in_schema=False)
app.include_router(visit_slot_router, include_in_schema=False)
app.include_router(visitation_router, include_in_schema=False)
app.include_router(telegram_router, include_in_schema=False)

# API v1 routes
# /api/v1/patients/
# /api/v1/doctors/
# /api/v1/hospitals/
app.include_router(patients_router, prefix="/api/v1")
app.include_router(doctor_routers.router, prefix="/api/v1")
app.include_router(hospital_router.router, prefix="/api/v1")
app.include_router(doctor_weekly_schedule_router, prefix="/api/v1")
app.include_router(visit_slot_router, prefix="/api/v1")
app.include_router(visitation_router, prefix="/api/v1")
app.include_router(telegram_router, prefix="/api/v1")

@app.get("/health")
def health_check():
    return {"message": "server is running", "status": "online", "version": "v1"}
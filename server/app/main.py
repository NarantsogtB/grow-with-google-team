from contextlib import asynccontextmanager

from fastapi import FastAPI
from app.database import Base, engine
from app.routers import patients
from app.routers import hospital_router
from app.routers.doctors import doctor_routers
from app.routers.doctor_weekly_schedules import router as doctor_weekly_schedule_router
from app.utils.logger import get_logger
from app.utils.logger import get_logger
from app.controllers.visit_slots.visit_slot_controller import router as visit_slot_router

logger = get_logger("app")


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    logger.info("Family medical Core API started")
    yield


app = FastAPI(title="Family medical Core API", lifespan=lifespan)

app.include_router(patients.router)
app.include_router(doctor_routers.router)
app.include_router(hospital_router.router)
app.include_router(doctor_weekly_schedule_router)
app.include_router(visit_slot_router)


@app.get("/health")
def health_check():
    return {"message": "server is running", "status": "online", "version": "v1"}

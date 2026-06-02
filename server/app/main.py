from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.routers.patients import router as patients_router
from app.routers import hospital_router
from app.routers.doctors import doctor_routers
from app.routers.doctor_weekly_schedules import router as doctor_weekly_schedule_router
from app.utils.logger import get_logger

logger = get_logger("app")


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    logger.info("Family medical Core API started")
    yield


app = FastAPI(title="Family medical Core API", lifespan=lifespan)

# 🌐 CORS Тохиргоо - Front - с хүсэлт хүлээж авахыг зөвшөөрөх хэсэг:
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # Front URL
    allow_credentials=True,
    allow_methods=["*"],  # GET, POST, OPTIONS, PUT, DELETE бүгдийг зөвшөөрнө
    allow_headers=["*"],  # Бүх header-ийг зөвшөөрнө
)

app.include_router(patients_router)
app.include_router(doctor_routers.router)
app.include_router(hospital_router.router)
app.include_router(doctor_weekly_schedule_router)


@app.get("/health")
def health_check():
    return {"message": "server is running", "status": "online", "version": "v1"}
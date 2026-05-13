from contextlib import asynccontextmanager

from fastapi import FastAPI

from app import models
from app.database import Base, engine
from app.routers import patients
from app.utils.logger import get_logger


logger = get_logger("app")


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    logger.info("Family medical Core API started")
    yield


app = FastAPI(title="Family medical Core API", lifespan=lifespan)

app.include_router(patients.router)


@app.get("/health")
def health_check():
    return {"message": "server is running", "status": "online", "version": "v1"}
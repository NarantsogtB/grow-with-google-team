from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.utils.logger import logger
from app.routers.doctors import doctor_routers
from app.database import Base, engine




@asynccontextmanager
async def lifespan(_app: FastAPI):
    Base.metadata.create_all(bind=engine)
    logger.info("Family medical Core API started")
    yield


app=FastAPI(title="Family medical Core API", lifespan=lifespan)

app.include_router(doctor_routers.router)

@app.get("/health")
def helth_check():
    return {"message":"server is running", "status":"online", "version":"v1"} 
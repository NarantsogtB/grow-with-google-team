from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.utils.logger import get_logger
from app.database import Base, engine

logger=get_logger("app")


@asynccontextmanager
async def lifespan(_app: FastAPI):
    Base.metadata.create_all(bind=engine)
    logger.info("Family medical Core API started")
    yield


app=FastAPI(title="Family medical Core API", lifespan=lifespan)

@app.get("/")
def helth_check():
    return {"message":"server is running", "status":"online", "version":"v1"} 
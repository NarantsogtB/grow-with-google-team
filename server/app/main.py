from fastapi import FastAPI
from app.utils.logger import get_logger
from app.database import Base, engine

logger=get_logger("app")
Base.metadata.create_all(bind=engine)


app=FastAPI(title="Family medical Core API")

logger.info("Family medical Core API started")

@app.get("/")
def helth_check():
    return {"message":"server is running", "status":"online", "version":"v1"} 
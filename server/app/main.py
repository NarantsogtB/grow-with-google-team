from fastapi import FastAPI

app=FastAPI()

@app.get("/")
def helth_check():
    return {"message":"server is running", "status":"online", "version":"v1"} 
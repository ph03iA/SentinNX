import joblib
from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Dict
import pandas as pd
import os

class Features(BaseModel):
    features: List[Dict[str, int]]

class Feature(BaseModel):
    feature: Dict[str, int]

model_path = os.path.join(os.path.dirname(__file__), '..', 'models', 'model.pkl')
model_path = os.path.abspath(model_path)

EXPECTED_FEATURES = ["status", "size", "method", "path", "user_agent", "hour_of_day"]

model = joblib.load(model_path)
app = FastAPI(title="SentinNX ML API", description="NGINX Anomaly Detection API")

@app.get("/")
async def root():
    return {"message": "SentinNX ML server is running", "status": "healthy"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.post("/predict")
async def predict_batch(input: Features):
    """Predict anomalies for multiple log entries"""
    df = pd.DataFrame(input.features)
    df = df.astype("int")
    df = df[EXPECTED_FEATURES]
    preds = model.predict(df)
    results = [{"anomaly": bool(pred == -1)} for pred in preds]
    return results

@app.post("/predict_one")
async def predict_one(input: Feature):
    """Predict anomaly for a single log entry"""
    df = pd.DataFrame([input.feature])
    df = df.astype("int")
    df = df[EXPECTED_FEATURES]
    preds = model.predict(df)
    results = [{"anomaly": bool(preds[0] == -1)}]
    return results

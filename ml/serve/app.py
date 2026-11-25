"""FastAPI microservice serving the exact scikit-learn pipeline trained by ml/train.py.

    pip install -r ml/serve/requirements.txt
    python3 ml/train.py                 # creates ml/serve/model.joblib
    uvicorn app:app --app-dir ml/serve --port 8000
"""
import sys
from pathlib import Path

import joblib
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from textnorm import norm  # noqa: E402

MODEL_PATH = Path(__file__).with_name("model.joblib")
if not MODEL_PATH.exists():
    raise SystemExit("model.joblib missing - run `python3 ml/train.py` first")
M = joblib.load(MODEL_PATH)

app = FastAPI(title="Indic Scam Shield - ML service", version="1.0.0")


class Item(BaseModel):
    text: str = Field(min_length=3, max_length=2000)


class Batch(BaseModel):
    texts: list[str] = Field(min_length=1, max_length=200)


def predict(texts: list[str]):
    X = [norm(t[:2000]) for t in texts]
    p = M["binary_clf"].predict_proba(M["binary_vec"].transform(X))[:, 1]
    types = M["type_clf"].predict(M["type_vec"].transform(X))
    return [{"p_scam": round(float(a), 4), "label": "scam" if a >= 0.5 else "legit", "scam_type": t if a >= 0.35 else None}
            for a, t in zip(p, types)]


@app.get("/health")
def health():
    return {"status": "ok", "features": len(M["binary_vec"].vocabulary_), "stores_data": False}


@app.post("/predict")
def predict_one(item: Item):
    return predict([item.text])[0]


@app.post("/predict/batch")
def predict_batch(b: Batch):
    if any(len(t) < 3 for t in b.texts):
        raise HTTPException(422, "every text needs at least 3 characters")
    return predict(b.texts)

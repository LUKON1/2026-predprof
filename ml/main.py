import os
import io
import json
import joblib
import numpy as np
from fastapi import FastAPI, HTTPException, UploadFile, File
from pydantic import BaseModel
import librosa
import tensorflow as tf

# Load model and class mapping on startup
MODEL_PATH = "alien_model.h5"
CLASS_MAPPING_PATH = "class_mapping.json"
HISTORY_PATH = "history.json"
TRAIN_COUNTS_PATH = "train_counts.json"
SCALER_PATH = "scaler.pkl"

model = tf.keras.models.load_model(MODEL_PATH)
scaler = joblib.load(SCALER_PATH)

with open(CLASS_MAPPING_PATH, "r", encoding="utf-8") as f:
    class_mapping = json.load(f)

with open(HISTORY_PATH, "r") as f:
    training_history = json.load(f)

with open(TRAIN_COUNTS_PATH, "r") as f:
    train_counts = json.load(f)

app = FastAPI(title="Alien Audio Classification ML Service")

class ClassProbability(BaseModel):
    class_name: str
    probability: float

class PredictResponse(BaseModel):
    predicted_class: str
    class_index: int
    confidence: float
    top_5_classes: list[ClassProbability]
    filename: str

class MetaResponse(BaseModel):
    history: dict
    train_counts: dict
    num_classes: int


def extract_single_features(audio_data: bytes, sr: int = 22050) -> np.ndarray:
    """Extract 40 MFCC features with normalization."""
    file_obj = io.BytesIO(audio_data)
    y, sr_loaded = librosa.load(file_obj, sr=sr)
    
    if np.max(np.abs(y)) > 0:
        y = y / np.max(np.abs(y))
        
    # BACK TO 40 MFCC
    mfcc = librosa.feature.mfcc(y=y, sr=sr_loaded, n_mfcc=40)
    return np.mean(mfcc.T, axis=0)


@app.get("/health")
def health_check():
    return {"status": "ok", "model_loaded": True}


@app.post("/predict", response_model=PredictResponse)
async def predict(file: UploadFile = File(...)):
    contents = await file.read()

    try:
        features = extract_single_features(contents)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Error: {e}")

    input_tensor = scaler.transform(np.expand_dims(features, axis=0))
    predictions = model.predict(input_tensor, verbose=0)[0]

    top_5_indices = np.argsort(predictions)[-5:][::-1]
    top_5_classes = [
        ClassProbability(
            class_name=class_mapping.get(str(idx), f"Class_{idx}"),
            probability=float(predictions[idx])
        )
        for idx in top_5_indices
    ]

    class_index = int(top_5_indices[0])
    confidence = float(predictions[class_index])
    class_name = class_mapping.get(str(class_index), f"Class_{class_index}")

    return PredictResponse(
        predicted_class=class_name,
        class_index=class_index,
        confidence=confidence,
        top_5_classes=top_5_classes,
        filename=file.filename
    )


@app.get("/meta", response_model=MetaResponse)
def get_meta():
    return MetaResponse(
        history=training_history,
        train_counts=train_counts,
        num_classes=len(class_mapping)
    )

import os
import io
import uuid
import numpy as np
from fastapi import FastAPI, HTTPException, UploadFile, File
from pydantic import BaseModel
import librosa

# import tensorflow as tf
# model = tf.keras.models.load_model('model.h5')

app = FastAPI(title="Alien Audio Classification ML Service")

class PredictResponse(BaseModel):
    prediction: int    # Восстановленный класс
    confidence: float  # Уверенность нейросети
    filename: str      # Имя обработанного файла

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "Audio ML Service is running"}

@app.post("/predict", response_model=PredictResponse)
async def predict(file: UploadFile = File(...)):
    """
    Эндпоинт принимает аудиофайл (wav/mp3), 
    обрабатывает его через librosa и прогоняет через нейросеть.
    """
    if not file.filename.endswith(('.wav', '.mp3', '.ogg')):
        raise HTTPException(status_code=400, detail="Только аудиофайлы .wav, .mp3, .ogg")

    temp_path = f"temp_{uuid.uuid4()}_{file.filename}"
    
    try:
        # 1. Сохраняем загруженный файл на диск
        contents = await file.read()
        with open(temp_path, "wb") as f:
            f.write(contents)
            
        # 2. Обработка звука (извлечение MFCC признаков)
        # y, sr = librosa.load(temp_path, sr=22050, duration=3) # Читаем 3 секунды звука
        # mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=20)   # Получаем матрицу
        # feature_vector = np.mean(mfcc.T, axis=0)             # Усредняем (для простой нейросети)
        
        # 3. Предсказание (раскомментировать, когда будет модель)
        # tf_input = np.expand_dims(feature_vector, axis=0) # Форма (1, 20) для Keras
        # predictions = model.predict(tf_input)
        # predicted_class = np.argmax(predictions, axis=1)[0] + 1 # +1 если классы от 1
        # confidence = float(np.max(predictions))
        
        # --- ФЕЙКОВАЯ ЛОГИКА (УДАЛИТЬ ПОСЛЕ ОБУЧЕНИЯ) ---
        predicted_class = np.random.randint(1, 10)
        confidence = float(np.random.uniform(0.7, 0.99))
        # --------------------------------------------------------

        return PredictResponse(
            prediction=predicted_class,
            confidence=confidence,
            filename=file.filename
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Уборка мусора
        if os.path.exists(temp_path):
            os.remove(temp_path)

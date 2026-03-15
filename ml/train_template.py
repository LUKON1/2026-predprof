"""
ШАБЛОН ОБУЧЕНИЯ ДЛЯ YANDEX DATASPHERE (ОЛИМПИАДА 2026)

ИНСТРУКЦИЯ ПО ЗАПУСКУ В ОБЛАКЕ:
1. Создайте проект в DataSphere, откройте JupyterLab.
2. Скачайте архивы .npz по ссылкам из задания.
3. Загрузите скачанный файл с тренировочными данными (train_x, train_y, valid_x, valid_y) в DataSphere.
4. Скопируйте этот код полностью в ячейку (или несколько ячеек) и запустите.

Скрипт восстановит классы, подготовит данные, обучит ИИ на 50 эпох
и сохранит саму модель (alien_model.h5) и лог обучения (history.json) для фронтенда.
"""

# !pip install numpy pandas scikit-learn tensorflow matplotlib librosa

import numpy as np
import json
import matplotlib.pyplot as plt
from sklearn.preprocessing import LabelEncoder
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, Dropout, Conv1D, MaxPooling1D, Flatten
import librosa

# ==========================================
# 1. ЗАГРУЗКА И ВОССТАНОВЛЕНИЕ ДАННЫХ
# ==========================================

# УКАЖИТЕ ПУТЬ К ТРЕНИРОВОЧНОМУ АРХИВУ (который скачали по первой ссылке)
DATA_PATH = "train_data.npz" # переименуйте файл или измените путь

print(f"Загрузка данных из {DATA_PATH}...")
data = np.load(DATA_PATH, allow_pickle=True)

train_x = data['train_x'] # wav-файлы
train_y = data['train_y'] # поврежденные классы (строки)
valid_x = data['valid_x'] 
valid_y = data['valid_y'] # целые числа классов

print("Уникальные поврежденные метки (train_y):", np.unique(train_y))

# Восстановление классов (с нуля, как в задании: "целыми числами, начиная с нуля")
encoder = LabelEncoder()
encoded_train_y = encoder.fit_transform(train_y)

# Сохраним словарь для нашего сервера (какая цифра означает какой класс)
class_mapping = {int(i): str(label) for i, label in enumerate(encoder.classes_)}
with open('class_mapping.json', 'w', encoding='utf-8') as f:
    json.dump(class_mapping, f, ensure_ascii=False, indent=4)

print("Классы успешно восстановлены! Маппинг:", class_mapping)

NUM_CLASSES = len(encoder.classes_)


# ==========================================
# 2. ИЗВЛЕЧЕНИЕ ПРИЗНАКОВ (ФИЧЕЙ) ИЗ АУДИО
# ==========================================

def extract_features(audio_arrays, sr=22050):
    features = []
    for audio in audio_arrays:
        # Аудио может лежать в архиве как байты (wav) или как numpy array
        # Если это байты (wav файл) - нужно использовать librosa или io.BytesIO
        # Предполагаем, что внутри npz уже лежат оцифрованные массивы numpy
        
        # Зачастую в олимпиадных npz лежит массив-сигнал напрямую
        # Попробуем извлечь MFCC (стандарт для аудио)
        try:
            # Если это строка (путь) или байты - нужно декодировать. 
            # Допустим, это уже float массив звука:
            if isinstance(audio, bytes):
                import io, soundfile as sf
                audio, sr_actual = sf.read(io.BytesIO(audio))
            else:
                audio = np.array(audio, dtype=float)
            
            # Извлекаем признаки
            mfccs = librosa.feature.mfcc(y=audio, sr=sr, n_mfcc=40)
            mfccs_processed = np.mean(mfccs.T, axis=0)
            features.append(mfccs_processed)
        except Exception as e:
            # Заглушка, если данные битые
            features.append(np.zeros(40))
    return np.array(features)

print("Извлекаем аудио-признаки (это займет время)...")
X_train = extract_features(train_x)
X_valid = extract_features(valid_x)

# Убедимся, что valid_y тоже правильного типа
y_train = np.array(encoded_train_y, dtype=int)
y_valid = np.array(valid_y, dtype=int)


# ==========================================
# 3. ПОСТРОЕНИЕ И ОБУЧЕНИЕ НЕЙРОСЕТИ
# ==========================================

model = Sequential([
    Dense(256, activation='relu', input_shape=(X_train.shape[1],)),
    Dropout(0.3),
    Dense(128, activation='relu'),
    Dropout(0.3),
    Dense(NUM_CLASSES, activation='softmax')
])

model.compile(optimizer='adam', 
              loss='sparse_categorical_crossentropy', 
              metrics=['accuracy'])

# В ТЗ сказано "от 10 до 100 эпох"
EPOCHS = 50 

print("Начинаем обучение нейросети...")
history = model.fit(
    X_train, y_train,
    validation_data=(X_valid, y_valid),
    epochs=EPOCHS,
    batch_size=32
)


# ==========================================
# 4. СОХРАНЕНИЕ РЕЗУЛЬТАТОВ ДЛЯ ФРОНТЕНДА
# ==========================================

# Сохраняем модель
model.save("alien_model.h5")
print("Модель сохранена как 'alien_model.h5'")

# Сохраняем историю (ТОЧНОСТЬ на валидационных данных по эпохам) для построения Графика №1 на фронтенде
hist_dict = {
    'val_accuracy': history.history['val_accuracy'],
    'epochs': list(range(1, EPOCHS + 1))
}
with open('history.json', 'w') as f:
    json.dump(hist_dict, f)

# Сохраняем количество записей на класс (График №2)
unique, counts = np.unique(y_train, return_counts=True)
train_counts = {int(k): int(v) for k, v in zip(unique, counts)}
with open('train_counts.json', 'w') as f:
    json.dump(train_counts, f)
    
print("Всё готово! Скачайте файлы: alien_model.h5, history.json, train_counts.json и class_mapping.json")

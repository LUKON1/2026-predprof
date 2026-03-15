"""
Шаблон для обучения нейросети (Классификация инопланетных звуков).

Задание с олимпиады (Легенда):
1. Классификация сигналов (аудио, вероятно .wav файлы).
2. Классы в датасете повреждены - вместо чисел написаны нечитаемые строки. 
   Сказано: "Восстановить обозначения классов. Классы обозначались целыми числами, начиная с единицы."
3. Обучить нейросеть от 10 до 100 эпох.

Этот код можно скопировать в Yandex DataSphere (Jupyter Notebook).
"""

# %% [1] Установка библиотек (в облаке)
# !pip install librosa pandas numpy scikit-learn tensorflow matplotlib seaborn

# %% [2] Импорты
import os
import pandas as pd
import numpy as np
import librosa
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, Dropout, Conv1D, MaxPooling1D, Flatten

# %% [3] ЗАДАЧА №1: Восстановление классов
# Предположим, у нас есть `metadata.csv` со столбцами: `filename`, `damaged_class_name`
df = pd.read_csv('metadata.csv') # Поменяйте на имя вашего файла!

# Выводим уникальные поврежденные строки
print("Поврежденные классы:", df['damaged_class_name'].unique())

# Кодируем строки в числа с помощью LabelEncoder
encoder = LabelEncoder()
encoded_labels = encoder.fit_transform(df['damaged_class_name'])

# Так как по заданию сказано "классы от 1", прибавляем единицу:
df['real_class_id'] = encoded_labels + 1

# Сохраним словарь для перевода "строка -> число" на всякий случай
class_mapping = dict(zip(encoder.classes_, encoder.transform(encoder.classes_) + 1))
print("Восстановленные классы (карта):", class_mapping)

# Для нейросети (Tensorflow) нужны классы от 0 до N-1, поэтому сохраним и их:
df['tf_class_id'] = encoded_labels 

# %% [4] Извлечение MFCC (фичей) из аудиофайлов
AUDIO_DIR = 'data/audio/' # Поменяйте на вашу папку со звуками
features = []
labels = []

print("Извлекаем фичи. Это может занять время...")
for index, row in df.iterrows():
    file_path = os.path.join(AUDIO_DIR, row['filename'])
    
    try:
        # Загружаем аудио (усредняем каналы)
        y, sr = librosa.load(file_path, sr=22050, duration=3) # можно ограничить время
        
        # Получаем Мел-частотные кепстральные коэффициенты (MFCC) - стандарт для голоса/звуков
        mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=40)
        
        # Усредняем матрицу по времени, получаем вектор из 40 чисел для каждого файла (самый простой подход)
        mfcc_scaled = np.mean(mfcc.T, axis=0)
        
        features.append(mfcc_scaled)
        labels.append(row['tf_class_id'])
    except Exception as e:
        print(f"Ошибка чтения {file_path}: {e}")

X = np.array(features)
y = np.array(labels)

num_classes = len(np.unique(y))
print(f"Готово! X shape: {X.shape}, y shape: {y.shape}. Классов: {num_classes}")

# %% [5] Разделение на train / test
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# %% [6] Создание нейросети (Простая полносвязная)
# Можно улучшить, добавив Conv1D, если не усреднять MFCC, а подавать как картинку 2D. 
model = Sequential([
    Dense(256, activation='relu', input_shape=(X_train.shape[1],)),
    Dropout(0.3),
    Dense(128, activation='relu'),
    Dropout(0.3),
    Dense(64, activation='relu'),
    Dense(num_classes, activation='softmax') # softmax для мульти-классификации
])

model.compile(optimizer='adam', 
              loss='sparse_categorical_crossentropy', 
              metrics=['accuracy'])

model.summary()

# %% [7] Обучение (по условию: от 10 до 100 эпох)
EPOCHS = 50 
history = model.fit(
    X_train, y_train, 
    epochs=EPOCHS, 
    batch_size=32, 
    validation_data=(X_test, y_test)
)

# %% [8] Построение графиков Обучения (Это требует задание (23% баллов) - Data Visualization)
plt.figure(figsize=(12, 4))

# График точности
plt.subplot(1, 2, 1)
plt.plot(history.history['accuracy'], label='Train Accuracy')
plt.plot(history.history['val_accuracy'], label='Val Accuracy')
plt.title('Точность (Accuracy)')
plt.legend()

# График потерь
plt.subplot(1, 2, 2)
plt.plot(history.history['loss'], label='Train Loss')
plt.plot(history.history['val_loss'], label='Val Loss')
plt.title('Функция потерь (Loss)')
plt.legend()

plt.show() # Сохраните графики для презентации!

# %% [9] Сохранение модели для переноса на MERN-сервер
model.save("alien_audio_model.h5")
print("Модель alien_audio_model.h5 успешно сохранена! Скопируйте её в папку ml вашего Docker проекта.")
# Чтобы загрузить её в FastAPI, используйте: model = tf.keras.models.load_model('alien_audio_model.h5')

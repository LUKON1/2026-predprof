"""
Training script for Yandex DataSphere (Olympiad 2026) - SIMPLIFIED STABLE VERSION

Instructions:
1. Upload Data.npz to DataSphere project files.
2. Copy this entire script into one cell and run it.
3. After completion, download 5 files:
   alien_model.h5, scaler.pkl, history.json, train_counts.json, class_mapping.json
"""

import re
import io
import json
import joblib
import numpy as np
import librosa
from sklearn.preprocessing import LabelEncoder, StandardScaler
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, Dropout
from tensorflow.keras.callbacks import EarlyStopping

# ==========================================
# 1. LOAD AND CLEAN DATA
# ==========================================

DATA_PATH = "Data.npz"

print(f"Loading data from {DATA_PATH}...")
data = np.load(DATA_PATH, allow_pickle=True)

train_x = data['train_x']
train_y = data['train_y']
valid_x = data['valid_x']
valid_y = data['valid_y']

def clean_label(label):
    # Remove hex prefix
    return re.sub(r'^[0-9a-f]{32,}', '', str(label)).strip('_').strip()

clean_train_y = np.array([clean_label(l) for l in train_y])
clean_valid_y = np.array([clean_label(l) for l in valid_y])

all_labels = np.concatenate([clean_train_y, clean_valid_y])
encoder = LabelEncoder()
encoder.fit(all_labels)

encoded_train_y = encoder.transform(clean_train_y)
encoded_valid_y = encoder.transform(clean_valid_y)

class_mapping = {int(i): str(label) for i, label in enumerate(encoder.classes_)}
with open('class_mapping.json', 'w', encoding='utf-8') as f:
    json.dump(class_mapping, f, ensure_ascii=False, indent=4)

NUM_CLASSES = len(encoder.classes_)
print(f"Dataset ready. Classes: {NUM_CLASSES}")


# ==========================================
# 2. FEATURE EXTRACTION (20 MFCC)
# ==========================================

def extract_features(audio_arrays, sr=22050):
    """Extract 20 MFCC features with peak normalization."""
    features = []
    total = len(audio_arrays)
    for i, audio in enumerate(audio_arrays):
        try:
            y = np.array(audio, dtype=float).flatten()
            if len(y) < 10: raise ValueError("Short")
            
            # Normalize signal amplitude
            if np.max(np.abs(y)) > 0:
                y = y / np.max(np.abs(y))

            # BACK TO 20 MFCC (As requested)
            mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=20)
            mfcc_scaled = np.mean(mfcc.T, axis=0)
            features.append(mfcc_scaled)

        except Exception:
            try:
                file_obj = io.BytesIO(bytes(audio))
                y, sr_loaded = librosa.load(file_obj, sr=sr)
                if np.max(np.abs(y)) > 0: y = y / np.max(np.abs(y))
                mfcc = librosa.feature.mfcc(y=y, sr=sr_loaded, n_mfcc=20)
                mfcc_scaled = np.mean(mfcc.T, axis=0)
                features.append(mfcc_scaled)
            except Exception:
                features.append(np.zeros(20))

        if (i + 1) % 500 == 0:
            print(f"  Processed {i+1}/{total}...")

    return np.array(features)


print("\nExtracting features (20 MFCC)...")
X_train = extract_features(train_x)
X_valid = extract_features(valid_x)

# Scaling
scaler = StandardScaler()
X_train = scaler.fit_transform(X_train)
X_valid = scaler.transform(X_valid)
print("Features normalized.")


# ==========================================
# 3. SIMPLIFIED MODEL ARCHITECTURE
# ==========================================

model = Sequential([
    Dense(128, activation='relu', input_shape=(X_train.shape[1],)),
    Dropout(0.5), # High dropout to prevent memorizing
    Dense(64, activation='relu'),
    Dropout(0.3),
    Dense(NUM_CLASSES, activation='softmax')
])

model.compile(
    optimizer='adam',
    loss='sparse_categorical_crossentropy',
    metrics=['accuracy']
)

early_stop = EarlyStopping(
    monitor='val_loss', 
    patience=15, 
    restore_best_weights=True,
    verbose=1
)

print("\nStarting training (Simplified Model)...")
history = model.fit(
    X_train, encoded_train_y,
    validation_data=(X_valid, encoded_valid_y),
    epochs=100,
    batch_size=16, # Smaller batch size for better generalization
    callbacks=[early_stop]
)

actual_epochs = len(history.history['accuracy'])


# ==========================================
# 4. SAVE
# ==========================================

model.save("alien_model.h5")
joblib.dump(scaler, 'scaler.pkl')

hist_dict = {
    'accuracy': history.history['accuracy'],
    'val_accuracy': history.history['val_accuracy'],
    'loss': history.history['loss'],
    'val_loss': history.history['val_loss'],
    'epochs': list(range(1, actual_epochs + 1))
}
with open('history.json', 'w') as f:
    json.dump(hist_dict, f)

unique, counts = np.unique(encoded_train_y, return_counts=True)
train_counts = {class_mapping[int(k)]: int(v) for k, v in zip(unique, counts)}
with open('train_counts.json', 'w') as f:
    json.dump(train_counts, f)

print("\nDone! All files generated.")

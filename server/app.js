const express = require('express');
const cors = require('cors');
const axios = require('axios');
const multer = require('multer');
const FormData = require('form-data');
require('dotenv').config();

const apiRoutes = require('./routes/api');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const connectDB = require('./db');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Настройка Multer для сохранения файлов во временную память сервера
const upload = multer({ storage: multer.memoryStorage() });

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', apiRoutes);

// Проксирование загруженного аудио-файла от клиента к Python ML микросервису
app.post('/api/ml/predict-audio', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ detail: 'Не загружен аудиофайл (Поле формы должно называться `audio`)' });
    }

    // В docker-compose ml сервис называется 'ml-service'
    const pythonApiUrl = process.env.ML_SERVICE_URL || 'http://ml-service:8000/predict';
    
    // Упаковываем файл в класс FormData для отправки на Python (FastAPI ожидает multipart/form-data)
    const form = new FormData();
    form.append('file', req.file.buffer, { filename: req.file.originalname });
    
    // Пересылаем файл в питон
    const response = await axios.post(pythonApiUrl, form, {
      headers: { ...form.getHeaders() }
    });
    
    // Возвращаем результат клиенту
    res.status(200).json(response.data);
  } catch (error) {
    console.error('Ошибка вызова ML сервиса:', error.message);
    const statusCode = error.response ? error.response.status : 500;
    const errorData = error.response ? error.response.data : { detail: 'ML Service Unavailable' };
    res.status(statusCode).json(errorData);
  }
});

// Проксирование метаданных обучения (графики)
app.get('/api/ml/meta', async (req, res) => {
  try {
    const pythonMetaUrl = process.env.ML_META_URL || 'http://ml-service:8000/meta';
    const response = await axios.get(pythonMetaUrl);
    res.status(200).json(response.data);
  } catch (error) {
    console.error('Ошибка получения меты:', error.message);
    res.status(500).json({ detail: 'ML Metadata Unavailable' });
  }
});

// Тестовый эндпоинт для проверки здоровья
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

module.exports = app;

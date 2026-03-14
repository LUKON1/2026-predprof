const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./db');
const apiRoutes = require('./routes/api');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', apiRoutes);

// Тестовый эндпоинт для проверки здоровья
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

module.exports = app;

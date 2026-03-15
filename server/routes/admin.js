const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { verifyAdmin } = require('../middleware/auth');

// Создание нового пользователя админом
router.post('/users', verifyAdmin, async (req, res) => {
  try {
    const { firstName, lastName, login, password, role } = req.body;
    
    // Проверяем, существует ли логин
    const existingUser = await User.findOne({ login });
    if (existingUser) {
      return res.status(400).json({ error: 'Пользователь с таким логином уже существует' });
    }

    // Хэшируем пароль
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser = new User({
      firstName,
      lastName,
      login,
      password: hashedPassword,
      role: role || 'user'
    });

    const savedUser = await newUser.save();
    
    res.status(201).json({
      message: 'Пользователь успешно создан',
      user: {
        id: savedUser._id,
        firstName: savedUser.firstName,
        lastName: savedUser.lastName,
        login: savedUser.login,
        role: savedUser.role
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера при создании пользователя' });
  }
});

// Получение списка пользователей (опционально, полезно для админа)
router.get('/users', verifyAdmin, async (req, res) => {
  try {
    const users = await User.find({}, '-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера при получении пользователей' });
  }
});

module.exports = router;

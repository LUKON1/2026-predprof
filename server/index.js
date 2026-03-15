const app = require('./app');
const connectDB = require('./db');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

const PORT = process.env.PORT || 5000;

// Функция для создания админа по умолчанию
const seedAdmin = async () => {
  try {
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await User.create({
        firstName: 'Главный',
        lastName: 'Администратор',
        login: 'admin',
        password: hashedPassword,
        role: 'admin'
      });
      console.log('Администратор создан (login: admin, password: admin123)');
    }
  } catch (err) {
    console.error('Ошибка инициализации админа:', err);
  }
};

// Подключение к MongoDB
connectDB().then(async () => {
  await seedAdmin();
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});


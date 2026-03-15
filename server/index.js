const app = require('./app');
const connectDB = require('./db');

const PORT = process.env.PORT || 5000;

// Подключение к MongoDB
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});



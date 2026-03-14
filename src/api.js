import axios from 'axios';

// Базовый инстанс Axios
const api = axios.create({
  // В Docker-окружении nginx проксирует /api/ на бэкенд
  // Локально можно использовать baseURL: 'http://localhost:5000/api' для запуска без Docker 
  // (зависит от того, как развернуто)
  baseURL: '/api',
  timeout: 5000,
});

// Интерцептор для добавления токена авторизации (заготовка)
api.interceptors.request.use(
  (config) => {
    // const token = localStorage.getItem('token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Интерцептор ответов для глобальной обработки ошибок
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Обработка 401 ошибки (например, выход пользователя)
    if (error.response && error.response.status === 401) {
      console.warn('Unauthorized, redirecting to login...');
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

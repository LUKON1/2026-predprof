# Сборка
FROM node:18-alpine AS build

WORKDIR /app
COPY package*.json ./
# Используем legacy-peer-deps из-за конфликтов react19 с некоторыми плагинами vite, если они есть
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build

# Nginx для раздачи статики
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
# Копируем наш кастомный конфиг, если потребуется
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

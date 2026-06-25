FROM node:18-slim

# Установка зависимостей
WORKDIR /app
COPY backend/package*.json ./
RUN npm install --production

# Копирование кода
COPY backend/ .

# Создание директории для БД
RUN mkdir -p /data

# Переменные окружения
ENV NODE_ENV=production
ENV PORT=3001

# Открытие порта
EXPOSE 3001

# Запуск
CMD ["node", "server.js"]

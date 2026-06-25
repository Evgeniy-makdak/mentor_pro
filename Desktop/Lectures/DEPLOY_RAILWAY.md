# 🚀 Деплой Backend на Railway (бесплатно)

## Шаг 1: Регистрация
1. Перейдите на https://railway.app
2. Войдите через GitHub

## Шаг 2: Создание проекта
1. Нажмите **"New Project"**
2. Выберите **"Deploy from GitHub repo"**
3. Выберите репозиторий `mentor_pro`

## Шаг 3: Настройка
1. В настройках сервиса укажите:
   - **Root Directory:** `backend`
   - **Start Command:** `npm start`

2. Добавьте переменные окружения (Variables):
   ```
   PORT=3001
   JWT_SECRET=mentor_pro_secret_key_2024
   DB_PATH=./database.db
   NODE_ENV=production
   ```

## Шаг 4: Деплой
1. Нажмите **"Deploy"**
2. Дождитесь завершения (2-3 минуты)
3. Скопируйте URL сервиса (например: `https://mentor-pro-production.up.railway.app`)

## Шаг 5: Обновление frontend
1. В файле `frontend/.env.production` замените URL:
   ```env
   REACT_APP_API_URL=https://ваш-сервис.up.railway.app
   ```

2. Задеплойте frontend:
   ```bash
   cd frontend
   npm run deploy
   ```

## Шаг 6: Проверка
Откройте https://evgeniy-makdak.github.io/mentor_pro/ и войдите как admin/admin

---

## ⚙️ Альтернативы Railway:

### Render (render.com)
- Бесплатный тариф с ограничениями
- Аналогичная настройка

### Vercel (vercel.com)
- Создайте файл `backend/vercel.json`:
```json
{
  "version": 2,
  "builds": [{ "src": "server.js", "use": "@vercel/node" }],
  "routes": [{ "src": "/(.*)", "dest": "server.js" }]
}
```
- Задеплойте: `vercel --prod`

### Heroku (heroku.com)
- Классический хостинг
- Требует привязки карты даже для бесплатного тарифа

# Инструкция по деплою Backend для продакшена

## Важно!
GitHub Pages поддерживает только статические файлы (frontend). Backend на Node.js нужно деплоить отдельно.

## Вариант 1: Railway (рекомендуется)

1. Зарегистрируйтесь на https://railway.app
2. Создайте новый проект → Deploy from GitHub repo
3. Выберите репозиторий `mentor_pro`
4. В настройках укажите:
   - Root Directory: `backend`
   - Start Command: `npm start`
5. Добавьте переменные окружения:
   - `PORT=3001`
   - `JWT_SECRET=your_secret_key_here`
   - `DB_PATH=./database.db`
6. После деплоя скопируйте URL (например: `https://mentor-pro-production.up.railway.app`)

## Вариант 2: Render

1. Зарегистрируйтесь на https://render.com
2. New → Web Service
3. Подключите репозиторий GitHub
4. Настройки:
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`
5. Добавьте переменные окружения (Environment Variables)

## Вариант 3: Vercel

1. Установите Vercel CLI: `npm i -g vercel`
2. В папке backend создайте `vercel.json`:
```json
{
  "version": 2,
  "builds": [{ "src": "server.js", "use": "@vercel/node" }],
  "routes": [{ "src": "/(.*)", "dest": "server.js" }]
}
```
3. Задеплойте: `vercel --prod`

---

## После деплоя Backend:

1. Обновите `frontend/.env.production`:
```env
REACT_APP_API_URL=https://your-backend-url.com
```

2. Перезадеплойте frontend:
```bash
cd frontend
npm run deploy
```

3. Проверьте работу CORS в backend/server.js (должно быть):
```javascript
app.use(cors({
  origin: ['https://evgeniy-makdak.github.io', 'http://localhost:3000'],
  credentials: true
}));
```

## Тестирование

После настройки проверьте:
1. Авторизацию с мобильного устройства
2. Загрузку файлов
3. Все API запросы через консоль браузера (F12)

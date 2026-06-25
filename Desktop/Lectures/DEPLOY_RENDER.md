# 🚀 ДЕПЛОЙ НА RENDER.COM (БЕСПЛАТНО)

## ⏱️ Время: 3-5 минут

---

## ШАГ 1: Регистрация

1. Перейдите на **https://render.com**
2. Нажмите **"Get Started for Free"**
3. Войдите через **GitHub** (кнопка "Sign up with GitHub")
4. Разрешите доступ к репозиториям

---

## ШАГ 2: Создайте сервис

1. Нажмите **"+ New"** → **"Web Service"**
2. Выберите **"Connect a repository"**
3. Найдите репозиторий: **`Evgeniy-makdak/mentor_pro`**
4. Нажмите **"Connect"**

---

## ШАГ 3: Настройте

Заполните поля:

| Поле | Значение |
|------|----------|
| **Name** | `mentor-pro-backend` |
| **Region** | Frankfurt (Germany) |
| **Branch** | `main` |
| **Root Directory** | `backend` |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Instance Type** | **Free** |

---

## ШАГ 4: Переменные окружения

Прокрутите вниз до **"Environment Variables"** → **"Add Environment Variable"**:

```
JWT_SECRET = mentor_pro_secret_render_2024
DB_PATH = ./database.db
NODE_ENV = production
PORT = 3001
```

---

## ШАГ 5: Database Disk (для SQLite)

Прокрутите до **"Disks"** → **"Add Disk"**:

```
Name: mentor-pro-db
Mount Path: /backend
Size: 1 GB
```

---

## ШАГ 6: Запуск

1. Нажмите **"Create Web Service"**
2. Дождитесь деплоя (2-3 минуты)
3. Скопируйте URL (вида: `https://mentor-pro-backend-xyz.onrender.com`)

---

## ШАГ 7: Обновите frontend

1. Откройте `frontend/.env.production`:
   ```env
   REACT_APP_API_URL=https://ваш-сервис.onrender.com
   ```

2. Закоммитьте и запушьте:
   ```bash
   git add frontend/.env.production
   git commit -m "Update API URL for Render backend"
   git push origin main
   ```

3. Frontend автоматически обновится на GitHub Pages

---

## ШАГ 8: Проверка

Откройте: **https://evgeniy-makdak.github.io/mentor_pro/**

Войдите: **admin** / **admin**

---

## ⚠️ Важно для Render:

### Первый запуск медленный
На бесплатном тарифе сервис "засыпает" после 15 минут бездействия.
Первый запрос после простоя может занимать **30-50 секунд** — это нормально!

### Автопробуждение
Чтобы сервис не засыпал, можно использовать:
- https://cron-job.org (бесплатные ping-запросы каждые 10 минут)
- https://uptimerobot.com (бесплатный мониторинг)

---

## 💰 Тарифы Render

- **Бесплатно:** 750 часов/месяц (хватит для одного сервиса)
- **Платно:** от $7/месяц за более быстрые инстансы

---

## 🔧 Если не работает:

### Ошибка CORS
Добавьте URL Render в CORS настройки (`backend/server.js`):
```javascript
app.use(cors({
  origin: ['https://evgeniy-makdak.github.io', 'https://ваш-сервис.onrender.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### База данных не сохраняется
Убедитесь, что Disk подключён правильно:
- Mount Path: `/backend`
- Файл БД будет по пути `/backend/database.db`

---

## 📞 Поддержка

Render имеет хорошую документацию:
- https://render.com/docs
- https://community.render.com

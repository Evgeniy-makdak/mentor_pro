# 🚀 ПОШАГОВЫЙ ДЕПЛОЙ BACKEND НА RAILWAY

## ⏱️ Время: 5-7 минут

---

## ШАГ 1: Откройте Railway

1. Перейдите на **https://railway.app**
2. Нажмите **"Start a New Project"** (или **"Login"** если уже зарегистрированы)
3. Войдите через **GitHub** (кнопка "Continue with GitHub")

---

## ШАГ 2: Создайте проект

1. Нажмите **"+ New Project"**
2. Выберите **"Deploy from GitHub repo"**
3. Нажмите **"Configure GitHub App"** если Railway просит доступ
4. Найдите и выберите репозиторий: **`Evgeniy-makdak/mentor_pro`**
5. Нажмите **"Deploy Now"**

---

## ШАГ 3: Настройте backend

1. В появившемся сервисе нажмите на карточку сервиса
2. Перейдите во вкладку **"Settings"** (настройки)
3. Прокрутите до **"Root Directory"** и укажите:
   ```
   backend
   ```
4. **Start Command** уже должен быть: `npm start`

---

## ШАГ 4: Добавьте переменные окружения

1. В том же разделе **Settings** найдите **"Variables"**
2. Нажмите **"Add Variable"** и добавьте по очереди:

   | Имя | Значение |
   |-----|----------|
   | `JWT_SECRET` | `mentor_pro_secret_2024_random_string_xyz` |
   | `DB_PATH` | `./database.db` |
   | `NODE_ENV` | `production` |

3. **PORT** не обязательно — Railway назначит автоматически

---

## ШАГ 5: Запустите деплой

1. Вернитесь на вкладку **"Deployments"**
2. Railway автоматически начнёт сборку
3. Дождитесь зелёного статуса **"SUCCESS"** (2-3 минуты)
4. Скопируйте URL сервиса (кнопка **"Generate Domain"** или в разделе **"Settings → Domains"**)
   
   Пример: `https://mentor-pro-production.up.railway.app`

---

## ШАГ 6: Обновите frontend

1. Откройте файл `frontend/.env.production` в репозитории
2. Замените URL на ваш из Railway:
   ```env
   REACT_APP_API_URL=https://ваш-сервис.up.railway.app
   ```
3. Закоммитьте изменения:
   ```bash
   git add frontend/.env.production
   git commit -m "Update API URL for Railway backend"
   git push
   ```
4. Frontend автоматически задеплоится на GitHub Pages

---

## ШАГ 7: Проверьте работу

1. Откройте: **https://evgeniy-makdak.github.io/mentor_pro/**
2. Войдите: **admin** / **admin**
3. Если работает — ✅ УСПЕХ!

---

## 🔧 Если что-то не работает:

### Ошибка CORS
В консоли браузера (F12) видите ошибку CORS?

1. Откройте `backend/server.js`
2. Найдите строку с `cors()` и добавьте ваш URL:
   ```javascript
   app.use(cors({
     origin: ['https://evgeniy-makdak.github.io', 'https://ваш-domain.railway.app'],
     credentials: true,
     methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
     allowedHeaders: ['Content-Type', 'Authorization']
   }));
   ```
3. Закоммитьте и запушьте изменения

### База данных пуста
При первом запуске создастся новая БД. Логин по умолчанию:
- **Логин:** `admin`
- **Пароль:** `admin`

### Сервис не запускается
Проверьте логи во вкладке **"Deployments"** → кликните на последнюю сборку → **"View Logs"**

---

## 💰 Тарифы Railway

- **Бесплатно:** $5 кредитов в месяц (хватит для тестов)
- **Pay as you go:** $0.0000041667 за секунду работы (~$5/месяц для небольшого проекта)

---

## 📞 Поддержка

Если возникли проблемы:
1. Проверьте логи в Railway
2. Убедитесь, что все переменные окружения добавлены
3. Проверьте CORS настройки

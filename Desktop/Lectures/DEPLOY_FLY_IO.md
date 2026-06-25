# 🚀 ДЕПЛОЙ BACKEND НА FLY.IO (БЕСПЛАТНО НАВСЕГДА)

## ⏱️ Время: 10-15 минут

---

## 📋 Что нужно:

1. **Аккаунт Fly.io** — регистрация бесплатна
2. **Git** — уже установлен на вашем Mac
3. **Node.js 18+** — уже есть
4. **Кредитная карта** — для верификации (но бесплатно!)

---

## ШАГ 1: Установка Fly CLI

Откройте **Terminal** и выполните:

```bash
brew install flyctl
```

Если Homebrew не установлен:
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

---

## ШАГ 2: Регистрация в Fly.io

1. Откройте в браузере: **https://fly.io**
2. Нажмите **"Sign Up"**
3. Войдите через **GitHub**
4. Подтвердите email

5. В терминале выполните:
```bash
fly auth signup
```

Или авторизуйтесь через CLI:
```bash
fly auth login
```

Браузер откроет страницу для входа.

---

## ШАГ 3: Верификация карты

1. Перейдите в **Account Settings** → **Billing**
2. Добавьте карту (Visa/Mastercard)
3. Это **бесплатно** — с вас не спишут деньги
4. Fly.io верифицирует карту ($0 транзакция)

---

## ШАГ 4: Настройка проекта

1. Откройте проект в терминале:
```bash
cd /Users/admin/Desktop/Lectures
```

2. Перейдите в папку backend:
```bash
cd backend
```

3. Инициализируйте проект Fly.io:
```bash
fly launch
```

4. Отвечайте на вопросы:
```
? App Name (автоматически): mentor-pro-production
? Select regions: iad (Washington DC) - нажмите Enter
? Would you like to setup a database now? No
? Would you like to deploy now? Yes
```

---

## ШАГ 5: Настройка переменных окружения

```bash
# JWT секрет
fly secrets set JWT_SECRET="mentor_pro_secret_railway_2024"

# Путь к БД
fly secrets set DB_PATH="./database.db"

# Окружение
fly secrets set NODE_ENV="production"
```

---

## ШАГ 6: Деплой

```bash
# Запуск деплоя
fly deploy
```

Дождитесь окончания (2-5 минут). Вы увидите:
```
Deployed to https://mentor-pro-production.fly.dev
```

---

## ШАГ 7: Проверка

1. Откройте в браузере:
```bash
fly apps open
```

2. Или вручную:
```
https://mentor-pro-production.fly.dev
```

3. Проверьте API:
```
https://mentor-pro-production.fly.dev/api/auth/me
```

---

## ШАГ 8: Обновление frontend

1. Скопируйте URL: `https://mentor-pro-production.fly.dev`

2. Обновите `frontend/.env.production`:
```env
REACT_APP_API_URL=https://mentor-pro-production.fly.dev
```

3. Закоммитьте и запушьте:
```bash
cd /Users/admin/Desktop/Lectures
git add frontend/.env.production
git commit -m "Update API URL for Fly.io backend"
git push origin main
```

4. Frontend обновится автоматически на GitHub Pages

---

## ШАГ 9: ФИНАЛЬНАЯ ПРОВЕРКА

Откройте с **любого устройства**:
```
https://evgeniy-makdak.github.io/mentor_pro/
```

Логин: **admin**  
Пароль: **admin**

---

## 📊 Мониторинг

### Посмотреть логи:
```bash
fly logs
```

### Посмотреть статус:
```bash
fly status
```

### Перезапустить:
```bash
fly deploy --restart
```

---

## 💰 Стоимость

### ✅ Бесплатно навсегда:
- **3 маленькие VM** (512 МБ RAM, 1 CPU)
- **До 3 сервисов**
- **5 ГБ диск**

### Что включено:
- ✅ Бессрочный бесплатный тариф
- ✅ Автоматический деплой из GitHub
- ✅ SSL сертификат
- ✅ Глобальный CDN

---

## 🛠️ Решение проблем

### Ошибка: "Error failed to fetch definition"
```bash
fly deploy --local-only
```

### Сервис не запускается
```bash
fly logs --tail
```

### База данных пуста
При первом запуске создастся новая БД с admin/admin.

### CORS ошибка
Проверьте, что в `backend/server.js` CORS настроен правильно:
```javascript
app.use(cors({
  origin: ['https://evgeniy-makdak.github.io', 'https://mentor-pro-production.fly.dev'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

---

## 🔧 Дополнительные команды

### Масштабирование (если нужно):
```bash
fly scale memory 1024  # 1 ГБ RAM
fly scale count 2      # 2 экземпляра
```

### Просмотр ресурсов:
```bash
fly status
fly ps
```

### Удаление сервиса:
```bash
fly apps destroy mentor-pro-production
```

---

## 📞 Поддержка

- Документация: https://fly.io/docs/
- Discord: https://discord.gg/flyio
- GitHub Issues: https://github.com/superfly/flyctl/issues

---

## 🎉 ГОТОВО!

Поздравляем! Ваш backend работает на Fly.io бесплатно навсегда! 🚀

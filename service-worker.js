/* eslint-disable no-restricted-globals */

const CACHE_NAME = 'mentor-pro-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/static/js/main.js',
  '/static/css/main.css'
];

// Установка service worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch((err) => {
        console.log('Cache install failed:', err);
      })
  );
  self.skipWaiting();
});

// Активация service worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Обработка запросов - сеть с возвратом к кэшу
self.addEventListener('fetch', (event) => {
  // Не кэшируем API запросы
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return new Response(JSON.stringify({ error: 'Нет соединения с сервером' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          });
        })
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Клонируем ответ для кэширования
        const responseToCache = response.clone();
        caches.open(CACHE_NAME)
          .then((cache) => {
            cache.put(event.request, responseToCache);
          });
        return response;
      })
      .catch(() => {
        // Возвращаем из кэша если нет сети
        return caches.match(event.request)
          .then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Для навигации возвращаем index.html
            if (event.request.mode === 'navigate') {
              return caches.match('/index.html');
            }
          });
      })
  );
});

// Обработка push уведомлений (будущая функциональность)
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Mentor Pro';
  const options = {
    body: data.body || 'Новое уведомление',
    icon: '/logo192.png',
    badge: '/logo192.png'
  };
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

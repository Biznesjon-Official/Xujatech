// XUJATECH POS Service Worker
const CACHE_NAME = 'xujatech-pos-v3'; // Versiya yangilandi
const OFFLINE_URL = '/offline.html';

// Keshlanadigan statik resurslar
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/icons/favicon.svg',
  '/icons/icon-192x192.svg',
  '/icons/icon-512x512.svg',
];

// O'rnatish - statik resurslarni keshlash
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Statik resurslar keshlanmoqda');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Faollashtirish - eski keshlarni tozalash
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Eski kesh o\'chirilmoqda:', name);
            return caches.delete(name);
          })
      );
    })
  );
  self.clients.claim();
});

// Fetch - so'rovlarni boshqarish
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Development rejimida keshni bypass qilish
  if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
    // Faqat offline.html va manifest.json ni keshlash
    if (url.pathname === '/offline.html' || url.pathname === '/manifest.json') {
      event.respondWith(cacheFirst(request));
      return;
    }
    // Boshqa barcha so'rovlar - to'g'ridan-to'g'ri network
    return;
  }

  // API so'rovlari - Network First
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Statik resurslar - Cache First
  if (
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'image' ||
    request.destination === 'font'
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // HTML sahifalar - Network First with Offline Fallback
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstWithOffline(request));
    return;
  }

  // Boshqa so'rovlar - Network First
  event.respondWith(networkFirst(request));
});

// Cache First strategiyasi
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log('[SW] Fetch xatosi:', error);
    return new Response('Offline', { status: 503 });
  }
}

// Network First strategiyasi
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    // Faqat GET so'rovlarini keshlash (POST, PUT, DELETE keshlanmaydi)
    if (response.ok && request.method === 'GET') {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // Faqat GET so'rovlari uchun keshdan qaytarish
    if (request.method === 'GET') {
      const cached = await caches.match(request);
      if (cached) {
        return cached;
      }
    }
    return new Response(JSON.stringify({ error: 'Offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Network First with Offline Fallback
async function networkFirstWithOffline(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    // Offline sahifani ko'rsatish
    const offlinePage = await caches.match(OFFLINE_URL);
    if (offlinePage) {
      return offlinePage;
    }
    return new Response('Offline', { status: 503 });
  }
}

// Background Sync - Offline savdolarni sinxronlash
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-sales') {
    event.waitUntil(syncOfflineSales());
  }
});

async function syncOfflineSales() {
  try {
    // IndexedDB dan offline savdolarni olish va serverga yuborish
    console.log('[SW] Offline savdolar sinxronlanmoqda...');
    // Bu yerda IndexedDB bilan ishlash logikasi bo'ladi
  } catch (error) {
    console.error('[SW] Sinxronlash xatosi:', error);
  }
}

// Push Notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
    },
    actions: data.actions || [],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'XUJATECH POS', options)
  );
});

// Notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

console.log('[SW] Service Worker yuklandi');

const CACHE_VERSION = 'v2';
const CACHE_NAME = `glimmer-${CACHE_VERSION}`;
const ASSETS = [
  './',
  './index.html',
  './app.js',
  './data.js',
  './sw-register.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Install: cache static assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

// Activate: clean up old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => 
      Promise.all(
        keys.filter(key => key.startsWith('glimmer-') && key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: cache-first for static assets
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      
      return fetch(e.request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return response;
      }).catch(() => {
        if (e.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
        return undefined;
      });
    })
  );
});

const CACHE_VERSION = 'v1';
const CACHE_NAME = `glimmer-${CACHE_VERSION}`;
const ASSETS = [
  './',
  './index.html',
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

// Fetch: cache-first for static assets, network-first for API
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  
  // Skip non-GET requests and API calls
  if (e.request.method !== 'GET') return;
  
  // Network-first for API requests (always fresh)
  if (url.pathname.includes('/api/') || url.pathname.includes('/chat/')) {
    e.respondWith(
      fetch(e.request)
        .then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }
  
  // Cache-first for static assets
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
        // Fallback to index.html for navigation requests
        if (e.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
        return undefined;
      });
    })
  );
});

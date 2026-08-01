self.addEventListener('install', (e) => {
  console.log('[Service Worker] Installed');
});

self.addEventListener('fetch', (e) => {
  // Pass-through fetch for offline/online handling
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});
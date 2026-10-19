self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Let non-GET or browser extension requests pass through normally
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Return valid network response
        return networkResponse;
      })
      .catch(async () => {
        // If offline or network drop, check cache
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }

        // SPA Navigation Fallback for routes like /pantry
        if (event.request.mode === 'navigate') {
          const indexFallback = await caches.match('/index.html');
          if (indexFallback) {
            return indexFallback;
          }
        }

        // Guaranteed fallback Response object so respondWith never receives undefined
        return new Response('Network connection offline', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: new Headers({ 'Content-Type': 'text/plain' })
        });
      })
  );
});
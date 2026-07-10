/* ARMA PWA SERVICE WORKER V01 */
const ARMA_SW_VERSION = 'arma-pwa-v01-20260710';
const ARMA_STATIC_CACHE = `${ARMA_SW_VERSION}-static`;
const ARMA_PAGE_CACHE = `${ARMA_SW_VERSION}-pages`;

const ARMA_OFFLINE_URL = './offline.html';
const ARMA_STATIC_ASSETS = [
  './offline.html',
  './pwa-icon-192.png',
  './pwa-icon-512.png',
  './pwa-icon-maskable-512.png',
  './apple-touch-icon.png',
  './manifest.webmanifest'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(ARMA_STATIC_CACHE)
      .then(cache => cache.addAll(ARMA_STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key.startsWith('arma-pwa-') &&
            key !== ARMA_STATIC_CACHE &&
            key !== ARMA_PAGE_CACHE)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

async function armaNetworkFirst(request) {
  try {
    const response = await fetch(request, { cache: 'no-store' });
    if (response && response.ok) {
      const cache = await caches.open(ARMA_PAGE_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;

    const mainCached = await caches.match('./main.html');
    if (mainCached) return mainCached;

    return caches.match(ARMA_OFFLINE_URL);
  }
}

async function armaStaleWhileRevalidate(request) {
  const cached = await caches.match(request);
  const networkPromise = fetch(request)
    .then(async response => {
      if (response && response.ok) {
        const cache = await caches.open(ARMA_STATIC_CACHE);
        await cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);

  return cached || networkPromise || Response.error();
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // El backend de Apps Script siempre debe consultarse en línea.
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate' ||
      request.destination === 'document' ||
      url.pathname.endsWith('.html')) {
    event.respondWith(armaNetworkFirst(request));
    return;
  }

  if (['image', 'style', 'script', 'font'].includes(request.destination) ||
      /\.(png|jpg|jpeg|webp|gif|svg|ico|css|js|webmanifest)$/i.test(url.pathname)) {
    event.respondWith(armaStaleWhileRevalidate(request));
  }
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

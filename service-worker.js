/* A.R.M.A. PWA SERVICE WORKER V04.2 - PUBLIC EXTERNAL BROWSER */
const ARMA_SW_VERSION = 'arma-pwa-v04-2-public-external-browser-20260711';
const ARMA_STATIC_CACHE = `${ARMA_SW_VERSION}-static`;
const ARMA_PAGE_CACHE = `${ARMA_SW_VERSION}-pages`;

const ARMA_SCOPE_PATH = '/ot-mantenimiento/';
const ARMA_OFFLINE_URL = './offline.html';
const ARMA_NAV_INJECTION =
  '<script src="/ot-mantenimiento/arma-pwa-navigation.js" ' +
  'defer data-arma-pwa-navigation="1"></script>';

const ARMA_STATIC_ASSETS = [
  './offline.html',
  './arma-pwa-navigation.js',
  './arma-avatar-192.png',
  './arma-avatar-512.png',
  './arma-avatar-maskable-512.png',
  './arma-avatar-apple-180.png',
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
          .filter(key =>
            key.startsWith('arma-pwa-') &&
            key !== ARMA_STATIC_CACHE &&
            key !== ARMA_PAGE_CACHE
          )
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

function armaIsHtmlResponse(response) {
  if (!response) return false;

  const contentType = response.headers.get('content-type') || '';
  return contentType.toLowerCase().includes('text/html');
}

async function armaInjectNavigation(response) {
  if (!response || !response.ok || !armaIsHtmlResponse(response)) {
    return response;
  }

  const html = await response.text();

  if (
    html.includes('data-arma-pwa-navigation="1"') ||
    html.includes("data-arma-pwa-navigation='1'")
  ) {
    return new Response(html, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    });
  }

  const injected = /<\/head>/i.test(html)
    ? html.replace(/<\/head>/i, `${ARMA_NAV_INJECTION}</head>`)
    : `${ARMA_NAV_INJECTION}${html}`;

  const headers = new Headers(response.headers);
  headers.delete('content-length');
  headers.delete('content-encoding');

  return new Response(injected, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

async function armaNetworkFirstPage(request) {
  try {
    const networkResponse = await fetch(request, { cache: 'no-store' });
    const preparedResponse = await armaInjectNavigation(networkResponse);

    if (preparedResponse && preparedResponse.ok) {
      const cache = await caches.open(ARMA_PAGE_CACHE);
      await cache.put(request, preparedResponse.clone());
    }

    return preparedResponse;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;

    const mainRequest = new Request(
      `${self.location.origin}${ARMA_SCOPE_PATH}main.html`
    );
    const mainCached = await caches.match(mainRequest);
    if (mainCached) return mainCached;

    return caches.match(ARMA_OFFLINE_URL);
  }
}

async function armaStaleWhileRevalidate(request) {
  const cached = await caches.match(request);

  const networkPromise = fetch(request, { cache: 'no-store' })
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

  // Apps Script y otros orígenes siempre se consultan directamente.
  if (url.origin !== self.location.origin) return;

  if (!url.pathname.startsWith(ARMA_SCOPE_PATH)) return;

  if (
    request.mode === 'navigate' ||
    request.destination === 'document' ||
    url.pathname.endsWith('.html')
  ) {
    event.respondWith(armaNetworkFirstPage(request));
    return;
  }

  if (
    ['image', 'style', 'script', 'font'].includes(request.destination) ||
    /\.(png|jpg|jpeg|webp|gif|svg|ico|css|js|webmanifest)$/i.test(url.pathname)
  ) {
    event.respondWith(armaStaleWhileRevalidate(request));
  }
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

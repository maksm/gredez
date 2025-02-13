importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js');

const VERSION = 'v1';
const CACHE_NAME = `gredez-${VERSION}`;

// Use the latest workbox strategies
workbox.setConfig({ debug: false });

// Cache the Google Fonts stylesheets with a stale-while-revalidate strategy.
workbox.routing.registerRoute(
  /^https:\/\/cdn\.jsdelivr\.net\/npm\/bootstrap/,
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'bootstrap-cache',
  })
);

// Cache ARSO meteorological images with stale-while-revalidate
workbox.routing.registerRoute(
  /^https:\/\/meteo\.arso\.gov\.si\/uploads\/probase\/www\/(observ|forecast)/,
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'weather-images-cache',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 24 * 60 * 60, // 24 hours
      }),
      new workbox.cacheableResponse.CacheableResponsePlugin({
        statuses: [0, 200], // Also cache opaque responses (CORS)
      }),
    ],
  })
);

// Cache static assets
workbox.precaching.precacheAndRoute([
  { url: '/gredez/', revision: VERSION },
  { url: '/gredez/index.html', revision: VERSION },
  { url: '/gredez/radar.html', revision: VERSION },
  { url: '/gredez/aladin.html', revision: VERSION },
  { url: '/gredez/epsgram.html', revision: VERSION },
  { url: '/gredez/blitz.html', revision: VERSION },
  { url: '/gredez/gefs.html', revision: VERSION },
  { url: '/gredez/css/styles.css', revision: VERSION },
  { url: '/gredez/js/app.js', revision: VERSION },
  { url: '/gredez/manifest.webmanifest', revision: VERSION }
]);

// Fallback for navigation requests
workbox.routing.registerRoute(
  ({ request }) => request.mode === 'navigate',
  async () => {
    try {
      return await workbox.strategies.NetworkFirst({
        cacheName: 'pages-cache',
        plugins: [
          new workbox.expiration.ExpirationPlugin({
            maxEntries: 25,
          }),
        ],
      }).handle(arguments);
    } catch (error) {
      return caches.match('/gredez/index.html');
    }
  }
);

// Background sync for failed image requests
const bgSyncPlugin = new workbox.backgroundSync.BackgroundSyncPlugin('failed-images-queue', {
  maxRetentionTime: 24 * 60 // Retry for up to 24 hours
});

// Register a route for image requests that handles offline failures
workbox.routing.registerRoute(
  ({request}) => request.destination === 'image',
  new workbox.strategies.NetworkFirst({
    cacheName: 'images-cache',
    plugins: [
      bgSyncPlugin,
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
      }),
    ],
  })
);

// Add an offline fallback page
self.addEventListener('install', (event) => {
  const offlinePage = new Response(
    `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Offline - GreDež</title>
        <style>
          body { font-family: system-ui; padding: 2rem; text-align: center; }
          .offline-message { margin: 2rem 0; }
        </style>
      </head>
      <body>
        <h1>GreDež - Trenutno brez povezave</h1>
        <div class="offline-message">
          <p>Trenutno ste brez povezave z internetom. Prikazani bodo zadnji shranjeni podatki.</p>
        </div>
      </body>
    </html>
    `,
    {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    }
  );

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      cache.put('/gredez/offline.html', offlinePage);
    })
  );
});

// Add offline page to precache
workbox.precaching.precacheAndRoute([
  { url: '/gredez/offline.html', revision: VERSION }
]);

// Skip waiting and notify clients to update
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

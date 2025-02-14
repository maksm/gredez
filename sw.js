importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js');

const VERSION = 'v3';
const ENSEMBLE_VERSION = '1';
const CACHE_NAME = `gredez-${VERSION}`;
const ENSEMBLE_CACHE = `gredez-ensemble-${ENSEMBLE_VERSION}`;
const STATIC_CACHE = `gredez-static-${VERSION}`;
const IMAGE_CACHE = `gredez-images-${VERSION}`;
const API_CACHE = `gredez-api-${VERSION}`;

// Use the latest workbox strategies
workbox.setConfig({ debug: false });

// Cache CDN resources
workbox.routing.registerRoute(
  /^https:\/\/cdn\.jsdelivr\.net\/npm\/bootstrap/,
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'bootstrap-cache',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxAgeSeconds: 7 * 24 * 60 * 60, // 1 week
      }),
      new workbox.cacheableResponse.CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

// Update intervals and coherence requirements
const DATA_CONFIG = {
  // Direct observations
  'weatherSat_si_pda.png': { 
    interval: 15 * 60 * 1000,    // 15 min
    type: 'observation'
  },
  'si0_zm_pda_latest.gif': {
    interval: 10 * 60 * 1000,    // 10 min - radar
    type: 'observation'
  },
  'nwcsaf_ct_pda_latest.gif': {
    interval: 15 * 60 * 1000,    // 15 min - clouds
    type: 'observation'
  },
  // Model outputs requiring coherence
  'gefs': {
    interval: 60 * 60 * 1000,    // 1 hour
    type: 'ensemble',
    members: 31
  },
  'epsgram': {
    interval: 60 * 60 * 1000,    // 1 hour
    type: 'probability',
    dependencies: ['gefs']
  }
};

// Cache ARSO meteorological images with timestamp tracking
workbox.routing.registerRoute(
  /^https:\/\/meteo\.arso\.gov\.si\/uploads\/probase\/www\/(observ|forecast)/,
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'weather-images-cache',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 24 * 60 * 60, // 24 hours maximum
      }),
      new workbox.cacheableResponse.CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      {
        // Custom plugin to handle timestamps
        async cacheWillUpdate({ request, response, state }) {
          if (!response) return null;
          
          const url = new URL(request.url);
          const filename = url.pathname.split('/').pop();
          const pathSegments = url.pathname.split('/');
          const dataType = pathSegments.includes('gefs') ? 'gefs' : 
                          pathSegments.includes('epsgram') ? 'epsgram' : filename;
          
          const config = DATA_CONFIG[dataType] || {
            interval: 30 * 60 * 1000, // Default 30min
            type: 'observation'
          };
          
          // Handle ensemble/probability data types
          if (config.type === 'ensemble' || config.type === 'probability') {
            const cache = await caches.open(ENSEMBLE_CACHE);
            const cachedResponse = await cache.match(request);
            
            if (cachedResponse) {
              const metadata = JSON.parse(cachedResponse.headers.get('x-ensemble-metadata') || '{}');
              const now = new Date();
              
              // Check ensemble coherence
              if (metadata.lastUpdate && 
                  (now - new Date(metadata.lastUpdate)) < config.interval &&
                  metadata.isCoherent) {
                return cachedResponse;
              }
            }
            
            // Prepare ensemble metadata
            const newResponse = response.clone();
            const headers = new Headers(newResponse.headers);
            headers.set('x-ensemble-metadata', JSON.stringify({
              lastUpdate: new Date().toISOString(),
              isCoherent: true,
              type: config.type,
              members: config.members,
              dependencies: config.dependencies || []
            }));
            
            return new Response(await newResponse.blob(), {
              status: newResponse.status,
              statusText: newResponse.statusText,
              headers: headers
            });
          }
          
          // Handle regular observation data
          const cache = await caches.open('weather-images-cache');
          const cachedResponse = await cache.match(request);
          
          if (cachedResponse) {
            const cachedDate = new Date(cachedResponse.headers.get('x-cached-time') || 0);
            const now = new Date();
            
            // Only update if enough time has passed
            if ((now - new Date(cachedDate)) < config.interval) {
              return cachedResponse;
            }
          }
          
          // Clone response and add timestamp
          const newResponse = response.clone();
          const headers = new Headers(newResponse.headers);
          headers.set('x-cached-time', new Date().toISOString());
          
          return new Response(await newResponse.blob(), {
            status: newResponse.status,
            statusText: newResponse.statusText,
            headers: headers
          });
        }
      }
    ],
  })
);

// Cache static assets with versioning
workbox.precaching.precacheAndRoute([
  { url: '/gredez/', revision: VERSION },
  { url: '/gredez/index.html', revision: VERSION },
  { url: '/gredez/radar.html', revision: VERSION },
  { url: '/gredez/aladin.html', revision: VERSION },
  { url: '/gredez/epsgram.html', revision: VERSION },
  { url: '/gredez/blitz.html', revision: VERSION },
  { url: '/gredez/gefs.html', revision: VERSION },
  { url: '/gredez/offline.html', revision: VERSION },
  { url: '/gredez/css/styles.css', revision: VERSION },
  { url: '/gredez/js/app.js', revision: VERSION },
  { url: '/gredez/manifest.webmanifest', revision: VERSION },
  { url: '/gredez/images/icons/icon-72.png', revision: VERSION },
  { url: '/gredez/images/icons/icon-96.png', revision: VERSION },
  { url: '/gredez/images/icons/icon-128.png', revision: VERSION },
  { url: '/gredez/images/icons/icon-144.png', revision: VERSION },
  { url: '/gredez/images/icons/icon-152.png', revision: VERSION },
  { url: '/gredez/images/icons/icon-192.png', revision: VERSION },
  { url: '/gredez/images/icons/icon-384.png', revision: VERSION },
  { url: '/gredez/images/icons/icon-512.png', revision: VERSION }
]);

// Cache static assets with network first strategy
workbox.routing.registerRoute(
  /\.(css|js|json|png)$/,
  new workbox.strategies.NetworkFirst({
    cacheName: STATIC_CACHE,
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      }),
      new workbox.cacheableResponse.CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

// Handle navigation requests with offline fallback
workbox.routing.registerRoute(
  ({ request }) => request.mode === 'navigate',
  new workbox.strategies.NetworkFirst({
    cacheName: 'pages-cache',
    networkTimeoutSeconds: 5,
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 25,
      }),
      {
        handlerDidError: async () => {
          return await caches.match('/gredez/offline.html');
        },
      },
    ],
  })
);

// Background sync for failed image requests
const bgSyncPlugin = new workbox.backgroundSync.BackgroundSyncPlugin('failed-images-queue', {
  maxRetentionTime: 24 * 60 // Retry for up to 24 hours
});

// Handle image requests with stale-while-revalidate strategy
workbox.routing.registerRoute(
  ({request}) => request.destination === 'image',
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: IMAGE_CACHE,
    plugins: [
      bgSyncPlugin,
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 24 * 60 * 60, // 24 hours
      }),
      new workbox.cacheableResponse.CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      {
        handlerDidError: async () => {
          return await caches.match('/gredez/offline.html');
        },
      }
    ],
  })
);

// Clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (
            cacheName !== CACHE_NAME &&
            cacheName !== STATIC_CACHE &&
            cacheName !== IMAGE_CACHE &&
            cacheName !== API_CACHE &&
            cacheName !== ENSEMBLE_CACHE &&
            cacheName !== 'bootstrap-cache'
          ) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Handle service worker updates
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Periodic sync for weather data
self.addEventListener('periodicsync', async (event) => {
  if (event.tag === 'update-weather') {
    const imageUrls = [
      'https://meteo.arso.gov.si/uploads/probase/www/observ/surface/graphic/weatherSat_si_pda.png',
      'https://meteo.arso.gov.si/uploads/probase/www/observ/radar/si0_zm_pda_latest.gif',
      'https://meteo.arso.gov.si/uploads/probase/www/observ/satellite/nwcsaf_ct_pda_latest.gif'
    ];

    try {
      await Promise.all(imageUrls.map(url => fetch(url)));
    } catch (error) {
      console.error('Periodic sync failed:', error);
    }
  }
});

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

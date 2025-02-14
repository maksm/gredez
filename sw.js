importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js');

const VERSION = 'v4';
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
  },
  'aladin': {
    interval: 60 * 60 * 1000,    // 1 hour
    type: 'model'
  }
};

// Helper function to determine data type from URL
const getDataTypeFromUrl = (url) => {
  const urlPath = new URL(url).pathname;
  if (urlPath.includes('/model/aladin/')) return 'aladin';
  if (urlPath.includes('/model/ecmwf/')) return 'epsgram';
  if (urlPath.includes('/observ/radar/')) return 'radar';
  if (urlPath.includes('/observ/satellite/')) return 'satellite';
  if (urlPath.includes('modeles16.meteociel.fr/modeles/gensp')) return 'gefs';
  return 'other';
};

// Cache weather data with appropriate strategies
workbox.routing.registerRoute(
  /^https:\/\/(meteo\.arso\.gov\.si|modeles16\.meteociel\.fr)/,
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'weather-images-cache',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 24 * 60 * 60, // 24 hours maximum
      }),
      new workbox.cacheableResponse.CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      {
        // Custom plugin to handle timestamps and data types
        async cacheWillUpdate({ request, response }) {
          if (!response) return null;
          
          const dataType = getDataTypeFromUrl(request.url);
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
            
            // Clone and prepare response with ensemble metadata
            const clonedResponse = response.clone();
            const ensembleHeaders = new Headers(clonedResponse.headers);
            ensembleHeaders.set('x-ensemble-metadata', JSON.stringify({
              lastUpdate: new Date().toISOString(),
              isCoherent: true,
              type: config.type,
              members: config.members,
              dependencies: config.dependencies || []
            }));
            ensembleHeaders.set('x-cached-time', new Date().toISOString());
            ensembleHeaders.set('x-data-type', dataType);
            
            return new Response(await clonedResponse.blob(), {
              status: clonedResponse.status,
              statusText: clonedResponse.statusText,
              headers: ensembleHeaders
            });
          }
          
          // For regular observation data, check existing cache
          const cache = await caches.open('weather-images-cache');
          const cachedResponse = await cache.match(request);
          
          if (cachedResponse) {
            const cachedDate = new Date(cachedResponse.headers.get('x-cached-time') || 0);
            const now = new Date();
            
            // Return cached response if still fresh
            if ((now - new Date(cachedDate)) < config.interval) {
              return cachedResponse;
            }
          }
          
          // Clone and prepare response for caching
          const clonedResponse = response.clone();
          const observationHeaders = new Headers(clonedResponse.headers);
          observationHeaders.set('x-cached-time', new Date().toISOString());
          observationHeaders.set('x-data-type', dataType);
          
          return new Response(await clonedResponse.blob(), {
            status: clonedResponse.status,
            statusText: clonedResponse.statusText,
            headers: observationHeaders
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

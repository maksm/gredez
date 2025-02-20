const CACHE_NAME = 'weather-viewer-v1';
const STATIC_ASSETS = [
  '/gredez/',
  '/gredez/index.html',
  '/gredez/offline.html',
  '/gredez/css/styles.css',
  '/gredez/js/app.js',
  '/gredez/js/config.js',
  '/gredez/js/PageManager.js',
  '/gredez/manifest.json',
  '/gredez/images/icons/icon-144.png',
  '/gredez/images/icons/icon-192.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      );
    })
    .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const basePath = '/gredez';
  const requestUrl = new URL(event.request.url);
  if (!requestUrl.pathname.startsWith(basePath)) {
    requestUrl.pathname = basePath + requestUrl.pathname;
  }

  // Handle image requests differently
  if (requestUrl.pathname.match(/\.(png|gif|jpg|jpeg|webp|svg)$/)) {
    event.respondWith(
      (async () => {
        // Try cache first
        const cachedResponse = await caches.match(requestUrl);
        
        // Try IndexedDB if not in cache
        if (!cachedResponse) {
          try {
            const storage = await import('./services/StorageService.js');
            const blob = await storage.default.getImage(requestUrl.href);
            if (blob) {
              return new Response(blob, {
                headers: {
                  'Content-Type': blob.type
                }
              });
            }
          } catch (err) {
            console.warn('IndexedDB access failed:', err);
          }
        } else {
          // Return cached response immediately
          return cachedResponse;
        }

        // If not found in cache or IndexedDB, fetch from network
        try {
          const networkResponse = await fetch(requestUrl);
          const responseClone = networkResponse.clone();

          // Store in both caches
          caches.open(CACHE_NAME).then(cache => {
            cache.put(requestUrl, responseClone.clone());
          });

          // Store in IndexedDB
          responseClone.blob().then(blob => {
            import('./services/StorageService.js').then(storage => {
              storage.default.saveImage(requestUrl.href, blob).catch(console.warn);
            });
          });

          return networkResponse;
        } catch (error) {
          console.warn('Network fetch failed:', error);
          return caches.match('/offline.html');
        }
      })()
    );
  } else {
    // For non-image requests, use standard cache-first strategy
    event.respondWith(
      caches.match(requestUrl)
        .then((response) => {
          if (response) {
            return response;
          }
          return fetch(requestUrl)
            .then((response) => {
              // Don't cache non-GET requests
              if (event.request.method !== 'GET') {
                return response;
              }

              const responseClone = response.clone();
              caches.open(CACHE_NAME)
                .then((cache) => cache.put(requestUrl, responseClone));
              return response;
            })
            .catch(() => {
              if (event.request.mode === 'navigate') {
                return caches.match('/offline.html');
              }
            });
        })
    );
  }
});

// Handle refresh requests from the client
self.addEventListener('message', (event) => {
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data.type === 'REFRESH_IMAGES') {
    event.waitUntil(
      caches.open(CACHE_NAME)
        .then((cache) => {
          return cache.keys()
            .then((requests) => {
              const imageRequests = requests.filter((request) => 
                request.url.match(/\.(png|gif|jpg|jpeg|webp|svg)$/)
              );
              return Promise.all(
                imageRequests.map((request) => {
                  return fetch(request)
                    .then((response) => {
                      if (response.ok) {
                        return cache.put(request, response);
                      }
                    })
                    .catch(() => {/* Ignore errors */});
                })
              );
            });
        })
    );
  }
});

// Handle periodic sync for image updates
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'refresh-images') {
    event.waitUntil(
      caches.open(CACHE_NAME)
        .then((cache) => {
          return cache.keys()
            .then((requests) => {
              const imageRequests = requests.filter((request) => 
                request.url.match(/\.(png|gif|jpg|jpeg|webp|svg)$/)
              );
              return Promise.all(
                imageRequests.map((request) => {
                  return fetch(request)
                    .then((response) => {
                      if (response.ok) {
                        return cache.put(request, response);
                      }
                    })
                    .catch(() => {/* Ignore errors */});
                })
              );
            });
        })
    );
  }
});

const STATIC_CACHE = 'static-v7';
const TILE_CACHE = 'tiles-v2';

// статика (только то, что ТОЧНО существует)
const STATIC_FILES = [
    '/',
    '/index.html',

    '/app.js',
    '/layers.js',
    '/map.js',
    '/selection.js',
    '/sidebar.js',
    '/styleEditor.js',
    '/ui.js',
    '/utils.js',
    '/import.js',
    '/iconsUpload.js',

    '/lib/leaflet/leaflet.js',
    '/lib/leaflet/leaflet.css',

    '/css/base.css',
    '/css/layout.css',
    '/css/sidebar.css',
    '/css/layers.css',
    '/css/modal.css',
    '/css/map.css',
];

// установка
self.addEventListener('install', (event) => {
    event.waitUntil(
        (async () => {
            const cache = await caches.open(STATIC_CACHE);

            for (const file of STATIC_FILES) {
                try {
                    await cache.add(file);
                    console.log('✅ cached:', file);
                } catch (e) {
                    console.warn('❌ skip:', file);
                }
            }
        })()
    );

    self.skipWaiting();
});

// очистка старых кешей
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys.map(key => {
                    if (key !== STATIC_CACHE && key !== TILE_CACHE) {
                        console.log('🧹 delete cache:', key);
                        return caches.delete(key);
                    }
                })
            )
        )
    );
});

// запросы
self.addEventListener('fetch', (event) => {
    const url = event.request.url;

    // тайлы — cache first
    if (url.includes('tile.openstreetmap.org')) {
        event.respondWith(
            caches.open(TILE_CACHE).then(cache =>
                cache.match(event.request).then(response => {
                    if (response) return response;

                    return fetch(event.request)
                        .then(res => {
                            cache.put(event.request, res.clone());
                            return res;
                        })
                        .catch(() => {
                            console.warn('⚠️ tile offline:', url);
                        });
                })
            )
        );
        return;
    }

    // API / GeoJSON / TREE — network first + fallback cache
    if (
        url.includes('/data') ||
        url.includes('/tree') ||
        url.includes('/icons')
    ) {
        event.respondWith(
            (async () => {
                try {
                    const res = await fetch(event.request);

                    const clone = res.clone();
                    const cache = await caches.open(STATIC_CACHE);
                    await cache.put(event.request, clone);

                    return res;
                } catch (e) {
                    const cached = await caches.match(event.request);

                    if (cached) {
                        console.log('📦 from cache:', url);
                        return cached;
                    }

                    console.warn('⚠️ no cache for:', url);

                    // 🔥 fallback для разных типов API
                    if (url.includes('/tree')) {
                        return new Response(JSON.stringify([]), {
                            headers: { 'Content-Type': 'application/json' }
                        });
                    }

                    if (url.includes('/data')) {
                        return new Response(JSON.stringify({
                            type: "FeatureCollection",
                            features: []
                        }), {
                            headers: { 'Content-Type': 'application/json' }
                        });
                    }

                    if (url.includes('/icons')) {
                        return new Response(JSON.stringify([]), {
                            headers: { 'Content-Type': 'application/json' }
                        });
                    }

                    return new Response('', { status: 404 });
                }
            })()
        );

        return;
    }

    // остальное — cache first
    event.respondWith(
        caches.match(event.request).then(response => {
            return (
                response ||
                fetch(event.request).catch(() => {
                    console.warn('⚠️ offline miss:', url);
                })
            );
        })
    );
});
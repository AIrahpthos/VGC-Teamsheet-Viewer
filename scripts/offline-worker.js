/* Generated into dist/client/sw.js after the production build. */
const cachePrefix = 'team-sheet-offline-';
const cacheName = cachePrefix + '__OFFLINE_VERSION__';
const assets = /* __OFFLINE_ASSETS__ */ [];
const assetPaths = new Set(assets);

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(cacheName);
    try {
      // Never save a hosting provider's login page as the offline application.
      const page = await fetch(new Request('/', { cache: 'reload', redirect: 'error' }));
      if (!page.ok || !page.headers.get('content-type')?.includes('text/html') ||
          !(await page.clone().text()).includes('data-team-sheet-app="true"')) {
        throw new Error('The viewer could not be saved. Open it online and sign in first.');
      }
      await cache.put('/', page);
      // Bounded concurrency avoids overwhelming iPad Safari with PDF font/CMap requests.
      let index = 0;
      await Promise.all(Array.from({ length: 4 }, async () => {
        while (index < assets.length) {
          const path = assets[index++];
          const response = await fetch(new Request(path, { cache: 'reload', redirect: 'error' }));
          if (!response.ok || response.headers.get('content-type')?.includes('text/html')) {
            throw new Error('Offline asset unavailable: ' + path);
          }
          await cache.put(path, response);
        }
      }));
    } catch (error) {
      await caches.delete(cacheName);
      throw error;
    }
    // Updates wait until existing tabs close, keeping HTML and JS on the same version.
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith(cachePrefix) && key !== cacheName) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  // Live RK9 requests and external artwork retain their normal network behaviour.
  if (event.request.mode === 'navigate' && url.pathname === '/') {
    event.respondWith(caches.open(cacheName).then(async cache =>
      (await cache.match('/')) || fetch(event.request)));
  } else if (assetPaths.has(url.pathname)) {
    event.respondWith(caches.open(cacheName).then(async cache =>
      (await cache.match(url.pathname)) || fetch(event.request)));
  }
});

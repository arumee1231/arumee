/* ─────────────────────────────────────────────────────────────────────────
  Arumee Service Worker — mixed strategy for speed + freshness
  • HTML navigations: network-first (fresh content) with cache fallback
  • Static assets: stale-while-revalidate (fast repeat loads)
  • New SW version → old cache is automatically wiped on activation
  ───────────────────────────────────────────────────────────────────────── */

const CACHE_NAME = 'arumee-v26';

// Allow the page to force-activate a waiting SW
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

const PRECACHE = [
  '/',
  '/index.html',
  '/combo.html',
  '/benefits.html',
  '/about.html',
  '/contact.html',
  '/cart.css',
  '/arumee_assets/cart.css',
  '/arumee_assets/main.css',
  '/arumee_assets/premium-subpages.css',
  '/arumee_assets/chat-widget.js?v=9',
  '/arumee_assets/subpage-cart.js',
  '/arumee_assets/logo.webp',
  '/arumee_assets/logo.png',
  '/arumee_assets/mockup_coconut.webp',
  '/arumee_assets/mockup_groundnut.webp',
  '/arumee_assets/mockup_gingelly.webp',
  '/arumee_assets/mockup_coconut_sm.webp',
  '/arumee_assets/mockup_groundnut_sm.webp',
  '/arumee_assets/mockup_gingelly_sm.webp',
  '/arumee_assets/mockup_coconut.png',
  '/arumee_assets/mockup_groundnut.png',
  '/arumee_assets/mockup_gingelly.png',
  '/arumee_assets/mascot_coconut.png',
  '/arumee_assets/Natural.png',
  '/arumee_assets/whatsapp_icon.png',
  '/arumee_assets/tn_pins.json',
];

// ── Install: pre-fill cache ───────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      cache.addAll(PRECACHE.map(url => new Request(url, { cache: 'reload' })))
    ).then(() => self.skipWaiting())
  );
});

// ── Activate: remove stale caches ────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(async () => {
      if (self.registration && self.registration.navigationPreload) {
        try { await self.registration.navigationPreload.enable(); } catch (e) {}
      }
      return self.clients.claim();
    })
  );
});

async function networkFirst(event, cache) {
  const req = event.request;
  try {
    const preloaded = await event.preloadResponse;
    const fresh = preloaded || await fetch(req);
    if (fresh && fresh.status === 200 && fresh.type !== 'opaque') {
      cache.put(req, fresh.clone());
    }
    return fresh;
  } catch (e) {
    const cached = await cache.match(req);
    if (cached) return cached;
    const fallback = await cache.match('/index.html');
    return fallback || new Response('Offline', { status: 503 });
  }
}

async function staleWhileRevalidate(req, cache) {
  const cached = await cache.match(req);
  const revalidate = fetch(req)
    .then(res => {
      if (res && res.status === 200 && res.type !== 'opaque') {
        cache.put(req, res.clone());
      }
      return res;
    })
    .catch(() => null);

  if (cached) return cached;
  const fresh = await revalidate;
  if (!fresh && req.url.indexOf('/arumee_assets/tn_pins.json') !== -1) {
    const pinsFallback = await cache.match('/arumee_assets/tn_pins.json');
    if (pinsFallback) return pinsFallback;
  }
  return fresh || new Response('Offline', { status: 503 });
}

// ── Fetch: choose best strategy by request type ─────────────────────────
self.addEventListener('fetch', event => {
  const req = event.request;

  // Only handle same-origin GETs
  if (req.method !== 'GET') return;
  if (!req.url.startsWith(self.location.origin)) return;

  // Don't cache browser-extension or chrome-extension requests
  if (!req.url.startsWith('http')) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async cache => {
      // Keep HTML pages fresh while still resilient offline
      if (req.mode === 'navigate' || req.destination === 'document') {
        return networkFirst(event, cache);
      }

      // JS and CSS: stale-while-revalidate for faster loads
      if (req.destination === 'script' || req.destination === 'style') {
        return staleWhileRevalidate(req, cache);
      }

      // Other static assets (images, fonts, json): fast stale-while-revalidate
      if (['image', 'font'].includes(req.destination) || req.url.endsWith('.json')) {
        return staleWhileRevalidate(req, cache);
      }

      // Fallback for other GET requests
      try {
        const fresh = await fetch(req);
        if (fresh && fresh.status === 200 && fresh.type !== 'opaque') {
          cache.put(req, fresh.clone());
        }
        return fresh;
      } catch (e) {
        const cached = await cache.match(req);
        return cached || new Response('Offline', { status: 503 });
      }
    })
  );
});

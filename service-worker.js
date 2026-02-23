/* ─────────────────────────────────────────────────────────────────────────
   Arumee Service Worker — stale-while-revalidate strategy
   • Serves every same-origin GET from cache immediately (instant load)
   • Revalidates in the background so the next visit gets fresh content
   • New SW version → old cache is automatically wiped on activation
   ───────────────────────────────────────────────────────────────────────── */

const CACHE_NAME = 'arumee-v1';

const PRECACHE = [
  '/',
  '/index.html',
  '/combo.html',
  '/benefits.html',
  '/about.html',
  '/contact.html',
  '/cart.css',
  '/arumee_assets/cart.css',
  '/arumee_assets/chat-widget.js',
  '/arumee_assets/logo.png',
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
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: stale-while-revalidate ────────────────────────────────────────
self.addEventListener('fetch', event => {
  const req = event.request;

  // Only handle same-origin GETs
  if (req.method !== 'GET') return;
  if (!req.url.startsWith(self.location.origin)) return;

  // Don't cache browser-extension or chrome-extension requests
  if (!req.url.startsWith('http')) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async cache => {
      const cached = await cache.match(req);

      const revalidate = fetch(req).then(res => {
        // Only cache valid responses
        if (res && res.status === 200 && res.type !== 'opaque') {
          cache.put(req, res.clone());
        }
        return res;
      }).catch(() => null);

      // Stale-while-revalidate: serve cache instantly, refresh in background
      if (cached) {
        event.waitUntil(revalidate);
        return cached;
      }

      // Nothing in cache yet — wait for network
      return revalidate.then(res => res || new Response('Offline', { status: 503 }));
    })
  );
});

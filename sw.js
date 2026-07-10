// Service worker for Pastas Para Pizza dashboard.
// Strategy: network first, falling back to the last cached copy when offline.
// This lets the app itself open without a connection after the first visit;
// Firestore's own offline persistence handles the data side.

const CACHE = 'ppz-cache-v1';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  // Never intercept Firestore/auth traffic — let Firebase manage its own connections.
  const url = req.url;
  if (url.includes('firestore.googleapis.com') || url.includes('identitytoolkit') || url.includes('securetoken')) return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: req.mode === 'navigate' }))
  );
});

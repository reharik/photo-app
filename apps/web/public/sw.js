// Minimal service worker: network passthrough, no caching strategy yet.
// Exists because Chrome's installability heuristics want a fetch handler
// before treating the site as an installable PWA on Android.
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});

// Minimal service worker: a registered fetch handler, deliberately NOT intercepting.
// Exists because Chrome's installability heuristics want a fetch handler
// before treating the site as an installable PWA on Android.
//
// DO NOT call event.respondWith(fetch(event.request)) here. Re-issuing an
// intercepted request drops the request BODY in WebKit (all iOS browsers,
// including Chrome on iOS, are WebKit). That turned every presigned S3 PUT
// from iOS into a Content-Length: 0 request, so S3 happily created a
// zero-byte object and returned 200. Android/Chromium forwards the body
// correctly, which is why only iOS was affected.
//
// Not calling respondWith leaves the request to the browser's own default
// networking, body intact — which is all a no-op passthrough ever did anyway.
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', () => {
  // Intentionally empty: registered, but never responds.
});

// Minimal service worker - exists only so the app satisfies PWA
// installability criteria ("Add to Home Screen") in browsers that require
// one. Deliberately does no caching: this app's JS/CSS changes often, and
// a caching strategy done wrong would serve stale code after every update -
// not worth the risk for what's currently just "look like a real app when
// installed", not an offline mode.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', (event) => {
    event.respondWith(fetch(event.request));
});

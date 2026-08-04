// Minimal service worker - exists only so the app satisfies PWA
// installability criteria ("Add to Home Screen"). Deliberately does no
// caching: this app's JS/CSS changes often, and a caching strategy done
// wrong would serve stale code after every update - not worth the risk for
// what's currently just "look like a real app when installed", not an
// offline mode.
//
// No 'fetch' handler - installability hasn't required one for years, and
// a blanket event.respondWith(fetch(event.request)) passthrough (the
// previous version of this file) turned out to actively break requests:
// re-issuing the original Request object through fetch() rejects with
// "Failed to fetch" for some request modes/redirect handling, and every
// single fetch this app makes - including its own API calls - goes
// through this handler once registered. Removing the handler entirely
// means the browser never intercepts anything, which is strictly safer
// than a passthrough that was silently failing a chunk of requests.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

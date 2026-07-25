/**
 * Wimmich - PWA install support ("Add to Home Screen" on mobile).
 * The service worker deliberately does no caching (see sw.js) - this is
 * only here to satisfy installability, not to add an offline mode.
 */
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(() => {
            // Not fatal - the app works identically without it, just not
            // installable as a home-screen app in browsers that require one.
        });
    });
}

/**
 * Wimmich - App entry point.
 * All feature logic lives in the other static/js/*.js files (see index.html
 * for load order); this file only wires up DOMContentLoaded init.
 */
document.addEventListener('DOMContentLoaded', () => {
    initThemeSwitch();
    initAuth();
    initSidebar();
    initUpload();
    initViewer();
    initAlbumModal();
    initAddToAlbumModal();
    initShareModal();
    initAlbumShareModal();
    initProfileModal();
    initProfileAvatar();
    initShortcutsModal();
    initAppFullscreen();

    // A shared-link visitor never has (or needs) an auth session - dispatch
    // to the standalone public viewer before checkAuth() ever runs, instead
    // of falling into the login screen.
    const sharedMatch = location.pathname.match(/^\/shared\/([^/]+)/);
    if (sharedMatch) {
        renderSharedView(sharedMatch[1]);
    } else {
        checkAuth();
    }
});

// App-wide fullscreen toggle button (separate from the photo viewer's own
// fullscreen button - this one covers the whole app and stays visible on
// every page). Same button enters and exits, swapping its icon to match.
const _FULLSCREEN_ENTER_SVG = '<path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>';
const _FULLSCREEN_EXIT_SVG = '<path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>';

function _updateAppFullscreenButton() {
    const btn = $('app-fullscreen-btn');
    if (!btn) return;
    const active = !!document.fullscreenElement;
    btn.querySelector('svg').innerHTML = active ? _FULLSCREEN_EXIT_SVG : _FULLSCREEN_ENTER_SVG;
    const label = active ? t('viewer.fullscreen_exit') : t('viewer.fullscreen_enter');
    btn.title = label;
    btn.setAttribute('data-i18n-title', active ? 'viewer.fullscreen_exit' : 'viewer.fullscreen_enter');
}

function initAppFullscreen() {
    const btn = $('app-fullscreen-btn');
    if (!btn) return;
    btn.onclick = () => {
        if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => {});
        } else {
            document.documentElement.requestFullscreen?.().catch(() => {});
        }
    };
    document.addEventListener('fullscreenchange', _updateAppFullscreenButton);
}

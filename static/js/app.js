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

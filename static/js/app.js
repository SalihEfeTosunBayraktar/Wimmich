/**
 * Wimmich - App entry point.
 * All feature logic lives in the other static/js/*.js files (see index.html
 * for load order); this file only wires up DOMContentLoaded init.
 */
registerTranslations({
    en: {
        'app.lan_banner_text': "You're on the same network as this server - switch to a direct connection for better speed.",
        'app.lan_banner_switch': 'Switch',
    },
    tr: {
        'app.lan_banner_text': 'Bu sunucuyla aynı ağdasınız - daha hızlı bir bağlantı için doğrudan geçiş yapın.',
        'app.lan_banner_switch': 'Geç',
    },
    fr: {
        'app.lan_banner_text': 'Vous êtes sur le même réseau que ce serveur - passez à une connexion directe pour de meilleures performances.',
        'app.lan_banner_switch': 'Basculer',
    },
    de: {
        'app.lan_banner_text': 'Sie befinden sich im selben Netzwerk wie dieser Server - wechseln Sie für bessere Geschwindigkeit zu einer direkten Verbindung.',
        'app.lan_banner_switch': 'Wechseln',
    },
});

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
    initLocalNetworkBanner();

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

const LAN_BANNER_DISMISSED_KEY = 'wimmich_lan_banner_dismissed_url';

/**
 * "You're on the same network - switch to a direct connection" banner.
 * Only appears when the SERVER confirms this specific page load actually
 * came in through the Cloudflare tunnel (see /api/network/local-info's own
 * comment for why the server has to be the one to decide this, not the
 * client) - a plain client-side fetch probe of the LAN address would be
 * blocked outright as mixed content if this page was loaded over the
 * tunnel's HTTPS. Clicking does a real page navigation (location.href),
 * not a fetch, which mixed-content blocking doesn't apply to.
 */
async function initLocalNetworkBanner() {
    let data;
    try {
        const resp = await fetch('/api/network/local-info');
        if (!resp.ok) return;
        data = await resp.json();
    } catch (e) {
        return; // no network info available - just skip the banner entirely
    }
    if (!data.show_banner || !data.local_url) return;
    if (localStorage.getItem(LAN_BANNER_DISMISSED_KEY) === data.local_url) return;

    const banner = document.createElement('div');
    banner.className = 'lan-switch-banner';
    banner.innerHTML = `
        <span>${t('app.lan_banner_text')}</span>
        <button class="btn btn-secondary btn-sm" id="lan-switch-go-btn">${t('app.lan_banner_switch')}</button>
        <button class="btn-icon" id="lan-switch-dismiss-btn" title="${t('common.cancel')}">${icon('close', 16)}</button>
    `;
    banner.querySelector('#lan-switch-go-btn').onclick = () => {
        location.href = data.local_url;
    };
    banner.querySelector('#lan-switch-dismiss-btn').onclick = () => {
        localStorage.setItem(LAN_BANNER_DISMISSED_KEY, data.local_url);
        banner.remove();
    };
    document.body.appendChild(banner);
}

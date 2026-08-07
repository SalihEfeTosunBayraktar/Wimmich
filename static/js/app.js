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
    initGearSpin();
    initHeartRain();
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

// How long each letter of the brand waits for the next one. Slow enough to
// read as typing, short enough that the whole word is done (~0.8s) before
// anyone could be waiting on it.
const BRAND_TYPE_MS = 110;
// The caret keeps blinking for a beat after the last letter, the way a real
// prompt would, instead of vanishing the instant typing stops.
const BRAND_CARET_LINGER_MS = 1500;

/** Types "Wimmich" out a letter at a time with a blinking caret. Called from
 *  showApp(), not on DOMContentLoaded - the sidebar is still hidden behind
 *  the login screen then, and an animation nobody can see is just a
 *  wasted one. */
function playBrandTypewriter() {
    const el = document.querySelector('.sidebar-brand');
    if (!el) return;
    const full = el.textContent;
    if (!full || matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // Pin the widest state before typing into an empty element, or the
    // header reflows on every letter. Caret first, THEN measure: the
    // widest moment is the full word with the caret still after it, and
    // measuring without it left the last frame 11px short of its pin.
    el.classList.add('is-typing');
    el.style.minWidth = el.getBoundingClientRect().width + 'px';
    el.textContent = '';

    let i = 0;
    const tick = () => {
        el.textContent = full.slice(0, ++i);
        if (i < full.length) return setTimeout(tick, BRAND_TYPE_MS);
        // The pin stays. Clearing it would shrink the box by the caret's
        // width the moment the caret goes, for one last pointless reflow -
        // and nothing sits to the right of the brand for that width to
        // push around anyway.
        setTimeout(() => el.classList.remove('is-typing'), BRAND_CARET_LINGER_MS);
    };
    setTimeout(tick, 200);
}

// How many hearts one tap on Favourites drops, and how long the slowest of
// them takes to fall out of view.
const HEART_RAIN_COUNT = 14;
const HEART_RAIN_MS = 1300;

function _prefersReducedMotion() {
    return matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** One full turn of the settings gear on tap. */
function initGearSpin() {
    const btn = $('profile-settings-btn');
    if (!btn) return;
    btn.addEventListener('click', () => {
        const svg = btn.querySelector('svg');
        if (!svg || _prefersReducedMotion()) return;
        // Drop the class and force a reflow before re-adding it, or a second
        // tap during the first spin does nothing - the animation is already
        // running and re-adding a class it already has is a no-op.
        svg.classList.remove('is-spinning');
        void svg.offsetWidth;
        svg.classList.add('is-spinning');
    });
}

/** Hearts spilling out of the Favourites nav item. The item's own icon is
 *  untouched - these are separate throwaway nodes appended to <body>, both
 *  so the sidebar can't clip them and so nothing about the nav item's own
 *  layout or state depends on an animation. */
function initHeartRain() {
    const nav = $('nav-favorites');
    if (!nav) return;
    nav.addEventListener('click', () => {
        if (_prefersReducedMotion()) return;
        const box = nav.getBoundingClientRect();
        const layer = document.createElement('div');
        layer.className = 'heart-rain';
        layer.setAttribute('aria-hidden', 'true');   // decoration, not content

        for (let i = 0; i < HEART_RAIN_COUNT; i++) {
            const heart = document.createElement('span');
            heart.className = 'heart-rain-drop';
            heart.innerHTML = icon('heart', 12 + Math.round(Math.random() * 8));
            heart.style.left = (box.left + Math.random() * box.width) + 'px';
            heart.style.top = (box.top + box.height / 2) + 'px';
            heart.style.setProperty('--drift', (Math.random() * 60 - 30).toFixed(1) + 'px');
            heart.style.setProperty('--spin', (Math.random() * 120 - 60).toFixed(1) + 'deg');
            heart.style.animationDelay = (Math.random() * 260).toFixed(0) + 'ms';
            heart.style.animationDuration = (HEART_RAIN_MS * (0.7 + Math.random() * 0.5)).toFixed(0) + 'ms';
            layer.appendChild(heart);
        }

        document.body.appendChild(layer);
        // Longest possible delay + longest possible duration, so nothing is
        // cut off mid-fall and no layer is ever left behind in the DOM.
        setTimeout(() => layer.remove(), HEART_RAIN_MS * 1.2 + 300);
    });
}

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

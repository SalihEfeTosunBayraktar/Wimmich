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
    initIconFlair();
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

// Mini hearts per tap, and how long the one that becomes the icon takes to
// settle. The throwaway ones are all done before it lands.
const FAV_MINI_HEARTS = 5;
const FAV_LAND_MS = 620;
const FAV_RAIN_MS = 900;

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

/** Tiny hearts falling INSIDE the Favourites icon - clipped to its own 20px
 *  box, so nothing spills into the nav row - with the last one growing into
 *  the icon itself as it lands. The real icon is only hidden while that is
 *  in flight and comes back underneath the lander's final frame, which is
 *  the same heart at the same size and position, so the swap is invisible. */
function initHeartRain() {
    const nav = $('nav-favorites');
    const mainIcon = nav?.querySelector('svg');
    if (!nav || !mainIcon) return;

    // Wrap the existing icon rather than editing index.html: the slot is
    // what gives the animation a positioning context and something to clip
    // against, and no other nav item needs one.
    const slot = document.createElement('span');
    slot.className = 'fav-icon-slot';
    mainIcon.replaceWith(slot);
    mainIcon.classList.add('fav-icon-main');
    slot.appendChild(mainIcon);

    let running = false;
    nav.addEventListener('click', () => {
        if (running || _prefersReducedMotion()) return;
        running = true;
        slot.classList.add('is-raining');

        const spawned = [];
        for (let i = 0; i < FAV_MINI_HEARTS; i++) {
            const mini = document.createElement('span');
            mini.className = 'fav-heart-mini';
            mini.innerHTML = icon('heart', 5 + Math.round(Math.random() * 3));
            mini.style.left = (10 + Math.random() * 70).toFixed(0) + '%';
            mini.style.animationDelay = (i * 70 + Math.random() * 60).toFixed(0) + 'ms';
            mini.style.animationDuration = (420 + Math.random() * 220).toFixed(0) + 'ms';
            slot.appendChild(mini);
            spawned.push(mini);
        }

        const lander = document.createElement('span');
        lander.className = 'fav-heart-land';
        lander.innerHTML = icon('heart', 20);
        lander.style.animationDelay = (FAV_RAIN_MS - FAV_LAND_MS) + 'ms';
        slot.appendChild(lander);
        spawned.push(lander);

        setTimeout(() => {
            slot.classList.remove('is-raining');
            spawned.forEach(el => el.remove());
            running = false;
        }, FAV_RAIN_MS);
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

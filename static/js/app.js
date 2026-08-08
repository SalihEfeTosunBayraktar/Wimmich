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

// The favourite effects share the app-wide odds (see flair.js). Same
// reasoning as every other button: a reaction that fires on every single
// tap stops being a small delight and turns into a tic. Four variants
// rather than one, so the quarter of taps that do fire aren't predictable
// either.
const FAV_EFFECT_CHANCE = FLAIR_CHANCE;

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

function _favHeart(className, size) {
    const el = document.createElement('span');
    el.className = className;
    el.innerHTML = icon('heart', size);
    return el;
}

const _rand = (min, max) => min + Math.random() * (max - min);

/**
 * Effects for the Favourites icon. Every one of them plays INSIDE the
 * icon's own 20px box, which is clipped - the containment is structural,
 * not a matter of tuned distances, so no effect can ever spill into the
 * nav row no matter what numbers it uses.
 *
 * Each returns how long it needs, so the caller knows when to clean up.
 * `hidesIcon` is only for effects where a heart takes the icon's place;
 * the others animate the real icon rather than replacing it.
 */
const FAV_EFFECTS = {
    // Hearts fall through the box, and the last one grows into the icon.
    rain(slot, spawn) {
        for (let i = 0; i < 5; i++) {
            const mini = _favHeart('fav-heart-mini', Math.round(_rand(5, 8)));
            mini.style.left = _rand(10, 80).toFixed(0) + '%';
            mini.style.animationDelay = (i * 70 + _rand(0, 60)).toFixed(0) + 'ms';
            mini.style.animationDuration = _rand(420, 640).toFixed(0) + 'ms';
            spawn(mini);
        }
        const lander = _favHeart('fav-heart-land', 20);
        lander.style.animationDelay = '280ms';
        spawn(lander);
        return { duration: 900, hidesIcon: true };
    },

    // Hearts drift upward like bubbles while the icon beats once - the
    // opposite direction to `rain`, which is what keeps the two distinct
    // at this size.
    rise(slot, spawn) {
        for (let i = 0; i < 6; i++) {
            const mini = _favHeart('fav-heart-rise', Math.round(_rand(4, 7)));
            mini.style.left = _rand(8, 82).toFixed(0) + '%';
            mini.style.setProperty('--sway', _rand(-5, 5).toFixed(1) + 'px');
            mini.style.animationDelay = (i * 55 + _rand(0, 50)).toFixed(0) + 'ms';
            mini.style.animationDuration = _rand(480, 700).toFixed(0) + 'ms';
            spawn(mini);
        }
        slot.classList.add('is-beating');
        return { duration: 900 };
    },

    // Hearts scatter outward from the middle. They fade before the edge, so
    // the clip reads as distance rather than as a cut-off.
    burst(slot, spawn) {
        const count = 7;
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2 + _rand(-0.3, 0.3);
            const distance = _rand(9, 15);
            const mini = _favHeart('fav-heart-burst', Math.round(_rand(4, 7)));
            mini.style.setProperty('--dx', (Math.cos(angle) * distance).toFixed(1) + 'px');
            mini.style.setProperty('--dy', (Math.sin(angle) * distance).toFixed(1) + 'px');
            mini.style.animationDelay = _rand(0, 60).toFixed(0) + 'ms';
            spawn(mini);
        }
        slot.classList.add('is-popping');
        return { duration: 700 };
    },

    // No extra hearts at all - just the icon itself beating and glowing.
    // Worth having as the quiet one: four loud effects in a row would make
    // the odds feel higher than they are.
    pulse(slot) {
        slot.classList.add('is-pulsing');
        return { duration: 720 };
    },
};

const FAV_EFFECT_NAMES = Object.keys(FAV_EFFECTS);
const FAV_EFFECT_CLASSES = ['is-raining', 'is-beating', 'is-popping', 'is-pulsing'];

/** Wraps the Favourites icon in a clipping slot and plays one of the
 *  effects above on some taps. */
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
        if (Math.random() >= FAV_EFFECT_CHANCE) return;

        running = true;
        const name = FAV_EFFECT_NAMES[Math.floor(Math.random() * FAV_EFFECT_NAMES.length)];
        const spawned = [];
        const spawn = (el) => { slot.appendChild(el); spawned.push(el); };

        const { duration, hidesIcon } = FAV_EFFECTS[name](slot, spawn);
        if (hidesIcon) slot.classList.add('is-raining');

        setTimeout(() => {
            slot.classList.remove(...FAV_EFFECT_CLASSES);
            spawned.forEach(el => el.remove());
            running = false;
        }, duration);
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

/**
 * Wimmich - Occasional click animations on icon buttons.
 *
 * Deliberately NOT every click. A button that reacts the same way every
 * single time stops being a small delight and becomes a tic you notice
 * whenever it's missing; at one-in-four it stays a surprise. Each icon
 * draws from its own set of motions for the same reason - repeating one
 * animation would make the odds feel much higher than they are.
 *
 * Everything here is decoration: it never blocks, never changes state, and
 * never touches the click that triggered it.
 */

// Roughly one tap in four. Tuned by feel: much higher and it reads as
// "this button always animates, but glitchily".
const FLAIR_CHANCE = 0.25;

// Motions available to any icon. Keyframes live in css/flair.css under the
// matching `flair-<name>` class.
const FLAIR_POP = 'pop';
const FLAIR_SPIN = 'spin';
const FLAIR_WOBBLE = 'wobble';
const FLAIR_BOUNCE = 'bounce';
const FLAIR_NUDGE = 'nudge';
const FLAIR_FLIP = 'flip';
const FLAIR_BEAT = 'beat';
const FLAIR_DIP = 'dip';
const FLAIR_RISE = 'rise';
const FLAIR_SHAKE = 'shake';
const FLAIR_SWING = 'swing';
const FLAIR_TWINKLE = 'twinkle';

// Anything not listed here falls back to _default. Sets are picked so the
// motion suits what the symbol means - an upload arrow lifts, a trash can
// shakes and drops, a refresh arrow turns - rather than every icon sharing
// one generic jiggle.
const FLAIR_SETS = {
    _default: [FLAIR_POP, FLAIR_WOBBLE, FLAIR_BOUNCE, FLAIR_NUDGE, FLAIR_FLIP],

    heart: [FLAIR_BEAT, FLAIR_POP, FLAIR_TWINKLE, FLAIR_WOBBLE],
    star: [FLAIR_TWINKLE, FLAIR_POP, FLAIR_SPIN, FLAIR_BEAT],
    sparkle: [FLAIR_TWINKLE, FLAIR_POP, FLAIR_SPIN, FLAIR_BEAT],

    trash: [FLAIR_SHAKE, FLAIR_DIP, FLAIR_WOBBLE, FLAIR_SWING],
    ban: [FLAIR_SHAKE, FLAIR_SPIN, FLAIR_POP, FLAIR_NUDGE],
    stop: [FLAIR_SHAKE, FLAIR_POP, FLAIR_NUDGE, FLAIR_WOBBLE],

    download: [FLAIR_DIP, FLAIR_BOUNCE, FLAIR_POP, FLAIR_NUDGE],
    upload: [FLAIR_RISE, FLAIR_BOUNCE, FLAIR_POP, FLAIR_WOBBLE],
    archive: [FLAIR_DIP, FLAIR_POP, FLAIR_WOBBLE, FLAIR_SWING],
    unarchive: [FLAIR_RISE, FLAIR_POP, FLAIR_WOBBLE, FLAIR_BOUNCE],
    save: [FLAIR_DIP, FLAIR_POP, FLAIR_BOUNCE, FLAIR_FLIP],

    refresh: [FLAIR_SPIN, FLAIR_WOBBLE, FLAIR_POP, FLAIR_FLIP],
    repeat: [FLAIR_SPIN, FLAIR_FLIP, FLAIR_POP, FLAIR_WOBBLE],
    undo: [FLAIR_SPIN, FLAIR_NUDGE, FLAIR_POP, FLAIR_WOBBLE],
    settings: [FLAIR_SPIN, FLAIR_WOBBLE, FLAIR_POP, FLAIR_BEAT],

    search: [FLAIR_WOBBLE, FLAIR_NUDGE, FLAIR_POP, FLAIR_BOUNCE],
    eye: [FLAIR_POP, FLAIR_BEAT, FLAIR_WOBBLE, FLAIR_TWINKLE],
    eyeOff: [FLAIR_POP, FLAIR_SHAKE, FLAIR_WOBBLE, FLAIR_NUDGE],

    close: [FLAIR_SPIN, FLAIR_SHAKE, FLAIR_POP, FLAIR_NUDGE],
    check: [FLAIR_POP, FLAIR_BOUNCE, FLAIR_TWINKLE, FLAIR_SWING],
    checkSquare: [FLAIR_POP, FLAIR_BOUNCE, FLAIR_TWINKLE, FLAIR_FLIP],
    plus: [FLAIR_SPIN, FLAIR_POP, FLAIR_BOUNCE, FLAIR_WOBBLE],
    minus: [FLAIR_NUDGE, FLAIR_POP, FLAIR_SHAKE, FLAIR_WOBBLE],

    play: [FLAIR_POP, FLAIR_NUDGE, FLAIR_BOUNCE, FLAIR_SWING],
    film: [FLAIR_SPIN, FLAIR_POP, FLAIR_WOBBLE, FLAIR_BOUNCE],
    camera: [FLAIR_POP, FLAIR_TWINKLE, FLAIR_WOBBLE, FLAIR_BOUNCE],
    image: [FLAIR_POP, FLAIR_FLIP, FLAIR_WOBBLE, FLAIR_TWINKLE],

    person: [FLAIR_BOUNCE, FLAIR_POP, FLAIR_WOBBLE, FLAIR_SWING],
    users: [FLAIR_BOUNCE, FLAIR_POP, FLAIR_WOBBLE, FLAIR_NUDGE],
    crown: [FLAIR_SWING, FLAIR_TWINKLE, FLAIR_POP, FLAIR_BOUNCE],
    rocket: [FLAIR_RISE, FLAIR_POP, FLAIR_SWING, FLAIR_TWINKLE],

    pin: [FLAIR_DIP, FLAIR_SWING, FLAIR_POP, FLAIR_BOUNCE],
    globe: [FLAIR_SPIN, FLAIR_POP, FLAIR_WOBBLE, FLAIR_FLIP],
    brain: [FLAIR_BEAT, FLAIR_POP, FLAIR_WOBBLE, FLAIR_TWINKLE],
    key: [FLAIR_SWING, FLAIR_WOBBLE, FLAIR_POP, FLAIR_NUDGE],
    lock: [FLAIR_SHAKE, FLAIR_POP, FLAIR_WOBBLE, FLAIR_SWING],
    link: [FLAIR_NUDGE, FLAIR_POP, FLAIR_WOBBLE, FLAIR_SPIN],
    folder: [FLAIR_POP, FLAIR_SWING, FLAIR_WOBBLE, FLAIR_BOUNCE],
    copy: [FLAIR_NUDGE, FLAIR_POP, FLAIR_FLIP, FLAIR_BOUNCE],
    edit: [FLAIR_WOBBLE, FLAIR_POP, FLAIR_NUDGE, FLAIR_SWING],
    wrench: [FLAIR_WOBBLE, FLAIR_SWING, FLAIR_POP, FLAIR_SHAKE],
    broom: [FLAIR_SWING, FLAIR_WOBBLE, FLAIR_NUDGE, FLAIR_POP],
    clock: [FLAIR_SPIN, FLAIR_BEAT, FLAIR_POP, FLAIR_WOBBLE],
    calendar: [FLAIR_POP, FLAIR_FLIP, FLAIR_BOUNCE, FLAIR_WOBBLE],
    sun: [FLAIR_SPIN, FLAIR_TWINKLE, FLAIR_POP, FLAIR_BEAT],
    moon: [FLAIR_SWING, FLAIR_TWINKLE, FLAIR_POP, FLAIR_WOBBLE],
    lightbulb: [FLAIR_TWINKLE, FLAIR_POP, FLAIR_BEAT, FLAIR_SWING],
};

// These run their own bespoke animation on every click (see initGearSpin and
// initHeartRain) - letting the random system fire on top would have two
// motions competing for the same element.
const FLAIR_EXCLUDED_IDS = new Set(['profile-settings-btn', 'nav-favorites']);

const FLAIR_CLICKABLE = 'button, .nav-item, .btn, [role="button"]';

function _flairPick(iconName) {
    const set = FLAIR_SETS[iconName] || FLAIR_SETS._default;
    return set[Math.floor(Math.random() * set.length)];
}

/**
 * One delegated listener for the whole app rather than per-button wiring:
 * most icon buttons in Wimmich are rendered into innerHTML and replaced
 * wholesale on every re-render, so anything bound directly to them would
 * have to be re-bound after each one - and would silently stop working the
 * first time someone forgot.
 */
function initIconFlair() {
    document.addEventListener('click', (e) => {
        if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        const target = e.target.closest?.(FLAIR_CLICKABLE);
        if (!target || target.disabled || FLAIR_EXCLUDED_IDS.has(target.id)) return;

        const svg = target.querySelector('svg[data-icon]');
        // Already mid-animation: leave it be. Restarting on a double-tap
        // looks like a stutter, and this is decoration - it has no reason
        // to insist on being seen.
        if (!svg || svg.dataset.flairing === '1') return;
        if (Math.random() >= FLAIR_CHANCE) return;

        const motion = _flairPick(svg.dataset.icon);
        svg.dataset.flairing = '1';
        svg.classList.add('flair', `flair-${motion}`);
        svg.addEventListener('animationend', () => {
            svg.classList.remove('flair', `flair-${motion}`);
            delete svg.dataset.flairing;
        }, { once: true });
    });
}

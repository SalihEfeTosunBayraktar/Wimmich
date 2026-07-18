/**
 * Wimmich - Shared frontend constants (timings, map defaults).
 * Loaded before all other feature scripts (see index.html script order).
 */
const TOUCH_HOLD_MS = 600;
const SEARCH_DEBOUNCE_MS = 500;
const DUP_LOCATION_DEBOUNCE_MS = 500;
const DUP_DELETE_FLASH_MS = 450; // red layer + X visible before the card shrinks away
const DUP_DELETE_FADE_MS = 300;  // matches the .dup-removed CSS transition duration
const ADMIN_POLL_INTERVAL_MS = 2000;
// Dashboard stat cards (photo/video/size/people/album/user counts) change
// far less often than job progress - a slower interval than the job poll
// above avoids hammering the server for numbers that rarely move.
const ADMIN_STATS_POLL_INTERVAL_MS = 15000;
const IMPORT_POLL_INTERVAL_MS = 2000;
const TOAST_DURATION_MS = 2200;
const TOAST_REMOVE_DELAY_MS = 300;
// Deleting a run of items (e.g. clearing duplicate groups one after another)
// used to stack an unbounded column of toasts down the screen - cap how
// many can be on screen at once, oldest drops first.
const TOAST_MAX_VISIBLE = 3;

const MAP_DEFAULT_CENTER = [39.0, 35.0]; // Turkey default
const MAP_DEFAULT_ZOOM = 6;
const MAP_MAX_ZOOM = 19;
const MAP_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const MAP_TILE_ATTRIBUTION = '© OpenStreetMap';
const MAP_FIT_BOUNDS_PADDING = [50, 50];

/**
 * Wimmich - Generic DOM/formatting helpers shared across feature scripts.
 */
function $(id) { return document.getElementById(id); }
function qs(sel, parent) { return (parent || document).querySelector(sel); }
function qsa(sel, parent) { return (parent || document).querySelectorAll(sel); }

function formatSize(bytes) {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i];
}

function formatDuration(secs) {
    if (!secs) return '';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
}

// Locale used for Date formatting - separate from I18N_SUPPORTED_LANGS'
// bare language codes since Intl needs a full locale (e.g. "en-US") to
// pick sensible defaults (date order, month names).
const _DATE_LOCALES = { en: 'en-US', tr: 'tr-TR', fr: 'fr-FR', de: 'de-DE' };

function formatDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString(_DATE_LOCALES[getLanguage()], { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatDateShort(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString(_DATE_LOCALES[getLanguage()]);
}

function toast(msg, type = 'info') {
    const c = $('toast-container');
    while (c.children.length >= TOAST_MAX_VISIBLE) {
        c.firstElementChild.remove();
    }
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = msg;
    c.appendChild(el);
    setTimeout(() => {
        el.classList.add('removing');
        setTimeout(() => el.remove(), TOAST_REMOVE_DELAY_MS);
    }, TOAST_DURATION_MS);
}

function escHtml(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
}

function escAttr(s) { return s ? s.replace(/\\/g, '\\\\').replace(/'/g, "\\'") : ''; }

function renderEmptyState(title, desc) {
    return `
        <div class="empty-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
            <h3>${title}</h3>
            <p>${desc}</p>
        </div>
    `;
}

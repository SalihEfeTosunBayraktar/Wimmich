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

// action (optional): { label, onClick } - renders a button inside the toast
// (e.g. "Undo" after a bulk delete/archive) and gives it more time on screen
// than a plain informational toast, since it has to be read AND clicked
// before it disappears, not just read.
function toast(msg, type = 'info', action = null) {
    const c = $('toast-container');
    while (c.children.length >= TOAST_MAX_VISIBLE) {
        c.firstElementChild.remove();
    }
    const el = document.createElement('div');
    el.className = `toast ${type}`;

    const textEl = document.createElement('span');
    textEl.className = 'toast-text';
    textEl.textContent = msg;
    el.appendChild(textEl);

    const dismiss = () => {
        el.classList.add('removing');
        setTimeout(() => el.remove(), TOAST_REMOVE_DELAY_MS);
    };

    if (action) {
        const btn = document.createElement('button');
        btn.className = 'toast-action-btn';
        btn.textContent = action.label;
        btn.onclick = () => {
            clearTimeout(timer);
            dismiss();
            action.onClick();
        };
        el.appendChild(btn);
    }

    c.appendChild(el);
    const timer = setTimeout(dismiss, action ? TOAST_ACTION_DURATION_MS : TOAST_DURATION_MS);
}

function escHtml(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
}

function escAttr(s) { return s ? s.replace(/\\/g, '\\\\').replace(/'/g, "\\'") : ''; }

// escHtml() alone is NOT safe inside a double-quoted HTML attribute value -
// confirmed directly that a <div> serializing its own textContent back to
// innerHTML leaves a literal `"` untouched (only `&`/`<`/`>` are special in
// HTML text nodes, not quote characters), so a value containing one breaks
// out of the attribute early. Adds the one extra replace attribute
// serialization actually needs.
function escHtmlAttr(s) { return escHtml(s).replace(/"/g, '&quot;'); }

function renderEmptyState(title, desc) {
    return `
        <div class="empty-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
            <h3>${title}</h3>
            <p>${desc}</p>
        </div>
    `;
}

// A small "(i)" button that shows an explanatory popover on click - for
// technical/advanced settings (tunnel, Tailscale, API keys, ...) where a
// one-line label isn't enough context, but a permanent paragraph of text
// would clutter the card. Click-based (not hover-only) so it works the same
// on touch as with a mouse.
function infoBtn(hintText) {
    return `<button type="button" class="info-tooltip-btn" data-hint="${escHtml(hintText)}" onclick="event.stopPropagation(); _toggleInfoTooltip(this)">${icon('question', 14)}</button>`;
}

function _toggleInfoTooltip(btn) {
    const existing = $('info-tooltip-popover');
    const reopeningSameBtn = existing && existing._sourceBtn === btn;
    _closeInfoTooltip();
    if (reopeningSameBtn) return; // clicking the same info button again just closes it

    const popover = document.createElement('div');
    popover.className = 'info-tooltip-popover';
    popover.id = 'info-tooltip-popover';
    popover.textContent = btn.dataset.hint;
    popover._sourceBtn = btn;
    document.body.appendChild(popover);

    const r = btn.getBoundingClientRect();
    const pr = popover.getBoundingClientRect();
    popover.style.left = `${Math.max(8, Math.min(r.left, window.innerWidth - pr.width - 8))}px`;
    popover.style.top = `${r.bottom + 6}px`;
}

function _closeInfoTooltip() {
    const existing = $('info-tooltip-popover');
    if (existing) existing.remove();
}
document.addEventListener('click', _closeInfoTooltip);
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') _closeInfoTooltip(); });

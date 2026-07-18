/**
 * Wimmich - Public share-link viewer. Renders into #shared-view-root,
 * completely independent of the authenticated app shell (no sidebar, no
 * navigateTo/pages routing, no API.request() - a raw fetch() instead,
 * since this page must work with zero auth state at all). Entered from
 * app.js's bootstrap when location.pathname starts with /shared/, before
 * checkAuth() ever runs.
 */
registerTranslations({
    en: {
        'shared.not_found': 'This share link was not found',
        'shared.expired': 'This share link has expired',
        'shared.generic_error': 'Could not load this share link',
        'shared.network_error': 'Network error - please try again',
        'shared.password_title': 'Password Required',
        'shared.wrong_password': 'Incorrect password',
        'shared.password_placeholder': 'Enter password',
        'shared.unlock_btn': 'View Photos',
        'shared.default_title': 'Shared Photos',
        'shared.item_count': '{count} items',
        'shared.empty': 'This share has no photos',
        'shared.download': 'Download',
        'shared.download_disabled': 'Downloads are disabled for this share',
    },
    tr: {
        'shared.not_found': 'Bu paylaşım bağlantısı bulunamadı',
        'shared.expired': 'Bu paylaşım bağlantısının süresi dolmuş',
        'shared.generic_error': 'Bu paylaşım bağlantısı yüklenemedi',
        'shared.network_error': 'Ağ hatası - lütfen tekrar deneyin',
        'shared.password_title': 'Şifre Gerekli',
        'shared.wrong_password': 'Şifre yanlış',
        'shared.password_placeholder': 'Şifreyi girin',
        'shared.unlock_btn': 'Fotoğrafları Görüntüle',
        'shared.default_title': 'Paylaşılan Fotoğraflar',
        'shared.item_count': '{count} öğe',
        'shared.empty': 'Bu paylaşımda fotoğraf yok',
        'shared.download': 'İndir',
        'shared.download_disabled': 'Bu paylaşım için indirme kapalı',
    },
    fr: {
        'shared.not_found': 'Ce lien de partage est introuvable',
        'shared.expired': 'Ce lien de partage a expiré',
        'shared.generic_error': 'Impossible de charger ce lien de partage',
        'shared.network_error': 'Erreur réseau - veuillez réessayer',
        'shared.password_title': 'Mot de passe requis',
        'shared.wrong_password': 'Mot de passe incorrect',
        'shared.password_placeholder': 'Entrez le mot de passe',
        'shared.unlock_btn': 'Voir les photos',
        'shared.default_title': 'Photos partagées',
        'shared.item_count': '{count} éléments',
        'shared.empty': 'Ce partage ne contient aucune photo',
        'shared.download': 'Télécharger',
        'shared.download_disabled': 'Le téléchargement est désactivé pour ce partage',
    },
    de: {
        'shared.not_found': 'Dieser Freigabelink wurde nicht gefunden',
        'shared.expired': 'Dieser Freigabelink ist abgelaufen',
        'shared.generic_error': 'Dieser Freigabelink konnte nicht geladen werden',
        'shared.network_error': 'Netzwerkfehler - bitte erneut versuchen',
        'shared.password_title': 'Passwort erforderlich',
        'shared.wrong_password': 'Falsches Passwort',
        'shared.password_placeholder': 'Passwort eingeben',
        'shared.unlock_btn': 'Fotos ansehen',
        'shared.default_title': 'Geteilte Fotos',
        'shared.item_count': '{count} Elemente',
        'shared.empty': 'Diese Freigabe enthält keine Fotos',
        'shared.download': 'Herunterladen',
        'shared.download_disabled': 'Downloads sind für diese Freigabe deaktiviert',
    },
});

let _sharedKey = '';
let _sharedPassword = null;
let _sharedAssets = [];
let _sharedAllowDownload = true;
let _sharedLightboxIndex = 0;

async function renderSharedView(key) {
    $('auth-screen').classList.add('hidden');
    $('app').classList.add('hidden');
    $('shared-view-root').classList.remove('hidden');
    _sharedKey = key;
    await _loadSharedView(null);
}

function _sharedCenteredHtml(innerHtml) {
    return `<div class="auth-screen"><div class="auth-container" style="max-width:380px;text-align:center">${innerHtml}</div></div>`;
}

async function _loadSharedView(password) {
    const root = $('shared-view-root');
    root.innerHTML = _sharedCenteredHtml(`<div class="skeleton" style="height:120px;border-radius:12px"></div>`);

    let resp;
    try {
        const qs = password ? `?password=${encodeURIComponent(password)}` : '';
        resp = await fetch(`/api/shared/${_sharedKey}${qs}`);
    } catch (e) {
        root.innerHTML = _sharedCenteredHtml(`<h2>${t('shared.network_error')}</h2>`);
        return;
    }

    if (resp.status === 404) { root.innerHTML = _sharedCenteredHtml(`<h2>${t('shared.not_found')}</h2>`); return; }
    if (resp.status === 410) { root.innerHTML = _sharedCenteredHtml(`<h2>${t('shared.expired')}</h2>`); return; }
    if (!resp.ok) { root.innerHTML = _sharedCenteredHtml(`<h2>${t('shared.generic_error')}</h2>`); return; }

    const data = await resp.json();

    if (data.requires_password) {
        _renderSharedPasswordPrompt(data.description, password !== null);
        return;
    }

    _sharedPassword = password;
    _sharedAssets = data.assets || [];
    _sharedAllowDownload = data.allow_download;
    _renderSharedGrid(data);
}

function _renderSharedPasswordPrompt(description, wasWrong) {
    const root = $('shared-view-root');
    root.innerHTML = _sharedCenteredHtml(`
        <h2>${t('shared.password_title')}</h2>
        ${description ? `<p class="text-muted">${escHtml(description)}</p>` : ''}
        <form id="shared-password-form">
            <input type="password" id="shared-password-input" placeholder="${t('shared.password_placeholder')}" autofocus required style="width:100%;box-sizing:border-box;margin-top:8px">
            ${wasWrong ? `<p style="color:var(--danger)">${t('shared.wrong_password')}</p>` : ''}
            <button type="submit" class="btn btn-primary" style="width:100%;margin-top:12px">${t('shared.unlock_btn')}</button>
        </form>
    `);
    $('shared-password-form').onsubmit = (e) => {
        e.preventDefault();
        _loadSharedView($('shared-password-input').value);
    };
}

// Query params always re-carry the password (if any) - each media request
// is independently, statelessly re-validated server-side, there's no
// session for an anonymous visitor to hold it in instead.
function _sharedMediaUrl(kind, assetId, extraParams) {
    const params = new URLSearchParams(extraParams || {});
    if (_sharedPassword) params.set('password', _sharedPassword);
    const qs = params.toString();
    return `/api/shared/${_sharedKey}/assets/${assetId}/${kind}${qs ? '?' + qs : ''}`;
}

function _renderSharedGrid(data) {
    const root = $('shared-view-root');
    root.innerHTML = `
        <header class="shared-view-header">
            <h2>${escHtml(data.description || t('shared.default_title'))}</h2>
            <span class="text-muted">${t('shared.item_count', { count: data.total })}</span>
        </header>
        ${_sharedAssets.length ? `
            <div class="photo-grid" id="shared-photo-grid">
                ${_sharedAssets.map((a, i) => _sharedPhotoCardHtml(a, i)).join('')}
            </div>
        ` : `<p class="text-muted" style="text-align:center;margin-top:40px">${t('shared.empty')}</p>`}
    `;
    root.querySelectorAll('.shared-photo-card').forEach((card) => {
        card.querySelector('img').onclick = () => _openSharedLightbox(parseInt(card.dataset.index, 10));
    });
}

function _sharedPhotoCardHtml(asset, index) {
    const thumb = _sharedMediaUrl('thumbnail', asset.id, { size: 'medium' });
    const isVideo = asset.file_type === 'VIDEO';
    return `
        <div class="photo-card shared-photo-card" data-index="${index}">
            <img src="${thumb}" alt="" loading="lazy" onerror="this.onerror=null;this.src='/static/broken-file.png';">
            ${isVideo ? `<div class="photo-badges"><span class="photo-badge video">▶</span></div>` : ''}
        </div>
    `;
}

function _openSharedLightbox(index) {
    _sharedLightboxIndex = index;
    _renderSharedLightbox();
    document.addEventListener('keydown', _onSharedLightboxKeydown);
}

function _onSharedLightboxKeydown(e) {
    if (e.key === 'Escape') _closeSharedLightbox();
    else if (e.key === 'ArrowLeft') _stepSharedLightbox(-1);
    else if (e.key === 'ArrowRight') _stepSharedLightbox(1);
}

function _stepSharedLightbox(delta) {
    _sharedLightboxIndex = (_sharedLightboxIndex + delta + _sharedAssets.length) % _sharedAssets.length;
    _renderSharedLightbox();
}

function _renderSharedLightbox() {
    let overlay = $('shared-lightbox');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'shared-lightbox';
        overlay.className = 'viewer-overlay';
        overlay.onclick = (e) => { if (e.target === overlay) _closeSharedLightbox(); };
        document.body.appendChild(overlay);
    }
    overlay.classList.remove('hidden');

    const asset = _sharedAssets[_sharedLightboxIndex];
    const isVideo = asset.file_type === 'VIDEO';
    // Video playback shares the same /file endpoint as download (there's no
    // separate stream-only variant anywhere in this app), so it's simply
    // unavailable when downloads are off rather than half-working.
    const mediaHtml = isVideo
        ? (_sharedAllowDownload
            ? `<video src="${_sharedMediaUrl('file', asset.id)}" controls autoplay style="max-width:100%;max-height:100%"></video>`
            : `<p class="text-muted">${t('shared.download_disabled')}</p>`)
        : `<img src="${_sharedMediaUrl('thumbnail', asset.id, { size: 'large' })}" alt="">`;

    overlay.innerHTML = `
        <div class="viewer-container">
            <div class="viewer-media">${mediaHtml}</div>
        </div>
        <div class="viewer-controls">
            <button class="btn-icon viewer-btn" id="shared-lightbox-prev">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <div class="viewer-center-controls">
                ${_sharedAllowDownload ? `
                    <a class="btn-icon viewer-btn" href="${_sharedMediaUrl('file', asset.id)}" download title="${t('shared.download')}">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    </a>
                ` : ''}
            </div>
            <button class="btn-icon viewer-btn" id="shared-lightbox-next">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
            <button class="btn-icon viewer-btn viewer-close-btn" id="shared-lightbox-close">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
        </div>
    `;
    $('shared-lightbox-prev').onclick = () => _stepSharedLightbox(-1);
    $('shared-lightbox-next').onclick = () => _stepSharedLightbox(1);
    $('shared-lightbox-close').onclick = _closeSharedLightbox;
}

function _closeSharedLightbox() {
    const overlay = $('shared-lightbox');
    if (overlay) overlay.classList.add('hidden');
    document.removeEventListener('keydown', _onSharedLightboxKeydown);
}

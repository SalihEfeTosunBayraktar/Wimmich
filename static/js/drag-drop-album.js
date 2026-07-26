/**
 * Wimmich - Drag a photo (or the current multi-selection) directly onto an
 * album to add it, instead of only through the "Add to Album" menu/modal.
 * A floating strip of album covers appears at the bottom of the screen for
 * the duration of the drag and acts as the drop targets, since a photo grid
 * and an album grid are never both on screen at once in this single-page-
 * at-a-time layout - see timeline.js's dragstart/dragend for where this is
 * triggered, and _setCardSelected there for why only an already-selected
 * card can start this drag at all.
 */
registerTranslations({
    en: {
        'drag_drop_album.added': '{count} item(s) added to "{name}"',
    },
    tr: {
        'drag_drop_album.added': '{count} öğe "{name}" albümüne eklendi',
    },
    fr: {
        'drag_drop_album.added': '{count} élément(s) ajouté(s) à "{name}"',
    },
    de: {
        'drag_drop_album.added': '{count} Element(e) zu "{name}" hinzugefügt',
    },
});

let _dragDropAssetIds = null;

function _startAlbumDropBar(assetIds) {
    _dragDropAssetIds = assetIds;
    API.getAlbums().then(data => {
        // The drag may already have ended (dragend fired) before this
        // resolved - don't show a bar for a drag that's no longer happening.
        if (!_dragDropAssetIds) return;
        _renderAlbumDropBar(data.albums || []);
    }).catch(() => {});
}

function _renderAlbumDropBar(albums) {
    if (!albums.length) return;
    // Paranoia: never stack two bars - DOM-only, must NOT touch
    // _dragDropAssetIds (that's the actual drag still in progress, which is
    // exactly what got us here).
    const stale = $('album-drop-bar');
    if (stale) stale.remove();

    const bar = document.createElement('div');
    bar.className = 'album-drop-bar';
    bar.id = 'album-drop-bar';
    bar.innerHTML = albums.slice(0, 12).map(a => `
        <div class="album-drop-target" data-album-id="${a.id}" data-album-name="${escAttr(a.name)}">
            ${a.cover_thumb ? `<img src="${a.cover_thumb}" alt="">` : `<div class="empty-cover">${icon('folder')}</div>`}
            <span>${escHtml(a.name)}</span>
        </div>
    `).join('');
    document.body.appendChild(bar);

    bar.querySelectorAll('.album-drop-target').forEach(target => {
        target.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
            target.classList.add('drag-over');
        });
        target.addEventListener('dragleave', () => target.classList.remove('drag-over'));
        target.addEventListener('drop', async (e) => {
            e.preventDefault();
            const ids = _dragDropAssetIds;
            const albumId = target.dataset.albumId;
            const albumName = target.dataset.albumName;
            _endAlbumDropBar();
            if (!ids || !ids.length) return;
            try {
                await API.addToAlbum(albumId, ids);
                toast(t('drag_drop_album.added', { count: ids.length, name: albumName }), 'success');
            } catch (err) {
                toast(err.message, 'error');
            }
        });
    });
}

function _endAlbumDropBar() {
    _dragDropAssetIds = null;
    const bar = $('album-drop-bar');
    if (bar) bar.remove();
}

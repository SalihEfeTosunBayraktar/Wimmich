/**
 * Wimmich - Multi-select photo grid actions (bulk favorite/delete).
 */
registerTranslations({
    en: {
        'selection.restore': 'Restore',
        'selection.delete_permanent': 'Delete Permanently',
        'selection.album': 'Album',
        'selection.share': 'Share',
        'selection.download': 'Download',
        'selection.unarchive': 'Remove from Archive',
        'selection.favorite': 'Favorite',
        'selection.archive': 'Archive',
        'selection.selected_count': '{count} selected',
        'selection.moved_to_trash': '{count} items moved to trash',
        'selection.added_to_favorites': 'Added to favorites',
        'selection.archived': 'Archived',
        'selection.unarchived': 'Removed from archive',
        'selection.restored': 'Restored',
        'selection.confirm_delete_permanent': 'Are you sure you want to PERMANENTLY delete {count} items? This action cannot be undone.',
        'selection.permanently_deleted': '{count} items permanently deleted',
    },
    tr: {
        'selection.restore': 'Geri Yükle',
        'selection.delete_permanent': 'Kalıcı Sil',
        'selection.album': 'Albüm',
        'selection.share': 'Paylaş',
        'selection.download': 'İndir',
        'selection.unarchive': 'Arşivden Çıkar',
        'selection.favorite': 'Favori',
        'selection.archive': 'Arşivle',
        'selection.selected_count': '{count} seçili',
        'selection.moved_to_trash': '{count} öğe çöp kutusuna taşındı',
        'selection.added_to_favorites': 'Favorilere eklendi',
        'selection.archived': 'Arşivlendi',
        'selection.unarchived': 'Arşivden çıkarıldı',
        'selection.restored': 'Geri yüklendi',
        'selection.confirm_delete_permanent': '{count} öğeyi KALICI OLARAK silmek istediğinize emin misiniz? Bu işlem geri alınamaz.',
        'selection.permanently_deleted': '{count} öğe kalıcı olarak silindi',
    },
    fr: {
        'selection.restore': 'Restaurer',
        'selection.delete_permanent': 'Supprimer définitivement',
        'selection.album': 'Album',
        'selection.share': 'Partager',
        'selection.download': 'Télécharger',
        'selection.unarchive': "Retirer de l'archive",
        'selection.favorite': 'Favori',
        'selection.archive': 'Archiver',
        'selection.selected_count': '{count} sélectionné(s)',
        'selection.moved_to_trash': '{count} éléments déplacés vers la corbeille',
        'selection.added_to_favorites': 'Ajouté aux favoris',
        'selection.archived': 'Archivé',
        'selection.unarchived': "Retiré de l'archive",
        'selection.restored': 'Restauré',
        'selection.confirm_delete_permanent': 'Voulez-vous vraiment supprimer DÉFINITIVEMENT {count} éléments ? Cette action est irréversible.',
        'selection.permanently_deleted': '{count} éléments supprimés définitivement',
    },
    de: {
        'selection.restore': 'Wiederherstellen',
        'selection.delete_permanent': 'Endgültig löschen',
        'selection.album': 'Album',
        'selection.share': 'Teilen',
        'selection.download': 'Herunterladen',
        'selection.unarchive': 'Aus Archiv entfernen',
        'selection.favorite': 'Favorit',
        'selection.archive': 'Archivieren',
        'selection.selected_count': '{count} ausgewählt',
        'selection.moved_to_trash': '{count} Elemente in den Papierkorb verschoben',
        'selection.added_to_favorites': 'Zu Favoriten hinzugefügt',
        'selection.archived': 'Archiviert',
        'selection.unarchived': 'Aus dem Archiv entfernt',
        'selection.restored': 'Wiederhergestellt',
        'selection.confirm_delete_permanent': 'Möchten Sie {count} Elemente wirklich ENDGÜLTIG löschen? Diese Aktion kann nicht rückgängig gemacht werden.',
        'selection.permanently_deleted': '{count} Elemente endgültig gelöscht',
    },
});

function toggleSelect(id, card) {
    if (state.selectedAssets.has(id)) {
        state.selectedAssets.delete(id);
        card.classList.remove('selected');
    } else {
        state.selectedAssets.add(id);
        card.classList.add('selected');
    }
    updateSelectionBar();
}

function _selectionBarActions() {
    if (state.currentPage === 'trash') {
        return `
            <button class="btn btn-sm btn-secondary" onclick="bulkRestore()">↩ <span>${t('selection.restore')}</span></button>
            <button class="btn btn-sm btn-danger" onclick="bulkDeletePermanent()">🗑 <span>${t('selection.delete_permanent')}</span></button>
        `;
    }
    if (state.currentPage === 'archive') {
        return `
            <button class="btn btn-sm btn-secondary" onclick="showAddToAlbumModal()">📁 <span>${t('selection.album')}</span></button>
            <button class="btn btn-sm btn-secondary" onclick="showShareModal('ASSET', [...state.selectedAssets])">🔗 <span>${t('selection.share')}</span></button>
            <button class="btn btn-sm btn-secondary" onclick="bulkDownload()">⬇ <span>${t('selection.download')}</span></button>
            <button class="btn btn-sm btn-secondary" onclick="bulkUnarchive()">📤 <span>${t('selection.unarchive')}</span></button>
            <button class="btn btn-sm btn-danger" onclick="bulkDelete()">🗑 <span>${t('common.delete')}</span></button>
        `;
    }
    return `
        <button class="btn btn-sm btn-secondary" onclick="bulkFavorite()">♥ <span>${t('selection.favorite')}</span></button>
        <button class="btn btn-sm btn-secondary" onclick="showAddToAlbumModal()">📁 <span>${t('selection.album')}</span></button>
        <button class="btn btn-sm btn-secondary" onclick="showShareModal('ASSET', [...state.selectedAssets])">🔗 <span>${t('selection.share')}</span></button>
        <button class="btn btn-sm btn-secondary" onclick="bulkDownload()">⬇ <span>${t('selection.download')}</span></button>
        <button class="btn btn-sm btn-secondary" onclick="bulkArchive()">🗄 <span>${t('selection.archive')}</span></button>
        <button class="btn btn-sm btn-danger" onclick="bulkDelete()">🗑 <span>${t('common.delete')}</span></button>
    `;
}

function updateSelectionBar() {
    removeSelectionBar();
    if (state.selectedAssets.size === 0) return;

    const bar = document.createElement('div');
    bar.className = 'selection-bar';
    bar.id = 'selection-bar';
    bar.innerHTML = `
        <span class="selection-count">${t('selection.selected_count', { count: state.selectedAssets.size })}</span>
        ${_selectionBarActions()}
        <button class="btn btn-sm btn-secondary" onclick="clearSelection()">✗ <span>${t('common.cancel')}</span></button>
    `;
    document.body.appendChild(bar);
}

function removeSelectionBar() {
    const bar = $('selection-bar');
    if (bar) bar.remove();
}

function clearSelection() {
    state.selectedAssets.clear();
    document.querySelectorAll('.photo-card.selected').forEach(c => c.classList.remove('selected'));
    removeSelectionBar();
}

async function bulkDelete() {
    // Trash is a soft delete (reversible from the Trash page), so this
    // doesn't block on a confirm() popup - same reasoning as the viewer's
    // single-photo delete.
    await API.bulkAction([...state.selectedAssets], 'delete');
    toast(t('selection.moved_to_trash', { count: state.selectedAssets.size }), 'success');
    clearSelection();
    navigateTo(state.currentPage);
}

async function bulkFavorite() {
    await API.bulkAction([...state.selectedAssets], 'favorite');
    toast(t('selection.added_to_favorites'), 'success');
    clearSelection();
    navigateTo(state.currentPage);
}

async function bulkArchive() {
    await API.bulkAction([...state.selectedAssets], 'archive');
    toast(t('selection.archived'), 'success');
    clearSelection();
    navigateTo(state.currentPage);
}

async function bulkUnarchive() {
    await API.bulkAction([...state.selectedAssets], 'unarchive');
    toast(t('selection.unarchived'), 'success');
    clearSelection();
    navigateTo(state.currentPage);
}

async function bulkRestore() {
    await API.bulkAction([...state.selectedAssets], 'restore');
    toast(t('selection.restored'), 'success');
    clearSelection();
    navigateTo(state.currentPage);
}

async function bulkDeletePermanent() {
    if (!confirm(t('selection.confirm_delete_permanent', { count: state.selectedAssets.size }))) return;
    await API.bulkAction([...state.selectedAssets], 'delete_permanent');
    toast(t('selection.permanently_deleted', { count: state.selectedAssets.size }), 'success');
    clearSelection();
    navigateTo(state.currentPage);
}

function bulkDownload() {
    if (state.selectedAssets.size === 1) {
        const [id] = state.selectedAssets;
        window.open(API.getAssetFile(id), '_blank');
        return;
    }
    window.open(API.getDownloadZipUrl([...state.selectedAssets]), '_blank');
}

function selectAllVisible() {
    document.querySelectorAll('.photo-card').forEach(card => {
        if (!state.selectedAssets.has(card.dataset.id)) {
            state.selectedAssets.add(card.dataset.id);
            card.classList.add('selected');
        }
    });
    updateSelectionBar();
}

// 'albums' covers both the album cover-grid list (no .photo-card elements,
// selectAllVisible() is a harmless no-op there) and a single opened album's
// photo grid (openAlbum() in albums.js renders straight into #page-content
// without a navigateTo() call, so state.currentPage stays 'albums' the
// whole time - this is what actually needs Select All to work).
const SELECT_ALL_PAGES = new Set(['gallery', 'favorites', 'archive', 'trash', 'albums']);
$('select-all-btn').onclick = () => selectAllVisible();
document.addEventListener('keydown', (e) => {
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

    const isSelectAllShortcut = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a';
    if (isSelectAllShortcut && SELECT_ALL_PAGES.has(state.currentPage)) {
        e.preventDefault();
        selectAllVisible();
        return;
    }

    // The viewer has its own Delete-key handler for the single open photo;
    // only handle it here for a grid multi-selection with the viewer closed.
    if (e.key === 'Delete' && state.selectedAssets.size > 0 && $('viewer-overlay').classList.contains('hidden')) {
        bulkDelete();
    }
});

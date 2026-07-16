/**
 * Wimmich - Archived assets view (photos hidden from the main gallery).
 */
registerTranslations({
    en: {
        'archive.empty_title': 'No items in archive',
        'archive.empty_desc': 'You can archive photos you want to hide from the timeline.',
    },
    tr: {
        'archive.empty_title': 'Arşivde öğe yok',
        'archive.empty_desc': 'Zaman çizelgesinden gizlemek istediğiniz fotoğrafları arşivleyebilirsiniz.',
    },
    fr: {
        'archive.empty_title': "Aucun élément dans les archives",
        'archive.empty_desc': "Vous pouvez archiver les photos que vous souhaitez masquer de la chronologie.",
    },
    de: {
        'archive.empty_title': 'Keine Elemente im Archiv',
        'archive.empty_desc': 'Sie können Fotos archivieren, die Sie aus der Zeitleiste ausblenden möchten.',
    },
});

async function renderArchive() {
    try {
        const data = await API.getArchived();
        const pc = $('page-content');
        if (!data.assets.length) {
            pc.innerHTML = renderEmptyState(t('archive.empty_title'), t('archive.empty_desc'));
            return;
        }
        pc.innerHTML = `<div class="photo-grid">${data.assets.map(a => renderPhotoCard(a)).join('')}</div>`;
        // Tap opens the viewer, long-press/checkbox multi-selects - same as
        // everywhere else. Use the selection bar's "Arşivden Çıkar" button
        // for bulk unarchiving instead of a per-tap confirm dialog, which
        // used to overwrite bindPhotoCards' click handler and break selection.
        bindPhotoCards(pc);
        state.viewerList = data.assets.map(a => a.id);
    } catch (e) { toast(e.message, 'error'); }
}

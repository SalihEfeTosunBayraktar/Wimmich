/**
 * Wimmich - Favorites page.
 */
registerTranslations({
    en: {
        'favorites.empty_title': 'No favorites',
        'favorites.empty_desc': 'Mark your photos as favorites with the ♥ icon.',
    },
    tr: {
        'favorites.empty_title': 'Favori yok',
        'favorites.empty_desc': 'Fotoğraflarınızı ♥ simgesiyle favori olarak işaretleyin.',
    },
    fr: {
        'favorites.empty_title': 'Aucun favori',
        'favorites.empty_desc': "Marquez vos photos comme favorites avec l'icône ♥.",
    },
    de: {
        'favorites.empty_title': 'Keine Favoriten',
        'favorites.empty_desc': 'Markieren Sie Ihre Fotos mit dem Symbol ♥ als Favoriten.',
    },
});

async function renderFavorites() {
    try {
        const data = await API.getFavorites();
        const pc = $('page-content');
        if (!data.assets.length) {
            pc.innerHTML = renderEmptyState(t('favorites.empty_title'), t('favorites.empty_desc'));
            return;
        }
        pc.innerHTML = `<div class="photo-grid">${data.assets.map(a => renderPhotoCard(a)).join('')}</div>`;
        bindPhotoCards(pc);
        state.viewerList = data.assets.map(a => a.id);
    } catch (e) { toast(e.message, 'error'); }
}

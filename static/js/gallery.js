/**
 * Wimmich - "Tüm Fotoğraflar" (Gallery): the app's main/default view, a
 * sortable/filterable/groupable grid (date_desc + month grouping gives
 * the old chronological Timeline view as just one filter combination
 * among others). Reuses renderPhotoCard/bindPhotoCards from timeline.js.
 */
registerTranslations({
    en: {
        'gallery.sort_date_desc': 'Date (Newest → Oldest)',
        'gallery.sort_uploaded_desc': 'Recently Added',
        'gallery.sort_date_asc': 'Date (Oldest → Newest)',
        'gallery.sort_name_asc': 'Name (A-Z)',
        'gallery.sort_name_desc': 'Name (Z-A)',
        'gallery.sort_size_desc': 'Size (Largest → Smallest)',
        'gallery.sort_size_asc': 'Size (Smallest → Largest)',
        'gallery.suggestion_all': 'All',
        'gallery.suggestion_no_album': 'No Album',
        'gallery.suggestion_image': 'Photos Only',
        'gallery.suggestion_video': 'Videos Only',
        'gallery.suggestion_favorite': 'Favorites',
        'gallery.suggestion_not_archived': 'Not Archived',
        'gallery.suggestion_archived': 'Archived',
        'gallery.suggestion_category_screenshot': 'Screenshots',
        'gallery.suggestion_category_document': 'Documents',
        'gallery.suggestion_category_nature': 'Landscape',
        'gallery.suggestion_category_pet': 'Pets',
        'gallery.suggestion_category_food': 'Food',
        'gallery.suggestion_category_car': 'Car',
        'gallery.suggestion_category_technology': 'Technology',
        'gallery.group_none': 'No Grouping',
        'gallery.group_day': 'By Day',
        'gallery.group_month': 'By Month',
        'gallery.group_year': 'By Year',
        'gallery.group_type': 'By Type',
        'gallery.search_placeholder': 'Search photos... (e.g. beach, sunset, dog)',
        'gallery.sort_title': 'Sort',
        'gallery.group_title': 'Group',
        'gallery.no_results': 'No results found',
        'gallery.try_different_search': 'Try a different search.',
        'gallery.results_count': '{count} results found',
        'gallery.clip_warming_hint': '🧠 Preparing the smart search model - this first search may take a little longer.',
        'gallery.clip_ready_toast': '🧠 Smart search model ready - future searches will be instant.',
        'gallery.no_photos_for_filter': 'No photos match this filter',
        'gallery.try_different_filters': 'Try changing the filters.',
        'gallery.item_count': '{count} items',
        'gallery.no_photos': 'No photos',
        'gallery.back_to_years': '← Back to Years',
        'gallery.collapse_btn': 'Collapse',
    },
    tr: {
        'gallery.sort_date_desc': 'Tarih (Yeni → Eski)',
        'gallery.sort_uploaded_desc': 'En Son Eklenenler',
        'gallery.sort_date_asc': 'Tarih (Eski → Yeni)',
        'gallery.sort_name_asc': 'İsim (A-Z)',
        'gallery.sort_name_desc': 'İsim (Z-A)',
        'gallery.sort_size_desc': 'Boyut (Büyük → Küçük)',
        'gallery.sort_size_asc': 'Boyut (Küçük → Büyük)',
        'gallery.suggestion_all': 'Tümü',
        'gallery.suggestion_no_album': 'Albümsüz',
        'gallery.suggestion_image': 'Sadece Fotoğraf',
        'gallery.suggestion_video': 'Sadece Video',
        'gallery.suggestion_favorite': 'Favoriler',
        'gallery.suggestion_not_archived': 'Arşivlenmemiş',
        'gallery.suggestion_archived': 'Arşivli',
        'gallery.suggestion_category_screenshot': 'Ekran Görüntüleri',
        'gallery.suggestion_category_document': 'Belgeler',
        'gallery.suggestion_category_nature': 'Manzara',
        'gallery.suggestion_category_pet': 'Evcil Hayvanlar',
        'gallery.suggestion_category_food': 'Yemek',
        'gallery.suggestion_category_car': 'Araba',
        'gallery.suggestion_category_technology': 'Teknoloji',
        'gallery.group_none': 'Gruplama Yok',
        'gallery.group_day': 'Güne Göre',
        'gallery.group_month': 'Aya Göre',
        'gallery.group_year': 'Yıla Göre',
        'gallery.group_type': 'Türe Göre',
        'gallery.search_placeholder': 'Fotoğraf ara... (ör: plaj, gün batımı, köpek)',
        'gallery.sort_title': 'Sırala',
        'gallery.group_title': 'Grupla',
        'gallery.no_results': 'Sonuç bulunamadı',
        'gallery.try_different_search': 'Farklı bir arama deneyin.',
        'gallery.results_count': '{count} sonuç bulundu',
        'gallery.clip_warming_hint': '🧠 Akıllı arama modeli hazırlanıyor - bu ilk arama biraz daha uzun sürebilir.',
        'gallery.clip_ready_toast': '🧠 Akıllı arama modeli hazır - sonraki aramalar artık anında olacak.',
        'gallery.no_photos_for_filter': 'Bu filtreyle eşleşen fotoğraf yok',
        'gallery.try_different_filters': 'Filtreleri değiştirmeyi deneyin.',
        'gallery.item_count': '{count} öğe',
        'gallery.no_photos': 'Fotoğraf yok',
        'gallery.back_to_years': '← Yıllara Dön',
        'gallery.collapse_btn': 'Küçült',
    },
    fr: {
        'gallery.sort_date_desc': 'Date (Récent → Ancien)',
        'gallery.sort_uploaded_desc': 'Ajoutés récemment',
        'gallery.sort_date_asc': 'Date (Ancien → Récent)',
        'gallery.sort_name_asc': 'Nom (A-Z)',
        'gallery.sort_name_desc': 'Nom (Z-A)',
        'gallery.sort_size_desc': 'Taille (Grand → Petit)',
        'gallery.sort_size_asc': 'Taille (Petit → Grand)',
        'gallery.suggestion_all': 'Tout',
        'gallery.suggestion_no_album': 'Sans album',
        'gallery.suggestion_image': 'Photos uniquement',
        'gallery.suggestion_video': 'Vidéos uniquement',
        'gallery.suggestion_favorite': 'Favoris',
        'gallery.suggestion_not_archived': 'Non archivé',
        'gallery.suggestion_archived': 'Archivé',
        'gallery.suggestion_category_screenshot': "Captures d'écran",
        'gallery.suggestion_category_document': 'Documents',
        'gallery.suggestion_category_nature': 'Paysage',
        'gallery.suggestion_category_pet': 'Animaux',
        'gallery.suggestion_category_food': 'Nourriture',
        'gallery.suggestion_category_car': 'Voiture',
        'gallery.suggestion_category_technology': 'Technologie',
        'gallery.group_none': 'Aucun regroupement',
        'gallery.group_day': 'Par jour',
        'gallery.group_month': 'Par mois',
        'gallery.group_year': 'Par année',
        'gallery.group_type': 'Par type',
        'gallery.search_placeholder': 'Rechercher des photos... (ex : plage, coucher de soleil, chien)',
        'gallery.sort_title': 'Trier',
        'gallery.group_title': 'Grouper',
        'gallery.no_results': 'Aucun résultat trouvé',
        'gallery.try_different_search': 'Essayez une autre recherche.',
        'gallery.results_count': '{count} résultats trouvés',
        'gallery.clip_warming_hint': '🧠 Préparation du modèle de recherche intelligente - cette première recherche peut prendre un peu plus de temps.',
        'gallery.clip_ready_toast': '🧠 Modèle de recherche intelligente prêt - les prochaines recherches seront instantanées.',
        'gallery.no_photos_for_filter': 'Aucune photo ne correspond à ce filtre',
        'gallery.try_different_filters': 'Essayez de modifier les filtres.',
        'gallery.item_count': '{count} éléments',
        'gallery.no_photos': 'Aucune photo',
        'gallery.back_to_years': '← Retour aux années',
        'gallery.collapse_btn': 'Réduire',
    },
    de: {
        'gallery.sort_date_desc': 'Datum (Neu → Alt)',
        'gallery.sort_uploaded_desc': 'Kürzlich hinzugefügt',
        'gallery.sort_date_asc': 'Datum (Alt → Neu)',
        'gallery.sort_name_asc': 'Name (A-Z)',
        'gallery.sort_name_desc': 'Name (Z-A)',
        'gallery.sort_size_desc': 'Größe (Groß → Klein)',
        'gallery.sort_size_asc': 'Größe (Klein → Groß)',
        'gallery.suggestion_all': 'Alle',
        'gallery.suggestion_no_album': 'Ohne Album',
        'gallery.suggestion_image': 'Nur Fotos',
        'gallery.suggestion_video': 'Nur Videos',
        'gallery.suggestion_favorite': 'Favoriten',
        'gallery.suggestion_not_archived': 'Nicht archiviert',
        'gallery.suggestion_archived': 'Archiviert',
        'gallery.suggestion_category_screenshot': 'Screenshots',
        'gallery.suggestion_category_document': 'Dokumente',
        'gallery.suggestion_category_nature': 'Landschaft',
        'gallery.suggestion_category_pet': 'Haustiere',
        'gallery.suggestion_category_food': 'Essen',
        'gallery.suggestion_category_car': 'Auto',
        'gallery.suggestion_category_technology': 'Technologie',
        'gallery.group_none': 'Keine Gruppierung',
        'gallery.group_day': 'Nach Tag',
        'gallery.group_month': 'Nach Monat',
        'gallery.group_year': 'Nach Jahr',
        'gallery.group_type': 'Nach Typ',
        'gallery.search_placeholder': 'Fotos suchen... (z. B. Strand, Sonnenuntergang, Hund)',
        'gallery.sort_title': 'Sortieren',
        'gallery.group_title': 'Gruppieren',
        'gallery.no_results': 'Keine Ergebnisse gefunden',
        'gallery.try_different_search': 'Versuchen Sie eine andere Suche.',
        'gallery.results_count': '{count} Ergebnisse gefunden',
        'gallery.clip_warming_hint': '🧠 Das Modell für die intelligente Suche wird vorbereitet - diese erste Suche kann etwas länger dauern.',
        'gallery.clip_ready_toast': '🧠 Modell für intelligente Suche bereit - zukünftige Suchen sind sofort da.',
        'gallery.no_photos_for_filter': 'Keine Fotos entsprechen diesem Filter',
        'gallery.try_different_filters': 'Versuchen Sie, die Filter zu ändern.',
        'gallery.item_count': '{count} Elemente',
        'gallery.no_photos': 'Keine Fotos',
        'gallery.back_to_years': '← Zurück zu den Jahren',
        'gallery.collapse_btn': 'Einklappen',
    },
});

const GALLERY_SORT_OPTIONS = [
    ['date_desc', t('gallery.sort_date_desc')],
    ['date_asc', t('gallery.sort_date_asc')],
    ['uploaded_desc', t('gallery.sort_uploaded_desc')],
    ['name_asc', t('gallery.sort_name_asc')],
    ['name_desc', t('gallery.sort_name_desc')],
    ['size_desc', t('gallery.sort_size_desc')],
    ['size_asc', t('gallery.sort_size_asc')],
];
// Every gallery filter (structural + smart category) lives only as a
// search-box suggestion now - there's no separate filter dropdown to
// scan through as well, this is the one place to find any of them.
const GALLERY_SEARCH_SUGGESTIONS = [
    ['all', `🖼️ ${t('gallery.suggestion_all')}`],
    ['no_album', `📁 ${t('gallery.suggestion_no_album')}`],
    ['image', `🖼️ ${t('gallery.suggestion_image')}`],
    ['video', `🎬 ${t('gallery.suggestion_video')}`],
    ['favorite', `❤️ ${t('gallery.suggestion_favorite')}`],
    ['not_archived', `📤 ${t('gallery.suggestion_not_archived')}`],
    ['archived', `📦 ${t('gallery.suggestion_archived')}`],
    ['category_screenshot', `📱 ${t('gallery.suggestion_category_screenshot')}`],
    ['category_document', `📄 ${t('gallery.suggestion_category_document')}`],
    ['category_nature', `🌳 ${t('gallery.suggestion_category_nature')}`],
    ['category_pet', `🐾 ${t('gallery.suggestion_category_pet')}`],
    ['category_food', `🍔 ${t('gallery.suggestion_category_food')}`],
    ['category_car', `🚗 ${t('gallery.suggestion_category_car')}`],
    ['category_technology', `💻 ${t('gallery.suggestion_category_technology')}`],
];
// Shown before the user has typed anything - a short, Google-style default
// set instead of dumping the full 14-item menu on every focus. Typing
// anything at all switches to the full filtered/matched list below.
const GALLERY_DEFAULT_SUGGESTION_FILTERS = ['no_album', 'image', 'video'];

const GALLERY_GROUP_OPTIONS = [
    ['none', t('gallery.group_none')],
    ['day', t('gallery.group_day')],
    ['month', t('gallery.group_month')],
    ['year', t('gallery.group_year')],
    ['type', t('gallery.group_type')],
];

function _galleryOptionsHtml(options, current) {
    return options.map(([v, label]) => `<option value="${v}" ${v === current ? 'selected' : ''}>${label}</option>`).join('');
}

// "Yıla Göre" is paginated by YEAR on the backend now (see
// _get_year_grid), same as Month mode - each page is already one whole
// year, already capped server-side (YEAR_VIEW_CAP, kept in sync with the
// backend's constant of the same shape) with the true count sent
// alongside, so there's no client-side capping or cross-page merging
// left to do here at all.
function _renderYearFrame(yearGroup) {
    const groupEl = document.createElement('div');
    groupEl.className = 'date-group';
    groupEl.dataset.key = yearGroup.display_date;
    const overflow = yearGroup.total_count - yearGroup.assets.length;
    groupEl.innerHTML = `
        <div class="date-group-header">
            <span class="date-group-title">${yearGroup.display_date}</span>
            <span class="date-group-count">${t('gallery.item_count', { count: yearGroup.total_count })}</span>
        </div>
        <div class="photo-grid photo-grid--dense">${yearGroup.assets.map(a => renderPhotoCard(a)).join('')}</div>
        ${overflow > 0 ? `
            <button type="button" class="year-overflow-badge"
                data-year="${yearGroup.display_date}" data-keep-count="${yearGroup.assets.length}"
                data-expand-text="+${overflow}" data-fetched="false" data-expanded="false"
            >+${overflow}</button>
        ` : ''}
    `;
    if (overflow > 0) {
        groupEl.querySelector('.year-overflow-badge').onclick = (e) => _toggleYearOverflow(groupEl, e.currentTarget);
    }
    return groupEl;
}

// Expand fetches the year's full asset list on demand (not pre-cached -
// nothing beyond the capped mosaic is downloaded until this is actually
// clicked) and appends just the part not already shown; collapse just
// hides those same cards again instead of removing them, so toggling
// back open doesn't need a second fetch. Slicing off the prefix instead
// of asking the backend for "everything after N" keeps the endpoint
// reusable as a plain "give me this whole year" fetch elsewhere - it's
// safe here because both requests share the same sort/filter, so the
// first keepCount entries are guaranteed identical.
async function _toggleYearOverflow(groupEl, badge) {
    if (badge.dataset.fetched === 'true') {
        const keepCount = parseInt(badge.dataset.keepCount, 10);
        const cards = Array.from(groupEl.querySelector('.photo-grid').querySelectorAll('.photo-card'));
        const collapsing = badge.dataset.expanded === 'true';
        cards.slice(keepCount).forEach(c => c.classList.toggle('hidden', collapsing));
        badge.dataset.expanded = collapsing ? 'false' : 'true';
        badge.textContent = collapsing ? badge.dataset.expandText : t('gallery.collapse_btn');
        badge.classList.toggle('year-overflow-badge--collapse', !collapsing);
        state.viewerList = Array.from($('gallery-grid-container').querySelectorAll('.photo-card:not(.hidden)')).map(c => c.dataset.id);
        return;
    }

    const year = badge.dataset.year;
    const keepCount = parseInt(badge.dataset.keepCount, 10);
    const originalText = badge.textContent;
    badge.disabled = true;
    badge.textContent = t('common.loading');
    try {
        const g = state.gallery;
        const data = await API.getYearAssets(year, g.sortBy, g.filterBy);
        const remainder = data.assets.slice(keepCount);
        const grid = groupEl.querySelector('.photo-grid');
        grid.insertAdjacentHTML('beforeend', remainder.map(a => renderPhotoCard(a)).join(''));
        bindPhotoCards(grid);
        state.viewerList = Array.from($('gallery-grid-container').querySelectorAll('.photo-card')).map(c => c.dataset.id);
        badge.dataset.fetched = 'true';
        badge.dataset.expanded = 'true';
        badge.disabled = false;
        badge.textContent = t('gallery.collapse_btn');
        badge.classList.add('year-overflow-badge--collapse');
    } catch (e) {
        toast(e.message, 'error');
        badge.disabled = false;
        badge.textContent = originalText;
    }
}

async function renderGallery() {
    const g = state.gallery;
    g.page = 1;
    g.groups = [];

    const pc = $('page-content');
    pc.innerHTML = `
        <div class="search-container">
            <div class="search-bar-row">
                <div class="search-input-wrapper">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                    <input type="search" id="gallery-search-input" placeholder="${t('gallery.search_placeholder')}" value="${escHtml(g.selectedLabel || g.searchQuery)}">
                    <div id="gallery-search-suggestions" class="search-suggestions hidden"></div>
                </div>
                <div id="gallery-controls-row" class="gallery-controls-mini" style="${g.searchQuery ? 'display:none' : ''}">
                    <select id="gallery-sort" class="gallery-mini-select" title="${t('gallery.sort_title')}">${_galleryOptionsHtml(GALLERY_SORT_OPTIONS, g.sortBy)}</select>
                    <select id="gallery-group" class="gallery-mini-select" title="${t('gallery.group_title')}">${_galleryOptionsHtml(GALLERY_GROUP_OPTIONS, g.groupBy)}</select>
                </div>
            </div>
        </div>
        <div id="gallery-grid-container"></div>
    `;
    $('gallery-sort').onchange = (e) => { g.sortBy = e.target.value; renderGallery(); };
    $('gallery-group').onchange = (e) => { g.groupBy = e.target.value; renderGallery(); };

    const searchInput = $('gallery-search-input');
    const suggestions = $('gallery-search-suggestions');
    searchInput.oninput = () => {
        g.selectedLabel = ''; // typing replaces a persisted selection - free-text mode from here
        _renderSearchSuggestions(searchInput.value);
        clearTimeout(_gallerySearchTimeout);
        _gallerySearchTimeout = setTimeout(() => _runGallerySearch(searchInput.value), SEARCH_DEBOUNCE_MS);
    };
    searchInput.onkeydown = (e) => {
        if (e.key === 'Enter') { clearTimeout(_gallerySearchTimeout); suggestions.classList.add('hidden'); _runGallerySearch(searchInput.value); }
    };
    searchInput.onfocus = () => {
        // A persisted selection (e.g. "🚗 Araba") sits in the box as
        // display-only text, not a real query - treating it as one here
        // filtered the suggestion list against that stale label (e.g.
        // "araba"), which hid every OTHER option the user might want to
        // pick next, making the next click look like it did nothing.
        _renderSearchSuggestions(g.selectedLabel ? '' : searchInput.value);
        // Selecting it on focus means the very next keystroke just
        // replaces it, instead of the user having to manually clear it first.
        if (g.selectedLabel) searchInput.select();
    };
    // Blur fires before a row's click would otherwise register - delay
    // hiding just long enough for that click to land.
    searchInput.onblur = () => setTimeout(() => suggestions.classList.add('hidden'), 150);

    if (g.searchQuery) {
        await _runGallerySearch(g.searchQuery);
    } else {
        await loadGalleryPage();
    }
}

// Shared with renderGallery()'s oninput handler below - has to live at
// module scope (not local to either function) so a suggestion-row click
// can cancel a debounced text search that's still pending from whatever
// the user typed just before clicking. Without this, typing to filter the
// suggestion list down and then clicking a category before the debounce
// fires looked like the click "did nothing": the category filter applied
// for a moment, then the stale debounced text search fired anyway and
// silently overwrote it right back.
let _gallerySearchTimeout;

// Filters/reorders the category suggestion list as the user types, so a
// query like "a" bubbles "Araba" (which contains it early) toward the top
// instead of always showing the same fixed order regardless of what was
// typed. "Tümü" only makes sense as a reset option, so it's excluded once
// there's an actual query to match against.
function _renderSearchSuggestions(query) {
    const suggestions = $('gallery-search-suggestions');
    const q = query.trim().toLocaleLowerCase(_DATE_LOCALES[getLanguage()]);

    let matches;
    if (!q) {
        // Nothing typed yet: a short default set (Google-style) instead of
        // the full menu - typing anything reveals the rest below.
        matches = GALLERY_SEARCH_SUGGESTIONS.filter(([v]) => GALLERY_DEFAULT_SUGGESTION_FILTERS.includes(v));
    } else {
        matches = GALLERY_SEARCH_SUGGESTIONS
            .filter(([v]) => v !== 'all')
            .map(([v, label]) => [v, label, label.toLocaleLowerCase(_DATE_LOCALES[getLanguage()]).indexOf(q)])
            .filter(([, , idx]) => idx !== -1)
            .sort((a, b) => a[2] - b[2]);
    }

    if (!matches.length) {
        suggestions.classList.add('hidden');
        return;
    }

    suggestions.innerHTML = matches.map(([v, label]) => `<button type="button" class="search-suggestion-row" data-filter="${v}">${label}</button>`).join('');
    suggestions.classList.remove('hidden');
    suggestions.querySelectorAll('.search-suggestion-row').forEach(row => {
        row.onclick = () => {
            clearTimeout(_gallerySearchTimeout);
            state.gallery.searchQuery = '';
            // Kept in the box (not cleared to blank) until the user clicks
            // back in to change it - see the onfocus handler above, which
            // selects it so the next keystroke overwrites it cleanly.
            state.gallery.selectedLabel = row.textContent;
            state.gallery.filterBy = row.dataset.filter;
            renderGallery();
        };
    });
}

// Cached after the first check so every debounced keystroke doesn't cost
// its own round-trip - refreshed to "loaded" locally the moment a search
// response confirms it (clip_was_cold), no need to re-ask the server.
let _clipStatusCache = null;

async function _getClipStatus() {
    if (_clipStatusCache) return _clipStatusCache;
    try {
        _clipStatusCache = await API.getSearchStatus();
    } catch (e) {
        _clipStatusCache = { clip_available: false, clip_loaded: false };
    }
    return _clipStatusCache;
}

async function _runGallerySearch(query) {
    const g = state.gallery;
    g.searchQuery = query;
    $('gallery-controls-row').style.display = query ? 'none' : '';

    if (!query || query.length < 2) {
        g.page = 1;
        await loadGalleryPage();
        return;
    }

    // Shared counter with loadGalleryPage() - both write into the same
    // container, so whichever of the two (filter click vs. typed search)
    // was requested LAST should be the one that's allowed to render,
    // regardless of which one's network response happens to land first.
    const myRequestId = (g.requestId = (g.requestId || 0) + 1);
    const container = $('gallery-grid-container');
    // The CLIP model is loaded lazily on first use (a real, multi-second
    // multi-GB load onto the GPU) - without this, someone's very first
    // search just sat on a blank grid with no clue why it was slower than
    // every search after it.
    const clipStatus = await _getClipStatus();
    if (myRequestId !== g.requestId) return;
    container.innerHTML = (clipStatus.clip_available && !clipStatus.clip_loaded)
        ? `<div class="skeleton" style="height:200px;border-radius:12px;margin-bottom:10px"></div>
           <p class="text-muted" style="text-align:center">${t('gallery.clip_warming_hint')}</p>`
        : `<div class="skeleton" style="height:200px;border-radius:12px"></div>`;

    try {
        const data = await API.search(query, 'smart');
        if (myRequestId !== g.requestId) return;
        if (data.clip_was_cold) {
            _clipStatusCache = { clip_available: true, clip_loaded: true };
            toast(t('gallery.clip_ready_toast'), 'success');
        }
        if (!data.results.length) {
            container.innerHTML = renderEmptyState(t('gallery.no_results'), t('gallery.try_different_search'));
            return;
        }
        container.innerHTML = `
            <p class="search-results-info">${t('gallery.results_count', { count: data.results.length })}</p>
            <div class="photo-grid">${data.results.map(a => renderPhotoCard(a)).join('')}</div>
        `;
        bindPhotoCards(container);
        state.viewerList = data.results.map(a => a.id);
    } catch (e) {
        if (myRequestId === g.requestId) {
            container.innerHTML = renderEmptyState(t('common.error'), e.message);
            toast(e.message, 'error');
        }
    }
}

async function loadGalleryPage() {
    const g = state.gallery;
    // Every call gets its own id, and a response only ever gets applied if
    // it's still the latest one requested. Reproduced directly: clicking a
    // category filter while the initial "All Photos" load was still in
    // flight always lost to that older request when this instead used a
    // plain g.loading boolean guard - the new click's own load either got
    // silently dropped (guard still true) or, if it did fire, whichever
    // response happened to arrive last (not whichever was requested last)
    // won and could still overwrite the filter the user actually asked
    // for with stale "all" results.
    const myRequestId = (g.requestId = (g.requestId || 0) + 1);
    g.loading = true;

    try {
        const data = await API.getGallery(g.page, 60, g.sortBy, g.groupBy, g.filterBy);
        if (myRequestId !== g.requestId) return;
        const container = $('gallery-grid-container');

        if (g.page === 1) container.innerHTML = '';
        if (!data.groups.length && g.page === 1) {
            container.innerHTML = renderEmptyState(t('gallery.no_photos_for_filter'), t('gallery.try_different_filters'));
            g.loading = false;
            return;
        }

        if (g.groupBy === 'month') {
            // Paginated by year, not asset count (see _get_year_month_grid)
            // - each page is already a whole, distinct year, so there's no
            // cross-page merge to handle.
            data.groups.forEach(yearGroup => container.appendChild(_renderYearMonthFrame(yearGroup)));
        } else if (g.groupBy === 'year') {
            // Also paginated by year now (see _get_year_grid), same reasoning
            // - no cross-page merge here either.
            data.groups.forEach(yearGroup => container.appendChild(_renderYearFrame(yearGroup)));
        } else {
            data.groups.forEach(group => {
                // Grouping happens per fetched page (60 assets), so a
                // day that spans a page boundary previously showed up
                // as two separate headers with the same label instead of
                // one - merge into the last existing group when this page's
                // first bucket continues the same one instead of always
                // starting a new block.
                const lastGroupEl = container.lastElementChild;
                if (group.display_date !== null && lastGroupEl?.dataset.key === group.display_date) {
                    const grid = lastGroupEl.querySelector('.photo-grid');
                    grid.insertAdjacentHTML('beforeend', group.assets.map(a => renderPhotoCard(a)).join(''));
                    const countEl = lastGroupEl.querySelector('.date-group-count');
                    const runningTotal = (parseInt(countEl.textContent, 10) || 0) + group.assets.length;
                    countEl.textContent = t('gallery.item_count', { count: runningTotal });
                    return;
                }

                const groupEl = document.createElement('div');
                groupEl.className = 'date-group';
                if (group.display_date !== null) groupEl.dataset.key = group.display_date;
                groupEl.innerHTML = `
                    ${group.display_date ? `
                    <div class="date-group-header">
                        <span class="date-group-title">${group.display_date}</span>
                        <span class="date-group-count">${t('gallery.item_count', { count: group.assets.length })}</span>
                    </div>` : ''}
                    <div class="photo-grid">${group.assets.map(a => renderPhotoCard(a)).join('')}</div>
                `;
                container.appendChild(groupEl);
            });
        }

        g.totalPages = data.total_pages;
        bindPhotoCards(container);
        state.viewerList = Array.from(container.querySelectorAll('.photo-card')).map(c => c.dataset.id);

        const oldSentinel = $('gallery-scroll-sentinel');
        if (oldSentinel) oldSentinel.remove();

        if (data.total_pages > g.page) {
            const sentinel = document.createElement('div');
            sentinel.id = 'gallery-scroll-sentinel';
            sentinel.style.height = '1px';
            container.appendChild(sentinel);
            const obs = new IntersectionObserver(async (entries) => {
                if (entries[0].isIntersecting) {
                    obs.disconnect();
                    sentinel.remove();
                    g.page++;
                    g.loading = false;
                    await loadGalleryPage();
                }
            });
            obs.observe(sentinel);
        }
    } catch (e) {
        if (myRequestId === g.requestId) toast(e.message, 'error');
    }
    if (myRequestId === g.requestId) g.loading = false;
}

// Each month cell shows a fixed square mosaic (6x6 = 36, matching the
// backend's MONTH_CELL_CAP in gallery_service.py - anything past that is
// just a "+N" badge, not rendered, so a 300-photo month doesn't balloon
// the DOM. The cap is enforced server-side now (see _get_year_month_grid),
// so there's nothing to slice client-side anymore.

// "Aya Göre": one full calendar year as a 4-columns x 3-rows frame, each
// cell a month with its own dense mosaic (or an empty placeholder for a
// month with nothing in it, so the 12-slot grid stays a real calendar
// shape instead of collapsing to however many months happen to have photos).
function _renderYearMonthFrame(yearGroup) {
    const groupEl = document.createElement('div');
    groupEl.className = 'date-group';
    groupEl.innerHTML = `
        <div class="date-group-header">
            <span class="date-group-title">${yearGroup.year}</span>
        </div>
        <div class="month-year-grid"></div>
    `;

    const grid = groupEl.querySelector('.month-year-grid');
    yearGroup.months.forEach(m => {
        // The backend already caps m.assets at MONTH_CELL_CAP (36, a 6x6
        // mosaic) and sends the true count separately as total_count - a
        // month with thousands of photos doesn't ship
        // them all just to render this fixed mosaic, so the overflow is
        // total_count minus however many actually came back, not a
        // client-side slice of an already-complete list.
        const shown = m.assets;
        const overflow = m.total_count - shown.length;

        const cellEl = document.createElement('div');
        cellEl.className = 'month-cell';
        cellEl.innerHTML = `
            <div class="month-cell-header">
                <span>${m.display_date}</span>
                <span class="month-cell-count">${m.total_count}</span>
            </div>
            ${shown.length
                ? `<div class="photo-grid month-cell-grid">${shown.map(a => renderPhotoCard(a)).join('')}</div>`
                : `<div class="month-cell-empty">${t('gallery.no_photos')}</div>`}
            ${overflow > 0 ? `<button type="button" class="month-cell-more">+${overflow}</button>` : ''}
        `;
        if (overflow > 0) {
            cellEl.querySelector('.month-cell-more').onclick = (e) => {
                e.stopPropagation();
                _openMonthDrilldown(yearGroup.year, m);
            };
        }
        grid.appendChild(cellEl);
    });

    return groupEl;
}

// Opens every photo in one month (not just the fixed mosaic shown in its
// cell) as its own full-size browsing grid, since a month can easily have
// hundreds/thousands of photos - too many to usefully cram into the year
// frame at once, and no longer even sent to the client until this is
// actually opened (see get_month_assets on the backend).
async function _openMonthDrilldown(year, month) {
    const pc = $('page-content');
    pc.innerHTML = `<div class="skeleton" style="height:400px;border-radius:12px"></div>`;
    let assets;
    try {
        const g = state.gallery;
        const data = await API.getMonthAssets(year, month.month, g.sortBy, g.filterBy);
        assets = data.assets;
    } catch (e) {
        toast(e.message, 'error');
        return;
    }

    pc.innerHTML = `
        <div style="margin-bottom:16px">
            <button class="btn btn-secondary btn-sm" onclick="renderGallery()">${t('gallery.back_to_years')}</button>
        </div>
        <div class="date-group">
            <div class="date-group-header">
                <span class="date-group-title">${month.display_date} ${year}</span>
                <span class="date-group-count">${t('gallery.item_count', { count: assets.length })}</span>
            </div>
            <div class="photo-grid">${assets.map(a => renderPhotoCard(a)).join('')}</div>
        </div>
    `;
    bindPhotoCards(pc.querySelector('.date-group'));
    state.viewerList = assets.map(a => a.id);
}


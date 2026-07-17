/**
 * Wimmich - "Tüm Fotoğraflar" (Gallery): the app's main/default view, a
 * sortable/filterable/groupable grid (date_desc + month grouping gives
 * the old chronological Timeline view as just one filter combination
 * among others). Reuses renderPhotoCard/bindPhotoCards from timeline.js.
 */
registerTranslations({
    en: {
        'gallery.sort_date_desc': 'Date (Newest → Oldest)',
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
        'gallery.no_photos_for_filter': 'No photos match this filter',
        'gallery.try_different_filters': 'Try changing the filters.',
        'gallery.item_count': '{count} items',
        'gallery.no_photos': 'No photos',
        'gallery.back_to_years': '← Back to Years',
    },
    tr: {
        'gallery.sort_date_desc': 'Tarih (Yeni → Eski)',
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
        'gallery.no_photos_for_filter': 'Bu filtreyle eşleşen fotoğraf yok',
        'gallery.try_different_filters': 'Filtreleri değiştirmeyi deneyin.',
        'gallery.item_count': '{count} öğe',
        'gallery.no_photos': 'Fotoğraf yok',
        'gallery.back_to_years': '← Yıllara Dön',
    },
    fr: {
        'gallery.sort_date_desc': 'Date (Récent → Ancien)',
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
        'gallery.no_photos_for_filter': 'Aucune photo ne correspond à ce filtre',
        'gallery.try_different_filters': 'Essayez de modifier les filtres.',
        'gallery.item_count': '{count} éléments',
        'gallery.no_photos': 'Aucune photo',
        'gallery.back_to_years': '← Retour aux années',
    },
    de: {
        'gallery.sort_date_desc': 'Datum (Neu → Alt)',
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
        'gallery.no_photos_for_filter': 'Keine Fotos entsprechen diesem Filter',
        'gallery.try_different_filters': 'Versuchen Sie, die Filter zu ändern.',
        'gallery.item_count': '{count} Elemente',
        'gallery.no_photos': 'Keine Fotos',
        'gallery.back_to_years': '← Zurück zu den Jahren',
    },
});

const GALLERY_SORT_OPTIONS = [
    ['date_desc', t('gallery.sort_date_desc')],
    ['date_asc', t('gallery.sort_date_asc')],
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

// Year grouping is a dense glance-across-everything mosaic; Month has its
// own dedicated year-frame renderer below (_renderYearMonthFrame) instead
// of going through this flat path at all; Day/none/type stay normal-size.
function _galleryGridDensityClass(groupBy) {
    return groupBy === 'year' ? ' photo-grid--dense' : '';
}

// A year with hundreds/thousands of photos rendered as one unbroken grid
// was heavy to load and scroll through - cap how many get rendered
// directly per year and roll the rest into the same "+N" badge/overflow
// pattern _renderYearMonthFrame already uses for month cells, instead of
// just dumping everything in.
const YEAR_VIEW_MAX = 30 * 10;
// display_date (the year label) -> Asset[] fetched but not yet rendered,
// shown on demand when that year's overflow badge is clicked.
const _yearOverflowAssets = new Map();

function _appendYearCapped(groupEl, assets) {
    const grid = groupEl.querySelector('.photo-grid');
    const key = groupEl.dataset.key;
    const renderedSoFar = parseInt(groupEl.dataset.renderedCount || '0', 10);
    const remaining = Math.max(0, YEAR_VIEW_MAX - renderedSoFar);
    const toRender = assets.slice(0, remaining);
    const overflowAssets = assets.slice(remaining);

    if (toRender.length) {
        grid.insertAdjacentHTML('beforeend', toRender.map(a => renderPhotoCard(a)).join(''));
        // No bindPhotoCards() here - loadGalleryPage() (the only caller
        // during a normal page load) already does one full bindPhotoCards(
        // container) pass after this returns; calling it again here would
        // double-attach the addEventListener-based mousedown drag-select
        // handler to these same cards.
    }
    groupEl.dataset.renderedCount = String(renderedSoFar + toRender.length);

    if (overflowAssets.length) {
        _yearOverflowAssets.set(key, (_yearOverflowAssets.get(key) || []).concat(overflowAssets));
    }
    _updateYearOverflowBadge(groupEl, key);
}

function _updateYearOverflowBadge(groupEl, key) {
    const overflow = (_yearOverflowAssets.get(key) || []).length;
    let badge = groupEl.querySelector('.year-overflow-badge');
    if (overflow > 0) {
        if (!badge) {
            badge = document.createElement('button');
            badge.type = 'button';
            badge.className = 'year-overflow-badge';
            groupEl.querySelector('.photo-grid').insertAdjacentElement('afterend', badge);
            badge.onclick = () => _expandYearOverflow(groupEl, key);
        }
        badge.textContent = `+${overflow}`;
    } else if (badge) {
        badge.remove();
    }
}

function _expandYearOverflow(groupEl, key) {
    const assets = _yearOverflowAssets.get(key) || [];
    _yearOverflowAssets.delete(key);
    const grid = groupEl.querySelector('.photo-grid');
    grid.insertAdjacentHTML('beforeend', assets.map(a => renderPhotoCard(a)).join(''));
    bindPhotoCards(grid);
    groupEl.dataset.renderedCount = String(parseInt(groupEl.dataset.renderedCount || '0', 10) + assets.length);
    state.viewerList = Array.from($('gallery-grid-container').querySelectorAll('.photo-card')).map(c => c.dataset.id);
    _updateYearOverflowBadge(groupEl, key);
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

async function _runGallerySearch(query) {
    const g = state.gallery;
    g.searchQuery = query;
    $('gallery-controls-row').style.display = query ? 'none' : '';

    if (!query || query.length < 2) {
        g.page = 1;
        await loadGalleryPage();
        return;
    }

    const container = $('gallery-grid-container');
    try {
        const data = await API.search(query, 'smart');
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
    } catch (e) { toast(e.message, 'error'); }
}

async function loadGalleryPage() {
    const g = state.gallery;
    if (g.loading) return;
    g.loading = true;

    try {
        const data = await API.getGallery(g.page, 60, g.sortBy, g.groupBy, g.filterBy);
        const container = $('gallery-grid-container');

        if (g.page === 1) {
            container.innerHTML = '';
            // A fresh load (not a continued infinite-scroll page) - clear
            // out any overflow assets cached from a previous render/mode,
            // or a stale entry would leak into this one (wrong badge count,
            // duplicate assets if it's later expanded).
            _yearOverflowAssets.clear();
        }
        if (!data.groups.length && g.page === 1) {
            container.innerHTML = renderEmptyState(t('gallery.no_photos_for_filter'), t('gallery.try_different_filters'));
            g.loading = false;
            return;
        }

        if (g.groupBy === 'month') {
            // Month mode is paginated by year, not asset count (see
            // _get_year_month_grid) - each page is already a whole,
            // distinct year, so there's no cross-page merge to handle.
            data.groups.forEach(yearGroup => container.appendChild(_renderYearMonthFrame(yearGroup)));
        } else {
            data.groups.forEach(group => {
                // Grouping happens per fetched page (60 assets), so a
                // year/day that spans a page boundary previously showed up
                // as two separate headers with the same label instead of
                // one - merge into the last existing group when this page's
                // first bucket continues the same one instead of always
                // starting a new block.
                const lastGroupEl = container.lastElementChild;
                if (group.display_date !== null && lastGroupEl?.dataset.key === group.display_date) {
                    if (g.groupBy === 'year') {
                        _appendYearCapped(lastGroupEl, group.assets);
                    } else {
                        const grid = lastGroupEl.querySelector('.photo-grid');
                        grid.insertAdjacentHTML('beforeend', group.assets.map(a => renderPhotoCard(a)).join(''));
                    }
                    const countEl = lastGroupEl.querySelector('.date-group-count');
                    const runningTotal = (parseInt(countEl.textContent, 10) || 0) + group.assets.length;
                    countEl.textContent = t('gallery.item_count', { count: runningTotal });
                    return;
                }

                const groupEl = document.createElement('div');
                groupEl.className = 'date-group';
                if (group.display_date !== null) groupEl.dataset.key = group.display_date;
                if (g.groupBy === 'year') groupEl.dataset.renderedCount = '0';
                groupEl.innerHTML = `
                    ${group.display_date ? `
                    <div class="date-group-header">
                        <span class="date-group-title">${group.display_date}</span>
                        <span class="date-group-count">${t('gallery.item_count', { count: group.assets.length })}</span>
                    </div>` : ''}
                    <div class="photo-grid${_galleryGridDensityClass(g.groupBy)}">${g.groupBy === 'year' ? '' : group.assets.map(a => renderPhotoCard(a)).join('')}</div>
                `;
                container.appendChild(groupEl);
                if (g.groupBy === 'year') _appendYearCapped(groupEl, group.assets);
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
    } catch (e) { toast(e.message, 'error'); }
    g.loading = false;
}

// Each month cell shows a fixed square mosaic (6x6 on every device - 9x9
// was too many thumbnails to load comfortably) - anything past that is
// just a "+N" badge, not rendered, so a 300-photo month doesn't balloon
// the DOM.
const MONTH_CELL_COLS = 6;

function _monthCellMax() {
    return MONTH_CELL_COLS * MONTH_CELL_COLS;
}

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
    const cellMax = _monthCellMax();
    yearGroup.months.forEach(m => {
        const shown = m.assets.slice(0, cellMax);
        const overflow = m.assets.length - shown.length;

        const cellEl = document.createElement('div');
        cellEl.className = 'month-cell';
        cellEl.innerHTML = `
            <div class="month-cell-header">
                <span>${m.display_date}</span>
                <span class="month-cell-count">${m.assets.length}</span>
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

// Opens every photo in one month (not just the 7x7 shown in its cell) as
// its own full-size browsing grid, since a month can easily have hundreds
// of photos - too many to usefully cram into the year frame at once.
function _openMonthDrilldown(year, month) {
    const pc = $('page-content');
    pc.innerHTML = `
        <div style="margin-bottom:16px">
            <button class="btn btn-secondary btn-sm" onclick="renderGallery()">${t('gallery.back_to_years')}</button>
        </div>
        <div class="date-group">
            <div class="date-group-header">
                <span class="date-group-title">${month.display_date} ${year}</span>
                <span class="date-group-count">${t('gallery.item_count', { count: month.assets.length })}</span>
            </div>
            <div class="photo-grid">${month.assets.map(a => renderPhotoCard(a)).join('')}</div>
        </div>
    `;
    bindPhotoCards(pc.querySelector('.date-group'));
    state.viewerList = month.assets.map(a => a.id);
}


/**
 * Wimmich - Shared mutable app state and page router table.
 * Every feature script reads/writes `state`; `pages` is populated with
 * render functions once those scripts load (see index.html script order).
 */
const state = {
    user: null,
    currentPage: 'gallery',
    gallery: {
        groups: [], page: 1, totalPages: 0, loading: false,
        sortBy: 'date_desc', groupBy: 'none', filterBy: 'all',
        searchQuery: '', selectedLabel: '',
    },
    selectedAssets: new Set(),
    viewerAsset: null,
    viewerList: [],
    viewerIndex: 0,
    albums: [],
    currentAlbum: null,
};

// Titles are getters (not plain strings) so they re-evaluate t() at
// navigation time instead of being frozen in whatever language was active
// when this file first loaded.
const pages = {
    gallery: { get title() { return t('nav.gallery'); }, render: () => renderGallery() },
    albums: { get title() { return t('nav.albums'); }, render: () => renderAlbums() },
    favorites: { get title() { return t('nav.favorites'); }, render: () => renderFavorites() },
    archive: { get title() { return t('nav.archive'); }, render: () => renderArchive() },
    people: { get title() { return t('nav.people'); }, render: () => renderPeople() },
    map: { get title() { return t('nav.map'); }, render: () => renderMap() },
    sharing: { get title() { return t('nav.sharing'); }, render: () => renderSharing() },
    memories: { get title() { return t('nav.memories'); }, render: () => renderMemories() },
    trash: { get title() { return t('nav.trash'); }, render: () => renderTrash() },
    duplicates: { get title() { return t('nav.duplicates'); }, render: () => renderDuplicates() },
    admin: { get title() { return t('admin.panel_title'); }, render: () => renderAdmin() },
};

let adminPollInterval = null;

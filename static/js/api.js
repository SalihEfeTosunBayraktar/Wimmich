/**
 * Wimmich API Client
 * Handles all HTTP communication with the backend
 */
// Web Crypto's subtle.digest only works in a secure context (HTTPS, or
// localhost) - a plain-HTTP LAN address (very common for a self-hosted
// setup) doesn't qualify, where crypto.subtle is simply undefined. Returns
// null in that case rather than throwing, so upload just silently skips
// the integrity check exactly like an older client would - see
// asset_router.py's upload endpoint, which already treats a missing
// checksum as "nothing to verify against".
async function _computeFileChecksum(file) {
    if (!window.crypto?.subtle) return null;
    try {
        const buf = await file.arrayBuffer();
        const hashBuf = await crypto.subtle.digest('SHA-256', buf);
        return Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
        return null; // never let a hashing failure block the actual upload
    }
}

const API = {
    token: localStorage.getItem('wimmich_token') || sessionStorage.getItem('wimmich_token'),

    async request(url, options = {}) {
        const headers = { ...options.headers };
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        if (options.body && !(options.body instanceof FormData)) {
            headers['Content-Type'] = 'application/json';
            options.body = JSON.stringify(options.body);
        }
        const resp = await fetch(url, { ...options, headers });
        // A 401 on a normal in-app request means the session expired mid-use
        // -> clear it and reload to the login screen. But the login/register
        // calls themselves also return 401 (wrong password), and reloading
        // there swallowed the "wrong email or password" error entirely: the
        // page just bounced back to the login screen with no message, looking
        // like a broken login. skipAuthReload lets those callers get a normal
        // thrown error to show instead.
        if (resp.status === 401 && !options.skipAuthReload) {
            this.token = null;
            localStorage.removeItem('wimmich_token');
            sessionStorage.removeItem('wimmich_token');
            location.reload();
            return;
        }
        if (!resp.ok) {
            const err = await resp.json().catch(() => ({ detail: resp.statusText }));
            const error = new Error(err.detail || 'API Error');
            error.status = resp.status; // lets callers distinguish 401/403/429
            throw error;
        }
        return resp.json();
    },

    setToken(t, remember = false) {
        this.token = t;
        if (remember) {
            localStorage.setItem('wimmich_token', t);
            sessionStorage.removeItem('wimmich_token');
        } else {
            sessionStorage.setItem('wimmich_token', t);
            localStorage.removeItem('wimmich_token');
        }
    },
    clearToken() {
        this.token = null;
        localStorage.removeItem('wimmich_token');
        sessionStorage.removeItem('wimmich_token');
    },

    getHealth() { return this.request('/api/health'); },

    // Auth - skipAuthReload so a 401 (wrong password) surfaces as a normal
    // error to show, instead of the generic session-expired page reload.
    register(email, password, name) {
        return this.request('/api/auth/register', { method: 'POST', body: { email, password, name }, skipAuthReload: true });
    },
    login(email, password) {
        return this.request('/api/auth/login', { method: 'POST', body: { email, password }, skipAuthReload: true });
    },
    getMe() { return this.request('/api/auth/me'); },
    updateMe(data) { return this.request('/api/auth/me', { method: 'PUT', body: data }); },
    logout() { return this.request('/api/auth/logout', { method: 'POST' }); },

    // Assets
    async uploadFile(file) {
        const fd = new FormData();
        fd.append('files', file);
        if (file.lastModified) fd.append('last_modified', String(file.lastModified));
        const checksum = await _computeFileChecksum(file);
        if (checksum) fd.append('checksums', checksum);
        return this.request('/api/assets/upload', { method: 'POST', body: fd });
    },
    getGallery(page = 1, perPage = 60, sortBy = 'date_desc', groupBy = 'none', filterBy = 'all') {
        return this.request(`/api/assets/gallery?page=${page}&per_page=${perPage}&sort_by=${sortBy}&group_by=${groupBy}&filter_by=${encodeURIComponent(filterBy)}`);
    },
    getMonthAssets(year, month, sortBy = 'date_desc', filterBy = 'all') {
        return this.request(`/api/assets/gallery/month?year=${year}&month=${month}&sort_by=${sortBy}&filter_by=${encodeURIComponent(filterBy)}`);
    },
    getYearAssets(year, sortBy = 'date_desc', filterBy = 'all') {
        return this.request(`/api/assets/gallery/year?year=${year}&sort_by=${sortBy}&filter_by=${encodeURIComponent(filterBy)}`);
    },
    getAsset(id) { return this.request(`/api/assets/${id}`); },
    getSimilarAssets(id) { return this.request(`/api/assets/${id}/similar`); },
    getAssetFile(id) { return `/api/assets/${id}/file`; },
    getThumb(id, size = 'medium') { return `/api/assets/${id}/thumbnail?size=${size}`; },
    getDownloadZipUrl(ids) {
        const params = ids.map(id => `ids=${encodeURIComponent(id)}`).join('&');
        return `/api/assets/download-zip?${params}`;
    },
    updateAsset(id, data) { return this.request(`/api/assets/${id}`, { method: 'PUT', body: data }); },
    toggleFavorite(id) { return this.request(`/api/assets/${id}/favorite`, { method: 'PUT' }); },
    toggleArchive(id) { return this.request(`/api/assets/${id}/archive`, { method: 'PUT' }); },
    regenerateThumbnail(id) { return this.request(`/api/assets/${id}/regenerate-thumbnail`, { method: 'POST' }); },
    retranscodeVideo(id) { return this.request(`/api/assets/${id}/retranscode`, { method: 'POST' }); },
    trashAsset(id) { return this.request(`/api/assets/${id}`, { method: 'DELETE' }); },
    restoreAsset(id) { return this.request(`/api/assets/${id}/restore`, { method: 'POST' }); },
    deleteAsset(id) { return this.request(`/api/assets/${id}/permanent`, { method: 'DELETE' }); },
    bulkAction(assetIds, action) {
        return this.request('/api/assets/bulk', { method: 'POST', body: { asset_ids: assetIds, action } });
    },
    getTrash() { return this.request('/api/assets/trash'); },
    getDuplicates(sortBy = 'date_desc', fileType = '', location = '', mode = 'exact') {
        let url = `/api/assets/duplicates?sort_by=${sortBy}&mode=${mode}`;
        if (fileType) url += `&file_type=${fileType}`;
        if (location) url += `&location=${encodeURIComponent(location)}`;
        return this.request(url);
    },
    scanDuplicates() { return this.request('/api/assets/duplicates/scan', { method: 'POST' }); },
    ignoreDuplicateGroup(checksum) { return this.request(`/api/assets/duplicates/${checksum}/ignore`, { method: 'POST' }); },
    ignoreVisualDuplicateGroup(assetIds) { return this.request('/api/assets/duplicates/visual/ignore', { method: 'POST', body: { asset_ids: assetIds } }); },
    getFavorites() { return this.request('/api/assets/favorites'); },
    getArchived() { return this.request('/api/assets/archived'); },
    getStatistics() { return this.request('/api/assets/statistics'); },
    getMemories() { return this.request('/api/assets/memories/today'); },
    getSmartCategories() { return this.request('/api/assets/smart-categories'); },
    correctCategory(assetId, category) {
        return this.request(`/api/assets/${assetId}/category-correction`, { method: 'POST', body: { category } });
    },

    // Albums
    getAlbums() { return this.request('/api/albums'); },
    createAlbum(name, description, assetIds, isSmart, smartQuery) {
        return this.request('/api/albums', {
            method: 'POST',
            body: { name, description, asset_ids: assetIds, is_smart: !!isSmart, smart_query: smartQuery || null },
        });
    },
    getAlbum(id) { return this.request(`/api/albums/${id}`); },
    updateAlbum(id, data) { return this.request(`/api/albums/${id}`, { method: 'PUT', body: data }); },
    deleteAlbum(id) { return this.request(`/api/albums/${id}`, { method: 'DELETE' }); },
    addToAlbum(albumId, assetIds) {
        return this.request(`/api/albums/${albumId}/assets`, { method: 'POST', body: { asset_ids: assetIds } });
    },
    removeFromAlbum(albumId, assetIds) {
        return this.request(`/api/albums/${albumId}/assets`, { method: 'DELETE', body: { asset_ids: assetIds } });
    },
    getAlbumShareTargets() { return this.request('/api/albums/share-targets'); },
    shareAlbumWithAccount(albumId, userId, canEdit) {
        return this.request(`/api/albums/${albumId}/users`, { method: 'POST', body: { user_id: userId, can_edit: canEdit } });
    },
    unshareAlbumAccount(albumId, userId) {
        return this.request(`/api/albums/${albumId}/users/${userId}`, { method: 'DELETE' });
    },

    // Search
    search(q, type = 'smart', opts = {}) {
        let url = `/api/search?q=${encodeURIComponent(q)}&search_type=${type}`;
        if (opts.limit) url += `&limit=${opts.limit}`;
        return this.request(url);
    },
    getSearchStatus() { return this.request('/api/search/status'); },

    // People
    getPeople() { return this.request('/api/people'); },
    getNamingQueue() { return this.request('/api/people/naming-queue'); },
    getPerson(id) { return this.request(`/api/people/${id}`); },
    updatePerson(id, data) { return this.request(`/api/people/${id}`, { method: 'PUT', body: data }); },
    mergePeople(sourceId, targetId) {
        return this.request('/api/people/merge', { method: 'POST', body: { source_person_id: sourceId, target_person_id: targetId } });
    },
    reassignFace(faceId, targetPersonId) {
        return this.request(`/api/people/faces/${faceId}/reassign`, { method: 'POST', body: { target_person_id: targetPersonId } });
    },
    deleteFace(faceId) {
        return this.request(`/api/people/faces/${faceId}`, { method: 'DELETE' });
    },
    dissolvePerson(personId) {
        return this.request(`/api/people/${personId}/dissolve`, { method: 'POST' });
    },

    // Map
    getMapMarkers() { return this.request('/api/map/markers'); },
    getCityStats() { return this.request('/api/map/cities'); },

    // Shares
    getShares() { return this.request('/api/shares'); },
    createShare(data) { return this.request('/api/shares', { method: 'POST', body: data }); },
    deleteShare(id) { return this.request(`/api/shares/${id}`, { method: 'DELETE' }); },
    viewShared(key, password) {
        let url = `/api/shared/${key}`;
        if (password) url += `?password=${encodeURIComponent(password)}`;
        return this.request(url);
    },

};

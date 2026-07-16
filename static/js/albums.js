/**
 * Wimmich - Albums list, detail view, and create/add-to-album modal.
 */
registerTranslations({
    en: {
        'albums.empty_title': 'No albums yet',
        'albums.empty_desc': 'Create an album to organize your photos.',
        'albums.new_album_button': '+ New Album',
        'albums.item_count': '{count} items',
        'albums.back_to_albums': '← Albums',
        'albums.share_button': 'Share',
        'albums.set_cover_title': 'Set as album cover',
        'albums.cover_updated': 'Album cover updated',
        'albums.confirm_delete': 'Are you sure you want to delete this album?',
        'albums.deleted': 'Album deleted',
        'albums.name_required': 'Album name required',
        'albums.created': 'Album created',
        'albums.select_photos_first': 'Select photos first',
        'albums.no_albums_hint': "You don't have any albums yet. Create one from above.",
        'albums.items_added': '{count} items added to album',
    },
    tr: {
        'albums.empty_title': 'Henüz albüm yok',
        'albums.empty_desc': 'Fotoğraflarınızı düzenlemek için bir albüm oluşturun.',
        'albums.new_album_button': '+ Yeni Albüm',
        'albums.item_count': '{count} öğe',
        'albums.back_to_albums': '← Albümler',
        'albums.share_button': 'Paylaş',
        'albums.set_cover_title': 'Albüm kapağı yap',
        'albums.cover_updated': 'Albüm kapağı güncellendi',
        'albums.confirm_delete': 'Bu albümü silmek istediğinize emin misiniz?',
        'albums.deleted': 'Albüm silindi',
        'albums.name_required': 'Albüm adı gerekli',
        'albums.created': 'Albüm oluşturuldu',
        'albums.select_photos_first': 'Önce fotoğraf seçin',
        'albums.no_albums_hint': 'Henüz albümünüz yok. Yukarıdan yeni bir tane oluşturun.',
        'albums.items_added': '{count} öğe albüme eklendi',
    },
    fr: {
        'albums.empty_title': "Pas encore d'albums",
        'albums.empty_desc': 'Créez un album pour organiser vos photos.',
        'albums.new_album_button': '+ Nouvel album',
        'albums.item_count': '{count} éléments',
        'albums.back_to_albums': '← Albums',
        'albums.share_button': 'Partager',
        'albums.set_cover_title': "Définir comme couverture de l'album",
        'albums.cover_updated': "Couverture de l'album mise à jour",
        'albums.confirm_delete': 'Voulez-vous vraiment supprimer cet album ?',
        'albums.deleted': 'Album supprimé',
        'albums.name_required': "Le nom de l'album est requis",
        'albums.created': 'Album créé',
        'albums.select_photos_first': "Sélectionnez d'abord des photos",
        'albums.no_albums_hint': "Vous n'avez pas encore d'album. Créez-en un ci-dessus.",
        'albums.items_added': '{count} éléments ajoutés à l\'album',
    },
    de: {
        'albums.empty_title': 'Noch keine Alben',
        'albums.empty_desc': 'Erstellen Sie ein Album, um Ihre Fotos zu organisieren.',
        'albums.new_album_button': '+ Neues Album',
        'albums.item_count': '{count} Elemente',
        'albums.back_to_albums': '← Alben',
        'albums.share_button': 'Teilen',
        'albums.set_cover_title': 'Als Albumcover festlegen',
        'albums.cover_updated': 'Albumcover aktualisiert',
        'albums.confirm_delete': 'Möchten Sie dieses Album wirklich löschen?',
        'albums.deleted': 'Album gelöscht',
        'albums.name_required': 'Albumname erforderlich',
        'albums.created': 'Album erstellt',
        'albums.select_photos_first': 'Wählen Sie zuerst Fotos aus',
        'albums.no_albums_hint': 'Sie haben noch keine Alben. Erstellen Sie oben eines.',
        'albums.items_added': '{count} Elemente zum Album hinzugefügt',
    },
});

async function renderAlbums() {
    try {
        const data = await API.getAlbums();
        const pc = $('page-content');
        if (!data.albums.length) {
            pc.innerHTML = renderEmptyState(t('albums.empty_title'), t('albums.empty_desc')) +
                `<div style="text-align:center;margin-top:16px"><button class="btn btn-primary" onclick="showAlbumModal()">${t('albums.new_album_button')}</button></div>`;
            return;
        }
        pc.innerHTML = `
            <div style="margin-bottom:16px"><button class="btn btn-primary" onclick="showAlbumModal()">${t('albums.new_album_button')}</button></div>
            <div class="album-grid">${data.albums.map(a => `
                <div class="album-card" onclick="openAlbum('${a.id}')">
                    <div class="album-card-cover">
                        ${a.cover_thumb ? `<img src="${a.cover_thumb}" alt="" loading="lazy">` : '<div class="empty-cover">📁</div>'}
                    </div>
                    <div class="album-card-info">
                        <div class="album-card-name">${escHtml(a.name)}</div>
                        <div class="album-card-meta">${t('albums.item_count', { count: a.asset_count })} · ${formatDateShort(a.updated_at)}</div>
                    </div>
                </div>
            `).join('')}</div>
        `;
    } catch (e) { toast(e.message, 'error'); }
}

async function openAlbum(id) {
    try {
        const album = await API.getAlbum(id);
        state.currentAlbum = album;
        const pc = $('page-content');
        $('topbar-title').textContent = album.name;

        pc.innerHTML = `
            <div class="album-detail-header">
                <button class="btn btn-secondary btn-sm" onclick="navigateTo('albums')">${t('albums.back_to_albums')}</button>
                <h3 class="album-detail-title">${escHtml(album.name)}</h3>
                <span class="text-muted">${t('albums.item_count', { count: album.assets?.length || 0 })}</span>
                <button class="btn btn-secondary btn-sm" onclick="showShareModal('ALBUM', '${id}')">🔗 ${t('albums.share_button')}</button>
                <button class="btn btn-danger btn-sm" onclick="deleteAlbum('${id}')">${t('common.delete')}</button>
            </div>
            ${album.description ? `<p style="color:var(--text-secondary);margin-bottom:16px">${escHtml(album.description)}</p>` : ''}
            <div class="photo-grid">${(album.assets || []).map(a => renderPhotoCard(a)).join('')}</div>
        `;
        bindPhotoCards(pc);
        pc.querySelectorAll('.photo-card').forEach(card => {
            const overlay = card.querySelector('.photo-overlay');
            const btn = document.createElement('button');
            btn.className = 'photo-cover-btn';
            btn.title = t('albums.set_cover_title');
            btn.textContent = '⭐';
            btn.onclick = (e) => { e.stopPropagation(); setAlbumCover(id, card.dataset.id); };
            overlay.appendChild(btn);
        });
        state.viewerList = (album.assets || []).map(a => a.id);
    } catch (e) { toast(e.message, 'error'); }
}

async function setAlbumCover(albumId, assetId) {
    try {
        await API.updateAlbum(albumId, { cover_asset_id: assetId });
        toast(t('albums.cover_updated'), 'success');
    } catch (e) {
        toast(e.message, 'error');
    }
}

async function deleteAlbum(id) {
    if (!confirm(t('albums.confirm_delete'))) return;
    await API.deleteAlbum(id);
    toast(t('albums.deleted'), 'success');
    navigateTo('albums');
}

function showAlbumModal() {
    $('album-modal').classList.remove('hidden');
    $('album-name').value = '';
    $('album-desc').value = '';
    $('album-name').focus();
}

function initAlbumModal() {
    $('album-modal-close').onclick = () => $('album-modal').classList.add('hidden');
    $('album-modal-cancel').onclick = () => $('album-modal').classList.add('hidden');
    $('album-modal-save').onclick = async () => {
        const name = $('album-name').value.trim();
        if (!name) { toast(t('albums.name_required'), 'warning'); return; }
        const ids = state.selectedAssets.size > 0 ? [...state.selectedAssets] : undefined;
        await API.createAlbum(name, $('album-desc').value.trim() || null, ids);
        $('album-modal').classList.add('hidden');
        toast(t('albums.created'), 'success');
        clearSelection();
        if (state.currentPage === 'albums') navigateTo('albums');
    };
}

async function showAddToAlbumModal() {
    if (state.selectedAssets.size === 0) { toast(t('albums.select_photos_first'), 'warning'); return; }

    const modal = $('add-to-album-modal');
    const list = $('add-to-album-list');
    list.innerHTML = `<p class="text-muted">${t('common.loading')}</p>`;
    modal.classList.remove('hidden');

    try {
        const data = await API.getAlbums();
        if (!data.albums.length) {
            list.innerHTML = `<p class="text-muted">${t('albums.no_albums_hint')}</p>`;
            return;
        }
        list.innerHTML = data.albums.map(a => `
            <div class="album-pick-row" data-id="${a.id}">
                <div class="album-pick-cover">${a.cover_thumb ? `<img src="${a.cover_thumb}" alt="">` : '📁'}</div>
                <div class="album-pick-info">
                    <div class="album-pick-name">${escHtml(a.name)}</div>
                    <div class="text-muted">${t('albums.item_count', { count: a.asset_count })}</div>
                </div>
            </div>
        `).join('');
        list.querySelectorAll('.album-pick-row').forEach(row => {
            row.onclick = () => addSelectionToAlbum(row.dataset.id);
        });
    } catch (e) {
        list.innerHTML = `<p class="text-muted">${e.message}</p>`;
    }
}

async function addSelectionToAlbum(albumId) {
    try {
        const count = state.selectedAssets.size;
        await API.addToAlbum(albumId, [...state.selectedAssets]);
        $('add-to-album-modal').classList.add('hidden');
        toast(t('albums.items_added', { count }), 'success');
        clearSelection();
    } catch (e) {
        toast(e.message, 'error');
    }
}

function initAddToAlbumModal() {
    $('add-to-album-modal-close').onclick = () => $('add-to-album-modal').classList.add('hidden');
    $('add-to-album-modal').onclick = (e) => {
        if (e.target === $('add-to-album-modal')) $('add-to-album-modal').classList.add('hidden');
    };
    $('add-to-album-new-btn').onclick = () => {
        $('add-to-album-modal').classList.add('hidden');
        showAlbumModal();
    };
}

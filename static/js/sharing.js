/**
 * Wimmich - Share links list.
 */
registerTranslations({
    en: {
        'sharing.empty_title': 'No share links yet',
        'sharing.empty_desc': 'Select a photo or album to create a share link.',
        'sharing.view_count': '{count} view(s)',
        'sharing.copy_btn': 'Copy',
        'sharing.link_copied_success': 'Link copied!',
        'sharing.link_deleted_success': 'Link deleted',
        'sharing.link_created_success': 'Share link created and copied!',
    },
    tr: {
        'sharing.empty_title': 'Paylaşım linki yok',
        'sharing.empty_desc': 'Fotoğraf veya albüm seçip paylaşım linki oluşturabilirsiniz.',
        'sharing.view_count': '{count} görüntüleme',
        'sharing.copy_btn': 'Kopyala',
        'sharing.link_copied_success': 'Link kopyalandı!',
        'sharing.link_deleted_success': 'Link silindi',
        'sharing.link_created_success': 'Paylaşım linki oluşturuldu ve kopyalandı!',
    },
    fr: {
        'sharing.empty_title': 'Aucun lien de partage',
        'sharing.empty_desc': 'Sélectionnez une photo ou un album pour créer un lien de partage.',
        'sharing.view_count': '{count} vue(s)',
        'sharing.copy_btn': 'Copier',
        'sharing.link_copied_success': 'Lien copié !',
        'sharing.link_deleted_success': 'Lien supprimé',
        'sharing.link_created_success': 'Lien de partage créé et copié !',
    },
    de: {
        'sharing.empty_title': 'Noch keine Freigabelinks',
        'sharing.empty_desc': 'Wählen Sie ein Foto oder Album aus, um einen Freigabelink zu erstellen.',
        'sharing.view_count': '{count} Aufruf(e)',
        'sharing.copy_btn': 'Kopieren',
        'sharing.link_copied_success': 'Link kopiert!',
        'sharing.link_deleted_success': 'Link gelöscht',
        'sharing.link_created_success': 'Freigabelink erstellt und kopiert!',
    },
});

async function renderSharing() {
    try {
        const data = await API.getShares();
        const pc = $('page-content');
        if (!data.shares.length) {
            pc.innerHTML = renderEmptyState(t('sharing.empty_title'), t('sharing.empty_desc'));
            return;
        }
        pc.innerHTML = `
            <div class="share-list">${data.shares.map(s => `
                <div class="share-item">
                    <div class="share-info">
                        <div class="share-link">${location.origin}/shared/${s.key}</div>
                        <div class="share-meta">${s.link_type} · ${t('sharing.view_count', { count: s.view_count })} · ${formatDateShort(s.created_at)} ${s.has_password ? '🔒' : ''} ${s.expires_at ? '⏰ ' + formatDateShort(s.expires_at) : ''}</div>
                    </div>
                    <button class="btn btn-sm btn-secondary" onclick="copyShareLink('${s.key}')">📋 ${t('sharing.copy_btn')}</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteShareLink('${s.id}')">${t('common.delete')}</button>
                </div>
            `).join('')}</div>
        `;
    } catch (e) { toast(e.message, 'error'); }
}

function copyShareLink(key) {
    navigator.clipboard.writeText(`${location.origin}/shared/${key}`);
    toast(t('sharing.link_copied_success'), 'success');
}

async function deleteShareLink(id) {
    await API.deleteShare(id);
    toast(t('sharing.link_deleted_success'), 'success');
    renderSharing();
}

let _pendingShare = null; // { link_type, asset_ids? , album_id? }

function showShareModal(linkType, payload) {
    _pendingShare = linkType === 'ALBUM'
        ? { link_type: 'ALBUM', album_id: payload }
        : { link_type: 'ASSET', asset_ids: payload };

    $('share-password').value = '';
    $('share-expire').value = '';
    $('share-download').checked = true;
    $('share-modal').classList.remove('hidden');
}

function initShareModal() {
    $('share-modal-close').onclick = () => $('share-modal').classList.add('hidden');
    $('share-modal-cancel').onclick = () => $('share-modal').classList.add('hidden');
    $('share-modal').onclick = (e) => { if (e.target === $('share-modal')) $('share-modal').classList.add('hidden'); };

    $('share-modal-create').onclick = async () => {
        if (!_pendingShare) return;
        try {
            const expireVal = $('share-expire').value;
            const share = await API.createShare({
                ..._pendingShare,
                password: $('share-password').value.trim() || null,
                expires_in_days: expireVal ? parseInt(expireVal) : null,
                allow_download: $('share-download').checked,
            });
            $('share-modal').classList.add('hidden');
            const url = `${location.origin}/shared/${share.key}`;
            navigator.clipboard.writeText(url);
            toast(t('sharing.link_created_success'), 'success');
            clearSelection();
            if (state.currentPage === 'sharing') renderSharing();
        } catch (e) {
            toast(e.message, 'error');
        }
    };
}

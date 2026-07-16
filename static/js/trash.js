/**
 * Wimmich - Trash view (restore/permanent-delete flow).
 */
registerTranslations({
    en: {
        'trash.auto_delete_warning': 'Items in the trash are permanently deleted after 30 days.',
        'trash.empty_trash_btn': '🗑 Empty Trash',
        'trash.empty_title': 'Trash is empty',
        'trash.confirm_permanent_delete': 'Are you sure you want to PERMANENTLY delete {count} item(s) in the trash? This action cannot be undone.',
        'trash.deleting': 'Deleting...',
        'trash.emptied_success': 'Trash emptied.',
    },
    tr: {
        'trash.auto_delete_warning': 'Çöp kutusundaki öğeler 30 gün sonra kalıcı olarak silinir.',
        'trash.empty_trash_btn': '🗑 Çöp Kutusunu Boşalt',
        'trash.empty_title': 'Çöp kutusu boş',
        'trash.confirm_permanent_delete': 'Çöp kutusundaki {count} öğeyi KALICI OLARAK silmek istediğinize emin misiniz? Bu işlem geri alınamaz.',
        'trash.deleting': 'Siliniyor...',
        'trash.emptied_success': 'Çöp kutusu boşaltıldı.',
    },
    fr: {
        'trash.auto_delete_warning': 'Les éléments de la corbeille sont définitivement supprimés après 30 jours.',
        'trash.empty_trash_btn': '🗑 Vider la corbeille',
        'trash.empty_title': 'La corbeille est vide',
        'trash.confirm_permanent_delete': 'Voulez-vous vraiment supprimer DÉFINITIVEMENT {count} élément(s) de la corbeille ? Cette action est irréversible.',
        'trash.deleting': 'Suppression...',
        'trash.emptied_success': 'Corbeille vidée.',
    },
    de: {
        'trash.auto_delete_warning': 'Elemente im Papierkorb werden nach 30 Tagen endgültig gelöscht.',
        'trash.empty_trash_btn': '🗑 Papierkorb leeren',
        'trash.empty_title': 'Papierkorb ist leer',
        'trash.confirm_permanent_delete': 'Möchten Sie {count} Element(e) im Papierkorb wirklich ENDGÜLTIG löschen? Dieser Vorgang kann nicht rückgängig gemacht werden.',
        'trash.deleting': 'Wird gelöscht...',
        'trash.emptied_success': 'Papierkorb geleert.',
    },
});

async function renderTrash() {
    try {
        const data = await API.getTrash();
        const pc = $('page-content');
        pc.innerHTML = `
            <div class="trash-info">
                <span>⚠️ ${t('trash.auto_delete_warning')}</span>
                ${data.assets.length ? `<button id="trash-empty-btn" class="btn btn-sm btn-danger">${t('trash.empty_trash_btn')}</button>` : ''}
            </div>
        `;
        if (!data.assets.length) {
            pc.innerHTML += renderEmptyState(t('trash.empty_title'), '');
            return;
        }
        pc.innerHTML += `<div class="photo-grid">${data.assets.map(a => renderPhotoCard(a)).join('')}</div>`;
        // Tap opens the viewer, long-press/checkbox multi-selects - use the
        // selection bar's "Geri Yükle"/"Kalıcı Sil" buttons for bulk actions.
        bindPhotoCards(pc);
        state.viewerList = data.assets.map(a => a.id);

        $('trash-empty-btn').onclick = async () => {
            if (!confirm(t('trash.confirm_permanent_delete', { count: data.assets.length }))) return;
            const btn = $('trash-empty-btn');
            btn.disabled = true;
            btn.textContent = t('trash.deleting');
            try {
                await API.bulkAction(data.assets.map(a => a.id), 'delete_permanent');
                toast(t('trash.emptied_success'), 'success');
                renderTrash();
            } catch (e) {
                toast(t('common.error_prefix') + e.message, 'error');
                btn.disabled = false;
                btn.textContent = t('trash.empty_trash_btn');
            }
        };
    } catch (e) { toast(e.message, 'error'); }
}

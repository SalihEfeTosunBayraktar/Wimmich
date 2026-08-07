/**
 * Wimmich - Trash view (restore/permanent-delete flow).
 */
registerTranslations({
    en: {
        'trash.auto_delete_warning': 'Items in the trash are permanently deleted after {days} days.',
        'trash.empty_trash_btn': 'Empty Trash',
        'trash.empty_title': 'Trash is empty',
        'trash.confirm_permanent_delete': 'Are you sure you want to PERMANENTLY delete {count} item(s) in the trash? This action cannot be undone.',
        'trash.deleting': 'Deleting...',
        'trash.emptied_success': 'Trash emptied.',
        'trash.change_retention': 'change',
        'trash.retention_placeholder': 'Server default ({days} days)',
        'trash.retention_hint': 'How long your own deleted photos/videos stay in Trash before being permanently removed. Leave blank to use the server default.',
        'trash.retention_invalid': 'Enter a number between 1 and 365, or leave it blank',
        'trash.retention_saved': 'Trash retention updated',
    },
    tr: {
        'trash.auto_delete_warning': 'Çöp kutusundaki öğeler {days} gün sonra kalıcı olarak silinir.',
        'trash.empty_trash_btn': 'Çöp Kutusunu Boşalt',
        'trash.empty_title': 'Çöp kutusu boş',
        'trash.confirm_permanent_delete': 'Çöp kutusundaki {count} öğeyi KALICI OLARAK silmek istediğinize emin misiniz? Bu işlem geri alınamaz.',
        'trash.deleting': 'Siliniyor...',
        'trash.emptied_success': 'Çöp kutusu boşaltıldı.',
        'trash.change_retention': 'değiştir',
        'trash.retention_placeholder': 'Sunucu varsayılanı ({days} gün)',
        'trash.retention_hint': 'Sildiğiniz fotoğraf/videoların kalıcı olarak silinmeden önce Çöp Kutusunda ne kadar kalacağı. Sunucu varsayılanını kullanmak için boş bırakın.',
        'trash.retention_invalid': '1 ile 365 arasında bir sayı girin veya boş bırakın',
        'trash.retention_saved': 'Çöp kutusu süresi güncellendi',
    },
    fr: {
        'trash.auto_delete_warning': 'Les éléments de la corbeille sont définitivement supprimés après {days} jours.',
        'trash.empty_trash_btn': 'Vider la corbeille',
        'trash.empty_title': 'La corbeille est vide',
        'trash.confirm_permanent_delete': 'Voulez-vous vraiment supprimer DÉFINITIVEMENT {count} élément(s) de la corbeille ? Cette action est irréversible.',
        'trash.deleting': 'Suppression...',
        'trash.emptied_success': 'Corbeille vidée.',
        'trash.change_retention': "modifier",
        'trash.retention_placeholder': "Valeur par défaut du serveur ({days} jours)",
        'trash.retention_hint': "Combien de temps vos photos/vidéos supprimées restent dans la corbeille avant suppression définitive. Laissez vide pour utiliser la valeur par défaut du serveur.",
        'trash.retention_invalid': "Entrez un nombre entre 1 et 365, ou laissez vide",
        'trash.retention_saved': "Durée de conservation de la corbeille mise à jour",
    },
    de: {
        'trash.auto_delete_warning': 'Elemente im Papierkorb werden nach {days} Tagen endgültig gelöscht.',
        'trash.empty_trash_btn': 'Papierkorb leeren',
        'trash.empty_title': 'Papierkorb ist leer',
        'trash.confirm_permanent_delete': 'Möchten Sie {count} Element(e) im Papierkorb wirklich ENDGÜLTIG löschen? Dieser Vorgang kann nicht rückgängig gemacht werden.',
        'trash.deleting': 'Wird gelöscht...',
        'trash.emptied_success': 'Papierkorb geleert.',
        'trash.change_retention': 'ändern',
        'trash.retention_placeholder': 'Server-Standard ({days} Tage)',
        'trash.retention_hint': 'Wie lange Ihre eigenen gelöschten Fotos/Videos im Papierkorb bleiben, bevor sie endgültig entfernt werden. Leer lassen, um den Server-Standard zu verwenden.',
        'trash.retention_invalid': 'Geben Sie eine Zahl zwischen 1 und 365 ein oder lassen Sie das Feld leer',
        'trash.retention_saved': 'Papierkorb-Aufbewahrung aktualisiert',
    },
});

async function renderTrash() {
    try {
        const data = await API.getTrash();
        const pc = $('page-content');
        pc.innerHTML = `
            <div class="trash-info">
                <span style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">${icon('alertTriangle', 16)} ${t('trash.auto_delete_warning', { days: state.user.trash_days_effective })}
                    <button type="button" id="trash-retention-toggle" class="trash-retention-link">${t('trash.change_retention')}</button>
                </span>
                ${data.assets.length ? `<button id="trash-empty-btn" class="btn btn-sm btn-danger">${icon('trash')} ${t('trash.empty_trash_btn')}</button>` : ''}
            </div>
            <div id="trash-retention-editor" class="trash-retention-editor hidden">
                <div class="trash-retention-row">
                    <input type="number" id="trash-retention-input" min="1" max="365"
                           placeholder="${t('trash.retention_placeholder', { days: state.user.trash_days_effective })}"
                           value="${state.user.trash_days || ''}">
                    <button type="button" class="btn btn-secondary btn-sm" id="trash-retention-save">${t('common.save')}</button>
                </div>
                <p class="text-muted admin-field-hint">${t('trash.retention_hint')}</p>
            </div>
        `;
        if (!data.assets.length) {
            // innerHTML += re-parses the whole subtree, so every listener must
            // be attached after the last append - not before it.
            pc.innerHTML += renderEmptyState(t('trash.empty_title'), '');
            bindTrashRetentionEditor();
            return;
        }
        pc.innerHTML += `<div class="photo-grid">${data.assets.map(a => renderPhotoCard(a)).join('')}</div>`;
        bindTrashRetentionEditor();
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

/** Small "change" link next to the auto-delete warning that reveals an inline
 *  editor for the user's own trash retention override. */
function bindTrashRetentionEditor() {
    const toggle = $('trash-retention-toggle');
    const editor = $('trash-retention-editor');
    if (!toggle || !editor) return;

    toggle.onclick = () => {
        editor.classList.toggle('hidden');
        if (!editor.classList.contains('hidden')) $('trash-retention-input').focus();
    };

    const save = async () => {
        const raw = $('trash-retention-input').value.trim();
        const days = raw ? parseInt(raw, 10) : null;
        if (raw && (!days || days < 1 || days > 365)) {
            toast(t('trash.retention_invalid'), 'warning');
            return;
        }
        try {
            const result = await API.updateTrashRetention(days);
            state.user.trash_days = result.trash_days;
            state.user.trash_days_effective = result.trash_days_effective;
            toast(t('trash.retention_saved'), 'success');
            renderTrash();
        } catch (e) {
            toast(e.message, 'error');
        }
    };

    $('trash-retention-save').onclick = save;
    $('trash-retention-input').onkeydown = (e) => { if (e.key === 'Enter') save(); };
}

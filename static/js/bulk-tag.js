/**
 * Wimmich - Bulk tagging for the current selection, same reasoning as
 * bulk-metadata-edit.js: tagging a whole trip/album at once instead of
 * opening each photo individually.
 */
registerTranslations({
    en: {
        'bulk_tag.button': 'Add Tag',
        'bulk_tag.title': 'Add Tags to {count} Photos',
        'bulk_tag.hint': 'Comma-separated - new tag names are created automatically.',
        'bulk_tag.placeholder': 'e.g. vacation, family',
        'bulk_tag.added': 'Tags added to {count} photo(s)',
    },
    tr: {
        'bulk_tag.button': 'Etiket Ekle',
        'bulk_tag.title': '{count} Fotoğrafa Etiket Ekle',
        'bulk_tag.hint': 'Virgülle ayırın - yeni etiket adları otomatik oluşturulur.',
        'bulk_tag.placeholder': 'örn. tatil, aile',
        'bulk_tag.added': '{count} fotoğrafa etiket eklendi',
    },
    fr: {
        'bulk_tag.button': 'Ajouter une étiquette',
        'bulk_tag.title': 'Ajouter des étiquettes à {count} photos',
        'bulk_tag.hint': 'Séparées par des virgules - les nouvelles étiquettes sont créées automatiquement.',
        'bulk_tag.placeholder': 'ex. vacances, famille',
        'bulk_tag.added': 'Étiquettes ajoutées à {count} photo(s)',
    },
    de: {
        'bulk_tag.button': 'Tag hinzufügen',
        'bulk_tag.title': 'Tags zu {count} Fotos hinzufügen',
        'bulk_tag.hint': 'Durch Kommas getrennt - neue Tag-Namen werden automatisch erstellt.',
        'bulk_tag.placeholder': 'z. B. Urlaub, Familie',
        'bulk_tag.added': 'Tags zu {count} Foto(s) hinzugefügt',
    },
});

function showBulkTagModal() {
    const ids = [...state.selectedAssets];
    if (!ids.length) return;

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'bulk-tag-modal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width:360px;background:var(--bg-secondary);border:1px solid var(--border-color);padding:24px;border-radius:12px;color:var(--text-primary)">
            <h3 style="margin-top:0">${t('bulk_tag.title', { count: ids.length })}</h3>
            <p class="text-muted admin-field-hint" style="margin-top:0">${t('bulk_tag.hint')}</p>
            <div class="form-group">
                <input type="text" id="bulk-tag-input" placeholder="${t('bulk_tag.placeholder')}" style="width:100%;box-sizing:border-box">
            </div>
            <div style="display:flex;justify-content:flex-end;gap:12px;margin-top:8px">
                <button class="btn btn-secondary btn-sm" id="bulk-tag-cancel">${t('common.cancel')}</button>
                <button class="btn btn-primary btn-sm" id="bulk-tag-save">${t('common.save')}</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    const close = () => modal.remove();
    $('bulk-tag-cancel').onclick = close;
    $('bulk-tag-input').focus();
    $('bulk-tag-save').onclick = async () => {
        const names = $('bulk-tag-input').value.split(',').map(n => n.trim()).filter(Boolean);
        if (!names.length) { close(); return; }

        try {
            await API.bulkAddTags(ids, names);
            close();
            toast(t('bulk_tag.added', { count: ids.length }), 'success');
            clearSelection();
            navigateTo(state.currentPage);
        } catch (e) {
            toast(e.message, 'error');
        }
    };
}

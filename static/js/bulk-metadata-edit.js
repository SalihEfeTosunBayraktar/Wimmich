/**
 * Wimmich - Bulk date/location correction for the current selection, same
 * field set as the viewer's single-photo EXIF edit form (viewer-exif-edit.js)
 * - for fixing a whole trip/album at once instead of one photo at a time
 * (e.g. a camera with the wrong clock, or an import that arrived with no
 * GPS on any of them).
 */
registerTranslations({
    en: {
        'bulk_metadata_edit.button': 'Edit Date/Location',
        'bulk_metadata_edit.title': 'Edit Date/Location for {count} Photos',
        'bulk_metadata_edit.hint': 'Only fields you fill in are changed - leave the rest blank to keep each photo as it is.',
        'bulk_metadata_edit.updated': '{count} photo(s) updated',
    },
    tr: {
        'bulk_metadata_edit.button': 'Tarih/Konum Düzenle',
        'bulk_metadata_edit.title': '{count} Fotoğraf için Tarih/Konum Düzenle',
        'bulk_metadata_edit.hint': 'Sadece doldurduğunuz alanlar değiştirilir - geri kalanı her fotoğrafta olduğu gibi bırakmak için boş bırakın.',
        'bulk_metadata_edit.updated': '{count} fotoğraf güncellendi',
    },
    fr: {
        'bulk_metadata_edit.button': 'Modifier date/lieu',
        'bulk_metadata_edit.title': 'Modifier la date/le lieu de {count} photos',
        'bulk_metadata_edit.hint': "Seuls les champs que vous remplissez sont modifiés - laissez le reste vide pour conserver chaque photo telle quelle.",
        'bulk_metadata_edit.updated': '{count} photo(s) mise(s) à jour',
    },
    de: {
        'bulk_metadata_edit.button': 'Datum/Ort bearbeiten',
        'bulk_metadata_edit.title': 'Datum/Ort für {count} Fotos bearbeiten',
        'bulk_metadata_edit.hint': 'Nur ausgefüllte Felder werden geändert - lassen Sie den Rest leer, um jedes Foto unverändert zu lassen.',
        'bulk_metadata_edit.updated': '{count} Foto(s) aktualisiert',
    },
});

function showBulkMetadataEditModal() {
    const ids = [...state.selectedAssets];
    if (!ids.length) return;

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'bulk-metadata-edit-modal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width:360px;background:var(--bg-secondary);border:1px solid var(--border-color);padding:24px;border-radius:12px;color:var(--text-primary)">
            <h3 style="margin-top:0">${t('bulk_metadata_edit.title', { count: ids.length })}</h3>
            <p class="text-muted admin-field-hint" style="margin-top:0">${t('bulk_metadata_edit.hint')}</p>
            <div class="form-group">
                <label for="bulk-edit-taken-at">${t('viewer_exif_edit.taken_at_label')}</label>
                <input type="datetime-local" id="bulk-edit-taken-at" style="width:100%;box-sizing:border-box">
            </div>
            <div class="form-group">
                <label for="bulk-edit-lat">${t('viewer_exif_edit.lat_label')}</label>
                <input type="number" step="any" id="bulk-edit-lat" placeholder="${t('viewer_exif_edit.lat_placeholder')}" style="width:100%;box-sizing:border-box">
            </div>
            <div class="form-group">
                <label for="bulk-edit-lng">${t('viewer_exif_edit.lng_label')}</label>
                <input type="number" step="any" id="bulk-edit-lng" placeholder="${t('viewer_exif_edit.lng_placeholder')}" style="width:100%;box-sizing:border-box">
            </div>
            <div class="form-group">
                <label for="bulk-edit-city">${t('viewer_exif_edit.city_label')}</label>
                <input type="text" id="bulk-edit-city" style="width:100%;box-sizing:border-box">
            </div>
            <div style="display:flex;justify-content:flex-end;gap:12px;margin-top:8px">
                <button class="btn btn-secondary btn-sm" id="bulk-edit-cancel">${t('common.cancel')}</button>
                <button class="btn btn-primary btn-sm" id="bulk-edit-save">${t('common.save')}</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    const close = () => modal.remove();
    $('bulk-edit-cancel').onclick = close;
    $('bulk-edit-save').onclick = async () => {
        const takenAtRaw = $('bulk-edit-taken-at').value;
        const latRaw = $('bulk-edit-lat').value;
        const lngRaw = $('bulk-edit-lng').value;
        const cityRaw = $('bulk-edit-city').value.trim();

        const payload = {};
        if (takenAtRaw) payload.taken_at = new Date(takenAtRaw).toISOString();
        if (latRaw !== '') payload.latitude = parseFloat(latRaw);
        if (lngRaw !== '') payload.longitude = parseFloat(lngRaw);
        if (cityRaw) payload.city = cityRaw;

        if (!Object.keys(payload).length) { close(); return; }

        try {
            const result = await API.bulkUpdateMetadata(ids, payload);
            close();
            toast(t('bulk_metadata_edit.updated', { count: result.updated }), 'success');
            clearSelection();
            navigateTo(state.currentPage);
        } catch (e) {
            toast(e.message, 'error');
        }
    };
}

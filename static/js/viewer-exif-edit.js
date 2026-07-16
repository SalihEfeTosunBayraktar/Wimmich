/**
 * Wimmich - Manual EXIF correction form (taken date + location) in the
 * fullscreen viewer's info sidebar, for photos where the camera got the
 * date/location wrong or never recorded it at all.
 */
registerTranslations({
    en: {
        'viewer_exif_edit.title': 'Edit Date and Location',
        'viewer_exif_edit.taken_at_label': 'Date Taken',
        'viewer_exif_edit.lat_label': 'Latitude',
        'viewer_exif_edit.lat_placeholder': 'e.g. 41.0082',
        'viewer_exif_edit.lng_label': 'Longitude',
        'viewer_exif_edit.lng_placeholder': 'e.g. 28.9784',
        'viewer_exif_edit.city_label': 'City',
        'viewer_exif_edit.updated': 'Info updated',
    },
    tr: {
        'viewer_exif_edit.title': 'Tarih ve Konumu Düzenle',
        'viewer_exif_edit.taken_at_label': 'Çekim Tarihi',
        'viewer_exif_edit.lat_label': 'Enlem (Latitude)',
        'viewer_exif_edit.lat_placeholder': 'ör. 41.0082',
        'viewer_exif_edit.lng_label': 'Boylam (Longitude)',
        'viewer_exif_edit.lng_placeholder': 'ör. 28.9784',
        'viewer_exif_edit.city_label': 'Şehir',
        'viewer_exif_edit.updated': 'Bilgiler güncellendi',
    },
    fr: {
        'viewer_exif_edit.title': 'Modifier la date et le lieu',
        'viewer_exif_edit.taken_at_label': 'Date de prise de vue',
        'viewer_exif_edit.lat_label': 'Latitude',
        'viewer_exif_edit.lat_placeholder': 'ex. 41.0082',
        'viewer_exif_edit.lng_label': 'Longitude',
        'viewer_exif_edit.lng_placeholder': 'ex. 28.9784',
        'viewer_exif_edit.city_label': 'Ville',
        'viewer_exif_edit.updated': 'Informations mises à jour',
    },
    de: {
        'viewer_exif_edit.title': 'Datum und Ort bearbeiten',
        'viewer_exif_edit.taken_at_label': 'Aufnahmedatum',
        'viewer_exif_edit.lat_label': 'Breitengrad',
        'viewer_exif_edit.lat_placeholder': 'z. B. 41.0082',
        'viewer_exif_edit.lng_label': 'Längengrad',
        'viewer_exif_edit.lng_placeholder': 'z. B. 28.9784',
        'viewer_exif_edit.city_label': 'Stadt',
        'viewer_exif_edit.updated': 'Informationen aktualisiert',
    },
});

function _toDatetimeLocal(isoString) {
    if (!isoString) return '';
    const d = new Date(isoString);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function renderViewerExifEditForm(asset) {
    const sc = $('viewer-sidebar-content');
    sc.innerHTML = `
        <div class="viewer-info-section">
            <h4>${t('viewer_exif_edit.title')}</h4>
            <div class="form-group">
                <label for="exif-edit-taken-at">${t('viewer_exif_edit.taken_at_label')}</label>
                <input type="datetime-local" id="exif-edit-taken-at" value="${_toDatetimeLocal(asset.taken_at)}">
            </div>
            <div class="form-group">
                <label for="exif-edit-lat">${t('viewer_exif_edit.lat_label')}</label>
                <input type="number" step="any" id="exif-edit-lat" placeholder="${t('viewer_exif_edit.lat_placeholder')}" value="${asset.latitude ?? ''}">
            </div>
            <div class="form-group">
                <label for="exif-edit-lng">${t('viewer_exif_edit.lng_label')}</label>
                <input type="number" step="any" id="exif-edit-lng" placeholder="${t('viewer_exif_edit.lng_placeholder')}" value="${asset.longitude ?? ''}">
            </div>
            <div class="form-group">
                <label for="exif-edit-city">${t('viewer_exif_edit.city_label')}</label>
                <input type="text" id="exif-edit-city" value="${escHtml(asset.city || '')}">
            </div>
            <div class="viewer-info-actions">
                <button class="btn btn-secondary" id="exif-edit-cancel">${t('common.cancel')}</button>
                <button class="btn btn-primary" id="exif-edit-save">${t('common.save')}</button>
            </div>
        </div>
    `;
    $('exif-edit-cancel').onclick = () => renderViewerInfo(asset);
    $('exif-edit-save').onclick = async () => {
        const takenAtRaw = $('exif-edit-taken-at').value;
        const latRaw = $('exif-edit-lat').value;
        const lngRaw = $('exif-edit-lng').value;
        const cityRaw = $('exif-edit-city').value.trim();

        const payload = {};
        if (takenAtRaw) payload.taken_at = new Date(takenAtRaw).toISOString();
        if (latRaw !== '') payload.latitude = parseFloat(latRaw);
        if (lngRaw !== '') payload.longitude = parseFloat(lngRaw);
        if (cityRaw) payload.city = cityRaw;

        try {
            const updated = await API.updateAsset(asset.id, payload);
            state.viewerAsset = { ...asset, ...updated };
            renderViewerInfo(state.viewerAsset);
            toast(t('viewer_exif_edit.updated'), 'success');
        } catch (e) { toast(e.message, 'error'); }
    };
}

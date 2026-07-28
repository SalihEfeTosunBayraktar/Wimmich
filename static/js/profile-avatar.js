/**
 * Wimmich - Profile picture: upload from device, pick from an existing
 * photo in the library, or remove it back to the plain initial-letter
 * avatar.
 */
registerTranslations({
    en: {
        'profile.avatar_label': 'Profile Picture',
        'profile.avatar_upload_btn': 'Upload',
        'profile.avatar_library_btn': 'Choose from Library',
        'profile.avatar_remove_btn': 'Remove',
        'profile.avatar_updated': 'Profile picture updated',
        'profile.avatar_removed': 'Profile picture removed',
        'profile.avatar_picker_title': 'Choose a Profile Picture',
        'profile.avatar_picker_empty': 'No photos in your library yet.',
        'profile.avatar_crop_title': 'Crop Profile Picture',
        'profile.avatar_crop_error': 'Could not load that image for cropping',
    },
    tr: {
        'profile.avatar_label': 'Profil Resmi',
        'profile.avatar_upload_btn': 'Yükle',
        'profile.avatar_library_btn': 'Kütüphaneden Seç',
        'profile.avatar_remove_btn': 'Kaldır',
        'profile.avatar_updated': 'Profil resmi güncellendi',
        'profile.avatar_removed': 'Profil resmi kaldırıldı',
        'profile.avatar_picker_title': 'Profil Resmi Seç',
        'profile.avatar_picker_empty': 'Kütüphanenizde henüz fotoğraf yok.',
        'profile.avatar_crop_title': 'Profil Resmini Kırp',
        'profile.avatar_crop_error': 'Bu resim kırpma için yüklenemedi',
    },
    fr: {
        'profile.avatar_label': 'Photo de profil',
        'profile.avatar_upload_btn': 'Téléverser',
        'profile.avatar_library_btn': 'Choisir dans la bibliothèque',
        'profile.avatar_remove_btn': 'Supprimer',
        'profile.avatar_updated': 'Photo de profil mise à jour',
        'profile.avatar_removed': 'Photo de profil supprimée',
        'profile.avatar_picker_title': 'Choisir une photo de profil',
        'profile.avatar_picker_empty': "Aucune photo dans votre bibliothèque pour l'instant.",
        'profile.avatar_crop_title': 'Recadrer la photo de profil',
        'profile.avatar_crop_error': "Impossible de charger cette image pour le recadrage",
    },
    de: {
        'profile.avatar_label': 'Profilbild',
        'profile.avatar_upload_btn': 'Hochladen',
        'profile.avatar_library_btn': 'Aus Bibliothek wählen',
        'profile.avatar_remove_btn': 'Entfernen',
        'profile.avatar_updated': 'Profilbild aktualisiert',
        'profile.avatar_removed': 'Profilbild entfernt',
        'profile.avatar_picker_title': 'Profilbild auswählen',
        'profile.avatar_picker_empty': 'Noch keine Fotos in Ihrer Bibliothek.',
        'profile.avatar_crop_title': 'Profilbild zuschneiden',
        'profile.avatar_crop_error': 'Dieses Bild konnte zum Zuschneiden nicht geladen werden',
    },
});

// Shared by the sidebar avatar and the profile modal's own preview - shows
// the user's actual photo when they have one, falling back to their name's
// first initial (the only style this app had before this feature existed).
function renderAvatarInto(el, user) {
    if (!el) return;
    if (user.has_profile_image) {
        // Cache-busted so a just-changed/removed avatar doesn't keep
        // showing a stale image the browser already cached for this URL.
        el.style.backgroundImage = `url(${API.getProfileImageUrl(user.id)}?t=${Date.now()})`;
        el.style.backgroundSize = 'cover';
        el.style.backgroundPosition = 'center';
        el.textContent = '';
    } else {
        el.style.backgroundImage = '';
        el.textContent = user.name.charAt(0).toUpperCase();
    }
}

function renderProfileAvatarPreview() {
    const el = $('profile-avatar-preview');
    if (!el) return;
    renderAvatarInto(el, state.user);
    $('profile-avatar-remove-btn').classList.toggle('hidden', !state.user.has_profile_image);
}

async function _uploadAvatarFile(file) {
    try {
        await API.uploadProfileImage(file);
        state.user.has_profile_image = true;
        renderProfileAvatarPreview();
        _updateSidebarUserInfo();
        toast(t('profile.avatar_updated'), 'success');
    } catch (e) {
        toast(e.message, 'error');
    }
}

// Crop tool: a fixed circular stage the user pans/zooms an <img> behind,
// shared by both the device-upload and pick-from-library paths so either
// source ends up going through the same "confirm the framing" step before
// anything is sent to the server - the backend's create_avatar() still
// center-crops-to-square as a backstop, but only ever sees a square image
// coming from here, making that a no-op.
const _avatarCrop = {
    img: null,
    ctx: null,
    scale: 1,
    baseScale: 1,
    minScale: 1,
    offsetX: 0,
    offsetY: 0,
    dragging: false,
    dragStartX: 0,
    dragStartY: 0,
    dragOffsetX: 0,
    dragOffsetY: 0,
    onDone: null,
};

const AVATAR_CROP_SIZE = 320;
const AVATAR_OUTPUT_SIZE = 512;

function _openAvatarCropper(imageSrc, onDone) {
    const img = new Image();
    img.onload = () => {
        _avatarCrop.img = img;
        _avatarCrop.onDone = onDone;
        // "Cover" fit: the shorter side exactly fills the circular stage,
        // so there's never a gap at 100% zoom no matter the source's
        // aspect ratio.
        _avatarCrop.baseScale = AVATAR_CROP_SIZE / Math.min(img.width, img.height);
        _avatarCrop.minScale = _avatarCrop.baseScale;
        _avatarCrop.scale = _avatarCrop.baseScale;
        _avatarCrop.offsetX = (AVATAR_CROP_SIZE - img.width * _avatarCrop.scale) / 2;
        _avatarCrop.offsetY = (AVATAR_CROP_SIZE - img.height * _avatarCrop.scale) / 2;
        $('avatar-crop-zoom').value = 100;
        $('avatar-crop-modal').classList.remove('hidden');
        _drawAvatarCrop();
    };
    img.onerror = () => toast(t('profile.avatar_crop_error'), 'error');
    img.src = imageSrc;
}

function _clampAvatarCropOffset() {
    const img = _avatarCrop.img;
    const scaledW = img.width * _avatarCrop.scale;
    const scaledH = img.height * _avatarCrop.scale;
    // Clamped so the image can never be panned far enough to leave empty
    // space inside the stage - min/max collapse to the same value (a
    // centered 0) whenever that axis's scaled size is smaller than the
    // stage itself, which can't happen at minScale but can transiently
    // during a fast zoom-out drag.
    _avatarCrop.offsetX = Math.min(0, Math.max(AVATAR_CROP_SIZE - scaledW, _avatarCrop.offsetX));
    _avatarCrop.offsetY = Math.min(0, Math.max(AVATAR_CROP_SIZE - scaledH, _avatarCrop.offsetY));
}

function _drawAvatarCrop() {
    const canvas = $('avatar-crop-canvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, AVATAR_CROP_SIZE, AVATAR_CROP_SIZE);
    const { img, scale, offsetX, offsetY } = _avatarCrop;
    ctx.drawImage(img, offsetX, offsetY, img.width * scale, img.height * scale);
}

function _avatarCropPointerDown(e) {
    _avatarCrop.dragging = true;
    _avatarCrop.dragStartX = e.clientX;
    _avatarCrop.dragStartY = e.clientY;
    _avatarCrop.dragOffsetX = _avatarCrop.offsetX;
    _avatarCrop.dragOffsetY = _avatarCrop.offsetY;
    e.target.setPointerCapture(e.pointerId);
}

function _avatarCropPointerMove(e) {
    if (!_avatarCrop.dragging) return;
    _avatarCrop.offsetX = _avatarCrop.dragOffsetX + (e.clientX - _avatarCrop.dragStartX);
    _avatarCrop.offsetY = _avatarCrop.dragOffsetY + (e.clientY - _avatarCrop.dragStartY);
    _clampAvatarCropOffset();
    _drawAvatarCrop();
}

function _avatarCropPointerUp() {
    _avatarCrop.dragging = false;
}

function _avatarCropZoomChanged(e) {
    const img = _avatarCrop.img;
    const percent = parseInt(e.target.value, 10);
    const newScale = _avatarCrop.minScale * (percent / 100);
    // Keep the stage's own center pinned to the same point in the image
    // while the zoom slider moves, instead of re-centering on the image's
    // origin - re-centering there would make every zoom change jerk the
    // visible crop back toward one corner instead of scaling in place.
    const cx = (AVATAR_CROP_SIZE / 2 - _avatarCrop.offsetX) / _avatarCrop.scale;
    const cy = (AVATAR_CROP_SIZE / 2 - _avatarCrop.offsetY) / _avatarCrop.scale;
    _avatarCrop.scale = newScale;
    _avatarCrop.offsetX = AVATAR_CROP_SIZE / 2 - cx * newScale;
    _avatarCrop.offsetY = AVATAR_CROP_SIZE / 2 - cy * newScale;
    _clampAvatarCropOffset();
    _drawAvatarCrop();
}

function _saveAvatarCrop() {
    const outCanvas = document.createElement('canvas');
    outCanvas.width = AVATAR_OUTPUT_SIZE;
    outCanvas.height = AVATAR_OUTPUT_SIZE;
    const ratio = AVATAR_OUTPUT_SIZE / AVATAR_CROP_SIZE;
    const ctx = outCanvas.getContext('2d');
    const { img, scale, offsetX, offsetY } = _avatarCrop;
    ctx.drawImage(
        img,
        offsetX * ratio, offsetY * ratio,
        img.width * scale * ratio, img.height * scale * ratio
    );
    outCanvas.toBlob((blob) => {
        $('avatar-crop-modal').classList.add('hidden');
        if (blob && _avatarCrop.onDone) _avatarCrop.onDone(blob);
    }, 'image/jpeg', 0.92);
}

async function _removeAvatar() {
    try {
        await API.deleteProfileImage();
        state.user.has_profile_image = false;
        renderProfileAvatarPreview();
        _updateSidebarUserInfo();
        toast(t('profile.avatar_removed'), 'success');
    } catch (e) {
        toast(e.message, 'error');
    }
}

function showAvatarPickerModal() {
    $('avatar-picker-modal').classList.remove('hidden');
    _loadAvatarPickerGrid();
}

async function _loadAvatarPickerGrid() {
    const grid = $('avatar-picker-grid');
    grid.innerHTML = `<p class="text-muted">${t('common.loading')}</p>`;
    try {
        const data = await API.getGallery(1, 60, 'date_desc', 'none', 'image');
        const assets = (data.groups || []).flatMap(g => g.assets);
        if (!assets.length) {
            grid.innerHTML = `<p class="text-muted">${t('profile.avatar_picker_empty')}</p>`;
            return;
        }
        grid.innerHTML = assets.map(a => `
            <div class="photo-card avatar-picker-card" data-id="${a.id}" style="cursor:pointer">
                <img src="${a.thumb_medium || a.thumb_small}" alt="" loading="lazy">
            </div>
        `).join('');
        grid.querySelectorAll('.avatar-picker-card').forEach((card, i) => {
            card.onclick = () => _pickAvatarFromAsset(assets[i].thumb_large || assets[i].thumb_medium);
        });
    } catch (e) {
        grid.innerHTML = `<p class="text-muted">${escHtml(e.message)}</p>`;
    }
}

function _pickAvatarFromAsset(thumbUrl) {
    // The thumbnail <img>/<canvas> path relies on being same-origin and
    // cookie-authenticated (see auth.py's get_current_user cookie fallback)
    // so drawImage()/toBlob() below never taints the canvas - a plain
    // <img src> works here for the same reason the rest of the photo grid
    // already does, no Authorization header needed.
    $('avatar-picker-modal').classList.add('hidden');
    _openAvatarCropper(thumbUrl, (blob) => _uploadAvatarFile(blob));
}

function initProfileAvatar() {
    $('profile-avatar-upload-btn').onclick = () => $('profile-avatar-file-input').click();
    $('profile-avatar-file-input').onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => _openAvatarCropper(reader.result, (blob) => _uploadAvatarFile(blob));
            reader.readAsDataURL(file);
        }
        e.target.value = '';
    };
    $('profile-avatar-library-btn').onclick = showAvatarPickerModal;
    $('profile-avatar-remove-btn').onclick = _removeAvatar;

    const closePicker = () => $('avatar-picker-modal').classList.add('hidden');
    $('avatar-picker-modal-close').onclick = closePicker;
    $('avatar-picker-cancel').onclick = closePicker;

    const stage = $('avatar-crop-stage');
    stage.onpointerdown = _avatarCropPointerDown;
    stage.onpointermove = _avatarCropPointerMove;
    stage.onpointerup = _avatarCropPointerUp;
    stage.onpointercancel = _avatarCropPointerUp;
    $('avatar-crop-zoom').oninput = _avatarCropZoomChanged;
    $('avatar-crop-save').onclick = _saveAvatarCrop;
    const closeCrop = () => $('avatar-crop-modal').classList.add('hidden');
    $('avatar-crop-modal-close').onclick = closeCrop;
    $('avatar-crop-cancel').onclick = closeCrop;
}

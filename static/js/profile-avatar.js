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
        grid.querySelectorAll('.avatar-picker-card').forEach(card => {
            card.onclick = () => _pickAvatarFromAsset(card.dataset.id);
        });
    } catch (e) {
        grid.innerHTML = `<p class="text-muted">${escHtml(e.message)}</p>`;
    }
}

async function _pickAvatarFromAsset(assetId) {
    try {
        await API.setProfileImageFromAsset(assetId);
        state.user.has_profile_image = true;
        renderProfileAvatarPreview();
        _updateSidebarUserInfo();
        $('avatar-picker-modal').classList.add('hidden');
        toast(t('profile.avatar_updated'), 'success');
    } catch (e) {
        toast(e.message, 'error');
    }
}

function initProfileAvatar() {
    $('profile-avatar-upload-btn').onclick = () => $('profile-avatar-file-input').click();
    $('profile-avatar-file-input').onchange = (e) => {
        const file = e.target.files[0];
        if (file) _uploadAvatarFile(file);
        e.target.value = '';
    };
    $('profile-avatar-library-btn').onclick = showAvatarPickerModal;
    $('profile-avatar-remove-btn').onclick = _removeAvatar;

    const closePicker = () => $('avatar-picker-modal').classList.add('hidden');
    $('avatar-picker-modal-close').onclick = closePicker;
    $('avatar-picker-cancel').onclick = closePicker;
}

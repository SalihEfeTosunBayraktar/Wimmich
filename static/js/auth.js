/**
 * Wimmich - Login/register forms and session bootstrap.
 */
registerTranslations({
    en: {
        'profile.settings_title': 'Profile Settings',
        'profile.title': 'Profile Settings',
        'profile.name_label': 'Name',
        'profile.email_label': 'Email',
        'profile.current_password_label': 'Current Password',
        'profile.new_password_label': 'New Password',
        'profile.password_leave_blank': 'Leave blank to keep unchanged',
        'profile.updated': 'Profile updated',
        'profile.name_email_required': 'Name and email cannot be empty',
    },
    tr: {
        'profile.settings_title': 'Profil Ayarları',
        'profile.title': 'Profil Ayarları',
        'profile.name_label': 'İsim',
        'profile.email_label': 'E-posta',
        'profile.current_password_label': 'Mevcut Şifre',
        'profile.new_password_label': 'Yeni Şifre',
        'profile.password_leave_blank': 'Değiştirmemek için boş bırakın',
        'profile.updated': 'Profil güncellendi',
        'profile.name_email_required': 'İsim ve e-posta boş olamaz',
    },
    fr: {
        'profile.settings_title': 'Paramètres du profil',
        'profile.title': 'Paramètres du profil',
        'profile.name_label': 'Nom',
        'profile.email_label': 'E-mail',
        'profile.current_password_label': 'Mot de passe actuel',
        'profile.new_password_label': 'Nouveau mot de passe',
        'profile.password_leave_blank': 'Laisser vide pour ne pas changer',
        'profile.updated': 'Profil mis à jour',
        'profile.name_email_required': "Le nom et l'e-mail ne peuvent pas être vides",
    },
    de: {
        'profile.settings_title': 'Profileinstellungen',
        'profile.title': 'Profileinstellungen',
        'profile.name_label': 'Name',
        'profile.email_label': 'E-Mail',
        'profile.current_password_label': 'Aktuelles Passwort',
        'profile.new_password_label': 'Neues Passwort',
        'profile.password_leave_blank': 'Leer lassen, um unverändert zu lassen',
        'profile.updated': 'Profil aktualisiert',
        'profile.name_email_required': 'Name und E-Mail dürfen nicht leer sein',
    },
});

function initAuth() {
    $('login-form').onsubmit = async (e) => {
        e.preventDefault();
        try {
            const remember = $('login-remember').checked;
            const r = await API.login($('login-email').value, $('login-password').value);
            API.setToken(r.token, remember);
            state.user = r.user;
            showApp();
        } catch (e) { toast(e.message, 'error'); }
    };

    $('register-form').onsubmit = async (e) => {
        e.preventDefault();
        try {
            const r = await API.register($('register-email').value, $('register-password').value, $('register-name').value);
            if (r.token) {
                API.setToken(r.token, true);
                state.user = r.user;
                showApp();
            } else {
                toast(r.message || t('auth.pending_approval'), 'info');
                $('register-form').classList.remove('active');
                $('login-form').classList.add('active');
                $('register-email').value = '';
                $('register-password').value = '';
                $('register-name').value = '';
            }
        } catch (e) { toast(e.message, 'error'); }
    };

    $('show-register').onclick = (e) => {
        e.preventDefault();
        $('login-form').classList.remove('active');
        $('register-form').classList.add('active');
    };

    $('show-login').onclick = (e) => {
        e.preventDefault();
        $('register-form').classList.remove('active');
        $('login-form').classList.add('active');
    };

    $('logout-btn').onclick = async () => {
        await API.logout().catch(() => {});
        API.clearToken();
        location.reload();
    };

    $('profile-settings-btn').onclick = showProfileModal;
}

function showProfileModal() {
    $('profile-name').value = state.user.name;
    $('profile-email').value = state.user.email;
    $('profile-current-password').value = '';
    $('profile-new-password').value = '';
    $('profile-modal').classList.remove('hidden');
    $('profile-name').focus();
}

function initProfileModal() {
    const close = () => $('profile-modal').classList.add('hidden');
    $('profile-modal-close').onclick = close;
    $('profile-modal-cancel').onclick = close;

    $('profile-modal-save').onclick = async () => {
        const name = $('profile-name').value.trim();
        const email = $('profile-email').value.trim();
        const currentPassword = $('profile-current-password').value;
        const newPassword = $('profile-new-password').value;

        if (!name || !email) {
            toast(t('profile.name_email_required'), 'warning');
            return;
        }

        const payload = { name, email };
        if (newPassword) {
            payload.current_password = currentPassword;
            payload.new_password = newPassword;
        }

        try {
            const r = await API.updateMe(payload);
            state.user.name = r.user.name;
            state.user.email = r.user.email;
            _updateSidebarUserInfo();
            close();
            toast(t('profile.updated'), 'success');
        } catch (e) {
            toast(e.message, 'error');
        }
    };
}

async function checkAuth() {
    if (!API.token) { showAuth(); return; }
    try {
        state.user = await API.getMe();
        showApp();
    } catch {
        showAuth();
    }
}

function showAuth() {
    $('auth-screen').classList.remove('hidden');
    $('app').classList.add('hidden');
}

function _updateSidebarUserInfo() {
    $('user-name').textContent = state.user.name;
    $('user-email').textContent = state.user.email;
    $('user-avatar').textContent = state.user.name.charAt(0).toUpperCase();
}

function showApp() {
    $('auth-screen').classList.add('hidden');
    $('app').classList.remove('hidden');
    _updateSidebarUserInfo();
    if (!state.user.is_admin) $('nav-admin').classList.add('hidden');
    else $('nav-admin').classList.remove('hidden');
    updateSidebarStorage();
    loadAppVersion();
    navigateTo(location.hash.slice(1) || 'gallery');
}

async function loadAppVersion() {
    const el = $('app-version');
    if (!el) return;
    try {
        const info = await API.getHealth();
        el.textContent = `v${info.version}`;
        el.title = info.git_commit_date
            ? t('sidebar.version_with_date', { version: info.full_version, date: info.git_commit_date })
            : t('sidebar.version', { version: info.full_version });
    } catch {
        el.textContent = '';
    }
}

function updateSidebarStorage() {
    const quotaMb = state.user.storage_quota_mb || 0;
    const totalSize = state.user.total_size || 0;
    const percentEl = $('storage-percent');
    const barEl = $('storage-bar');
    const textEl = $('storage-text');

    if (!percentEl || !barEl || !textEl) return;

    if (quotaMb > 0) {
        const quotaBytes = quotaMb * 1024 * 1024;
        const percent = Math.min(100, Math.round((totalSize / quotaBytes) * 100));
        percentEl.textContent = percent + '%';
        barEl.style.width = percent + '%';
        textEl.textContent = `${formatSize(totalSize)} / ${formatSize(quotaBytes)}`;

        barEl.classList.toggle('storage-bar--critical', percent > 90);
        barEl.classList.toggle('storage-bar--warning', percent > 70 && percent <= 90);
        barEl.classList.toggle('storage-bar--ok', percent <= 70);
    } else {
        percentEl.textContent = '0%';
        barEl.style.width = '0%';
        textEl.textContent = `${formatSize(totalSize)} / ${t('sidebar.unlimited')}`;
        barEl.classList.remove('storage-bar--critical', 'storage-bar--warning');
        barEl.classList.add('storage-bar--ok');
    }
}

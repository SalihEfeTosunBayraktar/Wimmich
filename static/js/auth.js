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
        'profile.sessions_label': 'Active Sessions',
        'profile.sessions_loading': 'Loading...',
        'profile.sessions_this_device': 'This device',
        'profile.sessions_sign_out': 'Sign out',
        'profile.sessions_revoked': 'Session signed out',
        'profile.sessions_last_seen': 'Last active {date}',
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
        'profile.sessions_label': 'Aktif Oturumlar',
        'profile.sessions_loading': 'Yükleniyor...',
        'profile.sessions_this_device': 'Bu cihaz',
        'profile.sessions_sign_out': 'Çıkış Yap',
        'profile.sessions_revoked': 'Oturum sonlandırıldı',
        'profile.sessions_last_seen': 'Son aktif: {date}',
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
        'profile.sessions_label': 'Sessions actives',
        'profile.sessions_loading': 'Chargement...',
        'profile.sessions_this_device': 'Cet appareil',
        'profile.sessions_sign_out': 'Déconnecter',
        'profile.sessions_revoked': 'Session déconnectée',
        'profile.sessions_last_seen': 'Actif pour la dernière fois {date}',
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
        'profile.sessions_label': 'Aktive Sitzungen',
        'profile.sessions_loading': 'Wird geladen...',
        'profile.sessions_this_device': 'Dieses Gerät',
        'profile.sessions_sign_out': 'Abmelden',
        'profile.sessions_revoked': 'Sitzung abgemeldet',
        'profile.sessions_last_seen': 'Zuletzt aktiv: {date}',
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
            toast(t('auth.login_success'), 'success');
            showApp();
        } catch (err) {
            // 401 = wrong email/password: show a clear localized message
            // rather than the raw English backend string. 403 (awaiting
            // approval) and 429 (too many attempts) already carry meaningful
            // localized backend messages, so surface those as-is.
            toast(err.status === 401 ? t('auth.login_failed') : err.message, 'error');
        }
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
    renderProfileSessions();
}

// A rough, dependency-free read of the two things that actually matter for
// "is this me" recognition (browser + OS) - not trying to be a complete
// user-agent parser, just enough to tell devices apart at a glance.
function _describeUserAgent(ua) {
    if (!ua) return '?';
    let browser = 'Unknown';
    if (/edg/i.test(ua)) browser = 'Edge';
    else if (/chrome/i.test(ua)) browser = 'Chrome';
    else if (/firefox/i.test(ua)) browser = 'Firefox';
    else if (/safari/i.test(ua)) browser = 'Safari';

    let os = 'Unknown';
    if (/windows/i.test(ua)) os = 'Windows';
    else if (/android/i.test(ua)) os = 'Android';
    else if (/iphone|ipad/i.test(ua)) os = 'iOS';
    else if (/mac os/i.test(ua)) os = 'macOS';
    else if (/linux/i.test(ua)) os = 'Linux';

    return `${browser} · ${os}`;
}

async function renderProfileSessions() {
    const container = $('profile-sessions-list');
    if (!container) return;
    container.innerHTML = `<p class="text-muted admin-field-hint">${t('profile.sessions_loading')}</p>`;
    try {
        const data = await API.getSessions();
        container.innerHTML = data.sessions.map(s => `
            <div class="profile-session-row">
                <div>
                    <div class="profile-session-agent">${escHtml(_describeUserAgent(s.user_agent))}${s.is_current ? ` <span class="badge badge-success">${t('profile.sessions_this_device')}</span>` : ''}</div>
                    <div class="profile-session-meta">${escHtml(s.ip_address || '?')} · ${t('profile.sessions_last_seen', { date: formatDateShort(s.last_seen_at) })}</div>
                </div>
                ${!s.is_current ? `<button class="btn btn-danger btn-sm" data-session-id="${s.id}">${t('profile.sessions_sign_out')}</button>` : ''}
            </div>
        `).join('');
        container.querySelectorAll('button[data-session-id]').forEach(btn => {
            btn.onclick = () => revokeMySession(btn.dataset.sessionId);
        });
    } catch (e) {
        container.innerHTML = `<p class="text-muted admin-field-hint">${e.message}</p>`;
    }
}

async function revokeMySession(sessionId) {
    try {
        await API.revokeSession(sessionId);
        toast(t('profile.sessions_revoked'), 'success');
        renderProfileSessions();
    } catch (e) {
        toast(e.message, 'error');
    }
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
    refreshPendingBadge();
    setInterval(refreshPendingBadge, PENDING_BADGE_POLL_INTERVAL_MS);
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

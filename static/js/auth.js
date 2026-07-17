/**
 * Wimmich - Login/register forms and session bootstrap.
 */
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

function showApp() {
    $('auth-screen').classList.add('hidden');
    $('app').classList.remove('hidden');
    $('user-name').textContent = state.user.name;
    $('user-email').textContent = state.user.email;
    $('user-avatar').textContent = state.user.name.charAt(0).toUpperCase();
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

/**
 * Wimmich - Admin: user list templating, storage config, quota/approval/delete actions.
 */
registerTranslations({
    en: {
        'admin_users.badge_admin': 'Admin',
        'admin_users.approved': 'Approved',
        'admin_users.pending_approval': 'Pending Approval',
        'admin_users.item_count': '{count} items',
        'admin_users.unlimited': 'Unlimited',
        'admin_users.quota_suffix': 'quota',
        'admin_users.revoke_approval': 'Revoke Approval',
        'admin_users.approve': 'Approve',
        'admin_users.quota_label': 'Quota',
        'admin_users.storage_path_required': 'Storage path cannot be empty',
        'admin_users.backup_dir_required': 'Backup folder cannot be empty',
        'admin_users.backup_settings_saved': 'Backup settings saved',
        'admin_users.quota_mb_label': 'Storage limit (MB, 0 for Unlimited)',
        'admin_users.quota_gb_hint': '≈ {gb} GB',
        'admin_users.invalid_quota': 'Invalid quota amount',
        'admin_users.quota_updated': 'User quota updated successfully',
        'admin_users.confirm_delete_user': 'Are you sure you want to permanently delete this user and all files they uploaded? This action cannot be undone!',
        'admin_users.user_deleted': 'User deleted successfully',
        'admin_users.user_approved': 'User approved',
        'admin_users.user_approval_revoked': "User's approval revoked",
        'admin_users.make_admin': 'Make Admin',
        'admin_users.remove_admin': 'Remove Admin',
        'admin_users.confirm_make_admin': 'Grant this user full admin access to the server?',
        'admin_users.confirm_remove_admin': "Remove this user's admin access?",
        'admin_users.admin_granted': 'Admin access granted',
        'admin_users.admin_revoked': 'Admin access removed',
        'admin_users.new_user_button': '+ New User',
        'admin_users.create_user_title': 'Create User',
        'admin_users.name_label': 'Name',
        'admin_users.email_label': 'Email',
        'admin_users.password_label': 'Password',
        'admin_users.is_admin_checkbox': 'Grant admin access',
        'admin_users.create': 'Create',
        'admin_users.fields_required': 'Name, email and password are required',
        'admin_users.user_created': 'User created successfully',
        'admin_users.reset_password': 'Password',
        'admin_users.set_password_title': 'Set New Password',
        'admin_users.new_password_label': 'New password (min 4 characters)',
        'admin_users.password_too_short': 'Password must be at least 4 characters',
        'admin_users.password_updated': "User's password updated",
    },
    tr: {
        'admin_users.badge_admin': 'Admin',
        'admin_users.approved': 'Onaylı',
        'admin_users.pending_approval': 'Onay Bekliyor',
        'admin_users.item_count': '{count} öğe',
        'admin_users.unlimited': 'Sınırsız',
        'admin_users.quota_suffix': 'kota',
        'admin_users.revoke_approval': 'Onayı Kaldır',
        'admin_users.approve': 'Onayla',
        'admin_users.quota_label': 'Kota',
        'admin_users.storage_path_required': 'Depolama yolu boş olamaz',
        'admin_users.backup_dir_required': 'Yedekleme klasörü boş olamaz',
        'admin_users.backup_settings_saved': 'Yedekleme ayarları kaydedildi',
        'admin_users.quota_mb_label': 'Depolama sınırı (MB, Sınırsız için 0)',
        'admin_users.quota_gb_hint': '≈ {gb} GB',
        'admin_users.invalid_quota': 'Geçersiz kota miktarı',
        'admin_users.quota_updated': 'Kullanıcı kotası başarıyla güncellendi',
        'admin_users.confirm_delete_user': 'Bu kullanıcıyı ve yüklediği tüm dosyaları kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz!',
        'admin_users.user_deleted': 'Kullanıcı başarıyla silindi',
        'admin_users.user_approved': 'Kullanıcı onaylandı',
        'admin_users.user_approval_revoked': 'Kullanıcı onayı kaldırıldı',
        'admin_users.make_admin': 'Yönetici Yap',
        'admin_users.remove_admin': 'Yöneticiliği Kaldır',
        'admin_users.confirm_make_admin': 'Bu kullanıcıya sunucuda tam yöneticilik yetkisi verilsin mi?',
        'admin_users.confirm_remove_admin': 'Bu kullanıcının yöneticilik yetkisi kaldırılsın mı?',
        'admin_users.admin_granted': 'Yöneticilik yetkisi verildi',
        'admin_users.admin_revoked': 'Yöneticilik yetkisi kaldırıldı',
        'admin_users.new_user_button': '+ Yeni Kullanıcı',
        'admin_users.create_user_title': 'Kullanıcı Oluştur',
        'admin_users.name_label': 'İsim',
        'admin_users.email_label': 'E-posta',
        'admin_users.password_label': 'Şifre',
        'admin_users.is_admin_checkbox': 'Yönetici yetkisi ver',
        'admin_users.create': 'Oluştur',
        'admin_users.fields_required': 'İsim, e-posta ve şifre zorunludur',
        'admin_users.user_created': 'Kullanıcı başarıyla oluşturuldu',
        'admin_users.reset_password': 'Şifre',
        'admin_users.set_password_title': 'Yeni Şifre Belirle',
        'admin_users.new_password_label': 'Yeni şifre (en az 4 karakter)',
        'admin_users.password_too_short': 'Şifre en az 4 karakter olmalı',
        'admin_users.password_updated': 'Kullanıcının şifresi güncellendi',
    },
    fr: {
        'admin_users.badge_admin': 'Admin',
        'admin_users.approved': 'Approuvé',
        'admin_users.pending_approval': "En attente d'approbation",
        'admin_users.item_count': '{count} éléments',
        'admin_users.unlimited': 'Illimité',
        'admin_users.quota_suffix': 'quota',
        'admin_users.revoke_approval': "Retirer l'approbation",
        'admin_users.approve': 'Approuver',
        'admin_users.quota_label': 'Quota',
        'admin_users.storage_path_required': 'Le chemin de stockage ne peut pas être vide',
        'admin_users.backup_dir_required': 'Le dossier de sauvegarde ne peut pas être vide',
        'admin_users.backup_settings_saved': 'Paramètres de sauvegarde enregistrés',
        'admin_users.quota_mb_label': 'Limite de stockage (Mo, 0 pour Illimité)',
        'admin_users.quota_gb_hint': '≈ {gb} Go',
        'admin_users.invalid_quota': 'Quantité de quota invalide',
        'admin_users.quota_updated': "Quota de l'utilisateur mis à jour avec succès",
        'admin_users.confirm_delete_user': "Voulez-vous vraiment supprimer définitivement cet utilisateur et tous les fichiers qu'il a téléversés ? Cette action est irréversible !",
        'admin_users.user_deleted': 'Utilisateur supprimé avec succès',
        'admin_users.user_approved': 'Utilisateur approuvé',
        'admin_users.user_approval_revoked': "Approbation de l'utilisateur retirée",
        'admin_users.make_admin': 'Nommer administrateur',
        'admin_users.remove_admin': "Retirer les droits d'administrateur",
        'admin_users.confirm_make_admin': "Accorder à cet utilisateur les pleins droits d'administrateur sur le serveur ?",
        'admin_users.confirm_remove_admin': "Retirer les droits d'administrateur de cet utilisateur ?",
        'admin_users.admin_granted': "Droits d'administrateur accordés",
        'admin_users.admin_revoked': "Droits d'administrateur retirés",
        'admin_users.new_user_button': '+ Nouvel utilisateur',
        'admin_users.create_user_title': 'Créer un utilisateur',
        'admin_users.name_label': 'Nom',
        'admin_users.email_label': 'E-mail',
        'admin_users.password_label': 'Mot de passe',
        'admin_users.is_admin_checkbox': "Accorder les droits d'administrateur",
        'admin_users.create': 'Créer',
        'admin_users.fields_required': "Le nom, l'e-mail et le mot de passe sont requis",
        'admin_users.user_created': 'Utilisateur créé avec succès',
        'admin_users.reset_password': 'Mot de passe',
        'admin_users.set_password_title': 'Définir un nouveau mot de passe',
        'admin_users.new_password_label': 'Nouveau mot de passe (min. 4 caractères)',
        'admin_users.password_too_short': 'Le mot de passe doit comporter au moins 4 caractères',
        'admin_users.password_updated': "Mot de passe de l'utilisateur mis à jour",
    },
    de: {
        'admin_users.badge_admin': 'Admin',
        'admin_users.approved': 'Genehmigt',
        'admin_users.pending_approval': 'Genehmigung ausstehend',
        'admin_users.item_count': '{count} Elemente',
        'admin_users.unlimited': 'Unbegrenzt',
        'admin_users.quota_suffix': 'Kontingent',
        'admin_users.revoke_approval': 'Genehmigung entziehen',
        'admin_users.approve': 'Genehmigen',
        'admin_users.quota_label': 'Kontingent',
        'admin_users.storage_path_required': 'Speicherpfad darf nicht leer sein',
        'admin_users.backup_dir_required': 'Sicherungsordner darf nicht leer sein',
        'admin_users.backup_settings_saved': 'Sicherungseinstellungen gespeichert',
        'admin_users.quota_mb_label': 'Speicherlimit (MB, 0 für Unbegrenzt)',
        'admin_users.quota_gb_hint': '≈ {gb} GB',
        'admin_users.invalid_quota': 'Ungültige Kontingentmenge',
        'admin_users.quota_updated': 'Benutzerkontingent erfolgreich aktualisiert',
        'admin_users.confirm_delete_user': 'Möchten Sie diesen Benutzer und alle von ihm hochgeladenen Dateien wirklich dauerhaft löschen? Diese Aktion kann nicht rückgängig gemacht werden!',
        'admin_users.user_deleted': 'Benutzer erfolgreich gelöscht',
        'admin_users.user_approved': 'Benutzer genehmigt',
        'admin_users.user_approval_revoked': 'Genehmigung des Benutzers entzogen',
        'admin_users.make_admin': 'Zum Admin machen',
        'admin_users.remove_admin': 'Admin-Rechte entziehen',
        'admin_users.confirm_make_admin': 'Diesem Benutzer vollen Admin-Zugriff auf den Server gewähren?',
        'admin_users.confirm_remove_admin': 'Admin-Zugriff dieses Benutzers entziehen?',
        'admin_users.admin_granted': 'Admin-Zugriff gewährt',
        'admin_users.admin_revoked': 'Admin-Zugriff entzogen',
        'admin_users.new_user_button': '+ Neuer Benutzer',
        'admin_users.create_user_title': 'Benutzer erstellen',
        'admin_users.name_label': 'Name',
        'admin_users.email_label': 'E-Mail',
        'admin_users.password_label': 'Passwort',
        'admin_users.is_admin_checkbox': 'Admin-Zugriff gewähren',
        'admin_users.create': 'Erstellen',
        'admin_users.fields_required': 'Name, E-Mail und Passwort sind erforderlich',
        'admin_users.user_created': 'Benutzer erfolgreich erstellt',
        'admin_users.reset_password': 'Passwort',
        'admin_users.set_password_title': 'Neues Passwort festlegen',
        'admin_users.new_password_label': 'Neues Passwort (mind. 4 Zeichen)',
        'admin_users.password_too_short': 'Passwort muss mindestens 4 Zeichen lang sein',
        'admin_users.password_updated': 'Passwort des Benutzers aktualisiert',
    },
});

function renderUserList(users) {
    return users.map(u => `
        <div class="user-item admin-user-item">
            <div class="user-item-header">
                <div class="user-avatar">${u.name.charAt(0).toUpperCase()}</div>
                <div class="user-item-info">
                    <div class="user-item-name">
                        ${escHtml(u.name)}
                        ${u.is_admin ? `<span class="badge badge-admin">${t('admin_users.badge_admin')}</span>` : ''}
                        ${!u.is_admin ? `
                            <span class="badge ${u.is_approved ? 'badge-success' : 'badge-warning'}" style="margin-left:4px">
                                ${u.is_approved ? t('admin_users.approved') : t('admin_users.pending_approval')}
                            </span>
                        ` : ''}
                    </div>
                    <div class="user-item-email">${u.email}</div>
                </div>
            </div>
            <div class="user-item-email">${t('admin_users.item_count', { count: u.asset_count })} · ${formatSize(u.total_size)} / ${u.storage_quota_mb > 0 ? formatSize(u.storage_quota_mb * 1024 * 1024) : t('admin_users.unlimited')} ${t('admin_users.quota_suffix')}</div>
            <div class="user-item-actions">
                ${!u.is_admin ? `
                    <button class="btn btn-secondary btn-sm" onclick="toggleUserApproval('${u.id}', ${u.is_approved})">
                        ${u.is_approved ? t('admin_users.revoke_approval') : t('admin_users.approve')}
                    </button>
                ` : ''}
                <button class="btn btn-secondary btn-sm" onclick="editUserQuota('${u.id}', ${u.storage_quota_mb})">⚙️ ${t('admin_users.quota_label')}</button>
                <button class="btn btn-secondary btn-sm" onclick="showSetPasswordModal('${u.id}', '${escAttr(u.name)}')">🔑 ${t('admin_users.reset_password')}</button>
                ${u.id !== state.user.id ? `
                    <button class="btn btn-secondary btn-sm" onclick="toggleUserAdmin('${u.id}', ${u.is_admin})">
                        👑 ${u.is_admin ? t('admin_users.remove_admin') : t('admin_users.make_admin')}
                    </button>
                ` : ''}
                ${!u.is_admin ? `<button class="btn btn-danger btn-sm" onclick="deleteUser('${u.id}')">${t('common.delete')}</button>` : ''}
            </div>
        </div>
    `).join('');
}

async function saveStorageConfig() {
    const path = $('storage-path-input').value.trim();
    const token = $('storage-token-input').value.trim();
    const domain = $('storage-domain-input').value.trim();
    const totalLimit = parseInt($('storage-limit-input').value) || 0;
    const autoStart = $('storage-autostart-input').checked;

    if (!path) { toast(t('admin_users.storage_path_required'), 'warning'); return; }

    try {
        const result = await API.updateStorageConfig(path, token, totalLimit, autoStart, domain);
        toast(result.message, 'success');
        renderAdmin();
    } catch (e) {
        toast(e.message, 'error');
    }
}

async function saveBackupConfig() {
    const backupDir = $('backup-dir-input').value.trim();
    const intervalHours = parseInt($('backup-interval-input').value) || 24;
    const enabled = $('backup-enabled-input').checked;

    if (enabled && !backupDir) { toast(t('admin_users.backup_dir_required'), 'warning'); return; }

    try {
        await API.updateBackupSettings(backupDir, intervalHours, enabled);
        toast(t('admin_users.backup_settings_saved'), 'success');
        renderAdmin();
    } catch (e) {
        toast(e.message, 'error');
    }
}

function editUserQuota(userId, currentQuota) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'quota-edit-modal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width:340px;background:var(--bg-secondary);border:1px solid var(--border-color);padding:24px;border-radius:12px;color:var(--text-primary)">
            <h3 style="margin-top:0">${t('admin_users.quota_label')}</h3>
            <label class="admin-field-label" for="quota-edit-input">${t('admin_users.quota_mb_label')}</label>
            <input type="number" id="quota-edit-input" min="0" value="${currentQuota}" style="width:100%;box-sizing:border-box">
            <p class="text-muted admin-field-hint" id="quota-edit-gb-hint"></p>
            <div style="display:flex;justify-content:flex-end;gap:12px;margin-top:8px">
                <button class="btn btn-secondary btn-sm" id="quota-edit-cancel">${t('common.cancel')}</button>
                <button class="btn btn-primary btn-sm" id="quota-edit-save">${t('common.save')}</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    const input = $('quota-edit-input');
    const hint = $('quota-edit-gb-hint');
    const updateHint = () => {
        const mb = parseInt(input.value);
        if (isNaN(mb) || mb < 0) { hint.textContent = ''; return; }
        hint.textContent = mb === 0 ? t('admin_users.unlimited') : t('admin_users.quota_gb_hint', { gb: (mb / 1024).toFixed(2) });
    };
    input.oninput = updateHint;
    updateHint();
    input.focus();
    input.select();

    const close = () => modal.remove();
    $('quota-edit-cancel').onclick = close;
    $('quota-edit-save').onclick = () => saveUserQuota(userId, input.value, close);
}

function showSetPasswordModal(userId, userName) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'set-password-modal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width:340px;background:var(--bg-secondary);border:1px solid var(--border-color);padding:24px;border-radius:12px;color:var(--text-primary)">
            <h3 style="margin-top:0">${t('admin_users.set_password_title')}</h3>
            <p class="text-muted admin-field-hint" style="margin-top:0">${escHtml(userName)}</p>
            <label class="admin-field-label" for="set-password-input">${t('admin_users.new_password_label')}</label>
            <input type="password" id="set-password-input" style="width:100%;box-sizing:border-box">
            <div style="display:flex;justify-content:flex-end;gap:12px;margin-top:16px">
                <button class="btn btn-secondary btn-sm" id="set-password-cancel">${t('common.cancel')}</button>
                <button class="btn btn-primary btn-sm" id="set-password-save">${t('common.save')}</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    const input = $('set-password-input');
    input.focus();
    const close = () => modal.remove();
    $('set-password-cancel').onclick = close;
    $('set-password-save').onclick = () => saveUserPassword(userId, input.value, close);
    input.onkeydown = (e) => { if (e.key === 'Enter') saveUserPassword(userId, input.value, close); };
}

async function saveUserPassword(userId, password, close) {
    if (!password || password.length < 4) {
        toast(t('admin_users.password_too_short'), 'warning');
        return;
    }
    try {
        await API.setUserPassword(userId, password);
        close();
        toast(t('admin_users.password_updated'), 'success');
    } catch (e) {
        toast(e.message, 'error');
    }
}

function showCreateUserModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'create-user-modal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width:340px;background:var(--bg-secondary);border:1px solid var(--border-color);padding:24px;border-radius:12px;color:var(--text-primary)">
            <h3 style="margin-top:0">${t('admin_users.create_user_title')}</h3>
            <label class="admin-field-label" for="create-user-name">${t('admin_users.name_label')}</label>
            <input type="text" id="create-user-name" style="width:100%;box-sizing:border-box;margin-bottom:8px">
            <label class="admin-field-label" for="create-user-email">${t('admin_users.email_label')}</label>
            <input type="email" id="create-user-email" style="width:100%;box-sizing:border-box;margin-bottom:8px">
            <label class="admin-field-label" for="create-user-password">${t('admin_users.password_label')}</label>
            <input type="password" id="create-user-password" style="width:100%;box-sizing:border-box;margin-bottom:8px">
            <label class="admin-field-label" for="create-user-quota">${t('admin_users.quota_mb_label')}</label>
            <input type="number" id="create-user-quota" min="0" value="0" style="width:100%;box-sizing:border-box">
            <p class="text-muted admin-field-hint" id="create-user-quota-hint"></p>
            <label style="display:flex;align-items:center;gap:6px;margin-top:8px">
                <input type="checkbox" id="create-user-admin">
                ${t('admin_users.is_admin_checkbox')}
            </label>
            <div style="display:flex;justify-content:flex-end;gap:12px;margin-top:16px">
                <button class="btn btn-secondary btn-sm" id="create-user-cancel">${t('common.cancel')}</button>
                <button class="btn btn-primary btn-sm" id="create-user-save">${t('admin_users.create')}</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    const quotaInput = $('create-user-quota');
    const quotaHint = $('create-user-quota-hint');
    const updateHint = () => {
        const mb = parseInt(quotaInput.value);
        if (isNaN(mb) || mb < 0) { quotaHint.textContent = ''; return; }
        quotaHint.textContent = mb === 0 ? t('admin_users.unlimited') : t('admin_users.quota_gb_hint', { gb: (mb / 1024).toFixed(2) });
    };
    quotaInput.oninput = updateHint;
    updateHint();
    $('create-user-name').focus();

    const close = () => modal.remove();
    $('create-user-cancel').onclick = close;
    $('create-user-save').onclick = () => createUserAction(close);
}

async function createUserAction(close) {
    const name = $('create-user-name').value.trim();
    const email = $('create-user-email').value.trim();
    const password = $('create-user-password').value;
    const isAdmin = $('create-user-admin').checked;
    const quota = parseInt($('create-user-quota').value) || 0;

    if (!name || !email || !password) {
        toast(t('admin_users.fields_required'), 'warning');
        return;
    }

    try {
        await API.createUser({ name, email, password, is_admin: isAdmin, storage_quota_mb: quota });
        close();
        toast(t('admin_users.user_created'), 'success');
        renderAdmin();
    } catch (e) {
        toast(e.message, 'error');
    }
}

async function saveUserQuota(userId, quotaStr, close) {
    const quota = parseInt(quotaStr);
    if (isNaN(quota) || quota < 0) {
        toast(t('admin_users.invalid_quota'), 'error');
        return;
    }
    close();
    try {
        await API.updateUserQuota(userId, quota);
        toast(t('admin_users.quota_updated'), 'success');
        renderAdmin();
    } catch (e) {
        toast(e.message, 'error');
    }
}

async function deleteUser(userId) {
    if (!confirm(t('admin_users.confirm_delete_user'))) return;
    try {
        await API.deleteUser(userId);
        toast(t('admin_users.user_deleted'), 'success');
        renderAdmin();
    } catch (e) {
        toast(e.message, 'error');
    }
}

async function toggleUserApproval(userId, currentStatus) {
    try {
        await API.approveUser(userId, !currentStatus);
        toast(!currentStatus ? t('admin_users.user_approved') : t('admin_users.user_approval_revoked'), 'success');
        renderAdmin();
    } catch (e) {
        toast(e.message, 'error');
    }
}

async function toggleUserAdmin(userId, currentStatus) {
    const confirmMsg = currentStatus ? t('admin_users.confirm_remove_admin') : t('admin_users.confirm_make_admin');
    if (!confirm(confirmMsg)) return;
    try {
        await API.updateUserAdmin(userId, !currentStatus);
        toast(!currentStatus ? t('admin_users.admin_granted') : t('admin_users.admin_revoked'), 'success');
        renderAdmin();
    } catch (e) {
        toast(e.message, 'error');
    }
}

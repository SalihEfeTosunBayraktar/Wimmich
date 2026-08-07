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
        'profile.trash_retention_label': 'Trash Retention (days)',
        'profile.trash_retention_placeholder': 'Server default ({days} days)',
        'profile.trash_retention_hint': 'How long your own deleted photos/videos stay in Trash before being permanently removed. Leave blank to use the server default.',
        'profile.trash_retention_invalid': 'Enter a number between 1 and 365, or leave it blank',
        'profile.trash_retention_saved': 'Trash retention updated',
        'profile.change_password_label': 'Change password',
        'profile.sessions_label': 'Active Sessions',
        'profile.sessions_loading': 'Loading...',
        'profile.sessions_this_device': 'This device',
        'profile.sessions_sign_out': 'Sign out',
        'profile.sessions_revoked': 'Session signed out',
        'profile.sessions_last_seen': 'Last active {date}',
        'profile.api_keys_label': 'API Keys',
        'profile.api_keys_hint': 'Long-lived keys for scripts or other apps to access your account without logging in interactively.',
        'profile.api_keys_name_placeholder': 'Key name (e.g. "My script")',
        'profile.api_keys_create': 'Create Key',
        'profile.api_keys_revoke': 'Revoke',
        'profile.api_keys_never_used': 'Never used',
        'profile.api_keys_last_used': 'Last used {date}',
        'profile.api_keys_created_label': 'Created {date}',
        'profile.api_keys_copy': 'Copy',
        'profile.api_keys_copied': 'Copied to clipboard',
        'profile.api_keys_reveal_note': 'Copy this key now - it will not be shown again.',
        'profile.api_keys_created_toast': 'API key created',
        'profile.api_keys_revoked_toast': 'API key revoked',
        'profile.api_keys_name_required': 'Enter a name for the key',
        'profile.api_keys_empty': 'No API keys yet',
        'profile.api_keys_expiry_never': 'Never expires',
        'profile.api_keys_expiry_7d': 'Expires in 7 days',
        'profile.api_keys_expiry_30d': 'Expires in 30 days',
        'profile.api_keys_expiry_90d': 'Expires in 90 days',
        'profile.api_keys_expiry_1y': 'Expires in 1 year',
        'profile.api_keys_expires_label': 'Expires {date}',
        'profile.api_keys_expired_label': 'Expired {date}',
        'profile.api_keys_no_expiry_label': 'Never expires',
        'profile.api_keys_expired_badge': 'Expired',
        'profile.twofa_label': 'Two-Factor Authentication',
        'profile.twofa_enabled_hint': 'Two-factor authentication is enabled - a code from your authenticator app is required at login.',
        'profile.twofa_disabled_hint': 'Add an extra step at login using an authenticator app (Google Authenticator, Authy, etc.), on top of your password.',
        'profile.twofa_enable_btn': 'Enable 2FA',
        'profile.twofa_disable_btn': 'Disable 2FA',
        'profile.twofa_setup_hint': 'Scan this QR code with your authenticator app, then enter the 6-digit code it shows to confirm.',
        'profile.twofa_manual_secret': "Can't scan it? Enter this code manually: {secret}",
        'profile.twofa_code_placeholder': '6-digit code',
        'profile.twofa_confirm_btn': 'Confirm',
        'profile.twofa_enabled_toast': 'Two-factor authentication enabled',
        'profile.twofa_disabled_toast': 'Two-factor authentication disabled',
        'profile.twofa_disable_confirm_hint': 'Enter your password to disable two-factor authentication.',
        'profile.twofa_password_placeholder': 'Current password',
        'profile.export_label': 'My Data',
        'profile.export_hint': 'Download a zip of all your own photos/videos plus a JSON file with their metadata (dates, location, tags, albums).',
        'profile.export_request_btn': 'Request My Data',
        'profile.export_download_btn': 'Download',
        'profile.export_requested_toast': 'Export started - this can take a while for large libraries',
        'profile.export_pending': 'Preparing your export...',
        'profile.export_running': 'Preparing your export... {progress}%',
        'profile.export_failed': 'Last export failed: {error}',
        'profile.export_completed': 'Your last export is ready to download.',
        'profile.export_already_pending': 'You already have an export in progress',
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
        'profile.trash_retention_label': 'Çöp Kutusu Süresi (gün)',
        'profile.trash_retention_placeholder': 'Sunucu varsayılanı ({days} gün)',
        'profile.trash_retention_hint': 'Sildiğiniz fotoğraf/videoların kalıcı olarak silinmeden önce Çöp Kutusu\'nda ne kadar kalacağı. Sunucu varsayılanını kullanmak için boş bırakın.',
        'profile.trash_retention_invalid': '1 ile 365 arasında bir sayı girin veya boş bırakın',
        'profile.trash_retention_saved': 'Çöp kutusu süresi güncellendi',
        'profile.change_password_label': 'Şifre değiştir',
        'profile.sessions_label': 'Aktif Oturumlar',
        'profile.sessions_loading': 'Yükleniyor...',
        'profile.sessions_this_device': 'Bu cihaz',
        'profile.sessions_sign_out': 'Çıkış Yap',
        'profile.sessions_revoked': 'Oturum sonlandırıldı',
        'profile.sessions_last_seen': 'Son aktif: {date}',
        'profile.api_keys_label': 'API Anahtarları',
        'profile.api_keys_hint': 'Betiklerin veya diğer uygulamaların hesabınıza etkileşimli giriş yapmadan erişmesi için uzun ömürlü anahtarlar.',
        'profile.api_keys_name_placeholder': 'Anahtar adı (örn. "Betiğim")',
        'profile.api_keys_create': 'Anahtar Oluştur',
        'profile.api_keys_revoke': 'İptal Et',
        'profile.api_keys_never_used': 'Hiç kullanılmadı',
        'profile.api_keys_last_used': 'Son kullanım: {date}',
        'profile.api_keys_created_label': 'Oluşturulma: {date}',
        'profile.api_keys_copy': 'Kopyala',
        'profile.api_keys_copied': 'Panoya kopyalandı',
        'profile.api_keys_reveal_note': 'Bu anahtarı şimdi kopyalayın - tekrar gösterilmeyecek.',
        'profile.api_keys_created_toast': 'API anahtarı oluşturuldu',
        'profile.api_keys_revoked_toast': 'API anahtarı iptal edildi',
        'profile.api_keys_name_required': 'Anahtar için bir isim girin',
        'profile.api_keys_empty': 'Henüz API anahtarı yok',
        'profile.api_keys_expiry_never': 'Süresiz',
        'profile.api_keys_expiry_7d': '7 gün sonra sona erer',
        'profile.api_keys_expiry_30d': '30 gün sonra sona erer',
        'profile.api_keys_expiry_90d': '90 gün sonra sona erer',
        'profile.api_keys_expiry_1y': '1 yıl sonra sona erer',
        'profile.api_keys_expires_label': 'Sona erme: {date}',
        'profile.api_keys_expired_label': 'Süresi doldu: {date}',
        'profile.api_keys_no_expiry_label': 'Süresiz',
        'profile.api_keys_expired_badge': 'Süresi Doldu',
        'profile.twofa_label': 'İki Adımlı Doğrulama',
        'profile.twofa_enabled_hint': 'İki adımlı doğrulama etkin - girişte kimlik doğrulama uygulamanızdan bir kod gerekir.',
        'profile.twofa_disabled_hint': 'Şifrenize ek olarak bir kimlik doğrulama uygulaması (Google Authenticator, Authy vb.) ile girişe ekstra bir adım ekleyin.',
        'profile.twofa_enable_btn': '2FA Etkinleştir',
        'profile.twofa_disable_btn': '2FA Devre Dışı Bırak',
        'profile.twofa_setup_hint': 'Bu QR kodunu kimlik doğrulama uygulamanızla tarayın, ardından gösterdiği 6 haneli kodu onaylamak için girin.',
        'profile.twofa_manual_secret': 'Tarayamıyor musunuz? Bu kodu elle girin: {secret}',
        'profile.twofa_code_placeholder': '6 haneli kod',
        'profile.twofa_confirm_btn': 'Onayla',
        'profile.twofa_enabled_toast': 'İki adımlı doğrulama etkinleştirildi',
        'profile.twofa_disabled_toast': 'İki adımlı doğrulama devre dışı bırakıldı',
        'profile.twofa_disable_confirm_hint': 'İki adımlı doğrulamayı devre dışı bırakmak için şifrenizi girin.',
        'profile.twofa_password_placeholder': 'Mevcut şifre',
        'profile.export_label': 'Verilerim',
        'profile.export_hint': 'Tüm fotoğraf/videolarınızın ve meta verilerinin (tarih, konum, etiket, albüm) yer aldığı bir JSON dosyasıyla birlikte zip olarak indirin.',
        'profile.export_request_btn': 'Verilerimi İste',
        'profile.export_download_btn': 'İndir',
        'profile.export_requested_toast': 'Dışa aktarma başladı - büyük kütüphaneler için biraz zaman alabilir',
        'profile.export_pending': 'Dışa aktarmanız hazırlanıyor...',
        'profile.export_running': 'Dışa aktarmanız hazırlanıyor... %{progress}',
        'profile.export_failed': 'Son dışa aktarma başarısız oldu: {error}',
        'profile.export_completed': 'Son dışa aktarmanız indirilmeye hazır.',
        'profile.export_already_pending': 'Zaten devam eden bir dışa aktarmanız var',
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
        'profile.trash_retention_label': 'Durée de conservation de la corbeille (jours)',
        'profile.trash_retention_placeholder': 'Valeur par défaut du serveur ({days} jours)',
        'profile.trash_retention_hint': 'Combien de temps vos photos/vidéos supprimées restent dans la corbeille avant suppression définitive. Laissez vide pour utiliser la valeur par défaut du serveur.',
        'profile.trash_retention_invalid': 'Entrez un nombre entre 1 et 365, ou laissez vide',
        'profile.trash_retention_saved': 'Durée de conservation de la corbeille mise à jour',
        'profile.change_password_label': 'Changer le mot de passe',
        'profile.sessions_label': 'Sessions actives',
        'profile.sessions_loading': 'Chargement...',
        'profile.sessions_this_device': 'Cet appareil',
        'profile.sessions_sign_out': 'Déconnecter',
        'profile.sessions_revoked': 'Session déconnectée',
        'profile.sessions_last_seen': 'Actif pour la dernière fois {date}',
        'profile.api_keys_label': 'Clés API',
        'profile.api_keys_hint': "Clés longue durée permettant à des scripts ou autres applications d'accéder à votre compte sans connexion interactive.",
        'profile.api_keys_name_placeholder': 'Nom de la clé (ex. "Mon script")',
        'profile.api_keys_create': 'Créer une clé',
        'profile.api_keys_revoke': 'Révoquer',
        'profile.api_keys_never_used': 'Jamais utilisée',
        'profile.api_keys_last_used': 'Dernière utilisation {date}',
        'profile.api_keys_created_label': 'Créée le {date}',
        'profile.api_keys_copy': 'Copier',
        'profile.api_keys_copied': 'Copié dans le presse-papiers',
        'profile.api_keys_reveal_note': 'Copiez cette clé maintenant - elle ne sera plus affichée.',
        'profile.api_keys_created_toast': 'Clé API créée',
        'profile.api_keys_revoked_toast': 'Clé API révoquée',
        'profile.api_keys_name_required': 'Entrez un nom pour la clé',
        'profile.api_keys_empty': 'Aucune clé API pour le moment',
        'profile.api_keys_expiry_never': "N'expire jamais",
        'profile.api_keys_expiry_7d': 'Expire dans 7 jours',
        'profile.api_keys_expiry_30d': 'Expire dans 30 jours',
        'profile.api_keys_expiry_90d': 'Expire dans 90 jours',
        'profile.api_keys_expiry_1y': 'Expire dans 1 an',
        'profile.api_keys_expires_label': 'Expire le {date}',
        'profile.api_keys_expired_label': 'Expirée le {date}',
        'profile.api_keys_no_expiry_label': "N'expire jamais",
        'profile.api_keys_expired_badge': 'Expirée',
        'profile.twofa_label': 'Authentification à deux facteurs',
        'profile.twofa_enabled_hint': "L'authentification à deux facteurs est activée - un code de votre application d'authentification est requis à la connexion.",
        'profile.twofa_disabled_hint': "Ajoutez une étape supplémentaire à la connexion à l'aide d'une application d'authentification (Google Authenticator, Authy, etc.), en plus de votre mot de passe.",
        'profile.twofa_enable_btn': 'Activer la 2FA',
        'profile.twofa_disable_btn': 'Désactiver la 2FA',
        'profile.twofa_setup_hint': "Scannez ce code QR avec votre application d'authentification, puis entrez le code à 6 chiffres affiché pour confirmer.",
        'profile.twofa_manual_secret': 'Impossible de scanner ? Entrez ce code manuellement : {secret}',
        'profile.twofa_code_placeholder': 'Code à 6 chiffres',
        'profile.twofa_confirm_btn': 'Confirmer',
        'profile.twofa_enabled_toast': 'Authentification à deux facteurs activée',
        'profile.twofa_disabled_toast': 'Authentification à deux facteurs désactivée',
        'profile.twofa_disable_confirm_hint': "Entrez votre mot de passe pour désactiver l'authentification à deux facteurs.",
        'profile.twofa_password_placeholder': 'Mot de passe actuel',
        'profile.export_label': 'Mes données',
        'profile.export_hint': 'Téléchargez un zip de toutes vos photos/vidéos ainsi qu\'un fichier JSON contenant leurs métadonnées (dates, position, tags, albums).',
        'profile.export_request_btn': 'Demander mes données',
        'profile.export_download_btn': 'Télécharger',
        'profile.export_requested_toast': "L'export a démarré - cela peut prendre du temps pour de grandes bibliothèques",
        'profile.export_pending': 'Préparation de votre export...',
        'profile.export_running': 'Préparation de votre export... {progress}%',
        'profile.export_failed': "Le dernier export a échoué : {error}",
        'profile.export_completed': 'Votre dernier export est prêt à être téléchargé.',
        'profile.export_already_pending': 'Un export est déjà en cours',
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
        'profile.trash_retention_label': 'Papierkorb-Aufbewahrung (Tage)',
        'profile.trash_retention_placeholder': 'Server-Standard ({days} Tage)',
        'profile.trash_retention_hint': 'Wie lange Ihre eigenen gelöschten Fotos/Videos im Papierkorb bleiben, bevor sie endgültig entfernt werden. Leer lassen, um den Server-Standard zu verwenden.',
        'profile.trash_retention_invalid': 'Geben Sie eine Zahl zwischen 1 und 365 ein oder lassen Sie das Feld leer',
        'profile.trash_retention_saved': 'Papierkorb-Aufbewahrung aktualisiert',
        'profile.change_password_label': 'Passwort ändern',
        'profile.sessions_label': 'Aktive Sitzungen',
        'profile.sessions_loading': 'Wird geladen...',
        'profile.sessions_this_device': 'Dieses Gerät',
        'profile.sessions_sign_out': 'Abmelden',
        'profile.sessions_revoked': 'Sitzung abgemeldet',
        'profile.sessions_last_seen': 'Zuletzt aktiv: {date}',
        'profile.api_keys_label': 'API-Schlüssel',
        'profile.api_keys_hint': 'Langlebige Schlüssel, damit Skripte oder andere Apps ohne interaktive Anmeldung auf Ihr Konto zugreifen können.',
        'profile.api_keys_name_placeholder': 'Schlüsselname (z. B. "Mein Skript")',
        'profile.api_keys_create': 'Schlüssel erstellen',
        'profile.api_keys_revoke': 'Widerrufen',
        'profile.api_keys_never_used': 'Nie verwendet',
        'profile.api_keys_last_used': 'Zuletzt verwendet: {date}',
        'profile.api_keys_created_label': 'Erstellt: {date}',
        'profile.api_keys_copy': 'Kopieren',
        'profile.api_keys_copied': 'In die Zwischenablage kopiert',
        'profile.api_keys_reveal_note': 'Kopieren Sie diesen Schlüssel jetzt - er wird nicht erneut angezeigt.',
        'profile.api_keys_created_toast': 'API-Schlüssel erstellt',
        'profile.api_keys_revoked_toast': 'API-Schlüssel widerrufen',
        'profile.api_keys_name_required': 'Geben Sie einen Namen für den Schlüssel ein',
        'profile.api_keys_empty': 'Noch keine API-Schlüssel',
        'profile.api_keys_expiry_never': 'Läuft nie ab',
        'profile.api_keys_expiry_7d': 'Läuft in 7 Tagen ab',
        'profile.api_keys_expiry_30d': 'Läuft in 30 Tagen ab',
        'profile.api_keys_expiry_90d': 'Läuft in 90 Tagen ab',
        'profile.api_keys_expiry_1y': 'Läuft in 1 Jahr ab',
        'profile.api_keys_expires_label': 'Läuft ab: {date}',
        'profile.api_keys_expired_label': 'Abgelaufen: {date}',
        'profile.api_keys_no_expiry_label': 'Läuft nie ab',
        'profile.api_keys_expired_badge': 'Abgelaufen',
        'profile.twofa_label': 'Zwei-Faktor-Authentifizierung',
        'profile.twofa_enabled_hint': 'Zwei-Faktor-Authentifizierung ist aktiviert - beim Login ist ein Code aus Ihrer Authenticator-App erforderlich.',
        'profile.twofa_disabled_hint': 'Fügen Sie mit einer Authenticator-App (Google Authenticator, Authy usw.) einen zusätzlichen Schritt beim Login hinzu, zusätzlich zu Ihrem Passwort.',
        'profile.twofa_enable_btn': '2FA aktivieren',
        'profile.twofa_disable_btn': '2FA deaktivieren',
        'profile.twofa_setup_hint': 'Scannen Sie diesen QR-Code mit Ihrer Authenticator-App und geben Sie dann den angezeigten 6-stelligen Code zur Bestätigung ein.',
        'profile.twofa_manual_secret': 'Können Sie nicht scannen? Geben Sie diesen Code manuell ein: {secret}',
        'profile.twofa_code_placeholder': '6-stelliger Code',
        'profile.twofa_confirm_btn': 'Bestätigen',
        'profile.twofa_enabled_toast': 'Zwei-Faktor-Authentifizierung aktiviert',
        'profile.twofa_disabled_toast': 'Zwei-Faktor-Authentifizierung deaktiviert',
        'profile.twofa_disable_confirm_hint': 'Geben Sie Ihr Passwort ein, um die Zwei-Faktor-Authentifizierung zu deaktivieren.',
        'profile.twofa_password_placeholder': 'Aktuelles Passwort',
        'profile.export_label': 'Meine Daten',
        'profile.export_hint': 'Laden Sie ein Zip mit all Ihren Fotos/Videos sowie eine JSON-Datei mit deren Metadaten (Datum, Standort, Tags, Alben) herunter.',
        'profile.export_request_btn': 'Meine Daten anfordern',
        'profile.export_download_btn': 'Herunterladen',
        'profile.export_requested_toast': 'Export gestartet - das kann bei großen Bibliotheken eine Weile dauern',
        'profile.export_pending': 'Ihr Export wird vorbereitet...',
        'profile.export_running': 'Ihr Export wird vorbereitet... {progress}%',
        'profile.export_failed': 'Letzter Export fehlgeschlagen: {error}',
        'profile.export_completed': 'Ihr letzter Export ist zum Herunterladen bereit.',
        'profile.export_already_pending': 'Sie haben bereits einen laufenden Export',
    },
});

function initAuth() {
    // Set by a successful password check on a 2FA-enabled account -
    // remembered here (not in the form) so the 2FA form's submit handler
    // knows which pending login it's completing, and _remember2FALogin so
    // "remember me" survives from the first step to the second.
    let _pending2FAToken = null;
    let _remember2FALogin = false;

    $('login-form').onsubmit = async (e) => {
        e.preventDefault();
        try {
            const remember = $('login-remember').checked;
            const r = await API.login($('login-email').value, $('login-password').value);
            if (r.requires_2fa) {
                _pending2FAToken = r.pre_auth_token;
                _remember2FALogin = remember;
                $('login-2fa-code').value = '';
                $('login-form').classList.remove('active');
                $('login-2fa-form').classList.add('active');
                $('login-2fa-code').focus();
                return;
            }
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

    $('login-2fa-form').onsubmit = async (e) => {
        e.preventDefault();
        try {
            const code = $('login-2fa-code').value.trim();
            const r = await API.login2FAVerify(_pending2FAToken, code);
            API.setToken(r.token, _remember2FALogin);
            state.user = r.user;
            toast(t('auth.login_success'), 'success');
            showApp();
        } catch (err) {
            toast(err.status === 401 ? t('auth.twofa_invalid_code') : err.message, 'error');
        }
    };

    $('login-2fa-back').onclick = (e) => {
        e.preventDefault();
        _pending2FAToken = null;
        $('login-2fa-form').classList.remove('active');
        $('login-form').classList.add('active');
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
    $('profile-trash-days').value = state.user.trash_days || '';
    $('profile-trash-days').placeholder = t('profile.trash_retention_placeholder', { days: state.user.trash_days_effective });
    $('profile-modal').classList.remove('hidden');
    $('profile-name').focus();
    renderProfileSessions();
    renderProfileApiKeys();
    renderProfile2FASection();
    renderProfileAvatarPreview();
    renderProfileExportStatus();
}

let _exportPollTimer = null;

async function renderProfileExportStatus() {
    clearTimeout(_exportPollTimer);
    const container = $('profile-export-status');
    const btn = $('profile-export-request-btn');
    if (!container || !btn) return;

    let job;
    try {
        ({ job } = await API.getExportStatus());
    } catch (e) {
        return;
    }

    if (!job) {
        container.innerHTML = '';
        btn.disabled = false;
        return;
    }

    if (job.status === 'PENDING' || job.status === 'RUNNING') {
        btn.disabled = true;
        const msg = job.status === 'RUNNING'
            ? t('profile.export_running', { progress: job.progress || 0 })
            : t('profile.export_pending');
        container.innerHTML = `<p class="text-muted admin-field-hint">${escHtml(msg)}</p>`;
        _exportPollTimer = setTimeout(renderProfileExportStatus, 3000);
    } else if (job.status === 'COMPLETED') {
        btn.disabled = false;
        container.innerHTML = `<p class="text-muted admin-field-hint">${escHtml(t('profile.export_completed'))}</p>
            <a class="btn btn-secondary btn-sm" href="${API.getExportDownloadUrl()}" download>${escHtml(t('profile.export_download_btn'))}</a>`;
    } else if (job.status === 'FAILED') {
        btn.disabled = false;
        container.innerHTML = `<p class="text-muted admin-field-hint">${escHtml(t('profile.export_failed', { error: job.error_message || '' }))}</p>`;
    } else {
        btn.disabled = false;
        container.innerHTML = '';
    }
}

async function requestDataExport() {
    try {
        await API.requestDataExport();
        toast(t('profile.export_requested_toast'), 'success');
        renderProfileExportStatus();
    } catch (e) {
        if (e.status === 409) {
            toast(t('profile.export_already_pending'), 'warning');
        } else {
            toast(e.message, 'error');
        }
        renderProfileExportStatus();
    }
}

async function saveTrashRetention() {
    const raw = $('profile-trash-days').value.trim();
    const days = raw ? parseInt(raw, 10) : null;
    if (raw && (!days || days < 1 || days > 365)) {
        toast(t('profile.trash_retention_invalid'), 'warning');
        return;
    }
    try {
        const result = await API.updateTrashRetention(days);
        state.user.trash_days = result.trash_days;
        state.user.trash_days_effective = result.trash_days_effective;
        $('profile-trash-days').placeholder = t('profile.trash_retention_placeholder', { days: result.trash_days_effective });
        toast(t('profile.trash_retention_saved'), 'success');
    } catch (e) {
        toast(e.message, 'error');
    }
}

function renderProfile2FASection() {
    const container = $('profile-2fa-section');
    if (!container) return;
    if (state.user.totp_enabled) {
        container.innerHTML = `
            <p class="text-muted admin-field-hint">${t('profile.twofa_enabled_hint')}</p>
            <button type="button" class="btn btn-danger btn-sm" id="profile-2fa-disable-btn">${t('profile.twofa_disable_btn')}</button>
        `;
        $('profile-2fa-disable-btn').onclick = _showDisable2FAPrompt;
    } else {
        container.innerHTML = `
            <p class="text-muted admin-field-hint">${t('profile.twofa_disabled_hint')}</p>
            <button type="button" class="btn btn-secondary btn-sm" id="profile-2fa-enable-btn">${t('profile.twofa_enable_btn')}</button>
        `;
        $('profile-2fa-enable-btn').onclick = _startEnable2FA;
    }
}

async function _startEnable2FA() {
    const container = $('profile-2fa-section');
    try {
        const data = await API.setup2FA();
        container.innerHTML = `
            <p class="text-muted admin-field-hint">${t('profile.twofa_setup_hint')}</p>
            <img src="${data.qr_code_data_uri}" alt="QR code" style="display:block;margin:8px 0;max-width:200px;border-radius:8px">
            <p class="text-muted admin-field-hint" style="word-break:break-all">${t('profile.twofa_manual_secret', { secret: data.secret })}</p>
            <div style="display:flex;gap:8px;margin-top:8px">
                <input type="text" id="profile-2fa-code-input" placeholder="${t('profile.twofa_code_placeholder')}" maxlength="6" style="flex:1">
                <button type="button" class="btn btn-primary btn-sm" id="profile-2fa-confirm-btn">${t('profile.twofa_confirm_btn')}</button>
                <button type="button" class="btn btn-secondary btn-sm" id="profile-2fa-setup-cancel-btn">${t('common.cancel')}</button>
            </div>
        `;
        $('profile-2fa-setup-cancel-btn').onclick = renderProfile2FASection;
        $('profile-2fa-confirm-btn').onclick = async () => {
            const code = $('profile-2fa-code-input').value.trim();
            if (!code) return;
            try {
                await API.verify2FA(code);
                state.user.totp_enabled = true;
                toast(t('profile.twofa_enabled_toast'), 'success');
                renderProfile2FASection();
            } catch (e) { toast(e.message, 'error'); }
        };
    } catch (e) {
        toast(e.message, 'error');
    }
}

function _showDisable2FAPrompt() {
    const container = $('profile-2fa-section');
    container.innerHTML = `
        <p class="text-muted admin-field-hint">${t('profile.twofa_disable_confirm_hint')}</p>
        <div style="display:flex;gap:8px">
            <input type="password" id="profile-2fa-disable-password" placeholder="${t('profile.twofa_password_placeholder')}" style="flex:1">
            <button type="button" class="btn btn-danger btn-sm" id="profile-2fa-disable-confirm-btn">${t('profile.twofa_disable_btn')}</button>
            <button type="button" class="btn btn-secondary btn-sm" id="profile-2fa-disable-cancel-btn">${t('common.cancel')}</button>
        </div>
    `;
    $('profile-2fa-disable-cancel-btn').onclick = renderProfile2FASection;
    $('profile-2fa-disable-confirm-btn').onclick = async () => {
        const password = $('profile-2fa-disable-password').value;
        if (!password) return;
        try {
            await API.disable2FA(password);
            state.user.totp_enabled = false;
            toast(t('profile.twofa_disabled_toast'), 'success');
            renderProfile2FASection();
        } catch (e) { toast(e.message, 'error'); }
    };
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

// revealKey: the raw key text just returned by a create call - shown once,
// inline at the top of the list, since the server never stores or returns
// it again after this response.
async function renderProfileApiKeys(revealKey = null) {
    const container = $('profile-api-keys-list');
    if (!container) return;
    container.innerHTML = `<p class="text-muted admin-field-hint">${t('profile.sessions_loading')}</p>`;
    try {
        const data = await API.getApiKeys();
        let html = '';
        if (revealKey) {
            html += `
                <div class="profile-api-key-reveal">
                    <div class="profile-api-key-reveal-row">
                        <span class="profile-api-key-reveal-value">${escHtml(revealKey)}</span>
                        <button type="button" class="btn btn-secondary btn-sm" id="profile-api-key-copy-btn">${t('profile.api_keys_copy')}</button>
                    </div>
                    <div class="profile-api-key-reveal-note">${t('profile.api_keys_reveal_note')}</div>
                </div>
            `;
        }
        html += data.keys.length === 0
            ? `<p class="text-muted admin-field-hint">${t('profile.api_keys_empty')}</p>`
            : data.keys.map(k => {
                const expiryLabel = k.expires_at
                    ? t(k.is_expired ? 'profile.api_keys_expired_label' : 'profile.api_keys_expires_label', { date: formatDateShort(k.expires_at) })
                    : t('profile.api_keys_no_expiry_label');
                return `
                <div class="profile-session-row">
                    <div>
                        <div class="profile-session-agent">${escHtml(k.name)}${k.is_expired ? ` <span class="badge badge-danger">${t('profile.api_keys_expired_badge')}</span>` : ''}</div>
                        <div class="profile-session-meta">${escHtml(k.key_prefix)}&hellip; &middot; ${k.last_used_at ? t('profile.api_keys_last_used', { date: formatDateShort(k.last_used_at) }) : t('profile.api_keys_never_used')} &middot; ${expiryLabel}</div>
                    </div>
                    <button class="btn btn-danger btn-sm" data-api-key-id="${k.id}">${t('profile.api_keys_revoke')}</button>
                </div>
            `;
            }).join('');
        container.innerHTML = html;
        if (revealKey) {
            $('profile-api-key-copy-btn').onclick = () => _copyApiKeyToClipboard(revealKey);
        }
        container.querySelectorAll('button[data-api-key-id]').forEach(btn => {
            btn.onclick = () => revokeProfileApiKey(btn.dataset.apiKeyId);
        });
    } catch (e) {
        container.innerHTML = `<p class="text-muted admin-field-hint">${e.message}</p>`;
    }
}

async function _copyApiKeyToClipboard(key) {
    try {
        await navigator.clipboard.writeText(key);
        toast(t('profile.api_keys_copied'), 'success');
    } catch (e) {
        // Clipboard API unavailable (e.g. non-secure context) - the key is
        // still visible in the reveal box for manual selection/copy.
    }
}

async function createProfileApiKey() {
    const input = $('profile-api-key-name');
    const name = input.value.trim();
    if (!name) {
        toast(t('profile.api_keys_name_required'), 'warning');
        return;
    }
    const expirySelect = $('profile-api-key-expiry');
    const expiresInDays = expirySelect && expirySelect.value ? parseInt(expirySelect.value, 10) : null;
    try {
        const key = await API.createApiKey(name, expiresInDays);
        input.value = '';
        toast(t('profile.api_keys_created_toast'), 'success');
        renderProfileApiKeys(key.key);
    } catch (e) {
        toast(e.message, 'error');
    }
}

async function revokeProfileApiKey(id) {
    try {
        await API.revokeApiKey(id);
        toast(t('profile.api_keys_revoked_toast'), 'success');
        renderProfileApiKeys();
    } catch (e) {
        toast(e.message, 'error');
    }
}

function initProfileModal() {
    const close = () => {
        clearTimeout(_exportPollTimer);
        $('profile-modal').classList.add('hidden');
    };
    $('profile-modal-close').onclick = close;
    $('profile-modal-cancel').onclick = close;
    $('profile-api-key-create-btn').onclick = createProfileApiKey;
    $('profile-trash-days-save-btn').onclick = saveTrashRetention;
    $('profile-export-request-btn').onclick = requestDataExport;

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
    renderAvatarInto($('user-avatar'), state.user);
}

function showApp() {
    $('auth-screen').classList.add('hidden');
    $('app').classList.remove('hidden');
    _updateSidebarUserInfo();
    if (!state.user.is_admin) $('nav-admin').classList.add('hidden');
    else $('nav-admin').classList.remove('hidden');
    // A guest can view/download whatever's shared to them, but never
    // upload their own content - hides the affordance rather than just
    // relying on the server rejecting the request after the fact.
    $('upload-btn').classList.toggle('hidden', !!state.user.is_guest);
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

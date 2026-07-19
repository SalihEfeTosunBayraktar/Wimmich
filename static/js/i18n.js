/**
 * Wimmich - i18n core. Loaded first (before every other script), so `t()`
 * and `registerTranslations()` are available to every feature file as soon
 * as it runs.
 *
 * Each feature file owns its own strings: near the top of gallery.js,
 * viewer.js, etc. there's a `registerTranslations({ en: {...}, tr: {...},
 * fr: {...}, de: {...} })` call adding that file's keys. This (rather than
 * one giant shared dictionary file) keeps a string next to the code that
 * uses it, and lets every feature file be edited independently without
 * merge conflicts on a shared translations file.
 *
 * Key convention: "<file>.<description>", e.g. "gallery.search_placeholder".
 */
const I18N_LANG_KEY = 'wimmich_lang';
const I18N_SUPPORTED_LANGS = ['en', 'tr', 'fr', 'de'];
const I18N_LANG_NAMES = { en: 'English', tr: 'Türkçe', fr: 'Français', de: 'Deutsch' };

const TRANSLATIONS = { en: {}, tr: {}, fr: {}, de: {} };

function registerTranslations(dict) {
    for (const lang of I18N_SUPPORTED_LANGS) {
        if (dict[lang]) Object.assign(TRANSLATIONS[lang], dict[lang]);
    }
}

function getLanguage() {
    const stored = localStorage.getItem(I18N_LANG_KEY);
    return I18N_SUPPORTED_LANGS.includes(stored) ? stored : 'en';
}

function setLanguage(lang) {
    if (!I18N_SUPPORTED_LANGS.includes(lang)) return;
    localStorage.setItem(I18N_LANG_KEY, lang);
    location.reload();
}

function hasChosenLanguage() {
    return I18N_SUPPORTED_LANGS.includes(localStorage.getItem(I18N_LANG_KEY));
}

/**
 * Looks up `key` in the current language, falling back to English (never
 * to a blank string) and finally to the raw key itself, so a missing
 * translation shows up as an obviously-wrong string during development
 * instead of silently disappearing.
 * `vars`: {name: value} pairs substituted for "{name}" placeholders.
 */
function t(key, vars) {
    const lang = getLanguage();
    let str = (TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) || TRANSLATIONS.en[key] || key;
    if (vars) {
        for (const k in vars) {
            str = str.split(`{${k}}`).join(vars[k]);
        }
    }
    return str;
}

/** Applies translations to static index.html chrome (sidebar, topbar, login
 * form) that isn't rendered by JS - data-i18n sets textContent, data-i18n-
 * placeholder/title/aria-label set the matching attribute instead. */
function applyStaticTranslations(root) {
    (root || document).querySelectorAll('[data-i18n]').forEach(el => {
        el.textContent = t(el.dataset.i18n);
    });
    (root || document).querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        el.placeholder = t(el.dataset.i18nPlaceholder);
    });
    (root || document).querySelectorAll('[data-i18n-title]').forEach(el => {
        el.title = t(el.dataset.i18nTitle);
    });
}

registerTranslations({
    en: {
        'common.language': 'Language',
        'common.ok': 'OK',
        'common.cancel': 'Cancel',
        'common.save': 'Save',
        'common.delete': 'Delete',
        'common.close': 'Close',
        'common.loading': 'Loading...',
        'common.error': 'An error occurred',
        'common.error_prefix': 'Error: ',
        'common.confirm': 'Confirm',
        'common.yes': 'Yes',
        'common.no': 'No',
        'common.search': 'Search',
        'common.name': 'Name',
        'common.email': 'Email',
        'common.password': 'Password',
        'common.first_run_title': 'Choose your language',
        'common.first_run_desc': 'You can change this later from the sidebar.',
        'common.first_run_continue': 'Continue',
    },
    tr: {
        'common.language': 'Dil',
        'common.ok': 'Tamam',
        'common.cancel': 'İptal',
        'common.save': 'Kaydet',
        'common.delete': 'Sil',
        'common.close': 'Kapat',
        'common.loading': 'Yükleniyor...',
        'common.error': 'Bir hata oluştu',
        'common.error_prefix': 'Hata: ',
        'common.confirm': 'Onayla',
        'common.yes': 'Evet',
        'common.no': 'Hayır',
        'common.search': 'Ara',
        'common.name': 'Ad',
        'common.email': 'E-posta',
        'common.password': 'Şifre',
        'common.first_run_title': 'Dilinizi seçin',
        'common.first_run_desc': 'Bunu daha sonra kenar çubuğundan değiştirebilirsiniz.',
        'common.first_run_continue': 'Devam Et',
    },
    fr: {
        'common.language': 'Langue',
        'common.ok': 'OK',
        'common.cancel': 'Annuler',
        'common.save': 'Enregistrer',
        'common.delete': 'Supprimer',
        'common.close': 'Fermer',
        'common.loading': 'Chargement...',
        'common.error': "Une erreur s'est produite",
        'common.error_prefix': 'Erreur : ',
        'common.confirm': 'Confirmer',
        'common.yes': 'Oui',
        'common.no': 'Non',
        'common.search': 'Rechercher',
        'common.name': 'Nom',
        'common.email': 'E-mail',
        'common.password': 'Mot de passe',
        'common.first_run_title': 'Choisissez votre langue',
        'common.first_run_desc': 'Vous pourrez la modifier plus tard depuis la barre latérale.',
        'common.first_run_continue': 'Continuer',
    },
    de: {
        'common.language': 'Sprache',
        'common.ok': 'OK',
        'common.cancel': 'Abbrechen',
        'common.save': 'Speichern',
        'common.delete': 'Löschen',
        'common.close': 'Schließen',
        'common.loading': 'Wird geladen...',
        'common.error': 'Ein Fehler ist aufgetreten',
        'common.error_prefix': 'Fehler: ',
        'common.confirm': 'Bestätigen',
        'common.yes': 'Ja',
        'common.no': 'Nein',
        'common.search': 'Suchen',
        'common.name': 'Name',
        'common.email': 'E-Mail',
        'common.password': 'Passwort',
        'common.first_run_title': 'Wählen Sie Ihre Sprache',
        'common.first_run_desc': 'Sie können dies später in der Seitenleiste ändern.',
        'common.first_run_continue': 'Weiter',
    },
});

registerTranslations({
    en: {
        'nav.gallery': 'All Photos',
        'nav.albums': 'Albums',
        'nav.favorites': 'Favorites',
        'nav.people': 'People',
        'nav.map': 'Map',
        'nav.sharing': 'Sharing',
        'nav.memories': 'Memories',
        'nav.archive': 'Archive',
        'nav.trash': 'Trash',
        'nav.duplicates': 'Duplicate Detection',
        'nav.admin': 'Admin',
        'admin.panel_title': 'Admin Panel',
        'admin.no_jobs': 'No past or active background jobs yet.',
        'admin.confirm_cancel_job': 'Are you sure you want to stop this job?',
        'admin.job_cancelled': 'Job stopped.',
        'auth.subtitle': 'Photo & Video Management Server',
        'auth.email': 'Email',
        'auth.password': 'Password',
        'auth.remember_me': 'Remember Me',
        'auth.login': 'Log In',
        'auth.register': 'Sign Up',
        'auth.no_account': "Don't have an account?",
        'auth.has_account': 'Already have an account?',
        'auth.full_name': 'Full Name',
        'auth.pending_approval': 'Registration successful. Waiting for admin approval before you can log in.',
        'sidebar.version': 'Version {version}',
        'sidebar.version_with_date': 'Version {version} · {date}',
        'sidebar.personal_storage': 'Personal Storage',
        'sidebar.unlimited': 'Unlimited',
        'sidebar.user_fallback': 'User',
        'sidebar.logout': 'Log Out',
        'topbar.select_all': 'Select All',
        'topbar.upload': 'Upload',
        'topbar.slideshow': 'Slideshow',
        'upload.title': 'Upload Files',
        'upload.drag_here': 'Drag files here',
        'upload.or': 'or',
        'upload.choose_files': 'Choose Files',
        'upload.limit_hint': 'Phone/gallery pickers can select ~100 files at a time at most - add more as many times as you need.',
        'upload.add_more': '+ Add More',
        'viewer.prev': 'Previous',
        'viewer.favorite': 'Favorite',
        'viewer.info': 'Info',
        'viewer.download': 'Download',
        'viewer.archive': 'Archive',
        'viewer.delete': 'Delete',
        'viewer.next': 'Next',
        'viewer.close': 'Close',
        'viewer.similar_photos': 'Similar Photos',
        'albums.new_album': 'New Album',
        'albums.album_name': 'Album Name',
        'albums.album_name_placeholder': 'Album name...',
        'albums.description': 'Description',
        'albums.description_placeholder': 'Description (optional)',
        'albums.create': 'Create',
        'albums.add_to_album': 'Add to Album',
        'albums.create_new_album': '+ Create New Album',
        'sharing.create_link': 'Create Share Link',
        'sharing.password_optional': 'Password (optional)',
        'sharing.password_protection': 'Password protection',
        'sharing.expires_in': 'Expires In (days)',
        'sharing.never': 'Never',
        'sharing.one_day': '1 day',
        'sharing.seven_days': '7 days',
        'sharing.thirty_days': '30 days',
        'sharing.ninety_days': '90 days',
        'sharing.allow_download': 'Allow downloads',
    },
    tr: {
        'nav.gallery': 'Tüm Fotoğraflar',
        'nav.albums': 'Albümler',
        'nav.favorites': 'Favoriler',
        'nav.people': 'Kişiler',
        'nav.map': 'Harita',
        'nav.sharing': 'Paylaşım',
        'nav.memories': 'Anılar',
        'nav.archive': 'Arşiv',
        'nav.trash': 'Çöp Kutusu',
        'nav.duplicates': 'Kopya Tespiti',
        'nav.admin': 'Yönetim',
        'admin.panel_title': 'Yönetim Paneli',
        'admin.no_jobs': 'Henüz geçmiş veya aktif bir arka plan işi bulunmuyor.',
        'admin.confirm_cancel_job': 'Bu işlemi durdurmak istediğinize emin misiniz?',
        'admin.job_cancelled': 'İşlem durduruldu.',
        'auth.subtitle': 'Fotoğraf & Video Yönetim Sunucusu',
        'auth.email': 'E-posta',
        'auth.password': 'Şifre',
        'auth.remember_me': 'Beni Hatırla',
        'auth.login': 'Giriş Yap',
        'auth.register': 'Kayıt Ol',
        'auth.no_account': 'Hesabın yok mu?',
        'auth.has_account': 'Zaten hesabın var mı?',
        'auth.full_name': 'Ad Soyad',
        'auth.pending_approval': 'Kayıt başarılı. Giriş yapabilmek için yönetici onayı bekleniyor.',
        'sidebar.version': 'Sürüm {version}',
        'sidebar.version_with_date': 'Sürüm {version} · {date}',
        'sidebar.personal_storage': 'Kişisel Depo',
        'sidebar.unlimited': 'Sınırsız',
        'sidebar.user_fallback': 'Kullanıcı',
        'sidebar.logout': 'Çıkış Yap',
        'topbar.select_all': 'Tümünü Seç',
        'topbar.upload': 'Yükle',
        'topbar.slideshow': 'Slayt Gösterisi',
        'upload.title': 'Dosya Yükle',
        'upload.drag_here': 'Dosyaları buraya sürükleyin',
        'upload.or': 'veya',
        'upload.choose_files': 'Dosya Seç',
        'upload.limit_hint': 'Telefon/galeri seçicileri tek seferde en fazla ~100 dosya seçtirebilir - istediğiniz kadar tekrar ekleyebilirsiniz.',
        'upload.add_more': '+ Daha Fazla Ekle',
        'viewer.prev': 'Önceki',
        'viewer.favorite': 'Favori',
        'viewer.info': 'Bilgi',
        'viewer.download': 'İndir',
        'viewer.archive': 'Arşivle',
        'viewer.delete': 'Sil',
        'viewer.next': 'Sonraki',
        'viewer.close': 'Kapat',
        'viewer.similar_photos': 'Benzer Fotoğraflar',
        'albums.new_album': 'Yeni Albüm',
        'albums.album_name': 'Albüm Adı',
        'albums.album_name_placeholder': 'Albüm adı...',
        'albums.description': 'Açıklama',
        'albums.description_placeholder': 'Açıklama (opsiyonel)',
        'albums.create': 'Oluştur',
        'albums.add_to_album': 'Albüme Ekle',
        'albums.create_new_album': '+ Yeni Albüm Oluştur',
        'sharing.create_link': 'Paylaşım Linki Oluştur',
        'sharing.password_optional': 'Şifre (opsiyonel)',
        'sharing.password_protection': 'Şifre koruması',
        'sharing.expires_in': 'Süre Sonu (gün)',
        'sharing.never': 'Süresiz',
        'sharing.one_day': '1 gün',
        'sharing.seven_days': '7 gün',
        'sharing.thirty_days': '30 gün',
        'sharing.ninety_days': '90 gün',
        'sharing.allow_download': 'İndirmeye izin ver',
    },
    fr: {
        'nav.gallery': 'Toutes les photos',
        'nav.albums': 'Albums',
        'nav.favorites': 'Favoris',
        'nav.people': 'Personnes',
        'nav.map': 'Carte',
        'nav.sharing': 'Partage',
        'nav.memories': 'Souvenirs',
        'nav.archive': 'Archives',
        'nav.trash': 'Corbeille',
        'nav.duplicates': 'Détection des doublons',
        'nav.admin': 'Administration',
        'admin.panel_title': "Panneau d'administration",
        'admin.no_jobs': "Aucune tâche en arrière-plan passée ou active pour le moment.",
        'admin.confirm_cancel_job': 'Voulez-vous vraiment arrêter cette tâche ?',
        'admin.job_cancelled': 'Tâche arrêtée.',
        'auth.subtitle': 'Serveur de gestion photo & vidéo',
        'auth.email': 'E-mail',
        'auth.password': 'Mot de passe',
        'auth.remember_me': 'Se souvenir de moi',
        'auth.login': 'Se connecter',
        'auth.register': "S'inscrire",
        'auth.no_account': "Vous n'avez pas de compte ?",
        'auth.has_account': 'Vous avez déjà un compte ?',
        'auth.full_name': 'Nom complet',
        'auth.pending_approval': "Inscription réussie. En attente de l'approbation d'un administrateur avant de pouvoir vous connecter.",
        'sidebar.version': 'Version {version}',
        'sidebar.version_with_date': 'Version {version} · {date}',
        'sidebar.personal_storage': 'Stockage personnel',
        'sidebar.unlimited': 'Illimité',
        'sidebar.user_fallback': 'Utilisateur',
        'sidebar.logout': 'Se déconnecter',
        'topbar.select_all': 'Tout sélectionner',
        'topbar.upload': 'Importer',
        'topbar.slideshow': 'Diaporama',
        'upload.title': 'Importer des fichiers',
        'upload.drag_here': 'Glissez les fichiers ici',
        'upload.or': 'ou',
        'upload.choose_files': 'Choisir des fichiers',
        'upload.limit_hint': "Les sélecteurs de photos/galerie du téléphone ne permettent souvent qu'environ 100 fichiers à la fois - ajoutez-en autant de fois que nécessaire.",
        'upload.add_more': '+ Ajouter plus',
        'viewer.prev': 'Précédent',
        'viewer.favorite': 'Favori',
        'viewer.info': 'Infos',
        'viewer.download': 'Télécharger',
        'viewer.archive': 'Archiver',
        'viewer.delete': 'Supprimer',
        'viewer.next': 'Suivant',
        'viewer.close': 'Fermer',
        'viewer.similar_photos': 'Photos similaires',
        'albums.new_album': 'Nouvel album',
        'albums.album_name': "Nom de l'album",
        'albums.album_name_placeholder': "Nom de l'album...",
        'albums.description': 'Description',
        'albums.description_placeholder': 'Description (facultatif)',
        'albums.create': 'Créer',
        'albums.add_to_album': "Ajouter à l'album",
        'albums.create_new_album': '+ Créer un nouvel album',
        'sharing.create_link': 'Créer un lien de partage',
        'sharing.password_optional': 'Mot de passe (facultatif)',
        'sharing.password_protection': 'Protection par mot de passe',
        'sharing.expires_in': "Expire dans (jours)",
        'sharing.never': 'Jamais',
        'sharing.one_day': '1 jour',
        'sharing.seven_days': '7 jours',
        'sharing.thirty_days': '30 jours',
        'sharing.ninety_days': '90 jours',
        'sharing.allow_download': 'Autoriser les téléchargements',
    },
    de: {
        'nav.gallery': 'Alle Fotos',
        'nav.albums': 'Alben',
        'nav.favorites': 'Favoriten',
        'nav.people': 'Personen',
        'nav.map': 'Karte',
        'nav.sharing': 'Freigabe',
        'nav.memories': 'Erinnerungen',
        'nav.archive': 'Archiv',
        'nav.trash': 'Papierkorb',
        'nav.duplicates': 'Duplikaterkennung',
        'nav.admin': 'Verwaltung',
        'admin.panel_title': 'Verwaltungspanel',
        'admin.no_jobs': 'Noch keine vergangenen oder aktiven Hintergrundaufgaben.',
        'admin.confirm_cancel_job': 'Möchten Sie diese Aufgabe wirklich stoppen?',
        'admin.job_cancelled': 'Aufgabe gestoppt.',
        'auth.subtitle': 'Foto- & Videoverwaltungsserver',
        'auth.email': 'E-Mail',
        'auth.password': 'Passwort',
        'auth.remember_me': 'Angemeldet bleiben',
        'auth.login': 'Anmelden',
        'auth.register': 'Registrieren',
        'auth.no_account': 'Noch kein Konto?',
        'auth.has_account': 'Bereits ein Konto?',
        'auth.full_name': 'Vollständiger Name',
        'auth.pending_approval': 'Registrierung erfolgreich. Warten auf Genehmigung durch einen Administrator, bevor Sie sich anmelden können.',
        'sidebar.version': 'Version {version}',
        'sidebar.version_with_date': 'Version {version} · {date}',
        'sidebar.personal_storage': 'Persönlicher Speicher',
        'sidebar.unlimited': 'Unbegrenzt',
        'sidebar.user_fallback': 'Benutzer',
        'sidebar.logout': 'Abmelden',
        'topbar.select_all': 'Alle auswählen',
        'topbar.upload': 'Hochladen',
        'topbar.slideshow': 'Diashow',
        'upload.title': 'Dateien hochladen',
        'upload.drag_here': 'Dateien hierher ziehen',
        'upload.or': 'oder',
        'upload.choose_files': 'Dateien auswählen',
        'upload.limit_hint': 'Telefon-/Galerie-Auswahldialoge lassen oft nur ~100 Dateien gleichzeitig zu - fügen Sie so oft wie nötig weitere hinzu.',
        'upload.add_more': '+ Mehr hinzufügen',
        'viewer.prev': 'Zurück',
        'viewer.favorite': 'Favorit',
        'viewer.info': 'Info',
        'viewer.download': 'Herunterladen',
        'viewer.archive': 'Archivieren',
        'viewer.delete': 'Löschen',
        'viewer.next': 'Weiter',
        'viewer.close': 'Schließen',
        'viewer.similar_photos': 'Ähnliche Fotos',
        'albums.new_album': 'Neues Album',
        'albums.album_name': 'Albumname',
        'albums.album_name_placeholder': 'Albumname...',
        'albums.description': 'Beschreibung',
        'albums.description_placeholder': 'Beschreibung (optional)',
        'albums.create': 'Erstellen',
        'albums.add_to_album': 'Zum Album hinzufügen',
        'albums.create_new_album': '+ Neues Album erstellen',
        'sharing.create_link': 'Freigabelink erstellen',
        'sharing.password_optional': 'Passwort (optional)',
        'sharing.password_protection': 'Passwortschutz',
        'sharing.expires_in': 'Läuft ab in (Tage)',
        'sharing.never': 'Nie',
        'sharing.one_day': '1 Tag',
        'sharing.seven_days': '7 Tage',
        'sharing.thirty_days': '30 Tage',
        'sharing.ninety_days': '90 Tage',
        'sharing.allow_download': 'Downloads erlauben',
    },
});

function _showFirstRunLanguagePicker() {
    const overlay = document.createElement('div');
    overlay.className = 'i18n-first-run-overlay';
    overlay.innerHTML = `
        <div class="i18n-first-run-card">
            <h2 data-i18n="common.first_run_title"></h2>
            <p data-i18n="common.first_run_desc"></p>
            <div class="i18n-first-run-options">
                ${I18N_SUPPORTED_LANGS.map(l => `<button type="button" class="i18n-first-run-btn" data-lang="${l}">${I18N_LANG_NAMES[l]}</button>`).join('')}
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    applyStaticTranslations(overlay);
    overlay.querySelectorAll('.i18n-first-run-btn').forEach(btn => {
        btn.onclick = () => setLanguage(btn.dataset.lang);
    });
}

function _populateLangSelect(select) {
    if (!select) return;
    select.innerHTML = I18N_SUPPORTED_LANGS.map(l => `<option value="${l}">${I18N_LANG_NAMES[l]}</option>`).join('');
    select.value = getLanguage();
    select.onchange = () => setLanguage(select.value);
}

document.addEventListener('DOMContentLoaded', () => {
    if (!hasChosenLanguage()) {
        _showFirstRunLanguagePicker();
    }
    applyStaticTranslations();
    _populateLangSelect(document.getElementById('auth-lang-select'));
    _populateLangSelect(document.getElementById('sidebar-lang-select'));
});

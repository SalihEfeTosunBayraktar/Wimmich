/**
 * Wimmich - First-run welcome screen.
 *
 * Shown in place of the gallery's generic "no photos" state when the library
 * is genuinely empty AND nothing is filtering it. That distinction is the
 * whole point: "you have no photos yet" and "this filter matched nothing"
 * are different situations and want different screens - one is an
 * invitation, the other is a dead end to back out of.
 *
 * Someone reaching this has just finished a multi-gigabyte install and is
 * looking at an empty page. The job here is to answer "what now?" without
 * making them go hunting through the sidebar for it.
 */
registerTranslations({
    en: {
        'welcome.title': 'Welcome to Wimmich',
        'welcome.subtitle': 'Your library is empty. Here is how to fill it.',
        'welcome.step_upload_title': 'Add photos from this device',
        'welcome.step_upload_body': 'Pick files, or drag them anywhere onto this page. Videos are welcome too.',
        'welcome.step_upload_btn': 'Upload',
        'welcome.step_import_title': 'Import a folder already on this machine',
        'welcome.step_import_body': 'Point Wimmich at a folder and it brings in everything inside, keeping the dates and locations already stored in the files.',
        'welcome.step_import_btn': 'Open import',
        'welcome.step_background_title': 'Then leave it alone for a while',
        'welcome.step_background_body': 'Thumbnails, dates, locations, faces and search indexing all happen on their own in the background. Progress is on the admin panel; nothing needs babysitting.',
        'welcome.capabilities_title': 'What this server can do right now',
        'welcome.cap_ffmpeg': 'Video thumbnails and playback',
        'welcome.cap_clip': 'Search by describing a photo',
        'welcome.cap_face': 'Grouping photos by person',
        'welcome.cap_ocr': 'Searching text inside screenshots',
        'welcome.cap_on': 'Ready',
        'welcome.cap_off': 'Not installed',
        'welcome.cap_hint_ml': 'Run install_full.bat to add the AI features.',
        'welcome.cap_hint_ocr': 'Install Tesseract OCR, then restart the server.',
        'welcome.cap_hint_ffmpeg': 'Re-run the installer - it fetches FFmpeg for you.',
        'welcome.cap_error': "Couldn't read the server's status.",
        'welcome.tips_title': 'Worth knowing',
        'welcome.tip_shortcuts': 'Press <kbd>?</kbd> anywhere for the keyboard shortcuts.',
        'welcome.tip_search': 'The search box holds the filters too - albums, favourites, videos only, and so on.',
        'welcome.tip_language': 'Language and theme are at the bottom of the sidebar.',
        'welcome.guest_title': 'Nothing has been shared with you yet',
        'welcome.guest_body': 'Your account can view and download shared photos, but not add any. Ask the server owner to share an album with you.',
    },
    tr: {
        'welcome.title': "Wimmich'e hoş geldiniz",
        'welcome.subtitle': 'Kitaplığınız boş. Doldurmanın yolu şöyle.',
        'welcome.step_upload_title': 'Bu cihazdan fotoğraf ekleyin',
        'welcome.step_upload_body': 'Dosya seçin ya da sayfanın herhangi bir yerine sürükleyip bırakın. Videolar da olur.',
        'welcome.step_upload_btn': 'Yükle',
        'welcome.step_import_title': 'Bu bilgisayardaki bir klasörü içe aktarın',
        'welcome.step_import_body': "Wimmich'e bir klasör gösterin, içindeki her şeyi alsın - dosyalarda zaten yazılı olan tarih ve konumları koruyarak.",
        'welcome.step_import_btn': 'İçe aktarmayı aç',
        'welcome.step_background_title': 'Sonra bir süre kendi haline bırakın',
        'welcome.step_background_body': 'Küçük resimler, tarihler, konumlar, yüzler ve arama dizini arka planda kendiliğinden oluşur. İlerlemeyi yönetim panelinden görebilirsiniz; başında beklemeniz gerekmez.',
        'welcome.capabilities_title': 'Bu sunucu şu anda neler yapabiliyor',
        'welcome.cap_ffmpeg': 'Video küçük resmi ve oynatma',
        'welcome.cap_clip': 'Fotoğrafı tarif ederek arama',
        'welcome.cap_face': 'Fotoğrafları kişiye göre gruplama',
        'welcome.cap_ocr': 'Ekran görüntülerindeki yazıyı arama',
        'welcome.cap_on': 'Hazır',
        'welcome.cap_off': 'Kurulu değil',
        'welcome.cap_hint_ml': 'Yapay zekâ özellikleri için install_full.bat çalıştırın.',
        'welcome.cap_hint_ocr': 'Tesseract OCR kurup sunucuyu yeniden başlatın.',
        'welcome.cap_hint_ffmpeg': "Kurulumu tekrar çalıştırın - FFmpeg'i sizin için indirir.",
        'welcome.cap_error': 'Sunucu durumu okunamadı.',
        'welcome.tips_title': 'Bilmekte fayda var',
        'welcome.tip_shortcuts': 'Klavye kısayolları için herhangi bir yerde <kbd>?</kbd> tuşuna basın.',
        'welcome.tip_search': 'Arama kutusu filtreleri de tutar - albümler, favoriler, sadece videolar vb.',
        'welcome.tip_language': 'Dil ve tema kenar çubuğunun altında.',
        'welcome.guest_title': 'Sizinle henüz bir şey paylaşılmamış',
        'welcome.guest_body': 'Hesabınız paylaşılan fotoğrafları görüntüleyip indirebilir, ama yenisini ekleyemez. Sunucu sahibinden sizinle bir albüm paylaşmasını isteyin.',
    },
    fr: {
        'welcome.title': "Bienvenue sur Wimmich",
        'welcome.subtitle': "Votre bibliothèque est vide. Voici comment la remplir.",
        'welcome.step_upload_title': "Ajouter des photos depuis cet appareil",
        'welcome.step_upload_body': "Choisissez des fichiers, ou déposez-les n'importe où sur cette page. Les vidéos sont acceptées aussi.",
        'welcome.step_upload_btn': "Envoyer",
        'welcome.step_import_title': "Importer un dossier déjà présent sur cette machine",
        'welcome.step_import_body': "Indiquez un dossier à Wimmich et il récupère tout ce qu'il contient, en conservant les dates et lieux déjà inscrits dans les fichiers.",
        'welcome.step_import_btn': "Ouvrir l'import",
        'welcome.step_background_title': "Puis laissez-le travailler un moment",
        'welcome.step_background_body': "Miniatures, dates, lieux, visages et indexation de recherche se font tout seuls en arrière-plan. La progression est dans le panneau d'administration ; rien à surveiller.",
        'welcome.capabilities_title': "Ce que ce serveur sait faire actuellement",
        'welcome.cap_ffmpeg': "Miniatures et lecture vidéo",
        'welcome.cap_clip': "Recherche en décrivant une photo",
        'welcome.cap_face': "Regroupement des photos par personne",
        'welcome.cap_ocr': "Recherche du texte dans les captures d'écran",
        'welcome.cap_on': "Prêt",
        'welcome.cap_off': "Non installé",
        'welcome.cap_hint_ml': "Lancez install_full.bat pour ajouter les fonctions IA.",
        'welcome.cap_hint_ocr': "Installez Tesseract OCR, puis redémarrez le serveur.",
        'welcome.cap_hint_ffmpeg': "Relancez l'installateur - il récupère FFmpeg pour vous.",
        'welcome.cap_error': "Impossible de lire l'état du serveur.",
        'welcome.tips_title': "Bon à savoir",
        'welcome.tip_shortcuts': "Appuyez sur <kbd>?</kbd> n'importe où pour les raccourcis clavier.",
        'welcome.tip_search': "La barre de recherche contient aussi les filtres - albums, favoris, vidéos seulement, etc.",
        'welcome.tip_language': "La langue et le thème sont en bas de la barre latérale.",
        'welcome.guest_title': "Rien ne vous a encore été partagé",
        'welcome.guest_body': "Votre compte peut consulter et télécharger les photos partagées, mais pas en ajouter. Demandez au propriétaire du serveur de partager un album avec vous.",
    },
    de: {
        'welcome.title': 'Willkommen bei Wimmich',
        'welcome.subtitle': 'Ihre Bibliothek ist leer. So füllen Sie sie.',
        'welcome.step_upload_title': 'Fotos von diesem Gerät hinzufügen',
        'welcome.step_upload_body': 'Dateien auswählen oder irgendwo auf diese Seite ziehen. Videos sind ebenfalls willkommen.',
        'welcome.step_upload_btn': 'Hochladen',
        'welcome.step_import_title': 'Einen Ordner importieren, der schon auf diesem Rechner liegt',
        'welcome.step_import_body': 'Zeigen Sie Wimmich einen Ordner, und es übernimmt alles darin - samt der Daten und Orte, die bereits in den Dateien stehen.',
        'welcome.step_import_btn': 'Import öffnen',
        'welcome.step_background_title': 'Und dann eine Weile in Ruhe lassen',
        'welcome.step_background_body': 'Miniaturbilder, Daten, Orte, Gesichter und die Suchindizierung entstehen von selbst im Hintergrund. Den Fortschritt sehen Sie im Admin-Bereich; beaufsichtigen müssen Sie nichts.',
        'welcome.capabilities_title': 'Was dieser Server gerade kann',
        'welcome.cap_ffmpeg': 'Video-Miniaturbilder und Wiedergabe',
        'welcome.cap_clip': 'Suchen, indem man ein Foto beschreibt',
        'welcome.cap_face': 'Fotos nach Person gruppieren',
        'welcome.cap_ocr': 'Text in Screenshots durchsuchen',
        'welcome.cap_on': 'Bereit',
        'welcome.cap_off': 'Nicht installiert',
        'welcome.cap_hint_ml': 'Führen Sie install_full.bat aus, um die KI-Funktionen zu ergänzen.',
        'welcome.cap_hint_ocr': 'Tesseract OCR installieren und den Server neu starten.',
        'welcome.cap_hint_ffmpeg': 'Installer erneut ausführen - er holt FFmpeg für Sie.',
        'welcome.cap_error': 'Serverstatus konnte nicht gelesen werden.',
        'welcome.tips_title': 'Gut zu wissen',
        'welcome.tip_shortcuts': 'Drücken Sie überall <kbd>?</kbd> für die Tastenkürzel.',
        'welcome.tip_search': 'Das Suchfeld enthält auch die Filter - Alben, Favoriten, nur Videos und so weiter.',
        'welcome.tip_language': 'Sprache und Design finden Sie unten in der Seitenleiste.',
        'welcome.guest_title': 'Mit Ihnen wurde noch nichts geteilt',
        'welcome.guest_body': 'Ihr Konto kann geteilte Fotos ansehen und herunterladen, aber keine hinzufügen. Bitten Sie den Serverbetreiber, ein Album mit Ihnen zu teilen.',
    },
});


function _welcomeStep(number, iconName, title, body, action) {
    // Numbered because this genuinely IS a sequence - you add photos before
    // anything can be indexed. Decorative numbering on a set of unordered
    // choices would be a lie about the content.
    return `
        <li class="welcome-step">
            <span class="welcome-step-num">${number}</span>
            <div class="welcome-step-text">
                <h4>${icon(iconName, 16)} ${title}</h4>
                <p>${body}</p>
                ${action || ''}
            </div>
        </li>`;
}


function _welcomeCapability(label, available, hintKey) {
    return `
        <li class="welcome-cap ${available ? 'is-on' : 'is-off'}">
            <span class="welcome-cap-dot" aria-hidden="true"></span>
            <span class="welcome-cap-label">${label}</span>
            <span class="welcome-cap-state">${available ? t('welcome.cap_on') : t('welcome.cap_off')}</span>
            ${available ? '' : `<span class="welcome-cap-hint">${t(hintKey)}</span>`}
        </li>`;
}


/** Capability list, admins only. A regular user can't install anything, so
 *  telling them what's missing would be noise they can't act on. */
async function _welcomeCapabilitiesHtml() {
    if (!state.user?.is_admin) return '';

    let stats;
    try {
        stats = await API.getAdminStats();
    } catch (e) {
        return `<p class="text-muted admin-field-hint">${t('welcome.cap_error')}</p>`;
    }

    const ml = stats.ml || {};
    return `
        <section class="welcome-caps">
            <h3>${t('welcome.capabilities_title')}</h3>
            <ul>
                ${_welcomeCapability(t('welcome.cap_ffmpeg'), stats.ffmpeg_available, 'welcome.cap_hint_ffmpeg')}
                ${_welcomeCapability(t('welcome.cap_clip'), ml.clip_available, 'welcome.cap_hint_ml')}
                ${_welcomeCapability(t('welcome.cap_face'), ml.face_detection_available, 'welcome.cap_hint_ml')}
                ${_welcomeCapability(t('welcome.cap_ocr'), ml.ocr_available, 'welcome.cap_hint_ocr')}
            </ul>
        </section>`;
}


/** Guests can't add anything at all, so the ordinary "here's how to fill
 *  your library" screen would be actively misleading for them. */
function _welcomeGuestHtml() {
    return `
        <div class="welcome">
            <div class="welcome-hero">
                <h2>${t('welcome.guest_title')}</h2>
                <p>${t('welcome.guest_body')}</p>
            </div>
        </div>`;
}


async function renderWelcomeScreen() {
    if (state.user?.is_guest) return _welcomeGuestHtml();

    const isAdmin = !!state.user?.is_admin;
    let step = 0;

    const uploadStep = _welcomeStep(
        ++step, 'upload',
        t('welcome.step_upload_title'),
        t('welcome.step_upload_body'),
        `<button class="btn btn-primary btn-sm" onclick="restoreUpload()">${icon('upload')} ${t('welcome.step_upload_btn')}</button>`,
    );

    // Importing reads the server's own filesystem, so it is admin-only
    // (see import_router.py) - offering it to everyone would just produce
    // a 403 for most people.
    const importStep = isAdmin ? _welcomeStep(
        ++step, 'folder',
        t('welcome.step_import_title'),
        t('welcome.step_import_body'),
        `<button class="btn btn-secondary btn-sm" onclick="navigateTo('admin'); setTimeout(() => toggleDashDetail('import'), 400)">${icon('folder')} ${t('welcome.step_import_btn')}</button>`,
    ) : '';

    const backgroundStep = _welcomeStep(
        ++step, 'brain',
        t('welcome.step_background_title'),
        t('welcome.step_background_body'),
    );

    return `
        <div class="welcome">
            <div class="welcome-hero">
                <img src="/static/logo.png" alt="" class="welcome-logo">
                <h2>${t('welcome.title')}</h2>
                <p>${t('welcome.subtitle')}</p>
            </div>

            <ol class="welcome-steps">
                ${uploadStep}
                ${importStep}
                ${backgroundStep}
            </ol>

            ${await _welcomeCapabilitiesHtml()}

            <section class="welcome-tips">
                <h3>${t('welcome.tips_title')}</h3>
                <ul>
                    <li>${t('welcome.tip_shortcuts')}</li>
                    <li>${t('welcome.tip_search')}</li>
                    <li>${t('welcome.tip_language')}</li>
                </ul>
            </section>
        </div>`;
}

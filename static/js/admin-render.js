/**
 * Wimmich - Admin panel main page templating (stats, storage, users, jobs, ML status).
 */
registerTranslations({
    en: {
        'admin_render.stat_photos': 'Photos',
        'admin_render.stat_videos': 'Videos',
        'admin_render.stat_total_size': 'Total Size',
        'admin_render.stat_people': 'People',
        'admin_render.stat_albums': 'Albums',
        'admin_render.stat_users': 'Users',
        'admin_render.storage_settings_heading': 'System & Storage Settings',
        'admin_render.main_storage_dir_label': 'Main Storage Directory',
        'admin_render.storage_path_placeholder': 'e.g. D:\\WimmichData',
        'admin_render.tunnel_token_label': 'Cloudflare Zero Trust Tunnel Token (For Your Own Domain)',
        'admin_render.tunnel_token_placeholder': 'e.g. eyJhIjoi...',
        'admin_render.tunnel_token_hint': 'Enter the Token value from the Zero Trust panel to route your own domain. If left blank, a temporary tunnel is opened.',
        'admin_render.custom_domain_label': 'Your Custom Domain Name (used together with the Token)',
        'admin_render.custom_domain_placeholder': 'e.g. myphotos.example.com',
        'admin_render.custom_domain_hint': "If you've connected this tunnel to a domain in the Zero Trust panel, enter that domain here so the panel can show you the real connection address.",
        'admin_render.storage_limit_label': 'Server Total Storage Limit (MB - 0 for Unlimited)',
        'admin_render.tunnel_autostart_label': 'Automatically start the tunnel when the server starts',
        'admin_render.save_settings_btn': 'Save Settings',
        'admin_render.db_location_hint': 'For database security, the database file is always stored at the fixed location {path}.',
        'admin_render.remote_access_heading': 'Remote Access (Cloudflare Tunnel)',
        'admin_render.backup_heading': 'Backup',
        'admin_render.backup_dir_label': 'Backup Folder (preferably a separate disk)',
        'admin_render.backup_dir_placeholder': 'e.g. E:\\WimmichBackup',
        'admin_render.backup_dir_hint': "You can save this path even if the disk isn't currently connected - it's only checked when a backup actually runs.",
        'admin_render.backup_interval_label': 'Automatic Backup Interval (hours)',
        'admin_render.backup_enabled_label': 'Enable automatic backup',
        'admin_render.backup_now_btn': 'Backup Now',
        'admin_render.backup_now_title': 'Immediately backs up the database and any photos/videos not yet backed up.',
        'admin_render.folder_import_heading': 'Folder Import',
        'admin_render.folder_import_desc': 'Import your old photo archives from your computer into Wimmich.',
        'admin_render.browse_path_placeholder': 'Enter a folder path or choose one below...',
        'admin_render.go_btn': 'Go',
        'admin_render.scan_btn': 'Scan',
        'admin_render.import_copy_label': 'Copy files (move)',
        'admin_render.import_recursive_label': 'Include subfolders',
        'admin_render.ml_status_heading': 'ML Status',
        'admin_render.status_active': 'Active',
        'admin_render.status_active_opencv': 'Active (OpenCV)',
        'admin_render.status_unavailable': 'Unavailable',
        'admin_render.badge_clip_search': 'CLIP Search: {status}',
        'admin_render.badge_face_detection': 'Face Detection: {status}',
        'admin_render.badge_person_clustering': 'Person Matching: {status}',
        'admin_render.badge_ffmpeg': 'FFmpeg: {status}',
        'admin_render.badge_geocoding': 'Location Tagging: {status}',
        'admin_render.person_clustering_hint': 'Person matching requires the <code>face_recognition</code> library to be installed; without it, faces are detected but not grouped into people.',
        'admin_render.background_jobs_heading': 'Background Jobs',
        'admin_render.jobs_pending_badge': '{count} Pending',
        'admin_render.jobs_running_badge': '{count} Running',
        'admin_render.jobs_failed_badge': '{count} Failed',
        'admin_render.job_clip_btn': 'CLIP Index',
        'admin_render.job_face_btn': 'Face Recognition',
        'admin_render.job_thumbnail_btn': 'Thumbnails',
        'admin_render.job_geocode_btn': 'Tag Locations',
        'admin_render.job_transcode_btn': 'Convert Video',
        'admin_render.job_recluster_btn': 'Re-cluster Faces',
        'admin_render.job_recluster_title': "Disbands unnamed person groups and re-clusters faces using the current threshold; people you've named are preserved.",
        'admin_render.job_categorize_btn': 'Auto-Categorize',
        'admin_render.job_categorize_title': 'Automatically sorts photos that have a CLIP embedding into categories like screenshot/document/nature/pet.',
        'admin_render.cancel_all_jobs_btn': 'Cancel All Jobs',
        'admin_render.cancel_all_jobs_title': 'Cancels all pending/running jobs - use this if a stuck or unwanted job is blocking you.',
        'admin_render.recent_jobs_label': 'Recent Jobs',
        'admin_render.auto_updates_label': 'Auto-updates',
        'admin_render.no_backup_run_yet': 'No backup has been run yet.',
        'admin_render.backup_failed_status': 'Last attempt failed ({when}): {error}',
        'admin_render.unknown_error': 'Unknown error',
        'admin_render.backup_success_status': 'Last successful backup: {when}',
        'admin_render.server_control_heading': 'Server Control',
        'admin_render.shutdown_server_btn': 'Shut Down Server',
        'admin_render.shutdown_server_hint': 'Cleanly stops background jobs and the tunnel, frees GPU/CPU memory, then exits - the safe alternative to closing this window while a job is running.',
        'admin_render.confirm_shutdown': 'Shut down the server now? Any running background job will be stopped first.',
        'admin_render.shutting_down_message': 'Shutting down - freeing memory and stopping the server...',
    },
    tr: {
        'admin_render.stat_photos': 'Fotoğraf',
        'admin_render.stat_videos': 'Video',
        'admin_render.stat_total_size': 'Toplam Boyut',
        'admin_render.stat_people': 'Kişiler',
        'admin_render.stat_albums': 'Albümler',
        'admin_render.stat_users': 'Kullanıcılar',
        'admin_render.storage_settings_heading': 'Sistem ve Depolama Ayarları',
        'admin_render.main_storage_dir_label': 'Ana Depolama Dizini',
        'admin_render.storage_path_placeholder': 'Örn: D:\\WimmichData',
        'admin_render.tunnel_token_label': 'Cloudflare Zero Trust Tünel Tokeni (Kendi Domaininiz İçin)',
        'admin_render.tunnel_token_placeholder': 'Örn: eyJhIjoi...',
        'admin_render.tunnel_token_hint': 'Kendi domaininizi yönlendirmek için Zero Trust panelindeki Token değerini girin. Boş bırakırsanız geçici tünel açılır.',
        'admin_render.custom_domain_label': 'Özel Domain Adınız (Token ile birlikte kullanılır)',
        'admin_render.custom_domain_placeholder': 'Örn: fotograflarim.example.com',
        'admin_render.custom_domain_hint': 'Zero Trust panelinde bu tüneli bir domaine bağladıysanız, o domaini buraya yazın ki panel size gerçek bağlantı adresini gösterebilsin.',
        'admin_render.storage_limit_label': 'Sunucu Toplam Depolama Sınırı (MB - Sınırsız için 0)',
        'admin_render.tunnel_autostart_label': 'Sunucu açılırken tüneli otomatik başlat',
        'admin_render.save_settings_btn': 'Ayarları Kaydet',
        'admin_render.db_location_hint': 'Veri tabanı güvenliği için veritabanı dosyası her zaman sabit olarak {path} konumunda saklanır.',
        'admin_render.remote_access_heading': 'Uzaktan Erişim (Cloudflare Tunnel)',
        'admin_render.backup_heading': 'Yedekleme',
        'admin_render.backup_dir_label': 'Yedekleme Klasörü (tercihen ayrı bir disk)',
        'admin_render.backup_dir_placeholder': 'Örn: E:\\WimmichYedek',
        'admin_render.backup_dir_hint': 'Disk şu an takılı olmasa da bu yolu kaydedebilirsiniz - sadece yedekleme gerçekten çalışırken kontrol edilir.',
        'admin_render.backup_interval_label': 'Otomatik Yedekleme Aralığı (saat)',
        'admin_render.backup_enabled_label': 'Otomatik yedeklemeyi etkinleştir',
        'admin_render.backup_now_btn': 'Şimdi Yedekle',
        'admin_render.backup_now_title': 'Veritabanını ve henüz yedeklenmemiş fotoğraf/videoları hemen yedekler',
        'admin_render.folder_import_heading': 'Klasör Aktarımı',
        'admin_render.folder_import_desc': "Bilgisayarınızdaki eski fotoğraf arşivlerini Wimmich'e aktarın.",
        'admin_render.browse_path_placeholder': 'Klasör yolu girin veya aşağıdan seçin...',
        'admin_render.go_btn': 'Git',
        'admin_render.scan_btn': 'Tara',
        'admin_render.import_copy_label': 'Dosyaları kopyala (taşı)',
        'admin_render.import_recursive_label': 'Alt klasörleri dahil et',
        'admin_render.ml_status_heading': 'ML Durumu',
        'admin_render.status_active': 'Aktif',
        'admin_render.status_active_opencv': 'Aktif (OpenCV)',
        'admin_render.status_unavailable': 'Yok',
        'admin_render.badge_clip_search': 'CLIP Arama: {status}',
        'admin_render.badge_face_detection': 'Yüz Algılama: {status}',
        'admin_render.badge_person_clustering': 'Kişi Eşleştirme: {status}',
        'admin_render.badge_ffmpeg': 'FFmpeg: {status}',
        'admin_render.badge_geocoding': 'Konum Etiketleme: {status}',
        'admin_render.person_clustering_hint': 'Kişi eşleştirme için <code>face_recognition</code> kütüphanesinin kurulu olması gerekir; olmadan yüzler tespit edilir ama kişilere gruplanmaz.',
        'admin_render.background_jobs_heading': 'Arka Plan İşleri',
        'admin_render.jobs_pending_badge': '{count} Bekliyor',
        'admin_render.jobs_running_badge': '{count} Çalışıyor',
        'admin_render.jobs_failed_badge': '{count} Başarısız',
        'admin_render.job_clip_btn': 'CLIP İndexle',
        'admin_render.job_face_btn': 'Yüz Tanıma',
        'admin_render.job_thumbnail_btn': 'Thumbnail',
        'admin_render.job_geocode_btn': 'Konum Etiketle',
        'admin_render.job_transcode_btn': 'Video Dönüştür',
        'admin_render.job_recluster_btn': 'Yüzleri Yeniden Kümele',
        'admin_render.job_recluster_title': 'İsimsiz kişi gruplarını dağıtıp yüzleri güncel eşikle yeniden kümeler; isim verdiğiniz kişiler korunur',
        'admin_render.job_categorize_btn': 'Otomatik Kategorile',
        'admin_render.job_categorize_title': "CLIP embedding'i olan fotoğrafları ekran görüntüsü/belge/doğa/evcil hayvan gibi kategorilere otomatik ayırır",
        'admin_render.cancel_all_jobs_btn': 'Tüm İşlemleri İptal Et',
        'admin_render.cancel_all_jobs_title': 'Bekleyen/çalışan tüm işlemleri iptal eder - takılan veya istenmeyen bir işlem sizi engelliyorsa kullanın',
        'admin_render.recent_jobs_label': 'Son İşler',
        'admin_render.auto_updates_label': 'Otomatik güncellenir',
        'admin_render.no_backup_run_yet': 'Henüz bir yedekleme çalıştırılmadı.',
        'admin_render.backup_failed_status': 'Son deneme başarısız oldu ({when}): {error}',
        'admin_render.unknown_error': 'Bilinmeyen hata',
        'admin_render.backup_success_status': 'Son başarılı yedekleme: {when}',
        'admin_render.server_control_heading': 'Sunucu Kontrolü',
        'admin_render.shutdown_server_btn': 'Sunucuyu Kapat',
        'admin_render.shutdown_server_hint': 'Arka plan işlerini ve tüneli düzgünce durdurur, GPU/CPU belleğini boşaltır, sonra kapatır — bir iş çalışırken bu pencereyi kapatmaya güvenli bir alternatif.',
        'admin_render.confirm_shutdown': 'Sunucu şimdi kapatılsın mı? Çalışan bir arka plan işi varsa önce o durdurulacak.',
        'admin_render.shutting_down_message': 'Kapatılıyor — bellek boşaltılıyor ve sunucu durduruluyor...',
    },
    fr: {
        'admin_render.stat_photos': 'Photos',
        'admin_render.stat_videos': 'Vidéos',
        'admin_render.stat_total_size': 'Taille totale',
        'admin_render.stat_people': 'Personnes',
        'admin_render.stat_albums': 'Albums',
        'admin_render.stat_users': 'Utilisateurs',
        'admin_render.storage_settings_heading': 'Paramètres système et de stockage',
        'admin_render.main_storage_dir_label': 'Répertoire de stockage principal',
        'admin_render.storage_path_placeholder': 'ex. D:\\WimmichData',
        'admin_render.tunnel_token_label': 'Jeton de tunnel Cloudflare Zero Trust (pour votre propre domaine)',
        'admin_render.tunnel_token_placeholder': 'ex. eyJhIjoi...',
        'admin_render.tunnel_token_hint': "Saisissez la valeur du jeton depuis le panneau Zero Trust pour router votre propre domaine. Si ce champ est laissé vide, un tunnel temporaire sera ouvert.",
        'admin_render.custom_domain_label': 'Votre nom de domaine personnalisé (utilisé avec le jeton)',
        'admin_render.custom_domain_placeholder': 'ex. mesphotos.example.com',
        'admin_render.custom_domain_hint': "Si vous avez relié ce tunnel à un domaine dans le panneau Zero Trust, indiquez ce domaine ici afin que le panneau puisse vous montrer la véritable adresse de connexion.",
        'admin_render.storage_limit_label': 'Limite de stockage totale du serveur (Mo - 0 pour illimité)',
        'admin_render.tunnel_autostart_label': 'Démarrer automatiquement le tunnel au démarrage du serveur',
        'admin_render.save_settings_btn': 'Enregistrer les paramètres',
        'admin_render.db_location_hint': "Pour des raisons de sécurité, le fichier de base de données est toujours stocké à l'emplacement fixe {path}.",
        'admin_render.remote_access_heading': 'Accès à distance (tunnel Cloudflare)',
        'admin_render.backup_heading': 'Sauvegarde',
        'admin_render.backup_dir_label': 'Dossier de sauvegarde (de préférence un disque séparé)',
        'admin_render.backup_dir_placeholder': 'ex. E:\\WimmichSauvegarde',
        'admin_render.backup_dir_hint': "Vous pouvez enregistrer ce chemin même si le disque n'est pas actuellement connecté - il n'est vérifié que lorsqu'une sauvegarde s'exécute réellement.",
        'admin_render.backup_interval_label': 'Intervalle de sauvegarde automatique (heures)',
        'admin_render.backup_enabled_label': 'Activer la sauvegarde automatique',
        'admin_render.backup_now_btn': 'Sauvegarder maintenant',
        'admin_render.backup_now_title': 'Sauvegarde immédiatement la base de données ainsi que les photos/vidéos pas encore sauvegardées.',
        'admin_render.folder_import_heading': 'Importation de dossier',
        'admin_render.folder_import_desc': 'Importez vos anciennes archives photo depuis votre ordinateur vers Wimmich.',
        'admin_render.browse_path_placeholder': 'Saisissez un chemin de dossier ou choisissez-en un ci-dessous...',
        'admin_render.go_btn': 'Aller',
        'admin_render.scan_btn': 'Analyser',
        'admin_render.import_copy_label': 'Copier les fichiers (déplacer)',
        'admin_render.import_recursive_label': 'Inclure les sous-dossiers',
        'admin_render.ml_status_heading': 'État du ML',
        'admin_render.status_active': 'Actif',
        'admin_render.status_active_opencv': 'Actif (OpenCV)',
        'admin_render.status_unavailable': 'Indisponible',
        'admin_render.badge_clip_search': 'Recherche CLIP : {status}',
        'admin_render.badge_face_detection': 'Détection de visages : {status}',
        'admin_render.badge_person_clustering': 'Correspondance des personnes : {status}',
        'admin_render.badge_ffmpeg': 'FFmpeg : {status}',
        'admin_render.badge_geocoding': 'Étiquetage de localisation : {status}',
        'admin_render.person_clustering_hint': "La correspondance des personnes nécessite l'installation de la bibliothèque <code>face_recognition</code> ; sans elle, les visages sont détectés mais non regroupés en personnes.",
        'admin_render.background_jobs_heading': 'Tâches en arrière-plan',
        'admin_render.jobs_pending_badge': '{count} en attente',
        'admin_render.jobs_running_badge': '{count} en cours',
        'admin_render.jobs_failed_badge': '{count} échouée(s)',
        'admin_render.job_clip_btn': 'Indexer CLIP',
        'admin_render.job_face_btn': 'Reconnaissance faciale',
        'admin_render.job_thumbnail_btn': 'Vignettes',
        'admin_render.job_geocode_btn': 'Étiqueter les lieux',
        'admin_render.job_transcode_btn': 'Convertir les vidéos',
        'admin_render.job_recluster_btn': 'Regrouper les visages',
        'admin_render.job_recluster_title': "Dissout les groupes de personnes sans nom et regroupe à nouveau les visages selon le seuil actuel ; les personnes que vous avez nommées sont conservées.",
        'admin_render.job_categorize_btn': 'Catégoriser automatiquement',
        'admin_render.job_categorize_title': "Trie automatiquement les photos disposant d'un embedding CLIP en catégories telles que capture d'écran/document/nature/animal.",
        'admin_render.cancel_all_jobs_btn': 'Annuler toutes les tâches',
        'admin_render.cancel_all_jobs_title': 'Annule toutes les tâches en attente/en cours - utilisez ceci si une tâche bloquée ou indésirable vous gêne.',
        'admin_render.recent_jobs_label': 'Tâches récentes',
        'admin_render.auto_updates_label': 'Mise à jour automatique',
        'admin_render.no_backup_run_yet': "Aucune sauvegarde n'a encore été effectuée.",
        'admin_render.backup_failed_status': 'La dernière tentative a échoué ({when}) : {error}',
        'admin_render.unknown_error': 'Erreur inconnue',
        'admin_render.backup_success_status': 'Dernière sauvegarde réussie : {when}',
        'admin_render.server_control_heading': 'Contrôle du serveur',
        'admin_render.shutdown_server_btn': 'Arrêter le serveur',
        'admin_render.shutdown_server_hint': "Arrête proprement les tâches en arrière-plan et le tunnel, libère la mémoire GPU/CPU, puis quitte - l'alternative sûre à la fermeture de cette fenêtre pendant qu'une tâche est en cours.",
        'admin_render.confirm_shutdown': "Arrêter le serveur maintenant ? Toute tâche en arrière-plan en cours sera d'abord arrêtée.",
        'admin_render.shutting_down_message': 'Arrêt en cours - libération de la mémoire et arrêt du serveur...',
    },
    de: {
        'admin_render.stat_photos': 'Fotos',
        'admin_render.stat_videos': 'Videos',
        'admin_render.stat_total_size': 'Gesamtgröße',
        'admin_render.stat_people': 'Personen',
        'admin_render.stat_albums': 'Alben',
        'admin_render.stat_users': 'Benutzer',
        'admin_render.storage_settings_heading': 'System- und Speichereinstellungen',
        'admin_render.main_storage_dir_label': 'Hauptspeicherverzeichnis',
        'admin_render.storage_path_placeholder': 'z.B. D:\\WimmichData',
        'admin_render.tunnel_token_label': 'Cloudflare Zero Trust Tunnel-Token (für Ihre eigene Domain)',
        'admin_render.tunnel_token_placeholder': 'z.B. eyJhIjoi...',
        'admin_render.tunnel_token_hint': 'Geben Sie den Token-Wert aus dem Zero-Trust-Panel ein, um Ihre eigene Domain weiterzuleiten. Wenn Sie dieses Feld leer lassen, wird ein temporärer Tunnel geöffnet.',
        'admin_render.custom_domain_label': 'Ihr benutzerdefinierter Domainname (wird zusammen mit dem Token verwendet)',
        'admin_render.custom_domain_placeholder': 'z.B. meinefotos.example.com',
        'admin_render.custom_domain_hint': 'Wenn Sie diesen Tunnel im Zero-Trust-Panel mit einer Domain verbunden haben, geben Sie diese Domain hier ein, damit das Panel Ihnen die tatsächliche Verbindungsadresse anzeigen kann.',
        'admin_render.storage_limit_label': 'Gesamtes Speicherlimit des Servers (MB - 0 für unbegrenzt)',
        'admin_render.tunnel_autostart_label': 'Tunnel beim Serverstart automatisch starten',
        'admin_render.save_settings_btn': 'Einstellungen speichern',
        'admin_render.db_location_hint': 'Aus Gründen der Datenbanksicherheit wird die Datenbankdatei immer am festen Speicherort {path} gespeichert.',
        'admin_render.remote_access_heading': 'Fernzugriff (Cloudflare-Tunnel)',
        'admin_render.backup_heading': 'Sicherung',
        'admin_render.backup_dir_label': 'Sicherungsordner (vorzugsweise ein separates Laufwerk)',
        'admin_render.backup_dir_placeholder': 'z.B. E:\\WimmichSicherung',
        'admin_render.backup_dir_hint': 'Sie können diesen Pfad auch speichern, wenn das Laufwerk derzeit nicht angeschlossen ist - er wird erst überprüft, wenn tatsächlich eine Sicherung ausgeführt wird.',
        'admin_render.backup_interval_label': 'Intervall für automatische Sicherung (Stunden)',
        'admin_render.backup_enabled_label': 'Automatische Sicherung aktivieren',
        'admin_render.backup_now_btn': 'Jetzt sichern',
        'admin_render.backup_now_title': 'Sichert sofort die Datenbank sowie alle noch nicht gesicherten Fotos/Videos.',
        'admin_render.folder_import_heading': 'Ordnerimport',
        'admin_render.folder_import_desc': 'Importieren Sie Ihre alten Fotoarchive von Ihrem Computer in Wimmich.',
        'admin_render.browse_path_placeholder': 'Geben Sie einen Ordnerpfad ein oder wählen Sie unten einen aus...',
        'admin_render.go_btn': 'Los',
        'admin_render.scan_btn': 'Scannen',
        'admin_render.import_copy_label': 'Dateien kopieren (verschieben)',
        'admin_render.import_recursive_label': 'Unterordner einschließen',
        'admin_render.ml_status_heading': 'ML-Status',
        'admin_render.status_active': 'Aktiv',
        'admin_render.status_active_opencv': 'Aktiv (OpenCV)',
        'admin_render.status_unavailable': 'Nicht verfügbar',
        'admin_render.badge_clip_search': 'CLIP-Suche: {status}',
        'admin_render.badge_face_detection': 'Gesichtserkennung: {status}',
        'admin_render.badge_person_clustering': 'Personenzuordnung: {status}',
        'admin_render.badge_ffmpeg': 'FFmpeg: {status}',
        'admin_render.badge_geocoding': 'Standort-Kennzeichnung: {status}',
        'admin_render.person_clustering_hint': 'Für die Personenzuordnung muss die Bibliothek <code>face_recognition</code> installiert sein; ohne sie werden Gesichter erkannt, aber nicht zu Personen gruppiert.',
        'admin_render.background_jobs_heading': 'Hintergrundaufgaben',
        'admin_render.jobs_pending_badge': '{count} ausstehend',
        'admin_render.jobs_running_badge': '{count} laufend',
        'admin_render.jobs_failed_badge': '{count} fehlgeschlagen',
        'admin_render.job_clip_btn': 'CLIP indizieren',
        'admin_render.job_face_btn': 'Gesichtserkennung',
        'admin_render.job_thumbnail_btn': 'Miniaturansichten',
        'admin_render.job_geocode_btn': 'Standorte kennzeichnen',
        'admin_render.job_transcode_btn': 'Video konvertieren',
        'admin_render.job_recluster_btn': 'Gesichter neu gruppieren',
        'admin_render.job_recluster_title': "Löst unbenannte Personengruppen auf und gruppiert Gesichter mit dem aktuellen Schwellenwert neu; von Ihnen benannte Personen bleiben erhalten.",
        'admin_render.job_categorize_btn': 'Automatisch kategorisieren',
        'admin_render.job_categorize_title': 'Sortiert Fotos mit einem CLIP-Embedding automatisch in Kategorien wie Screenshot/Dokument/Natur/Haustier.',
        'admin_render.cancel_all_jobs_btn': 'Alle Aufgaben abbrechen',
        'admin_render.cancel_all_jobs_title': 'Bricht alle ausstehenden/laufenden Aufgaben ab - verwenden Sie dies, wenn eine feststeckende oder unerwünschte Aufgabe Sie blockiert.',
        'admin_render.recent_jobs_label': 'Letzte Aufgaben',
        'admin_render.auto_updates_label': 'Aktualisiert automatisch',
        'admin_render.no_backup_run_yet': 'Es wurde noch keine Sicherung durchgeführt.',
        'admin_render.backup_failed_status': 'Letzter Versuch fehlgeschlagen ({when}): {error}',
        'admin_render.unknown_error': 'Unbekannter Fehler',
        'admin_render.backup_success_status': 'Letzte erfolgreiche Sicherung: {when}',
        'admin_render.server_control_heading': 'Serversteuerung',
        'admin_render.shutdown_server_btn': 'Server herunterfahren',
        'admin_render.shutdown_server_hint': 'Stoppt Hintergrundaufgaben und den Tunnel sauber, gibt GPU-/CPU-Speicher frei und beendet dann - die sichere Alternative zum Schließen dieses Fensters, während eine Aufgabe läuft.',
        'admin_render.confirm_shutdown': 'Server jetzt herunterfahren? Eine laufende Hintergrundaufgabe wird zuerst gestoppt.',
        'admin_render.shutting_down_message': 'Wird heruntergefahren - Speicher wird freigegeben und der Server gestoppt...',
    },
});

async function renderAdmin() {
    const pc = $('page-content');
    pc.innerHTML = '<div class="skeleton" style="height:400px;border-radius:12px"></div>';

    try {
        const [stats, users, tunnelStatus, storageConfig, backupSettings] = await Promise.all([
            API.getAdminStats(),
            API.getAdminUsers(),
            API.getTunnelStatus().catch(() => ({ status: 'error', available: false })),
            API.getStorageConfig().catch(() => ({ data_dir: '', db_dir: '' })),
            API.getBackupSettings().catch(() => ({ backup_dir: '', interval_hours: 24, enabled: false, last_backup_at: null, last_backup_status: null, last_backup_error: null })),
        ]);

        pc.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card"><div class="stat-card-label">${t('admin_render.stat_photos')}</div><div class="stat-card-value">${stats.photos}</div></div>
                <div class="stat-card"><div class="stat-card-label">${t('admin_render.stat_videos')}</div><div class="stat-card-value">${stats.videos}</div></div>
                <div class="stat-card"><div class="stat-card-label">${t('admin_render.stat_total_size')}</div><div class="stat-card-value">${formatSize(stats.total_size)}</div></div>
                <div class="stat-card"><div class="stat-card-label">${t('admin_render.stat_people')}</div><div class="stat-card-value">${stats.people}</div></div>
                <div class="stat-card"><div class="stat-card-label">${t('admin_render.stat_albums')}</div><div class="stat-card-value">${stats.albums}</div></div>
                <div class="stat-card"><div class="stat-card-label">${t('admin_render.stat_users')}</div><div class="stat-card-value">${stats.users}</div></div>
            </div>

            <div class="admin-row">
                <div class="admin-section">
                    <h3>📁 ${t('admin_render.storage_settings_heading')}</h3>
                    <div id="storage-panel" class="admin-panel-box">
                        <div>
                            <label class="admin-field-label">${t('admin_render.main_storage_dir_label')}</label>
                            <div style="display:flex;gap:8px;align-items:center">
                                <input type="text" id="storage-path-input" value="${escHtml(storageConfig.data_dir)}" placeholder="${t('admin_render.storage_path_placeholder')}" style="flex:1">
                            </div>
                        </div>
                        <div>
                            <label class="admin-field-label">${t('admin_render.tunnel_token_label')}</label>
                            <div style="display:flex;gap:8px;align-items:center">
                                <input type="password" id="storage-token-input" value="${escHtml(storageConfig.tunnel_token || '')}" placeholder="${t('admin_render.tunnel_token_placeholder')}" style="flex:1">
                            </div>
                            <p class="text-muted admin-field-hint">${t('admin_render.tunnel_token_hint')}</p>
                        </div>
                        <div>
                            <label class="admin-field-label">${t('admin_render.custom_domain_label')}</label>
                            <div style="display:flex;gap:8px;align-items:center">
                                <input type="text" id="storage-domain-input" value="${escHtml(storageConfig.tunnel_custom_domain || '')}" placeholder="${t('admin_render.custom_domain_placeholder')}" style="flex:1">
                            </div>
                            <p class="text-muted admin-field-hint">${t('admin_render.custom_domain_hint')}</p>
                        </div>
                        <div>
                            <label class="admin-field-label">${t('admin_render.storage_limit_label')}</label>
                            <input type="number" id="storage-limit-input" value="${storageConfig.total_storage_limit_mb || 0}" min="0" style="width:100%">
                        </div>
                        <div style="display:flex;align-items:center;gap:8px">
                            <input type="checkbox" id="storage-autostart-input" ${storageConfig.auto_start_tunnel ? 'checked' : ''} style="width:auto;margin:0">
                            <label for="storage-autostart-input" class="admin-checkbox-label">${t('admin_render.tunnel_autostart_label')}</label>
                        </div>
                        <div><button class="btn btn-primary" onclick="saveStorageConfig()">${t('admin_render.save_settings_btn')}</button></div>
                        <p class="text-muted admin-field-hint admin-field-hint--bordered">
                            ${t('admin_render.db_location_hint', { path: `<code>${escHtml(storageConfig.db_dir)}</code>` })}
                        </p>
                    </div>
                </div>

                <div class="admin-section">
                    <h3>🌐 ${t('admin_render.remote_access_heading')}</h3>
                    <div id="tunnel-panel" class="admin-panel-box">${renderTunnelPanel(tunnelStatus)}</div>
                </div>
            </div>

            <div class="admin-section">
                <h3>💾 ${t('admin_render.backup_heading')}</h3>
                <div class="admin-panel-box">
                    <div>
                        <label class="admin-field-label">${t('admin_render.backup_dir_label')}</label>
                        <input type="text" id="backup-dir-input" value="${escHtml(backupSettings.backup_dir || '')}" placeholder="${t('admin_render.backup_dir_placeholder')}" style="width:100%">
                        <p class="text-muted admin-field-hint">${t('admin_render.backup_dir_hint')}</p>
                    </div>
                    <div style="display:flex;gap:16px;align-items:flex-end;flex-wrap:wrap">
                        <div>
                            <label class="admin-field-label">${t('admin_render.backup_interval_label')}</label>
                            <input type="number" id="backup-interval-input" value="${backupSettings.interval_hours || 24}" min="1" style="width:120px">
                        </div>
                        <div style="display:flex;align-items:center;gap:8px">
                            <input type="checkbox" id="backup-enabled-input" ${backupSettings.enabled ? 'checked' : ''} style="width:auto;margin:0">
                            <label for="backup-enabled-input" class="admin-checkbox-label">${t('admin_render.backup_enabled_label')}</label>
                        </div>
                    </div>
                    <div style="display:flex;gap:8px;flex-wrap:wrap">
                        <button class="btn btn-primary" onclick="saveBackupConfig()">${t('admin_render.save_settings_btn')}</button>
                        <button class="btn btn-secondary" onclick="runAdminJob('BACKUP')" title="${t('admin_render.backup_now_title')}">💾 ${t('admin_render.backup_now_btn')}</button>
                    </div>
                    <p class="text-muted admin-field-hint admin-field-hint--bordered">${renderBackupStatusLine(backupSettings)}</p>
                </div>
            </div>

            <div class="admin-row">
                <div class="admin-section">
                    <h3>📂 ${t('admin_render.folder_import_heading')}</h3>
                    <p class="admin-section-desc">${t('admin_render.folder_import_desc')}</p>
                    <div id="import-panel" class="admin-panel-box">
                        <div id="file-browser">
                            <div style="display:flex;gap:8px;margin-bottom:12px;align-items:center">
                                <input type="text" id="browse-path" placeholder="${t('admin_render.browse_path_placeholder')}" style="flex:1">
                                <button class="btn btn-secondary btn-sm" onclick="browsePath($('browse-path').value)">${t('admin_render.go_btn')}</button>
                                <button class="btn btn-primary btn-sm" onclick="scanImportPath()">${t('admin_render.scan_btn')}</button>
                            </div>
                            <div style="display:flex;gap:8px;margin-bottom:12px">
                                <label class="checkbox-label"><input type="checkbox" id="import-copy" checked> ${t('admin_render.import_copy_label')}</label>
                                <label class="checkbox-label" style="margin-left:16px"><input type="checkbox" id="import-recursive" checked> ${t('admin_render.import_recursive_label')}</label>
                            </div>
                            <div id="browse-results" style="max-height:350px;overflow-y:auto;border:1px solid var(--border-color);border-radius:8px"></div>
                            <div id="scan-results" style="margin-top:12px"></div>
                        </div>
                    </div>
                </div>

                <div class="admin-section">
                    <h3>🤖 ${t('admin_render.ml_status_heading')}</h3>
                    <div class="admin-panel-box">
                        <div style="display:flex;gap:12px;flex-wrap:wrap">
                            <span class="badge ${stats.ml.clip_available ? 'badge-success' : 'badge-warning'}">${t('admin_render.badge_clip_search', { status: stats.ml.clip_available ? t('admin_render.status_active') : t('admin_render.status_unavailable') })}</span>
                            <span class="badge ${stats.ml.face_detection_available ? 'badge-success' : 'badge-warning'}">${t('admin_render.badge_face_detection', { status: stats.ml.face_detection_available ? t('admin_render.status_active_opencv') : t('admin_render.status_unavailable') })}</span>
                            <span class="badge ${stats.ml.person_clustering_available ? 'badge-success' : 'badge-warning'}">${t('admin_render.badge_person_clustering', { status: stats.ml.person_clustering_available ? t('admin_render.status_active') : t('admin_render.status_unavailable') })}</span>
                            <span class="badge ${stats.ffmpeg_available ? 'badge-success' : 'badge-warning'}">${t('admin_render.badge_ffmpeg', { status: stats.ffmpeg_available ? t('admin_render.status_active') : t('admin_render.status_unavailable') })}</span>
                            <span class="badge ${stats.ml.geocoding_available ? 'badge-success' : 'badge-warning'}">${t('admin_render.badge_geocoding', { status: stats.ml.geocoding_available ? t('admin_render.status_active') : t('admin_render.status_unavailable') })}</span>
                        </div>
                        ${!stats.ml.person_clustering_available ? `
                            <p class="text-muted admin-field-hint">${t('admin_render.person_clustering_hint')}</p>
                        ` : ''}
                    </div>
                </div>
            </div>

            <div class="admin-section">
                <h3>👥 ${t('admin_render.stat_users')}</h3>
                <div class="user-list">${renderUserList(users.users)}</div>
            </div>

            <div class="admin-section">
                <h3>⚙️ ${t('admin_render.background_jobs_heading')}</h3>
                <div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap">
                    <span class="badge ${stats.jobs.pending > 0 ? 'badge-warning' : 'badge-success'}">${t('admin_render.jobs_pending_badge', { count: stats.jobs.pending })}</span>
                    <span class="badge ${stats.jobs.running > 0 ? 'badge-admin' : 'badge-success'}">${t('admin_render.jobs_running_badge', { count: stats.jobs.running })}</span>
                    <span class="badge ${stats.jobs.failed > 0 ? 'badge-danger' : 'badge-success'}">${t('admin_render.jobs_failed_badge', { count: stats.jobs.failed })}</span>
                </div>
                <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">
                    <button class="btn btn-secondary btn-sm" onclick="runAdminJob('CLIP')">🧠 ${t('admin_render.job_clip_btn')}</button>
                    <button class="btn btn-secondary btn-sm" onclick="runAdminJob('FACE')">👤 ${t('admin_render.job_face_btn')}</button>
                    <button class="btn btn-secondary btn-sm" onclick="runAdminJob('THUMBNAIL')">🖼 ${t('admin_render.job_thumbnail_btn')}</button>
                    <button class="btn btn-secondary btn-sm" onclick="runAdminJob('GEOCODE')">📍 ${t('admin_render.job_geocode_btn')}</button>
                    <button class="btn btn-secondary btn-sm" onclick="runAdminJob('TRANSCODE')">🎬 ${t('admin_render.job_transcode_btn')}</button>
                    <button class="btn btn-secondary btn-sm" onclick="runAdminJob('RECLUSTER')" title="${t('admin_render.job_recluster_title')}">🔁 ${t('admin_render.job_recluster_btn')}</button>
                    <button class="btn btn-secondary btn-sm" onclick="runAdminJob('CATEGORIZE')" title="${t('admin_render.job_categorize_title')}">🗂 ${t('admin_render.job_categorize_btn')}</button>
                    <button class="btn btn-danger btn-sm" onclick="cancelAllAdminJobs()" title="${t('admin_render.cancel_all_jobs_title')}">🛑 ${t('admin_render.cancel_all_jobs_btn')}</button>
                </div>
                <div id="job-list-container" class="admin-panel-box" style="max-height:300px;overflow-y:auto">
                    <div style="font-size:13px;font-weight:600;margin-bottom:8px;color:var(--text-secondary);display:flex;justify-content:space-between;align-items:center">
                        <span>${t('admin_render.recent_jobs_label')}</span>
                        <span style="font-size:10px;font-weight:normal;opacity:0.6">${t('admin_render.auto_updates_label')}</span>
                    </div>
                    <div id="job-list-content">${t('common.loading')}</div>
                </div>
            </div>

            <div class="admin-section">
                <h3>🔌 ${t('admin_render.server_control_heading')}</h3>
                <div class="admin-panel-box">
                    <p class="text-muted admin-field-hint">${t('admin_render.shutdown_server_hint')}</p>
                    <button class="btn btn-danger btn-sm" onclick="shutdownServer()">🛑 ${t('admin_render.shutdown_server_btn')}</button>
                </div>
            </div>
        `;

        browsePath('');
        resumeImportProgressIfActive();

        pollAdminJobs();
        if (!adminPollInterval) {
            adminPollInterval = setInterval(pollAdminJobs, ADMIN_POLL_INTERVAL_MS);
        }

    } catch (e) { toast(e.message, 'error'); }
}

function renderBackupStatusLine(backupSettings) {
    if (!backupSettings.last_backup_at) {
        return t('admin_render.no_backup_run_yet');
    }
    const when = formatDate(backupSettings.last_backup_at);
    if (backupSettings.last_backup_status === 'failed') {
        return t('admin_render.backup_failed_status', { when, error: escHtml(backupSettings.last_backup_error || t('admin_render.unknown_error')) });
    }
    return t('admin_render.backup_success_status', { when });
}

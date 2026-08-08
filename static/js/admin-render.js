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
        'admin_render.storage_limit_label': 'Server Total Storage Limit',
        'admin_render.storage_limit_unlimited_hint': '0 means no limit.',
        'admin_render.storage_limit_equals': '= {size} ({mb} MB).',
        'admin_render.storage_limit_cap_hint': 'This drive can hold at most {max} for the library.',
        'admin_render.storage_limit_too_big': "That's more than this drive can hold - the most you can set is {max}.",
        'admin_render.tunnel_autostart_label': 'Automatically start the tunnel when the server starts',
        'admin_render.save_settings_btn': 'Save Settings',
        'admin_render.reset_defaults_btn': 'Reset to Defaults',
        'admin_render.confirm_reset_storage_settings': 'Reset the tunnel token, custom domain, auto-start, and storage limit to their defaults? The storage folder itself is left unchanged.',
        'admin_render.confirm_reset_backup_settings': 'Reset backup settings (destination, interval, enabled) to their defaults?',
        'admin_render.db_location_hint': 'For database security, the database file is always stored at the fixed location {path}.',
        'admin_render.lan_access_heading': 'Local Network Access',
        'admin_render.gpu_idle_heading': 'GPU Idle Unload',
        'admin_render.gpu_idle_info_hint': 'Frees the CLIP/face-recognition models from GPU (or system) memory after they sit idle for a while - the next search/upload just reloads them, with a real multi-second-to-a-minute delay. Never unloads while a CLIP or FACE job is actually running, no matter how long a single call takes.',
        'admin_render.gpu_idle_toggle_label': 'Unload idle models automatically',
        'admin_render.gpu_idle_minutes_label': 'Idle timeout (minutes)',
        'admin_render.gpu_idle_hint': 'Off by default - a real trade-off (reload delay) worth turning on if this GPU is shared with other work, or just to cut idle power draw.',
        'admin_render.gpu_idle_model_loaded': 'Loaded ({seconds}s idle)',
        'admin_render.gpu_idle_model_unloaded': 'Not loaded',
        'admin_render.gpu_idle_clip_label': 'CLIP:',
        'admin_render.gpu_idle_face_label': 'Face recognition:',
        'admin_render.gpu_idle_invalid_minutes': 'Enter a number of at least 1',
        'admin_render.gpu_idle_saved_toast': 'GPU idle-unload setting saved',
        'admin_render.memvid_heading': 'Memory Videos',
        'admin_render.memvid_info_hint': 'Auto-generated Ken Burns/crossfade-style slideshow videos built from "on this day" and weekly photo groups (see the Memories page). These settings apply to your own account.',
        'admin_render.memvid_enable_label': 'Automatically create memory videos',
        'admin_render.memvid_enable_hint': 'Runs in the background every few hours - one video per "on this day" year, plus a weekly summary.',
        'admin_render.memvid_style_label': 'Style',
        'admin_render.memvid_format_label': 'Format',
        'admin_render.memvid_show_date_label': 'Show the photo\'s date on each clip',
        'admin_render.memvid_saved_toast': 'Memory video settings saved',
        'admin_render.lan_access_info_hint': "Wimmich already listens for connections from any device on your home network, no setup needed - this just shows the address to type on your phone/tablet, and checks whether Windows Firewall is actually letting those connections through. Separate from Cloudflare Tunnel/Tailscale below, which are for access from OUTSIDE your home network.",
        'admin_render.lan_access_hint': 'From another device on the same Wi-Fi/network, open one of these addresses:',
        'admin_render.lan_access_toggle_label': 'Allow access from other devices on this network',
        'admin_render.lan_access_disabled_hint': "LAN access is off - other devices on this network (and this address on this device) can't reach Wimmich right now. Remote access via Cloudflare Tunnel/Tailscale still works.",
        'admin_render.lan_access_disable_confirm_safe': "You're viewing this over localhost, so this won't affect you - it only blocks other devices (or this one, if reached via its network IP instead). Continue?",
        'admin_render.lan_access_disable_confirm_risky': "You appear to be viewing this over the local network right now - turning this off will immediately cut YOU off too, along with any other device using this address. Continue?",
        'admin_render.lan_access_enabled_toast': 'Local network access enabled',
        'admin_render.lan_access_disabled_toast': 'Local network access disabled',
        'admin_render.lan_no_ip_found': 'Could not detect a local network address.',
        'admin_render.lan_firewall_ok': 'Firewall: allowed',
        'admin_render.lan_firewall_blocked': 'Firewall: blocked',
        'admin_render.lan_firewall_unknown': 'Firewall: could not check',
        'admin_render.lan_firewall_fix_hint': 'Other devices on your network likely can\'t reach Wimmich right now. Run this command in an elevated (Administrator) PowerShell window to allow it - Wimmich cannot change firewall settings on its own:',
        'admin_render.remote_access_heading': 'Remote Access (Cloudflare Tunnel)',
        'admin_render.remote_access_info_hint': 'Creates a public URL that forwards to this server, so you (or family/friends you share it with) can open your photos from outside your home network - no router configuration or open ports needed. Off by default; nothing is exposed until you start it here.',
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
        'admin_render.reference_roots_heading': 'Referenced Folders',
        'admin_render.reference_roots_desc': "Folders linked via \"Reference\" mode - their files stay on your drive, only indexed in Wimmich. Removing one only unlinks it, the original files are never touched.",
        'admin_render.reference_roots_empty': 'No referenced folders yet.',
        'admin_render.reference_roots_item_count': '{count} item(s)',
        'admin_render.reference_roots_remove_btn': 'Remove',
        'admin_render.reference_roots_removed_toast': '{count} item(s) unlinked - original files were not touched.',
        'admin_render.browse_path_placeholder': 'Enter a folder path or choose one below...',
        'admin_render.go_btn': 'Go',
        'admin_render.scan_btn': 'Scan',
        'admin_render.import_copy_label': 'Copy files (move)',
        'admin_render.import_recursive_label': 'Include subfolders',
        'admin_render.import_dest_path_label': 'Import Destination Folder',
        'admin_render.import_dest_path_placeholder': "Destination folder (optional - leave blank for the app's default storage)",
        'admin_render.import_dest_path_hint': 'Only used in Copy mode - lets copies land on a different drive/folder than the app default. Ignored in Reference mode.',
        'admin_render.server_status_heading': 'Server Status',
        'admin_dash.click_hint': 'Click a figure for details',
        'admin_dash.about_heading': 'About',
        'admin_dash.version_label': 'Current version',
        'admin_dash.version_unknown': 'unknown',
        'admin_dash.source_git': 'git install',
        'admin_dash.source_zip': 'zip install',
        'admin_dash.jobs_label': 'Jobs',
        'admin_dash.jobs_running': 'running',
        'admin_dash.jobs_pending': 'queued',
        'admin_dash.jobs_completed': 'done',
        'admin_dash.detail_library': 'Library',
        'admin_dash.detail_content': 'Content',
        'admin_dash.total_assets': 'Total items',
        'admin_dash.disk_free': 'Free disk space',
        'admin_dash.quota': 'Storage limit',
        'admin_dash.shared_links': 'Share links',
        'admin_dash.jobs_failed': 'Failed',
        'admin_dash.goto_people': 'Open People page',
        'admin_dash.close': 'Close',
        'admin_dash.no_limit': 'No limit set',
        'admin_render.ping_checking': 'Checking...',
        'admin_render.ping_label': 'Ping: {ms}ms',
        'admin_render.ping_offline': 'Unreachable',
        'admin_render.badge_disk_free': 'Disk: {free} / {total} GB free',
        'admin_render.badge_quota_usage': 'Quota: {used} / {limit}',
        'admin_render.storage_warning_hint': 'Storage space is running low - see the Storage tab to adjust the limit or free up space.',
        'admin_render.ml_status_heading': 'ML Status',
        'admin_render.status_active': 'Active',
        'admin_render.status_active_opencv': 'Active (OpenCV)',
        'admin_render.status_unavailable': 'Unavailable',
        'admin_render.badge_clip_search': 'CLIP Search: {status}',
        'admin_render.badge_face_detection': 'Face Detection: {status}',
        'admin_render.badge_person_clustering': 'Person Matching: {status}',
        'admin_render.badge_ffmpeg': 'FFmpeg: {status}',
        'admin_render.badge_geocoding': 'Location Tagging: {status}',
        'admin_render.badge_ocr': 'OCR Text Search: {status}',
        'admin_render.ocr_unavailable_hint': 'Tesseract OCR is not installed - screenshot/document text search is disabled. Install it from https://github.com/UB-Mannheim/tesseract/releases and restart the server.',
        'admin_render.person_clustering_hint': 'Person matching requires the <code>face_recognition</code> library to be installed; without it, faces are detected but not grouped into people.',
        'admin_render.background_jobs_heading': 'Background Jobs',
        'admin_render.jobs_pending_badge': '{count} Pending',
        'admin_render.jobs_running_badge': '{count} Running',
        'admin_render.jobs_completed_badge': '{count} Completed',
        'admin_render.jobs_failed_badge': '{count} Failed',
        'admin_render.jobs_session_stats_hint': 'Completed/Failed counts reset every time the server restarts; Pending reflects the actual queue and persists.',
        'admin_render.job_clip_btn': 'CLIP Index',
        'admin_render.job_face_btn': 'Face Recognition',
        'admin_render.job_thumbnail_btn': 'Thumbnails',
        'admin_render.job_geocode_btn': 'Tag Locations',
        'admin_render.job_transcode_btn': 'Convert Video',
        'admin_render.job_recluster_btn': 'Re-cluster Faces',
        'admin_render.job_recluster_title': "Disbands unnamed person groups and re-clusters faces using the current threshold; people you've named are preserved.",
        'admin_render.job_categorize_btn': 'Auto-Categorize',
        'admin_render.job_categorize_title': 'Automatically sorts photos that have a CLIP embedding into categories like screenshot/document/nature/pet.',
        'admin_render.job_repair_btn': 'Repair Broken Files',
        'admin_render.job_repair_title': 'Checks every reference-linked and imported-copy photo/video for a missing or broken file - re-fixes it from the original source if still available, or moves it to trash if the source is gone too. Runs automatically after every scan/import as well.',
        'admin_render.job_ocr_btn': 'Extract Text (OCR)',
        'admin_render.job_ocr_title': 'Extracts visible text from screenshot and document photos so it can be found by search - requires Tesseract OCR to be installed.',
        'admin_render.cancel_all_jobs_btn': 'Cancel All Jobs',
        'admin_render.cancel_all_jobs_title': 'Cancels all pending/running jobs - use this if a stuck or unwanted job is blocking you.',
        'admin_render.recent_jobs_label': 'Recent Jobs',
        'admin_render.auto_updates_label': 'Auto-updates',
        'admin_render.no_backup_run_yet': 'No backup has been run yet.',
        'admin_render.backup_failed_status': 'Last attempt failed ({when}): {error}',
        'admin_render.unknown_error': 'Unknown error',
        'admin_render.backup_success_status': 'Last successful backup: {when}',
        'admin_render.server_control_heading': 'Server Control',
        'admin_render.restart_server_btn': 'Restart Server',
        'admin_render.restart_server_hint': 'Cleanly stops background jobs and the tunnel, then relaunches the process - useful after a settings change, or if something seems stuck, without pulling any code update.',
        'admin_render.confirm_restart': 'Restart the server now? Any running background job will be stopped first.',
        'admin_render.restarting_message': 'Restarting - the server will be back in a few seconds...',
        'admin_render.restart_overlay_message': 'Restarting the server...',
        'admin_render.restart_overlay_ready': 'Back online - reloading...',
        'admin_render.restart_overlay_timeout': "Taking longer than expected - check the server console, or refresh this page in a moment.",
        'admin_render.shutdown_server_btn': 'Shut Down Server',
        'admin_render.shutdown_server_hint': 'Cleanly stops background jobs and the tunnel, frees GPU/CPU memory, then exits - the safe alternative to closing this window while a job is running.',
        'admin_render.confirm_shutdown': 'Shut down the server now? Any running background job will be stopped first.',
        'admin_render.shutting_down_message': 'Shutting down - freeing memory and stopping the server...',
        'admin_render.shutdown_overlay_message': 'Shutting down the server...',
        'admin_render.shutdown_overlay_done': 'The server has been shut down. You can close this window.',
        'admin_render.audit_log_heading': 'Audit Log',
        'admin_render.audit_log_empty': 'No admin actions recorded yet.',
        'admin_render.load_more_btn': 'Load More',
        'admin_render.updates_heading': 'Updates',
        'admin_render.check_update_btn': 'Check for Updates',
        'admin_render.checking_updates_msg': 'Checking for updates...',
        'admin_render.up_to_date_msg': "You're up to date ({commit})",
        'admin_render.update_available_msg': 'Update available - {count} new commit(s) ({current} → {latest})',
        'admin_render.apply_update_btn': 'Update Now',
        'admin_render.confirm_apply_update': 'Pull the latest code, reinstall dependencies, and restart the server now?',
        'admin_render.applying_update_msg': 'Updating - this can take a moment, the server will restart automatically...',
        'admin_render.git_pull_only_hint': 'Works on any install - a git clone pulls the latest commit, a zip download fetches and applies a fresh archive.',
        'admin_render.tab_general': 'General',
        'admin_render.tab_storage_system': 'Storage & System',
        'admin_render.tab_users': 'Users',
        'admin_render.tab_storage_backup': 'Storage & Backup',
        'admin_render.tab_import': 'Import',
        'admin_render.tab_network_system': 'Network',
        'admin_render.tab_performance': 'Performance',
        'admin_render.tab_system': 'System',
        'admin_render.perf_heading': 'Job CPU usage',
        'admin_render.perf_info_hint': 'Background jobs share this machine with the web server. Without a limit a transcode takes every core and the whole app crawls until it finishes. Lower priority lets jobs use idle cores while instantly giving CPU back when a request arrives.',
        'admin_render.perf_profile_label': 'Profile',
        'admin_render.perf_recommend_prefix': 'Recommended for this machine',
        'admin_render.perf_apply_recommend_btn': 'Apply recommendation',
        'admin_render.perf_low_priority_label': 'Run jobs at lower priority',
        'admin_render.perf_threads_label': 'Max cores per job',
        'admin_render.perf_cores_suffix': 'of {total} cores',
        'admin_render.perf_saved_toast': 'Performance settings saved',
        'admin_render.perf_running_note': 'Applies to the next job step - a job already running keeps the settings it started with.',
        'admin_render.jobs_status_card_heading': 'Jobs',
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
        'admin_render.storage_limit_label': 'Sunucu Toplam Depolama Sınırı',
        'admin_render.storage_limit_unlimited_hint': '0 girerseniz sınır olmaz.',
        'admin_render.storage_limit_equals': '= {size} ({mb} MB).',
        'admin_render.storage_limit_cap_hint': 'Bu disk kitaplık için en fazla {max} tutabilir.',
        'admin_render.storage_limit_too_big': 'Bu, diskin tutabileceğinden fazla - en çok {max} girebilirsiniz.',
        'admin_render.tunnel_autostart_label': 'Sunucu açılırken tüneli otomatik başlat',
        'admin_render.save_settings_btn': 'Ayarları Kaydet',
        'admin_render.reset_defaults_btn': 'Varsayılanlara Sıfırla',
        'admin_render.confirm_reset_storage_settings': 'Tünel anahtarı, özel domain, otomatik başlatma ve depolama sınırı varsayılanlarına sıfırlansın mı? Depolama klasörünün kendisi değişmeden kalır.',
        'admin_render.confirm_reset_backup_settings': 'Yedekleme ayarları (hedef, aralık, etkin) varsayılanlarına sıfırlansın mı?',
        'admin_render.db_location_hint': 'Veri tabanı güvenliği için veritabanı dosyası her zaman sabit olarak {path} konumunda saklanır.',
        'admin_render.lan_access_heading': 'Yerel Ağ Erişimi',
        'admin_render.gpu_idle_heading': 'GPU Boşta Boşaltma',
        'admin_render.gpu_idle_info_hint': 'CLIP/yüz tanıma modellerini bir süre boşta kaldıktan sonra GPU (veya sistem) belleğinden serbest bırakır - bir sonraki arama/yükleme onları tekrar yükler, birkaç saniyeden bir dakikaya kadar gerçek bir gecikmeyle. Bir CLIP veya FACE işi gerçekten çalışıyorsa, tek bir çağrı ne kadar sürerse sürsün asla boşaltma yapılmaz.',
        'admin_render.gpu_idle_toggle_label': 'Boşta kalan modelleri otomatik boşalt',
        'admin_render.gpu_idle_minutes_label': 'Boşta kalma süresi (dakika)',
        'admin_render.gpu_idle_hint': 'Varsayılan olarak kapalı - bu GPU başka işlerle paylaşılıyorsa veya sadece boşta güç tüketimini azaltmak için açmaya değer gerçek bir ödünleşim (yeniden yükleme gecikmesi).',
        'admin_render.gpu_idle_model_loaded': 'Yüklü ({seconds}sn boşta)',
        'admin_render.gpu_idle_model_unloaded': 'Yüklü değil',
        'admin_render.gpu_idle_clip_label': 'CLIP:',
        'admin_render.gpu_idle_face_label': 'Yüz tanıma:',
        'admin_render.gpu_idle_invalid_minutes': 'En az 1 olan bir sayı girin',
        'admin_render.gpu_idle_saved_toast': 'GPU boşta boşaltma ayarı kaydedildi',
        'admin_render.memvid_heading': 'Anı Videoları',
        'admin_render.memvid_info_hint': '"Bugün" ve haftalık fotoğraf gruplarından otomatik oluşturulan Ken Burns/geçişli slayt videoları (bkz. Anılar sayfası). Bu ayarlar kendi hesabınız için geçerlidir.',
        'admin_render.memvid_enable_label': 'Anı videolarını otomatik oluştur',
        'admin_render.memvid_enable_hint': 'Birkaç saatte bir arka planda çalışır - her "bugün" grubu için ayrı bir video, artı haftalık bir özet.',
        'admin_render.memvid_style_label': 'Stil',
        'admin_render.memvid_format_label': 'Format',
        'admin_render.memvid_show_date_label': 'Her klipte fotoğrafın tarihini göster',
        'admin_render.memvid_saved_toast': 'Anı video ayarları kaydedildi',
        'admin_render.lan_access_info_hint': 'Wimmich, ev ağınızdaki herhangi bir cihazdan gelen bağlantıları zaten dinliyor, ekstra kurulum gerekmez - bu bölüm sadece telefonunuza/tabletinize yazacağınız adresi gösterir ve Windows Güvenlik Duvarı\'nın bu bağlantılara gerçekten izin verip vermediğini kontrol eder. Aşağıdaki Cloudflare Tunnel/Tailscale\'den farklıdır - onlar ev ağınızın DIŞINDAN erişim içindir.',
        'admin_render.lan_access_hint': 'Aynı Wi-Fi/ağdaki başka bir cihazdan şu adreslerden birini açın:',
        'admin_render.lan_access_toggle_label': 'Bu ağdaki diğer cihazlardan erişime izin ver',
        'admin_render.lan_access_disabled_hint': 'Yerel ağ erişimi kapalı - bu ağdaki diğer cihazlar (ve bu cihazdaki bu adres) şu anda Wimmich\'e ulaşamaz. Cloudflare Tunnel/Tailscale ile uzaktan erişim yine de çalışmaya devam eder.',
        'admin_render.lan_access_disable_confirm_safe': 'Şu anda localhost üzerinden görüntülüyorsunuz, bu yüzden sizi etkilemez - sadece başka cihazları (veya bu cihazı ağ IP\'siyle erişilirse) engeller. Devam edilsin mi?',
        'admin_render.lan_access_disable_confirm_risky': 'Şu anda yerel ağ üzerinden görüntülüyor gibisiniz - bunu kapatmak SİZİ de bu adresi kullanan diğer her cihazla birlikte hemen kesecek. Devam edilsin mi?',
        'admin_render.lan_access_enabled_toast': 'Yerel ağ erişimi etkinleştirildi',
        'admin_render.lan_access_disabled_toast': 'Yerel ağ erişimi devre dışı bırakıldı',
        'admin_render.lan_no_ip_found': 'Bir yerel ağ adresi tespit edilemedi.',
        'admin_render.lan_firewall_ok': 'Güvenlik Duvarı: izinli',
        'admin_render.lan_firewall_blocked': 'Güvenlik Duvarı: engelli',
        'admin_render.lan_firewall_unknown': 'Güvenlik Duvarı: kontrol edilemedi',
        'admin_render.lan_firewall_fix_hint': 'Ağınızdaki diğer cihazlar şu anda muhtemelen Wimmich\'e erişemiyor. İzin vermek için yönetici olarak açılmış bir PowerShell penceresinde şu komutu çalıştırın - Wimmich güvenlik duvarı ayarlarını kendi başına değiştiremez:',
        'admin_render.remote_access_heading': 'Uzaktan Erişim (Cloudflare Tunnel)',
        'admin_render.remote_access_info_hint': 'Bu sunucuya yönlendiren herkese açık bir URL oluşturur - böylece siz (veya paylaştığınız aile/arkadaşlarınız) fotoğraflarınızı ev ağınızın dışından açabilirsiniz - router ayarı veya port açmaya gerek yok. Varsayılan olarak kapalıdır; burada başlatana kadar hiçbir şey dışarı açılmaz.',
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
        'admin_render.reference_roots_heading': 'Referanslı Klasörler',
        'admin_render.reference_roots_desc': '"Referans" modunda bağlanan klasörler - dosyalar diskinizde kalır, sadece Wimmich içinde indekslenir. Birini kaldırmak sadece bağlantıyı keser, orijinal dosyalara dokunmaz.',
        'admin_render.reference_roots_empty': 'Henüz referanslı klasör yok.',
        'admin_render.reference_roots_item_count': '{count} öğe',
        'admin_render.reference_roots_remove_btn': 'Kaldır',
        'admin_render.reference_roots_removed_toast': '{count} öğenin bağlantısı kaldırıldı - orijinal dosyalara dokunulmadı.',
        'admin_render.browse_path_placeholder': 'Klasör yolu girin veya aşağıdan seçin...',
        'admin_render.go_btn': 'Git',
        'admin_render.scan_btn': 'Tara',
        'admin_render.import_copy_label': 'Dosyaları kopyala (taşı)',
        'admin_render.import_recursive_label': 'Alt klasörleri dahil et',
        'admin_render.import_dest_path_label': 'İçe Aktarma Hedef Klasörü',
        'admin_render.import_dest_path_placeholder': 'Hedef klasör (opsiyonel - boş bırakılırsa uygulamanın varsayılan depolama alanı kullanılır)',
        'admin_render.import_dest_path_hint': 'Sadece Kopyalama modunda kullanılır - kopyaların uygulamanın varsayılanından farklı bir disk/klasöre gitmesini sağlar. Referans modunda göz ardı edilir.',
        'admin_render.server_status_heading': 'Sunucu Durumu',
        'admin_dash.click_hint': 'Ayrıntı için bir değere tıklayın',
        'admin_dash.about_heading': 'Hakkında',
        'admin_dash.version_label': 'Mevcut sürüm',
        'admin_dash.version_unknown': 'bilinmiyor',
        'admin_dash.source_git': 'git kurulumu',
        'admin_dash.source_zip': 'zip kurulumu',
        'admin_dash.jobs_label': 'İşler',
        'admin_dash.jobs_running': 'çalışan',
        'admin_dash.jobs_pending': 'bekleyen',
        'admin_dash.jobs_completed': 'tamamlanan',
        'admin_dash.detail_library': 'Kitaplık',
        'admin_dash.detail_content': 'İçerik',
        'admin_dash.total_assets': 'Toplam öğe',
        'admin_dash.disk_free': 'Boş disk alanı',
        'admin_dash.quota': 'Depolama sınırı',
        'admin_dash.shared_links': 'Paylaşım bağlantıları',
        'admin_dash.jobs_failed': 'Başarısız',
        'admin_dash.goto_people': 'Kişiler sayfasını aç',
        'admin_dash.close': 'Kapat',
        'admin_dash.no_limit': 'Sınır belirlenmemiş',
        'admin_render.ping_checking': 'Kontrol ediliyor...',
        'admin_render.ping_label': 'Ping: {ms}ms',
        'admin_render.ping_offline': 'Erişilemiyor',
        'admin_render.badge_disk_free': 'Disk: {free} / {total} GB boş',
        'admin_render.badge_quota_usage': 'Kota: {used} / {limit}',
        'admin_render.storage_warning_hint': 'Depolama alanı azalıyor - limiti ayarlamak veya yer açmak için Depolama sekmesine bakın.',
        'admin_render.ml_status_heading': 'ML Durumu',
        'admin_render.status_active': 'Aktif',
        'admin_render.status_active_opencv': 'Aktif (OpenCV)',
        'admin_render.status_unavailable': 'Yok',
        'admin_render.badge_clip_search': 'CLIP Arama: {status}',
        'admin_render.badge_face_detection': 'Yüz Algılama: {status}',
        'admin_render.badge_person_clustering': 'Kişi Eşleştirme: {status}',
        'admin_render.badge_ffmpeg': 'FFmpeg: {status}',
        'admin_render.badge_geocoding': 'Konum Etiketleme: {status}',
        'admin_render.badge_ocr': 'OCR Metin Arama: {status}',
        'admin_render.ocr_unavailable_hint': 'Tesseract OCR yüklü değil - ekran görüntüsü/belge metin araması devre dışı. https://github.com/UB-Mannheim/tesseract/releases adresinden yükleyip sunucuyu yeniden başlatın.',
        'admin_render.person_clustering_hint': 'Kişi eşleştirme için <code>face_recognition</code> kütüphanesinin kurulu olması gerekir; olmadan yüzler tespit edilir ama kişilere gruplanmaz.',
        'admin_render.background_jobs_heading': 'Arka Plan İşleri',
        'admin_render.jobs_pending_badge': '{count} Bekliyor',
        'admin_render.jobs_running_badge': '{count} Çalışıyor',
        'admin_render.jobs_completed_badge': '{count} Tamamlandı',
        'admin_render.jobs_failed_badge': '{count} Başarısız',
        'admin_render.jobs_session_stats_hint': 'Tamamlanan/Başarısız sayıları sunucu her yeniden başladığında sıfırlanır; Bekleyen sayısı gerçek kuyruğu yansıtır ve kalıcıdır.',
        'admin_render.job_clip_btn': 'CLIP İndexle',
        'admin_render.job_face_btn': 'Yüz Tanıma',
        'admin_render.job_thumbnail_btn': 'Thumbnail',
        'admin_render.job_geocode_btn': 'Konum Etiketle',
        'admin_render.job_transcode_btn': 'Video Dönüştür',
        'admin_render.job_recluster_btn': 'Yüzleri Yeniden Kümele',
        'admin_render.job_recluster_title': 'İsimsiz kişi gruplarını dağıtıp yüzleri güncel eşikle yeniden kümeler; isim verdiğiniz kişiler korunur',
        'admin_render.job_categorize_btn': 'Otomatik Kategorile',
        'admin_render.job_categorize_title': "CLIP embedding'i olan fotoğrafları ekran görüntüsü/belge/doğa/evcil hayvan gibi kategorilere otomatik ayırır",
        'admin_render.job_repair_btn': 'Bozuk Dosyaları Onar',
        'admin_render.job_repair_title': 'Referans bağlantılı ve içe aktarılan (kopya) her fotoğraf/videoyu eksik veya bozuk dosya için kontrol eder - kaynağı hâlâ mevcutsa yeniden düzeltir, kaynak da yoksa çöp kutusuna taşır. Her tarama/içe aktarma sonrası otomatik olarak da çalışır.',
        'admin_render.job_ocr_btn': 'Metin Çıkar (OCR)',
        'admin_render.job_ocr_title': 'Ekran görüntüsü ve belge fotoğraflarındaki görünür metni çıkarır, böylece arama ile bulunabilir - Tesseract OCR yüklü olmasını gerektirir.',
        'admin_render.cancel_all_jobs_btn': 'Tüm İşlemleri İptal Et',
        'admin_render.cancel_all_jobs_title': 'Bekleyen/çalışan tüm işlemleri iptal eder - takılan veya istenmeyen bir işlem sizi engelliyorsa kullanın',
        'admin_render.recent_jobs_label': 'Son İşler',
        'admin_render.auto_updates_label': 'Otomatik güncellenir',
        'admin_render.no_backup_run_yet': 'Henüz bir yedekleme çalıştırılmadı.',
        'admin_render.backup_failed_status': 'Son deneme başarısız oldu ({when}): {error}',
        'admin_render.unknown_error': 'Bilinmeyen hata',
        'admin_render.backup_success_status': 'Son başarılı yedekleme: {when}',
        'admin_render.server_control_heading': 'Sunucu Kontrolü',
        'admin_render.restart_server_btn': 'Sunucuyu Yeniden Başlat',
        'admin_render.restart_server_hint': 'Arka plan işlerini ve tüneli düzgünce durdurur, sonra süreci yeniden başlatır — bir ayar değişikliğinden sonra ya da bir şey takılmış gibi göründüğünde, kod güncellemesi çekmeden kullanışlıdır.',
        'admin_render.confirm_restart': 'Sunucu şimdi yeniden başlatılsın mı? Çalışan bir arka plan işi varsa önce o durdurulacak.',
        'admin_render.restarting_message': 'Yeniden başlatılıyor — sunucu birkaç saniye içinde geri dönecek...',
        'admin_render.restart_overlay_message': 'Sunucu yeniden başlatılıyor...',
        'admin_render.restart_overlay_ready': 'Tekrar çevrimiçi — sayfa yenileniyor...',
        'admin_render.restart_overlay_timeout': 'Beklenenden uzun sürüyor — sunucu konsolunu kontrol edin veya birazdan bu sayfayı yenileyin.',
        'admin_render.shutdown_server_btn': 'Sunucuyu Kapat',
        'admin_render.shutdown_server_hint': 'Arka plan işlerini ve tüneli düzgünce durdurur, GPU/CPU belleğini boşaltır, sonra kapatır — bir iş çalışırken bu pencereyi kapatmaya güvenli bir alternatif.',
        'admin_render.confirm_shutdown': 'Sunucu şimdi kapatılsın mı? Çalışan bir arka plan işi varsa önce o durdurulacak.',
        'admin_render.shutting_down_message': 'Kapatılıyor — bellek boşaltılıyor ve sunucu durduruluyor...',
        'admin_render.shutdown_overlay_message': 'Sunucu kapatılıyor...',
        'admin_render.shutdown_overlay_done': 'Sunucu kapatıldı. Bu pencereyi kapatabilirsiniz.',
        'admin_render.audit_log_heading': 'İşlem Günlüğü',
        'admin_render.audit_log_empty': 'Henüz kaydedilmiş bir yönetici işlemi yok.',
        'admin_render.load_more_btn': 'Daha Fazla Yükle',
        'admin_render.updates_heading': 'Güncellemeler',
        'admin_render.check_update_btn': 'Güncellemeleri Kontrol Et',
        'admin_render.checking_updates_msg': 'Güncellemeler kontrol ediliyor...',
        'admin_render.up_to_date_msg': 'Güncelsiniz ({commit})',
        'admin_render.update_available_msg': 'Güncelleme mevcut — {count} yeni commit ({current} → {latest})',
        'admin_render.apply_update_btn': 'Şimdi Güncelle',
        'admin_render.confirm_apply_update': 'En son kod çekilsin, bağımlılıklar yeniden kurulsun ve sunucu yeniden başlatılsın mı?',
        'admin_render.applying_update_msg': 'Güncelleniyor — bu biraz sürebilir, sunucu otomatik olarak yeniden başlayacak...',
        'admin_render.git_pull_only_hint': 'Her kurulumda çalışır - git clone kurulumu en son commit\'i çeker, zip ile indirilen kurulum ise güncel bir arşiv indirip uygular.',
        'admin_render.tab_general': 'Genel',
        'admin_render.tab_storage_system': 'Depolama & Sistem',
        'admin_render.tab_users': 'Kullanıcılar',
        'admin_render.tab_storage_backup': 'Depolama & Yedekleme',
        'admin_render.tab_import': 'İçe Aktarma',
        'admin_render.tab_network_system': 'Ağ',
        'admin_render.tab_performance': 'Performans',
        'admin_render.tab_system': 'Sistem',
        'admin_render.perf_heading': 'İşlerin CPU kullanımı',
        'admin_render.perf_info_hint': 'Arka plan işleri bu makineyi web sunucusuyla paylaşıyor. Sınır olmadan bir video dönüştürme tüm çekirdekleri alıyor ve bitene kadar uygulama sürünüyor. Düşük öncelik, işlerin boş çekirdekleri kullanmasına izin verirken bir istek geldiği anda CPU gücünü hemen ona geri veriyor.',
        'admin_render.perf_profile_label': 'Profil',
        'admin_render.perf_recommend_prefix': 'Bu makine için önerilen',
        'admin_render.perf_apply_recommend_btn': 'Öneriyi uygula',
        'admin_render.perf_low_priority_label': 'İşleri düşük öncelikle çalıştır',
        'admin_render.perf_threads_label': 'İş başına en fazla çekirdek',
        'admin_render.perf_cores_suffix': '/ {total} çekirdek',
        'admin_render.perf_saved_toast': 'Performans ayarları kaydedildi',
        'admin_render.perf_running_note': 'Bir sonraki iş adımında geçerli olur - halihazırda çalışan bir iş başladığı ayarlarla devam eder.',
        'admin_render.jobs_status_card_heading': 'İşler',
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
        'admin_render.storage_limit_label': "Limite de stockage totale du serveur",
        'admin_render.storage_limit_unlimited_hint': "0 signifie aucune limite.",
        'admin_render.storage_limit_equals': "= {size} ({mb} Mo).",
        'admin_render.storage_limit_cap_hint': "Ce disque peut contenir au plus {max} pour la bibliothèque.",
        'admin_render.storage_limit_too_big': "C'est plus que ce que ce disque peut contenir - le maximum est {max}.",
        'admin_render.tunnel_autostart_label': 'Démarrer automatiquement le tunnel au démarrage du serveur',
        'admin_render.save_settings_btn': 'Enregistrer les paramètres',
        'admin_render.reset_defaults_btn': 'Réinitialiser aux valeurs par défaut',
        'admin_render.confirm_reset_storage_settings': 'Réinitialiser le jeton de tunnel, le domaine personnalisé, le démarrage automatique et la limite de stockage à leurs valeurs par défaut ? Le dossier de stockage lui-même reste inchangé.',
        'admin_render.confirm_reset_backup_settings': 'Réinitialiser les paramètres de sauvegarde (destination, intervalle, activé) à leurs valeurs par défaut ?',
        'admin_render.db_location_hint': "Pour des raisons de sécurité, le fichier de base de données est toujours stocké à l'emplacement fixe {path}.",
        'admin_render.lan_access_heading': 'Accès au réseau local',
        'admin_render.gpu_idle_heading': 'Déchargement GPU inactif',
        'admin_render.gpu_idle_info_hint': "Libère les modèles CLIP/reconnaissance faciale de la mémoire GPU (ou système) après une période d'inactivité - la prochaine recherche/importation les recharge, avec un délai réel de quelques secondes à une minute. Ne décharge jamais pendant qu'une tâche CLIP ou FACE est réellement en cours, quelle que soit la durée d'un seul appel.",
        'admin_render.gpu_idle_toggle_label': 'Décharger automatiquement les modèles inactifs',
        'admin_render.gpu_idle_minutes_label': "Délai d'inactivité (minutes)",
        'admin_render.gpu_idle_hint': "Désactivé par défaut - un vrai compromis (délai de rechargement) qui vaut la peine d'être activé si ce GPU est partagé avec d'autres tâches, ou simplement pour réduire la consommation d'énergie à l'inactivité.",
        'admin_render.gpu_idle_model_loaded': 'Chargé (inactif depuis {seconds}s)',
        'admin_render.gpu_idle_model_unloaded': 'Non chargé',
        'admin_render.gpu_idle_clip_label': 'CLIP :',
        'admin_render.gpu_idle_face_label': 'Reconnaissance faciale :',
        'admin_render.gpu_idle_invalid_minutes': 'Entrez un nombre d\'au moins 1',
        'admin_render.gpu_idle_saved_toast': 'Paramètre de déchargement GPU enregistré',
        'admin_render.memvid_heading': 'Vidéos souvenirs',
        'admin_render.memvid_info_hint': 'Vidéos diaporama Ken Burns/fondu générées automatiquement à partir des groupes de photos "ce jour-là" et hebdomadaires (voir la page Souvenirs). Ces réglages s\'appliquent à votre propre compte.',
        'admin_render.memvid_enable_label': 'Créer automatiquement des vidéos souvenirs',
        'admin_render.memvid_enable_hint': "S'exécute en arrière-plan toutes les quelques heures - une vidéo par année \"ce jour-là\", plus un résumé hebdomadaire.",
        'admin_render.memvid_style_label': 'Style',
        'admin_render.memvid_format_label': 'Format',
        'admin_render.memvid_show_date_label': 'Afficher la date de la photo sur chaque clip',
        'admin_render.memvid_saved_toast': 'Paramètres des vidéos souvenirs enregistrés',
        'admin_render.lan_access_info_hint': "Wimmich écoute déjà les connexions de tout appareil sur votre réseau domestique, sans configuration nécessaire - ceci affiche simplement l'adresse à saisir sur votre téléphone/tablette, et vérifie si le pare-feu Windows laisse réellement passer ces connexions. Distinct du tunnel Cloudflare/Tailscale ci-dessous, qui sont pour l'accès DEPUIS l'extérieur de votre réseau domestique.",
        'admin_render.lan_access_hint': 'Depuis un autre appareil sur le même Wi-Fi/réseau, ouvrez une de ces adresses :',
        'admin_render.lan_access_toggle_label': "Autoriser l'accès depuis d'autres appareils sur ce réseau",
        'admin_render.lan_access_disabled_hint': "L'accès réseau local est désactivé - les autres appareils de ce réseau (et cette adresse sur cet appareil) ne peuvent pas atteindre Wimmich pour le moment. L'accès à distance via Cloudflare Tunnel/Tailscale fonctionne toujours.",
        'admin_render.lan_access_disable_confirm_safe': "Vous consultez ceci via localhost, donc cela ne vous affectera pas - cela bloque uniquement les autres appareils (ou celui-ci, si atteint via son IP réseau). Continuer ?",
        'admin_render.lan_access_disable_confirm_risky': "Vous semblez consulter ceci via le réseau local actuellement - désactiver ceci vous coupera VOUS aussi immédiatement, ainsi que tout autre appareil utilisant cette adresse. Continuer ?",
        'admin_render.lan_access_enabled_toast': 'Accès au réseau local activé',
        'admin_render.lan_access_disabled_toast': 'Accès au réseau local désactivé',
        'admin_render.lan_no_ip_found': "Impossible de détecter une adresse réseau locale.",
        'admin_render.lan_firewall_ok': 'Pare-feu : autorisé',
        'admin_render.lan_firewall_blocked': 'Pare-feu : bloqué',
        'admin_render.lan_firewall_unknown': 'Pare-feu : vérification impossible',
        'admin_render.lan_firewall_fix_hint': "Les autres appareils de votre réseau ne peuvent probablement pas atteindre Wimmich actuellement. Exécutez cette commande dans une fenêtre PowerShell élevée (Administrateur) pour l'autoriser - Wimmich ne peut pas modifier les paramètres du pare-feu par lui-même :",
        'admin_render.remote_access_heading': 'Accès à distance (tunnel Cloudflare)',
        'admin_render.remote_access_info_hint': "Crée une URL publique qui redirige vers ce serveur, pour que vous (ou la famille/des amis avec qui vous la partagez) puissiez ouvrir vos photos depuis l'extérieur de votre réseau domestique - aucune configuration du routeur ni de port à ouvrir. Désactivé par défaut ; rien n'est exposé tant que vous ne le démarrez pas ici.",
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
        'admin_render.reference_roots_heading': 'Dossiers référencés',
        'admin_render.reference_roots_desc': "Dossiers liés en mode « Référence » - leurs fichiers restent sur votre disque, seulement indexés dans Wimmich. Supprimer un lien ne fait que le dissocier, les fichiers originaux ne sont jamais touchés.",
        'admin_render.reference_roots_empty': 'Aucun dossier référencé pour le moment.',
        'admin_render.reference_roots_item_count': '{count} élément(s)',
        'admin_render.reference_roots_remove_btn': 'Retirer',
        'admin_render.reference_roots_removed_toast': '{count} élément(s) dissocié(s) - les fichiers originaux n\'ont pas été touchés.',
        'admin_render.browse_path_placeholder': 'Saisissez un chemin de dossier ou choisissez-en un ci-dessous...',
        'admin_render.go_btn': 'Aller',
        'admin_render.scan_btn': 'Analyser',
        'admin_render.import_copy_label': 'Copier les fichiers (déplacer)',
        'admin_render.import_recursive_label': 'Inclure les sous-dossiers',
        'admin_render.import_dest_path_label': "Dossier de destination de l'import",
        'admin_render.import_dest_path_placeholder': "Dossier de destination (facultatif - laissez vide pour le stockage par défaut de l'application)",
        'admin_render.import_dest_path_hint': "Utilisé uniquement en mode Copie - permet aux copies d'atterrir sur un autre disque/dossier que celui par défaut. Ignoré en mode Référence.",
        'admin_render.server_status_heading': 'État du serveur',
        'admin_dash.click_hint': "Cliquez sur une valeur pour les détails",
        'admin_dash.about_heading': "À propos",
        'admin_dash.version_label': "Version actuelle",
        'admin_dash.version_unknown': "inconnue",
        'admin_dash.source_git': "installation git",
        'admin_dash.source_zip': "installation zip",
        'admin_dash.jobs_label': "Tâches",
        'admin_dash.jobs_running': "en cours",
        'admin_dash.jobs_pending': "en attente",
        'admin_dash.jobs_completed': "terminées",
        'admin_dash.detail_library': "Bibliothèque",
        'admin_dash.detail_content': "Contenu",
        'admin_dash.total_assets': "Éléments au total",
        'admin_dash.disk_free': "Espace disque libre",
        'admin_dash.quota': "Limite de stockage",
        'admin_dash.shared_links': "Liens de partage",
        'admin_dash.jobs_failed': "Échouées",
        'admin_dash.goto_people': "Ouvrir la page Personnes",
        'admin_dash.close': "Fermer",
        'admin_dash.no_limit': "Aucune limite définie",
        'admin_render.ping_checking': 'Vérification...',
        'admin_render.ping_label': 'Ping : {ms}ms',
        'admin_render.ping_offline': 'Injoignable',
        'admin_render.badge_disk_free': 'Disque : {free} / {total} Go libres',
        'admin_render.badge_quota_usage': 'Quota : {used} / {limit}',
        'admin_render.storage_warning_hint': "L'espace de stockage se réduit - consultez l'onglet Stockage pour ajuster la limite ou libérer de l'espace.",
        'admin_render.ml_status_heading': 'État du ML',
        'admin_render.status_active': 'Actif',
        'admin_render.status_active_opencv': 'Actif (OpenCV)',
        'admin_render.status_unavailable': 'Indisponible',
        'admin_render.badge_clip_search': 'Recherche CLIP : {status}',
        'admin_render.badge_face_detection': 'Détection de visages : {status}',
        'admin_render.badge_person_clustering': 'Correspondance des personnes : {status}',
        'admin_render.badge_ffmpeg': 'FFmpeg : {status}',
        'admin_render.badge_geocoding': 'Étiquetage de localisation : {status}',
        'admin_render.badge_ocr': 'Recherche de texte OCR : {status}',
        'admin_render.ocr_unavailable_hint': "Tesseract OCR n'est pas installé - la recherche de texte dans les captures d'écran/documents est désactivée. Installez-le depuis https://github.com/UB-Mannheim/tesseract/releases et redémarrez le serveur.",
        'admin_render.person_clustering_hint': "La correspondance des personnes nécessite l'installation de la bibliothèque <code>face_recognition</code> ; sans elle, les visages sont détectés mais non regroupés en personnes.",
        'admin_render.background_jobs_heading': 'Tâches en arrière-plan',
        'admin_render.jobs_pending_badge': '{count} en attente',
        'admin_render.jobs_running_badge': '{count} en cours',
        'admin_render.jobs_completed_badge': '{count} terminée(s)',
        'admin_render.jobs_failed_badge': '{count} échouée(s)',
        'admin_render.jobs_session_stats_hint': "Les compteurs Terminées/Échouées sont réinitialisés à chaque redémarrage du serveur ; En attente reflète la file réelle et persiste.",
        'admin_render.job_clip_btn': 'Indexer CLIP',
        'admin_render.job_face_btn': 'Reconnaissance faciale',
        'admin_render.job_thumbnail_btn': 'Vignettes',
        'admin_render.job_geocode_btn': 'Étiqueter les lieux',
        'admin_render.job_transcode_btn': 'Convertir les vidéos',
        'admin_render.job_recluster_btn': 'Regrouper les visages',
        'admin_render.job_recluster_title': "Dissout les groupes de personnes sans nom et regroupe à nouveau les visages selon le seuil actuel ; les personnes que vous avez nommées sont conservées.",
        'admin_render.job_categorize_btn': 'Catégoriser automatiquement',
        'admin_render.job_categorize_title': "Trie automatiquement les photos disposant d'un embedding CLIP en catégories telles que capture d'écran/document/nature/animal.",
        'admin_render.job_repair_btn': 'Réparer les fichiers cassés',
        'admin_render.job_repair_title': "Vérifie chaque photo/vidéo en référence ou importée (copie) pour un fichier manquant ou cassé - le répare depuis la source d'origine si elle est encore disponible, ou le déplace vers la corbeille si la source a aussi disparu. S'exécute aussi automatiquement après chaque scan/import.",
        'admin_render.job_ocr_btn': 'Extraire le texte (OCR)',
        'admin_render.job_ocr_title': "Extrait le texte visible des captures d'écran et des photos de documents pour qu'il soit trouvable par la recherche - nécessite que Tesseract OCR soit installé.",
        'admin_render.cancel_all_jobs_btn': 'Annuler toutes les tâches',
        'admin_render.cancel_all_jobs_title': 'Annule toutes les tâches en attente/en cours - utilisez ceci si une tâche bloquée ou indésirable vous gêne.',
        'admin_render.recent_jobs_label': 'Tâches récentes',
        'admin_render.auto_updates_label': 'Mise à jour automatique',
        'admin_render.no_backup_run_yet': "Aucune sauvegarde n'a encore été effectuée.",
        'admin_render.backup_failed_status': 'La dernière tentative a échoué ({when}) : {error}',
        'admin_render.unknown_error': 'Erreur inconnue',
        'admin_render.backup_success_status': 'Dernière sauvegarde réussie : {when}',
        'admin_render.server_control_heading': 'Contrôle du serveur',
        'admin_render.restart_server_btn': 'Redémarrer le serveur',
        'admin_render.restart_server_hint': "Arrête proprement les tâches en arrière-plan et le tunnel, puis relance le processus - utile après un changement de paramètre ou si quelque chose semble bloqué, sans récupérer de mise à jour du code.",
        'admin_render.confirm_restart': "Redémarrer le serveur maintenant ? Toute tâche en arrière-plan en cours sera d'abord arrêtée.",
        'admin_render.restarting_message': 'Redémarrage en cours - le serveur sera de retour dans quelques secondes...',
        'admin_render.restart_overlay_message': 'Redémarrage du serveur...',
        'admin_render.restart_overlay_ready': 'De retour en ligne - rechargement...',
        'admin_render.restart_overlay_timeout': "Cela prend plus de temps que prévu - vérifiez la console du serveur ou actualisez cette page dans un instant.",
        'admin_render.shutdown_server_btn': 'Arrêter le serveur',
        'admin_render.shutdown_server_hint': "Arrête proprement les tâches en arrière-plan et le tunnel, libère la mémoire GPU/CPU, puis quitte - l'alternative sûre à la fermeture de cette fenêtre pendant qu'une tâche est en cours.",
        'admin_render.confirm_shutdown': "Arrêter le serveur maintenant ? Toute tâche en arrière-plan en cours sera d'abord arrêtée.",
        'admin_render.shutting_down_message': 'Arrêt en cours - libération de la mémoire et arrêt du serveur...',
        'admin_render.shutdown_overlay_message': 'Arrêt du serveur...',
        'admin_render.shutdown_overlay_done': 'Le serveur a été arrêté. Vous pouvez fermer cette fenêtre.',
        'admin_render.audit_log_heading': "Journal d'audit",
        'admin_render.audit_log_empty': "Aucune action d'administration enregistrée pour le moment.",
        'admin_render.load_more_btn': 'Charger plus',
        'admin_render.updates_heading': 'Mises à jour',
        'admin_render.check_update_btn': 'Vérifier les mises à jour',
        'admin_render.checking_updates_msg': 'Vérification des mises à jour...',
        'admin_render.up_to_date_msg': 'Vous êtes à jour ({commit})',
        'admin_render.update_available_msg': 'Mise à jour disponible - {count} nouveau(x) commit(s) ({current} → {latest})',
        'admin_render.apply_update_btn': 'Mettre à jour maintenant',
        'admin_render.confirm_apply_update': 'Récupérer le dernier code, réinstaller les dépendances et redémarrer le serveur maintenant ?',
        'admin_render.applying_update_msg': 'Mise à jour en cours - cela peut prendre un moment, le serveur redémarrera automatiquement...',
        'admin_render.git_pull_only_hint': "Fonctionne avec toute installation - un git clone récupère le dernier commit, un téléchargement zip récupère et applique une archive à jour.",
        'admin_render.tab_general': 'Général',
        'admin_render.tab_storage_system': 'Stockage & Système',
        'admin_render.tab_users': 'Utilisateurs',
        'admin_render.tab_storage_backup': 'Stockage & Sauvegarde',
        'admin_render.tab_import': 'Importation',
        'admin_render.tab_network_system': 'Réseau',
        'admin_render.tab_performance': 'Performance',
        'admin_render.tab_system': 'Système',
        'admin_render.perf_heading': 'Utilisation CPU des tâches',
        "admin_render.perf_info_hint": "Les tâches de fond partagent cette machine avec le serveur web. Sans limite, un transcodage prend tous les cœurs et toute l'application rame jusqu'à la fin.",
        'admin_render.perf_profile_label': 'Profil',
        'admin_render.perf_recommend_prefix': 'Recommandé pour cette machine',
        'admin_render.perf_apply_recommend_btn': 'Appliquer la recommandation',
        'admin_render.perf_low_priority_label': 'Exécuter les tâches en priorité basse',
        'admin_render.perf_threads_label': 'Cœurs max par tâche',
        'admin_render.perf_cores_suffix': 'sur {total} cœurs',
        'admin_render.perf_saved_toast': 'Réglages de performance enregistrés',
        "admin_render.perf_running_note": "S'applique à la prochaine étape - une tâche en cours garde ses réglages de départ.",
        'admin_render.jobs_status_card_heading': 'Tâches',
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
        'admin_render.storage_limit_label': 'Gesamtes Speicherlimit des Servers',
        'admin_render.storage_limit_unlimited_hint': '0 bedeutet kein Limit.',
        'admin_render.storage_limit_equals': '= {size} ({mb} MB).',
        'admin_render.storage_limit_cap_hint': 'Dieses Laufwerk fasst höchstens {max} für die Bibliothek.',
        'admin_render.storage_limit_too_big': 'Das ist mehr, als dieses Laufwerk fassen kann - höchstens {max}.',
        'admin_render.tunnel_autostart_label': 'Tunnel beim Serverstart automatisch starten',
        'admin_render.save_settings_btn': 'Einstellungen speichern',
        'admin_render.reset_defaults_btn': 'Auf Standard zurücksetzen',
        'admin_render.confirm_reset_storage_settings': 'Tunnel-Token, benutzerdefinierte Domain, Autostart und Speicherlimit auf Standard zurücksetzen? Der Speicherordner selbst bleibt unverändert.',
        'admin_render.confirm_reset_backup_settings': 'Backup-Einstellungen (Ziel, Intervall, aktiviert) auf Standard zurücksetzen?',
        'admin_render.db_location_hint': 'Aus Gründen der Datenbanksicherheit wird die Datenbankdatei immer am festen Speicherort {path} gespeichert.',
        'admin_render.lan_access_heading': 'Zugriff im lokalen Netzwerk',
        'admin_render.lan_access_info_hint': 'Wimmich nimmt bereits Verbindungen von jedem Gerät in Ihrem Heimnetzwerk an, ohne dass eine Einrichtung nötig ist - dies zeigt nur die Adresse, die Sie auf Ihrem Handy/Tablet eingeben, und prüft, ob die Windows-Firewall diese Verbindungen tatsächlich durchlässt. Getrennt von Cloudflare Tunnel/Tailscale unten, die für den Zugriff von AUSSERHALB Ihres Heimnetzwerks sind.',
        'admin_render.lan_access_hint': 'Öffnen Sie von einem anderen Gerät im selben WLAN/Netzwerk eine dieser Adressen:',
        'admin_render.lan_access_toggle_label': 'Zugriff von anderen Geräten in diesem Netzwerk erlauben',
        'admin_render.lan_access_disabled_hint': 'Der Zugriff im lokalen Netzwerk ist deaktiviert - andere Geräte in diesem Netzwerk (und diese Adresse auf diesem Gerät) können Wimmich derzeit nicht erreichen. Der Fernzugriff über Cloudflare Tunnel/Tailscale funktioniert weiterhin.',
        'admin_render.lan_access_disable_confirm_safe': 'Sie betrachten dies über localhost, daher betrifft es Sie nicht - es blockiert nur andere Geräte (oder dieses, falls über seine Netzwerk-IP erreicht). Fortfahren?',
        'admin_render.lan_access_disable_confirm_risky': 'Sie scheinen dies gerade über das lokale Netzwerk zu betrachten - das Deaktivieren trennt sofort auch SIE, zusammen mit jedem anderen Gerät, das diese Adresse verwendet. Fortfahren?',
        'admin_render.lan_access_enabled_toast': 'Zugriff im lokalen Netzwerk aktiviert',
        'admin_render.lan_access_disabled_toast': 'Zugriff im lokalen Netzwerk deaktiviert',
        'admin_render.lan_no_ip_found': 'Es konnte keine lokale Netzwerkadresse erkannt werden.',
        'admin_render.lan_firewall_ok': 'Firewall: erlaubt',
        'admin_render.lan_firewall_blocked': 'Firewall: blockiert',
        'admin_render.lan_firewall_unknown': 'Firewall: konnte nicht geprüft werden',
        'admin_render.lan_firewall_fix_hint': 'Andere Geräte in Ihrem Netzwerk können Wimmich wahrscheinlich gerade nicht erreichen. Führen Sie diesen Befehl in einem PowerShell-Fenster mit erhöhten Rechten (Administrator) aus, um dies zu erlauben - Wimmich kann die Firewall-Einstellungen nicht selbst ändern:',
        'admin_render.remote_access_heading': 'Fernzugriff (Cloudflare-Tunnel)',
        'admin_render.remote_access_info_hint': 'Erstellt eine öffentliche URL, die auf diesen Server weiterleitet - so können Sie (oder Familie/Freunde, mit denen Sie sie teilen) Ihre Fotos von außerhalb Ihres Heimnetzwerks öffnen - keine Router-Konfiguration oder offene Ports nötig. Standardmäßig deaktiviert; nichts wird preisgegeben, bis Sie es hier starten.',
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
        'admin_render.reference_roots_heading': 'Referenzierte Ordner',
        'admin_render.reference_roots_desc': 'Über den Modus "Referenz" verknüpfte Ordner - ihre Dateien bleiben auf Ihrem Laufwerk, werden nur in Wimmich indiziert. Das Entfernen hebt nur die Verknüpfung auf, die Originaldateien werden nie angetastet.',
        'admin_render.reference_roots_empty': 'Noch keine referenzierten Ordner.',
        'admin_render.reference_roots_item_count': '{count} Element(e)',
        'admin_render.reference_roots_remove_btn': 'Entfernen',
        'admin_render.reference_roots_removed_toast': '{count} Element(e) getrennt - Originaldateien wurden nicht angetastet.',
        'admin_render.browse_path_placeholder': 'Geben Sie einen Ordnerpfad ein oder wählen Sie unten einen aus...',
        'admin_render.go_btn': 'Los',
        'admin_render.scan_btn': 'Scannen',
        'admin_render.import_copy_label': 'Dateien kopieren (verschieben)',
        'admin_render.import_recursive_label': 'Unterordner einschließen',
        'admin_render.import_dest_path_label': 'Import-Zielordner',
        'admin_render.import_dest_path_placeholder': 'Zielordner (optional - leer lassen für den Standardspeicher der App)',
        'admin_render.import_dest_path_hint': 'Nur im Kopiermodus verwendet - lässt Kopien auf einem anderen Laufwerk/Ordner als dem App-Standard landen. Im Referenzmodus ignoriert.',
        'admin_render.server_status_heading': 'Serverstatus',
        'admin_dash.click_hint': 'Für Details auf einen Wert klicken',
        'admin_dash.about_heading': 'Über',
        'admin_dash.version_label': 'Aktuelle Version',
        'admin_dash.version_unknown': 'unbekannt',
        'admin_dash.source_git': 'git-Installation',
        'admin_dash.source_zip': 'zip-Installation',
        'admin_dash.jobs_label': 'Aufgaben',
        'admin_dash.jobs_running': 'laufend',
        'admin_dash.jobs_pending': 'wartend',
        'admin_dash.jobs_completed': 'erledigt',
        'admin_dash.detail_library': 'Bibliothek',
        'admin_dash.detail_content': 'Inhalt',
        'admin_dash.total_assets': 'Elemente insgesamt',
        'admin_dash.disk_free': 'Freier Speicherplatz',
        'admin_dash.quota': 'Speicherlimit',
        'admin_dash.shared_links': 'Freigabelinks',
        'admin_dash.jobs_failed': 'Fehlgeschlagen',
        'admin_dash.goto_people': 'Personen-Seite öffnen',
        'admin_dash.close': 'Schließen',
        'admin_dash.no_limit': 'Kein Limit gesetzt',
        'admin_render.ping_checking': 'Wird geprüft...',
        'admin_render.ping_label': 'Ping: {ms}ms',
        'admin_render.ping_offline': 'Nicht erreichbar',
        'admin_render.badge_disk_free': 'Speicher: {free} / {total} GB frei',
        'admin_render.badge_quota_usage': 'Kontingent: {used} / {limit}',
        'admin_render.storage_warning_hint': 'Der Speicherplatz wird knapp - siehe den Tab Speicher, um das Limit anzupassen oder Platz freizugeben.',
        'admin_render.ml_status_heading': 'ML-Status',
        'admin_render.status_active': 'Aktiv',
        'admin_render.status_active_opencv': 'Aktiv (OpenCV)',
        'admin_render.status_unavailable': 'Nicht verfügbar',
        'admin_render.badge_clip_search': 'CLIP-Suche: {status}',
        'admin_render.badge_face_detection': 'Gesichtserkennung: {status}',
        'admin_render.badge_person_clustering': 'Personenzuordnung: {status}',
        'admin_render.badge_ffmpeg': 'FFmpeg: {status}',
        'admin_render.badge_geocoding': 'Standort-Kennzeichnung: {status}',
        'admin_render.badge_ocr': 'OCR-Textsuche: {status}',
        'admin_render.ocr_unavailable_hint': 'Tesseract OCR ist nicht installiert - die Textsuche in Screenshots/Dokumenten ist deaktiviert. Installieren Sie es von https://github.com/UB-Mannheim/tesseract/releases und starten Sie den Server neu.',
        'admin_render.person_clustering_hint': 'Für die Personenzuordnung muss die Bibliothek <code>face_recognition</code> installiert sein; ohne sie werden Gesichter erkannt, aber nicht zu Personen gruppiert.',
        'admin_render.background_jobs_heading': 'Hintergrundaufgaben',
        'admin_render.jobs_pending_badge': '{count} ausstehend',
        'admin_render.jobs_running_badge': '{count} laufend',
        'admin_render.jobs_completed_badge': '{count} abgeschlossen',
        'admin_render.jobs_failed_badge': '{count} fehlgeschlagen',
        'admin_render.jobs_session_stats_hint': 'Abgeschlossen/Fehlgeschlagen wird bei jedem Serverneustart zurückgesetzt; Ausstehend spiegelt die tatsächliche Warteschlange wider und bleibt erhalten.',
        'admin_render.job_clip_btn': 'CLIP indizieren',
        'admin_render.job_face_btn': 'Gesichtserkennung',
        'admin_render.job_thumbnail_btn': 'Miniaturansichten',
        'admin_render.job_geocode_btn': 'Standorte kennzeichnen',
        'admin_render.job_transcode_btn': 'Video konvertieren',
        'admin_render.job_recluster_btn': 'Gesichter neu gruppieren',
        'admin_render.job_recluster_title': "Löst unbenannte Personengruppen auf und gruppiert Gesichter mit dem aktuellen Schwellenwert neu; von Ihnen benannte Personen bleiben erhalten.",
        'admin_render.job_categorize_btn': 'Automatisch kategorisieren',
        'admin_render.job_categorize_title': 'Sortiert Fotos mit einem CLIP-Embedding automatisch in Kategorien wie Screenshot/Dokument/Natur/Haustier.',
        'admin_render.job_repair_btn': 'Defekte Dateien reparieren',
        'admin_render.job_repair_title': 'Prüft jedes referenzierte und importierte (kopierte) Foto/Video auf eine fehlende oder defekte Datei - repariert sie aus der Originalquelle, falls noch vorhanden, oder verschiebt sie in den Papierkorb, wenn die Quelle ebenfalls fehlt. Läuft auch automatisch nach jedem Scan/Import.',
        'admin_render.job_ocr_btn': 'Text extrahieren (OCR)',
        'admin_render.job_ocr_title': 'Extrahiert sichtbaren Text aus Screenshot- und Dokumentfotos, damit er über die Suche gefunden werden kann - erfordert eine installierte Tesseract OCR.',
        'admin_render.cancel_all_jobs_btn': 'Alle Aufgaben abbrechen',
        'admin_render.cancel_all_jobs_title': 'Bricht alle ausstehenden/laufenden Aufgaben ab - verwenden Sie dies, wenn eine feststeckende oder unerwünschte Aufgabe Sie blockiert.',
        'admin_render.recent_jobs_label': 'Letzte Aufgaben',
        'admin_render.auto_updates_label': 'Aktualisiert automatisch',
        'admin_render.no_backup_run_yet': 'Es wurde noch keine Sicherung durchgeführt.',
        'admin_render.backup_failed_status': 'Letzter Versuch fehlgeschlagen ({when}): {error}',
        'admin_render.unknown_error': 'Unbekannter Fehler',
        'admin_render.backup_success_status': 'Letzte erfolgreiche Sicherung: {when}',
        'admin_render.server_control_heading': 'Serversteuerung',
        'admin_render.restart_server_btn': 'Server neu starten',
        'admin_render.restart_server_hint': 'Stoppt Hintergrundaufgaben und den Tunnel sauber und startet den Prozess dann neu - nützlich nach einer Einstellungsänderung oder wenn etwas hängen geblieben zu sein scheint, ohne ein Code-Update zu ziehen.',
        'admin_render.confirm_restart': 'Server jetzt neu starten? Eine laufende Hintergrundaufgabe wird zuerst gestoppt.',
        'admin_render.restarting_message': 'Wird neu gestartet - der Server ist in wenigen Sekunden wieder da...',
        'admin_render.restart_overlay_message': 'Server wird neu gestartet...',
        'admin_render.restart_overlay_ready': 'Wieder online - wird neu geladen...',
        'admin_render.restart_overlay_timeout': 'Dauert länger als erwartet - prüfen Sie die Serverkonsole oder laden Sie diese Seite in Kürze neu.',
        'admin_render.shutdown_server_btn': 'Server herunterfahren',
        'admin_render.shutdown_server_hint': 'Stoppt Hintergrundaufgaben und den Tunnel sauber, gibt GPU-/CPU-Speicher frei und beendet dann - die sichere Alternative zum Schließen dieses Fensters, während eine Aufgabe läuft.',
        'admin_render.confirm_shutdown': 'Server jetzt herunterfahren? Eine laufende Hintergrundaufgabe wird zuerst gestoppt.',
        'admin_render.shutting_down_message': 'Wird heruntergefahren - Speicher wird freigegeben und der Server gestoppt...',
        'admin_render.shutdown_overlay_message': 'Server wird heruntergefahren...',
        'admin_render.shutdown_overlay_done': 'Der Server wurde heruntergefahren. Sie können dieses Fenster schließen.',
        'admin_render.audit_log_heading': 'Prüfprotokoll',
        'admin_render.audit_log_empty': 'Noch keine Admin-Aktionen aufgezeichnet.',
        'admin_render.load_more_btn': 'Mehr laden',
        'admin_render.updates_heading': 'Updates',
        'admin_render.check_update_btn': 'Nach Updates suchen',
        'admin_render.checking_updates_msg': 'Suche nach Updates...',
        'admin_render.up_to_date_msg': 'Sie sind auf dem neuesten Stand ({commit})',
        'admin_render.update_available_msg': 'Update verfügbar - {count} neue(r) Commit(s) ({current} → {latest})',
        'admin_render.apply_update_btn': 'Jetzt aktualisieren',
        'admin_render.confirm_apply_update': 'Neuesten Code abrufen, Abhängigkeiten neu installieren und Server jetzt neu starten?',
        'admin_render.applying_update_msg': 'Wird aktualisiert - dies kann einen Moment dauern, der Server startet automatisch neu...',
        'admin_render.git_pull_only_hint': 'Funktioniert bei jeder Installation - ein git clone zieht den neuesten Commit, ein Zip-Download lädt ein aktuelles Archiv herunter und wendet es an.',
        'admin_render.tab_general': 'Allgemein',
        'admin_render.tab_storage_system': 'Speicher & System',
        'admin_render.tab_users': 'Benutzer',
        'admin_render.tab_storage_backup': 'Speicher & Sicherung',
        'admin_render.tab_import': 'Import',
        'admin_render.tab_network_system': 'Netzwerk',
        'admin_render.tab_performance': 'Leistung',
        'admin_render.tab_system': 'System',
        'admin_render.perf_heading': 'CPU-Nutzung der Jobs',
        'admin_render.perf_info_hint': 'Hintergrund-Jobs teilen sich diese Maschine mit dem Webserver. Ohne Limit belegt ein Transkodieren alle Kerne und die ganze App kriecht, bis es fertig ist.',
        'admin_render.perf_profile_label': 'Profil',
        'admin_render.perf_recommend_prefix': 'Empfohlen für diese Maschine',
        'admin_render.perf_apply_recommend_btn': 'Empfehlung übernehmen',
        'admin_render.perf_low_priority_label': 'Jobs mit niedriger Priorität ausführen',
        'admin_render.perf_threads_label': 'Max. Kerne pro Job',
        'admin_render.perf_cores_suffix': 'von {total} Kernen',
        'admin_render.perf_saved_toast': 'Leistungseinstellungen gespeichert',
        'admin_render.perf_running_note': 'Gilt ab dem nächsten Job-Schritt - ein laufender Job behält seine Startwerte.',
        'admin_render.jobs_status_card_heading': 'Aufgaben',
    },
});

async function renderAdmin() {
    const pc = $('page-content');
    pc.innerHTML = '<div class="skeleton" style="height:400px;border-radius:12px"></div>';

    try {
        const [stats, users, tunnelStatus, tailscaleStatus, storageConfig, backupSettings, referenceRootsData, jobConcurrency, auditLog, networkStatus, performance, gpuIdleUnload, memvidSettings, memvidStyles, memvidFormats, versionInfo] = await Promise.all([
            API.getAdminStats(),
            API.getAdminUsers(),
            API.getTunnelStatus().catch(() => ({ status: 'error', available: false })),
            API.getTailscaleStatus().catch(() => ({ available: false, running: false, ip: null, hostname: null })),
            API.getStorageConfig().catch(() => ({ data_dir: '', db_dir: '' })),
            API.getBackupSettings().catch(() => ({ backup_dir: '', interval_hours: 24, enabled: false, last_backup_at: null, last_backup_status: null, last_backup_error: null })),
            API.getReferenceRoots().catch(() => ({ references: [] })),
            API.getJobConcurrency().catch(() => ({ effective: 4, override: null, default: 4, suggested: 4, system: { cpu_count: null, total_ram_gb: null } })),
            API.getAuditLog(1, auditLogLimit).catch(() => ({ entries: [], total: 0 })),
            API.getNetworkStatus().catch(() => ({ lan_ips: [], port: null, firewall_rule_found: null })),
            API.getPerformance().catch(() => null),
            API.getGpuIdleUnload().catch(() => ({ enabled: false, minutes: 15, clip_loaded: false, clip_idle_seconds: null, face_loaded: false, face_idle_seconds: null })),
            API.getMemoryVideoSettings().catch(() => ({ enabled: false, style: 'ken_burns', format: 'landscape', show_date: false })),
            API.getMemoryVideoStyles().catch(() => ({ styles: [] })),
            API.getMemoryVideoFormats().catch(() => ({ formats: [] })),
            // /api/health already carries the build identity (version.py
            // computes it once at import), so the About panel needs no
            // endpoint of its own and no round trip to GitHub.
            API.getHealth().catch(() => ({})),
        ]);

        _adminStats = stats;
        _adminJobConcurrency = jobConcurrency;

        pc.innerHTML = `
            <div class="admin-dash">
                <div class="admin-dash-col">
                    <div class="admin-status-card admin-dash-head">
                        <div class="admin-dash-facts">
                            ${_dashFact('import', t('admin_render.stat_photos'), stats.photos, 'stat-photos')}
                            ${_dashFact('import', t('admin_render.stat_videos'), stats.videos, 'stat-videos')}
                            ${_dashFact('storage', t('admin_render.stat_total_size'), formatSize(stats.total_size), 'stat-total-size')}
                            ${_dashFact('content', t('admin_render.stat_albums'), stats.albums, 'stat-albums')}
                            ${_dashFact('content', t('admin_render.stat_people'), stats.people, 'stat-people')}
                            ${_dashFact('users', t('admin_render.stat_users'), stats.users, 'stat-users')}
                            <!-- Each figure leads to the panel that actually
                                 acts on it: total size opens Storage & Backup,
                                 the user count opens user management. -->

                            <p class="admin-dash-hint">${t('admin_dash.click_hint')}</p>
                        </div>

                        <div class="admin-dash-server">
                            <button type="button" class="admin-dash-server-title dash-fact" data-dash="performance"
                                    aria-expanded="false" aria-controls="admin-dash-detail"
                                    onclick="toggleDashDetail('performance')">
                                ${icon('radio', 14)} ${t('admin_render.server_status_heading')}
                            </button>
                            <div class="admin-dash-server-lines">
                                <button type="button" class="badge dash-fact" id="server-ping-badge" data-dash="network"
                                        aria-expanded="false" aria-controls="admin-dash-detail"
                                        onclick="toggleDashDetail('network')">${t('admin_render.ping_checking')}</button>
                                <span class="badge ${stats.ml.clip_available ? 'badge-success' : 'badge-warning'}">${t('admin_render.badge_clip_search', { status: stats.ml.clip_available ? t('admin_render.status_active') : t('admin_render.status_unavailable') })}</span>
                                <span class="badge ${stats.ml.face_detection_available ? 'badge-success' : 'badge-warning'}">${t('admin_render.badge_face_detection', { status: stats.ml.face_detection_available ? t('admin_render.status_active_opencv') : t('admin_render.status_unavailable') })}</span>
                                <span class="badge ${stats.ml.person_clustering_available ? 'badge-success' : 'badge-warning'}">${t('admin_render.badge_person_clustering', { status: stats.ml.person_clustering_available ? t('admin_render.status_active') : t('admin_render.status_unavailable') })}</span>
                                <span class="badge ${stats.ffmpeg_available ? 'badge-success' : 'badge-warning'}">${t('admin_render.badge_ffmpeg', { status: stats.ffmpeg_available ? t('admin_render.status_active') : t('admin_render.status_unavailable') })}</span>
                                <span class="badge ${stats.ml.geocoding_available ? 'badge-success' : 'badge-warning'}">${t('admin_render.badge_geocoding', { status: stats.ml.geocoding_available ? t('admin_render.status_active') : t('admin_render.status_unavailable') })}</span>
                                <span class="badge ${stats.ml.ocr_available ? 'badge-success' : 'badge-warning'}">${t('admin_render.badge_ocr', { status: stats.ml.ocr_available ? t('admin_render.status_active') : t('admin_render.status_unavailable') })}</span>
                                ${stats.storage_warning.disk_free_gb != null ? `
                                    <span class="badge ${stats.storage_warning.disk_warning ? 'badge-danger' : 'badge-success'}">${t('admin_render.badge_disk_free', { free: stats.storage_warning.disk_free_gb, total: stats.storage_warning.disk_total_gb })}</span>
                                ` : ''}
                                ${stats.storage_warning.total_storage_limit_mb > 0 ? `
                                    <span class="badge ${stats.storage_warning.quota_warning ? 'badge-danger' : 'badge-success'}">${t('admin_render.badge_quota_usage', { used: formatSize(stats.total_size), limit: (stats.storage_warning.total_storage_limit_mb / 1024).toFixed(1) + ' GB' })}</span>
                                ` : ''}
                            </div>
                        </div>

                        <div class="admin-dash-jobsline">
                            ${_dashJobsLine(stats.jobs)}
                        </div>

                        ${(!stats.ml.ocr_available || !stats.ml.person_clustering_available || stats.storage_warning.disk_warning || stats.storage_warning.quota_warning) ? `
                            <div class="admin-dash-notes">
                                ${!stats.ml.ocr_available ? `<p class="text-muted admin-field-hint">${t('admin_render.ocr_unavailable_hint')}</p>` : ''}
                                ${!stats.ml.person_clustering_available ? `<p class="text-muted admin-field-hint">${t('admin_render.person_clustering_hint')}</p>` : ''}
                                ${(stats.storage_warning.disk_warning || stats.storage_warning.quota_warning) ? `<p class="text-muted admin-field-hint" style="color:var(--danger)">${t('admin_render.storage_warning_hint')}</p>` : ''}
                            </div>
                        ` : ''}
                    </div>

                    <div id="admin-dash-detail" class="admin-status-card admin-dash-detail" hidden></div>
                </div>

                <div class="admin-status-card admin-dash-about">
                    <button type="button" class="admin-dash-about-heading dash-fact" data-dash="system"
                            aria-expanded="false" aria-controls="admin-dash-detail"
                            onclick="toggleDashDetail('system')">
                        ${icon('rocket', 16)} ${t('admin_dash.about_heading')}
                    </button>
                    <div class="admin-dash-version">
                        <span class="admin-dash-version-label">${t('admin_dash.version_label')}</span>
                        <span class="admin-dash-version-value">${versionInfo.full_version || t('admin_dash.version_unknown')}</span>
                    </div>
                    <p class="text-muted admin-field-hint">
                        ${versionInfo.git_revision ? t('admin_dash.source_git') : t('admin_dash.source_zip')}${versionInfo.git_commit_date ? ' · ' + versionInfo.git_commit_date : ''}
                    </p>
                    <div id="update-status-container"></div>
                    <button class="btn btn-secondary btn-sm" onclick="checkForUpdate()">${icon('search')} ${t('admin_render.check_update_btn')}</button>
                    <p class="text-muted admin-field-hint">${t('admin_render.git_pull_only_hint')}</p>
                </div>
            </div>

            <!-- Panels live here until a header button pulls one into the
                 drill-down slot; moving the node (rather than copying its
                 HTML) keeps every id unique and every handler attached. -->
            <div id="admin-panel-store" hidden>
            <div id="admin-tab-users" class="admin-tab-panel">
                <div class="admin-section">
                    <div style="display:flex;justify-content:space-between;align-items:center">
                        <h3 style="display:flex;align-items:center;gap:6px">${icon('users', 18)} ${t('admin_render.stat_users')} ${infoBtn(t('admin_users.priority_info_hint'))}</h3>
                        <button class="btn btn-primary btn-sm" onclick="showCreateUserModal()">${t('admin_users.new_user_button')}</button>
                    </div>
                    <div class="user-list">${renderUserList(users.users)}</div>
                </div>
            </div>

            <div id="admin-tab-storage" class="admin-tab-panel">
                <div class="admin-row">
                    <div class="admin-status-card">
                        <div style="display:flex;justify-content:space-between;align-items:center">
                            <h4>${icon('folder', 16)} ${t('admin_render.storage_settings_heading')}</h4>
                            <button class="btn btn-secondary btn-sm" onclick="resetStorageConfigDefaults()">${icon('undo')} ${t('admin_render.reset_defaults_btn')}</button>
                        </div>
                        <div id="storage-panel" style="display:flex;flex-direction:column;gap:12px">
                            <div>
                                <label class="admin-field-label">${t('admin_render.main_storage_dir_label')}</label>
                                <div style="display:flex;gap:8px;align-items:center">
                                    <input type="text" id="storage-path-input" value="${escHtml(storageConfig.data_dir)}" placeholder="${t('admin_render.storage_path_placeholder')}" style="flex:1">
                                </div>
                            </div>
                            <div>
                                <label class="admin-field-label">${t('admin_render.import_dest_path_label')}</label>
                                <input type="text" id="import-dest-path" placeholder="${t('admin_render.import_dest_path_placeholder')}" style="width:100%">
                                <p class="text-muted admin-field-hint">${t('admin_render.import_dest_path_hint')}</p>
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
                                <label class="admin-field-label" for="storage-limit-input">${t('admin_render.storage_limit_label')}</label>
                                ${renderStorageLimitField(storageConfig.total_storage_limit_mb || 0, _storageCapMb(stats))}
                            </div>
                            <div><button class="btn btn-primary" onclick="saveStorageConfig()">${t('admin_render.save_settings_btn')}</button></div>
                            <p class="text-muted admin-field-hint admin-field-hint--bordered">
                                ${t('admin_render.db_location_hint', { path: `<code>${escHtml(storageConfig.db_dir)}</code>` })}
                            </p>
                        </div>
                    </div>

                    <div class="admin-status-card">
                        <div style="display:flex;justify-content:space-between;align-items:center">
                            <h4>${icon('save', 16)} ${t('admin_render.backup_heading')}</h4>
                            <button class="btn btn-secondary btn-sm" onclick="resetBackupConfigDefaults()">${icon('undo')} ${t('admin_render.reset_defaults_btn')}</button>
                        </div>
                        <div style="display:flex;flex-direction:column;gap:12px">
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
                                <button class="btn btn-secondary" onclick="runAdminJob('BACKUP')" title="${t('admin_render.backup_now_title')}">${icon('save')} ${t('admin_render.backup_now_btn')}</button>
                            </div>
                            <p class="text-muted admin-field-hint admin-field-hint--bordered">${renderBackupStatusLine(backupSettings)}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div id="admin-tab-import" class="admin-tab-panel">
                <div class="admin-row">
                    <div class="admin-status-card">
                        <h4>${icon('folder', 16)} ${t('admin_render.folder_import_heading')}</h4>
                        <p class="admin-section-desc" style="margin:0">${t('admin_render.folder_import_desc')}</p>
                        <div id="import-panel" style="display:flex;flex-direction:column;gap:12px">
                            <div id="file-browser">
                                <div style="display:flex;gap:8px;margin-bottom:12px;align-items:center">
                                    <input type="text" id="browse-path" placeholder="${t('admin_render.browse_path_placeholder')}" style="flex:1">
                                    <button id="browse-go-btn" class="btn btn-secondary btn-sm" onclick="browsePath($('browse-path').value)">${t('admin_render.go_btn')}</button>
                                    <button id="scan-import-btn" class="btn btn-primary btn-sm" onclick="scanImportPath()">${t('admin_render.scan_btn')}</button>
                                </div>
                                <div style="display:flex;gap:8px;margin-bottom:12px">
                                    <label class="checkbox-label"><input type="checkbox" id="import-copy" checked> ${t('admin_render.import_copy_label')}</label>
                                    <label class="checkbox-label" style="margin-left:16px"><input type="checkbox" id="import-recursive" checked> ${t('admin_render.import_recursive_label')}</label>
                                </div>
                                <div id="browse-results" style="max-height:220px;overflow-y:auto;border:1px solid var(--border-color);border-radius:8px"></div>
                                <div id="scan-results" style="margin-top:12px">
                                    <div id="active-imports-slot"></div>
                                    <div id="scan-preview-slot"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="admin-status-card">
                        <h4>${icon('link', 16)} ${t('admin_render.reference_roots_heading')}</h4>
                        <p class="admin-section-desc" style="margin:0">${t('admin_render.reference_roots_desc')}</p>
                        <div id="reference-roots-list">${renderReferenceRootsList(referenceRootsData.references)}</div>
                    </div>
                </div>
            </div>

            <div id="admin-tab-network" class="admin-tab-panel">
                <div class="admin-status-matrix">
                    <div class="admin-status-card">
                        <h4>${icon('home', 16)} ${t('admin_render.lan_access_heading')} ${infoBtn(t('admin_render.lan_access_info_hint'))}</h4>
                        <div id="network-status-panel">${renderNetworkStatusPanel(networkStatus)}</div>
                    </div>

                    <div class="admin-status-card">
                        <h4>${icon('globe', 16)} ${t('admin_render.remote_access_heading')} ${infoBtn(t('admin_render.remote_access_info_hint'))}</h4>
                        <div id="tunnel-panel">${renderTunnelPanel(tunnelStatus)}</div>
                        <div style="display:flex;align-items:center;gap:8px;margin-top:12px">
                            <input type="checkbox" id="storage-autostart-input" ${storageConfig.auto_start_tunnel ? 'checked' : ''} style="width:auto;margin:0">
                            <label for="storage-autostart-input" class="admin-checkbox-label">${t('admin_render.tunnel_autostart_label')}</label>
                            <button class="btn btn-secondary btn-sm" onclick="saveStorageConfig()" style="margin-left:auto">${t('admin_render.save_settings_btn')}</button>
                        </div>
                    </div>

                    <div class="admin-status-card">
                        <h4>${icon('repeat', 16)} ${t('admin_tunnel.other_methods_heading')} ${infoBtn(t('admin_tunnel.other_methods_info_hint'))}</h4>
                        <div id="tailscale-panel">${renderTailscalePanel(tailscaleStatus)}</div>
                        <p class="text-muted admin-field-hint admin-field-hint--bordered">${t('admin_tunnel.reverse_proxy_hint')}</p>
                    </div>

                </div>
            </div>

            <div id="admin-tab-performance" class="admin-tab-panel">
                <div class="admin-grid">
                    <div class="admin-status-card">
                        <h4>${icon('brain', 16)} ${t('admin_render.perf_heading')} ${infoBtn(t('admin_render.perf_info_hint'))}</h4>
                        <div id="perf-panel">${renderPerformancePanel(performance)}</div>
                    </div>

                    <div class="admin-status-card">
                        <h4>${icon('brain', 16)} ${t('admin_render.gpu_idle_heading')} ${infoBtn(t('admin_render.gpu_idle_info_hint'))}</h4>
                        <div id="gpu-idle-panel">${renderGpuIdlePanel(gpuIdleUnload)}</div>
                    </div>

                </div>
            </div>

            <div id="admin-tab-system" class="admin-tab-panel">
                <div class="admin-grid">
                    <div class="admin-status-card">
                        <h4>${icon('film', 16)} ${t('admin_render.memvid_heading')} ${infoBtn(t('admin_render.memvid_info_hint'))}</h4>
                        <div id="memvid-settings-panel">${renderMemoryVideoSettingsPanel(memvidSettings, memvidStyles.styles, memvidFormats.formats)}</div>
                    </div>

                    <div class="admin-status-card">
                        <h4>${icon('plug', 16)} ${t('admin_render.server_control_heading')}</h4>
                        <p class="text-muted admin-field-hint">${t('admin_render.restart_server_hint')}</p>
                        <button class="btn btn-secondary btn-sm" onclick="restartServer(this)">${icon('refresh')} ${t('admin_render.restart_server_btn')}</button>
                        <p class="text-muted admin-field-hint" style="margin-top:12px">${t('admin_render.shutdown_server_hint')}</p>
                        <button class="btn btn-danger btn-sm" onclick="shutdownServer(this)">${icon('stop')} ${t('admin_render.shutdown_server_btn')}</button>
                    </div>

                    <div class="admin-status-card">
                        <h4>${icon('file', 16)} ${t('admin_render.audit_log_heading')}</h4>
                        <div id="audit-log-list">${renderAuditLogEntries(auditLog.entries)}</div>
                        ${auditLog.entries.length < auditLog.total ? `
                            <button class="btn btn-secondary btn-sm" style="margin-top:8px" onclick="loadMoreAuditLog()">${t('admin_render.load_more_btn')}</button>
                        ` : ''}
                    </div>
                </div>
            </div>
            </div>
        `;

        // The hint carries the drive's ceiling, which is worth seeing before
        // typing rather than only after - the handlers alone would leave it
        // blank until the field was touched.
        _refreshStorageLimitHint();

        pollAdminJobs();
        if (!adminPollInterval) {
            adminPollInterval = setInterval(pollAdminJobs, ADMIN_POLL_INTERVAL_MS);
        }
        if (!adminStatsPollInterval) {
            adminStatsPollInterval = setInterval(refreshAdminStats, ADMIN_STATS_POLL_INTERVAL_MS);
        }
        refreshServerPing();
        if (!serverPingInterval) {
            serverPingInterval = setInterval(refreshServerPing, SERVER_PING_INTERVAL_MS);
        }

    } catch (e) { toast(e.message, 'error'); }
}

// Round-trip time to GET /api/health, measured client-side - not a "is the
// backend logically healthy" check (that's what the endpoint's own 200
// response already means), just "how long did this request take right
// now", the closest thing to a ping the browser can do without raw ICMP.
async function refreshServerPing() {
    if (state.currentPage !== 'admin') {
        if (serverPingInterval) {
            clearInterval(serverPingInterval);
            serverPingInterval = null;
        }
        return;
    }
    const badge = $('server-ping-badge');
    if (!badge) return;

    const start = performance.now();
    try {
        await API.getHealth();
        const ms = Math.round(performance.now() - start);
        badge.textContent = t('admin_render.ping_label', { ms });
        _setPingTone(badge, ms < 150 ? 'badge-success' : ms < 500 ? 'badge-warning' : 'badge-danger');
    } catch (e) {
        badge.textContent = t('admin_render.ping_offline');
        _setPingTone(badge, 'badge-danger');
    }
}

// Swaps only the colour class. This badge doubles as the Network drill-down
// trigger, so the old blanket `className = 'badge ...'` would have stripped
// .dash-fact (and its open state) off it on the very first ping.
function _setPingTone(badge, tone) {
    badge.classList.remove('badge-success', 'badge-warning', 'badge-danger');
    badge.classList.add(tone);
}

// Updates just the 6 dashboard stat-card values in place (not a full
// renderAdmin() re-run - that would wipe out any in-progress form edits,
// open tabs, scroll position, etc. every 15s) so they stay live without
// needing an F5. Self-clears exactly like pollAdminJobs() does if the
// user has since navigated away from the admin page.
// ---------------------------------------------------------------------------
// Storage limit: a number plus a unit, instead of a raw megabyte count.
//
// The field used to be labelled "(MB)" and nothing else, so setting a 1 TB
// limit meant typing 1048576 - and the value already stored on this server
// was 1000024, which is not a round anything. Nobody should be doing base-2
// arithmetic to fill in a settings field.
// ---------------------------------------------------------------------------

const STORAGE_UNITS = [
    { unit: 'TB', mb: 1024 * 1024 },
    { unit: 'GB', mb: 1024 },
    { unit: 'MB', mb: 1 },
];

/** Largest unit that represents `mb` EXACTLY. Deliberately exact rather than
 *  "nearest nice-looking unit": showing 1000024 MB as "976.59 GB" and then
 *  writing back 976.59 x 1024 would silently change a value the admin never
 *  touched. An awkward number stays in MB until they choose otherwise. */
function _splitStorageMb(mb) {
    for (const { unit, mb: size } of STORAGE_UNITS) {
        if (mb >= size && mb % size === 0) return { value: mb / size, unit };
    }
    return { value: mb, unit: 'MB' };
}

function _formatStorageMb(mb) {
    const { value, unit } = _splitStorageMb(mb);
    return `${value.toLocaleString()} ${unit}`;
}

/** For a CEILING, where the exact-multiple rule above is the wrong tool: a
 *  drive's spare room is never a round number, so it would always print as
 *  a seven-digit megabyte count. Rounded DOWN on purpose - a maximum must
 *  never advertise more room than actually exists. */
function _formatStorageCap(mb) {
    for (const { unit, mb: size } of STORAGE_UNITS) {
        if (mb >= size) {
            const value = Math.floor((mb / size) * 10) / 10;
            return `${value.toLocaleString()} ${unit}`;
        }
    }
    return `${mb} MB`;
}

/** The largest limit this drive could actually honour: what the library
 *  already occupies plus what is still free. Free space alone would be
 *  wrong - it would refuse a limit that merely covers the photos already
 *  stored. */
function _storageCapMb(stats) {
    const free = stats?.storage_warning?.disk_free_gb;
    if (free == null) return 0;   // unknown disk - fall back to no client cap
    return Math.floor(free * 1024 + (stats.total_size || 0) / (1024 * 1024));
}

function renderStorageLimitField(currentMb, capMb) {
    const { value, unit } = _splitStorageMb(currentMb);
    const options = STORAGE_UNITS
        .map(u => `<option value="${u.mb}" ${u.unit === unit ? 'selected' : ''}>${u.unit}</option>`)
        .join('');
    return `
        <div class="storage-limit-row">
            <input type="number" id="storage-limit-input" value="${value}" min="0" step="any"
                   data-cap-mb="${capMb}" data-exact-mb="${currentMb}"
                   oninput="_onStorageLimitInput()">
            <select id="storage-limit-unit" onchange="_onStorageUnitChange()">${options}</select>
        </div>
        <p class="text-muted admin-field-hint" id="storage-limit-hint"></p>`;
}

/** The unit RE-LABELS the number rather than converting it: picking TB after
 *  typing 1 means 1 TB.
 *
 *  Converting instead was the first attempt and it broke the main job this
 *  field exists for. The field opens showing whatever is stored - often in
 *  MB - so someone setting a 1 TB cap types 1 and picks TB, and conversion
 *  turned that into 0.000001 TB. Reading the size back in another unit is
 *  the rarer need, so the hint carries it instead of the input. */
function _onStorageUnitChange() {
    _onStorageLimitInput();
}

/** Typing makes the number on screen authoritative again. */
function _onStorageLimitInput() {
    const input = $('storage-limit-input');
    const unit = Number($('storage-limit-unit')?.value || 1);
    input.dataset.exactMb = String(Math.round((parseFloat(input.value) || 0) * unit));
    _refreshStorageLimitHint();
}

function _refreshStorageLimitHint() {
    const hint = $('storage-limit-hint');
    if (!hint) return;
    const capMb = Number($('storage-limit-input').dataset.capMb) || 0;
    const mb = storageLimitMb();

    const parts = [];
    if (!mb) {
        parts.push(t('admin_render.storage_limit_unlimited_hint'));
    } else {
        // The size in the other units, since the input itself no longer
        // converts - this is where "how big is that really" gets answered.
        parts.push(t('admin_render.storage_limit_equals', { size: _formatStorageCap(mb), mb: mb.toLocaleString() }));
    }
    if (capMb > 0) parts.push(t('admin_render.storage_limit_cap_hint', { max: _formatStorageCap(capMb) }));
    hint.textContent = parts.join(' ');
    hint.style.color = capMb > 0 && mb > capMb ? 'var(--danger)' : '';
}

/** The field's value in megabytes, which is the only unit the API knows. */
function storageLimitMb() {
    const input = $('storage-limit-input');
    if (!input) return 0;
    return Number(input.dataset.exactMb || 0);
}

// ---------------------------------------------------------------------------
// Dashboard header: clickable figures with a drill-down that opens BELOW them.
//
// Every figure is a real <button>, not a styled <div> - that buys keyboard
// focus, Enter/Space activation and the right screen-reader role for free,
// which a clickable div would each have to reimplement badly.
// ---------------------------------------------------------------------------

// Last stats payload, kept so a drill-down opened minutes after page load
// still shows current numbers rather than the ones baked into the markup.
let _adminStats = null;
let _adminJobConcurrency = null;
let _openDashDetail = null;

function _dashFact(detailKey, label, value, valueId) {
    return `
        <button type="button" class="dash-fact" data-dash="${detailKey}" data-fact="${valueId}"
                aria-expanded="false" aria-controls="admin-dash-detail"
                onclick="toggleDashDetail('${detailKey}')">
            <span class="dash-fact-label">${label}</span>
            <span class="dash-fact-sep">:</span>
            <span class="dash-fact-value" id="${valueId}">${value}</span>
        </button>`;
}

function _dashJobsLine(jobs) {
    return `
        <button type="button" class="dash-fact dash-fact--line" data-dash="jobs"
                aria-expanded="false" aria-controls="admin-dash-detail"
                onclick="toggleDashDetail('jobs')">
            <span class="dash-fact-label">${t('admin_dash.jobs_label')}</span>
            <span class="dash-fact-sep">:</span>
            <span class="dash-fact-value">${jobs.running}</span>
            <span class="dash-fact-unit">${t('admin_dash.jobs_running')}</span>
            <span class="dash-fact-sep">·</span>
            <span class="dash-fact-value">${jobs.pending}</span>
            <span class="dash-fact-unit">${t('admin_dash.jobs_pending')}</span>
            <span class="dash-fact-sep">·</span>
            <span class="dash-fact-value">${jobs.completed}</span>
            <span class="dash-fact-unit">${t('admin_dash.jobs_completed')}</span>
        </button>`;
}

// The jobs card used to be the whole "Genel Bakış" tab. It now lives in the
// dashboard's own drill-down instead, so the tab strip has no near-empty
// landing page and every figure on the header leads somewhere for the same
// reason.
function _dashJobsPanelHtml(s, jc) {
    return `
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">
            <span class="badge ${s.jobs.pending > 0 ? 'badge-warning' : 'badge-success'}" id="jobs-pending-badge">${t('admin_render.jobs_pending_badge', { count: s.jobs.pending })}</span>
            <span class="badge ${s.jobs.running > 0 ? 'badge-admin' : 'badge-success'}" id="jobs-running-badge">${t('admin_render.jobs_running_badge', { count: s.jobs.running })}</span>
            <span class="badge badge-success" id="jobs-completed-badge">${t('admin_render.jobs_completed_badge', { count: s.jobs.completed })}</span>
            <span class="badge ${s.jobs.failed > 0 ? 'badge-danger' : 'badge-success'}" id="jobs-failed-badge">${t('admin_render.jobs_failed_badge', { count: s.jobs.failed })}</span>
        </div>
        <p class="text-muted admin-field-hint" style="margin-bottom:8px">${t('admin_render.jobs_session_stats_hint')}</p>
        <div style="display:flex;gap:6px;flex-wrap:wrap">
            <button class="btn btn-secondary btn-sm" onclick="runAdminJob('CLIP')">${icon('brain')} ${t('admin_render.job_clip_btn')}</button>
            <button class="btn btn-secondary btn-sm" onclick="runAdminJob('FACE')">${icon('person')} ${t('admin_render.job_face_btn')}</button>
            <button class="btn btn-secondary btn-sm" onclick="runAdminJob('THUMBNAIL')">${icon('image')} ${t('admin_render.job_thumbnail_btn')}</button>
            <button class="btn btn-secondary btn-sm" onclick="runAdminJob('GEOCODE')">${icon('pin')} ${t('admin_render.job_geocode_btn')}</button>
            <button class="btn btn-secondary btn-sm" onclick="runAdminJob('TRANSCODE')">${icon('film')} ${t('admin_render.job_transcode_btn')}</button>
            <button class="btn btn-secondary btn-sm" onclick="runAdminJob('RECLUSTER')" title="${t('admin_render.job_recluster_title')}">${icon('repeat')} ${t('admin_render.job_recluster_btn')}</button>
            <button class="btn btn-secondary btn-sm" onclick="runAdminJob('CATEGORIZE')" title="${t('admin_render.job_categorize_title')}">${icon('category')} ${t('admin_render.job_categorize_btn')}</button>
            <button class="btn btn-secondary btn-sm" onclick="runAdminJob('REPAIR')" title="${t('admin_render.job_repair_title')}">${icon('wrench')} ${t('admin_render.job_repair_btn')}</button>
            <button class="btn btn-secondary btn-sm" onclick="runAdminJob('OCR')" title="${t('admin_render.job_ocr_title')}" ${!s.ml.ocr_available ? 'disabled' : ''}>${icon('file')} ${t('admin_render.job_ocr_btn')}</button>
            <button class="btn btn-danger btn-sm" onclick="cancelAllAdminJobs()" title="${t('admin_render.cancel_all_jobs_title')}">${icon('stop')} ${t('admin_render.cancel_all_jobs_btn')}</button>
        </div>
        <div style="border-top:1px solid var(--border-color);padding-top:8px;margin-top:8px">
            <div style="display:flex;justify-content:space-between;align-items:center">
                <label class="admin-field-label">${t('admin_jobs.concurrency_label')}</label>
                <button class="btn btn-secondary btn-sm" onclick="resetJobConcurrency()">${icon('undo')} ${t('admin_jobs.reset_concurrency_btn')}</button>
            </div>
            <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
                <input type="number" id="job-concurrency-input" min="1" max="32"
                       value="${jc.override ?? jc.effective}" style="width:80px">
                <button class="btn btn-secondary btn-sm" onclick="saveJobConcurrency()">${t('admin_render.save_settings_btn')}</button>
                <button class="btn btn-secondary btn-sm" onclick="applyJobConcurrencySuggestion()">
                    ${t('admin_jobs.apply_suggestion_btn', { value: jc.suggested })}
                </button>
            </div>
            <p class="text-muted admin-field-hint">${t('admin_jobs.concurrency_hint', {
                cpu: jc.system.cpu_count ?? '?',
                ram: jc.system.total_ram_gb != null ? jc.system.total_ram_gb + ' GB' : '?',
                suggested: jc.suggested,
            })}</p>
        </div>
        <div id="job-list-container" style="max-height:160px;overflow-y:auto;border-top:1px solid var(--border-color);padding-top:8px">
            <div style="font-size:11px;font-weight:600;margin-bottom:4px;color:var(--text-secondary);display:flex;justify-content:space-between;align-items:center">
                <span>${t('admin_render.recent_jobs_label')}</span>
                <span style="font-size:9px;font-weight:normal;opacity:0.6">${t('admin_render.auto_updates_label')}</span>
            </div>
            <div id="job-list-content">${t('common.loading')}</div>
        </div>
    `;
}

// The six panels that used to be tabs. Each is a real node parked in
// #admin-panel-store; opening one moves it into the drill-down and closing
// moves it back, so ids stay unique and nothing has to be re-rendered or
// re-wired. `onOpen` runs after the move for panels that need to kick off
// their own loading.
const DASH_PANELS = {
    users: { title: 'admin_render.tab_users' },
    storage: { title: 'admin_render.tab_storage_backup' },
    import: {
        title: 'admin_render.tab_import',
        // The file browser starts empty and only fills in on demand, so it
        // has to be told to load the first listing - and an import already
        // running has to be re-attached to rather than restarted.
        onOpen: () => {
            if (!resumeScanIfActive()) browsePath('');
            resumeImportProgressIfActive();
        },
    },
    network: { title: 'admin_render.tab_network_system' },
    performance: { title: 'admin_render.tab_performance' },
    system: { title: 'admin_render.tab_system' },
};

/** Put a moved panel back in the store so the drill-down can be emptied
 *  without destroying it. */
function _stashOpenPanel() {
    const store = $('admin-panel-store');
    const panel = $('admin-dash-detail');
    if (!store || !panel) return;
    panel.querySelectorAll('.admin-tab-panel').forEach(el => store.appendChild(el));
}

function _dashRow(label, value) {
    return `<div class="dash-detail-row"><span>${label}</span><span class="dash-detail-value">${value}</span></div>`;
}

/** Body + title for one drill-down, built from the freshest stats we hold. */
function _dashDetailContent(key) {
    const s = _adminStats;
    if (!s) return null;
    const sw = s.storage_warning || {};

    if (key === 'library') {
        return {
            title: t('admin_dash.detail_library'),
            body: [
                _dashRow(t('admin_render.stat_photos'), s.photos),
                _dashRow(t('admin_render.stat_videos'), s.videos),
                _dashRow(t('admin_dash.total_assets'), s.total_assets),
                _dashRow(t('admin_render.stat_total_size'), formatSize(s.total_size)),
                sw.disk_free_gb != null
                    ? _dashRow(t('admin_dash.disk_free'), `${sw.disk_free_gb} / ${sw.disk_total_gb} GB`)
                    : '',
                _dashRow(t('admin_dash.quota'), sw.total_storage_limit_mb > 0
                    ? (sw.total_storage_limit_mb / 1024).toFixed(1) + ' GB'
                    : t('admin_dash.no_limit')),
            ].join(''),
        };
    }
    if (key === 'content') {
        return {
            title: t('admin_dash.detail_content'),
            body: [
                _dashRow(t('admin_render.stat_albums'), s.albums),
                _dashRow(t('admin_render.stat_people'), s.people),
                _dashRow(t('admin_dash.shared_links'), s.shared_links),
            ].join(''),
            action: { label: t('admin_dash.goto_people'), fn: "navigateTo('people')" },
        };
    }
    if (DASH_PANELS[key]) {
        return { title: t(DASH_PANELS[key].title), node: key, live: true };
    }
    if (key === 'jobs') {
        if (!_adminJobConcurrency) return null;
        return {
            title: t('admin_render.jobs_status_card_heading'),
            body: _dashJobsPanelHtml(s, _adminJobConcurrency),
            // Unlike the read-only drill-downs this one owns live controls
            // (the concurrency input, the auto-updating job list), so a
            // blind repaint on every stats tick would wipe out whatever the
            // admin was mid-way through typing. Its own pollers keep it
            // current instead - see _paintDashDetail.
            live: true,
        };
    }
    return null;
}

function _paintDashDetail({ isRefresh = false } = {}) {
    const panel = $('admin-dash-detail');
    if (!panel || !_openDashDetail) return;
    const content = _dashDetailContent(_openDashDetail);
    if (!content) return;
    // A `live` panel renders once and then updates itself in place; only the
    // static row lists get redrawn from a stats tick.
    if (isRefresh && content.live) return;
    _stashOpenPanel();
    panel.innerHTML = `
        <div class="dash-detail-head">
            <h4>${content.title}</h4>
            <button type="button" class="dash-detail-close" onclick="closeDashDetail()"
                    aria-label="${t('admin_dash.close')}">
                ${icon('close', 14)}
            </button>
        </div>
        ${content.node ? '' : `<div class="dash-detail-body">${content.body}</div>`}
        ${content.action ? `
            <button class="btn btn-secondary btn-sm" onclick="${content.action.fn}">${content.action.label}</button>
        ` : ''}
    `;
    if (content.node) {
        const stored = $(`admin-tab-${content.node}`);
        if (stored) panel.appendChild(stored);
        DASH_PANELS[content.node].onOpen?.();
    }
}

function _syncDashPressedState() {
    document.querySelectorAll('.dash-fact').forEach(btn => {
        const on = btn.dataset.dash === _openDashDetail;
        btn.classList.toggle('dash-fact--open', on);
        btn.setAttribute('aria-expanded', on ? 'true' : 'false');
    });
}

/** Clicking the figure that is already open closes it again - the panel is a
 *  toggle, so there is always a way back to the plain overview. */
function toggleDashDetail(key) {
    _openDashDetail = _openDashDetail === key ? null : key;
    const panel = $('admin-dash-detail');
    if (!panel) return;
    if (!_openDashDetail) {
        _stashOpenPanel();
        panel.hidden = true;
        panel.innerHTML = '';
    } else {
        panel.hidden = false;
        _paintDashDetail();
    }
    _syncDashPressedState();
}

function closeDashDetail() {
    if (_openDashDetail) toggleDashDetail(_openDashDetail);
}

async function refreshAdminStats() {
    if (state.currentPage !== 'admin') {
        if (adminStatsPollInterval) {
            clearInterval(adminStatsPollInterval);
            adminStatsPollInterval = null;
        }
        return;
    }
    if (!$('stat-photos')) return;

    try {
        const stats = await API.getAdminStats();
        _adminStats = stats;
        const jobsLine = document.querySelector('.admin-dash-jobsline');
        if (jobsLine) jobsLine.innerHTML = _dashJobsLine(stats.jobs);
        if (_openDashDetail) _paintDashDetail({ isRefresh: true });
        _syncDashPressedState();
        _setStatValue('stat-photos', stats.photos);
        _setStatValue('stat-videos', stats.videos);
        _setStatValue('stat-total-size', formatSize(stats.total_size));
        _setStatValue('stat-people', stats.people);
        _setStatValue('stat-albums', stats.albums);
        _setStatValue('stat-users', stats.users);

        _setJobBadge('jobs-pending-badge', t('admin_render.jobs_pending_badge', { count: stats.jobs.pending }), 'badge ' + (stats.jobs.pending > 0 ? 'badge-warning' : 'badge-success'));
        _setJobBadge('jobs-running-badge', t('admin_render.jobs_running_badge', { count: stats.jobs.running }), 'badge ' + (stats.jobs.running > 0 ? 'badge-admin' : 'badge-success'));
        _setJobBadge('jobs-completed-badge', t('admin_render.jobs_completed_badge', { count: stats.jobs.completed }), 'badge badge-success');
        _setJobBadge('jobs-failed-badge', t('admin_render.jobs_failed_badge', { count: stats.jobs.failed }), 'badge ' + (stats.jobs.failed > 0 ? 'badge-danger' : 'badge-success'));
    } catch (e) { /* non-critical - next tick tries again */ }
}

// Same idea as _setStatValue but for the jobs badges, which also need their
// color class re-evaluated each tick (e.g. pending going 0 -> flips
// badge-success -> badge-warning), not just their text.
function _setJobBadge(id, text, className) {
    const el = $(id);
    if (!el) return;
    if (el.textContent === text && el.className === className) return;
    el.textContent = text;
    el.className = className;
    void el.offsetWidth;
    el.classList.add('stat-value-updated');
}

// Only touches (and pops) a value that actually changed since the last
// poll - flashing all 6 cards every 15s regardless would be more
// distracting than useful when only one number actually moved.
function _setStatValue(id, value) {
    const el = $(id);
    const text = String(value);
    if (el.textContent === text) return;
    el.textContent = text;
    el.classList.remove('stat-value-updated');
    void el.offsetWidth; // force reflow so the animation restarts even if it's still mid-flash from the previous tick
    el.classList.add('stat-value-updated');
}

let auditLogLimit = 20;

// Copy buttons here carry their text in a data-copy-text attribute rather
// than an inline onclick string - the firewall fix command contains its own
// double quotes ("Wimmich", the python.exe path), which would otherwise
// collide with the onclick="..." attribute's own quoting. Reading it back
// via .dataset instead sidesteps that entirely (the browser already
// decodes HTML entities for us), rather than juggling escAttr/escHtml
// stacked on top of each other for a string with both delimiters in it.
function renderNetworkStatusPanel(status) {
    const urls = (status.lan_ips || []).map(ip => `http://${ip}:${status.port}`);
    const urlsHtml = urls.length
        ? urls.map(url => `
            <div class="tunnel-url-row" style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
                <code style="flex:1;overflow-x:auto;white-space:nowrap">${escHtml(url)}</code>
                <button type="button" class="btn-icon copy-to-clipboard-btn" data-copy-text="${escHtmlAttr(url)}" title="${t('common.copy')}">${icon('copy', 14)}</button>
            </div>
        `).join('')
        : `<p class="text-muted admin-field-hint">${t('admin_render.lan_no_ip_found')}</p>`;

    let firewallHtml;
    if (status.firewall_rule_found === true) {
        firewallHtml = `<span class="badge badge-success">${t('admin_render.lan_firewall_ok')}</span>`;
    } else if (status.firewall_rule_found === false) {
        const fixCmd = `New-NetFirewallRule -DisplayName "Wimmich" -Direction Inbound -Program "${status.python_exe || 'python.exe'}" -Action Allow -Profile Any`;
        firewallHtml = `
            <span class="badge badge-danger">${t('admin_render.lan_firewall_blocked')}</span>
            <p class="text-muted admin-field-hint" style="margin-top:6px">${t('admin_render.lan_firewall_fix_hint')}</p>
            <div style="display:flex;align-items:center;gap:8px;margin-top:4px">
                <code style="flex:1;overflow-x:auto;white-space:nowrap;font-size:11px">${escHtml(fixCmd)}</code>
                <button type="button" class="btn-icon copy-to-clipboard-btn" data-copy-text="${escHtmlAttr(fixCmd)}" title="${t('common.copy')}">${icon('copy', 14)}</button>
            </div>
        `;
    } else {
        firewallHtml = `<span class="badge badge-warning">${t('admin_render.lan_firewall_unknown')}</span>`;
    }

    return `
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
            <input type="checkbox" id="lan-access-enabled-input" ${status.lan_access_enabled ? 'checked' : ''} style="width:auto;margin:0" onchange="saveLanAccessEnabled(this)">
            <label for="lan-access-enabled-input" class="admin-checkbox-label">${t('admin_render.lan_access_toggle_label')}</label>
        </div>
        ${!status.lan_access_enabled ? `<p class="text-muted admin-field-hint" style="color:var(--danger)">${t('admin_render.lan_access_disabled_hint')}</p>` : ''}
        <p class="text-muted admin-field-hint">${t('admin_render.lan_access_hint')}</p>
        ${urlsHtml}
        <div style="margin-top:12px">${firewallHtml}</div>
    `;
}

async function saveLanAccessEnabled(checkbox) {
    const enabling = checkbox.checked;
    if (!enabling) {
        // The generic warning was confusing admins viewing the panel via
        // plain "localhost"/127.0.0.1 (or through Cloudflare Tunnel/
        // Tailscale, both of which also arrive as loopback server-side) -
        // none of those are actually affected by this toggle at all, only
        // a REAL LAN address (this machine's own 192.168.x.x/10.x.x.x, or
        // a different device) is. Tell the admin which case they're
        // actually in instead of always implying "you might lock
        // yourself out".
        const onLoopback = ['localhost', '127.0.0.1', '::1'].includes(location.hostname);
        const message = onLoopback
            ? t('admin_render.lan_access_disable_confirm_safe')
            : t('admin_render.lan_access_disable_confirm_risky');
        if (!confirm(message)) {
            checkbox.checked = true;
            return;
        }
    }
    try {
        await API.setLanAccessEnabled(enabling);
        toast(t(enabling ? 'admin_render.lan_access_enabled_toast' : 'admin_render.lan_access_disabled_toast'), 'success');
        renderAdmin();
    } catch (e) {
        checkbox.checked = !enabling;
        toast(e.message, 'error');
    }
}

function renderPerformancePanel(perf) {
    // Null when the request failed (older server, or an error) - render
    // nothing rather than a half-broken control.
    if (!perf) return '';
    const lang = getLanguage();
    const rec = perf.recommendation || {};
    const total = perf.total_cores;
    const activeProfile = (perf.profiles || []).find(p =>
        p.low_priority === perf.effective_low_priority &&
        p.max_cpu_threads === perf.effective_max_cpu_threads
    );

    return `
        <p class="text-muted admin-field-hint" style="margin-bottom:10px">
            ${icon('info', 13)} ${escHtml(t('admin_render.perf_recommend_prefix'))}:
            <strong>${escHtml(rec[`reason_${lang}`] || rec.reason_en || '')}</strong>
        </p>
        <div class="admin-field-row">
            <label for="perf-profile-select">${t('admin_render.perf_profile_label')}</label>
            <select id="perf-profile-select" class="gallery-mini-select">
                ${(perf.profiles || []).map(p => `
                    <option value="${p.key}" ${activeProfile && activeProfile.key === p.key ? 'selected' : ''}>
                        ${escHtml(p[`label_${lang}`] || p.label_en)}
                    </option>`).join('')}
                <option value="custom" ${activeProfile ? '' : 'selected'}>${escHtml(t('common.other') || 'Custom')}</option>
            </select>
            <button class="btn btn-secondary btn-sm" onclick="applyPerformanceRecommendation()">${t('admin_render.perf_apply_recommend_btn')}</button>
        </div>
        <div class="admin-field-row" style="margin-top:10px">
            <input type="checkbox" id="perf-low-priority" ${perf.effective_low_priority ? 'checked' : ''} style="width:auto;margin:0">
            <label for="perf-low-priority" class="admin-checkbox-label">${t('admin_render.perf_low_priority_label')}</label>
        </div>
        <div class="admin-field-row" style="margin-top:10px">
            <label for="perf-threads">${t('admin_render.perf_threads_label')}</label>
            <input type="number" id="perf-threads" min="1" max="${total}" value="${perf.effective_max_cpu_threads}" style="width:80px;margin:0">
            <span class="text-muted" style="font-size:12px">${t('admin_render.perf_cores_suffix', { total })}</span>
            <button class="btn btn-secondary btn-sm" onclick="savePerformanceSettings()" style="margin-left:auto">${t('admin_render.save_settings_btn')}</button>
        </div>
        <p class="text-muted admin-field-hint" style="margin-top:10px">${t('admin_render.perf_running_note')}</p>
    `;
}

async function _refreshPerformancePanel() {
    const perf = await API.getPerformance().catch(() => null);
    const el = $('perf-panel');
    if (el) el.innerHTML = renderPerformancePanel(perf);
}

async function applyPerformanceRecommendation() {
    try {
        const current = await API.getPerformance();
        await API.setPerformance({ profile: current.recommendation.profile });
        toast(t('admin_render.perf_saved_toast'), 'success');
        await _refreshPerformancePanel();
    } catch (e) { toast(e.message, 'error'); }
}

async function savePerformanceSettings() {
    const profileEl = $('perf-profile-select');
    const profile = profileEl ? profileEl.value : 'custom';
    try {
        // A named profile carries its own preset values; "custom" is the
        // only case where the two inputs below are what the admin means.
        const body = profile && profile !== 'custom'
            ? { profile }
            : {
                low_priority: $('perf-low-priority').checked,
                max_cpu_threads: parseInt($('perf-threads').value, 10) || null,
            };
        await API.setPerformance(body);
        toast(t('admin_render.perf_saved_toast'), 'success');
        await _refreshPerformancePanel();
    } catch (e) { toast(e.message, 'error'); }
}

function renderGpuIdlePanel(status) {
    const clipStatusHtml = status.clip_loaded
        ? `<span class="badge badge-success">${t('admin_render.gpu_idle_model_loaded', { seconds: Math.round(status.clip_idle_seconds || 0) })}</span>`
        : `<span class="badge">${t('admin_render.gpu_idle_model_unloaded')}</span>`;
    const faceStatusHtml = status.face_loaded
        ? `<span class="badge badge-success">${t('admin_render.gpu_idle_model_loaded', { seconds: Math.round(status.face_idle_seconds || 0) })}</span>`
        : `<span class="badge">${t('admin_render.gpu_idle_model_unloaded')}</span>`;

    return `
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
            <input type="checkbox" id="gpu-idle-enabled-input" ${status.enabled ? 'checked' : ''} style="width:auto;margin:0">
            <label for="gpu-idle-enabled-input" class="admin-checkbox-label">${t('admin_render.gpu_idle_toggle_label')}</label>
        </div>
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
            <label for="gpu-idle-minutes-input" class="text-muted" style="font-size:13px">${t('admin_render.gpu_idle_minutes_label')}</label>
            <input type="number" id="gpu-idle-minutes-input" value="${status.minutes}" min="1" style="width:70px">
        </div>
        <p class="text-muted admin-field-hint">${t('admin_render.gpu_idle_hint')}</p>
        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:8px 0">
            <span class="text-muted" style="font-size:12px">${t('admin_render.gpu_idle_clip_label')}</span> ${clipStatusHtml}
            <span class="text-muted" style="font-size:12px">${t('admin_render.gpu_idle_face_label')}</span> ${faceStatusHtml}
        </div>
        <button class="btn btn-secondary btn-sm" onclick="saveGpuIdleUnload()">${t('admin_render.save_settings_btn')}</button>
    `;
}

async function saveGpuIdleUnload() {
    const enabled = $('gpu-idle-enabled-input').checked;
    const minutes = parseInt($('gpu-idle-minutes-input').value, 10);
    if (!minutes || minutes < 1) {
        toast(t('admin_render.gpu_idle_invalid_minutes'), 'error');
        return;
    }
    try {
        await API.setGpuIdleUnload(enabled, minutes);
        toast(t('admin_render.gpu_idle_saved_toast'), 'success');
    } catch (e) {
        toast(e.message, 'error');
    }
}

function renderMemoryVideoSettingsPanel(settings, styles, formats) {
    const lang = getLanguage();
    return `
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
            <input type="checkbox" id="memvid-enabled-input" ${settings.enabled ? 'checked' : ''} style="width:auto;margin:0">
            <label for="memvid-enabled-input" class="admin-checkbox-label">${t('admin_render.memvid_enable_label')}</label>
        </div>
        <p class="text-muted admin-field-hint">${t('admin_render.memvid_enable_hint')}</p>
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
            <label for="memvid-style-input" class="text-muted" style="font-size:13px;min-width:70px">${t('admin_render.memvid_style_label')}</label>
            <select id="memvid-style-input" class="gallery-mini-select">
                ${styles.map(s => `<option value="${s.key}" ${s.key === settings.style ? 'selected' : ''}>${escHtml(s['label_' + lang] || s.label_en)}</option>`).join('')}
            </select>
        </div>
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
            <label for="memvid-format-input" class="text-muted" style="font-size:13px;min-width:70px">${t('admin_render.memvid_format_label')}</label>
            <select id="memvid-format-input" class="gallery-mini-select">
                ${formats.map(f => `<option value="${f.key}" ${f.key === settings.format ? 'selected' : ''}>${escHtml(f['label_' + lang] || f.label_en)}</option>`).join('')}
            </select>
        </div>
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
            <input type="checkbox" id="memvid-show-date-input" ${settings.show_date ? 'checked' : ''} style="width:auto;margin:0">
            <label for="memvid-show-date-input" class="admin-checkbox-label">${t('admin_render.memvid_show_date_label')}</label>
        </div>
        <button class="btn btn-secondary btn-sm" onclick="saveMemoryVideoSettings()">${t('admin_render.save_settings_btn')}</button>
    `;
}

async function saveMemoryVideoSettings() {
    try {
        await API.updateMemoryVideoSettings({
            enabled: $('memvid-enabled-input').checked,
            style: $('memvid-style-input').value,
            format: $('memvid-format-input').value,
            show_date: $('memvid-show-date-input').checked,
        });
        toast(t('admin_render.memvid_saved_toast'), 'success');
    } catch (e) {
        toast(e.message, 'error');
    }
}

// Delegated on #page-content (present for the whole admin panel's
// lifetime) rather than re-bound after every renderNetworkStatusPanel()
// call, since that HTML is rebuilt wholesale on every admin poll tick.
document.addEventListener('click', (e) => {
    const btn = e.target.closest('.copy-to-clipboard-btn');
    if (!btn) return;
    navigator.clipboard.writeText(btn.dataset.copyText);
    toast(t('common.copied'), 'success');
});

function renderAuditLogEntries(entries) {
    if (!entries || entries.length === 0) {
        return `<p class="text-muted admin-field-hint">${t('admin_render.audit_log_empty')}</p>`;
    }
    return `<div style="display:flex;flex-direction:column;gap:6px;max-height:280px;overflow-y:auto">` +
        entries.map(e => `
            <div style="font-size:12px;padding:6px 8px;background:var(--bg-tertiary);border-radius:var(--radius-sm)">
                <div style="display:flex;justify-content:space-between;gap:8px">
                    <span style="font-weight:600">${escHtml(e.action)}</span>
                    <span class="text-muted">${formatDate(e.created_at)}</span>
                </div>
                <div class="text-muted">${escHtml(e.actor_email)}${e.target_type ? ` &middot; ${escHtml(e.target_type)}${e.target_id ? ': ' + escHtml(String(e.target_id).slice(0, 8)) : ''}` : ''}</div>
                ${e.detail ? `<div class="text-muted" style="font-family:monospace;font-size:11px">${escHtml(JSON.stringify(e.detail))}</div>` : ''}
            </div>
        `).join('') +
    `</div>`;
}

async function loadMoreAuditLog() {
    auditLogLimit += 20;
    try {
        const data = await API.getAuditLog(1, auditLogLimit);
        $('audit-log-list').innerHTML = renderAuditLogEntries(data.entries);
        const btn = document.querySelector('#admin-tab-system button[onclick="loadMoreAuditLog()"]');
        if (btn && data.entries.length >= data.total) btn.remove();
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

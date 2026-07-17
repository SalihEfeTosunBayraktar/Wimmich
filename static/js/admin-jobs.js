/**
 * Wimmich - Admin: background job list templating and manual job triggers.
 */
registerTranslations({
    en: {
        'admin_jobs.clip_title': 'CLIP Smart Search Indexing',
        'admin_jobs.clip_desc': 'Generating AI semantic search vectors for images',
        'admin_jobs.face_title': 'Face Recognition & Grouping',
        'admin_jobs.face_desc': 'Scanning faces in photos and grouping them into albums',
        'admin_jobs.thumbnail_title': 'Thumbnail Regeneration',
        'admin_jobs.thumbnail_desc': 'Generating preview images in various sizes for all photos',
        'admin_jobs.scan_title': 'Folder Scan',
        'admin_jobs.scan_desc': 'Scanning new and changed files in the archive folder',
        'admin_jobs.cleanup_title': 'Trash Cleanup',
        'admin_jobs.cleanup_desc': 'Permanently deleting files whose retention period in trash has expired',
        'admin_jobs.backup_title': 'Backup',
        'admin_jobs.backup_desc': 'Taking a database snapshot and archiving photos/videos not yet backed up',
        'admin_jobs.similarity_title': 'Similar Photo Matching',
        'admin_jobs.similarity_desc': 'Linking visually similar photos to each other',
        'admin_jobs.unknown_job_title': 'Unknown Job',
        'admin_jobs.unknown_job_desc': 'Running system operation',
        'admin_jobs.status_completed': 'Completed',
        'admin_jobs.status_pending': 'Pending',
        'admin_jobs.status_running': 'Running',
        'admin_jobs.status_failed': 'Failed',
        'admin_jobs.status_cancelled': 'Cancelled',
        'admin_jobs.error_detail_label': 'Error Detail:',
        'admin_jobs.progress_status_label': 'Progress status',
        'admin_jobs.percent_value': '{value}%',
        'admin_jobs.id_label': 'ID:',
        'admin_jobs.created_at_label': 'Created: {date}',
        'admin_jobs.stop_button': 'Cancel',
        'admin_jobs.confirm_cancel_all': 'All pending/running background jobs will be cancelled. Are you sure?',
        'admin_jobs.jobs_cancelled_success': 'Jobs cancelled',
        'admin_jobs.job_started': '{type} job started',
    },
    tr: {
        'admin_jobs.clip_title': 'CLIP Akıllı Arama İndeksleme',
        'admin_jobs.clip_desc': 'Görseller için yapay zeka semantik arama vektörleri oluşturuluyor',
        'admin_jobs.face_title': 'Yüz Tanıma & Gruplama',
        'admin_jobs.face_desc': 'Fotoğraflardaki yüzler taranıyor ve albümler halinde gruplandırılıyor',
        'admin_jobs.thumbnail_title': 'Küçük Resim (Thumbnail) Yenileme',
        'admin_jobs.thumbnail_desc': 'Tüm fotoğraflar için farklı boyutlarda önizleme görselleri oluşturuluyor',
        'admin_jobs.scan_title': 'Klasör Tarama',
        'admin_jobs.scan_desc': 'Arşiv klasöründeki yeni ve değişen dosyalar taranıyor',
        'admin_jobs.cleanup_title': 'Çöp Kutusu Temizliği',
        'admin_jobs.cleanup_desc': 'Çöp kutusunda bekleme süresi dolan dosyalar kalıcı olarak siliniyor',
        'admin_jobs.backup_title': 'Yedekleme',
        'admin_jobs.backup_desc': 'Veritabanı anlık görüntüsü alınıyor ve henüz yedeklenmemiş fotoğraf/videolar arşivleniyor',
        'admin_jobs.similarity_title': 'Benzer Fotoğraf Eşleme',
        'admin_jobs.similarity_desc': 'Görsel olarak birbirine benzeyen fotoğraflar arasında bağlantı kuruluyor',
        'admin_jobs.unknown_job_title': 'Bilinmeyen İş',
        'admin_jobs.unknown_job_desc': 'Sistem işlemi yürütülüyor',
        'admin_jobs.status_completed': 'Tamamlandı',
        'admin_jobs.status_pending': 'Bekliyor',
        'admin_jobs.status_running': 'Çalışıyor',
        'admin_jobs.status_failed': 'Başarısız',
        'admin_jobs.status_cancelled': 'İptal Edildi',
        'admin_jobs.error_detail_label': 'Hata Detayı:',
        'admin_jobs.progress_status_label': 'İşlem durumu',
        'admin_jobs.percent_value': '%{value}',
        'admin_jobs.id_label': 'ID:',
        'admin_jobs.created_at_label': 'Oluşturulma: {date}',
        'admin_jobs.stop_button': 'İptal Et',
        'admin_jobs.confirm_cancel_all': 'Bekleyen/çalışan tüm arka plan işlemleri iptal edilecek. Emin misiniz?',
        'admin_jobs.jobs_cancelled_success': 'İşlemler iptal edildi',
        'admin_jobs.job_started': '{type} işi başlatıldı',
    },
    fr: {
        'admin_jobs.clip_title': 'Indexation de recherche intelligente CLIP',
        'admin_jobs.clip_desc': "Génération de vecteurs de recherche sémantique IA pour les images",
        'admin_jobs.face_title': 'Reconnaissance et regroupement des visages',
        'admin_jobs.face_desc': 'Analyse des visages dans les photos et regroupement en albums',
        'admin_jobs.thumbnail_title': 'Régénération des miniatures',
        'admin_jobs.thumbnail_desc': "Génération d'images d'aperçu de différentes tailles pour toutes les photos",
        'admin_jobs.scan_title': 'Analyse du dossier',
        'admin_jobs.scan_desc': "Analyse des fichiers nouveaux et modifiés dans le dossier d'archive",
        'admin_jobs.cleanup_title': 'Nettoyage de la corbeille',
        'admin_jobs.cleanup_desc': 'Suppression définitive des fichiers dont la période de rétention dans la corbeille a expiré',
        'admin_jobs.backup_title': 'Sauvegarde',
        'admin_jobs.backup_desc': "Capture d'un instantané de la base de données et archivage des photos/vidéos non encore sauvegardées",
        'admin_jobs.similarity_title': 'Correspondance de photos similaires',
        'admin_jobs.similarity_desc': 'Établissement de liens entre les photos visuellement similaires',
        'admin_jobs.unknown_job_title': 'Tâche inconnue',
        'admin_jobs.unknown_job_desc': "Exécution d'une opération système",
        'admin_jobs.status_completed': 'Terminé',
        'admin_jobs.status_pending': 'En attente',
        'admin_jobs.status_running': 'En cours',
        'admin_jobs.status_failed': 'Échoué',
        'admin_jobs.status_cancelled': 'Annulé',
        'admin_jobs.error_detail_label': "Détail de l'erreur :",
        'admin_jobs.progress_status_label': 'État de la progression',
        'admin_jobs.percent_value': '{value} %',
        'admin_jobs.id_label': 'ID :',
        'admin_jobs.created_at_label': 'Créé : {date}',
        'admin_jobs.stop_button': 'Annuler',
        'admin_jobs.confirm_cancel_all': 'Toutes les tâches en arrière-plan en attente/en cours seront annulées. Êtes-vous sûr ?',
        'admin_jobs.jobs_cancelled_success': 'Tâches annulées',
        'admin_jobs.job_started': 'Tâche {type} démarrée',
    },
    de: {
        'admin_jobs.clip_title': 'CLIP Intelligente Suchindizierung',
        'admin_jobs.clip_desc': 'KI-Vektoren für die semantische Suche werden für Bilder erstellt',
        'admin_jobs.face_title': 'Gesichtserkennung & Gruppierung',
        'admin_jobs.face_desc': 'Gesichter in Fotos werden gescannt und in Alben gruppiert',
        'admin_jobs.thumbnail_title': 'Miniaturbild-Erneuerung',
        'admin_jobs.thumbnail_desc': 'Vorschaubilder in verschiedenen Größen werden für alle Fotos erstellt',
        'admin_jobs.scan_title': 'Ordner-Scan',
        'admin_jobs.scan_desc': 'Neue und geänderte Dateien im Archivordner werden gescannt',
        'admin_jobs.cleanup_title': 'Papierkorb-Bereinigung',
        'admin_jobs.cleanup_desc': 'Dateien, deren Aufbewahrungsfrist im Papierkorb abgelaufen ist, werden dauerhaft gelöscht',
        'admin_jobs.backup_title': 'Sicherung',
        'admin_jobs.backup_desc': 'Ein Datenbank-Snapshot wird erstellt und noch nicht gesicherte Fotos/Videos werden archiviert',
        'admin_jobs.similarity_title': 'Ähnliche-Fotos-Abgleich',
        'admin_jobs.similarity_desc': 'Visuell ähnliche Fotos werden miteinander verknüpft',
        'admin_jobs.unknown_job_title': 'Unbekannte Aufgabe',
        'admin_jobs.unknown_job_desc': 'Systemvorgang wird ausgeführt',
        'admin_jobs.status_completed': 'Abgeschlossen',
        'admin_jobs.status_pending': 'Ausstehend',
        'admin_jobs.status_running': 'Wird ausgeführt',
        'admin_jobs.status_failed': 'Fehlgeschlagen',
        'admin_jobs.status_cancelled': 'Abgebrochen',
        'admin_jobs.error_detail_label': 'Fehlerdetail:',
        'admin_jobs.progress_status_label': 'Fortschrittsstatus',
        'admin_jobs.percent_value': '{value}%',
        'admin_jobs.id_label': 'ID:',
        'admin_jobs.created_at_label': 'Erstellt: {date}',
        'admin_jobs.stop_button': 'Abbrechen',
        'admin_jobs.confirm_cancel_all': 'Alle ausstehenden/laufenden Hintergrundaufgaben werden abgebrochen. Sind Sie sicher?',
        'admin_jobs.jobs_cancelled_success': 'Aufgaben abgebrochen',
        'admin_jobs.job_started': 'Aufgabe {type} gestartet',
    },
});

const JOB_TYPE_INFO = {
    CLIP: { title: t('admin_jobs.clip_title'), icon: '🧠', desc: t('admin_jobs.clip_desc') },
    FACE: { title: t('admin_jobs.face_title'), icon: '👤', desc: t('admin_jobs.face_desc') },
    THUMBNAIL: { title: t('admin_jobs.thumbnail_title'), icon: '🖼', desc: t('admin_jobs.thumbnail_desc') },
    SCAN: { title: t('admin_jobs.scan_title'), icon: '🔍', desc: t('admin_jobs.scan_desc') },
    CLEANUP: { title: t('admin_jobs.cleanup_title'), icon: '🧹', desc: t('admin_jobs.cleanup_desc') },
    BACKUP: { title: t('admin_jobs.backup_title'), icon: '💾', desc: t('admin_jobs.backup_desc') },
    SIMILARITY: { title: t('admin_jobs.similarity_title'), icon: '🔗', desc: t('admin_jobs.similarity_desc') },
};

const JOB_STATUS_INFO = {
    COMPLETED: { badgeClass: 'job-status--success', text: t('admin_jobs.status_completed') },
    PENDING: { badgeClass: 'job-status--warning', text: t('admin_jobs.status_pending') },
    RUNNING: { badgeClass: 'job-status--running', text: t('admin_jobs.status_running') },
    FAILED: { badgeClass: 'job-status--danger', text: t('admin_jobs.status_failed') },
    CANCELLED: { badgeClass: 'job-status--warning', text: t('admin_jobs.status_cancelled') },
};

function renderJobList(jobs) {
    return jobs.map(j => {
        const statusInfo = JOB_STATUS_INFO[j.status] || JOB_STATUS_INFO.COMPLETED;
        const typeInfo = JOB_TYPE_INFO[j.type] || { title: j.type || t('admin_jobs.unknown_job_title'), icon: '⚙️', desc: t('admin_jobs.unknown_job_desc') };
        const progress = j.progress || 0;
        const isActive = j.status === 'RUNNING' || j.status === 'PENDING';

        const errorSection = j.error ? `
            <div class="job-card-error">
                <strong>${t('admin_jobs.error_detail_label')}</strong> ${escHtml(j.error)}
            </div>
        ` : '';

        return `
            <div class="job-card">
                <div class="job-card-row">
                    <div>
                        <div class="job-card-title">
                            <span>${typeInfo.icon}</span>
                            <span>${typeInfo.title}</span>
                        </div>
                        <div class="job-card-desc">${typeInfo.desc}</div>
                    </div>
                    <span class="job-status-badge ${statusInfo.badgeClass}">${statusInfo.text}</span>
                </div>

                ${isActive ? `
                    <div class="job-card-progress">
                        <div class="job-card-progress-track">
                            <div class="job-card-progress-fill" style="width:${progress}%"></div>
                        </div>
                        <div class="job-card-progress-label">
                            <span>${t('admin_jobs.progress_status_label')}</span>
                            <span class="job-card-progress-percent">${t('admin_jobs.percent_value', { value: progress })}</span>
                        </div>
                    </div>
                ` : ''}

                ${errorSection}

                <div class="job-card-footer">
                    <span>${t('admin_jobs.id_label')} <code>${j.id.substring(0, 8)}...</code></span>
                    <div style="display:flex; align-items:center; gap:8px">
                        <span>${t('admin_jobs.created_at_label', { date: new Date(j.created_at).toLocaleString(_DATE_LOCALES[getLanguage()]) })}</span>
                        ${isActive ? `<button class="job-card-cancel-btn" onclick="event.stopPropagation(); cancelJob('${j.id}')">${t('admin_jobs.stop_button')}</button>` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

async function runAdminJob(type) {
    try {
        await API.runJob(type);
        toast(t('admin_jobs.job_started', { type }), 'success');
    } catch (e) { toast(e.message, 'error'); }
}

async function cancelAllAdminJobs() {
    if (!confirm(t('admin_jobs.confirm_cancel_all'))) return;
    try {
        const r = await API.cancelAllJobs();
        toast(r.message || t('admin_jobs.jobs_cancelled_success'), 'success');
        pollAdminJobs();
    } catch (e) { toast(e.message, 'error'); }
}

async function shutdownServer() {
    if (!confirm(t('admin_render.confirm_shutdown'))) return;
    toast(t('admin_render.shutting_down_message'), 'success');
    try {
        await API.shutdownServer();
    } catch (e) {
        // The process exits mid-response on a clean shutdown, so the fetch
        // itself failing here is the expected/successful outcome, not an
        // error worth surfacing.
    }
}

async function checkForUpdate() {
    const container = $('update-status-container');
    container.innerHTML = `<p class="text-muted">${t('admin_render.checking_updates_msg')}</p>`;
    try {
        const data = await API.checkForUpdate();
        if (data.error) {
            // Backend-generated message, deliberately left untranslated -
            // same convention as every other e.message/data.message surface.
            container.innerHTML = `<p class="text-muted">${escHtml(data.error)}</p>`;
            return;
        }
        if (!data.available) {
            container.innerHTML = `<p class="text-muted">✅ ${t('admin_render.up_to_date_msg', { commit: data.current_commit || '?' })}</p>`;
            return;
        }
        const changelogHtml = (data.changelog || [])
            .map(line => `<div style="font-size:12px;color:var(--text-secondary)">${escHtml(line)}</div>`)
            .join('');
        container.innerHTML = `
            <p>⬆️ ${t('admin_render.update_available_msg', {
                count: data.commits_behind,
                current: data.current_commit,
                latest: data.latest_commit,
            })}</p>
            <div style="max-height:200px;overflow-y:auto;margin:8px 0;padding:8px;background:var(--bg-tertiary);border-radius:var(--radius-md)">${changelogHtml}</div>
            <button class="btn btn-primary btn-sm" onclick="applyUpdate()">⬆️ ${t('admin_render.apply_update_btn')}</button>
        `;
    } catch (e) {
        container.innerHTML = `<p class="text-muted">${escHtml(e.message)}</p>`;
    }
}

async function applyUpdate() {
    if (!confirm(t('admin_render.confirm_apply_update'))) return;
    toast(t('admin_render.applying_update_msg'), 'success');
    try {
        await API.applyUpdate();
    } catch (e) {
        // Same reasoning as shutdownServer() - a successful update ends
        // with the process exiting, so the fetch failing is expected here
        // too, not necessarily a real error.
    }
}

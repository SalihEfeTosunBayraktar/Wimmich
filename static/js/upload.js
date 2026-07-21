/**
 * Wimmich - Upload modal, drag/drop, and queued multi-batch selection.
 *
 * Mobile photo pickers (Android's system picker especially) cap a single
 * selection at ~100 items - that's an OS limit, not something a web page can
 * lift. Instead we let repeated selections queue onto the same upload run
 * instead of resetting it, so a user can pick 100, then 100 more, etc.
 */
registerTranslations({
    en: {
        'upload.status_uploading': 'Uploading...',
        'upload.queued_toast': '{count} files queued',
        'upload.status_success': 'Uploaded',
        'upload.status_duplicate': 'Duplicate (Already Exists)',
        'upload.status_failed': 'Upload failed',
        'upload.session_expired': 'Session expired, refreshing page',
        'upload.error_generic': 'Upload error',
        'upload.complete': 'Upload complete!',
        'upload.minimize': 'Minimize (keep uploading in the background)',
        'upload.expand': 'Show upload',
        'upload.mini_progress': 'Uploading {done}/{total}',
    },
    tr: {
        'upload.status_uploading': 'Yükleniyor...',
        'upload.queued_toast': '{count} dosya kuyruğa eklendi',
        'upload.status_success': 'Yüklendi',
        'upload.status_duplicate': 'Kopya (Zaten Var)',
        'upload.status_failed': 'Yüklenemedi',
        'upload.session_expired': 'Oturum sona erdi, sayfa yenileniyor',
        'upload.error_generic': 'Yükleme hatası',
        'upload.complete': 'Yükleme tamamlandı!',
        'upload.minimize': 'Küçült (yükleme arka planda devam etsin)',
        'upload.expand': 'Yüklemeyi göster',
        'upload.mini_progress': 'Yükleniyor {done}/{total}',
    },
    fr: {
        'upload.status_uploading': 'Téléversement...',
        'upload.queued_toast': '{count} fichiers mis en file d\'attente',
        'upload.status_success': 'Téléversé',
        'upload.status_duplicate': 'Doublon (déjà existant)',
        'upload.status_failed': 'Échec du téléversement',
        'upload.session_expired': 'Session expirée, actualisation de la page',
        'upload.error_generic': 'Erreur de téléversement',
        'upload.complete': 'Téléversement terminé !',
        'upload.minimize': "Réduire (le téléversement continue en arrière-plan)",
        'upload.expand': 'Afficher le téléversement',
        'upload.mini_progress': 'Téléversement {done}/{total}',
    },
    de: {
        'upload.status_uploading': 'Wird hochgeladen...',
        'upload.queued_toast': '{count} Dateien in die Warteschlange gestellt',
        'upload.status_success': 'Hochgeladen',
        'upload.status_duplicate': 'Duplikat (bereits vorhanden)',
        'upload.status_failed': 'Hochladen fehlgeschlagen',
        'upload.session_expired': 'Sitzung abgelaufen, Seite wird neu geladen',
        'upload.error_generic': 'Hochladefehler',
        'upload.complete': 'Hochladen abgeschlossen!',
        'upload.minimize': 'Minimieren (Upload läuft im Hintergrund weiter)',
        'upload.expand': 'Upload anzeigen',
        'upload.mini_progress': 'Wird hochgeladen {done}/{total}',
    },
});

let uploadQueue = [];
let uploadWorkerRunning = false;
let uploadItemSeq = 0;
let uploadWakeLock = null;

function initUpload() {
    $('upload-btn').onclick = () => restoreUpload();
    $('upload-modal-close').onclick = () => $('upload-modal').classList.add('hidden');
    $('upload-modal-minimize').onclick = () => minimizeUpload();
    // Clicking the modal backdrop minimizes instead of closing, so an
    // in-progress upload isn't accidentally hidden with no way back to it -
    // the mini widget keeps it reachable. With nothing uploading it just
    // closes as before.
    $('upload-modal').onclick = (e) => {
        if (e.target !== $('upload-modal')) return;
        if (uploadWorkerRunning || uploadQueue.length > 0) minimizeUpload();
        else $('upload-modal').classList.add('hidden');
    };
    $('upload-mini').onclick = () => restoreUpload();

    const dz = $('upload-dropzone');
    const fi = $('file-input');

    fi.onchange = (e) => { queueUploadFiles(e.target.files); fi.value = ''; };

    dz.ondragover = (e) => { e.preventDefault(); dz.classList.add('dragover'); };
    dz.ondragleave = () => dz.classList.remove('dragover');
    dz.ondrop = (e) => { e.preventDefault(); dz.classList.remove('dragover'); queueUploadFiles(e.dataTransfer.files); };

    // Also allow drag on page-content
    const pc = $('page-content');
    pc.ondragover = (e) => { e.preventDefault(); $('upload-modal').classList.remove('hidden'); dz.classList.add('dragover'); };

    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && uploadWorkerRunning) acquireWakeLock();
    });
}

async function acquireWakeLock() {
    if (!('wakeLock' in navigator)) return;
    try {
        uploadWakeLock = await navigator.wakeLock.request('screen');
    } catch (e) {
        uploadWakeLock = null; // e.g. battery saver mode - not fatal, upload continues
    }
}

async function releaseWakeLock() {
    if (uploadWakeLock) {
        try { await uploadWakeLock.release(); } catch (e) { /* already released */ }
        uploadWakeLock = null;
    }
}

function queueUploadFiles(fileList) {
    const files = Array.from(fileList);
    if (!files.length) return;

    $('upload-dropzone').classList.add('hidden');
    $('upload-progress').classList.remove('hidden');

    const list = $('upload-list');
    const wasEmpty = uploadQueue.length === 0 && !uploadWorkerRunning;
    if (wasEmpty) list.innerHTML = '';

    files.forEach((f) => {
        const idx = uploadItemSeq++;
        const div = document.createElement('div');
        div.className = 'upload-item';
        div.id = `upload-item-${idx}`;
        div.innerHTML = `<span class="upload-item-name">${escHtml(f.name)}</span><span class="upload-item-status uploading">${t('upload.status_uploading')}</span>`;
        list.appendChild(div);
        uploadQueue.push({ file: f, idx });
    });

    if (uploadWorkerRunning) {
        toast(t('upload.queued_toast', { count: files.length }), 'info');
    } else {
        runUploadWorker();
    }
}

function setUploadItemStatus(idx, status, errorMsg) {
    const el = $(`upload-item-${idx}`);
    if (!el) return;
    const st = el.querySelector('.upload-item-status');
    if (status === 'success') {
        st.textContent = `✓ ${t('upload.status_success')}`;
        st.className = 'upload-item-status success';
    } else if (status === 'duplicate') {
        st.textContent = `✓ ${t('upload.status_duplicate')}`;
        st.className = 'upload-item-status success upload-item-status--duplicate';
    } else {
        st.textContent = `✗ ${t('common.error_prefix')}${errorMsg || t('upload.status_failed')}`;
        st.className = 'upload-item-status error';
    }
    updateUploadMiniProgress();
}

function minimizeUpload() {
    $('upload-modal').classList.add('hidden');
    $('upload-mini').classList.remove('hidden');
    updateUploadMiniProgress();
}

function restoreUpload() {
    $('upload-mini').classList.add('hidden');
    $('upload-modal').classList.remove('hidden');
}

// Keeps the collapsed pill's "uploading X/Y" text current. Counts done vs
// total from the upload-list item statuses (an item still showing the
// "uploading" class is not yet done), so it reflects the real queue state
// without a separate counter to keep in sync.
function updateUploadMiniProgress() {
    const mini = $('upload-mini-text');
    if (!mini) return;
    const items = document.querySelectorAll('#upload-list .upload-item-status');
    const total = items.length;
    let done = 0;
    items.forEach(s => { if (!s.classList.contains('uploading')) done++; });
    mini.textContent = t('upload.mini_progress', { done, total });
}

// A checksum mismatch or truncated-write error (see UploadIntegrityError,
// media_service.py) means the transfer itself was the problem, not the
// file or the account - worth a couple of automatic retries (flaky mobile
// network mid-backup is exactly the case this exists for) before making
// the user do it manually.
const MAX_UPLOAD_RETRIES = 2;

async function runUploadWorker() {
    uploadWorkerRunning = true;
    await acquireWakeLock();

    while (uploadQueue.length > 0) {
        const { file, idx, retries = 0 } = uploadQueue.shift();
        try {
            const r = await API.uploadFile(file);
            if (!r) {
                setUploadItemStatus(idx, 'error', t('upload.session_expired'));
                break; // API.request() is already reloading the page on 401
            } else if (r.errors && r.errors.length > 0) {
                const err = r.errors[0];
                if (err.retryable && retries < MAX_UPLOAD_RETRIES) {
                    uploadQueue.unshift({ file, idx, retries: retries + 1 });
                    continue;
                }
                setUploadItemStatus(idx, 'error', err.error || t('upload.error_generic'));
            } else if (r.results && r.results[0] && r.results[0].status === 'duplicate') {
                setUploadItemStatus(idx, 'duplicate');
            } else {
                setUploadItemStatus(idx, 'success');
            }
        } catch (e) {
            setUploadItemStatus(idx, 'error', e.message);
        }
    }

    uploadWorkerRunning = false;
    await releaseWakeLock();
    toast(t('upload.complete'), 'success');

    // Queue follow-up processing (CLIP/face/geocode/transcode) ONCE for the
    // whole batch now that every file is uploaded, instead of a job per
    // file. Only reached when the queue is fully drained, so all the
    // batch's assets exist before this runs - the single bulk job each
    // handler creates then picks up exactly them.
    try {
        await API.queuePendingProcessing();
    } catch (e) {
        console.error('Error queuing post-upload processing:', e);
    }

    try {
        state.user = await API.getMe();
        updateSidebarStorage();
    } catch (e) {
        console.error('Error updating storage:', e);
    }

    setTimeout(() => {
        if (uploadWorkerRunning || uploadQueue.length > 0) return; // more got queued meanwhile
        $('upload-modal').classList.add('hidden');
        $('upload-mini').classList.add('hidden'); // the batch is done - dismiss the collapsed pill too
        $('upload-dropzone').classList.remove('hidden');
        $('upload-progress').classList.add('hidden');
        uploadItemSeq = 0;
        if (state.currentPage === 'gallery') renderGallery();
    }, 1500);
}

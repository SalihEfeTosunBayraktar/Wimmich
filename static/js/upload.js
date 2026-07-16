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
    },
});

let uploadQueue = [];
let uploadWorkerRunning = false;
let uploadItemSeq = 0;
let uploadWakeLock = null;

function initUpload() {
    $('upload-btn').onclick = () => $('upload-modal').classList.remove('hidden');
    $('upload-modal-close').onclick = () => $('upload-modal').classList.add('hidden');
    $('upload-modal').onclick = (e) => { if (e.target === $('upload-modal')) $('upload-modal').classList.add('hidden'); };

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
}

async function runUploadWorker() {
    uploadWorkerRunning = true;
    await acquireWakeLock();

    while (uploadQueue.length > 0) {
        const { file, idx } = uploadQueue.shift();
        try {
            const r = await API.uploadFile(file);
            if (!r) {
                setUploadItemStatus(idx, 'error', t('upload.session_expired'));
                break; // API.request() is already reloading the page on 401
            } else if (r.errors && r.errors.length > 0) {
                setUploadItemStatus(idx, 'error', r.errors[0].error || t('upload.error_generic'));
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

    try {
        state.user = await API.getMe();
        updateSidebarStorage();
    } catch (e) {
        console.error('Error updating storage:', e);
    }

    setTimeout(() => {
        if (uploadWorkerRunning || uploadQueue.length > 0) return; // more got queued meanwhile
        $('upload-modal').classList.add('hidden');
        $('upload-dropzone').classList.remove('hidden');
        $('upload-progress').classList.add('hidden');
        uploadItemSeq = 0;
        if (state.currentPage === 'gallery') renderGallery();
    }, 1500);
}

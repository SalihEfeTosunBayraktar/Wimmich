/**
 * Wimmich - Duplicate-detection page event wiring (filters, cleanup actions).
 */
registerTranslations({
    en: {
        'duplicates_actions.group_skipped': 'Group skipped, files kept.',
        'duplicates_actions.confirm_delete_all_in_group': 'ALL {count} file(s) in this group (none kept) will be moved to trash. Confirm?',
        'duplicates_actions.no_duplicates_to_clean': 'No duplicates found to clean up.',
        'duplicates_actions.confirm_clean_all': 'The best-quality file will be kept in all {groups} duplicate group(s), and the other {count} duplicate file(s) will be moved to trash. Start this operation?',
        'duplicates_actions.cleaned_success': '{count} duplicate file(s) moved to trash.',
        'duplicates_actions.starting': 'Starting...',
        'duplicates_actions.scan_error_prefix': 'Scan error: ',
        'duplicates_actions.scanning_progress': 'Scanning... {progress}%',
        'duplicates_actions.scan_completed': 'Duplicate scan completed.',
        'duplicates_actions.scan_failed_prefix': 'Scan failed: ',
        'duplicates_actions.scan_status_check_failed_prefix': 'Could not check scan status: ',
    },
    tr: {
        'duplicates_actions.group_skipped': 'Grup atlandı, dosyalar korundu.',
        'duplicates_actions.confirm_delete_all_in_group': 'Bu gruptaki {count} dosyanın TAMAMI (hiçbiri korunmadan) çöpe atılacak. Onaylıyor musunuz?',
        'duplicates_actions.no_duplicates_to_clean': 'Temizlenecek kopya bulunamadı.',
        'duplicates_actions.confirm_clean_all': 'Tüm {groups} kopya grubunda en kaliteli dosyalar korunacak ve diğer {count} kopya dosya çöpe atılacak. Bu işlemi başlatmak istiyor musunuz?',
        'duplicates_actions.cleaned_success': '{count} kopya dosya çöpe atıldı.',
        'duplicates_actions.starting': 'Başlatılıyor...',
        'duplicates_actions.scan_error_prefix': 'Tarama hatası: ',
        'duplicates_actions.scanning_progress': 'Taranıyor... {progress}%',
        'duplicates_actions.scan_completed': 'Kopya taraması tamamlandı.',
        'duplicates_actions.scan_failed_prefix': 'Tarama başarısız: ',
        'duplicates_actions.scan_status_check_failed_prefix': 'Tarama durumu kontrol edilemedi: ',
    },
    fr: {
        'duplicates_actions.group_skipped': 'Groupe ignoré, fichiers conservés.',
        'duplicates_actions.confirm_delete_all_in_group': 'TOUS les {count} fichier(s) de ce groupe (aucun conservé) seront déplacés vers la corbeille. Confirmer ?',
        'duplicates_actions.no_duplicates_to_clean': 'Aucun doublon à nettoyer.',
        'duplicates_actions.confirm_clean_all': "Le fichier de meilleure qualité sera conservé dans les {groups} groupe(s) de doublons, et les {count} autre(s) fichier(s) en double seront déplacés vers la corbeille. Démarrer cette opération ?",
        'duplicates_actions.cleaned_success': '{count} fichier(s) en double déplacé(s) vers la corbeille.',
        'duplicates_actions.starting': 'Démarrage...',
        'duplicates_actions.scan_error_prefix': "Erreur d'analyse : ",
        'duplicates_actions.scanning_progress': 'Analyse en cours... {progress}%',
        'duplicates_actions.scan_completed': 'Analyse des doublons terminée.',
        'duplicates_actions.scan_failed_prefix': "Échec de l'analyse : ",
        'duplicates_actions.scan_status_check_failed_prefix': "Impossible de vérifier l'état de l'analyse : ",
    },
    de: {
        'duplicates_actions.group_skipped': 'Gruppe übersprungen, Dateien behalten.',
        'duplicates_actions.confirm_delete_all_in_group': 'ALLE {count} Datei(en) in dieser Gruppe (keine wird behalten) werden in den Papierkorb verschoben. Bestätigen?',
        'duplicates_actions.no_duplicates_to_clean': 'Keine Duplikate zum Bereinigen gefunden.',
        'duplicates_actions.confirm_clean_all': 'In allen {groups} Duplikatgruppen wird die beste Datei behalten, die anderen {count} Duplikatdateien werden in den Papierkorb verschoben. Diesen Vorgang starten?',
        'duplicates_actions.cleaned_success': '{count} Duplikatdatei(en) in den Papierkorb verschoben.',
        'duplicates_actions.starting': 'Wird gestartet...',
        'duplicates_actions.scan_error_prefix': 'Scanfehler: ',
        'duplicates_actions.scanning_progress': 'Scanne... {progress}%',
        'duplicates_actions.scan_completed': 'Duplikatscan abgeschlossen.',
        'duplicates_actions.scan_failed_prefix': 'Scan fehlgeschlagen: ',
        'duplicates_actions.scan_status_check_failed_prefix': 'Scan-Status konnte nicht geprüft werden: ',
    },
});

function bindDupFilters() {
    const sortBy = $('dup-sort-by');
    const fileType = $('dup-file-type');
    const locationInput = $('dup-location');

    qsa('.dup-mode-tab').forEach(tab => {
        tab.onclick = () => {
            if (tab.dataset.mode === state.dupFilters.mode) return;
            state.dupFilters.mode = tab.dataset.mode;
            renderDuplicates();
        };
    });

    if (sortBy) {
        sortBy.onchange = () => {
            state.dupFilters.sortBy = sortBy.value;
            renderDuplicates();
        };
    }
    if (fileType) {
        fileType.onchange = () => {
            state.dupFilters.fileType = fileType.value;
            renderDuplicates();
        };
    }
    if (locationInput) {
        let t;
        locationInput.oninput = () => {
            clearTimeout(t);
            t = setTimeout(() => {
                state.dupFilters.location = locationInput.value;
                renderDuplicates();
            }, DUP_LOCATION_DEBOUNCE_MS);
        };
    }
}

function _hasRealLocation(asset) {
    const lat = asset.latitude, lon = asset.longitude;
    if (lat == null || lon == null) return false;
    // (0,0) - "Null Island" - is what a missing/zeroed-out GPS EXIF field
    // looks like, not a real location; reverse-geocoding lands it on
    // Takoradi, Ghana (the nearest coastline), which reads as real data
    // unless you know to distinguish it from an actual GPS fix there.
    if (Math.abs(lat) < 0.01 && Math.abs(lon) < 0.01) return false;
    return true;
}

function _bestQualityFirst(assets) {
    // Resolution first, then real location data as a tie-breaker (between
    // two copies of equal resolution, prefer the one with a genuine GPS
    // fix over one with none), then file size as the final tie-breaker
    // (usually means less lossy recompression at the same resolution) -
    // taken_at/created_at isn't a reliable "which one is the real
    // original" signal (EXIF can be missing or wrong, an import can shift
    // it), but resolution/location/size are read straight off the actual
    // file, so this keeps the actual best copy instead of the oldest.
    return [...assets].sort((a, b) => {
        const resA = (a.width || 0) * (a.height || 0);
        const resB = (b.width || 0) * (b.height || 0);
        if (resB !== resA) return resB - resA;

        const locA = _hasRealLocation(a) ? 1 : 0;
        const locB = _hasRealLocation(b) ? 1 : 0;
        if (locB !== locA) return locB - locA;
        return (b.file_size || 0) - (a.file_size || 0);
    });
}

function _sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

// Flashes a red "deleted" layer + X over each removed card, holds it a
// moment, then shrinks the cards away and drops them from the DOM - no
// full-page reload needed per click, which is what made reviewing many
// groups in a row (previously: full renderDuplicates() every time) feel
// slow and jumpy. A group left with 0-1 photos isn't a "duplicate" of
// anything anymore, so its container collapses along with them.
async function _animateAssetRemoval(assetIds) {
    const cards = assetIds.map(id => qs(`.dup-asset-card[data-id="${id}"]`)).filter(Boolean);
    if (!cards.length) return;

    cards.forEach(c => c.classList.add('dup-deleting'));
    await _sleep(DUP_DELETE_FLASH_MS);
    cards.forEach(c => c.classList.add('dup-removed'));
    await _sleep(DUP_DELETE_FADE_MS);

    const touchedGroups = new Set();
    cards.forEach(c => {
        const group = c.closest('.dup-group-container');
        if (group) touchedGroups.add(group);
        c.remove();
    });

    touchedGroups.forEach(group => {
        if (group.querySelectorAll('.dup-asset-card').length <= 1) {
            group.classList.add('dup-removed');
            setTimeout(() => group.remove(), DUP_DELETE_FADE_MS);
        }
    });

    if (!qs('.dup-group-container')) {
        setTimeout(renderDuplicates, DUP_DELETE_FADE_MS);
    }
}

function bindDupActions(groups) {
    // Clicking a thumbnail never set state.viewerList/viewerIndex at all
    // (unlike the shared photo-card grids), so the fullscreen viewer's
    // arrow-key navigation had nothing to move between and looked broken.
    qsa('.dup-asset-thumb').forEach(thumb => {
        thumb.onclick = () => {
            const group = groups.find(g => g.assets.some(a => a.id === thumb.dataset.id));
            const siblings = group ? group.assets.map(a => a.id) : [thumb.dataset.id];
            state.viewerList = siblings;
            state.viewerIndex = siblings.indexOf(thumb.dataset.id);
            openViewer(thumb.dataset.id);
        };
    });

    // No confirm() here: this (and .btn-group-auto-clean below) is meant
    // to be clicked over and over while working through many groups, and
    // it only ever moves a file to Trash (recoverable), not a hard delete
    // - a dialog on every single click made that review flow unusable.
    qsa('.btn-trash-dup').forEach(btn => {
        btn.onclick = async () => {
            try {
                await API.bulkAction([btn.dataset.id], 'delete');
                await _animateAssetRemoval([btn.dataset.id]);
            } catch (e) {
                toast(t('common.error_prefix') + e.message, 'error');
            }
        };
    });

    qsa('.btn-group-skip').forEach(btn => {
        btn.onclick = async () => {
            try {
                if (btn.dataset.assetIds) {
                    await API.ignoreVisualDuplicateGroup(btn.dataset.assetIds.split(','));
                } else {
                    await API.ignoreDuplicateGroup(btn.dataset.checksum);
                }
                toast(t('duplicates_actions.group_skipped'), 'success');
                renderDuplicates();
            } catch (e) {
                toast(t('common.error_prefix') + e.message, 'error');
            }
        };
    });

    qsa('.btn-group-auto-clean').forEach(btn => {
        btn.onclick = async () => {
            const checksum = btn.dataset.checksum;
            const group = groups.find(g => g.checksum === checksum);
            if (!group) return;

            const sortedAssets = _bestQualityFirst(group.assets);
            const toDelete = sortedAssets.slice(1).map(a => a.id);

            try {
                await API.bulkAction(toDelete, 'delete');
                await _animateAssetRemoval(toDelete);
            } catch (e) {
                toast(t('common.error_prefix') + e.message, 'error');
            }
        };
    });

    qsa('.btn-group-delete-all').forEach(btn => {
        btn.onclick = async () => {
            const checksum = btn.dataset.checksum;
            const group = groups.find(g => g.checksum === checksum);
            if (!group) return;

            const toDelete = group.assets.map(a => a.id);
            if (!confirm(t('duplicates_actions.confirm_delete_all_in_group', { count: toDelete.length }))) return;

            try {
                await API.bulkAction(toDelete, 'delete');
                await _animateAssetRemoval(toDelete);
            } catch (e) {
                toast(t('common.error_prefix') + e.message, 'error');
            }
        };
    });

    const cleanAllBtn = $('dup-auto-clean-all');
    if (cleanAllBtn) {
        cleanAllBtn.onclick = async () => {
            let totalToDelete = [];
            let totalCleanedGroups = 0;

            for (const group of groups) {
                const toDelete = _bestQualityFirst(group.assets).slice(1).map(a => a.id);
                if (toDelete.length > 0) {
                    totalToDelete.push(...toDelete);
                    totalCleanedGroups++;
                }
            }

            if (totalToDelete.length === 0) {
                toast(t('duplicates_actions.no_duplicates_to_clean'), 'info');
                return;
            }

            if (!confirm(t('duplicates_actions.confirm_clean_all', { groups: totalCleanedGroups, count: totalToDelete.length }))) return;

            try {
                await API.bulkAction(totalToDelete, 'delete');
                await _animateAssetRemoval(totalToDelete);
                toast(t('duplicates_actions.cleaned_success', { count: totalToDelete.length }), 'success');
            } catch (e) {
                toast(t('common.error_prefix') + e.message, 'error');
            }
        };
    }

    const slideshowBtn = $('dup-slideshow-start');
    if (slideshowBtn) {
        slideshowBtn.onclick = () => startDupSlideshow(groups);
    }

    const scanTriggerBtn = $('dup-scan-trigger');
    if (scanTriggerBtn) {
        scanTriggerBtn.onclick = async () => {
            scanTriggerBtn.disabled = true;
            const originalHtml = scanTriggerBtn.innerHTML;
            scanTriggerBtn.innerHTML = `<span>⏳</span> ${t('duplicates_actions.starting')}`;
            try {
                const r = await API.scanDuplicates();
                _pollDupScanProgress(r.job_id, scanTriggerBtn, originalHtml);
            } catch (e) {
                toast(t('duplicates_actions.scan_error_prefix') + e.message, 'error');
                scanTriggerBtn.disabled = false;
                scanTriggerBtn.innerHTML = originalHtml;
            }
        };
    }
}

// Checksum backfill (the scan trigger) runs as a real background job now,
// so this polls it for real progress instead of leaving the button saying
// "scanning..." with zero feedback until one opaque response comes back.
function _pollDupScanProgress(jobId, btn, originalHtml) {
    const interval = setInterval(async () => {
        try {
            // There's no single-job-by-id endpoint - list admin jobs and
            // pick this one out (this previously called a
            // getImportStatus()/"/api/import/status/{id}" route that never
            // existed on the backend, so every poll tick threw, was
            // silently swallowed below, and the button just reset with no
            // feedback at all - this is the fix for that).
            const data = await API.getJobs();
            const job = data.jobs.find(j => j.id === jobId);
            if (!job) {
                clearInterval(interval);
                btn.disabled = false;
                btn.innerHTML = originalHtml;
                return;
            }
            btn.innerHTML = `<span>⏳</span> ${t('duplicates_actions.scanning_progress', { progress: job.progress })}`;

            if (job.status === 'COMPLETED' || job.status === 'FAILED' || job.status === 'CANCELLED') {
                clearInterval(interval);
                btn.disabled = false;
                btn.innerHTML = originalHtml;
                if (job.status === 'COMPLETED') {
                    toast(t('duplicates_actions.scan_completed'), 'success');
                    renderDuplicates();
                } else if (job.status === 'FAILED') {
                    toast(t('duplicates_actions.scan_failed_prefix') + (job.error || ''), 'error');
                }
            }
        } catch (e) {
            clearInterval(interval);
            btn.disabled = false;
            btn.innerHTML = originalHtml;
            toast(t('duplicates_actions.scan_status_check_failed_prefix') + e.message, 'error');
        }
    }, IMPORT_POLL_INTERVAL_MS);
}

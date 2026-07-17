/**
 * Wimmich - Duplicate cleanup slideshow: walks through duplicate groups one
 * at a time with a short countdown per group (DUP_SLIDESHOW_SECONDS). Left
 * alone, the countdown runs out and the current keep/delete selection
 * applies automatically (best-quality copy kept by default); "Atla"/"Tümünü
 * Sil" short-circuit the wait and act immediately. Clicking a photo picks
 * it as the one to keep (the rest of the group switches to delete); groups
 * with more than two photos also get a small per-card toggle for keeping
 * several at once. Either way it auto-advances to the next group, so a full
 * pass through many groups needs no repeated clicking.
 */
registerTranslations({
    en: {
        'duplicates_slideshow.no_groups': 'No duplicate groups for the slideshow.',
        'duplicates_slideshow.skip': 'Skip (Delete None)',
        'duplicates_slideshow.delete_all': 'Delete All',
        'duplicates_slideshow.apply_continue': 'Apply & Continue',
        'duplicates_slideshow.tag_keep': 'Keep',
        'duplicates_slideshow.tag_delete': 'Delete',
        'duplicates_slideshow.toggle_keep_title': 'Add/remove from the keep selection',
        'duplicates_slideshow.finished': 'Slideshow complete.',
    },
    tr: {
        'duplicates_slideshow.no_groups': 'Slayt için kopya grubu yok.',
        'duplicates_slideshow.skip': 'Atla (Hiçbirini Silme)',
        'duplicates_slideshow.delete_all': 'Tümünü Sil',
        'duplicates_slideshow.apply_continue': 'Uygula ve Devam Et',
        'duplicates_slideshow.tag_keep': 'Korunacak',
        'duplicates_slideshow.tag_delete': 'Silinecek',
        'duplicates_slideshow.toggle_keep_title': 'Korunacaklara ekle/çıkar',
        'duplicates_slideshow.finished': 'Slayt tamamlandı.',
    },
    fr: {
        'duplicates_slideshow.no_groups': 'Aucun groupe de doublons pour le diaporama.',
        'duplicates_slideshow.skip': 'Passer (ne rien supprimer)',
        'duplicates_slideshow.delete_all': 'Tout supprimer',
        'duplicates_slideshow.apply_continue': 'Appliquer et continuer',
        'duplicates_slideshow.tag_keep': 'À conserver',
        'duplicates_slideshow.tag_delete': 'À supprimer',
        'duplicates_slideshow.toggle_keep_title': 'Ajouter/retirer de la sélection à conserver',
        'duplicates_slideshow.finished': 'Diaporama terminé.',
    },
    de: {
        'duplicates_slideshow.no_groups': 'Keine Duplikatgruppen für die Diashow.',
        'duplicates_slideshow.skip': 'Überspringen (nichts löschen)',
        'duplicates_slideshow.delete_all': 'Alle löschen',
        'duplicates_slideshow.apply_continue': 'Anwenden und fortfahren',
        'duplicates_slideshow.tag_keep': 'Wird behalten',
        'duplicates_slideshow.tag_delete': 'Wird gelöscht',
        'duplicates_slideshow.toggle_keep_title': 'Zur Behalten-Auswahl hinzufügen/entfernen',
        'duplicates_slideshow.finished': 'Diashow abgeschlossen.',
    },
});

const DUP_SLIDESHOW_SECONDS = 3.75;

let _dupSlideshowState = null; // { groups, index, timeoutId, cancelled, advancing, keepIds, multiAllowed }

function startDupSlideshow(groups) {
    if (!groups.length) {
        toast(t('duplicates_slideshow.no_groups'), 'info');
        return;
    }

    _dupSlideshowState = { groups, index: 0, timeoutId: null, cancelled: false, keepIds: null, multiAllowed: false };

    const overlay = document.createElement('div');
    overlay.className = 'dup-slideshow-overlay';
    overlay.id = 'dup-slideshow-overlay';
    overlay.innerHTML = `
        <div class="dup-slideshow-header">
            <span class="dup-slideshow-progress" id="dup-slideshow-progress"></span>
            <button class="btn-icon" id="dup-slideshow-close" title="${t('common.close')}">✕</button>
        </div>
        <div class="dup-slideshow-timerbar"><div class="dup-slideshow-timerbar-fill" id="dup-slideshow-timerbar-fill"></div></div>
        <div class="dup-slideshow-stage" id="dup-slideshow-stage"></div>
        <div class="dup-slideshow-actions">
            <button class="btn btn-secondary" id="dup-slideshow-skip">⏭ ${t('duplicates_slideshow.skip')}</button>
            <button class="btn btn-primary" id="dup-slideshow-apply">✓ ${t('duplicates_slideshow.apply_continue')}</button>
            <button class="btn btn-danger" id="dup-slideshow-delete-all">🗑 ${t('duplicates_slideshow.delete_all')}</button>
        </div>
    `;
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    $('dup-slideshow-close').onclick = () => _closeDupSlideshow(false);
    $('dup-slideshow-skip').onclick = () => _dupSlideshowAdvance('skip');
    $('dup-slideshow-apply').onclick = () => _dupSlideshowAdvance('apply');
    $('dup-slideshow-delete-all').onclick = () => _dupSlideshowAdvance('delete_all');

    document.addEventListener('keydown', _dupSlideshowKeyHandler);

    _renderDupSlideshowStep();
}

function _dupSlideshowKeyHandler(e) {
    if (!_dupSlideshowState) return;
    if (e.key === 'Escape') _closeDupSlideshow(false);
}

function _renderDupSlideshowStep() {
    const st = _dupSlideshowState;
    if (!st || st.cancelled) return;

    if (st.index >= st.groups.length) {
        _closeDupSlideshow(true);
        return;
    }

    const group = st.groups[st.index];
    const sorted = _bestQualityFirst(group.assets);
    // Defaults to the same "best copy survives" choice the old fixed
    // logic used - clicking a card is what changes it from here.
    st.keepIds = new Set([sorted[0].id]);
    st.multiAllowed = group.assets.length > 2;

    $('dup-slideshow-progress').textContent = `${st.index + 1} / ${st.groups.length}`;
    _refreshDupSlideshowCards(group);
    _startDupSlideshowTimer();
}

function _refreshDupSlideshowCards(group) {
    $('dup-slideshow-stage').innerHTML = group.assets.map(a => _renderDupSlideshowCard(a)).join('');
}

function _renderDupSlideshowCard(asset) {
    const st = _dupSlideshowState;
    const isKeep = st.keepIds.has(asset.id);
    return `
        <div class="dup-slideshow-card ${isKeep ? 'dup-slideshow-card--keep' : 'dup-slideshow-card--delete'}" onclick="_dupSlideshowCardClick('${asset.id}', event)">
            <img src="${API.getThumb(asset.id, 'medium')}" alt="" onerror="this.onerror=null;this.src='/static/broken-file.png'">
            ${st.multiAllowed ? `
                <button type="button" class="dup-slideshow-card-multi" onclick="_dupSlideshowCardToggle('${asset.id}', event)" title="${t('duplicates_slideshow.toggle_keep_title')}">${isKeep ? '✓' : ''}</button>
            ` : ''}
            <span class="dup-slideshow-card-tag ${isKeep ? 'dup-slideshow-card-tag--keep' : 'dup-slideshow-card-tag--delete'}">${isKeep ? '✓ ' + t('duplicates_slideshow.tag_keep') : '✕ ' + t('duplicates_slideshow.tag_delete')}</span>
        </div>
    `;
}

function _dupSlideshowCardClick(assetId, event) {
    // The dedicated multi-select toggle button has its own handler with
    // different semantics (add/remove vs. replace) - let it handle its own
    // clicks instead of also triggering the single-select swap here.
    if (event && event.target.closest('.dup-slideshow-card-multi')) return;
    const st = _dupSlideshowState;
    if (!st) return;
    st.keepIds = new Set([assetId]);
    _pauseDupSlideshowTimer();
    _refreshDupSlideshowCards(st.groups[st.index]);
}

function _dupSlideshowCardToggle(assetId, event) {
    event.stopPropagation();
    const st = _dupSlideshowState;
    if (!st) return;
    if (st.keepIds.has(assetId)) {
        // Always leave at least one photo marked to keep per group.
        if (st.keepIds.size > 1) st.keepIds.delete(assetId);
    } else {
        st.keepIds.add(assetId);
    }
    _pauseDupSlideshowTimer();
    _refreshDupSlideshowCards(st.groups[st.index]);
}

function _startDupSlideshowTimer() {
    const st = _dupSlideshowState;
    // Restart the shrinking bar from 100% each step: flip transition off,
    // snap back to full width, force a reflow so the browser registers
    // that as the starting point, then turn the transition back on and
    // set the 0% target - without the forced reflow the browser would
    // just skip straight to the end state instead of animating.
    const fill = $('dup-slideshow-timerbar-fill');
    fill.style.transition = 'none';
    fill.style.width = '100%';
    void fill.offsetWidth;
    fill.style.transition = `width ${DUP_SLIDESHOW_SECONDS}s linear`;
    fill.style.width = '0%';

    st.timeoutId = setTimeout(() => _dupSlideshowAdvance('timeout'), DUP_SLIDESHOW_SECONDS * 1000);
}

function _pauseDupSlideshowTimer() {
    const st = _dupSlideshowState;
    if (!st) return;
    clearTimeout(st.timeoutId);
    st.timeoutId = null;
    const fill = $('dup-slideshow-timerbar-fill');
    if (!fill) return;
    // Freeze the bar exactly where the countdown was interrupted, rather
    // than letting its still-running CSS transition keep animating toward
    // 0% after the JS timer that matched it has already been cancelled.
    const current = getComputedStyle(fill).width;
    fill.style.transition = 'none';
    fill.style.width = current;
}

async function _dupSlideshowAdvance(action) {
    const st = _dupSlideshowState;
    // advancing guards against a click landing while the previous advance's
    // bulkAction is still in flight (e.g. a fast double-click, or a click
    // arriving just as the timeout also fires) - without it two concurrent
    // calls could each increment st.index once, silently skipping a group.
    if (!st || st.cancelled || st.advancing) return;
    st.advancing = true;
    clearTimeout(st.timeoutId);

    const group = st.groups[st.index];

    try {
        if (action === 'delete_all') {
            await API.bulkAction(group.assets.map(a => a.id), 'delete');
        } else if (action === 'timeout' || action === 'apply') {
            // Whatever's currently marked to keep - the default best-quality
            // pick if the user never touched this group, or their own
            // single/multi selection if they clicked a card.
            const toDelete = group.assets.filter(a => !st.keepIds.has(a.id)).map(a => a.id);
            if (toDelete.length) await API.bulkAction(toDelete, 'delete');
        }
        // 'skip' deletes nothing - the group is left exactly as it was.
    } catch (e) {
        toast(t('common.error_prefix') + e.message, 'error');
    }

    st.index++;
    st.advancing = false;
    _renderDupSlideshowStep();
}

function _closeDupSlideshow(finished) {
    const st = _dupSlideshowState;
    if (st) {
        st.cancelled = true;
        clearTimeout(st.timeoutId);
    }
    document.removeEventListener('keydown', _dupSlideshowKeyHandler);

    const overlay = $('dup-slideshow-overlay');
    if (overlay) overlay.remove();
    document.body.style.overflow = '';
    _dupSlideshowState = null;

    if (finished) toast(t('duplicates_slideshow.finished'), 'success');
    renderDuplicates();
}

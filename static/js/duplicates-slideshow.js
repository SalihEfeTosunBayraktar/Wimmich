/**
 * Wimmich - Duplicate cleanup slideshow: walks through duplicate groups one
 * at a time with a short countdown per group (DUP_SLIDESHOW_SECONDS). Left
 * alone, the countdown runs out and the default (keep the best-quality
 * copy, trash the rest) applies
 * automatically; "Atla"/"Tümünü Sil" short-circuit the wait and act
 * immediately. Either way it auto-advances to the next group, so a full
 * pass through many groups needs no repeated clicking.
 */
registerTranslations({
    en: {
        'duplicates_slideshow.no_groups': 'No duplicate groups for the slideshow.',
        'duplicates_slideshow.skip': 'Skip (Delete None)',
        'duplicates_slideshow.delete_all': 'Delete All',
        'duplicates_slideshow.tag_keep': 'Keep',
        'duplicates_slideshow.tag_delete': 'Delete',
        'duplicates_slideshow.finished': 'Slideshow complete.',
    },
    tr: {
        'duplicates_slideshow.no_groups': 'Slayt için kopya grubu yok.',
        'duplicates_slideshow.skip': 'Atla (Hiçbirini Silme)',
        'duplicates_slideshow.delete_all': 'Tümünü Sil',
        'duplicates_slideshow.tag_keep': 'Korunacak',
        'duplicates_slideshow.tag_delete': 'Silinecek',
        'duplicates_slideshow.finished': 'Slayt tamamlandı.',
    },
    fr: {
        'duplicates_slideshow.no_groups': 'Aucun groupe de doublons pour le diaporama.',
        'duplicates_slideshow.skip': 'Passer (ne rien supprimer)',
        'duplicates_slideshow.delete_all': 'Tout supprimer',
        'duplicates_slideshow.tag_keep': 'À conserver',
        'duplicates_slideshow.tag_delete': 'À supprimer',
        'duplicates_slideshow.finished': 'Diaporama terminé.',
    },
    de: {
        'duplicates_slideshow.no_groups': 'Keine Duplikatgruppen für die Diashow.',
        'duplicates_slideshow.skip': 'Überspringen (nichts löschen)',
        'duplicates_slideshow.delete_all': 'Alle löschen',
        'duplicates_slideshow.tag_keep': 'Wird behalten',
        'duplicates_slideshow.tag_delete': 'Wird gelöscht',
        'duplicates_slideshow.finished': 'Diashow abgeschlossen.',
    },
});

const DUP_SLIDESHOW_SECONDS = 3.75;

let _dupSlideshowState = null; // { groups, index, timeoutId, cancelled }

function startDupSlideshow(groups) {
    if (!groups.length) {
        toast(t('duplicates_slideshow.no_groups'), 'info');
        return;
    }

    _dupSlideshowState = { groups, index: 0, timeoutId: null, cancelled: false };

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
            <button class="btn btn-danger" id="dup-slideshow-delete-all">🗑 ${t('duplicates_slideshow.delete_all')}</button>
        </div>
    `;
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    $('dup-slideshow-close').onclick = () => _closeDupSlideshow(false);
    $('dup-slideshow-skip').onclick = () => _dupSlideshowAdvance('skip');
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
    const keep = sorted[0];
    const toDeleteAssets = sorted.slice(1);

    $('dup-slideshow-progress').textContent = `${st.index + 1} / ${st.groups.length}`;
    $('dup-slideshow-stage').innerHTML = `
        <div class="dup-slideshow-card dup-slideshow-card--keep">
            <img src="${API.getThumb(keep.id, 'medium')}" alt="" onerror="this.onerror=null;this.src='/static/broken-file.png'">
            <span class="dup-slideshow-card-tag dup-slideshow-card-tag--keep">✓ ${t('duplicates_slideshow.tag_keep')}</span>
        </div>
        ${toDeleteAssets.map(a => `
            <div class="dup-slideshow-card dup-slideshow-card--delete">
                <img src="${API.getThumb(a.id, 'medium')}" alt="" onerror="this.onerror=null;this.src='/static/broken-file.png'">
                <span class="dup-slideshow-card-tag dup-slideshow-card-tag--delete">✕ ${t('duplicates_slideshow.tag_delete')}</span>
            </div>
        `).join('')}
    `;

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
        } else if (action === 'timeout') {
            const toDelete = _bestQualityFirst(group.assets).slice(1).map(a => a.id);
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

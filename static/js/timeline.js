/**
 * Wimmich - Shared photo-card rendering and grid selection gestures, used
 * by every page with a photo grid (Gallery, Albums, Favorites, Archive,
 * Trash, People, search results, ...). Named after the old standalone
 * Timeline page this used to belong to - superseded by Gallery (date_desc
 * sort + month grouping reproduces the same chronological view via its
 * filters), which is why nothing here renders a page on its own anymore.
 */
registerTranslations({
    en: {
        'timeline.video_badge': 'Video',
    },
    tr: {
        'timeline.video_badge': 'Video',
    },
    fr: {
        'timeline.video_badge': 'Vidéo',
    },
    de: {
        'timeline.video_badge': 'Video',
    },
});

function renderPhotoCard(asset) {
    // Falls back to a visible "broken image" placeholder instead of hiding
    // the <img> outright - a hidden img left nothing but the plain card
    // background, so a failed import (0-byte file, no thumbnail possible)
    // was just an unexplained blank void indistinguishable from the app
    // being broken. Covers both "no thumbnail path at all" (skips the
    // request entirely) and "path set but the file itself is missing/
    // corrupt on disk" (the onerror case).
    const thumb = asset.thumb_medium || asset.thumb_small || '/static/broken-file.png';
    const isVideo = asset.file_type === 'VIDEO';
    const isFav = asset.is_favorite;
    const dur = isVideo && asset.duration_seconds ? formatDuration(asset.duration_seconds) : '';

    return `
        <div class="photo-card" data-id="${asset.id}" data-type="${asset.file_type}">
            <div class="photo-select" data-id="${asset.id}"></div>
            <img src="${thumb}" alt="" loading="lazy" draggable="false" onerror="this.onerror=null;this.src='/static/broken-file.png';">
            <div class="photo-badges">
                ${isVideo ? `<span class="photo-badge video">▶ ${t('timeline.video_badge')}</span>` : ''}
                ${isFav ? '<span class="photo-badge favorite"><svg width="12" height="12" viewBox="0 0 24 24" fill="red" stroke="red" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg></span>' : ''}
            </div>
            ${dur ? `<span class="photo-duration">${dur}</span>` : ''}
            <div class="photo-overlay"></div>
        </div>`;
}

// Shared across every grid using bindPhotoCards (timeline/gallery/archive/
// trash/albums): true while a mouse-drag or touch-drag selection gesture is
// in progress. Selection is computed as a real rectangle between the drag's
// start point and the current pointer position - not just whichever cards
// the pointer's path happened to cross (the old mouseenter/elementFromPoint
// approach only ever selected a thin diagonal line for a fast corner-to-
// corner drag) - so every card inside the box ends up selected, matching
// Google Photos/Immich's drag-select.
let _dragSelectActive = false;
let _dragStartPoint = null; // {x, y} in page-content scroll-space, set when the drag begins
let _dragOriginSelected = null; // asset IDs already selected before this drag started - never deselected by it

// Map<cardElement, {left, right, top, bottom}> in scroll-space (viewport
// rect + scroll offset), built once per drag gesture instead of re-measured
// on every mousemove - see _updateRectSelection's own comment for why this
// is safe even though the page keeps auto-scrolling mid-drag.
let _dragCardRects = null;

// Mouse only: a mousedown on a photo (not its checkbox, nothing selected
// yet) doesn't arm a drag immediately - it might just be a click to open
// the viewer. It's held "pending" until the pointer actually moves past
// DRAG_ARM_THRESHOLD_PX, only then does it retroactively become a drag-
// select starting from that card. This is what lets a drag started
// anywhere on a photo (not just its tiny corner checkbox) work.
let _pendingDragCard = null;
let _pendingDragStart = null;

// Set to the one card a drag-select was armed from, so the click event
// that follows the eventual mouseup/touchend on that same element (browsers
// still fire it if press and release land on the same element even after
// intervening movement) doesn't immediately toggle it back off again.
let _suppressClickCard = null;

// Every photo grid scrolls inside #page-content (overflow-y: auto), not the
// window - so both the drag's anchor point and the rectangle math need to
// be expressed in that element's scroll-space (viewport coords + its
// scrollTop/scrollLeft), not raw viewport coords. Otherwise scrolling
// mid-drag (a manual wheel scroll, or the auto-scroll below) would silently
// shift the whole page under a start point that never moved.
function _scrollSpacePoint(clientX, clientY) {
    const pc = $('page-content');
    return {
        x: clientX + (pc ? pc.scrollLeft : 0),
        y: clientY + (pc ? pc.scrollTop : 0),
    };
}

function _armDragSelect(card, clientX, clientY) {
    _dragSelectActive = true;
    _dragStartPoint = _scrollSpacePoint(clientX, clientY);
    _dragOriginSelected = new Set(state.selectedAssets);
    _suppressClickCard = card;
    toggleSelect(card.dataset.id, card);
    _startDragAutoScroll();
}

/**
 * Builds/rebuilds the per-card rect cache in page-content scroll-space
 * (viewport rect + current scroll offset). Scroll-space coordinates are
 * scroll-invariant - scrolling shifts a card's viewport rect and the
 * scroll offset by exactly opposite amounts, so left+scrollLeft/
 * top+scrollTop stays the same regardless of when it's measured during
 * the same drag. That's what makes caching this safe even though
 * auto-scroll (see _dragAutoScrollTick) keeps moving the page mid-drag -
 * measuring once per gesture instead of once per mousemove event is the
 * difference between one forced reflow and hundreds per second, which
 * was visibly janking a drag-select over a few hundred cards.
 */
function _buildDragCardRectCache() {
    const pc = $('page-content');
    const scrollLeft = pc ? pc.scrollLeft : 0;
    const scrollTop = pc ? pc.scrollTop : 0;
    _dragCardRects = new Map();
    document.querySelectorAll('.photo-card').forEach(card => {
        const r = card.getBoundingClientRect();
        _dragCardRects.set(card, {
            left: r.left + scrollLeft, right: r.right + scrollLeft,
            top: r.top + scrollTop, bottom: r.bottom + scrollTop,
        });
    });
}

function _updateRectSelection(currentClientX, currentClientY) {
    if (!_dragStartPoint) return;
    if (!_dragCardRects) _buildDragCardRectCache();
    const pc = $('page-content');
    const scrollLeft = pc ? pc.scrollLeft : 0;
    const scrollTop = pc ? pc.scrollTop : 0;
    const current = { x: currentClientX + scrollLeft, y: currentClientY + scrollTop };
    const minX = Math.min(_dragStartPoint.x, current.x);
    const maxX = Math.max(_dragStartPoint.x, current.x);
    const minY = Math.min(_dragStartPoint.y, current.y);
    const maxY = Math.max(_dragStartPoint.y, current.y);

    _dragCardRects.forEach((rect, card) => {
        const intersects = rect.left < maxX && rect.right > minX && rect.top < maxY && rect.bottom > minY;
        const id = card.dataset.id;
        const isSelected = state.selectedAssets.has(id);
        if (intersects && !isSelected) {
            state.selectedAssets.add(id);
            _setCardSelected(card, true);
        } else if (!intersects && isSelected && !_dragOriginSelected.has(id)) {
            // Dragged back out past a card the CURRENT drag had picked up -
            // drop it, same as a real lasso. Anything selected before the
            // drag started is left alone.
            state.selectedAssets.delete(id);
            _setCardSelected(card, false);
        }
    });
    updateSelectionBar();
}

// Auto-scrolls #page-content while a drag-select's pointer sits near its top
// or bottom edge - without this, a selection that needs to span more items
// than fit on screen at once was simply unreachable (release, scroll, and
// restart the drag, losing anything not literally visible at drag-start).
// Runs on rAF rather than off the move events themselves so it keeps
// scrolling even while the pointer is held still right at the edge.
const DRAG_EDGE_ZONE_PX = 60;
const DRAG_AUTOSCROLL_MAX_SPEED_PX = 16;
let _dragAutoScrollRAF = null;
let _lastPointerClientX = 0;
let _lastPointerClientY = 0;

function _dragAutoScrollTick() {
    if (!_dragSelectActive) { _dragAutoScrollRAF = null; return; }
    const pc = $('page-content');
    if (pc) {
        const rect = pc.getBoundingClientRect();
        const y = _lastPointerClientY;
        let dy = 0;
        if (y < rect.top + DRAG_EDGE_ZONE_PX) {
            dy = -Math.min(1, (rect.top + DRAG_EDGE_ZONE_PX - y) / DRAG_EDGE_ZONE_PX) * DRAG_AUTOSCROLL_MAX_SPEED_PX;
        } else if (y > rect.bottom - DRAG_EDGE_ZONE_PX) {
            dy = Math.min(1, (y - (rect.bottom - DRAG_EDGE_ZONE_PX)) / DRAG_EDGE_ZONE_PX) * DRAG_AUTOSCROLL_MAX_SPEED_PX;
        }
        if (dy !== 0) {
            pc.scrollTop += dy;
            _updateRectSelection(_lastPointerClientX, _lastPointerClientY);
        }
    }
    _dragAutoScrollRAF = requestAnimationFrame(_dragAutoScrollTick);
}

function _startDragAutoScroll() {
    if (!_dragAutoScrollRAF) _dragAutoScrollRAF = requestAnimationFrame(_dragAutoScrollTick);
}

function _endDragSelect() {
    _dragSelectActive = false;
    _dragStartPoint = null;
    _dragOriginSelected = null;
    _dragCardRects = null;
    _pendingDragCard = null;
    _pendingDragStart = null;
    if (_dragAutoScrollRAF) {
        cancelAnimationFrame(_dragAutoScrollRAF);
        _dragAutoScrollRAF = null;
    }
}
document.addEventListener('mouseup', _endDragSelect);
document.addEventListener('mousemove', (e) => {
    _lastPointerClientX = e.clientX;
    _lastPointerClientY = e.clientY;
    if (_dragSelectActive) {
        _updateRectSelection(e.clientX, e.clientY);
        return;
    }
    if (_pendingDragCard) {
        const dx = e.clientX - _pendingDragStart.x;
        const dy = e.clientY - _pendingDragStart.y;
        if (Math.hypot(dx, dy) >= DRAG_ARM_THRESHOLD_PX) {
            const card = _pendingDragCard;
            _pendingDragCard = null;
            _armDragSelect(card, _pendingDragStart.x, _pendingDragStart.y);
            _updateRectSelection(e.clientX, e.clientY);
        }
    }
});

// The last card a plain click/toggle landed on - a following shift-click
// selects everything between this and the new card (DOM order, matching
// visual grid order), same "anchor" behavior as a file manager's list view.
let _lastClickedCard = null;

function _selectRange(fromCard, toCard) {
    const allCards = Array.from(document.querySelectorAll('.photo-card'));
    const fromIdx = allCards.indexOf(fromCard);
    const toIdx = allCards.indexOf(toCard);
    if (fromIdx === -1 || toIdx === -1) return;
    const [start, end] = fromIdx < toIdx ? [fromIdx, toIdx] : [toIdx, fromIdx];
    for (let i = start; i <= end; i++) {
        const c = allCards[i];
        if (!state.selectedAssets.has(c.dataset.id)) {
            state.selectedAssets.add(c.dataset.id);
            _setCardSelected(c, true);
        }
    }
    updateSelectionBar();
}

function bindPhotoCards(container) {
    container.querySelectorAll('.photo-card').forEach(card => {
        let touchTimer;
        let touchStartPoint = null;

        card.onclick = (e) => {
            if (_suppressClickCard === card) { _suppressClickCard = null; return; }

            if (e.shiftKey && (_lastClickedCard || state.selectedAssets.size > 0)) {
                if (_lastClickedCard) _selectRange(_lastClickedCard, card);
                else toggleSelect(card.dataset.id, card);
                _lastClickedCard = card;
                return;
            }

            if (e.target.closest('.photo-select') || state.selectedAssets.size > 0) {
                toggleSelect(card.dataset.id, card);
                _lastClickedCard = card;
                return;
            }
            _lastClickedCard = card;
            const allCards = Array.from(document.querySelectorAll('.photo-card'));
            state.viewerList = allCards.map(c => c.dataset.id);
            state.viewerIndex = state.viewerList.indexOf(card.dataset.id);
            openViewer(card.dataset.id);
        };

        // Right-click: act on the current multi-selection if this card is
        // part of it, otherwise just this one photo - same "act on the
        // right scope" rule the toolbar's bulk actions already follow.
        card.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            const id = card.dataset.id;
            const ids = state.selectedAssets.has(id) && state.selectedAssets.size > 1
                ? [...state.selectedAssets]
                : [id];
            _showPhotoContextMenu(e.clientX, e.clientY, ids);
        });

        // Native HTML5 drag, to drop a photo (or the whole selection) onto
        // an album - only possible from an already-selected card (see
        // _setCardSelected: draggable only turns on once selected), which is
        // exactly the one case the custom rectangle-select's own mousedown
        // handler already treats as a no-op (`if selected: return` below),
        // so there's no gesture conflict between the two.
        card.addEventListener('dragstart', (e) => {
            const id = card.dataset.id;
            const ids = state.selectedAssets.size > 1 ? [...state.selectedAssets] : [id];
            e.dataTransfer.effectAllowed = 'copy';
            e.dataTransfer.setData('text/plain', ''); // some browsers require this for the drag to start at all
            _startAlbumDropBar(ids);
        });
        card.addEventListener('dragend', () => _endAlbumDropBar());

        // Desktop: mousedown on the checkbox (or anywhere once already
        // selecting) arms a drag immediately - it's already an explicit
        // selection action. Mousedown anywhere ELSE on a photo (nothing
        // selected yet) only arms once the pointer actually moves past the
        // threshold (see the global mousemove above) so a plain click still
        // opens the viewer - this is what lets a drag started from the
        // middle of a photo (not just its tiny corner checkbox) work.
        card.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return;
            if (state.selectedAssets.has(card.dataset.id)) return;
            const onCheckbox = !!e.target.closest('.photo-select');
            if (onCheckbox || state.selectedAssets.size > 0) {
                _armDragSelect(card, e.clientX, e.clientY);
            } else {
                _pendingDragCard = card;
                _pendingDragStart = { x: e.clientX, y: e.clientY };
            }
        });

        // Mobile: long-press arms selection mode; once selecting, touching a
        // new card starts dragging across others immediately (no new
        // long-press needed), same gesture as Google Photos/Immich.
        card.addEventListener('touchstart', (e) => {
            if (e.touches.length !== 1) return;
            const touch = e.touches[0];
            touchStartPoint = { x: touch.clientX, y: touch.clientY };
            _lastPointerClientX = touch.clientX;
            _lastPointerClientY = touch.clientY;
            if (state.selectedAssets.size > 0) {
                if (!state.selectedAssets.has(card.dataset.id)) {
                    _armDragSelect(card, touch.clientX, touch.clientY);
                }
                return;
            }
            touchTimer = setTimeout(() => {
                _armDragSelect(card, touch.clientX, touch.clientY);
                if (navigator.vibrate) {
                    try { navigator.vibrate(50); } catch(err) {}
                }
            }, TOUCH_HOLD_MS);
        }, { passive: true });

        card.addEventListener('touchend', () => {
            clearTimeout(touchTimer);
            _endDragSelect();
        });

        card.addEventListener('touchmove', (e) => {
            const t = e.touches[0];
            if (!_dragSelectActive) {
                // Tolerate small jitter while waiting for the long-press to
                // arm - a still finger never reports exactly 0 movement, and
                // cancelling on the first pixel made the long-press feel
                // unreliable. Only a real, deliberate move (e.g. starting to
                // scroll the page) cancels the pending selection.
                const dx = t.clientX - touchStartPoint.x;
                const dy = t.clientY - touchStartPoint.y;
                if (Math.hypot(dx, dy) > TOUCH_JITTER_TOLERANCE_PX) clearTimeout(touchTimer);
                return;
            }
            e.preventDefault(); // block page scroll while actively drag-selecting
            // The auto-scroll rAF loop (see _dragAutoScrollTick) reads these
            // to keep scrolling even while the finger is held still at the
            // edge - only the mouse path updated them until now, so
            // auto-scroll silently never triggered on touch at all.
            _lastPointerClientX = t.clientX;
            _lastPointerClientY = t.clientY;
            _updateRectSelection(t.clientX, t.clientY);
        }, { passive: false });
    });
}

registerTranslations({
    en: { 'timeline.context_favorite': 'Favorite', 'timeline.context_archive': 'Archive', 'timeline.context_download': 'Download', 'timeline.context_delete': 'Delete' },
    tr: { 'timeline.context_favorite': 'Favori', 'timeline.context_archive': 'Arşivle', 'timeline.context_download': 'İndir', 'timeline.context_delete': 'Sil' },
    fr: { 'timeline.context_favorite': 'Favori', 'timeline.context_archive': 'Archiver', 'timeline.context_download': 'Télécharger', 'timeline.context_delete': 'Supprimer' },
    de: { 'timeline.context_favorite': 'Favorit', 'timeline.context_archive': 'Archivieren', 'timeline.context_download': 'Herunterladen', 'timeline.context_delete': 'Löschen' },
});

// Right-click quick-action menu - lets a single photo (or the current
// multi-selection) get favorited/archived/downloaded/deleted without first
// having to enter selection mode via the checkbox or a long-press.
function _showPhotoContextMenu(clientX, clientY, ids) {
    _closePhotoContextMenu();

    const menu = document.createElement('div');
    menu.className = 'photo-context-menu';
    menu.id = 'photo-context-menu';
    menu.innerHTML = `
        <button data-action="favorite">${icon('heart')} ${t('timeline.context_favorite')}</button>
        <button data-action="archive">${icon('archive')} ${t('timeline.context_archive')}</button>
        <button data-action="download">${icon('download')} ${t('timeline.context_download')}</button>
        <button class="photo-context-menu-danger" data-action="delete">${icon('trash')} ${t('timeline.context_delete')}</button>
    `;
    document.body.appendChild(menu);

    // Clamp inside the viewport so a right-click near an edge doesn't spawn
    // a menu that's partly cut off.
    const rect = menu.getBoundingClientRect();
    menu.style.left = `${Math.min(clientX, window.innerWidth - rect.width - 8)}px`;
    menu.style.top = `${Math.min(clientY, window.innerHeight - rect.height - 8)}px`;

    menu.querySelectorAll('button').forEach(btn => {
        btn.onclick = () => {
            _closePhotoContextMenu();
            _runContextMenuAction(btn.dataset.action, ids);
        };
    });
}

function _closePhotoContextMenu() {
    const existing = $('photo-context-menu');
    if (existing) existing.remove();
}
document.addEventListener('click', _closePhotoContextMenu);
document.addEventListener('contextmenu', (e) => {
    if (!e.target.closest('.photo-card')) _closePhotoContextMenu();
});
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') _closePhotoContextMenu();
});

async function _runContextMenuAction(action, ids) {
    try {
        if (action === 'download') {
            if (ids.length === 1) window.open(API.getAssetFile(ids[0]), '_blank');
            else window.open(API.getDownloadZipUrl(ids), '_blank');
            return;
        }
        if (action === 'favorite') {
            await API.bulkAction(ids, 'favorite');
            _undoableToast(t('selection.added_to_favorites'), () => API.bulkAction(ids, 'unfavorite'));
        } else if (action === 'archive') {
            await API.bulkAction(ids, 'archive');
            _undoableToast(t('selection.archived'), () => API.bulkAction(ids, 'unarchive'));
        } else if (action === 'delete') {
            await API.bulkAction(ids, 'delete');
            _undoableToast(t('selection.moved_to_trash', { count: ids.length }), () => API.bulkAction(ids, 'restore'));
        }
        clearSelection();
        navigateTo(state.currentPage);
    } catch (e) {
        toast(e.message, 'error');
    }
}

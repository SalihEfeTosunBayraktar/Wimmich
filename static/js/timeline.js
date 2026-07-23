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
let _dragStartPoint = null; // {x, y} in viewport coords, set when the drag begins
let _dragOriginSelected = null; // asset IDs already selected before this drag started - never deselected by it

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

function _armDragSelect(card, x, y) {
    _dragSelectActive = true;
    _dragStartPoint = { x, y };
    _dragOriginSelected = new Set(state.selectedAssets);
    _suppressClickCard = card;
    toggleSelect(card.dataset.id, card);
}

function _updateRectSelection(currentX, currentY) {
    if (!_dragStartPoint) return;
    const minX = Math.min(_dragStartPoint.x, currentX);
    const maxX = Math.max(_dragStartPoint.x, currentX);
    const minY = Math.min(_dragStartPoint.y, currentY);
    const maxY = Math.max(_dragStartPoint.y, currentY);

    document.querySelectorAll('.photo-card').forEach(card => {
        const r = card.getBoundingClientRect();
        const intersects = r.left < maxX && r.right > minX && r.top < maxY && r.bottom > minY;
        const id = card.dataset.id;
        const isSelected = state.selectedAssets.has(id);
        if (intersects && !isSelected) {
            state.selectedAssets.add(id);
            card.classList.add('selected');
        } else if (!intersects && isSelected && !_dragOriginSelected.has(id)) {
            // Dragged back out past a card the CURRENT drag had picked up -
            // drop it, same as a real lasso. Anything selected before the
            // drag started is left alone.
            state.selectedAssets.delete(id);
            card.classList.remove('selected');
        }
    });
    updateSelectionBar();
}

function _endDragSelect() {
    _dragSelectActive = false;
    _dragStartPoint = null;
    _dragOriginSelected = null;
    _pendingDragCard = null;
    _pendingDragStart = null;
}
document.addEventListener('mouseup', _endDragSelect);
document.addEventListener('mousemove', (e) => {
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

function bindPhotoCards(container) {
    container.querySelectorAll('.photo-card').forEach(card => {
        let touchTimer;
        let touchStartPoint = null;

        card.onclick = (e) => {
            if (_suppressClickCard === card) { _suppressClickCard = null; return; }
            if (e.target.closest('.photo-select') || state.selectedAssets.size > 0) {
                toggleSelect(card.dataset.id, card);
                return;
            }
            const allCards = Array.from(document.querySelectorAll('.photo-card'));
            state.viewerList = allCards.map(c => c.dataset.id);
            state.viewerIndex = state.viewerList.indexOf(card.dataset.id);
            openViewer(card.dataset.id);
        };

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
            _updateRectSelection(t.clientX, t.clientY);
        }, { passive: false });
    });
}

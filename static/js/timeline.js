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
            <img src="${thumb}" alt="" loading="lazy" onerror="this.onerror=null;this.src='/static/broken-file.png';">
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
}
document.addEventListener('mouseup', _endDragSelect);
document.addEventListener('mousemove', (e) => {
    if (_dragSelectActive) _updateRectSelection(e.clientX, e.clientY);
});

function bindPhotoCards(container) {
    container.querySelectorAll('.photo-card').forEach(card => {
        let touchTimer;
        let suppressClick = false;

        card.onclick = (e) => {
            if (suppressClick) { suppressClick = false; return; }
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
        // selecting) arms a drag; a global mousemove (registered once,
        // above) then extends the selection to every card inside the
        // rectangle between here and the current pointer position.
        card.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return;
            const onCheckbox = !!e.target.closest('.photo-select');
            const alreadySelected = state.selectedAssets.has(card.dataset.id);
            if (!alreadySelected && (onCheckbox || state.selectedAssets.size > 0)) {
                _dragSelectActive = true;
                _dragStartPoint = { x: e.clientX, y: e.clientY };
                _dragOriginSelected = new Set(state.selectedAssets);
                suppressClick = true;
                toggleSelect(card.dataset.id, card);
            }
        });

        // Mobile: long-press arms selection mode; once selecting, touching a
        // new card starts dragging across others immediately (no new
        // long-press needed), same gesture as Google Photos/Immich.
        card.addEventListener('touchstart', (e) => {
            if (e.touches.length !== 1) return;
            const touch = e.touches[0];
            if (state.selectedAssets.size > 0) {
                if (!state.selectedAssets.has(card.dataset.id)) {
                    _dragSelectActive = true;
                    _dragStartPoint = { x: touch.clientX, y: touch.clientY };
                    _dragOriginSelected = new Set(state.selectedAssets);
                    suppressClick = true;
                    toggleSelect(card.dataset.id, card);
                }
                return;
            }
            touchTimer = setTimeout(() => {
                _dragSelectActive = true;
                _dragStartPoint = { x: touch.clientX, y: touch.clientY };
                _dragOriginSelected = new Set(state.selectedAssets);
                suppressClick = true;
                toggleSelect(card.dataset.id, card);
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
            if (!_dragSelectActive) { clearTimeout(touchTimer); return; }
            e.preventDefault(); // block page scroll while actively drag-selecting
            const t = e.touches[0];
            _updateRectSelection(t.clientX, t.clientY);
        }, { passive: false });
    });
}

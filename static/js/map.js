/**
 * Wimmich - Map view of geotagged photos (Leaflet + marker clustering).
 *
 * Markers show the actual photo thumbnail instead of a generic pin, and
 * nearby photos are grouped into a cluster bubble previewing one of the
 * photos plus a count - not just a plain location dot.
 */
registerTranslations({
    en: {
        'map.no_geotagged_photos': 'No geotagged photos found',
        'map.cities_heading': 'Cities',
        'map.most_visited_btn': 'Most visited',
        'map.least_visited_btn': 'Least visited',
        'map.city_photo_count': '{count} photos',
        'map.no_cities': 'No cities identified yet',
        'map.unresolved_hint': '{count} photo(s) have a location but no city yet - run Tag Locations to identify them.',
    },
    tr: {
        'map.no_geotagged_photos': 'Konumlu fotoğraf bulunamadı',
        'map.cities_heading': 'Şehirler',
        'map.most_visited_btn': 'En çok ziyaret edilen',
        'map.least_visited_btn': 'En az ziyaret edilen',
        'map.city_photo_count': '{count} fotoğraf',
        'map.no_cities': 'Henüz belirlenmiş bir şehir yok',
        'map.unresolved_hint': '{count} fotoğrafın konumu var ama şehir bilgisi henüz yok - belirlemek için Konum Etiketleme\'yi çalıştırabilirsiniz.',
    },
    fr: {
        'map.no_geotagged_photos': 'Aucune photo géolocalisée trouvée',
        'map.cities_heading': 'Villes',
        'map.most_visited_btn': 'Les plus visitées',
        'map.least_visited_btn': 'Les moins visitées',
        'map.city_photo_count': '{count} photos',
        'map.no_cities': 'Aucune ville identifiée pour le moment',
        'map.unresolved_hint': '{count} photo(s) ont une position mais pas encore de ville - lancez l\'étiquetage de localisation pour les identifier.',
    },
    de: {
        'map.no_geotagged_photos': 'Keine geotaggten Fotos gefunden',
        'map.cities_heading': 'Städte',
        'map.most_visited_btn': 'Meistbesucht',
        'map.least_visited_btn': 'Am wenigsten besucht',
        'map.city_photo_count': '{count} Fotos',
        'map.no_cities': 'Noch keine Städte identifiziert',
        'map.unresolved_hint': '{count} Foto(s) haben einen Standort, aber noch keine Stadt - führen Sie die Standort-Kennzeichnung aus, um sie zu identifizieren.',
    },
});

function _mapThumbIcon(thumbUrl) {
    return L.divIcon({
        className: 'map-photo-marker',
        html: `<img src="${thumbUrl}" alt="">`,
        iconSize: [44, 44],
        iconAnchor: [22, 44],
        popupAnchor: [0, -40],
    });
}

function _mapClusterIcon(cluster) {
    const count = cluster.getChildCount();
    const previewThumb = cluster.getAllChildMarkers()[0].options.wimmichThumb;
    const size = count < 10 ? 52 : count < 50 ? 64 : 76;
    return L.divIcon({
        className: 'map-cluster-marker',
        html: `
            <div class="map-cluster-bubble" style="width:${size}px;height:${size}px">
                <img src="${previewThumb}" alt="">
                <span class="map-cluster-count">${count}</span>
            </div>
        `,
        iconSize: [size, size],
    });
}

// Sorted client-side from one fetched list rather than a second request per
// toggle click - the whole list is already in hand and small (one row per
// distinct city, not per photo).
let _cityStatsCache = [];
let _citySortDesc = true;
// Guards against a stale fetch from a previous renderMap() call (e.g. the
// user navigates away and back quickly) landing after a newer one and
// overwriting fresh data with old - same requestId pattern used to fix the
// equivalent gallery filter race earlier in this project.
let _mapRenderToken = 0;

function _renderCitiesSidebar() {
    const el = $('map-cities-list');
    if (!el) return;
    const sorted = [..._cityStatsCache].sort((a, b) => _citySortDesc ? b.count - a.count : a.count - b.count);
    el.innerHTML = sorted.length
        ? sorted.map(c => `
            <div class="map-city-row" data-city="${escAttr(c.city)}">
                <span class="map-city-name">${escHtml(c.city)}${c.country ? `, ${escHtml(c.country)}` : ''}</span>
                <span class="map-city-count">${t('map.city_photo_count', { count: c.count })}</span>
            </div>
        `).join('')
        : `<p class="text-muted admin-field-hint">${t('map.no_cities')}</p>`;
    el.querySelectorAll('.map-city-row').forEach(row => {
        row.onclick = () => {
            state.gallery.filterBy = 'city_' + row.dataset.city;
            navigateTo('gallery');
        };
    });
}

async function renderMap() {
    const myRenderToken = ++_mapRenderToken;
    const pc = $('page-content');
    pc.innerHTML = `
        <div class="map-container">
            <div id="map-view" style="height:100%"></div>
            <div class="map-cities-sidebar">
                <div class="map-cities-header">
                    <h4>🏙️ ${t('map.cities_heading')}</h4>
                    <button class="btn btn-secondary btn-sm" id="map-city-sort-btn"></button>
                </div>
                <div id="map-cities-list"></div>
                <p class="text-muted admin-field-hint" id="map-unresolved-hint" style="display:none;margin-top:12px"></p>
            </div>
        </div>
    `;

    const sortBtn = $('map-city-sort-btn');
    const updateSortBtnLabel = () => {
        sortBtn.textContent = _citySortDesc ? t('map.least_visited_btn') : t('map.most_visited_btn');
    };
    updateSortBtnLabel();
    sortBtn.onclick = () => {
        _citySortDesc = !_citySortDesc;
        updateSortBtnLabel();
        _renderCitiesSidebar();
    };

    try {
        const map = L.map('map-view').setView(MAP_DEFAULT_CENTER, MAP_DEFAULT_ZOOM);
        L.tileLayer(MAP_TILE_URL, {
            attribution: MAP_TILE_ATTRIBUTION,
            maxZoom: MAP_MAX_ZOOM,
        }).addTo(map);

        API.getCityStats().then(cityData => {
            if (myRenderToken !== _mapRenderToken) return;
            _cityStatsCache = cityData.cities;
            _renderCitiesSidebar();
            const hint = $('map-unresolved-hint');
            if (hint && cityData.unresolved_count > 0) {
                hint.textContent = t('map.unresolved_hint', { count: cityData.unresolved_count });
                hint.style.display = '';
            }
        }).catch(() => {});

        const data = await API.getMapMarkers();
        if (!data.markers.length) {
            toast(t('map.no_geotagged_photos'), 'info');
            return;
        }

        const clusterGroup = L.markerClusterGroup({
            iconCreateFunction: _mapClusterIcon,
            maxClusterRadius: 60,
            spiderfyOnMaxZoom: true,
        });

        const allMarkerIds = data.markers.map(m => m.id);
        const bounds = [];
        data.markers.forEach(m => {
            const marker = L.marker([m.lat, m.lng], {
                icon: _mapThumbIcon(m.thumb),
                wimmichThumb: m.thumb,
                wimmichId: m.id,
            });
            marker.on('click', () => {
                // Prev/next browses the other photos in the same
                // cluster/region the user clicked into when the marker is
                // still part of a cluster bubble; once zoomed in enough
                // that every marker stands alone, getVisibleParent returns
                // the marker itself (no siblings), which used to leave
                // arrow-key navigation completely stuck on one photo - fall
                // back to every geotagged photo on the map instead.
                const parent = clusterGroup.getVisibleParent(marker);
                const siblings = (parent && parent !== marker)
                    ? parent.getAllChildMarkers().map(mk => mk.options.wimmichId)
                    : allMarkerIds;
                state.viewerList = siblings;
                state.viewerIndex = siblings.indexOf(m.id);
                openViewer(m.id);
            });
            clusterGroup.addLayer(marker);
            bounds.push([m.lat, m.lng]);
        });

        map.addLayer(clusterGroup);
        if (bounds.length) map.fitBounds(bounds, { padding: MAP_FIT_BOUNDS_PADDING });
    } catch (e) { toast(e.message, 'error'); }
}

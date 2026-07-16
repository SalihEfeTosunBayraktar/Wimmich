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
    },
    tr: {
        'map.no_geotagged_photos': 'Konumlu fotoğraf bulunamadı',
    },
    fr: {
        'map.no_geotagged_photos': 'Aucune photo géolocalisée trouvée',
    },
    de: {
        'map.no_geotagged_photos': 'Keine geotaggten Fotos gefunden',
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

async function renderMap() {
    const pc = $('page-content');
    pc.innerHTML = '<div class="map-container"><div id="map-view" style="height:100%"></div></div>';

    try {
        const map = L.map('map-view').setView(MAP_DEFAULT_CENTER, MAP_DEFAULT_ZOOM);
        L.tileLayer(MAP_TILE_URL, {
            attribution: MAP_TILE_ATTRIBUTION,
            maxZoom: MAP_MAX_ZOOM,
        }).addTo(map);

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

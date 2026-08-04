/**
 * Wimmich - "On this day" memories feed, plus auto-generated memory videos
 * (Ken Burns/crossfade slideshows built server-side from today's "on this
 * day" groups and the past week's photos - see routers/memory_video_router.py).
 */
registerTranslations({
    en: {
        'memories.empty_title': 'No memories for today',
        'memories.empty_desc': 'Photos you took on this day in past years will appear here.',
        'memories.date_count': '{date} · {count} photos',
        'memories.video_section_title': 'Memory videos',
        'memories.video_enable_label': 'Automatically create memory videos',
        'memories.video_enable_hint': 'Runs in the background every few hours - one video per "on this day" year, plus a weekly summary.',
        'memories.video_style_label': 'Style',
        'memories.video_generate_daily': 'Create from today\'s memories',
        'memories.video_generate_weekly': 'Create this week\'s summary',
        'memories.video_empty': 'No memory videos yet - create one now, or turn on automatic generation in the Admin panel.',
        'memories.video_status_pending': 'Generating…',
        'memories.video_status_failed': 'Failed: {error}',
        'memories.video_delete': 'Delete',
        'memories.video_delete_confirm': 'Delete this memory video? This cannot be undone.',
        'memories.video_deleted': 'Memory video deleted',
        'memories.video_generate_queued': 'Queued - this can take a minute or two',
        'memories.video_kind_daily': 'On this day',
        'memories.video_kind_weekly': 'Weekly',
        'memories.video_photo_count': '{count} photos',
    },
    tr: {
        'memories.empty_title': 'Bugün için anı bulunamadı',
        'memories.empty_desc': 'Geçmiş yıllarda bugün çektiğiniz fotoğraflar burada görünecek.',
        'memories.date_count': '{date} · {count} fotoğraf',
        'memories.video_section_title': 'Anı videoları',
        'memories.video_enable_label': 'Anı videolarını otomatik oluştur',
        'memories.video_enable_hint': 'Birkaç saatte bir arka planda çalışır - her "bugün" grubu için ayrı bir video, artı haftalık bir özet.',
        'memories.video_style_label': 'Stil',
        'memories.video_generate_daily': 'Bugünün anılarından oluştur',
        'memories.video_generate_weekly': 'Bu haftanın özetini oluştur',
        'memories.video_empty': 'Henüz anı videosu yok - şimdi oluşturun, veya Yönetici Paneli\'nden otomatik oluşturmayı açın.',
        'memories.video_status_pending': 'Oluşturuluyor…',
        'memories.video_status_failed': 'Başarısız: {error}',
        'memories.video_delete': 'Sil',
        'memories.video_delete_confirm': 'Bu anı videosu silinsin mi? Geri alınamaz.',
        'memories.video_deleted': 'Anı videosu silindi',
        'memories.video_generate_queued': 'Sıraya alındı - bir iki dakika sürebilir',
        'memories.video_kind_daily': 'Bugün',
        'memories.video_kind_weekly': 'Haftalık',
        'memories.video_photo_count': '{count} fotoğraf',
    },
    fr: {
        'memories.empty_title': "Aucun souvenir pour aujourd'hui",
        'memories.empty_desc': "Les photos prises ce jour-là les années précédentes apparaîtront ici.",
        'memories.date_count': '{date} · {count} photos',
        'memories.video_section_title': 'Vidéos souvenirs',
        'memories.video_enable_label': 'Créer automatiquement des vidéos souvenirs',
        'memories.video_enable_hint': "S'exécute en arrière-plan toutes les quelques heures - une vidéo par année \"ce jour-là\", plus un résumé hebdomadaire.",
        'memories.video_style_label': 'Style',
        'memories.video_generate_daily': "Créer à partir des souvenirs d'aujourd'hui",
        'memories.video_generate_weekly': 'Créer le résumé de cette semaine',
        'memories.video_empty': "Aucune vidéo souvenir pour l'instant - créez-en une maintenant, ou activez la génération automatique dans le panneau d'administration.",
        'memories.video_status_pending': 'Génération…',
        'memories.video_status_failed': 'Échec : {error}',
        'memories.video_delete': 'Supprimer',
        'memories.video_delete_confirm': 'Supprimer cette vidéo souvenir ? Action irréversible.',
        'memories.video_deleted': 'Vidéo souvenir supprimée',
        'memories.video_generate_queued': 'En file d\'attente - cela peut prendre une minute ou deux',
        'memories.video_kind_daily': 'Ce jour-là',
        'memories.video_kind_weekly': 'Hebdomadaire',
        'memories.video_photo_count': '{count} photos',
    },
    de: {
        'memories.empty_title': 'Keine Erinnerungen für heute',
        'memories.empty_desc': 'Fotos, die Sie an diesem Tag in vergangenen Jahren aufgenommen haben, werden hier angezeigt.',
        'memories.date_count': '{date} · {count} Fotos',
        'memories.video_section_title': 'Erinnerungsvideos',
        'memories.video_enable_label': 'Erinnerungsvideos automatisch erstellen',
        'memories.video_enable_hint': 'Läuft alle paar Stunden im Hintergrund - ein Video pro "an diesem Tag"-Jahr, plus eine wöchentliche Zusammenfassung.',
        'memories.video_style_label': 'Stil',
        'memories.video_generate_daily': 'Aus den heutigen Erinnerungen erstellen',
        'memories.video_generate_weekly': 'Zusammenfassung dieser Woche erstellen',
        'memories.video_empty': 'Noch keine Erinnerungsvideos - erstellen Sie jetzt eines, oder aktivieren Sie die automatische Erstellung im Admin-Panel.',
        'memories.video_status_pending': 'Wird erstellt…',
        'memories.video_status_failed': 'Fehlgeschlagen: {error}',
        'memories.video_delete': 'Löschen',
        'memories.video_delete_confirm': 'Dieses Erinnerungsvideo löschen? Kann nicht rückgängig gemacht werden.',
        'memories.video_deleted': 'Erinnerungsvideo gelöscht',
        'memories.video_generate_queued': 'In der Warteschlange - kann ein bis zwei Minuten dauern',
        'memories.video_kind_daily': 'An diesem Tag',
        'memories.video_kind_weekly': 'Wöchentlich',
        'memories.video_photo_count': '{count} Fotos',
    },
});

let _memoryVideoPollInterval = null;

async function renderMemories() {
    try {
        const data = await API.getMemories();
        const pc = $('page-content');
        const groupsHtml = data.memories.length
            ? data.memories.map(m => `
                <div class="memory-group">
                    <div class="memory-header">
                        <div class="memory-icon">${icon('camera', 22)}</div>
                        <div class="memory-text">
                            <h3>${m.title}</h3>
                            <p>${t('memories.date_count', { date: m.date, count: m.asset_count })}</p>
                        </div>
                    </div>
                    <div class="photo-grid">${m.assets.map(a => renderPhotoCard(a)).join('')}</div>
                </div>
            `).join('')
            : renderEmptyState(t('memories.empty_title'), t('memories.empty_desc'));

        pc.innerHTML = `<div id="memory-video-section"></div>${groupsHtml}`;
        bindPhotoCards(pc);
        _renderMemoryVideoSection();
    } catch (e) { toast(e.message, 'error'); }
}

async function _renderMemoryVideoSection() {
    const container = $('memory-video-section');
    if (!container) return;

    try {
        const videosData = await API.getMemoryVideos();
        const videos = videosData.videos;

        container.innerHTML = `
            <div class="memory-video-section">
                <div class="memory-video-settings">
                    <div class="memory-video-settings-row">
                        <div>
                            <strong>${t('memories.video_section_title')}</strong>
                            <p class="text-muted" style="font-size:12px;margin:2px 0 0">${t('memories.video_enable_hint')}</p>
                        </div>
                    </div>
                    <div class="memory-video-generate-actions">
                        <button class="btn btn-secondary btn-sm" onclick="_generateMemoryVideoNow('DAILY')">${icon('camera', 14)} ${t('memories.video_generate_daily')}</button>
                        <button class="btn btn-secondary btn-sm" onclick="_generateMemoryVideoNow('WEEKLY')">${icon('camera', 14)} ${t('memories.video_generate_weekly')}</button>
                    </div>
                </div>
                <div class="memory-video-grid">
                    ${videos.length ? videos.map(v => _memoryVideoCardHtml(v)).join('') : `<p class="text-muted" style="font-size:13px">${t('memories.video_empty')}</p>`}
                </div>
            </div>
        `;

        // While anything is still PENDING, keep refreshing this section
        // every few seconds so a just-triggered generation appears without
        // the user having to manually reload the page.
        const anyPending = videos.some(v => v.status === 'PENDING');
        if (anyPending && !_memoryVideoPollInterval) {
            _memoryVideoPollInterval = setInterval(() => {
                if (state.currentPage !== 'memories') {
                    clearInterval(_memoryVideoPollInterval);
                    _memoryVideoPollInterval = null;
                    return;
                }
                _renderMemoryVideoSection();
            }, 5000);
        } else if (!anyPending && _memoryVideoPollInterval) {
            clearInterval(_memoryVideoPollInterval);
            _memoryVideoPollInterval = null;
        }
    } catch (e) {
        container.innerHTML = '';
    }
}

function _memoryVideoCardHtml(v) {
    const kindLabel = v.kind === 'DAILY' ? t('memories.video_kind_daily') : t('memories.video_kind_weekly');
    let statusHtml = '';
    if (v.status === 'PENDING') {
        statusHtml = `<span class="memory-video-status">${t('memories.video_status_pending')}</span>`;
    } else if (v.status === 'FAILED') {
        statusHtml = `<span class="memory-video-status memory-video-status--error">${t('memories.video_status_failed', { error: v.error_message || '' })}</span>`;
    }
    return `
        <div class="memory-video-card" data-video-id="${v.id}">
            <div class="memory-video-thumb" ${v.status === 'READY' ? `onclick="_playMemoryVideo('${v.video_url}')"` : ''}>
                ${v.thumb_url ? `<img src="${v.thumb_url}" loading="lazy" alt="">` : `<div class="memory-video-thumb-placeholder">${icon('film', 28)}</div>`}
                ${v.status === 'READY' ? `<div class="memory-video-play-badge">${icon('play', 18)}</div>` : ''}
            </div>
            <div class="memory-video-meta">
                <div>
                    <div class="memory-video-title">${escHtml(v.title)}</div>
                    <div class="text-muted" style="font-size:11px">${kindLabel} · ${t('memories.video_photo_count', { count: v.asset_count })}</div>
                    ${statusHtml}
                </div>
                <button class="btn-icon" title="${t('memories.video_delete')}" onclick="_deleteMemoryVideo('${v.id}')">${icon('trash', 16)}</button>
            </div>
        </div>
    `;
}

window._generateMemoryVideoNow = async function(kind) {
    try {
        await API.generateMemoryVideo(kind);
        toast(t('memories.video_generate_queued'), 'success');
        _renderMemoryVideoSection();
    } catch (e) {
        toast(e.message, 'error');
    }
};

window._deleteMemoryVideo = async function(id) {
    if (!confirm(t('memories.video_delete_confirm'))) return;
    try {
        await API.deleteMemoryVideo(id);
        toast(t('memories.video_deleted'), 'success');
        _renderMemoryVideoSection();
    } catch (e) {
        toast(e.message, 'error');
    }
};

window._playMemoryVideo = function(url) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
        <div class="modal" style="max-width:720px">
            <div class="modal-header">
                <h3></h3>
                <button class="btn-icon modal-close">${icon('close', 20)}</button>
            </div>
            <div class="modal-body" style="padding:0">
                <video src="${url}" controls autoplay style="width:100%;display:block;border-radius:0 0 var(--radius-lg) var(--radius-lg)"></video>
            </div>
        </div>
    `;
    const close = () => overlay.remove();
    overlay.querySelector('.modal-close').onclick = close;
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    document.body.appendChild(overlay);
};

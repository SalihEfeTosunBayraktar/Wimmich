/**
 * Wimmich - "On this day" memories feed.
 */
registerTranslations({
    en: {
        'memories.empty_title': 'No memories for today',
        'memories.empty_desc': 'Photos you took on this day in past years will appear here.',
        'memories.date_count': '{date} · {count} photos',
    },
    tr: {
        'memories.empty_title': 'Bugün için anı bulunamadı',
        'memories.empty_desc': 'Geçmiş yıllarda bugün çektiğiniz fotoğraflar burada görünecek.',
        'memories.date_count': '{date} · {count} fotoğraf',
    },
    fr: {
        'memories.empty_title': "Aucun souvenir pour aujourd'hui",
        'memories.empty_desc': "Les photos prises ce jour-là les années précédentes apparaîtront ici.",
        'memories.date_count': '{date} · {count} photos',
    },
    de: {
        'memories.empty_title': 'Keine Erinnerungen für heute',
        'memories.empty_desc': 'Fotos, die Sie an diesem Tag in vergangenen Jahren aufgenommen haben, werden hier angezeigt.',
        'memories.date_count': '{date} · {count} Fotos',
    },
});

async function renderMemories() {
    try {
        const data = await API.getMemories();
        const pc = $('page-content');
        if (!data.memories.length) {
            pc.innerHTML = renderEmptyState(t('memories.empty_title'), t('memories.empty_desc'));
            return;
        }
        pc.innerHTML = data.memories.map(m => `
            <div class="memory-group">
                <div class="memory-header">
                    <div class="memory-icon">📸</div>
                    <div class="memory-text">
                        <h3>${m.title}</h3>
                        <p>${t('memories.date_count', { date: m.date, count: m.asset_count })}</p>
                    </div>
                </div>
                <div class="photo-grid">${m.assets.map(a => renderPhotoCard(a)).join('')}</div>
            </div>
        `).join('');
        bindPhotoCards(pc);
    } catch (e) { toast(e.message, 'error'); }
}

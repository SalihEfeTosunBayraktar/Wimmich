/**
 * Wimmich - "Who is this?" naming queue: prompts for unnamed face groups at
 * the top of the People page, suggesting a match against an existing named
 * person when one is close enough to ask about, instead of just leaving
 * them to be found manually in the grid below.
 */
registerTranslations({
    en: {
        'people_naming_queue.title': 'Awaiting Naming ({count})',
        'people_naming_queue.confirm_person_question': 'Is this {name}?',
        'people_naming_queue.confirm_yes': 'Yes',
        'people_naming_queue.reject_different_person': 'No, someone else',
        'people_naming_queue.unknown_btn': "I don't know",
        'people_naming_queue.name_placeholder': 'Enter a name...',
        'people_naming_queue.seen_in_photos': 'Seen in {count} photo(s)',
        'people_naming_queue.merged_success': 'Merged',
        'people_naming_queue.hidden_success': "Hidden, won't be asked again",
        'people_naming_queue.enter_name_warning': 'Enter a name',
        'people_naming_queue.name_saved_success': 'Name saved',
    },
    tr: {
        'people_naming_queue.title': 'İsimlendirme Bekleyenler ({count})',
        'people_naming_queue.confirm_person_question': 'Bu kişi {name} mi?',
        'people_naming_queue.confirm_yes': 'Evet',
        'people_naming_queue.reject_different_person': 'Hayır, farklı biri',
        'people_naming_queue.unknown_btn': 'Tanımıyorum',
        'people_naming_queue.name_placeholder': 'İsim girin...',
        'people_naming_queue.seen_in_photos': '{count} fotoğrafta görüldü',
        'people_naming_queue.merged_success': 'Birleştirildi',
        'people_naming_queue.hidden_success': 'Gizlendi, bir daha sorulmayacak',
        'people_naming_queue.enter_name_warning': 'Bir isim girin',
        'people_naming_queue.name_saved_success': 'İsim kaydedildi',
    },
    fr: {
        'people_naming_queue.title': 'En attente de nom ({count})',
        'people_naming_queue.confirm_person_question': "Est-ce {name} ?",
        'people_naming_queue.confirm_yes': 'Oui',
        'people_naming_queue.reject_different_person': "Non, quelqu'un d'autre",
        'people_naming_queue.unknown_btn': 'Je ne sais pas',
        'people_naming_queue.name_placeholder': 'Entrez un nom...',
        'people_naming_queue.seen_in_photos': 'Vu(e) dans {count} photo(s)',
        'people_naming_queue.merged_success': 'Fusionné',
        'people_naming_queue.hidden_success': "Masqué, ne sera plus demandé",
        'people_naming_queue.enter_name_warning': 'Entrez un nom',
        'people_naming_queue.name_saved_success': 'Nom enregistré',
    },
    de: {
        'people_naming_queue.title': 'Wartet auf Benennung ({count})',
        'people_naming_queue.confirm_person_question': 'Ist das {name}?',
        'people_naming_queue.confirm_yes': 'Ja',
        'people_naming_queue.reject_different_person': 'Nein, jemand anderes',
        'people_naming_queue.unknown_btn': 'Weiß ich nicht',
        'people_naming_queue.name_placeholder': 'Namen eingeben...',
        'people_naming_queue.seen_in_photos': 'In {count} Foto(s) gesehen',
        'people_naming_queue.merged_success': 'Zusammengeführt',
        'people_naming_queue.hidden_success': 'Ausgeblendet, wird nicht erneut gefragt',
        'people_naming_queue.enter_name_warning': 'Geben Sie einen Namen ein',
        'people_naming_queue.name_saved_success': 'Name gespeichert',
    },
});

async function renderNamingQueue() {
    const container = $('naming-queue-container');
    if (!container) return;

    try {
        const data = await API.getNamingQueue();
        if (!data.queue.length) {
            container.innerHTML = '';
            return;
        }

        container.innerHTML = `
            <div class="naming-queue">
                <div class="naming-queue-header">
                    <h3 class="naming-queue-title">🏷 ${t('people_naming_queue.title', { count: data.queue.length })}</h3>
                </div>
                <div class="naming-queue-list">
                    ${data.queue.slice(0, 6).map(item => renderNamingQueueItem(item)).join('')}
                </div>
            </div>
        `;
        bindNamingQueueActions();
    } catch (e) { /* non-critical - just don't show the queue */ }
}

function renderNamingQueueItem(item) {
    const thumb = item.thumbnail_url
        ? `<img src="${item.thumbnail_url}" alt="">`
        : '<span style="font-size:1.5rem">👤</span>';

    const suggestion = item.suggested_person ? `
        <p class="naming-queue-question">${t('people_naming_queue.confirm_person_question', { name: `<strong>${escHtml(item.suggested_person.name)}</strong>` })}</p>
        <div class="naming-queue-actions">
            <button class="btn btn-primary btn-sm" data-action="confirm" data-id="${item.id}" data-target="${item.suggested_person.id}">✓ ${t('people_naming_queue.confirm_yes')}</button>
            <button class="btn btn-secondary btn-sm" data-action="reject" data-id="${item.id}">${t('people_naming_queue.reject_different_person')}</button>
            <button class="btn btn-secondary btn-sm" data-action="unknown" data-id="${item.id}">🤷 ${t('people_naming_queue.unknown_btn')}</button>
        </div>
    ` : `
        <input type="text" class="naming-queue-input" placeholder="${t('people_naming_queue.name_placeholder')}" data-id="${item.id}">
        <div class="naming-queue-actions">
            <button class="btn btn-primary btn-sm" data-action="name" data-id="${item.id}">${t('common.save')}</button>
            <button class="btn btn-secondary btn-sm" data-action="unknown" data-id="${item.id}">🤷 ${t('people_naming_queue.unknown_btn')}</button>
        </div>
    `;

    return `
        <div class="naming-queue-item" id="naming-item-${item.id}">
            <div class="naming-queue-avatar">${thumb}</div>
            <div class="naming-queue-body">
                <p class="naming-queue-count">${t('people_naming_queue.seen_in_photos', { count: item.face_count })}</p>
                ${suggestion}
            </div>
        </div>
    `;
}

function bindNamingQueueActions() {
    qsa('[data-action="confirm"]').forEach(btn => {
        btn.onclick = async () => {
            try {
                await API.mergePeople(btn.dataset.id, btn.dataset.target);
                toast(t('people_naming_queue.merged_success'), 'success');
                renderNamingQueue();
            } catch (e) { toast(e.message, 'error'); }
        };
    });

    // "Hayır" just clears the suggestion so a name can be typed instead -
    // it doesn't split anything, the group merely wasn't that person.
    qsa('[data-action="reject"]').forEach(btn => {
        btn.onclick = () => {
            const el = document.getElementById(`naming-item-${btn.dataset.id}`);
            if (el) {
                el.querySelector('.naming-queue-body').innerHTML = `
                    <p class="naming-queue-count">${el.querySelector('.naming-queue-count').textContent}</p>
                    <input type="text" class="naming-queue-input" placeholder="${t('people_naming_queue.name_placeholder')}" data-id="${btn.dataset.id}">
                    <div class="naming-queue-actions">
                        <button class="btn btn-primary btn-sm" data-action="name" data-id="${btn.dataset.id}">${t('common.save')}</button>
                        <button class="btn btn-secondary btn-sm" data-action="unknown" data-id="${btn.dataset.id}">🤷 ${t('people_naming_queue.unknown_btn')}</button>
                    </div>
                `;
                bindNamingQueueActions();
            }
        };
    });

    // "Tanımıyorum" hides the group (like the People page's existing hide
    // toggle) so it stops being asked about, without deleting anything -
    // the faces and photos are untouched, just no longer prompted for a name.
    qsa('[data-action="unknown"]').forEach(btn => {
        btn.onclick = async () => {
            try {
                await API.updatePerson(btn.dataset.id, { is_hidden: true });
                toast(t('people_naming_queue.hidden_success'), 'success');
                renderNamingQueue();
            } catch (e) { toast(e.message, 'error'); }
        };
    });

    qsa('[data-action="name"]').forEach(btn => {
        btn.onclick = async () => {
            const input = document.querySelector(`.naming-queue-input[data-id="${btn.dataset.id}"]`);
            const name = input ? input.value.trim() : '';
            if (!name) { toast(t('people_naming_queue.enter_name_warning'), 'warning'); return; }
            try {
                await API.updatePerson(btn.dataset.id, { name });
                toast(t('people_naming_queue.name_saved_success'), 'success');
                renderNamingQueue();
                if (state.currentPage === 'people') renderPeople();
            } catch (e) { toast(e.message, 'error'); }
        };
    });
}

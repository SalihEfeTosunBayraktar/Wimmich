/**
 * Wimmich - Recognized people list and per-person photo grid.
 */
registerTranslations({
    en: {
        'people.photo_count': '{count} photos',
        'people.empty_title': 'No people recognized yet',
        'people.empty_desc': 'Face recognition will run automatically as you upload photos.',
        'people.unknown_pool_title': 'Unknown People Pool ({count})',
        'people.unknown_person_fallback': 'Unknown Person',
        'people.name_input_placeholder': 'Enter name...',
        'people.back_to_list': '← Back to People List',
        'people.photos_tab_label': 'Photos ({count})',
        'people.correction_tab_label': 'Face Correction / Split ({count})',
        'people.no_faces_detected': 'No detected faces found.',
        'people.correction_info': "Is there a mismatched face in this album that doesn't belong to this person? Use the options below to remove the face from the album or move it to another person.",
        'people.make_new_person': 'Make New Person',
        'people.remove_from_group': 'Remove From Group',
        'people.move_to_another': 'Move to Another',
        'people.not_a_face': 'Not a Face',
        'people.face_reassigned_success': 'Face successfully removed from group/moved.',
        'people.confirm_delete_face': 'This detected face record will be permanently deleted (something incorrectly detected). Do you confirm?',
        'people.face_deleted_success': 'Face record deleted.',
        'people.pick_person_title': 'Select Person',
        'people.pick_person_confirm': 'Select',
        'people.search_name_placeholder': 'Search name...',
        'people.no_other_people_found': 'No other registered person available to select.',
        'people.no_matching_person': 'No matching person',
        'people.move_face_modal_title': 'Move Face to Another Person',
        'people.move_face_confirm': 'Move',
        'people.name_updated_success': 'Name updated',
        'people.hide_title': 'Hide this person',
        'people.unhide_title': 'Unhide this person',
        'people.hidden_success': 'Person hidden',
        'people.unhidden_success': 'Person unhidden',
        'people.hidden_people_title': 'Hidden People ({count})',
        'people.hidden_unknown_pool_title': 'Hidden Unknown People ({count})',
        'people.dissolve_title': 'Dissolve this group (wrongly clustered faces)',
        'people.confirm_dissolve': 'Dissolve this group? Its faces go back to the unclustered pool - the group itself is deleted, nothing else is touched.',
        'people.dissolved_success': 'Group dissolved',
        'people.dissolve_button': 'Dissolve Group',
        'people.delete_with_assets_button': 'Delete Person + Photos',
        'people.delete_with_assets_title': 'Move every photo this person appears in to the trash, then delete the person',
        'people.delete_with_assets_confirm': 'Move all {count} photos of this person to the trash and delete the person?\n\nPhotos that also show other people will be trashed too. They stay recoverable from the trash.',
        'people.delete_with_assets_done': '{count} photos moved to trash, person deleted',
        'people.name_suggestions_hint': 'Existing names',
        'people.blacklist_button': 'Select Photos to Review/Delete',
        'people.photos_selected_for_review': '{count} photos selected - review and delete the ones you don\'t want',
        'people.no_photos_to_select': 'This person has no photos',
    },
    tr: {
        'people.photo_count': '{count} fotoğraf',
        'people.empty_title': 'Henüz kişi tanınmadı',
        'people.empty_desc': 'Fotoğraf yükledikçe yüz tanıma otomatik çalışacaktır.',
        'people.unknown_pool_title': 'Bilinmeyen Kişiler Havuzu ({count})',
        'people.unknown_person_fallback': 'Bilinmeyen Kişi',
        'people.name_input_placeholder': 'İsim girin...',
        'people.back_to_list': '← Kişiler Listesine Dön',
        'people.photos_tab_label': 'Fotoğraflar ({count})',
        'people.correction_tab_label': 'Yüz Düzeltme / Ayırma ({count})',
        'people.no_faces_detected': 'Algılanan yüz bulunamadı.',
        'people.correction_info': 'Bu albümde o kişiye ait olmayan hatalı eşleşmiş bir yüz mü var? Aşağıdaki seçenekleri kullanarak yüzü albümden ayırabilir veya başka bir kişiye taşıyabilirsiniz.',
        'people.make_new_person': 'Yeni Kişi Yap',
        'people.remove_from_group': 'Gruptan Çıkar',
        'people.move_to_another': 'Başkasına Taşı',
        'people.not_a_face': 'Yüz Değil',
        'people.face_reassigned_success': 'Yüz başarıyla gruptan ayrıldı/taşındı.',
        'people.confirm_delete_face': 'Bu algılanan yüz kaydı tamamen silinecek (yanlış tespit edilmiş bir şey). Onaylıyor musunuz?',
        'people.face_deleted_success': 'Yüz kaydı silindi.',
        'people.pick_person_title': 'Kişi Seç',
        'people.pick_person_confirm': 'Seç',
        'people.search_name_placeholder': 'İsim ara...',
        'people.no_other_people_found': 'Seçilebilecek başka kayıtlı kişi bulunamadı.',
        'people.no_matching_person': 'Eşleşen kişi yok',
        'people.move_face_modal_title': 'Yüzü Başka Bir Kişiye Taşı',
        'people.move_face_confirm': 'Taşı',
        'people.name_updated_success': 'İsim güncellendi',
        'people.hide_title': 'Bu kişiyi gizle',
        'people.unhide_title': 'Bu kişiyi göster',
        'people.hidden_success': 'Kişi gizlendi',
        'people.unhidden_success': 'Kişi tekrar görünür yapıldı',
        'people.hidden_people_title': 'Gizli Kişiler ({count})',
        'people.hidden_unknown_pool_title': 'Gizli Bilinmeyen Kişiler ({count})',
        'people.dissolve_title': 'Bu grubu dağıt (yanlış gruplanmış yüzler)',
        'people.confirm_dissolve': 'Bu grup dağıtılsın mı? İçindeki yüzler gruplanmamış havuza geri döner - sadece grup silinir, başka bir şeye dokunulmaz.',
        'people.dissolved_success': 'Grup dağıtıldı',
        'people.dissolve_button': 'Grubu Dağıt',
        'people.delete_with_assets_button': 'Kişiyi + Fotoğraflarını Sil',
        'people.delete_with_assets_title': 'Bu kişinin göründüğü tüm fotoğrafları çöp kutusuna taşı, sonra kişiyi sil',
        'people.delete_with_assets_confirm': 'Bu kişiye ait {count} fotoğrafın tamamı çöp kutusuna taşınsın ve kişi silinsin mi?\n\nİçinde başka kişiler de olan fotoğraflar da çöpe gider. Çöp kutusundan geri alınabilirler.',
        'people.delete_with_assets_done': '{count} fotoğraf çöp kutusuna taşındı, kişi silindi',
        'people.name_suggestions_hint': 'Mevcut isimler',
        'people.blacklist_button': 'Fotoğrafları Seç (İncele/Sil)',
        'people.photos_selected_for_review': '{count} fotoğraf seçildi - istemediklerinizi inceleyip silebilirsiniz',
        'people.no_photos_to_select': 'Bu kişiye ait fotoğraf yok',
    },
    fr: {
        'people.photo_count': '{count} photos',
        'people.empty_title': 'Aucune personne reconnue pour le moment',
        'people.empty_desc': 'La reconnaissance faciale s’exécutera automatiquement au fur et à mesure que vous téléchargez des photos.',
        'people.unknown_pool_title': 'Groupe de personnes inconnues ({count})',
        'people.unknown_person_fallback': 'Personne inconnue',
        'people.name_input_placeholder': 'Entrez un nom...',
        'people.back_to_list': '← Retour à la liste des personnes',
        'people.photos_tab_label': 'Photos ({count})',
        'people.correction_tab_label': 'Correction / Séparation des visages ({count})',
        'people.no_faces_detected': 'Aucun visage détecté trouvé.',
        'people.correction_info': "Y a-t-il un visage mal associé dans cet album qui n'appartient pas à cette personne ? Utilisez les options ci-dessous pour retirer le visage de l'album ou le déplacer vers une autre personne.",
        'people.make_new_person': 'Créer une nouvelle personne',
        'people.remove_from_group': 'Retirer du groupe',
        'people.move_to_another': 'Déplacer vers une autre',
        'people.not_a_face': 'Pas un visage',
        'people.face_reassigned_success': 'Visage retiré du groupe / déplacé avec succès.',
        'people.confirm_delete_face': 'Cet enregistrement de visage détecté sera définitivement supprimé (quelque chose détecté par erreur). Confirmez-vous ?',
        'people.face_deleted_success': 'Enregistrement du visage supprimé.',
        'people.pick_person_title': 'Sélectionner une personne',
        'people.pick_person_confirm': 'Sélectionner',
        'people.search_name_placeholder': 'Rechercher un nom...',
        'people.no_other_people_found': 'Aucune autre personne enregistrée disponible à sélectionner.',
        'people.no_matching_person': 'Aucune personne correspondante',
        'people.move_face_modal_title': 'Déplacer le visage vers une autre personne',
        'people.move_face_confirm': 'Déplacer',
        'people.name_updated_success': 'Nom mis à jour',
        'people.hide_title': 'Masquer cette personne',
        'people.unhide_title': 'Afficher cette personne',
        'people.hidden_success': 'Personne masquée',
        'people.unhidden_success': 'Personne affichée à nouveau',
        'people.hidden_people_title': 'Personnes masquées ({count})',
        'people.hidden_unknown_pool_title': 'Personnes inconnues masquées ({count})',
        'people.dissolve_title': 'Dissoudre ce groupe (visages mal regroupés)',
        'people.confirm_dissolve': 'Dissoudre ce groupe ? Ses visages retournent dans le pool non groupé - seul le groupe est supprimé, rien d\'autre n\'est touché.',
        'people.dissolved_success': 'Groupe dissous',
        'people.dissolve_button': 'Dissoudre le groupe',
        'people.delete_with_assets_button': 'Supprimer la personne + photos',
        'people.delete_with_assets_title': 'Mettre à la corbeille toutes les photos où apparaît cette personne, puis la supprimer',
        'people.delete_with_assets_confirm': 'Mettre à la corbeille les {count} photos de cette personne et la supprimer ?\n\nLes photos montrant aussi d\'autres personnes seront également mises à la corbeille. Elles restent récupérables.',
        'people.delete_with_assets_done': '{count} photos mises à la corbeille, personne supprimée',
        'people.name_suggestions_hint': 'Noms existants',
        'people.blacklist_button': 'Sélectionner les photos à examiner/supprimer',
        'people.photos_selected_for_review': '{count} photos sélectionnées - examinez et supprimez celles que vous ne voulez pas',
        'people.no_photos_to_select': 'Cette personne n\'a aucune photo',
    },
    de: {
        'people.photo_count': '{count} Fotos',
        'people.empty_title': 'Noch keine Personen erkannt',
        'people.empty_desc': 'Die Gesichtserkennung läuft automatisch, sobald Sie Fotos hochladen.',
        'people.unknown_pool_title': 'Pool unbekannter Personen ({count})',
        'people.unknown_person_fallback': 'Unbekannte Person',
        'people.name_input_placeholder': 'Namen eingeben...',
        'people.back_to_list': '← Zurück zur Personenliste',
        'people.photos_tab_label': 'Fotos ({count})',
        'people.correction_tab_label': 'Gesichtskorrektur / Trennung ({count})',
        'people.no_faces_detected': 'Keine erkannten Gesichter gefunden.',
        'people.correction_info': 'Gibt es in diesem Album ein falsch zugeordnetes Gesicht, das nicht zu dieser Person gehört? Verwenden Sie die folgenden Optionen, um das Gesicht aus dem Album zu entfernen oder es einer anderen Person zuzuordnen.',
        'people.make_new_person': 'Neue Person erstellen',
        'people.remove_from_group': 'Aus Gruppe entfernen',
        'people.move_to_another': 'Zu einer anderen verschieben',
        'people.not_a_face': 'Kein Gesicht',
        'people.face_reassigned_success': 'Gesicht erfolgreich aus der Gruppe entfernt/verschoben.',
        'people.confirm_delete_face': 'Dieser erkannte Gesichtseintrag wird dauerhaft gelöscht (etwas fälschlicherweise erkannt). Bestätigen Sie?',
        'people.face_deleted_success': 'Gesichtseintrag gelöscht.',
        'people.pick_person_title': 'Person auswählen',
        'people.pick_person_confirm': 'Auswählen',
        'people.search_name_placeholder': 'Namen suchen...',
        'people.no_other_people_found': 'Keine andere registrierte Person zur Auswahl verfügbar.',
        'people.no_matching_person': 'Keine passende Person',
        'people.move_face_modal_title': 'Gesicht zu einer anderen Person verschieben',
        'people.move_face_confirm': 'Verschieben',
        'people.name_updated_success': 'Name aktualisiert',
        'people.hide_title': 'Diese Person ausblenden',
        'people.unhide_title': 'Diese Person wieder einblenden',
        'people.hidden_success': 'Person ausgeblendet',
        'people.unhidden_success': 'Person wieder eingeblendet',
        'people.hidden_people_title': 'Ausgeblendete Personen ({count})',
        'people.hidden_unknown_pool_title': 'Ausgeblendete unbekannte Personen ({count})',
        'people.dissolve_title': 'Diese Gruppe auflösen (falsch gruppierte Gesichter)',
        'people.confirm_dissolve': 'Diese Gruppe auflösen? Ihre Gesichter kommen zurück in den nicht gruppierten Pool - nur die Gruppe wird gelöscht, sonst nichts.',
        'people.dissolved_success': 'Gruppe aufgelöst',
        'people.dissolve_button': 'Gruppe auflösen',
        'people.delete_with_assets_button': 'Person + Fotos löschen',
        'people.delete_with_assets_title': 'Alle Fotos, auf denen diese Person erscheint, in den Papierkorb verschieben und die Person löschen',
        'people.delete_with_assets_confirm': 'Alle {count} Fotos dieser Person in den Papierkorb verschieben und die Person löschen?\n\nFotos, auf denen auch andere Personen zu sehen sind, landen ebenfalls im Papierkorb. Sie bleiben wiederherstellbar.',
        'people.delete_with_assets_done': '{count} Fotos in den Papierkorb verschoben, Person gelöscht',
        'people.name_suggestions_hint': 'Vorhandene Namen',
        'people.blacklist_button': 'Fotos zur Prüfung/Löschung auswählen',
        'people.photos_selected_for_review': '{count} Fotos ausgewählt - prüfen und löschen Sie die unerwünschten',
        'people.no_photos_to_select': 'Diese Person hat keine Fotos',
    },
});

function _renderPersonCard(p, { hidden = false, showDissolve = false } = {}) {
    return `
        <div class="person-card" onclick="openPerson('${p.id}')">
            ${showDissolve ? `<button class="person-dissolve-btn" onclick="event.stopPropagation(); dissolvePersonAction('${p.id}')" title="${t('people.dissolve_title')}">${icon('explosion')}</button>` : ''}
            <button class="person-hide-btn" onclick="event.stopPropagation(); togglePersonHidden('${p.id}', ${!hidden})" title="${hidden ? t('people.unhide_title') : t('people.hide_title')}">${hidden ? icon('eyeOff') : icon('eye')}</button>
            <div class="person-avatar">
                ${p.thumbnail_url ? `<img src="${p.thumbnail_url}" alt="">` : `<span style="color:var(--text-muted)">${icon('person', 32)}</span>`}
            </div>
            <div class="person-name">${escHtml(p.name)}</div>
            <div class="person-count">${t('people.photo_count', { count: p.face_count })}</div>
        </div>
    `;
}

async function dissolvePersonAction(personId) {
    try {
        await API.dissolvePerson(personId);
        toast(t('people.dissolved_success'), 'success');
        renderPeople();
    } catch (e) { toast(e.message, 'error'); }
}

// Gathers every photo of this person into the existing multi-select
// mechanism so the user can review and delete the unwanted ones themselves
// via the selection bar's own Delete button - deliberately not an
// auto-delete, and deliberately not a new persisted "blacklisted" flag on
// Person (nothing asked for that; this is a one-shot "select for review").
async function blacklistPersonAction(personId) {
    try {
        const person = await API.getPerson(personId);
        if (!person.assets || !person.assets.length) {
            toast(t('people.no_photos_to_select'), 'info');
            return;
        }
        if (state.personSubTab !== 'photos') {
            state.personSubTab = 'photos';
            await openPerson(personId);
        }
        clearSelection();
        person.assets.forEach(a => state.selectedAssets.add(a.id));
        document.querySelectorAll('#person-sub-content .photo-card').forEach(card => {
            if (state.selectedAssets.has(card.dataset.id)) _setCardSelected(card, true);
        });
        updateSelectionBar();
        toast(t('people.photos_selected_for_review', { count: person.assets.length }), 'info');
    } catch (e) { toast(e.message, 'error'); }
}

async function togglePersonHidden(id, hide) {
    try {
        await API.updatePerson(id, { is_hidden: hide });
        toast(hide ? t('people.hidden_success') : t('people.unhidden_success'), 'success');
        renderPeople();
    } catch (e) { toast(e.message, 'error'); }
}

async function renderPeople() {
    state.personSubTab = 'photos';
    try {
        const data = await API.getPeople();
        const pc = $('page-content');
        const unknownPool = data.unknown_pool || [];
        const hiddenPeople = data.hidden || [];
        const hiddenUnknownPool = data.hidden_unknown_pool || [];
        const hiddenTotal = hiddenPeople.length + hiddenUnknownPool.length;
        if (!data.people.length && !unknownPool.length && !hiddenTotal) {
            pc.innerHTML = renderEmptyState(t('people.empty_title'), t('people.empty_desc'));
            return;
        }
        pc.innerHTML = `
            <div id="naming-queue-container"></div>
            <div class="people-grid">${data.people.map(p => _renderPersonCard(p, { showDissolve: true })).join('')}</div>
            ${unknownPool.length ? `
                <div class="unknown-pool-section">
                    <h3 class="unknown-pool-title" style="display:flex;align-items:center;gap:6px">${icon('question', 16)} ${t('people.unknown_pool_title', { count: unknownPool.length })}</h3>
                    <div class="people-grid">${unknownPool.map(p => _renderPersonCard(p, { showDissolve: true })).join('')}</div>
                </div>
            ` : ''}
            ${hiddenTotal ? `
                <details class="hidden-people-section">
                    <summary class="hidden-people-title"><span style="display:inline-flex;align-items:center;gap:6px">${icon('eyeOff', 16)} ${t('people.hidden_people_title', { count: hiddenTotal })}</span></summary>
                    ${hiddenPeople.length ? `<div class="people-grid">${hiddenPeople.map(p => _renderPersonCard(p, { hidden: true, showDissolve: true })).join('')}</div>` : ''}
                    ${hiddenUnknownPool.length ? `
                        <h4 class="unknown-pool-title" style="display:flex;align-items:center;gap:6px">${icon('question', 16)} ${t('people.hidden_unknown_pool_title', { count: hiddenUnknownPool.length })}</h4>
                        <div class="people-grid">${hiddenUnknownPool.map(p => _renderPersonCard(p, { hidden: true, showDissolve: true })).join('')}</div>
                    ` : ''}
                </details>
            ` : ''}
        `;
        renderNamingQueue();
    } catch (e) { toast(e.message, 'error'); }
}

async function openPerson(id) {
    try {
        const person = await API.getPerson(id);
        const pc = $('page-content');
        $('topbar-title').textContent = person.name || t('people.unknown_person_fallback');
        
        const subTab = state.personSubTab || 'photos';
        
        pc.innerHTML = `
            <div style="display:flex;align-items:center;gap:16px;margin-bottom:24px;background:var(--bg-secondary);padding:16px;border-radius:12px;border:1px solid var(--border-color);flex-wrap:wrap">
                <div class="person-avatar" style="width:80px;height:80px;margin:0;display:flex;align-items:center;justify-content:center;border-radius:50%;overflow:hidden;background:var(--bg-primary);border:2px solid var(--border-color)">
                    ${person.thumbnail_url ? `<img src="${person.thumbnail_url}" alt="" style="width:100%;height:100%;object-fit:cover">` : `<span style="color:var(--text-muted)">${icon('person', 32)}</span>`}
                </div>
                <div style="display:flex;flex-direction:column;gap:8px;flex:1;min-width:200px">
                    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
                        <div class="person-name-input-wrapper" style="position:relative;flex:1;max-width:300px">
                            <input type="text" id="person-name-input" value="${escHtml(person.name || '')}" style="width:100%;margin:0" placeholder="${t('people.name_input_placeholder')}" autocomplete="off">
                            <div id="person-name-suggestions" class="person-name-suggestions hidden"></div>
                        </div>
                        <button class="btn btn-primary btn-sm" onclick="renamePerson('${id}')">${t('common.save')}</button>
                    </div>
                    <div style="display:flex;gap:8px;flex-wrap:wrap">
                        <button class="btn btn-secondary btn-sm" onclick="navigateTo('people')">${t('people.back_to_list')}</button>
                        <button class="btn btn-secondary btn-sm" onclick="blacklistPersonAction('${id}')">${icon('ban')} ${t('people.blacklist_button')}</button>
                        <button class="btn btn-danger btn-sm" onclick="dissolvePersonAction('${id}')" title="${t('people.dissolve_title')}">${icon('explosion')} ${t('people.dissolve_button')}</button>
                        <button class="btn btn-danger btn-sm" onclick="deletePersonWithAssetsAction('${id}', ${person.assets.length})" title="${t('people.delete_with_assets_title')}">${icon('trash')} ${t('people.delete_with_assets_button')}</button>
                    </div>
                </div>
            </div>

            <div style="display:flex;gap:8px;margin-bottom:20px;border-bottom:1px solid var(--border-color);padding-bottom:10px;flex-wrap:wrap">
                <button class="btn btn-sm ${subTab === 'photos' ? 'btn-primary' : 'btn-secondary'}" onclick="setPersonSubTab('${id}', 'photos')" style="padding:6px 12px; font-size:13px">${icon('image', 14)} ${t('people.photos_tab_label', { count: person.assets.length })}</button>
                <button class="btn btn-sm ${subTab === 'correction' ? 'btn-primary' : 'btn-secondary'}" onclick="setPersonSubTab('${id}', 'correction')" style="padding:6px 12px; font-size:13px">${icon('settings', 14)} ${t('people.correction_tab_label', { count: person.faces ? person.faces.length : 0 })}</button>
            </div>

            <div id="person-sub-content">
                ${subTab === 'correction' ? renderFaceCorrectionTab(person) : renderPersonPhotosTab(person)}
            </div>
        `;
        
        _initPersonNameAutocomplete(id);

        if (subTab === 'photos') {
            bindPhotoCards(pc);
            state.viewerList = person.assets.map(a => a.id);
        }
    } catch (e) { toast(e.message, 'error'); }
}

// ─── Name autocomplete ─────────────────────────────────────────────
// Suggests names already used elsewhere in the library while typing, so
// assigning a face to someone who's already named is a pick from a list
// rather than retyping it - which is also what keeps "Ahmet" and "ahmet "
// from silently becoming two separate people.
let _personNameSuggestTimer = null;

function _initPersonNameAutocomplete(personId) {
    const input = $('person-name-input');
    const box = $('person-name-suggestions');
    if (!input || !box) return;

    const hide = () => box.classList.add('hidden');

    const run = async () => {
        try {
            const res = await API.getPersonNameSuggestions(input.value);
            // Never suggest the name this person already has - picking it
            // would be a no-op rename.
            const items = (res.suggestions || []).filter(s => s.name !== input.value.trim());
            if (!items.length) { hide(); return; }
            box.innerHTML = items.map(s => `
                <button type="button" class="person-name-suggestion-row" data-name="${escHtml(s.name)}">
                    ${icon('person', 14)} <span>${escHtml(s.name)}</span>
                    <span class="person-name-suggestion-count">${s.face_count}</span>
                </button>
            `).join('');
            box.querySelectorAll('.person-name-suggestion-row').forEach(row => {
                // mousedown, not click - the input's own blur fires first on
                // a plain click and would hide the list before the click
                // ever lands on it.
                row.onmousedown = (e) => {
                    e.preventDefault();
                    input.value = row.dataset.name;
                    hide();
                };
            });
            box.classList.remove('hidden');
        } catch (e) { hide(); }
    };

    input.addEventListener('input', () => {
        clearTimeout(_personNameSuggestTimer);
        _personNameSuggestTimer = setTimeout(run, 200);
    });
    input.addEventListener('focus', run);
    input.addEventListener('blur', () => setTimeout(hide, 150));
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') hide();
        if (e.key === 'Enter') { hide(); renamePerson(personId); }
    });
}

async function deletePersonWithAssetsAction(personId, photoCount) {
    if (!confirm(t('people.delete_with_assets_confirm', { count: photoCount }))) return;
    try {
        const res = await API.deletePersonWithAssets(personId);
        toast(t('people.delete_with_assets_done', { count: res.trashed }), 'success');
        navigateTo('people');
    } catch (e) { toast(e.message, 'error'); }
}

function setPersonSubTab(personId, tab) {
    state.personSubTab = tab;
    openPerson(personId);
}

function renderPersonPhotosTab(person) {
    return `<div class="photo-grid">${person.assets.map(a => renderPhotoCard(a)).join('')}</div>`;
}

function renderFaceCorrectionTab(person) {
    if (!person.faces || !person.faces.length) {
        return `<div class="empty-state">${t('people.no_faces_detected')}</div>`;
    }

    return `
        <p style="font-size:13px;color:var(--text-secondary);margin-bottom:16px;background:rgba(255,255,255,0.05);padding:12px;border-radius:8px;display:flex;align-items:flex-start;gap:6px">
            <span style="flex-shrink:0">${icon('lightbulb', 14)}</span> <span>${t('people.correction_info')}</span>
        </p>
        <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(150px, 1fr));gap:16px;padding:8px 0">
            ${person.faces.map(f => `
                <div class="face-card" style="background:var(--bg-secondary);border:1px solid var(--border-color);border-radius:12px;padding:12px;display:flex;flex-direction:column;align-items:center;gap:12px">
                    <div style="width:90px;height:90px;border-radius:50%;overflow:hidden;border:2px solid var(--border-color);background:var(--bg-primary)">
                        <img src="${f.thumbnail_url}" style="width:100%;height:100%;object-fit:cover">
                    </div>
                    <div style="display:flex;flex-direction:column;gap:6px;width:100%">
                        <button class="btn btn-secondary btn-sm" onclick="reassignFaceAction('${person.id}', '${f.id}', 'new')" style="font-size:11px;padding:6px 4px;width:100%">${icon('plus', 14)} ${t('people.make_new_person')}</button>
                        <button class="btn btn-secondary btn-sm" onclick="reassignFaceAction('${person.id}', '${f.id}', null)" style="font-size:11px;padding:6px 4px;width:100%">${icon('trash', 14)} ${t('people.remove_from_group')}</button>
                        <button class="btn btn-secondary btn-sm" onclick="showMoveFaceModal('${person.id}', '${f.id}')" style="font-size:11px;padding:6px 4px;width:100%">${icon('refresh', 14)} ${t('people.move_to_another')}</button>
                        <button class="btn btn-danger btn-sm" onclick="deleteFaceAction('${person.id}', '${f.id}')" style="font-size:11px;padding:6px 4px;width:100%">${icon('close', 14)} ${t('people.not_a_face')}</button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

async function reassignFaceAction(personId, faceId, targetPersonId) {
    try {
        await API.reassignFace(faceId, targetPersonId);
        toast(t('people.face_reassigned_success'), 'success');
        openPerson(personId);
    } catch (e) {
        toast(e.message, 'error');
    }
}

async function deleteFaceAction(personId, faceId) {
    try {
        await API.deleteFace(faceId);
        toast(t('people.face_deleted_success'), 'success');
        openPerson(personId);
    } catch (e) {
        toast(e.message, 'error');
    }
}

// Reusable search-as-you-type person picker (a plain <select>/prompt() list
// of every named person becomes unusable once there are 100+ people).
// Resolves with the picked person object, or null if cancelled/empty.
function pickPersonModal(excludePersonId, { title = t('people.pick_person_title'), confirmLabel = t('people.pick_person_confirm') } = {}) {
    return new Promise(async (resolve) => {
        let people;
        try {
            const data = await API.getPeople();
            people = data.people.filter(p => p.id !== excludePersonId);
        } catch (e) {
            toast(e.message, 'error');
            resolve(null);
            return;
        }
        if (!people.length) {
            toast(t('people.no_other_people_found'), 'info');
            resolve(null);
            return;
        }

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'pick-person-modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width:400px;background:var(--bg-secondary);border:1px solid var(--border-color);padding:24px;border-radius:12px;color:var(--text-primary)">
                <h3 style="margin-top:0">${escHtml(title)}</h3>
                <input type="text" id="pick-person-search" placeholder="${t('people.search_name_placeholder')}" autofocus
                    style="width:100%;padding:8px 12px;background:var(--bg-primary);border:1px solid var(--border-color);color:var(--text-primary);border-radius:6px;margin-bottom:10px;outline:none;box-sizing:border-box">
                <select id="pick-person-select" size="6" style="width:100%;padding:8px 12px;background:var(--bg-primary);border:1px solid var(--border-color);color:var(--text-primary);border-radius:6px;margin-bottom:20px;outline:none;box-sizing:border-box">
                    ${people.map(p => `<option value="${p.id}">${escHtml(p.name)}</option>`).join('')}
                </select>
                <div style="display:flex;justify-content:flex-end;gap:12px">
                    <button class="btn btn-secondary btn-sm" id="pick-person-cancel-btn">${t('common.cancel')}</button>
                    <button class="btn btn-primary btn-sm" id="pick-person-submit-btn">${escHtml(confirmLabel)}</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        const searchInput = $('pick-person-search');
        const targetSelect = $('pick-person-select');
        searchInput.oninput = () => {
            const q = searchInput.value.trim().toLocaleLowerCase(_DATE_LOCALES[getLanguage()]);
            const filtered = q
                ? people.filter(p => p.name.toLocaleLowerCase(_DATE_LOCALES[getLanguage()]).includes(q))
                : people;
            targetSelect.innerHTML = filtered.length
                ? filtered.map(p => `<option value="${p.id}">${escHtml(p.name)}</option>`).join('')
                : `<option disabled>${t('people.no_matching_person')}</option>`;
        };

        $('pick-person-cancel-btn').onclick = () => { modal.remove(); resolve(null); };
        $('pick-person-submit-btn').onclick = () => {
            const targetId = targetSelect.value;
            modal.remove();
            resolve(people.find(p => p.id === targetId) || null);
        };
    });
}

async function showMoveFaceModal(personId, faceId) {
    const target = await pickPersonModal(personId, { title: t('people.move_face_modal_title'), confirmLabel: t('people.move_face_confirm') });
    if (!target) return;
    await reassignFaceAction(personId, faceId, target.id);
}

async function renamePerson(id) {
    const name = $('person-name-input').value.trim();
    if (!name) return;
    await API.updatePerson(id, { name });
    toast(t('people.name_updated_success'), 'success');
}

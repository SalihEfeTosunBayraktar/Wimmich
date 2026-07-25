/**
 * Wimmich - Keyboard shortcuts help modal (opened with "?" or the sidebar's
 * help button). Purely informational - lists shortcuts that already exist
 * elsewhere (selection.js, viewer.js, timeline.js) rather than binding any
 * new behavior itself.
 */
registerTranslations({
    en: {
        'shortcuts.help_button_title': 'Keyboard shortcuts',
        'shortcuts.title': 'Keyboard Shortcuts',
        'shortcuts.group_general': 'General',
        'shortcuts.select_all': 'Select all photos',
        'shortcuts.delete_selected': 'Delete the selected photos',
        'shortcuts.open_shortcuts': 'Show this list',
        'shortcuts.group_selection': 'Selecting photos',
        'shortcuts.click_label': 'Click',
        'shortcuts.select_toggle': 'Select/deselect a photo (once something is already selected)',
        'shortcuts.select_range': 'Select everything between the last click and this one',
        'shortcuts.right_click_label': 'Right-click',
        'shortcuts.quick_actions': 'Quick actions for this photo, or the current selection',
        'shortcuts.drag_label': 'Drag',
        'shortcuts.select_drag': 'Drag a rectangle to select multiple photos',
        'shortcuts.group_viewer': 'Photo viewer',
        'shortcuts.viewer_navigate': 'Previous / next photo',
        'shortcuts.viewer_slideshow': 'Start/stop the slideshow',
        'shortcuts.viewer_delete': 'Delete the open photo',
        'shortcuts.viewer_close': 'Close the viewer',
    },
    tr: {
        'shortcuts.help_button_title': 'Klavye kısayolları',
        'shortcuts.title': 'Klavye Kısayolları',
        'shortcuts.group_general': 'Genel',
        'shortcuts.select_all': 'Tüm fotoğrafları seç',
        'shortcuts.delete_selected': 'Seçili fotoğrafları sil',
        'shortcuts.open_shortcuts': 'Bu listeyi göster',
        'shortcuts.group_selection': 'Fotoğraf seçme',
        'shortcuts.click_label': 'Tıkla',
        'shortcuts.select_toggle': 'Bir fotoğrafı seç/kaldır (zaten bir şey seçiliyken)',
        'shortcuts.select_range': 'Son tıklanan ile bu fotoğraf arasındaki her şeyi seç',
        'shortcuts.right_click_label': 'Sağ tık',
        'shortcuts.quick_actions': 'Bu fotoğraf veya mevcut seçim için hızlı işlemler',
        'shortcuts.drag_label': 'Sürükle',
        'shortcuts.select_drag': 'Birden fazla fotoğrafı dikdörtgen çizerek seç',
        'shortcuts.group_viewer': 'Fotoğraf görüntüleyici',
        'shortcuts.viewer_navigate': 'Önceki / sonraki fotoğraf',
        'shortcuts.viewer_slideshow': 'Slayt gösterisini başlat/durdur',
        'shortcuts.viewer_delete': 'Açık olan fotoğrafı sil',
        'shortcuts.viewer_close': 'Görüntüleyiciyi kapat',
    },
    fr: {
        'shortcuts.help_button_title': 'Raccourcis clavier',
        'shortcuts.title': 'Raccourcis clavier',
        'shortcuts.group_general': 'Général',
        'shortcuts.select_all': 'Sélectionner toutes les photos',
        'shortcuts.delete_selected': 'Supprimer les photos sélectionnées',
        'shortcuts.open_shortcuts': 'Afficher cette liste',
        'shortcuts.group_selection': 'Sélectionner des photos',
        'shortcuts.click_label': 'Clic',
        'shortcuts.select_toggle': 'Sélectionner/désélectionner une photo (une fois qu\'une sélection existe déjà)',
        'shortcuts.select_range': 'Sélectionner tout entre le dernier clic et celui-ci',
        'shortcuts.right_click_label': 'Clic droit',
        'shortcuts.quick_actions': 'Actions rapides pour cette photo ou la sélection actuelle',
        'shortcuts.drag_label': 'Glisser',
        'shortcuts.select_drag': 'Glisser un rectangle pour sélectionner plusieurs photos',
        'shortcuts.group_viewer': 'Visionneuse',
        'shortcuts.viewer_navigate': 'Photo précédente / suivante',
        'shortcuts.viewer_slideshow': 'Démarrer/arrêter le diaporama',
        'shortcuts.viewer_delete': 'Supprimer la photo ouverte',
        'shortcuts.viewer_close': 'Fermer la visionneuse',
    },
    de: {
        'shortcuts.help_button_title': 'Tastenkürzel',
        'shortcuts.title': 'Tastenkürzel',
        'shortcuts.group_general': 'Allgemein',
        'shortcuts.select_all': 'Alle Fotos auswählen',
        'shortcuts.delete_selected': 'Ausgewählte Fotos löschen',
        'shortcuts.open_shortcuts': 'Diese Liste anzeigen',
        'shortcuts.group_selection': 'Fotos auswählen',
        'shortcuts.click_label': 'Klick',
        'shortcuts.select_toggle': 'Foto auswählen/abwählen (wenn bereits etwas ausgewählt ist)',
        'shortcuts.select_range': 'Alles zwischen dem letzten Klick und diesem auswählen',
        'shortcuts.right_click_label': 'Rechtsklick',
        'shortcuts.quick_actions': 'Schnellaktionen für dieses Foto oder die aktuelle Auswahl',
        'shortcuts.drag_label': 'Ziehen',
        'shortcuts.select_drag': 'Ein Rechteck ziehen, um mehrere Fotos auszuwählen',
        'shortcuts.group_viewer': 'Fotoansicht',
        'shortcuts.viewer_navigate': 'Vorheriges / nächstes Foto',
        'shortcuts.viewer_slideshow': 'Diashow starten/stoppen',
        'shortcuts.viewer_delete': 'Geöffnetes Foto löschen',
        'shortcuts.viewer_close': 'Ansicht schließen',
    },
});

function openShortcutsModal() {
    $('shortcuts-modal').classList.remove('hidden');
}

function closeShortcutsModal() {
    $('shortcuts-modal').classList.add('hidden');
}

function initShortcutsModal() {
    $('shortcuts-help-btn').onclick = openShortcutsModal;
    $('shortcuts-modal-close').onclick = closeShortcutsModal;
    $('shortcuts-modal').onclick = (e) => {
        if (e.target === $('shortcuts-modal')) closeShortcutsModal();
    };

    document.addEventListener('keydown', (e) => {
        const modal = $('shortcuts-modal');
        if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
            closeShortcutsModal();
            return;
        }
        // Never fires while typing in a field, and Shift+/ is what actually
        // produces "?" on a standard layout - checking e.key directly (not
        // e.shiftKey) keeps this working on layouts where "?" isn't Shift+/.
        if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
        if (e.key === '?') {
            e.preventDefault();
            openShortcutsModal();
        }
    });
}

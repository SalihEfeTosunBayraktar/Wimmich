/**
 * Wimmich - Mobile sidebar toggle.
 */
function initSidebar() {
    $('sidebar-toggle').onclick = () => $('sidebar').classList.toggle('open');
    document.addEventListener('click', (e) => {
        // e.target is whatever was actually tapped - the button's own SVG
        // icon on a hit, not the <button> itself - so a strict `!==`
        // against the button element missed most real taps on it and
        // this listener closed the sidebar in the same click that just
        // opened it. closest() catches taps anywhere inside the button.
        if ($('sidebar').classList.contains('open') && !$('sidebar').contains(e.target) && !e.target.closest('#sidebar-toggle')) {
            $('sidebar').classList.remove('open');
        }
    });

    // The sidebar's own footer buttons (profile settings, keyboard
    // shortcuts) open a modal instead of routing, so navigateTo()'s close
    // never ran and on mobile the open drawer sat on top of the modal.
    // Watching the overlays rather than wiring up each button means a modal
    // added later gets the same behaviour without anyone remembering to -
    // and the click that opened it is, by definition, the last thing the
    // drawer was needed for.
    const closeOnModalOpen = new MutationObserver(records => {
        for (const r of records) {
            if (!r.target.classList.contains('hidden')) {
                $('sidebar').classList.remove('open');
                return;
            }
        }
    });
    qsa('.modal-overlay').forEach(m => {
        closeOnModalOpen.observe(m, { attributes: true, attributeFilter: ['class'] });
    });
}

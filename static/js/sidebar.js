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
}

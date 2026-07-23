/**
 * Wimmich - Light/dark/system theme switch (Profile Settings modal).
 * The actual attribute is already applied before first paint by the inline
 * script in index.html's <head> - this file only wires up the switch UI and
 * reacts to later changes (a click, or the OS theme changing while "System"
 * is selected).
 */
registerTranslations({
    en: {
        'profile.theme_label': 'Theme',
        'profile.theme_light': 'Light',
        'profile.theme_dark': 'Dark',
        'profile.theme_system': 'System',
    },
    tr: {
        'profile.theme_label': 'Tema',
        'profile.theme_light': 'Aydınlık',
        'profile.theme_dark': 'Koyu',
        'profile.theme_system': 'Sistem',
    },
    fr: {
        'profile.theme_label': 'Thème',
        'profile.theme_light': 'Clair',
        'profile.theme_dark': 'Sombre',
        'profile.theme_system': 'Système',
    },
    de: {
        'profile.theme_label': 'Design',
        'profile.theme_light': 'Hell',
        'profile.theme_dark': 'Dunkel',
        'profile.theme_system': 'System',
    },
});

const THEME_STORAGE_KEY = 'wimmich_theme';

function _resolveTheme(choice) {
    if (choice !== 'system') return choice;
    return (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) ? 'light' : 'dark';
}

function getThemeChoice() {
    try {
        return localStorage.getItem(THEME_STORAGE_KEY) || 'system';
    } catch (e) {
        return 'system';
    }
}

function applyTheme(choice) {
    try {
        localStorage.setItem(THEME_STORAGE_KEY, choice);
    } catch (e) { /* private browsing / storage disabled - theme just won't persist */ }
    document.documentElement.setAttribute('data-theme', _resolveTheme(choice));
    document.querySelectorAll('#theme-switch .theme-switch-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.themeChoice === choice);
    });
}

function initThemeSwitch() {
    document.querySelectorAll('#theme-switch .theme-switch-btn').forEach(btn => {
        btn.onclick = () => applyTheme(btn.dataset.themeChoice);
    });
    applyTheme(getThemeChoice());

    // Only matters while "System" is selected - if the choice is an explicit
    // light/dark override, the OS setting changing shouldn't touch it.
    if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
            if (getThemeChoice() === 'system') applyTheme('system');
        });
    }
}

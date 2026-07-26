/**
 * Wimmich - Admin: Cloudflare Tunnel panel templating and controls.
 */
registerTranslations({
    en: {
        'admin_tunnel.not_found': 'cloudflared not found. cloudflared is required for remote access.',
        'admin_tunnel.download_button': 'Download cloudflared',
        'admin_tunnel.download_manual': 'Or download it {link} and place it in the project folder.',
        'admin_tunnel.download_manual_link_text': 'from here',
        'admin_tunnel.active_custom_token': 'Tunnel Active (Custom Token)',
        'admin_tunnel.stop': 'Stop',
        'admin_tunnel.custom_token_no_domain_warning': 'No custom domain name was entered, so the connection address cannot be shown. Enter the domain you defined in the Zero Trust panel into the "Your Custom Domain" field above and save it.',
        'admin_tunnel.active': 'Tunnel Active',
        'admin_tunnel.share_url_label': 'Share URL:',
        'admin_tunnel.copied': 'Copied!',
        'admin_tunnel.share_hint': 'Your friends and family can access your photos with this URL.',
        'admin_tunnel.intro': 'Share your server over the internet with Cloudflare Tunnel. No need to open any ports!',
        'admin_tunnel.start_button': 'Start Tunnel',
        'admin_tunnel.quick_tunnel_hint': 'Uses a quick tunnel, no Cloudflare account required. You can turn it off anytime.',
        'admin_tunnel.starting': 'Starting tunnel...',
        'admin_tunnel.started_with_url': 'Tunnel started! URL: {url}',
        'admin_tunnel.starting_wait': 'Tunnel is starting, please wait...',
        'admin_tunnel.stopped': 'Tunnel stopped',
        'admin_tunnel.downloading': 'Downloading cloudflared...',
        'admin_tunnel.downloaded': 'cloudflared downloaded!',
        'admin_tunnel.other_methods_heading': 'Other Access Methods',
        'admin_tunnel.other_methods_info_hint': "If you'd rather not expose a public URL at all, these keep access private to devices you control: Tailscale creates a private network between just your own devices, and a reverse proxy/port-forward is entirely your own network setup - Wimmich doesn't need to know which one you use.",
        'admin_tunnel.tailscale_not_installed': 'Tailscale not detected. It\'s an alternative to the Cloudflare Tunnel above - a private network between your own devices, no public URL involved.',
        'admin_tunnel.tailscale_install_link_text': 'Install Tailscale',
        'admin_tunnel.tailscale_not_running': 'Tailscale is installed but not signed in yet - run "tailscale up" or sign in from its tray icon.',
        'admin_tunnel.tailscale_running': 'Tailscale is active - reachable from your other Tailscale devices at:',
        'admin_tunnel.reverse_proxy_hint': 'You can also put your own reverse proxy (nginx, Caddy, ...) or router port-forward in front of this server instead - it listens on every network interface, no code changes needed.',
    },
    tr: {
        'admin_tunnel.not_found': 'cloudflared bulunamadı. Uzaktan erişim için cloudflared gereklidir.',
        'admin_tunnel.download_button': 'cloudflared İndir',
        'admin_tunnel.download_manual': 'Veya {link} indirip proje klasörüne koyun.',
        'admin_tunnel.download_manual_link_text': 'buradan',
        'admin_tunnel.active_custom_token': 'Tunnel Aktif (Özel Token)',
        'admin_tunnel.stop': 'Durdur',
        'admin_tunnel.custom_token_no_domain_warning': 'Özel domain adı girilmedi, bu yüzden bağlantı adresi gösterilemiyor. Yukarıdaki "Özel Domain Adınız" alanına Zero Trust panelinde tanımladığınız domaini yazıp kaydedin.',
        'admin_tunnel.active': 'Tunnel Aktif',
        'admin_tunnel.share_url_label': "Paylaşım URL'i:",
        'admin_tunnel.copied': 'Kopyalandı!',
        'admin_tunnel.share_hint': 'Arkadaşlarınız ve aileniz bu URL ile fotoğraflarınıza erişebilir.',
        'admin_tunnel.intro': 'Cloudflare Tunnel ile sunucunuzu internet üzerinden paylaşın. Port açmaya gerek yok!',
        'admin_tunnel.start_button': 'Tunnel Başlat',
        'admin_tunnel.quick_tunnel_hint': 'Hızlı tunnel kullanır, Cloudflare hesabı gerekmez. İstediğiniz zaman kapatabilirsiniz.',
        'admin_tunnel.starting': 'Tunnel başlatılıyor...',
        'admin_tunnel.started_with_url': 'Tunnel başlatıldı! URL: {url}',
        'admin_tunnel.starting_wait': 'Tunnel başlatılıyor, lütfen bekleyin...',
        'admin_tunnel.stopped': 'Tunnel durduruldu',
        'admin_tunnel.downloading': 'cloudflared indiriliyor...',
        'admin_tunnel.downloaded': 'cloudflared indirildi!',
        'admin_tunnel.other_methods_heading': 'Diğer Erişim Yöntemleri',
        'admin_tunnel.other_methods_info_hint': "Herkese açık bir URL hiç açmak istemiyorsanız, bunlar erişimi sadece kendi kontrolünüzdeki cihazlarla sınırlı tutar: Tailscale sadece kendi cihazlarınız arasında özel bir ağ oluşturur, reverse proxy/port yönlendirme ise tamamen kendi ağ kurulumunuzdur - Wimmich hangisini kullandığınızı bilmesine gerek duymaz.",
        'admin_tunnel.tailscale_not_installed': 'Tailscale tespit edilemedi. Yukarıdaki Cloudflare Tunnel\'a bir alternatif - kendi cihazlarınız arasında özel bir ağ, herkese açık bir URL gerekmez.',
        'admin_tunnel.tailscale_install_link_text': "Tailscale'i Kur",
        'admin_tunnel.tailscale_not_running': 'Tailscale kurulu ama henüz giriş yapılmamış - "tailscale up" komutunu çalıştırın veya sistem tepsisindeki simgeden giriş yapın.',
        'admin_tunnel.tailscale_running': 'Tailscale aktif - diğer Tailscale cihazlarınızdan şu adresle erişilebilir:',
        'admin_tunnel.reverse_proxy_hint': 'İsterseniz bunun yerine kendi reverse proxy\'nizi (nginx, Caddy vb.) veya router port yönlendirmenizi de kullanabilirsiniz - sunucu tüm ağ arayüzlerinde dinliyor, kod değişikliği gerekmiyor.',
    },
    fr: {
        'admin_tunnel.not_found': "cloudflared introuvable. cloudflared est requis pour l'accès à distance.",
        'admin_tunnel.download_button': 'Télécharger cloudflared',
        'admin_tunnel.download_manual': "Ou téléchargez-le {link} et placez-le dans le dossier du projet.",
        'admin_tunnel.download_manual_link_text': 'ici',
        'admin_tunnel.active_custom_token': 'Tunnel actif (jeton personnalisé)',
        'admin_tunnel.stop': 'Arrêter',
        'admin_tunnel.custom_token_no_domain_warning': "Aucun nom de domaine personnalisé n'a été saisi, l'adresse de connexion ne peut donc pas être affichée. Saisissez dans le champ « Votre domaine personnalisé » ci-dessus le domaine que vous avez défini dans le panneau Zero Trust, puis enregistrez.",
        'admin_tunnel.active': 'Tunnel actif',
        'admin_tunnel.share_url_label': 'URL de partage :',
        'admin_tunnel.copied': 'Copié !',
        'admin_tunnel.share_hint': 'Vos amis et votre famille peuvent accéder à vos photos avec cette URL.',
        'admin_tunnel.intro': "Partagez votre serveur sur Internet avec Cloudflare Tunnel. Aucun port à ouvrir !",
        'admin_tunnel.start_button': 'Démarrer le tunnel',
        'admin_tunnel.quick_tunnel_hint': "Utilise un tunnel rapide, aucun compte Cloudflare requis. Vous pouvez l'arrêter à tout moment.",
        'admin_tunnel.starting': 'Démarrage du tunnel...',
        'admin_tunnel.started_with_url': 'Tunnel démarré ! URL : {url}',
        'admin_tunnel.starting_wait': 'Le tunnel démarre, veuillez patienter...',
        'admin_tunnel.stopped': 'Tunnel arrêté',
        'admin_tunnel.downloading': 'Téléchargement de cloudflared...',
        'admin_tunnel.downloaded': 'cloudflared téléchargé !',
        'admin_tunnel.other_methods_heading': "Autres méthodes d'accès",
        'admin_tunnel.other_methods_info_hint': "Si vous préférez ne pas exposer d'URL publique du tout, ces méthodes gardent l'accès privé aux appareils que vous contrôlez : Tailscale crée un réseau privé entre vos seuls appareils, et un reverse proxy/redirection de port est entièrement votre propre configuration réseau - Wimmich n'a pas besoin de savoir lequel vous utilisez.",
        'admin_tunnel.tailscale_not_installed': "Tailscale non détecté. C'est une alternative au Cloudflare Tunnel ci-dessus - un réseau privé entre vos propres appareils, sans URL publique.",
        'admin_tunnel.tailscale_install_link_text': 'Installer Tailscale',
        'admin_tunnel.tailscale_not_running': 'Tailscale est installé mais pas encore connecté - exécutez "tailscale up" ou connectez-vous depuis son icône de la barre des tâches.',
        'admin_tunnel.tailscale_running': 'Tailscale est actif - accessible depuis vos autres appareils Tailscale à :',
        'admin_tunnel.reverse_proxy_hint': "Vous pouvez aussi placer votre propre reverse proxy (nginx, Caddy, ...) ou une redirection de port de routeur devant ce serveur - il écoute sur toutes les interfaces réseau, aucune modification de code nécessaire.",
    },
    de: {
        'admin_tunnel.not_found': 'cloudflared nicht gefunden. cloudflared wird für den Fernzugriff benötigt.',
        'admin_tunnel.download_button': 'cloudflared herunterladen',
        'admin_tunnel.download_manual': 'Oder laden Sie es {link} herunter und legen Sie es im Projektordner ab.',
        'admin_tunnel.download_manual_link_text': 'von hier',
        'admin_tunnel.active_custom_token': 'Tunnel aktiv (Benutzerdefiniertes Token)',
        'admin_tunnel.stop': 'Stoppen',
        'admin_tunnel.custom_token_no_domain_warning': 'Es wurde kein benutzerdefinierter Domainname eingegeben, daher kann die Verbindungsadresse nicht angezeigt werden. Geben Sie im obigen Feld „Ihre benutzerdefinierte Domain" die im Zero-Trust-Panel definierte Domain ein und speichern Sie.',
        'admin_tunnel.active': 'Tunnel aktiv',
        'admin_tunnel.share_url_label': 'Freigabe-URL:',
        'admin_tunnel.copied': 'Kopiert!',
        'admin_tunnel.share_hint': 'Ihre Freunde und Familie können mit dieser URL auf Ihre Fotos zugreifen.',
        'admin_tunnel.intro': 'Teilen Sie Ihren Server über das Internet mit Cloudflare Tunnel. Keine Ports öffnen nötig!',
        'admin_tunnel.start_button': 'Tunnel starten',
        'admin_tunnel.quick_tunnel_hint': 'Verwendet einen Quick Tunnel, kein Cloudflare-Konto erforderlich. Sie können ihn jederzeit ausschalten.',
        'admin_tunnel.starting': 'Tunnel wird gestartet...',
        'admin_tunnel.started_with_url': 'Tunnel gestartet! URL: {url}',
        'admin_tunnel.starting_wait': 'Tunnel wird gestartet, bitte warten...',
        'admin_tunnel.stopped': 'Tunnel gestoppt',
        'admin_tunnel.downloading': 'cloudflared wird heruntergeladen...',
        'admin_tunnel.downloaded': 'cloudflared heruntergeladen!',
        'admin_tunnel.other_methods_heading': 'Andere Zugriffsmethoden',
        'admin_tunnel.other_methods_info_hint': 'Wenn Sie überhaupt keine öffentliche URL preisgeben möchten, halten diese den Zugriff privat auf Geräte, die Sie kontrollieren: Tailscale erstellt ein privates Netzwerk nur zwischen Ihren eigenen Geräten, und ein Reverse-Proxy/Port-Forwarding ist ganz Ihre eigene Netzwerkeinrichtung - Wimmich muss nicht wissen, welches Sie verwenden.',
        'admin_tunnel.tailscale_not_installed': 'Tailscale nicht erkannt. Es ist eine Alternative zum Cloudflare Tunnel oben - ein privates Netzwerk zwischen Ihren eigenen Geräten, ohne öffentliche URL.',
        'admin_tunnel.tailscale_install_link_text': 'Tailscale installieren',
        'admin_tunnel.tailscale_not_running': 'Tailscale ist installiert, aber noch nicht angemeldet - führen Sie "tailscale up" aus oder melden Sie sich über das Symbol in der Taskleiste an.',
        'admin_tunnel.tailscale_running': 'Tailscale ist aktiv - von Ihren anderen Tailscale-Geräten erreichbar unter:',
        'admin_tunnel.reverse_proxy_hint': 'Sie können stattdessen auch Ihren eigenen Reverse-Proxy (nginx, Caddy, ...) oder eine Router-Portweiterleitung vor diesen Server schalten - er lauscht auf allen Netzwerkschnittstellen, keine Codeänderungen nötig.',
    },
});

function renderTunnelPanel(status) {
    if (!status.available && status.status !== 'running') {
        const link = `<a href="https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/" target="_blank">${t('admin_tunnel.download_manual_link_text')}</a>`;
        return `
            <div style="text-align:center;padding:16px">
                <p style="color:var(--text-secondary);margin-bottom:12px">${t('admin_tunnel.not_found')}</p>
                <button class="btn btn-primary" onclick="downloadCloudflared()">${icon('download')} ${t('admin_tunnel.download_button')}</button>
                <p style="color:var(--text-muted);font-size:0.8rem;margin-top:8px">${t('admin_tunnel.download_manual', { link })}</p>
            </div>
        `;
    }

    if (status.status === 'running') {
        if (status.using_custom_token && !status.url) {
            return `
                <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
                    <div class="tunnel-status-dot"></div>
                    <span style="font-weight:600;color:var(--success)">${t('admin_tunnel.active_custom_token')}</span>
                    <span style="flex:1"></span>
                    <button class="btn btn-danger btn-sm" onclick="stopTunnel()">${t('admin_tunnel.stop')}</button>
                </div>
                <div class="tunnel-url-box">
                    <p style="color:var(--warning);font-size:0.85rem">
                        ⚠️ ${t('admin_tunnel.custom_token_no_domain_warning')}
                    </p>
                </div>
            `;
        }
        return `
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
                <div class="tunnel-status-dot"></div>
                <span style="font-weight:600;color:var(--success)">${t('admin_tunnel.active')}</span>
                <span style="flex:1"></span>
                <button class="btn btn-danger btn-sm" onclick="stopTunnel()">${t('admin_tunnel.stop')}</button>
            </div>
            <div class="tunnel-url-box">
                <p style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:4px">${t('admin_tunnel.share_url_label')}</p>
                <div style="display:flex;align-items:center;gap:8px">
                    <a href="${status.url}" target="_blank" style="flex:1;font-size:0.95rem;color:var(--success);word-break:break-all">${status.url}</a>
                    <button class="btn btn-sm btn-secondary" onclick="navigator.clipboard.writeText('${status.url}');toast('${t('admin_tunnel.copied')}','success')">${icon('copy')}</button>
                </div>
            </div>
            <p style="color:var(--text-muted);font-size:0.8rem">${t('admin_tunnel.share_hint')}</p>
        `;
    }

    return `
        <div style="text-align:center;padding:16px">
            <p style="color:var(--text-secondary);margin-bottom:16px">${t('admin_tunnel.intro')}</p>
            <button class="btn btn-primary" onclick="startTunnel()">${icon('rocket')} ${t('admin_tunnel.start_button')}</button>
            <p style="color:var(--text-muted);font-size:0.8rem;margin-top:12px">${t('admin_tunnel.quick_tunnel_hint')}</p>
        </div>
    `;
}

// Purely informational - Wimmich never starts/stops/configures Tailscale
// itself (unlike cloudflared above), it only detects what's already there.
// Reaching the server over Tailscale needs nothing else: it binds 0.0.0.0,
// so the host's Tailscale IP already routes to it automatically.
function renderTailscalePanel(status) {
    if (!status.available) {
        return `
            <p style="color:var(--text-secondary);margin-bottom:8px">${t('admin_tunnel.tailscale_not_installed')}</p>
            <a class="btn btn-secondary btn-sm" href="https://tailscale.com/download" target="_blank" rel="noopener">${t('admin_tunnel.tailscale_install_link_text')}</a>
        `;
    }
    if (!status.running) {
        return `<p style="color:var(--warning);font-size:0.85rem">${t('admin_tunnel.tailscale_not_running')}</p>`;
    }
    return `
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
            <div class="tunnel-status-dot"></div>
            <span style="font-weight:600;color:var(--success)">${t('admin_tunnel.tailscale_running')}</span>
        </div>
        <div class="tunnel-url-box">
            <code style="font-size:0.95rem;color:var(--success)">${escHtml(status.ip)}</code>
            ${status.hostname ? `<div style="color:var(--text-muted);font-size:0.8rem;margin-top:4px">${escHtml(status.hostname)}</div>` : ''}
        </div>
    `;
}

async function startTunnel() {
    const panel = $('tunnel-panel');
    panel.innerHTML = `<div style="text-align:center;padding:20px"><div class="skeleton" style="height:60px;border-radius:8px"></div><p style="margin-top:12px;color:var(--text-secondary)">${t('admin_tunnel.starting')}</p></div>`;
    try {
        const result = await API.startTunnel();
        if (result.url) {
            toast(t('admin_tunnel.started_with_url', { url: result.url }), 'success');
        } else {
            toast(t('admin_tunnel.starting_wait'), 'info');
        }
        setTimeout(async () => {
            const status = await API.getTunnelStatus();
            panel.innerHTML = renderTunnelPanel(status);
        }, 3000);
    } catch (e) {
        toast(e.message, 'error');
        const status = await API.getTunnelStatus().catch(() => ({ status: 'stopped', available: false }));
        panel.innerHTML = renderTunnelPanel(status);
    }
}

async function stopTunnel() {
    try {
        await API.stopTunnel();
        toast(t('admin_tunnel.stopped'), 'success');
        const status = await API.getTunnelStatus();
        $('tunnel-panel').innerHTML = renderTunnelPanel(status);
    } catch (e) { toast(e.message, 'error'); }
}

async function downloadCloudflared() {
    const panel = $('tunnel-panel');
    panel.innerHTML = `<div style="text-align:center;padding:20px"><div class="skeleton" style="height:60px;border-radius:8px"></div><p style="margin-top:12px;color:var(--text-secondary)">${t('admin_tunnel.downloading')}</p></div>`;
    try {
        await API.downloadCloudflared();
        toast(t('admin_tunnel.downloaded'), 'success');
        const status = await API.getTunnelStatus();
        panel.innerHTML = renderTunnelPanel(status);
    } catch (e) {
        toast(e.message, 'error');
        panel.innerHTML = renderTunnelPanel({ status: 'stopped', available: false });
    }
}

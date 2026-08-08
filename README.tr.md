<p align="center">
  <img src="docs/branding/wimmich-logo.png" alt="Wimmich" width="200">
</p>

**[English](README.md) | [Türkçe](README.tr.md) | [Français](README.fr.md) | [Deutsch](README.de.md)**

# Wimmich

**Windows'ta kendi sunucunuzda çalışan, kişisel bir fotoğraf ve video yönetim sistemi.**

[Immich](https://github.com/immich-app/immich)'ten ilham alan, bulut yerine kendi bilgisayarınızda (Tüm özellikleri için 6-8 GB VRAM ve üstü GPU'nuz varsa) çalışacak şekilde sıfırdan yazılmış bir alternatif. Fotoğraflarınız hiçbir zaman sizin kontrolünüz dışındaki bir sunucuya gitmez.

---

## Neden bu proje var?

Telefon hafızası dolan, Sosyal Medyalardan gelen aynı fotoğrafın onlarca kopyası biriken, hangi fotoğrafta kimin olduğunu bulmak için galeri içinde kaybolan bir aile arşivi için: bulut aboneliği gerektirmeyen, verinin tamamen yerelde kaldığı, yine de akıllı arama/yüz tanıma/otomatik kategori gibi "bulut servisi" özelliklerinden ödün vermeyen bir çözüm.

## Öne çıkan özellikler

### 🖼 Galeri

- Tarihe/isme/boyuta göre sırala, güne/aya/yıla/türe göre grupla — hepsi tek bir "Tüm Fotoğraflar" görünümünde.
- **Yıla göre** gruplama, binlerce fotoğrafı tek bakışta gösteren yoğun bir mozaik.
- **Aya göre** gruplama, 12 ayı tam bir takvim çerçevesinde gösterir; her ay kendi mozaiğiyle, taşan fotoğraflar "+N" rozetiyle katlanır.

### 🔍 Akıllı arama

- CLIP tabanlı çok dilli semantik arama — "plajda gün batımı" gibi bir cümleyle, o cümleyi hiçbir yerde geçmeyen fotoğrafları bile bulur.
- Arama kutusu aynı zamanda tüm filtreleri barındırır (albümsüz, sadece fotoğraf/video, favoriler, arşiv, akıllı kategoriler) — Google tarzı, yazdıkça daralan/genişleyen bir öneri listesiyle.
- Fotoğraflar otomatik olarak kategorilere ayrılır (ekran görüntüsü, belge, doğa, evcil hayvan, yemek, araba, teknoloji) — hiçbir etiketleme yapmadan.

### 👤 Kişiler (Yüz Tanıma)

- GPU hızlandırmalı yüz tespiti ve otomatik gruplama.
- "Bu kişi X mi?" şeklinde önerilerle hızlı isimlendirme kuyruğu.
- Yanlış eşleşmeleri elle düzeltme: birleştir, ayır, gruptan çıkar.

### 🧹 Kopya Tespiti

- **Tam eşleşme**: byte-birebir aynı dosyalar (checksum tabanlı).
- **Görsel benzerlik**: farklı kaynaktan (WhatsApp, bulut yedeği vb.) gelen, yeniden sıkıştırılmış ama görsel olarak aynı fotoğraflar — checksum'un yakalayamadığı kopyaları CLIP embedding benzerliğiyle bulur.
- En kaliteli kopyayı otomatik seçer (çözünürlük → gerçek konum verisi → dosya boyutu sırasıyla).
- **Slayt modu**: gruplar tek tek, sayaçlı olarak önünüze gelir; süre dolarsa en kaliteli otomatik korunur, isterseniz atlayın ya da hepsini silin.

### 📝 OCR metin arama

- Ekran görüntüleri, fişler ve taranmış belgelerin içindeki yazıyı Tesseract ile okuyup aranabilir hale getirir — hatırladığınız bir kelimeyi yazın, o kelimenin geçtiği fotoğraf gelsin.
- Aramadan açtığınızda eşleşen yerler fotoğrafın üzerinde işaretlenir.
- Tamamen opsiyonel: Tesseract kurulu değilse özellik kendini kapatır, başka hiçbir şey etkilenmez.

### 🎬 Anı videoları

- Kitaplığınızdan otomatik slayt gösterisi videoları üretir — yedi stil (Ken Burns, çapraz geçiş, düz kesme, hızlı montaj, kaydırma, polaroid), yatay veya dikey format, isteğe bağlı tarih yazısı.
- Arka planda zamanlanmış olarak çalışır; yönetim panelinden ayarlanır.

### 🔐 Hesaplar ve erişim

- **İki adımlı doğrulama** (TOTP — Google Authenticator, Authy vb.), QR kodu sunucu tarafında üretilir.
- Betikler ve otomasyonlar için **API anahtarları**, isteğe bağlı süreyle (7/30/90 gün, 1 yıl veya süresiz).
- **Aktif oturum listesi** — giriş yapmış her cihazı görün ve dilediğinizi uzaktan sonlandırın.
- Kullanıcı başına depolama kotası, misafir hesaplar (görüntüler/indirir ama asla yükleyemez) ve yeni kayıtlar için yönetici onayı.

### 🔗 Benzer Fotoğraflar

- Bir fotoğrafı açtığınızda, ona görsel olarak benzeyen diğer fotoğrafları gösteren bir rozet — arka planda önceden hesaplanmış bir eşleme tablosundan okur, her açılışta yeniden taramaz.
- Sadece gezinme amaçlıdır.

### 💾 Yedekleme

- Veritabanının çevrimiçi güvenli anlık görüntüsü + henüz yedeklenmemiş medyaların güçlü sıkıştırmayla tek bir arşive alınması.
- Yedek konumu ve aralığı ayarlanabilir; disk sonradan takılsa bile önceden yapılandırılabilir.

### 🗺 🔗 📁 ❤️ 🗄 🗑

Harita görünümü (konum etiketli fotoğraflar), paylaşım linkleri, albümler, favoriler, arşiv ve 30 günlük geri dönüşüm kutusu.

### 🌐 Uzaktan Erişim

Cloudflare Tunnel entegrasyonu ile ev ağınızın dışından da erişim — port yönlendirme veya statik IP gerekmeden.

### 🗣 Çok Dilli

İngilizce (varsayılan), Türkçe, Fransızca ve Almanca arayüz desteği. İlk açılışta dil seçimi sorulur, istediğiniz zaman kenar çubuğundan değiştirebilirsiniz.

---

## Ekran Görüntüleri

> Aşağıdaki görüntüler, gerçek kullanıcı verisi içermeyen, sadece arayüzü göstermek amacıyla oluşturulmuş örnek bir hesaptan alınmıştır.

| Giriş | Galeri |
|---|---|
| ![Giriş ekranı](docs/screenshots/login.png) | ![Galeri görünümü](docs/screenshots/gallery.png) |

| Fotoğraf Görüntüleyici | Kopya Tespiti |
|---|---|
| ![Görüntüleyici](docs/screenshots/viewer.png) | ![Kopya tespiti](docs/screenshots/duplicates.png) |

| Albümler | Yedekleme Ayarları |
|---|---|
| ![Albümler sayfası](docs/screenshots/albums.png) | ![Yedekleme](docs/screenshots/backup.png) |

| Favoriler | Çöp Kutusu |
|---|---|
| ![Favoriler](docs/screenshots/favorites.png) | ![Çöp kutusu](docs/screenshots/trash.png) |

---

## Teknik Gereksinimler

- **İşletim sistemi**: Windows 10/11 (start.bat ile çalıştırılır, PowerShell kullanır).
- **Python**: 3.10+.
- **FFmpeg**: video küçük resimleri ve dönüştürme için (isteğe bağlı, yoksa video desteği sınırlı çalışır).
- **GPU (önerilir, zorunlu değil)**: CLIP semantik arama ve yüz tanıma, kurulursa CUDA üzerinden hızlanır; kurulmazsa bu özellikler devre dışı kalır, geri kalan her şey normal çalışır.

### Opsiyonel ML bağımlılıkları

Önerilen: sadece `install_full.bat`'ı çalıştırın — zaten güncel bir CUDA derleme etiketi zincirini dener (biri tutmazsa otomatik bir sonrakine, hiçbiri tutmazsa CPU'ya düşer), çünkü tek bir sabit etiket, PyTorch daha yeni Python sürümlerinde onu bırakınca eskir. Elle kurulum gerekiyorsa:

```
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu130   # ya da cu126 / cu121 — tam yedekleme zinciri için install_full.bat'a bakın
pip install open_clip_torch transformers
pip install facenet-pytorch --no-deps
pip install requests scikit-learn
```

## Kurulum

### Hızlı kurulum (önerilen)

1. **[bootstrap.bat](https://github.com/SalihEfeTosunBayraktar/Wimmich/releases/latest/download/bootstrap.bat)** dosyasını indirip çift tıklayın.
2. Windows SmartScreen muhtemelen "Windows bilgisayarınızı korudu" uyarısı gösterecek — bu yeni, imzasız bir script için beklenen bir durum, bir şeyin yanlış gittiğinin işareti değil. **Diğer bilgiler**'e, ardından **Yine de çalıştır**'a tıklayın.
3. Tarayıcınızda bir kurulum sayfası açılır: Full/Minimal, NVIDIA GPU'nuz olup olmadığı, kurulum klasörü ve port seçip **Install**'a tıklayın. Wimmich'in indirilmesi, ortamın oluşturulması, bağımlılıkların kurulması ve sunucunun başlatılması buradan sonra otomatik olarak gerçekleşir.

Git kurmanıza veya terminale bir şey yazmanıza gerek yok — `bootstrap.bat` uygulamayı kendisi indiriyor.

### Elle kurulum

```
git clone https://github.com/SalihEfeTosunBayraktar/Wimmich.git
cd Wimmich
```

Sonra hazır kurulum paketlerinden birini çalıştırın:

| Script | Ne kurar |
|---|---|
| `install_full.bat` | Her şey — CLIP semantik arama ve yüz tanıma dahil (birkaç GB, GPU ile çok daha hızlı). |
| `install_minimal.bat` | AI özellikleri hariç her şey — daha küçük, daha hızlı kurulum. |

Her iki kurulum betiği FFmpeg'i (video) ve Tesseract'ı (OCR metin arama) da sizin için indirir; ayrıca Python 3.10'dan eskiyse sayfalarca pip hatası yerine tek satırlık net bir mesajla durur.

Wimmich'i kaldırmak isterseniz `uninstall.bat` çalıştırın — Python ortamını siler ve kitaplık klasörünüzün tam olarak nerede olduğunu söyler, ona dokunmaz.

Kurulum bitince `start.bat` ile sunucuyu başlatın (`http://localhost:3000`). İlk kayıt olan kullanıcı otomatik olarak yönetici olur. `start.bat`'ı tekrar çalıştırdığınızda venv zaten varsa direkt sunucuyu başlatır, kurulum adımını atlamaz.

## API Kullanımı

Web arayüzünün yaptığı her şey aslında sade bir REST API üzerinden yürüyor — betikler, otomasyonlar veya kendi istemciniz için kullanışlı.

**1. Bir anahtar alın** — Profil Ayarları → API Anahtarları → Anahtar Oluştur. Bir isim verin ve isterseniz bir son kullanma süresi seçin (7/30/90 gün, 1 yıl veya süresiz). Anahtar yalnızca bir kez gösterilir; hemen kopyalayın.

**2. Her istekte Bearer token olarak gönderin:**

```bash
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer wmk_anahtariniz_burada"
```

**3. Web uygulamasının kendisinin kullandığı herhangi bir endpoint'i kullanın** — örneğin:

```bash
# Fotoğraflarınızı listeleyin
curl http://localhost:3000/api/assets/timeline \
  -H "Authorization: Bearer wmk_anahtariniz_burada"

# Bir fotoğraf yükleyin
curl -X POST http://localhost:3000/api/assets/upload \
  -H "Authorization: Bearer wmk_anahtariniz_burada" \
  -F "files=@fotograf.jpg"
```

Bir anahtarı istediğiniz zaman aynı Profil Ayarları ekranından iptal edebilirsiniz — iptal edilmiş veya süresi dolmuş bir anahtar bir sonraki istekte reddedilir.

## Teknoloji

- **Backend**: FastAPI (async), SQLAlchemy + aiosqlite, JWT tabanlı kimlik doğrulama.
- **Frontend**: Vanilla JavaScript (framework yok), tek sayfa uygulama.
- **ML**: LAION'un çok dilli CLIP modeli (ViT-H/14), facenet-pytorch (MTCNN + InceptionResnetV1) yüz tanıma için.
- **Depolama**: Tüm veri (fotoğraflar, veritabanı, küçük resimler) yerel diskte; hiçbir veri üçüncü taraf bir sunucuya gönderilmez.

---

## Teşekkürler / Kullanılan Açık Kaynak Projeler

Bu proje, aşağıdaki açık kaynak projeler olmadan mümkün olmazdı:

- **[Immich](https://github.com/immich-app/immich)** — bu projenin ilham kaynağı.
- **[FastAPI](https://fastapi.tiangolo.com/)** & **[SQLAlchemy](https://www.sqlalchemy.org/)** — backend çatısı.
- **[OpenCLIP](https://github.com/mlfoundations/open_clip)** ve **[LAION](https://laion.ai/)** — çok dilli semantik arama için CLIP modeli (ViT-H/14, LAION-5B üzerinde eğitilmiş).
- **[facenet-pytorch](https://github.com/timesler/facenet-pytorch)** — yüz tespiti ve tanıma (MTCNN + InceptionResnetV1).
- **[PyTorch](https://pytorch.org/)** — tüm ML altyapısının temeli.
- **[Pillow](https://python-pillow.org/)**, **[OpenCV](https://opencv.org/)**, **[rawpy](https://github.com/letmaik/rawpy)** — görüntü işleme ve RAW dosya desteği.
- **[FFmpeg](https://ffmpeg.org/)** — video küçük resimleri ve dönüştürme.
- **[Leaflet](https://leafletjs.com/)** — harita görünümü.
- **[reverse_geocoder](https://github.com/thampiman/reverse-geocoder)** — tamamen çevrimdışı, API anahtarı gerektirmeyen konum çözümleme.
- **[scikit-learn](https://scikit-learn.org/)** — kopya/benzer fotoğraf tespitindeki kümeleme (DBSCAN).
- **[Cloudflare Tunnel](https://www.cloudflare.com/products/tunnel/)** — port yönlendirmesiz uzaktan erişim.

---

## Lisans

MIT — bkz. [LICENSE](LICENSE).

**[English](README.md) | [Türkçe](README.tr.md) | [Français](README.fr.md) | [Deutsch](README.de.md)**

# Wimmich

**A personal photo and video management system that runs on your own Windows machine.**

Inspired by [Immich](https://github.com/immich-app/immich), written from scratch to run on your own computer instead of the cloud (a GPU with 6-8 GB+ VRAM is recommended for all features). Your photos never leave a server you don't control.

---

## Why this project exists

For a family archive where phone storage keeps filling up, the same photo from social media piles up in a dozen copies, and finding who's in which picture means getting lost in the gallery: a solution that needs no cloud subscription, keeps your data entirely local, and still doesn't compromise on "cloud service" features like smart search, face recognition, or automatic categorization.

## Key features

### 🖼 Gallery

- Sort by date/name/size, group by day/month/year/type — all in a single "All Photos" view.
- **Year grouping**: a dense mosaic that shows thousands of photos at a glance.
- **Month grouping**: all 12 months laid out in a full calendar frame; each month gets its own mosaic, with overflow photos folded into a "+N" badge.

### 🔍 Smart search

- CLIP-based multilingual semantic search — a phrase like "sunset at the beach" finds matching photos even if that exact phrase appears nowhere in them.
- The search box also holds every filter (no album, photos/videos only, favorites, archive, smart categories) — Google-style, with a suggestion list that narrows or expands as you type.
- Photos are automatically sorted into categories (screenshot, document, nature, pet, food, car, technology) — with zero manual tagging.

### 👤 People (Face Recognition)

- GPU-accelerated face detection and automatic grouping.
- A fast naming queue that suggests "Is this X?" for quick confirmation.
- Manually fix mismatches: merge, split, or remove from a group.

### 🧹 Duplicate Detection

- **Exact match**: byte-for-byte identical files (checksum-based).
- **Visual similarity**: the same photo re-saved from a different source (WhatsApp, cloud backup, etc.) and re-compressed, but visually identical — catches the duplicates that checksums miss, via CLIP embedding similarity.
- Automatically picks the best-quality copy (by resolution → real location data → file size, in that order).
- **Slideshow mode**: groups are presented one at a time with a countdown; when time runs out the best copy is kept automatically, or you can skip or delete the whole group yourself.

### 🔗 Similar Photos

- Opening a photo shows a badge for other photos that are visually similar to it — reads from a precomputed matching table in the background instead of re-scanning on every open.
- Purely for browsing, not a cleanup suggestion.

### 💾 Backup

- An online-safe snapshot of the database, plus not-yet-backed-up media bundled into a single archive with strong compression.
- Backup location and interval are configurable; can be set up in advance even before the target disk is connected.

### 🗺 🔗 📁 ❤️ 🗄 🗑

Map view (location-tagged photos), share links, albums, favorites, archive, and a 30-day recycle bin.

### 🌐 Remote Access

Cloudflare Tunnel integration for access from outside your home network — no port forwarding or static IP required.

### 🗣 Multilingual

English (default), Turkish, French, and German interface support. You're asked to pick a language on first launch, and can change it anytime from the sidebar.

---

## Screenshots

> The images below are from a sample account created purely to demonstrate the interface — they contain no real user data.

| Login | Gallery |
|---|---|
| ![Login screen](docs/screenshots/login.png) | ![Gallery view](docs/screenshots/gallery.png) |

| Photo Viewer | Duplicate Detection |
|---|---|
| ![Viewer](docs/screenshots/viewer.png) | ![Duplicate detection](docs/screenshots/duplicates.png) |

| Albums | Backup Settings |
|---|---|
| ![Albums page](docs/screenshots/albums.png) | ![Backup](docs/screenshots/backup.png) |

| Favorites | Trash |
|---|---|
| ![Favorites](docs/screenshots/favorites.png) | ![Trash](docs/screenshots/trash.png) |

---

## Technical Requirements

- **OS**: Windows 10/11 (runs via `start.bat`, uses PowerShell).
- **Python**: 3.10+.
- **FFmpeg**: for video thumbnails and transcoding (optional — video support is limited without it).
- **GPU (recommended, not required)**: CLIP semantic search and face recognition run much faster with CUDA if installed; without it, those two features are disabled and everything else works normally.

### Optional ML dependencies

```
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121
pip install open_clip_torch
pip install facenet-pytorch requests --no-deps
pip install scikit-learn
```

## Installation

```
git clone <repo-url>
cd Wimmich
```

Then run one of the two ready-made installer scripts:

| Script | What it installs |
|---|---|
| `install_full.bat` | Everything — including CLIP semantic search and face recognition (a few GB, much faster with a GPU). |
| `install_minimal.bat` | Everything except the AI features — a smaller, faster setup. |

Once installed, launch the server with `start.bat` (`http://localhost:3000`). The first user to register automatically becomes an admin. Running `start.bat` again just starts the server directly if the venv already exists — it won't repeat the install step.

## Technology

- **Backend**: FastAPI (async), SQLAlchemy + aiosqlite, JWT-based authentication.
- **Frontend**: Vanilla JavaScript (no framework), single-page app.
- **ML**: LAION's multilingual CLIP model (ViT-H/14), facenet-pytorch (MTCNN + InceptionResnetV1) for face recognition.
- **Storage**: All data (photos, database, thumbnails) stays on local disk — nothing is ever sent to a third-party server.

---

## Thanks / Open Source Projects Used

This project wouldn't have been possible without the following open source projects:

- **[Immich](https://github.com/immich-app/immich)** — the inspiration for this project.
- **[FastAPI](https://fastapi.tiangolo.com/)** & **[SQLAlchemy](https://www.sqlalchemy.org/)** — the backend framework.
- **[OpenCLIP](https://github.com/mlfoundations/open_clip)** and **[LAION](https://laion.ai/)** — the CLIP model for multilingual semantic search (ViT-H/14, trained on LAION-5B).
- **[facenet-pytorch](https://github.com/timesler/facenet-pytorch)** — face detection and recognition (MTCNN + InceptionResnetV1).
- **[PyTorch](https://pytorch.org/)** — the foundation of the whole ML stack.
- **[Pillow](https://python-pillow.org/)**, **[OpenCV](https://opencv.org/)**, **[rawpy](https://github.com/letmaik/rawpy)** — image processing and RAW file support.
- **[FFmpeg](https://ffmpeg.org/)** — video thumbnails and transcoding.
- **[Leaflet](https://leafletjs.com/)** — the map view.
- **[reverse_geocoder](https://github.com/thampiman/reverse-geocoder)** — fully offline location resolution, no API key required.
- **[scikit-learn](https://scikit-learn.org/)** — clustering (DBSCAN) for duplicate/similar photo detection.
- **[Cloudflare Tunnel](https://www.cloudflare.com/products/tunnel/)** — remote access without port forwarding.

---

## License

MIT — see [LICENSE](LICENSE).

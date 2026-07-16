"""Serves index.html with cache-busted asset URLs so browsers (mobile
especially) can't get stuck showing an old build after an update.

The page itself is served with Cache-Control: no-store (always fetched
fresh), and every local /static/... URL (js, css, images, favicons) gets a
?v=<app version+commit> query string appended. When the app updates, the
version changes, so the URLs change too - the browser treats them as
brand-new resources instead of reusing a stale cached copy, no matter how
aggressively it caches.
"""
import re
from functools import lru_cache
from pathlib import Path
from fastapi.responses import HTMLResponse

from version import APP_VERSION_FULL

_ASSET_SRC_RE = re.compile(r'(src|href)="(/static/[^"?]+)"')


@lru_cache(maxsize=8)
def _load_and_version(index_path_str: str, version: str) -> str:
    """Read index.html once per (path, version) and inject cache-busting query strings."""
    html = Path(index_path_str).read_text(encoding="utf-8")
    return _ASSET_SRC_RE.sub(rf'\1="\2?v={version}"', html)


def render_spa(index_path: Path) -> HTMLResponse:
    """Render index.html with versioned asset URLs and no-store caching."""
    html = _load_and_version(str(index_path), APP_VERSION_FULL)
    return HTMLResponse(
        content=html,
        headers={"Cache-Control": "no-store"},
    )

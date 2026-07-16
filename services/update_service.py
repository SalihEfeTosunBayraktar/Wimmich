"""Self-update from the GitHub repo the install came from. Two install
kinds, two mechanisms, same public check_for_updates()/apply_update() shape
so callers (and the frontend) don't need to know which one is in use:

- `git clone` install (has a .git folder): fetch + compare + `git pull`.
- zip download (no .git folder): compare against the GitHub REST API and
  replace files from a downloaded archive of the latest commit, since there's
  no git history to fetch/pull into.
"""
import asyncio
import io
import json
import subprocess
import sys
import urllib.error
import urllib.request
import zipfile
from typing import Optional

import config

BASE_DIR = config.BASE_DIR
GIT_TIMEOUT = 15

GITHUB_OWNER = "SalihEfeTosunBayraktar"
GITHUB_REPO = "Wimmich"
GITHUB_API_BASE = f"https://api.github.com/repos/{GITHUB_OWNER}/{GITHUB_REPO}"
GITHUB_USER_AGENT = "Wimmich-Updater"

# Lives in the always-local, never-redirected data folder (config.DB_DIR is
# BASE_DIR/data regardless of WIMMICH_DATA_DIR) so it survives an update
# overwriting the code tree, and a zip download never contains it (data/ is
# gitignored, so GitHub's archive never includes it either) - a fresh zip
# install genuinely starts with no marker.
VERSION_FILE = config.DB_DIR / ".wimmich_version"

# Top-level entries never copied from a downloaded update archive - user
# data, secrets, and local environment, mirroring .gitignore's own top-level
# entries (which is also why they're never actually present in the archive
# in the first place; this is a second guard, not the only one).
ZIP_UPDATE_SKIP_TOP = {
    "data", "venv", ".venv", ".env", ".git", "scratch",
    "__pycache__", ".pytest_cache", ".mypy_cache", ".vscode", ".idea",
}


def _run_git(args: list, timeout: int = GIT_TIMEOUT) -> subprocess.CompletedProcess:
    return subprocess.run(
        ["git"] + args,
        cwd=BASE_DIR,
        capture_output=True,
        text=True,
        timeout=timeout,
    )


def _is_git_repo() -> bool:
    return (BASE_DIR / ".git").exists()


def _github_api_get(path: str, timeout: int = GIT_TIMEOUT):
    req = urllib.request.Request(
        f"{GITHUB_API_BASE}{path}",
        headers={"User-Agent": GITHUB_USER_AGENT, "Accept": "application/vnd.github+json"},
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


def _read_version_marker() -> Optional[str]:
    if VERSION_FILE.exists():
        return VERSION_FILE.read_text(encoding="utf-8").strip() or None
    return None


def _write_version_marker(sha: str) -> None:
    VERSION_FILE.write_text(sha, encoding="utf-8")


def _pip_install() -> subprocess.CompletedProcess:
    return subprocess.run(
        [sys.executable, "-m", "pip", "install", "-r", "requirements.txt"],
        cwd=BASE_DIR, capture_output=True, text=True, timeout=300,
    )


async def _install_requirements() -> dict:
    pip_result = await asyncio.to_thread(_pip_install)
    if pip_result.returncode != 0:
        # The code is already updated at this point - surfacing this as a
        # warning rather than raising, since the actual update succeeded
        # and most dependency changes are additive/rare in practice.
        return {
            "message": "Kod güncellendi ancak bağımlılık kurulumunda bir sorun oluştu - sunucu yine de yeniden başlatılıyor.",
            "pip_warning": pip_result.stderr.strip()[-500:],
        }
    return {"message": "Güncelleme uygulandı, sunucu yeniden başlatılıyor..."}


async def check_for_updates() -> dict:
    """Read-only - doesn't touch any files (aside from writing a fresh
    version marker on a zip install's very first check, see below)."""
    if _is_git_repo():
        return await _check_for_updates_git()
    return await _check_for_updates_zip()


async def apply_update() -> dict:
    """Bring the code up to date and reinstall base dependencies. The
    caller is responsible for the actual process restart afterward, this
    only prepares the code/dependencies on disk."""
    if _is_git_repo():
        return await _apply_update_git()
    return await _apply_update_zip()


async def _check_for_updates_git() -> dict:
    fetch_result = await asyncio.to_thread(_run_git, ["fetch", "origin"])
    if fetch_result.returncode != 0:
        return {"available": False, "error": f"Güncellemeler kontrol edilemedi: {fetch_result.stderr.strip()}"}

    # Always origin/main specifically, not "whatever the local branch is
    # named" - this only ever needs to compare against this project's own
    # known default branch on GitHub, and assuming the two names match
    # breaks on any install whose local branch isn't literally "main" (e.g.
    # a plain `git init` defaults to "master" on some git installs/versions).
    local = await asyncio.to_thread(_run_git, ["rev-parse", "HEAD"])
    remote = await asyncio.to_thread(_run_git, ["rev-parse", "origin/main"])
    if local.returncode != 0 or remote.returncode != 0:
        return {"available": False, "error": "Yerel/uzak commit bilgisi okunamadı."}

    local_hash = local.stdout.strip()
    remote_hash = remote.stdout.strip()

    if local_hash == remote_hash:
        return {"available": False, "current_commit": local_hash[:7]}

    log_result = await asyncio.to_thread(
        _run_git, ["log", f"{local_hash}..{remote_hash}", "--pretty=format:%h %s", "-n", "30"]
    )
    changelog = [line for line in log_result.stdout.strip().split("\n") if line] if log_result.returncode == 0 else []

    return {
        "available": True,
        "current_commit": local_hash[:7],
        "latest_commit": remote_hash[:7],
        "commits_behind": len(changelog),
        "changelog": changelog,
    }


async def _apply_update_git() -> dict:
    """Refuses to run over uncommitted local changes rather than risk
    losing or clobbering them."""
    status_result = await asyncio.to_thread(_run_git, ["status", "--porcelain"])
    if status_result.stdout.strip():
        raise RuntimeError(
            "Yerel değişiklikler var, güncelleme uygulanamadı - önce bu değişiklikleri "
            "commit edin veya geri alın (git status ile kontrol edin)."
        )

    # Explicit origin/main, not a bare `git pull` - a plain `git init` install
    # has no upstream tracking branch configured, so a bare pull would just
    # fail with "no tracking information" (or pull the wrong thing if the
    # local branch happens to be named something other than "main").
    # --ff-only: refuse to create a merge commit rather than silently produce
    # one on a diverged history - the status check above already rules out
    # the common case, this is a safety net against anything unexpected.
    pull_result = await asyncio.to_thread(_run_git, ["pull", "--ff-only", "origin", "main"], 60)
    if pull_result.returncode != 0:
        raise RuntimeError(f"git pull başarısız: {pull_result.stderr.strip()}")

    return await _install_requirements()


async def _check_for_updates_zip() -> dict:
    try:
        commits = await asyncio.to_thread(_github_api_get, "/commits?sha=main&per_page=50")
    except (urllib.error.URLError, TimeoutError, ValueError) as e:
        return {"available": False, "error": f"Güncellemeler kontrol edilemedi: {e}"}

    if not commits:
        return {"available": False, "error": "Uzak depoda commit bulunamadı."}

    latest_sha = commits[0]["sha"]
    current_sha = _read_version_marker()

    if current_sha is None:
        # Fresh zip install, no baseline yet - a zip download never contains
        # this marker (data/ is gitignored, so GitHub's archive never
        # includes it), so treat "just downloaded" as the starting point
        # rather than guessing how old the download actually is.
        _write_version_marker(latest_sha)
        return {"available": False, "current_commit": latest_sha[:7]}

    if current_sha == latest_sha:
        return {"available": False, "current_commit": current_sha[:7]}

    shas = [c["sha"] for c in commits]
    known_baseline = current_sha in shas
    newer = commits[: shas.index(current_sha)] if known_baseline else commits

    changelog = [f"{c['sha'][:7]} {c['commit']['message'].splitlines()[0]}" for c in newer]

    return {
        "available": True,
        "current_commit": current_sha[:7],
        "latest_commit": latest_sha[:7],
        "commits_behind": len(changelog) if known_baseline else f"{len(changelog)}+",
        "changelog": changelog,
    }


async def _apply_update_zip() -> dict:
    try:
        latest = await asyncio.to_thread(_github_api_get, "/commits/main")
    except (urllib.error.URLError, TimeoutError, ValueError) as e:
        raise RuntimeError(f"Güncelleme bilgisi alınamadı: {e}")
    latest_sha = latest["sha"]

    def _download_and_extract():
        archive_url = f"https://github.com/{GITHUB_OWNER}/{GITHUB_REPO}/archive/{latest_sha}.zip"
        req = urllib.request.Request(archive_url, headers={"User-Agent": GITHUB_USER_AGENT})
        with urllib.request.urlopen(req, timeout=120) as resp:
            data = resp.read()

        with zipfile.ZipFile(io.BytesIO(data)) as z:
            names = z.namelist()
            if not names:
                raise RuntimeError("İndirilen güncelleme paketi boş.")
            root_prefix = names[0].split("/")[0] + "/"  # e.g. "Wimmich-<sha>/"

            for member in names:
                if not member.startswith(root_prefix):
                    continue
                rel = member[len(root_prefix):]
                if not rel or rel.split("/")[0] in ZIP_UPDATE_SKIP_TOP:
                    continue
                dest = BASE_DIR / rel
                if member.endswith("/"):
                    dest.mkdir(parents=True, exist_ok=True)
                    continue
                dest.parent.mkdir(parents=True, exist_ok=True)
                with z.open(member) as src, open(dest, "wb") as out:
                    out.write(src.read())

    try:
        await asyncio.to_thread(_download_and_extract)
    except (urllib.error.URLError, TimeoutError, zipfile.BadZipFile) as e:
        raise RuntimeError(f"Güncelleme indirilemedi/uygulanamadı: {e}")

    _write_version_marker(latest_sha)

    return await _install_requirements()

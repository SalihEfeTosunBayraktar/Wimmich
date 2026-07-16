"""Self-update via git: check for and apply updates from the GitHub remote
the install was cloned from. Only meant for a plain `git clone` install
(exactly what the README's setup instructions produce) - a zip download
with no .git folder has nothing for this to compare against or pull into.
"""
import asyncio
import subprocess
import sys

import config

BASE_DIR = config.BASE_DIR
GIT_TIMEOUT = 15


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


async def check_for_updates() -> dict:
    """Fetch from the remote and compare local HEAD to it - read-only,
    doesn't touch any files."""
    if not _is_git_repo():
        return {
            "available": False,
            "error": (
                "Bu kurulum bir git deposu değil (muhtemelen zip olarak indirilmiş) - "
                "güncelleme kontrolü için git clone ile kurulmuş bir kopya gerekir."
            ),
        }

    fetch_result = await asyncio.to_thread(_run_git, ["fetch", "origin"])
    if fetch_result.returncode != 0:
        return {"available": False, "error": f"Güncellemeler kontrol edilemedi: {fetch_result.stderr.strip()}"}

    branch_result = await asyncio.to_thread(_run_git, ["rev-parse", "--abbrev-ref", "HEAD"])
    branch = branch_result.stdout.strip() if branch_result.returncode == 0 else "main"

    local = await asyncio.to_thread(_run_git, ["rev-parse", "HEAD"])
    remote = await asyncio.to_thread(_run_git, ["rev-parse", f"origin/{branch}"])
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


async def apply_update() -> dict:
    """Pull the latest code and reinstall base dependencies. Refuses to run
    over uncommitted local changes rather than risk losing or clobbering
    them - the caller is responsible for the actual process restart
    afterward, this only prepares the code/dependencies on disk."""
    if not _is_git_repo():
        raise RuntimeError("Bu kurulum bir git deposu değil, güncelleme uygulanamaz.")

    status_result = await asyncio.to_thread(_run_git, ["status", "--porcelain"])
    if status_result.stdout.strip():
        raise RuntimeError(
            "Yerel değişiklikler var, güncelleme uygulanamadı - önce bu değişiklikleri "
            "commit edin veya geri alın (git status ile kontrol edin)."
        )

    # --ff-only: refuse to create a merge commit rather than silently produce
    # one on a diverged history - the status check above already rules out
    # the common case, this is a safety net against anything unexpected.
    pull_result = await asyncio.to_thread(_run_git, ["pull", "--ff-only"], 60)
    if pull_result.returncode != 0:
        raise RuntimeError(f"git pull başarısız: {pull_result.stderr.strip()}")

    def _pip_install():
        return subprocess.run(
            [sys.executable, "-m", "pip", "install", "-r", "requirements.txt"],
            cwd=BASE_DIR, capture_output=True, text=True, timeout=300,
        )

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

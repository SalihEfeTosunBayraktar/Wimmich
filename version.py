"""App version: a static semver plus the current git commit (if available),
so the version shown in the UI always reflects what's actually deployed
instead of a number someone has to remember to bump by hand."""
import subprocess
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

APP_VERSION = "1.0.0"


def _get_git_revision() -> str:
    """Short commit hash of the running code, or "" if git/.git isn't available."""
    try:
        result = subprocess.run(
            ["git", "rev-parse", "--short", "HEAD"],
            cwd=BASE_DIR,
            capture_output=True,
            text=True,
            timeout=3,
        )
        if result.returncode == 0:
            return result.stdout.strip()
    except Exception:
        pass
    return ""


def _get_git_commit_date() -> str:
    """ISO date of the running code's commit, or "" if unavailable."""
    try:
        result = subprocess.run(
            ["git", "log", "-1", "--format=%cd", "--date=short"],
            cwd=BASE_DIR,
            capture_output=True,
            text=True,
            timeout=3,
        )
        if result.returncode == 0:
            return result.stdout.strip()
    except Exception:
        pass
    return ""


GIT_REVISION = _get_git_revision()
GIT_COMMIT_DATE = _get_git_commit_date()

# e.g. "1.0.0+a1b2c3d" when running from a git checkout, plain "1.0.0" otherwise
APP_VERSION_FULL = f"{APP_VERSION}+{GIT_REVISION}" if GIT_REVISION else APP_VERSION


def get_version_info() -> dict:
    return {
        "version": APP_VERSION,
        "full_version": APP_VERSION_FULL,
        "git_revision": GIT_REVISION or None,
        "git_commit_date": GIT_COMMIT_DATE or None,
    }

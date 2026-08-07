"""Admin-tunable knobs for how much of the machine background jobs may take.

Jobs share this single process with the web server, so anything that
saturates every CPU core makes the whole app (thumbnails, video playback,
even login) crawl for as long as the job runs. What the right trade-off is
depends entirely on the deployment: a dedicated NAS nobody browses during
an import wants jobs to use everything, while a machine someone is
actively using wants them to stay out of the way.

Settings live in their own small JSON file, same reasoning as
job_concurrency_service.py: a pure runtime tuning knob doesn't need
.env/deployment persistence semantics, just something the next ffmpeg
dispatch or model load can re-read without a server restart.
"""
import json
from typing import Optional

import config

SETTINGS_PATH = config.DB_DIR / "performance_settings.json"

# None means "fall back to the config.py default" - kept distinct from an
# explicit value so clearing an override restores the env-configured
# default rather than freezing whatever it happened to be at the time.
DEFAULT_SETTINGS = {"low_priority": None, "max_cpu_threads": None}


def get_settings() -> dict:
    if not SETTINGS_PATH.exists():
        return dict(DEFAULT_SETTINGS)
    try:
        with open(SETTINGS_PATH, "r", encoding="utf-8") as f:
            saved = json.load(f)
        return {**DEFAULT_SETTINGS, **saved}
    except (json.JSONDecodeError, OSError):
        return dict(DEFAULT_SETTINGS)


def _save(settings: dict) -> None:
    SETTINGS_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(SETTINGS_PATH, "w", encoding="utf-8") as f:
        json.dump(settings, f, indent=2)


def update_settings(low_priority: Optional[bool], max_cpu_threads: Optional[int]) -> dict:
    settings = get_settings()
    settings["low_priority"] = None if low_priority is None else bool(low_priority)
    if max_cpu_threads is None or not max_cpu_threads:
        settings["max_cpu_threads"] = None
    else:
        # Capped at the real core count - a value above it just misleads,
        # since neither ffmpeg nor torch can use cores that don't exist.
        total = config.CPU_TOTAL_CORES
        settings["max_cpu_threads"] = max(1, min(int(max_cpu_threads), total))
    _save(settings)
    return settings


def get_effective_low_priority() -> bool:
    value = get_settings().get("low_priority")
    return config.JOB_LOW_PRIORITY if value is None else bool(value)


def get_effective_max_cpu_threads() -> int:
    value = get_settings().get("max_cpu_threads")
    return config.JOB_MAX_CPU_THREADS if not value else int(value)


# Named trade-off points rather than raw numbers - "how do you actually
# use this machine" is the question an admin can answer, "how many ffmpeg
# threads" usually isn't. Each maps to concrete values below.
PROFILES = {
    "responsive": {
        "label_tr": "Duyarlı - sunucuyu kullanırken işler yavaş çalışsın",
        "label_en": "Responsive - keep the server snappy, jobs go slower",
        "low_priority": True,
        "cpu_fraction": 0.25,
    },
    "balanced": {
        "label_tr": "Dengeli (önerilen)",
        "label_en": "Balanced (recommended)",
        "low_priority": True,
        "cpu_fraction": 0.5,
    },
    "max_speed": {
        "label_tr": "En hızlı - adanmış sunucu, kimse kullanmıyor",
        "label_en": "Fastest - dedicated server, nobody is browsing",
        "low_priority": False,
        "cpu_fraction": 1.0,
    },
}


def get_system_info() -> dict:
    total_ram_gb = None
    try:
        import psutil
        total_ram_gb = round(psutil.virtual_memory().total / (1024 ** 3), 1)
    except ImportError:
        pass  # degrade to a CPU-only recommendation, same as job_concurrency_service
    # Deliberately does NOT import torch just to probe for a GPU - that
    # would pull a multi-hundred-MB library into memory purely to render a
    # settings panel. Reads the already-loaded state instead, so this is
    # only ever "we know there's a GPU because a model is on it".
    gpu_in_use = False
    try:
        from services.clip_service import is_clip_loaded, get_device
        gpu_in_use = bool(is_clip_loaded()) and get_device() == "cuda"
    except Exception:
        pass
    return {
        "cpu_count": config.CPU_TOTAL_CORES,
        "total_ram_gb": total_ram_gb,
        "gpu_in_use": gpu_in_use,
    }


def get_recommendation() -> dict:
    """Which profile suits this machine, with the reason spelled out.

    A heuristic, not a measurement: core count is the main signal, since
    the complaint this exists to solve ("the server is unusable while a job
    runs") is fundamentally about jobs taking every core. Small machines
    need the most protection - on 4 cores an unrestricted ffmpeg leaves
    literally nothing for serving - while a large machine can give jobs
    half its cores and still answer requests comfortably.
    """
    info = get_system_info()
    cores = info["cpu_count"]
    ram = info["total_ram_gb"]

    if cores <= 4:
        profile = "responsive"
        reason_tr = (
            f"{cores} çekirdekli bir makinede işler sınırsız çalışırsa sunucuya hiç "
            f"CPU kalmıyor - bu yüzden en korumalı ayar öneriliyor."
        )
        reason_en = (
            f"On a {cores}-core machine an unrestricted job leaves nothing for serving, "
            f"so the most protective setting is recommended."
        )
    elif cores >= 12 and (ram is None or ram >= 16):
        profile = "balanced"
        reason_tr = (
            f"{cores} çekirdek"
            + (f" ve {ram} GB RAM" if ram else "")
            + " ile işler çekirdeklerin yarısını kullanırken sunucu rahat yanıt verebilir."
        )
        reason_en = (
            f"With {cores} cores"
            + (f" and {ram}GB RAM" if ram else "")
            + ", jobs can take half the cores and the server still answers comfortably."
        )
    else:
        profile = "balanced"
        reason_tr = (
            f"{cores} çekirdek için dengeli ayar uygun: işler yarım kapasiteyle çalışır, "
            f"sunucu yanıt vermeye devam eder."
        )
        reason_en = (
            f"For {cores} cores the balanced setting fits: jobs run at half capacity "
            f"while the server stays responsive."
        )

    values = resolve_profile(profile)
    return {
        "profile": profile,
        "reason_tr": reason_tr,
        "reason_en": reason_en,
        "low_priority": values["low_priority"],
        "max_cpu_threads": values["max_cpu_threads"],
        "system": info,
    }


def resolve_profile(profile_key: str) -> dict:
    """Turn a profile name into the concrete numbers it stands for."""
    entry = PROFILES.get(profile_key) or PROFILES["balanced"]
    threads = max(1, int(config.CPU_TOTAL_CORES * entry["cpu_fraction"]))
    return {"low_priority": entry["low_priority"], "max_cpu_threads": threads}


def get_profile_choices() -> list:
    return [
        {
            "key": key,
            "label_tr": entry["label_tr"],
            "label_en": entry["label_en"],
            **resolve_profile(key),
        }
        for key, entry in PROFILES.items()
    ]


def get_status() -> dict:
    """Everything the admin panel needs to render the panel, including the
    machine's own core count so the UI can show what the numbers mean
    rather than an unanchored slider."""
    settings = get_settings()
    return {
        "low_priority": settings["low_priority"],
        "max_cpu_threads": settings["max_cpu_threads"],
        "effective_low_priority": get_effective_low_priority(),
        "effective_max_cpu_threads": get_effective_max_cpu_threads(),
        "total_cores": config.CPU_TOTAL_CORES,
        "default_low_priority": config.JOB_LOW_PRIORITY,
        "default_max_cpu_threads": config.JOB_MAX_CPU_THREADS,
        "profiles": get_profile_choices(),
        "recommendation": get_recommendation(),
    }

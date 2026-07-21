"""In-memory sliding-window rate limiter for the login endpoint.

Single-process uvicorn server, so a plain in-process dict is enough - no
Redis/external store needed for a self-hosted app. Tracks failed attempts
per identity key (client IP and email, checked independently) over a rolling
window; too many within the window refuses further attempts with a
retry-after until the oldest failure ages out. A successful login clears
that identity's history so a legitimate user who fat-fingered a few times
isn't left locked out.

Keying by email as well as IP matters behind the Cloudflare tunnel, where
every request shares one local socket IP (127.0.0.1) - IP-only limiting
would then be effectively global, letting an attack on one account throttle
everyone, or (the other way) one shared IP hide a spray across accounts.
Per-email catches a brute force against a specific account regardless of
which IP it comes from.
"""
import time
from collections import deque
from typing import List, Optional

import config

# key -> deque[monotonic timestamps of failures], newest last
_failures: "dict[str, deque]" = {}
# Guards against unbounded growth if someone sprays random emails/IPs: once
# the map gets this big, a sweep drops every key whose failures have all
# aged out of the window. Far above any legitimate distinct-identity count.
_MAX_TRACKED_KEYS = 10000
_last_sweep = 0.0
_SWEEP_INTERVAL_SECONDS = 300


def _prune(dq: deque, now: float) -> None:
    window = config.LOGIN_FAILURE_WINDOW_SECONDS
    while dq and now - dq[0] > window:
        dq.popleft()


def _maybe_sweep(now: float) -> None:
    global _last_sweep
    if len(_failures) < _MAX_TRACKED_KEYS or now - _last_sweep < _SWEEP_INTERVAL_SECONDS:
        return
    _last_sweep = now
    for key in list(_failures.keys()):
        dq = _failures[key]
        _prune(dq, now)
        if not dq:
            del _failures[key]


def check_retry_after(keys: List[str]) -> Optional[int]:
    """None if the attempt is allowed; otherwise the number of seconds until
    the caller should retry (the oldest failure aging out of the window)."""
    now = time.monotonic()
    retry_after = None
    for key in keys:
        dq = _failures.get(key)
        if not dq:
            continue
        _prune(dq, now)
        if len(dq) >= config.LOGIN_MAX_FAILURES:
            secs = int(config.LOGIN_FAILURE_WINDOW_SECONDS - (now - dq[0])) + 1
            retry_after = max(retry_after or 0, secs)
    return retry_after


def record_failure(keys: List[str]) -> None:
    now = time.monotonic()
    _maybe_sweep(now)
    for key in keys:
        dq = _failures.get(key)
        if dq is None:
            dq = deque()
            _failures[key] = dq
        dq.append(now)
        _prune(dq, now)


def reset(keys: List[str]) -> None:
    """Clear these identities' failure history - called on a successful login."""
    for key in keys:
        _failures.pop(key, None)

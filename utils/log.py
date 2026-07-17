"""Colored, leveled console logging - a thin wrapper around print() so
status messages ([ML], [JOB], [FFMPEG], the startup banner, etc.) share one
consistent look instead of every module inventing its own ad-hoc prefix.

Plain ANSI escape codes, no colorama dependency - this app already prints
a pre-rendered ANSI-art banner (banner.ans) straight to the console on
every startup, so the target terminal (Windows 10+ cmd/PowerShell) is
already proven to render ANSI natively; nothing extra to install.
"""
import sys
from datetime import datetime

_RESET = "\033[0m"
_BOLD = "\033[1m"
_DIM = "\033[2m"
_COLORS = {
    "info": "\033[36m",     # cyan
    "success": "\033[32m",  # green
    "warn": "\033[33m",     # yellow
    "error": "\033[31m",    # red
}


def _emit(level: str, tag: str, message: str) -> None:
    color = _COLORS.get(level, "")
    timestamp = f"{_DIM}{datetime.now().strftime('%H:%M:%S')}{_RESET}"
    prefix = f"{color}{_BOLD}[{tag}]{_RESET}"
    stream = sys.stderr if level == "error" else sys.stdout
    print(f"{timestamp} {prefix} {message}", file=stream)


def info(tag: str, message: str) -> None:
    _emit("info", tag, message)


def success(tag: str, message: str) -> None:
    _emit("success", tag, message)


def warn(tag: str, message: str) -> None:
    _emit("warn", tag, message)


def error(tag: str, message: str) -> None:
    _emit("error", tag, message)

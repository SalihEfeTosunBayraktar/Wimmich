"""Pluggable "how do the photos turn into a video" pipeline for
auto-generated memory videos.

Adding a new style is exactly: write one function with the signature
`(image_paths: List[str], output_path: str, cancel_event) -> bool`, add an
entry to VIDEO_STYLES below with a key + display labels. Nothing else in
the app needs to change - memory_video_service picks the builder purely by
key, the settings API and frontend dropdown both read their choices from
get_style_choices() rather than a hardcoded list.
"""
import shutil
import tempfile
import threading
from pathlib import Path
from typing import Callable, Dict, List, Optional, TypedDict

import config
from utils.video_utils import _run_ffmpeg_killable
from utils.log import warn

_WIDTH = 1280
_HEIGHT = 720
_FPS = 25

# Every photo is scaled to fill this fixed landscape canvas (cropping
# whatever doesn't fit) rather than letterboxed - matches how most "memory
# video" generators (Google/Apple Photos included) handle a mix of
# portrait and landscape source photos, and keeps every clip the exact
# same frame size, which the concat/xfade steps below both require.
_SCALE_CROP = f"scale={_WIDTH}:{_HEIGHT}:force_original_aspect_ratio=increase,crop={_WIDTH}:{_HEIGHT}"


class _StyleEntry(TypedDict):
    label_tr: str
    label_en: str
    build: Callable[[List[str], str, Optional[threading.Event]], bool]


def _build_ken_burns(image_paths: List[str], output_path: str, cancel_event: Optional[threading.Event] = None) -> bool:
    """Slow zoom (alternating in/out per photo, for variety) rendered one
    clip per photo, then hard-cut concatenated. Two ffmpeg phases rather
    than one giant zoompan+xfade filter graph: a single-phase version
    would need one filter_complex chaining N zoompans and N-1 xfades in
    one invocation, which is both harder to get right and harder to debug
    when it fails on one specific photo. Per-clip files cost a bit of
    scratch disk and an extra concat pass, in exchange for something that
    fails (and can be reasoned about) one photo at a time.
    """
    clip_seconds = 3.0
    frames = int(clip_seconds * _FPS)
    tmp_dir = Path(tempfile.mkdtemp(prefix="wimmich_kb_", dir=str(config.MEMORY_VIDEO_DIR)))
    try:
        clip_paths = []
        for i, img_path in enumerate(image_paths):
            if cancel_event is not None and cancel_event.is_set():
                return False
            clip_path = tmp_dir / f"clip_{i:03d}.mp4"
            # Even index: zoom in over the clip. Odd index: start zoomed in
            # and ease back out. Purely for visual variety - a video where
            # every single photo zooms the same way reads as monotonous.
            if i % 2 == 0:
                zoom_expr = "min(zoom+0.0018,1.3)"
            else:
                zoom_expr = "if(eq(on,1),1.3,max(zoom-0.0018,1.0))"
            vf = (
                f"{_SCALE_CROP},"
                f"zoompan=z='{zoom_expr}':d={frames}:s={_WIDTH}x{_HEIGHT}:fps={_FPS},"
                f"format=yuv420p"
            )
            cmd = [
                config.FFMPEG_PATH, "-y",
                "-loop", "1", "-i", str(img_path),
                "-vf", vf,
                "-t", str(clip_seconds),
                "-r", str(_FPS),
                "-c:v", "libx264", "-preset", "veryfast",
                str(clip_path),
            ]
            if not _run_ffmpeg_killable(cmd, cancel_event=cancel_event, timeout=60, log_prefix="MEMVID-kb-clip"):
                warn("MEMVID", f"Ken Burns clip failed for {img_path}, skipping it")
                continue
            clip_paths.append(clip_path)

        if not clip_paths:
            return False

        list_file = tmp_dir / "concat_list.txt"
        list_file.write_text(
            "\n".join(f"file '{p.name}'" for p in clip_paths),
            encoding="utf-8",
        )
        cmd = [
            config.FFMPEG_PATH, "-y",
            "-f", "concat", "-safe", "0",
            "-i", str(list_file),
            "-c", "copy",
            str(output_path),
        ]
        return _run_ffmpeg_killable(cmd, cancel_event=cancel_event, timeout=120, log_prefix="MEMVID-kb-concat") \
            and Path(output_path).exists()
    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)


def _build_crossfade(image_paths: List[str], output_path: str, cancel_event: Optional[threading.Event] = None) -> bool:
    """Still photos with a soft dissolve between each - no pan/zoom, just
    the transition itself. One ffmpeg call with every photo as an input,
    chained through xfade filters; each transition's `offset` (when in the
    running merged timeline it starts) follows the standard chained-xfade
    formula offset_t = t * (clip_seconds - fade_seconds) for the t-th
    transition (1-indexed) - verified directly against ffmpeg's actual
    output before shipping this, not just derived on paper."""
    clip_seconds = 3.5
    fade_seconds = 0.8
    n = len(image_paths)
    if n == 0:
        return False
    if n == 1:
        # Nothing to crossfade between - just a static clip of the one photo.
        cmd = [
            config.FFMPEG_PATH, "-y",
            "-loop", "1", "-t", str(clip_seconds), "-i", str(image_paths[0]),
            "-vf", f"{_SCALE_CROP},setsar=1,fps={_FPS},format=yuv420p",
            "-r", str(_FPS), "-c:v", "libx264", "-preset", "veryfast",
            str(output_path),
        ]
        return _run_ffmpeg_killable(cmd, cancel_event=cancel_event, timeout=60, log_prefix="MEMVID-xfade") \
            and Path(output_path).exists()

    inputs = []
    per_stream_filters = []
    for i, img_path in enumerate(image_paths):
        inputs += ["-loop", "1", "-t", str(clip_seconds), "-i", str(img_path)]
        per_stream_filters.append(
            f"[{i}:v]{_SCALE_CROP},setsar=1,fps={_FPS}[v{i}]"
        )

    chain_filters = []
    running_label = "v0"
    for t in range(1, n):
        offset = t * (clip_seconds - fade_seconds)
        out_label = f"vx{t}" if t < n - 1 else "vout"
        chain_filters.append(
            f"[{running_label}][v{t}]xfade=transition=fade:duration={fade_seconds}:offset={offset}"
            + (",format=yuv420p" if t == n - 1 else "")
            + f"[{out_label}]"
        )
        running_label = out_label

    filter_complex = ";".join(per_stream_filters + chain_filters)
    cmd = [
        config.FFMPEG_PATH, "-y",
        *inputs,
        "-filter_complex", filter_complex,
        "-map", "[vout]",
        "-r", str(_FPS), "-c:v", "libx264", "-preset", "veryfast",
        str(output_path),
    ]
    # Longer timeout than the other styles: one invocation covers every
    # photo at once instead of per-photo work split into small ffmpeg calls.
    return _run_ffmpeg_killable(cmd, cancel_event=cancel_event, timeout=300, log_prefix="MEMVID-xfade") \
        and Path(output_path).exists()


VIDEO_STYLES: Dict[str, _StyleEntry] = {
    "ken_burns": {
        "label_tr": "Ken Burns (yavaş yakınlaştırma)",
        "label_en": "Ken Burns (slow zoom/pan)",
        "build": _build_ken_burns,
    },
    "crossfade": {
        "label_tr": "Yumuşak geçişli slayt",
        "label_en": "Crossfade slideshow",
        "build": _build_crossfade,
    },
}

DEFAULT_STYLE = "ken_burns"


def get_style_choices() -> List[dict]:
    """For the settings dropdown - the frontend never hardcodes style keys."""
    return [
        {"key": key, "label_tr": entry["label_tr"], "label_en": entry["label_en"]}
        for key, entry in VIDEO_STYLES.items()
    ]


def build_video(
    style_key: str, image_paths: List[str], output_path: str,
    cancel_event: Optional[threading.Event] = None,
) -> bool:
    entry = VIDEO_STYLES.get(style_key) or VIDEO_STYLES[DEFAULT_STYLE]
    return entry["build"](image_paths, output_path, cancel_event)

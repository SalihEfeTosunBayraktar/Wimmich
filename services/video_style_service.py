"""Pluggable "how do the photos turn into a video" pipeline for
auto-generated memory videos.

Adding a new style is exactly: write one function with the signature
`(image_paths, output_path, cancel_event, width, height, labels) -> bool`,
add an entry to VIDEO_STYLES below with a key + display labels. Nothing
else in the app needs to change - memory_video_service picks the builder
purely by key, the settings API and frontend dropdown both read their
choices from get_style_choices()/get_format_choices() rather than a
hardcoded list.
"""
import shutil
import tempfile
import threading
from pathlib import Path
from typing import Callable, Dict, List, Optional, TypedDict

import config
from utils.video_utils import _run_ffmpeg_killable, ffmpeg_thread_args
from utils.log import warn

_FPS = 25

# Every photo is scaled to fill the target canvas (cropping whatever
# doesn't fit) rather than letterboxed - matches how most "memory video"
# generators (Google/Apple Photos included) handle a mix of portrait and
# landscape source photos, and keeps every clip the exact same frame size,
# which the concat/xfade steps below both require.
def _scale_crop(width: int, height: int) -> str:
    return f"scale={width}:{height}:force_original_aspect_ratio=increase,crop={width}:{height}"


# ─── Output format (aspect ratio / resolution) ─────────────────────
FORMATS: Dict[str, dict] = {
    "landscape": {"label_tr": "Yatay (16:9)", "label_en": "Landscape (16:9)", "width": 1280, "height": 720},
    "vertical": {"label_tr": "Dikey (9:16)", "label_en": "Vertical (9:16, Story/Reels)", "width": 720, "height": 1280},
}
DEFAULT_FORMAT = "landscape"


def get_format_choices() -> List[dict]:
    return [
        {"key": key, "label_tr": entry["label_tr"], "label_en": entry["label_en"]}
        for key, entry in FORMATS.items()
    ]


# ─── Date/text overlay (drawtext) ──────────────────────────────────
# ffmpeg's drawtext filter needs a real font FILE on Windows - there's no
# fontconfig to fall back on with the portable ffbinaries build this app
# downloads (see utils/ffmpeg_setup.py), so this points at whichever common
# system font actually exists rather than assuming one specific install.
_FONT_CANDIDATES = [
    r"C:\Windows\Fonts\segoeui.ttf",
    r"C:\Windows\Fonts\arial.ttf",
    r"C:\Windows\Fonts\calibri.ttf",
]
_font_path_cache: Optional[str] = None


def _font_path() -> str:
    """Empty string (not None) when no usable font was found - callers
    treat that as "skip the overlay for this render" rather than failing
    the whole video, since a caption is a nice-to-have, not essential."""
    global _font_path_cache
    if _font_path_cache is None:
        _font_path_cache = next((p for p in _FONT_CANDIDATES if Path(p).exists()), "")
    return _font_path_cache


def _escape_drawtext(text: str) -> str:
    """Labels here are always our own formatted dates (see
    memory_video_service.py), never arbitrary user text, so this is a
    defensive minimum rather than a full escaper - colons and backslashes
    are the two characters that would otherwise break the filter's own
    key=value:key=value parsing."""
    return text.replace("\\", "\\\\").replace(":", "\\:").replace("'", "\u2019")


def _drawtext_filter(label: Optional[str], height: int) -> str:
    """A small semi-transparent caption bar pinned to the bottom of the
    frame - returns "" (safe to skip, not append) when there's no font
    available or no label for this photo."""
    font = _font_path()
    if not font or not label:
        return ""
    escaped = _escape_drawtext(label)
    font_ff = font.replace("\\", "/")  # ffmpeg wants forward slashes even on Windows
    fontsize = max(20, height // 22)
    margin = max(24, height // 16)
    return (
        f"drawtext=fontfile='{font_ff}':text='{escaped}':fontcolor=white:fontsize={fontsize}:"
        f"x=(w-text_w)/2:y=h-text_h-{margin}:box=1:boxcolor=black@0.45:boxborderw=12"
    )


def _label_for(labels: Optional[List[str]], i: int) -> Optional[str]:
    return labels[i] if labels and i < len(labels) else None


def _concat_clips(clip_paths: List[Path], tmp_dir: Path, output_path: str, cancel_event) -> bool:
    """Shared by every per-clip-then-concat style below - one ffmpeg concat
    demuxer pass over clips that already share identical codec/resolution/
    fps, so it's a lossless stream copy rather than a re-encode."""
    list_file = tmp_dir / "concat_list.txt"
    list_file.write_text("\n".join(f"file '{p.name}'" for p in clip_paths), encoding="utf-8")
    cmd = [
        config.FFMPEG_PATH, "-y",
        *ffmpeg_thread_args(),
        "-f", "concat", "-safe", "0",
        "-i", str(list_file),
        "-c", "copy",
        str(output_path),
    ]
    return _run_ffmpeg_killable(cmd, cancel_event=cancel_event, timeout=180, log_prefix="MEMVID-concat") \
        and Path(output_path).exists()


class _StyleEntry(TypedDict):
    label_tr: str
    label_en: str
    build: Callable


def _build_ken_burns(
    image_paths: List[str], output_path: str, cancel_event: Optional[threading.Event],
    width: int, height: int, labels: Optional[List[str]] = None,
) -> bool:
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
                f"{_scale_crop(width, height)},"
                f"zoompan=z='{zoom_expr}':d={frames}:s={width}x{height}:fps={_FPS}"
            )
            text_vf = _drawtext_filter(_label_for(labels, i), height)
            if text_vf:
                vf += f",{text_vf}"
            vf += ",format=yuv420p"
            cmd = [
                config.FFMPEG_PATH, "-y",
                *ffmpeg_thread_args(),
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
        return _concat_clips(clip_paths, tmp_dir, output_path, cancel_event)
    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)


def _build_crossfade(
    image_paths: List[str], output_path: str, cancel_event: Optional[threading.Event],
    width: int, height: int, labels: Optional[List[str]] = None,
) -> bool:
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
        vf = f"{_scale_crop(width, height)},setsar=1,fps={_FPS},format=yuv420p"
        text_vf = _drawtext_filter(_label_for(labels, 0), height)
        if text_vf:
            vf = vf.replace(",format=yuv420p", f",{text_vf},format=yuv420p")
        cmd = [
            config.FFMPEG_PATH, "-y",
            *ffmpeg_thread_args(),
            "-loop", "1", "-t", str(clip_seconds), "-i", str(image_paths[0]),
            "-vf", vf,
            "-r", str(_FPS), "-c:v", "libx264", "-preset", "veryfast",
            str(output_path),
        ]
        return _run_ffmpeg_killable(cmd, cancel_event=cancel_event, timeout=60, log_prefix="MEMVID-xfade") \
            and Path(output_path).exists()

    inputs = []
    per_stream_filters = []
    for i, img_path in enumerate(image_paths):
        inputs += ["-loop", "1", "-t", str(clip_seconds), "-i", str(img_path)]
        stream_vf = f"{_scale_crop(width, height)},setsar=1,fps={_FPS}"
        text_vf = _drawtext_filter(_label_for(labels, i), height)
        if text_vf:
            stream_vf += f",{text_vf}"
        per_stream_filters.append(f"[{i}:v]{stream_vf}[v{i}]")

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
        *ffmpeg_thread_args(),
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


def _build_simple_cut(
    image_paths: List[str], output_path: str, cancel_event: Optional[threading.Event],
    width: int, height: int, labels: Optional[List[str]] = None,
) -> bool:
    """No pan/zoom motion at all - each photo held still, with a brief
    fade to/from black punctuating the cut to the next one, for people who
    find Ken Burns' constant motion distracting rather than pleasant."""
    clip_seconds = 2.2
    fade_seconds = 0.3
    tmp_dir = Path(tempfile.mkdtemp(prefix="wimmich_sc_", dir=str(config.MEMORY_VIDEO_DIR)))
    try:
        clip_paths = []
        for i, img_path in enumerate(image_paths):
            if cancel_event is not None and cancel_event.is_set():
                return False
            clip_path = tmp_dir / f"clip_{i:03d}.mp4"
            vf = (
                f"{_scale_crop(width, height)},"
                f"fade=t=in:st=0:d={fade_seconds},"
                f"fade=t=out:st={clip_seconds - fade_seconds}:d={fade_seconds}"
            )
            text_vf = _drawtext_filter(_label_for(labels, i), height)
            if text_vf:
                vf += f",{text_vf}"
            vf += ",format=yuv420p"
            cmd = [
                config.FFMPEG_PATH, "-y",
                *ffmpeg_thread_args(),
                "-loop", "1", "-i", str(img_path),
                "-vf", vf,
                "-t", str(clip_seconds),
                "-r", str(_FPS),
                "-c:v", "libx264", "-preset", "veryfast",
                str(clip_path),
            ]
            if not _run_ffmpeg_killable(cmd, cancel_event=cancel_event, timeout=60, log_prefix="MEMVID-sc-clip"):
                warn("MEMVID", f"Simple-cut clip failed for {img_path}, skipping it")
                continue
            clip_paths.append(clip_path)

        if not clip_paths:
            return False
        return _concat_clips(clip_paths, tmp_dir, output_path, cancel_event)
    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)


def _build_fast_montage(
    image_paths: List[str], output_path: str, cancel_event: Optional[threading.Event],
    width: int, height: int, labels: Optional[List[str]] = None,
) -> bool:
    """Quick hard cuts with no motion and no fades - an energetic, high-
    tempo montage for a photo group with a lot of shots in it, the
    opposite pacing from Ken Burns/crossfade's slow, contemplative feel."""
    clip_seconds = 0.6
    tmp_dir = Path(tempfile.mkdtemp(prefix="wimmich_fm_", dir=str(config.MEMORY_VIDEO_DIR)))
    try:
        clip_paths = []
        for i, img_path in enumerate(image_paths):
            if cancel_event is not None and cancel_event.is_set():
                return False
            clip_path = tmp_dir / f"clip_{i:03d}.mp4"
            vf = _scale_crop(width, height)
            text_vf = _drawtext_filter(_label_for(labels, i), height)
            if text_vf:
                vf += f",{text_vf}"
            vf += ",format=yuv420p"
            cmd = [
                config.FFMPEG_PATH, "-y",
                *ffmpeg_thread_args(),
                "-loop", "1", "-i", str(img_path),
                "-vf", vf,
                "-t", str(clip_seconds),
                "-r", str(_FPS),
                "-c:v", "libx264", "-preset", "veryfast",
                str(clip_path),
            ]
            if not _run_ffmpeg_killable(cmd, cancel_event=cancel_event, timeout=60, log_prefix="MEMVID-fm-clip"):
                warn("MEMVID", f"Fast-montage clip failed for {img_path}, skipping it")
                continue
            clip_paths.append(clip_path)

        if not clip_paths:
            return False
        return _concat_clips(clip_paths, tmp_dir, output_path, cancel_event)
    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)


def _build_pan_only(
    image_paths: List[str], output_path: str, cancel_event: Optional[threading.Event],
    width: int, height: int, labels: Optional[List[str]] = None,
) -> bool:
    """Ken Burns without the zoom - a constant, slight overscan (so there's
    room to move) purely panning left-to-right (even index) or right-to-
    left (odd index), for people who want *some* motion but find the
    zoom-in/out itself distracting."""
    clip_seconds = 3.0
    frames = int(clip_seconds * _FPS)
    pan_zoom = 1.15  # constant overscan - the "room" the pan moves across
    tmp_dir = Path(tempfile.mkdtemp(prefix="wimmich_pan_", dir=str(config.MEMORY_VIDEO_DIR)))
    try:
        clip_paths = []
        for i, img_path in enumerate(image_paths):
            if cancel_event is not None and cancel_event.is_set():
                return False
            clip_path = tmp_dir / f"clip_{i:03d}.mp4"
            if i % 2 == 0:
                x_expr = f"(iw-iw/zoom)*on/{frames}"
            else:
                x_expr = f"(iw-iw/zoom)*(1-on/{frames})"
            vf = (
                f"{_scale_crop(width, height)},"
                f"zoompan=z='{pan_zoom}':x='{x_expr}':y='ih/2-(ih/zoom/2)':d={frames}:s={width}x{height}:fps={_FPS}"
            )
            text_vf = _drawtext_filter(_label_for(labels, i), height)
            if text_vf:
                vf += f",{text_vf}"
            vf += ",format=yuv420p"
            cmd = [
                config.FFMPEG_PATH, "-y",
                *ffmpeg_thread_args(),
                "-loop", "1", "-i", str(img_path),
                "-vf", vf,
                "-t", str(clip_seconds),
                "-r", str(_FPS),
                "-c:v", "libx264", "-preset", "veryfast",
                str(clip_path),
            ]
            if not _run_ffmpeg_killable(cmd, cancel_event=cancel_event, timeout=60, log_prefix="MEMVID-pan-clip"):
                warn("MEMVID", f"Pan clip failed for {img_path}, skipping it")
                continue
            clip_paths.append(clip_path)

        if not clip_paths:
            return False
        return _concat_clips(clip_paths, tmp_dir, output_path, cancel_event)
    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)


def _build_polaroid(
    image_paths: List[str], output_path: str, cancel_event: Optional[threading.Event],
    width: int, height: int, labels: Optional[List[str]] = None,
) -> bool:
    """Each photo shown as a white-bordered "polaroid" card, slightly
    rotated (alternating left/right for variety) and fading in, centered
    on a plain dark background instead of filling the whole frame -
    matches the postcard/scrapbook look some other "memory video" tools
    default to."""
    clip_seconds = 2.6
    fade_seconds = 0.35
    bg_color = "0x161616"
    card_w = int(width * 0.62)
    card_h = int(height * 0.62)
    tmp_dir = Path(tempfile.mkdtemp(prefix="wimmich_pol_", dir=str(config.MEMORY_VIDEO_DIR)))
    try:
        clip_paths = []
        for i, img_path in enumerate(image_paths):
            if cancel_event is not None and cancel_event.is_set():
                return False
            clip_path = tmp_dir / f"clip_{i:03d}.mp4"
            angle_deg = -4 if i % 2 == 0 else 4
            text_vf = _drawtext_filter(_label_for(labels, i), height)
            filter_complex = (
                f"[0:v]scale={card_w}:{card_h}:force_original_aspect_ratio=decrease,"
                f"pad=w=iw+40:h=ih+120:x=20:y=20:color=white,"
                f"rotate={angle_deg}*PI/180:c={bg_color}:ow=rotw({angle_deg}*PI/180):oh=roth({angle_deg}*PI/180)"
                f"[card];"
                f"[1:v][card]overlay=(W-w)/2:(H-h)/2:shortest=1,"
                f"fade=t=in:st=0:d={fade_seconds}"
                + (f",{text_vf}" if text_vf else "")
                + ",format=yuv420p[v]"
            )
            cmd = [
                config.FFMPEG_PATH, "-y",
                *ffmpeg_thread_args(),
                "-loop", "1", "-t", str(clip_seconds), "-i", str(img_path),
                "-f", "lavfi", "-i", f"color=c={bg_color}:s={width}x{height}:d={clip_seconds}",
                "-filter_complex", filter_complex,
                "-map", "[v]",
                "-r", str(_FPS), "-c:v", "libx264", "-preset", "veryfast",
                str(clip_path),
            ]
            if not _run_ffmpeg_killable(cmd, cancel_event=cancel_event, timeout=60, log_prefix="MEMVID-pol-clip"):
                warn("MEMVID", f"Polaroid clip failed for {img_path}, skipping it")
                continue
            clip_paths.append(clip_path)

        if not clip_paths:
            return False
        return _concat_clips(clip_paths, tmp_dir, output_path, cancel_event)
    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)


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
    "simple_cut": {
        "label_tr": "Basit slayt (sert kesim)",
        "label_en": "Simple slideshow (hard cut)",
        "build": _build_simple_cut,
    },
    "fast_montage": {
        "label_tr": "Hızlı montaj",
        "label_en": "Fast montage",
        "build": _build_fast_montage,
    },
    "pan_only": {
        "label_tr": "Yatay kaydırma (zoom yok)",
        "label_en": "Pan only (no zoom)",
        "build": _build_pan_only,
    },
    "polaroid": {
        "label_tr": "Polaroid / çerçeveli geçiş",
        "label_en": "Polaroid / framed transition",
        "build": _build_polaroid,
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
    format_key: str = DEFAULT_FORMAT,
    labels: Optional[List[str]] = None,
) -> bool:
    entry = VIDEO_STYLES.get(style_key) or VIDEO_STYLES[DEFAULT_STYLE]
    fmt = FORMATS.get(format_key) or FORMATS[DEFAULT_FORMAT]
    return entry["build"](image_paths, output_path, cancel_event, fmt["width"], fmt["height"], labels)

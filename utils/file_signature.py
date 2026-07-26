"""Upload file-type validation by content, not just filename extension - a
browser/curl request can claim any filename it wants, so trusting the
extension (or a client-supplied Content-Type) alone would let a renamed
executable or script into the library disguised as a photo.

Checks the file's actual leading bytes ("magic numbers") against what its
extension claims to be. Extensions with no single reliable universal
signature (bare .raw is vendor-specific with no common header; .svg is
text/XML, not a binary format a magic-number check meaningfully applies
to) are intentionally left unchecked - trusted as-is - rather than risk
false-rejecting a legitimate file for a format this can't verify anyway.
"""
from pathlib import Path


def _is_jpeg(b: bytes) -> bool:
    return b[:3] == b"\xff\xd8\xff"


def _is_png(b: bytes) -> bool:
    return b[:8] == b"\x89PNG\r\n\x1a\n"


def _is_gif(b: bytes) -> bool:
    return b[:6] in (b"GIF87a", b"GIF89a")


def _is_bmp(b: bytes) -> bool:
    return b[:2] == b"BM"


def _is_riff(b: bytes, kind: bytes) -> bool:
    return b[:4] == b"RIFF" and b[8:12] == kind


def _is_tiff(b: bytes) -> bool:
    # Also covers most camera RAW formats (CR2/NEF/ARW/ORF/RW2/DNG): they're
    # TIFF containers with vendor-specific tags, sharing the same header.
    return b[:4] in (b"II*\x00", b"MM\x00*")


def _is_isobmff(b: bytes, brands: tuple) -> bool:
    """ISO base media file format container (MP4/MOV/HEIC/AVIF/3GP/CR3): a
    4-byte box size, then b"ftyp", then a 4-byte brand - matched loosely
    (startswith) since the minor-version digit and compatible-brand list
    both vary by encoder."""
    if len(b) < 12 or b[4:8] != b"ftyp":
        return False
    brand = b[8:12]
    return any(brand.startswith(x) for x in brands)


def _is_ebml(b: bytes) -> bool:
    return b[:4] == b"\x1a\x45\xdf\xa3"


def _is_asf(b: bytes) -> bool:
    return b[:16] == bytes.fromhex("3026b2758e66cf11a6d900aa0062ce6c")


def _is_flv(b: bytes) -> bool:
    return b[:3] == b"FLV"


_HEIF_BRANDS = (b"heic", b"heix", b"hevc", b"heim", b"heis", b"hevm", b"hevs", b"mif1", b"msf1")

# Extension -> validator. An extension missing here isn't strictly checked
# (trusted as-is) - see the module docstring for why.
_VALIDATORS = {
    ".jpg": _is_jpeg, ".jpeg": _is_jpeg,
    ".png": _is_png,
    ".gif": _is_gif,
    ".bmp": _is_bmp,
    ".webp": lambda b: _is_riff(b, b"WEBP"),
    ".tiff": _is_tiff, ".tif": _is_tiff,
    ".heic": lambda b: _is_isobmff(b, _HEIF_BRANDS),
    ".heif": lambda b: _is_isobmff(b, _HEIF_BRANDS),
    ".avif": lambda b: _is_isobmff(b, (b"avif", b"avis")),
    ".mp4": lambda b: _is_isobmff(b, (b"isom", b"iso2", b"mp41", b"mp42", b"M4V ", b"avc1", b"3gp", b"dash", b"MSNV")),
    ".m4v": lambda b: _is_isobmff(b, (b"M4V ", b"mp42", b"isom")),
    ".mov": lambda b: _is_isobmff(b, (b"qt  ", b"isom")),
    ".3gp": lambda b: _is_isobmff(b, (b"3gp",)),
    ".cr3": lambda b: _is_isobmff(b, (b"crx ",)),
    ".avi": lambda b: _is_riff(b, b"AVI "),
    ".mkv": _is_ebml,
    ".webm": _is_ebml,
    ".wmv": _is_asf,
    ".flv": _is_flv,
    ".cr2": _is_tiff, ".nef": _is_tiff, ".arw": _is_tiff,
    ".orf": _is_tiff, ".rw2": _is_tiff, ".dng": _is_tiff,
}


def matches_claimed_type(filename: str, file_data: bytes) -> bool:
    """True if file_data's actual signature matches what its extension
    claims, or the extension has no reliable universal signature (trusted
    as-is - see _VALIDATORS)."""
    ext = Path(filename).suffix.lower()
    validator = _VALIDATORS.get(ext)
    if validator is None:
        return True
    try:
        return validator(file_data)
    except Exception:
        return False

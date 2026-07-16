"""Image Processing Utilities"""
from pathlib import Path
from typing import Optional, Tuple
import io

from config import RAW_EXTENSIONS

try:
    from PIL import Image, ImageOps
    HAS_PILLOW = True
except ImportError:
    HAS_PILLOW = False

try:
    import rawpy
    HAS_RAWPY = True
except ImportError:
    HAS_RAWPY = False


def _open_any_image(source_path: str):
    """PIL can't decode camera RAW formats at all ("cannot identify image
    file"). Phone/camera RAW files almost always embed a full-resolution
    JPEG preview (rawpy/LibRaw can pull it out directly, no slow full
    demosaic needed) - use that instead of leaving RAW photos as
    thumbnail-less/unviewable."""
    if Path(source_path).suffix.lower() not in RAW_EXTENSIONS or not HAS_RAWPY:
        return Image.open(source_path)

    with rawpy.imread(source_path) as raw:
        thumb = raw.extract_thumb()
        if thumb.format == rawpy.ThumbFormat.JPEG:
            return Image.open(io.BytesIO(thumb.data))
        # Some RAW files only embed an uncompressed bitmap preview.
        return Image.fromarray(thumb.data)


def create_thumbnail(
    source_path: str,
    output_path: str,
    max_size: int = 600,
    quality: int = 85,
    format: str = "WEBP",
) -> bool:
    """
    Create a thumbnail from an image file.
    Returns True if successful.
    """
    if not HAS_PILLOW:
        return False

    try:
        path = Path(source_path)
        if not path.exists():
            return False

        with _open_any_image(source_path) as img:
            # Auto-orient based on EXIF
            img = ImageOps.exif_transpose(img)

            # Convert to RGB if needed (for WEBP/JPEG output)
            if img.mode in ("RGBA", "P", "LA"):
                background = Image.new("RGB", img.size, (0, 0, 0))
                if img.mode == "P":
                    img = img.convert("RGBA")
                background.paste(img, mask=img.split()[-1] if "A" in img.mode else None)
                img = background
            elif img.mode != "RGB":
                img = img.convert("RGB")

            # Resize maintaining aspect ratio
            img.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)

            # Ensure output directory exists
            Path(output_path).parent.mkdir(parents=True, exist_ok=True)

            # Save
            img.save(output_path, format=format, quality=quality, optimize=True)
            return True

    except Exception as e:
        print(f"Thumbnail error for {source_path}: {e}")
        return False


def get_image_dimensions(file_path: str) -> Tuple[Optional[int], Optional[int]]:
    """Get image width and height."""
    if not HAS_PILLOW:
        return None, None
    try:
        with _open_any_image(file_path) as img:
            img = ImageOps.exif_transpose(img)
            return img.width, img.height
    except Exception:
        return None, None


def create_face_thumbnail(
    source_path: str,
    output_path: str,
    x: float, y: float, w: float, h: float,
    size: int = 150,
) -> bool:
    """
    Crop a face region from an image and save as thumbnail.
    x, y, w, h are normalized (0-1) coordinates.
    """
    if not HAS_PILLOW:
        return False

    try:
        with Image.open(source_path) as img:
            img = ImageOps.exif_transpose(img)
            img_w, img_h = img.size

            # Convert normalized coordinates to pixels
            left = int(x * img_w)
            top = int(y * img_h)
            right = int((x + w) * img_w)
            bottom = int((y + h) * img_h)

            # Add some padding
            pad_w = int((right - left) * 0.2)
            pad_h = int((bottom - top) * 0.2)
            left = max(0, left - pad_w)
            top = max(0, top - pad_h)
            right = min(img_w, right + pad_w)
            bottom = min(img_h, bottom + pad_h)

            # Crop and resize
            face_img = img.crop((left, top, right, bottom))
            face_img = face_img.convert("RGB")
            face_img.thumbnail((size, size), Image.Resampling.LANCZOS)

            Path(output_path).parent.mkdir(parents=True, exist_ok=True)
            face_img.save(output_path, "WEBP", quality=85)
            return True

    except Exception as e:
        print(f"Face thumbnail error: {e}")
        return False

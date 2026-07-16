"""EXIF Data Extraction Utilities"""
import math
from datetime import datetime
from typing import Dict, Any
from pathlib import Path

from utils.exif_gps_utils import convert_exifread_gps_to_degrees, pillow_gps_to_degrees

try:
    from PIL import Image
    from PIL.ExifTags import TAGS
    HAS_PILLOW = True
except ImportError:
    HAS_PILLOW = False

try:
    import exifread
    HAS_EXIFREAD = True
except ImportError:
    HAS_EXIFREAD = False


def _extract_pillow_exif(file_path: str, result: dict) -> None:
    """Populate `result` in place from Pillow's EXIF reader."""
    from utils.image_utils import _open_any_image

    with _open_any_image(file_path) as img:
        result["width"] = img.width
        result["height"] = img.height

        exif_data = img._getexif()
        if not exif_data:
            return

        decoded = {}
        for tag_id, value in exif_data.items():
            tag = TAGS.get(tag_id, str(tag_id))
            try:
                if isinstance(value, bytes):
                    value = value.decode("utf-8", errors="ignore")
                decoded[tag] = str(value)
            except Exception:
                pass

        result["raw"] = decoded
        result["camera_make"] = decoded.get("Make")
        result["camera_model"] = decoded.get("Model")
        result["lens_model"] = decoded.get("LensModel")
        result["orientation"] = decoded.get("Orientation")

        for field, tag_name in (("focal_length", "FocalLength"), ("f_number", "FNumber")):
            raw_val = decoded.get(tag_name)
            if raw_val:
                try:
                    if "/" in str(raw_val):
                        num, den = str(raw_val).split("/")
                        result[field] = float(num) / float(den)
                    else:
                        result[field] = float(raw_val)
                except (ValueError, ZeroDivisionError):
                    pass

        iso = decoded.get("ISOSpeedRatings")
        if iso:
            try:
                result["iso"] = int(iso)
            except (ValueError, TypeError):
                pass

        et = decoded.get("ExposureTime")
        if et:
            result["exposure_time"] = str(et)

        for date_tag in ["DateTimeOriginal", "DateTimeDigitized", "DateTime"]:
            date_str = decoded.get(date_tag)
            if not date_str:
                continue
            for fmt in ["%Y:%m:%d %H:%M:%S", "%Y-%m-%d %H:%M:%S", "%Y/%m/%d %H:%M:%S"]:
                try:
                    result["taken_at"] = datetime.strptime(str(date_str).strip(), fmt).isoformat()
                    break
                except ValueError:
                    continue
            if result["taken_at"]:
                break

        gps_info = exif_data.get(34853)  # GPSInfo tag
        if gps_info:
            lat, lon = pillow_gps_to_degrees(gps_info)
            if lat is not None and lon is not None:
                result["latitude"] = round(lat, 6)
                result["longitude"] = round(lon, 6)


def _extract_exifread_fallback(file_path: str, result: dict) -> None:
    """Fill in GPS/date via exifread when Pillow didn't find them."""
    with open(file_path, "rb") as f:
        tags = exifread.process_file(f, details=False)

    if result["taken_at"] is None:
        for date_tag in ["EXIF DateTimeOriginal", "EXIF DateTimeDigitized", "Image DateTime"]:
            if date_tag in tags:
                date_str = str(tags[date_tag])
                for fmt in ["%Y:%m:%d %H:%M:%S", "%Y-%m-%d %H:%M:%S"]:
                    try:
                        result["taken_at"] = datetime.strptime(date_str.strip(), fmt).isoformat()
                        break
                    except ValueError:
                        continue
                if result["taken_at"]:
                    break

    if result["latitude"] is None:
        gps_lat = tags.get("GPS GPSLatitude")
        gps_lat_ref = tags.get("GPS GPSLatitudeRef")
        gps_lon = tags.get("GPS GPSLongitude")
        gps_lon_ref = tags.get("GPS GPSLongitudeRef")

        if gps_lat and gps_lon:
            lat = convert_exifread_gps_to_degrees(gps_lat)
            lon = convert_exifread_gps_to_degrees(gps_lon)
            if str(gps_lat_ref) == "S":
                lat = -lat
            if str(gps_lon_ref) == "W":
                lon = -lon
            result["latitude"] = round(lat, 6)
            result["longitude"] = round(lon, 6)


def extract_exif(file_path: str) -> Dict[str, Any]:
    """Extract EXIF data from an image file. Returns a dict with normalized fields."""
    result = {
        "taken_at": None, "latitude": None, "longitude": None,
        "width": None, "height": None,
        "camera_make": None, "camera_model": None, "lens_model": None,
        "focal_length": None, "f_number": None, "exposure_time": None,
        "iso": None, "orientation": None, "raw": {},
    }

    if not Path(file_path).exists():
        return result

    if HAS_PILLOW:
        try:
            _extract_pillow_exif(file_path, result)
        except Exception:
            pass

    if HAS_EXIFREAD and (result["latitude"] is None or result["taken_at"] is None):
        try:
            _extract_exifread_fallback(file_path, result)
        except Exception:
            pass

    # Clean up nan/inf float values which are not JSON compliant
    for key in ["latitude", "longitude", "focal_length", "f_number"]:
        val = result.get(key)
        if val is not None:
            try:
                fval = float(val)
                result[key] = None if (math.isnan(fval) or math.isinf(fval)) else fval
            except (ValueError, TypeError):
                result[key] = None

    return result

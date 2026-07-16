"""GPS coordinate conversion helpers shared by the Pillow and exifread EXIF paths."""
from typing import Optional, Tuple


def convert_exifread_gps_to_degrees(value) -> float:
    """Convert an exifread GPS coordinate (degrees/minutes/seconds ratios) to decimal degrees."""
    try:
        d = float(value.values[0].num) / float(value.values[0].den)
        m = float(value.values[1].num) / float(value.values[1].den)
        s = float(value.values[2].num) / float(value.values[2].den)
        return d + (m / 60.0) + (s / 3600.0)
    except (AttributeError, IndexError, ZeroDivisionError):
        return 0.0


def pillow_gps_to_degrees(gps_info: dict) -> Tuple[Optional[float], Optional[float]]:
    """Extract GPS coordinates from Pillow EXIF GPS info."""
    lat = lon = None
    try:
        gps_lat = gps_info.get("GPSLatitude") or gps_info.get(2)
        gps_lat_ref = gps_info.get("GPSLatitudeRef") or gps_info.get(1)
        gps_lon = gps_info.get("GPSLongitude") or gps_info.get(4)
        gps_lon_ref = gps_info.get("GPSLongitudeRef") or gps_info.get(3)

        if gps_lat and gps_lon:
            lat = float(gps_lat[0]) + float(gps_lat[1]) / 60 + float(gps_lat[2]) / 3600
            lon = float(gps_lon[0]) + float(gps_lon[1]) / 60 + float(gps_lon[2]) / 3600

            if gps_lat_ref and str(gps_lat_ref) == "S":
                lat = -lat
            if gps_lon_ref and str(gps_lon_ref) == "W":
                lon = -lon
    except (TypeError, ValueError, IndexError, KeyError):
        pass
    return lat, lon

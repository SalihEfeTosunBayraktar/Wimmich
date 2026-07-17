"""Offline reverse geocoding (GPS coordinates -> city/country name).

Uses reverse_geocoder (bundled ~30MB city dataset, no network calls) and
pycountry (ISO-3166 country name lookup) - both optional, same
feature-detection pattern as HAS_PILLOW/HAS_EXIFREAD in exif_utils.py.
"""
from typing import Optional, Tuple

from utils.log import error

GEOCODING_AVAILABLE = False
try:
    import reverse_geocoder
    import pycountry
    GEOCODING_AVAILABLE = True
except ImportError:
    GEOCODING_AVAILABLE = False


def lookup_city_country(lat: float, lon: float) -> Tuple[Optional[str], Optional[str]]:
    """Look up city and country name for a GPS coordinate. Offline, no network calls."""
    if not GEOCODING_AVAILABLE:
        return None, None

    try:
        # mode=1 forces single-process lookup. The library's default (mode=2)
        # spawns a worker-process pool sized to the CPU count to parallelize
        # its KD-tree query - a huge waste for a single coordinate, and
        # brutal when called once per photo during a bulk import (every
        # photo briefly spawned 16 extra processes on this machine).
        result = reverse_geocoder.search([(lat, lon)], mode=1)[0]
        city = result.get("name") or None

        country = None
        country_code = result.get("cc")
        if country_code:
            country_entry = pycountry.countries.get(alpha_2=country_code)
            country = country_entry.name if country_entry else country_code

        return city, country
    except Exception as e:
        error("GEOCODE", f"Reverse geocoding error for ({lat}, {lon}): {e}")
        return None, None

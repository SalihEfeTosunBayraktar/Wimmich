"""Media responses: Range handling and what may be cached.

This file exists because of a real regression. Adding
`Cache-Control: private, max-age=7d` to every media response cut a genuine
problem (galleries re-fetching ~60 thumbnails per view) but also stamped
that header onto 206 Partial Content responses. A <video> element always
fetches by Range, so browsers cached a fragment as the body for the whole
URL and video playback broke for a week's worth of cache. Images were
unaffected, which is why only video was reported.

Two independent guarantees are asserted here, matching the two-layer fix:
  1. video responses carry no cache header at all;
  2. NO response of any kind carries one on a 206, enforced centrally in
     main.py's security-headers middleware.
"""
import io

import httpx
import pytest
from conftest import auth


def _png_bytes() -> bytes:
    from PIL import Image

    buf = io.BytesIO()
    Image.new("RGB", (64, 64), (20, 120, 200)).save(buf, format="PNG")
    return buf.getvalue()


@pytest.fixture(scope="session")
async def image_asset(app, member):
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as c:
        resp = await c.post(
            "/api/assets/upload",
            files={"files": ("cached.png", _png_bytes(), "image/png")},
            headers=auth(member["token"]),
        )
        assert resp.status_code == 200, resp.text
        body = resp.json()
        assert not body["errors"], body["errors"]
        return body["results"][0]["asset"]["id"]


async def test_image_file_is_cacheable(client, member, image_asset):
    resp = await client.get(f"/api/assets/{image_asset}/file", headers=auth(member["token"]))
    assert resp.status_code == 200
    assert "max-age" in resp.headers.get("cache-control", ""), \
        "images lost their cache header - that was the whole point of adding it"


async def test_range_request_is_answered_with_206(client, member, image_asset):
    resp = await client.get(
        f"/api/assets/{image_asset}/file",
        headers={**auth(member["token"]), "Range": "bytes=0-31"},
    )
    assert resp.status_code == 206
    assert len(resp.content) == 32
    assert resp.headers.get("content-range", "").startswith("bytes 0-31/")


async def test_a_partial_response_is_never_cacheable(client, member, image_asset):
    """The central guard in main.py. A cached 206 is a trap regardless of
    which handler produced it: the browser stores the fragment under the
    full URL and replays it."""
    resp = await client.get(
        f"/api/assets/{image_asset}/file",
        headers={**auth(member["token"]), "Range": "bytes=0-31"},
    )
    assert resp.status_code == 206
    assert "cache-control" not in resp.headers, \
        f"206 came back cacheable: {resp.headers.get('cache-control')!r}"


async def test_video_assets_are_never_cacheable(monkeypatch, member, image_asset):
    """The other layer of the fix, asserted against the service directly so
    it doesn't need a real video file (and an FFmpeg install) to prove.
    _is_video decides purely from file_type/mime_type."""
    from services import asset_media_service as ams

    class FakeVideo:
        file_path = "does-not-matter.mp4"
        encoded_video_path = None
        thumb_large_path = None
        mime_type = "video/mp4"
        file_type = "VIDEO"
        original_file_name = "clip.mp4"

    class FakeImage(FakeVideo):
        mime_type = "image/jpeg"
        file_type = "IMAGE"
        file_path = "does-not-matter.jpg"
        original_file_name = "pic.jpg"

    assert ams._is_video(FakeVideo()) is True
    assert ams._is_video(FakeImage()) is False

    # and the wrapper actually withholds the header for one and not the other
    class FakeResponse:
        def __init__(self):
            self.headers = {}

    video_resp = ams._cached_unless_video(FakeVideo(), FakeResponse())
    image_resp = ams._cached_unless_video(FakeImage(), FakeResponse())
    assert "Cache-Control" not in video_resp.headers
    assert "Cache-Control" in image_resp.headers


async def test_thumbnails_are_cacheable(client, member, image_asset):
    """Thumbnails are the reason the header exists - a gallery page asks for
    dozens of them, and <img> never sends a Range so they are always 200."""
    resp = await client.get(
        f"/api/assets/{image_asset}/thumbnail?size=small",
        headers=auth(member["token"]),
    )
    assert resp.status_code == 200
    assert "max-age" in resp.headers.get("cache-control", "")

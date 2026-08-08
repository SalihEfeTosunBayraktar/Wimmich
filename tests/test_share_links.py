"""Public share links.

Share links are the only part of the app reachable with no account at all,
so the interesting question is never "does the link work" but "what does a
link let a stranger reach". Scope, password, expiry and revocation are all
that stands between a shared photo and the rest of the owner's library.
"""
import io
from datetime import datetime, timedelta, timezone

import httpx
import pytest
from conftest import auth


def _png_bytes(seed: str) -> bytes:
    """Pixel colour derived from the filename so every upload is a genuinely
    different image. Uploading identical bytes twice trips the server's
    duplicate detection, which returns a result with no "asset" key - so a
    fixed colour here would make these tests fail for a reason that has
    nothing to do with sharing."""
    from PIL import Image

    h = abs(hash(seed))
    colour = (h % 200 + 20, (h // 200) % 200 + 20, (h // 40000) % 200 + 20)
    buf = io.BytesIO()
    Image.new("RGB", (40, 40), colour).save(buf, format="PNG")
    return buf.getvalue()


async def _upload(c: httpx.AsyncClient, token: str, name: str) -> str:
    resp = await c.post(
        "/api/assets/upload",
        files={"files": (name, _png_bytes(name), "image/png")},
        headers=auth(token),
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert not body["errors"], body["errors"]
    result = body["results"][0]
    assert result["status"] == "uploaded", f"expected a new asset, got {result}"
    return result["asset"]["id"]


@pytest.fixture(scope="session")
async def shared_pair(app, member):
    """Two assets by the same owner: one put behind a share link, one not.
    The second is the whole point - it's what a leaked link must NOT reach."""
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as c:
        shared = await _upload(c, member["token"], "shared.png")
        private = await _upload(c, member["token"], "private.png")
        resp = await c.post(
            "/api/shares",
            json={"link_type": "ASSET", "asset_ids": [shared], "allow_download": True},
            headers=auth(member["token"]),
        )
        assert resp.status_code == 200, resp.text
        body = resp.json()
        return {"key": body["key"], "share_id": body["id"], "shared": shared, "private": private}


async def test_anonymous_can_open_the_link(client, shared_pair):
    resp = await client.get(f"/api/shared/{shared_pair['key']}")
    assert resp.status_code == 200
    ids = [a["id"] for a in resp.json()["assets"]]
    assert shared_pair["shared"] in ids


async def test_the_link_exposes_only_what_was_shared(client, shared_pair):
    """A share link is scoped to its own asset list. If an unshared id could
    be fetched through it, one shared photo would expose the whole library."""
    resp = await client.get(f"/api/shared/{shared_pair['key']}")
    ids = [a["id"] for a in resp.json()["assets"]]
    assert shared_pair["private"] not in ids

    leaked = await client.get(
        f"/api/shared/{shared_pair['key']}/assets/{shared_pair['private']}/file"
    )
    assert leaked.status_code in (403, 404), \
        "an unshared asset was reachable through someone else's share link"


async def test_anonymous_can_fetch_the_shared_file(client, shared_pair):
    resp = await client.get(
        f"/api/shared/{shared_pair['key']}/assets/{shared_pair['shared']}/file"
    )
    assert resp.status_code == 200


async def test_an_unknown_key_is_a_404(client):
    assert (await client.get("/api/shared/definitely-not-a-real-key")).status_code == 404


async def test_a_password_protected_link_withholds_its_contents(client, app, member):
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as c:
        asset = await _upload(c, member["token"], "locked.png")
        resp = await c.post(
            "/api/shares",
            json={"link_type": "ASSET", "asset_ids": [asset], "password": "hunter22"},
            headers=auth(member["token"]),
        )
        assert resp.status_code == 200, resp.text
        key = resp.json()["key"]

    opened = await client.get(f"/api/shared/{key}")
    # Either the request is refused outright, or it comes back flagged as
    # locked - what must never happen is the asset list arriving anyway.
    if opened.status_code == 200:
        body = opened.json()
        assert body.get("requires_password") is True, body
        assert not body.get("assets"), "password-protected link returned its assets"
    else:
        assert opened.status_code in (401, 403)


async def test_revoking_a_link_stops_it_working(client, app, member):
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as c:
        asset = await _upload(c, member["token"], "revoked.png")
        created = await c.post(
            "/api/shares",
            json={"link_type": "ASSET", "asset_ids": [asset]},
            headers=auth(member["token"]),
        )
        share = created.json()
        assert (await client.get(f"/api/shared/{share['key']}")).status_code == 200

        deleted = await c.delete(f"/api/shares/{share['id']}", headers=auth(member["token"]))
        assert deleted.status_code == 200, deleted.text

    assert (await client.get(f"/api/shared/{share['key']}")).status_code == 404


async def test_another_user_cannot_revoke_someone_elses_link(client, app, member, other_member):
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as c:
        asset = await _upload(c, member["token"], "notyours.png")
        created = await c.post(
            "/api/shares",
            json={"link_type": "ASSET", "asset_ids": [asset]},
            headers=auth(member["token"]),
        )
        share = created.json()

        attempt = await c.delete(f"/api/shares/{share['id']}", headers=auth(other_member["token"]))
        assert attempt.status_code in (403, 404)

    # still live
    assert (await client.get(f"/api/shared/{share['key']}")).status_code == 200


async def test_an_expired_link_is_refused(client, app, member):
    """Expiry is checked on every visit, not only at creation - a link made
    valid yesterday must stop working on its own."""
    from sqlalchemy import select

    from database import AsyncSessionLocal
    from models import SharedLink

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as c:
        asset = await _upload(c, member["token"], "expiring.png")
        created = await c.post(
            "/api/shares",
            json={"link_type": "ASSET", "asset_ids": [asset], "expires_in_days": 7},
            headers=auth(member["token"]),
        )
        share = created.json()

    assert (await client.get(f"/api/shared/{share['key']}")).status_code == 200

    # Rewind the expiry rather than waiting seven days for it.
    async with AsyncSessionLocal() as db:
        row = (await db.execute(select(SharedLink).where(SharedLink.id == share["id"]))).scalar_one()
        row.expires_at = datetime.now(timezone.utc) - timedelta(days=1)
        await db.commit()

    assert (await client.get(f"/api/shared/{share['key']}")).status_code in (403, 404, 410)

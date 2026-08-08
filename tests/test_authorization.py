"""Who is allowed to touch what.

These are the checks that stay silent when they pass and are expensive when
they fail: an IDOR here means one user can read another's photos, and no
amount of UI polish covers that.
"""
import io

import httpx
import pytest
from conftest import auth


def _png_bytes(colour=(200, 30, 30)) -> bytes:
    """A real, decodable image - the upload path runs Pillow over it, so a
    handful of fake bytes would fail for the wrong reason."""
    from PIL import Image

    buf = io.BytesIO()
    Image.new("RGB", (48, 32), colour).save(buf, format="PNG")
    return buf.getvalue()


async def _upload(client: httpx.AsyncClient, token: str, name: str = "shot.png") -> str:
    resp = await client.post(
        "/api/assets/upload",
        files={"files": (name, _png_bytes(), "image/png")},
        headers=auth(token),
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert not body["errors"], body["errors"]
    results = [r for r in body["results"] if r["status"] == "uploaded"]
    assert results, f"nothing was uploaded: {body}"
    return results[0]["asset"]["id"]


@pytest.fixture(scope="session")
async def members_asset(app, member):
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as c:
        return await _upload(c, member["token"])


async def test_owner_can_read_their_own_asset(client, member, members_asset):
    resp = await client.get(f"/api/assets/{members_asset}", headers=auth(member["token"]))
    assert resp.status_code == 200
    assert resp.json()["id"] == members_asset


async def test_another_user_cannot_read_it(client, other_member, members_asset):
    """404 rather than 403 on purpose - a 403 would confirm the id exists."""
    resp = await client.get(f"/api/assets/{members_asset}", headers=auth(other_member["token"]))
    assert resp.status_code == 404


async def test_another_user_cannot_fetch_the_file(client, other_member, members_asset):
    resp = await client.get(f"/api/assets/{members_asset}/file", headers=auth(other_member["token"]))
    assert resp.status_code == 404


async def test_another_user_cannot_fetch_the_thumbnail(client, other_member, members_asset):
    resp = await client.get(f"/api/assets/{members_asset}/thumbnail", headers=auth(other_member["token"]))
    assert resp.status_code == 404


async def test_another_user_cannot_delete_it(client, other_member, member, members_asset):
    resp = await client.delete(f"/api/assets/{members_asset}", headers=auth(other_member["token"]))
    assert resp.status_code == 404

    # and it really is still there afterwards
    still = await client.get(f"/api/assets/{members_asset}", headers=auth(member["token"]))
    assert still.status_code == 200


async def test_anonymous_cannot_read_an_asset(client, members_asset):
    resp = await client.get(f"/api/assets/{members_asset}")
    assert resp.status_code in (401, 403)


async def test_admin_endpoints_reject_a_normal_user(client, member):
    for path in ("/api/admin/stats", "/api/admin/users", "/api/admin/performance"):
        resp = await client.get(path, headers=auth(member["token"]))
        assert resp.status_code == 403, f"{path} let a non-admin in"


async def test_admin_endpoints_accept_an_admin(client, admin):
    for path in ("/api/admin/stats", "/api/admin/users", "/api/admin/performance"):
        resp = await client.get(path, headers=auth(admin["token"]))
        assert resp.status_code == 200, f"{path} rejected an admin: {resp.text}"


async def test_a_guest_cannot_upload(client, app, admin):
    """Guests view and download what's shared with them, never add to the
    library. Enforced server-side, not just by hiding the button."""
    from conftest import register, login, _unique_email

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as c:
        email = _unique_email("guest")
        reg = await register(c, email)
        user_id = reg.json()["user"]["id"]
        await c.put(f"/api/admin/users/{user_id}/approve", json={"is_approved": True},
                    headers=auth(admin["token"]))
        made_guest = await c.put(f"/api/admin/users/{user_id}/guest", json={"is_guest": True},
                                 headers=auth(admin["token"]))
        assert made_guest.status_code == 200, made_guest.text

        token = (await login(c, email)).json()["token"]
        resp = await c.post(
            "/api/assets/upload",
            files={"files": ("nope.png", _png_bytes(), "image/png")},
            headers=auth(token),
        )
        assert resp.status_code == 403, resp.text

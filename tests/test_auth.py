"""Authentication: who gets a token, whose token still works, and what
happens to a token after the session behind it goes away.

The session-revocation cases matter more than they look. get_current_user()
was rewritten to fetch the user and their session in one outer-joined query
instead of two; these lock in that the merge kept the distinct
"session revoked" behaviour rather than silently accepting any signed token
until it expired.
"""
from conftest import auth, login, register, _unique_email


async def test_first_account_is_admin_and_approved(admin, client):
    resp = await client.get("/api/auth/me", headers=auth(admin["token"]))
    assert resp.status_code == 200
    body = resp.json()
    assert body["is_admin"] is True
    assert body["is_approved"] is True


async def test_login_returns_a_working_token(client, member):
    resp = await login(client, member["email"])
    assert resp.status_code == 200
    token = resp.json()["token"]

    me = await client.get("/api/auth/me", headers=auth(token))
    assert me.status_code == 200
    assert me.json()["email"] == member["email"]


async def test_wrong_password_is_rejected(client, member):
    resp = await login(client, member["email"], password="NotThePassword1!")
    assert resp.status_code == 401


async def test_unknown_email_is_rejected(client):
    resp = await login(client, "nobody@test.local")
    assert resp.status_code == 401


async def test_no_token_is_rejected(client):
    assert (await client.get("/api/auth/me")).status_code in (401, 403)


async def test_garbage_token_is_rejected(client):
    resp = await client.get("/api/auth/me", headers=auth("not.a.real.token"))
    assert resp.status_code == 401


async def test_unapproved_account_cannot_log_in(client, admin):
    """Registration succeeds but is not the same as access - a new account
    stays locked out until an admin approves it."""
    email = _unique_email("pending")
    reg = await register(client, email)
    assert reg.status_code == 200
    assert reg.json()["user"]["is_approved"] is False

    resp = await login(client, email)
    assert resp.status_code in (401, 403)


async def test_revoked_session_token_stops_working(client, admin, app):
    """A token whose session row is gone must stop working immediately.
    Without this, "sign out this device" would be cosmetic and a stolen
    token would stay valid until its own expiry."""
    import httpx

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as c:
        email = _unique_email("revoked")
        reg = await register(c, email)
        user_id = reg.json()["user"]["id"]
        await c.put(f"/api/admin/users/{user_id}/approve", json={"is_approved": True},
                    headers=auth(admin["token"]))

        first = (await login(c, email)).json()["token"]
        second = (await login(c, email)).json()["token"]

        # both are live to begin with
        assert (await c.get("/api/auth/me", headers=auth(first))).status_code == 200
        assert (await c.get("/api/auth/me", headers=auth(second))).status_code == 200

        sessions = await c.get("/api/auth/sessions", headers=auth(second))
        assert sessions.status_code == 200
        rows = sessions.json()["sessions"]
        # sign out the one that is NOT the caller's own session
        target = next(s for s in rows if not s.get("is_current"))
        killed = await c.delete(f"/api/auth/sessions/{target['id']}", headers=auth(second))
        assert killed.status_code == 200

        # the surviving session still works, the revoked one does not
        assert (await c.get("/api/auth/me", headers=auth(second))).status_code == 200
        assert (await c.get("/api/auth/me", headers=auth(first))).status_code == 401


async def test_logout_invalidates_the_callers_own_token(client, app, admin):
    import httpx

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as c:
        email = _unique_email("logout")
        reg = await register(c, email)
        user_id = reg.json()["user"]["id"]
        await c.put(f"/api/admin/users/{user_id}/approve", json={"is_approved": True},
                    headers=auth(admin["token"]))
        token = (await login(c, email)).json()["token"]

        assert (await c.get("/api/auth/me", headers=auth(token))).status_code == 200
        assert (await c.post("/api/auth/logout", headers=auth(token))).status_code == 200
        assert (await c.get("/api/auth/me", headers=auth(token))).status_code == 401

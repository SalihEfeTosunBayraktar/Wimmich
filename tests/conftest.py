"""Shared test fixtures.

The two environment variables below MUST be set before anything from the
Wimmich codebase is imported: config.py resolves DATA_DIR and DATABASE_URL
at import time, and a module that has already been imported keeps whatever
it read then. Both are needed, not just the first - config.DB_DIR is
hardcoded to BASE_DIR/"data" regardless of WIMMICH_DATA_DIR, so setting only
WIMMICH_DATA_DIR would point the media folders at a temp directory while
every test wrote to the real production database.
"""
import os
import shutil
import tempfile
from pathlib import Path

_TMP_ROOT = Path(tempfile.mkdtemp(prefix="wimmich-tests-"))
os.environ["WIMMICH_DATA_DIR"] = str(_TMP_ROOT / "data")
os.environ["WIMMICH_DB_URL"] = f"sqlite+aiosqlite:///{(_TMP_ROOT / 'test.db').as_posix()}"
# Stops main.py's lifespan opening a browser tab if a test ever runs it.
os.environ["WIMMICH_SKIP_AUTOOPEN"] = "1"

import httpx  # noqa: E402
import pytest  # noqa: E402

import sys  # noqa: E402

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))


def pytest_sessionfinish(session, exitstatus):
    shutil.rmtree(_TMP_ROOT, ignore_errors=True)


@pytest.fixture(scope="session")
async def app():
    """The real FastAPI app, with the schema created but WITHOUT its
    lifespan. Skipping lifespan is the point: it starts the background job
    worker, shells out to probe FFmpeg (which can trigger a download), and
    starts the memory-video scheduler - none of which any test here needs,
    and all of which make the suite slow and flaky. Tables are created
    directly instead."""
    from database import init_db
    import main

    await init_db()
    return main.app


@pytest.fixture
async def client(app):
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as c:
        yield c


# --- accounts -------------------------------------------------------------
#
# Registration order is significant: the FIRST account ever created on a
# server becomes an admin and is auto-approved, everyone after it needs an
# admin to approve them. These fixtures are session-scoped and ordered so
# that stays true no matter which test file runs first.

_COUNTER = {"n": 0}


def _unique_email(prefix: str) -> str:
    _COUNTER["n"] += 1
    return f"{prefix}{_COUNTER['n']}@test.local"


async def register(client: httpx.AsyncClient, email: str, password: str = "TestPass123!", name: str = "Test User"):
    return await client.post("/api/auth/register", json={"email": email, "password": password, "name": name})


async def login(client: httpx.AsyncClient, email: str, password: str = "TestPass123!"):
    return await client.post("/api/auth/login", json={"email": email, "password": password})


def auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="session")
async def admin(app):
    """The first account on the server, so an admin by definition."""
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as c:
        email = _unique_email("admin")
        resp = await register(c, email)
        assert resp.status_code == 200, resp.text
        body = resp.json()
        assert body["user"]["is_admin"] is True, "first registered account should be admin"
        return {"email": email, "password": "TestPass123!", "token": body["token"], "id": body["user"]["id"]}


@pytest.fixture(scope="session")
async def member(app, admin):
    """A plain approved user. Depends on `admin` so the ordering above holds
    and so there is somebody able to approve this one."""
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as c:
        email = _unique_email("member")
        resp = await register(c, email)
        assert resp.status_code == 200, resp.text
        user_id = resp.json()["user"]["id"]

        approve = await c.put(
            f"/api/admin/users/{user_id}/approve",
            json={"is_approved": True},
            headers=auth(admin["token"]),
        )
        assert approve.status_code == 200, approve.text

        signin = await login(c, email)
        assert signin.status_code == 200, signin.text
        return {"email": email, "password": "TestPass123!", "token": signin.json()["token"], "id": user_id}


@pytest.fixture(scope="session")
async def other_member(app, admin):
    """A second plain user, for the "can A reach B's data?" checks."""
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as c:
        email = _unique_email("other")
        resp = await register(c, email)
        assert resp.status_code == 200, resp.text
        user_id = resp.json()["user"]["id"]
        await c.put(
            f"/api/admin/users/{user_id}/approve",
            json={"is_approved": True},
            headers=auth(admin["token"]),
        )
        signin = await login(c, email)
        assert signin.status_code == 200, signin.text
        return {"email": email, "password": "TestPass123!", "token": signin.json()["token"], "id": user_id}

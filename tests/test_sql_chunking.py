"""SQLite's parameter ceiling.

SQLITE_MAX_VARIABLE_NUMBER is 999 on SQLite older than 3.32 and 32766 after,
and which one you get depends on the SQLite that the running Python happens
to bundle. That is the trap: a dev machine on a newer build never sees the
limit, so an unchunked `.in_(...)` over a few thousand ids passes every
local test and fails on a user's machine with "too many SQL variables".

These tests assert the chunking helpers hold at the LOWER bound regardless
of what this machine's SQLite would actually allow.
"""
import pytest

from utils.sql_utils import MAX_SQL_VARIABLES, chunked


def test_the_limit_is_below_the_oldest_sqlite_ceiling():
    assert MAX_SQL_VARIABLES <= 999, \
        "chunk size must fit the 999-variable ceiling of SQLite < 3.32"


def test_chunked_covers_every_item_exactly_once():
    items = list(range(2500))
    out = [x for chunk in chunked(items) for x in chunk]
    assert out == items


def test_no_chunk_exceeds_the_limit():
    items = list(range(5000))
    assert all(len(chunk) <= MAX_SQL_VARIABLES for chunk in chunked(items))


def test_chunked_handles_an_empty_sequence():
    assert list(chunked([])) == []


def test_chunked_respects_an_explicit_size():
    chunks = list(chunked(list(range(10)), 4))
    assert [len(c) for c in chunks] == [4, 4, 2]


@pytest.mark.skipif(
    not hasattr(__import__("sqlite3").Connection, "setlimit"),
    reason="sqlite3.Connection.setlimit() needs Python 3.11+; without it the "
           "999-variable ceiling cannot be forced, and a test that silently "
           "ran against this machine's own (possibly 32766) limit would prove "
           "nothing. The invariants above still run everywhere.",
)
async def test_a_large_in_clause_survives_the_999_variable_ceiling(app):
    """The real thing, run against a connection forced down to the old
    999-variable limit so this machine's newer SQLite can't hide the bug.

    Without chunking this raises OperationalError: too many SQL variables.
    """
    import sqlite3

    from sqlalchemy import select, func

    from database import AsyncSessionLocal
    from models import Asset
    from utils.sql_utils import select_in_chunks

    ids = [f"id-{i}" for i in range(3000)]

    def _set_limit(dbapi_conn, value):
        # reach past SQLAlchemy's and aiosqlite's wrappers to the real
        # sqlite3.Connection, which is the only object with setlimit()
        inner = getattr(dbapi_conn, "driver_connection", dbapi_conn)
        inner = getattr(inner, "_conn", inner)
        return inner.setlimit(sqlite3.SQLITE_LIMIT_VARIABLE_NUMBER, value)

    async def _clamp(session, value=999):
        raw = await session.connection()
        return await raw.run_sync(
            lambda sync_conn: _set_limit(sync_conn.connection.dbapi_connection, value)
        )

    # Two separate sessions on purpose: the failing statement below
    # invalidates its connection, so the successful half cannot share it.
    previous = None
    async with AsyncSessionLocal() as db:
        previous = await _clamp(db)
        # sanity check - if the clamp were not in force this test would pass
        # for the wrong reason on any machine with a newer SQLite
        with pytest.raises(Exception) as excinfo:
            await db.execute(select(func.count(Asset.id)).where(Asset.id.in_(ids)))
        assert "too many sql variables" in str(excinfo.value).lower()

    async with AsyncSessionLocal() as db:
        await _clamp(db)
        try:
            rows = await select_in_chunks(
                db,
                lambda chunk: select(Asset.id).where(Asset.id.in_(chunk)),
                ids,
            )
            # None of these ids exist; the point is that it ran at all.
            assert rows == []
        finally:
            # The pool hands these connections back out, so put the ceiling
            # back rather than leaving every later test on a 999 limit.
            if previous is not None:
                await _clamp(db, previous)

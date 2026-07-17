"""Wimmich Database Module - SQLAlchemy Async Engine"""
from sqlalchemy import event
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
import config

engine = create_async_engine(
    config.DATABASE_URL,
    echo=False,
    # timeout: how long sqlite3 waits on a locked database before raising
    # "database is locked" - critical now that background jobs run in their
    # own sessions concurrently with web-request sessions.
    connect_args={"check_same_thread": False, "timeout": 30},
)


def _turkish_fold(value):
    """Case-fold for search/ilike matching, overriding SQLite's built-in
    lower() - that one only folds ASCII a-z and leaves accented letters
    (Ö, Ü, Ç, Ş, Ğ) and both Turkish "I"s untouched, while Python's
    str.lower() folds those but turns "İ" into "i" + a combining dot
    instead of plain "i" (confirmed directly: 'İ'.lower() != 'i'), which
    still fails a plain substring search for "izmir". Normalizing both
    Turkish "I" variants to plain ASCII "i" first (not linguistically
    correct Turkish casing, just good enough for "does this look like a
    match") before the regular Unicode lower() fixes both problems -
    verified against ilike("%izmir%") matching both "İzmir" and "Izmir"."""
    if value is None:
        return None
    return value.replace("İ", "i").replace("I", "i").lower()


@event.listens_for(engine.sync_engine, "connect")
def _set_sqlite_pragmas(dbapi_connection, connection_record):
    """WAL lets readers (web requests) proceed while a writer (job) commits;
    the default journal mode blocks them, which froze the UI during jobs."""
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA journal_mode=WAL")
    cursor.execute("PRAGMA busy_timeout=30000")
    cursor.execute("PRAGMA synchronous=NORMAL")
    cursor.close()

    # Every ilike()/func.lower() call in the app (search, duplicate location
    # filter, the person-name merge check) goes through SQL LOWER() under
    # the hood - overriding it here fixes all of them at once instead of
    # patching each call site separately.
    dbapi_connection.create_function("lower", 1, _turkish_fold, deterministic=True)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    pass


async def get_db():
    """Dependency for FastAPI endpoints."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


async def init_db():
    """Create all tables and run automatic migrations."""
    async with engine.begin() as conn:
        from models import Base as ModelBase  # noqa: F811
        await conn.run_sync(ModelBase.metadata.create_all)
        
        # Automatic column migration for is_approved in users table
        from sqlalchemy import text
        try:
            await conn.execute(text("ALTER TABLE users ADD COLUMN is_approved BOOLEAN DEFAULT 0"))
        except Exception:
            pass

        # Ensure all existing admin users are approved
        try:
            await conn.execute(text("UPDATE users SET is_approved = 1 WHERE is_admin = 1"))
        except Exception:
            pass

        # Automatic column migration for backed_up_at in assets table
        try:
            await conn.execute(text("ALTER TABLE assets ADD COLUMN backed_up_at DATETIME"))
        except Exception:
            pass

        # Automatic column migration for dynamic/smart albums
        try:
            await conn.execute(text("ALTER TABLE albums ADD COLUMN is_smart BOOLEAN DEFAULT 0"))
        except Exception:
            pass
        try:
            await conn.execute(text("ALTER TABLE albums ADD COLUMN smart_query VARCHAR(500)"))
        except Exception:
            pass

        # Automatic column migration for giving up on permanently-failing
        # thumbnail generation (e.g. a video with no decodable video stream)
        try:
            await conn.execute(text("ALTER TABLE assets ADD COLUMN thumbnail_failed_at DATETIME"))
        except Exception:
            pass

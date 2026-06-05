# =============================================================================
# ASYNC DATABASE MODULE — app/core/database.py
# =============================================================================
# This replaces the OLD synchronous app/database.py.
#
# WHY ASYNC?
# FastAPI is built on asyncio — it handles thousands of concurrent requests
# by using coroutines (async/await). If we call the database synchronously,
# the entire server freezes while waiting for a DB response (even just 10ms).
# Using AsyncSession + asyncpg driver means each request yields control back
# to FastAPI while waiting for the DB, so other requests can be served.
#
# KEY DESIGN DECISION — expire_on_commit=False:
# In SQLAlchemy, after a commit() the session "expires" all loaded objects,
# meaning their attributes are cleared. The next time you access an attribute
# (e.g., patient.full_name after commit), SQLAlchemy fires another SELECT.
# In ASYNC mode, this lazy reload happens SYNCHRONOUSLY — blocking the event loop.
# Setting expire_on_commit=False prevents this: attributes remain valid after commit.
#
# DATABASE URL FORMAT:
#   PostgreSQL (production):  postgresql+asyncpg://user:password@host:5432/dbname
#   SQLite (local dev):       sqlite+aiosqlite:///./dev.db
#   SQLite (tests):           sqlite+aiosqlite:///:memory:
# =============================================================================

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings

# ── URL NORMALIZATION ─────────────────────────────────────────────────────────
# SQLAlchemy's asyncio extension requires an async driver.
# The .env often contains postgresql:// (psycopg2 sync) or postgres:// (Heroku/Neon).
# We rewrite these to postgresql+asyncpg:// automatically so developers don't need
# to remember the asyncpg prefix in their local .env.
# sqlite+aiosqlite:// and postgresql+asyncpg:// pass through unchanged.
_async_url = settings.DATABASE_URL
if _async_url.startswith("postgres://"):
    # postgres:// is a shorthand used by Heroku and Neon — upgrade it
    _async_url = _async_url.replace("postgres://", "postgresql+asyncpg://", 1)
elif _async_url.startswith("postgresql://"):
    # postgresql:// loads psycopg2 (sync) — replace with asyncpg (async)
    _async_url = _async_url.replace("postgresql://", "postgresql+asyncpg://", 1)

# create_async_engine connects to the database.
# echo=True prints every SQL query to the console — useful for debugging in dev,
# but noisy and slow in production, so we disable it based on ENV.
# pool_pre_ping=True sends a lightweight "SELECT 1" before each connection is used,
# automatically recovering from stale connections (e.g., after DB restart).
engine = create_async_engine(
    _async_url,
    echo=(settings.ENV == "development"),
    pool_pre_ping=True,
)

# async_sessionmaker is the factory that creates AsyncSession instances.
# Think of it like a template: "every session created from this factory
# will be bound to our engine, with expire_on_commit disabled".
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    # See docstring above for why this is False
    expire_on_commit=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency that provides an AsyncSession for each request.

    Usage in an endpoint:
        @router.get("/patients")
        async def list_patients(db: AsyncSession = Depends(get_db)):
            ...

    How the transaction works:
        1. A new session is opened for the request
        2. The endpoint runs (uses the session for queries)
        3. If the endpoint returns successfully → session.commit() is called
        4. If any exception occurs → session.rollback() is called automatically
        5. The session is always closed at the end (via `async with`)

    WHY centralize commit/rollback here?
    If every endpoint calls db.commit() individually, forgetting one leaves
    an uncommitted transaction open. By committing in this single function,
    all endpoints automatically get correct transaction behavior.

    WHY flush() in repositories?
    Repositories call db.flush() (not db.commit()) to make inserts visible
    within the same transaction (e.g., to get back the generated UUID) without
    actually committing. The commit only happens here, at the end of the request.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise

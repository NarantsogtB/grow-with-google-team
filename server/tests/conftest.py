# =============================================================================
# TEST CONFIGURATION — tests/conftest.py
# =============================================================================
# pytest fixtures shared across ALL test files.
#
# WHY REWRITE THIS FILE?
# The old conftest:
#   1. Used SYNCHRONOUS SQLAlchemy (incompatible with the new async endpoints)
#   2. Required a real PostgreSQL server running on localhost
#   3. Each test left state from previous tests (potential pollution)
#
# The new conftest:
#   1. Uses ASYNC SQLAlchemy with SQLite in-memory
#   2. Requires NO external database — works in CI/CD with zero setup
#   3. Each test gets a completely fresh empty database (scope="function")
#   4. Uses httpx.AsyncClient for async HTTP testing
#
# HOW FIXTURE SCOPE WORKS:
#   scope="function"  → fixture created/destroyed for EACH test function
#   scope="module"    → fixture created/destroyed once per test file
#   scope="session"   → fixture created/destroyed once for all tests
# We use "function" scope for DB to ensure test isolation.
#
# DEPENDENCY OVERRIDE PATTERN:
# FastAPI's dependency_overrides allows injecting test fixtures into the app.
# Instead of the real get_db (which connects to PostgreSQL), we inject
# a version that uses our in-memory SQLite test session. The app code
# runs unchanged — it doesn't know it's talking to SQLite instead of Postgres.
# =============================================================================

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

# Import all model classes to register them in Base.metadata before create_all
import app.models.doctor    # noqa: F401
import app.models.hospital  # noqa: F401
import app.models.patient   # noqa: F401
import app.models.schedule  # noqa: F401
from app.core.database import get_db
from app.main import app
from app.models.base import Base

# SQLite in-memory database:
# ":memory:" means the DB lives in RAM — created on first use, gone after tests.
# No files created, no cleanup needed.
# "sqlite+aiosqlite://" = async SQLite driver (requires aiosqlite package)
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest_asyncio.fixture(scope="function")
async def db_session() -> AsyncSession:
    """
    Create a fresh async in-memory database for each test.

    Lifecycle:
    1. Create async SQLite engine
    2. Create all tables (doctors, hospitals, patients, etc.)
    3. Yield the session (test runs here)
    4. Drop all tables and dispose engine (cleanup)

    The `async with engine.begin()` block ensures the CREATE TABLE/DROP TABLE
    statements are in their own committed transaction, separate from test data.
    """
    engine = create_async_engine(
        TEST_DATABASE_URL,
        echo=False,  # Set to True to see SQL in test output (useful for debugging)
        # SQLite requires this flag when used with multiple async tasks
        connect_args={"check_same_thread": False},
    )

    # Create all tables defined in Base.metadata
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Create the async session factory
    AsyncTestSessionLocal = async_sessionmaker(
        bind=engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )

    async with AsyncTestSessionLocal() as session:
        yield session

    # Cleanup: drop all tables after the test
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

    await engine.dispose()


@pytest_asyncio.fixture(scope="function")
async def client(db_session: AsyncSession) -> AsyncClient:
    """
    Async HTTP test client that uses the test database session.

    How it works:
    1. We override the get_db dependency to inject our test session
    2. AsyncClient with ASGITransport talks to the ASGI app directly
       (no HTTP server needed — no port binding, no network)
    3. After the test, we clear all dependency overrides

    Usage in tests:
        async def test_something(client):
            response = await client.post("/api/v1/patients/", json={...})
            assert response.status_code == 201
    """
    # Override the database dependency with our test session
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    # ASGITransport bypasses the HTTP layer — requests go directly into FastAPI
    # This is much faster and more reliable than a real HTTP server
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as ac:
        yield ac

    # Always clean up dependency overrides after each test
    app.dependency_overrides.clear()

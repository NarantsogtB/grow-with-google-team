# =============================================================================
# BASE REPOSITORY — app/repositories/base.py
# =============================================================================
# Generic async CRUD operations that all domain repositories inherit from.
#
# WHY THE REPOSITORY PATTERN?
# Without it, every endpoint would directly query the database:
#   patient = await db.execute(select(Patient).where(Patient.id == id))
# If the query logic needs to change (e.g., add soft-delete filtering), you'd
# need to update every endpoint. The repository centralizes all DB access so:
#   - Endpoints call repository methods (don't know about SQL)
#   - Repository methods contain SQL (don't know about HTTP)
#   - Tests can mock the repository to test endpoints without a DB
#
# WHY flush() INSTEAD OF commit()?
# The `get_db` dependency in api/deps.py handles the final commit/rollback.
# Repository methods only flush() to make their changes visible within the
# current transaction (so we can read back generated IDs). This lets a single
# service method call multiple repository methods and commit them all atomically.
#
# Example:
#   async with get_db() as db:               # ← opens transaction
#       patient = await repo.create(data)    # ← flush (not committed yet)
#       schedule = await sched_repo.create() # ← flush (not committed yet)
#   # ← transaction committed HERE (or rolled back if either step failed)
# =============================================================================

from typing import Generic, List, Optional, Tuple, Type, TypeVar

from app.models.base import Base
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

# TypeVar bound to Base means ModelType can be any SQLAlchemy model class
ModelType = TypeVar("ModelType", bound=Base)


class BaseRepository(Generic[ModelType]):
    """
    Generic async repository with CRUD operations.

    Usage (extend for each model):
        class PatientRepository(BaseRepository[Patient]):
            def __init__(self, db: AsyncSession):
                super().__init__(Patient, db)

            # Add domain-specific methods here:
            async def get_by_phone(self, phone: str) -> Patient | None:
                ...
    """

    def __init__(self, model: Type[ModelType], db: AsyncSession) -> None:
        self.model = model
        self.db = db

    async def get_by_id(self, id) -> Optional[ModelType]:
        """Fetch a single record by primary key. Returns None if not found."""
        result = await self.db.execute(select(self.model).where(self.model.id == id))
        return result.scalar_one_or_none()

    async def get_all(self, page: int = 1, size: int = 10) -> Tuple[List[ModelType], int]:
        """
        Fetch a paginated list and the total count.

        Returns (items, total) tuple.
        Why count separately? Because COUNT(*) is much faster than loading
        all rows and calling len() — especially with millions of records.
        """
        offset = (page - 1) * size

        # Efficient count: SELECT COUNT(*) FROM table
        count_result = await self.db.execute(select(func.count()).select_from(self.model))
        total = count_result.scalar()

        # Paginated data fetch
        result = await self.db.execute(select(self.model).offset(offset).limit(size))
        items = list(result.scalars().all())

        return items, total

    async def create(self, obj: ModelType) -> ModelType:
        """
        Add a new record to the session and flush to get the generated ID.

        Note: flush() makes the INSERT visible within this transaction but
        does NOT commit. The calling endpoint's get_db() handles the commit.
        """
        self.db.add(obj)
        await self.db.flush()  # execute INSERT, get back generated UUID
        await self.db.refresh(obj)  # reload the object with DB-generated values
        return obj

    async def delete(self, obj: ModelType) -> None:
        """Mark a record for deletion and flush within the current transaction."""
        await self.db.delete(obj)
        await self.db.flush()

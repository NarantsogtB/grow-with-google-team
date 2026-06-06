"""
In-process scheduler for one-shot Telegram notification jobs.

Used by the admin's "schedule a reminder at a specific time" UI so we don't
have to wait for the default 08:00 / 18:00 Ulaanbaatar daily ticks during
hackathon demos.

The state lives in this module's globals — if the FastAPI process restarts,
every queued job is lost. That's acceptable for the demo use case where a
job's lifetime is measured in minutes; persistent scheduling would require a
DB-backed queue we don't want to build right now.
"""

from __future__ import annotations

import asyncio
import logging
import uuid
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Awaitable, Callable, Dict, List, Optional

logger = logging.getLogger(__name__)


@dataclass
class ScheduledJob:
    id: str
    label: str
    fire_at: datetime  # always timezone-aware UTC
    task: asyncio.Task


_jobs: Dict[str, ScheduledJob] = {}


def _to_utc(dt: datetime) -> datetime:
    """Coerce a datetime to timezone-aware UTC. Naive inputs are treated as UTC."""
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def schedule(
    fire_at: datetime,
    label: str,
    callback: Callable[[], Awaitable[None]],
) -> ScheduledJob:
    """Queue an async callback to run at `fire_at` (timezone-aware datetime)."""
    fire_at_utc = _to_utc(fire_at)
    job_id = uuid.uuid4().hex[:12]

    async def _runner() -> None:
        delay = (fire_at_utc - datetime.now(timezone.utc)).total_seconds()
        if delay > 0:
            try:
                await asyncio.sleep(delay)
            except asyncio.CancelledError:
                logger.info("Scheduled job %s (%s) cancelled before firing", job_id, label)
                _jobs.pop(job_id, None)
                raise
        try:
            await callback()
            logger.info("Scheduled job %s (%s) fired successfully", job_id, label)
        except Exception:
            logger.exception("Scheduled job %s (%s) failed during execution", job_id, label)
        finally:
            _jobs.pop(job_id, None)

    task = asyncio.create_task(_runner(), name=f"scheduled-{label}-{job_id}")
    job = ScheduledJob(id=job_id, label=label, fire_at=fire_at_utc, task=task)
    _jobs[job_id] = job
    logger.info("Scheduled job %s (%s) at %s", job_id, label, fire_at_utc.isoformat())
    return job


def list_jobs() -> List[ScheduledJob]:
    """Pending jobs ordered by fire_at."""
    return sorted(_jobs.values(), key=lambda j: j.fire_at)


def cancel(job_id: str) -> Optional[ScheduledJob]:
    job = _jobs.get(job_id)
    if not job:
        return None
    job.task.cancel()
    _jobs.pop(job_id, None)
    return job

# What Claude (AI Assistant) Did in FamilyDoc-AI

## Project
FamilyDoc-AI — Home-visit AI assistant for Mongolian family doctors. Automates schedule management, route optimization, and SOAP medical note generation.

---

## 1. Enterprise Architecture Refactor

Restructured `server/app/` from a monolithic layout into a clean, layered architecture:

```
server/app/
├── core/           config.py, database.py (AsyncSession), security.py (JWT/bcrypt)
├── api/
│   ├── deps.py     get_db, get_current_patient dependencies
│   └── v1/         endpoints/ (patients, doctors, hospitals, schedules, agent), router.py
├── models/         base.py (DeclarativeBase), enums.py, patient.py, doctor.py, hospital.py, schedule.py
├── schemas/        common.py (PaginatedResponse[T]), patient.py, doctor.py, hospital.py, schedule.py
├── repositories/   base.py (BaseRepository[T] with flush not commit), patient/doctor/hospital/schedule repos
├── services/       patient_service.py, schedule_service.py
├── agents/         orchestrator.py, soap_agent.py, schedule_agent.py
└── tools/          route_tools.py, schedule_tools.py
```

**Key architectural decisions:**
- `AsyncSession` throughout (SQLAlchemy 2.x async)
- Single `Base = declarative_base()` in `models/base.py`, re-exported by `database.py`
- Repositories use `flush()` not `commit()` — `get_db()` auto-commits at session close
- Pydantic V2 with `model_config = ConfigDict(from_attributes=True)` on all schemas
- New versioned routes at `/api/v1/`; legacy routes preserved for frontend compatibility

---

## 2. AI Agent System (LangGraph + Google Gemini)

Built the full multi-agent orchestration layer:

### `agents/orchestrator.py`
LangGraph `StateGraph` that classifies doctor input and routes to the correct branch:
- `schedule_update` → calls `reorder_schedule_tool` (zero LLM tokens)
- `route_optimize` → calls `calculate_shortest_route_tool` (zero LLM tokens)
- `soap_note` → calls Gemini SOAP agent (~500–800 tokens)
- `general` → simple Gemini response (~100–200 tokens)

### `agents/soap_agent.py`
Converts raw Speech-to-Text dictation into structured SOAP medical notes (Subjective / Objective / Assessment / Plan). Uses few-shot prompting to handle mixed Mongolian, English, and Latin medical jargon.

### `agents/schedule_agent.py`
Parses Telegram bot webhook replies to detect patient availability (available / unavailable / reschedule request).

### `tools/route_tools.py`
Zero-token deterministic routing:
1. Converts What3Words addresses → lat/lng via W3W API
2. Applies Haversine formula between all patient locations
3. Runs lightweight TSP to return the optimal visit order

### `tools/schedule_tools.py`
`reorder_schedule_tool` — shifts schedules when a patient is unavailable. Pure DB operation via `AsyncSession`; no LLM involved.

---

## 3. Bug Fixes

| # | Bug | Fix |
|---|-----|-----|
| 1 | Duplicate `create_doctor_weekly_schedule` function in old controller | Removed first definition |
| 2 | Mock JWT `"mock_jwt_token_for_{id}"` being returned as auth token | Replaced with real python-jose JWT signing |
| 3 | Unbounded `GET /patients` returning all rows | Added paginated response with `page`/`size` params |
| 4 | Pydantic V1 `class Config` on all schemas | Migrated to V2 `model_config = ConfigDict()` |
| 5 | Old `models.py` Patient class (Integer PK) conflicting with new Patient (UUID PK) | Removed old model entirely |

---

## 4. Testing Infrastructure

- `server/pytest.ini` — `asyncio_mode = auto` for seamless async test coroutines
- `server/tests/conftest.py` — async SQLite in-memory DB fixtures (no external DB needed for tests)
- `DATABASE_URL=sqlite+aiosqlite:///:memory:` used in test environment
- W3W API and Google Gemini API mocked with `pytest-mock` to keep tests fast and offline

---

## 5. CI/CD Pipeline

`.github/workflows/ci-cd.yml` — full automated pipeline:
1. **Lint** — code style checks
2. **Test** — pytest with in-memory SQLite
3. **Build** — Docker image (`server/Dockerfile` with layer caching via requirements.txt)
4. **Deploy** — SSH to GCP VM

Required GitHub Secrets: `GCP_VM_HOST`, `GCP_VM_USER`, `GCP_SSH_PRIVATE_KEY`, `DATABASE_URL`, `JWT_SECRET`, `GOOGLE_API_KEY`, `WHAT3WORDS_API_KEY`, `TELEGRAM_BOT_TOKEN`

---

## 6. New Dependencies Added

Added to `server/requirements.txt`:

| Package | Version | Purpose |
|---------|---------|---------|
| `asyncpg` | 0.30.0 | Async PostgreSQL driver |
| `aiosqlite` | 0.20.0 | Async SQLite for tests |
| `pytest-asyncio` | 0.24.0 | Async test support |
| `pytest-mock` | 3.14.0 | Mock W3W/Gemini APIs in tests |

---

## Summary

Claude rebuilt the backend from a working-but-fragile prototype into a production-grade layered architecture, implemented the entire AI agent system (LangGraph orchestrator + SOAP + schedule agents + deterministic route/schedule tools), fixed 5 bugs, set up pytest with async SQLite fixtures, and wired up a full CI/CD pipeline to GCP.

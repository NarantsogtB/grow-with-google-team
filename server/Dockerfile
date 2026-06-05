# =============================================================================
# DOCKERFILE — server/Dockerfile
# =============================================================================
# Multi-step build for the FamilyDoc-AI backend.
#
# HOW DOCKER LAYERS WORK (IMPORTANT FOR BUILD SPEED):
# Docker caches each instruction as a "layer". If a layer's input hasn't
# changed since the last build, Docker reuses the cached version.
#
# CRITICAL OPTIMIZATION: Copy requirements.txt BEFORE copying app code.
# Why? Because requirements.txt changes rarely (only when adding packages),
# but app code changes on every commit. If we copied code first, Docker would
# re-install ALL packages on every build (5-10 minutes each time).
# By copying requirements.txt first:
#   - Layer 1 (base image): cached until Python version changes
#   - Layer 2 (pip install): cached until requirements.txt changes
#   - Layer 3 (app code): always rebuilt (cheap — just file copy)
#
# RESULT: Incremental builds take ~30 seconds instead of ~10 minutes.
# =============================================================================

# ── BASE IMAGE ─────────────────────────────────────────────────────────────────
# python:3.13-slim = Python 3.13 on Debian slim (small base, fewer CVEs)
# Avoid python:3.13-alpine for production — Alpine uses musl libc which
# causes issues with some Python packages (especially asyncpg, bcrypt)
FROM python:3.13-slim

# ── WORK DIRECTORY ─────────────────────────────────────────────────────────────
# All subsequent commands run from /server inside the container
WORKDIR /server

# ── SYSTEM DEPENDENCIES ────────────────────────────────────────────────────────
# Install system packages needed by Python packages:
#   libpq-dev: required by psycopg2 (PostgreSQL driver)
#   gcc: required to compile some Python C extensions
# We clean apt cache to keep the image small
RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# ── PYTHON DEPENDENCIES ────────────────────────────────────────────────────────
# IMPORTANT: Copy requirements.txt FIRST (before app code)
# This is the Docker layer caching optimization described above
COPY requirements.txt .

# --no-cache-dir: don't cache downloaded packages (saves ~50MB in image)
# --upgrade pip: ensure we use a modern pip version
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# ── APPLICATION CODE ───────────────────────────────────────────────────────────
# Now copy the application code (this layer rebuilds on every code change)
COPY app/ ./app/
COPY alembic/ ./alembic/
COPY alembic.ini .

# ── STARTUP COMMAND ────────────────────────────────────────────────────────────
# 1. Run Alembic migrations first (ensures DB schema is up to date)
# 2. Start uvicorn on port 8000, bound to all interfaces (0.0.0.0)
#    --host 0.0.0.0 is required to accept connections from outside the container
#
# WHY NOT --reload IN PRODUCTION?
# --reload watches for file changes (good in development, dangerous in production).
# It adds overhead and can restart the server mid-request on high-traffic systems.
CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000"]

# ── METADATA ──────────────────────────────────────────────────────────────────
EXPOSE 8000
LABEL maintainer="FamilyDoc-AI Team"
LABEL description="Family Medical AI API — Home Visit Optimization for Mongolian Family Doctors"

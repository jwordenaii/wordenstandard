#!/usr/bin/env bash

# railway_start.sh ? Railway deploy entry-point.

#

# Runs every time Railway starts or restarts the service:

#   1. Applies any pending Alembic migrations (alembic upgrade head).

#   2. Starts Gunicorn with UvicornWorker bound to Railway's $PORT.

#

# Railway Start Command (set in Railway dashboard ? Service ? Settings):

#   bash scripts/railway_start.sh

#

# Required Railway environment variables:

#   DATABASE_URL              PostgreSQL connection string (auto-set by Railway Postgres plugin)

#   PORT                      TCP port to listen on (auto-set by Railway)

#   SENTRY_DSN                Sentry DSN for error + performance tracking

#   SENTRY_ENVIRONMENT        e.g. production

#   SENTRY_TRACES_SAMPLE_RATE Float 0.0?1.0; recommended 0.1 for production

#

# Optional Railway environment variables:

#   SENTRY_RELEASE            Git SHA or version tag; defaults to RAILWAY_GIT_COMMIT_SHA

#   WEB_CONCURRENCY           Number of Gunicorn workers (default: 2)



set -euo pipefail



# ?? Step 1: Run Alembic migrations ???????????????????????????????????????????

echo "[railway_start] Running Alembic migrations..."

alembic upgrade head

echo "[railway_start] Migrations complete."



# ?? Step 2: Start Gunicorn with UvicornWorker ?????????????????????????????????

_PORT="${PORT:-8000}"

echo "[railway_start] Starting Gunicorn on 0.0.0.0:${_PORT}..."

exec gunicorn \

  -k uvicorn.workers.UvicornWorker \

  -b "0.0.0.0:${_PORT}" \

  --config gunicorn.conf.py \

  app.main:app

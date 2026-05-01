"""Gunicorn production configuration for the JWordenAI FastAPI backend.

Usage:
    gunicorn app.main:app --config gunicorn.conf.py

Uvicorn worker class bridges Gunicorn's process management with ASGI.
"""

import multiprocessing
import os

# ── Server socket ─────────────────────────────────────────────────────────────
# Honour the platform-injected ``PORT`` env var (Railway, Render, Heroku, Fly,
# Cloud Run all set this).  Falls back to 8000 for local development and the
# Dockerfile's documented EXPOSE.  Without this, Railway's health check hits
# the wrong port and marks the deploy as failed even though the container is
# running.
_port = os.getenv("PORT", "8000").strip() or "8000"
bind = f"0.0.0.0:{_port}"

# ── Workers ───────────────────────────────────────────────────────────────────
# Formula: (2 × CPU count) + 1 is a common starting point for I/O-bound apps.
# Honour the standard ``WEB_CONCURRENCY`` env var so operators can cap the
# worker count on small / managed instances. This matters because each worker
# opens its own SQLAlchemy connection pool (DB_POOL_SIZE), and the product
# of (workers × pool_size) can quickly exhaust managed Postgres connection
# limits on platforms like Railway / Render.
_default_workers = multiprocessing.cpu_count() * 2 + 1
try:
    workers = int(os.getenv("WEB_CONCURRENCY", "").strip() or _default_workers)
except ValueError:
    workers = _default_workers
if workers < 1:
    workers = 1
worker_class = "uvicorn.workers.UvicornWorker"
worker_connections = 1000
threads = 1

# ── Timeouts ──────────────────────────────────────────────────────────────────
timeout = 120          # seconds before a worker is killed and restarted
graceful_timeout = 30  # seconds to finish in-flight requests on shutdown
keepalive = 5          # seconds to wait for the next request on a keep-alive connection

# ── Restart workers periodically to prevent memory leaks ─────────────────────
max_requests = 1000
max_requests_jitter = 100

# ── Logging ───────────────────────────────────────────────────────────────────
accesslog = "-"   # stdout
errorlog = "-"    # stderr
loglevel = "info"
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)s'

# ── Performance ───────────────────────────────────────────────────────────────
preload_app = True   # load app code before forking workers (saves memory via CoW)

"""
Shared SlowAPI rate limiter instance.

Import this in app/main.py to attach to the FastAPI app state, and
in individual routers to apply per-endpoint limits via @limiter.limit().
"""
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address, default_limits=["200/minute"])

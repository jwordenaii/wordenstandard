"""
SQLAlchemy database engine and session factory.

Supports:
  - PostgreSQL in production (set DATABASE_URL to a postgres:// or postgresql:// URI)
  - SQLite as a zero-config fallback for local development

Usage in routers:
    from ..database import get_db
    def my_endpoint(db: Session = Depends(get_db)):
        ...
"""

import os
import logging

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

logger = logging.getLogger(__name__)

_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./jworden_leads.db")

# SQLAlchemy requires 'postgresql://' for psycopg2, but Railway/Heroku
# provide 'postgres://' — normalise transparently.
if _DATABASE_URL.startswith("postgres://"):
    _DATABASE_URL = _DATABASE_URL.replace("postgres://", "postgresql://", 1)

_connect_args = {"check_same_thread": False} if _DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    _DATABASE_URL,
    connect_args=_connect_args,
    pool_pre_ping=True,
    echo=False,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """FastAPI dependency that yields a SQLAlchemy session and guarantees close."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_all_tables() -> None:
    """Create all tables that don't yet exist.  Called once at startup."""
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables verified/created (url=%s)", _DATABASE_URL.split("@")[-1])
    except Exception as exc:  # noqa: BLE001
        logger.error("Could not create database tables: %s", exc)

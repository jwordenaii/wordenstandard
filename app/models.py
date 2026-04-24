"""
SQLAlchemy ORM models for J. Worden & Sons lead persistence.

Tables created automatically by create_all_tables() on startup.
All timestamps are stored in UTC.
"""

from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Float, Integer, String, Text, UniqueConstraint

from .database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Lead(Base):
    """A quote request submitted via the multi-step quote form."""

    __tablename__ = "leads"

    id              = Column(Integer, primary_key=True, index=True)
    name            = Column(String(120), nullable=False)
    email           = Column(String(254), nullable=False, index=True)
    phone           = Column(String(30), nullable=False)
    service_type    = Column(String(60), nullable=False)
    property_type   = Column(String(30), nullable=False)
    urgency         = Column(String(30), nullable=False)
    project_size_sqft = Column(Float, nullable=True)
    address         = Column(String(300), nullable=True)
    message         = Column(Text, nullable=True)

    # Lead scoring
    score_value     = Column(Integer, nullable=True)
    score_label     = Column(String(10), nullable=True)   # HOT | WARM | COOL
    score_priority  = Column(Integer, nullable=True)

    created_at      = Column(DateTime(timezone=True), default=_utcnow, nullable=False)

    def __repr__(self) -> str:
        return f"<Lead id={self.id} name={self.name!r} label={self.score_label!r}>"


class ContactMessage(Base):
    """A general contact form submission."""

    __tablename__ = "contact_messages"

    id         = Column(Integer, primary_key=True, index=True)
    name       = Column(String(120), nullable=False)
    email      = Column(String(254), nullable=False, index=True)
    phone      = Column(String(30), nullable=True)
    message    = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=_utcnow, nullable=False)

    def __repr__(self) -> str:
        return f"<ContactMessage id={self.id} name={self.name!r}>"


class PageContent(Base):
    """
    CMS content blocks managed through the admin dashboard (webpage maker).

    Each block has a unique ``key`` (e.g. "hero", "services_intro") and stores
    a ``title``, a rich ``body`` (HTML or Markdown), and an optional JSON blob
    in ``meta_json`` for extra structured data (colours, CTAs, etc.).
    The frontend fetches blocks via the public /api/v1/content endpoints.
    """

    __tablename__ = "page_contents"
    __table_args__ = (UniqueConstraint("key", name="uq_page_contents_key"),)

    id         = Column(Integer, primary_key=True, index=True)
    key        = Column(String(100), nullable=False, index=True)
    title      = Column(String(200), nullable=False)
    body       = Column(Text, nullable=False, default="")
    meta_json  = Column(Text, nullable=True)   # optional JSON for extra fields
    updated_at = Column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow, nullable=False)
    created_at = Column(DateTime(timezone=True), default=_utcnow, nullable=False)

    def __repr__(self) -> str:
        return f"<PageContent key={self.key!r} title={self.title!r}>"

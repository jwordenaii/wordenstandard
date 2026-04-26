"""
SQLAlchemy ORM models for J. Worden & Sons lead persistence.

Tables created automatically by create_all_tables() on startup.
All timestamps are stored in UTC.

New models added for enterprise features:
  - ChatSession          : multi-turn conversation memory
  - AICorrection         : human-review learning loop
  - FollowUpTask         : automated follow-up sequences
  - LienCalendarEntry    : mechanics lien deadline tracker
  - SubcontractorRoster  : insurance/bond compliance monitor
  - Tenant               : white-label multi-tenant support
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

    # Pipeline CRM stage tracking (Feature 3)
    pipeline_stage    = Column(String(30), default='new', nullable=False)
    contacted_at      = Column(DateTime(timezone=True), nullable=True)
    proposal_sent_at  = Column(DateTime(timezone=True), nullable=True)
    closed_at         = Column(DateTime(timezone=True), nullable=True)
    closed_reason     = Column(String(100), nullable=True)

    # Multi-tenant (Feature 15)
    tenant_id       = Column(String(60), nullable=True, index=True, default='default')

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
    # Multi-tenant (Feature 15)
    tenant_id       = Column(String(60), nullable=True, index=True, default='default')

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


# ══════════════════════════════════════════════════════════════════════════════
# Customer Intelligence Platform
# Ready to receive imported data from Mr. Worden's existing customer databases.
# ══════════════════════════════════════════════════════════════════════════════

class Customer(Base):
    """
    Unified customer record.  Supports manual entry and bulk import
    (CSV / JSON) from existing customer databases.

    All fields are nullable where data may not exist in legacy imports.
    The ``external_id`` field links back to any source system record.
    """
    __tablename__ = "customers"

    id              = Column(Integer, primary_key=True, index=True)
    external_id     = Column(String(100), nullable=True, index=True)   # source DB key
    source          = Column(String(60),  nullable=True)               # 'import_csv' | 'manual' | 'quote_form'

    # Core identity
    name            = Column(String(120), nullable=False)
    email           = Column(String(254), nullable=True, index=True)
    phone           = Column(String(30),  nullable=True)
    company         = Column(String(120), nullable=True)               # for commercial/franchise clients

    # Location
    address         = Column(String(300), nullable=True)
    city            = Column(String(100), nullable=True)
    state_code      = Column(String(2),   nullable=True, index=True)   # 2-letter abbr
    zip_code        = Column(String(10),  nullable=True)

    # Segment
    customer_type   = Column(String(30),  nullable=True)               # 'residential' | 'commercial' | 'franchise' | 'qsr'
    is_franchise    = Column(Integer, default=0, nullable=False)       # 1 = franchise/QSR account
    brand           = Column(String(60),  nullable=True)               # e.g. 'KFC', 'Taco Bell'

    # Lifetime value tracking
    total_jobs      = Column(Integer, default=0, nullable=False)
    total_revenue   = Column(Float,   default=0.0, nullable=False)
    last_job_date   = Column(DateTime(timezone=True), nullable=True)

    # AI-assisted fields
    predicted_next_service_date = Column(DateTime(timezone=True), nullable=True)
    ltv_score       = Column(Float, nullable=True)                     # lifetime value score 0-100
    churn_risk      = Column(String(10), nullable=True)                # LOW | MEDIUM | HIGH

    # Notes
    notes           = Column(Text, nullable=True)
    tags            = Column(String(500), nullable=True)               # comma-separated tags

    # Multi-tenant (Feature 15)
    tenant_id       = Column(String(60), nullable=True, index=True, default='default')

    created_at      = Column(DateTime(timezone=True), default=_utcnow, nullable=False)
    updated_at      = Column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow, nullable=False)

    def __repr__(self) -> str:
        return f"<Customer id={self.id} name={self.name!r} type={self.customer_type!r}>"


class ServiceHistory(Base):
    """
    Individual service job linked to a Customer.
    Supports import from existing records or creation from new leads.
    """
    __tablename__ = "service_history"

    id              = Column(Integer, primary_key=True, index=True)
    customer_id     = Column(Integer, nullable=True, index=True)       # FK to Customer.id
    lead_id         = Column(Integer, nullable=True, index=True)       # FK to Lead.id

    # Job details
    job_date        = Column(DateTime(timezone=True), nullable=True)
    service_type    = Column(String(60),  nullable=True)               # paving | sealcoating | etc.
    scope_summary   = Column(Text,        nullable=True)
    location        = Column(String(300), nullable=True)
    state_code      = Column(String(2),   nullable=True, index=True)
    sqft            = Column(Float,       nullable=True)
    revenue         = Column(Float,       nullable=True)
    is_qsr          = Column(Integer, default=0, nullable=False)       # 1 = QSR / franchise job
    brand           = Column(String(60),  nullable=True)               # KFC, Taco Bell, etc.

    # Quality / outcome
    warranty_callback = Column(Integer, default=0, nullable=False)     # 1 = had warranty callback
    gc_score        = Column(Float,   nullable=True)                   # GC / client satisfaction 0-5
    notes           = Column(Text,    nullable=True)

    # Documentation
    has_photos      = Column(Integer, default=0, nullable=False)       # 1 = photos on file
    dropbox_url     = Column(String(500), nullable=True)
    photos_url      = Column(String(500), nullable=True)

    # Multi-tenant (Feature 15)
    tenant_id         = Column(String(60), nullable=True, index=True, default='default')

    created_at      = Column(DateTime(timezone=True), default=_utcnow, nullable=False)

    def __repr__(self) -> str:
        return f"<ServiceHistory id={self.id} customer_id={self.customer_id} date={self.job_date}>"


class HumanReviewQueue(Base):
    """
    AI decisions flagged for human review when confidence < threshold.

    When an AI response has confidence below HUMAN_REVIEW_THRESHOLD
    (default 0.75), it is saved here for Mr. Worden or an admin to
    approve, reject, or correct before the answer is finalized.

    Status lifecycle: pending → approved | rejected
    """
    __tablename__ = "human_review_queue"

    id              = Column(Integer, primary_key=True, index=True)
    decision_type   = Column(String(60),  nullable=False)              # 'chat' | 'photo_inspect' | 'compliance' | 'lead_score'
    input_summary   = Column(Text,        nullable=False)              # truncated input for context
    ai_answer       = Column(Text,        nullable=False)              # the AI's proposed answer
    ai_engine       = Column(String(60),  nullable=True)               # 'gpt-4o' | 'gpt-4o-mini' | 'stub'
    confidence      = Column(Float,       nullable=False)              # 0.0 – 1.0
    status          = Column(String(20),  default='pending', nullable=False)  # pending | approved | rejected
    reviewer_notes  = Column(Text,        nullable=True)               # human reviewer's notes
    corrected_answer= Column(Text,        nullable=True)               # optional corrected response

    created_at      = Column(DateTime(timezone=True), default=_utcnow, nullable=False)
    reviewed_at     = Column(DateTime(timezone=True), nullable=True)

    # Multi-tenant (Feature 15)
    tenant_id       = Column(String(60), nullable=True, index=True, default='default')

    def __repr__(self) -> str:
        return f"<HumanReviewQueue id={self.id} type={self.decision_type!r} confidence={self.confidence:.2f} status={self.status!r}>"


# ══════════════════════════════════════════════════════════════════════════════
# Feature 1: Conversation Memory (Multi-Turn Context)
# ══════════════════════════════════════════════════════════════════════════════

class ChatSession(Base):
    """
    Persistent multi-turn chat session.  Stores conversation history as JSON.
    Used when Redis is unavailable (fallback to DB).
    """
    __tablename__ = "chat_sessions"

    id             = Column(Integer, primary_key=True, index=True)
    session_id     = Column(String(100), nullable=False, index=True, unique=True)
    messages_json  = Column(Text, nullable=False, default="[]")
    customer_name  = Column(String(120), nullable=True)
    customer_email = Column(String(254), nullable=True)
    state_code     = Column(String(2), nullable=True)
    last_service   = Column(String(60), nullable=True)
    # Multi-tenant (Feature 15)
    tenant_id      = Column(String(60), nullable=True, index=True, default='default')
    created_at     = Column(DateTime(timezone=True), default=_utcnow, nullable=False)
    updated_at     = Column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow, nullable=False)

    def __repr__(self) -> str:
        return f"<ChatSession session_id={self.session_id!r}>"


# ══════════════════════════════════════════════════════════════════════════════
# Feature 2: Human Review → Learning Loop
# ══════════════════════════════════════════════════════════════════════════════

class AICorrection(Base):
    """
    Stores human corrections to AI decisions as few-shot examples.
    Used by the AI engine to improve responses over time.
    """
    __tablename__ = "ai_corrections"

    id               = Column(Integer, primary_key=True, index=True)
    decision_type    = Column(String(60), nullable=False, index=True)
    input_pattern    = Column(Text, nullable=False)
    corrected_answer = Column(Text, nullable=False)
    reviewer_notes   = Column(Text, nullable=True)
    usage_count      = Column(Integer, default=0, nullable=False)
    created_at       = Column(DateTime(timezone=True), default=_utcnow, nullable=False)
    updated_at       = Column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow, nullable=False)

    def __repr__(self) -> str:
        return f"<AICorrection id={self.id} type={self.decision_type!r} uses={self.usage_count}>"


# ══════════════════════════════════════════════════════════════════════════════
# Feature 4: Automated Follow-Up Sequences
# ══════════════════════════════════════════════════════════════════════════════

class FollowUpTask(Base):
    """
    Tracks scheduled follow-up messages for leads.
    Celery beat tasks read from this table to send timed follow-ups.
    """
    __tablename__ = "follow_up_tasks"

    id           = Column(Integer, primary_key=True, index=True)
    lead_id      = Column(Integer, nullable=False, index=True)
    task_type    = Column(String(20), nullable=False)   # hot_1h | warm_3d | cool_7d
    scheduled_at = Column(DateTime(timezone=True), nullable=False)
    sent_at      = Column(DateTime(timezone=True), nullable=True)
    status       = Column(String(20), default='pending', nullable=False)  # pending | sent | cancelled
    created_at   = Column(DateTime(timezone=True), default=_utcnow, nullable=False)

    def __repr__(self) -> str:
        return f"<FollowUpTask lead_id={self.lead_id} type={self.task_type!r} status={self.status!r}>"


# ══════════════════════════════════════════════════════════════════════════════
# Feature 12: Mechanics Lien Deadline Tracker
# ══════════════════════════════════════════════════════════════════════════════

class LienCalendarEntry(Base):
    """
    Tracks mechanics lien deadlines for active construction projects.
    Sends automated reminders before deadlines expire.
    """
    __tablename__ = "lien_calendar_entries"

    id                          = Column(Integer, primary_key=True, index=True)
    customer_name               = Column(String(120), nullable=False)
    project_address             = Column(String(300), nullable=False)
    state_code                  = Column(String(2), nullable=False, index=True)
    project_start_date          = Column(DateTime(timezone=True), nullable=False)
    last_furnishing_date        = Column(DateTime(timezone=True), nullable=False)
    preliminary_notice_deadline = Column(DateTime(timezone=True), nullable=True)
    lien_filing_deadline        = Column(DateTime(timezone=True), nullable=True)
    foreclosure_deadline        = Column(DateTime(timezone=True), nullable=True)
    reminder_sent_at            = Column(DateTime(timezone=True), nullable=True)
    notes                       = Column(Text, nullable=True)
    created_at                  = Column(DateTime(timezone=True), default=_utcnow, nullable=False)

    def __repr__(self) -> str:
        return f"<LienCalendarEntry id={self.id} state={self.state_code!r} customer={self.customer_name!r}>"


# ══════════════════════════════════════════════════════════════════════════════
# Feature 14: Subcontractor Insurance/Bond Monitor
# ══════════════════════════════════════════════════════════════════════════════

class SubcontractorRoster(Base):
    """
    Roster of subcontractors with license, insurance, and bond expiry tracking.
    Alerts are sent when certificates are about to expire.
    """
    __tablename__ = "subcontractor_roster"

    id                 = Column(Integer, primary_key=True, index=True)
    name               = Column(String(120), nullable=False)
    company            = Column(String(120), nullable=False)
    email              = Column(String(254), nullable=True)
    phone              = Column(String(30), nullable=True)
    state_code         = Column(String(2), nullable=False)
    license_number     = Column(String(60), nullable=True)
    license_expiry     = Column(DateTime(timezone=True), nullable=True)
    insurance_expiry   = Column(DateTime(timezone=True), nullable=True)
    bond_expiry        = Column(DateTime(timezone=True), nullable=True)
    bond_amount        = Column(Float, nullable=True)
    insurance_carrier  = Column(String(120), nullable=True)
    notes              = Column(Text, nullable=True)
    is_active          = Column(Integer, default=1, nullable=False)
    created_at         = Column(DateTime(timezone=True), default=_utcnow, nullable=False)
    updated_at         = Column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow, nullable=False)

    def __repr__(self) -> str:
        return f"<SubcontractorRoster id={self.id} name={self.name!r} company={self.company!r}>"


# ══════════════════════════════════════════════════════════════════════════════
# Feature 15: White-Label / Multi-Tenant Mode
# ══════════════════════════════════════════════════════════════════════════════

class Tenant(Base):
    """
    Tenant configuration for white-label / multi-tenant SaaS mode.
    Each tenant can override the AI system prompt, branding, and contact info.
    """
    __tablename__ = "tenants"

    id                     = Column(Integer, primary_key=True, index=True)
    tenant_id              = Column(String(60), nullable=False, unique=True, index=True)
    company_name           = Column(String(120), nullable=False)
    system_prompt_override = Column(Text, nullable=True)
    primary_color          = Column(String(20), default='#f5a623', nullable=False)
    logo_url               = Column(String(500), nullable=True)
    contact_email          = Column(String(254), nullable=True)
    contact_phone          = Column(String(30), nullable=True)
    is_active              = Column(Integer, default=1, nullable=False)
    created_at             = Column(DateTime(timezone=True), default=_utcnow, nullable=False)

    def __repr__(self) -> str:
        return f"<Tenant tenant_id={self.tenant_id!r} company={self.company_name!r}>"

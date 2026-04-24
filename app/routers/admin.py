"""
Admin dashboard router — served entirely from the backend (FastAPI + Jinja2).

All routes under /admin require HTTP Basic Authentication.
Credentials are supplied via environment variables:
  ADMIN_USERNAME  (default: "admin")
  ADMIN_PASSWORD  (required — no default; routes return 401 if unset)

The dashboard exposes:
  GET  /admin                      → redirect to /admin/dashboard
  GET  /admin/dashboard            → overview stats + top-ranked leads
  GET  /admin/leads                → full ranked lead list (with filters)
  GET  /admin/content              → webpage-maker content blocks list
  GET  /admin/content/new          → new block form
  POST /admin/content/new          → create block
  GET  /admin/content/{key}/edit   → edit form
  POST /admin/content/{key}/edit   → save changes
  POST /admin/content/{key}/delete → delete block

None of these routes are included in the customer-facing OpenAPI spec
(include_in_schema=False) and they are excluded from CORS so browser
clients on other origins cannot reach them.
"""

from __future__ import annotations

import json
import logging
import os
import secrets

from fastapi import APIRouter, Depends, Form, HTTPException, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import ContactMessage, Lead, PageContent
from ..services.ranking import rank_leads

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", include_in_schema=False)
security = HTTPBasic()

# ── Template engine ────────────────────────────────────────────────────────────

_TEMPLATES_DIR = os.path.join(os.path.dirname(__file__), "..", "templates")
templates = Jinja2Templates(directory=_TEMPLATES_DIR)


# ── Auth ──────────────────────────────────────────────────────────────────────

def _require_admin(credentials: HTTPBasicCredentials = Depends(security)) -> str:
    """
    Verify HTTP Basic credentials against ADMIN_USERNAME / ADMIN_PASSWORD env vars.
    Uses secrets.compare_digest to prevent timing attacks.
    """
    admin_user = os.getenv("ADMIN_USERNAME", "admin").encode()
    admin_pass = os.getenv("ADMIN_PASSWORD", "").encode()

    if not admin_pass:
        raise HTTPException(
            status_code=503,
            detail="Admin dashboard is not configured. Set ADMIN_PASSWORD.",
        )

    user_ok = secrets.compare_digest(credentials.username.encode(), admin_user)
    pass_ok = secrets.compare_digest(credentials.password.encode(), admin_pass)

    if not (user_ok and pass_ok):
        raise HTTPException(
            status_code=401,
            detail="Unauthorized",
            headers={"WWW-Authenticate": "Basic realm=\"JWordenAI Admin\""},
        )
    return credentials.username


# ── Helpers ───────────────────────────────────────────────────────────────────

def _hot_count(db: Session) -> int:
    return db.query(Lead).filter(Lead.score_label == "HOT").count()


def _render(request: Request, template: str, db: Session, **ctx) -> HTMLResponse:
    ctx.setdefault("active", "")
    ctx.setdefault("flash", None)
    ctx["hot_count"] = _hot_count(db)
    ctx["request"] = request
    return templates.TemplateResponse(template, ctx)


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get("", response_class=RedirectResponse)
def admin_root(_: str = Depends(_require_admin)):
    return RedirectResponse(url="/admin/dashboard", status_code=302)


@router.get("/dashboard", response_class=HTMLResponse)
def admin_dashboard(
    request: Request,
    db: Session = Depends(get_db),
    _: str = Depends(_require_admin),
):
    all_leads = db.query(Lead).order_by(Lead.created_at.desc()).all()
    ranked = rank_leads(all_leads)

    hot  = sum(1 for r in ranked if r["rank_label"] == "HOT")
    warm = sum(1 for r in ranked if r["rank_label"] == "WARM")
    cool = sum(1 for r in ranked if r["rank_label"] == "COOL")
    overdue = sum(1 for r in ranked if r["sla_status"] != "within_sla" and r["sla_status"] != "unknown")

    recent_contacts = (
        db.query(ContactMessage)
        .order_by(ContactMessage.created_at.desc())
        .limit(10)
        .all()
    )
    content_blocks = db.query(PageContent).count()

    return _render(
        request,
        "admin/dashboard.html",
        db,
        active="dashboard",
        stats={
            "total_leads": len(all_leads),
            "hot": hot,
            "warm": warm,
            "cool": cool,
            "overdue": overdue,
            "total_contacts": db.query(ContactMessage).count(),
            "content_blocks": content_blocks,
        },
        top_leads=ranked[:10],
        recent_contacts=recent_contacts,
    )


@router.get("/leads", response_class=HTMLResponse)
def admin_leads(
    request: Request,
    label: str = "",
    sla: str = "",
    db: Session = Depends(get_db),
    _: str = Depends(_require_admin),
):
    query = db.query(Lead)
    all_leads = query.order_by(Lead.created_at.desc()).all()
    ranked = rank_leads(all_leads)

    # Apply filters
    if label:
        ranked = [r for r in ranked if r["rank_label"] == label.upper()]
    if sla == "overdue":
        ranked = [r for r in ranked if r["sla_status"] not in ("within_sla", "unknown")]

    return _render(
        request,
        "admin/leads.html",
        db,
        active="leads",
        ranked_leads=ranked,
        total=len(ranked),
        filter_label=label.upper() if label else "",
        filter_sla=sla,
    )


# ── Content (Webpage Maker) ───────────────────────────────────────────────────

@router.get("/content", response_class=HTMLResponse)
def admin_content(
    request: Request,
    flash_msg: str = "",
    flash_type: str = "success",
    db: Session = Depends(get_db),
    _: str = Depends(_require_admin),
):
    blocks = db.query(PageContent).order_by(PageContent.key).all()
    flash = {"type": flash_type, "message": flash_msg} if flash_msg else None
    return _render(request, "admin/content.html", db, active="content", blocks=blocks, flash=flash)


@router.get("/content/new", response_class=HTMLResponse)
def admin_content_new(
    request: Request,
    db: Session = Depends(get_db),
    _: str = Depends(_require_admin),
):
    return _render(request, "admin/content_edit.html", db, active="content", block=None)


@router.post("/content/new", response_class=RedirectResponse)
def admin_content_create(
    request: Request,
    key: str = Form(...),
    title: str = Form(...),
    body: str = Form(""),
    meta_json: str = Form(""),
    db: Session = Depends(get_db),
    _: str = Depends(_require_admin),
):
    key = key.strip().lower()

    # Validate key format
    import re
    if not re.fullmatch(r"[a-z0-9_\-]+", key):
        return _render(
            request,
            "admin/content_edit.html",
            db,
            active="content",
            block=None,
            flash={"type": "error", "message": "Key must contain only lowercase letters, numbers, underscores, and hyphens."},
        )

    # Validate JSON if provided
    if meta_json.strip():
        try:
            json.loads(meta_json)
        except json.JSONDecodeError:
            return _render(
                request,
                "admin/content_edit.html",
                db,
                active="content",
                block=None,
                flash={"type": "error", "message": "Meta JSON is not valid JSON."},
            )

    existing = db.query(PageContent).filter(PageContent.key == key).first()
    if existing:
        return _render(
            request,
            "admin/content_edit.html",
            db,
            active="content",
            block=None,
            flash={"type": "error", "message": f"A block with key '{key}' already exists."},
        )

    block = PageContent(
        key=key,
        title=title.strip(),
        body=body,
        meta_json=meta_json.strip() or None,
    )
    db.add(block)
    db.commit()
    logger.info("Admin created content block key=%s", key)
    return RedirectResponse(
        url=f"/admin/content?flash_msg=Block+%27{key}%27+created.&flash_type=success",
        status_code=303,
    )


@router.get("/content/{key}/edit", response_class=HTMLResponse)
def admin_content_edit(
    key: str,
    request: Request,
    db: Session = Depends(get_db),
    _: str = Depends(_require_admin),
):
    block = db.query(PageContent).filter(PageContent.key == key).first()
    if not block:
        raise HTTPException(status_code=404, detail=f"Content block '{key}' not found")
    return _render(request, "admin/content_edit.html", db, active="content", block=block)


@router.post("/content/{key}/edit", response_class=RedirectResponse)
def admin_content_update(
    key: str,
    title: str = Form(...),
    body: str = Form(""),
    meta_json: str = Form(""),
    db: Session = Depends(get_db),
    _: str = Depends(_require_admin),
):
    block = db.query(PageContent).filter(PageContent.key == key).first()
    if not block:
        raise HTTPException(status_code=404, detail=f"Content block '{key}' not found")

    if meta_json.strip():
        try:
            json.loads(meta_json)
        except json.JSONDecodeError:
            raise HTTPException(status_code=422, detail="Meta JSON is not valid JSON")

    block.title = title.strip()
    block.body = body
    block.meta_json = meta_json.strip() or None
    db.commit()
    logger.info("Admin updated content block key=%s", key)
    return RedirectResponse(
        url=f"/admin/content?flash_msg=Block+%27{key}%27+saved.&flash_type=success",
        status_code=303,
    )


@router.post("/content/{key}/delete", response_class=RedirectResponse)
def admin_content_delete(
    key: str,
    db: Session = Depends(get_db),
    _: str = Depends(_require_admin),
):
    block = db.query(PageContent).filter(PageContent.key == key).first()
    if not block:
        raise HTTPException(status_code=404, detail=f"Content block '{key}' not found")
    db.delete(block)
    db.commit()
    logger.info("Admin deleted content block key=%s", key)
    return RedirectResponse(
        url=f"/admin/content?flash_msg=Block+%27{key}%27+deleted.&flash_type=success",
        status_code=303,
    )

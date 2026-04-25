"""
Virginia permitting endpoints for the JWordenAI Command Center.

Routes:
  GET  /api/v1/permits/virginia/vpt   — Virginia Permit Transparency permit feed
  GET  /api/v1/permits/virginia/deq   — DEQ PEEP stormwater permit feed
  POST /api/v1/permits/virginia/dpor  — DPOR license lookup via Apify
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query, Request
from pydantic import BaseModel, Field
from typing import Optional

from ..core.limiter import limiter
from ..services.permit_scraper import fetch_vpt_permits, fetch_deq_permits, lookup_dpor_license
from ..services.lead_scorer import score_lead

router = APIRouter(prefix="/api/v1/permits", tags=["permits"])


# ── Response helpers ──────────────────────────────────────────────────────────

def _enrich_with_score(leads: list[dict]) -> list[dict]:
    """Append lead score to each permit lead dict."""
    enriched = []
    for lead in leads:
        scoring = score_lead(lead)
        enriched.append({**lead, "lead_score": scoring})
    return enriched


# ── VPT ───────────────────────────────────────────────────────────────────────

@router.get(
    "/virginia/vpt",
    summary="Virginia Permit Transparency — paving & construction permit feed",
)
@limiter.limit("30/minute")
async def vpt_permits(
    request: Request,
    keyword: str = Query(default="paving", max_length=100, description="Search term (e.g. paving, asphalt, parking)"),
    limit: int = Query(default=50, ge=1, le=200, description="Max number of permits to return"),
):
    """
    Poll the Virginia Permit Transparency portal for permits matching *keyword*.
    Results are enriched with JWordenAI lead scores so hot prospects are
    immediately identifiable in the Command Center dashboard.
    """
    leads = fetch_vpt_permits(keyword=keyword, max_results=limit)
    return {
        "status": "ok",
        "source": "Virginia Permit Transparency (VPT)",
        "count": len(leads),
        "permits": _enrich_with_score(leads),
    }


# ── DEQ PEEP ─────────────────────────────────────────────────────────────────

@router.get(
    "/virginia/deq",
    summary="Virginia DEQ PEEP — stormwater construction permit feed",
)
@limiter.limit("30/minute")
async def deq_permits(
    request: Request,
    limit: int = Query(default=50, ge=1, le=200, description="Max number of permits to return"),
):
    """
    Query Virginia DEQ PEEP for active Stormwater Construction General Permits
    (VPDES-CGP). These are reliable precursors to large paving / site-work jobs.
    Results are enriched with JWordenAI lead scores.
    """
    leads = fetch_deq_permits(max_results=limit)
    return {
        "status": "ok",
        "source": "Virginia DEQ PEEP (Stormwater CGP)",
        "count": len(leads),
        "permits": _enrich_with_score(leads),
    }


# ── DPOR ──────────────────────────────────────────────────────────────────────

class DporRequest(BaseModel):
    license_number: Optional[str] = Field(default=None, max_length=50, description="DPOR license number")
    address: Optional[str] = Field(default=None, max_length=300, description="Contractor address to look up")


@router.post(
    "/virginia/dpor",
    summary="DPOR license lookup — validate or enrich contractor / prospect intel",
)
@limiter.limit("10/minute")
async def dpor_lookup(request: Request, req: DporRequest):
    """
    Look up a Virginia DPOR license by number or address via the Apify scraper.
    Useful for validating competitor intel or enriching inbound leads with
    license status before sending a sales follow-up.
    """
    if not req.license_number and not req.address:
        raise HTTPException(status_code=422, detail="Provide license_number or address.")

    result = lookup_dpor_license(
        license_number=req.license_number,
        address=req.address,
    )

    if result.get("error") and not result.get("data"):
        raise HTTPException(status_code=503, detail=result["error"])

    return {
        "status": "ok",
        "source": "Virginia DPOR (via Apify)",
        **result,
    }

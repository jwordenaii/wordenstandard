"""
Advisor API endpoints for J. Worden & Sons.

Exposes:
  POST /api/v1/advisor/legal-strategy     — negotiation/lawyer recommender
  POST /api/v1/advisor/rank-contractors   — contractor bid ranking
  GET  /api/v1/advisor/top-states         — strongest states for a dispute type
  GET  /api/v1/advisor/license-optimizer  — best states for base license
  POST /api/v1/advisor/utility-risk       — Virginia 811 private-utility risk advisory
"""

from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Optional

from ..services.lawyer_recommender import (
    recommend_legal_strategy,
    find_strongest_states,
    rank_states_by_reciprocity,
    DISPUTE_TYPES,
    ROLE_LABELS,
)
from ..services.contractor_ranker import (
    ContractorBid,
    rank_contractor_bids,
    optimize_license_states,
)

router = APIRouter(prefix="/api/v1/advisor", tags=["advisor"])


# ── Legal strategy ────────────────────────────────────────────────────────────

class LegalStrategyRequest(BaseModel):
    state:        str  = Field(..., min_length=2, max_length=2, description="2-letter state abbreviation")
    dispute_type: str  = Field(..., description="lien | payment | contract_breach | general")
    role:         str  = Field(default="gc", description="gc | sub | supplier | owner")


@router.post(
    "/legal-strategy",
    summary="Negotiation strength analysis and legal strategy recommendation",
)
def legal_strategy(req: LegalStrategyRequest):
    """
    Analyze the legal environment for a specific state + dispute type and return
    a negotiation strategy recommendation including strength scores, key actions,
    role-specific leverage points, and the top 5 most favorable alternative states.
    """
    rec = recommend_legal_strategy(
        state=req.state,
        dispute_type=req.dispute_type,
        role=req.role,
    )
    return {
        "status": "success",
        "state": rec.state,
        "state_name": rec.state_name,
        "dispute_type": rec.dispute_type,
        "role": rec.role,
        "scores": {
            "lien":          rec.lien_score,
            "payment":       rec.payment_score,
            "contract":      rec.contract_score,
            "composite":     rec.composite_score,
            "label":         rec.strength_label,
            "color":         rec.strength_color,
        },
        "strategy": {
            "title":                 rec.strategy_title,
            "description":           rec.strategy_description,
            "key_actions":           rec.key_actions,
            "role_leverage":         rec.role_leverage,
            "state_specific_note":   rec.state_specific_note,
            "weak_position_advice":  rec.weak_position_advice,
            "citation_note":         rec.citation_note,
        },
        "top_states_for_dispute": rec.top_states,
    }


@router.get(
    "/top-states",
    summary="Top states by contractor-favorability for a dispute type",
)
def top_states(dispute_type: str = "general", top_n: int = 10):
    """Return the most contractor-favorable states for the given dispute type."""
    results = find_strongest_states(dispute_type, top_n=min(top_n, 51))
    return {"status": "success", "dispute_type": dispute_type, "states": results}


@router.get(
    "/reciprocity-ranking",
    summary="Rank states by reciprocity breadth relative to a home state",
)
def reciprocity_ranking(home_state: str = "AL", top_n: int = 10):
    """Identify states with the broadest reciprocity networks from a home state."""
    results = rank_states_by_reciprocity(home_state, top_n=min(top_n, 51))
    return {"status": "success", "home_state": home_state.upper(), "states": results}


# ── Contractor ranking ────────────────────────────────────────────────────────

class ContractorBidInput(BaseModel):
    name:               str   = Field(..., description="Contractor name or company")
    bid_amount:         float = Field(..., gt=0, description="Total bid in dollars")
    license_state:      str   = Field(default="", max_length=2, description="License state abbreviation")
    license_classes:    list[str] = Field(default_factory=list, description="List of license class labels")
    bond_amount:        float = Field(default=0.0, ge=0, description="Surety bond amount in dollars")
    years_experience:   int   = Field(default=0, ge=0, description="Years in business")
    has_insurance:      bool  = Field(default=True, description="General liability insurance confirmed")
    workers_comp:       bool  = Field(default=True, description="Workers comp confirmed")
    reciprocity_states: list[str] = Field(default_factory=list, description="States covered by reciprocity")
    notes:              str   = Field(default="", max_length=500)


class RankContractorsRequest(BaseModel):
    bids:          list[ContractorBidInput] = Field(..., min_length=1, max_length=20)
    estimate_low:  Optional[float]          = Field(default=None, ge=0)
    estimate_high: Optional[float]          = Field(default=None, ge=0)


@router.post(
    "/rank-contractors",
    summary="Score and rank contractor bids by quality, licensing, bonding, and value",
)
def rank_contractors(req: RankContractorsRequest):
    """
    Score and rank a list of contractor bids.
    Returns ranked results with composite scores, individual dimension scores,
    warning flags, and actionable recommendations.
    """
    bids = [
        ContractorBid(
            name=b.name,
            bid_amount=b.bid_amount,
            license_state=b.license_state,
            license_classes=b.license_classes,
            bond_amount=b.bond_amount,
            years_experience=b.years_experience,
            has_insurance=b.has_insurance,
            workers_comp=b.workers_comp,
            reciprocity_states=b.reciprocity_states,
            notes=b.notes,
        )
        for b in req.bids
    ]
    est_low  = req.estimate_low  or 0.0
    est_high = req.estimate_high or 0.0

    ranked = rank_contractor_bids(bids, est_low, est_high)

    return {
        "status": "success",
        "estimate_range": {"low": est_low, "high": est_high} if est_low or est_high else None,
        "ranked": [
            {
                "rank":             r.rank,
                "name":             r.contractor.name,
                "bid_amount":       r.contractor.bid_amount,
                "scores": {
                    "bid":          r.bid_score,
                    "license":      r.license_score,
                    "bond":         r.bond_score,
                    "experience":   r.experience_score,
                    "compliance":   r.compliance_score,
                    "composite":    r.composite_score,
                },
                "rank_label":       r.rank_label,
                "recommendation":   r.recommendation,
                "flags":            r.flags,
            }
            for r in ranked
        ],
    }


@router.get(
    "/license-optimizer",
    summary="Rank states by optimal base license for multi-state contractor work",
)
def license_optimizer(top_n: int = 10):
    """
    Rank states by how beneficial a contractor license there is — weighing
    reciprocity breadth, license class scope, and bond requirements.
    """
    results = optimize_license_states(top_n=min(top_n, 51))
    return {
        "status": "success",
        "results": [
            {
                "rank":                i + 1,
                "abbr":               s.abbr,
                "state":              s.state_name,
                "reciprocity_count":  s.reciprocity_count,
                "class_scope_score":  s.class_scope_score,
                "bond_min_commercial": s.bond_min_commercial,
                "optimizer_score":    s.optimizer_score,
                "optimizer_label":    s.optimizer_label,
                "notes":              s.notes,
            }
            for i, s in enumerate(results)
        ],
    }


# ── Virginia 811 private-utility risk advisory ────────────────────────────────

class UtilityCheckRequest(BaseModel):
    has_septic:              bool
    has_well:                bool
    has_detached_structures: bool
    has_pool:                bool


class LaunchCompliancePlanRequest(BaseModel):
    avg_deal_size_usd: float = Field(
        default=12000,
        gt=0,
        description="Average signed deal value in USD",
    )
    monthly_qualified_leads: int = Field(
        default=40,
        ge=1,
        description="Qualified inbound leads expected each month",
    )
    close_rate_percent: float = Field(
        default=22,
        ge=0,
        le=100,
        description="Expected close rate percentage",
    )
    team_capacity_jobs_per_month: int = Field(
        default=18,
        ge=1,
        description="Maximum jobs your team can execute monthly",
    )
    include_compliance_advisory: bool = Field(
        default=True,
        description="Include compliance advisory offer lane in output",
    )


@router.post(
    "/utility-risk",
    summary="Virginia 811 private-utility risk advisory",
)
def evaluate_utility_risk(req: UtilityCheckRequest):
    """
    Advisory scoring for sites with private utilities that VA 811 (Miss Utility)
    will NOT mark.  Returns a risk level, actionable recommendations, and the
    legal notice reminder about per-person excavation ticket requirements.

    No PII is collected.  Response is purely advisory.
    """
    has_private = (
        req.has_septic
        or req.has_well
        or req.has_detached_structures
        or req.has_pool
    )

    recommendations = [
        "\u2705 Contact VA 811 (Miss Utility) at least 3 business days before digging."
    ]

    if has_private:
        recommendations += [
            "\u26a0\ufe0f HIGH RISK: Private lines detected. VA 811 will NOT mark these.",
            "\U0001f4a1 Recommendation: Hire a private utility locating service.",
        ]

    recommendations.append(
        "\u2139\ufe0f Tip: Use \u2018White Lining\u2019 (white paint/flags) to outline the "
        "work area before locators arrive."
    )

    return {
        "risk_level":    "High" if has_private else "Low",
        "advisory_notes": recommendations,
        "legal_notice": (
            "Every \u2018person\u2019 must provide their own notice of excavation. "
            "Subcontractors cannot work under another\u2019s ticket."
        ),
    }


@router.post(
    "/launch-compliance-plan",
    summary="Launch advisory plan for monetization + compliance rollout",
)
def launch_compliance_plan(req: LaunchCompliancePlanRequest):
    """
    Build a realistic, operations-first launch plan from current assumptions.

    This is an advisory planning endpoint for launch sequencing and revenue
    lanes. It is not legal, tax, or investment advice.
    """
    close_rate = req.close_rate_percent / 100.0
    projected_wins = int(round(req.monthly_qualified_leads * close_rate))
    executable_wins = min(projected_wins, req.team_capacity_jobs_per_month)

    # Base construction revenue forecast band using capacity-capped wins.
    monthly_floor = round(executable_wins * req.avg_deal_size_usd * 0.85, 2)
    monthly_mid = round(executable_wins * req.avg_deal_size_usd, 2)
    monthly_ceiling = round(executable_wins * req.avg_deal_size_usd * 1.15, 2)

    lanes = [
        {
            "lane": "core-operations",
            "description": "Lead intake + quote + close + deposit flow",
            "monthly_revenue_range_usd": {
                "low": monthly_floor,
                "mid": monthly_mid,
                "high": monthly_ceiling,
            },
            "dependencies": [
                "lead capture",
                "crm pipeline",
                "math-ai cost estimate",
                "payments checkout-session",
            ],
        },
        {
            "lane": "ads-intelligence-managed-service",
            "description": "URL exclusions + CRM export + anomaly monitoring for paid media",
            "monthly_revenue_range_usd": {"low": 4500, "mid": 12000, "high": 30000},
            "dependencies": [
                "ads/status",
                "ads/url-exclusions",
                "ads/crm-export",
                "ads/anomaly-scan",
            ],
        },
        {
            "lane": "maintenance-plan-recurring",
            "description": "Recurring maintenance packages using forecast-based follow-ups",
            "monthly_revenue_range_usd": {"low": 3000, "mid": 8500, "high": 20000},
            "dependencies": [
                "math-ai maintenance-forecast",
                "follow-up automation",
                "customer history",
            ],
        },
    ]

    if req.include_compliance_advisory:
        lanes.append(
            {
                "lane": "compliance-advisory",
                "description": "51-jurisdiction compliance verification + advisory retainers",
                "monthly_revenue_range_usd": {"low": 1000, "mid": 5000, "high": 12000},
                "dependencies": [
                    "compliance/matrix",
                    "compliance/verify-batch",
                    "advisor/legal-strategy",
                    "advisor/license-optimizer",
                ],
                "notice": "Advisory operations guidance only; not legal advice.",
            }
        )

    launch_sequence = [
        "Stabilize core funnel: quote -> proposal -> deposit conversion.",
        "Turn on weekly ads anomaly scans and CRM export loops.",
        "Launch compliance advisory package with batch verification deliverables.",
        "Expand recurring maintenance plans once execution capacity is stable.",
    ]

    return {
        "status": "success",
        "inputs": req.model_dump(),
        "forecast": {
            "projected_wins_per_month": projected_wins,
            "capacity_capped_wins_per_month": executable_wins,
            "capacity_utilization_percent": round(
                min(100.0, (executable_wins / req.team_capacity_jobs_per_month) * 100.0),
                1,
            ),
        },
        "revenue_lanes": lanes,
        "launch_sequence": launch_sequence,
        "compliance_checklist": [
            "Confirm 51-jurisdiction matrix parity before publishing advisory outputs.",
            "Record verification history for every compliance run.",
            "Include advisory-only notice in every compliance client deliverable.",
        ],
        "advisory_notice": "Planning guidance only. Confirm legal and tax implications with licensed professionals.",
    }

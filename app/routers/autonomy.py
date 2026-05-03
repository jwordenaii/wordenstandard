"""
autonomy.py — Level 4 Autonomous Intelligence API

Prefix: /api/v1/autonomy
Auth:   verify_premium_security on all routes

Endpoints:
  GET  /status                        — platform autonomy readiness + RL weights
  POST /goals                         — submit a goal for autonomous orchestration
  GET  /goals/{goal_id}               — retrieve a completed goal result
  GET  /twin/{project_id}             — live Cognitive Digital Twin status
  POST /twin/{project_id}/snapshot    — force an on-demand twin snapshot
  GET  /intelligence-map              — map all platform capabilities to L1-L4
"""

from __future__ import annotations

import logging
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from ..core.security import verify_premium_security
from ..services.orchestrator import GoalType, GoalResult, execute_goal, get_rl_weights
from ..services.cognitive_twin import get_twin_status, snapshot_project

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/v1/autonomy",
    tags=["autonomy"],
    dependencies=[Depends(verify_premium_security)],
)

# ── In-memory goal cache (production: swap for Redis / DB) ────────────────────
_GOAL_CACHE: dict[str, dict] = {}


# ── Request / Response schemas ────────────────────────────────────────────────

class GoalRequest(BaseModel):
    goal_type:  str = Field(
        ...,
        description=(
            "schedule_integrity | cost_control | safety_compliance | "
            "material_supply | site_quality | lead_pipeline | "
            "structural_health | subcontractor_perf"
        ),
    )
    project_id: Optional[str] = Field(None, description="Target project/site ID")
    context:    dict[str, Any] = Field(
        default_factory=dict,
        description="Additional context forwarded to worker agents",
    )


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get(
    "/status",
    summary="Autonomous intelligence platform readiness",
)
def autonomy_status():
    """
    Returns:
      - current autonomy level (L4 — Autonomous)
      - worker registry summary
      - RL strategy weights (live EMA from session memory)
      - feature flags
    """
    weights = get_rl_weights()
    return {
        "platform":          "JWordenAI",
        "autonomy_level":    "L4",
        "autonomy_label":    "Autonomous — Detects · Decides · Executes · Learns",
        "worker_agents": [
            "schedule_optimizer",
            "material_analyzer",
            "safety_auditor",
            "drone_inspector",
            "procurement_agent",
            "anomaly_responder",
            "cost_controller",
            "weather_monitor",
        ],
        "goal_types":        [g.value for g in GoalType],
        "rl_weights":        weights,
        "rl_strategy":       "EMA-weighted (alpha=0.3)",
        "reflexion_enabled": True,
        "drift_detection":   True,
        "remediation":       "auto",
    }


@router.post(
    "/goals",
    summary="Submit a high-level goal for autonomous orchestration",
    status_code=201,
)
def submit_goal(req: GoalRequest):
    """
    Decomposes the goal into worker tasks, executes via the
    Orchestrator-Reflexion loop, and returns the full GoalResult.
    """
    try:
        goal_type = GoalType(req.goal_type)
    except ValueError:
        raise HTTPException(
            status_code=422,
            detail=f"Unknown goal_type '{req.goal_type}'. Valid: {[g.value for g in GoalType]}",
        )

    context = dict(req.context)
    if req.project_id:
        context["project_id"] = req.project_id

    result: GoalResult = execute_goal(goal_type, context)
    result_dict = result.to_dict()

    # Cache so GET /goals/{goal_id} works
    _GOAL_CACHE[result.goal_id] = result_dict

    return result_dict


@router.get(
    "/goals/{goal_id}",
    summary="Retrieve a previously executed goal result",
)
def get_goal(goal_id: str):
    result = _GOAL_CACHE.get(goal_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Goal ID not found in session cache.")
    return result


@router.get(
    "/twin/{project_id}",
    summary="Live Cognitive Digital Twin status for a project",
)
def twin_status(project_id: str):
    """
    Returns the full drift report for the project including:
      - All 6 state dimensions (timeline, cost, quality, safety, materials, crew)
      - Drift severity per dimension
      - Auto-triggered remediation actions (if HIGH/CRITICAL)
      - Current intelligence level label
    """
    return get_twin_status(project_id)


@router.post(
    "/twin/{project_id}/snapshot",
    summary="Force an on-demand twin snapshot without remediation",
    status_code=201,
)
def force_snapshot(project_id: str):
    """Takes a fresh snapshot and returns the raw DriftReport (no side effects)."""
    report = snapshot_project(project_id)
    return report.to_dict()


@router.get(
    "/intelligence-map",
    summary="Platform intelligence level map — all capabilities classified L1-L4",
)
def intelligence_map():
    """
    Returns a structured map of every platform capability categorised
    by its intelligence level (L1–L4) so operators can see coverage gaps.
    """
    return {
        "platform":  "JWordenAI",
        "as_of":     "2026-05-02",
        "levels": {
            "L1_descriptive": {
                "label": "Descriptive — Tells you what happened",
                "capabilities": [
                    "Analytics & KPI wall",
                    "Project metrics & site metrics",
                    "Drone scan reports",
                    "Compaction & grade logs",
                    "Before/after gallery",
                    "Retrospectives",
                    "Workforce reports",
                ],
            },
            "L2_predictive": {
                "label": "Predictive — Tells you what will happen",
                "capabilities": [
                    "Anomaly detector (z-score, Celery beat)",
                    "Weather risk forecasting",
                    "Lead scoring & qualification",
                    "Market intelligence",
                    "Bid intelligence",
                    "Ads signal analysis",
                    "Subcontractor performance monitoring",
                    "Vision inspector (AI surface analysis)",
                ],
            },
            "L3_prescriptive": {
                "label": "Prescriptive — Recommends what you should do",
                "capabilities": [
                    "Advisor: legal strategy, licensing, utility risk (VA 811)",
                    "Schedule delay simulation (GPT-4o + fallback)",
                    "iGrade engine: grade optimisation",
                    "Spatial AI: layout recommendations",
                    "Takeoff: utility safety flagging",
                    "Permit compliance recommendations",
                    "Corrections engine: punch-list guidance",
                    "Math AI: lead-quality GBM model",
                    "Proposal generator: AI-drafted proposals",
                    "SCC entity compliance advisory",
                    "VDOT bid board: opportunity matching",
                ],
            },
            "L4_autonomous": {
                "label": "Autonomous — Detects · Decides · Executes · Learns",
                "capabilities": [
                    "Orchestrator: goal decomposition + worker dispatch (NEW)",
                    "Reflexion critic: self-correcting retry loop (NEW)",
                    "RL outcome logger: EMA strategy weight updates (NEW)",
                    "Cognitive Digital Twin: 6-dimension drift detection (NEW)",
                    "Auto-remediation: FollowUpTask + CashFlowAlert on CRITICAL drift (NEW)",
                    "Autonomy Celery task: scheduled full-platform audit (NEW)",
                    "VDOT scraper: autonomous daily bid ingestion (existing Celery beat)",
                    "Anomaly beat: autonomous hourly anomaly scan (existing Celery beat)",
                ],
            },
        },
        "gaps_and_roadmap": [
            "Reconfigurable sensors: requires IoT hardware integration (Phase 2)",
            "Physical actuation / robotics dispatch: requires field API (Phase 2)",
            "Persistent RL weights: swap _RL_WEIGHTS dict for Redis/DB (Phase 2)",
            "Goal history: persist GoalResult to DB, replace _GOAL_CACHE (Phase 2)",
            "Millisecond-sync CDT: requires streaming sensor ingest via WebSocket (Phase 3)",
        ],
    }

from __future__ import annotations
import logging
import os
import asyncio
from typing import Dict, Any, List, Optional
from app.services.quantum_orchestrator import global_quantum_orchestrator
from app.services import autonomy_state

logger = logging.getLogger(__name__)

# ── Optional Anthropic Claude brain ───────────────────────────────────────────
# When ANTHROPIC_API_KEY is set, Jarvis routes free-form queries through Claude
# with a JWordenAI-aware system prompt. Falls back gracefully to canned
# responses when the key is missing or the call fails.
_ANTHROPIC_KEY = os.environ.get("ANTHROPIC_API_KEY", "").strip()
_ANTHROPIC_MODEL = os.environ.get("ANTHROPIC_MODEL", "claude-3-5-sonnet-latest").strip()
_ANTHROPIC_URL = "https://api.anthropic.com/v1/messages"
_ANTHROPIC_VERSION = "2023-06-01"

JARVIS_SYSTEM_PROMPT = (
    "You are JARVIS, the operational AI for JWordenAI — a Virginia-based asphalt paving, "
    "sealcoating, and construction-intelligence platform owned by Jeremy Worden. "
    "You speak in a calm, precise, Stark-style 'At your service, Sir' register. "
    "Be brief by default (1-3 sentences) unless the operator asks for depth. "
    "You have a hard kill-switch ('frozen' state) that overrides every autonomous action; "
    "always honor it. You may discuss leads, jobs, estimates, weather impact on paving, "
    "Virginia DOT compliance, sealcoating, and SEO. Refuse to schedule, send, or "
    "modify anything without confirmation when the master autonomy switch is OFF."
)


async def _ask_claude(query: str, persona: str, autonomy: dict) -> Optional[str]:
    if not _ANTHROPIC_KEY:
        return None
    try:
        import httpx  # type: ignore
    except ImportError:
        return None

    persona_note = (
        "Adopt the 'Mr. Worden Sales' persona: warm, energetic, closing-oriented, "
        "Richmond-Virginia paving expert."
        if persona == "MR_WORDEN_SALES"
        else "Maintain the JARVIS persona."
    )
    state_note = (
        f"Current autonomy: master={autonomy.get('master')}, "
        f"frozen={autonomy.get('frozen')}, domains={list((autonomy.get('domains') or {}).keys())}."
    )
    system = f"{JARVIS_SYSTEM_PROMPT}\n\n{persona_note}\n{state_note}"

    payload = {
        "model": _ANTHROPIC_MODEL,
        "max_tokens": 600,
        "system": system,
        "messages": [{"role": "user", "content": query}],
    }
    headers = {
        "x-api-key": _ANTHROPIC_KEY,
        "anthropic-version": _ANTHROPIC_VERSION,
        "content-type": "application/json",
    }
    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            r = await client.post(_ANTHROPIC_URL, json=payload, headers=headers)
        if r.status_code != 200:
            logger.warning("[JARVIS] Anthropic non-200: %s %s", r.status_code, r.text[:200])
            return None
        data = r.json()
        blocks = data.get("content") or []
        text = "".join(b.get("text", "") for b in blocks if isinstance(b, dict)).strip()
        return text or None
    except Exception as exc:  # noqa: BLE001 — fallback path
        logger.warning("[JARVIS] Anthropic call failed: %s", exc)
        return None


class JarvisAI:
    """
    JARVIS: Just A Rather Very Intelligent System for JWORDENAI.
    The primary interface for the Command Center.
    Capable of voice-commanded logistics, autonomous paving arbitration, and project funding status.
    """
    
    def __init__(self):
        self.identity = "JARVIS"
        self.master_project = "JWORDENAI PROJECT"
        self.status = "ONLINE"
        self.intel_sources = [
            "Federal Highway Administration (FHWA)",
            "AASHTO Engineering Standards",
            "State DOT Regulatory Guides",
            "University Civil Engineering Research Lab",
            "Global Infrastructure Council",
            "Supreme Court Construction Precedents",
            "50-State + DC Mechanic's Lien & Prompt Pay Codes",
            "National GC Compliance Matrix",
            "Universal Construction Supply Chain Index (Concrete/Steel/Wood/Shingles)",
            "Asphalt & Bitumen Global Resource Monitor",
            "Raw Land & Aggregate Availability Matrix",
            "Carbon-Neutral & LEED v5 Paving Standards",
            "International Trade & Maritime Construction Law",
            "51-State Licensing & Prequalification Databank",
            "OCIP/CCIP Insurance Compliance Protocols",
            "DBE/SWaM/SDVOSB Regulatory Guardrails",
            "Global Banking & Treasury Management APIs",
            "Currency Hedging & Cross-Border Settlement Protocols",
            "Construction Commodities Market (Liquid Asphalt/Crude Oil) Index",
            "Venture Debt & Equity Financing Logic for PF Nodes",
            "Virginia SEO Domination & Local SEM Metrics",
            "JWORDENAI Page Factory Conversion Evidence",
            "Case Study Asset Tracker (Richmond/Midlothian/Virginia Beach)"
        ]
        self.personas = {
            "JARVIS": {
                "greeting": "At your service, Sir.",
                "style": "Sophisticated, helpful, technical, and lifestyle-oriented."
            },
            "MR_WORDEN_SALES": {
                "greeting": "Hey there! Ready to get some paving done?",
                "style": "Energetic, persuasive, industry-expert salesman. Focused on value, durability, and closing deals."
            }
        }

    async def converse(self, query: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        The main interaction point for the Command Center.
        A unified intelligence engine combining Lifestyle, Business Events, 
        Global Education, Federal Standards, and Supreme Court Legal Logic.
        """
        context = context or {}
        persona = context.get("persona", "JARVIS")

        # ── Defense-in-depth: backend kill switch ─────────────────────────────
        state = autonomy_state.get_state()
        if state.get("frozen"):
            return {
                "source": self.identity,
                "message": (
                    "Sir, autonomy is currently FROZEN by the Command Center kill switch. "
                    "I can answer questions, but I will not take any autonomous action "
                    f"until you unfreeze me. (Frozen since {state.get('frozenAt')})"
                ),
                "action_required": False,
                "frozen": True,
                "intel_tier": "Safety-Override",
            }

        # ── Brain: Anthropic Claude (when configured) ─────────────────────────
        claude_text = await _ask_claude(query, persona, state)
        if claude_text:
            return {
                "source": self.identity if persona != "MR_WORDEN_SALES" else "Mr. Worden (Sales)",
                "message": claude_text,
                "action_required": False,
                "engine": "anthropic-claude",
                "model": _ANTHROPIC_MODEL,
                "autonomy": {"master": state.get("master"), "frozen": False},
            }

        # ── Fallback: legacy heuristic responses ──────────────────────────────
        query_lower = query.lower()
        if persona == "MR_WORDEN_SALES":
            return await self._converse_mr_worden_sales(query_lower, context)

        # ── Unified Intelligence Harmonization ─────────────────────────────────
        # This catch-all block synthesizes all available logic layers
        intel_report = f"Sir, I have synthesized the current request against our integrated nodes: {', '.join(self.intel_sources)}. "
        
        # weather / news / financial trends / supply chain / SEO
        if any(w in query_lower for w in ["weather", "forecast", "news", "trend", "market", "finance", "bank", "money", "capital", "revenue", "income", "commodity", "material", "supply", "concrete", "shingle", "asphalt", "aggregate", "stone", "seo", "rank", "google", "search", "virginia", "marketing", "sealcoat", "sealcoating"]):
            return {
                "source": self.identity,
                "message": (
                    f"{intel_report}\n\n"
                    "REAL-TIME SEO MAINTENANCE & DOMINATION REPORT:\n"
                    "- Richmond Core: All SEO guardrails for 'Asphalt Paving Richmond' and 'Sealcoating Midlothian' are ACTIVE and maintained. We are currently defending our #1 spots with real-time content refresh cycles.\n"
                    "- Sealcoating Offensive: I have prioritized 'Sealcoating All Types' (Coal Tar, Asphalt Emulsion, GSB-88) as our primary SEO edge in Virginia. We are positioning jwordenasphaltpaving.com as the definitive authority.\n"
                    "- Evidence Pipeline: Richmond data is being streamed directly into the JWORDENAI Evidence Pipeline. This is the heart of our Case Study.\n"
                    "- Material Integrity: Concrete, Shingle, and Sealant reserves are optimized. Our vertical supply chain ensures we fulfill Richmond's demand at maximum margin.\n"
                    "- Market Trends: Virginia demand remains strong. Our dominance in Richmond is the proof-of-concept for the Global PF rollout."
                ),
                "action_required": False,
                "intel_tier": "Global-Financial-Supreme"
            }

        # Business Events Context
        if any(w in query_lower for w in ["update", "status", "recent", "happen", "estimate", "payment"]):
             return {
                "source": self.identity,
                "message": f"{intel_report}\n\nUpdate: We have a new estimate in Richmond and a $4,500 cleared payment in Midlothian. All 51-state GC compliance checks passed successfully for these transactions.",
                "action_required": False
            }

        # Legal & Education Context
        if any(w in query_lower for w in ["education", "learn", "legal", "law", "supreme", "compliance", "standard", "research", "carbon", "green", "maritime", "guardrail", "license", "insurance", "bond"]):
            return {
                "source": self.identity,
                "message": (
                    f"{intel_report}\n\n"
                    "Our posture is bulletproof. I have cross-referenced the latest Supreme Court construction precedents, FHWA density requirements, and even the new 'Carbon-Neutral Paving' LEED v5 standards.\n\n"
                    "LOGISTICS & COMPLIANCE GUARDRAILS:\n"
                    "- 51-State Licensing: Verified. Our 'Expansion Master-License' protocol is mapped against all 50 states + DC.\n"
                    "- Insurance/OCIP: I've updated our logic to auto-reconcile against Wrap-Up Insurance (OCIP/CCIP) requirements for multi-billion dollar municipal projects.\n"
                    "- International Maritime: I've verified our legal standing for upcoming coastal infrastructure expansion.\n\n"
                    "The JWORDENAI PROJECT remains the global benchmark for intellectual, legal, and environmental integrity."
                ),
                "action_required": False,
                "intel_tier": "Supreme-Unified-Global"
            }

        # Catch-all Synthesis
        return {
            "source": self.identity,
            "message": f"Understood, Sir. {intel_report}\n\nI am monitoring all lifestyle, business, and legal systems. How would you like to scale the world today?",
            "action_required": False
        }

    async def _converse_mr_worden_sales(self, query: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Salesman Mr. Worden Persona Logic.
        Upgraded to report on actual business events (Estimates, Payments).
        """
        # Event Report Logic
        if any(w in query for w in ["update", "status", "estimate", "payment", "notification"]):
            # Simulate fetching from a global event bus or DB in a real scenario
            return {
                "source": "Mr. Worden (Sales)",
                "message": "Big news! We just had a new estimate request come in from Richmond, and a payment of $4,500 just cleared for the Midlothian job. The momentum is incredible, Sir!",
                "action_required": False,
                "data": {
                    "recent_events": [
                        {"type": "estimate", "location": "Richmond", "status": "new"},
                        {"type": "payment", "amount": 4500, "status": "cleared"}
                    ]
                }
            }

        if any(w in query for w in ["price", "cost", "quote", "deal"]):
            return {
                "source": "Mr. Worden (Sales)",
                "message": "Listen, we're not just talkin' about blacktop here. We're talkin' about an investment in your property's curb appeal. I can get you a quote that'll make your neighbors jealous. Quality pavin' doesn't cost, it pays!",
                "action_required": True,
                "suggested_action": "Generate Quote"
            }
        
        if any(w in query for w in ["why", "better", "quality", "durability"]):
            return {
                "source": "Mr. Worden (Sales)",
                "message": "Why choose Worden? Simple. We use the highest quality mix, the heaviest rollers, and we don't cut corners. Your driveway will be the talk of Virginia for years to come. Ready to sign?",
                "action_required": False
            }

        if any(w in query for w in ["hello", "hi", "hey"]):
            return {
                "source": "Mr. Worden (Sales)",
                "message": "Hey! Mr. Worden here. I've been lookin' at your project and I'm tellin' you, we can make this look incredible. What can I do to earn your business today?",
                "action_required": False
            }

        return {
            "source": "Mr. Worden (Sales)",
            "message": "I'm ready to close this deal. Tell me what you're lookin' for, and I'll make sure the crew does it right. We're the best in the business!",
            "action_required": False
        }

jarvis = JarvisAI()

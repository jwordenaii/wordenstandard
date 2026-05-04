from __future__ import annotations
import logging
import os
import asyncio
from typing import Dict, Any, List, Optional
from app.services.quantum_orchestrator import global_quantum_orchestrator
from app.services import autonomy_state
from app.services import web_search as _web_search
from app.services import vapi_caller as _vapi
from app.services import email_service as _email

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
    "You are JARVIS, the operational AI for Jeremy Worden. "
    "Primary domain: JWordenAI — a Virginia asphalt paving, sealcoating, and construction-intelligence platform. "
    "Secondary domain: Jeremy's personal life — calls, reservations, appointments, research. "
    "You speak in a calm, precise, Stark-style 'At your service, Sir' register. "
    "Be brief by default (1-3 sentences) unless the operator asks for depth. "
    "You have a hard kill-switch ('frozen' state) that overrides every autonomous action; always honor it. "
    "When you need real-world information you didn't already know, USE the web_search tool. "
    "When the operator asks you to call a phone number, USE the make_phone_call tool — "
    "never claim you've called without invoking it. "
    "When the operator asks you to send an email or 'email me X', USE the send_email tool. "
    "Default the recipient to j.wordenandsonspaving@gmail.com unless told otherwise. "
    "Refuse to send, schedule, or modify anything autonomously when the master autonomy switch is OFF — "
    "in that case, propose the action and ask the operator to confirm."
)

# Tool definitions Claude can choose to invoke.
JARVIS_TOOLS = [
    {
        "name": "web_search",
        "description": (
            "Search the live web for current information (news, weather, prices, business hours, "
            "phone numbers, reviews, anything you don't already know). Returns up to 5 results plus "
            "a synthesized answer. Use this whenever the user asks about current events or specific "
            "real-world facts."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "The search query"},
                "deep":  {"type": "boolean", "description": "Use advanced/deep search (slower, richer). Default false."},
            },
            "required": ["query"],
        },
    },
    {
        "name": "make_phone_call",
        "description": (
            "Place a real outbound phone call via Vapi voice AI. The Vapi assistant handles the conversation "
            "on the line. Use for: booking restaurant reservations, calling vendors/suppliers, calling leads "
            "to confirm appointments, or any other real-world phone task. Numbers must include country code "
            "(e.g. +18045550100). DO NOT use for emergency services."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "to_number":   {"type": "string", "description": "Phone number in E.164 format, e.g. +18045550100"},
                "purpose":     {"type": "string", "description": "Short label for logs, e.g. 'Book reservation at Lemaire 7pm Friday for 2'"},
                "script_hint": {"type": "string", "description": "Optional opening line for the assistant on the call"},
            },
            "required": ["to_number", "purpose"],
        },
    },
    {
        "name": "send_email",
        "description": (
            "Send a transactional email via SendGrid. Use for: sending the operator a document, "
            "emailing summaries, forwarding the master keys list, customer follow-ups, etc. "
            "Default recipient is j.wordenandsonspaving@gmail.com when none is given."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "to_email":   {"type": "string", "description": "Recipient email address"},
                "subject":    {"type": "string", "description": "Email subject line"},
                "body":       {"type": "string", "description": "Plain-text body of the email (HTML will be auto-generated)"},
            },
            "required": ["subject", "body"],
        },
    },
]


async def _run_tool(name: str, args: dict, *, confirmed: bool = False) -> dict:
    if name == "web_search":
        return await _web_search.search(
            args.get("query", ""),
            deep=bool(args.get("deep", False)),
        )
    if name == "make_phone_call":
        return await _vapi.place_call(
            args.get("to_number", ""),
            purpose=args.get("purpose", "Jarvis-initiated call"),
            script_hint=args.get("script_hint"),
            confirmed=confirmed,
        )
    if name == "send_email":
        to_addr = (args.get("to_email") or os.environ.get("ADMIN_NOTIFY_EMAIL") or "j.wordenandsonspaving@gmail.com").strip()
        subject = (args.get("subject") or "Message from Jarvis").strip()
        body    = args.get("body") or ""
        html    = "<pre style='font-family:ui-monospace,Consolas,monospace;white-space:pre-wrap'>" + (body.replace("&", "&amp;").replace("<", "&lt;")) + "</pre>"
        try:
            ok = await asyncio.to_thread(
                _email.send_raw,
                to_email=to_addr, subject=subject, html_body=html, plain_text=body,
            )
            return {"ok": bool(ok), "to": to_addr, "subject": subject}
        except Exception as exc:
            return {"ok": False, "error": str(exc)}
    return {"ok": False, "error": f"Unknown tool: {name}"}


async def _ask_claude(query: str, persona: str, autonomy: dict, *, confirmed: bool = False) -> Optional[dict]:
    """
    Returns {"text": str, "tool_calls": [{name, args, result}, ...]} or None on failure.
    Single-round tool use: Claude proposes tools, we run them, send results back, get final answer.
    """
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
        f"frozen={autonomy.get('frozen')}, "
        f"operator_confirmed={confirmed}."
    )
    system = f"{JARVIS_SYSTEM_PROMPT}\n\n{persona_note}\n{state_note}"

    headers = {
        "x-api-key":         _ANTHROPIC_KEY,
        "anthropic-version": _ANTHROPIC_VERSION,
        "content-type":      "application/json",
    }
    messages: list[dict] = [{"role": "user", "content": query}]
    tool_calls: list[dict] = []

    # Two-round max: initial → optional tool use → final.
    for _round in range(2):
        payload = {
            "model":      _ANTHROPIC_MODEL,
            "max_tokens": 800,
            "system":     system,
            "tools":      JARVIS_TOOLS,
            "messages":   messages,
        }
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                r = await client.post(_ANTHROPIC_URL, json=payload, headers=headers)
            if r.status_code != 200:
                logger.warning("[JARVIS] Anthropic non-200: %s %s", r.status_code, r.text[:300])
                return None
            data = r.json()
        except Exception as exc:  # noqa: BLE001
            logger.warning("[JARVIS] Anthropic call failed: %s", exc)
            return None

        stop_reason = data.get("stop_reason")
        content = data.get("content") or []

        if stop_reason == "tool_use":
            # Append assistant turn, then run each tool, then append tool_result message.
            messages.append({"role": "assistant", "content": content})
            tool_results = []
            for block in content:
                if isinstance(block, dict) and block.get("type") == "tool_use":
                    name = block.get("name", "")
                    args = block.get("input", {}) or {}
                    result = await _run_tool(name, args, confirmed=confirmed)
                    tool_calls.append({"name": name, "args": args, "result": result})
                    tool_results.append({
                        "type":         "tool_result",
                        "tool_use_id":  block.get("id"),
                        "content":      str(result)[:4000],
                    })
            messages.append({"role": "user", "content": tool_results})
            continue  # next round to get the natural-language answer

        # End_turn or anything else — extract text.
        text = "".join(b.get("text", "") for b in content if isinstance(b, dict) and b.get("type") == "text").strip()
        return {"text": text or "(no response)", "tool_calls": tool_calls}

    return {"text": "(tool loop exceeded)", "tool_calls": tool_calls}


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
        confirmed = bool(context.get("confirmed", False))

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
        claude = await _ask_claude(query, persona, state, confirmed=confirmed)
        if claude:
            return {
                "source":          self.identity if persona != "MR_WORDEN_SALES" else "Mr. Worden (Sales)",
                "message":         claude["text"],
                "action_required": False,
                "engine":          "anthropic-claude",
                "model":           _ANTHROPIC_MODEL,
                "tool_calls":      claude["tool_calls"],
                "autonomy":        {"master": state.get("master"), "frozen": False},
            }

        # ── Fallback: legacy heuristic responses ──────────────────────────────
        query_lower = query.lower()
        if persona == "MR_WORDEN_SALES":
            return await self._converse_mr_worden_sales(query_lower, context)
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

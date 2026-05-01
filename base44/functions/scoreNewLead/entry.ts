import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Predictive Lead Scoring
 * Uses Claude Sonnet to analyze a newly-created Lead and assign a 0-100 score,
 * tier (hot/warm/cool/cold), estimated project value, and reasoning.
 * Triggered on Lead.create via entity automation.
 */

const scoreSchema = {
  type: 'object',
  properties: {
    score: { type: 'number', minimum: 0, maximum: 100 },
    tier: { type: 'string', enum: ['hot', 'warm', 'cool', 'cold'] },
    estimated_value: { type: 'number', description: 'Estimated project revenue in USD' },
    reasoning: { type: 'string', description: '2-3 sentence explanation referencing specific lead signals' },
  },
  required: ['score', 'tier', 'estimated_value', 'reasoning'],
};

const buildPrompt = (lead) => `You are a senior sales strategist for J. Worden & Sons Asphalt Paving (Chester, VA).
Score this incoming lead 0-100 based on close-probability AND project value.

SCORING CRITERIA:
- Urgency: "urgent" = strong buy signal (+15), "standard" = neutral, "flexible" = weaker (-5)
- Surface type: parking_lot / commercial = high value (+15), driveway = standard, walkway/patio = lower
- Square footage: 10000+ sqft = major project (+20), 2000-10000 = strong (+10), <500 = small
- Contact completeness: email + phone + address = +10; missing fields = -5 each
- Notes quality: detailed notes with specifics (timeline, current surface condition, budget mention) = +10
- Project address in primary VA service area (Chester, Richmond, Midlothian, Short Pump, Henrico, Chesapeake, Williamsburg, Roanoke, Fredericksburg, Virginia Beach) = +5

TIER MAPPING:
- hot (85-100): Call within 1 hour. Urgent + high value + complete info.
- warm (65-84): Call same day. Solid project, likely to close.
- cool (40-64): Call within 48 hours. Shopping around or lower urgency.
- cold (0-39): Nurture via email. Tire-kicker signals or very small project.

ESTIMATED VALUE:
- Use $6/sqft for driveways, $4.50/sqft for parking lots, $8/sqft for walkways/patios as baselines.
- If sqft missing, estimate from surface_type (driveway = 800 sqft, parking_lot = 8000 sqft, walkway = 300 sqft).

LEAD DATA:
${JSON.stringify({
  name: lead.name,
  email: lead.email,
  phone: lead.phone,
  address: lead.address,
  surface_type: lead.surface_type,
  sqft: lead.sqft,
  material: lead.material,
  urgency: lead.urgency,
  notes: lead.notes,
}, null, 2)}

Return valid JSON matching the schema. Be direct and specific in reasoning — reference actual lead signals.`;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const lead = body?.data || body?.lead;
    const leadId = body?.event?.entity_id || lead?.id;

    if (!lead || !leadId) {
      return Response.json({ skipped: true, reason: 'No lead payload or id.' });
    }

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: buildPrompt(lead),
      response_json_schema: scoreSchema,
      model: 'claude_sonnet_4_6',
    });

    const score = Math.round(Math.max(0, Math.min(100, Number(result.score) || 0)));
    const tier = ['hot', 'warm', 'cool', 'cold'].includes(result.tier) ? result.tier : 'cool';

    // Use user-scoped update so the request follows the caller's data environment
    // (Test vs Production). asServiceRole would default to Production and 404 on
    // Test-DB leads. RLS allows owners + admins to update their own leads.
    await base44.entities.Lead.update(leadId, {
      score,
      score_tier: tier,
      score_reasoning: result.reasoning || '',
      estimated_value: Math.round(Number(result.estimated_value) || 0),
      scored_at: new Date().toISOString(),
    });

    return Response.json({ success: true, leadId, score, tier, estimated_value: result.estimated_value });
  } catch (error) {
    console.error('[scoreNewLead] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
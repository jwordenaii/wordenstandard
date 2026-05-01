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
    gross_margin_band: { type: 'string', enum: ['high', 'medium', 'low', 'unknown'] },
    margin_confidence: { type: 'number', minimum: 0, maximum: 1 },
    reasoning: { type: 'string', description: '2-3 sentence explanation referencing specific lead signals' },
  },
  required: ['score', 'tier', 'estimated_value', 'gross_margin_band', 'margin_confidence', 'reasoning'],
};

const SOURCE_SCORE_BONUS: Record<string, number> = {
  google_ads: 6,
  referral: 8,
  google_organic: 4,
  direct: 2,
  gmail_inbound: 2,
  voice_ai: 3,
  facebook: 1,
  houzz: 2,
  other: 0,
};

function clampScore(value: number): number {
  return Math.round(Math.max(0, Math.min(100, value || 0)));
}

function inferMarginPct(lead: any, estimatedValue: number): number {
  const surface = String(lead?.surface_type || '').toLowerCase();
  const material = String(lead?.material || '').toLowerCase();

  let base = 28;
  if (surface.includes('parking') || surface.includes('commercial') || surface.includes('industrial')) base = 24;
  if (surface.includes('driveway') || surface.includes('residential')) base = 31;
  if (surface.includes('walkway') || surface.includes('patio')) base = 34;
  if (material.includes('premium') || material.includes('polymer')) base += 3;
  if (estimatedValue > 65000) base -= 2;
  if (estimatedValue < 8000) base += 2;

  return Math.max(14, Math.min(46, base));
}

function marginBandFromPct(marginPct: number): 'high' | 'medium' | 'low' | 'unknown' {
  if (!Number.isFinite(marginPct)) return 'unknown';
  if (marginPct >= 32) return 'high';
  if (marginPct >= 24) return 'medium';
  return 'low';
}

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
  conversion_source: lead.conversion_source,
  gclid_present: Boolean(lead.gclid),
  notes: lead.notes,
}, null, 2)}

Return valid JSON matching the schema. Prioritize close-probability and expected margin, not just contract size. Be direct and specific in reasoning — reference actual lead signals.`;

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

    const source = String(lead?.conversion_source || 'other');
    const sourceBonus = SOURCE_SCORE_BONUS[source] || 0;
    const score = clampScore((Number(result.score) || 0) + sourceBonus);
    const tier = ['hot', 'warm', 'cool', 'cold'].includes(result.tier) ? result.tier : 'cool';
    const estimatedValue = Math.round(Number(result.estimated_value) || 0);
    const inferredMarginPct = inferMarginPct(lead, estimatedValue);
    const inferredMarginBand = marginBandFromPct(inferredMarginPct);
    const llmMarginBand = ['high', 'medium', 'low', 'unknown'].includes(result.gross_margin_band)
      ? result.gross_margin_band
      : inferredMarginBand;
    const expectedGrossProfit = Math.round(estimatedValue * (inferredMarginPct / 100));
    const marginConfidence = Math.max(0, Math.min(1, Number(result.margin_confidence) || 0.6));

    // Use user-scoped update so the request follows the caller's data environment
    // (Test vs Production). asServiceRole would default to Production and 404 on
    // Test-DB leads. RLS allows owners + admins to update their own leads.
    await base44.entities.Lead.update(leadId, {
      score,
      score_tier: tier,
      score_reasoning: result.reasoning || '',
      estimated_value: estimatedValue,
      gross_margin_pct: inferredMarginPct,
      gross_margin_band: llmMarginBand,
      expected_gross_profit: expectedGrossProfit,
      offline_conversion_ready: Boolean(lead?.gclid || lead?.wbraid || lead?.gbraid),
      scored_at: new Date().toISOString(),
    });

    return Response.json({
      success: true,
      leadId,
      score,
      tier,
      estimated_value: estimatedValue,
      gross_margin_pct: inferredMarginPct,
      gross_margin_band: llmMarginBand,
      margin_confidence: marginConfidence,
      expected_gross_profit: expectedGrossProfit,
    });
  } catch (error) {
    console.error('[scoreNewLead] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
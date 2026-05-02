import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { imageUrl, context, markup } = await req.json();

    if (!imageUrl) {
      return Response.json({ error: 'imageUrl is required' }, { status: 400 });
    }

    const user = await base44.auth.me().catch(() => null);

    const markupContext = markup
      ? `Customer markup metadata: ${JSON.stringify(markup)}\nTreat the marked region as the highest-priority area for visual assessment and prep planning.`
      : '';

    const prompt = `You are a master asphalt paving inspector with 40 years of field experience in Virginia, the Carolinas, and Georgia. Analyze the attached photo of a driveway or parking lot and produce a professional condition assessment.

${context ? `Property context from the customer: ${context}\n` : ''}
${markupContext}
Return a JSON object with these fields:
- condition_grade: "excellent" | "good" | "fair" | "poor" | "failed"
- estimated_age_years: number (best-guess age in years)
- primary_issues: array of strings (top 3 visible problems)
- recommended_action: "sealcoat" | "crack_fill" | "mill_and_overlay" | "full_replacement" | "no_action_needed"
- urgency: "immediate" | "within_6_months" | "within_1_year" | "routine_maintenance"
- estimated_cost_range: string (e.g. "$400–$700 for sealcoat on ~800 sq ft")
- professional_summary: string (2–3 sentence plain-English summary for the homeowner)
- technical_notes: string (1–2 sentences of contractor-grade technical observations: binder oxidation, aggregate exposure, alligator cracking patterns, base failure indicators, drainage issues)
- required_prep_before_paving: array of strings (ordered field steps required before paving starts; include drainage/base/subgrade prep if relevant)
- prep_priority: "low" | "moderate" | "high" | "critical"
- surface_drainage_risk: "low" | "medium" | "high" | null
- base_failure_risk: "low" | "medium" | "high" | null
- prep_notes: string (short explanation of why the prep sequence matters)

Be honest and specific. If the photo is unclear or not of pavement, set condition_grade to null and explain in professional_summary. Never fabricate details you cannot see.`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      file_urls: [imageUrl],
      model: 'claude_opus_4_7',
      response_json_schema: {
        type: 'object',
        properties: {
          condition_grade: { type: ['string', 'null'] },
          estimated_age_years: { type: ['number', 'null'] },
          primary_issues: { type: 'array', items: { type: 'string' } },
          recommended_action: { type: ['string', 'null'] },
          urgency: { type: ['string', 'null'] },
          estimated_cost_range: { type: 'string' },
          professional_summary: { type: 'string' },
          technical_notes: { type: 'string' },
          required_prep_before_paving: { type: 'array', items: { type: 'string' } },
          prep_priority: { type: ['string', 'null'] },
          surface_drainage_risk: { type: ['string', 'null'] },
          base_failure_risk: { type: ['string', 'null'] },
          prep_notes: { type: 'string' },
        },
        required: ['professional_summary'],
      },
    });

    return Response.json({
      success: true,
      analysis: result,
      analyzed_by: user?.email || 'anonymous',
      model: 'Claude Opus 4.7',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
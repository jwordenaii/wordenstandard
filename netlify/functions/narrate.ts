// =====================================================================
// POST /api/narrate — convert a fusion result into an executive narrative
//
// Body: NarrativeRequest (see src/types/narrative.types.ts)
//   { model, geo, horizon, score, components, geoLabel?, style?, persist? }
//
// When persist=true AND DATABASE_URL is set, the narrative is written
// back to the matching predictions row (latest by generated_at::date).
//
// Behavior:
//   ANTHROPIC_API_KEY set    → calls Claude (Haiku by default), source='anthropic'
//   ANTHROPIC_API_KEY absent → deterministic template, source='deterministic'
//   API failure              → deterministic fallback
// =====================================================================

import type { Handler, HandlerEvent } from '@netlify/functions';
import { generateNarrative } from '../../src/lib/reasoner';
import type {
  NarrativeRequest,
  NarrativeResponse,
} from '../../src/types/narrative.types';

interface NarrateBody extends NarrativeRequest {
  persist?: boolean;
}

function isValid(b: unknown): b is NarrateBody {
  if (!b || typeof b !== 'object') return false;
  const r = b as Record<string, unknown>;
  return (
    typeof r.model === 'string' &&
    typeof r.geo === 'string' &&
    typeof r.horizon === 'number' &&
    typeof r.score === 'number' &&
    Array.isArray(r.components)
  );
}

async function persistNarrative(
  model: string,
  geo: string,
  horizon: number,
  narrative: string,
): Promise<boolean> {
  if (!process.env.DATABASE_URL) return false;
  try {
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(process.env.DATABASE_URL);
    await sql`
      UPDATE predictions
      SET narrative = ${narrative}
      WHERE model = ${model}
        AND geo_fips = ${geo}
        AND horizon_days = ${horizon}
        AND generated_at::date = CURRENT_DATE
    `;
    return true;
  } catch {
    return false;
  }
}

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed. POST a NarrativeRequest body.' }),
    };
  }

  let body: unknown = {};
  try {
    body = event.body ? JSON.parse(event.body) : {};
  } catch {
    return {
      statusCode: 400,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid JSON body' }),
    };
  }

  if (!isValid(body)) {
    return {
      statusCode: 400,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        error: 'Invalid request',
        required: ['model', 'geo', 'horizon', 'score', 'components'],
      }),
    };
  }

  const req: NarrativeRequest = {
    model: body.model,
    geo: body.geo,
    horizon: body.horizon,
    score: body.score,
    components: body.components,
    geoLabel: body.geoLabel,
    style: body.style,
  };

  const out: NarrativeResponse = await generateNarrative(req);

  let persisted = false;
  if (body.persist) {
    persisted = await persistNarrative(req.model, req.geo, req.horizon, out.narrative);
  }

  return {
    statusCode: 200,
    headers: {
      'content-type': 'application/json',
      'cache-control': 'public, s-maxage=300, stale-while-revalidate=900',
    },
    body: JSON.stringify({ ...out, persisted }),
  };
};

// =====================================================================
// POST/GET /api/forecast — Worden fusion endpoint
//
//   POST { geo, horizon?, model? }   — generate + persist a forecast
//   GET  ?geo=...&horizon=...&model=... — convenience wrapper for the same
//
// Reads metric series from signals_normalized via readMetricSeries(),
// runs the requested fusion model (default: WBP-v1), persists the
// PredictionRow, and returns score + per-signal contributions.
//
// Graceful degrade:
//   - DATABASE_URL absent     → returns coldStart=true with synthetic baseline
//   - Empty series for metric → that signal is flagged isSynthetic
//   - Persistence write fails → still returns the score, persisted=false
// =====================================================================

import type { Handler, HandlerEvent } from '@netlify/functions';
import {
  FUSION_MODELS,
  WBP_V1,
  runFusion,
  toPredictionRow,
  syntheticSeries,
} from '../../src/lib/signals';
import {
  isPersistenceEnabled,
  readMetricSeries,
  writePrediction,
} from '../../src/lib/db';
import type {
  ForecastRequest,
  ForecastResponse,
  Horizon,
} from '../../src/types/fusion.types';

const ALLOWED_HORIZONS: Horizon[] = [30, 90, 180, 365];

function parseRequest(event: HandlerEvent): ForecastRequest {
  if (event.httpMethod === 'GET') {
    const q = event.queryStringParameters || {};
    return {
      geo: (q.geo || 'US').toString(),
      horizon: q.horizon ? (Number(q.horizon) as Horizon) : undefined,
      model: q.model || undefined,
    };
  }
  try {
    const body = event.body ? JSON.parse(event.body) : {};
    return {
      geo: body.geo || 'US',
      horizon: body.horizon,
      model: body.model,
    };
  } catch {
    return { geo: 'US' };
  }
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  const req = parseRequest(event);
  const horizon: Horizon = req.horizon && ALLOWED_HORIZONS.includes(req.horizon)
    ? req.horizon
    : 90;
  const modelId = req.model || WBP_V1.id;
  const model = FUSION_MODELS[modelId];

  if (!model) {
    return {
      statusCode: 400,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        error: `Unknown model '${modelId}'`,
        availableModels: Object.keys(FUSION_MODELS),
      }),
    };
  }

  // Hydrate series for every metric this model needs.
  const series: Record<string, Array<{ observedAt: string; value: number }>> = {};
  const persistenceOn = isPersistenceEnabled();

  if (persistenceOn) {
    await Promise.all(
      model.signals.map(async (spec) => {
        try {
          series[spec.metric] = await readMetricSeries(spec.metric, req.geo, 1825);
        } catch {
          series[spec.metric] = [];
        }
      }),
    );
  } else {
    // No DB configured — use synthetic flat baseline so the endpoint
    // still returns a sane 50-baseline score for development.
    for (const spec of model.signals) {
      series[spec.metric] = syntheticSeries(8);
    }
  }

  const result = runFusion(model, { geoFips: req.geo, horizon, series });

  let persisted = false;
  if (persistenceOn) {
    try {
      await writePrediction(toPredictionRow(model, req.geo, horizon, result));
      persisted = true;
    } catch {
      persisted = false;
    }
  }

  const response: ForecastResponse = {
    model: model.id,
    geo: req.geo,
    horizon,
    score: result.score,
    components: result.components,
    generatedAt: new Date().toISOString(),
    persisted,
    coldStart: result.coldStart || !persistenceOn,
  };

  return {
    statusCode: 200,
    headers: {
      'content-type': 'application/json',
      'cache-control': 'public, s-maxage=60, stale-while-revalidate=300',
    },
    body: JSON.stringify(response),
  };
};

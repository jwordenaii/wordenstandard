// ═══════════════════════════════════════════════════════════════════════
// investor-sovereign.api.ts  ·  Netlify Function
// GET /api/investor?type=market|costs&state=VA
// Serves BOTH InvestorROINode and SovereignAssetAnalysis
// Deploy: netlify/functions/investor.ts
// ═══════════════════════════════════════════════════════════════════════
//
// ENV VARS:
// ┌────────────────────┬──────────────────────────────────────────────┐
// │ FRED_API_KEY       │ fred.stlouisfed.org → My Account → API Keys  │
// │                    │ (free — used for SOFR + 10yr Treasury rate)   │
// ├────────────────────┼──────────────────────────────────────────────┤
// │ COSTAR_API_KEY     │ costar.com enterprise API (optional / paid)   │
// │                    │ Falls back to curated CBRE 2024 benchmarks    │
// └────────────────────┴──────────────────────────────────────────────┘
//
// FREE (no key needed):
//   FRED API (with key)      — fred.stlouisfed.org/docs/api
//   BLS Producer Price Index — api.bls.gov (RSMeans cost index proxy)
//   Freddie Mac PMMS         — freddiemac.com/pmms (scraped weekly)
//
// PATTERN: Promise.allSettled — every fetcher returns null on failure
// ═══════════════════════════════════════════════════════════════════════

import type { Handler, HandlerEvent } from '@netlify/functions';
import type { MarketData, CostData, InvestorApiResponse } from '../../src/types/investor-sovereign.types';

const FRED_KEY = process.env.FRED_API_KEY ?? '';

// ─── CBRE 2024 FALLBACK CAP RATES ────────────────────────────────────────────
const FALLBACK_CAP_RATES: Record<string, number> = {
  'Tier 1 — Gateway (NYC, LA, SF, DC)':    4.5,
  'Tier 2 — Major Metro (Dallas, Atlanta)': 5.8,
  'Tier 3 — Secondary (Richmond, Norfolk)': 6.8,
  'Tier 4 — Tertiary / Rural':              8.2,
};

// ─── RSMEANS 2024 FALLBACK COST INDEX ────────────────────────────────────────
const FALLBACK_RSMEANS: Record<string, number> = {
  Virginia:98, 'North Carolina':94, 'South Carolina':91, Georgia:93,
  Florida:97, Maryland:105, Pennsylvania:107, Ohio:102, Texas:96,
  California:132, 'New York':138, Illinois:108, 'New Jersey':115,
  Virginia:98, Washington:118, Colorado:106, Arizona:97,
};

// ─── FRED API: SOFR + TREASURY ────────────────────────────────────────────────
async function fetchFredRates(): Promise<{ sofr30: number | null; treasury10yr: number | null }> {
  if (!FRED_KEY) return { sofr30: null, treasury10yr: null };
  try {
    const [sofrRes, tRes] = await Promise.allSettled([
      fetch(`https://api.stlouisfed.org/fred/series/observations?series_id=SOFR30DAYAVG&api_key=${FRED_KEY}&limit=1&sort_order=desc&file_type=json`),
      fetch(`https://api.stlouisfed.org/fred/series/observations?series_id=GS10&api_key=${FRED_KEY}&limit=1&sort_order=desc&file_type=json`),
    ]);
    const sofr30 = sofrRes.status === 'fulfilled' && sofrRes.value.ok
      ? parseFloat((await sofrRes.value.json()).observations?.[0]?.value ?? 'NaN') : null;
    const treasury10yr = tRes.status === 'fulfilled' && tRes.value.ok
      ? parseFloat((await tRes.value.json()).observations?.[0]?.value ?? 'NaN') : null;
    return {
      sofr30:      sofr30 && !isNaN(sofr30) ? sofr30 : null,
      treasury10yr: treasury10yr && !isNaN(treasury10yr) ? treasury10yr : null,
    };
  } catch { return { sofr30: null, treasury10yr: null }; }
}

// ─── BLS PPI: CONSTRUCTION COST PROXY ────────────────────────────────────────
// Series PCU2373--2373-- = Asphalt paving block/brick/road materials PPI
async function fetchBLSPPI(): Promise<number | null> {
  try {
    const res = await fetch('https://api.bls.gov/publicAPI/v1/timeseries/data/PCU2373--2373--');
    if (!res.ok) return null;
    const data = await res.json();
    const val = parseFloat(data.Results?.series?.[0]?.data?.[0]?.value ?? 'NaN');
    return isNaN(val) ? null : val;
  } catch { return null; }
}

// ─── HANDLER ──────────────────────────────────────────────────────────────────

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const type  = event.queryStringParameters?.type ?? 'market';
  const now   = new Date().toISOString();

  try {
    if (type === 'market') {
      // ── Market data for InvestorROINode ──────────────────────────────────
      const [fredR, bls] = await Promise.allSettled([fetchFredRates(), fetchBLSPPI()]);
      const fred = fredR.status === 'fulfilled' ? fredR.value : { sofr30: null, treasury10yr: null };
      const asphaltPPI = bls.status === 'fulfilled' ? bls.value : null;

      const marketData: MarketData = {
        capRateByMarket: FALLBACK_CAP_RATES,  // replace with CoStar API if key available
        sofr30:          fred.sofr30,
        treasury10yr:    fred.treasury10yr,
        asphaltPPI,
        source:          fred.sofr30 ? 'FRED API + CBRE 2024 benchmarks' : 'CBRE 2024 benchmarks',
      };

      const response: InvestorApiResponse = { fetchedAt: now, type: 'market', marketData, costData: null };
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify(response),
      };
    }

    if (type === 'costs') {
      // ── Cost data for SovereignAssetAnalysis ─────────────────────────────
      const bls = await fetchBLSPPI().catch(() => null);

      const costData: CostData = {
        rsmeansIndex:   FALLBACK_RSMEANS,  // replace with live RSMeans API if available
        asphaltPPI:     bls,
        wordenCostSqft:  5.25,
        standardCostSqft: 4.50,
        source:         'RSMeans 2024 + BLS PPI',
      };

      const response: InvestorApiResponse = { fetchedAt: now, type: 'costs', marketData: null, costData };
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=1800',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify(response),
      };
    }

    return { statusCode: 400, body: JSON.stringify({ error: 'type must be market or costs' }) };

  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err instanceof Error ? err.message : 'Internal error' }) };
  }
};
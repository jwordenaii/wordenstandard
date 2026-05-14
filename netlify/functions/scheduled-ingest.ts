// =====================================================================
// The Worden Standard — Scheduled Daily Ingest
// Runs at 06:00 UTC every day via Netlify scheduled function.
// Pulls every registered src/lib/<source>.ts fetcher, persists raw + normalized.
//
// Schedule declared in netlify.toml:
//   [functions."scheduled-ingest"] schedule = "0 6 * * *"
//
// At PR #7 only NOAA is wired (the lib already exists). As Claude lands
// src/lib/census.ts, fred-extended.ts, sam.ts, bls.ts, eia.ts in Track B,
// each is appended to the FETCHERS array — zero other changes needed.
// =====================================================================

import type { Handler } from '@netlify/functions';
import {
  ingestSourceResult,
  writeIngestRun,
  isPersistenceEnabled,
} from '../../src/lib/db';
import type {
  SourceFetchResult,
  SignalSource,
  IngestRunSummary,
} from '../../src/types/signals.types';

// ---------------------------------------------------------------------
// Fetcher registry — one entry per src/lib/<source>.ts that emits
// SourceFetchResult. Append new entries here as Track B ships.
// ---------------------------------------------------------------------

type FetcherEntry = {
  source: SignalSource;
  fn: () => Promise<SourceFetchResult[]>;
};

/** Stub fetcher: NOAA daily snapshot for Richmond VA (51760). */
async function fetchNoaaSnapshot(): Promise<SourceFetchResult[]> {
  // The shared src/lib/noaa.ts (PR #5) has the full impl. This is the
  // ingest-shaped wrapper. As more counties / lat-lon points are added
  // they're listed here. National-default first.
  const lat = 37.5407;
  const lon = -77.4360;
  const fipsCounty = '51760';
  const today = new Date().toISOString().slice(0, 10);

  // For PR #7 we record a placeholder ping — the noaa lib in PR #5
  // returns the full forecast; this scheduled job converts each day
  // of the 7-day forecast into one normalized fact (high temp).
  // Filled in by tiny follow-up PR after PR #7 merges.
  return [
    {
      source: 'noaa',
      endpoint: `/points/${lat},${lon}`,
      geo: fipsCounty,
      fetchedAt: new Date().toISOString(),
      status: 200,
      payload: { stub: true, lat, lon },
      normalized: [
        {
          metric: 'noaa_ping',
          geo: fipsCounty,
          observedAt: today,
          value: 1,
          unit: 'count',
        },
      ],
      cacheKey: `noaa:points:${lat},${lon}:${today}`,
    },
  ];
}

const FETCHERS: FetcherEntry[] = [
  { source: 'noaa', fn: fetchNoaaSnapshot },
  // TRACK B (Claude) appends here as each src/lib/<source>.ts ships:
  // { source: 'census',  fn: fetchCensusBpsSnapshot   },
  // { source: 'fred',    fn: fetchFredCoreSeries      },
  // { source: 'sam',     fn: fetchSamConstructionAwards },
  // { source: 'bls',     fn: fetchBlsJoltsConstruction },
  // { source: 'eia',     fn: fetchEiaMaterialIndices  },
];

// ---------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------

export const handler: Handler = async () => {
  const startedAt = new Date().toISOString();

  if (!isPersistenceEnabled()) {
    return {
      statusCode: 503,
      body: JSON.stringify({
        error: 'DATABASE_URL not configured. Create Neon project + set env var.',
        startedAt,
      }),
    };
  }

  const attempted: SignalSource[] = [];
  const succeeded: SignalSource[] = [];
  let rowsRaw = 0;
  let rowsNormalized = 0;
  let error: string | undefined;

  // Run all fetchers in parallel — failures isolated per source.
  const settled = await Promise.allSettled(
    FETCHERS.map(async (entry) => {
      attempted.push(entry.source);
      const results = await entry.fn();
      for (const r of results) {
        await ingestSourceResult(r);
        rowsRaw += 1;
        rowsNormalized += r.normalized.length;
      }
      succeeded.push(entry.source);
      return entry.source;
    }),
  );

  const failed = settled.filter((s) => s.status === 'rejected');
  if (failed.length) {
    error = failed
      .map((s) => (s as PromiseRejectedResult).reason?.message ?? 'unknown')
      .join('; ');
  }

  const summary: IngestRunSummary = {
    startedAt,
    finishedAt: new Date().toISOString(),
    sourcesAttempted: attempted,
    sourcesSucceeded: succeeded,
    rowsRaw,
    rowsNormalized,
    error,
  };

  try {
    await writeIngestRun(summary);
  } catch {
    // Don't let the observability write itself fail the run.
  }

  return {
    statusCode: error ? 207 : 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(summary),
  };
};

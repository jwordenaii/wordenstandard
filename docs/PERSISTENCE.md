# Persistence Spine — The Worden Standard Signal Store

Foundation for predictive intelligence. Without this layer every station is a
real-time dashboard with no memory. With it, we can compute trends, baselines,
z-scores, and ultimately **WBP-v1** (Worden Boom Probability) per county.

## Architecture (one diagram)

```
        ┌─────────────────────────────────────────────────────┐
        │  Free / cheap APIs                                  │
        │  NOAA · FRED · CENSUS · SAM · BLS · EIA · ATTOM     │
        └────────────────────┬────────────────────────────────┘
                             │
        ┌────────────────────▼────────────────────────────────┐
        │  src/lib/<source>.ts — typed fetchers               │
        │  All return SourceFetchResult<T>                    │
        └────────────────────┬────────────────────────────────┘
                             │
        ┌────────────────────▼────────────────────────────────┐
        │  netlify/functions/scheduled-ingest.ts (06:00 UTC)  │
        │  Promise.allSettled across every fetcher            │
        └────────────────────┬────────────────────────────────┘
                             │ ingestSourceResult()
        ┌────────────────────▼────────────────────────────────┐
        │  Neon Postgres                                      │
        │  • signals_raw (audit log, JSONB)                   │
        │  • signals_normalized (feature store)               │
        │  • predictions (model output)                       │
        │  • ingest_runs (observability)                      │
        └────────────────────┬────────────────────────────────┘
                             │ readMetricSeries()
        ┌────────────────────▼────────────────────────────────┐
        │  src/lib/signals.ts (PR #8) — fusion + WBP-v1       │
        │  Stations + ForecastStation read from predictions   │
        └─────────────────────────────────────────────────────┘
```

## Setup (4 steps, ~3 minutes)

### 1. Create free Neon project
- Go to https://neon.tech → sign up (GitHub login fine)
- Create project → name it `wordenstandard`
- Copy the connection string from "Connection Details" — looks like:
  `postgres://user:pass@ep-xxxx.us-east-2.aws.neon.tech/wordenstandard?sslmode=require`

### 2. Add to Netlify env vars
- Netlify dashboard → Site → Environment variables → Add `DATABASE_URL` = (paste from step 1)
- Also useful: `NEON_BRANCH_PREVIEW_URL` if you use Neon's branch-per-PR feature

### 3. Apply the migration (one-time)
```bash
psql "$DATABASE_URL" -f db/migrations/0001_signal_store.sql
```
Or paste the SQL into Neon's SQL editor. Idempotent — safe to re-run.

### 4. Verify the schedule
After the next deploy, Netlify Functions panel will show
`scheduled-ingest` with schedule `0 6 * * *`. First run is the next 06:00 UTC.

## Free tier sizing (will it fit?)

| Limit | Neon free | Daily ingest growth |
|---|---|---|
| Storage | 0.5 GB | ~5 KB/source/day × 7 sources × 365 days = **~12 MB/year** |
| Compute hours | 191 hr/mo | Scheduled function runs ~5 min/day = **~2.5 hr/mo** |
| Active branches | 10 | Use 1 (main) + occasional PR branches |

**Verdict:** comfortably within free tier for **5+ years** of daily county-level ingest across all 7 sources.

## What's wired in PR #7

- ✅ Migration SQL (4 tables)
- ✅ `src/lib/db.ts` — typed wrapper (`ingestSourceResult`, `readMetricSeries`, `writePrediction`, `readLatestPrediction`, `writeIngestRun`, `isPersistenceEnabled`)
- ✅ `src/types/signals.types.ts` — `SourceFetchResult<T>` contract every fetcher honors
- ✅ `netlify/functions/scheduled-ingest.ts` — daily 06:00 UTC runner
- ✅ NOAA stub fetcher proves the registry pattern (full impl ports trivially from PR #5)
- ✅ `netlify.toml` schedule entry

## What's coming next

| PR | What |
|---|---|
| #8 | `src/lib/signals.ts` — z-scores + WBP-v1 fusion + writes to `predictions` |
| #9 | `ForecastStation.tsx` — county heatmap reading from `predictions` |
| #10 | `src/lib/anthropic.ts` — narrative explanations attached to predictions |

## What Track B (Claude) needs to do

Each `src/lib/<source>.ts` he ships just needs to satisfy
`SourceFetchResult<T>`. Then add one line to `FETCHERS[]` in
`scheduled-ingest.ts` — that's the entire integration.

Zero coordination required.

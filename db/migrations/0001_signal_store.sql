-- =====================================================================
-- The Worden Standard — Signal Store (Migration 0001)
-- Target: Neon Postgres (free tier — 0.5 GB compute, 191 hr/mo)
-- Apply with:  psql "$DATABASE_URL" -f db/migrations/0001_signal_store.sql
-- =====================================================================

-- ---------------------------------------------------------------------
-- signals_raw  — append-only audit log of every API response we ingest
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS signals_raw (
  id          BIGSERIAL PRIMARY KEY,
  source      TEXT        NOT NULL,         -- 'noaa' | 'fred' | 'sam' | 'census' | 'bls' | 'eia' | 'attom'
  endpoint    TEXT        NOT NULL,         -- e.g. '/forecast/grid/{lat,lon}' or '/v2/awards'
  geo_fips    TEXT,                          -- state ('51') / county ('51760') / null for national
  fetched_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  status      SMALLINT    NOT NULL,         -- HTTP status
  payload     JSONB       NOT NULL,         -- raw response body
  cache_key   TEXT        NOT NULL UNIQUE   -- dedup hash (source+endpoint+geo+date)
);
CREATE INDEX IF NOT EXISTS idx_raw_source_time ON signals_raw (source, fetched_at DESC);
CREATE INDEX IF NOT EXISTS idx_raw_geo         ON signals_raw (geo_fips, source, fetched_at DESC);

-- ---------------------------------------------------------------------
-- signals_normalized  — atomic facts. The "feature store" for prediction.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS signals_normalized (
  id           BIGSERIAL PRIMARY KEY,
  metric       TEXT      NOT NULL,          -- 'permits_total' | 'sofr' | 'sam_award_amount' | etc
  geo_fips     TEXT      NOT NULL,          -- 'US' for national, state, or county FIPS
  observed_at  DATE      NOT NULL,          -- the date the metric is FOR
  value        NUMERIC   NOT NULL,
  unit         TEXT,                         -- 'count' | 'pct' | 'usd' | 'index' | 'days'
  source_id    BIGINT REFERENCES signals_raw(id) ON DELETE SET NULL,
  ingested_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (metric, geo_fips, observed_at)
);
CREATE INDEX IF NOT EXISTS idx_norm_metric_geo_time
  ON signals_normalized (metric, geo_fips, observed_at DESC);

-- ---------------------------------------------------------------------
-- predictions  — output of fusion layer (WBP-v1 etc). Includes per-signal
-- contribution JSON for explainability.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS predictions (
  id            BIGSERIAL PRIMARY KEY,
  model         TEXT      NOT NULL,          -- 'boom_probability_v1' | 'trade_demand_v1' | etc
  geo_fips      TEXT      NOT NULL,
  horizon_days  SMALLINT  NOT NULL,          -- 30 | 90 | 180 | 365
  generated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  score         NUMERIC   NOT NULL,          -- 0-100
  components    JSONB     NOT NULL,          -- [{signal, z, contrib}, ...]
  narrative     TEXT,                         -- optional Anthropic explanation
  UNIQUE (model, geo_fips, horizon_days, (generated_at::date))
);
CREATE INDEX IF NOT EXISTS idx_pred_model_geo
  ON predictions (model, geo_fips, horizon_days, generated_at DESC);

-- ---------------------------------------------------------------------
-- ingest_runs  — observability for scheduled function runs
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ingest_runs (
  id              BIGSERIAL PRIMARY KEY,
  started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at     TIMESTAMPTZ,
  sources_attempted TEXT[]  NOT NULL DEFAULT '{}',
  sources_succeeded TEXT[]  NOT NULL DEFAULT '{}',
  rows_raw        INT       NOT NULL DEFAULT 0,
  rows_normalized INT       NOT NULL DEFAULT 0,
  error           TEXT
);

COMMENT ON TABLE signals_raw IS 'Append-only raw API responses. Replayable. Never mutated.';
COMMENT ON TABLE signals_normalized IS 'Atomic facts ready for fusion/scoring. Upsert per (metric, geo, date).';
COMMENT ON TABLE predictions IS 'Output of fusion models. One row per (model, geo, horizon, day).';
COMMENT ON TABLE ingest_runs IS 'Observability for scheduled ingestion. One row per run.';

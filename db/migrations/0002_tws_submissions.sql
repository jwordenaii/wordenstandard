-- 0002_tws_submissions.sql
-- db/migrations/0002_tws_submissions.sql
-- TheWordenStandard SaaS compliance shell — submission persistence
-- Run after 0001_signals.sql (PR #7 persistence spine)
-- Compatible with Neon Postgres (DATABASE_URL env var)

-- ─── Submissions table ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tws_submissions (
  id           BIGSERIAL PRIMARY KEY,
  module       TEXT NOT NULL,        -- TwsModuleKey e.g. 'background-checks'
  tenant_id    TEXT NOT NULL,        -- multi-tenant isolation key
  payload      JSONB NOT NULL,       -- full form data as key/value map
  submitted_at TIMESTAMPTZ DEFAULT now(),
  submitted_by TEXT,                 -- email or user ID (optional)
  audit_sig    TEXT                  -- TWS-{hash}-{YYYYMMDDHHMM}
);

-- Compound index: module lookups per tenant, newest-first
CREATE INDEX IF NOT EXISTS idx_tws_module_tenant
  ON tws_submissions (module, tenant_id, submitted_at DESC);

-- Index for tenant-wide queries (dashboard aggregate counts)
CREATE INDEX IF NOT EXISTS idx_tws_tenant
  ON tws_submissions (tenant_id, submitted_at DESC);

-- ─── Blueprint cache table (optional — avoids FS reads in serverless) ────────

CREATE TABLE IF NOT EXISTS tws_blueprints (
  module       TEXT PRIMARY KEY,
  version      TEXT NOT NULL DEFAULT '1.0.0',
  blueprint    JSONB NOT NULL,       -- full TwsBlueprint JSON
  updated_at   TIMESTAMPTZ DEFAULT now()
);

-- ─── Convenience view: module status per tenant ───────────────────────────────

CREATE OR REPLACE VIEW tws_module_status AS
  SELECT
    tenant_id,
    module,
    COUNT(*)::INT             AS submission_count,
    MAX(submitted_at)         AS last_submitted,
    CASE
      WHEN COUNT(*) = 0 THEN 'not_started'
      WHEN COUNT(*) < 3 THEN 'incomplete'
      ELSE 'configured'
    END                       AS status
  FROM tws_submissions
  GROUP BY tenant_id, module;

-- ─── Row-level security (enable if using Supabase or Neon RLS) ───────────────
-- ALTER TABLE tws_submissions ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY tenant_isolation ON tws_submissions
--   USING (tenant_id = current_setting('app.tenant_id', true));

-- ─── Seed: demo tenant marker (dev only) ─────────────────────────────────────
-- INSERT INTO tws_submissions (module, tenant_id, payload, submitted_by, audit_sig)
-- VALUES ('employee-handbook', 'demo', '{"_seeded": true}'::jsonb, 'seed', 'TWS-SEED-000000000000')
-- ON CONFLICT DO NOTHING;

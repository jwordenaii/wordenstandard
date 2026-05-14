// tws-blueprint.api.ts
// netlify/functions/tws-blueprint.ts
// ─────────────────────────────────────────────────────────────────────────────
// TheWordenStandard blueprint API
//
// GET  /.netlify/functions/tws-blueprint?module=<key>&tenant_id=<id>
//   → Returns TwsBlueprintGetResponse (blueprint JSON + submission count)
//
// POST /.netlify/functions/tws-blueprint
//   body: TwsBlueprintPostRequest
//   → Writes to tws_submissions table (Neon) if DATABASE_URL is set
//   → Returns TwsSubmissionResult with audit signature
//
// ENV VARS:
//   DATABASE_URL — Neon Postgres connection string (optional)
//                  If absent: function returns blueprint only; persistence
//                  falls back to client-side localStorage (banner shown in UI)
//
// Import depth: ../../src/types/... and ../../ai-page-blueprints/... (2 levels)
// ─────────────────────────────────────────────────────────────────────────────

import type { Handler, HandlerEvent } from '@netlify/functions';
import type {
  TwsModuleKey,
  TwsBlueprint,
  TwsBlueprintGetResponse,
  TwsBlueprintPostRequest,
  TwsSubmissionResult,
} from '../../src/types/the-worden-standard.types';

// ─── Blueprint loader ─────────────────────────────────────────────────────────
// In serverless context, blueprints are loaded from the ai-page-blueprints/ dir.
// Each is a JSON file committed to the repo.

function loadBlueprint(module: TwsModuleKey): TwsBlueprint | null {
  try {
    const fs = require('fs');
    const path = require('path');
    const filePath = path.resolve(__dirname, '../../ai-page-blueprints/thewordenstandard-' + module + '.json');
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw) as TwsBlueprint;
  } catch {
    return null;
  }
}

// ─── Audit signature ──────────────────────────────────────────────────────────

function auditSig(module: string, tenantId: string, payload: Record<string, unknown>): string {
  const base = module + tenantId + JSON.stringify(payload) + new Date().toDateString();
  const hash = Array.from(base)
    .reduce((h, c) => (Math.imul(31, h) + c.charCodeAt(0)) | 0, 0)
    .toString(16).padStart(8, '0').toUpperCase();
  const ts = new Date().toISOString().replace(/[^0-9]/g, '').substring(0, 12);
  return `TWS-${hash}-${ts}`;
}

// ─── DB helpers ────────────────────────────────────────────────────────────────

function isPersistenceEnabled(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

async function getSubmissionCount(module: string, tenantId: string): Promise<number> {
  if (!isPersistenceEnabled()) return 0;
  try {
    // Dynamic import of pg client — only if DB available
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(process.env.DATABASE_URL!);
    const result = await sql`
      SELECT COUNT(*)::INT AS cnt
      FROM tws_submissions
      WHERE module = ${module} AND tenant_id = ${tenantId}
    `;
    return result[0]?.cnt ?? 0;
  } catch { return 0; }
}

async function insertSubmission(req: TwsBlueprintPostRequest, sig: string): Promise<boolean> {
  if (!isPersistenceEnabled()) return false;
  try {
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(process.env.DATABASE_URL!);
    await sql`
      INSERT INTO tws_submissions (module, tenant_id, payload, submitted_by, audit_sig)
      VALUES (${req.module}, ${req.tenant_id}, ${JSON.stringify(req.payload)}, ${req.submitted_by ?? null}, ${sig})
    `;
    return true;
  } catch { return false; }
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export const handler: Handler = async (event: HandlerEvent) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };

  // ── GET: return blueprint + submission count ──────────────────────────────

  if (event.httpMethod === 'GET') {
    const qs = event.queryStringParameters ?? {};
    const module = qs.module as TwsModuleKey | undefined;
    const tenantId = qs.tenant_id ?? 'demo';

    if (!module) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing module param' }) };
    }

    const blueprint = loadBlueprint(module);
    if (!blueprint) {
      return { statusCode: 404, headers, body: JSON.stringify({ error: `Blueprint not found: ${module}` }) };
    }

    const [countResult] = await Promise.allSettled([getSubmissionCount(module, tenantId)]);
    const count = countResult.status === 'fulfilled' ? countResult.value : 0;

    const response: TwsBlueprintGetResponse = {
      blueprint,
      submission_count: count,
    };

    return {
      statusCode: 200,
      headers: { ...headers, 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
      body: JSON.stringify(response),
    };
  }

  // ── POST: persist submission ───────────────────────────────────────────────

  if (event.httpMethod === 'POST') {
    let req: TwsBlueprintPostRequest;
    try {
      req = JSON.parse(event.body ?? '{}');
    } catch {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON body' }) };
    }

    if (!req.module || !req.tenant_id || !req.payload) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing required fields' }) };
    }

    const sig = auditSig(req.module, req.tenant_id, req.payload);
    const persisted = await insertSubmission(req, sig);

    const result: TwsSubmissionResult = {
      success: true,
      audit_signature: sig,
      persisted_to: persisted ? 'database' : 'localStorage',
    };

    return { statusCode: 200, headers, body: JSON.stringify(result) };
  }

  return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
};

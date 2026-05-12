// PIN login + session check.
//   POST /api/auth/login   { pin: "1234" }   -> sets HttpOnly session cookie
//   GET  /api/auth/session                    -> 200 if logged in, 401 if not
//   POST /api/auth/logout                     -> clears cookie
//
// The PIN lives ONLY in Netlify env vars. It is never sent to the browser bundle.

import { issueCookie, clearCookie, verifyRequest } from '../lib/session.js';

const DEFAULT_ALLOWED_ORIGINS = [
  'https://thewordenstandard.com',
  'https://www.thewordenstandard.com',
];

function allowedOrigins() {
  const raw = process.env.WS_ALLOWED_ORIGIN;
  if (raw) return raw.split(',').map((s) => s.trim()).filter(Boolean);
  return DEFAULT_ALLOWED_ORIGINS;
}

function corsHeaders(reqOrigin) {
  const list = allowedOrigins();
  const origin = list.includes(reqOrigin) ? reqOrigin : list[0];
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
    Vary: 'Origin',
  };
}

function json(status, body, reqOrigin, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(reqOrigin),
      ...extraHeaders,
    },
  });
}

// Constant-time string compare
function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export default async function handler(req) {
  const reqOrigin = req.headers.get('origin') || '';
  const url = new URL(req.url);
  const path = url.pathname.replace(/\/+$/, '');

  if (req.method === 'OPTIONS') {
    return new Response('', { headers: corsHeaders(reqOrigin) });
  }

  // Origin allowlist (defense in depth; cookie also requires same-site)
  const allowed = allowedOrigins();
  if (reqOrigin && !allowed.includes(reqOrigin)) {
    return json(403, { error: 'Forbidden' }, reqOrigin);
  }

  const secret = (process.env.WS_PROXY_SECRET || '').trim();
  const pin = (process.env.WS_PIN || '').trim();

  // GET /api/auth/session
  if (req.method === 'GET' && path.endsWith('/session')) {
    if (!secret) return json(503, { ok: false, reason: 'unconfigured' }, reqOrigin);
    const ok = await verifyRequest(req, secret);
    return json(ok ? 200 : 401, { ok }, reqOrigin);
  }

  // POST /api/auth/logout
  if (req.method === 'POST' && path.endsWith('/logout')) {
    return json(200, { ok: true }, reqOrigin, { 'Set-Cookie': clearCookie() });
  }

  // POST /api/auth/login
  if (req.method === 'POST' && path.endsWith('/login')) {
    if (!secret || !pin) {
      return json(503, { error: 'Auth not configured' }, reqOrigin);
    }
    let body;
    try {
      body = await req.json();
    } catch {
      return json(400, { error: 'Invalid JSON' }, reqOrigin);
    }
    const presented = String(body?.pin || '').trim();
    if (!presented || !timingSafeEqual(presented, pin)) {
      return json(401, { ok: false }, reqOrigin);
    }
    const cookie = await issueCookie(secret);
    return json(200, { ok: true }, reqOrigin, { 'Set-Cookie': cookie });
  }

  return json(404, { error: 'Not found' }, reqOrigin);
}

export const config = { path: '/api/auth/*' };

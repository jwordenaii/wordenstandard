// Hardened proxy for Anthropic Messages API.
// Original behavior preserved: POSTs the client's JSON body to
// https://api.anthropic.com/v1/messages and returns the response.
//
// Auth model: caller must already hold a valid signed session cookie issued by
// /api/auth/login. The PIN itself never reaches the browser bundle.
//
// Required Netlify environment variables:
//   ANTHROPIC_API_KEY  - Anthropic secret key
//   WS_PROXY_SECRET    - random string used to sign session cookies
//   WS_ALLOWED_ORIGIN  - optional, comma-separated allowed origins

import { verifyRequest } from '../lib/session.js';

const DEFAULT_ALLOWED_ORIGINS = [
  'https://thewordenstandard.com',
  'https://www.thewordenstandard.com',
];
const MAX_BODY_BYTES = 32 * 1024;

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
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
    Vary: 'Origin',
  };
}

function deny(status, message, reqOrigin) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(reqOrigin) },
  });
}

export default async function handler(req) {
  const reqOrigin = req.headers.get('origin') || '';
  const allowed = allowedOrigins();

  if (req.method === 'OPTIONS') {
    return new Response('', { headers: corsHeaders(reqOrigin) });
  }
  if (req.method !== 'POST') return deny(405, 'Method Not Allowed', reqOrigin);
  if (reqOrigin && !allowed.includes(reqOrigin)) return deny(403, 'Forbidden', reqOrigin);

  const secret = (process.env.WS_PROXY_SECRET || '').trim();
  if (!secret) return deny(503, 'Proxy not configured', reqOrigin);

  const ok = await verifyRequest(req, secret);
  if (!ok) return deny(401, 'Unauthorized', reqOrigin);

  let raw;
  try { raw = await req.text(); } catch { return deny(400, 'Invalid request body', reqOrigin); }
  if (raw.length > MAX_BODY_BYTES) return deny(413, 'Payload too large', reqOrigin);
  let body;
  try { body = JSON.parse(raw); } catch { return deny(400, 'Invalid JSON', reqOrigin); }

  if (!process.env.ANTHROPIC_API_KEY) return deny(503, 'Upstream not configured', reqOrigin);

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });
    const data = await upstream.text();
    return new Response(data, {
      status: upstream.status,
      headers: {
        'Content-Type': upstream.headers.get('content-type') || 'application/json',
        ...corsHeaders(reqOrigin),
      },
    });
  } catch (e) {
    return deny(502, e.message || 'Upstream error', reqOrigin);
  }
}

export const config = { path: '/api/jarvis' };

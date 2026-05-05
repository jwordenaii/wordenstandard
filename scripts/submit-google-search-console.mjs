#!/usr/bin/env node
/**
 * submit-google-search-console.mjs
 * ---------------------------------------------------------------
 * Auto-submits the sitemap to Google Search Console after every
 * production build. Uses a service-account JSON key, signs a JWT
 * with RS256 (built-in Node crypto — no extra dependencies),
 * exchanges it for an OAuth2 token, then POSTs the sitemap to the
 * Search Console API.
 *
 * One-time setup (do this in Google Cloud Console):
 *   1. Create a service account, download its JSON key.
 *   2. Enable the "Google Search Console API" for the project.
 *   3. In Search Console -> Settings -> Users and permissions,
 *      add the service-account email as an Owner of the property
 *      https://www.jwordenasphaltpaving.com/.
 *   4. Set the JSON key as a Netlify env var named
 *      GSC_SERVICE_ACCOUNT_JSON (paste the full JSON string).
 *
 * Required env:
 *   GSC_SERVICE_ACCOUNT_JSON  full service-account JSON (string)
 *
 * Optional env:
 *   GSC_SITE_URL    default https://www.jwordenasphaltpaving.com/
 *   GSC_SITEMAP_URL default https://www.jwordenasphaltpaving.com/sitemap.xml
 *   GSC_FORCE=1     run outside of Netlify production deploys
 * ---------------------------------------------------------------
 */
import { createSign } from 'node:crypto';

function log(msg) {
  console.log(`[gsc] ${msg}`);
}

const isNetlifyProd =
  process.env.NETLIFY === 'true' && process.env.CONTEXT === 'production';
const isManualRun =
  process.argv.includes('--force') || process.env.GSC_FORCE === '1';

if (!isNetlifyProd && !isManualRun) {
  log('skipping (not a Netlify production deploy; use GSC_FORCE=1 to override)');
  process.exit(0);
}

const SA_JSON = process.env.GSC_SERVICE_ACCOUNT_JSON;
if (!SA_JSON) {
  log('GSC_SERVICE_ACCOUNT_JSON not set — skipping (Google sitemap not auto-submitted)');
  process.exit(0); // advisory only — never fail the build
}

const SITE_URL = process.env.GSC_SITE_URL || 'https://www.jwordenasphaltpaving.com/';
const SITEMAP_URL =
  process.env.GSC_SITEMAP_URL || 'https://www.jwordenasphaltpaving.com/sitemap.xml';

let creds;
try {
  creds = JSON.parse(SA_JSON);
} catch (e) {
  log(`GSC_SERVICE_ACCOUNT_JSON is not valid JSON: ${e.message}`);
  process.exit(0);
}
if (!creds.client_email || !creds.private_key) {
  log('service account JSON missing client_email or private_key — skipping');
  process.exit(0);
}

function b64url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function signJwt(claims, privateKeyPem) {
  const header = { alg: 'RS256', typ: 'JWT' };
  const encHeader = b64url(JSON.stringify(header));
  const encPayload = b64url(JSON.stringify(claims));
  const signingInput = `${encHeader}.${encPayload}`;
  const signer = createSign('RSA-SHA256');
  signer.update(signingInput);
  signer.end();
  const sig = signer
    .sign(privateKeyPem)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  return `${signingInput}.${sig}`;
}

async function getAccessToken() {
  const now = Math.floor(Date.now() / 1000);
  const claims = {
    iss: creds.client_email,
    scope: 'https://www.googleapis.com/auth/webmasters',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };
  const jwt = signJwt(claims, creds.private_key);
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  const j = await res.json();
  if (!res.ok || !j.access_token) {
    throw new Error(`token exchange failed (HTTP ${res.status}): ${JSON.stringify(j)}`);
  }
  return j.access_token;
}

async function submitSitemap(token) {
  // PUT https://www.googleapis.com/webmasters/v3/sites/{siteUrl}/sitemaps/{feedpath}
  const siteEnc = encodeURIComponent(SITE_URL);
  const feedEnc = encodeURIComponent(SITEMAP_URL);
  const url = `https://www.googleapis.com/webmasters/v3/sites/${siteEnc}/sitemaps/${feedEnc}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
  });
  // 200 or 204 = success. Google returns 204 No Content on resubmit.
  if (res.status === 200 || res.status === 204) {
    log(`success (HTTP ${res.status}) — sitemap (re)submitted to Google for ${SITE_URL}`);
    return;
  }
  const txt = await res.text().catch(() => '');
  log(`HTTP ${res.status}: ${txt.slice(0, 300)}`);
  // Don't fail the build — Google submissions are advisory.
}

try {
  log(`requesting OAuth token for ${creds.client_email}`);
  const token = await getAccessToken();
  log(`submitting ${SITEMAP_URL} to Google Search Console`);
  await submitSitemap(token);
} catch (e) {
  log(`error: ${e.message}`);
  process.exit(0); // advisory — never fail the build
}

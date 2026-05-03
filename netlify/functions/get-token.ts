import type { Handler } from '@netlify/functions'
import { SignJWT } from 'jose'

const TOKEN_TTL_SECONDS = 24 * 60 * 60

function cors(origin?: string) {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'no-store',
    Vary: 'Origin',
  }
}

async function fetchBackendToken() {
  const apiBase = process.env.VITE_API_BASE_URL
  const masterKey = process.env.JWORDEN_MASTER_KEY

  if (!apiBase) throw new Error('VITE_API_BASE_URL is not set.')
  if (!masterKey) throw new Error('JWORDEN_MASTER_KEY is not set.')

  const res = await fetch(`${apiBase}/api/v1/auth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${masterKey}`,
    },
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(body.detail || `Backend token endpoint returned ${res.status}`)
  }

  const data = await res.json()
  const nowSeconds = Math.floor(Date.now() / 1000)
  return {
    token: data.access_token,
    expires_at: nowSeconds + (data.expires_in ?? TOKEN_TTL_SECONDS),
  }
}

async function signLocally() {
  const secret = process.env.JWT_SECRET_KEY
  if (!secret) throw new Error('JWT_SECRET_KEY is not set.')

  const nowSeconds = Math.floor(Date.now() / 1000)
  const expiresAt = nowSeconds + TOKEN_TTL_SECONDS
  const secretBytes = new TextEncoder().encode(secret)

  const token = await new SignJWT({
    sub: 'frontend-client',
    tenant_id: 'JWORDEN_HQ',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(nowSeconds)
    .setExpirationTime(expiresAt)
    .sign(secretBytes)

  return { token, expires_at: expiresAt }
}

export const handler: Handler = async (event) => {
  const headers = cors(event.headers.origin)

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' }
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  try {
    const useBackend = String(process.env.USE_BACKEND_TOKEN_ENDPOINT || 'true').toLowerCase() === 'true'
    const payload = useBackend ? await fetchBackendToken() : await signLocally()
    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }
  } catch (error) {
    return {
      statusCode: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error instanceof Error ? error.message : 'Unable to issue token' }),
    }
  }
}

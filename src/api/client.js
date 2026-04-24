/**
 * API client — reads VITE_API_BASE_URL at build time.
 * Falls back to relative paths so the frontend still works when
 * the backend is not yet deployed.
 */

const BASE = import.meta.env.VITE_API_BASE_URL || ''

async function request(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  }
  if (body) opts.body = JSON.stringify(body)

  const res = await fetch(`${BASE}${path}`, opts)
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || `HTTP ${res.status}`)
  }
  return res.json()
}

export const api = {
  submitQuote:   (data) => request('POST', '/api/v1/leads/quote',   data),
  submitContact: (data) => request('POST', '/api/v1/leads/contact', data),
  getReviews:    ()     => request('GET',  '/api/v1/reviews'),
  getSchema:     ()     => request('GET',  '/api/v1/schema/local-business'),
}

// ── GA4 event helpers ─────────────────────────────────────────────────────────
export function trackEvent(eventName, params = {}) {
  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, params)
  }
}

export function trackPageView(path, title) {
  if (typeof window.gtag === 'function') {
    window.gtag('event', 'page_view', {
      page_path: path,
      page_title: title,
    })
  }
}

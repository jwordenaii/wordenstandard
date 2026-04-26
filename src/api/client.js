/**
 * API client — reads VITE_API_BASE_URL at build time.
 * Falls back to relative paths so the frontend still works when
 * the backend is not yet deployed.
 *
 * All requests include a 10-second AbortController timeout so the UI
 * never hangs indefinitely on a slow/down backend.
 */

const BASE = import.meta.env.VITE_API_BASE_URL || ''
const DEFAULT_TIMEOUT_MS = 10_000

async function request(method, path, body) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS)

  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
    signal: controller.signal,
  }
  if (body) opts.body = JSON.stringify(body)

  try {
    const res = await fetch(`${BASE}${path}`, opts)
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }))
      throw new Error(err.detail || `HTTP ${res.status}`)
    }
    return res.json()
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.')
    }
    throw err
  } finally {
    clearTimeout(timeoutId)
  }
}

export const api = {
  submitQuote:    (data) => request('POST', '/api/v1/leads/quote',   data),
  submitContact:  (data) => request('POST', '/api/v1/leads/contact', data),
  getReviews:     ()     => request('GET',  '/api/v1/reviews'),
  getSchema:      ()     => request('GET',  '/api/v1/schema/local-business'),
  askAI:          (data) => request('POST', '/api/v1/ai/chat',       data),
  // Content blocks managed via the admin Webpage Maker.
  // The frontend uses these as optional overrides — hardcoded defaults remain
  // in place if a block is missing (graceful degradation).
  getContent:     ()     => request('GET',  '/api/v1/content'),
  getContentBlock:(key)  => request('GET',  `/api/v1/content/${key}`),

  // ── Analytics (Feature 10) ─────────────────────────────────────────
  getAnalyticsDashboard: () => request('GET', '/api/v1/analytics/dashboard'),
  getAnalyticsFunnel:    () => request('GET', '/api/v1/analytics/funnel'),
  getRevenueForecast:    () => request('GET', '/api/v1/analytics/revenue-forecast'),
  getMonthlyVolume:      () => request('GET', '/api/v1/analytics/monthly-volume'),

  // ── CRM Pipeline (Feature 3) ───────────────────────────────────────
  getCRMLeads:    (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''))
    ).toString()
    return request('GET', `/api/v1/crm/leads${qs ? `?${qs}` : ''}`)
  },
  updateLeadStage: (leadId, stage, closedReason) =>
    request('PATCH', `/api/v1/crm/leads/${leadId}/stage`, { pipeline_stage: stage, closed_reason: closedReason }),
  getCRMFunnel:   () => request('GET', '/api/v1/crm/funnel'),

  // ── Weather (Feature 8) ────────────────────────────────────────────
  getPavingForecast: (address) => request('POST', '/api/v1/weather/paving-forecast', { address }),
  getStateWeatherRisk: (stateCode) => request('GET', `/api/v1/weather/risk/${stateCode}`),

  // ── Material Prices (Feature 7) ────────────────────────────────────
  getMaterialPrices: () => request('GET', '/api/v1/materials/price-index'),

  // ── Lien Calendar (Feature 12) ─────────────────────────────────────
  calculateLienDeadlines: (data) => request('POST', '/api/v1/liens/calculate', data),
  trackLienProject:       (data) => request('POST', '/api/v1/liens/track',     data),
  getUpcomingLiens:       (daysAhead = 30) => request('GET', `/api/v1/liens/upcoming?days_ahead=${daysAhead}`),
  getLienEntries:         () => request('GET', '/api/v1/liens/entries'),

  // ── Subcontractors (Feature 14) ────────────────────────────────────
  getSubcontractors:    () => request('GET',  '/api/v1/subcontractors'),
  getExpiringCerts:     (daysAhead = 30) => request('GET', `/api/v1/subcontractors/expiring?days_ahead=${daysAhead}`),
  addSubcontractor:     (data) => request('POST',   '/api/v1/subcontractors',     data),
  updateSubcontractor:  (id, data) => request('PUT', `/api/v1/subcontractors/${id}`, data),

  // ── Market Intelligence (Feature 13) ───────────────────────────────
  getCompetitors:     (location, service = 'asphalt paving') =>
    request('GET', `/api/v1/market/competitors?location=${encodeURIComponent(location)}&service=${encodeURIComponent(service)}`),
  getMarketSignals:   (stateCode) => request('GET', `/api/v1/market/signals/${stateCode}`),
  getSeasonalDemand:  (stateCode) => request('GET', `/api/v1/market/seasonal/${stateCode}`),
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

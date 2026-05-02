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

  const headers = { 'Content-Type': 'application/json' }

  const opts = {
    method,
    headers,
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

/** Build a query string from an object, omitting null/undefined/empty values. */
function buildQS(params) {
  const qs = new URLSearchParams(
    Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
    )
  ).toString()
  return qs ? `?${qs}` : ''
}

export const api = {
  submitQuote: (data) => request('POST', '/api/v1/leads/quote', data),
  submitContact: (data) => request('POST', '/api/v1/leads/contact', data),
  getReviews: () => request('GET', '/api/v1/reviews'),
  getSchema: () => request('GET', '/api/v1/schema/local-business'),
  askAI: (data) => request('POST', '/api/v1/ai/chat', data),
  // Mr. Worden premium public concierge — structured response with quick replies + handoff
  publicChat: (data) => request('POST', '/api/v1/public/chat', data),
  // AI-assisted contact form field suggestions (page_context + message → service_type + hint)
  contactSuggest: (data) => request('POST', '/api/v1/ai/contact-suggest', data),
  // Content blocks managed via the admin Webpage Maker.
  // The frontend uses these as optional overrides — hardcoded defaults remain
  // in place if a block is missing (graceful degradation).
  getContent: () => request('GET', '/api/v1/content'),
  getContentBlock: (key) => request('GET', `/api/v1/content/${key}`),
  // ── Geospatial ─────────────────────────────────────────────────────────────
  getSites: () => request('GET', '/api/v1/geo/sites'),
  createSite: (data) => request('POST', '/api/v1/geo/sites', data),
  updateSite: (id, data) => request('PUT', `/api/v1/geo/sites/${id}`, data),
  getPermitLeads: (params = {}) => {
    return request('GET', `/api/v1/geo/permit-leads${buildQS(params)}`)
  },
  triggerScrape: (maxPages = 5) =>
    request('POST', `/api/v1/geo/permit-leads/scrape?max_pages=${maxPages}`),
  radiusQuery: (lat, lng, miles = 20) =>
    request('GET', `/api/v1/geo/radius-query?lat=${lat}&lng=${lng}&radius_miles=${miles}`),
  getTrucks: () => request('GET', '/api/v1/geo/trucks'),
  pingTruck: (id, data) => request('POST', `/api/v1/geo/trucks/${id}`, data),
  // ── Virtual Foreman ────────────────────────────────────────────────────────
  askForeman: (data) => request('POST', '/api/v1/foreman/chat', data),
  getForemanStatus: () => request('GET', '/api/v1/foreman/status'),
  getVisionResult: (jobId) => request('GET', `/api/v1/ai/vision-result/${jobId}`),
  // ── Command Center dashboard metrics ──────────────────────────────────────
  getSiteMetrics: () => request('GET', '/api/v1/site-metrics'),
  // ── Property Visualizer (public, anonymous) ───────────────────────────────
  scanParcel: (data) => request('POST', '/api/v1/visualizer/parcel', data),
  submitVisualProposal: (data) => request('POST', '/api/v1/visualizer/proposal', data),
  getAIDesignSuggestions: (data) => request('POST', '/api/v1/visualizer/ai-suggestions', data),
  // ── Proposals + Stripe checkout (post-quote pipeline) ─────────────────────
  generateProposal: (leadId) =>
    request('POST', '/api/v1/proposals/generate', { lead_id: leadId, include_pdf: true }),
  sendProposal: (leadId) => request('POST', `/api/v1/proposals/${leadId}/send`),
  createCheckoutSession: (leadId, successUrl, cancelUrl) =>
    request('POST', '/api/v1/payments/checkout-session', {
      lead_id: leadId,
      success_url: successUrl,
      cancel_url: cancelUrl,
    }),
  // ── National permit feed (Command Center) ─────────────────────────────────
  getNationalPermits: (states, keyword, limit = 50) => {
    const params = { keyword, limit }
    if (Array.isArray(states) && states.length) params.states = states.join(',')
    return request('GET', `/api/v1/permits/national${buildQS(params)}`)
  },
  // ── Intelligent compaction ─────────────────────────────────────────────────
  postCompactionPing: (data) => request('POST', '/api/v1/iot/compaction-ping', data),
  getCompactionHeatmap: (siteId, limit = 2000) =>
    request('GET', `/api/v1/iot/compaction-heatmap/${siteId}?limit=${limit}`),
  getCompactionSummary: (siteId) =>
    request('GET', `/api/v1/iot/compaction-summary/${siteId}`),
  // ── Drone scans ────────────────────────────────────────────────────────────
  postDroneScan: (siteId, data) => request('POST', `/api/v1/sites/${siteId}/drone-scan`, data),
  getDroneScans: (siteId) => request('GET', `/api/v1/sites/${siteId}/drone-scans`),
  getDroneScan: (scanId) => request('GET', `/api/v1/drone-scans/${scanId}`),
  // ── Live site snapshot (one-shot; use EventSource for the SSE stream) ──────
  getLiveSiteSnapshot: () => request('GET', '/api/v1/live/site-snapshot'),
  // ── 50-State compliance & license verification ────────────────────────────
  verifyLicense: (state, licenseNum, expectedName) =>
    request('GET', `/api/v1/compliance/verify?state=${state}&license_num=${licenseNum}${expectedName ? `&expected_name=${encodeURIComponent(expectedName)}` : ''}`),
  verifyLicenseBatch: (licenses) => request('POST', '/api/v1/compliance/verify-batch', { licenses }),
  getComplianceMatrix: () => request('GET', '/api/v1/compliance/matrix'),
  getStateInfo: (code) => request('GET', `/api/v1/compliance/state/${code}`),
  getVerificationHistory: (state, licenseNum) =>
    request('GET', `/api/v1/compliance/history${buildQS({ state_code: state, license_number: licenseNum })}`),
  // ── What-If schedule simulator ────────────────────────────────────────────
  simulateSchedule: (data) => request('POST', '/api/v1/schedule/simulate', data),
  // ── Ads Intelligence (AI Max URL exclusions, CRM export, qualifier, anomaly) ─
  getAdsStatus: () => request('GET', '/api/v1/ads/status'),
  getUrlExclusions: (format = 'json') =>
    request('GET', `/api/v1/ads/url-exclusions?format=${format}`),
  addUrlExclusion: (data) => request('POST', '/api/v1/ads/url-exclusions', data),
  removeUrlExclusion: (id) => request('DELETE', `/api/v1/ads/url-exclusions/${id}`),
  getCrmExport: (limit = 5000) => request('GET', `/api/v1/ads/crm-export?limit=${limit}`),
  qualifyLead: (data) => request('POST', '/api/v1/ads/qualify-lead', data),
  getAnomalies: (includeResolved = false) =>
    request('GET', `/api/v1/ads/anomalies?include_resolved=${includeResolved}`),
  runAnomalyScan: () => request('POST', '/api/v1/ads/anomaly-scan'),
  resolveAnomaly: (id) => request('POST', `/api/v1/ads/anomalies/${id}/resolve`),
  // ── Cost Catalog & GC Project Estimates ──────────────────────────────────
  getCostCatalog: (category) =>
    request('GET', `/api/v1/cost-catalog${buildQS({ category })}`),
  addCatalogItem: (data) => request('POST', '/api/v1/cost-catalog', data),
  updateCatalogItem: (id, data) => request('PUT', `/api/v1/cost-catalog/${id}`, data),
  getEstimateLines: (siteId) => request('GET', `/api/v1/spatial/estimate/${siteId}`),
  getEstimateSummary: (siteId) => request('GET', `/api/v1/spatial/estimate/${siteId}/summary`),
  createEstimateLine: (data) => request('POST', '/api/v1/spatial/estimate', data),
  deleteEstimateLine: (id) => request('DELETE', `/api/v1/spatial/estimate/${id}`),
  // ── Spatial as-built verification (file upload — returns JSON) ────────────
  verifyAsBuilt: async (file, params = {}) => {
    const form = new FormData()
    form.append('file', file)
    const qs = buildQS(params)
    const BASE_URL = import.meta.env.VITE_API_BASE_URL || ''
    const controller = new AbortController()
    const tId = setTimeout(() => controller.abort(), 30_000)
    try {
      const res = await fetch(`${BASE_URL}/api/v1/spatial/verify-as-built${qs}`, {
        method: 'POST', body: form, signal: controller.signal,
      })
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail || `HTTP ${res.status}`) }
      return res.json()
    } finally { clearTimeout(tId) }
  },
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

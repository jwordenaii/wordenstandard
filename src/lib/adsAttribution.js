const ATTR_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'gclid',
  'wbraid',
  'gbraid',
]

const STORAGE_KEY = 'jworden:last_attribution'

function safeJsonParse(value) {
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

export function readAttributionFromUrl() {
  if (typeof window === 'undefined') return {}
  const qs = new URLSearchParams(window.location.search)
  const result = {}
  for (const key of ATTR_KEYS) {
    const value = qs.get(key)
    if (value) result[key] = value
  }
  return result
}

export function persistAttribution() {
  if (typeof window === 'undefined') return {}
  const fromUrl = readAttributionFromUrl()
  if (Object.keys(fromUrl).length > 0) {
    const existing = safeJsonParse(window.localStorage.getItem(STORAGE_KEY) || '')
    const merged = {
      ...(existing && typeof existing === 'object' ? existing : {}),
      ...fromUrl,
      captured_at: existing?.captured_at || new Date().toISOString(),
      last_seen_at: new Date().toISOString(),
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
    return merged
  }

  const cached = safeJsonParse(window.localStorage.getItem(STORAGE_KEY) || '')
  return cached && typeof cached === 'object' ? cached : {}
}

export function getAttribution() {
  if (typeof window === 'undefined') return {}
  const cached = safeJsonParse(window.localStorage.getItem(STORAGE_KEY) || '')
  return cached && typeof cached === 'object' ? cached : {}
}

export function getAttributionEventParams() {
  const a = getAttribution()
  return {
    traffic_source: a.utm_source || 'direct',
    traffic_medium: a.utm_medium || 'none',
    traffic_campaign: a.utm_campaign || 'none',
    traffic_term: a.utm_term || 'none',
    traffic_content: a.utm_content || 'none',
    gclid: a.gclid || undefined,
    wbraid: a.wbraid || undefined,
    gbraid: a.gbraid || undefined,
  }
}

export function getLeadAttributionFields() {
  const a = getAttribution()
  return {
    conversion_source: a.utm_source || 'direct',
    attribution_snapshot: Object.keys(a).length ? JSON.stringify(a) : undefined,
    attribution_first_touch_at: a.captured_at || new Date().toISOString(),
    gclid: a.gclid || undefined,
    wbraid: a.wbraid || undefined,
    gbraid: a.gbraid || undefined,
    offline_conversion_ready: Boolean(a.gclid || a.wbraid || a.gbraid),
  }
}

export function getOfflineConversionIdentifiers() {
  const a = getAttribution()
  return {
    gclid: a.gclid || null,
    wbraid: a.wbraid || null,
    gbraid: a.gbraid || null,
  }
}

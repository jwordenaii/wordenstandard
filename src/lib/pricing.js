/**
 * Client-side ballpark pricing estimator.
 *
 * Uses industry-standard cost ranges per square foot for each service.
 * These are conservative ballpark figures — actual quotes will vary
 * based on site conditions, access, and material costs.
 *
 * Math basis:
 *   Residential paving    $3.50 – $8.00 / sq ft
 *   Commercial paving     $2.50 – $6.00 / sq ft  (volume discount)
 *   Sealcoating           $0.15 – $0.35 / sq ft
 *   Crack filling         $0.40 – $1.00 / sq ft  (varies with crack density)
 *   Parking lot           $3.00 – $7.00 / sq ft
 *   Driveway              $3.50 – $7.50 / sq ft
 *   Maintenance plan      $0.20 – $0.45 / sq ft / year
 *
 * Returns { low, high, unit } or null if estimate is not possible.
 */

const RATES = {
  paving: {
    residential: { low: 3.5, high: 8.0 },
    commercial:  { low: 2.5, high: 6.0 },
    default:     { low: 3.0, high: 7.0 },
  },
  sealcoating: {
    residential: { low: 0.15, high: 0.35 },
    commercial:  { low: 0.12, high: 0.30 },
    default:     { low: 0.12, high: 0.35 },
  },
  crackfill: {
    residential: { low: 0.40, high: 1.0 },
    commercial:  { low: 0.35, high: 0.90 },
    default:     { low: 0.40, high: 1.0 },
  },
  parking_lot: {
    residential: { low: 3.0, high: 7.0 },
    commercial:  { low: 3.0, high: 7.0 },
    default:     { low: 3.0, high: 7.0 },
  },
  driveway: {
    residential: { low: 3.5, high: 7.5 },
    commercial:  { low: 3.0, high: 6.5 },
    default:     { low: 3.5, high: 7.5 },
  },
  maintenance: {
    residential: { low: 0.20, high: 0.40 },
    commercial:  { low: 0.18, high: 0.40 },
    default:     { low: 0.20, high: 0.45 },
  },
}

/** Format a dollar value: round to nearest $50 for clarity */
function roundToFifty(n) {
  return Math.round(n / 50) * 50
}

function fmt(n) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n)
}

/**
 * @param {string} serviceType  — e.g. 'paving', 'sealcoating'
 * @param {string} propertyType — 'residential' | 'commercial'
 * @param {number|null} sqft    — project size in square feet
 * @returns {{ lowFmt: string, highFmt: string, disclaimer: string } | null}
 */
export function estimatePrice(serviceType, propertyType, sqft) {
  const service = serviceType?.toLowerCase()
  const property = propertyType?.toLowerCase()
  const area = parseFloat(sqft)

  if (!service || !RATES[service] || !area || area <= 0) return null

  const rates = RATES[service][property] ?? RATES[service].default
  const rawLow  = rates.low  * area
  const rawHigh = rates.high * area

  const low  = roundToFifty(rawLow)
  const high = roundToFifty(rawHigh)

  // Sanity floor: no estimate below $250 (mobilization minimum)
  const clampedLow  = Math.max(low,  250)
  const clampedHigh = Math.max(high, 500)

  return {
    lowFmt:  fmt(clampedLow),
    highFmt: fmt(clampedHigh),
    disclaimer:
      'Ballpark estimate only — final price depends on site conditions, ' +
      'material costs, and access. Free on-site quote always included.',
  }
}

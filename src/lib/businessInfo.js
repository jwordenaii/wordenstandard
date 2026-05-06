/**
 * businessInfo.js — Single canonical source of truth for J. Worden & Sons NAP
 * (Name, Address, Phone) plus the closely-related identity facts that show up
 * in Schema.org JSON-LD, the Footer, the Contact page, and Open Graph.
 *
 * Everything Google checks for "Local Pack" entity consistency lives here:
 *   - Legal / display name
 *   - Telephone in three formats (E.164 for tel:, schema, and human display)
 *   - Full postal address (street, suite, city, region, postal code, country)
 *   - Geo coordinates
 *   - Email
 *   - Founding year
 *   - Opening hours
 *   - Aggregate rating snapshot
 *   - Founder identity (for Person/E-E-A-T schema)
 *   - Stable @id URIs for cross-referencing schemas
 *
 * Any drift between schema.org and visible page content hurts Local Pack
 * ranking. Keep all NAP edits in this one file.
 */

export const SITE_URL =
  import.meta.env?.VITE_SITE_URL || 'https://www.jwordenasphaltpaving.com'

// Stable Schema.org @id URIs. Using fragment identifiers on SITE_URL so the
// Organization, LocalBusiness, WebSite, and Person entities can reference
// each other (Google uses these to merge entity facts across pages).
export const SCHEMA_IDS = {
  organization: `${SITE_URL}/#organization`,
  localBusiness: `${SITE_URL}/#localbusiness`,
  website: `${SITE_URL}/#website`,
  founder: `${SITE_URL}/about#founder`,
}

export const BUSINESS_NAME = 'J. Worden & Sons Asphalt Paving'
export const BUSINESS_LEGAL_NAME = 'J. Worden & Sons Paving, L.L.C.'
export const BUSINESS_DESCRIPTION =
  'Family-owned asphalt paving contractor est. 1984. KFC national QSR new-build and remodel program across 12+ states. ' +
  'Pavement Magazine Top 75 (4 categories). Best of Houzz. 2026 Top Contractor Nominee.'
export const BUSINESS_FOUNDING_YEAR = '1984'

// Phone — keep the three representations in sync.
export const PHONE_E164 = '+18044461296' // for tel: links and schema
export const PHONE_DISPLAY = '(804) 446-1296' // human-readable
export const PHONE_SCHEMA = '+1-804-446-1296' // schema.org-friendly format

// SMS-specific number for "Text Us" CTAs. Defaults to the main business
// line; override here if Gene wants texts to land on a different cell.
export const SMS_E164 = '+18044461296'
export const SMS_PREFILL = 'Hi, I saw your website and want a free quote.'

export const EMAIL = 'j.wordenandsonspaving@gmail.com'

export const SOCIAL_PROFILES = {
  facebook: 'https://www.facebook.com/jwordenpaving',
  linkedin: 'https://www.linkedin.com/company/j-worden-sons-asphalt-paving-inc/',
  instagram: 'https://www.instagram.com/j.worden_paving/',
}

export const ADDRESS = {
  streetAddress: '1601 Ware Bottom Springs Rd, Suite 214',
  addressLocality: 'Chester',
  addressRegion: 'VA',
  postalCode: '23836',
  addressCountry: 'US',
}

export const GEO = {
  latitude: 37.3529,
  longitude: -77.4326,
}

// Price range on a scale of 1-4 dollar signs.
export const PRICE_RANGE = '$$$'

export const OPENING_HOURS = [
  {
    dayOfWeek: [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ],
    opens: '00:00',
    closes: '23:59',
  },
]
export const HOURS_DISPLAY = '24/7 Customer Service'

// Aggregate rating snapshot — bump these when GBP review count moves.
// Must match what the Reviews page and Footer display.
export const AGGREGATE_RATING = {
  ratingValue: '4.9',
  bestRating: '5',
  worstRating: '1',
  reviewCount: '87',
}

// Detailed service list for hasOffer schema property
export const SERVICES_OFFERED = [
  { name: 'Asphalt Paving' },
  { name: 'Driveway Paving' },
  { name: 'Commercial Paving' },
  { name: 'Parking Lot Paving' },
  { name: 'Asphalt Sealcoating' },
  { name: 'Asphalt Repair' },
  { name: 'Tar and Chip Paving' },
  { name: 'Industrial Paving' },
  { name: 'Asphalt Milling' },
  { name: 'Pavement Maintenance' },
]

// Geographic service areas for areaServed schema property
export const SERVICE_AREAS = [
  { type: 'State', name: 'Virginia' },
  { type: 'City', name: 'Richmond' },
  { type: 'City', name: 'Virginia Beach' },
  { type: 'City', name: 'Roanoke' },
  { type: 'City', name: 'Fredericksburg' },
  { type: 'City', name: 'Williamsburg' },
  { type: 'City', name: 'Harrisonburg' },
  { type: 'City', name: 'Winchester' },
  { type: 'City', name: 'Charlottesville' },
  { type: 'City', name: 'Lynchburg' },
  { type: 'City', name: 'Chester' },
  { type: 'City', name: 'Midlothian' },
  { type: 'City', name: 'Short Pump' },
  { type: 'City', name: 'Glen Allen' },
  { type: 'City', name: 'Henrico' },
  { type: 'City', name: 'Chesapeake' },
  { type: 'City', name: 'Stafford' },
]

// Founder used for Person / E-E-A-T schema on /about. Public site refers to
// "Mr. Worden" — we mirror that exact phrasing here so the schema name
// matches the on-page content (Google flags mismatches).
export const FOUNDER = {
  name: 'Mr. Worden',
  jobTitle: 'Owner & Master Paver',
  description:
    "Started in the trade at age 14 working alongside his grandfather, the founder of J. Worden & Sons. Has personally run residential, commercial, and KFC franchise paving projects across 12+ states.",
}

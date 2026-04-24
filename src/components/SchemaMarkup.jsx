import { Helmet } from 'react-helmet-async'

const SITE_URL = 'https://jworden.netlify.app'

/**
 * Injects SEO meta tags, Open Graph, Twitter Card, and JSON-LD
 * structured data into <head> for a given page.
 *
 * Props:
 *   title       — page <title> (appended with brand)
 *   description — meta description (max ~160 chars)
 *   canonical   — canonical path, e.g. "/services"
 *   image       — absolute OG image URL (defaults to /og-default.jpg)
 *   schema      — JSON-LD object (or array of objects) to inject
 *   breadcrumb  — array of { name, path } for BreadcrumbList schema
 */
export default function SchemaMarkup({
  title,
  description,
  canonical = '/',
  image = `${SITE_URL}/og-default.jpg`,
  schema,
  breadcrumb,
}) {
  const fullTitle = `${title} | J. Worden & Sons Asphalt Paving`
  const canonicalUrl = `${SITE_URL}${canonical}`

  const schemas = []

  // Inject provided schema(s)
  if (schema) {
    if (Array.isArray(schema)) schemas.push(...schema)
    else schemas.push(schema)
  }

  // BreadcrumbList
  if (breadcrumb && breadcrumb.length > 0) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumb.map((item, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        name: item.name,
        item: `${SITE_URL}${item.path}`,
      })),
    })
  }

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph */}
      <meta property="og:type"        content="website" />
      <meta property="og:title"       content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url"         content={canonicalUrl} />
      <meta property="og:image"       content={image} />
      <meta property="og:site_name"   content="J. Worden & Sons Asphalt Paving" />

      {/* Twitter Card */}
      <meta name="twitter:card"        content="summary_large_image" />
      <meta name="twitter:title"       content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image"       content={image} />

      {/* JSON-LD blocks */}
      {schemas.map((s, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(s)}
        </script>
      ))}
    </Helmet>
  )
}

// ── Pre-built schema helpers ──────────────────────────────────────────────────

export const LOCAL_BUSINESS_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': ['PavingContractor', 'LocalBusiness'],
  name: 'J. Worden & Sons Asphalt Paving',
  description:
    'Fourth-generation asphalt paving company serving residential and commercial clients since 1984.',
  foundingDate: '1984',
  telephone: '+1-555-555-5555',
  email: 'contact@jworden.com',
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  address: {
    '@type': 'PostalAddress',
    streetAddress: '123 Paving Way',
    addressLocality: 'Your City',
    addressRegion: 'ST',
    postalCode: '00000',
    addressCountry: 'US',
  },
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '07:00',
      closes: '17:00',
    },
  ],
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.9',
    bestRating: '5',
    worstRating: '1',
    reviewCount: '87',
  },
}

export function serviceSchema(name, description, url) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name,
    description,
    provider: {
      '@type': 'LocalBusiness',
      name: 'J. Worden & Sons Asphalt Paving',
      url: SITE_URL,
    },
    areaServed: { '@type': 'State', name: 'Your State' },
    url: `${SITE_URL}${url}`,
  }
}

export function faqSchema(faqs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(({ question, answer }) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: { '@type': 'Answer', text: answer },
    })),
  }
}

export function reviewsSchema(reviews, aggregateRating) {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'J. Worden & Sons Asphalt Paving',
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: String(aggregateRating),
      bestRating: '5',
      worstRating: '1',
      reviewCount: String(reviews.length),
    },
    review: reviews.map((r) => ({
      '@type': 'Review',
      author: { '@type': 'Person', name: r.author },
      reviewRating: { '@type': 'Rating', ratingValue: String(r.rating) },
      reviewBody: r.text,
      datePublished: r.date,
    })),
  }
}

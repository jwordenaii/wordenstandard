/**
 * Schema.org JSON-LD builder functions.
 *
 * Kept in a separate module so that SchemaMarkup.jsx can be a
 * pure component file (required by react-refresh/only-export-components).
 *
 * SITE_URL is read from VITE_SITE_URL at build time so that staging and
 * production deployments automatically use the correct canonical domain.
 */

export const SITE_URL =
  import.meta.env.VITE_SITE_URL || 'https://jworden.netlify.app'

export const LOCAL_BUSINESS_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': ['PavingContractor', 'LocalBusiness'],
  name: 'J. Worden & Sons Asphalt Paving',
  description:
    'Fourth-generation asphalt paving company serving residential and commercial clients since 1984.',
  foundingDate: '1984',
  telephone: '+18044461296',
  email: 'contact@jwordenasphalt.com',
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  address: {
    '@type': 'PostalAddress',
    streetAddress: '1601 Ware Bottom Springs Rd Suite 214',
    addressLocality: 'Chester',
    addressRegion: 'VA',
    postalCode: '23836',
    addressCountry: 'US',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 37.3529,
    longitude: -77.4326,
  },
  areaServed: [
    { '@type': 'City', name: 'Chester', containedInPlace: { '@type': 'State', name: 'Virginia' } },
    { '@type': 'City', name: 'Richmond', containedInPlace: { '@type': 'State', name: 'Virginia' } },
    { '@type': 'City', name: 'Chesterfield', containedInPlace: { '@type': 'State', name: 'Virginia' } },
    { '@type': 'City', name: 'Colonial Heights', containedInPlace: { '@type': 'State', name: 'Virginia' } },
    { '@type': 'City', name: 'Hopewell', containedInPlace: { '@type': 'State', name: 'Virginia' } },
    { '@type': 'City', name: 'Petersburg', containedInPlace: { '@type': 'State', name: 'Virginia' } },
  ],
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

export function serviceSchema(name, description, url, priceRange) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name,
    description,
    provider: {
      '@type': 'LocalBusiness',
      name: 'J. Worden & Sons Asphalt Paving',
      telephone: '+18044461296',
      url: SITE_URL,
    },
    areaServed: [
      { '@type': 'City', name: 'Chester', containedInPlace: { '@type': 'State', name: 'Virginia' } },
      { '@type': 'City', name: 'Richmond', containedInPlace: { '@type': 'State', name: 'Virginia' } },
      { '@type': 'City', name: 'Chesterfield', containedInPlace: { '@type': 'State', name: 'Virginia' } },
      { '@type': 'City', name: 'Colonial Heights', containedInPlace: { '@type': 'State', name: 'Virginia' } },
    ],
    ...(priceRange
      ? {
          offers: {
            '@type': 'Offer',
            priceSpecification: {
              '@type': 'PriceSpecification',
              priceCurrency: 'USD',
              description: priceRange,
            },
          },
        }
      : {}),
    url: `${SITE_URL}${url}`,
  }
}

export function howToSchema(name, description, steps) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name,
    description,
    step: steps.map((s, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: s.name,
      text: s.text,
    })),
  }
}

export function videoObjectSchema({ name, description, thumbnailUrl, uploadDate, contentUrl }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name,
    description,
    thumbnailUrl,
    uploadDate,
    ...(contentUrl ? { contentUrl } : {}),
    publisher: {
      '@type': 'Organization',
      name: 'J. Worden & Sons Asphalt Paving',
      url: SITE_URL,
    },
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

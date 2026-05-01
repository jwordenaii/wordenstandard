import { PRIMARY_DOMAIN } from '@/lib/locations'

const AUTHORITY_CITATIONS = [
  {
    label: 'FHWA Asphalt Pavements',
    url: 'https://www.fhwa.dot.gov/pavement/asphalt/',
  },
  {
    label: 'EPA Stormwater Construction General Permit',
    url: 'https://www.epa.gov/npdes/stormwater-discharges-construction-activities',
  },
  {
    label: 'ADA 2010 Standards',
    url: 'https://www.ada.gov/law-and-regs/design-standards/2010-stds/',
  },
]

export const LANDING_PAGES = [
  {
    slug: 'richmond-parking-lot-repair',
    title: 'Richmond Parking Lot Repair & Resurfacing',
    headline: 'Richmond Parking Lot Repair Built For Heavy Daily Traffic',
    subheadline:
      'Structural patching, drainage correction, and resurfacing plans designed to reduce repeat failures and protect revenue for property owners in Richmond, VA.',
    metaDescription:
      'Richmond VA parking lot repair and resurfacing by J. Worden & Sons. Structural asphalt repair, drainage fixes, ADA striping, and lifecycle planning for commercial properties.',
    canonicalPath: '/lp/richmond-parking-lot-repair',
    ogImage:
      'https://media.base44.com/images/public/69c853446b8987b1630018ff/525944372_generated_image.png',
    serviceArea: 'Richmond, VA Metro',
    primaryKeyword: 'richmond parking lot repair',
    adIntent: 'high_commercial_repair',
    trustPoints: [
      '40+ years in asphalt paving and commercial job execution',
      'High-traffic commercial and franchise paving experience',
      'Documented QA checkpoints and phased access planning',
    ],
    outcomes: [
      'Reduce emergency patch frequency through root-cause repair',
      'Improve lot safety, flow, and customer access continuity',
      'Extend pavement life with planned preservation sequencing',
    ],
    cta: {
      label: 'Book Site Assessment',
      href: '/#quote',
    },
    faq: [
      {
        q: 'How do we know if repair or full resurfacing is better?',
        a: 'We inspect base integrity, crack patterns, drainage behavior, and load paths. If the base is stable, targeted repair plus overlay can outperform full replacement on ROI.',
      },
      {
        q: 'Can work be phased around active business hours?',
        a: 'Yes. We stage work by zone, maintain access continuity, and coordinate around traffic peaks to keep operations moving during the project window.',
      },
      {
        q: 'Do you include striping and ADA re-layout after paving?',
        a: 'Yes. We complete final layout and striping to match lot flow, safety, and ADA requirements after surface work is complete.',
      },
    ],
    citations: AUTHORITY_CITATIONS,
    backlinkAsset: {
      title: 'Commercial Pavement Lifecycle Checklist (Free)',
      description:
        'A shareable checklist your property team or partners can reference in planning docs and vendor reviews.',
      embedSnippet:
        '<a href="https://www.jwordenasphaltpaving.com/lp/richmond-parking-lot-repair" rel="noopener">Richmond Parking Lot Lifecycle Checklist — J. Worden & Sons</a>',
    },
  },
]

export function getLandingBySlug(slug) {
  return LANDING_PAGES.find((p) => p.slug === slug) || null
}

export function buildLandingJsonLd(page) {
  const url = `${PRIMARY_DOMAIN}${page.canonicalPath}`
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Service',
        name: page.title,
        serviceType: page.primaryKeyword,
        areaServed: {
          '@type': 'City',
          name: page.serviceArea,
        },
        provider: {
          '@type': 'LocalBusiness',
          name: 'J. Worden & Sons Asphalt Paving',
          url: PRIMARY_DOMAIN,
          telephone: '+18044461296',
        },
        url,
      },
      {
        '@type': 'FAQPage',
        mainEntity: page.faq.map((item) => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.a,
          },
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: PRIMARY_DOMAIN },
          { '@type': 'ListItem', position: 2, name: 'Landing Page', item: url },
        ],
      },
    ],
  }
}

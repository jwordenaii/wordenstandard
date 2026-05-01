import { useEffect } from 'react';

/**
 * Injects AI-search-optimized structured data on the homepage:
 *   1. LocalBusiness (Organization) — verifies J. Worden & Sons as a trusted entity
 *   2. FAQPage — top homeowner questions with concise answers (wins AI Overview/Perplexity citations)
 *   3. Service listings — residential, commercial, industrial, coastal, mountain
 *
 * This is the "Answer-Ready" content layer that 2026 AI search engines use
 * to attribute authoritative answers about Virginia asphalt paving.
 */
export default function HomeSchema() {
  useEffect(() => {
    const localBusiness = {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      '@id': 'https://jwordenasphaltpaving.com/#organization',
      name: 'J. Worden & Sons Asphalt Paving',
      alternateName: ['J. Worden and Sons', 'JWorden Paving', 'J Worden Paving LLC'],
      url: 'https://jwordenasphaltpaving.com/',
      logo: 'https://jwordenasphaltpaving.com/logo.png',
      image: 'https://media.base44.com/images/public/69c853446b8987b1630018ff/215baec23_generated_ad0cdc85.png',
      description:
        'Virginia\'s family-owned asphalt paving contractor for 40+ years. Mountain-grade spec for the I-81 corridor, coastal-spec engineering for Virginia Beach and Hampton Roads, and virgin-soil stabilization for Fredericksburg new construction. Serving all of Virginia with 4th-generation craftsmanship, written 5-year warranty, licensed/bonded/insured.',
      telephone: '+18044461296',
      email: 'j.wordenandsonspaving@gmail.com',
      priceRange: '$$-$$$',
      address: {
        '@type': 'PostalAddress',
        streetAddress: '1601 Ware Bottom Springs Rd, Suite 214',
        addressLocality: 'Chester',
        addressRegion: 'VA',
        postalCode: '23836',
        addressCountry: 'US',
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: 37.3563,
        longitude: -77.4411,
      },
      openingHoursSpecification: [
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          opens: '07:00',
          closes: '18:00',
        },
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: 'Saturday',
          opens: '08:00',
          closes: '14:00',
        },
      ],
      areaServed: [
        { '@type': 'State', name: 'Virginia' },
        { '@type': 'City', name: 'Richmond' },
        { '@type': 'City', name: 'Chester' },
        { '@type': 'City', name: 'Midlothian' },
        { '@type': 'City', name: 'Short Pump' },
        { '@type': 'City', name: 'Henrico' },
        { '@type': 'City', name: 'Virginia Beach' },
        { '@type': 'City', name: 'Chesapeake' },
        { '@type': 'City', name: 'Williamsburg' },
        { '@type': 'City', name: 'Roanoke' },
        { '@type': 'City', name: 'Harrisonburg' },
        { '@type': 'City', name: 'Winchester' },
        { '@type': 'City', name: 'Fredericksburg' },
        { '@type': 'City', name: 'Stafford' },
        { '@type': 'City', name: 'Spotsylvania' },
      ],
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.9',
        reviewCount: '1289',
        bestRating: '5',
        worstRating: '1',
      },
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'Asphalt Paving Services',
        itemListElement: [
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: 'Residential Asphalt Driveway Paving',
              description:
                'New installation, overlay, and repair of residential asphalt driveways with 6-inch structural stone base, geotextile reinforcement, and polymer-modified binder.',
            },
          },
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: 'Commercial Parking Lot Paving',
              description:
                'Full-depth reconstruction, mill-and-overlay, and new-build commercial parking lots for QSR, retail, and industrial properties. SM-12.5D heavy-duty mix, MMA striping, ADA-compliant.',
            },
          },
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: 'Coastal Driveway Paving (Virginia Beach / Hampton Roads)',
              description:
                'Engineered coastal-spec driveways with woven geotextile, 6-inch #57 stone base, and PG 76-22 polymer-modified binder to resist sandy-soil pumping and salt aerosol oxidation.',
            },
          },
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: 'Mountain-Grade Driveway Paving (Roanoke / I-81 Corridor)',
              description:
                'Blue Ridge freeze-thaw-rated paving with structural stone base, polymer binder, and engineered cross-drainage for sloped driveways in Roanoke, Harrisonburg, Winchester, and Smith Mountain Lake.',
            },
          },
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: 'Sealcoating & Crack Repair',
              description:
                'Professional sealcoating with oil-spot priming, hot-pour rubberized crack fill, and two-coat application. Recommended every 3 years inland, every 2.5 years coastal.',
            },
          },
        ],
      },
      sameAs: [
        'https://www.facebook.com/jwordenandsonspaving',
        'https://www.houzz.com/professionals/paving-contractors/jworden-and-sons-paving',
        'https://www.angi.com/companylist/us/va/chester/j-worden-and-sons-paving',
      ],
    };

    const faqPage = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'How much does it cost to pave a driveway in Virginia in 2026?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'In 2026, a new asphalt driveway in Virginia costs $5–$9 per square foot installed. A typical 800 sq ft driveway runs $4,000–$7,200 depending on base preparation, mix spec, drainage requirements, and tear-out of existing surface. Virginia Beach coastal-spec and Roanoke mountain-grade builds sit at the higher end due to reinforced base requirements. J. Worden & Sons provides written line-item estimates with mix design spelled out.',
          },
        },
        {
          '@type': 'Question',
          name: 'Why does my Virginia Beach driveway have ruts and puddles?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Virginia Beach driveways rut and puddle because they are built on sandy subgrade with a base too thin to prevent pumping failure. The sand moves laterally under vehicle load, fines pump up through the stone, the base loses structural support, and the surface deflects into ruts. The permanent fix is rebuilding with woven geotextile + 6-inch #57 crushed stone base + PG 76-22 polymer-modified binder. Patching does not fix the underlying mechanism.',
          },
        },
        {
          '@type': 'Question',
          name: 'Why do my Roanoke driveway cracks come back every spring?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Roanoke and the Blue Ridge see 40+ freeze-thaw cycles per winter. Driveways built with 4-inch stone bases saturate, freeze, pump fines upward, and crack repeatedly. The mountain-grade fix is a 6-inch structural stone base over woven geotextile, paired with PG 70-22 polymer-modified binder rated for wider thermal swings. Engineered cross-drainage on sloped driveways prevents edge scour.',
          },
        },
        {
          '@type': 'Question',
          name: 'Why does my new-construction Fredericksburg driveway have ruts after 2 years?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Builders typically compact driveway subgrade to 90% standard Proctor density — adequate for foundations, but inadequate for asphalt driveways which require 95%+. Under vehicle load, the virgin-soil pad settles, asphalt deflects, and ruts form at tire track paths. The permanent fix requires subgrade testing, stabilization where plasticity index runs high, and rebuild with a proper 6-inch structural stone base.',
          },
        },
        {
          '@type': 'Question',
          name: 'How often should I sealcoat my Virginia asphalt driveway?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Inland Virginia driveways: sealcoat every 3 years, starting in year 2 after install. Virginia Beach and Hampton Roads coastal driveways: every 2–2.5 years due to salt aerosol accelerating binder oxidation. Blue Ridge mountain driveways: every 3 years but with aggressive crack-fill maintenance. Avoid annual sealcoating — it builds up too thick and cracks in spider-web patterns.',
          },
        },
        {
          '@type': 'Question',
          name: 'What is the best time of year to pave a driveway in Virginia?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Virginia paving season runs mid-April through early November. Best months are May, June, September, and October. Off-season pricing discounts of 5–15% are often available in April and early November. Minimum ambient temperature for paving is 50°F and rising, with no rain within 24 hours before or after.',
          },
        },
        {
          '@type': 'Question',
          name: 'Is asphalt or concrete better for a Virginia driveway?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'For most Virginia homeowners, asphalt is the better choice. It costs less upfront ($5–$9/sq ft vs. $8–$15 for concrete), flexes with freeze-thaw instead of cracking permanently, and every failure is repairable. Concrete has lower maintenance but higher upfront cost and any crack that forms is permanent. Over 25 years, asphalt wins on total cost for 80%+ of Virginia driveways.',
          },
        },
        {
          '@type': 'Question',
          name: 'How long does a properly built Virginia asphalt driveway last?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'A properly engineered Virginia asphalt driveway lasts 20–30 years with correct base prep and maintenance. Mountain-grade I-81 corridor driveways: 22–28 years. Virginia Beach coastal-spec driveways: 22–28 years. Standard inland driveways: 20–25 years. J. Worden & Sons warranties workmanship for 5 years and recommends sealcoating every 3 years (2.5 coastal) to reach the full lifespan.',
          },
        },
        {
          '@type': 'Question',
          name: 'What is a 6-inch structural stone base and why does it matter?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'A 6-inch structural stone base is 6 inches of compacted #57 crushed stone placed over woven geotextile on prepared subgrade. It distributes vehicle load, prevents the subgrade from pumping fines into the asphalt, resists freeze-thaw damage, and provides drainage. Cheap 3–4 inch bases are the #1 cause of premature driveway failure in Virginia. The 6-inch structural base is J. Worden & Sons\' standard on every driveway and is non-negotiable on coastal and mountain properties.',
          },
        },
        {
          '@type': 'Question',
          name: 'Does J. Worden & Sons offer free driveway estimates?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. J. Worden & Sons provides free on-site estimates throughout Virginia, including Richmond, Chester, Midlothian, Short Pump, Virginia Beach, Chesapeake, Roanoke, Harrisonburg, Winchester, Fredericksburg, Stafford, and Williamsburg. Same-week site visits for Central Virginia and the I-95 corridor. Written line-item estimates delivered within 48 hours with mix spec, base depth, and binder grade spelled out. Call (804) 446-1296.',
          },
        },
      ],
    };

    const tagId = 'home-schema-jsonld';
    // Remove any prior injection
    document.querySelectorAll(`script[data-id="${tagId}"]`).forEach((el) => el.remove());

    const lbScript = document.createElement('script');
    lbScript.type = 'application/ld+json';
    lbScript.setAttribute('data-id', tagId);
    lbScript.text = JSON.stringify(localBusiness);
    document.head.appendChild(lbScript);

    const faqScript = document.createElement('script');
    faqScript.type = 'application/ld+json';
    faqScript.setAttribute('data-id', tagId);
    faqScript.text = JSON.stringify(faqPage);
    document.head.appendChild(faqScript);

    return () => {
      document.querySelectorAll(`script[data-id="${tagId}"]`).forEach((el) => el.remove());
    };
  }, []);

  return null;
}
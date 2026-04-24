from fastapi import APIRouter

router = APIRouter(prefix="/api/v1/schema", tags=["schema"])

_LOCAL_BUSINESS_SCHEMA = {
    "@context": "https://schema.org",
    "@type": ["PavingContractor", "LocalBusiness"],
    "name": "J. Worden & Sons Asphalt Paving",
    "alternateName": "JWordenAI",
    "description": (
        "Fourth-generation asphalt paving company serving residential and commercial "
        "clients since 1984. Specialists in asphalt paving, sealcoating, crack filling, "
        "parking lots, and driveways."
    ),
    "foundingDate": "1984",
    "telephone": "+1-555-WORDEN1",   # TODO: replace with real number
    "email": "contact@jworden.com",  # TODO: replace with real email
    "url": "https://jworden.netlify.app",
    "logo": "https://jworden.netlify.app/logo.png",
    "image": "https://jworden.netlify.app/hero.jpg",
    "address": {
        "@type": "PostalAddress",
        "streetAddress": "123 Paving Way",   # TODO: replace with real address
        "addressLocality": "Your City",
        "addressRegion": "ST",
        "postalCode": "00000",
        "addressCountry": "US",
    },
    "geo": {
        "@type": "GeoCoordinates",
        "latitude": 0.0,    # TODO: replace with real coordinates
        "longitude": 0.0,
    },
    "openingHoursSpecification": [
        {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
            "opens": "07:00",
            "closes": "17:00",
        }
    ],
    "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.9",
        "bestRating": "5",
        "worstRating": "1",
        "reviewCount": "87",
    },
    "hasOfferCatalog": {
        "@type": "OfferCatalog",
        "name": "Asphalt Services",
        "itemListElement": [
            {
                "@type": "Offer",
                "itemOffered": {
                    "@type": "Service",
                    "name": "Asphalt Paving",
                    "description": "New asphalt paving for driveways, parking lots, and roads.",
                },
            },
            {
                "@type": "Offer",
                "itemOffered": {
                    "@type": "Service",
                    "name": "Sealcoating",
                    "description": "Protective sealcoating to extend asphalt lifespan.",
                },
            },
            {
                "@type": "Offer",
                "itemOffered": {
                    "@type": "Service",
                    "name": "Crack Filling",
                    "description": "Professional crack fill and repair for existing asphalt.",
                },
            },
            {
                "@type": "Offer",
                "itemOffered": {
                    "@type": "Service",
                    "name": "Parking Lot Construction",
                    "description": "Full-service commercial parking lot design and installation.",
                },
            },
        ],
    },
    "sameAs": [
        "https://www.google.com/maps/place/JWordenSons",  # TODO: replace with real Maps link
    ],
}


@router.get("/local-business", summary="JSON-LD LocalBusiness schema")
def get_local_business_schema():
    """
    Returns the Schema.org JSON-LD object for the company.
    Frontend injects this directly into <script type='application/ld+json'>.
    """
    return _LOCAL_BUSINESS_SCHEMA

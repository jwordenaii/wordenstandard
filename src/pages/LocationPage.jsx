import React from 'react';
import { Link } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { getLocationBySlug, PRIMARY_DOMAIN } from '@/lib/locations';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SEO from '@/components/SEO';
import MarketHero from '@/components/market/MarketHero';
import MarketCityList from '@/components/market/MarketCityList';
import MarketClimate from '@/components/market/MarketClimate';
import MarketFAQ from '@/components/market/MarketFAQ';
import MarketCTA from '@/components/market/MarketCTA';
import PageNotFound from '@/lib/PageNotFound';

export default function LocationPage() {
  const { slug } = useParams();
  const loc = getLocationBySlug(slug);

  if (!loc) return <PageNotFound />;

  const canonicalPath = `/locations/${loc.slug}`;
  const title = `Asphalt Paving in ${loc.city}, ${loc.stateAbbr} | J. Worden & Sons`;
  const description = `Professional asphalt paving in ${loc.city}, ${loc.state}. ${loc.region} specialists with 40+ years of family-owned experience. Driveways, parking lots, sealcoating. Call (804) 446-1296.`;

  // LocalBusiness + FAQPage JSON-LD combined
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'GeneralContractor',
        '@id': `${PRIMARY_DOMAIN}${canonicalPath}#business`,
        name: `J. Worden & Sons Asphalt Paving — ${loc.city}`,
        image: 'https://media.base44.com/images/public/69c853446b8987b1630018ff/fd6e29837_20171212_192947499_iOS.jpg',
        url: `${PRIMARY_DOMAIN}${canonicalPath}`,
        telephone: '+1-804-446-1296',
        email: 'j.wordenandsonspaving@gmail.com',
        priceRange: '$$',
        address: {
          '@type': 'PostalAddress',
          streetAddress: '1601 Ware Bottom Springs Rd, Suite 214',
          addressLocality: 'Chester',
          addressRegion: 'VA',
          postalCode: '23836',
          addressCountry: 'US',
        },
        areaServed: {
          '@type': 'City',
          name: loc.city,
          address: {
            '@type': 'PostalAddress',
            addressLocality: loc.city,
            addressRegion: loc.stateAbbr,
            addressCountry: 'US',
          },
        },
        geo: {
          '@type': 'GeoCoordinates',
          latitude: loc.geo.lat,
          longitude: loc.geo.lng,
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: loc.rating,
          reviewCount: loc.reviews,
        },
        description: loc.intro,
      },
      {
        '@type': 'FAQPage',
        mainEntity: loc.faqs.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: {
            '@type': 'Answer',
            text: f.a,
          },
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: PRIMARY_DOMAIN },
          { '@type': 'ListItem', position: 2, name: 'Service Areas', item: `${PRIMARY_DOMAIN}/locations` },
          { '@type': 'ListItem', position: 3, name: `${loc.city}, ${loc.stateAbbr}`, item: `${PRIMARY_DOMAIN}${canonicalPath}` },
        ],
      },
    ],
  };

  return (
    <div className="min-h-screen bg-background font-body">
      <SEO
        title={title}
        description={description}
        canonicalPath={canonicalPath}
        jsonLd={jsonLd}
      />
      <Navbar />
      <MarketHero
        city={loc.city}
        state={loc.state}
        region={loc.region}
        headline={loc.headline}
        intro={loc.intro}
      />
      <div id="market-content">
        <MarketCityList
          city={loc.city}
          state={loc.state}
          neighborhoods={loc.neighborhoods}
          landmarks={loc.landmarks}
        />

        {loc.slug === 'richmond-va' && (
          <section className="border-t border-border py-12 md:py-14">
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
              <div className="premium-panel rounded-2xl p-6 md:p-8">
                <p className="font-display text-primary text-xs tracking-[0.28em] uppercase mb-3">
                  Richmond Commercial Resources
                </p>
                <h2 className="font-display font-black text-foreground text-2xl md:text-3xl uppercase tracking-tight">
                  Explore Detailed Commercial Scope And Proof
                </h2>
                <p className="text-muted-foreground text-sm md:text-base mt-3 leading-relaxed max-w-3xl">
                  Review our Richmond commercial planning page and project evidence before requesting your estimate.
                </p>
                <div className="flex flex-wrap gap-3 mt-6">
                  <Link
                    to="/commercial/richmond-va"
                    className="premium-cta px-5 py-3 font-display font-bold text-xs tracking-[0.14em] uppercase text-primary-foreground"
                  >
                    Richmond Commercial Page
                  </Link>
                  <Link
                    to="/#projects"
                    className="border border-primary/40 text-primary px-5 py-3 font-display font-bold text-xs tracking-[0.14em] uppercase hover:bg-primary/10 transition-colors"
                  >
                    Richmond Project Proof
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}

        <MarketClimate climate={loc.climate} city={loc.city} />
        <MarketFAQ faqs={loc.faqs} city={loc.city} />
        <MarketCTA city={loc.city} state={loc.stateAbbr} />
      </div>
      <Footer />
    </div>
  );
}
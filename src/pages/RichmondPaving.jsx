import React from 'react'
import { Link } from 'react-router-dom'
import { Construction, MapPin, Trophy, CheckCircle2, Star, Zap, ShieldCheck, Phone } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import SEO from '@/components/SEO'
import { trackPhoneClick } from '@/lib/analytics'
import { legacyPortfolioImages } from '@/data/legacyPortfolio'

// Richmond's real geography — this is what ranks locally.
const RICHMOND_ZONES = [
  { area: 'The Fan & Museum District', detail: 'Residential driveways and alley paving in Richmond City\'s historic neighborhoods — tight access, precision work, no margin for error.' },
  { area: 'Scott\'s Addition', detail: 'Brewery districts, mixed-use commercial courtyards, and rapidly developing urban lots. We work nights to keep the district moving.' },
  { area: 'Shockoe Bottom & Slip', detail: 'Urban commercial and restaurant row parking. We\'ve maintained lots serving Richmond\'s restaurant corridor for decades.' },
  { area: 'Manchester / South Richmond', detail: 'Heavy industrial and logistics yards along the James River corridor — full-depth concrete and asphalt for high-axle-load surfaces.' },
  { area: 'West End / Short Pump', detail: 'Suburban retail, HOA communities, and commercial strip paving in Henrico\'s fastest-growing commercial corridor.' },
  { area: 'Midlothian / Chesterfield', detail: 'Our home base. We know every subdivision, every commercial strip, and every drainage problem on Route 360 and Midlothian Turnpike.' },
]

const SERVICES = [
  { title: 'New Asphalt Driveways', desc: 'Grade-A, machine-laid residential driveways with 6" compacted stone base. Built for Virginia clay soil, not patched together.' },
  { title: 'Commercial Parking Lots', desc: 'New construction through mill & overlay. Phased active-property scheduling so your tenants never lose access.' },
  { title: 'VDOT Road Construction', desc: 'Prequalified for VDOT contracts. We bid and execute public roadway paving across the Richmond district.' },
  { title: 'Asphalt Resurfacing', desc: 'Mill failed surface layers and machine-lay fresh asphalt. The cost-effective solution for oxidized and cracked pavement.' },
  { title: 'Industrial Yard Paving', desc: 'Heavy-duty 4"+ asphalt sections for logistics yards, trucking facilities, and port access roads that bear serious axle weight.' },
  { title: 'Same-Day Emergency Paving', desc: 'Pothole failures, collapse events, utility cut restoration — our rapid-response crews deploy within hours in the Richmond metro.' },
]

const FAQS = [
  {
    q: 'How much does asphalt paving cost in Richmond, VA?',
    a: 'Residential driveways in Richmond typically run $4–$8 per square foot depending on base conditions, access, and scope. Commercial lots range $3–$6/sqft at scale. Virginia clay soil often requires additional base work — we assess that upfront and include it in our written scope.',
  },
  {
    q: 'How long does asphalt paving last in Richmond\'s climate?',
    a: 'Richmond\'s climate is aggressive — hot humid summers accelerate oxidation and winter freeze-thaw cycles crack neglected pavement. A properly installed driveway or parking lot lasts 20–25 years with a sealcoating program every 3–5 years.',
  },
  {
    q: 'Are you licensed and insured to pave in Virginia?',
    a: 'Yes. We carry full Virginia contractor licensing, general liability, and workers\' compensation. We are VDOT-prequalified and carry all required insurance for both residential and commercial work.',
  },
  {
    q: 'Do you pave in Richmond City, Chesterfield, and Henrico?',
    a: 'Yes. Our primary service area covers Richmond City, Chesterfield County, Henrico County, Colonial Heights, Petersburg, Hopewell, and all surrounding areas within the Richmond metro.',
  },
]

export default function RichmondPaving() {
  const heroImg = legacyPortfolioImages[4]

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'LocalBusiness',
        name: 'J. Worden & Sons Asphalt Paving',
        url: 'https://www.jwordenasphaltpaving.com/',
        telephone: '+18044461296',
        priceRange: '$$',
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Chester',
          addressRegion: 'VA',
          postalCode: '23831',
          addressCountry: 'US',
        },
        geo: { '@type': 'GeoCoordinates', latitude: 37.3550, longitude: -77.4410 },
        areaServed: [
          'Richmond, VA', 'Chesterfield, VA', 'Henrico, VA',
          'Midlothian, VA', 'Colonial Heights, VA', 'Petersburg, VA', 'Hopewell, VA',
        ],
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: 'Asphalt Paving Services',
          itemListElement: SERVICES.map(s => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: s.title } })),
        },
        aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.9', reviewCount: '178' },
      },
      {
        '@type': 'FAQPage',
        mainEntity: FAQS.map(faq => ({
          '@type': 'Question',
          name: faq.q,
          acceptedAnswer: { '@type': 'Answer', text: faq.a },
        })),
      },
    ],
  }

  return (
    <div className="min-h-screen bg-brand-navy">
      <SEO
        title="Asphalt Paving Richmond VA | Driveways, Parking Lots & Roads"
        description="J. Worden & Sons — Richmond VA's most trusted asphalt paving contractor since 1984. Driveways, parking lots, roads, and emergency repairs. Serving Chesterfield, Henrico, Midlothian, and all Richmond metro areas."
        canonicalPath="/richmond-paving"
        jsonLd={jsonLd}
      />
      <Navbar />

      {/* HERO */}
      <section className="relative pt-32 pb-24 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-navy via-brand-navy to-black opacity-90" />
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(${heroImg?.url || 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80'})` }}
        />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="max-w-3xl">
            <div className="flex flex-wrap gap-2 mb-6">
              <span className="inline-flex items-center gap-2 bg-brand-amber/10 text-brand-amber text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                <MapPin className="w-3 h-3" /> Chester, VA — Serving All of Richmond Metro
              </span>
              <span className="inline-flex items-center gap-2 bg-yellow-400/10 text-yellow-400 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                <Trophy className="w-3 h-3" /> 4th Generation Since 1984
              </span>
            </div>
            <h1 className="font-display font-black text-6xl md:text-8xl text-white leading-[0.9] tracking-tighter mb-8">
              RICHMOND'S<br /><span className="text-brand-amber">PAVING</span><br />LEGACY.
            </h1>
            <p className="text-white/70 text-xl max-w-2xl mb-10 leading-relaxed">
              Four generations. 40+ years. Hundreds of Richmond-area driveways, parking lots, and road sections — from The Fan to Midlothian, from Scott's Addition to Colonial Heights. We are the Richmond asphalt standard.
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href="tel:+18044461296"
                onClick={() => trackPhoneClick('richmond-paving-hero')}
                className="btn-primary py-5 px-10 text-lg font-black flex items-center gap-2"
              >
                <Phone className="w-5 h-5" /> (804) 446-1296
              </a>
              <Link to="/quote" className="btn-outline py-5 px-10 text-white text-lg font-black">
                Free Estimate
              </Link>
            </div>

            {/* Stat bar */}
            <div className="grid grid-cols-4 gap-8 mt-16 pt-8 border-t border-white/10">
              {[
                { val: '40+', label: 'Years in VA' },
                { val: '4.9★', label: 'Google Rating' },
                { val: '500+', label: 'Projects Done' },
                { val: 'VDOT', label: 'Prequalified' },
              ].map(stat => (
                <div key={stat.label}>
                  <p className="text-brand-amber font-black text-3xl">{stat.val}</p>
                  <p className="text-white/30 text-xs uppercase tracking-widest mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
            {/* Awards */}
            <div className="flex flex-wrap items-center gap-2 mt-6 pt-6 border-t border-white/10">
              <span className="text-white/30 text-xs uppercase tracking-widest font-bold">Awards:</span>
              <span className="bg-brand-amber/10 text-brand-amber text-xs font-bold px-3 py-1.5 rounded-full">🏆 Pavement Mag Top 75</span>
              <span className="bg-white/10 text-white/80 text-xs font-bold px-3 py-1.5 rounded-full">⭐ Best of Houzz</span>
              <span className="bg-white/10 text-white/80 text-xs font-bold px-3 py-1.5 rounded-full">🎖 2026 Top Contractor Nominee</span>
            </div>
          </div>
        </div>
      </section>

      {/* LOCAL RICHMOND ZONES */}
      <section className="py-24 bg-white/5 border-y border-white/10 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block bg-brand-amber/10 text-brand-amber text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">Local Expertise</span>
            <h2 className="text-white font-black text-3xl md:text-5xl tracking-tight">We've Paved Every Part of Richmond.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {RICHMOND_ZONES.map((zone, i) => (
              <div key={i} className="bg-brand-navy border border-white/10 p-7 rounded-2xl hover:border-brand-amber/40 transition-all">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-brand-amber flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-white font-black text-base mb-2">{zone.area}</h3>
                    <p className="text-white/40 text-sm leading-relaxed">{zone.detail}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-white font-black text-3xl md:text-5xl tracking-tight mb-4">Everything Asphalt.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {SERVICES.map((svc, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-3xl p-8 hover:border-brand-amber/30 transition-all group">
                <Construction className="w-8 h-8 text-brand-amber mb-5 group-hover:scale-110 transition-transform" />
                <h3 className="text-white font-black text-xl mb-3 tracking-tight">{svc.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{svc.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-white/5 border-t border-white/10 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-white font-black text-3xl md:text-5xl tracking-tight text-center mb-14">Richmond Paving FAQs.</h2>
          <div className="space-y-6">
            {FAQS.map((faq, i) => (
              <div key={i} className="bg-brand-navy border border-white/10 rounded-2xl p-8">
                <h3 className="text-white font-bold text-lg mb-3">{faq.q}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto bg-brand-amber rounded-[2.5rem] p-12 md:p-16 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10"><Star size={140} /></div>
          <p className="text-brand-navy/60 font-bold uppercase tracking-widest text-sm mb-4">The Richmond Standard</p>
          <h2 className="text-brand-navy font-black text-3xl md:text-5xl leading-tight mb-6">
            40 Years. One Standard. No Shortcuts.
          </h2>
          <p className="text-brand-navy/60 text-lg mb-8 max-w-2xl mx-auto">
            Call the crew that Chesterfield, Henrico, and Richmond City have trusted since 1984.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a
              href="tel:+18044461296"
              onClick={() => trackPhoneClick('richmond-paving-cta')}
              className="bg-brand-navy text-white font-black py-4 px-8 rounded-full hover:bg-brand-navy/80 transition-colors"
            >
              Call (804) 446-1296
            </a>
            <Link to="/quote" className="bg-white/20 text-brand-navy font-black py-4 px-8 rounded-full hover:bg-white/30 transition-colors">
              Get Free Estimate
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

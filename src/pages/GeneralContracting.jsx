import React from 'react'
import { Link } from 'react-router-dom'
import { Building2, CheckCircle2, ClipboardCheck, Phone, ShieldCheck } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import SEO from '@/components/SEO'
import { trackPhoneClick } from '@/lib/analytics'

const GC_SERVICES = [
  'Full permit acquisition and municipal coordination',
  'Bid package development and subcontractor management',
  'Milestone scheduling with weekly owner updates',
  'Budget controls and change-order tracking',
  'Site safety compliance and quality control checkpoints',
  'Final turnover, punch-list closeout, and documentation',
]

const GC_MARKETS = [
  'Commercial tenant improvements',
  'Ground-up franchise and QSR projects',
  'Industrial and logistics support builds',
  'Site-work coordinated paving and exterior scopes',
]

const GC_FAQS = [
  {
    q: 'What does your GC team handle from start to finish?',
    a: 'We handle permits, subcontractor coordination, schedules, budget tracking, quality control, and closeout so owners have one accountable point of contact.',
  },
  {
    q: 'Do you support paving projects that need full GC oversight?',
    a: 'Yes. We coordinate site-work, utilities, concrete, and paving-related trades under one delivery plan for smoother execution.',
  },
  {
    q: 'Can you manage active-site schedules for businesses that stay open?',
    a: 'Yes. We phase work around operating hours and maintain access planning so business operations can continue during construction.',
  },
]

export default function GeneralContracting() {
  const canonicalPath = '/general-contracting'
  const title = 'General Contracting Services in Virginia | J. Worden & Sons'
  const description =
    'Licensed general contracting for commercial and site-driven projects in Virginia. One accountable team for permitting, scheduling, quality control, and delivery.'

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Service',
        '@id': 'https://www.jwordenasphaltpaving.com/general-contracting#service',
        name: 'General Contracting Services',
        provider: {
          '@type': 'LocalBusiness',
          name: 'J. Worden & Sons Asphalt Paving',
          url: 'https://www.jwordenasphaltpaving.com/',
          telephone: '+18044461296',
        },
        areaServed: {
          '@type': 'State',
          name: 'Virginia',
        },
        serviceType: [
          'General contracting',
          'Permit and compliance coordination',
          'Construction scheduling and subcontractor management',
          'Commercial project delivery',
        ],
        url: 'https://www.jwordenasphaltpaving.com/general-contracting',
      },
      {
        '@type': 'FAQPage',
        mainEntity: GC_FAQS.map((item) => ({
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
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.jwordenasphaltpaving.com/' },
          { '@type': 'ListItem', position: 2, name: 'General Contracting', item: 'https://www.jwordenasphaltpaving.com/general-contracting' },
        ],
      },
    ],
  }

  return (
    <div className="min-h-screen bg-background font-body">
      <SEO title={title} description={description} canonicalPath={canonicalPath} jsonLd={jsonLd} />
      <Navbar />

      <section className="relative border-b border-border pt-32 pb-16 md:pb-20 overflow-hidden">
        <div className="absolute -top-16 right-0 w-72 h-72 rounded-full bg-primary/12 blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <p className="font-display text-primary text-xs tracking-[0.3em] uppercase mb-4">General Contracting Division</p>
          <h1 className="font-display font-black text-foreground text-4xl md:text-6xl uppercase tracking-tight leading-[0.95] max-w-5xl">
            General Contracting Under One Accountable Team
          </h1>
          <p className="text-muted-foreground text-base md:text-lg mt-6 max-w-3xl leading-relaxed">
            From permit coordination to final closeout, we run construction delivery with clear scope,
            disciplined schedules, and single-source accountability for owners and operators.
          </p>

          <div className="flex flex-wrap gap-3 mt-8">
            <a
              href="tel:+18044461296"
              onClick={() => trackPhoneClick('gc_page_hero')}
              className="premium-cta inline-flex items-center gap-2 px-6 py-4 font-display font-bold text-sm tracking-[0.14em] uppercase text-primary-foreground"
            >
              <Phone className="w-4 h-4" />
              Call 804-446-1296
            </a>
            <Link
              to="/#quote"
              className="border border-primary/50 text-primary px-6 py-4 font-display font-bold text-sm tracking-[0.14em] uppercase hover:bg-primary/10 transition-colors"
            >
              Request GC Consultation
            </Link>
          </div>
        </div>
      </section>

      <section className="py-14 md:py-16 border-b border-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="premium-panel rounded-2xl p-6 md:p-8">
              <h2 className="font-display font-black text-foreground text-2xl md:text-3xl uppercase tracking-tight mb-4">
                Core GC Services
              </h2>
              <div className="space-y-3">
                {GC_SERVICES.map((item) => (
                  <div key={item} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <p className="text-sm text-foreground/90 leading-relaxed">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="premium-panel rounded-2xl p-6 md:p-8">
              <h2 className="font-display font-black text-foreground text-2xl md:text-3xl uppercase tracking-tight mb-4">
                Where We Deliver Best
              </h2>
              <div className="space-y-3">
                {GC_MARKETS.map((item) => (
                  <div key={item} className="flex items-start gap-2.5">
                    <ClipboardCheck className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <p className="text-sm text-foreground/90 leading-relaxed">{item}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-6">
                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                Structured communication, risk controls, and predictable execution
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-14 md:py-18 border-b border-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <p className="font-display text-primary text-xs tracking-[0.28em] uppercase mb-2">Commercial Alignment</p>
          <h2 className="font-display font-black text-foreground text-3xl md:text-5xl uppercase tracking-tight leading-[0.95] mb-6">
            Need Paving Plus Full Project Oversight?
          </h2>
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-3xl mb-8">
            Pair this GC division with our Richmond commercial paving team when your scope includes multiple trades,
            phased access, and strict scheduling requirements.
          </p>
          <Link
            to="/commercial/richmond-va"
            className="border border-primary/40 text-primary px-6 py-4 font-display font-bold text-xs tracking-[0.14em] uppercase hover:bg-primary/10 transition-colors inline-flex items-center gap-2"
          >
            <Building2 className="w-4 h-4" />
            View Commercial Paving Division
          </Link>
        </div>
      </section>

      <section className="py-14 md:py-18 border-b border-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <p className="font-display text-primary text-xs tracking-[0.28em] uppercase mb-2">Common Questions</p>
          <h2 className="font-display font-black text-foreground text-3xl md:text-5xl uppercase tracking-tight leading-[0.95] mb-8">
            General Contracting FAQ
          </h2>
          <div className="space-y-4">
            {GC_FAQS.map((item) => (
              <article key={item.q} className="border border-border bg-card p-5 md:p-6">
                <h3 className="font-display font-black text-foreground text-lg md:text-xl uppercase tracking-tight leading-tight">
                  {item.q}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mt-3">{item.a}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 md:py-18">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="premium-panel rounded-2xl p-7 md:p-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <p className="font-display text-primary text-xs tracking-[0.28em] uppercase mb-2">Start Your Project</p>
              <h2 className="font-display font-black text-foreground text-3xl uppercase tracking-tight">Book A GC Planning Call</h2>
              <p className="text-muted-foreground text-sm md:text-base mt-3 max-w-2xl leading-relaxed">
                We will map permitting, timeline, major risks, and delivery strategy before construction begins.
              </p>
            </div>
            <a
              href="tel:+18044461296"
              onClick={() => trackPhoneClick('gc_page_footer_cta')}
              className="premium-cta inline-flex items-center gap-2 px-6 py-4 font-display font-bold text-sm tracking-[0.14em] uppercase text-primary-foreground"
            >
              <Building2 className="w-4 h-4" />
              Talk To GC Team
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

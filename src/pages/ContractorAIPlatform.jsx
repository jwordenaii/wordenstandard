import React from 'react'
import { Link } from 'react-router-dom'
import { BarChart3, Bot, Camera, Map, Phone, Route } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import SEO from '@/components/SEO'
import { trackPhoneClick } from '@/lib/analytics'

const PILLARS = [
  {
    id: 'data-pipeline',
    icon: BarChart3,
    title: 'Closed-Loop Data Pipeline',
    body: 'Capture and connect live lead, estimate, dispatch, crew, weather, production, and billing data so every job improves the next one.',
  },
  {
    id: 'estimate-intel',
    icon: Bot,
    title: 'Estimate And Profit Intelligence',
    body: 'Track estimate-vs-actual outcomes by service and market, then adjust pricing and scope recommendations based on real margin performance.',
  },
  {
    id: 'dispatch-routing',
    icon: Route,
    title: 'Dispatch And Routing Optimization',
    body: 'Use AI to sequence jobs, assign crews, and optimize routes around traffic, weather windows, and equipment availability.',
  },
  {
    id: 'vision-qa-reputation',
    icon: Camera,
    title: 'Vision QA And Reputation Automation',
    body: 'Detect field quality risks from photos, reduce callbacks, and automate review workflows with rapid response for negative feedback.',
  },
  {
    id: 'expansion-intelligence',
    icon: Map,
    title: 'Expansion Intelligence By Corridor',
    body: 'Prioritize markets using demand, permits, service fit, and competitor gaps so growth decisions are data-backed instead of guesswork.',
  },
]

const KPI_LIST = [
  'Cost per booked lead (CAC)',
  'Close rate by service and market',
  'Gross margin by job type',
  'Rework rate and callback frequency',
  'Cycle time from lead to invoice',
  'On-time completion percentage',
]

export default function ContractorAIPlatform() {
  const canonicalPath = '/contractor-ai'
  const title = 'Contractor AI System | J. Worden & Sons'
  const description =
    'The five-part Contractor AI system for data, estimating, dispatch, quality, and growth intelligence across paving operations.'

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': 'https://www.jwordenasphaltpaving.com/contractor-ai#page',
        url: 'https://www.jwordenasphaltpaving.com/contractor-ai',
        name: 'Contractor AI System',
        description,
      },
      {
        '@type': 'ItemList',
        name: 'Contractor AI Priority Stack',
        itemListElement: PILLARS.map((p, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: p.title,
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.jwordenasphaltpaving.com/' },
          { '@type': 'ListItem', position: 2, name: 'Contractor AI', item: 'https://www.jwordenasphaltpaving.com/contractor-ai' },
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
          <p className="font-display text-primary text-xs tracking-[0.3em] uppercase mb-4">Contractor AI Platform</p>
          <h1 className="font-display font-black text-foreground text-4xl md:text-6xl uppercase tracking-tight leading-[0.95] max-w-5xl">
            The 5-Part System To Build The Best Contractor AI In The World
          </h1>
          <p className="text-muted-foreground text-base md:text-lg mt-6 max-w-3xl leading-relaxed">
            This framework turns field operations into a compounding intelligence engine for better pricing, faster execution, and stronger margins.
          </p>

          <div className="flex flex-wrap gap-3 mt-8">
            <a
              href="tel:+18044461296"
              onClick={() => trackPhoneClick('contractor_ai_hero')}
              className="premium-cta inline-flex items-center gap-2 px-6 py-4 font-display font-bold text-sm tracking-[0.14em] uppercase text-primary-foreground"
            >
              <Phone className="w-4 h-4" />
              Call 804-446-1296
            </a>
            <Link
              to="/general-contracting"
              className="border border-primary/50 text-primary px-6 py-4 font-display font-bold text-sm tracking-[0.14em] uppercase hover:bg-primary/10 transition-colors"
            >
              See GC Delivery Layer
            </Link>
          </div>
        </div>
      </section>

      <section className="py-14 md:py-18 border-b border-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <p className="font-display text-primary text-xs tracking-[0.28em] uppercase mb-2">Priority Stack</p>
          <h2 className="font-display font-black text-foreground text-3xl md:text-5xl uppercase tracking-tight leading-[0.95] mb-8">
            Add All 5
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {PILLARS.map((pillar) => (
              <article key={pillar.id} className="border border-border bg-card p-6">
                <div className="w-11 h-11 border border-primary/30 bg-primary/5 flex items-center justify-center mb-4">
                  <pillar.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-display font-black text-foreground text-xl uppercase tracking-tight leading-tight">
                  {pillar.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mt-3">{pillar.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 md:py-16 border-b border-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="premium-panel rounded-2xl p-7 md:p-10">
            <p className="font-display text-primary text-xs tracking-[0.28em] uppercase mb-2">Execution Metrics</p>
            <h2 className="font-display font-black text-foreground text-3xl md:text-4xl uppercase tracking-tight mb-5">
              Track Weekly Or The System Fails
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {KPI_LIST.map((kpi) => (
                <div key={kpi} className="border border-border bg-card px-4 py-3 text-sm text-foreground/90">
                  {kpi}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-14 md:py-18">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="premium-panel rounded-2xl p-7 md:p-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <p className="font-display text-primary text-xs tracking-[0.28em] uppercase mb-2">Next Move</p>
              <h2 className="font-display font-black text-foreground text-3xl uppercase tracking-tight">Deploy The 5-Part AI Stack</h2>
              <p className="text-muted-foreground text-sm md:text-base mt-3 max-w-2xl leading-relaxed">
                We can phase implementation by highest ROI first: data, estimating, dispatch, QA, then expansion intelligence.
              </p>
            </div>
            <a
              href="tel:+18044461296"
              onClick={() => trackPhoneClick('contractor_ai_footer')}
              className="premium-cta inline-flex items-center gap-2 px-6 py-4 font-display font-bold text-sm tracking-[0.14em] uppercase text-primary-foreground"
            >
              <Bot className="w-4 h-4" />
              Start AI Buildout
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

/**
 * JwordenAI.jsx — Public SEO landing page for the JWordenAI platform brand.
 *
 * Purpose: rank on Google for construction AI / contractor intelligence queries.
 * This page is pure marketing content — no tools, no free logic.
 * All capability detail stays behind auth.
 */
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import SchemaMarkup from '../components/SchemaMarkup'

// ── SEO data ─────────────────────────────────────────────────────────────────

const PLATFORM_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'JWordenAI',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  description:
    'JWordenAI is an autonomous construction intelligence platform built on 40+ years of Virginia asphalt field data. It delivers permit analysis, bid intelligence, cost estimation, and digital twin monitoring for paving contractors and construction professionals.',
  url: 'https://jworden.com/jwordenai',
  author: {
    '@type': 'Organization',
    name: 'J. Worden & Sons',
    foundingDate: '1984',
    areaServed: { '@type': 'State', name: 'Virginia' },
  },
  offers: { '@type': 'Offer', availability: 'https://schema.org/InStock' },
}

const CAPABILITIES = [
  {
    icon: '📋',
    title: 'Permit Intelligence',
    tagline: 'Multi-state permit trigger analysis',
    description:
      'Codified permit logic for Virginia, North Carolina, South Carolina, Georgia, and Maryland — including county-level fee schedules and trigger thresholds. Instantly surfaces permit requirements by project type, cost, and structure size.',
    teaser: true,
  },
  {
    icon: '🏗️',
    title: 'Bid Board Monitor',
    tagline: 'VDOT & regional bid opportunities',
    description:
      'Automated scanning of VDOT bid board and state procurement portals. Surfaces active bid opportunities ranked by match score, district, and estimated value — before competitors find them.',
    teaser: true,
  },
  {
    icon: '🧠',
    title: 'Cognitive Digital Twin',
    tagline: 'Live project drift detection',
    description:
      'A six-dimension real-time model of every active project — timeline, cost, quality, safety, materials, and crew. Detects drift from plan and triggers auto-remediation workflows when thresholds are crossed.',
    teaser: true,
  },
  {
    icon: '⚖️',
    title: 'Automated Quote Engine',
    tagline: '2026 Virginia market benchmarks',
    description:
      'Generates priced asphalt proposals from site evaluations. Applies damage-type logic (alligator cracking = base-rehab multiplier), VDOT base standards, and regional $/sq ft benchmarks — with 7-day liquid-asphalt market validity.',
    teaser: true,
  },
  {
    icon: '🛡️',
    title: 'Compliance Monitoring',
    tagline: 'Subcontractor cert & license tracking',
    description:
      'Tracks insurance, bond, and license expiration dates across your entire subcontractor roster. Auto-alerts 30 days and 7 days ahead of expiry. Integrates with 50-state DPOR and license verification APIs.',
    teaser: true,
  },
  {
    icon: '🤖',
    title: 'Autonomous Orchestrator',
    tagline: 'Level 4 AI goal execution',
    description:
      'An Orchestrator-Worker-Reflexion-RL engine that executes complex business goals — schedule integrity, cost control, safety compliance, material supply — with built-in self-critique and reinforcement learning weight updates.',
    teaser: true,
  },
]

const STATS = [
  { value: '40+', label: 'Years of field intelligence' },
  { value: '133', label: 'Virginia localities covered' },
  { value: '5', label: 'States of permit logic' },
  { value: 'L4', label: 'Autonomous intelligence level' },
]

const WHO_ITS_FOR = [
  {
    audience: 'Paving Contractors',
    points: [
      'Win more bids with real-time VDOT opportunity alerts',
      'Auto-generate accurate quotes from site photos',
      'Track subcontractor compliance without spreadsheets',
      'Monitor active jobs for cost and schedule drift',
    ],
  },
  {
    audience: 'General Contractors',
    points: [
      'Permit requirement lookup across 5 states + 16 counties',
      'Automated site evaluation scoring before mobilization',
      'Utility risk advisory before any excavation begins',
      'Integrated cash flow and lien deadline monitoring',
    ],
  },
  {
    audience: 'Property Managers & HOAs',
    points: [
      'Instant paving condition reports from photos',
      'Multi-site maintenance cost forecasting',
      'VDOT base standard compliance documentation',
      'Annual resurfacing schedule planning tools',
    ],
  },
]

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.12, ease: 'easeOut' },
  }),
}

const staggerReveal = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.06 } },
}

const cardRise = {
  hidden: { opacity: 0, y: 28, scale: 0.98 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.48, ease: [0.22, 1, 0.36, 1] },
  },
}

// ─────────────────────────────────────────────────────────────────────────────

const FEATURES = [
/* Lines 146-186 omitted */
]

export default function JwordenAI() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SchemaMarkup
        title="Virginia Asphalt Paving Expertise | J. Worden & Sons"
        description="Serving Virginia property owners for over 40 years with driveway paving, parking lot resurfacing, sealcoating, and asphalt repair." 
        canonical="/jwordenai"
        breadcrumb={[
          { name: 'Home', path: '/' },
          { name: 'Virginia Asphalt Expertise', path: '/jwordenai' },
        ]}
      />
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="bg-brand-navy pt-32 pb-24 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_12%,rgba(245,166,35,0.24),transparent_35%),radial-gradient(circle_at_10%_88%,rgba(120,190,255,0.16),transparent_34%)]" aria-hidden="true" />
        <p className="absolute -right-16 top-10 font-display font-black text-[36vw] leading-none text-white/[0.03] select-none pointer-events-none tracking-tight" aria-hidden="true">
          WORDEN
        </p>
        {/* Subtle grid texture */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
          aria-hidden="true"
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-[1.05fr_0.95fr] gap-10 lg:gap-14 items-end">
          {/* Badge */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={0}
            className="inline-flex items-center gap-2 bg-brand-amber/18 border border-brand-amber/45 text-brand-amber text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-8 shadow-[0_10px_28px_rgba(0,0,0,0.35)]"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-brand-amber animate-pulse" />
            Serving Virginia For Over 40 Years
          </motion.div>

          <div>
            {/* Wordmark */}
            <motion.h1
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={1}
              className="font-display font-black text-6xl sm:text-7xl md:text-[6.5rem] lg:text-[7.2rem] mb-4 leading-[0.9] tracking-[-0.02em] [text-shadow:0_12px_34px_rgba(0,0,0,0.45)]"
            >
              JWORDENAI
              <span className="text-brand-amber align-super text-2xl md:text-3xl">™</span>
            </motion.h1>

            <motion.p
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={2}
              className="font-display uppercase tracking-[0.16em] text-brand-amber text-xs md:text-sm mb-4"
            >
              Asphalt Intelligence Unit · Founder-Led Since 1984
            </motion.p>

            <motion.p
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={3}
              className="text-white/80 text-lg md:text-xl max-w-2xl leading-relaxed mb-4"
            >
              Since 1984, J. Worden &amp; Sons has helped homeowners and property managers across
              Chester, Richmond, Midlothian, Henrico, and surrounding communities protect and
              restore their asphalt the right way.
            </motion.p>

            <motion.p
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={4}
              className="text-white/60 text-sm max-w-xl mb-10"
            >
              Local crews. Honest recommendations. Lasting pavement work.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={5}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Link
                to="/contact"
                className="btn-primary text-base !px-8 !py-3"
                onClick={() => {
                  if (typeof window.gtag === 'function')
                    window.gtag('event', 'cta_click', { location: 'jwordenai_hero_primary' })
                }}
              >
                Book A Free Site Visit
              </Link>
              <Link
                to="/services"
                className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-lg border border-white/30 text-white/90 hover:text-white hover:border-brand-amber/60 hover:bg-white/5 transition-colors text-base font-medium"
              >
                Explore Services
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </Link>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-4"
          >
            {["Founder strategy", "Virginia climate playbook", "40+ years field intelligence"].map((chip) => (
              <div key={chip} className="premium-panel rounded-2xl px-5 py-4 text-sm font-display tracking-[0.14em] uppercase text-foreground/90">
                {chip}
              </div>
            ))}
            <div className="rounded-2xl border border-primary/35 bg-black/35 p-5 shadow-[0_24px_56px_rgba(0,0,0,0.46)]">
              <p className="font-display text-[10px] tracking-[0.24em] uppercase text-primary mb-2">Live Service Mix</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="border border-white/10 bg-white/5 rounded-lg px-3 py-2">Residential</div>
                <div className="border border-white/10 bg-white/5 rounded-lg px-3 py-2">Commercial</div>
                <div className="border border-white/10 bg-white/5 rounded-lg px-3 py-2">Sealcoating</div>
                <div className="border border-white/10 bg-white/5 rounded-lg px-3 py-2">Concrete</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="bg-black border-y border-primary/30 overflow-hidden">
        <motion.div
          initial={{ x: 0 }}
          animate={{ x: ['0%', '-50%'] }}
          transition={{ repeat: Infinity, duration: 26, ease: 'linear' }}
          className="flex w-[200%]"
        >
          <div className="w-1/2 py-3 flex items-center justify-around font-display text-[11px] tracking-[0.28em] uppercase text-primary">
            <span>Chester</span>
            <span>Richmond</span>
            <span>Midlothian</span>
            <span>Henrico</span>
            <span>Commercial Lots</span>
            <span>Driveway Specialists</span>
          </div>
          <div className="w-1/2 py-3 flex items-center justify-around font-display text-[11px] tracking-[0.28em] uppercase text-primary">
            <span>Chester</span>
            <span>Richmond</span>
            <span>Midlothian</span>
            <span>Henrico</span>
            <span>Commercial Lots</span>
            <span>Driveway Specialists</span>
          </div>
        </motion.div>
      </section>

      {/* ── Divider stat bar ─────────────────────────────────────────────── */}
      <section className="bg-brand-amber">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12 text-brand-navy text-center">
            {[
              { value: '40+', label: 'Years of field data' },
              { value: '1984', label: 'Family business founded' },
              { value: '100%', label: 'Virginia paving focus' },
            ].map(({ value, label }) => (
              <div key={label}>
                <p className="font-display font-black text-2xl">{value}</p>
                <p className="text-xs font-semibold uppercase tracking-widest opacity-70">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Feature cards ────────────────────────────────────────────────── */}
      <section className="py-24 bg-background border-y border-border/80 relative overflow-hidden">
        <div className="absolute -top-24 right-0 w-80 h-80 rounded-full bg-primary/16 blur-3xl" aria-hidden="true" />
        <div className="absolute bottom-0 -left-20 w-72 h-72 rounded-full bg-sky-400/10 blur-3xl" aria-hidden="true" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-brand-amber text-xs font-bold uppercase tracking-widest">
              Local service strengths
            </span>
            <h2 className="font-display font-black text-4xl md:text-5xl text-foreground mt-3 mb-4 uppercase tracking-tight">
              Asphalt Guidance Built For Virginia Properties
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Homeowners and property managers get clear options, local insight, and dependable
              execution from a team that has served the region for decades.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
            {LOCAL_PROJECT_IMAGES.map((src, idx) => (
              <div key={src} className="relative overflow-hidden rounded-2xl border border-primary/30 bg-black/30 shadow-[0_20px_46px_rgba(0,0,0,0.35)]">
                <img
                  src={src}
                  alt={`Virginia asphalt paving project ${idx + 1}`}
                  className="w-full h-56 object-cover quality-premium"
                  loading="lazy"
                />
              </div>
            ))}
          </div>

          <motion.div
            className="grid md:grid-cols-3 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.25 }}
            variants={staggerReveal}
          >
            {FEATURES.map((feature, i) => (
              <motion.div
                key={feature.title}
                variants={cardRise}
                className="group premium-panel rounded-2xl p-8 hover:border-primary/45 transition-all duration-300"
              >
                {/* Icon */}
                <div className="w-14 h-14 rounded-xl bg-black/30 border border-primary/25 flex items-center justify-center text-3xl mb-6 group-hover:bg-primary/10 transition-colors">
                  {feature.icon}
                </div>

                {/* Tagline */}
                <span className="text-xs font-bold uppercase tracking-widest text-brand-amber">
                  {feature.tagline}
                </span>

                {/* Title */}
                <h3 className="font-display font-black text-2xl text-foreground mt-2 mb-4 uppercase tracking-tight">
                  {feature.title}
                </h3>

                {/* Description */}
                <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                  {feature.description}
                </p>

                {/* Capabilities list */}
                <ul className="space-y-2">
                  {feature.capabilities.map((cap) => (
                    <li key={cap} className="flex items-start gap-2 text-sm text-foreground/80">
                      <span className="text-brand-amber mt-0.5 shrink-0">✓</span>
                      {cap}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Roadmap & Commitment to Development ─────────────────────────── */}
      <section className="py-24 bg-muted/10 border-t border-border/70">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-brand-amber text-xs font-bold uppercase tracking-widest">
              What local clients can expect
            </span>
            <h2 className="font-display font-black text-4xl md:text-5xl text-foreground mt-3 mb-4 uppercase tracking-tight">
              Straight Answers And Reliable Work
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              We focus on prep quality, proper paving methods, and clear communication so your
              driveway or lot lasts longer and looks better.
            </p>
          </div>

          <motion.div
            className="grid md:grid-cols-2 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={staggerReveal}
          >
            {/* Current abilities */}
            <motion.div
              variants={cardRise}
              className="premium-panel rounded-2xl p-8"
            >
              <div className="flex items-center gap-3 mb-5">
                <span className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Working now
                </span>
              </div>
              <h3 className="font-display font-black text-2xl text-foreground mb-2 uppercase tracking-tight">
                Current Service Coverage
              </h3>
              <p className="text-muted-foreground text-sm mb-6">
                Real work delivered every week across residential and commercial properties.
              </p>
              <ul className="space-y-3">
                {[
                  'Residential driveways and private lanes',
                  'Commercial lots, HOA streets, and church properties',
                  'Sealcoating and crack fill maintenance programs',
                  'Prep-first planning before any paving starts',
                  'Photo-based condition review for fast early guidance',
                  'Clear scheduling and project communication',
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 text-sm text-foreground/80"
                  >
                    <span className="text-emerald-600 mt-0.5 shrink-0">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Future tech / in development */}
            <motion.div
              variants={cardRise}
              className="rounded-2xl border border-brand-amber/35 bg-gradient-to-br from-brand-amber/12 to-black/10 p-8 shadow-[0_22px_52px_rgba(0,0,0,0.35)]"
            >
              <div className="flex items-center gap-3 mb-5">
                <span className="inline-flex items-center gap-2 bg-brand-amber/20 text-brand-navy text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-amber animate-pulse" />
                  Local expansion
                </span>
              </div>
              <h3 className="font-display font-black text-2xl text-foreground mb-2 uppercase tracking-tight">
                Next Improvements
              </h3>
              <p className="text-muted-foreground text-sm mb-6">
                We keep improving customer clarity, faster estimates, and local service coverage.
              </p>
              <ul className="space-y-3">
                {[
                  'Expanded city pages for Richmond metro local SEO',
                  'More neighborhood-specific project galleries',
                  'Faster mobile quote and photo review workflows',
                  'Richer prep-before-paving guidance for customers',
                  'More transparent status updates during active jobs',
                  'Broader local service-area education resources',
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 text-sm text-foreground/80"
                  >
                    <span className="text-brand-amber mt-0.5 shrink-0">◆</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </motion.div>

          {/* Commitment statement */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={2}
            className="mt-14 max-w-3xl mx-auto text-center"
          >
            <h3 className="font-display font-black text-2xl text-foreground mb-3 uppercase tracking-tight">
              Our Local Commitment
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              We have served Virginia property owners for over 40 years. Every recommendation
              we give is grounded in real paving experience, local conditions, and long-term
              pavement performance.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Local trust notice ───────────────────────────────────────────── */}
      <section className="py-20 bg-brand-navy/20 border-t border-border/70">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            <div className="inline-flex items-center gap-2 bg-brand-navy text-brand-amber text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-8">
              <svg
                className="w-3.5 h-3.5"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                  clipRule="evenodd"
                />
              </svg>
              Family Owned Since 1984
            </div>

            <h2 className="font-display font-black text-4xl md:text-5xl text-foreground mb-6 uppercase tracking-tight">
              Built In Virginia.{' '}
              <span className="text-brand-amber">Backed By 40+ Years Of Work.</span>
            </h2>

            <p className="text-muted-foreground text-lg leading-relaxed max-w-3xl mx-auto mb-4">
              From Chester neighborhoods to Richmond commercial corridors, our team delivers
              asphalt solutions that are practical, durable, and tailored to your property.
            </p>

            <p className="text-foreground/60 text-sm max-w-2xl mx-auto mb-12">
              Ready for a driveway quote, lot resurfacing plan, or maintenance schedule? We are
              here to help with local guidance and a clear next step.
            </p>

            {/* Dual CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/contact"
                className="btn-primary text-base !px-8 !py-3"
                onClick={() => {
                  if (typeof window.gtag === 'function')
                    window.gtag('event', 'cta_click', { location: 'jwordenai_bottom_primary' })
                }}
              >
                Request Your Free Estimate
              </Link>
              <Link
                to="/services"
                className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-lg border border-foreground/25 text-foreground hover:border-brand-amber/55 hover:bg-brand-amber/10 transition-colors text-base font-medium"
              >
                Explore Services
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import SchemaMarkup from '../components/SchemaMarkup'

const LOCAL_PROJECT_IMAGES = [
  'https://media.base44.com/images/public/69c853446b8987b1630018ff/fd6e29837_20171212_192947499_iOS.jpg',
  'https://media.base44.com/images/public/69c853446b8987b1630018ff/9bc7682e8_kfc_richmond_va_1st_on_sealed.jpg',
  'https://media.base44.com/images/public/69c853446b8987b1630018ff/e5adfa586_20180209_014945610_iOS.jpg',
]

const FEATURES = [
  {
    icon: '🏡',
    title: 'Driveway Experts Since 1984',
    tagline: 'Serving Chester, Richmond, and Midlothian',
    description:
      'Homeowners trust us to inspect asphalt honestly, explain the right repair plan, and deliver clean paving work that holds up in Virginia weather.',
    capabilities: [
      'Driveway resurfacing and replacement',
      'Crack filling and sealcoating',
      'Drainage-aware prep before paving',
      'Clear written scope and timeline',
      'Friendly local crew communication',
    ],
  },
  {
    icon: '🏢',
    title: 'Commercial Lot Reliability',
    tagline: 'Built for businesses, churches, and HOAs',
    description:
      'From neighborhood shopping centers to church lots, we build phased paving plans that reduce downtime and keep your property safe and professional.',
    capabilities: [
      'Parking lot patching and overlay',
      'Traffic-friendly project phasing',
      'Line striping and finishing coordination',
      'Maintenance planning by budget year',
      'Large-area paving execution support',
    ],
  },
  {
    icon: '🛣️',
    title: 'Virginia Climate Smart Planning',
    tagline: 'Prep first, pave right, protect longer',
    description:
      'Our recommendations are based on what local asphalt faces every year: heat, rain, freeze-thaw cycles, and heavy daily traffic across Central Virginia.',
    capabilities: [
      'Season-aware scheduling windows',
      'Subgrade and base prep guidance',
      'Drainage correction prioritization',
      'Practical long-term maintenance plans',
      'Property-specific pavement recommendations',
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

export default function JwordenAI() {
  return (
    <div className="min-h-screen bg-white">
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

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={0}
            className="inline-flex items-center gap-2 bg-brand-amber/15 border border-brand-amber/30 text-brand-amber text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-8"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-brand-amber animate-pulse" />
            Serving Virginia For Over 40 Years
          </motion.div>

          {/* Wordmark */}
          <motion.h1
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={1}
            className="font-display font-black text-5xl md:text-7xl mb-6 leading-none tracking-tight"
          >
            JWORDENAI
            <span className="text-brand-amber align-super text-2xl md:text-3xl">™</span>
          </motion.h1>

          <motion.p
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={2}
            className="text-white/70 text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed mb-4"
          >
            Since 1984, J. Worden &amp; Sons has helped homeowners and property managers across
            Chester, Richmond, Midlothian, Henrico, and surrounding communities protect and
            restore their asphalt the right way.
          </motion.p>

          <motion.p
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={3}
            className="text-white/40 text-sm max-w-xl mx-auto mb-12"
          >
            Local crews. Honest recommendations. Lasting pavement work.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={4}
            className="flex flex-col sm:flex-row gap-4 justify-center"
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
              className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-lg border border-white/20 text-white/80 hover:text-white hover:border-white/40 transition-colors text-base font-medium"
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
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-brand-amber text-xs font-bold uppercase tracking-widest">
              Local service strengths
            </span>
            <h2 className="font-display font-black text-4xl md:text-5xl text-brand-navy mt-3 mb-4">
              Asphalt Guidance Built For Virginia Properties
            </h2>
            <p className="text-brand-navy/60 max-w-2xl mx-auto text-lg">
              Homeowners and property managers get clear options, local insight, and dependable
              execution from a team that has served the region for decades.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
            {LOCAL_PROJECT_IMAGES.map((src, idx) => (
              <div key={src} className="relative overflow-hidden rounded-2xl border border-brand-navy/10 bg-brand-navy/5">
                <img
                  src={src}
                  alt={`Virginia asphalt paving project ${idx + 1}`}
                  className="w-full h-52 object-cover"
                  loading="lazy"
                />
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {FEATURES.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className="group rounded-2xl border border-brand-navy/10 bg-white p-8 hover:border-brand-amber/40 hover:shadow-xl transition-all duration-300"
              >
                {/* Icon */}
                <div className="w-14 h-14 rounded-xl bg-brand-navy/5 flex items-center justify-center text-3xl mb-6 group-hover:bg-brand-amber/10 transition-colors">
                  {feature.icon}
                </div>

                {/* Tagline */}
                <span className="text-xs font-bold uppercase tracking-widest text-brand-amber">
                  {feature.tagline}
                </span>

                {/* Title */}
                <h3 className="font-display font-black text-2xl text-brand-navy mt-2 mb-4">
                  {feature.title}
                </h3>

                {/* Description */}
                <p className="text-brand-navy/65 text-sm leading-relaxed mb-6">
                  {feature.description}
                </p>

                {/* Capabilities list */}
                <ul className="space-y-2">
                  {feature.capabilities.map((cap) => (
                    <li key={cap} className="flex items-start gap-2 text-sm text-brand-navy/70">
                      <span className="text-brand-amber mt-0.5 shrink-0">✓</span>
                      {cap}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Roadmap & Commitment to Development ─────────────────────────── */}
      <section className="py-24 bg-white border-t border-brand-navy/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-brand-amber text-xs font-bold uppercase tracking-widest">
              What local clients can expect
            </span>
            <h2 className="font-display font-black text-4xl md:text-5xl text-brand-navy mt-3 mb-4">
              Straight Answers And Reliable Work
            </h2>
            <p className="text-brand-navy/60 max-w-2xl mx-auto text-lg">
              We focus on prep quality, proper paving methods, and clear communication so your
              driveway or lot lasts longer and looks better.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Current abilities */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={0}
              className="rounded-2xl border border-brand-navy/10 bg-brand-navy/[0.02] p-8"
            >
              <div className="flex items-center gap-3 mb-5">
                <span className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Working now
                </span>
              </div>
              <h3 className="font-display font-black text-2xl text-brand-navy mb-2">
                Current Service Coverage
              </h3>
              <p className="text-brand-navy/60 text-sm mb-6">
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
                    className="flex items-start gap-2.5 text-sm text-brand-navy/75"
                  >
                    <span className="text-emerald-600 mt-0.5 shrink-0">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Future tech / in development */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={1}
              className="rounded-2xl border border-brand-amber/30 bg-brand-amber/5 p-8"
            >
              <div className="flex items-center gap-3 mb-5">
                <span className="inline-flex items-center gap-2 bg-brand-amber/20 text-brand-navy text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-amber animate-pulse" />
                  Local expansion
                </span>
              </div>
              <h3 className="font-display font-black text-2xl text-brand-navy mb-2">
                Next Improvements
              </h3>
              <p className="text-brand-navy/60 text-sm mb-6">
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
                    className="flex items-start gap-2.5 text-sm text-brand-navy/75"
                  >
                    <span className="text-brand-amber mt-0.5 shrink-0">◆</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>

          {/* Commitment statement */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={2}
            className="mt-14 max-w-3xl mx-auto text-center"
          >
            <h3 className="font-display font-black text-2xl text-brand-navy mb-3">
              Our Local Commitment
            </h3>
            <p className="text-brand-navy/65 leading-relaxed">
              We have served Virginia property owners for over 40 years. Every recommendation
              we give is grounded in real paving experience, local conditions, and long-term
              pavement performance.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Local trust notice ───────────────────────────────────────────── */}
      <section className="py-20 bg-brand-navy/5">
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

            <h2 className="font-display font-black text-4xl md:text-5xl text-brand-navy mb-6">
              Built In Virginia.{' '}
              <span className="text-brand-amber">Backed By 40+ Years Of Work.</span>
            </h2>

            <p className="text-brand-navy/65 text-lg leading-relaxed max-w-3xl mx-auto mb-4">
              From Chester neighborhoods to Richmond commercial corridors, our team delivers
              asphalt solutions that are practical, durable, and tailored to your property.
            </p>

            <p className="text-brand-navy/45 text-sm max-w-2xl mx-auto mb-12">
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
                className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-lg border border-brand-navy/20 text-brand-navy hover:border-brand-navy/40 hover:bg-brand-navy/5 transition-colors text-base font-medium"
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

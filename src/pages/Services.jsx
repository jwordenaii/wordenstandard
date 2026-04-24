import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import SchemaMarkup, { serviceSchema, faqSchema } from '../components/SchemaMarkup'
import FAQAccordion from '../components/FAQAccordion'

const SERVICES = [
  {
    id: 'paving',
    icon: '🛣',
    title: 'Asphalt Paving',
    tagline: 'New construction & overlay paving',
    description:
      'Whether you need a brand-new asphalt surface or a milled-and-overlaid refresh, our crews use commercial-grade compaction equipment to deliver a smooth, durable result. We handle base preparation, grading, and drainage planning before the first ton of asphalt goes down.',
    features: [
      'Full-depth reclamation & base prep',
      'Hot-mix asphalt (HMA) installation',
      'Infrared repair of failed sections',
      'Sub-base drainage engineering',
      'ADA-compliant slopes & transitions',
    ],
    ideal: 'New driveways, subdivision roads, commercial parking lots',
  },
  {
    id: 'sealcoating',
    icon: '🖤',
    title: 'Sealcoating',
    tagline: 'Extend pavement life by 50%',
    description:
      'A quality sealcoat fills surface voids, blocks UV oxidation, repels fuel and oil spills, and gives your pavement that jet-black finish. We apply it by spray or squeegee depending on surface texture, and we let nothing move until it is fully cured.',
    features: [
      'Coal-tar & asphalt-based sealers',
      'Spray & squeegee application',
      'Crack-fill before sealing',
      'Traffic paint / line striping',
      'Recommended every 3–5 years',
    ],
    ideal: 'Existing driveways 2+ years old, commercial lots',
  },
  {
    id: 'crackfill',
    icon: '🔧',
    title: 'Crack Filling',
    tagline: 'Stop water before it destroys your base',
    description:
      'Water entering through cracks is the #1 cause of asphalt failure. Our hot-pour rubberized crack fill expands and contracts with temperature cycles, creating a waterproof seal that outlasts cold-pour products by years.',
    features: [
      'Hot-pour rubberized sealant',
      'Saw-cut & rout for wide cracks',
      'Blow-out & dry before fill',
      'Compatible with sealcoating same day',
    ],
    ideal: 'Any pavement showing cracks before sealing season',
  },
  {
    id: 'parking',
    icon: '🏢',
    title: 'Parking Lots',
    tagline: 'Commercial lots built to handle heavy traffic',
    description:
      'Commercial parking lots demand thicker base depths, precise drainage grades, and line striping that meets code. We have completed lots for fast-food chains, retail centers, warehouses, and apartment complexes across the region.',
    features: [
      'Site grading & drainage design',
      'Heavy-duty 4" to 6" HMA sections',
      'ADA parking & curb ramps',
      'Thermoplastic line striping',
      'Wheel stops & signage',
      'Annual maintenance contracts',
    ],
    ideal: 'Commercial properties, HOAs, schools, churches',
  },
  {
    id: 'driveways',
    icon: '🏠',
    title: 'Residential Driveways',
    tagline: 'Curb appeal that lasts a generation',
    description:
      'We remove your old driveway, prep the sub-base, and install a full-depth asphalt section sized for your soil conditions and vehicle load. Most residential driveways are completed in a single day.',
    features: [
      'Old driveway demo & haul-off',
      'Compacted stone base',
      '2"–3" HMA wearing course',
      'Edging & tie-in to apron',
      'Cleanup included',
    ],
    ideal: 'Residential homes, multi-unit rentals',
  },
  {
    id: 'maintenance',
    icon: '🔄',
    title: 'Maintenance Plans',
    tagline: 'One contract — zero pavement headaches',
    description:
      'Commercial property managers rely on our annual maintenance plans to keep lots looking sharp and code-compliant year after year. We schedule sealcoating, crack fill, and minor repairs on a rotating calendar.',
    features: [
      'Annual site inspection',
      'Priority scheduling',
      'Multi-year volume pricing',
      'Documentation for property records',
    ],
    ideal: 'Property managers, commercial landlords, HOAs',
  },
]

const SERVICE_FAQS = [
  {
    question: 'How thick should a commercial parking lot asphalt be?',
    answer:
      'Commercial lots typically require 4"–6" of hot-mix asphalt over a compacted stone base of 6"–12". The exact spec depends on soil bearing capacity and anticipated traffic loads (cars vs. delivery trucks).',
  },
  {
    question: 'How long after paving can I sealcoat?',
    answer:
      'New asphalt should cure for at least 90 days — ideally one full summer season — before sealcoating. Applying too soon traps gases and can cause bubbling.',
  },
  {
    question: 'What is the difference between crack filling and crack sealing?',
    answer:
      'Crack filling uses hot-pour rubber compound to fill non-working cracks. Crack sealing (saw-cut & rout) is used for working cracks that move with temperature — it creates a wider channel for better sealant adhesion.',
  },
  {
    question: 'Do you handle ADA compliance for parking lots?',
    answer:
      'Yes. We install ADA-compliant handicapped stalls, access aisles, curb ramps, and signage to current ADAAG standards.',
  },
]

export default function Services() {
  return (
    <>
      <SchemaMarkup
        title="Asphalt Paving, Sealcoating & Parking Lot Services"
        description="Full-service asphalt contractor — paving, sealcoating, crack filling, parking lots, and residential driveways. 40+ years of experience. Free estimates."
        canonical="/services"
        schema={[
          ...SERVICES.map((s) =>
            serviceSchema(s.title, s.description, `/services#${s.id}`)
          ),
          faqSchema(SERVICE_FAQS),
        ]}
        breadcrumb={[
          { name: 'Home', path: '/' },
          { name: 'Services', path: '/services' },
        ]}
      />

      {/* Page header */}
      <div className="bg-brand-navy pt-32 pb-20 text-white text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="font-display font-black text-5xl md:text-6xl mb-4">
            Our <span className="text-brand-amber">Services</span>
          </h1>
          <p className="text-white/70 text-xl max-w-2xl mx-auto">
            Commercial and residential asphalt work — done right the first time.
          </p>
        </div>
      </div>

      {/* Service cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 space-y-24">
        {SERVICES.map((svc, i) => (
          <motion.section
            key={svc.id}
            id={svc.id}
            className={`grid md:grid-cols-2 gap-12 items-start ${
              i % 2 === 1 ? 'md:[&>*:first-child]:order-2' : ''
            }`}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            {/* Content */}
            <div>
              <div className="text-5xl mb-4">{svc.icon}</div>
              <span className="text-xs font-bold uppercase tracking-widest text-brand-amber">
                {svc.tagline}
              </span>
              <h2 className="font-display font-black text-3xl md:text-4xl text-brand-navy mt-2 mb-4">
                {svc.title}
              </h2>
              <p className="text-brand-navy/70 leading-relaxed mb-6">{svc.description}</p>
              <ul className="space-y-2 mb-8">
                {svc.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-brand-navy/80">
                    <span className="text-brand-amber mt-0.5">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-brand-navy/40 mb-6">
                <strong>Best for:</strong> {svc.ideal}
              </p>
              <Link to="/quote" className="btn-primary">
                Get a Quote for {svc.title}
              </Link>
            </div>

            {/* Visual placeholder */}
            <div className="bg-brand-navy/5 rounded-2xl aspect-video flex items-center justify-center border-2 border-dashed border-brand-navy/20">
              <div className="text-center text-brand-navy/30">
                <div className="text-6xl mb-2">{svc.icon}</div>
                <p className="text-sm">Photo coming soon</p>
              </div>
            </div>
          </motion.section>
        ))}
      </div>

      {/* FAQ */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="section-heading text-center mb-12">Service FAQs</h2>
          <FAQAccordion items={SERVICE_FAQS} />
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-brand-amber text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="font-display font-black text-brand-navy text-3xl mb-4">
            Not sure which service you need?
          </h2>
          <p className="text-brand-navy/70 mb-6">
            Tell us about your project and we will recommend the right approach — no pressure.
          </p>
          <Link to="/quote" className="bg-brand-navy text-white font-bold px-8 py-4 rounded-lg hover:bg-brand-navy/90 transition-colors">
            Start Your Free Quote
          </Link>
        </div>
      </section>
    </>
  )
}

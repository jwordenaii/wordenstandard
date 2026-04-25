import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import SchemaMarkup, { LOCAL_BUSINESS_SCHEMA } from '../components/SchemaMarkup'
import SocialShare from '../components/SocialShare'
import { trackEvent } from '../api/client'

const PROJECTS = [
  {
    id: 'grace-baptist-1984',
    name: 'Grace Baptist Church of Chester',
    year: 1984,
    type: 'Commercial',
    location: 'Chester, VA',
    sqft: 4200,
    scope: ['Full-depth paving', 'Hand-cut edging', 'Drainage grading'],
    headline: 'The First Job.',
    description:
      'Harold Worden Sr.\'s first contract as an independent company. A church parking lot in Chester — four days of work with his brother Ray, one truck, and one secondhand Barber-Greene paver. Harold hand-cut every edge with a shovel. The lot is still standing today.',
    highlight: 'Still standing 40+ years later.',
    emoji: '⛪',
  },
  {
    id: 'jd-stripmall-1997',
    name: 'Jefferson Davis Strip Mall Renovation',
    year: 1997,
    type: 'Commercial',
    location: 'Colonial Heights, VA',
    sqft: 28000,
    scope: ['Mill & overlay', 'Full drainage redesign', 'Line striping', 'ADA transitions'],
    headline: 'First Six-Figure Contract.',
    description:
      'A complete mill-and-overlay of an aging commercial center. At $118,000 it was the biggest job in Worden history at the time. Harold Jr. ran the equipment, Harold Sr. ran the estimates. Four consecutive 14-hour days. Zero punch-list items at closeout.',
    highlight: '$0 in punch-list callbacks.',
    emoji: '🏢',
  },
  {
    id: 'hopewell-neighborhood-2001',
    name: 'Hopewell Subdivision — Phase I',
    year: 2001,
    type: 'Residential',
    location: 'Hopewell, VA',
    sqft: 42000,
    scope: ['New construction', 'Sub-base grading', 'Full-depth HMA', '23 driveways + entrance road'],
    headline: 'First Full Subdivision.',
    description:
      'The first multi-home residential development the company handled end-to-end. Twenty-three driveways plus a shared entrance road — all coordinated around active construction by the homebuilder. Delivered on schedule despite three weather delays.',
    highlight: '23 driveways. One schedule.',
    emoji: '🏠',
  },
  {
    id: 'kfc-richmond-2006',
    name: 'Richmond KFC — Franchise Group',
    year: 2006,
    type: 'Franchise',
    location: 'Richmond Metro, VA',
    sqft: 18400,
    scope: ['Full mill & pave', 'Drive-thru lane resurfacing', 'ADA stalls', 'Thermoplastic striping'],
    headline: 'First National Franchise Lot.',
    description:
      'The job that opened the door to franchise work across the Richmond metro. KFC franchise operators required strict tolerances, national brand standards for ADA compliance, and clean post-project documentation. The Worden team delivered — and became the preferred vendor for the group.',
    highlight: 'Led to 10 more franchise contracts.',
    emoji: '🍗',
  },
  {
    id: 'taco-bell-chester-2008',
    name: 'Chester Taco Bell — Full Lot Rebuild',
    year: 2008,
    type: 'Franchise',
    location: 'Chester, VA',
    sqft: 15800,
    scope: ['Full-depth reclamation', 'Drainage overhaul', 'Concrete curb & gutter', 'Thermoplastic striping', 'Wheel stops'],
    headline: 'Home Turf.',
    description:
      'A full-depth reclamation and rebuild for the local Taco Bell — right in the company\'s backyard. The old parking lot had failed base-deep, requiring full excavation, drainage overhaul, and new construction from subgrade up. Finished two days ahead of schedule.',
    highlight: 'Finished 2 days early.',
    emoji: '🌮',
  },
  {
    id: 'arbys-colonial-heights-2009',
    name: "Colonial Heights Arby's — Full Renovation",
    year: 2009,
    type: 'Franchise',
    location: 'Colonial Heights, VA',
    sqft: 14200,
    scope: ["Mill & overlay", 'ADA compliance upgrade', 'New drive-thru lane', 'Line striping', 'Signage bases'],
    headline: 'Franchise Row Continues.',
    description:
      "Part of the multi-year Arby's franchise agreement across the Richmond region. Full mill-and-overlay with an ADA compliance overhaul — widened stalls, new curb ramps, upgraded signage. The franchise inspector called it the cleanest lot in their regional portfolio.",
    highlight: 'Rated top lot in franchise region.',
    emoji: '🥩',
  },
  {
    id: 'school-parking-2012',
    name: 'Chesterfield County School Lot',
    year: 2012,
    type: 'Municipal',
    location: 'Chesterfield County, VA',
    sqft: 38000,
    scope: ['Full-depth paving', 'Bus lane construction', 'ADA compliance', 'Drainage design', 'Thermoplastic striping'],
    headline: 'Public Trust.',
    description:
      'A full parking lot construction project for a Chesterfield County school — including dedicated bus lanes, parent drop zones, and staff parking sections. Public contracts require airtight documentation and strict code compliance. The county inspector signed off on first review.',
    highlight: 'Passed inspection on first review.',
    emoji: '🏫',
  },
  {
    id: 'hoa-chesterfield-2016',
    name: 'Autumn Ridge HOA — Community Roads',
    year: 2016,
    type: 'Residential',
    location: 'Chesterfield County, VA',
    sqft: 67000,
    scope: ['Full overlay', 'Sub-base patching', 'Crack repair', 'Sealcoating', 'Pavement marking'],
    headline: 'Neighborhood-Scale.',
    description:
      'A full road and parking area overlay for a 200-home HOA community. Coordinated access restrictions for residents across four phases over three weeks. The HOA board sent a letter to James IV personally after completion — the only time in company history that\'s happened.',
    highlight: 'Personal commendation from HOA board.',
    emoji: '🌳',
  },
  {
    id: 'apartment-complex-2019',
    name: 'Chesterfield Apartment Complex',
    year: 2019,
    type: 'Commercial',
    location: 'Chesterfield County, VA',
    sqft: 148104,
    scope: [
      'Full-depth construction',
      'Drainage re-engineering',
      '2,100+ tons of HMA',
      '180 parking stalls',
      'ADA ramp installation throughout',
      'Thermoplastic striping',
    ],
    headline: 'Largest Job in Company History.',
    description:
      'A 3.4-acre parking infrastructure build for a new 240-unit apartment complex. Seven crew members, six weeks, four construction phases. Full drainage overhaul required re-routing two existing utility paths. Zero change orders. The general contractor gave the project a perfect score on their post-completion survey.',
    highlight: 'Perfect GC post-completion score. Zero change orders.',
    emoji: '🏗',
  },
  {
    id: 'warehousing-2022',
    name: 'Logistics Facility — Truck Court & Lot',
    year: 2022,
    type: 'Commercial',
    location: 'Petersburg, VA',
    sqft: 94000,
    scope: ['Heavy-duty 6" HMA sections', 'Truck court construction', 'Dock approach paving', 'Drainage system', 'Wheel stops'],
    headline: 'Heavy Industry Grade.',
    description:
      'A high-load truck court and parking lot for an industrial logistics facility near Petersburg. Tractor-trailer loads require 6" HMA sections over a reinforced aggregate base — significantly heavier spec than standard commercial. All sections were cored and tested post-pour. Every result exceeded spec.',
    highlight: 'Every core test exceeded specification.',
    emoji: '🚛',
  },
]

const TYPES = ['All', 'Commercial', 'Residential', 'Franchise', 'Municipal']

const TYPE_COLORS = {
  Commercial: 'bg-blue-100 text-blue-700',
  Residential: 'bg-green-100 text-green-700',
  Franchise:   'bg-orange-100 text-orange-700',
  Municipal:   'bg-purple-100 text-purple-700',
}

function formatSqft(n) {
  if (n >= 43560) {
    return `${(n / 43560).toFixed(1)} acres`
  }
  return `${n.toLocaleString()} sq ft`
}

export default function Projects() {
  const [activeType, setActiveType] = useState('All')

  const filtered = activeType === 'All'
    ? PROJECTS
    : PROJECTS.filter((p) => p.type === activeType)

  // Sort by year descending
  const sorted = [...filtered].sort((a, b) => b.year - a.year)

  const totalSqft = PROJECTS.reduce((sum, p) => sum + p.sqft, 0)

  return (
    <>
      <SchemaMarkup
        title="Project Portfolio — 40 Years of Asphalt Work"
        description="Browse J. Worden & Sons' project portfolio — 500+ completed jobs including commercial lots, residential driveways, national franchise sites, and municipal contracts across Chester, VA and the Richmond region."
        canonical="/projects"
        schema={LOCAL_BUSINESS_SCHEMA}
        breadcrumb={[
          { name: 'Home', path: '/' },
          { name: 'Projects', path: '/projects' },
        ]}
      />

      {/* Header */}
      <div className="bg-brand-navy pt-32 pb-20 text-white text-center">
        <div className="max-w-4xl mx-auto px-4">
          <span className="inline-block bg-brand-amber/20 text-brand-amber text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-5">
            40 Years of Work
          </span>
          <h1 className="font-display font-black text-5xl md:text-6xl mb-4">
            Our <span className="text-brand-amber">Projects</span>
          </h1>
          <p className="text-white/70 text-xl max-w-2xl mx-auto">
            500+ completed jobs. Commercial, residential, franchise, and municipal.
            Here are the ones that tell our story.
          </p>
          <div className="mt-8 flex justify-center">
            <SocialShare
              path="/projects"
              text="See the J. Worden & Sons project portfolio — 40 years of asphalt paving in Virginia"
              compact
            />
          </div>
        </div>
      </div>

      {/* Stats */}
      <section className="bg-brand-amber py-10">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { stat: '500+',                         label: 'Jobs Completed' },
              { stat: `${(totalSqft / 43560).toFixed(0)}+`, label: 'Acres Paved (featured)' },
              { stat: '40+',                          label: 'Years in Business' },
              { stat: '4.9★',                         label: 'Google Rating' },
            ].map(({ stat, label }) => (
              <div key={label}>
                <div className="font-display font-black text-brand-navy text-3xl">{stat}</div>
                <div className="text-brand-navy/60 text-sm mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Filter tabs */}
      <section className="bg-white sticky top-16 z-30 border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex overflow-x-auto gap-1 py-3 no-scrollbar">
            {TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => {
                  setActiveType(type)
                  trackEvent('project_filter', { type })
                }}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  activeType === type
                    ? 'bg-brand-navy text-white'
                    : 'bg-gray-100 text-brand-navy/70 hover:bg-gray-200'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Project grid */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8">
            {sorted.map((project, i) => (
              <motion.article
                key={project.id}
                className="card p-6 flex flex-col"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: (i % 2) * 0.1 }}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="text-4xl flex-shrink-0">{project.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap gap-2 mb-1">
                      <span className="text-xs font-bold uppercase tracking-widest text-brand-amber">
                        {project.year}
                      </span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TYPE_COLORS[project.type] || 'bg-gray-100 text-gray-600'}`}>
                        {project.type}
                      </span>
                    </div>
                    <h2 className="font-display font-bold text-lg text-brand-navy leading-tight">
                      {project.name}
                    </h2>
                    <p className="text-brand-navy/40 text-xs mt-0.5">{project.location}</p>
                  </div>
                </div>

                <p className="text-brand-amber font-semibold text-sm mb-2">{project.headline}</p>
                <p className="text-brand-navy/70 text-sm leading-relaxed mb-4 flex-1">
                  {project.description}
                </p>

                {/* Scope tags */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {project.scope.map((item) => (
                    <span
                      key={item}
                      className="text-xs bg-brand-navy/5 text-brand-navy/60 px-2 py-0.5 rounded-full"
                    >
                      {item}
                    </span>
                  ))}
                </div>

                {/* Stats row */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex gap-4">
                    <div>
                      <div className="text-xs text-brand-navy/40 uppercase tracking-widest">Size</div>
                      <div className="font-semibold text-brand-navy text-sm">{formatSqft(project.sqft)}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-brand-amber font-semibold">{project.highlight}</div>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>

          {sorted.length === 0 && (
            <div className="text-center py-20 text-brand-navy/40">
              No projects in this category yet.
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-brand-navy text-white text-center">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="font-display font-black text-4xl mb-4">
            Ready to be our next project?
          </h2>
          <p className="text-white/60 text-lg mb-8">
            Free estimates. Fast turnaround. Four generations of quality behind every job.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/quote"
              className="btn-primary text-lg px-8 py-4"
              onClick={() => trackEvent('cta_click', { location: 'projects_bottom' })}
            >
              Get a Free Quote
            </Link>
            <a
              href="tel:+18044461296"
              className="btn-outline text-lg px-8 py-4"
              onClick={() => trackEvent('phone_click', { location: 'projects_bottom' })}
            >
              📞 (804) 446-1296
            </a>
          </div>
        </div>
      </section>
    </>
  )
}

import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import SchemaMarkup, { LOCAL_BUSINESS_SCHEMA } from '../components/SchemaMarkup'

const TIMELINE = [
  {
    year: '1984',
    event: 'Harold Worden Sr. founds the company with one truck and a used paver.',
  },
  {
    year: '1990s',
    event: 'Second generation joins. Fleet expands to five trucks. First commercial parking lot contracts.',
  },
  {
    year: '2000s',
    event: 'Third generation joins. Sealed first national franchise lots — KFC, Arby\'s, Taco Bell.',
  },
  {
    year: '2010s',
    event: 'GPS dispatch and digital estimating introduced. 500th project milestone reached.',
  },
  {
    year: 'Today',
    event: 'Fourth generation leads operations. AI-powered scheduling and fleet telemetry. Still family owned.',
  },
]

const TEAM = [
  {
    name: 'James Worden IV',
    role: 'Owner & Operations Director',
    bio: 'Fourth-generation leader. Grew up on job sites and took the reins after 10 years in the field.',
  },
  {
    name: 'Mike Chen',
    role: 'Head Paving Foreman',
    bio: '22 years with the company. Has laid more asphalt than anyone on the team and it shows.',
  },
  {
    name: 'Denise Worden',
    role: 'Estimating & Client Relations',
    bio: 'Handles every quote personally. Straight numbers, no surprises.',
  },
]

export default function About() {
  return (
    <>
      <SchemaMarkup
        title="About J. Worden & Sons — 4th-Generation Asphalt Paving Since 1984"
        description="The story of J. Worden & Sons — a fourth-generation family asphalt paving company serving the community since 1984. Licensed, insured, and trusted by major franchises."
        canonical="/about"
        schema={LOCAL_BUSINESS_SCHEMA}
        breadcrumb={[
          { name: 'Home', path: '/' },
          { name: 'About', path: '/about' },
        ]}
      />

      {/* Header */}
      <div className="bg-brand-navy pt-32 pb-20 text-white text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="font-display font-black text-5xl md:text-6xl mb-4">
            Our <span className="text-brand-amber">Story</span>
          </h1>
          <p className="text-white/70 text-xl max-w-2xl mx-auto">
            Four generations of Wordens have paved their way into this community.
            Here&apos;s how it happened.
          </p>
        </div>
      </div>

      {/* Mission statement */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-2xl md:text-3xl font-display font-bold text-brand-navy leading-tight">
            &ldquo;We don&apos;t just pave roads. We build the surfaces that hold communities
            together — driveways where kids learn to ride bikes, parking lots where
            businesses thrive, and roads that connect neighbors.&rdquo;
          </p>
          <p className="mt-6 text-brand-navy/50 font-medium">— James Worden IV, Owner</p>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="section-heading text-center mb-16">40 Years of Excellence</h2>
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-px bg-brand-amber/30" />

            <div className="space-y-12">
              {TIMELINE.map((item, i) => (
                <motion.div
                  key={item.year}
                  className={`relative flex gap-6 md:gap-0 ${
                    i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                  }`}
                  initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                >
                  {/* Dot */}
                  <div className="absolute left-6 md:left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-brand-amber border-4 border-white z-10" />

                  {/* Content card */}
                  <div
                    className={`ml-14 md:ml-0 md:w-5/12 ${
                      i % 2 === 0 ? 'md:pr-10' : 'md:pl-10 md:ml-auto'
                    }`}
                  >
                    <div className="card p-5">
                      <div className="font-display font-black text-brand-amber text-xl mb-1">
                        {item.year}
                      </div>
                      <p className="text-brand-navy/80 text-sm leading-relaxed">{item.event}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="section-heading text-center mb-12">The Team</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {TEAM.map((member, i) => (
              <motion.div
                key={member.name}
                className="card p-6 text-center"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
              >
                {/* Avatar placeholder */}
                <div className="w-20 h-20 rounded-full bg-brand-navy/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">👷</span>
                </div>
                <h3 className="font-display font-bold text-lg text-brand-navy">{member.name}</h3>
                <p className="text-brand-amber text-sm font-medium mt-1">{member.role}</p>
                <p className="text-brand-navy/60 text-sm mt-3 leading-relaxed">{member.bio}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Credentials */}
      <section className="py-16 bg-brand-navy text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-display font-black text-3xl text-center mb-10">
            Licensed, Insured, &amp; <span className="text-brand-amber">Accountable</span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              ['🏛', 'State Licensed', 'Contractor'],
              ['🛡', 'General Liability', 'Insured'],
              ['👷', "Workers' Comp", 'Covered'],
              ['📋', 'DOT Compliant', 'All projects'],
            ].map(([icon, title, sub]) => (
              <div key={title} className="bg-white/5 rounded-xl p-5">
                <div className="text-3xl mb-2">{icon}</div>
                <div className="font-bold text-white">{title}</div>
                <div className="text-white/40 text-xs mt-0.5">{sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-brand-amber text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="font-display font-black text-brand-navy text-3xl mb-4">
            Ready to work with the best in the business?
          </h2>
          <Link
            to="/quote"
            className="bg-brand-navy text-white font-bold px-8 py-4 rounded-lg hover:bg-brand-navy/90 transition-colors inline-block"
          >
            Request a Free Quote
          </Link>
        </div>
      </section>
    </>
  )
}

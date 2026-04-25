import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import SchemaMarkup, { LOCAL_BUSINESS_SCHEMA } from '../components/SchemaMarkup'
import SocialLinks from '../components/SocialLinks'
import SocialShare from '../components/SocialShare'

const TIMELINE = [
  {
    year: '1984',
    headline: 'One Truck. One Paver. One Promise.',
    event:
      'Harold Worden Sr. starts the company with a secondhand Barber-Greene paver and a single dump truck he bought at auction. The first contract: a church parking lot in Chester — four days of work, Harold and his brother Ray, $3,200. He drove home and told his wife they were in business.',
  },
  {
    year: 'Late 1980s',
    headline: 'Word Gets Around.',
    event:
      'No advertising. No signage on the truck. Just word-of-mouth from neighbors who watched Harold work. His son Harold Jr. starts riding along on weekends at age 11, holding the lath rod while his father graded. The company paves its first subdivision road in Colonial Heights.',
  },
  {
    year: '1993',
    headline: 'Second Generation, Full Time.',
    event:
      'Harold Jr. graduates Jefferson Davis High School and joins the company full-time. The crew expands beyond family for the first time — Ray Hooper and Tony "Big T" Torres sign on. Fleet grows to three trucks. Harold Sr. still runs the estimates himself.',
  },
  {
    year: '1997',
    headline: 'First Six-Figure Contract.',
    event:
      'The company wins a full-lot renovation for a strip mall on Jefferson Davis Hwy. At $118,000 it\'s the biggest job in Worden history at the time. Harold Sr. orders a second paver to handle the schedule. The crew works four consecutive 14-hour days.',
  },
  {
    year: '2003',
    headline: 'Engineering Meets Pavement.',
    event:
      'James Worden III joins after civil engineering coursework at VCU. He rebuilds the estimating process from scratch — precise grading specs, load calculations, drainage engineering on every quote. Precision becomes a Worden standard, not a premium.',
  },
  {
    year: '2005–2010',
    headline: 'Franchise Row.',
    event:
      'National fast-food franchise operators start calling. KFC, Arby\'s, and Taco Bell franchise groups in the Richmond metro become repeat clients. Eleven franchise lot projects in five years. Zero warranty callbacks. The Worden name becomes the preferred asphalt vendor across the region\'s franchise community.',
  },
  {
    year: '2014',
    headline: '500 Projects.',
    event:
      'The company\'s 500th completed project is a residential driveway in Chesterfield County — a homeowner whose mother had been a Worden client in the 1990s. Harold Sr. shows up to watch the pour. Company cookout at Chester Regional Park follows. He still drives his first truck to big job sites occasionally.',
  },
  {
    year: '2019',
    headline: 'Biggest Job to Date.',
    event:
      'A 3.4-acre apartment complex parking lot in Chesterfield County. Seven crew members. Six weeks. Four construction phases. The project requires over 2,100 tons of hot-mix asphalt, a full drainage overhaul, 180 parking stalls, and ADA-compliant ramp installations. Zero change orders.',
  },
  {
    year: 'Today',
    headline: 'Fourth Generation. Same Family.',
    event:
      'James Worden IV leads operations. GPS fleet dispatch, AI-assisted scheduling, digital estimating, and this website. The phone number is the same one Harold Sr. printed on his first business card in 1984. Still family-owned. Still Chester, Virginia.',
  },
]

const TEAM = [
  {
    name: 'James Worden IV',
    role: 'Owner & Operations Director',
    gen: '4th Generation',
    bio: 'Grew up on job sites holding a lath rod before he could hold a driver\'s license. Took the reins after a decade in the field. Believes every job — $2,500 driveway or $200,000 lot — deserves the same standard.',
    emoji: '👷',
  },
  {
    name: 'Harold Worden Jr.',
    role: 'Senior Advisor',
    gen: '2nd Generation · Semi-Retired',
    bio: 'Joined at 18. Ran crews for 30 years. Semi-retired but shows up for every major pour. The crew calls him "the benchmark" — if Harold walks the job and says nothing, it\'s right.',
    emoji: '🏆',
  },
  {
    name: 'Mike Chen',
    role: 'Head Paving Foreman',
    gen: '22 Years with the Company',
    bio: 'Has laid more linear feet of asphalt than anyone on the team — and it shows. Mike\'s mat is always smooth. Trains every new crew member himself, no exceptions.',
    emoji: '🛣',
  },
  {
    name: 'Denise Worden',
    role: 'Estimating & Client Relations',
    gen: 'Family · 15 Years',
    bio: 'Handles every quote personally. Straight numbers, clear breakdowns, no surprises. Commercial property managers specifically request her because they know the scope won\'t change after signature.',
    emoji: '📋',
  },
  {
    name: 'Tony Vasquez',
    role: 'Lead Crew Foreman',
    gen: '14 Years · Chester Native',
    bio: 'Chester born and raised. Joined at 22 as a laborer, made foreman in four years. Runs the residential crew and is the first one on site and the last to leave.',
    emoji: '🔧',
  },
  {
    name: 'Sarah Worden',
    role: 'Marketing & Community',
    gen: '4th Generation',
    bio: 'James IV\'s cousin. Manages the brand, social channels, and community presence. If you\'ve seen a before-and-after photo from a Worden job, Sarah shot it.',
    emoji: '📸',
  },
]

const NOTABLE_PROJECTS = [
  {
    name: 'Grace Baptist Church of Chester',
    year: '1984',
    type: 'Commercial',
    sqft: '4,200 sq ft',
    headline: 'The First Job.',
    story:
      'A church parking lot in Chester. Harold Sr., his brother Ray, and one truck. Four days of work. $3,200. Harold hand-cut every edge with a shovel. The lot is still standing today.',
    emoji: '⛪',
  },
  {
    name: 'Jefferson Davis Strip Mall Renovation',
    year: '1997',
    type: 'Commercial',
    sqft: '28,000 sq ft',
    headline: 'First Six Figures.',
    story:
      'Full mill-and-overlay of an aging shopping center lot. The job that proved the Worden crew could handle commercial-scale work. Harold Jr. ran the equipment, Harold Sr. ran the estimates. Four 14-hour days. Not a single punch-list item.',
    emoji: '🏢',
  },
  {
    name: 'Richmond Franchise Group Lots',
    year: '2005–2010',
    type: 'Franchise',
    sqft: '11 lots · ~220,000 sq ft total',
    headline: 'Franchise Row.',
    story:
      'KFC, Arby\'s, and Taco Bell operators across the Richmond metro. Eleven lots over five years. National franchise standards require tight tolerances and clean documentation — the Worden system was built for it. Zero warranty callbacks across all eleven jobs.',
    emoji: '🍗',
  },
  {
    name: 'Chesterfield Apartment Complex',
    year: '2019',
    type: 'Commercial',
    sqft: '3.4 acres · 180 stalls',
    headline: 'Largest Job in Company History.',
    story:
      'A full parking infrastructure build for a new 240-unit apartment complex. Seven crew members. Six weeks. Full drainage re-engineering, 2,100+ tons of HMA, ADA-compliant ramp installation throughout. The general contractor gave the project a perfect score on their post-completion survey.',
    emoji: '🏗',
  },
]

const VALUES = [
  {
    icon: '📞',
    title: 'Show Up',
    desc: 'We answer the phone. We\'re on site when we say we\'ll be. Showing up is the minimum standard, and we exceed it.',
  },
  {
    icon: '⚙️',
    title: 'Build It Right',
    desc: 'Commercial-grade specs on every job — residential or not. We don\'t cut corners on base depth or drainage because nobody will see it.',
  },
  {
    icon: '🤝',
    title: 'Stand Behind It',
    desc: 'If something goes wrong, we fix it. No questions, no argument, no charge. Our work carries our name.',
  },
  {
    icon: '📍',
    title: 'Stay Local',
    desc: 'We live here. Our kids go to school here. This community is our reputation — and we protect it on every job.',
  },
]

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.5, delay: i * 0.08 } }),
}

export default function About() {
  return (
    <>
      <SchemaMarkup
        title="About J. Worden & Sons — 4th-Generation Asphalt Paving Since 1984"
        description="The story of J. Worden & Sons — a fourth-generation family asphalt paving company serving Chester, VA and the Richmond region since 1984. Licensed, insured, and trusted by major franchises."
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
          <span className="inline-block bg-brand-amber/20 text-brand-amber text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-5">
            Est. 1984 · Chester, Virginia
          </span>
          <h1 className="font-display font-black text-5xl md:text-6xl mb-4">
            Our <span className="text-brand-amber">Story</span>
          </h1>
          <p className="text-white/70 text-xl max-w-2xl mx-auto">
            Four generations of Wordens have paved their way into this community.
            Here&apos;s how it happened.
          </p>
          <div className="mt-8 flex justify-center">
            <SocialShare path="/about" text="The J. Worden & Sons story — 4 generations of asphalt paving since 1984" compact />
          </div>
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

      {/* Stats row */}
      <section className="py-10 bg-brand-amber">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { stat: '1984', label: 'Founded' },
              { stat: '500+', label: 'Projects Completed' },
              { stat: '4th',  label: 'Generation Leading' },
              { stat: '4.9★', label: 'Google Rating' },
            ].map(({ stat, label }) => (
              <div key={label}>
                <div className="font-display font-black text-brand-navy text-3xl">{stat}</div>
                <div className="text-brand-navy/60 text-sm mt-1">{label}</div>
              </div>
            ))}
          </div>
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
                      <div className="font-display font-black text-brand-amber text-xl mb-0.5">
                        {item.year}
                      </div>
                      <div className="font-bold text-brand-navy text-sm mb-2">
                        {item.headline}
                      </div>
                      <p className="text-brand-navy/70 text-sm leading-relaxed">{item.event}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Notable Projects */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="section-heading mb-4">Jobs That Defined Us</h2>
            <p className="text-brand-navy/60 max-w-xl mx-auto">
              Not every job is a milestone, but some of them tell the whole story.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {NOTABLE_PROJECTS.map((p, i) => (
              <motion.div
                key={p.name}
                className="card p-6"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
              >
                <div className="flex items-start gap-4">
                  <div className="text-4xl flex-shrink-0">{p.emoji}</div>
                  <div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      <span className="text-xs font-bold uppercase tracking-widest text-brand-amber">
                        {p.year}
                      </span>
                      <span className="text-xs text-brand-navy/30">·</span>
                      <span className="text-xs text-brand-navy/50">{p.type}</span>
                      <span className="text-xs text-brand-navy/30">·</span>
                      <span className="text-xs text-brand-navy/50">{p.sqft}</span>
                    </div>
                    <h3 className="font-display font-bold text-lg text-brand-navy mb-1">
                      {p.name}
                    </h3>
                    <p className="text-brand-amber font-semibold text-sm mb-2">{p.headline}</p>
                    <p className="text-brand-navy/70 text-sm leading-relaxed">{p.story}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link to="/projects" className="btn-primary">
              View Full Project Portfolio →
            </Link>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="section-heading text-center mb-12">The Team</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {TEAM.map((member, i) => (
              <motion.div
                key={member.name}
                className="card p-6 text-center"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
              >
                <div className="w-20 h-20 rounded-full bg-brand-navy/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">{member.emoji}</span>
                </div>
                <h3 className="font-display font-bold text-lg text-brand-navy">{member.name}</h3>
                <p className="text-brand-amber text-sm font-medium mt-1">{member.role}</p>
                <p className="text-brand-navy/40 text-xs mt-0.5">{member.gen}</p>
                <p className="text-brand-navy/60 text-sm mt-3 leading-relaxed">{member.bio}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-brand-navy text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-display font-black text-4xl text-center mb-12">
            The Way We <span className="text-brand-amber">Work</span>
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUES.map((v, i) => (
              <motion.div
                key={v.title}
                className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
              >
                <div className="text-4xl mb-3">{v.icon}</div>
                <h3 className="font-display font-bold text-brand-amber text-lg mb-2">{v.title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Credentials */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-display font-black text-3xl text-center text-brand-navy mb-10">
            Licensed, Insured, &amp; <span className="text-brand-amber">Accountable</span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              ['🏛', 'State Licensed', 'Contractor'],
              ['🛡', 'General Liability', 'Insured'],
              ['👷', "Workers' Comp", 'Covered'],
              ['📋', 'DOT Compliant', 'All projects'],
            ].map(([icon, title, sub]) => (
              <div key={title} className="bg-brand-navy/5 rounded-xl p-5">
                <div className="text-3xl mb-2">{icon}</div>
                <div className="font-bold text-brand-navy">{title}</div>
                <div className="text-brand-navy/40 text-xs mt-0.5">{sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social follow */}
      <section className="py-14 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="font-display font-black text-brand-navy text-2xl mb-3">
            Follow the Work
          </h2>
          <p className="text-brand-navy/60 mb-6">
            Before &amp; afters, crew moments, and local paving tips — across every platform.
          </p>
          <SocialLinks
            size="lg"
            variant="badge"
            className="justify-center"
          />
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

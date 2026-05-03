import React from 'react';
import { ArrowRight, Award, BookOpen, Building2, CheckCircle2, CircleDollarSign, ClipboardCheck, Hammer, ListChecks, Phone, TriangleAlert } from 'lucide-react';
import SEO from '../components/SEO';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import HomeSchema from '../components/HomeSchema';
import SmartImage from '@/components/SmartImage';
import { trackPhoneClick } from '@/lib/analytics';

const HERO_IMAGE = 'https://media.api.com/images/public/69c853446b8987b1630018ff/fd6e29837_20171212_192947499_iOS.jpg';
const LOT_IMAGE = 'https://media.api.com/images/public/69c853446b8987b1630018ff/9bc7682e8_kfc_richmond_va_1st_on_sealed.jpg';
const WORK_IMAGE = 'https://media.api.com/images/public/69c853446b8987b1630018ff/5eb378b00_IMG_0844.jpg';

const serviceSolutions = [
  'Residential driveway paving, overlays, and private lanes',
  'Commercial asphalt paving and parking lot resurfacing',
  'Sealcoating, crack sealing, and pavement preservation programs',
  'Asphalt repair, pothole patching, milling, and overlays',
  'Drainage, base failure, grading, and water correction',
  'Concrete, curbing, sidewalks, pads, and transitions',
  'Line striping, ADA layout, and property reimage work',
];

const markets = [
  'Property and facility managers',
  'Retail centers and shopping plazas',
  'Industrial yards and logistics properties',
  'Churches, schools, HOAs, and private communities',
  'Commercial owners preparing to lease, sell, or reposition',
  'Residential driveways and estate access roads',
  'Rural homeowners between the larger cities',
  'Sealcoating and repair customers protecting existing pavement',
];

const richmondMetroSignals = [
  {
    title: 'Richmond City',
    body: 'Driveway repair, alley access, commercial patching, and sealcoating from The Fan and Museum District to Manchester, Church Hill, Scott\'s Addition, and Shockoe Bottom.',
    href: '/locations/richmond-va',
  },
  {
    title: 'Chester / Chesterfield',
    body: 'The home-base corridor for residential driveways, private lanes, church lots, HOAs, rural entrances, and commercial maintenance south of Richmond.',
    href: '/locations/chester-va',
  },
  {
    title: 'Henrico / West End',
    body: 'Sealcoating, crack repair, parking-lot resurfacing, residential paving, and industrial pavement planning from Glen Allen to Sandston.',
    href: '/locations/henrico-va',
  },
  {
    title: 'Midlothian / Short Pump',
    body: 'High-value residential driveways, estate access roads, retail centers, and maintenance plans for the west and northwest Richmond growth markets.',
    href: '/locations/midlothian-va',
  },
];

const footprintAnchors = [
  {
    title: 'Southside / Dinwiddie',
    body: 'Driveways, private lanes, church lots, and commercial surfaces from Dinwiddie through the Petersburg and I-85 Southside corridor.',
  },
  {
    title: 'Northern Virginia / Fairfax',
    body: 'Residential, HOA, commercial, and phased parking-lot work for Fairfax and the Northern Virginia commuter corridor.',
  },
  {
    title: 'Hampton Roads / Virginia Beach',
    body: 'Coastal asphalt planning for Virginia Beach, Chesapeake, Williamsburg, and high-moisture pavement conditions near the water.',
  },
  {
    title: 'Williamsburg / New Kent Growth',
    body: 'New-construction driveways, estate lanes, commercial pads, and access roads in Williamsburg, New Kent County, and the I-64 growth corridor.',
  },
  {
    title: 'Rural Residential Corridors',
    body: 'Long driveways, private roads, farm entrances, and county-road homes between the bigger city markets where residential asphalt demand is strongest.',
  },
  {
    title: 'I-81 / Shenandoah Corridor',
    body: 'Mountain-grade pavement planning for Roanoke, Harrisonburg, Winchester, and I-81 freeze-thaw conditions.',
  },
];

const processSteps = [
  {
    title: 'Diagnose Before We Price',
    body: 'We look for base failure, drainage problems, cracking patterns, traffic load, ADA issues, and the actual reason the pavement is breaking down.',
  },
  {
    title: 'Explain The Options',
    body: 'You get a clear recommendation: repair, preserve, resurface, replace, or wait. The goal is the right scope, not the biggest scope.',
  },
  {
    title: 'Build It To Hold Up',
    body: 'Crews execute with the right prep, compaction, material choice, drainage control, and communication so the finished work protects the property.',
  },
];

const learningTopics = [
  'How to spot base failure before a low bid turns expensive',
  'When sealcoating is preservation and when it is only cosmetic',
  'Why drainage destroys asphalt faster than traffic in many lots',
  'What property managers should ask before approving a paving quote',
];

const pricingFactors = [
  'Square footage and access for trucks, rollers, and milling equipment',
  'Existing pavement depth, base condition, soft spots, and excavation needs',
  'Drainage correction, catch basins, grading, and water flow problems',
  'Rural driveway length, slope, turnaround needs, culvert conditions, and stone base depth',
  'Material choice, lift thickness, traffic load, striping, and ADA details',
];

const decisionSignals = [
  { label: 'Repair', body: 'Best when damage is isolated, the base is stable, and the surrounding pavement still has useful life.' },
  { label: 'Preserve', body: 'Best when asphalt is oxidizing or cracking early but does not yet need major structural replacement.' },
  { label: 'Resurface', body: 'Best when the lot needs a new wearing surface but drainage and base conditions are controlled.' },
  { label: 'Replace', body: 'Best when base failure, alligator cracking, standing water, or repeated patch failure shows the structure is gone.' },
];

const trustChecklist = [
  'Ask for a written scope with asphalt thickness, base depth, and prep method',
  'Confirm drainage corrections are included before approving resurfacing',
  'Compare repair, preservation, resurfacing, and replacement options side by side',
  'Require insurance, local accountability, references, and clear warranty terms',
  'Avoid vague proposals that hide milling, patching, striping, or disposal details',
];

const internalLinks = [
  { label: 'Asphalt Paving', href: '/paving' },
  { label: 'Sealcoating', href: '/sealcoating' },
  { label: 'Hardscapes', href: '/hardscapes' },
  { label: 'Millings & Fines', href: '/millings-fines' },
  { label: 'Richmond Commercial', href: '/commercial/richmond-va' },
  { label: 'Learning Center', href: '/blog' },
];

const serviceAreaLinks = [
  { label: 'Chester', href: '/locations/chester-va' },
  { label: 'Dinwiddie', href: '/locations/dinwiddie-va' },
  { label: 'Richmond', href: '/locations/richmond-va' },
  { label: 'Fredericksburg', href: '/locations/fredericksburg-va' },
  { label: 'Fairfax', href: '/locations/fairfax-va' },
  { label: 'Virginia Beach', href: '/locations/virginia-beach-va' },
  { label: 'Williamsburg', href: '/locations/williamsburg-va' },
  { label: 'New Kent', href: '/locations/new-kent-va' },
  { label: 'Roanoke', href: '/locations/roanoke-va' },
  { label: 'Harrisonburg', href: '/locations/harrisonburg-va' },
  { label: 'Winchester', href: '/locations/winchester-va' },
];

const faqs = [
  {
    question: 'How do I know if my asphalt should be repaired or replaced?',
    answer: 'Start with the failure pattern. Isolated potholes and edge damage may be repairable, but alligator cracking, standing water, rutting, and repeated patch failure usually point to base or drainage issues that need a bigger correction.',
  },
  {
    question: 'What drives the cost of asphalt paving in Virginia?',
    answer: 'Square footage matters, but the real price comes from base condition, excavation depth, drainage, access, asphalt thickness, traffic load, striping, ADA needs, and whether the old surface has to be milled or removed.',
  },
  {
    question: 'Is sealcoating always worth it?',
    answer: 'Sealcoating is worth it when the pavement structure is sound and the surface needs oxidation protection. It is not a structural repair. If cracks, soft spots, or drainage problems are active, those issues should be diagnosed first.',
  },
  {
    question: 'Why do low asphalt bids fail?',
    answer: 'Low bids often leave out base repair, proper milling, drainage correction, adequate asphalt thickness, edge work, or cleanup. A cheap scope can look good for one season and cost far more when the same failure returns.',
  },
  {
    question: 'Does J. Worden & Sons handle both commercial and residential paving?',
    answer: 'Yes. The company is positioned around a balanced residential and commercial mix, with driveway, private-lane, parking-lot, sealcoating, and asphalt repair work all treated as core services. J. Worden serves Virginia property managers, commercial owners, retail centers, industrial properties, HOAs, churches, schools, private communities, and residential driveway customers from Dinwiddie and Southside Virginia north to Fairfax, east to Virginia Beach, through the Williamsburg and New Kent new-construction corridor, across rural residential areas between the larger cities, and west through the I-81 corridor.',
  },
  {
    question: 'Do you handle sealcoating and asphalt repair, or only full paving?',
    answer: 'Sealcoating, crack sealing, pothole repair, patching, milling, overlays, and pavement preservation are major services. Many properties do not need full replacement yet; the right repair or maintenance plan can protect the driveway or lot and delay a larger capital project.',
  },
  {
    question: 'What Richmond-area markets does J. Worden prioritize?',
    answer: 'Richmond metro is home turf. The core local service area includes Richmond, Chester, Chesterfield, Henrico, Glen Allen, Short Pump, Midlothian, Bon Air, Tuckahoe, Mechanicsville, Ashland, Petersburg, Hopewell, and nearby rural residential corridors where driveway, sealcoating, repair, and parking-lot work are strongest.',
  },
];

const proofStats = [
  { value: '40+', label: 'years serving Virginia' },
  { value: '50/50', label: 'residential and commercial focus' },
  { value: 'Award-winning', label: 'real-world contractor reputation' },
  { value: 'Family-owned', label: 'local accountability on every project' },
  { value: '4 corridors', label: 'Southside, NOVA, coast, and I-81' },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background font-body relative text-foreground">
      <SEO 
        title="J. Worden & Sons Asphalt Paving | Award-Winning Virginia Paving Contractor"
        description="Award-winning Virginia asphalt paving from Dinwiddie north to Fairfax, east to Virginia Beach, through Williamsburg/New Kent and rural residential corridors, and west through I-81."
      />
      <HomeSchema />
      <Navbar />

      <section className="relative min-h-[92vh] overflow-hidden bg-black pt-32">
        <div className="absolute inset-0">
          <SmartImage
            src={HERO_IMAGE}
            alt="J. Worden & Sons asphalt paving crew work"
            width={2560}
            height={1440}
            priority
            sizes="100vw"
            className="h-full w-full object-cover opacity-55 grayscale contrast-125"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,#050505_0%,rgba(5,5,5,0.88)_42%,rgba(5,5,5,0.42)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-background to-transparent" />
        </div>

        <div className="relative z-10 mx-auto flex min-h-[78vh] max-w-7xl flex-col justify-end px-6 pb-16 lg:px-8">
          <div className="max-w-5xl">
            <div className="mb-7 inline-flex items-center gap-3 border border-primary/40 bg-black/70 px-4 py-2 text-primary">
              <Award className="h-4 w-4" />
              <span className="font-display text-sm uppercase tracking-[0.24em]">Award-winning Virginia paving company</span>
            </div>
            <h1 className="font-display text-6xl font-black uppercase leading-[0.86] tracking-normal text-white md:text-8xl lg:text-9xl">
              Educate First.<br />
              <span className="text-primary">Pave Second.</span>
            </h1>
            <p className="mt-8 max-w-3xl text-lg leading-relaxed text-zinc-200 md:text-2xl">
              The other paving quote may tell you what they want to sell. We show you what your asphalt actually needs, what can wait, and where bad scopes waste money.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <a
                href="tel:+18044461296"
                onClick={() => trackPhoneClick('homepage_hero')}
                className="inline-flex min-h-[52px] items-center gap-3 bg-primary px-7 py-4 font-display text-lg uppercase tracking-[0.12em] text-black transition-colors hover:bg-white"
              >
                <Phone className="h-5 w-5" />
                Schedule A Free Evaluation
              </a>
              <a
                href="#diagnose"
                className="inline-flex min-h-[52px] items-center gap-3 border border-white/25 px-7 py-4 font-display text-lg uppercase tracking-[0.12em] text-white transition-colors hover:border-primary hover:text-primary"
              >
                Diagnose My Pavement
                <ArrowRight className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div className="mt-14 grid max-w-6xl grid-cols-2 border-y border-white/15 md:grid-cols-5">
            {proofStats.map((stat) => (
              <div key={stat.label} className="border-white/15 py-5 pr-5 md:border-r md:last:border-r-0">
                <p className="font-display text-3xl uppercase text-white md:text-4xl">{stat.value}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.16em] text-zinc-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="diagnose" className="border-b border-border bg-background py-20 md:py-28">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-[0.92fr_1.08fr] lg:px-8">
          <div>
            <p className="font-display text-sm uppercase tracking-[0.24em] text-primary">What we believe</p>
            <h2 className="mt-4 font-display text-5xl uppercase leading-[0.92] tracking-normal text-white md:text-7xl">
              The right paving decision starts before the proposal.
            </h2>
          </div>
          <div className="space-y-6 text-base leading-relaxed text-zinc-300 md:text-lg">
            <p>
              Most asphalt problems are not solved by the prettiest number on a bid sheet. They are solved by understanding water, base depth, use, traffic load, edges, patch history, and what the property owner is trying to protect.
            </p>
            <p>
              J. Worden & Sons is built around that kind of straight answer. We would rather explain why a smaller repair is smarter than sell a job that fails early or does not match the property.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {['Transparent guidance', 'No pressure diagnosis', 'Repair vs. replace clarity', 'Long-term pavement planning'].map((item) => (
                <div key={item} className="flex items-center gap-3 border border-border bg-card/70 p-4">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                  <span className="font-display text-xl uppercase text-white">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="services" className="bg-[#111111] py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="font-display text-sm uppercase tracking-[0.24em] text-primary">Core service solutions</p>
              <h2 className="mt-4 font-display text-5xl uppercase leading-none text-white md:text-7xl">Everything your pavement needs.</h2>
            </div>
            <p className="max-w-xl text-base leading-relaxed text-zinc-400">
              The work is roughly balanced between residential and commercial. Driveways, private lanes, parking lots, sealcoating, crack repair, patching, and resurfacing all matter because most pavement needs the right maintenance long before it needs full replacement.
            </p>
          </div>

          <div className="grid gap-px overflow-hidden border border-border bg-border md:grid-cols-2 lg:grid-cols-3">
            {serviceSolutions.map((service) => (
              <article key={service} className="bg-background p-7 transition-colors hover:bg-card">
                <Hammer className="mb-6 h-6 w-6 text-primary" />
                <h3 className="font-display text-3xl uppercase leading-none text-white">{service}</h3>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="grid bg-black lg:grid-cols-2">
        <div className="min-h-[420px]">
          <SmartImage
            src={LOT_IMAGE}
            alt="Finished commercial parking lot by J. Worden & Sons"
            width={1600}
            height={1100}
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="h-full w-full object-cover"
          />
        </div>
        <div className="flex items-center px-6 py-20 lg:px-16">
          <div className="max-w-2xl">
            <p className="font-display text-sm uppercase tracking-[0.24em] text-primary">Markets we serve</p>
            <h2 className="mt-4 font-display text-5xl uppercase leading-none text-white md:text-7xl">Built for owners who need the truth.</h2>
              <p className="mt-6 text-base leading-relaxed text-zinc-300">
                Our practical service footprint runs from Dinwiddie and Southside Virginia north to Fairfax and Northern Virginia, east to Virginia Beach and Hampton Roads, through Williamsburg and New Kent County new-construction growth, across the rural residential corridors between the larger cities, and west through the I-81 corridor.
              </p>
            <div className="mt-9 grid gap-4 sm:grid-cols-2">
              {markets.map((market) => (
                <div key={market} className="border-l border-primary bg-white/[0.03] p-4 text-sm leading-relaxed text-zinc-300">
                  {market}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-background py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-12 max-w-4xl">
            <p className="font-display text-sm uppercase tracking-[0.24em] text-primary">Richmond local pack focus</p>
            <h2 className="mt-4 font-display text-5xl uppercase leading-none text-white md:text-7xl">Home turf around Richmond.</h2>
            <p className="mt-7 text-lg leading-relaxed text-zinc-300">
              Richmond is the center of gravity for the company: Chester, Chesterfield, Henrico, Midlothian, Short Pump, Glen Allen, Bon Air, Tuckahoe, Mechanicsville, Ashland, Petersburg, and Hopewell. That is where residential driveways, rural lanes, sealcoating, crack repair, pothole repair, and commercial lot maintenance need fast local response and clear scope details.
            </p>
          </div>
          <div className="grid gap-px overflow-hidden border border-border bg-border md:grid-cols-2 lg:grid-cols-4">
            {richmondMetroSignals.map((market) => (
              <a key={market.title} href={market.href} className="bg-card p-7 transition-colors hover:bg-[#171717]">
                <p className="font-display text-2xl uppercase leading-none text-white">{market.title}</p>
                <p className="mt-5 text-sm leading-relaxed text-zinc-400">{market.body}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section id="process" className="border-y border-border bg-background py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-12 max-w-4xl">
            <p className="font-display text-sm uppercase tracking-[0.24em] text-primary">The Worden process</p>
            <h2 className="mt-4 font-display text-5xl uppercase leading-none text-white md:text-7xl">No mystery. No scare tactics. No throwaway scopes.</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {processSteps.map((step, index) => (
              <article key={step.title} className="border border-border bg-card/60 p-8">
                <p className="font-display text-6xl text-primary">{index + 1}</p>
                <h3 className="mt-8 font-display text-3xl uppercase leading-none text-white">{step.title}</h3>
                <p className="mt-5 text-sm leading-relaxed text-zinc-400">{step.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="learning" className="bg-[#111111] py-20 md:py-28">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-[1fr_0.9fr] lg:px-8">
          <div>
            <p className="font-display text-sm uppercase tracking-[0.24em] text-primary">Learning center mindset</p>
            <h2 className="mt-4 font-display text-5xl uppercase leading-none text-white md:text-7xl">We teach you what to look for before you hire anyone.</h2>
            <p className="mt-7 max-w-3xl text-lg leading-relaxed text-zinc-300">
              A better buyer gets a better project. Our public pages are being rebuilt around the questions property owners actually ask: cost, timing, warning signs, repair vs. replace, drainage, ADA, and what separates a lasting job from a cheap one.
            </p>
            <a href="/blog" className="mt-8 inline-flex items-center gap-3 border border-primary px-6 py-4 font-display text-lg uppercase tracking-[0.12em] text-primary transition-colors hover:bg-primary hover:text-black">
              Visit The Learning Center
              <BookOpen className="h-5 w-5" />
            </a>
          </div>
          <div className="space-y-4">
            {learningTopics.map((topic) => (
              <div key={topic} className="flex gap-4 border border-border bg-background p-5">
                <ClipboardCheck className="mt-1 h-5 w-5 shrink-0 text-primary" />
                <p className="text-base leading-relaxed text-zinc-300">{topic}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="border-y border-border bg-background py-20 md:py-28">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-[0.86fr_1.14fr] lg:px-8">
          <div>
            <p className="font-display text-sm uppercase tracking-[0.24em] text-primary">Cost and pricing guidance</p>
            <h2 className="mt-4 font-display text-5xl uppercase leading-none text-white md:text-7xl">Real paving prices come from real site conditions.</h2>
            <p className="mt-7 text-lg leading-relaxed text-zinc-300">
              A responsible estimate should explain what drives cost before it asks you to sign. We help owners understand the variables, compare scopes, and spot bids that leave out the work that actually protects the pavement.
            </p>
          </div>
          <div className="grid gap-px border border-border bg-border sm:grid-cols-2">
            {pricingFactors.map((factor) => (
              <article key={factor} className="bg-card p-7">
                <CircleDollarSign className="mb-6 h-6 w-6 text-primary" />
                <p className="text-base leading-relaxed text-zinc-300">{factor}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#111111] py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-12 max-w-4xl">
            <p className="font-display text-sm uppercase tracking-[0.24em] text-primary">Repair or replace?</p>
            <h2 className="mt-4 font-display text-5xl uppercase leading-none text-white md:text-7xl">The answer should come from the pavement, not the salesperson.</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-4">
            {decisionSignals.map((signal) => (
              <article key={signal.label} className="border border-border bg-background p-7">
                <ListChecks className="mb-7 h-6 w-6 text-primary" />
                <h3 className="font-display text-4xl uppercase leading-none text-white">{signal.label}</h3>
                <p className="mt-5 text-sm leading-relaxed text-zinc-400">{signal.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-background py-20 md:py-28">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
          <div>
            <p className="font-display text-sm uppercase tracking-[0.24em] text-primary">How to compare contractors</p>
            <h2 className="mt-4 font-display text-5xl uppercase leading-none text-white md:text-7xl">Google can rank pages. Owners still need a checklist.</h2>
            <p className="mt-7 text-lg leading-relaxed text-zinc-300">
              The best asphalt page should make you harder to fool. These are the items we want every Virginia buyer to check before choosing any paving contractor, including us.
            </p>
          </div>
          <div className="space-y-4">
            {trustChecklist.map((item) => (
              <div key={item} className="flex gap-4 border border-border bg-card p-5">
                <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-primary" />
                <p className="text-base leading-relaxed text-zinc-300">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#111111] py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-12 max-w-4xl">
            <p className="font-display text-sm uppercase tracking-[0.24em] text-primary">Helpful answers</p>
            <h2 className="mt-4 font-display text-5xl uppercase leading-none text-white md:text-7xl">Asphalt questions buyers ask before they call.</h2>
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            {faqs.map((faq) => (
              <article key={faq.question} className="border border-border bg-background p-7">
                <h3 className="font-display text-3xl uppercase leading-none text-white">{faq.question}</h3>
                <p className="mt-5 text-sm leading-relaxed text-zinc-400">{faq.answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-background py-20 md:py-28">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <p className="font-display text-sm uppercase tracking-[0.24em] text-primary">Explore services</p>
            <h2 className="mt-4 font-display text-5xl uppercase leading-none text-white md:text-7xl">Clear paths for every major paving need.</h2>
            <div className="mt-8 flex flex-wrap gap-3">
              {internalLinks.map((link) => (
                <a key={link.href} href={link.href} className="border border-border bg-card px-5 py-3 font-display text-xl uppercase text-white transition-colors hover:border-primary hover:text-primary">
                  {link.label}
                </a>
              ))}
            </div>
          </div>
          <div>
            <p className="font-display text-sm uppercase tracking-[0.24em] text-primary">Service areas</p>
            <h2 className="mt-4 font-display text-5xl uppercase leading-none text-white md:text-7xl">Dinwiddie to Fairfax. Virginia Beach to I-81.</h2>
            <div className="mt-8 grid gap-4">
              {footprintAnchors.map((anchor) => (
                <article key={anchor.title} className="border-l border-primary bg-card p-5">
                  <h3 className="font-display text-3xl uppercase leading-none text-white">{anchor.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-zinc-400">{anchor.body}</p>
                </article>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              {serviceAreaLinks.map((link) => (
                <a key={link.href} href={link.href} className="border border-border bg-card px-5 py-3 font-display text-xl uppercase text-white transition-colors hover:border-primary hover:text-primary">
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid bg-black lg:grid-cols-[0.9fr_1.1fr]">
        <div className="flex items-center px-6 py-20 lg:px-16">
          <div className="max-w-2xl">
            <div className="mb-7 inline-flex items-center gap-3 border border-primary/40 bg-primary/10 px-4 py-2 text-primary">
              <TriangleAlert className="h-4 w-4" />
              <span className="font-display text-sm uppercase tracking-[0.2em]">Avoid the expensive mistake</span>
            </div>
            <h2 className="font-display text-5xl uppercase leading-none text-white md:text-7xl">The wrong paving contractor is not cheap.</h2>
            <p className="mt-7 text-lg leading-relaxed text-zinc-300">
              Low bids often hide missing prep, thin asphalt, weak base repair, ignored drainage, vague exclusions, and future change orders. The right question is not just price. It is whether the scope protects the pavement after we leave.
            </p>
          </div>
        </div>
        <div className="min-h-[420px]">
          <SmartImage
            src={WORK_IMAGE}
            alt="Asphalt paving equipment and crew on active project"
            width={1600}
            height={1100}
            sizes="(max-width: 1024px) 100vw, 55vw"
            className="h-full w-full object-cover grayscale"
          />
        </div>
      </section>

      <section className="bg-primary py-16 text-black">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div>
            <p className="font-display text-sm uppercase tracking-[0.22em]">How can we help?</p>
            <h2 className="mt-2 font-display text-4xl uppercase leading-none md:text-6xl">Ready to take the guesswork out of asphalt?</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href="tel:+18044461296" onClick={() => trackPhoneClick('homepage_bottom')} className="inline-flex min-h-[52px] items-center gap-3 bg-black px-7 py-4 font-display text-lg uppercase tracking-[0.12em] text-white">
              <Phone className="h-5 w-5" />
              Call 804.446.1296
            </a>
            <a href="/jwordenai" className="inline-flex min-h-[52px] items-center gap-3 border border-black px-7 py-4 font-display text-lg uppercase tracking-[0.12em] text-black">
              JWORDENAI Teaser
              <Building2 className="h-5 w-5" />
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

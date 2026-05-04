import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BrainCircuit, Building2, Camera, ClipboardCheck, Eye, Home, Layers3, LockKeyhole, Map, Palette, Phone, ScanLine, ShieldAlert, Sparkles } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SEO from '@/components/SEO';
import SchemaMarkup from '../components/SchemaMarkup';
import SmartImage from '@/components/SmartImage';
import { trackPhoneClick } from '@/lib/analytics';
import { SITE_IMAGES } from '@/lib/siteImages';

const teaserCards = [
  {
    title: 'Pavement Intelligence',
    body: 'Field observations, customer phone scans, photos, potholes, water seepage, scopes, and maintenance history organized into clearer decisions for asphalt owners and managers.',
    icon: Eye,
  },
  {
    title: 'Proposal Support',
    body: 'Internal tooling for turning Driveway + Lot AI Scan packets into better explanations, cleaner scopes, and faster follow-up.',
    icon: ClipboardCheck,
  },
  {
    title: 'Market Awareness',
    body: 'Regional service-area intelligence, project patterns, buyer education, and scan-driven demand signals shaped around Virginia paving work.',
    icon: Map,
  },
];

const boundaries = [
  'Public scans start at Driveway + Lot AI, not inside the private command center',
  'The proprietary routing, pricing, state-intelligence, and bid-decision logic stays internal',
  'Customers see premium guidance and clear next steps, not the company operating playbook',
  'No customer documents or job data exposed',
  'No back-office command center access',
  'Human estimator review before any final bid is released',
  'Roof and structural scans are triage only until a qualified pro verifies the site',
];

const scanSignals = [
  'Driveways and small or medium parking lots',
  'Potholes, failed patches, broken asphalt, and water seepage',
  'Customer photos, walkaround video, edge sketch, and square-foot estimate',
  'Drone scan recommendation for shopping centers and industrial lots',
];

const futureScanChannels = [
  {
    title: 'Roof Damage Scan',
    body: 'Customer photos and drone imagery can flag missing shingles, ponding, flashing issues, storm damage, soft decking risk, and areas that need roofer review.',
    icon: Home,
  },
  {
    title: 'House Damage Triage',
    body: 'Visible cracks, water intrusion, settlement clues, fascia damage, exterior rot, and drainage problems can be organized into an inspection packet before anyone prices work.',
    icon: Building2,
  },
  {
    title: 'Structural Review Boundary',
    body: 'The AI can collect evidence and rank risk. It should not replace a licensed structural engineer, building inspector, roofer, or qualified contractor on final safety decisions.',
    icon: ShieldAlert,
  },
];

const designScanChannels = [
  {
    title: 'Kitchen Remodel Studio',
    body: 'Photos, room dimensions, cabinet goals, surfaces, lighting, appliance moves, and finish ideas can become a readable 4D remodel packet.',
    icon: Sparkles,
  },
  {
    title: 'Additions And Floor Plans',
    body: 'Floor-plan logic can help owners compare room layouts, additions, ADUs, and square-foot costs before full drawings or trade bids.',
    icon: Layers3,
  },
  {
    title: 'Patios And Interior Design',
    body: 'Patios, pavers, hardscapes, outdoor rooms, finishes, and interior concepts can be organized into visual choices instead of confusing proposal language.',
    icon: Palette,
  },
];

const revenueLayers = [
  {
    title: 'Paid Scan Reviews',
    body: 'Customers can start with phone photos, video, sketches, and damage notes, then move into an estimator-reviewed packet when they need a clearer answer before spending thousands.',
    icon: Camera,
  },
  {
    title: 'Design Decision Packets',
    body: 'Kitchen remodels, additions, patios, hardscapes, and interiors can become paid visual planning packets with ranges, options, and phasing before full construction begins.',
    icon: Palette,
  },
  {
    title: 'Private Operator Advantage',
    body: 'The customer sees confidence and clarity. The proprietary pricing, routing, civil, legal, follow-up, and bid strategy logic stays inside the business where it protects margin.',
    icon: LockKeyhole,
  },
  {
    title: 'Plan-To-Bid Readiness',
    body: 'Plans, photos, sketches, permits, and owner goals can become a paid readiness review before the company builds a final human-approved construction proposal.',
    icon: ClipboardCheck,
  },
];

export default function JwordenAI() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'JWORDENAI',
    description: 'A teaser for the internal construction intelligence system behind J. Worden & Sons Asphalt Paving, with Driveway + Lot AI Scan as its public proof point.',
    url: 'https://www.jwordenasphaltpaving.com/jwordenai',
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO
        title="JWORDENAI | Construction Intelligence Teaser"
        description="A public preview of the private construction intelligence system supporting J. Worden & Sons Asphalt Paving, including the Driveway + Lot AI Scan source experience."
        canonicalPath="/jwordenai"
        jsonLd={schema}
      />
      <SchemaMarkup
        title="JWORDENAI | Construction Intelligence Teaser"
        description="A public preview of the private construction intelligence system supporting J. Worden & Sons Asphalt Paving, including the Driveway + Lot AI Scan source experience."
        canonical="/jwordenai"
        breadcrumb={[{ name: 'Home', path: '/' }, { name: 'JWORDENAI', path: '/jwordenai' }]}
      />
      <Navbar />

      <section className="relative overflow-hidden bg-black pt-36">
        <div className="absolute inset-0 opacity-55">
          <SmartImage
            src={SITE_IMAGES.industrialWork}
            alt="Industrial site work and paving project visual proof"
            width={1800}
            height={1200}
            priority
            sizes="100vw"
            className="h-full w-full grayscale contrast-125"
          />
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(0,0,0,0.96)_0%,rgba(0,0,0,0.84)_52%,rgba(50,40,15,0.62)_100%)]" />
        </div>
        <div className="relative z-10 mx-auto max-w-7xl px-6 pb-24 pt-12 lg:px-8">
          <div className="max-w-5xl">
            <div className="mb-7 inline-flex items-center gap-3 border border-primary/40 bg-primary/10 px-4 py-2 text-primary">
              <BrainCircuit className="h-4 w-4" />
              <span className="font-display text-sm uppercase tracking-[0.24em]">Private construction intelligence teaser</span>
            </div>
            <h1 className="font-display text-7xl font-black uppercase leading-[0.82] tracking-normal text-white md:text-9xl">
              JWORDENAI
            </h1>
            <p className="mt-8 max-w-3xl text-xl leading-relaxed text-zinc-300 md:text-2xl">
              The public page is only a window. The live source is the Driveway + Lot AI Scan: customers sketch pavement, upload damage, flag water problems, and create an estimator-ready packet while the deeper system stays behind the company. The same scan pattern can extend into roofs, house damage, and structural triage with the right professional review boundaries.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link to="/driveway-ai" className="inline-flex min-h-[52px] items-center gap-3 bg-primary px-7 py-4 font-display text-sm font-bold uppercase tracking-[0.14em] text-black transition-colors hover:bg-primary/90">
                Open Driveway + Lot AI Scan
                <ArrowRight className="h-5 w-5" />
              </Link>
              <a href="tel:+18044461296" onClick={() => trackPhoneClick('jwordenai_hero')} className="inline-flex min-h-[52px] items-center gap-3 border border-white/25 px-7 py-4 font-display text-sm font-bold uppercase tracking-[0.14em] text-white transition-colors hover:border-primary/60">
                <Phone className="h-5 w-5" />
                Call 804.446.1296
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-[#0b0b0b] py-16 md:py-20">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
          <div>
            <div className="mb-5 inline-flex items-center gap-3 border border-primary/40 bg-primary/10 px-4 py-2 text-primary">
              <ScanLine className="h-4 w-4" />
              <span className="font-display text-sm uppercase tracking-[0.22em]">Public source experience</span>
            </div>
            <h2 className="font-display text-5xl uppercase leading-none text-white md:text-7xl">
              The front-end proof is already live.
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-zinc-300">
              Driveway + Lot AI Scan is the customer-facing source layer for JWORDENAI. It turns a homeowner phone, property-manager photos, pavement edge sketches, and visible distress into structured intake before an estimator ever steps on site.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {scanSignals.map((signal) => (
              <div key={signal} className="border border-white/10 bg-background p-5">
                <Camera className="mb-4 h-5 w-5 text-primary" />
                <p className="font-display text-2xl uppercase leading-tight text-white">{signal}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-background py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-10 max-w-4xl">
            <p className="font-display text-sm uppercase tracking-[0.24em] text-primary">Beyond pavement</p>
            <h2 className="mt-4 font-display text-5xl uppercase leading-none text-white md:text-7xl">
              The same source layer can support roofs and visible building damage.
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-zinc-300">
              JWORDENAI can use the same customer-phone and drone-scan workflow for roof issues, exterior home damage, water intrusion, settlement clues, and structural warning signs. The system should organize evidence, not make final safety calls.
            </p>
          </div>
          <div className="grid gap-px border border-border bg-border md:grid-cols-2 xl:grid-cols-4">
            {futureScanChannels.map((channel) => {
              const Icon = channel.icon;
              return (
                <article key={channel.title} className="bg-card p-8">
                  <Icon className="mb-8 h-7 w-7 text-primary" />
                  <h3 className="font-display text-3xl uppercase leading-none text-white">{channel.title}</h3>
                  <p className="mt-5 text-sm leading-relaxed text-zinc-400">{channel.body}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-[#0b0b0b] py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-10 max-w-4xl">
            <p className="font-display text-sm uppercase tracking-[0.24em] text-primary">Design intelligence</p>
            <h2 className="mt-4 font-display text-5xl uppercase leading-none text-white md:text-7xl">
              Houzz-style inspiration connected to real GC pricing and phasing.
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-zinc-300">
              The same source layer can support kitchen remodels, home additions, interior design, patio installs, hardscapes, and outdoor living. The premium value is simple: show the customer the idea, the cost range, the risks, and the project timeline before they sign a full construction agreement.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/visualizer" className="inline-flex min-h-[48px] items-center gap-3 bg-primary px-6 py-3 font-display text-xs font-bold uppercase tracking-[0.14em] text-black transition-colors hover:bg-primary/90">
                Open 3D Visualizer
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/floor-plan-studio" className="inline-flex min-h-[48px] items-center gap-3 border border-primary/45 px-6 py-3 font-display text-xs font-bold uppercase tracking-[0.14em] text-primary transition-colors hover:bg-primary hover:text-black">
                Interior Design Studio
              </Link>
              <Link to="/general-contracting" className="inline-flex min-h-[48px] items-center gap-3 border border-white/25 px-6 py-3 font-display text-xs font-bold uppercase tracking-[0.14em] text-white transition-colors hover:border-primary/60">
                GC Design Services
              </Link>
            </div>
          </div>
          <div className="grid gap-px border border-border bg-border md:grid-cols-3">
            {designScanChannels.map((channel) => {
              const Icon = channel.icon;
              return (
                <article key={channel.title} className="bg-card p-8">
                  <Icon className="mb-8 h-7 w-7 text-primary" />
                  <h3 className="font-display text-3xl uppercase leading-none text-white">{channel.title}</h3>
                  <p className="mt-5 text-sm leading-relaxed text-zinc-400">{channel.body}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-background py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-12 max-w-4xl">
            <p className="font-display text-sm uppercase tracking-[0.24em] text-primary">What it previews</p>
            <h2 className="mt-4 font-display text-5xl uppercase leading-none text-white md:text-7xl">
              AI for better contractor judgment, fed by real customer scans.
            </h2>
          </div>
          <div className="grid gap-px border border-border bg-border md:grid-cols-3">
            {teaserCards.map((card) => {
              const Icon = card.icon;
              return (
                <article key={card.title} className="bg-card p-8">
                  <Icon className="mb-8 h-7 w-7 text-primary" />
                  <h3 className="font-display text-3xl uppercase leading-none text-white">{card.title}</h3>
                  <p className="mt-5 text-sm leading-relaxed text-zinc-400">{card.body}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-[#0b0b0b] py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-10 max-w-4xl">
            <p className="font-display text-sm uppercase tracking-[0.24em] text-primary">Business model</p>
            <h2 className="mt-4 font-display text-5xl uppercase leading-none text-white md:text-7xl">
              Public value creates income. Private intelligence protects the business.
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-zinc-300">
              The goal is not to give everyone the full system. The goal is to turn owner uncertainty into paid review, design, drone, and GC planning opportunities while the operating intelligence remains a company asset.
            </p>
          </div>
          <div className="grid gap-px border border-border bg-border md:grid-cols-3">
            {revenueLayers.map((layer) => {
              const Icon = layer.icon;
              return (
                <article key={layer.title} className="bg-card p-8">
                  <Icon className="mb-8 h-7 w-7 text-primary" />
                  <h3 className="font-display text-3xl uppercase leading-none text-white">{layer.title}</h3>
                  <p className="mt-5 text-sm leading-relaxed text-zinc-400">{layer.body}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-[#111111] py-20 md:py-28">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div>
            <div className="mb-7 inline-flex items-center gap-3 border border-primary/40 bg-black px-4 py-2 text-primary">
              <LockKeyhole className="h-4 w-4" />
              <span className="font-display text-sm uppercase tracking-[0.2em]">Public boundary</span>
            </div>
            <h2 className="font-display text-5xl uppercase leading-none text-white md:text-7xl">The tools stay private.</h2>
            <p className="mt-7 text-lg leading-relaxed text-zinc-300">
              JWORDENAI supports the business behind the scenes. The public site can collect clean pavement signals through Driveway + Lot AI Scan, educate buyers, build trust, and show the direction of the company without exposing the private command center.
            </p>
          </div>
          <div className="space-y-4">
            {boundaries.map((item) => (
              <div key={item} className="border-l border-primary bg-background p-5 font-display text-2xl uppercase text-white">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-primary py-16 text-black">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div>
            <p className="font-display text-sm uppercase tracking-[0.22em]">Need pavement help now?</p>
            <h2 className="mt-2 font-display text-4xl uppercase leading-none md:text-6xl">Scan the pavement or talk to the paving company.</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/driveway-ai" className="inline-flex min-h-[52px] items-center gap-3 bg-black px-7 py-4 font-display text-lg uppercase tracking-[0.12em] text-white">
              <ScanLine className="h-5 w-5" />
              Start AI Scan
            </Link>
            <a href="tel:+18044461296" onClick={() => trackPhoneClick('jwordenai_teaser')} className="inline-flex min-h-[52px] items-center gap-3 border border-black/30 px-7 py-4 font-display text-lg uppercase tracking-[0.12em] text-black">
              <Phone className="h-5 w-5" />
              Call 804.446.1296
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

import React from 'react';
import { BrainCircuit, ClipboardCheck, Eye, LockKeyhole, Map, Phone } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SEO from '@/components/SEO';
import SchemaMarkup from '../components/SchemaMarkup';
import { trackPhoneClick } from '@/lib/analytics';

const teaserCards = [
  {
    title: 'Pavement Intelligence',
    body: 'Field observations, photos, scopes, and maintenance history organized into clearer decisions for asphalt owners and managers.',
    icon: Eye,
  },
  {
    title: 'Proposal Support',
    body: 'Internal tooling for turning real site conditions into better explanations, cleaner scopes, and faster follow-up.',
    icon: ClipboardCheck,
  },
  {
    title: 'Market Awareness',
    body: 'Regional service-area intelligence, project patterns, and buyer education shaped around Virginia paving work.',
    icon: Map,
  },
];

const boundaries = [
  'No public estimating engine on this page',
  'No customer documents or job data exposed',
  'No back-office command center access',
  'Only a preview of where the company is going',
];

export default function JwordenAI() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'JWORDENAI',
    description: 'A teaser for the internal construction intelligence system behind J. Worden & Sons Asphalt Paving.',
    url: 'https://www.jwordenasphaltpaving.com/jwordenai',
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO
        title="JWORDENAI | Construction Intelligence Teaser"
        description="A public preview of the private construction intelligence system supporting J. Worden & Sons Asphalt Paving."
        canonicalPath="/jwordenai"
        jsonLd={schema}
      />
      <SchemaMarkup
        title="JWORDENAI | Construction Intelligence Teaser"
        description="A public preview of the private construction intelligence system supporting J. Worden & Sons Asphalt Paving."
        canonical="/jwordenai"
        breadcrumb={[{ name: 'Home', path: '/' }, { name: 'JWORDENAI', path: '/jwordenai' }]}
      />
      <Navbar />

      <section className="relative overflow-hidden bg-black pt-36">
        <div className="absolute inset-0 opacity-40">
          <div className="h-full w-full bg-[linear-gradient(135deg,#050505_0%,#171717_52%,#32280f_100%)]" />
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
              The public page is only a window. The real system stays behind the company, helping organize field knowledge, customer education, project documents, and operational decisions.
            </p>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-background py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-12 max-w-4xl">
            <p className="font-display text-sm uppercase tracking-[0.24em] text-primary">What it previews</p>
            <h2 className="mt-4 font-display text-5xl uppercase leading-none text-white md:text-7xl">
              AI for better contractor judgment, not public gimmicks.
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

      <section className="bg-[#111111] py-20 md:py-28">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div>
            <div className="mb-7 inline-flex items-center gap-3 border border-primary/40 bg-black px-4 py-2 text-primary">
              <LockKeyhole className="h-4 w-4" />
              <span className="font-display text-sm uppercase tracking-[0.2em]">Public boundary</span>
            </div>
            <h2 className="font-display text-5xl uppercase leading-none text-white md:text-7xl">The tools stay private.</h2>
            <p className="mt-7 text-lg leading-relaxed text-zinc-300">
              JWORDENAI supports the business behind the scenes. The public site should educate buyers, build trust, and show the direction of the company without exposing operational logic.
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
            <h2 className="mt-2 font-display text-4xl uppercase leading-none md:text-6xl">Talk to the paving company, not the teaser.</h2>
          </div>
          <a href="tel:+18044461296" onClick={() => trackPhoneClick('jwordenai_teaser')} className="inline-flex min-h-[52px] items-center gap-3 bg-black px-7 py-4 font-display text-lg uppercase tracking-[0.12em] text-white">
            <Phone className="h-5 w-5" />
            Call 804.446.1296
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}

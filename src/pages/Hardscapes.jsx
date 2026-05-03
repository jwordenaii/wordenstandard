import React from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Phone, Construction, Layers, Droplets, HardHat, Building2, LandPlot } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import SEO from '@/components/SEO'
import { trackPhoneClick } from '@/lib/analytics'

const HARDSCAPE_TYPES = [
  {
    title: 'Cobblestone & Belgian Block',
    description: 'Precision-set natural stone edging and full driveways. The gold standard for durability and classic Virginia luxury.',
    icon: <LandPlot className="w-5 h-5" />
  },
  {
    title: 'Brick Paver Driveways',
    description: 'Interlocking concrete or clay brick. High-load permeable designs or traditional sand-set methods for historic looks.',
    icon: <Layers className="w-5 h-5" />
  },
  {
    title: 'Precision Poured Concrete',
    description: 'Standard 4000 PSI broom finish, exposed aggregate, or stamped patterns. We handle reinforced walkways and industrial pads.',
    icon: <Construction className="w-5 h-5" />
  }
]

export default function Hardscapes() {
  const title = 'Virginia Hardscapes & Concrete | Pavers, Brick & Cobblestone | J. Worden & Sons'
  const description = 'Premium hardscape construction across Virginia. Decorative concrete, hand-laid brick pavers, and authentic Belgian block cobblestone. Built for a lifetime.'

  return (
    <div className="min-h-screen bg-background">
      <SEO title={title} description={description} canonicalPath="/hardscapes" />
      <Navbar />

      <section className="relative pt-32 pb-20 bg-brand-navy text-white overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/20 blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <p className="font-display text-primary text-xs tracking-widest uppercase mb-4">Luxury Residential & Commercial Division</p>
          <h1 className="font-display font-black text-5xl md:text-8xl uppercase tracking-tighter leading-[0.9] mb-8">
            The Art Of <br /> <span className="text-primary italic">Hardscapes.</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-400 max-w-3xl leading-relaxed mb-10">
            From historic Richmond brickwork to modern decorative concrete. We design and install high-performance 
            surfaces that command attention and resist the elements.
          </p>
          <div className="flex gap-4">
            <a 
              href="tel:+18044461296" 
              onClick={() => trackPhoneClick('hardscapes_hero')}
              className="premium-cta px-10 py-5 font-display font-bold text-sm tracking-widest uppercase text-primary-foreground"
            >
              Request Design Consultation
            </a>
          </div>
        </div>
      </section>

      <section className="py-24 bg-card">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-12">
            {HARDSCAPE_TYPES.map((type, idx) => (
              <div key={idx} className="premium-panel p-10 rounded-2xl bg-black/5 hover:border-primary transition-all">
                <div className="text-primary mb-6">{type.icon}</div>
                <h3 className="font-display font-black text-2xl uppercase mb-4">{type.title}</h3>
                <p className="text-muted-foreground text-lg leading-relaxed">{type.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-6 text-center">
            <h2 className="font-display font-black text-4xl md:text-6xl uppercase tracking-tight mb-8">Engineered For Performance</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-16">
                Unlike landscaping crews, we build with a paving-first mindset. Every hardscape includes a fully compacted 
                road-base and integrated drainage systems to prevent shifting and settling.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {[
                    { label: 'PSI Strength', value: '4000+' },
                    { label: 'Base Depth', value: '6-12"' },
                    { label: 'Hand Laid', value: '100%' },
                    { label: 'Warranty', value: 'Lifetime*' }
                ].map((stat, i) => (
                    <div key={i} className="p-6 border border-border rounded-xl">
                        <p className="text-primary font-display font-black text-3xl mb-1">{stat.value}</p>
                        <p className="text-xs uppercase tracking-widest text-muted-foreground">{stat.label}</p>
                    </div>
                ))}
            </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

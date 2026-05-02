import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Home, Building2, Factory } from 'lucide-react';
import { Link } from 'react-router-dom';

const RESIDENTIAL_IMG = 'https://media.base44.com/images/public/69c853446b8987b1630018ff/bcdbc0e7f_drivewatpavingphoto.jpg';
const COMMERCIAL_IMG = 'https://media.base44.com/images/public/69c853446b8987b1630018ff/9bc7682e8_kfc_richmond_va_1st_on_sealed.jpg';
const INDUSTRIAL_IMG = 'https://media.base44.com/images/public/69c853446b8987b1630018ff/5eb378b00_IMG_0844.jpg';

const SERVICES = [
  {
    id: 'residential',
    icon: Home,
    label: '01',
    title: 'Residential',
    subtitle: 'Driveways · Walkways · Patios',
    description: 'Premium fine-grain asphalt paving for driveways, walkways, and residential surfaces in Richmond, VA, Tuckahoe, and surrounding areas. At J. Worden & Sons Paving LLC, we install high-density asphalt designed for a smoother finish, stronger compaction, and long-term durability. Our process ensures proper grading, water drainage, and a clean, uniform appearance that boosts curb appeal while preventing premature cracking and wear. Whether you\'re replacing an old driveway or installing new asphalt, our residential paving delivers a long-lasting surface built to handle Virginia\'s climate and daily use.',
    image: RESIDENTIAL_IMG,
    alt: 'Freshly paved residential driveway with fine-grain asphalt and clean edges against green lawn at golden hour',
    features: ['Hot-Mix Asphalt', 'Sealcoating', 'Crack Repair', 'Resurfacing'],
    ctaLabel: 'Request Residential Estimate',
    ctaHref: '/#quote',
  },
  {
    id: 'commercial',
    icon: Building2,
    label: '02',
    title: 'Commercial',
    subtitle: 'Parking · Roads · Lots',
    description: 'Commercial paving built to take a beating and still look sharp. At J. Worden & Sons Paving LLC, we install parking lots and access roads using heavy-duty asphalt systems designed for high traffic, delivery trucks, and daily wear. We focus on solid base work, proper drainage, and tight compaction so your surface lasts longer, performs better, and avoids costly repairs. If you need a parking lot done right the first time, this is the level of paving you want.',
    image: COMMERCIAL_IMG,
    alt: 'Aerial view of a completed commercial parking lot with fresh black asphalt and bright yellow line markings',
    features: ['Parking Lots', 'Line Striping', 'ADA Compliance', 'Drainage Systems'],
    ctaLabel: 'Commercial Details',
    ctaHref: '/commercial/richmond-va',
  },
  {
    id: 'industrial',
    icon: Factory,
    label: '03',
    title: 'Industrial',
    subtitle: 'Logistics · Warehouses · National Brands',
    description: 'Maximum-strength asphalt paving for logistics hubs, warehouses, and industrial facilities in Richmond, VA and surrounding areas. At J. Worden & Sons Paving LLC, we bring over 40 years of experience delivering high-performance asphalt systems built to handle constant semi-truck traffic, heavy equipment, and extreme load demands. Our portfolio includes large-scale commercial projects across multiple states, including over 350 parking lots completed for national brands like KFC. Every project is built with reinforced base preparation, precision grading for proper drainage, and high-compaction installation—ensuring a long-lasting, low-maintenance surface that performs under the toughest conditions.',
    image: INDUSTRIAL_IMG,
    alt: 'Heavy industrial asphalt paving at a logistics hub with yellow machinery rollers compacting thick asphalt at dawn',
    features: ['Heavy-Load Bases', 'Truck Yards', 'Loading Docks', 'Airport Taxiways'],
    ctaLabel: 'Industrial Consultation',
    ctaHref: '/commercial/richmond-va',
  },
];

export default function ServicePanels() {
  const [activePanel, setActivePanel] = useState(null);

  const scrollToQuote = () => {
    const el = document.querySelector('#quote');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="services" className="border-t border-border relative overflow-hidden">
      <div className="absolute -top-20 right-0 w-72 h-72 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -left-16 w-56 h-56 rounded-full bg-sky-400/10 blur-3xl pointer-events-none" />

      {/* Section header */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 md:py-24">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <p className="font-display text-primary text-sm tracking-[0.3em] uppercase mb-3">What We Do</p>
            <h2 className="font-display font-black text-foreground text-4xl md:text-6xl uppercase tracking-tight">
              Service Matrix
            </h2>
          </div>
          <p className="font-body text-muted-foreground text-lg max-w-md leading-relaxed">
            Three sectors. One standard of excellence. Every surface engineered for its specific demands.
          </p>
        </div>
      </div>

      {/* Panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 border-t border-border/70 relative z-10">
        {SERVICES.map((service) => (
          <div
            key={service.id}
            className="border-b md:border-b-0 md:border-r border-border/70 last:border-r-0 last:border-b-0 group relative overflow-hidden"
            onMouseEnter={() => setActivePanel(service.id)}
            onMouseLeave={() => setActivePanel(null)}
          >
            {/* Background image on hover */}
            <div
              className={`absolute inset-0 transition-opacity duration-700 ${
                activePanel === service.id ? 'opacity-30' : 'opacity-0'
              }`}
            >
              <img
                src={service.image}
                alt={service.alt}
                width="1200"
                height="900"
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover quality-premium"
              />
            </div>

            <div className="relative z-10 p-8 md:p-10 lg:p-14 min-h-[400px] md:min-h-[600px] flex flex-col justify-between premium-panel rounded-none">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="font-display text-primary text-sm tracking-[0.3em]">{service.label}</span>
                  <div className="w-12 h-12 border border-primary/30 bg-primary/5 flex items-center justify-center group-hover:bg-primary group-hover:border-primary transition-all duration-500">
                    <service.icon className="w-5 h-5 text-primary group-hover:text-primary-foreground transition-colors duration-500" />
                  </div>
                </div>
                <h3 className="font-display font-black text-foreground text-3xl md:text-4xl lg:text-5xl uppercase tracking-tight">
                  {service.title}
                </h3>
                <p className="font-display text-muted-foreground text-sm tracking-wider uppercase mt-2">
                  {service.subtitle}
                </p>
                <p className="font-body text-muted-foreground text-base leading-relaxed mt-6">
                  {service.description}
                </p>
              </div>

              <div className="mt-8">
                <div className="flex flex-wrap gap-2 mb-8">
                  {service.features.map((f) => (
                    <span
                      key={f}
                      className="px-3 py-1.5 border border-border text-muted-foreground font-display text-xs tracking-wider uppercase group-hover:border-primary/30 group-hover:text-foreground transition-colors duration-500"
                    >
                      {f}
                    </span>
                  ))}
                </div>
                <div className="flex flex-wrap gap-4 items-center">
                  <Link
                    to={service.ctaHref}
                    className="flex items-center gap-2 text-primary font-display font-bold text-sm tracking-wider uppercase hover:text-primary/80 transition-colors min-h-[48px]"
                  >
                    {service.ctaLabel} <ArrowRight className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={scrollToQuote}
                    className="flex items-center gap-2 text-muted-foreground font-display font-bold text-sm tracking-wider uppercase group-hover:gap-4 transition-all duration-300 min-h-[48px]"
                  >
                    Get Quote <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
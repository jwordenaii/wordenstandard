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
    <section id="services" className="border-t border-white/5 relative bg-[#030303] overflow-hidden">
      {/* Structural Accents */}
      <div className="absolute top-0 right-0 w-[500px] h-px bg-gradient-to-l from-primary/30 to-transparent" />
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-primary/5 blur-[150px] rounded-full pointer-events-none" />

      {/* Section header */}
      <div className="max-w-[1400px] mx-auto px-8 lg:px-12 py-32 md:py-48">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-12">
          <div className="max-w-3xl">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex items-center gap-4 mb-6">
              <div className="h-px w-12 bg-primary/40" />
              <p className="font-display text-primary text-xs tracking-[0.4em] uppercase">Service Architecture</p>
            </motion.div>
            <h2 className="editorial-header">
              The <span className="text-gold-gradient">Service</span> Matrix
            </h2>
          </div>
          <p className="font-body text-foreground/50 text-xl max-w-lg leading-relaxed italic border-l border-white/10 pl-8">
            Engineered for performance. Optimized for endurance. From single-family driveways to high-traffic industrial logistics hubs.
          </p>
        </div>
      </div>

      {/* Panels - Industrial Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 border-y border-white/10 relative z-10 bg-[#050505]">
        {SERVICES.map((service) => (
          <div
            key={service.id}
            className="group relative h-[700px] md:h-[850px] border-b md:border-b-0 md:border-r border-white/10 last:border-r-0 overflow-hidden cursor-pointer"
            onMouseEnter={() => setActivePanel(service.id)}
            onMouseLeave={() => setActivePanel(null)}
          >
            {/* Direct Background Image - Always there but silent until hover */}
            <div className="absolute inset-0 z-0">
              <img
                src={service.image}
                alt={service.alt}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover transition-all duration-[2000ms] ease-out scale-110 opacity-20 grayscale brightness-50 group-hover:scale-100 group-hover:opacity-40 group-hover:grayscale-0 group-hover:brightness-100"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#030303] via-[#030303]/80 to-transparent" />
            </div>

            <div className="relative z-10 h-full p-10 lg:p-16 flex flex-col justify-between transition-all duration-700 bg-transparent group-hover:bg-primary/5">
              <div>
                <div className="flex items-center justify-between mb-12">
                  <span className="font-display text-primary/40 text-[10px] tracking-[0.5em] group-hover:text-primary transition-colors">{service.label}</span>
                  <div className="w-14 h-14 border border-white/10 bg-white/5 flex items-center justify-center rounded-xl group-hover:border-primary group-hover:bg-primary/20 transition-all duration-700 group-hover:rotate-[360deg]">
                    <service.icon className="w-6 h-6 text-white group-hover:text-primary transition-colors duration-700" />
                  </div>
                </div>
                
                <h3 className="font-display font-black text-white text-5xl lg:text-6xl uppercase tracking-tighter mb-4 italic transition-transform duration-700 group-hover:-translate-y-2">
                  {service.title}
                </h3>
                <p className="font-display text-primary text-xs tracking-[0.2em] uppercase mb-8 opacity-0 group-hover:opacity-100 transition-opacity duration-700 delay-100">
                  {service.subtitle}
                </p>
                
                <div className="h-px w-full bg-white/5 mb-8 group-hover:bg-primary/30 transition-colors" />
                
                <p className="font-body text-foreground/40 text-base leading-relaxed line-clamp-4 group-hover:line-clamp-none group-hover:text-foreground/70 transition-all duration-700">
                  {service.description}
                </p>
              </div>

              <div className="mt-8">
                <div className="flex flex-wrap gap-2 mb-12 opacity-40 group-hover:opacity-100 transition-opacity duration-700">
                  {service.features.map((f) => (
                    <span
                      key={f}
                      className="px-4 py-2 bg-white/5 border border-white/5 text-white/50 font-display text-[9px] tracking-widest uppercase transition-all duration-500 group-hover:border-primary/20 group-hover:text-white"
                    >
                      {f}
                    </span>
                  ))}
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    to={service.ctaHref}
                    className="flex-1 flex items-center justify-center gap-3 bg-white/5 border border-white/10 text-white px-6 py-4 rounded-xl font-display font-bold text-[10px] tracking-[0.2em] uppercase hover:bg-white/10 transition-all"
                  >
                    View Specs
                  </Link>
                  <button
                    onClick={scrollToQuote}
                    className="flex-1 glass-surface-premium flex items-center justify-center gap-3 text-primary px-6 py-4 rounded-xl font-display font-bold text-[10px] tracking-[0.2em] uppercase hover:bg-primary hover:text-primary-foreground transition-all duration-500"
                  >
                    Get Estimate
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
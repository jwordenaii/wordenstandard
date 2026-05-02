import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Phone, ShieldCheck, Star } from 'lucide-react';
import { trackPhoneClick } from '@/lib/analytics';

const CAPABILITIES = [
  'Heavy-duty parking lot paving built for high traffic',
  'Full-depth asphalt replacement and resurfacing',
  'ADA-compliant upgrades and line striping',
  'Drainage correction and base repair',
  'Minimal downtime for active businesses',
];

const COMMERCIAL_SERVICES = [
  'Parking Lot Paving',
  'Roadway and Access Lanes',
  'Emergency Asphalt Repairs',
  'Sealcoating and Crack Sealing',
  'Basketball and Tennis Courts',
  'Walking and Cart Paths',
  'Speed Bumps and Traffic Control Features',
  'ADA Compliance and Marking Upgrades',
];

export default function CommercialCapabilities() {
  return (
    <section className="relative border-t border-white/5 py-32 md:py-48 bg-[#030303] overflow-hidden">
      {/* Competitor-Grade Industrial Accents */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="absolute top-1/2 left-0 w-64 h-64 bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="max-w-[1400px] mx-auto px-8 lg:px-12 relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12 mb-20">
          <div className="max-w-4xl">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex items-center gap-4 mb-6">
              <div className="h-px w-12 bg-primary/40" />
              <p className="font-display text-primary text-xs tracking-[0.4em] uppercase">
                Enterprise Infrastructure
              </p>
            </motion.div>
            <h2 className="editorial-header mb-8">
              Commercial <span className="text-gold-gradient">Mastery</span>
            </h2>
            <p className="font-body text-foreground/50 text-xl max-w-2xl leading-relaxed italic border-l border-white/10 pl-8">
              "National standards applied with local precision. We manage the logistics, prep, and execution so your business never misses a beat."
            </p>
          </div>
          
          <div className="hidden lg:block">
            <div className="glass-surface-premium px-8 py-6 rounded-3xl border border-white/10 uppercase font-display tracking-widest text-[10px] text-foreground/40 text-right">
              <span className="block text-primary text-lg tracking-normal mb-1">PG 64-22 Grade</span>
              Virginia DOT Approved Mixes
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-20">
          <div className="lg:col-span-4 space-y-4">
            {CAPABILITIES.map((item, i) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group flex items-center gap-4 p-6 rounded-[1.5rem] bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-primary/20 transition-all duration-500"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary group-hover:scale-110 transition-all duration-500">
                  <Check className="w-5 h-5 text-primary group-hover:text-primary-foreground transition-colors" />
                </div>
                <p className="font-body text-foreground/70 text-sm leading-tight">
                  {item}
                </p>
              </motion.div>
            ))}
          </div>

          <div className="lg:col-span-8">
            <div className="glass-surface-premium rounded-[2.5rem] p-10 md:p-14 relative overflow-hidden h-full">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[80px] rounded-full" />
              
              <div className="relative z-10">
                <p className="font-display text-primary text-xs tracking-[0.3em] uppercase mb-4">Service Profile</p>
                <h3 className="font-display font-black text-white text-4xl md:text-5xl uppercase tracking-tighter mb-8 italic">
                  Integrated Pavement <br />
                  <span className="text-gold-gradient">Asset Management</span>
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                  {COMMERCIAL_SERVICES.map((service) => (
                    <div key={service} className="flex items-center gap-4 group cursor-default">
                      <div className="h-[1px] w-6 bg-primary/30 group-hover:w-10 group-hover:bg-primary transition-all duration-500" />
                      <span className="font-body text-foreground/60 group-hover:text-white transition-colors text-sm uppercase tracking-widest">{service}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-16 flex flex-col sm:flex-row gap-6">
                  <Link
                    to="/commercial/richmond-va"
                    className="flex-1 flex items-center justify-center gap-3 bg-white/5 border border-white/10 text-foreground px-8 py-5 rounded-2xl font-display font-bold text-xs tracking-[0.2em] uppercase hover:bg-white/10 transition-all"
                  >
                    Site Analysis
                  </Link>
                  <a
                    href="tel:+18044461296"
                    onClick={() => trackPhoneClick('commercial_capabilities')}
                    className="flex-1 premium-cta flex items-center justify-center gap-3 text-primary-foreground px-10 py-5 rounded-2xl font-display font-bold text-xs tracking-[0.2em] uppercase"
                  >
                    <Phone className="w-4 h-4" />
                    Direct Consultation
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-12 py-12 border-y border-white/5">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-primary" />
            <span className="font-display text-[10px] tracking-[0.3em] uppercase text-foreground/40 italic">Virginia VDOT Certified Mixes</span>
          </div>
          <div className="flex items-center gap-3">
            <Star className="w-6 h-6 text-primary" />
            <span className="font-display text-[10px] tracking-[0.3em] uppercase text-foreground/40 italic">OSHA 30 Safety Protocols</span>
          </div>
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-primary" />
            <span className="font-display text-[10px] tracking-[0.3em] uppercase text-foreground/40 italic">$5M Bonding Capacity</span>
          </div>
        </div>
      </div>
    </section>
  );
}
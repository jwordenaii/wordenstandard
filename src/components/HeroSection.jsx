import React from 'react';
import { motion } from 'framer-motion';
import { ArrowDown, Phone } from 'lucide-react';
import { trackEvent, trackPhoneClick } from '@/lib/analytics';
import SmartImage from './SmartImage';

const HERO_IMAGE = 'https://media.base44.com/images/public/69c853446b8987b1630018ff/1c52a6398_generated_image.png';

export default function HeroSection() {
  const scrollToQuote = () => {
    trackEvent('hero_cta_click', { cta: 'free_estimate' });
    const el = document.querySelector('#quote');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToServices = () => {
    trackEvent('hero_cta_click', { cta: 'explore_services' });
    const el = document.querySelector('#services');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-screen flex flex-col justify-end overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0 overflow-hidden">
        <SmartImage
          src={HERO_IMAGE}
          alt="Heavy asphalt paving machine laying fresh hot-mix asphalt at golden hour with steam rising from the surface"
          width={2560}
          height={1440}
          priority
          sizes="100vw"
          className="w-full h-full object-cover object-top quality-premium"
        />
        
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/30 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 pb-12 pt-32 w-full">
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}>
          
          <p className="font-display text-primary text-sm md:text-base tracking-[0.3em] uppercase mb-4 md:mb-6">
            40 Years in Virginia · Family-Owned · Licensed & Insured
          </p>

          <h1 className="font-display font-black text-foreground uppercase leading-[0.85] tracking-tight">
            <span className="block text-[12vw] md:text-[8vw] lg:text-[6vw]">Asphalt</span>
            <span className="block text-[12vw] md:text-[8vw] lg:text-[6vw]">Built To</span>
            <span className="block text-[12vw] md:text-[8vw] lg:text-[6vw] text-primary">
              Last Decades
            </span>
          </h1>

          <p className="font-body text-foreground/90 mt-6 text-lg md:text-xl max-w-xl leading-relaxed md:mt-8">
            Driveways, parking lots, and commercial surfaces engineered to outlast the cheap bid down the street. Free on-site estimate in 24 hours — no pressure, no sales pitch.
          </p>
        </motion.div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="mt-10 md:mt-14 flex flex-col sm:flex-row items-start sm:items-end gap-6 sm:gap-0 sm:justify-between border-t border-border pt-8">
          
          <div className="flex flex-wrap gap-8 md:gap-14">
            <div>
              <p className="font-display font-black text-primary text-4xl md:text-5xl">40+</p>
              <p className="font-body text-muted-foreground text-sm mt-1 tracking-wider uppercase">Years in Business</p>
            </div>
            <div>
              <p className="font-display font-black text-foreground text-4xl md:text-5xl">2.4M</p>
              <p className="font-body text-muted-foreground text-sm mt-1 tracking-wider uppercase">Sq Ft Paved</p>
            </div>
            <div>
              <p className="font-display font-black text-foreground text-4xl md:text-5xl">1,200+</p>
              <p className="font-body text-muted-foreground text-sm mt-1 tracking-wider uppercase">Projects Complete</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 items-center">
            <button
              onClick={scrollToQuote}
              className="bg-primary text-primary-foreground px-8 py-4 font-display font-bold text-sm tracking-wider uppercase hover:bg-primary/90 transition-colors min-h-[48px]">
              
              Get My Free Estimate
            </button>
            <a
              href="tel:+18044461296"
              onClick={() => {
                trackEvent('hero_cta_click', { cta: 'call_now' });
                trackPhoneClick('hero');
              }}
              className="border border-primary text-primary px-6 py-4 font-display font-bold text-sm tracking-wider uppercase hover:bg-primary/10 transition-colors min-h-[48px] inline-flex items-center gap-2"
              aria-label="Call (804) 446-1296"
            >
              <Phone className="w-4 h-4" />
              Call (804) 446-1296
            </a>
            <button
              onClick={scrollToServices}
              className="border border-border text-foreground px-4 py-4 hover:border-primary hover:text-primary transition-colors min-h-[48px]"
              aria-label="Scroll to services">
              
              <ArrowDown className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      </div>
    </section>);

}
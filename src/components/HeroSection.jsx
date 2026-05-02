import React from 'react';
import { motion } from 'framer-motion';
import { ArrowDown, Phone } from 'lucide-react';
import { trackEvent, trackPhoneClick } from '@/lib/analytics';
import SmartImage from './SmartImage';
import { PRIMARY_LOGO_URL, FALLBACK_LOGO_URL } from '@/lib/branding';

const HERO_IMAGE = 'https://media.base44.com/images/public/69c853446b8987b1630018ff/fd6e29837_20171212_192947499_iOS.jpg';

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

  const scrollToFaq = () => {
    trackEvent('hero_cta_click', { cta: 'diagnose_first' });
    const el = document.querySelector('#faq');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-screen flex flex-col justify-end overflow-hidden bg-[#030303]">
      {/* Background image with cinematic treatment */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <SmartImage
            src={HERO_IMAGE}
            alt="Heavy asphalt paving machine laying fresh hot-mix asphalt"
            width={2560}
            height={1440}
            priority
            sizes="100vw"
            className="w-full h-full object-cover object-center quality-premium scale-110 animate-[subtle-zoom_20s_infinite_alternate]"
          />
        </div>
        
        {/* Advanced Light Leak & Vignetting */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#030303] via-transparent to-black/40 z-[1]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(253,185,49,0.08)_0%,transparent_50%)] z-[1]" />
        
        {/* Animated Bokeh/Dust elements */}
        <div className="absolute inset-0 pointer-events-none z-[2]">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 blur-[120px] rounded-full animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-primary/5 blur-[160px] rounded-full animate-pulse [animation-delay:2s]" />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-[1400px] mx-auto px-8 lg:px-12 pb-24 pt-48 w-full">
        <motion.div
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}>

          <div className="inline-flex items-center gap-6 rounded-full border border-white/5 bg-black/60 backdrop-blur-3xl px-8 py-3 mb-12 overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
            <SmartImage
              src={PRIMARY_LOGO_URL}
              fallbackSrc={FALLBACK_LOGO_URL}
              alt="J. Worden & Sons Asphalt Paving logo"
              width={380}
              height={120}
              priority
              sizes="200px"
              className="h-10 md:h-12 w-auto object-contain relative z-10 filter brightness-125 contrast-110 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]"
            />
            <span className="h-6 w-px bg-white/10" aria-hidden="true" />
            <span className="font-display text-[11px] md:text-xs tracking-[0.4em] uppercase text-foreground/50 relative z-10">
              Virginia Paving Intelligence
            </span>
          </div>
          
          <div className="space-y-4 mb-20">
            <motion.h1 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="font-display font-black text-foreground uppercase leading-[0.8] tracking-[-0.04em]">
              <span className="block text-[15vw] md:text-[12vw] lg:text-[10vw] luxury-text-shadow">Crafting</span>
              <span className="block text-[15vw] md:text-[12vw] lg:text-[10vw] text-gold-gradient drop-shadow-2xl py-2">Enduring</span>
              <span className="block text-[15vw] md:text-[12vw] lg:text-[10vw] luxury-text-shadow">Ground</span>
            </motion.h1>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="max-w-2xl border-l-[3px] border-primary/60 pl-10 py-2">
              <p className="font-editorial italic text-2xl md:text-4xl text-foreground/90 leading-tight tracking-tight">
                "Your property is an asset, not a project. We provide the intelligence to protect it and the mastery to build it."
              </p>
              <div className="mt-8 flex items-center gap-3">
                <div className="h-px w-12 bg-primary/40" />
                <span className="font-display text-sm tracking-[0.3em] uppercase text-primary/80">J. Worden, Founder</span>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Console-style Action Dashboard */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="glass-surface-premium p-3 rounded-[3rem] max-w-5xl">
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <button
              onClick={scrollToQuote}
              className="md:col-span-5 group relative overflow-hidden bg-primary px-10 py-10 rounded-[2.5rem] transition-all duration-700 hover:shadow-[0_40px_80px_-15px_rgba(255,166,35,0.5)]">
              <div className="relative z-10 flex flex-col items-start text-left">
                <span className="font-display text-primary-foreground text-4xl tracking-tight leading-none mb-2">Request Proposal</span>
                <span className="font-body text-primary-foreground/60 text-xs uppercase tracking-[0.2em]">Immediate Dispatch Capability</span>
              </div>
              <div className="absolute bottom-8 right-10 group-hover:translate-x-3 transition-transform duration-700">
                <ArrowDown className="w-10 h-10 text-primary-foreground/40 transform -rotate-90" />
              </div>
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/20 blur-[80px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            </button>

            <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={scrollToFaq}
                className="group p-8 rounded-[2.5rem] border border-white/5 bg-white/5 hover:bg-white/10 transition-all duration-500 relative overflow-hidden">
                <div className="relative z-10 flex flex-col h-full justify-between">
                  <span className="font-display text-foreground text-2xl tracking-tight">Diagnostics</span>
                  <span className="font-body text-foreground/40 text-[10px] uppercase tracking-[0.2em] mt-4">AI Pavement Condition Analysis</span>
                </div>
                <div className="absolute -bottom-4 -right-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <ShieldCheck className="w-24 h-24" />
                </div>
              </button>

              <div className="p-8 rounded-[2.5rem] bg-black/40 border border-white/5 backdrop-blur-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] font-display tracking-[0.25em] uppercase text-green-500/80">Active Operations</span>
                  </div>
                  <p className="font-display text-primary text-4xl tracking-tighter">40 Years</p>
                </div>
                <p className="font-body text-foreground/30 text-[9px] uppercase tracking-[0.3em] leading-relaxed">
                  Continuous Virginia Service · Since 1984
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes subtle-zoom {
          from { transform: scale(1); }
          to { transform: scale(1.1); }
        }
      `}} />
    </section>
            </button>
          </div>
        </motion.div>
      </div>
    </section>);

}
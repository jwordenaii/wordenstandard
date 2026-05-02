import React, { useState, useEffect } from 'react';
import { Menu, X, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { trackPhoneClick } from '@/lib/analytics';
import SmartImage from './SmartImage';
import { PRIMARY_LOGO_URL, FALLBACK_LOGO_URL } from '@/lib/branding';

const NAV_LINKS = [
{ label: 'Services', href: '#services' },
{ label: 'Our Work', href: '#proof' },
{ label: 'About', href: '#about' },
{ label: 'Blog', href: '/blog', external: true },
{ label: 'Contact', href: '#quote' }];


export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showMiniLogo, setShowMiniLogo] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 60);
      setShowMiniLogo(y > 520);
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (href) => {
    setIsOpen(false);
    if (href.startsWith('/')) {
      window.location.href = href;
      return;
    }
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <nav
      className={`fixed top-8 left-1/2 -translate-x-1/2 z-50 transition-all duration-700 w-[95%] max-w-7xl px-8 py-4 rounded-full border border-white/10 ${
        scrolled
          ? 'bg-black/60 backdrop-blur-2xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)]'
          : 'bg-black/20 backdrop-blur-md'
      }`}
    >
      <div className="flex items-center justify-between h-12 md:h-14">
        {/* Logo — centered on mobile, left on desktop */}
        <button 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} 
          className="flex items-center min-w-0 transition-transform duration-500 hover:scale-105" 
          aria-label="J. Worden & Sons Paving"
        >
          <SmartImage
            src={PRIMARY_LOGO_URL}
            fallbackSrc={FALLBACK_LOGO_URL}
            alt="J. Worden & Sons Paving"
            width={380}
            height={120}
            priority
            sizes="200px"
            className="h-10 md:h-12 w-auto object-contain brightness-110 contrast-125"
          />
        </button>

        {/* Desktop nav — absolute centered */}
        <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-10">
          {NAV_LINKS.map((link) =>
            <button
              key={link.label}
              onClick={() => scrollTo(link.href)}
              className="font-display text-[11px] tracking-[0.25em] uppercase text-foreground/50 hover:text-primary transition-all duration-300 relative group">
              {link.label}
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-primary transition-all duration-500 group-hover:w-full" />
            </button>
          )}
        </div>

        {/* Right side CTAs */}
        <div className="flex items-center gap-4">
          <a
            href="tel:+18044461296"
            onClick={() => trackPhoneClick('navbar_desktop')}
            className="hidden lg:flex items-center gap-2 text-foreground/70 font-display font-medium text-[11px] tracking-[0.14em] uppercase hover:text-primary transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
              <Phone className="w-3 h-3 text-primary" />
            </div>
            804-446-1296
          </a>
          
          <button
            onClick={() => scrollTo('#quote')}
            className="hidden md:block glass-surface-premium text-primary px-6 py-2.5 rounded-full font-display font-bold text-[11px] tracking-[0.2em] uppercase transition-all hover:scale-105 active:scale-95 border border-primary/30">
            Get Proposal
          </button>

          {/* Mobile toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-foreground p-2 rounded-full hover:bg-white/5 transition-colors"
            aria-label="Toggle menu">
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu - full screen glass overlay style */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="absolute top-[calc(100%+1rem)] left-0 right-0 p-8 bg-black/80 backdrop-blur-3xl rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden"
          >
            <div className="flex flex-col gap-8">
              {NAV_LINKS.map((link, idx) => (
                <motion.button
                  key={link.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  onClick={() => scrollTo(link.href)}
                  className="text-left font-editorial text-3xl italic text-foreground/80 hover:text-primary transition-colors italic"
                >
                  {link.label}
                </motion.button>
              ))}
              <div className="h-px bg-white/10 w-full my-2" />
              <button
                onClick={() => scrollTo('#quote')}
                className="w-full bg-primary text-primary-foreground p-6 rounded-3xl font-display font-bold text-sm tracking-[0.3em] uppercase"
              >
                Request Proposal
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>

      <AnimatePresence>
        {showMiniLogo && !isOpen &&
        <motion.button
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.92 }}
          transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-[70] rounded-xl border border-primary/30 bg-black/88 shadow-[0_14px_36px_rgba(0,0,0,0.55)] px-3 py-2 backdrop-blur-lg"
          aria-label="Back to top">

            <SmartImage
              src={PRIMARY_LOGO_URL}
              fallbackSrc={FALLBACK_LOGO_URL}
              alt="J. Worden & Sons mini logo"
              width={220}
              height={70}
              sizes="96px"
              className="w-20 h-7 md:w-24 md:h-8 object-contain"
            />
          </motion.button>
        }
      </AnimatePresence>
    </nav>);

}
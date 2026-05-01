import React, { useState, useEffect } from 'react';
import { Menu, X, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { trackPhoneClick } from '@/lib/analytics';

const NAV_LINKS = [
{ label: 'Services', href: '#services' },
{ label: 'Our Work', href: '#proof' },
{ label: 'About', href: '#about' },
{ label: 'Blog', href: '/blog', external: true },
{ label: 'Contact', href: '#quote' }];


export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black border-b border-black">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-24 md:h-28">
          {/* Logo — top left corner */}
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center min-w-0" aria-label="J. Worden & Sons Paving — Home">
            <img
              src="https://media.base44.com/images/public/69c853446b8987b1630018ff/920c45a44_generated_image.png"
              alt="J. Worden & Sons Paving — Quality Work. Built To Last."
              style={{ width: 'auto', maxWidth: 'none' }}
              className="h-20 sm:h-24 md:h-28 object-contain"
            />
          </button>

          {/* Mobile phone CTA */}
          <a
            href="tel:+18044461296"
            onClick={() => trackPhoneClick('navbar_mobile')}
            className="md:hidden flex items-center gap-1.5 text-primary font-display font-bold text-xs tracking-wider ml-2 flex-shrink-0"
            aria-label="Call (804) 446-1296"
          >
            <Phone className="w-4 h-4" />
            <span className="hidden xs:inline">804-446-1296</span>
          </a>

          {/* Desktop phone CTA (click-to-call) */}
          <a
            href="tel:+18044461296"
            onClick={() => trackPhoneClick('navbar_desktop')}
            className="hidden md:flex items-center gap-2 text-primary font-display font-bold text-sm tracking-wider uppercase hover:text-primary/80 transition-colors ml-auto mr-6"
            aria-label="Call (804) 446-1296"
          >
            <Phone className="w-4 h-4" />
            (804) 446-1296
          </a>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) =>
            <button
              key={link.label}
              onClick={() => scrollTo(link.href)}
              className="font-display text-sm tracking-widest uppercase text-muted-foreground hover:text-primary transition-colors duration-300">
              
                {link.label}
              </button>
            )}
            <button
              onClick={() => scrollTo('#quote')}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-3 font-display font-bold text-sm tracking-wider uppercase hover:bg-primary/90 transition-colors min-h-[48px]">
              
              <Phone className="w-4 h-4" />
              Free Estimate
            </button>
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-foreground p-2 min-h-[48px] min-w-[48px] flex items-center justify-center"
            aria-label="Toggle menu">
            
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isOpen &&
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="md:hidden bg-background border-b border-border overflow-hidden">
          
            <div className="px-6 py-6 space-y-1">
              {NAV_LINKS.map((link) =>
            <button
              key={link.label}
              onClick={() => scrollTo(link.href)}
              className="block w-full text-left font-display text-lg tracking-widest uppercase text-muted-foreground hover:text-primary py-3 border-b border-border transition-colors min-h-[48px]">
              
                  {link.label}
                </button>
            )}
              <button
              onClick={() => scrollTo('#quote')}
              className="w-full mt-4 flex items-center justify-center gap-2 bg-primary text-primary-foreground px-5 py-4 font-display font-bold text-sm tracking-wider uppercase min-h-[48px]">
              
                <Phone className="w-4 h-4" />
                Free Estimate
              </button>
            </div>
          </motion.div>
        }
      </AnimatePresence>
    </nav>);

}
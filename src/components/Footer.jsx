import React from 'react';
import { Phone, Mail, MapPin } from 'lucide-react';
import { trackPhoneClick } from '@/lib/analytics';

export default function Footer() {
  const scrollTo = (href) => {
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer className="border-t border-border">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 md:gap-8">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-primary flex items-center justify-center">
                <span className="font-display font-black text-primary-foreground text-lg">JW</span>
              </div>
              <div>
                <p className="font-display font-bold text-foreground text-sm tracking-widest uppercase leading-none">
                  J. Worden & Sons
                </p>
                <p className="text-muted-foreground text-xs tracking-wider uppercase mt-0.5">
                  Asphalt Paving
                </p>
              </div>
            </div>
            <p className="font-body text-muted-foreground text-sm leading-relaxed">
              Family-owned and operated. 40+ years paving Virginia — from Hampton Roads to the Blue Ridge.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="font-display font-bold text-foreground text-xs tracking-[0.2em] uppercase mb-6">Navigation</h4>
            <div className="space-y-3">
              {[
                { label: 'Services', href: '#services' },
                { label: 'Our Work', href: '#proof' },
                { label: 'About', href: '#about' },
                { label: 'Get Estimate', href: '#quote' },
              ].map((link) => (
                <button
                  key={link.label}
                  onClick={() => scrollTo(link.href)}
                  className="block font-body text-muted-foreground text-sm hover:text-primary transition-colors"
                >
                  {link.label}
                </button>
              ))}
              <a
                href="/blog"
                className="block font-body text-muted-foreground text-sm hover:text-primary transition-colors"
              >
                Paving Blog
              </a>
              <a
                href="/locations"
                className="block font-body text-muted-foreground text-sm hover:text-primary transition-colors"
              >
                Service Areas
              </a>
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-display font-bold text-foreground text-xs tracking-[0.2em] uppercase mb-6">Services</h4>
            <div className="space-y-3">
              {['Residential Paving', 'Commercial Paving', 'Industrial Paving', 'Sealcoating', 'Crack Repair', 'Line Striping'].map((s) => (
                <p key={s} className="font-body text-muted-foreground text-sm">{s}</p>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display font-bold text-foreground text-xs tracking-[0.2em] uppercase mb-6">Contact</h4>
            <div className="space-y-4">
              <a
                href="tel:+18044461296"
                onClick={() => trackPhoneClick('footer')}
                className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors"
              >
                <Phone className="w-4 h-4 text-primary" />
                <span className="font-body text-sm">(804) 446-1296</span>
              </a>
              <a href="mailto:j.wordenandsonspaving@gmail.com" className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors">
                <Mail className="w-4 h-4 text-primary" />
                <span className="font-body text-sm">j.wordenandsonspaving@gmail.com</span>
              </a>
              <div className="flex items-start gap-3 text-muted-foreground">
                <MapPin className="w-4 h-4 text-primary mt-0.5" />
                <span className="font-body text-sm">
                  1601 Ware Bottom Springs Rd<br />
                  Suite 214<br />
                  Chester, VA 23836
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="font-body text-muted-foreground text-xs">
            © 2026 J. Worden & Sons Asphalt Paving. All rights reserved.
          </p>
          <p className="font-body text-muted-foreground text-xs">
            Licensed · Bonded · Insured · VA Contractor
          </p>
        </div>
      </div>
    </footer>
  );
}
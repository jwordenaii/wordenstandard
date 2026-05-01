import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

const CAPABILITIES = [
  'Heavy-duty parking lot paving built for high traffic',
  'Full-depth asphalt replacement and resurfacing',
  'ADA-compliant upgrades and line striping',
  'Drainage correction and base repair',
  'Minimal downtime for active businesses',
];

export default function CommercialCapabilities() {
  return (
    <section className="border-t border-border py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-primary font-display font-black text-lg">//</span>
          <p className="font-display text-primary text-xs tracking-[0.3em] uppercase">
            Commercial Capabilities
          </p>
        </div>
        <h2 className="font-display font-black text-foreground text-3xl md:text-5xl uppercase tracking-tight leading-[0.95] max-w-3xl mb-8">
          From Single-Location Projects<br />
          <span className="text-primary">To Multi-Site Contracts</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-4 mb-10 max-w-4xl">
          {CAPABILITIES.map((item, i) => (
            <motion.div
              key={item}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="flex items-start gap-3 border-t border-border pt-4"
            >
              <div className="w-6 h-6 bg-primary/10 border border-primary/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5 text-primary" />
              </div>
              <p className="font-body text-foreground text-base leading-relaxed">
                {item}
              </p>
            </motion.div>
          ))}
        </div>

        <p className="font-body text-muted-foreground text-base md:text-lg leading-relaxed max-w-3xl border-l-2 border-primary pl-5">
          When you hire <span className="text-foreground font-semibold">J. Worden & Sons Paving LLC</span>, you're choosing a contractor with real-world experience, proven results, and the capability to handle large-scale commercial paving projects the right way.
        </p>
      </div>
    </section>
  );
}
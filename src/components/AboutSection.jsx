import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Users, Award, Thermometer } from 'lucide-react';
import SmartImage from './SmartImage';

const TEXTURE_IMG = 'https://media.base44.com/images/public/69c853446b8987b1630018ff/fd6e29837_20171212_192947499_iOS.jpg';

const VALUES = [
{ icon: Shield, title: 'Built to Last', description: 'Every job engineered for decades of performance, not just aesthetics.' },
{ icon: Users, title: 'Family Owned', description: '40+ years of family ownership. Our reputation is our legacy.' },
{ icon: Award, title: 'Licensed & Insured', description: 'Fully bonded, insured, and licensed in the Commonwealth of Virginia.' },
{ icon: Thermometer, title: 'Precision Process', description: 'Temperature-controlled application ensures optimal compaction every time.' }];


export default function AboutSection() {
  return (
    <section id="about" className="border-t border-white/5 relative bg-[#030303] overflow-hidden">
      <div className="absolute top-10 -right-20 w-64 h-64 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
      
      <div className="max-w-[1400px] mx-auto px-8 lg:px-12 py-32 md:py-48">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          {/* Image side - Enhanced for Luxury Presentation */}
          <div className="relative group">
            <div className="absolute -inset-4 bg-primary/5 rounded-[3rem] blur-2xl group-hover:bg-primary/10 transition-colors duration-1000" />
            <SmartImage
              src={TEXTURE_IMG}
              alt="J. Worden & Sons crew completing a commercial asphalt paving project at dusk in Virginia."
              label="Legacy in Every Layer"
              sublabel="Since 1982"
              width={1600}
              height={1100}
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="lg:aspect-[4/5] h-full object-cover"
            />
          </div>

          {/* Content side */}
          <div className="flex flex-col justify-center">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}>
              
              <div className="flex items-center gap-4 mb-6">
                <div className="h-px w-12 bg-primary/40" />
                <p className="font-display text-primary text-xs tracking-[0.4em] uppercase">Historical Performance</p>
              </div>
              
              <h2 className="editorial-header mb-8">
                The J. Worden <br />
                <span className="text-gold-gradient">Standard</span>
              </h2>
              
              <p className="font-body text-foreground/50 text-xl leading-relaxed italic border-l border-white/10 pl-8 mb-12">
                "For over 40 years, J. Worden & Sons Paving LLC has delivered professional asphalt paving built to last—across all of Virginia."
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {VALUES.map((item, i) =>
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                  className="bg-white/[0.02] border border-white/5 p-8 rounded-[1.5rem] hover:bg-white/[0.05] hover:border-primary/20 transition-all duration-500">
                  
                  <item.icon className="w-6 h-6 text-primary mb-6" />
                  <h3 className="font-display font-black text-white text-lg tracking-wider uppercase mb-3">
                    {item.title}
                  </h3>
                  <p className="font-body text-foreground/40 text-sm leading-relaxed">
                    {item.description}
                  </p>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
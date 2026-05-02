import React from 'react';
import { motion } from 'framer-motion';
import { Bot, Calculator, Map, FileText, Zap, Users, Radar } from 'lucide-react';

const TECH_FEATURES = [
  {
    icon: Calculator,
    label: '01',
    title: 'Precision Quote Engine',
    description: 'Multi-step estimator that calculates tonnage, labor, and total cost live — factoring surface type, dimensions, material grade, and urgency.',
    tags: ['5-Step Flow', 'Live Cost Math', 'Material Specs'],
  },
  {
    icon: Bot,
    label: '02',
    title: 'AI Paving Consultant',
    description: 'Proactive AI agent that greets every lead by name, answers technical asphalt questions, handles objections, and guides prospects toward a signed contract — 24/7.',
    tags: ['WhatsApp Ready', 'Context-Aware', 'CRM-Linked'],
  },
  {
    icon: Map,
    label: '03',
    title: 'Live Operations Dashboard',
    description: 'Real-time interactive map of every active job site with status tracking, crew assignments, and instant geocoding — so dispatch always knows where the fleet is.',
    tags: ['Live Sync', 'Geo-Mapping', 'Crew Tracking'],
  },
  {
    icon: FileText,
    label: '04',
    title: 'One-Click Invoicing',
    description: 'Generate branded PDF invoices directly from completed jobs and email them to clients — no spreadsheets, no copy-paste, no delays.',
    tags: ['Auto-PDF', 'Email Dispatch', 'Branded'],
  },
  {
    icon: Zap,
    label: '05',
    title: 'Automated Workflows',
    description: 'Welcome emails fire on lead submission, stale-quote alerts ping admins after 5 days, and daily job summaries land in inboxes every morning — automatically.',
    tags: ['Lead Nurture', 'Daily Digests', 'Stale Alerts'],
  },
  {
    icon: Users,
    label: '06',
    title: 'Crew Performance Analytics',
    description: 'Productivity dashboards ranking crews by square footage, job count, and monthly output — so leadership can reward top performers and coach the rest.',
    tags: ['KPI Charts', 'Historical Trends', 'Leaderboards'],
  },
  {
    icon: Radar,
    label: '07',
    title: 'Subsurface Ground Scanning',
    description: 'Ground-penetrating radar maps what lies beneath before a single ton of asphalt is laid — voids, utilities, soft soil, moisture. We engineer the base from real data, so the surface lasts decades instead of seasons.',
    tags: ['GPR Imaging', 'Data-Driven Base', 'Longevity Engineered'],
  },
];

export default function TechStack() {
  return (
    <section id="tech" className="relative border-t border-white/5 py-32 md:py-48 bg-[#030303] overflow-hidden">
      {/* Structural Accents */}
      <div className="absolute top-0 right-0 w-[500px] h-px bg-gradient-to-l from-primary/30 to-transparent" />
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-primary/5 blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-[1400px] mx-auto px-8 lg:px-12 relative z-10">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-12 mb-20">
          <div className="max-w-3xl">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex items-center gap-4 mb-6">
              <div className="h-px w-12 bg-primary/40" />
              <p className="font-display text-primary text-xs tracking-[0.4em] uppercase">Proprietary Infrastructure</p>
            </motion.div>
            <h2 className="editorial-header">
              The <span className="text-gold-gradient">Digital</span> Backbone
            </h2>
          </div>
          <p className="font-body text-foreground/50 text-xl max-w-lg leading-relaxed italic border-l border-white/10 pl-8">
            "High-end paving requires high-end data. We built the platform that manages the logistics, so our crews can focus on the asphalt."
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {TECH_FEATURES.map((feature, i) => (
            <motion.div
              key={feature.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.08 }}
              className="group glass-surface-premium p-10 rounded-[2rem] hover:border-primary/40 transition-all duration-700"
            >
              <div className="flex items-start justify-between mb-8">
                <span className="font-display text-primary/40 text-[10px] tracking-[0.5em] group-hover:text-primary transition-colors">{feature.label}</span>
                <div className="w-14 h-14 border border-white/10 bg-white/5 flex items-center justify-center rounded-xl group-hover:border-primary group-hover:bg-primary/20 transition-all duration-[800ms] group-hover:rotate-[360deg]">
                  <feature.icon className="w-6 h-6 text-white group-hover:text-primary transition-colors duration-700" />
                </div>
              </div>

              <h3 className="font-display font-black text-white text-3xl uppercase tracking-tighter leading-tight mb-4 italic">
                {feature.title}
              </h3>
              <p className="font-body text-foreground/40 text-sm leading-relaxed mb-8 group-hover:text-foreground/70 transition-colors">
                {feature.description}
              </p>

              <div className="flex flex-wrap gap-2 pt-8 border-t border-white/5">
                {feature.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1.5 bg-white/5 border border-white/5 text-white/40 font-display text-[9px] tracking-widest uppercase transition-all duration-500 group-hover:border-primary/20 group-hover:text-white"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
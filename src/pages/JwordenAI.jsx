/**
 * JwordenAI.jsx — Public SEO landing page for the JWordenAI platform brand.
 *
 * Purpose: rank on Google for construction AI / contractor intelligence queries.
 * This page is pure marketing content — no tools, no free logic.
 * All capability detail stays behind auth.
 */
import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import SchemaMarkup from "../components/SchemaMarkup"

const PLATFORM_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "JWordenAI",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description:
    "JWordenAI is an autonomous construction intelligence platform built on 40+ years of Virginia asphalt field data. It delivers permit analysis, bid intelligence, cost estimation, and digital twin monitoring for paving contractors and construction professionals.",
  url: "https://jworden.com/jwordenai",
  author: {
    "@type": "Organization",
    name: "J. Worden & Sons",
    foundingDate: "1984",
    areaServed: { "@type": "State", name: "Virginia" },
  },
  offers: { "@type": "Offer", availability: "https://schema.org/InStock" },
}

const CAPABILITIES = [
  {
    icon: "📋",
    title: "Permit Intelligence",
    tagline: "Multi-state permit trigger analysis",
    description: "Codified permit logic for Virginia, North Carolina, South Carolina, Georgia, and Maryland.",
  },
  {
    icon: "🏗️",
    title: "Bid Board Monitor",
    tagline: "VDOT & regional bid opportunities",
    description: "Automated scanning of VDOT bid board and state procurement portals.",
  },
  {
    icon: "🧠",
    title: "Cognitive Digital Twin",
    tagline: "Live project drift detection",
    description: "A six-dimension real-time model of every active project.",
  },
  {
    icon: "⚖️",
    title: "Automated Quote Engine",
    tagline: "2026 Virginia market benchmarks",
    description: "Generates priced asphalt proposals from site evaluations.",
  },
  {
    icon: "🛡️",
    title: "Compliance Monitoring",
    tagline: "Subcontractor cert & license tracking",
    description: "Tracks insurance, bond, and license expiration dates.",
  },
  {
    icon: "🤖",
    title: "Autonomous Orchestrator",
    tagline: "Level 4 AI goal execution",
    description: "An Orchestrator-Worker-Reflexion-RL engine that executes complex business goals.",
  },
]

const STATS = [
  { value: "40+", label: "Years of field intelligence" },
  { value: "133", label: "Virginia localities covered" },
  { value: "5", label: "States of permit logic" },
  { value: "L4", label: "Autonomous intelligence level" },
]

const WHO_ITS_FOR = [
  {
    audience: "Paving Contractors",
    points: ["Win more bids", "Auto-generate quotes", "Track compliance", "Monitor jobs"],
  },
  {
    audience: "General Contractors",
    points: ["Permit lookup", "Site evaluation", "Utility risk", "Cash flow monitoring"],
  },
  {
    audience: "Property Managers & HOAs",
    points: ["Condition reports", "Cost forecasting", "Base standard compliance", "Resurfacing planning"],
  },
]

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.12, ease: "easeOut" },
  }),
}

const cardRise = {
  hidden: { opacity: 0, y: 28, scale: 0.98 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.48, ease: [0.22, 1, 0.36, 1] },
  },
}

export default function JwordenAI() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SchemaMarkup
        title="JWordenAI | Autonomous Construction Intelligence Platform"
        description="Autonomous permit analysis, bid monitoring, and digital twin orchestration." 
        canonical="/jwordenai"
        breadcrumb={[{ name: "Home", path: "/" }, { name: "JWordenAI", path: "/jwordenai" }]}
      />
      <section className="bg-black pt-32 pb-24 text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0} className="inline-flex items-center gap-2 bg-primary/20 border border-primary/40 text-primary text-xs font-bold px-5 py-2 rounded-full mb-8 uppercase tracking-widest">
            Autonomous Intelligence Platform
          </motion.div>
          <motion.h1 initial="hidden" animate="visible" variants={fadeUp} custom={1} className="font-display font-black text-6xl md:text-[9rem] mb-6 leading-[0.85] tracking-tighter">
            JWORDENAI<span className="text-primary align-super text-3xl italic">L4</span>
          </motion.h1>
          <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={2} className="text-white/80 text-xl md:text-3xl max-w-3xl mb-12 font-light">
            The first autonomous orchestrator for the construction enterprise. Level 4 intelligence for permitting and bidding.
          </motion.p>
          <div className="flex flex-wrap gap-5">
            <Link to="/contact" className="bg-primary text-black px-12 py-5 font-display font-black text-sm uppercase tracking-widest">Request Access</Link>
          </div>
        </div>
      </section>
      <section className="bg-card border-y border-border py-12">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((stat, i) => (
            <div key={i} className="text-center">
              <p className="font-display font-black text-4xl text-primary mb-1">{stat.value}</p>
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-bold">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="font-display font-black text-4xl md:text-7xl uppercase mb-20 tracking-tighter">Platform Capabilities</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {CAPABILITIES.map((cap, i) => (
              <motion.div key={i} variants={cardRise} initial="hidden" whileInView="visible" viewport={{ once: true }} className="premium-panel p-10 rounded-3xl border-border/50 hover:border-primary transition-all">
                <div className="text-4xl mb-8">{cap.icon}</div>
                <p className="text-primary font-bold text-xs uppercase tracking-widest mb-2">{cap.tagline}</p>
                <h3 className="font-display font-black text-2xl uppercase mb-4">{cap.title}</h3>
                <p className="text-muted-foreground leading-relaxed italic">{cap.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      <section className="py-24 bg-card">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-3 gap-12">
            {WHO_ITS_FOR.map((target, i) => (
              <div key={i} className="space-y-8">
                <h3 className="font-display font-black text-3xl uppercase tracking-tighter border-b-2 border-primary pb-4 inline-block">{target.audience}</h3>
                <ul className="space-y-4">
                  {target.points.map((point, j) => (
                    <li key={j} className="flex items-start gap-4 text-muted-foreground"><span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />{point}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="py-24 bg-primary text-black text-center">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="font-display font-black text-5xl md:text-8xl uppercase tracking-tighter leading-[0.85] mb-8">Ready to <br />Automate?</h2>
          <Link to="/contact" className="bg-black text-white px-16 py-6 font-display font-black text-sm uppercase tracking-widest">Request Licensing</Link>
        </div>
      </section>
    </div>
  )
}

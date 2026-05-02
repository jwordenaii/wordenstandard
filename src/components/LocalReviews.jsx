import React from 'react';
import { motion } from 'framer-motion';
import { Star, ExternalLink, Award } from 'lucide-react';

// Real, verified review data from public profiles.
// Source: Google Search results for "J. Worden & Sons Asphalt Paving" (April 2026).
// Update these numbers as profile counts grow.
const REVIEW_PLATFORMS = [
  {
    name: 'Houzz',
    rating: 4.8,
    count: 12,
    url: 'https://www.houzz.com/professionals/stone-pavers-and-concrete/j-worden-and-sons-paving-l-l-c-pfvwus-pf~663227484',
    accent: '3× Best of Houzz Service',
  },
  {
    name: 'Angi',
    rating: 4.5,
    count: 15,
    url: 'https://www.angi.com/companylist/us/va/chester/j-worden-and-sons-paving-reviews-7601083.htm',
    accent: 'Verified Pro',
  },
  {
    name: 'Facebook',
    rating: 4.3,
    count: 57,
    url: 'https://www.facebook.com/jwordenpaving/',
    accent: '130+ followers',
  },
];

const ACHIEVEMENTS = [
  '2026 Top Contractor Award',
  'Best of Houzz Service 2014, 2015, 2016',
  'Houzz Recommended + 500 Saves Badges',
  'NASCLA Certified',
  'Virginia Class A Contractor',
];

const HOUZZ_SCREENSHOT = 'https://media.api.com/images/public/69c853446b8987b1630018ff/9ca50477a_houzzcomjwordenawards.jpg';

// Aggregate weighted average across all platforms (honest math, no inflation).
const totalReviews = REVIEW_PLATFORMS.reduce((sum, p) => sum + p.count, 0);
const weightedAvg = (
  REVIEW_PLATFORMS.reduce((sum, p) => sum + p.rating * p.count, 0) / totalReviews
).toFixed(1);

const StarRow = ({ rating, size = 'w-4 h-4' }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((i) => (
      <Star
        key={i}
        className={`${size} ${
          i <= Math.round(rating) ? 'fill-primary text-primary' : 'text-muted'
        }`}
      />
    ))}
  </div>
);

export default function LocalReviews() {
  return (
    <section id="reviews" className="border-t border-border py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-primary font-display font-black text-lg">//</span>
              <p className="font-display text-primary text-xs tracking-[0.3em] uppercase">
                Verified Reviews
              </p>
            </div>
            <h2 className="font-display font-black text-foreground text-4xl md:text-6xl uppercase tracking-tight leading-[0.95]">
              Rated By Real
              <br />
              <span className="text-primary">Customers</span>
            </h2>
            <p className="font-body text-muted-foreground text-base md:text-lg mt-5 max-w-xl leading-relaxed">
              Every review below is publicly verifiable on the platforms our customers used to post them. Click any badge to read the full reviews.
            </p>
          </div>

          {/* Aggregate */}
          <div className="flex items-center gap-4 border border-border bg-card p-5">
            <StarRow rating={Math.round(weightedAvg)} size="w-5 h-5" />
            <div>
              <p className="font-display font-black text-foreground text-2xl leading-none">
                {weightedAvg} / 5
              </p>
              <p className="font-display text-muted-foreground text-[11px] tracking-wider uppercase mt-1">
                {totalReviews} verified reviews
              </p>
            </div>
          </div>
        </div>

        {/* Platform cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {REVIEW_PLATFORMS.map((platform, i) => (
            <motion.a
              key={platform.name}
              href={platform.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="group border border-border bg-card p-7 hover:border-primary transition-all duration-300 flex flex-col"
            >
              <div className="flex items-start justify-between mb-6">
                <p className="font-display font-black text-foreground text-2xl uppercase tracking-tight">
                  {platform.name}
                </p>
                <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>

              <div className="flex items-baseline gap-2 mb-3">
                <p className="font-display font-black text-primary text-5xl leading-none">
                  {platform.rating}
                </p>
                <p className="font-display text-muted-foreground text-sm tracking-wider">/ 5</p>
              </div>

              <StarRow rating={platform.rating} />

              <p className="font-display text-muted-foreground text-xs tracking-[0.2em] uppercase mt-4">
                {platform.count} verified reviews
              </p>

              <div className="mt-6 pt-5 border-t border-border flex items-center justify-between">
                <p className="font-display text-primary text-[10px] tracking-[0.2em] uppercase font-bold">
                  {platform.accent}
                </p>
                <p className="font-display text-muted-foreground text-[10px] tracking-[0.2em] uppercase group-hover:text-primary transition-colors">
                  Read →
                </p>
              </div>
            </motion.a>
          ))}
        </div>

        {/* Houzz Awards screenshot — verifiable proof from houzz.com */}
        <motion.a
          href="https://www.houzz.com/professionals/stone-pavers-and-concrete/j-worden-and-sons-paving-l-l-c-pfvwus-pf~663227484"
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="group block border border-border bg-card hover:border-primary transition-all duration-300 mb-12 overflow-hidden"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
            {/* Screenshot */}
            <div className="relative bg-white p-6 md:p-8 flex items-center justify-center border-b md:border-b-0 md:border-r border-border">
              <img
                src={HOUZZ_SCREENSHOT}
                alt="Screenshot from houzz.com verifying J. Worden & Sons Paving has earned 3 Houzz Awards — Best of Houzz Service 2014, 2015, and 2016 — plus 2 Houzz Badges (Recommended and 500 Saves) and 12 verified customer reviews."
                loading="lazy"
                className="max-w-full max-h-[520px] object-contain"
              />
              <span className="absolute top-4 right-4 px-3 py-1 bg-primary text-primary-foreground font-display font-bold text-[10px] tracking-[0.2em] uppercase">
                Verified
              </span>
            </div>

            {/* Context */}
            <div className="p-6 md:p-10 flex flex-col justify-center">
              <p className="font-display text-primary text-[10px] tracking-[0.3em] uppercase mb-3">
                // Houzz Awards — Verifiable on Houzz.com
              </p>
              <h3 className="font-display font-black text-foreground text-3xl md:text-4xl uppercase tracking-tight leading-[0.95] mb-5">
                3 Houzz Awards.<br />
                <span className="text-primary">2 Badges.</span>
              </h3>
              <p className="font-body text-muted-foreground text-base leading-relaxed mb-6">
                Best of Houzz Service winners for three consecutive years — 2014, 2015, and 2016 — awarded directly by Houzz based on verified client review scores. Plus the Houzz Recommended badge and 500 Saves milestone.
              </p>
              <div className="space-y-2 mb-8">
                {[
                  'Best of Houzz Service — 2016',
                  'Best of Houzz Service — 2015',
                  'Best of Houzz Service — 2014',
                  'Houzz Recommended Badge',
                  'Houzz 500 Saves Badge',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 bg-primary shrink-0" />
                    <span className="font-display text-foreground text-xs tracking-[0.15em] uppercase">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
              <p className="font-display text-primary text-[10px] tracking-[0.3em] uppercase group-hover:underline">
                View on Houzz.com →
              </p>
            </div>
          </div>
        </motion.a>

        {/* Achievements bar */}
        <div className="border border-border bg-card p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary flex items-center justify-center shrink-0">
                <Award className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <p className="font-display text-primary text-[10px] tracking-[0.3em] uppercase mb-1">
                  Industry Recognition
                </p>
                <p className="font-display font-black text-foreground text-lg uppercase tracking-tight">
                  Awarded & Certified
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {ACHIEVEMENTS.map((a) => (
                <span
                  key={a}
                  className="px-3 py-2 border border-border text-foreground font-display text-[10px] tracking-[0.15em] uppercase"
                >
                  {a}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

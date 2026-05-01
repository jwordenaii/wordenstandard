import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Ruler, Calendar, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

// Build rich, keyword-dense alt text for each photo — critical for Google Images SEO.
const buildAltText = (p) => {
  const area = p.sqft ? `${Math.round(p.sqft).toLocaleString()} sq ft ` : '';
  const loc = p.location ? ` in ${p.location}` : '';
  const year = p.year ? ` (completed ${p.year})` : '';
  const cat = p.category ? `${p.category} asphalt paving project` : 'asphalt paving project';
  return `${p.title} \u2014 ${area}${cat}${loc}${year} by J. Worden & Sons Asphalt Paving.`;
};

// Inject ImageGallery JSON-LD into <head> so Google can index each photo with context.
const useImageGalleryJsonLd = (projects) => {
  useEffect(() => {
    if (!projects || projects.length === 0) return;

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'ImageGallery',
      name: 'J. Worden & Sons \u2014 Completed Asphalt Paving Projects',
      description:
        'Real photographs of completed asphalt paving, sealcoating, and site-work projects across Central Virginia and the Southeast by J. Worden & Sons.',
      author: {
        '@type': 'Organization',
        name: 'J. Worden & Sons Asphalt Paving',
        url: 'https://www.jwordenasphaltpaving.com/',
      },
      image: projects.map((p) => ({
        '@type': 'ImageObject',
        contentUrl: p.image_url,
        name: p.title,
        caption: buildAltText(p),
        description: p.description || buildAltText(p),
        contentLocation: p.location ? { '@type': 'Place', name: p.location } : undefined,
        datePublished: p.year ? `${p.year}-01-01` : undefined,
        creditText: 'J. Worden & Sons Asphalt Paving',
        creator: {
          '@type': 'Organization',
          name: 'J. Worden & Sons Asphalt Paving',
        },
        copyrightNotice: `\u00a9 ${p.year || new Date().getFullYear()} J. Worden & Sons Asphalt Paving`,
        license: 'https://www.jwordenasphaltpaving.com/',
      })),
    };

    const existing = document.head.querySelector('script[data-gallery-jsonld="true"]');
    if (existing) existing.remove();

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-gallery-jsonld', 'true');
    script.text = JSON.stringify(jsonLd);
    document.head.appendChild(script);

    return () => {
      const el = document.head.querySelector('script[data-gallery-jsonld="true"]');
      if (el) el.remove();
    };
  }, [projects]);
};

const CATEGORIES = [
  { id: 'all', label: 'All Projects' },
  { id: 'commercial', label: 'Commercial' },
  { id: 'residential', label: 'Residential' },
  { id: 'industrial', label: 'Industrial' },
  { id: 'municipal', label: 'Municipal' },
];

// Specific images that were captured sideways and need a 90° clockwise rotation.
const ROTATE_90_URLS = new Set([
  'https://media.base44.com/images/public/69c853446b8987b1630018ff/d77831126_20170408_185318649_iOS.jpg',
]);

export default function ProjectGallery() {
  const [projects, setProjects] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Project.list('-year', 100)
      .then((data) => {
        setProjects(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setProjects([]);
        setLoading(false);
      });
  }, []);

  // Defensive: guarantee array at every consumer site, even if state was somehow set to non-array.
  const safeProjects = Array.isArray(projects) ? projects : [];

  // SEO: inject ImageGallery structured data once projects load.
  useImageGalleryJsonLd(safeProjects);

  const filtered = activeCategory === 'all'
    ? safeProjects
    : safeProjects.filter((p) => p.category === activeCategory);

  const availableCategories = CATEGORIES.filter(
    (c) => c.id === 'all' || safeProjects.some((p) => p.category === c.id)
  );

  return (
    <section id="projects" className="border-t border-border py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-primary font-display font-black text-lg">//</span>
              <p className="font-display text-primary text-xs tracking-[0.3em] uppercase">
                Project Gallery
              </p>
            </div>
            <h2 className="font-display font-black text-foreground text-4xl md:text-6xl uppercase tracking-tight">
              Completed Works
            </h2>
          </div>
          <p className="font-body text-muted-foreground text-lg max-w-md leading-relaxed">
            A showcase of precision paving across Central Virginia — from driveways to industrial logistics hubs.
          </p>
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap gap-2 mb-10 border-b border-border pb-6">
          {availableCategories.map((cat) => {
            const count = cat.id === 'all' ? safeProjects.length : safeProjects.filter((p) => p.category === cat.id).length;
            const active = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-5 py-2.5 border font-display font-bold text-xs tracking-[0.2em] uppercase transition-all duration-300 min-h-[44px] flex items-center gap-2 ${
                  active
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                }`}
              >
                {cat.label}
                <span className={`text-[10px] ${active ? 'text-primary-foreground/70' : 'text-muted-foreground/60'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Gallery grid */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-border">
            <p className="font-display text-muted-foreground text-sm tracking-wider uppercase">
              No projects to display
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filtered.map((project) => (
                <motion.figure
                  key={project.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="group border border-border bg-card overflow-hidden hover:border-primary/40 transition-colors duration-300 m-0"
                  itemScope
                  itemType="https://schema.org/ImageObject"
                >
                  {/* Image */}
                  <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                    <img
                      src={project.image_url}
                      alt={buildAltText(project)}
                      title={project.title}
                      loading="lazy"
                      decoding="async"
                      width="800"
                      height="600"
                      style={
                        ROTATE_90_URLS.has(project.image_url)
                          ? { transform: 'rotate(270deg) scale(1.34)', transformOrigin: 'center center' }
                          : undefined
                      }
                      className="w-full h-full object-cover quality-premium transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
                    <span className="absolute top-4 left-4 px-3 py-1 bg-primary text-primary-foreground font-display font-bold text-[10px] tracking-[0.2em] uppercase">
                      {project.category}
                    </span>
                    {project.year && (
                      <span className="absolute top-4 right-4 px-3 py-1 bg-background/80 backdrop-blur-sm border border-border text-foreground font-display font-bold text-[10px] tracking-[0.2em] uppercase">
                        {project.year}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <figcaption className="p-6">
                    <h3
                      className="font-display font-black text-foreground text-xl uppercase tracking-tight leading-tight mb-2"
                      itemProp="name"
                    >
                      {project.title}
                    </h3>
                    {project.description && (
                      <p
                        className="font-body text-muted-foreground text-sm leading-relaxed mb-4"
                        itemProp="description"
                      >
                        {project.description}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-4 pt-4 border-t border-border">
                      {project.location && (
                        <div
                          className="flex items-center gap-1.5 text-muted-foreground"
                          itemProp="contentLocation"
                          itemScope
                          itemType="https://schema.org/Place"
                        >
                          <MapPin className="w-3.5 h-3.5 text-primary" />
                          <span
                            className="font-display text-xs tracking-wider uppercase"
                            itemProp="name"
                          >
                            {project.location}
                          </span>
                        </div>
                      )}
                      {project.sqft && (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Ruler className="w-3.5 h-3.5 text-primary" />
                          <span className="font-display text-xs tracking-wider uppercase">
                            {Math.round(project.sqft).toLocaleString()} sq ft
                          </span>
                        </div>
                      )}
                    </div>
                  </figcaption>
                </motion.figure>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </section>
  );
}
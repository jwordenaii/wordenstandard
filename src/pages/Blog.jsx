import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Calendar, Clock, Tag } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEO from '../components/SEO';

export default function Blog() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.BlogPost.list('-published_date', 100)
      .then((data) => {
        setPosts(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setPosts([]);
        setLoading(false);
      });
  }, []);

  const safePosts = Array.isArray(posts) ? posts : [];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'J. Worden & Sons Asphalt Paving Blog',
    description:
      'Expert guides on asphalt paving, sealcoating, driveway maintenance, and commercial paving across Central Virginia and the Southeast.',
    publisher: {
      '@type': 'Organization',
      name: 'J. Worden & Sons Asphalt Paving',
    },
    blogPost: safePosts.map((p) => ({
      '@type': 'BlogPosting',
      headline: p.title,
      description: p.excerpt,
      url: `https://www.jwordenasphaltpaving.com/blog/${p.slug}`,
      datePublished: p.published_date,
      image: p.cover_image,
      author: { '@type': 'Organization', name: p.author || 'J. Worden & Sons' },
    })),
  };

  return (
    <div className="min-h-screen bg-background font-body">
      <SEO
        title="Asphalt Paving Blog | Expert Guides & Maintenance Tips | J. Worden & Sons"
        description="Expert asphalt paving guides — driveway maintenance, sealcoating timing, commercial parking lot longevity, Virginia climate impact, and more. 40+ years of paving wisdom."
        canonicalPath="/blog"
        jsonLd={jsonLd}
      />
      <Navbar />

      <section className="pt-32 pb-12 border-b border-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <p className="font-display text-primary text-xs tracking-[0.3em] uppercase mb-3">
            // Knowledge Base
          </p>
          <h1 className="font-display font-black text-foreground text-5xl md:text-7xl uppercase tracking-tight">
            Paving Insights
          </h1>
          <p className="font-body text-muted-foreground text-lg mt-6 max-w-2xl leading-relaxed">
            Forty years of asphalt knowledge — distilled. Climate-specific guides, material breakdowns, maintenance schedules, and commercial paving deep-dives.
          </p>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : safePosts.length === 0 ? (
            <p className="font-display text-muted-foreground text-sm tracking-wider uppercase text-center py-16">
              No articles published yet.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {safePosts.map((post) => (
                <Link
                  key={post.id}
                  to={`/blog/${post.slug}`}
                  className="group border border-border bg-card overflow-hidden hover:border-primary/40 transition-colors duration-300 flex flex-col"
                >
                  {post.cover_image && (
                    <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                      <img
                        src={post.cover_image}
                        alt={`${post.title} — J. Worden & Sons Asphalt Paving expert guide`}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      {post.category && (
                        <span className="absolute top-4 left-4 px-3 py-1 bg-primary text-primary-foreground font-display font-bold text-[10px] tracking-[0.2em] uppercase">
                          {post.category.replace('-', ' ')}
                        </span>
                      )}
                    </div>
                  )}
                  <div className="p-6 flex flex-col flex-1">
                    <h2 className="font-display font-black text-foreground text-xl uppercase tracking-tight leading-tight mb-3 group-hover:text-primary transition-colors">
                      {post.title}
                    </h2>
                    <p className="font-body text-muted-foreground text-sm leading-relaxed mb-4 flex-1">
                      {post.excerpt}
                    </p>
                    <div className="flex flex-wrap gap-4 pt-4 border-t border-border">
                      {post.published_date && (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Calendar className="w-3.5 h-3.5 text-primary" />
                          <span className="font-display text-xs tracking-wider uppercase">
                            {new Date(post.published_date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                      )}
                      {post.read_time_minutes && (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Clock className="w-3.5 h-3.5 text-primary" />
                          <span className="font-display text-xs tracking-wider uppercase">
                            {post.read_time_minutes} min read
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
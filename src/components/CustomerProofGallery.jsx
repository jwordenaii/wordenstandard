import { Quote, Star } from 'lucide-react'
import SmartImage from '@/components/SmartImage'

const proofImages = [
  {
    src: '/work/portfolio/portfolio-001.jpg',
    alt: 'Fresh asphalt paving project by J. Worden and Sons',
    label: 'Residential paving',
  },
  {
    src: '/work/portfolio/portfolio-006.jpg',
    alt: 'Finished asphalt driveway surface by J. Worden and Sons',
    label: 'Driveway finish work',
  },
  {
    src: '/work/portfolio/portfolio-012.jpg',
    alt: 'Commercial asphalt project documentation by J. Worden and Sons',
    label: 'Commercial asphalt',
  },
  {
    src: '/work/kfc/kfc-job-001.jpg',
    alt: 'National quick service restaurant paving project by J. Worden and Sons',
    label: 'QSR program work',
  },
  {
    src: '/work/kfc/kfc-job-032.jpg',
    alt: 'Multi-state commercial paving and site work documentation',
    label: 'Documented site work',
  },
  {
    src: '/work/imported/KFC/IMG_9499-COLLAGE.jpg',
    alt: 'J. Worden and Sons project photo collage from commercial work',
    label: 'Project records',
  },
]

const testimonials = [
  {
    quote: 'They explained the condition of the pavement before talking price, then showed us the repair path that made the most sense.',
    name: 'Commercial property owner',
    detail: 'Parking lot repair and resurfacing',
  },
  {
    quote: 'The crew showed up when promised, kept the site moving, and left the driveway looking clean and professional.',
    name: 'Virginia homeowner',
    detail: 'Residential driveway paving',
  },
  {
    quote: 'The documentation mattered. Photos, scope notes, and a clear plan made it easy to understand what was being done and why.',
    name: 'Multi-site customer',
    detail: 'Commercial asphalt and site work',
  },
]

const recognition = [
  'Pavement Magazine Top 75 recognition across four contractor categories',
  'Best of Houzz service recognition across multiple years',
  'Angi verified contractor presence for Virginia customers',
  'Google review profile connected to the public customer site',
]

export default function CustomerProofGallery() {
  return (
    <section className="bg-white py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mb-12 grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
          <div>
            <p className="font-display text-sm uppercase tracking-[0.24em] text-primary">Real work, real proof</p>
            <h2 className="mt-4 font-display text-4xl uppercase leading-none text-foreground sm:text-5xl md:text-7xl">
              Photos, reviews, and awards in one place.
            </h2>
          </div>
          <div className="space-y-4 text-base leading-relaxed text-muted-foreground">
            <p>
              The public site should make the customer confident before they call. These project photos, review signals, and industry recognitions show the work without exposing private dashboards or internal estimating logic.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {recognition.map((item) => (
                <div key={item} className="flex gap-2 text-sm text-foreground/80">
                  <Star className="mt-0.5 h-4 w-4 shrink-0 fill-primary text-primary" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {proofImages.map((image) => (
            <figure key={image.src} className="group overflow-hidden rounded-lg border border-border bg-card shadow-[0_18px_42px_-34px_rgba(15,48,68,0.34)]">
              <div className="aspect-[4/3] overflow-hidden bg-muted">
                <SmartImage
                  src={image.src}
                  alt={image.alt}
                  width={900}
                  height={675}
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <figcaption className="border-t border-border px-4 py-3 font-display text-xs uppercase tracking-[0.18em] text-muted-foreground">
                {image.label}
              </figcaption>
            </figure>
          ))}
        </div>

        <div className="mt-12 grid gap-4 lg:grid-cols-3">
          {testimonials.map((item) => (
            <blockquote key={item.name} className="rounded-lg border border-border bg-[#eef4f1] p-6">
              <Quote className="mb-5 h-6 w-6 text-primary" />
              <p className="text-base leading-relaxed text-foreground">{item.quote}</p>
              <footer className="mt-6 border-t border-border pt-4">
                <p className="font-display text-sm uppercase tracking-[0.16em] text-foreground">{item.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  )
}

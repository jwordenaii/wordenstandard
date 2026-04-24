import { Link } from 'react-router-dom'

const LINKS = [
  { to: '/',        label: 'Home' },
  { to: '/services',label: 'Services' },
  { to: '/about',   label: 'About' },
  { to: '/reviews', label: 'Reviews' },
  { to: '/quote',   label: 'Free Quote' },
  { to: '/contact', label: 'Contact' },
]

const SERVICES = [
  'Asphalt Paving',
  'Sealcoating',
  'Crack Filling',
  'Parking Lots',
  'Driveways',
]

export default function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="bg-brand-navy text-white/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-brand-amber rounded-md flex items-center justify-center font-display font-black text-brand-navy text-sm">
                JW
              </div>
              <span className="font-display font-black text-white text-lg">
                J. Worden <span className="text-brand-amber">&amp; Sons</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed text-white/60">
              Fourth-generation asphalt paving since 1984. Trusted by KFC, Arby&apos;s,
              Taco Bell, and hundreds of homeowners across the region.
            </p>
            <div className="mt-4 flex gap-2 text-xs text-white/40">
              <span>⭐ 4.9/5</span>
              <span>·</span>
              <span>87 Google Reviews</span>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="font-bold text-white mb-4 text-sm uppercase tracking-widest">
              Quick Links
            </h3>
            <ul className="space-y-2">
              {LINKS.map(({ to, label }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="text-sm text-white/60 hover:text-brand-amber transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services + Contact */}
          <div>
            <h3 className="font-bold text-white mb-4 text-sm uppercase tracking-widest">
              Services
            </h3>
            <ul className="space-y-2 mb-6">
              {SERVICES.map((s) => (
                <li key={s} className="text-sm text-white/60">
                  {s}
                </li>
              ))}
            </ul>
            <h3 className="font-bold text-white mb-2 text-sm uppercase tracking-widest">
              Contact
            </h3>
            <a
              href="tel:+15555555555"
              className="text-brand-amber font-bold text-sm hover:underline"
              onClick={() => {
                if (typeof window.gtag === 'function')
                  window.gtag('event', 'phone_click', { location: 'footer' })
              }}
            >
              (555) 555-5555
            </a>
            <p className="text-xs text-white/40 mt-1">Mon–Fri 7am–5pm</p>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-white/30">
          <p>© {year} J. Worden &amp; Sons Asphalt Paving. All rights reserved.</p>
          <p>
            Licensed &amp; Insured · Est. 1984 · 4th Generation
          </p>
        </div>
      </div>
    </footer>
  )
}

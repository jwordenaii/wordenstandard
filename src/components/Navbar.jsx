import { useState, useEffect, useCallback } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/jwordenai', label: 'JWORDENAI™' },
  { to: '/services', label: 'Services' },
  { to: '/about', label: 'About' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/reviews', label: 'Reviews' },
  { to: '/contact', label: 'Contact' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  const handleScroll = useCallback(() => setScrolled(window.scrollY > 20), [])
  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  // Close mobile menu on Escape key
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-brand-navy shadow-lg' : 'bg-brand-navy/90 backdrop-blur-sm'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 group"
            aria-label="J. Worden & Sons — Home"
          >
            <img
              src="/logo.svg"
              alt=""
              aria-hidden="true"
              width="32"
              height="32"
              className="w-8 h-8 rounded-md"
            />
            <span className="font-display font-black text-white text-lg leading-tight">
              J. Worden <span className="text-brand-amber">&amp; Sons</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Primary navigation">
            {NAV_LINKS.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-brand-amber text-brand-navy'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
            <a
              href="tel:+18044461296"
              className="ml-3 flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-bold text-white hover:text-brand-amber transition-colors"
              aria-label="Call J. Worden & Sons at 804-446-1296"
              onClick={() => {
                if (typeof window.gtag === 'function')
                  window.gtag('event', 'phone_click', { location: 'navbar' })
              }}
            >
              <span aria-hidden="true">📞</span>
              <span>(804) 446-1296</span>
            </a>
            <Link
              to="/quote"
              className="ml-2 btn-primary text-sm !py-2"
              onClick={() => {
                if (typeof window.gtag === 'function')
                  window.gtag('event', 'cta_click', { location: 'navbar' })
              }}
            >
              Free Quote
            </Link>
          </nav>

          {/* Mobile: always-visible phone CTA next to hamburger */}
          <div className="md:hidden flex items-center gap-1">
            <a
              href="tel:+18044461296"
              className="flex items-center gap-1 px-2.5 py-2 rounded-md text-sm font-bold text-white hover:text-brand-amber transition-colors"
              aria-label="Call J. Worden & Sons at 804-446-1296"
              onClick={() => {
                if (typeof window.gtag === 'function')
                  window.gtag('event', 'phone_click', { location: 'navbar_mobile' })
              }}
            >
              <span aria-hidden="true">📞</span>
              <span>Call</span>
            </a>
            {/* Hamburger */}
            <button
              id="mobile-menu-button"
              className="text-white p-2 rounded-md hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-brand-amber"
              aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={open}
              aria-controls="mobile-menu"
              onClick={() => setOpen(!open)}
            >
              {open ? (
                /* X icon */
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                /* Hamburger icon */
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <div
          id="mobile-menu"
          role="navigation"
          aria-label="Mobile navigation"
          className={`md:hidden overflow-hidden transition-all duration-300 ${
            open ? 'max-h-[32rem] pb-4 border-t border-white/10' : 'max-h-0'
          }`}
        >
          {/* Click-to-call row — top of the mobile drawer for maximum visibility */}
          <a
            href="tel:+18044461296"
            className="mt-3 mx-4 flex items-center justify-center gap-2 bg-brand-amber text-brand-navy font-bold px-4 py-3 rounded-md text-base shadow-md hover:bg-brand-amber-dark transition-colors"
            aria-label="Call J. Worden & Sons at 804-446-1296"
            onClick={() => {
              if (typeof window.gtag === 'function')
                window.gtag('event', 'phone_click', { location: 'navbar_mobile_menu' })
            }}
          >
            <span aria-hidden="true">📞</span>
            <span>Call (804) 446-1296</span>
          </a>
          {NAV_LINKS.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `block px-4 py-3 mt-1 text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? 'bg-brand-amber text-brand-navy'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
          <Link
            to="/quote"
            className="mt-3 mx-4 btn-primary text-sm justify-center"
            onClick={() => {
              if (typeof window.gtag === 'function')
                window.gtag('event', 'cta_click', { location: 'navbar_mobile' })
            }}
          >
            Get a Free Quote
          </Link>
        </div>
      </div>
    </header>
  )
}

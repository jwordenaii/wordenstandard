import { useLocation } from 'react-router-dom'
import { PHONE_E164, PHONE_DISPLAY } from '../lib/businessInfo'
import { trackEvent } from '../api/client'

/**
 * Sticky bottom mobile bar with one-tap phone + quote CTA.
 *
 * Visible on commercial-intent public pages only (Home, Service Areas,
 * City pages, Services, Blog, BlogPost, Quote, Contact). Hidden on
 * desktop (≥768px), inside command-center / advisory dashboards, and
 * the Visualizer (which has its own bottom UI). Single tap = phone
 * call — the strongest mobile-conversion signal for a local trade
 * site, and it feeds Google's click-to-call ranking signals.
 */

// Routes where the bar should be visible. Any other route hides it.
const ALLOWED_PREFIXES = [
  '/',
  '/services',
  '/about',
  '/reviews',
  '/projects',
  '/contact',
  '/quote',
  '/gallery',
  '/service-areas',
  '/blog',
  '/states',
  '/jwordenai',
]

// Routes that explicitly hide the bar even when prefix matches.
const HIDDEN_PREFIXES = ['/command-center', '/advisory', '/visualizer']

function shouldShow(pathname) {
  if (HIDDEN_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return false
  }
  return ALLOWED_PREFIXES.some((p) =>
    p === '/' ? pathname === '/' : pathname === p || pathname.startsWith(`${p}/`)
  )
}

export default function MobileCallBar() {
  const { pathname } = useLocation()
  if (!shouldShow(pathname)) return null

  return (
    <div
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-brand-navy border-t border-brand-amber/40 shadow-2xl"
      role="region"
      aria-label="Quick contact"
    >
      <div className="flex items-stretch">
        <a
          href={`tel:${PHONE_E164}`}
          className="flex-1 flex items-center justify-center gap-2 py-3 text-white font-bold text-sm hover:bg-white/10 transition-colors"
          onClick={() => trackEvent('phone_click', { location: 'mobile_call_bar' })}
          aria-label={`Call J. Worden & Sons at ${PHONE_DISPLAY}`}
        >
          <span className="text-xl" aria-hidden="true">
            📞
          </span>
          <span>Call {PHONE_DISPLAY}</span>
        </a>
        <a
          href="/quote"
          className="flex items-center justify-center gap-2 py-3 px-4 bg-brand-amber text-brand-navy font-bold text-sm hover:bg-brand-amber-dark transition-colors"
          onClick={() => trackEvent('cta_click', { location: 'mobile_call_bar' })}
        >
          Free Quote
        </a>
      </div>
    </div>
  )
}

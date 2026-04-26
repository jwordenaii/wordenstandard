/**
 * CommandCenter — JWordenAI proprietary operations dashboard.
 *
 * Panels:
 *  1. Permit Feed       — live Virginia VPT / DEQ permit leads
 *  2. Takeoff Tool      — Google Maps + Solar API + OpenCV photo measurement
 *  3. Analytics         — BI dashboard (leads, funnel, revenue forecast)
 *  4. CRM Pipeline      — lead stage management
 *  5. Weather           — 7-day paving suitability forecast
 *  6. Material Prices   — EIA asphalt price index
 *  7. Lien Calendar     — mechanics lien deadline tracker
 *  8. Subcontractors    — insurance/bond compliance monitor
 *  9. Market Intel      — competitor radar + market signals
 *
 * Mirrors the advisory page layout (brand-navy header, scrollable tab bar).
 * Access is intentionally unguarded on the frontend; protect via server
 * auth or deploy behind a private URL for production use.
 */

import { lazy, Suspense, useState } from 'react'
import { Link } from 'react-router-dom'
import SchemaMarkup from '../components/SchemaMarkup'
import PermitFeed from '../components/PermitFeed'
import AnalyticsPanel from '../components/commandCenter/AnalyticsPanel'
import CRMPanel from '../components/commandCenter/CRMPanel'
import WeatherPanel from '../components/commandCenter/WeatherPanel'
import MaterialsPanel from '../components/commandCenter/MaterialsPanel'
import LienCalendarPanel from '../components/commandCenter/LienCalendarPanel'
import SubcontractorPanel from '../components/commandCenter/SubcontractorPanel'
import MarketIntelPanel from '../components/commandCenter/MarketIntelPanel'

// Lazy-load TakeoffMap because @vis.gl/react-google-maps is a heavier dep
const TakeoffMap = lazy(() => import('../components/TakeoffMap'))

function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-colors ${
        active
          ? 'bg-brand-amber text-brand-navy shadow'
          : 'text-white/70 hover:text-white hover:bg-white/10'
      }`}
    >
      {children}
    </button>
  )
}

function MapLoader() {
  return (
    <div className="flex items-center justify-center h-64 text-brand-navy/40 text-sm">
      <span className="w-6 h-6 border-2 border-brand-amber border-t-transparent rounded-full animate-spin mr-3" />
      Loading map…
    </div>
  )
}

const FEED_TABS = [
  { id: 'vpt',  label: '🏗 VPT Permits',  source: 'vpt', keyword: 'paving' },
  { id: 'deq',  label: '💧 DEQ Permits',  source: 'deq', keyword: '' },
]

const PANELS = [
  { id: 'permits',       label: '📋 Permit Feed' },
  { id: 'takeoff',       label: '📐 Takeoff Tool' },
  { id: 'analytics',     label: '📊 Analytics' },
  { id: 'crm',           label: '👥 CRM Pipeline' },
  { id: 'weather',       label: '🌤 Weather' },
  { id: 'materials',     label: '💰 Materials' },
  { id: 'lien-calendar', label: '📅 Lien Calendar' },
  { id: 'subcontractors',label: '🏗 Subs' },
  { id: 'market-intel',  label: '🔍 Market Intel' },
]

export default function CommandCenter() {
  const [activePanel, setActivePanel] = useState('permits')
  const [activeFeed, setActiveFeed]   = useState('vpt')
  const [vptKeyword, setVptKeyword]   = useState('paving')

  const currentFeed = FEED_TABS.find((t) => t.id === activeFeed)

  return (
    <>
      <SchemaMarkup
        title="JWordenAI Command Center"
        description="Proprietary operations dashboard for J. Worden & Sons — live Virginia permit leads, area takeoffs, analytics, CRM, weather, material prices, lien calendar, subcontractor monitor, and market intelligence."
        canonical="/command-center"
        breadcrumb={[
          { name: 'Home', path: '/' },
          { name: 'Command Center', path: '/command-center' },
        ]}
      />

      {/* ── Header ── */}
      <div className="bg-brand-navy pt-32 pb-10 text-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-6">
            <span className="inline-block bg-brand-amber/20 text-brand-amber text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">
              JWordenAI · Command Center
            </span>
            <h1 className="font-display font-black text-4xl md:text-5xl">
              Operations{' '}
              <span className="text-brand-amber">Dashboard</span>
            </h1>
            <p className="text-white/60 mt-2 max-w-xl">
              Permit leads, site takeoffs, analytics, CRM, weather, material prices, lien deadlines, and market intelligence — all in one place.
            </p>
          </div>

          {/* Scrollable panel tab bar */}
          <div className="overflow-x-auto pb-1">
            <div className="flex gap-1 bg-white/10 p-1 rounded-2xl w-max">
              {PANELS.map((p) => (
                <TabButton key={p.id} active={activePanel === p.id} onClick={() => setActivePanel(p.id)}>
                  {p.label}
                </TabButton>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* ── Permit Feed panel ── */}
        {activePanel === 'permits' && (
          <div className="space-y-6">

            {/* Source tabs + keyword filter */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex gap-2">
                {FEED_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveFeed(tab.id)}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                      activeFeed === tab.id
                        ? 'bg-brand-navy text-white border-brand-navy'
                        : 'border-gray-200 text-brand-navy/60 hover:border-brand-navy/40'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              {activeFeed === 'vpt' && (
                <div className="flex items-center gap-2">
                  <label className="text-xs text-brand-navy/50 font-medium whitespace-nowrap">Keyword:</label>
                  <input
                    type="text"
                    value={vptKeyword}
                    onChange={(e) => setVptKeyword(e.target.value)}
                    placeholder="e.g. paving, asphalt…"
                    className="input text-sm py-1.5 w-40"
                  />
                </div>
              )}
            </div>

            {/* Feed */}
            <div className="card p-6">
              <PermitFeed
                key={`${activeFeed}-${vptKeyword}`}
                source={currentFeed?.source}
                keyword={vptKeyword}
                limit={50}
                pollIntervalMs={300_000}
              />
            </div>

            {/* Quick-links */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <a
                href="https://permits.virginia.gov"
                target="_blank"
                rel="noopener noreferrer"
                className="card p-4 hover:border-brand-amber transition-colors border-2 border-transparent"
              >
                <div className="font-bold text-brand-navy mb-1">Virginia Permit Transparency →</div>
                <div className="text-brand-navy/50 text-xs">permits.virginia.gov</div>
              </a>
              <a
                href="https://www.deq.virginia.gov/water/shortcuts/track-a-permit"
                target="_blank"
                rel="noopener noreferrer"
                className="card p-4 hover:border-brand-amber transition-colors border-2 border-transparent"
              >
                <div className="font-bold text-brand-navy mb-1">DEQ PEEP Tracker →</div>
                <div className="text-brand-navy/50 text-xs">deq.virginia.gov</div>
              </a>
              <a
                href="https://www.dpor.virginia.gov/RecordsandDocuments"
                target="_blank"
                rel="noopener noreferrer"
                className="card p-4 hover:border-brand-amber transition-colors border-2 border-transparent"
              >
                <div className="font-bold text-brand-navy mb-1">DPOR Public Records →</div>
                <div className="text-brand-navy/50 text-xs">dpor.virginia.gov</div>
              </a>
            </div>
          </div>
        )}

        {/* ── Takeoff Tool panel ── */}
        {activePanel === 'takeoff' && (
          <div className="space-y-6">
            <div className="card p-6">
              <div className="mb-5">
                <h2 className="font-display font-bold text-brand-navy text-xl mb-1">
                  Site Takeoff &amp; Visualization
                </h2>
                <p className="text-brand-navy/50 text-sm">
                  Enter an address to pull Solar API DSM data, view a 3D aerial video, or upload a
                  project photo for automatic polygon area measurement.
                </p>
              </div>
              <Suspense fallback={<MapLoader />}>
                <TakeoffMap />
              </Suspense>
            </div>

            {/* Info cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div className="card p-4 bg-blue-50 border-blue-100">
                <div className="font-bold text-blue-800 mb-1">☀️ Solar API</div>
                <div className="text-blue-700/70 text-xs">
                  DSM data, roof area, flux maps, and sunshine hours — ideal for precise site assessments.
                </div>
              </div>
              <div className="card p-4 bg-purple-50 border-purple-100">
                <div className="font-bold text-purple-800 mb-1">🎥 Aerial View API</div>
                <div className="text-purple-700/70 text-xs">
                  Cinematic 3D drone-like video for client presentations and project visualization.
                </div>
              </div>
              <div className="card p-4 bg-green-50 border-green-100">
                <div className="font-bold text-green-800 mb-1">📷 OpenCV Measure</div>
                <div className="text-green-700/70 text-xs">
                  Upload a job-site photo — edges are detected and polygon areas returned in square feet.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Analytics panel ── */}
        {activePanel === 'analytics' && <AnalyticsPanel />}

        {/* ── CRM Pipeline panel ── */}
        {activePanel === 'crm' && <CRMPanel />}

        {/* ── Weather panel ── */}
        {activePanel === 'weather' && <WeatherPanel />}

        {/* ── Material Prices panel ── */}
        {activePanel === 'materials' && <MaterialsPanel />}

        {/* ── Lien Calendar panel ── */}
        {activePanel === 'lien-calendar' && <LienCalendarPanel />}

        {/* ── Subcontractor Monitor panel ── */}
        {activePanel === 'subcontractors' && <SubcontractorPanel />}

        {/* ── Market Intelligence panel ── */}
        {activePanel === 'market-intel' && <MarketIntelPanel />}

        {/* ── Bottom CTA ── */}
        <section className="mt-12 bg-brand-navy rounded-2xl p-8 text-center text-white">
          <h2 className="font-display font-black text-2xl mb-3">Ready to Convert a Lead?</h2>
          <p className="text-white/70 mb-6 max-w-xl mx-auto text-sm">
            Use the permit feed to find new prospects, measure their site, and send a quote — all from
            the JWordenAI Command Center.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/quote" className="btn-primary">Get a Project Quote</Link>
            <Link to="/contact" className="btn-outline">Contact Our Team</Link>
          </div>
        </section>
      </div>
    </>
  )
}

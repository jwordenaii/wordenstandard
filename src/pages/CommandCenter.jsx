import { lazy, Suspense, useState, useCallback, useEffect, useMemo } from 'react'
import { Activity, AlertTriangle, CalendarDays, CircleCheckBig, Gauge, Loader2, Phone, ShieldCheck, UserRound } from 'lucide-react'
import { base44 } from '@/api/base44Client'

const RichmondGrid = lazy(() => import('../components/RichmondGrid'))

// ⚠️  SECURITY NOTE — client-side PIN is NOT real access control.
// VITE_ variables are bundled into the browser JavaScript bundle and are
// visible to anyone who inspects the page source or network requests.
// This PIN gate is a convenience deterrent only.
// For genuine protection, enable Netlify Password Protection (Pro plan) or
// deploy a Netlify Edge Function that validates a secret before serving the page.
// See the "Command Center — Edge Protection" section in netlify.toml for guidance.
const CC_PASSWORD = import.meta.env.VITE_CC_PASSWORD

const TABS = [
  { id: 'richmond-grid', label: 'Richmond Grid' },
  { id: 'kpi', label: 'KPI Wall' },
  { id: 'crm', label: 'CRM Leads' },
]

const KPI_CARDS = [
  { label: 'Inbound Leads (7d)', value: '42', delta: '+18%', tone: 'good', icon: UserRound },
  { label: 'Booked Site Visits', value: '19', delta: '+9%', tone: 'good', icon: CalendarDays },
  { label: 'Close Rate', value: '37%', delta: '+4.2%', tone: 'good', icon: Gauge },
  { label: 'Avg. First Reply', value: '5m 12s', delta: '-21%', tone: 'good', icon: Phone },
]

const CRM_LEADS = [
  { name: 'Carter Family', city: 'Chester', service: 'Driveway replacement', score: 92, status: 'Hot', next: 'Call at 5:30 PM' },
  { name: 'Maple Ridge HOA', city: 'Midlothian', service: 'Private lane resurfacing', score: 84, status: 'Warm', next: 'Send proposal PDF' },
  { name: 'Jenkins Auto', city: 'Richmond', service: 'Parking lot patch + seal', score: 76, status: 'Warm', next: 'Schedule site visit' },
  { name: 'Talbot Residence', city: 'Mechanicsville', service: 'Extension + apron', score: 66, status: 'Nurture', next: 'Follow up Thursday' },
]

const OPERATIONS_FEED = [
  { time: '09:42', text: 'New high-intent lead captured from Chester landing page', tone: 'good' },
  { time: '09:27', text: 'Proposal delivered to Maple Ridge HOA', tone: 'neutral' },
  { time: '08:58', text: 'Weather check flagged rain window for afternoon crew', tone: 'warn' },
  { time: '08:31', text: 'Review request automation sent for completed driveway job', tone: 'neutral' },
]

function statusTone(score) {
  if (score >= 85) return 'text-emerald-300 border-emerald-300/50 bg-emerald-300/10'
  if (score >= 70) return 'text-amber-300 border-amber-300/50 bg-amber-300/10'
  return 'text-sky-300 border-sky-300/50 bg-sky-300/10'
}

function KpiCard({ label, value, delta, tone, icon: Icon }) {
  const toneClass = tone === 'good' ? 'text-emerald-300' : tone === 'warn' ? 'text-amber-300' : 'text-white/70'

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 md:p-5 shadow-[0_14px_40px_rgba(0,0,0,0.22)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-white/55 text-xs uppercase tracking-[0.14em]">{label}</p>
          <p className="text-white text-2xl md:text-3xl font-black mt-2 leading-none">{value}</p>
          <p className={`text-xs font-semibold mt-3 ${toneClass}`}>{delta} vs previous period</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center">
          <Icon className="w-5 h-5 text-brand-amber" />
        </div>
      </div>
    </div>
  )
}

function SystemHealth() {
  const checks = [
    { label: 'Command Center PIN', ok: Boolean(import.meta.env.VITE_CC_PASSWORD) },
    { label: 'Google Maps key', ok: Boolean(import.meta.env.VITE_GOOGLE_MAPS_API_KEY) },
    { label: 'Avatar model override', ok: Boolean(import.meta.env.VITE_CONCIERGE_AVATAR_MODEL_URL || import.meta.env.VITE_CONCIERGE_AVATAR_MODEL_URLS) },
  ]

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 md:p-5">
      <div className="flex items-center gap-2 mb-4">
        <ShieldCheck className="w-4 h-4 text-brand-amber" />
        <h3 className="font-display font-bold text-white text-sm uppercase tracking-[0.12em]">System Health</h3>
      </div>
      <div className="space-y-2.5">
        {checks.map((check) => (
          <div key={check.label} className="flex items-center justify-between rounded-lg border border-white/10 bg-black/15 px-3 py-2">
            <span className="text-white/75 text-sm">{check.label}</span>
            <span className={`inline-flex items-center gap-1 text-xs font-semibold ${check.ok ? 'text-emerald-300' : 'text-amber-300'}`}>
              {check.ok ? <CircleCheckBig className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
              {check.ok ? 'Ready' : 'Needs setup'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ActivityFeed() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 md:p-5">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-4 h-4 text-brand-amber" />
        <h3 className="font-display font-bold text-white text-sm uppercase tracking-[0.12em]">Operations Feed</h3>
      </div>
      <div className="space-y-2.5">
        {OPERATIONS_FEED.map((item) => (
          <div key={`${item.time}-${item.text}`} className="rounded-lg border border-white/10 bg-black/15 px-3 py-2.5">
            <p className="text-[11px] text-white/45 font-semibold tracking-wide">{item.time}</p>
            <p className={`text-sm mt-1 ${item.tone === 'warn' ? 'text-amber-200' : item.tone === 'good' ? 'text-emerald-200' : 'text-white/80'}`}>{item.text}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function CrmTable() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] overflow-hidden">
      <div className="px-4 md:px-5 py-4 border-b border-white/10 flex items-center justify-between gap-3">
        <h3 className="font-display font-bold text-white text-sm uppercase tracking-[0.12em]">Active Leads Queue</h3>
        <span className="text-xs text-white/55">Sorted by lead score</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px]">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-[0.14em] text-white/45 border-b border-white/10">
              <th className="px-4 md:px-5 py-3">Lead</th>
              <th className="px-4 py-3">Service</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 md:px-5 py-3">Next Action</th>
            </tr>
          </thead>
          <tbody>
            {CRM_LEADS.map((lead) => (
              <tr key={lead.name} className="border-b border-white/10 last:border-b-0">
                <td className="px-4 md:px-5 py-3.5">
                  <p className="text-white text-sm font-semibold">{lead.name}</p>
                  <p className="text-white/50 text-xs mt-0.5">{lead.city}</p>
                </td>
                <td className="px-4 py-3.5 text-white/75 text-sm">{lead.service}</td>
                <td className="px-4 py-3.5">
                  <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${statusTone(lead.score)}`}>
                    {lead.score}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-white/75 text-sm">{lead.status}</td>
                <td className="px-4 md:px-5 py-3.5 text-brand-amber text-sm font-semibold">{lead.next}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ChannelPerformancePanel() {
  const [loading, setLoading] = useState(true)
  const [leads, setLeads] = useState([])

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        const all = await base44.entities.Lead.list('-created_date', 300)
        if (active) setLeads(Array.isArray(all) ? all : [])
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [])

  const channelRows = useMemo(() => {
    const since = new Date()
    since.setDate(since.getDate() - 30)

    const inWindow = leads.filter((lead) => {
      const created = new Date(lead.created_date || lead.created_at || 0)
      return created.toString() !== 'Invalid Date' && created >= since
    })

    const buckets = {
      geofencing: { leads: 0, won: 0, pipeline: 0 },
      backlink_partner: { leads: 0, won: 0, pipeline: 0 },
      referral: { leads: 0, won: 0, pipeline: 0 },
    }

    inWindow.forEach((lead) => {
      const source = String(lead.conversion_source || 'other')
      if (!buckets[source]) return
      buckets[source].leads += 1
      if (lead.status === 'won') buckets[source].won += 1
      if (lead.status !== 'won' && lead.status !== 'lost') {
        buckets[source].pipeline += Number(lead.estimated_value) || 0
      }
    })

    return Object.entries(buckets).map(([source, stats]) => ({
      source,
      ...stats,
      closeRate: stats.leads > 0 ? Math.round((stats.won / stats.leads) * 100) : 0,
    }))
  }, [leads])

  const topBacklinkDomains = useMemo(() => {
    const domains = {}
    leads.forEach((lead) => {
      if (lead.conversion_source !== 'backlink_partner' || !lead.backlink_domain) return
      const d = String(lead.backlink_domain).toLowerCase()
      domains[d] = (domains[d] || 0) + 1
    })

    return Object.entries(domains)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
  }, [leads])

  const topGeofenceCampaigns = useMemo(() => {
    const campaigns = {}
    leads.forEach((lead) => {
      if (lead.conversion_source !== 'geofencing' || !lead.geofence_campaign) return
      const c = String(lead.geofence_campaign)
      campaigns[c] = (campaigns[c] || 0) + 1
    })

    return Object.entries(campaigns)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
  }, [leads])

  const label = (source) => {
    if (source === 'geofencing') return 'Geofencing'
    if (source === 'backlink_partner') return 'Backlink Partner'
    if (source === 'referral') return 'Referral'
    return source
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 md:p-5">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h3 className="font-display font-bold text-white text-sm uppercase tracking-[0.12em]">
          Backlink + Geofence Performance (30d)
        </h3>
        <span className="text-xs text-white/45">Live from Lead records</span>
      </div>

      {loading ? (
        <div className="h-28 flex items-center justify-center text-white/50 text-sm">
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
          Loading source intelligence...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            {channelRows.map((row) => (
              <div key={row.source} className="rounded-xl border border-white/10 bg-black/20 p-3">
                <p className="text-[11px] uppercase tracking-[0.14em] text-white/45">{label(row.source)}</p>
                <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-white text-lg font-black leading-none">{row.leads}</p>
                    <p className="text-[10px] text-white/45 uppercase mt-1">Leads</p>
                  </div>
                  <div>
                    <p className="text-emerald-300 text-lg font-black leading-none">{row.closeRate}%</p>
                    <p className="text-[10px] text-white/45 uppercase mt-1">Close</p>
                  </div>
                  <div>
                    <p className="text-brand-amber text-lg font-black leading-none">${Math.round(row.pipeline / 1000)}k</p>
                    <p className="text-[10px] text-white/45 uppercase mt-1">Pipeline</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
            <div className="rounded-xl border border-white/10 bg-black/20 p-3">
              <p className="text-[11px] uppercase tracking-[0.14em] text-white/45 mb-2">Top Backlink Domains</p>
              {topBacklinkDomains.length === 0 ? (
                <p className="text-sm text-white/55">No backlink domain data yet.</p>
              ) : (
                <ul className="space-y-1.5">
                  {topBacklinkDomains.map(([domain, count]) => (
                    <li key={domain} className="text-sm text-white/80 flex items-center justify-between gap-3">
                      <span className="truncate">{domain}</span>
                      <span className="text-brand-amber font-semibold">{count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-xl border border-white/10 bg-black/20 p-3">
              <p className="text-[11px] uppercase tracking-[0.14em] text-white/45 mb-2">Top Geofence Campaigns</p>
              {topGeofenceCampaigns.length === 0 ? (
                <p className="text-sm text-white/55">No geofence campaign tags yet.</p>
              ) : (
                <ul className="space-y-1.5">
                  {topGeofenceCampaigns.map(([campaign, count]) => (
                    <li key={campaign} className="text-sm text-white/80 flex items-center justify-between gap-3">
                      <span className="truncate">{campaign}</span>
                      <span className="text-brand-amber font-semibold">{count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function HumanApprovalPolicyPanel() {
  const policyRules = [
    {
      rule: 'Ad Budget Change > 20% day-over-day',
      level: 'Human Required',
      reason: 'Protect spend volatility and prevent runaway CAC',
      owner: 'Marketing Lead',
    },
    {
      rule: 'Any new public landing page publish',
      level: 'Human Required',
      reason: 'Claim/legal/brand QA before public indexation',
      owner: 'Growth + Brand',
    },
    {
      rule: 'Price or discount policy modification',
      level: 'Human Required',
      reason: 'Margin protection and offer consistency',
      owner: 'Owner/GM',
    },
    {
      rule: 'Auto-reply with comparative competitor claims',
      level: 'Human Required',
      reason: 'Reduce legal and reputational risk',
      owner: 'Reputation Lead',
    },
    {
      rule: 'Automated low-risk bid optimizations within thresholds',
      level: 'Auto Allowed',
      reason: 'Fast optimization under bounded controls',
      owner: 'AI Optimizer',
    },
  ]

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 md:p-5">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h3 className="font-display font-bold text-white text-sm uppercase tracking-[0.12em]">
          Human Approval Policy
        </h3>
        <span className="text-xs text-white/45">Hard stops for irreversible actions</span>
      </div>

      <div className="space-y-2.5">
        {policyRules.map((item) => {
          const requiresHuman = item.level === 'Human Required'
          return (
            <div key={item.rule} className="rounded-xl border border-white/10 bg-black/20 px-3 py-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-white font-semibold">{item.rule}</p>
                <span
                  className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${
                    requiresHuman
                      ? 'border-amber-300/50 bg-amber-300/10 text-amber-200'
                      : 'border-emerald-300/50 bg-emerald-300/10 text-emerald-200'
                  }`}
                >
                  {item.level}
                </span>
              </div>
              <p className="text-xs text-white/60 mt-1.5">{item.reason}</p>
              <p className="text-[11px] text-brand-amber mt-1.5">Owner: {item.owner}</p>
            </div>
          )
        })}
      </div>

      <div className="mt-4 rounded-xl border border-amber-300/30 bg-amber-300/10 px-3 py-2.5">
        <p className="text-xs text-amber-100 leading-relaxed">
          Governance standard: monitor and draft automatically, but require a human approval event for budget jumps, public publishing, pricing changes, and legal-risk messaging.
        </p>
      </div>
    </div>
  )
}

function PinGate({ onUnlock }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault()
      if (pin === CC_PASSWORD) {
        onUnlock()
      } else {
        setError(true)
        setPin('')
      }
    },
    [pin, onUnlock],
  )

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-sm rounded-2xl border border-brand-navy/10 bg-white p-8 shadow-xl text-center">
        <div className="w-14 h-14 rounded-xl bg-brand-navy flex items-center justify-center text-brand-amber text-2xl mx-auto mb-6">
          🔒
        </div>
        <h2 className="font-display font-bold text-2xl text-brand-navy mb-2">Command Center</h2>
        <p className="text-brand-navy/55 text-sm mb-6">Enter your access PIN to continue.</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="password"
            autoComplete="current-password"
            placeholder="PIN"
            value={pin}
            onChange={(e) => {
              setPin(e.target.value)
              setError(false)
            }}
            className="w-full rounded-lg border border-brand-navy/20 px-4 py-3 text-center tracking-widest text-lg focus:outline-none focus:ring-2 focus:ring-brand-amber"
          />
          {error && (
            <p className="text-red-500 text-sm">Incorrect PIN. Try again.</p>
          )}
          <button type="submit" className="btn-primary py-3">
            Unlock
          </button>
        </form>
      </div>
    </div>
  )
}

function DisabledNotice() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
        <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center text-white/40 text-2xl mx-auto mb-6">
          🚫
        </div>
        <h2 className="font-display font-bold text-xl text-white mb-2">Not Available</h2>
        <p className="text-white/50 text-sm">
          Command Center is not configured in this environment.
          <br />
          Set <code className="bg-white/10 px-1 rounded text-xs">VITE_CC_PASSWORD</code> to enable access.
        </p>
      </div>
    </div>
  )
}

export default function CommandCenter() {
  const [activeTab, setActiveTab] = useState('richmond-grid')
  // Never auto-unlock — require an explicit PIN entry every session.
  // When CC_PASSWORD is not configured the body renders DisabledNotice instead.
  const [unlocked, setUnlocked] = useState(false)

  const handleUnlock = useCallback(() => setUnlocked(true), [])
  const now = new Date()

  return (
    <div className="min-h-screen bg-brand-navy text-white">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="border-b border-white/10 bg-brand-navy/95 sticky top-0 z-30">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-display font-black text-xl sm:text-2xl text-white leading-tight">
              JWordenAI Command Center
            </h1>
            <p className="text-white/40 text-xs mt-0.5">Internal operations dashboard</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/20 text-white/60 text-xs font-semibold px-3 py-1">
              Internal
            </span>
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-brand-amber/20 border border-brand-amber/40 text-brand-amber text-xs font-semibold px-3 py-1">
              Live {now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
            </span>
          </div>
        </div>

        {/* ── Tab bar ──────────────────────────────────────────────────────── */}
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 flex gap-1 pb-0 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={[
                'shrink-0 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors',
                activeTab === tab.id
                  ? 'border-brand-amber text-brand-amber'
                  : 'border-transparent text-white/50 hover:text-white/80',
              ].join(' ')}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6">
        {!CC_PASSWORD ? (
          <DisabledNotice />
        ) : !unlocked ? (
          <PinGate onUnlock={handleUnlock} />
        ) : (
          <>
            {activeTab === 'richmond-grid' && (
              <Suspense
                fallback={
                  <div className="flex items-center justify-center h-96 text-white/50">
                    Loading map…
                  </div>
                }
              >
                <RichmondGrid />
              </Suspense>
            )}

            {activeTab === 'kpi' && (
              <div className="space-y-4 md:space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
                  {KPI_CARDS.map((card) => (
                    <KpiCard key={card.label} {...card} />
                  ))}
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-5">
                  <div className="xl:col-span-2">
                    <ActivityFeed />
                  </div>
                  <div>
                    <SystemHealth />
                  </div>
                </div>

                <HumanApprovalPolicyPanel />
              </div>
            )}

            {activeTab === 'crm' && (
              <div className="space-y-4 md:space-y-5">
                <CrmTable />
                <ChannelPerformancePanel />
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 md:px-5 py-4 text-sm text-white/70">
                  Priority Playbook: Focus calls on leads above 80 first, schedule site visits before 6 PM, and send proposal PDFs within 30 minutes of each visit.
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

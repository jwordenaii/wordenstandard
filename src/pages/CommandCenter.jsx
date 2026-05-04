import { lazy, Suspense, useState, useCallback, useEffect, useMemo } from 'react'
import { Activity, AlertTriangle, CalendarDays, CircleCheckBig, Gauge, Loader2, Phone, ShieldCheck, UserRound, Upload, Bot, Sparkles, RefreshCw, Layers, Globe, Box, Layout, ArrowRight, FileText, Scale, HardHat } from 'lucide-react'
import { api } from '@/api/client'
import { Link } from 'react-router-dom'
import states from '../data/legal/states'
import constructionLicensing from '../data/legal/constructionLicensing'
import mechanicsLienLaws from '../data/legal/mechanicsLienLaws'
import promptPaymentLaws from '../data/legal/promptPaymentLaws'
import contractLaw from '../data/legal/contractLaw'
import roadsAndPavingRegulations from '../data/legal/roadsAndPavingRegulations'
import { recommendStrategy, rankStatesByDispute, DISPUTE_TYPES, ROLES } from '../lib/lawyerRecommender'
import { optimizeLicenseStates, getLienLeverageByState, rankContractorBids } from '../lib/contractorRanker'

const RichmondGrid = lazy(() => import('../components/RichmondGrid'))
const INTERNAL_STRATEGY_ENABLED = true

function isCommandCenterPath() {
  if (typeof window === 'undefined') return false
  const path = String(window.location.pathname || '')
  return path === '/command-center' || path.startsWith('/command-center/')
}

const TABS = [
  { id: 'richmond-grid', label: 'Richmond Grid' },
  { id: 'kpi', label: 'KPI Wall' },
  { id: 'crm', label: 'CRM Leads' },
  { id: 'ops', label: 'Ops Pipeline' },
  { id: 'civil-intel', label: 'Civil Intel' },
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

const AUTOMATION_LOG_KEY = 'cc_automation_run_log_v1'
const WEEKEND_SPRINT_STATE_KEY = 'cc_weekend_sprint_state_v1'
const HUMAN_CHECKS_STATE_KEY = 'cc_human_checks_state_v1'
const GOOGLE_ADS_BUDGET_STATE_KEY = 'cc_google_ads_budget_state_v1'

function readAutomationRuns() {
  try {
    if (typeof window === 'undefined') return []
    const raw = localStorage.getItem(AUTOMATION_LOG_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function appendAutomationRun(run) {
  try {
    if (typeof window === 'undefined') return
    const next = [run, ...readAutomationRuns()].slice(0, 80)
    localStorage.setItem(AUTOMATION_LOG_KEY, JSON.stringify(next))
    window.dispatchEvent(new CustomEvent('cc:automation-run-updated'))
  } catch {
    // Keep UI resilient even if storage fails.
  }
}

function readWeekendSprintState() {
  try {
    if (typeof window === 'undefined') return null
    const raw = localStorage.getItem(WEEKEND_SPRINT_STATE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

function writeWeekendSprintState(payload) {
  try {
    if (typeof window === 'undefined') return
    localStorage.setItem(WEEKEND_SPRINT_STATE_KEY, JSON.stringify(payload))
  } catch {
    // Keep dashboard usable if localStorage is unavailable.
  }
}

function parseBoolLike(input) {
  const value = String(input || '').trim().toLowerCase()
  return ['1', 'true', 'yes', 'up', 'ready', 'ok', 'healthy', 'configured'].includes(value)
}

// ── Shared UI Components ───────────────────────────────────────────────────

function HubLinkPanel() {
  const hubs = [
    {
      title: 'Level 4 Autonomy',
      desc: 'Cognitive Digital Twin & Drift Remediation',
      path: '/autonomy',
      icon: Layers,
      color: 'text-amber-400',
      bg: 'bg-amber-400/10',
    },
    {
      title: 'Virginia Statewide Hub',
      desc: 'SCC Verifier & VDOT Bid Board',
      path: '/virginia-statewide',
      icon: Globe,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
    },
    {
      title: '3D Floor Plan Studio',
      desc: 'Houzz-style Visualizer & Cost Catalog',
      path: '/floor-plan-studio',
      icon: Box,
      color: 'text-emerald-400',
      bg: 'bg-emerald-400/10',
    },
    {
      title: 'Enterprise AI Platform',
      desc: 'Licensed L4 Controls & Agent Registry',
      path: '/jwordenai',
      icon: Layout,
      color: 'text-purple-400',
      bg: 'bg-purple-400/10',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {hubs.map((hub) => (
        <Link
          key={hub.path}
          to={hub.path}
          className="group block rounded-2xl border border-white/10 bg-white/[0.03] p-5 hover:bg-white/[0.06] hover:border-white/20 transition-all"
        >
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${hub.bg} ${hub.color}`}>
              <hub.icon className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-display font-bold text-white text-base group-hover:text-brand-amber transition-colors">
                {hub.title}
              </h3>
              <p className="text-white/40 text-xs mt-0.5 truncate">{hub.desc}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-brand-amber group-hover:translate-x-1 transition-all" />
          </div>
        </Link>
      ))}
    </div>
  )
}

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
    { label: 'Auth mode set', ok: Boolean(import.meta.env.VITE_AUTH_MODE) },
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

function ApiKeysPanel() {
  const publicVars = [
    {
      keyName: 'VITE_CC_PASSWORD',
      required: true,
      valuePresent: Boolean(import.meta.env.VITE_CC_PASSWORD),
      purpose: 'Command Center unlock gate',
    },
    {
      keyName: 'VITE_GOOGLE_MAPS_API_KEY',
      required: true,
      valuePresent: Boolean(import.meta.env.VITE_GOOGLE_MAPS_API_KEY),
      purpose: 'Maps + location visuals',
    },
    {
      keyName: 'VITE_CONCIERGE_AVATAR_MODEL_URL / VITE_CONCIERGE_AVATAR_MODEL_URLS',
      required: false,
      valuePresent: Boolean(import.meta.env.VITE_CONCIERGE_AVATAR_MODEL_URL || import.meta.env.VITE_CONCIERGE_AVATAR_MODEL_URLS),
      purpose: 'Custom avatar model',
    },
    {
      keyName: 'VITE_AUTH_MODE',
      required: true,
      valuePresent: Boolean(import.meta.env.VITE_AUTH_MODE),
      purpose: 'Public/internal auth behavior',
    },
  ]

  const privateSecrets = [
    {
      keyName: 'OPENAI_API_KEY',
      required: true,
      purpose: 'AI chat + vision backend',
      location: 'Backend secret env only',
    },
    {
      keyName: 'GEMINI_API_KEY',
      required: false,
      purpose: 'Google Gemini provider for Google-aligned research/content workflows',
      location: 'Backend/automation secret env only',
    },
    {
      keyName: 'PERPLEXITY_API_KEY',
      required: false,
      purpose: 'Perplexity provider for web-grounded research workflows',
      location: 'Backend/automation secret env only',
    },
    {
      keyName: 'ANTHROPIC_API_KEY',
      required: false,
      purpose: 'Claude provider for math-heavy and long-context reasoning',
      location: 'Backend/automation secret env only',
    },
    {
      keyName: 'OPENAI_CODEX_MODEL',
      required: false,
      purpose: 'Codex model target for file/code task routing',
      location: 'Backend/automation env config',
    },
    {
      keyName: 'XAI_API_KEY (Grok)',
      required: false,
      purpose: 'Grok (xAI) model calls for X workflow automation',
      location: 'Backend/automation secret env only',
    },
    {
      keyName: 'X_BEARER_TOKEN',
      required: false,
      purpose: 'Read/listen operations for X APIs',
      location: 'Backend/automation secret env only',
    },
    {
      keyName: 'X_API_KEY + X_API_SECRET',
      required: false,
      purpose: 'X app authentication for posting and account actions',
      location: 'Backend/automation secret env only',
    },
    {
      keyName: 'X_ACCESS_TOKEN + X_ACCESS_TOKEN_SECRET',
      required: false,
      purpose: 'User-context posting/actions on X account',
      location: 'Backend/automation secret env only',
    },
    {
      keyName: 'DROPBOX_ACCESS_TOKEN',
      required: false,
      purpose: 'Dropbox media pull for gallery ingest CLI',
      location: 'CLI terminal/runner env only',
    },
    {
      keyName: 'DROPBOX_PATH',
      required: false,
      purpose: 'Optional Dropbox import folder path',
      location: 'CLI terminal/runner env only',
    },
    {
      keyName: 'GOOGLE_PHOTOS_ACCESS_TOKEN',
      required: false,
      purpose: 'Google Photos media pull for gallery ingest CLI',
      location: 'CLI terminal/runner env only',
    },
    {
      keyName: 'GOOGLE_PHOTOS_ALBUM_ID',
      required: false,
      purpose: 'Optional Google Photos album scope',
      location: 'CLI terminal/runner env only',
    },
    {
      keyName: 'SENTRY_DSN',
      required: false,
      purpose: 'Error monitoring + performance tracing backend integration',
      location: 'Backend secret env only',
    },
  ]

  const publicReadyCount = publicVars.filter((v) => v.valuePresent).length
  const publicRequiredCount = publicVars.filter((v) => v.required).length
  const publicRequiredReady = publicVars.filter((v) => v.required && v.valuePresent).length

  const modelRouting = [
    { task: 'Google workflows', provider: 'Gemini', envKey: 'GEMINI_API_KEY' },
    { task: 'Research briefs', provider: 'Perplexity', envKey: 'PERPLEXITY_API_KEY' },
    { task: 'Math reasoning', provider: 'Claude', envKey: 'ANTHROPIC_API_KEY' },
    { task: 'File/code ops', provider: 'Codex', envKey: 'OPENAI_API_KEY + OPENAI_CODEX_MODEL' },
  ]

  const keySources = [
    {
      envKey: 'OPENAI_API_KEY',
      provider: 'OpenAI',
      portalUrl: 'https://platform.openai.com/api-keys',
      note: 'Create secret key for AI chat/vision + Codex routing baseline.',
    },
    {
      envKey: 'GEMINI_API_KEY',
      provider: 'Google AI Studio',
      portalUrl: 'https://aistudio.google.com/app/apikey',
      note: 'Create Gemini key for Google-aligned workflows.',
    },
    {
      envKey: 'PERPLEXITY_API_KEY',
      provider: 'Perplexity',
      portalUrl: 'https://www.perplexity.ai/settings/api',
      note: 'Create API key for research briefs and web-grounded tasks.',
    },
    {
      envKey: 'ANTHROPIC_API_KEY',
      provider: 'Anthropic Console',
      portalUrl: 'https://console.anthropic.com/settings/keys',
      note: 'Create Claude key for math + long-context reasoning.',
    },
    {
      envKey: 'XAI_API_KEY',
      provider: 'xAI Console',
      portalUrl: 'https://console.x.ai/',
      note: 'Create Grok API key for X automation workflows.',
    },
    {
      envKey: 'X_BEARER_TOKEN / X_* tokens',
      provider: 'X Developer Portal',
      portalUrl: 'https://developer.x.com/en/portal/dashboard',
      note: 'Create app + user tokens for X posting/listening automations.',
    },
    {
      envKey: 'DROPBOX_ACCESS_TOKEN',
      provider: 'Dropbox App Console',
      portalUrl: 'https://www.dropbox.com/developers/apps',
      note: 'Generate access token for media ingest CLI.',
    },
    {
      envKey: 'GOOGLE_PHOTOS_ACCESS_TOKEN',
      provider: 'Google Cloud Console',
      portalUrl: 'https://console.cloud.google.com/apis/credentials',
      note: 'Create OAuth client + token for Google Photos ingest.',
    },
    {
      envKey: 'SENTRY_DSN',
      provider: 'Sentry',
      portalUrl: 'https://sentry.io/settings/',
      note: 'Create project DSN for backend error + performance monitoring.',
    },
  ]

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 md:p-5">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h3 className="font-display font-bold text-white text-sm uppercase tracking-[0.12em]">
          API Keys + Secrets Checklist
        </h3>
        <span className="text-xs text-white/45">
          Public ready: {publicReadyCount}/{publicVars.length} · Required: {publicRequiredReady}/{publicRequiredCount}
        </span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          <p className="text-[11px] uppercase tracking-[0.14em] text-white/45 mb-2">Public App Variables (VITE)</p>
          <div className="space-y-2">
            {publicVars.map((item) => (
              <div key={item.keyName} className="rounded-lg border border-white/10 bg-black/25 px-3 py-2">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-white text-xs font-semibold break-all">{item.keyName}</p>
                  <span className={`text-[10px] font-bold uppercase tracking-[0.12em] ${item.valuePresent ? 'text-emerald-300' : 'text-amber-300'}`}>
                    {item.valuePresent ? 'Set' : 'Missing'}
                  </span>
                </div>
                <p className="text-white/55 text-[11px] mt-1">{item.purpose}{item.required ? ' (required)' : ' (optional)'}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          <p className="text-[11px] uppercase tracking-[0.14em] text-white/45 mb-2">Private Ops Secrets (Do Not Use VITE)</p>
          <div className="space-y-2">
            {privateSecrets.map((item) => (
              <div key={item.keyName} className="rounded-lg border border-white/10 bg-black/25 px-3 py-2">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-white text-xs font-semibold break-all">{item.keyName}</p>
                  <span className={`text-[10px] font-bold uppercase tracking-[0.12em] ${item.required ? 'text-amber-300' : 'text-sky-300'}`}>
                    {item.required ? 'Required' : 'Optional'}
                  </span>
                </div>
                <p className="text-white/55 text-[11px] mt-1">{item.purpose}</p>
                <p className="text-brand-amber text-[11px] mt-1">{item.location}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3">
        <p className="text-[11px] uppercase tracking-[0.14em] text-white/45 mb-2">Model Routing Policy</p>
        <div className="space-y-2">
          {modelRouting.map((row) => (
            <div key={row.task} className="rounded-lg border border-white/10 bg-black/25 px-3 py-2 flex items-center justify-between gap-3">
              <div>
                <p className="text-white text-xs font-semibold">{row.task}</p>
                <p className="text-white/55 text-[11px] mt-0.5">Env: {row.envKey}</p>
              </div>
              <span className="text-brand-amber text-xs font-bold uppercase tracking-[0.12em]">{row.provider}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3">
        <p className="text-[11px] uppercase tracking-[0.14em] text-white/45 mb-2">Get Keys Fast</p>
        <div className="space-y-2">
          {keySources.map((row) => (
            <div key={row.envKey} className="rounded-lg border border-white/10 bg-black/25 px-3 py-2">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2">
                <div>
                  <p className="text-white text-xs font-semibold break-all">{row.envKey}</p>
                  <p className="text-white/55 text-[11px] mt-0.5">{row.note}</p>
                  <p className="text-brand-amber text-[11px] mt-0.5">{row.provider}</p>
                </div>

                <a
                  href={row.portalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center rounded-lg border border-brand-amber/40 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.12em] text-brand-amber hover:bg-brand-amber/10"
                >
                  Open Portal
                </a>
              </div>
            </div>
          ))}
        </div>
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

function formatTimestamp(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function OperationsPipelinePanel() {
  const [loading, setLoading] = useState(true)
  const [creatingEstimateId, setCreatingEstimateId] = useState(null)
  const [creatingJobId, setCreatingJobId] = useState(null)
  const [creatingWorkOrderId, setCreatingWorkOrderId] = useState(null)
  const [error, setError] = useState('')
  const [statusNote, setStatusNote] = useState('')
  const [recentLeads, setRecentLeads] = useState([])
  const [estimates, setEstimates] = useState([])
  const [jobs, setJobs] = useState([])

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [leadData, estimateData, jobData] = await Promise.all([
        api.listRecentOperationalLeads(8),
        api.listEstimates(),
        api.listJobs(),
      ])
      setRecentLeads(Array.isArray(leadData?.leads) ? leadData.leads : [])
      setEstimates(Array.isArray(estimateData?.estimates) ? estimateData.estimates : [])
      setJobs(Array.isArray(jobData?.jobs) ? jobData.jobs : [])
    } catch (loadError) {
      setError(loadError?.message || 'Could not load operations pipeline.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleCreateEstimate = useCallback(async (lead) => {
    setCreatingEstimateId(lead.id)
    setStatusNote('')
    setError('')
    try {
      await api.createEstimateFromLead(lead.id, lead.address ? `Operational estimate for ${lead.address}` : undefined)
      setStatusNote(`Estimate created from lead #${lead.id}.`)
      await loadData()
    } catch (createError) {
      setError(createError?.message || 'Could not create estimate.')
    } finally {
      setCreatingEstimateId(null)
    }
  }, [loadData])

  const handleCreateJob = useCallback(async (estimate) => {
    setCreatingJobId(estimate.id)
    setStatusNote('')
    setError('')
    try {
      await api.createJobFromEstimate(estimate.id, {
        name: `${estimate.service_type || 'Project'} execution ${estimate.estimate_number}`,
      })
      setStatusNote(`Job created from ${estimate.estimate_number}.`)
      await loadData()
    } catch (createError) {
      setError(createError?.message || 'Could not create job.')
    } finally {
      setCreatingJobId(null)
    }
  }, [loadData])

  const handleCreateWorkOrder = useCallback(async (job) => {
    setCreatingWorkOrderId(job.id)
    setStatusNote('')
    setError('')
    try {
      await api.createWorkOrder({
        job_id: job.id,
        title: `Dispatch ${job.job_number}`,
        assigned_crew: 'Crew A',
      })
      setStatusNote(`Work order created for ${job.job_number}.`)
      await loadData()
    } catch (createError) {
      setError(createError?.message || 'Could not create work order.')
    } finally {
      setCreatingWorkOrderId(null)
    }
  }, [loadData])

  return (
    <div className="space-y-4 md:space-y-5">
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 md:p-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-display font-bold text-white text-sm uppercase tracking-[0.12em]">Operations Pipeline</h3>
            <p className="text-white/55 text-sm mt-1">Turn fresh leads into estimates, jobs, and work orders from one protected flow.</p>
          </div>
          <button
            type="button"
            onClick={loadData}
            className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-white/75 hover:border-brand-amber/40 hover:text-brand-amber"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>

        {error ? <div className="mb-3 rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-200">{error}</div> : null}
        {statusNote ? <div className="mb-3 rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-200">{statusNote}</div> : null}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="rounded-xl border border-white/10 bg-black/20 p-3">
            <p className="text-[11px] uppercase tracking-[0.14em] text-white/45 mb-3">Recent Leads</p>
            <div className="space-y-2.5">
              {loading ? <p className="text-sm text-white/50">Loading leads…</p> : recentLeads.map((lead) => (
                <div key={lead.id} className="rounded-lg border border-white/10 bg-black/25 px-3 py-2.5">
                  <p className="text-white text-sm font-semibold">#{lead.id} {lead.name || 'Lead'}</p>
                  <p className="text-white/55 text-xs mt-0.5">{lead.service_type || 'Service TBD'} · {lead.address || lead.state_code || 'No address yet'}</p>
                  <p className="text-white/35 text-[11px] mt-1">{formatTimestamp(lead.created_at)}</p>
                  <button
                    type="button"
                    onClick={() => handleCreateEstimate(lead)}
                    disabled={creatingEstimateId === lead.id}
                    className="mt-3 inline-flex items-center gap-2 rounded-lg bg-brand-amber px-3 py-2 text-[11px] font-black uppercase tracking-[0.12em] text-brand-navy disabled:opacity-50"
                  >
                    {creatingEstimateId === lead.id ? 'Creating…' : 'Create Estimate'}
                  </button>
                </div>
              ))}
              {!loading && recentLeads.length === 0 ? <p className="text-sm text-white/50">No recent leads available.</p> : null}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/20 p-3">
            <p className="text-[11px] uppercase tracking-[0.14em] text-white/45 mb-3">Estimates</p>
            <div className="space-y-2.5">
              {loading ? <p className="text-sm text-white/50">Loading estimates…</p> : estimates.slice(0, 8).map((estimate) => (
                <div key={estimate.id} className="rounded-lg border border-white/10 bg-black/25 px-3 py-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-white text-sm font-semibold">{estimate.estimate_number}</p>
                      <p className="text-white/55 text-xs mt-0.5">Lead #{estimate.lead_id} · {estimate.status}</p>
                    </div>
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold ${estimate.status === 'converted' ? 'text-emerald-300 border-emerald-300/50 bg-emerald-300/10' : 'text-amber-300 border-amber-300/50 bg-amber-300/10'}`}>
                      {estimate.status}
                    </span>
                  </div>
                  <p className="text-brand-amber text-xs mt-2">${Math.round(Number(estimate.amount_low || 0)).toLocaleString()} - ${Math.round(Number(estimate.amount_high || 0)).toLocaleString()}</p>
                  <button
                    type="button"
                    onClick={() => handleCreateJob(estimate)}
                    disabled={creatingJobId === estimate.id || estimate.status === 'converted'}
                    className="mt-3 inline-flex items-center gap-2 rounded-lg border border-brand-amber/40 px-3 py-2 text-[11px] font-black uppercase tracking-[0.12em] text-brand-amber disabled:opacity-50"
                  >
                    {creatingJobId === estimate.id ? 'Creating…' : estimate.status === 'converted' ? 'Converted' : 'Create Job'}
                  </button>
                </div>
              ))}
              {!loading && estimates.length === 0 ? <p className="text-sm text-white/50">No estimates created yet.</p> : null}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/20 p-3">
            <p className="text-[11px] uppercase tracking-[0.14em] text-white/45 mb-3">Jobs Ready For Dispatch</p>
            <div className="space-y-2.5">
              {loading ? <p className="text-sm text-white/50">Loading jobs…</p> : jobs.slice(0, 8).map((job) => (
                <div key={job.id} className="rounded-lg border border-white/10 bg-black/25 px-3 py-2.5">
                  <p className="text-white text-sm font-semibold">{job.job_number}</p>
                  <p className="text-white/55 text-xs mt-0.5">{job.name}</p>
                  <p className="text-white/35 text-[11px] mt-1">Estimate #{job.estimate_id} · {job.status}</p>
                  <button
                    type="button"
                    onClick={() => handleCreateWorkOrder(job)}
                    disabled={creatingWorkOrderId === job.id}
                    className="mt-3 inline-flex items-center gap-2 rounded-lg border border-sky-300/40 px-3 py-2 text-[11px] font-black uppercase tracking-[0.12em] text-sky-300 disabled:opacity-50"
                  >
                    {creatingWorkOrderId === job.id ? 'Creating…' : 'Create Work Order'}
                  </button>
                </div>
              ))}
              {!loading && jobs.length === 0 ? <p className="text-sm text-white/50">No jobs created yet.</p> : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function AuditFeedPanel() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [events, setEvents] = useState([])

  const loadEvents = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await api.listAuditEvents({ limit: 12 })
      setEvents(Array.isArray(data?.events) ? data.events : [])
    } catch (loadError) {
      setError(loadError?.message || 'Could not load audit feed.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadEvents()
  }, [loadEvents])

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 md:p-5">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="font-display font-bold text-white text-sm uppercase tracking-[0.12em]">Audit Feed</h3>
          <p className="text-white/55 text-sm mt-1">Live operational evidence from the protected backend audit stream.</p>
        </div>
        <button
          type="button"
          onClick={loadEvents}
          className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-white/75 hover:border-brand-amber/40 hover:text-brand-amber"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {error ? <div className="mb-3 rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-200">{error}</div> : null}

      <div className="space-y-2.5">
        {loading ? <p className="text-sm text-white/50">Loading audit feed…</p> : events.map((event) => (
          <div key={event.id} className="rounded-lg border border-white/10 bg-black/20 px-3 py-2.5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-white text-sm font-semibold">{event.event_type}</p>
                <p className="text-white/55 text-xs mt-0.5">{event.summary}</p>
              </div>
              <span className="text-[11px] text-white/35">{formatTimestamp(event.created_at)}</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-white/45">
              <span className="rounded-full border border-white/10 px-2 py-1">Actor: {event.actor_type}</span>
              <span className="rounded-full border border-white/10 px-2 py-1">Entity: {event.entity_type || '—'} {event.entity_id || ''}</span>
            </div>
          </div>
        ))}
        {!loading && events.length === 0 ? <p className="text-sm text-white/50">No audit events available.</p> : null}
      </div>
    </div>
  )
}

function normalizePhone(value) {
  return String(value || '').replace(/\D/g, '')
}

function toTier(score) {
  const s = Number(score || 0)
  if (s >= 85) return 'hot'
  if (s >= 65) return 'warm'
  if (s >= 40) return 'cool'
  return 'cold'
}

function MrWordenAutopilotPanel() {
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [autopiloting, setAutopiloting] = useState(false)
  const [syncNote, setSyncNote] = useState('')
  const [leads, setLeads] = useState([])

  const loadLeads = useCallback(async () => {
    const all = await api.entities.Lead.list('-created_date', 300)
    setLeads(Array.isArray(all) ? all : [])
    setLoading(false)
  }, [])

  useEffect(() => {
    loadLeads()
  }, [loadLeads])

  const ranked = useMemo(() => {
    return [...leads]
      .filter((lead) => lead.status !== 'won' && lead.status !== 'lost' && lead.score != null)
      .sort((a, b) => Number(b.score || 0) - Number(a.score || 0))
      .slice(0, 8)
  }, [leads])

  const autopilotQueue = useMemo(() => {
    return ranked.filter((lead) => ['hot', 'warm'].includes(String(lead.score_tier || toTier(lead.score))))
  }, [ranked])

  const applyAutopilot = useCallback(async () => {
    if (autopilotQueue.length === 0) {
      setSyncNote('No hot/warm leads to autopilot right now.')
      appendAutomationRun({
        id: `run_${Date.now()}`,
        type: 'autopilot-followup',
        status: 'skipped',
        started_at: new Date().toISOString(),
        ended_at: new Date().toISOString(),
        detail: 'No hot/warm leads available for follow-up.',
      })
      return
    }

    const started = new Date().toISOString()
    setAutopiloting(true)
    try {
      let updated = 0
      const now = new Date().toISOString()

      for (const lead of autopilotQueue) {
        const existingNotes = String(lead.notes || '')
        const nextAction = `Autopilot follow-up queued (${now}): Call now and send estimate intake link.`
        await api.entities.Lead.update(lead.id, {
          status: 'contacted',
          sms_followup_sent: true,
          sms_followup_sent_at: now,
          notes: [existingNotes, nextAction].filter(Boolean).join('\n\n'),
        })
        updated += 1
      }

      setSyncNote(`Autopilot queued follow-up on ${updated} high-priority lead(s).`)
      appendAutomationRun({
        id: `run_${Date.now()}`,
        type: 'autopilot-followup',
        status: 'success',
        started_at: started,
        ended_at: new Date().toISOString(),
        detail: `Queued follow-up for ${updated} lead(s).`,
      })
      await loadLeads()
    } catch (error) {
      appendAutomationRun({
        id: `run_${Date.now()}`,
        type: 'autopilot-followup',
        status: 'failed',
        started_at: started,
        ended_at: new Date().toISOString(),
        detail: `Autopilot failed: ${error?.message || 'unknown error'}`,
      })
      throw error
    } finally {
      setAutopiloting(false)
    }
  }, [autopilotQueue, loadLeads])

  useEffect(() => {
    const retryHandler = () => {
      applyAutopilot().catch(() => {
        // Error is already logged in automation run log.
      })
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('cc:retry-autopilot', retryHandler)
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('cc:retry-autopilot', retryHandler)
      }
    }
  }, [applyAutopilot])

  const handleSyncCliFile = useCallback(async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    setSyncing(true)
    setSyncNote('')
    const started = new Date().toISOString()
    try {
      const text = await file.text()
      const parsed = JSON.parse(text)
      const records = Array.isArray(parsed?.autopilot_queue)
        ? parsed.autopilot_queue
        : Array.isArray(parsed?.top_priority)
          ? parsed.top_priority
          : []

      if (records.length === 0) {
        setSyncNote('No syncable records found in uploaded file.')
        return
      }

      const existing = await api.entities.Lead.list('-created_date', 500)
      const pool = Array.isArray(existing) ? existing : []

      let created = 0
      let updated = 0

      for (const item of records) {
        const signals = item?.signals || {}
        const intent = item?.intent || {}

        const phone = signals.phone || null
        const email = signals.email || null
        const address = signals.address || null

        if (!phone && !email && !address) continue

        const match = pool.find((lead) => {
          const samePhone = phone && normalizePhone(lead.phone) === normalizePhone(phone)
          const sameEmail = email && String(lead.email || '').toLowerCase() === String(email).toLowerCase()
          const sameAddress = address && String(lead.address || '').toLowerCase() === String(address).toLowerCase()
          return samePhone || sameEmail || sameAddress
        })

        const tier = intent.tier || toTier(intent.score)
        const score = Number(intent.score || 0)
        const statusTarget = item.status_target || (['hot', 'warm'].includes(tier) ? 'contacted' : 'new')
        const note = `CLI sync (${new Date().toISOString()}): ${item.next_action || item.recommended_followup || 'Follow-up required.'}`

        const payload = {
          name: signals.name || 'Website Visitor',
          phone: phone || 'Not provided',
          email,
          address,
          sqft: signals.sqft || undefined,
          surface_type: signals.surface_type || undefined,
          urgency: signals.urgency || undefined,
          score,
          score_tier: tier,
          status: statusTarget,
          conversion_source: 'voice_ai',
          score_reasoning: `Mr. Worden CLI ranked this lead as ${tier} (${score}/100).`,
          scored_at: new Date().toISOString(),
          notes: note,
        }

        if (match?.id) {
          await api.entities.Lead.update(match.id, {
            ...payload,
            notes: [String(match.notes || ''), note].filter(Boolean).join('\n\n'),
          })
          updated += 1
        } else {
          const createdLead = await api.entities.Lead.create(payload)
          if (createdLead?.id) pool.unshift(createdLead)
          created += 1
        }
      }

      setSyncNote(`CLI sync complete: ${created} created, ${updated} updated.`)
      appendAutomationRun({
        id: `run_${Date.now()}`,
        type: 'cli-sync',
        status: 'success',
        started_at: started,
        ended_at: new Date().toISOString(),
        detail: `CLI sync finished (${created} created, ${updated} updated).`,
      })
      await loadLeads()
    } catch (error) {
      setSyncNote('Could not parse JSON file. Use mrworden batch export JSON.')
      appendAutomationRun({
        id: `run_${Date.now()}`,
        type: 'cli-sync',
        status: 'failed',
        started_at: started,
        ended_at: new Date().toISOString(),
        detail: `CLI sync failed: ${error?.message || 'invalid JSON or read issue'}`,
      })
    } finally {
      event.target.value = ''
      setSyncing(false)
    }
  }, [loadLeads])

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 md:p-5">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-4">
        <div>
          <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-brand-amber mb-1">
            <Bot className="w-3.5 h-3.5" />
            Mr. Worden Autopilot
          </div>
          <h3 className="font-display font-bold text-white text-sm uppercase tracking-[0.12em]">
            Priority Leaderboard + CLI Sync
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-3 py-2 text-xs font-semibold text-white/80 cursor-pointer hover:border-brand-amber/50">
            <Upload className="w-3.5 h-3.5" />
            {syncing ? 'Syncing...' : 'Import CLI JSON'}
            <input
              type="file"
              accept="application/json"
              className="hidden"
              onChange={handleSyncCliFile}
              disabled={syncing}
            />
          </label>

          <button
            type="button"
            onClick={applyAutopilot}
            disabled={autopiloting || loading}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-amber text-brand-navy px-3 py-2 text-xs font-black uppercase tracking-[0.12em] disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {autopiloting ? 'Applying...' : 'Run Autopilot Follow-up'}
          </button>
        </div>
      </div>

      {syncNote ? (
        <div className="mb-3 rounded-lg border border-brand-amber/40 bg-brand-amber/10 px-3 py-2 text-xs text-brand-amber">
          {syncNote}
        </div>
      ) : null}

      {loading ? (
        <div className="h-28 flex items-center justify-center text-white/50 text-sm">
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
          Loading priority queue...
        </div>
      ) : ranked.length === 0 ? (
        <p className="text-sm text-white/60">No scored leads yet. Import a CLI JSON export or let live chat generate scored leads.</p>
      ) : (
        <div className="space-y-2.5">
          {ranked.map((lead) => {
            const tier = String(lead.score_tier || toTier(lead.score))
            return (
              <div key={lead.id} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-white text-sm font-semibold truncate">{lead.name || 'Website Visitor'}</p>
                  <p className="text-white/55 text-xs truncate">
                    {lead.phone || lead.email || lead.address || 'No contact detail'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/65 uppercase tracking-[0.1em]">{lead.status || 'new'}</span>
                  <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold ${statusTone(Number(lead.score || 0))}`}>
                    {Number(lead.score || 0)} · {tier}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function OperationsNerveCenterPanel() {
  const [loading, setLoading] = useState(true)
  const [providers, setProviders] = useState([])
  const [leadBreaches, setLeadBreaches] = useState([])
  const [runs, setRuns] = useState([])
  const [lastRefreshAt, setLastRefreshAt] = useState(null)

  const loadRuns = useCallback(() => {
    setRuns(readAutomationRuns())
  }, [])

  const loadProviderHealth = useCallback(async () => {
    const apiBase = String(import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')

    const fallbackProviders = [
      { id: 'openai', label: 'OpenAI', up: false, note: 'Metrics endpoint unavailable', latency: null, errorRate: null },
      { id: 'gemini', label: 'Gemini', up: parseBoolLike(import.meta.env.VITE_PROVIDER_GEMINI_STATUS), note: 'Google workflows' },
      { id: 'perplexity', label: 'Perplexity', up: parseBoolLike(import.meta.env.VITE_PROVIDER_PERPLEXITY_STATUS), note: 'Research briefs' },
      { id: 'claude', label: 'Claude', up: parseBoolLike(import.meta.env.VITE_PROVIDER_CLAUDE_STATUS), note: 'Math + long context' },
      { id: 'codex', label: 'Codex', up: parseBoolLike(import.meta.env.VITE_PROVIDER_CODEX_STATUS), note: 'File/code tasks' },
      { id: 'grok', label: 'Grok', up: parseBoolLike(import.meta.env.VITE_PROVIDER_GROK_STATUS), note: 'X automation workflows' },
      { id: 'dropbox', label: 'Dropbox', up: parseBoolLike(import.meta.env.VITE_PROVIDER_DROPBOX_STATUS), note: 'Media ingest' },
      { id: 'gphotos', label: 'Google Photos', up: parseBoolLike(import.meta.env.VITE_PROVIDER_GPHOTOS_STATUS), note: 'Media ingest' },
      { id: 'x', label: 'X API', up: parseBoolLike(import.meta.env.VITE_PROVIDER_X_STATUS), note: 'X posting/listening' },
      { id: 'sentry', label: 'Sentry', up: parseBoolLike(import.meta.env.VITE_PROVIDER_SENTRY_STATUS), note: 'Monitoring + error tracking' },
    ]

    if (!apiBase) {
      setProviders(fallbackProviders)
      return
    }

    const started = new Date().toISOString()
    try {
      const response = await fetch(`${apiBase}/api/v1/metrics/providers`)
      if (response.ok) {
        const data = await response.json()
        const rows = Array.isArray(data.providers)
          ? data.providers.map((provider) => ({
              id: provider.id,
              label: provider.label,
              up: Boolean(provider.up),
              note: provider.detail || (provider.configured ? 'Configured' : 'Not configured'),
              latency: provider.latency_ms ?? null,
              errorRate: null,
            }))
          : fallbackProviders
        setProviders(rows)
        appendAutomationRun({
          id: `run_${Date.now()}`,
          type: 'provider-health-check',
          status: 'success',
          started_at: started,
          ended_at: new Date().toISOString(),
          detail: `Provider health check succeeded (${rows.filter((p) => p.up).length} up).`,
        })
      } else {
        setProviders(fallbackProviders)
        appendAutomationRun({
          id: `run_${Date.now()}`,
          type: 'provider-health-check',
          status: 'failed',
          started_at: started,
          ended_at: new Date().toISOString(),
          detail: `Provider health check failed with status ${response.status}.`,
        })
      }
    } catch {
      setProviders(fallbackProviders)
      appendAutomationRun({
        id: `run_${Date.now()}`,
        type: 'provider-health-check',
        status: 'failed',
        started_at: started,
        ended_at: new Date().toISOString(),
        detail: 'Provider health check failed (network/API unavailable).',
      })
    }
  }, [])

  const loadLeadBreaches = useCallback(async () => {
    const all = await api.entities.Lead.list('-created_date', 400)
    const now = Date.now()
    const rows = (Array.isArray(all) ? all : [])
      .map((lead) => {
        const tier = String(lead.score_tier || toTier(lead.score))
        const createdAt = new Date(lead.created_date || lead.created_at || 0)
        if (createdAt.toString() === 'Invalid Date') return null
        const ageMin = Math.floor((now - createdAt.getTime()) / 60000)
        const breachThreshold = tier === 'hot' ? 15 : tier === 'warm' ? 60 : null
        if (!breachThreshold) return null
        const isOpen = !['won', 'lost', 'contacted'].includes(String(lead.status || '').toLowerCase())
        if (!isOpen) return null
        if (ageMin <= breachThreshold) return null

        return {
          id: lead.id,
          name: lead.name || 'Website Visitor',
          tier,
          status: lead.status || 'new',
          ageMin,
          phone: lead.phone || null,
          breachBy: ageMin - breachThreshold,
        }
      })
      .filter(Boolean)
      .sort((a, b) => b.breachBy - a.breachBy)

    setLeadBreaches(rows)
  }, [])

  const refreshAll = useCallback(async () => {
    setLoading(true)
    await Promise.all([loadProviderHealth(), loadLeadBreaches()])
    loadRuns()
    setLastRefreshAt(new Date())
    setLoading(false)
  }, [loadLeadBreaches, loadProviderHealth, loadRuns])

  useEffect(() => {
    refreshAll()
  }, [refreshAll])

  useEffect(() => {
    const onRunUpdated = () => loadRuns()
    if (typeof window !== 'undefined') {
      window.addEventListener('cc:automation-run-updated', onRunUpdated)
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('cc:automation-run-updated', onRunUpdated)
      }
    }
  }, [loadRuns])

  const retryLastFailed = useCallback(() => {
    const failed = runs.find((run) => run.status === 'failed')
    if (!failed) return

    if (failed.type === 'autopilot-followup') {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('cc:retry-autopilot'))
      }
      return
    }

    if (failed.type === 'provider-health-check') {
      refreshAll()
      return
    }

    if (failed.type === 'cli-sync') {
      if (typeof window !== 'undefined') {
        window.alert('Retry CLI sync by importing the JSON file again in Mr. Worden Autopilot panel.')
      }
    }
  }, [runs, refreshAll])

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 md:p-5">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.16em] text-brand-amber mb-1">Operations Nerve Center</p>
          <h3 className="font-display font-bold text-white text-sm uppercase tracking-[0.12em]">Provider Health + Run Telemetry + SLA Alerts</h3>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={refreshAll}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-3 py-2 text-xs font-semibold text-white/85 hover:border-brand-amber/40 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={retryLastFailed}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-amber text-brand-navy px-3 py-2 text-xs font-black uppercase tracking-[0.12em]"
          >
            Retry Last Failed
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-3 mb-3">
        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          <p className="text-[11px] uppercase tracking-[0.14em] text-white/45 mb-2">Provider Status</p>
          <div className="space-y-2">
            {providers.map((row) => (
              <div key={row.id} className="rounded-lg border border-white/10 bg-black/25 px-3 py-2 flex items-center justify-between gap-3">
                <div>
                  <p className="text-white text-xs font-semibold">{row.label}</p>
                  <p className="text-white/55 text-[11px]">{row.note}</p>
                  {row.latency != null || row.errorRate != null ? (
                    <p className="text-white/45 text-[10px] mt-0.5">
                      {row.latency != null ? `Latency ${row.latency}ms` : ''}
                      {row.latency != null && row.errorRate != null ? ' · ' : ''}
                      {row.errorRate != null ? `Error ${row.errorRate}%` : ''}
                    </p>
                  ) : null}
                </div>
                <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${row.up ? 'border-emerald-300/50 bg-emerald-300/10 text-emerald-200' : 'border-amber-300/50 bg-amber-300/10 text-amber-200'}`}>
                  {row.up ? 'Up' : 'Check'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          <p className="text-[11px] uppercase tracking-[0.14em] text-white/45 mb-2">Automation Run Log</p>
          {runs.length === 0 ? (
            <p className="text-sm text-white/55">No automation runs recorded yet.</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {runs.slice(0, 12).map((run) => (
                <div key={run.id} className="rounded-lg border border-white/10 bg-black/25 px-3 py-2">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-white text-xs font-semibold uppercase tracking-[0.08em]">{run.type}</p>
                    <span className={`text-[10px] font-bold uppercase tracking-[0.12em] ${run.status === 'success' ? 'text-emerald-300' : run.status === 'failed' ? 'text-red-300' : 'text-amber-300'}`}>
                      {run.status}
                    </span>
                  </div>
                  <p className="text-white/55 text-[11px] mt-1">{run.detail}</p>
                  <p className="text-white/40 text-[10px] mt-1">{run.ended_at ? new Date(run.ended_at).toLocaleString() : ''}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          <p className="text-[11px] uppercase tracking-[0.14em] text-white/45 mb-2">Hot/Warm SLA Breaches</p>
          {leadBreaches.length === 0 ? (
            <p className="text-sm text-emerald-300">No open SLA breaches right now.</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {leadBreaches.slice(0, 10).map((lead) => (
                <div key={lead.id} className="rounded-lg border border-red-300/20 bg-red-300/10 px-3 py-2">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-red-100 text-xs font-semibold truncate">{lead.name}</p>
                    <span className="text-[10px] text-red-200 uppercase tracking-[0.12em] font-bold">{lead.tier}</span>
                  </div>
                  <p className="text-red-200/85 text-[11px] mt-1">{lead.phone || 'No phone on file'}</p>
                  <p className="text-red-200/75 text-[10px] mt-1">{lead.ageMin} min old · {lead.breachBy} min beyond SLA</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <p className="text-[11px] text-white/45">
        Last refresh: {lastRefreshAt ? lastRefreshAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' }) : 'Not yet'}
      </p>
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
        const all = await api.entities.Lead.list('-created_date', 300)
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

  const inWindow = useMemo(() => {
    const since = new Date()
    since.setDate(since.getDate() - 30)

    return leads.filter((lead) => {
      const created = new Date(lead.created_date || lead.created_at || 0)
      return created.toString() !== 'Invalid Date' && created >= since
    })
  }, [leads])

  const parsedRows = useMemo(() => {
    return inWindow.map((lead) => {
      let attribution = {}
      try {
        const parsed = lead.attribution_snapshot ? JSON.parse(lead.attribution_snapshot) : {}
        attribution = parsed && typeof parsed === 'object' ? parsed : {}
      } catch {
        attribution = {}
      }

      return {
        lead,
        source: String(attribution.utm_source || '').trim().toLowerCase() || String(lead.conversion_source || 'direct').toLowerCase(),
        medium: String(attribution.utm_medium || '').trim().toLowerCase() || 'none',
        campaign: String(attribution.utm_campaign || lead.geofence_campaign || '').trim() || 'none',
        term: String(attribution.utm_term || '').trim() || 'none',
        domain: String(lead.backlink_domain || '').trim().toLowerCase(),
      }
    })
  }, [inWindow])

  const channelRows = useMemo(() => {
    const buckets = {
      google_ads: { leads: 0, won: 0, pipeline: 0 },
      google_organic: { leads: 0, won: 0, pipeline: 0 },
      geofencing: { leads: 0, won: 0, pipeline: 0 },
      backlink_partner: { leads: 0, won: 0, pipeline: 0 },
      referral: { leads: 0, won: 0, pipeline: 0 },
      direct: { leads: 0, won: 0, pipeline: 0 },
    }

    inWindow.forEach((lead) => {
      const source = String(lead.conversion_source || 'direct')
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
  }, [inWindow])

  const countTop = useCallback((rows, extractor, limit = 6) => {
    const map = {}
    rows.forEach((row) => {
      const key = extractor(row)
      if (!key || key === 'none') return
      map[key] = (map[key] || 0) + 1
    })
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
  }, [])

  const topTrafficSources = useMemo(() => countTop(parsedRows, (row) => row.source), [countTop, parsedRows])
  const topTrafficMediums = useMemo(() => countTop(parsedRows, (row) => row.medium), [countTop, parsedRows])
  const topCampaigns = useMemo(() => countTop(parsedRows, (row) => row.campaign), [countTop, parsedRows])
  const topSearchTerms = useMemo(() => countTop(parsedRows, (row) => row.term), [countTop, parsedRows])

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

  const domainPerformanceRows = useMemo(() => {
    const map = {}
    inWindow.forEach((lead) => {
      const fallbackSource = String(lead.conversion_source || 'unknown')
      const row = parsedRows.find((r) => r.lead.id === lead.id)
      const sourceHint = row?.source || fallbackSource
      const derivedDomain = lead.backlink_domain
        ? String(lead.backlink_domain).toLowerCase()
        : sourceHint.includes('.')
          ? sourceHint
          : null

      if (!derivedDomain) return

      if (!map[derivedDomain]) {
        map[derivedDomain] = { domain: derivedDomain, leads: 0, won: 0, pipeline: 0 }
      }

      map[derivedDomain].leads += 1
      if (lead.status === 'won') map[derivedDomain].won += 1
      if (lead.status !== 'won' && lead.status !== 'lost') {
        map[derivedDomain].pipeline += Number(lead.estimated_value) || 0
      }
    })

    return Object.values(map)
      .map((item) => ({
        ...item,
        closeRate: item.leads > 0 ? Math.round((item.won / item.leads) * 100) : 0,
      }))
      .sort((a, b) => b.leads - a.leads)
      .slice(0, 8)
  }, [inWindow, parsedRows])

  const label = (source) => {
    if (source === 'google_ads') return 'Google Ads'
    if (source === 'google_organic') return 'Google Organic'
    if (source === 'geofencing') return 'Geofencing'
    if (source === 'backlink_partner') return 'Backlink Partner'
    if (source === 'referral') return 'Referral'
    if (source === 'direct') return 'Direct'
    return source
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 md:p-5">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h3 className="font-display font-bold text-white text-sm uppercase tracking-[0.12em]">
          Traffic + Search + Domain Intelligence (30d)
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
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 mb-4">
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
              <p className="text-[11px] uppercase tracking-[0.14em] text-white/45 mb-2">Top Traffic Sources</p>
              {topTrafficSources.length === 0 ? (
                <p className="text-sm text-white/55">No source attribution data yet.</p>
              ) : (
                <ul className="space-y-1.5">
                  {topTrafficSources.map(([source, count]) => (
                    <li key={source} className="text-sm text-white/80 flex items-center justify-between gap-3">
                      <span className="truncate">{source}</span>
                      <span className="text-brand-amber font-semibold">{count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-xl border border-white/10 bg-black/20 p-3">
              <p className="text-[11px] uppercase tracking-[0.14em] text-white/45 mb-2">Top Traffic Mediums</p>
              {topTrafficMediums.length === 0 ? (
                <p className="text-sm text-white/55">No medium attribution data yet.</p>
              ) : (
                <ul className="space-y-1.5">
                  {topTrafficMediums.map(([medium, count]) => (
                    <li key={medium} className="text-sm text-white/80 flex items-center justify-between gap-3">
                      <span className="truncate">{medium}</span>
                      <span className="text-brand-amber font-semibold">{count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 mt-3">
            <div className="rounded-xl border border-white/10 bg-black/20 p-3">
              <p className="text-[11px] uppercase tracking-[0.14em] text-white/45 mb-2">Top Campaigns</p>
              {topCampaigns.length === 0 ? (
                <p className="text-sm text-white/55">No campaign attribution data yet.</p>
              ) : (
                <ul className="space-y-1.5">
                  {topCampaigns.map(([campaign, count]) => (
                    <li key={campaign} className="text-sm text-white/80 flex items-center justify-between gap-3">
                      <span className="truncate">{campaign}</span>
                      <span className="text-brand-amber font-semibold">{count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-xl border border-white/10 bg-black/20 p-3">
              <p className="text-[11px] uppercase tracking-[0.14em] text-white/45 mb-2">Top Search Terms</p>
              {topSearchTerms.length === 0 ? (
                <p className="text-sm text-white/55">No search-term attribution data yet.</p>
              ) : (
                <ul className="space-y-1.5">
                  {topSearchTerms.map(([term, count]) => (
                    <li key={term} className="text-sm text-white/80 flex items-center justify-between gap-3">
                      <span className="truncate">{term}</span>
                      <span className="text-brand-amber font-semibold">{count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/20 p-3 mt-3">
            <p className="text-[11px] uppercase tracking-[0.14em] text-white/45 mb-2">Domain Performance Matrix</p>
            {domainPerformanceRows.length === 0 ? (
              <p className="text-sm text-white/55">No domain-level attribution records yet.</p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {domainPerformanceRows.map((item) => (
                  <div key={item.domain} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2.5">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-white text-sm font-semibold truncate">{item.domain}</p>
                      <span className="text-[10px] text-emerald-200 uppercase tracking-[0.12em] font-bold">
                        Close {item.closeRate}%
                      </span>
                    </div>
                    <p className="text-[11px] text-white/60 mt-1">Leads: {item.leads} · Won: {item.won} · Pipeline: ${Math.round(item.pipeline / 1000)}k</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {(topBacklinkDomains.length > 0 || topGeofenceCampaigns.length > 0) ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 mt-3">
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
          ) : null}
        </>
      )}
    </div>
  )
}

function HumanChecksControlPanel() {
  const requiredChecks = useMemo(
    () => [
      {
        id: 'claims_qa',
        title: 'Claims + legal copy reviewed',
        owner: 'Brand / Legal',
      },
      {
        id: 'pricing_qa',
        title: 'Pricing + discount changes verified',
        owner: 'Owner / GM',
      },
      {
        id: 'ad_spend_qa',
        title: 'Ad budget shift approved (>20% delta)',
        owner: 'Marketing Lead',
      },
      {
        id: 'publish_qa',
        title: 'Public-facing publish authorization',
        owner: 'Growth + Brand',
      },
      {
        id: 'crm_qa',
        title: 'Hot/Warm lead SLA on-call owner confirmed',
        owner: 'Sales Ops',
      },
    ],
    [],
  )

  const [checks, setChecks] = useState(() => {
    try {
      if (typeof window === 'undefined') return {}
      const raw = localStorage.getItem(HUMAN_CHECKS_STATE_KEY)
      const parsed = raw ? JSON.parse(raw) : null
      return parsed?.checks && typeof parsed.checks === 'object' ? parsed.checks : {}
    } catch {
      return {}
    }
  })
  const [approver, setApprover] = useState(() => {
    try {
      if (typeof window === 'undefined') return ''
      const raw = localStorage.getItem(HUMAN_CHECKS_STATE_KEY)
      const parsed = raw ? JSON.parse(raw) : null
      return parsed?.approver || ''
    } catch {
      return ''
    }
  })
  const [lastApprovedAt, setLastApprovedAt] = useState(() => {
    try {
      if (typeof window === 'undefined') return null
      const raw = localStorage.getItem(HUMAN_CHECKS_STATE_KEY)
      const parsed = raw ? JSON.parse(raw) : null
      return parsed?.lastApprovedAt || null
    } catch {
      return null
    }
  })

  useEffect(() => {
    try {
      if (typeof window === 'undefined') return
      localStorage.setItem(
        HUMAN_CHECKS_STATE_KEY,
        JSON.stringify({
          checks,
          approver,
          lastApprovedAt,
        }),
      )
    } catch {
      // Keep panel functional even if persistence fails.
    }
  }, [checks, approver, lastApprovedAt])

  const completedCount = requiredChecks.filter((item) => Boolean(checks[item.id])).length
  const blockerCount = requiredChecks.length - completedCount
  const readyForPublicActions = blockerCount === 0 && approver.trim().length > 0

  const exportHumanChecks = useCallback(() => {
    if (typeof window === 'undefined') return
    const payload = {
      generated_at: new Date().toISOString(),
      approver: approver.trim() || null,
      last_approved_at: lastApprovedAt,
      ready_for_public_actions: readyForPublicActions,
      checks: requiredChecks.map((item) => ({
        id: item.id,
        title: item.title,
        owner: item.owner,
        status: checks[item.id] ? 'approved' : 'blocked',
      })),
    }

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'command-center-human-checks.json'
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    URL.revokeObjectURL(url)
  }, [approver, checks, lastApprovedAt, readyForPublicActions, requiredChecks])

  const markApprovedNow = useCallback(() => {
    setLastApprovedAt(new Date().toISOString())
  }, [])

  const resetChecks = useCallback(() => {
    setChecks({})
    setApprover('')
    setLastApprovedAt(null)
  }, [])

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 md:p-5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <div>
          <h3 className="font-display font-bold text-white text-sm uppercase tracking-[0.12em]">
            Human Checks Control Tower
          </h3>
          <p className="text-xs text-white/50 mt-1">Explicit human approvals before irreversible public actions.</p>
        </div>

        <span
          className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${
            readyForPublicActions
              ? 'border-emerald-300/60 bg-emerald-300/10 text-emerald-200'
              : 'border-red-300/60 bg-red-300/10 text-red-200'
          }`}
        >
          {readyForPublicActions ? 'Human Check: Cleared' : `Human Check: ${blockerCount} Blocker${blockerCount === 1 ? '' : 's'}`}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 mb-3">
        <div className="lg:col-span-3 rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
          {requiredChecks.map((item) => (
            <label key={item.id} className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 cursor-pointer">
              <div>
                <p className="text-sm text-white font-semibold">{item.title}</p>
                <p className="text-[11px] text-brand-amber mt-0.5">Owner: {item.owner}</p>
              </div>
              <input
                type="checkbox"
                checked={Boolean(checks[item.id])}
                onChange={(e) => {
                  setChecks((prev) => ({ ...prev, [item.id]: e.target.checked }))
                }}
                className="h-4 w-4 accent-brand-amber"
              />
            </label>
          ))}
        </div>

        <div className="lg:col-span-2 rounded-xl border border-white/10 bg-black/20 p-3 space-y-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.12em] text-white/45">Approver initials</p>
            <input
              type="text"
              value={approver}
              maxLength={18}
              onChange={(e) => setApprover(e.target.value.toUpperCase())}
              placeholder="EX: JW"
              className="mt-1.5 w-full rounded-lg border border-white/20 bg-black/35 px-3 py-2 text-sm text-white placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-brand-amber/50"
            />
          </div>

          <div className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs text-white/70">
            <p>Checks complete: {completedCount}/{requiredChecks.length}</p>
            <p className="mt-1">Last approval timestamp: {lastApprovedAt ? new Date(lastApprovedAt).toLocaleString() : 'Not recorded'}</p>
          </div>

          <div className="grid grid-cols-1 gap-2">
            <button
              type="button"
              onClick={markApprovedNow}
              className="rounded-lg bg-brand-amber text-brand-navy px-3 py-2 text-xs font-black uppercase tracking-[0.12em]"
            >
              Stamp Human Approval
            </button>
            <button
              type="button"
              onClick={exportHumanChecks}
              className="rounded-lg border border-white/20 px-3 py-2 text-xs font-semibold text-white/85 hover:border-brand-amber/40"
            >
              Export Approval Log
            </button>
            <button
              type="button"
              onClick={resetChecks}
              className="rounded-lg border border-red-300/35 px-3 py-2 text-xs font-semibold text-red-200 hover:bg-red-300/10"
            >
              Reset Human Checks
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function GoogleAdsBudgetControlPanel() {
  const [budgetIndex, setBudgetIndex] = useState(() => {
    try {
      if (typeof window === 'undefined') return 100
      const raw = localStorage.getItem(GOOGLE_ADS_BUDGET_STATE_KEY)
      const parsed = raw ? JSON.parse(raw) : null
      return Number(parsed?.budgetIndex || 100)
    } catch {
      return 100
    }
  })
  const [status, setStatus] = useState(() => {
    try {
      if (typeof window === 'undefined') return 'active'
      const raw = localStorage.getItem(GOOGLE_ADS_BUDGET_STATE_KEY)
      const parsed = raw ? JSON.parse(raw) : null
      return parsed?.status || 'active'
    } catch {
      return 'active'
    }
  })
  const [lastAction, setLastAction] = useState(() => {
    try {
      if (typeof window === 'undefined') return null
      const raw = localStorage.getItem(GOOGLE_ADS_BUDGET_STATE_KEY)
      const parsed = raw ? JSON.parse(raw) : null
      return parsed?.lastAction || null
    } catch {
      return null
    }
  })
  const [note, setNote] = useState('')

  useEffect(() => {
    try {
      if (typeof window === 'undefined') return
      localStorage.setItem(
        GOOGLE_ADS_BUDGET_STATE_KEY,
        JSON.stringify({
          budgetIndex,
          status,
          lastAction,
        }),
      )
    } catch {
      // Keep controls usable when localStorage is unavailable.
    }
  }, [budgetIndex, status, lastAction])

  const humanChecksState = useMemo(() => {
    try {
      if (typeof window === 'undefined') return { checks: {}, approver: '' }
      const raw = localStorage.getItem(HUMAN_CHECKS_STATE_KEY)
      const parsed = raw ? JSON.parse(raw) : null
      return {
        checks: parsed?.checks && typeof parsed.checks === 'object' ? parsed.checks : {},
        approver: String(parsed?.approver || '').trim(),
      }
    } catch {
      return { checks: {}, approver: '' }
    }
  }, [lastAction])

  const adSpendApproved = Boolean(humanChecksState.checks?.ad_spend_qa) && humanChecksState.approver.length > 0

  const runBudgetAction = useCallback(
    (action) => {
      const now = new Date().toISOString()
      if (!adSpendApproved) {
        const msg = 'Blocked: complete Human Checks > Ad budget shift approval and set approver initials first.'
        setNote(msg)
        appendAutomationRun({
          id: `run_${Date.now()}`,
          type: 'google-ads-budget-control',
          status: 'blocked',
          started_at: now,
          ended_at: now,
          detail: msg,
        })
        return
      }

      if (action.kind === 'off') {
        setStatus('paused')
        setLastAction({ at: now, label: 'Set Google Ads to OFF', delta: 0 })
        setNote('Google Ads status set to OFF (paused).')
        appendAutomationRun({
          id: `run_${Date.now()}`,
          type: 'google-ads-budget-control',
          status: 'success',
          started_at: now,
          ended_at: now,
          detail: 'Google Ads paused (OFF).',
        })
        return
      }

      if (action.kind === 'resume') {
        setStatus('active')
        setLastAction({ at: now, label: 'Resumed Google Ads', delta: 0 })
        setNote('Google Ads resumed.')
        appendAutomationRun({
          id: `run_${Date.now()}`,
          type: 'google-ads-budget-control',
          status: 'success',
          started_at: now,
          ended_at: now,
          detail: 'Google Ads resumed (active).',
        })
        return
      }

      const next = Math.max(20, Math.min(300, budgetIndex + action.delta))
      setBudgetIndex(next)
      setStatus('active')
      setLastAction({ at: now, label: action.label, delta: action.delta })
      setNote(`Applied: ${action.label}. New budget index: ${next}% of baseline.`)
      appendAutomationRun({
        id: `run_${Date.now()}`,
        type: 'google-ads-budget-control',
        status: 'success',
        started_at: now,
        ended_at: now,
        detail: `${action.label}; budget index now ${next}% of baseline.`,
      })
    },
    [adSpendApproved, budgetIndex],
  )

  const controls = [
    { label: 'Budget +10%', delta: 10, kind: 'adjust' },
    { label: 'Budget +20%', delta: 20, kind: 'adjust' },
    { label: 'Budget -10%', delta: -10, kind: 'adjust' },
    { label: 'Budget -20%', delta: -20, kind: 'adjust' },
    { label: 'OFF', delta: 0, kind: 'off' },
    { label: 'Resume', delta: 0, kind: 'resume' },
  ]

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 md:p-5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <div>
          <h3 className="font-display font-bold text-white text-sm uppercase tracking-[0.12em]">Google Ads Budget Control</h3>
          <p className="text-xs text-white/50 mt-1">Operator controls: up, down, off, resume with human approval gate.</p>
        </div>

        <span
          className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${
            status === 'active'
              ? 'border-emerald-300/60 bg-emerald-300/10 text-emerald-200'
              : 'border-red-300/60 bg-red-300/10 text-red-200'
          }`}
        >
          {status === 'active' ? 'Active' : 'OFF / Paused'}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-3">
        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          <p className="text-[11px] uppercase tracking-[0.12em] text-white/45">Current budget index</p>
          <p className="text-white font-black text-3xl leading-none mt-2">{budgetIndex}%</p>
          <p className="text-[11px] text-white/55 mt-2">Baseline = 100%. Clamp range: 20% to 300%.</p>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/20 p-3 lg:col-span-2">
          <p className="text-[11px] uppercase tracking-[0.12em] text-white/45 mb-2">Quick Actions</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {controls.map((control) => (
              <button
                key={control.label}
                type="button"
                onClick={() => runBudgetAction(control)}
                className={`rounded-lg px-3 py-2 text-xs font-black uppercase tracking-[0.12em] ${
                  control.kind === 'off'
                    ? 'bg-red-300/20 border border-red-300/40 text-red-100'
                    : control.kind === 'resume'
                      ? 'bg-emerald-300/20 border border-emerald-300/40 text-emerald-100'
                      : 'bg-brand-amber text-brand-navy'
                }`}
              >
                {control.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/70">
        <p>Human approval gate: {adSpendApproved ? 'Cleared' : 'Blocked'}</p>
        <p className="mt-1">Approver: {humanChecksState.approver || 'Not set'} · Ad budget check: {humanChecksState.checks?.ad_spend_qa ? 'approved' : 'not approved'}</p>
        <p className="mt-1">Last action: {lastAction?.label ? `${lastAction.label} (${new Date(lastAction.at).toLocaleString()})` : 'None'}</p>
      </div>

      {note ? (
        <div className="mt-3 rounded-lg border border-brand-amber/35 bg-brand-amber/10 px-3 py-2 text-xs text-brand-amber">
          {note}
        </div>
      ) : null}
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

function TempInAppOpsFallbackPanel() {
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState('')
  const [providerSummary, setProviderSummary] = useState(null)

  const downloadJson = useCallback((filename, payload) => {
    if (typeof window === 'undefined') return
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = filename
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    URL.revokeObjectURL(url)
  }, [])

  const downloadBatchTemplate = useCallback(() => {
    const template = {
      generated_at: new Date().toISOString(),
      source: 'command-center-temp-fallback',
      results: [
        {
          lead_id: 'lead_demo_001',
          signals: {
            name: 'Sample Lead',
            phone: '+1-804-555-0101',
            email: 'sample@example.com',
            address: '1601 Ware Bottom Springs Rd, Chester, VA',
            sqft: '1200',
            urgency: 'this week',
            surface_type: 'parking_lot',
          },
          intent: {
            score: 82,
            tier: 'warm',
            reason: 'Requested estimate and shared site details.',
          },
          status_target: 'contacted',
          next_action: 'Call within 15 minutes to confirm site visit.',
        },
      ],
    }

    downloadJson('mrworden-batch-template.json', template)
    setNote('Downloaded CLI-compatible batch template JSON.')
  }, [downloadJson])

  const exportLeadsAsCliJson = useCallback(async () => {
    setBusy(true)
    setNote('')
    try {
      const leads = await api.entities.Lead.list('-created_date', 300)
      const rows = (Array.isArray(leads) ? leads : []).map((lead) => {
        const score = Number(lead.score || 0)
        const tier = String(lead.score_tier || toTier(score))
        return {
          lead_id: lead.id,
          signals: {
            name: lead.name || 'Website Visitor',
            phone: lead.phone || null,
            email: lead.email || null,
            address: lead.address || null,
            sqft: lead.sqft || null,
            urgency: lead.urgency || null,
            surface_type: lead.surface_type || null,
          },
          intent: {
            score,
            tier,
            reason: lead.score_reasoning || `Exported from Command Center with ${tier} tier.`,
          },
          status_target: lead.status || 'new',
          next_action: 'Follow-up by phone/SMS and schedule site visit.',
        }
      })

      downloadJson('mrworden-export-from-command-center.json', {
        generated_at: new Date().toISOString(),
        source: 'command-center-temp-fallback',
        results: rows,
      })

      setNote(`Exported ${rows.length} lead(s) as CLI-compatible JSON.`)
    } catch {
      setNote('Could not export leads right now. Try again in a moment.')
    } finally {
      setBusy(false)
    }
  }, [downloadJson])

  const runProviderSetupDoctor = useCallback(async () => {
    setBusy(true)
    setNote('')
    setProviderSummary(null)
    try {
      const apiBase = String(import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
      if (!apiBase) {
        setNote('VITE_API_BASE_URL is not set. Cannot run provider doctor.')
        return
      }

      const response = await fetch(`${apiBase}/api/v1/metrics/providers`)
      if (!response.ok) {
        setNote(`Provider doctor failed with status ${response.status}.`)
        return
      }

      const data = await response.json()
      const providers = Array.isArray(data.providers) ? data.providers : []
      const missing = providers.filter((p) => !p.configured).map((p) => p.label)
      const down = providers.filter((p) => p.configured && !p.up).map((p) => p.label)
      setProviderSummary({ missing, down, total: providers.length })
      setNote('Provider setup doctor completed.')
    } catch {
      setNote('Provider doctor could not reach backend metrics endpoint.')
    } finally {
      setBusy(false)
    }
  }, [])

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 md:p-5">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h3 className="font-display font-bold text-white text-sm uppercase tracking-[0.12em]">
          Temporary In-App CLI Replacements
        </h3>
        <span className="text-xs text-white/45">Use until permanent wiring is live</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
        <button
          type="button"
          onClick={downloadBatchTemplate}
          className="rounded-lg border border-white/20 px-3 py-2 text-xs font-semibold text-white/85 hover:border-brand-amber/40"
        >
          Download Batch Template
        </button>

        <button
          type="button"
          onClick={exportLeadsAsCliJson}
          disabled={busy}
          className="rounded-lg border border-white/20 px-3 py-2 text-xs font-semibold text-white/85 hover:border-brand-amber/40 disabled:opacity-50"
        >
          Export Leads as CLI JSON
        </button>

        <button
          type="button"
          onClick={runProviderSetupDoctor}
          disabled={busy}
          className="rounded-lg bg-brand-amber text-brand-navy px-3 py-2 text-xs font-black uppercase tracking-[0.12em] disabled:opacity-50"
        >
          Run Provider Setup Doctor
        </button>
      </div>

      {note ? (
        <div className="mt-3 rounded-lg border border-brand-amber/35 bg-brand-amber/10 px-3 py-2 text-xs text-brand-amber">
          {note}
        </div>
      ) : null}

      {providerSummary ? (
        <div className="mt-3 rounded-lg border border-white/10 bg-black/20 px-3 py-2">
          <p className="text-xs text-white/70">Providers checked: {providerSummary.total}</p>
          <p className="text-xs text-amber-200 mt-1">Missing config: {providerSummary.missing.length ? providerSummary.missing.join(', ') : 'None'}</p>
          <p className="text-xs text-red-200 mt-1">Configured but down: {providerSummary.down.length ? providerSummary.down.join(', ') : 'None'}</p>
        </div>
      ) : null}
    </div>
  )
}

function LaunchReadinessAuditPanel({ strategyVisible, onAudit }) {
  const [running, setRunning] = useState(false)
  const [report, setReport] = useState(null)

  const runAudit = useCallback(async () => {
    setRunning(true)

    const apiBase = String(import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
    const runs = readAutomationRuns()

    let providerRows = []
    let providerSource = 'fallback'
    if (apiBase) {
      try {
        const response = await fetch(`${apiBase}/api/v1/metrics/providers`)
        if (response.ok) {
          const data = await response.json()
          providerRows = Array.isArray(data.providers) ? data.providers : []
          providerSource = 'api'
        }
      } catch {
        providerRows = []
      }
    }

    if (providerRows.length === 0) {
      providerRows = [
        { label: 'Gemini', configured: parseBoolLike(import.meta.env.VITE_PROVIDER_GEMINI_STATUS), up: parseBoolLike(import.meta.env.VITE_PROVIDER_GEMINI_STATUS) },
        { label: 'Perplexity', configured: parseBoolLike(import.meta.env.VITE_PROVIDER_PERPLEXITY_STATUS), up: parseBoolLike(import.meta.env.VITE_PROVIDER_PERPLEXITY_STATUS) },
        { label: 'Claude', configured: parseBoolLike(import.meta.env.VITE_PROVIDER_CLAUDE_STATUS), up: parseBoolLike(import.meta.env.VITE_PROVIDER_CLAUDE_STATUS) },
        { label: 'Codex', configured: parseBoolLike(import.meta.env.VITE_PROVIDER_CODEX_STATUS), up: parseBoolLike(import.meta.env.VITE_PROVIDER_CODEX_STATUS) },
        { label: 'Grok', configured: parseBoolLike(import.meta.env.VITE_PROVIDER_GROK_STATUS), up: parseBoolLike(import.meta.env.VITE_PROVIDER_GROK_STATUS) },
        { label: 'Dropbox', configured: parseBoolLike(import.meta.env.VITE_PROVIDER_DROPBOX_STATUS), up: parseBoolLike(import.meta.env.VITE_PROVIDER_DROPBOX_STATUS) },
        { label: 'Google Photos', configured: parseBoolLike(import.meta.env.VITE_PROVIDER_GPHOTOS_STATUS), up: parseBoolLike(import.meta.env.VITE_PROVIDER_GPHOTOS_STATUS) },
        { label: 'X API', configured: parseBoolLike(import.meta.env.VITE_PROVIDER_X_STATUS), up: parseBoolLike(import.meta.env.VITE_PROVIDER_X_STATUS) },
        { label: 'Sentry', configured: parseBoolLike(import.meta.env.VITE_PROVIDER_SENTRY_STATUS), up: parseBoolLike(import.meta.env.VITE_PROVIDER_SENTRY_STATUS) },
      ]
    }

    const configuredProviders = providerRows.filter((p) => p.configured)
    const providerUp = providerRows.filter((p) => p.up)
    const providerBase = Math.max(configuredProviders.length, 1)
    const providerScore = Math.round((providerUp.length / providerBase) * 30)

    const securityChecks = [
      { label: 'CC password set', ok: Boolean(import.meta.env.VITE_CC_PASSWORD) },
      { label: 'Auth mode declared', ok: Boolean(import.meta.env.VITE_AUTH_MODE) },
      { label: 'Internal strategy mode on', ok: INTERNAL_STRATEGY_ENABLED },
      { label: 'Strategy panels path-guarded', ok: strategyVisible },
    ]
    const securityScore = Math.round((securityChecks.filter((c) => c.ok).length / securityChecks.length) * 25)

    const coreUrls = [
      '/',
      '/blog',
      '/robots.txt',
      '/sitemap.xml',
      '/image-sitemap.xml',
    ]
    const indexChecks = await Promise.all(
      coreUrls.map(async (path) => {
        try {
          const response = await fetch(path, { method: 'HEAD' })
          return { path, ok: response.ok, status: response.status }
        } catch {
          return { path, ok: false, status: 0 }
        }
      }),
    )
    let commandCenterRouteOk = false
    try {
      const routeResponse = await fetch('/command-center', { method: 'GET' })
      const routeHtml = await routeResponse.text()
      const hasNotFoundMarker = /Page Not Found|could not be found in this application/i.test(routeHtml)
      const hasCommandCenterMarker = /JWordenAI Command Center/i.test(routeHtml)
      commandCenterRouteOk = routeResponse.ok && hasCommandCenterMarker && !hasNotFoundMarker
    } catch {
      commandCenterRouteOk = false
    }

    const indexedPasses = indexChecks.filter((c) => c.ok).length
    const indexingScore = Math.round((((indexedPasses) + (commandCenterRouteOk ? 1 : 0)) / (indexChecks.length + 1)) * 25)

    const successfulRuns = runs.filter((r) => r.status === 'success')
    const recentSuccess = successfulRuns.some((r) => {
      const ended = new Date(r.ended_at || r.started_at || 0)
      if (ended.toString() === 'Invalid Date') return false
      return Date.now() - ended.getTime() < 7 * 24 * 60 * 60 * 1000
    })
    const automationScore = recentSuccess ? 20 : successfulRuns.length > 0 ? 12 : 6

    const total = Math.min(100, providerScore + securityScore + indexingScore + automationScore)
    const grade = total >= 95 ? '10/10' : total >= 90 ? '9/10' : total >= 80 ? '8/10' : `${Math.max(6, Math.round(total / 10))}/10`

    const nextActions = []
    if (providerScore < 24) nextActions.push('Stabilize provider uptime/config for all required AI channels.')
    if (securityScore < 20) nextActions.push('Ensure strict internal strategy mode remains on for command-center only visibility.')
    if (indexingScore < 25) nextActions.push('Restore 200 status on any failed crawl URL before next indexing wave.')
    if (!commandCenterRouteOk) nextActions.push('Fix /command-center runtime route: deployment appears to be serving a React Not Found view.')
    if (!recentSuccess) nextActions.push('Run at least one successful automation cycle every 24h for reliability confidence.')

    const nextReport = {
      generatedAt: new Date().toISOString(),
      total,
      grade,
      providerScore,
      securityScore,
      indexingScore,
      automationScore,
      providerSource,
      providerUpCount: providerUp.length,
      providerConfiguredCount: configuredProviders.length,
      indexChecks,
      commandCenterRouteOk,
      nextActions,
    }

    setReport(nextReport)
    if (typeof onAudit === 'function') {
      onAudit(nextReport)
    }

    setRunning(false)
  }, [onAudit, strategyVisible])

  useEffect(() => {
    runAudit()
  }, [runAudit])

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 md:p-5">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.16em] text-brand-amber mb-1">Launch Readiness</p>
          <h3 className="font-display font-bold text-white text-sm uppercase tracking-[0.12em]">10/10 Audit Scorecard</h3>
        </div>
        <button
          type="button"
          onClick={runAudit}
          disabled={running}
          className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-3 py-2 text-xs font-semibold text-white/85 hover:border-brand-amber/40 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${running ? 'animate-spin' : ''}`} />
          Run Audit
        </button>
      </div>

      {!report ? (
        <p className="text-sm text-white/60">Building launch scorecard...</p>
      ) : (
        <>
          <div className="rounded-xl border border-brand-amber/35 bg-brand-amber/10 px-3 py-3 mb-3">
            <p className="text-xs text-brand-amber uppercase tracking-[0.12em]">Current launch rating</p>
            <p className="text-white font-display font-black text-2xl mt-1">{report.total}/100 · {report.grade}</p>
            <p className="text-[11px] text-white/65 mt-1">Generated {new Date(report.generatedAt).toLocaleString()}</p>
          </div>

          <div className="grid grid-cols-2 xl:grid-cols-4 gap-2.5 mb-3">
            <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
              <p className="text-[10px] uppercase tracking-[0.12em] text-white/45">Providers</p>
              <p className="text-white font-bold text-sm mt-1">{report.providerScore}/30</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
              <p className="text-[10px] uppercase tracking-[0.12em] text-white/45">Security</p>
              <p className="text-white font-bold text-sm mt-1">{report.securityScore}/25</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
              <p className="text-[10px] uppercase tracking-[0.12em] text-white/45">Indexing</p>
              <p className="text-white font-bold text-sm mt-1">{report.indexingScore}/25</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
              <p className="text-[10px] uppercase tracking-[0.12em] text-white/45">Automation</p>
              <p className="text-white font-bold text-sm mt-1">{report.automationScore}/20</p>
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2.5">
            <p className="text-xs text-white/70">Provider source: {report.providerSource.toUpperCase()} · Up {report.providerUpCount} / Configured {report.providerConfiguredCount}</p>
            <p className="text-xs text-white/70 mt-1">Core crawl URLs healthy: {report.indexChecks.filter((row) => row.ok).length}/{report.indexChecks.length}</p>
            <p className={`text-xs mt-1 ${report.commandCenterRouteOk ? 'text-emerald-300' : 'text-red-300'}`}>
              Command Center route integrity: {report.commandCenterRouteOk ? 'PASS' : 'FAIL'}
            </p>
          </div>

          {report.nextActions.length > 0 ? (
            <div className="mt-3 rounded-lg border border-amber-300/30 bg-amber-300/10 px-3 py-2.5">
              <p className="text-[11px] uppercase tracking-[0.12em] text-amber-100 mb-1">Fastest path to 10/10</p>
              <ul className="space-y-1.5">
                {report.nextActions.map((item) => (
                  <li key={item} className="text-xs text-amber-100/90">• {item}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}

function WeekendExecutionSprintPanel({ latestAudit }) {
  const defaultTasks = useMemo(
    () => [
      { id: 'provider-hardening', title: 'Provider failover + latency budgets', owner: 'Platform' },
      { id: 'ad-ops-rules', title: 'Ad guardrails + approval policies', owner: 'Growth' },
      { id: 'lead-sla', title: 'Hot/Warm SLA auto-escalation', owner: 'Sales Ops' },
      { id: 'content-engine', title: 'Blog pipeline and internal briefs', owner: 'Content' },
      { id: 'review-flywheel', title: 'Review request cadence tuning', owner: 'CX' },
      { id: 'reporting', title: 'Weekly executive ops digest', owner: 'Analytics' },
    ],
    [],
  )

  const [taskState, setTaskState] = useState(() => {
    const saved = readWeekendSprintState()
    if (saved?.taskState && typeof saved.taskState === 'object') return saved.taskState
    return {}
  })

  useEffect(() => {
    writeWeekendSprintState({ taskState, updated_at: new Date().toISOString() })
  }, [taskState])

  const completedCount = defaultTasks.filter((task) => taskState[task.id]).length

  const downloadJson = useCallback((filename, payload) => {
    if (typeof window === 'undefined') return
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = filename
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    URL.revokeObjectURL(url)
  }, [])

  const exportWeekendRunbook = useCallback(() => {
    const payload = {
      generated_at: new Date().toISOString(),
      source: 'command-center-weekend-sprint',
      readiness_snapshot: latestAudit || null,
      tasks: defaultTasks.map((task) => ({
        ...task,
        status: taskState[task.id] ? 'completed' : 'pending',
      })),
    }
    downloadJson('weekend-sprint-runbook.json', payload)
  }, [defaultTasks, downloadJson, latestAudit, taskState])

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 md:p-5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.16em] text-brand-amber mb-1">Weekend Build</p>
          <h3 className="font-display font-bold text-white text-sm uppercase tracking-[0.12em]">Premium Execution Sprint</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/65">{completedCount}/{defaultTasks.length} complete</span>
          <button
            type="button"
            onClick={exportWeekendRunbook}
            className="rounded-lg bg-brand-amber text-brand-navy px-3 py-2 text-xs font-black uppercase tracking-[0.12em]"
          >
            Export Runbook
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {defaultTasks.map((task) => (
          <label key={task.id} className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/20 px-3 py-2.5 cursor-pointer">
            <div>
              <p className="text-sm text-white font-semibold">{task.title}</p>
              <p className="text-[11px] text-white/50 mt-0.5">Owner: {task.owner}</p>
            </div>
            <input
              type="checkbox"
              checked={Boolean(taskState[task.id])}
              onChange={(e) => {
                setTaskState((prev) => ({ ...prev, [task.id]: e.target.checked }))
              }}
              className="h-4 w-4 accent-brand-amber"
            />
          </label>
        ))}
      </div>
    </div>
  )
}

function CivilContractorIntelligencePanel() {
  const [selectedState, setSelectedState] = useState('VA')
  const [stateCodeInput, setStateCodeInput] = useState('VA')
  const [market, setMarket] = useState('Richmond, VA')
  const [disputeType, setDisputeType] = useState('general')
  const [role, setRole] = useState('gc')
  const [advisorData, setAdvisorData] = useState(null)
  const [advisorStatus, setAdvisorStatus] = useState('idle')
  const [utilityRisk, setUtilityRisk] = useState(null)

  const validStateCodes = useMemo(() => new Set(states.map((stateRow) => stateRow.abbr)), [])
  const stateCodeValid = validStateCodes.has(stateCodeInput)
  const stateName = states.find((stateRow) => stateRow.abbr === selectedState)?.state || selectedState
  const licensingEntry = constructionLicensing.find((entry) => entry.abbr === selectedState)
  const lienEntry = mechanicsLienLaws.find((entry) => entry.abbr === selectedState)
  const payEntry = promptPaymentLaws.find((entry) => entry.abbr === selectedState)
  const contractEntry = contractLaw.find((entry) => entry.abbr === selectedState)
  const roadsEntry = roadsAndPavingRegulations.find((entry) => entry.abbr === selectedState)

  const localRankedStates = useMemo(
    () => rankStatesByDispute(disputeType, mechanicsLienLaws, promptPaymentLaws, contractLaw).slice(0, 6),
    [disputeType],
  )

  const localRecommendation = useMemo(
    () => recommendStrategy(
      selectedState,
      disputeType,
      role,
      { lienEntry, payEntry, contractEntry },
      localRankedStates,
    ),
    [contractEntry, disputeType, lienEntry, localRankedStates, payEntry, role, selectedState],
  )

  const licenseLeaders = useMemo(() => optimizeLicenseStates(constructionLicensing).slice(0, 6), [])
  const lienLeaders = useMemo(() => getLienLeverageByState(mechanicsLienLaws).slice(0, 6), [])
  const rankedBidDemo = useMemo(
    () => rankContractorBids(
      [
        {
          name: 'J. Worden & Sons Operating Model',
          bidAmount: 128000,
          licenseState: selectedState,
          licenseClasses: licensingEntry?.licenseClasses || ['General contractor', 'Paving specialty'],
          bondAmount: licensingEntry?.bondMinCommercial || 50000,
          yearsExperience: 25,
          hasInsurance: true,
          workersComp: true,
        },
        {
          name: 'Low-bid competitor model',
          bidAmount: 91000,
          licenseState: selectedState,
          licenseClasses: ['Specialty'],
          bondAmount: 0,
          yearsExperience: 3,
          hasInsurance: true,
          workersComp: false,
        },
      ],
      115000,
      145000,
    ),
    [licensingEntry, selectedState],
  )

  const runAdvisor = useCallback(async () => {
    setAdvisorStatus('loading')
    try {
      const [legalStrategy, topStates, licenseOptimizer, utility] = await Promise.all([
        api.getLegalStrategy({ state: selectedState, dispute_type: disputeType, role }),
        api.getTopStates(disputeType, 6),
        api.getLicenseOptimizer(6),
        api.evaluateUtilityRisk({ has_septic: false, has_well: false, has_detached_structures: true, has_pool: false }),
      ])
      setAdvisorData({ legalStrategy, topStates, licenseOptimizer })
      setUtilityRisk(utility)
      setAdvisorStatus('live')
    } catch {
      setAdvisorData(null)
      setUtilityRisk(null)
      setAdvisorStatus('fallback')
    }
  }, [disputeType, role, selectedState])

  useEffect(() => {
    runAdvisor()
  }, [runAdvisor])

  const activeStrategy = advisorData?.legalStrategy
  const activeScores = activeStrategy?.scores || {
    lien: localRecommendation.scores.lien,
    payment: localRecommendation.scores.payment,
    contract: localRecommendation.scores.contract,
    composite: localRecommendation.composite,
    label: localRecommendation.strengthLabel,
  }
  const activeActions = activeStrategy?.strategy?.key_actions || localRecommendation.strategy.keyActions
  const activeTopStates = advisorData?.topStates?.states || localRankedStates
  const activeLicenseLeaders = advisorData?.licenseOptimizer?.results || licenseLeaders

  const applyStateCode = useCallback((nextValue) => {
    const nextCode = String(nextValue || '').replace(/[^a-z]/gi, '').toUpperCase().slice(0, 2)
    setStateCodeInput(nextCode)
    if (validStateCodes.has(nextCode)) {
      setSelectedState(nextCode)
      const nextStateName = states.find((stateRow) => stateRow.abbr === nextCode)?.state || nextCode
      setMarket((currentMarket) => currentMarket || `${nextStateName} operating market`)
    }
  }, [validStateCodes])

  const planReadiness = [
    { label: 'Plan upload intake', value: 'PDF/CAD/photos/documents', ready: true },
    { label: 'Quantity takeoff', value: 'Area, depth, tonnage, edges, striping', ready: true },
    { label: 'Cost catalog pricing', value: 'Labor, materials, trucking, equipment', ready: true },
    { label: 'State law overlay', value: 'License, lien, prompt pay, DOT, utility rules', ready: true },
    { label: 'Human bid approval', value: 'Estimator signs off before sending', ready: true },
  ]

  return (
    <div className="space-y-4 md:space-y-5">
      <div className="rounded-2xl border border-brand-amber/30 bg-brand-amber/10 p-4 md:p-5">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.16em] text-brand-amber mb-1">In-house prep system</p>
            <h2 className="font-display font-black text-white text-2xl leading-tight">50-State Civil Contractor Intelligence</h2>
            <p className="text-white/65 text-sm mt-2 max-w-3xl">
              Same operating brain for all 50 states plus DC: state law, GC risk, paving rules, utility exposure, plan-to-bid prep, and award controls.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/advisory/legal-strategy" className="rounded-lg border border-white/20 px-3 py-2 text-xs font-semibold text-white/85 hover:border-brand-amber/40">
              Legal Advisor
            </Link>
            <Link to="/advisory/contractor-ranker" className="rounded-lg border border-white/20 px-3 py-2 text-xs font-semibold text-white/85 hover:border-brand-amber/40">
              Ranker
            </Link>
            <Link to={`/advisory/state/${selectedState}`} className="rounded-lg bg-brand-amber px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-brand-navy">
              State File
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 md:gap-5">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 md:p-5 xl:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-4 h-4 text-brand-amber" />
            <h3 className="font-display font-bold text-white text-sm uppercase tracking-[0.12em]">Market Selector</h3>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-white/60 mb-1">Operating market</label>
              <input
                type="text"
                value={market}
                onChange={(event) => setMarket(event.target.value)}
                placeholder="Detroit, MI"
                className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-amber"
              />
              <p className="mt-1 text-[11px] text-white/45">Type the city or territory label operators use internally.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/60 mb-1">State jurisdiction code</label>
              <input
                type="text"
                value={stateCodeInput}
                onChange={(event) => applyStateCode(event.target.value)}
                placeholder="VA"
                maxLength={2}
                className={`w-full rounded-lg border bg-black/30 px-3 py-2 text-sm uppercase text-white focus:outline-none focus:ring-2 ${stateCodeValid ? 'border-white/15 focus:ring-brand-amber' : 'border-red-300/50 focus:ring-red-300'}`}
              />
              <p className={`mt-1 text-[11px] ${stateCodeValid ? 'text-white/45' : 'text-red-200'}`}>
                {stateCodeValid ? `${stateName} loaded. Use any state abbreviation or DC.` : 'Enter a valid 2-letter state code or DC.'}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/60 mb-1">Situation</label>
              <select
                value={disputeType}
                onChange={(event) => setDisputeType(event.target.value)}
                className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-amber"
              >
                {DISPUTE_TYPES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/60 mb-1">Role</label>
              <select
                value={role}
                onChange={(event) => setRole(event.target.value)}
                className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-amber"
              >
                {ROLES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>

            <button
              type="button"
              onClick={runAdvisor}
              className="w-full rounded-lg bg-brand-amber px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-brand-navy"
            >
              Refresh Intelligence
            </button>

            <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/65">
              Source: {advisorStatus === 'live' ? 'Backend advisor live' : advisorStatus === 'loading' ? 'Loading backend advisor' : 'Local 50-state fallback'}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 md:p-5 xl:col-span-3">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Scale className="w-4 h-4 text-brand-amber" />
                <h3 className="font-display font-bold text-white text-sm uppercase tracking-[0.12em]">{stateName} Strategy Snapshot</h3>
              </div>
              <p className="text-white/55 text-sm">Legal strength, licensing posture, and paving regulation prep for {market}.</p>
            </div>
            <span className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${statusTone(activeScores.composite || 0)}`}>
              {activeScores.composite || 0}/100 · {activeScores.label || localRecommendation.strengthLabel}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
            {[
              { label: 'Lien', value: activeScores.lien },
              { label: 'Prompt Pay', value: activeScores.payment },
              { label: 'Contract', value: activeScores.contract },
              { label: 'Composite', value: activeScores.composite },
            ].map((scoreRow) => (
              <div key={scoreRow.label} className="rounded-xl border border-white/10 bg-black/20 px-3 py-3">
                <p className="text-[10px] uppercase tracking-[0.12em] text-white/45">{scoreRow.label}</p>
                <p className="text-white font-black text-2xl mt-1">{scoreRow.value || 0}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-xl border border-white/10 bg-black/20 p-3">
              <p className="text-[11px] uppercase tracking-[0.12em] text-brand-amber mb-2">Action checklist</p>
              <div className="space-y-2">
                {activeActions.slice(0, 5).map((action) => (
                  <div key={action} className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/75">
                    {action}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/20 p-3">
              <p className="text-[11px] uppercase tracking-[0.12em] text-brand-amber mb-2">State rule file</p>
              <div className="space-y-2 text-xs text-white/70">
                <p>License required: {licensingEntry?.stateLicenseRequired ? 'Yes' : 'Local or category-specific'}</p>
                <p>License classes: {(licensingEntry?.licenseClasses || []).slice(0, 3).join(', ') || 'Review state file'}</p>
                <p>Commercial bond minimum: {licensingEntry?.bondMinCommercial ? `$${Number(licensingEntry.bondMinCommercial).toLocaleString()}` : 'No statewide value captured'}</p>
                <p>Lien filing window: {lienEntry?.lienFilingDeadlineDays ? `${lienEntry.lienFilingDeadlineDays} days` : 'Review state lien file'}</p>
                <p>Owner-to-GC pay clock: {payEntry?.ownerToGcDays ? `${payEntry.ownerToGcDays} days` : 'Review prompt-pay file'}</p>
                <p>Road/paving file: {roadsEntry ? 'Loaded for DOT, encroachment, restoration and overweight rules' : 'State road file pending'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-5">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 md:p-5">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4 text-brand-amber" />
            <h3 className="font-display font-bold text-white text-sm uppercase tracking-[0.12em]">Plan-to-Bid Readiness</h3>
          </div>
          <div className="space-y-2.5">
            {planReadiness.map((row) => (
              <div key={row.label} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2.5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-white">{row.label}</p>
                  <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-300">Ready</span>
                </div>
                <p className="text-xs text-white/55 mt-1">{row.value}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 rounded-lg border border-amber-300/30 bg-amber-300/10 px-3 py-2.5 text-xs text-amber-100">
            Final bid flow: upload plans, extract quantities, price from catalog, overlay local rules, then require estimator approval before release.
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 md:p-5">
          <div className="flex items-center gap-2 mb-3">
            <HardHat className="w-4 h-4 text-brand-amber" />
            <h3 className="font-display font-bold text-white text-sm uppercase tracking-[0.12em]">Contractor Award Model</h3>
          </div>
          <div className="space-y-2.5">
            {rankedBidDemo.map((bidRow) => (
              <div key={bidRow.name} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2.5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-white">#{bidRow.rank} {bidRow.name}</p>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] ${statusTone(bidRow.scores.composite)}`}>
                    {bidRow.scores.composite}
                  </span>
                </div>
                <p className="text-xs text-white/55 mt-1">{bidRow.rankLabel} · ${Number(bidRow.bidAmount).toLocaleString()}</p>
                <p className="text-xs text-white/45 mt-1">{bidRow.recommendation}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 md:p-5">
          <h3 className="font-display font-bold text-white text-sm uppercase tracking-[0.12em] mb-3">Expansion Signals</h3>
          <div className="space-y-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.12em] text-brand-amber mb-2">Best base licenses</p>
              <div className="flex flex-wrap gap-2">
                {activeLicenseLeaders.slice(0, 6).map((stateRow) => (
                  <span key={stateRow.abbr} className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-xs text-white/70">
                    {stateRow.abbr} {stateRow.optimizer_score || stateRow.optimizerScore}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.12em] text-brand-amber mb-2">Strong lien leverage</p>
              <div className="flex flex-wrap gap-2">
                {lienLeaders.map((stateRow) => (
                  <span key={stateRow.abbr} className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-xs text-white/70">
                    {stateRow.abbr} {stateRow.lienScore}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.12em] text-brand-amber mb-2">Top dispute states</p>
              <div className="flex flex-wrap gap-2">
                {activeTopStates.slice(0, 6).map((stateRow) => (
                  <span key={stateRow.abbr} className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-xs text-white/70">
                    {stateRow.abbr} {stateRow.weighted || stateRow.composite || stateRow.score}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/65">
              Utility risk sample: {utilityRisk?.risk_level || 'Local fallback'}. Private lines, 811 notices, and restoration rules stay inside the bid packet.
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 md:px-5 py-4 text-xs text-white/55 leading-relaxed">
        Advisory output is internal prep, not legal advice. For plan-based bids, the system should produce a draft estimate, risk sheet, and bid package, then require human estimator and legal review before customer release.
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

function InternalStrategyNotice() {
  return (
    <div className="rounded-2xl border border-amber-300/35 bg-amber-300/10 px-4 py-3.5 text-sm text-amber-100">
      Internal strategy panels are hidden in this environment. Set <code className="bg-amber-100/15 px-1 rounded text-xs">VITE_INTERNAL_STRATEGY_MODE=on</code> and access only from <code className="bg-amber-100/15 px-1 rounded text-xs">/command-center</code>.
    </div>
  )
}

export default function CommandCenter() {
  const [activeTab, setActiveTab] = useState('richmond-grid')
  const strategyVisible = INTERNAL_STRATEGY_ENABLED && isCommandCenterPath()
  const [latestAudit, setLatestAudit] = useState(null)
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
        <>
          {!strategyVisible ? <InternalStrategyNotice /> : null}
          {strategyVisible ? <HubLinkPanel /> : null}

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

              {strategyVisible ? <OperationsNerveCenterPanel /> : null}

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-5">
                  <div className="xl:col-span-2">
                    <ActivityFeed />
                  </div>
                  <div>
                    <SystemHealth />
                  </div>
                </div>

                {strategyVisible ? <HumanChecksControlPanel /> : null}
                {strategyVisible ? <GoogleAdsBudgetControlPanel /> : null}
                {strategyVisible ? <ApiKeysPanel /> : null}
                {strategyVisible ? <HumanApprovalPolicyPanel /> : null}
                {strategyVisible ? <LaunchReadinessAuditPanel strategyVisible={strategyVisible} onAudit={setLatestAudit} /> : null}
                {strategyVisible ? <WeekendExecutionSprintPanel latestAudit={latestAudit} /> : null}
              </div>
            )}

            {activeTab === 'crm' && (
              <div className="space-y-4 md:space-y-5">
                <CrmTable />
                {strategyVisible ? <MrWordenAutopilotPanel /> : null}
                {strategyVisible ? <ChannelPerformancePanel /> : null}
                {strategyVisible ? <TempInAppOpsFallbackPanel /> : null}
                {strategyVisible ? (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 md:px-5 py-4 text-sm text-white/70">
                    Priority Playbook: Focus calls on leads above 80 first, schedule site visits before 6 PM, and send proposal PDFs within 30 minutes of each visit.
                  </div>
                ) : null}
              </div>
            )}

            {activeTab === 'ops' && (
              <div className="space-y-4 md:space-y-5">
                <OperationsPipelinePanel />
                <AuditFeedPanel />
              </div>
            )}

            {activeTab === 'civil-intel' && (
              <CivilContractorIntelligencePanel />
            )}
          </>
      </div>
    </div>
  )
}


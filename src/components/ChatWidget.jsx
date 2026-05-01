/**
 * ChatWidget — "Mr. Worden" Premium Concierge Experience (Option 1B)
 *
 * Architecture
 * ────────────
 * A floating animated avatar (MrWordenAvatar) anchored BOTTOM-RIGHT persists
 * across every page (rendered outside <Routes> in App.jsx).  Clicking the
 * avatar opens a compact four-tab panel:
 *
 *   Actions — Quick-action onboarding buttons ("Get a Quote", "Call Now", etc.)
 *   Chat    — AI multi-turn conversation (POST /api/v1/public/chat)
 *             Structured responses include quick-reply chips and handoff CTAs.
 *   Help    — Page-specific FAQ accordion cards
 *   Lead    — Full lead-capture form (name/phone/email/address/city/ZIP/
 *             service type/timeframe/project size/notes) with AI suggestions
 *
 * Panel open/tab state is preserved in sessionStorage.
 * Conversation history is sent to the backend (capped at 10 turns).
 * Avatar state (idle / talking / listening / wave) drives MrWordenAvatar.
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '../api/client'
import MrWordenAvatar from './MrWordenAvatar'

// ── Config ────────────────────────────────────────────────────────────────────
const BUSINESS_PHONE = '(804) 446-1296'
const BUSINESS_PHONE_TEL = '+18044461296'
const BUSINESS_STATE = 'VA'

// ── Session helpers ───────────────────────────────────────────────────────────

function getOrCreateSessionId() {
  const key = 'jworden_chat_session_id'
  let sid = sessionStorage.getItem(key)
  if (!sid) {
    sid =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? `web-${crypto.randomUUID()}`
        : `web-${Date.now()}-${Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) =>
            b.toString(16).padStart(2, '0')
          ).join('')}`
    sessionStorage.setItem(key, sid)
  }
  return sid
}

function ssGet(key, fallback) {
  try {
    const v = sessionStorage.getItem(key)
    return v !== null ? JSON.parse(v) : fallback
  } catch {
    return fallback
  }
}
function ssSet(key, value) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* quota exceeded or private browsing */
  }
}

function timeOfDayGreeting(date = new Date()) {
  const h = date.getHours()
  if (h < 12) return "Mornin'"
  if (h < 17) return 'Good afternoon'
  return "Good evenin'"
}

// ── Page-aware content ────────────────────────────────────────────────────────

const PAGE_CONTEXT = {
  '/': 'home page',
  '/services': 'services page',
  '/about': 'about page',
  '/contact': 'contact page',
  '/quote': 'quote / booking page',
  '/reviews': 'reviews page',
  '/service-areas': 'service areas page',
  '/blog': 'blog page',
  '/visualizer': 'property visualizer tool',
}

const PAGE_HELP = {
  '/': {
    title: 'Welcome — How can I help you?',
    faqs: [
      {
        q: 'How much does a new driveway cost?',
        a: 'Residential asphalt typically runs $3.50\u2013$8.00/sqft depending on thickness and site prep. Head to /quote for a free on-site estimate.',
      },
      {
        q: 'What services do you offer?',
        a: 'We do asphalt paving, sealcoating, crack filling, concrete, cobblestone, brick pavers, and parking lot maintenance. See /services for the full list.',
      },
      {
        q: 'What areas do you serve?',
        a: 'We serve the greater Richmond, VA area and operate franchise paving programs in VA, NC, GA, FL, MI, TX, and more.',
      },
      {
        q: 'Are you licensed and insured?',
        a: 'Yes \u2014 fully licensed in Virginia with general liability and workers\u2019 compensation coverage.',
      },
    ],
  },
  '/services': {
    title: 'About Our Services',
    faqs: [
      {
        q: 'What is sealcoating?',
        a: 'Sealcoating is a protective layer applied to existing asphalt to extend its life, prevent oxidation, and improve appearance. We recommend it every 2\u20133 years.',
      },
      {
        q: 'How long does asphalt paving take?',
        a: 'A standard residential driveway typically takes 1\u20132 days. Larger commercial lots may take 3\u20135 days depending on size and site conditions.',
      },
      {
        q: 'Do you handle commercial parking lots?',
        a: 'Absolutely \u2014 commercial paving is a core specialty. We work with strip malls, office parks, and national franchise programs.',
      },
      {
        q: "What\u2019s crack filling?",
        a: "Crack filling seals surface cracks before water infiltrates and causes base damage. It\u2019s the most cost-effective way to add years to your asphalt.",
      },
    ],
  },
  '/quote': {
    title: 'Getting Your Free Quote',
    faqs: [
      {
        q: 'What info do I need for a quote?',
        a: 'Just your name, contact info, service type, and an approximate project size. The more detail you provide, the more accurate your estimate.',
      },
      {
        q: 'How quickly do you respond?',
        a: 'We respond to all quote requests within 24 hours, Monday\u2013Friday.',
      },
      {
        q: 'Is the on-site visit really free?',
        a: 'Yes \u2014 100% free, no obligation. We come to your property, measure up, and give you a written estimate.',
      },
      {
        q: 'What does the deposit cover?',
        a: 'A small deposit holds your spot on our schedule. It is applied to your final invoice when the job is complete.',
      },
    ],
  },
  '/contact': {
    title: 'Reaching the Team',
    faqs: [
      {
        q: 'What are your business hours?',
        a: 'Monday\u2013Friday, 7am\u20135pm. We\u2019re often on job sites early, so call or leave a message and we\u2019ll get back to you.',
      },
      {
        q: 'Do you offer emergency service?',
        a: `For urgent commercial needs, call ${BUSINESS_PHONE} directly and we\u2019ll do our best to accommodate you.`,
      },
      {
        q: 'How can I track my project?',
        a: 'Once your project is booked, your project manager will keep you updated. You can also ask here and we\u2019ll pull up your status.',
      },
    ],
  },
  '/about': {
    title: 'About J. Worden & Sons',
    faqs: [
      {
        q: 'How long have you been in business?',
        a: "J. Worden & Sons was founded in 1984 by J. Worden Sr. after 30+ years in roofing. That\u2019s 40+ years of laying asphalt.",
      },
      {
        q: 'Who runs the company now?',
        a: 'Mr. Worden (grandson) took over in 2016 after working alongside the founder since age 14. Same family, same standards.',
      },
      {
        q: 'What awards have you won?',
        a: "We\u2019ve been named to Pavement Magazine\u2019s Top 75 in four categories, won Best of Houzz multiple years, and are a 2026 Top Contractor Nominee.",
      },
    ],
  },
  default: {
    title: 'Quick Help',
    faqs: [
      {
        q: 'How do I get a free estimate?',
        a: 'Head to /quote, fill in a few details, and our team will reach out within 24 hours to schedule your free on-site visit.',
      },
      {
        q: 'What is your phone number?',
        a: `You can reach us at ${BUSINESS_PHONE}, Monday\u2013Friday 7am\u20135pm.`,
      },
      {
        q: 'What areas do you serve?',
        a: 'The greater Richmond, VA area plus national franchise paving programs across 12+ states.',
      },
    ],
  },
}

function getPageHelp(pathname) {
  return PAGE_HELP[pathname] || PAGE_HELP.default
}

// ── Header avatar SVG (compact portrait of Mr. J. Worden Sr.) ─────────────────

function HeaderAvatar() {
  return (
    <div className="w-9 h-9 rounded-full bg-brand-amber/20 border-2 border-brand-amber/60 flex items-center justify-center flex-shrink-0 overflow-hidden" aria-hidden="true">
      <svg viewBox="0 0 80 88" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8">
        <path d="M18 31 Q17 17 40 15 Q63 17 62 31 Z" fill="#f5a623" />
        <rect x="13" y="29" width="54" height="6" rx="3" fill="#d4880a" />
        <rect x="15" y="29" width="50" height="4.5" rx="2" fill="#f5a623" />
        <rect x="36" y="22" width="8" height="5" rx="1.5" fill="#d4880a" opacity="0.8" />
        <text x="40" y="26.5" fontSize="4" fill="white" textAnchor="middle" fontWeight="bold">JW</text>
        <ellipse cx="40" cy="46" rx="18" ry="20" fill="#F4C3A1" />
        <circle cx="32" cy="44" r="6.5" stroke="#4a4a4a" strokeWidth="1.8" fill="white" fillOpacity="0.6" />
        <circle cx="48" cy="44" r="6.5" stroke="#4a4a4a" strokeWidth="1.8" fill="white" fillOpacity="0.6" />
        <path d="M38.5 44 H41.5" stroke="#4a4a4a" strokeWidth="1.6" />
        <circle cx="32" cy="44" r="2.8" fill="#2a1505" />
        <circle cx="48" cy="44" r="2.8" fill="#2a1505" />
        <path d="M31 54 Q36 57 40 55 Q44 57 49 54" stroke="#7a4a25" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M33 57 Q40 62.5 47 57" stroke="#c8966c" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        <path d="M19 73 Q18 88 40 88 Q62 88 61 73 Q52 66 40 66 Q28 66 19 73 Z" fill="#1a1a2e" />
        <path d="M37.5 66 L40 70 L42.5 66 L40 68.5 Z" fill="#f5a623" />
        <path d="M38.5 70 L40 78 L41.5 70 Z" fill="#f5a623" />
      </svg>
    </div>
  )
}

// ── Quick action definitions ──────────────────────────────────────────────────

const QUICK_ACTIONS = [
  {
    id: 'quote',
    emoji: '📋',
    label: 'Get a Fast Quote',
    sub: 'Free on-site estimate',
    action: 'tab:lead',
    color: 'bg-brand-amber text-brand-navy',
  },
  {
    id: 'schedule',
    emoji: '📅',
    label: 'Schedule Estimate',
    sub: 'Pick a day that works',
    action: 'tab:lead',
    color: 'bg-brand-navy text-white',
  },
  {
    id: 'call',
    emoji: '📞',
    label: 'Call Now',
    sub: BUSINESS_PHONE,
    action: `tel:${BUSINESS_PHONE_TEL}`,
    color: 'bg-green-600 text-white',
  },
  {
    id: 'ask',
    emoji: '💬',
    label: 'Ask a Question',
    sub: 'Chat with Mr. Worden',
    action: 'tab:chat',
    color: 'bg-white text-brand-navy border border-brand-navy/20',
  },
]

// ── Form options ──────────────────────────────────────────────────────────────

const SERVICE_OPTIONS = [
  { value: '', label: 'Select service type\u2026' },
  { value: 'driveway', label: 'Residential Driveway' },
  { value: 'parking_lot', label: 'Commercial Parking Lot' },
  { value: 'sealcoating', label: 'Sealcoating' },
  { value: 'crack_filling', label: 'Crack Filling' },
  { value: 'overlay', label: 'Asphalt Overlay / Resurfacing' },
  { value: 'paving', label: 'General Asphalt Paving' },
  { value: 'concrete', label: 'Concrete Work' },
  { value: 'brick_pavers', label: 'Brick Pavers' },
  { value: 'cobblestone', label: 'Cobblestone' },
  { value: 'other', label: 'Other / Not Sure' },
]

const TIMEFRAME_OPTIONS = [
  { value: '', label: 'Select timeframe\u2026' },
  { value: 'asap', label: 'As soon as possible' },
  { value: 'within_1_week', label: 'Within 1 week' },
  { value: 'within_1_month', label: 'Within 1 month' },
  { value: 'flexible', label: 'Flexible / Just planning' },
]

const LEAD_INITIAL = {
  name: '',
  phone: '',
  email: '',
  address: '',
  city: '',
  zip: '',
  service_type: '',
  timeframe: '',
  sqft: '',
  notes: '',
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Message({ msg }) {
  const isBot = msg.role === 'bot'
  return (
    <div className={`flex gap-2 ${isBot ? 'items-start' : 'items-start flex-row-reverse'}`}>
      <span className="text-base flex-shrink-0 leading-none mt-0.5 select-none">{isBot ? '👷' : '🧑'}</span>
      <div
        className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
          isBot
            ? 'bg-brand-navy/5 text-brand-navy rounded-tl-none'
            : 'bg-brand-amber text-brand-navy rounded-tr-none font-medium'
        }`}
      >
        {msg.text}
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex gap-2 items-start">
      <span className="text-base leading-none mt-0.5 select-none">👷</span>
      <div className="bg-brand-navy/5 rounded-2xl rounded-tl-none px-4 py-3 flex gap-1.5 items-center">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-brand-navy/50 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
        <span className="text-xs text-brand-navy/40 ml-1">Mr. Worden is thinking\u2026</span>
      </div>
    </div>
  )
}

function EstimateCard({ estimate }) {
  if (!estimate?.available) return null
  return (
    <div className="mx-2 my-1 bg-brand-amber/10 border border-brand-amber/40 rounded-xl p-3 text-xs text-brand-navy">
      <div className="font-bold text-brand-amber mb-1">💰 Ballpark Estimate</div>
      <div className="font-semibold">{estimate.service}</div>
      <div className="text-lg font-bold text-brand-navy mt-0.5">{estimate.range_text}</div>
      {estimate.drivers && (
        <div className="mt-1 text-brand-navy/60 leading-relaxed">{estimate.drivers}</div>
      )}
      <div className="mt-1.5 text-brand-navy/50 italic">
        Free on-site visit gives you the exact number.
      </div>
    </div>
  )
}

function HandoffBanner({ handoff, onShowForm }) {
  if (!handoff) return null
  if (handoff === 'call') {
    return (
      <div className="mx-3 my-1.5 bg-green-50 border border-green-200 rounded-xl px-3 py-2.5 flex items-center gap-2">
        <span className="text-lg">📞</span>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold text-green-800">Ready to talk?</div>
          <div className="text-xs text-green-700">Call us now \u2014 we pick up fast.</div>
        </div>
        <a
          href={`tel:${BUSINESS_PHONE_TEL}`}
          className="flex-shrink-0 bg-green-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors"
        >
          Call
        </a>
      </div>
    )
  }
  return (
    <div className="mx-3 my-1.5 bg-brand-amber/10 border border-brand-amber/40 rounded-xl px-3 py-2.5 flex items-center gap-2">
      <span className="text-lg">📋</span>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-bold text-brand-navy">Ready for a quote?</div>
        <div className="text-xs text-brand-navy/60">Two-minute form. Free on-site visit.</div>
      </div>
      <button
        type="button"
        onClick={onShowForm}
        className="flex-shrink-0 bg-brand-amber text-brand-navy text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-brand-amber/80 transition-colors"
      >
        {`Let's go`}
      </button>
    </div>
  )
}

// ── Constants ─────────────────────────────────────────────────────────────────

const GREETING_DELAY_MS = 5500
const MESSAGES_SS_KEY = 'mrw_messages'
const MESSAGES_PERSIST_LIMIT = 40
const DEFAULT_QUICK_REPLIES = [
  'How much does it cost?',
  'Do you serve my area?',
  'Get a free estimate',
  'Call me back',
]

function buildInitialMessages() {
  return [
    {
      id: 0,
      role: 'bot',
      text: `${timeOfDayGreeting()}, folks \u2014 pleasure to have y\u2019all here. I\u2019m a digital tribute to J. Worden Sr., founder of J. Worden & Sons Paving since 1984. Pull up a chair: ask me anything, get a ballpark, or let me get you on our schedule. What are you working on today?`,
    },
  ]
}

function suggestionsForPath(pathname) {
  const help = PAGE_HELP[pathname]
  if (help && Array.isArray(help.faqs) && help.faqs.length > 0) {
    return help.faqs.slice(0, 4).map((f) => f.q)
  }
  return DEFAULT_QUICK_REPLIES
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ChatWidget() {
  const { pathname } = useLocation()

  const [open, setOpen] = useState(() => ssGet('mrw_open', false))
  const [activeTab, setActiveTab] = useState(() => ssGet('mrw_tab', 'actions'))
  const [messages, setMessages] = useState(() => {
    const saved = ssGet(MESSAGES_SS_KEY, null)
    if (Array.isArray(saved) && saved.length > 0) return saved
    return buildInitialMessages()
  })
  const [quickReplies, setQuickReplies] = useState(DEFAULT_QUICK_REPLIES)
  const [pendingHandoff, setPendingHandoff] = useState(null)
  const [pendingEstimate, setPendingEstimate] = useState(null)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [unread, setUnread] = useState(0)
  const [justArrived, setJustArrived] = useState(false)
  const sessionIdRef = useRef(getOrCreateSessionId())
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  // Lead capture form state
  const [leadForm, setLeadForm] = useState(LEAD_INITIAL)
  const [leadStatus, setLeadStatus] = useState('idle')
  const [leadError, setLeadError] = useState('')
  const [aiSuggestion, setAiSuggestion] = useState(null)
  const suggestTimerRef = useRef(null)

  // Premium voice
  const [voiceOn, setVoiceOn] = useState(() => ssGet('mrw_voice_on', false))
  useEffect(() => {
    ssSet('mrw_voice_on', voiceOn)
    if (!voiceOn && typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
  }, [voiceOn])
  const speak = useCallback(
    (text) => {
      if (!voiceOn || !text) return
      if (typeof window === 'undefined' || !window.speechSynthesis || !window.SpeechSynthesisUtterance) return
      try {
        window.speechSynthesis.cancel()
        const u = new window.SpeechSynthesisUtterance(text)
        const voices = window.speechSynthesis.getVoices() || []
        const preferred =
          voices.find((v) => /en[-_]US/i.test(v.lang) && /male|daniel|fred|alex/i.test(v.name)) ||
          voices.find((v) => /en[-_]US/i.test(v.lang)) ||
          voices.find((v) => /^en/i.test(v.lang)) ||
          null
        if (preferred) u.voice = preferred
        u.rate = 0.96
        u.pitch = 0.92
        u.volume = 1
        u.lang = preferred?.lang || 'en-US'
        window.speechSynthesis.speak(u)
      } catch {
        /* not available */
      }
    },
    [voiceOn]
  )
  useEffect(() => {
    if (!open && typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
  }, [open])
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  const avatarState = loading
    ? 'talking'
    : justArrived
      ? 'wave'
      : open
        ? 'listening'
        : 'idle'

  useEffect(() => { ssSet('mrw_open', open) }, [open])
  useEffect(() => { ssSet('mrw_tab', activeTab) }, [activeTab])
  useEffect(() => {
    const trimmed = messages.length > MESSAGES_PERSIST_LIMIT
      ? messages.slice(messages.length - MESSAGES_PERSIST_LIMIT)
      : messages
    ssSet(MESSAGES_SS_KEY, trimmed)
  }, [messages])

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  useEffect(() => {
    const greeted = sessionStorage.getItem('jworden_greeted')
    if (greeted) return
    const isMobile = window.innerWidth < 640
    sessionStorage.setItem('jworden_greeted', '1')
    if (isMobile) return
    const timer = setTimeout(() => {
      setOpen(true)
      setUnread(0)
    }, GREETING_DELAY_MS)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!open) return
    const pageLabel = PAGE_CONTEXT[pathname]
    if (!pageLabel || messages.length < 2) return
    const hintText = `Just so y\u2019all know \u2014 you\u2019re now on our ${pageLabel}. Keep on chattin\u2019 or take a peek at the quick help below, much obliged.`
    setMessages((prev) => {
      if (prev.some((msg) => msg.isHint && msg.text === hintText)) return prev
      return [...prev, { id: Date.now(), role: 'bot', text: hintText, isHint: true }]
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  useEffect(() => {
    setJustArrived(true)
    const t = setTimeout(() => setJustArrived(false), 1500)
    return () => clearTimeout(t)
  }, [pathname])

  useEffect(() => {
    if (open && activeTab === 'chat') {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, open, loading, activeTab])

  useEffect(() => {
    if (open && activeTab === 'chat') {
      setTimeout(() => inputRef.current?.focus(), 150)
    }
  }, [open, activeTab])

  useEffect(() => {
    if (!open && messages.length > 1) {
      setUnread(messages.filter((m) => m.role === 'bot' && m.id !== 0).length)
    }
  }, [messages, open])
  useEffect(() => {
    if (open) setUnread(0)
  }, [open])

  const sendMessage = useCallback(
    async (text) => {
      const question = text.trim()
      if (!question || loading) return
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        try { navigator.vibrate(12) } catch { /* not supported */ }
      }
      setMessages((prev) => [...prev, { id: Date.now(), role: 'user', text: question }])
      setInput('')
      setLoading(true)
      setPendingHandoff(null)
      setPendingEstimate(null)

      const historyForBackend = messages
        .slice(-20)
        .filter((m) => !m.isHint)
        .map((m) => ({
          role: m.role === 'bot' ? 'assistant' : 'user',
          content: m.text,
        }))

      try {
        const data = await api.publicChat({
          message: question,
          session_id: sessionIdRef.current,
          state_code: BUSINESS_STATE,
          page_context: PAGE_CONTEXT[pathname] || null,
          history: historyForBackend,
          city: leadForm.city || undefined,
          zip_code: leadForm.zip || undefined,
          service_type: leadForm.service_type || undefined,
          timeframe: leadForm.timeframe || undefined,
          sqft: leadForm.sqft ? parseFloat(leadForm.sqft) : undefined,
        })
        if (data.session_id) sessionIdRef.current = data.session_id

        setMessages((prev) => [...prev, { id: Date.now() + 1, role: 'bot', text: data.message }])
        speak(data.message)

        if (Array.isArray(data.quick_replies) && data.quick_replies.length > 0) {
          setQuickReplies(data.quick_replies)
        }
        if (data.handoff) setPendingHandoff(data.handoff)
        if (data.estimate?.available) setPendingEstimate(data.estimate)
      } catch {
        const fallback =
          'Well now \u2014 looks like our line\u2019s a little crackly right this minute. Give us a holler at (804) 446-1296 or drop us a note on the Quote tab and we\u2019ll be right back with y\u2019all, much obliged.'
        setMessages((prev) => [
          ...prev,
          { id: Date.now() + 1, role: 'bot', text: fallback },
        ])
        speak(fallback)
        setQuickReplies(DEFAULT_QUICK_REPLIES)
      } finally {
        setLoading(false)
      }
    },
    [loading, pathname, speak, messages, leadForm]
  )

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const fetchAiSuggestion = useCallback(
    async (msg) => {
      if (!msg || msg.length < 15) return
      try {
        const data = await api.contactSuggest({ message: msg })
        if (data?.service_type) {
          setAiSuggestion(data)
          if (!leadForm.service_type && data.service_type) {
            setLeadForm((f) => ({ ...f, service_type: data.service_type }))
          }
        }
      } catch {
        /* optional */
      }
    },
    [leadForm.service_type]
  )

  const handleNotesChange = (e) => {
    const msg = e.target.value
    setLeadForm((f) => ({ ...f, notes: msg }))
    clearTimeout(suggestTimerRef.current)
    suggestTimerRef.current = setTimeout(() => fetchAiSuggestion(msg), 1200)
  }

  const handleLeadSubmit = async (e) => {
    e.preventDefault()
    setLeadStatus('submitting')
    setLeadError('')
    try {
      const parts = [
        leadForm.address && `Address: ${leadForm.address}`,
        (leadForm.city || leadForm.zip) &&
          `Location: ${[leadForm.city, leadForm.zip].filter(Boolean).join(', ')}`,
        leadForm.service_type && `Service: ${leadForm.service_type}`,
        leadForm.timeframe && `Timeline: ${leadForm.timeframe}`,
        leadForm.sqft && `Project size: ~${leadForm.sqft} sq ft`,
        leadForm.notes && `Notes: ${leadForm.notes}`,
      ].filter(Boolean)

      await api.submitContact({
        name: leadForm.name,
        email: leadForm.email || undefined,
        phone: leadForm.phone || undefined,
        message: parts.join('\n') || 'Lead submitted via concierge widget',
      })
      setLeadStatus('success')
      setLeadForm(LEAD_INITIAL)
      setAiSuggestion(null)
    } catch (err) {
      setLeadError(err.message || 'Something went wrong. Please try again.')
      setLeadStatus('error')
    }
  }

  const panelVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.96 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: 'spring', stiffness: 300, damping: 28 },
    },
    exit: { opacity: 0, y: 16, scale: 0.95, transition: { duration: 0.18 } },
  }

  const pageHelp = getPageHelp(pathname)

  return (
    <div
      className="fixed bottom-4 right-3 sm:right-5 z-50 flex flex-col items-end"
      role="complementary"
      aria-label="Mr. Worden concierge assistant"
    >
      <AnimatePresence>
        {open && (
          <motion.div
            key="panel"
            role="dialog"
            aria-modal="true"
            aria-label="Mr. Worden Concierge"
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="mb-3 w-[calc(100vw-1.5rem)] sm:w-96 bg-white rounded-2xl shadow-2xl border border-brand-navy/10 flex flex-col overflow-hidden"
            style={{ maxHeight: 'min(80vh, 560px)' }}
          >
            {/* Premium Header */}
            <div className="bg-gradient-to-r from-brand-navy to-[#0e2240] text-white px-4 py-3 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <HeaderAvatar />
                <div>
                  <div className="font-bold text-sm leading-tight">Mr. J. Worden</div>
                  <div className="text-white/60 text-xs flex items-center gap-1">
                    <span className={`inline-block w-1.5 h-1.5 rounded-full ${loading ? 'bg-brand-amber animate-pulse' : 'bg-green-400'}`} aria-hidden="true" />
                    {loading ? 'Thinking\u2026' : 'Founder \u00b7 40+ Years in Paving'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={`tel:${BUSINESS_PHONE_TEL}`}
                  className="bg-green-500 hover:bg-green-400 text-white text-xs font-bold px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1"
                  aria-label={`Call ${BUSINESS_PHONE}`}
                >
                  <span aria-hidden="true">📞</span>
                  <span className="hidden sm:inline">Call Now</span>
                </a>
                <button
                  type="button"
                  onClick={() => setVoiceOn((v) => !v)}
                  className="text-white/50 hover:text-white transition-colors text-sm"
                  aria-label={voiceOn ? 'Mute Mr. Worden' : 'Unmute Mr. Worden'}
                  aria-pressed={voiceOn}
                >
                  {voiceOn ? '🔊' : '🔇'}
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="text-white/50 hover:text-white transition-colors text-lg leading-none"
                  aria-label="Close Mr. Worden concierge"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-brand-navy/10 flex-shrink-0 bg-white" role="tablist">
              {[
                { id: 'actions', label: '⚡ Quick' },
                { id: 'chat', label: '💬 Chat' },
                { id: 'help', label: '❓ Help' },
                { id: 'lead', label: '📋 Quote' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 text-xs font-semibold py-2.5 transition-colors ${
                    activeTab === tab.id
                      ? 'text-brand-navy border-b-2 border-brand-amber bg-brand-amber/5'
                      : 'text-brand-navy/40 hover:text-brand-navy/70'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab bodies */}
            <div className="flex-1 overflow-y-auto min-h-0">

              {/* QUICK ACTIONS */}
              {activeTab === 'actions' && (
                <div className="px-4 py-5 space-y-3">
                  <div className="text-center mb-4">
                    <p className="text-brand-navy font-semibold text-sm">What can I help you with?</p>
                    <p className="text-brand-navy/50 text-xs mt-0.5">
                      {timeOfDayGreeting()} \u2014 J. Worden &amp; Sons, Chester, VA since 1984
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    {QUICK_ACTIONS.map((action) => (
                      <button
                        key={action.id}
                        type="button"
                        onClick={() => {
                          if (action.action.startsWith('tab:')) {
                            setActiveTab(action.action.replace('tab:', ''))
                          } else if (action.action.startsWith('tel:')) {
                            window.location.href = action.action
                          }
                        }}
                        className={`${action.color} rounded-xl px-3 py-3 text-left shadow-sm hover:opacity-90 active:scale-95 transition-all duration-150 flex flex-col`}
                      >
                        <span className="text-xl mb-1" aria-hidden="true">{action.emoji}</span>
                        <span className="font-bold text-xs leading-tight">{action.label}</span>
                        <span className="text-[10px] opacity-70 mt-0.5 leading-tight">{action.sub}</span>
                      </button>
                    ))}
                  </div>
                  <div className="mt-4 pt-3 border-t border-brand-navy/10 text-center">
                    <p className="text-xs text-brand-navy/50">
                      Pavement Mag Top 75 \u00b7 Best of Houzz \u00b7 40+ Years \u00b7 Licensed &amp; Insured
                    </p>
                  </div>
                </div>
              )}

              {/* CHAT */}
              {activeTab === 'chat' && (
                <div className="flex flex-col h-full">
                  <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
                    {messages.map((msg) => (
                      <Message key={msg.id} msg={msg} />
                    ))}
                    {loading && <TypingIndicator />}
                    {pendingEstimate && !loading && (
                      <EstimateCard estimate={pendingEstimate} />
                    )}
                    <div ref={bottomRef} />
                  </div>

                  {pendingHandoff && !loading && (
                    <HandoffBanner
                      handoff={pendingHandoff}
                      onShowForm={() => setActiveTab('lead')}
                    />
                  )}

                  {!loading && (
                    <div className="px-4 pb-2 flex flex-wrap gap-1.5 flex-shrink-0">
                      {(messages.length <= 1 ? suggestionsForPath(pathname) : quickReplies).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => sendMessage(s)}
                          className="text-xs bg-brand-amber/10 text-brand-navy border border-brand-amber/30 rounded-full px-3 py-1 hover:bg-brand-amber/20 transition-colors text-left"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="px-4 pb-3 flex-shrink-0">
                    <Link
                      to="/quote"
                      onClick={() => setOpen(false)}
                      className="block w-full text-center bg-brand-amber text-brand-navy text-xs font-bold rounded-lg py-2 hover:bg-brand-amber/80 transition-colors"
                    >
                      📅 Book Free On-Site Visit &amp; Hold My Spot
                    </Link>
                  </div>

                  <div className="border-t border-brand-navy/10 px-3 py-3 flex gap-2 flex-shrink-0">
                    <input
                      ref={inputRef}
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask Mr. Worden anything\u2026"
                      maxLength={800}
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-amber/50 focus:border-brand-amber transition-colors"
                      aria-label="Message Mr. Worden"
                    />
                    <button
                      type="button"
                      onClick={() => sendMessage(input)}
                      disabled={!input.trim() || loading}
                      className="bg-brand-amber text-brand-navy rounded-lg px-3 py-2 text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-brand-amber/80 transition-colors"
                      aria-label="Send message"
                    >
                      ➤
                    </button>
                  </div>
                </div>
              )}

              {/* HELP */}
              {activeTab === 'help' && (
                <div className="px-4 py-4 space-y-3">
                  <p className="font-bold text-brand-navy text-sm">{pageHelp.title}</p>
                  {pageHelp.faqs.map(({ q, a }) => (
                    <details
                      key={q}
                      className="group rounded-xl border border-brand-navy/10 overflow-hidden"
                    >
                      <summary className="flex justify-between items-center px-4 py-3 cursor-pointer text-sm font-semibold text-brand-navy hover:bg-brand-navy/5 select-none list-none">
                        <span>{q}</span>
                        <span className="text-brand-navy/30 group-open:rotate-180 transition-transform duration-200 ml-2 flex-shrink-0" aria-hidden="true">
                          ▼
                        </span>
                      </summary>
                      <div className="px-4 pb-3 text-sm text-brand-navy/70 leading-relaxed bg-brand-navy/5">
                        {a}
                      </div>
                    </details>
                  ))}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('chat')}
                      className="text-xs text-brand-amber font-semibold hover:underline"
                    >
                      💬 Still have questions? Chat with Mr. Worden →
                    </button>
                  </div>
                </div>
              )}

              {/* LEAD FORM */}
              {activeTab === 'lead' && (
                <div className="px-4 py-4">
                  {leadStatus === 'success' ? (
                    <div className="text-center py-8">
                      <div className="text-5xl mb-3">✅</div>
                      <p className="font-bold text-brand-navy text-base">{`You're on the list!`}</p>
                      <p className="text-brand-navy/60 text-sm mt-1 leading-relaxed">
                        Much obliged \u2014 {`we'll`} reach out within 24 hours to confirm your free on-site visit.
                      </p>
                      <div className="mt-4 space-y-2">
                        <a
                          href={`tel:${BUSINESS_PHONE_TEL}`}
                          className="block w-full text-center bg-green-600 text-white text-sm font-bold rounded-lg py-2.5 hover:bg-green-700 transition-colors"
                        >
                          📞 Or call us now: {BUSINESS_PHONE}
                        </a>
                        <button
                          type="button"
                          onClick={() => { setLeadStatus('idle'); setLeadForm(LEAD_INITIAL) }}
                          className="block w-full text-xs text-brand-amber font-semibold hover:underline pt-1"
                        >
                          Submit another request
                        </button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleLeadSubmit} className="space-y-3">
                      <p className="text-xs text-brand-navy/50 mb-1">
                        Fill in what you know \u2014 the more detail, the more accurate your estimate. We follow up within 24 hours.
                      </p>

                      <div>
                        <label htmlFor="lf-name" className="block text-xs font-semibold text-brand-navy mb-1">Full Name *</label>
                        <input id="lf-name" type="text" required maxLength={120} value={leadForm.name}
                          onChange={(e) => setLeadForm((f) => ({ ...f, name: e.target.value }))}
                          placeholder="Your name"
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-amber/50 focus:border-brand-amber transition-colors" />
                      </div>

                      <div>
                        <label htmlFor="lf-phone" className="block text-xs font-semibold text-brand-navy mb-1">Phone Number *</label>
                        <input id="lf-phone" type="tel" required maxLength={30} value={leadForm.phone}
                          onChange={(e) => setLeadForm((f) => ({ ...f, phone: e.target.value }))}
                          placeholder="(804) 555-0100"
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-amber/50 focus:border-brand-amber transition-colors" />
                      </div>

                      <div>
                        <label htmlFor="lf-email" className="block text-xs font-semibold text-brand-navy mb-1">
                          Email <span className="font-normal text-brand-navy/40">(optional)</span>
                        </label>
                        <input id="lf-email" type="email" maxLength={120} value={leadForm.email}
                          onChange={(e) => setLeadForm((f) => ({ ...f, email: e.target.value }))}
                          placeholder="your@email.com"
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-amber/50 focus:border-brand-amber transition-colors" />
                      </div>

                      <div>
                        <label htmlFor="lf-address" className="block text-xs font-semibold text-brand-navy mb-1">
                          Project Address <span className="font-normal text-brand-navy/40">(optional)</span>
                        </label>
                        <input id="lf-address" type="text" maxLength={200} value={leadForm.address}
                          onChange={(e) => setLeadForm((f) => ({ ...f, address: e.target.value }))}
                          placeholder="123 Main St"
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-amber/50 focus:border-brand-amber transition-colors" />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label htmlFor="lf-city" className="block text-xs font-semibold text-brand-navy mb-1">City</label>
                          <input id="lf-city" type="text" maxLength={80} value={leadForm.city}
                            onChange={(e) => setLeadForm((f) => ({ ...f, city: e.target.value }))}
                            placeholder="Richmond"
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-amber/50 focus:border-brand-amber transition-colors" />
                        </div>
                        <div>
                          <label htmlFor="lf-zip" className="block text-xs font-semibold text-brand-navy mb-1">ZIP</label>
                          <input id="lf-zip" type="text" maxLength={10} value={leadForm.zip}
                            onChange={(e) => setLeadForm((f) => ({ ...f, zip: e.target.value }))}
                            placeholder="23831"
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-amber/50 focus:border-brand-amber transition-colors" />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="lf-service" className="block text-xs font-semibold text-brand-navy mb-1">Service Type</label>
                        <select id="lf-service" value={leadForm.service_type}
                          onChange={(e) => setLeadForm((f) => ({ ...f, service_type: e.target.value }))}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-amber/50 focus:border-brand-amber transition-colors bg-white">
                          {SERVICE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      </div>

                      <div>
                        <label htmlFor="lf-timeframe" className="block text-xs font-semibold text-brand-navy mb-1">Timeframe</label>
                        <select id="lf-timeframe" value={leadForm.timeframe}
                          onChange={(e) => setLeadForm((f) => ({ ...f, timeframe: e.target.value }))}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-amber/50 focus:border-brand-amber transition-colors bg-white">
                          {TIMEFRAME_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      </div>

                      <div>
                        <label htmlFor="lf-sqft" className="block text-xs font-semibold text-brand-navy mb-1">
                          Approx. Size <span className="font-normal text-brand-navy/40">(sq ft, optional)</span>
                        </label>
                        <input id="lf-sqft" type="number" min="0" max="10000000" step="50" value={leadForm.sqft}
                          onChange={(e) => setLeadForm((f) => ({ ...f, sqft: e.target.value }))}
                          placeholder="e.g. 1000"
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-amber/50 focus:border-brand-amber transition-colors" />
                      </div>

                      <div>
                        <label htmlFor="lf-notes" className="block text-xs font-semibold text-brand-navy mb-1">Notes / Description</label>
                        <textarea id="lf-notes" rows={3} maxLength={1000} value={leadForm.notes}
                          onChange={handleNotesChange}
                          placeholder="Tell us about your project\u2026"
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-amber/50 focus:border-brand-amber transition-colors resize-none" />
                        {aiSuggestion?.hint && (
                          <p className="text-xs text-brand-amber mt-1">💡 {aiSuggestion.hint}</p>
                        )}
                      </div>

                      {leadStatus === 'error' && (
                        <p className="text-red-600 text-xs bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                          {leadError}
                        </p>
                      )}

                      <button
                        type="submit"
                        disabled={leadStatus === 'submitting'}
                        className="w-full bg-brand-navy text-white text-sm font-bold rounded-lg py-2.5 hover:bg-brand-navy/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {leadStatus === 'submitting' ? 'Sending\u2026' : '📋 Request Free Estimate'}
                      </button>

                      <div className="flex items-center gap-3 justify-center pt-1">
                        <a href={`tel:${BUSINESS_PHONE_TEL}`}
                          className="text-xs text-green-700 font-semibold hover:underline flex items-center gap-1">
                          <span aria-hidden="true">📞</span> {BUSINESS_PHONE}
                        </a>
                        <span className="text-brand-navy/20 text-xs">|</span>
                        <a href="mailto:j.wordenandsonspaving@gmail.com"
                          className="text-xs text-brand-amber font-semibold hover:underline">
                          Email us
                        </a>
                      </div>
                    </form>
                  )}
                </div>
              )}

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <MrWordenAvatar
        state={avatarState}
        size={52}
        onClick={() => setOpen((o) => !o)}
        isOpen={open}
        unread={unread}
      />
    </div>
  )
}

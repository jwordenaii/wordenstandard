/**
 * ChatWidget — floating JWordenAI chatbot bubble.
 *
 * Renders a chat button fixed to the bottom-left corner (FloatingCTA lives
 * on the right). On click it expands to a compact chat panel.  All questions
 * are sent to POST /api/v1/ai/chat; a client-side stub answers gracefully
 * when the backend is unavailable.
 */
import { useState, useRef, useEffect } from 'react'
import { api } from '../api/client'

const SUGGESTIONS = [
  'Do I need a license to pave in Texas?',
  'What is the 811 notice period in Florida?',
  'How much does asphalt paving cost per sqft?',
  'What is a mechanics lien?',
]

const BOT_AVATAR = '🤖'
const USER_AVATAR = '👷'

function Message({ msg }) {
  const isBot = msg.role === 'bot'
  return (
    <div className={`flex gap-2 ${isBot ? 'items-start' : 'items-start flex-row-reverse'}`}>
      <span className="text-xl flex-shrink-0">{isBot ? BOT_AVATAR : USER_AVATAR}</span>
      <div
        className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
          isBot
            ? 'bg-brand-navy/5 text-brand-navy rounded-tl-none'
            : 'bg-brand-amber text-brand-navy rounded-tr-none'
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
      <span className="text-xl">{BOT_AVATAR}</span>
      <div className="bg-brand-navy/5 rounded-2xl rounded-tl-none px-4 py-3 flex gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-brand-navy/40 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  )
}

const INITIAL_MESSAGES = [
  {
    id: 0,
    role: 'bot',
    text: "Hi! I'm JWordenAI 👋 — ask me anything about asphalt paving, construction law across all 50 states, or getting a project estimate.",
  },
]

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState(INITIAL_MESSAGES)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  // Scroll to bottom on new message
  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open, loading])

  // Focus input when chat opens
  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  const sendMessage = async (text) => {
    const question = text.trim()
    if (!question || loading) return

    const userMsg = { id: Date.now(), role: 'user', text: question }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const data = await api.askAI({ question })
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: 'bot', text: data.answer },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'bot',
          text: "I'm having trouble connecting right now. Please try again shortly, or reach us directly at /contact.",
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  return (
    <div className="fixed bottom-6 left-6 z-50 flex flex-col items-start">
      {/* Chat panel */}
      {open && (
        <div className="mb-3 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-brand-navy/10 flex flex-col overflow-hidden"
          style={{ maxHeight: '70vh' }}
        >
          {/* Header */}
          <div className="bg-brand-navy text-white px-4 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xl">🤖</span>
              <div>
                <div className="font-bold text-sm">JWordenAI</div>
                <div className="text-white/50 text-xs">Paving &amp; Construction Law Expert</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-white/60 hover:text-white transition-colors text-lg leading-none"
              aria-label="Close chat"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
            {messages.map((msg) => (
              <Message key={msg.id} msg={msg} />
            ))}
            {loading && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>

          {/* Suggestions (shown only on opening message) */}
          {messages.length === 1 && !loading && (
            <div className="px-4 pb-2 flex flex-wrap gap-1.5">
              {SUGGESTIONS.map((s) => (
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

          {/* Input */}
          <div className="border-t border-brand-navy/10 px-3 py-3 flex gap-2 flex-shrink-0">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about paving or construction law…"
              maxLength={500}
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-amber/50 focus:border-brand-amber transition-colors"
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

      {/* Toggle button */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="bg-brand-navy text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:bg-brand-navy/90 transition-all hover:scale-105 active:scale-95"
        aria-label={open ? 'Close JWordenAI chat' : 'Open JWordenAI chat'}
      >
        {open ? (
          <span className="text-xl">✕</span>
        ) : (
          <span className="text-2xl">🤖</span>
        )}
      </button>
    </div>
  )
}

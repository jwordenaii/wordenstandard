import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader2, Mic, MicOff, Volume2, VolumeX, Radio, Phone, Sparkles, ShieldCheck } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import WebGLPersonaAvatar from './WebGLPersonaAvatar';
import SmartImage from './SmartImage';
import { PRIMARY_LOGO_URL, FALLBACK_LOGO_URL } from '@/lib/branding';
import { trackEvent, trackQualifiedLeadSignal } from '@/lib/analytics';

function splitSentences(text) {
  return (text || '')
    .replace(/\s+/g, ' ')
    .trim()
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function southernFounderStyle(text) {
  const source = (text || '').trim();
  if (!source) return '';

  const sentences = splitSentences(source);
  if (sentences.length === 0) return source;

  const recommendation = (sentences[0] || '').replace(/^[^a-zA-Z0-9]+/, '') || 'Start with a field inspection so we solve root issues first.';
  const whyItWorks = sentences[1] || 'This protects your budget by matching the fix to your pavement condition and traffic.';
  const scopeOptions = sentences[2] || 'Scope options: targeted repair, resurfacing, or full replacement based on condition and base stability.';
  const priceRange = sentences.find((s) => /\$|sq\s*ft|square\s*feet|range/i.test(s)) || 'Typical pricing depends on square footage, prep depth, drainage, and edge conditions.';
  const timeline = sentences.find((s) => /day|week|timeline|schedule|start/i.test(s)) || 'Most projects can be scoped quickly, then scheduled by urgency and weather window.';
  const practicalNextStep = sentences.slice(3).join(' ') || 'Share your address, approximate size, and target timeline and I will map your smartest next step.';

  const compactRecommendation = recommendation.endsWith('.') ? recommendation : `${recommendation}.`;
  const compactWhy = whyItWorks
    ? whyItWorks.endsWith('.') || whyItWorks.endsWith('!') || whyItWorks.endsWith('?')
      ? whyItWorks
      : `${whyItWorks}.`
    : 'That approach holds up better in Virginia weather and daily traffic.';
  const compactScope = scopeOptions.endsWith('.') ? scopeOptions : `${scopeOptions}.`;
  const compactPrice = priceRange.endsWith('.') ? priceRange : `${priceRange}.`;
  const compactTimeline = timeline.endsWith('.') ? timeline : `${timeline}.`;
  const compactNextStep = practicalNextStep
    ? practicalNextStep.endsWith('.') || practicalNextStep.endsWith('!') || practicalNextStep.endsWith('?')
      ? practicalNextStep
      : `${practicalNextStep}.`
    : 'If you want, I can map out the smartest next step for your property right now.';

  return [
    `Recommendation: ${compactRecommendation}`,
    `Why: ${compactWhy}`,
    `Scope options: ${compactScope}`,
    `Price range context: ${compactPrice}`,
    `Timeline: ${compactTimeline}`,
    `Next step: ${compactNextStep}`,
    '— Mr. Worden, Founder',
  ].join(' ');
}

function styleFounderMessage(message) {
  if (!message || message.role !== 'assistant') return message;
  return {
    ...message,
    content: southernFounderStyle(message.content),
  };
}

function classifySurfaceType(text = '') {
  const source = text.toLowerCase();
  if (/parking\s*lot|lot/.test(source)) return 'parking_lot';
  if (/driveway/.test(source)) return 'driveway';
  if (/road|street|lane|private\s*road/.test(source)) return 'roadway';
  if (/church/.test(source)) return 'church_lot';
  if (/hoa/.test(source)) return 'hoa';
  return 'asphalt';
}

function detectUrgency(text = '') {
  const source = text.toLowerCase();
  if (/asap|urgent|this week|immediately|right away|emergency/.test(source)) return 'urgent';
  if (/this month|soon|next week|next month/.test(source)) return 'standard';
  return 'flexible';
}

function extractLeadSignals(text = '') {
  const source = String(text || '');
  const emailMatch = source.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  const phoneMatch = source.match(/(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/);
  const sqftMatch = source.match(/(\d{3,6})\s*(?:sq\s*ft|sqft|square\s*feet)/i);
  const nameMatch = source.match(/(?:i\s*am|this\s*is|my\s*name\s*is)\s+([A-Za-z][A-Za-z'\-\s]{1,40})/i);
  const addressHint = source.match(/\d{2,6}\s+[A-Za-z0-9.\-\s]{3,80}(?:rd|road|st|street|ave|avenue|dr|drive|blvd|lane|ln|ct|court)\b/i);

  return {
    name: nameMatch?.[1]?.trim(),
    email: emailMatch?.[0]?.trim(),
    phone: phoneMatch?.[0]?.trim(),
    sqft: sqftMatch ? Number(sqftMatch[1]) : undefined,
    address: addressHint?.[0]?.trim(),
    urgency: detectUrgency(source),
    surface_type: classifySurfaceType(source),
  };
}

function scoreIntent(text = '', signals = {}) {
  const source = text.toLowerCase();
  let score = 30;

  if (signals.phone) score += 20;
  if (signals.email) score += 12;
  if (signals.address) score += 10;
  if (signals.sqft) score += 12;
  if (/quote|estimate|price|cost|bid/.test(source)) score += 10;
  if (/book|schedule|start|when can you/.test(source)) score += 10;
  if (signals.urgency === 'urgent') score += 15;
  if (/call me|call now|phone me/.test(source)) score += 12;

  const finalScore = Math.max(0, Math.min(100, score));
  if (finalScore >= 85) return { score: finalScore, tier: 'hot' };
  if (finalScore >= 65) return { score: finalScore, tier: 'warm' };
  if (finalScore >= 40) return { score: finalScore, tier: 'cool' };
  return { score: finalScore, tier: 'cold' };
}

/**
 * Floating AI concierge chat bubble that lives on the public site.
 * Uses the existing `paving_consultant` agent to answer homeowner questions 24/7.
 * No auth required — creates anonymous conversations.
 */
export default function AIConciergeBubble() {
  const [open, setOpen] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [booting, setBooting] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [voiceMode, setVoiceMode] = useState('push'); // off | push | handsfree
  const [voiceOutputEnabled, setVoiceOutputEnabled] = useState(true);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [speechPulse, setSpeechPulse] = useState(0);
  const [supportsSpeechIn, setSupportsSpeechIn] = useState(false);
  const [supportsSpeechOut, setSupportsSpeechOut] = useState(false);
  const [modelMode, setModelMode] = useState('probing');
  const [founderVoiceName, setFounderVoiceName] = useState('Auto');
  const scrollRef = useRef(null);
  const recognitionRef = useRef(null);
  const handsFreeRestartRef = useRef(null);
  const lastAssistantMessageRef = useRef('');
  const founderVoiceRef = useRef(null);
  const ttsPacerRef = useRef(null);
  const leadSyncRef = useRef({ id: null, profile: {} });

  const avatarState = open
    ? (speaking || sending || booting ? 'talking' : listening ? 'listening' : 'idle')
    : hovered
      ? 'wave'
      : 'idle';

  const QUICK_PROMPTS = [
    'Mr. Worden, what would you do for my driveway?',
    'How much does a driveway usually cost?',
    'How soon can you start in Chester?',
    'Is asphalt better than concrete for my project?',
  ];

  const TRUST_SIGNALS = [
    '40+ Years',
    'Licensed + Insured',
    'Founder-level guidance',
  ];

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setSupportsSpeechIn(Boolean(window.SpeechRecognition || window.webkitSpeechRecognition));
    setSupportsSpeechOut(Boolean(window.speechSynthesis));
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    const pickFounderVoice = (voices) => {
      if (!Array.isArray(voices) || voices.length === 0) return null;
      const candidates = voices.filter((v) => (v.lang || '').toLowerCase().startsWith('en'));
      const pool = candidates.length > 0 ? candidates : voices;

      const preferredTokens = [
        'guy',
        'davis',
        'david',
        'roger',
        'andrew',
        'matthew',
        'google us english',
        'microsoft david',
      ];

      for (const token of preferredTokens) {
        const match = pool.find((v) => (v.name || '').toLowerCase().includes(token));
        if (match) return match;
      }

      return pool[0] || null;
    };

    const refreshVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      const selected = pickFounderVoice(voices);
      founderVoiceRef.current = selected;
      setFounderVoiceName(selected?.name || 'Auto');
    };

    refreshVoice();
    window.speechSynthesis.onvoiceschanged = refreshVoice;

    return () => {
      if (window.speechSynthesis.onvoiceschanged === refreshVoice) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  const stopListening = useCallback(() => {
    if (handsFreeRestartRef.current) {
      clearTimeout(handsFreeRestartRef.current);
      handsFreeRestartRef.current = null;
    }
    const rec = recognitionRef.current;
    if (rec) {
      try {
        rec.stop();
      } catch {
        // ignore recognition stop races
      }
    }
  }, []);

  const startListening = useCallback(() => {
    const rec = recognitionRef.current;
    if (!rec || listening || sending || booting || speaking || !open) return;
    try {
      rec.start();
    } catch {
      // ignore recognition start races
    }
  }, [listening, sending, booting, speaking, open]);

  const speakAssistant = useCallback(
    (text) => {
      if (!voiceOutputEnabled || !supportsSpeechOut || !('speechSynthesis' in window)) return;
      if (!text?.trim()) return;

      const normalizedText = text
        .replace(/\s+/g, ' ')
        .replace(/\s-\s/g, ', ')
        .replace(/\.{3,}/g, '...')
        .trim();

      window.speechSynthesis.cancel();
      if (ttsPacerRef.current) {
        clearInterval(ttsPacerRef.current);
        ttsPacerRef.current = null;
      }

      const utterance = new SpeechSynthesisUtterance(normalizedText);

      const wordCount = normalizedText.split(/\s+/).filter(Boolean).length;
      const longForm = wordCount > 45;

      utterance.rate = longForm ? 0.95 : 1.0;
      utterance.pitch = 0.9;
      utterance.volume = 1;
      utterance.voice = founderVoiceRef.current || null;

      utterance.onstart = () => {
        setSpeaking(true);
        setSpeechPulse((p) => p + Math.max(1, Math.round(normalizedText.length / 6)));

        ttsPacerRef.current = setInterval(() => {
          setSpeechPulse((p) => p + 1);
        }, longForm ? 190 : 160);
      };
      utterance.onboundary = () => {
        setSpeechPulse((p) => p + 1);
      };
      utterance.onend = () => {
        setSpeaking(false);
        if (ttsPacerRef.current) {
          clearInterval(ttsPacerRef.current);
          ttsPacerRef.current = null;
        }
        if (voiceMode === 'handsfree' && open) {
          handsFreeRestartRef.current = setTimeout(() => startListening(), 350);
        }
      };
      utterance.onerror = () => {
        setSpeaking(false);
        if (ttsPacerRef.current) {
          clearInterval(ttsPacerRef.current);
          ttsPacerRef.current = null;
        }
      };
      window.speechSynthesis.speak(utterance);
    },
    [voiceOutputEnabled, voiceMode, open, startListening, supportsSpeechOut]
  );

  const initConversation = async () => {
    if (conversation) return conversation;
    setBooting(true);
    try {
      const conv = await base44.agents.createConversation({
        agent_name: 'paving_consultant',
        metadata: {
          name: 'Website Visitor Chat',
          description: 'Anonymous chat from jwordenasphaltpaving.com',
        },
      });
      setConversation(conv);
      setMessages([
        {
          role: 'assistant',
          content: "Recommendation: Ask me anything about your paving project and I will give you a direct recommendation. Why: I run this like a real jobsite decision, not a generic chatbot answer. Next step: Share your driveway size, condition, and timeline, and I will lay out the smartest plan. — Mr. Worden, Founder",
        },
      ]);
      return conv;
    } catch (e) {
      setMessages([
        { role: 'assistant', content: "I'm having trouble connecting. Please call (804) 446-1296 — we answer during business hours." },
      ]);
    } finally {
      setBooting(false);
    }
  };

  // Subscribe to conversation updates
  useEffect(() => {
    if (!conversation?.id) return;
    const unsubscribe = base44.agents.subscribeToConversation(conversation.id, (data) => {
      if (Array.isArray(data?.messages) && data.messages.length > 0) {
        setMessages(data.messages.map(styleFounderMessage));
      }
    });
    return unsubscribe;
  }, [conversation?.id]);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  // Speech recognition setup (push-to-talk + hands-free)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      recognitionRef.current = null;
      return;
    }

    const rec = new SpeechRecognition();
    rec.lang = 'en-US';
    rec.interimResults = false;
    rec.continuous = voiceMode === 'handsfree';

    rec.onstart = () => setListening(true);
    rec.onend = () => {
      setListening(false);
      if (voiceMode === 'handsfree' && open && !speaking && !sending && !booting) {
        handsFreeRestartRef.current = setTimeout(() => startListening(), 500);
      }
    };
    rec.onerror = () => setListening(false);
    rec.onresult = async (event) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
      }
      const spoken = finalTranscript.trim();
      if (!spoken) return;

      if (voiceMode === 'handsfree') {
        await sendMessage(spoken);
      } else {
        setInput((prev) => (prev ? `${prev} ${spoken}` : spoken));
      }
    };

    recognitionRef.current = rec;
    return () => {
      try {
        rec.stop();
      } catch {
        // ignore cleanup races
      }
      recognitionRef.current = null;
    };
  }, [voiceMode, open, speaking, sending, booting, startListening]);

  // Speak assistant messages and drive lip-sync pacing from message length.
  useEffect(() => {
    const assistant = [...messages].reverse().find((m) => m.role === 'assistant');
    if (!assistant?.content) return;
    if (assistant.content === lastAssistantMessageRef.current) return;
    lastAssistantMessageRef.current = assistant.content;

    setSpeechPulse((p) => p + Math.max(1, Math.round(assistant.content.length / 8)));
    if (open) speakAssistant(assistant.content);
  }, [messages, open, speakAssistant]);

  useEffect(() => {
    if (!open) {
      stopListening();
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      if (ttsPacerRef.current) {
        clearInterval(ttsPacerRef.current);
        ttsPacerRef.current = null;
      }
      setSpeaking(false);
      return;
    }
    if (voiceMode === 'handsfree' && supportsSpeechIn && !speaking && !sending && !booting) {
      startListening();
    }
  }, [open, voiceMode, speaking, sending, booting, startListening, stopListening, supportsSpeechIn]);

  const handleVoiceButtonDown = () => {
    if (voiceMode !== 'push') return;
    startListening();
  };

  const handleVoiceButtonUp = () => {
    if (voiceMode !== 'push') return;
    stopListening();
  };

  const handleOpen = async () => {
    trackEvent('mr_worden_chat_open', { source: 'floating_bubble' });
    setOpen(true);
    if (!conversation) await initConversation();
  };

  const upsertLeadFromChat = useCallback(async (rawText) => {
    const text = String(rawText || '').trim();
    if (!text) return;

    const signals = extractLeadSignals(text);
    const intent = scoreIntent(text, signals);
    const now = new Date().toISOString();

    const previous = leadSyncRef.current.profile || {};
    const merged = {
      ...previous,
      ...Object.fromEntries(Object.entries(signals).filter(([, v]) => v !== undefined && v !== null && v !== '')),
    };

    const payload = {
      ...merged,
      status: 'new',
      conversion_source: 'voice_ai',
      score: intent.score,
      score_tier: intent.tier,
      score_reasoning: `Mr. Worden AI chat intent score from live conversation (${intent.tier}).`,
      scored_at: now,
      notes: [
        previous.notes,
        `Chat update (${now}): ${text.slice(0, 380)}`,
      ].filter(Boolean).join('\n\n'),
    };

    const hasStrongIdentity = Boolean(payload.phone || payload.email || payload.address);
    if (!hasStrongIdentity) {
      leadSyncRef.current.profile = merged;
      return;
    }

    try {
      if (leadSyncRef.current.id) {
        await base44.entities.Lead.update(leadSyncRef.current.id, payload);
      } else {
        const created = await base44.entities.Lead.create({
          name: payload.name || 'Website Visitor',
          phone: payload.phone || 'Not provided',
          ...payload,
        });
        leadSyncRef.current.id = created?.id || null;
      }

      leadSyncRef.current.profile = merged;

      trackEvent('mr_worden_lead_intelligence_sync', {
        lead_score: intent.score,
        lead_tier: intent.tier,
        has_phone: Boolean(payload.phone),
        has_email: Boolean(payload.email),
        has_address: Boolean(payload.address),
        has_sqft: Boolean(payload.sqft),
      });

      if (intent.tier === 'hot' || intent.tier === 'warm') {
        trackQualifiedLeadSignal({}, `mr_worden_${intent.tier}_intent`);
      }
    } catch (err) {
      console.error('Lead intelligence sync failed', err);
    }
  }, []);

  const sendMessage = async (text) => {
    if (!text || sending) return;
    setSending(true);
    try {
      await upsertLeadFromChat(text);

      // Optimistically render the user message so the chat feels instant.
      setMessages((prev) => [...prev, { role: 'user', content: text }]);

      const conv = conversation || (await initConversation());
      if (!conv) return;
      await base44.agents.addMessage(conv, { role: 'user', content: text });
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setInput('');
    await sendMessage(text);
  };

  const handleQuickPrompt = async (text) => {
    if (sending || booting) return;
    trackEvent('mr_worden_quick_prompt_click', { prompt: text.slice(0, 60) });
    setInput('');
    await sendMessage(text);
  };

  return (
    <>
      {/* Floating trigger */}
      <AnimatePresence>
        {!open && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 1.5 }}
            className="absolute bottom-5 right-4 sm:bottom-8 sm:right-8 z-40"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
          >
            <motion.div
              animate={{ y: [0, -7, 0], rotate: [0, -0.5, 0.5, 0] }}
              transition={{ repeat: Infinity, duration: 4.6, ease: 'easeInOut' }}
              className="relative"
            >
              <div className="absolute inset-0 rounded-full bg-primary/30 blur-2xl scale-125 pointer-events-none" />
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ repeat: Infinity, duration: 15, ease: 'linear' }}
                className="absolute -inset-2 rounded-full border border-primary/35 pointer-events-none"
              />
              <div className="absolute -inset-3 rounded-full bg-gradient-to-br from-primary/20 via-transparent to-sky-300/15 blur-xl pointer-events-none" />

              <button type="button" onClick={handleOpen} aria-label="Open AI consultant chat" className="relative z-10">
                <div className="w-[128px] h-[128px] rounded-full border border-primary/65 bg-black/65 overflow-hidden shadow-[0_26px_56px_rgba(0,0,0,0.58)]">
                  <WebGLPersonaAvatar
                    mode={avatarState}
                    speechPulse={speechPulse}
                    speechIntensity={speaking ? 0.9 : 0.55}
                    onModelModeChange={setModelMode}
                    className="w-full h-full"
                  />
                </div>
              </button>
              <span className="absolute top-4 right-3 w-3 h-3 bg-green-500 rounded-full border-2 border-black shadow-[0_0_12px_rgba(34,197,94,.8)]" />
              <div className="absolute -top-2 -left-2 bg-primary text-primary-foreground px-2 py-1 rounded-full text-[9px] font-display font-bold tracking-[0.14em] uppercase border border-primary/40">
                AI
              </div>
            </motion.div>

            <div className="absolute right-[6rem] bottom-4 sm:bottom-6 text-left leading-none bg-black/85 border border-primary/45 px-3 py-2 backdrop-blur-md whitespace-nowrap rounded-lg shadow-[0_10px_28px_rgba(0,0,0,0.42)]">
              <button
                type="button"
                onClick={handleOpen}
                className="text-left"
                aria-label="Open AI consultant chat"
              >
                <p className="font-display font-black text-[11px] tracking-[0.15em] uppercase text-primary flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3" />
                  Meet Mr. Worden
                </p>
                <p className="font-display text-[9px] tracking-[0.2em] uppercase opacity-80 mt-0.5 text-foreground">
                  Premium founder concierge · 24/7
                </p>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="absolute bottom-6 right-4 sm:right-8 left-4 sm:left-auto z-50 w-auto sm:w-[480px] h-[680px] max-h-[86vh] bg-card/95 border border-primary/40 shadow-[0_30px_72px_rgba(0,0,0,0.58)] rounded-2xl flex flex-col overflow-hidden backdrop-blur-md"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-black via-zinc-900 to-black text-foreground p-4 flex items-center justify-between border-b border-primary/30">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full border border-primary/60 overflow-hidden bg-black/60 shadow-[0_12px_28px_rgba(0,0,0,0.42)]">
                  <WebGLPersonaAvatar
                    mode={avatarState}
                    speechPulse={speechPulse}
                    speechIntensity={speaking ? 0.95 : 0.5}
                    onModelModeChange={setModelMode}
                    className="w-full h-full"
                  />
                </div>
                <div>
                  <div className="mb-1">
                    <SmartImage
                      src={PRIMARY_LOGO_URL}
                      fallbackSrc={FALLBACK_LOGO_URL}
                      alt="J. Worden and Sons logo"
                      width={320}
                      height={100}
                      sizes="120px"
                      className="w-24 h-7 object-contain"
                    />
                  </div>
                  <p className="font-display font-black text-foreground text-sm uppercase tracking-wider">
                    Mr. Worden · Founder
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                    <p className="font-display text-muted-foreground text-[10px] tracking-wider uppercase">
                      {modelMode === 'model' ? 'Founder model live · voice ready' : 'Founder concierge live · voice ready'}
                    </p>
                  </div>
                  <p className="font-display text-muted-foreground text-[9px] tracking-wider uppercase mt-0.5">
                    Voice profile: {founderVoiceName}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setVoiceOutputEnabled((v) => !v)}
                  disabled={!supportsSpeechOut}
                  className="w-8 h-8 border border-border/80 hover:border-primary/60 flex items-center justify-center disabled:opacity-40"
                  aria-label={voiceOutputEnabled ? 'Mute voice output' : 'Enable voice output'}
                  title={!supportsSpeechOut ? 'Speech output not supported in this browser' : voiceOutputEnabled ? 'Voice output on' : 'Voice output off'}
                >
                  {voiceOutputEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => setVoiceMode((m) => (m === 'handsfree' ? 'push' : 'handsfree'))}
                  disabled={!supportsSpeechIn}
                  className={`w-8 h-8 border flex items-center justify-center ${
                    voiceMode === 'handsfree' ? 'border-primary text-primary' : 'border-border/80 hover:border-primary/60'
                  } disabled:opacity-40`}
                  aria-label="Toggle hands-free voice mode"
                  title={!supportsSpeechIn ? 'Speech input not supported in this browser' : voiceMode === 'handsfree' ? 'Hands-free mode on' : 'Push-to-talk mode'}
                >
                  <Radio className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="text-muted-foreground hover:text-foreground p-1"
                  aria-label="Close chat"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="px-4 py-2.5 border-b border-primary/20 bg-gradient-to-r from-primary/10 via-transparent to-sky-300/10">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 overflow-x-auto">
                  {TRUST_SIGNALS.map((item) => (
                    <span key={item} className="shrink-0 inline-flex items-center gap-1 px-2 py-1 text-[10px] font-display tracking-[0.12em] uppercase border border-primary/30 text-foreground/90 bg-black/25 rounded-full">
                      <ShieldCheck className="w-3 h-3 text-primary" />
                      {item}
                    </span>
                  ))}
                </div>
                <a
                  href="tel:+18044461296"
                  className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-display font-bold tracking-[0.12em] uppercase bg-primary text-primary-foreground rounded-md"
                  aria-label="Call now"
                >
                  <Phone className="w-3 h-3" />
                  Call Now
                </a>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-background">
              {booting && messages.length === 0 && (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] px-4 py-2.5 text-sm leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-2xl rounded-br-sm shadow-[0_8px_20px_rgba(0,0,0,0.2)]'
                        : 'bg-card border border-border text-foreground rounded-2xl rounded-bl-sm'
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex justify-start">
                  <div className="bg-card border border-border px-4 py-2.5">
                    <Loader2 className="w-4 h-4 text-primary animate-spin" />
                  </div>
                </div>
              )}
            </div>

            {/* Quick prompts */}
            <div className="px-3 pt-2 pb-1 border-t border-border bg-card/70">
              <div className="flex gap-2 overflow-x-auto">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => handleQuickPrompt(prompt)}
                    disabled={sending || booting}
                    className="shrink-0 text-left px-3 py-1.5 text-xs font-display tracking-wide border border-border hover:border-primary/60 hover:bg-primary/10 transition-colors disabled:opacity-50"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-3 border-t border-border bg-card flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (voiceMode === 'handsfree') {
                    if (listening) stopListening();
                    else startListening();
                  }
                }}
                onPointerDown={handleVoiceButtonDown}
                onPointerUp={handleVoiceButtonUp}
                onPointerCancel={handleVoiceButtonUp}
                onPointerLeave={handleVoiceButtonUp}
                onTouchStart={handleVoiceButtonDown}
                onTouchEnd={handleVoiceButtonUp}
                disabled={booting || sending || !supportsSpeechIn}
                className={`w-11 h-11 border flex items-center justify-center transition-colors ${
                  listening
                    ? 'border-primary bg-primary/15 text-primary'
                    : 'border-border text-muted-foreground hover:border-primary/60 hover:text-primary'
                } disabled:opacity-50`}
                aria-label={listening ? 'Stop voice input' : 'Start voice input'}
                title={!supportsSpeechIn ? 'Speech input not supported in this browser' : voiceMode === 'handsfree' ? 'Hands-free voice input' : 'Press and hold to talk'}
              >
                {listening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              </button>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={listening ? 'Listening… speak now' : 'Ask about pricing, timing, materials...'}
                disabled={sending || booting}
                className="flex-1 bg-muted border border-border px-3 py-2.5 text-foreground text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || sending || booting}
                className="w-11 h-11 bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Send"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
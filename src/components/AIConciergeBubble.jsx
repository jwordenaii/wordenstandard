import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader2, Mic, MicOff, Volume2, VolumeX, Radio } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import WebGLPersonaAvatar from './WebGLPersonaAvatar';

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
  const scrollRef = useRef(null);
  const recognitionRef = useRef(null);
  const handsFreeRestartRef = useRef(null);
  const lastAssistantMessageRef = useRef('');

  const avatarState = open
    ? (speaking || sending || booting ? 'talking' : listening ? 'listening' : 'idle')
    : hovered
      ? 'wave'
      : 'idle';

  const QUICK_PROMPTS = [
    'How much does a driveway usually cost?',
    'How soon can you start in Chester?',
    'Is asphalt better than concrete for my project?',
  ];

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setSupportsSpeechIn(Boolean(window.SpeechRecognition || window.webkitSpeechRecognition));
    setSupportsSpeechOut(Boolean(window.speechSynthesis));
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

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text.trim());
      utterance.rate = 1.02;
      utterance.pitch = 0.96;
      utterance.volume = 1;
      utterance.onstart = () => {
        setSpeaking(true);
        setSpeechPulse((p) => p + Math.max(1, Math.round(text.length / 6)));
      };
      utterance.onboundary = () => {
        setSpeechPulse((p) => p + 1);
      };
      utterance.onend = () => {
        setSpeaking(false);
        if (voiceMode === 'handsfree' && open) {
          handsFreeRestartRef.current = setTimeout(() => startListening(), 350);
        }
      };
      utterance.onerror = () => setSpeaking(false);
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
          content: "Hi — I'm the J. Worden & Sons AI consultant. Ask me anything about paving: pricing, timing, materials, or whether asphalt is right for your project. I'll answer straight.",
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
        setMessages(data.messages);
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
    setOpen(true);
    if (!conversation) await initConversation();
  };

  const sendMessage = async (text) => {
    if (!text || sending) return;
    setSending(true);
    try {
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
              <div className="absolute inset-0 rounded-full bg-primary/25 blur-xl scale-110 pointer-events-none" />
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ repeat: Infinity, duration: 15, ease: 'linear' }}
                className="absolute -inset-2 rounded-full border border-primary/30 pointer-events-none"
              />

              <button type="button" onClick={handleOpen} aria-label="Open AI consultant chat" className="relative z-10">
                <div className="w-[96px] h-[96px] rounded-full border border-primary/40 bg-black/40 overflow-hidden">
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
            </motion.div>

            <div className="absolute right-[5.3rem] bottom-4 sm:bottom-6 text-left leading-none bg-black/80 border border-primary/40 px-3 py-2 backdrop-blur-sm whitespace-nowrap">
              <button
                type="button"
                onClick={handleOpen}
                className="text-left"
                aria-label="Open AI consultant chat"
              >
                <p className="font-display font-black text-[11px] tracking-[0.15em] uppercase text-primary">
                  Meet Mr. Worden AI
                </p>
                <p className="font-display text-[9px] tracking-[0.2em] uppercase opacity-80 mt-0.5 text-foreground">
                  Real-time concierge · 24/7
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
            className="absolute bottom-6 right-4 sm:right-8 left-4 sm:left-auto z-50 w-auto sm:w-[430px] h-[620px] max-h-[82vh] bg-card/95 border border-primary/30 shadow-2xl rounded-xl flex flex-col overflow-hidden backdrop-blur-sm"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-black via-zinc-900 to-black text-foreground p-4 flex items-center justify-between border-b border-primary/30">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full border border-primary/40 overflow-hidden bg-black/50">
                  <WebGLPersonaAvatar
                    mode={avatarState}
                    speechPulse={speechPulse}
                    speechIntensity={speaking ? 0.95 : 0.5}
                    onModelModeChange={setModelMode}
                    className="w-full h-full"
                  />
                </div>
                <div>
                  <p className="font-display font-black text-foreground text-sm uppercase tracking-wider">
                    J. Worden AI
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                    <p className="font-display text-muted-foreground text-[10px] tracking-wider uppercase">
                      {modelMode === 'model' ? 'Real model · voice ready' : 'Fallback model · voice ready'}
                    </p>
                  </div>
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
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card border border-border text-foreground'
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
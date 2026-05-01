import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader2, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import MrWordenAvatar from './MrWordenAvatar';

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
  const scrollRef = useRef(null);

  const avatarState = open ? (sending || booting ? 'talking' : 'listening') : 'idle';

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

  const handleOpen = async () => {
    setOpen(true);
    if (!conversation) await initConversation();
  };

  const handleSend = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setInput('');
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
            className="absolute bottom-5 right-4 sm:bottom-8 sm:right-8 z-40 flex items-center gap-3 bg-black/75 text-foreground pl-2 pr-4 py-2 border border-primary/40 shadow-2xl hover:shadow-primary/30 transition-shadow group backdrop-blur-sm"
          >
            <div className="relative -my-2">
              <MrWordenAvatar
                state={avatarState}
                size={54}
                onClick={handleOpen}
                isOpen={open}
              />
              <span className="absolute top-3 right-2 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-black" />
            </div>
            <div className="text-left leading-none">
              <button
                type="button"
                onClick={handleOpen}
                className="text-left"
                aria-label="Open AI consultant chat"
              >
              <p className="font-display font-black text-[11px] tracking-[0.15em] uppercase">
                Ask Mr. Worden
              </p>
              <p className="font-display text-[9px] tracking-[0.2em] uppercase opacity-70 mt-0.5">
                Live AI Concierge · 24/7
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
            className="absolute bottom-8 right-5 sm:right-8 left-5 sm:left-auto z-50 w-auto sm:w-[400px] h-[560px] max-h-[80vh] bg-card border border-border shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-obsidian text-foreground p-4 flex items-center justify-between border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-primary flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-display font-black text-foreground text-sm uppercase tracking-wider">
                    J. Worden AI
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                    <p className="font-display text-muted-foreground text-[10px] tracking-wider uppercase">
                      Online · Replies instantly
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1"
                aria-label="Close chat"
              >
                <X className="w-5 h-5" />
              </button>
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

            {/* Input */}
            <form onSubmit={handleSend} className="p-3 border-t border-border bg-card flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about pricing, timing, materials..."
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
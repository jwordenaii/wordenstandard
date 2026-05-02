import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PRIMARY_LOGO_URL, FALLBACK_LOGO_URL } from '@/lib/branding';

const SPLASH_KEY = 'jworden_splash_shown';

export default function SplashScreen() {
  // Only show once per browser session — avoids showing on every route change
  const [visible, setVisible] = useState(() => {
    if (typeof window === 'undefined') return false;
    return !sessionStorage.getItem(SPLASH_KEY);
  });

  useEffect(() => {
    if (!visible) return;
    sessionStorage.setItem(SPLASH_KEY, '1');
    const timer = setTimeout(() => setVisible(false), 5000);
    return () => clearTimeout(timer);
  }, [visible]);

  const [logoSrc, setLogoSrc] = useState(PRIMARY_LOGO_URL);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          className="fixed inset-0 z-[9999] bg-background flex items-center justify-center"
        >
          <motion.img
            src={logoSrc}
            alt="J. Worden & Sons Paving"
            onError={() => setLogoSrc(FALLBACK_LOGO_URL)}
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="w-[90%] max-w-5xl h-auto object-contain"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

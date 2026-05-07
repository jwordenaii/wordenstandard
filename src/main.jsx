import React from 'react'
import ReactDOM from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import * as Sentry from "@sentry/react";
import App from '@/App.jsx'
import '@/index.css'
import { trackEvent } from '@/api/client'

// Only initialize Sentry when a real DSN is configured.
// Sentry DSNs always start with "https://" and contain "@" + ".ingest." to
// identify the project ingest host. Placeholders (e.g. "your-dsn-here",
// "REPLACE_ME") are rejected silently so we don't spam the console.
const _sentryDsn = (import.meta.env.VITE_SENTRY_DSN || '').trim()
const _isValidSentryDsn = /^https:\/\/[^@]+@[^/]+\.ingest\.[^/]+\/\d+/.test(_sentryDsn)
if (_isValidSentryDsn) {
  Sentry.init({
    dsn: _sentryDsn,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    // Performance Monitoring
    tracesSampleRate: 1.0, //  Capture 100% of the transactions
    // Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
    tracePropagationTargets: ["localhost", /^https:\/\/codexbuildfreeofbase44-production\.up\.railway\.app/, /^https:\/\/app\.jwordenasphaltpaving\.com/],
    // Session Replay
    replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
    replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
  });
}

// ── Global conversion tracking for tel: / mailto: clicks ──────────────────
// Catches every phone/email link site-wide so Google Ads + GA4 see the
// click without needing onClick on each individual <a>.
if (typeof document !== 'undefined') {
  document.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a[href]')
    if (!a) return
    const href = a.getAttribute('href') || ''
    if (href.startsWith('tel:')) {
      trackEvent('phone_click', { source: location.pathname, href })
    } else if (href.startsWith('mailto:')) {
      trackEvent('email_click', { source: location.pathname, href })
    }
  }, { capture: true, passive: true })
}

const rootElement = document.getElementById('root');
if (rootElement.hasChildNodes()) {
  ReactDOM.hydrateRoot(
    rootElement,
    <HelmetProvider>
      <App />
    </HelmetProvider>
  );
} else {
  ReactDOM.createRoot(rootElement).render(
    <HelmetProvider>
      <App />
    </HelmetProvider>
  );
}

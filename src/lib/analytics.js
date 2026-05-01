// Thin wrapper around Google Analytics 4 + Google Ads conversion tracking.
// Uses the global gtag() function loaded in index.html. All calls are safe no-ops
// if gtag isn't available yet (e.g. during SSR or before the script loads).

// ─────────────────────────────────────────────────────────────
// GOOGLE ADS CONVERSION IDs
// ─────────────────────────────────────────────────────────────
// Your Google Ads account ID (installed in index.html): AW-18031160509
//
// To activate conversion tracking, create 2 conversion actions in Google Ads:
//   Tools → Conversions → + New conversion action → "Website"
//
// 1. LEAD SUBMITTED — fires when someone completes the quote form
//    Name it: "Quote Form Submit"
//    Value: Use the same value for each conversion → $250
//
// 2. PHONE CLICK — fires when someone clicks a phone number
//    Name it: "Phone Call Click"
//    Value: Use the same value for each conversion → $150
//
// After creating each, Google gives you a "Conversion label" (e.g. "AbC-D_efGhIjKl")
// Paste them below — replace PASTE_LEAD_LABEL and PASTE_PHONE_LABEL.
const GADS_ID = 'AW-18031160509';
const GADS_LEAD_CONVERSION = `${GADS_ID}/PASTE_LEAD_LABEL`;
const GADS_PHONE_CONVERSION = `${GADS_ID}/PASTE_PHONE_LABEL`;

const hasGtag = () => typeof window !== 'undefined' && typeof window.gtag === 'function';

/**
 * Track a GA4 event.
 * @param {string} eventName - GA4 event name (e.g. 'lead_submitted', 'photo_analyzed')
 * @param {object} params - event parameters (value, currency, etc.)
 */
export const trackEvent = (eventName, params = {}) => {
  if (!hasGtag()) return;
  window.gtag('event', eventName, params);
};

/**
 * Fire a Google Ads conversion.
 * Call this when a real business event happens (lead submitted, call clicked).
 * @param {string} sendTo - e.g. 'AW-XXXXXXXX/YYYYYYYY' (Ads conversion ID + label)
 * @param {object} params - { value, currency, transaction_id }
 */
export const trackConversion = (sendTo, params = {}) => {
  if (!hasGtag()) return;
  window.gtag('event', 'conversion', {
    send_to: sendTo,
    ...params,
  });
};

/**
 * Convenience: track a lead submission to both GA4 and Google Ads.
 * Replace the AW-XXXXXXXX/YYYYYYYY with your real Ads conversion ID when you
 * create it in Google Ads (Tools & Settings → Conversions).
 */
export const trackLeadSubmission = (lead = {}) => {
  // GA4 event
  trackEvent('generate_lead', {
    surface_type: lead.surface_type,
    sqft: lead.sqft,
    urgency: lead.urgency,
    value: 250, // estimated lead value for ROAS math
    currency: 'USD',
  });

  // Google Ads conversion — only fires once you paste your conversion label above
  if (!GADS_LEAD_CONVERSION.includes('PASTE_')) {
    trackConversion(GADS_LEAD_CONVERSION, {
      value: 250,
      currency: 'USD',
    });
  }
};

/**
 * Track when someone clicks the phone CTA — a strong intent signal.
 */
export const trackPhoneClick = (source = 'unknown') => {
  trackEvent('phone_click', { source });
  if (!GADS_PHONE_CONVERSION.includes('PASTE_')) {
    trackConversion(GADS_PHONE_CONVERSION, {
      value: 150,
      currency: 'USD',
    });
  }
};

/**
 * Track AI photo analyzer usage.
 */
export const trackPhotoAnalysis = (result = {}) => {
  trackEvent('photo_analyzed', {
    condition_grade: result.condition_grade,
    recommended_action: result.recommended_action,
  });
};
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Fetches live Google Business reviews via Places API (New).
 * Publicly callable — no auth required (reviews are public social proof).
 * Caches results in-memory for 1 hour to respect quota and perf.
 *
 * Requires secrets: GOOGLE_PLACES_API_KEY, GOOGLE_PLACE_ID
 * Gracefully returns empty payload if secrets are missing.
 */

let cache = { data: null, expiresAt: 0 };
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

Deno.serve(async (req) => {
  try {
    const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');
    const placeId = Deno.env.get('GOOGLE_PLACE_ID');

    if (!apiKey || !placeId) {
      return Response.json({
        configured: false,
        reviews: [],
        rating: null,
        total: 0,
        message: 'Google Places not configured yet',
      });
    }

    if (cache.data && Date.now() < cache.expiresAt) {
      return Response.json({ ...cache.data, cached: true });
    }

    const url = `https://places.googleapis.com/v1/places/${placeId}`;
    const res = await fetch(url, {
      headers: {
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'displayName,rating,userRatingCount,reviews,googleMapsUri',
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('[fetchGoogleReviews] Places API error:', res.status, errText);
      return Response.json({
        configured: true,
        reviews: [],
        rating: null,
        total: 0,
        error: `Places API error ${res.status}`,
      });
    }

    const data = await res.json();

    const payload = {
      configured: true,
      rating: data.rating || null,
      total: data.userRatingCount || 0,
      mapsUri: data.googleMapsUri,
      displayName: data.displayName?.text,
      reviews: (data.reviews || []).map((r) => ({
        author: r.authorAttribution?.displayName || 'Google User',
        authorPhoto: r.authorAttribution?.photoUri,
        rating: r.rating,
        text: r.text?.text || r.originalText?.text || '',
        relativeTime: r.relativePublishTimeDescription,
        publishTime: r.publishTime,
      })),
    };

    cache = { data: payload, expiresAt: Date.now() + CACHE_TTL_MS };
    return Response.json(payload);
  } catch (error) {
    console.error('[fetchGoogleReviews]', error);
    return Response.json({
      configured: false,
      reviews: [],
      rating: null,
      total: 0,
      error: error.message,
    });
  }
});
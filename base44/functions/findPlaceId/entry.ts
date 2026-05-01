import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * One-time utility to look up the Google Place ID for J. Worden & Sons.
 * Uses Places API (New) Text Search. Admin-only.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');
    if (!apiKey) return Response.json({ error: 'GOOGLE_PLACES_API_KEY not set' }, { status: 500 });

    const queries = [
      'J. Worden and Sons Asphalt Paving Chester VA',
      'J Worden Sons Paving Chester Virginia',
      'J. Worden & Sons Paving Chesterfield VA',
    ];

    const results = [];
    for (const q of queries) {
      const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.googleMapsUri',
        },
        body: JSON.stringify({ textQuery: q }),
      });
      const data = await res.json();
      results.push({ query: q, status: res.status, data });
    }

    return Response.json({ results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
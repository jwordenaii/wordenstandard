import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Creates a Google Calendar event for a site visit with a lead.
 * Also emails the lead a confirmation.
 *
 * Input: {
 *   lead_id: string,
 *   start_iso: string (required),
 *   end_iso: string (required),
 *   location: string,
 *   notes: string
 * }
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { lead_id, start_iso, end_iso, location, notes } = await req.json();
    if (!start_iso || !end_iso) {
      return Response.json({ error: 'start_iso and end_iso required' }, { status: 400 });
    }

    // Load lead details if lead_id provided
    let lead = null;
    if (lead_id) {
      try {
        lead = await base44.asServiceRole.entities.Lead.get(lead_id);
      } catch {
        // non-fatal
      }
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlecalendar');

    const summary = lead
      ? `Site Visit — ${lead.name} (${lead.surface_type || 'paving'})`
      : 'Site Visit — J. Worden & Sons';

    const descLines = [
      '📋 SITE VISIT — J. Worden & Sons Asphalt Paving',
      '',
      lead?.name && `Lead: ${lead.name}`,
      lead?.phone && `Phone: ${lead.phone}`,
      lead?.email && `Email: ${lead.email}`,
      lead?.surface_type && `Surface: ${lead.surface_type}`,
      lead?.sqft && `Est. sqft: ${Math.round(lead.sqft).toLocaleString()}`,
      notes && `\nNotes:\n${notes}`,
    ].filter(Boolean).join('\n');

    const eventBody = {
      summary,
      description: descLines,
      location: location || lead?.address || '',
      start: { dateTime: start_iso, timeZone: 'America/New_York' },
      end: { dateTime: end_iso, timeZone: 'America/New_York' },
      reminders: {
        useDefault: false,
        overrides: [{ method: 'popup', minutes: 60 }, { method: 'popup', minutes: 15 }],
      },
    };

    // Add lead as attendee if email provided
    if (lead?.email) {
      eventBody.attendees = [{ email: lead.email, displayName: lead.name || undefined }];
    }

    const calRes = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events?sendUpdates=all',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventBody),
      }
    );

    if (!calRes.ok) {
      const err = await calRes.text();
      console.error('[bookSiteVisit] Calendar error:', err);
      return Response.json({ error: 'Calendar API error', detail: err }, { status: 500 });
    }

    const event = await calRes.json();

    // Update lead status → contacted
    if (lead) {
      try {
        await base44.asServiceRole.entities.Lead.update(lead.id, {
          status: 'contacted',
          notes: `${lead.notes || ''}\n\n[${new Date().toISOString().slice(0, 10)}] Site visit booked: ${event.htmlLink}`.trim(),
        });
      } catch (e) {
        console.error('[bookSiteVisit] Lead update failed:', e);
      }
    }

    return Response.json({
      success: true,
      event_id: event.id,
      event_link: event.htmlLink,
      start: event.start,
      end: event.end,
    });
  } catch (error) {
    console.error('[bookSiteVisit]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Returns the next N available 1-hour slots between 8am–5pm weekdays.
 * Used by the AI paving consultant to propose site-visit times to leads.
 *
 * Input:  { days_ahead?: number (default 10), slot_duration_minutes?: number (default 60) }
 * Output: { slots: [{ start_iso, end_iso, human_readable }] }
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const daysAhead = Math.min(Math.max(body.days_ahead || 10, 1), 21);
    const slotMinutes = body.slot_duration_minutes || 60;

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlecalendar');

    const now = new Date();
    const timeMin = new Date(now.getTime() + 24 * 60 * 60 * 1000); // start tomorrow
    const timeMax = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

    // Use freebusy API — much cleaner than event listing
    const fbRes = await fetch('https://www.googleapis.com/calendar/v3/freeBusy', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        timeZone: 'America/New_York',
        items: [{ id: 'primary' }],
      }),
    });

    if (!fbRes.ok) {
      const err = await fbRes.text();
      return Response.json({ error: 'Calendar API error', detail: err }, { status: 500 });
    }

    const fbData = await fbRes.json();
    const busy = (fbData.calendars?.primary?.busy || []).map((b) => ({
      start: new Date(b.start).getTime(),
      end: new Date(b.end).getTime(),
    }));

    // Generate candidate slots: weekdays 8am, 10am, 1pm, 3pm — all in America/New_York.
    // Server runs in UTC, so we build each slot via an ISO string with an explicit ET offset.
    // DST rule (US): EDT (-04:00) from 2nd Sun of March through 1st Sun of November; EST (-05:00) otherwise.
    const isEDT = (date) => {
      const y = date.getUTCFullYear();
      // 2nd Sunday of March
      const march = new Date(Date.UTC(y, 2, 1));
      const marchStart = new Date(Date.UTC(y, 2, 1 + ((7 - march.getUTCDay()) % 7) + 7, 7)); // 2am local = 7 UTC
      // 1st Sunday of November
      const nov = new Date(Date.UTC(y, 10, 1));
      const novEnd = new Date(Date.UTC(y, 10, 1 + ((7 - nov.getUTCDay()) % 7), 6)); // 2am local = 6 UTC
      return date >= marchStart && date < novEnd;
    };

    const CANDIDATE_HOURS = [8, 10, 13, 15];
    const slots = [];

    for (let d = 1; d <= daysAhead && slots.length < 6; d++) {
      const day = new Date(now.getTime() + d * 24 * 60 * 60 * 1000);
      // Use ET calendar date, not UTC — ask Intl for the ET weekday.
      const etDayName = day.toLocaleString('en-US', { timeZone: 'America/New_York', weekday: 'short' });
      if (etDayName === 'Sat' || etDayName === 'Sun') continue;

      // Get the ET calendar YYYY-MM-DD for this day
      const etDateStr = day.toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); // "2026-04-22"

      for (const hour of CANDIDATE_HOURS) {
        if (slots.length >= 6) break;

        const probe = new Date(`${etDateStr}T12:00:00Z`);
        const offset = isEDT(probe) ? '-04:00' : '-05:00';
        const hh = String(hour).padStart(2, '0');
        const slotStart = new Date(`${etDateStr}T${hh}:00:00${offset}`);
        const slotEnd = new Date(slotStart.getTime() + slotMinutes * 60 * 1000);

        // Check conflict with any busy block
        const startMs = slotStart.getTime();
        const endMs = slotEnd.getTime();
        const conflict = busy.some((b) => startMs < b.end && endMs > b.start);
        if (!conflict) {
          slots.push({
            start_iso: slotStart.toISOString(),
            end_iso: slotEnd.toISOString(),
            human_readable: slotStart.toLocaleString('en-US', {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
              timeZone: 'America/New_York',
            }) + ' EST',
          });
        }
      }
    }

    return Response.json({ slots });
  } catch (error) {
    console.error('[checkCalendarAvailability]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
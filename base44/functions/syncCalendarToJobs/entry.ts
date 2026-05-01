import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Trigger keywords — events with these words in title are treated as jobs
const JOB_KEYWORDS = ['paving', 'driveway', 'parking', 'seal', 'asphalt', 'site visit', 'j. worden', 'worden'];

const isJobEvent = (event) => {
  const text = `${event.summary || ''} ${event.description || ''}`.toLowerCase();
  return JOB_KEYWORDS.some((kw) => text.includes(kw));
};

const extractDate = (event) => {
  // Handle both all-day (date) and timed (dateTime) events
  const start = event.start?.dateTime || event.start?.date;
  if (!start) return null;
  return start.split('T')[0]; // YYYY-MM-DD
};

const extractStartTime = (event) => {
  if (!event.start?.dateTime) return undefined;
  const d = new Date(event.start.dateTime);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
};

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const base44 = createClientFromRequest(req);
    const state = body.data?._provider_meta?.['x-goog-resource-state'];

    if (state === 'sync') {
      return Response.json({ status: 'sync_ack' });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlecalendar');
    const authHeader = { Authorization: `Bearer ${accessToken}` };

    // Load sync token
    const existing = await base44.asServiceRole.entities.SyncState.list();
    const syncRecord = existing.length > 0 ? existing[0] : null;

    let url = 'https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=100';
    if (syncRecord?.sync_token) {
      url += `&syncToken=${syncRecord.sync_token}`;
    } else {
      url += '&timeMin=' + new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    }

    let res = await fetch(url, { headers: authHeader });
    if (res.status === 410) {
      url = 'https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=100'
        + '&timeMin=' + new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      res = await fetch(url, { headers: authHeader });
    }
    if (!res.ok) {
      console.error('Calendar API error:', res.status, await res.text());
      return Response.json({ status: 'api_error' }, { status: 200 });
    }

    const allItems = [];
    let pageData = await res.json();
    let newSyncToken = null;
    while (true) {
      allItems.push(...(pageData.items || []));
      if (pageData.nextSyncToken) newSyncToken = pageData.nextSyncToken;
      if (!pageData.nextPageToken) break;
      const nextRes = await fetch(url + `&pageToken=${pageData.nextPageToken}`, { headers: authHeader });
      if (!nextRes.ok) break;
      pageData = await nextRes.json();
    }

    let created = 0, updated = 0, skipped = 0;

    for (const event of allItems) {
      // Handle deletions
      if (event.status === 'cancelled') {
        const jobs = await base44.asServiceRole.entities.Job.filter({ gcal_event_id: event.id });
        for (const j of jobs) {
          await base44.asServiceRole.entities.Job.update(j.id, { status: 'cancelled' });
        }
        continue;
      }

      if (!isJobEvent(event)) {
        skipped++;
        continue;
      }

      const scheduled_date = extractDate(event);
      if (!scheduled_date) {
        skipped++;
        continue;
      }

      const jobData = {
        title: event.summary || 'Untitled Job',
        scheduled_date,
        start_time: extractStartTime(event),
        address: event.location || undefined,
        notes: event.description || undefined,
        gcal_event_id: event.id,
      };

      const existingJobs = await base44.asServiceRole.entities.Job.filter({ gcal_event_id: event.id });
      if (existingJobs.length > 0) {
        await base44.asServiceRole.entities.Job.update(existingJobs[0].id, jobData);
        updated++;
      } else {
        await base44.asServiceRole.entities.Job.create(jobData);
        created++;
      }
    }

    if (newSyncToken) {
      if (syncRecord) {
        await base44.asServiceRole.entities.SyncState.update(syncRecord.id, { sync_token: newSyncToken });
      } else {
        await base44.asServiceRole.entities.SyncState.create({ sync_token: newSyncToken });
      }
    }

    console.log(`Calendar sync: ${created} created, ${updated} updated, ${skipped} skipped`);
    return Response.json({ status: 'ok', created, updated, skipped });
  } catch (error) {
    console.error('syncCalendarToJobs error:', error.message);
    return Response.json({ status: 'error', error: error.message }, { status: 200 });
  }
});
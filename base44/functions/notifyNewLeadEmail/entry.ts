import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const OWNER_EMAIL = 'j.wordenandsonspaving@gmail.com';

const fmt = (s) => (s ? s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : '—');
const fmtSqft = (n) => (n ? `${Math.round(n).toLocaleString()} sq ft` : '—');

const urgencyLabel = (u) => {
  if (u === 'urgent') return '🔥 URGENT';
  if (u === 'standard') return '⚡ Standard';
  if (u === 'flexible') return '📅 Flexible';
  return '📋 Not specified';
};

const buildBody = (lead) => {
  const when = new Date(lead.created_date || Date.now()).toLocaleString('en-US', {
    timeZone: 'America/New_York',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  });

  return `🚨 NEW LEAD — ${lead.name || 'Unknown'}
${urgencyLabel(lead.urgency)}
Submitted: ${when}

━━━━━━━━━━━━━━━━━━━━━━━━━━
CONTACT INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━
Name:    ${lead.name || '—'}
Phone:   ${lead.phone || '—'}
Email:   ${lead.email || '—'}

━━━━━━━━━━━━━━━━━━━━━━━━━━
PROJECT DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━
Surface:    ${fmt(lead.surface_type)}
Area:       ${fmtSqft(lead.sqft)}
Material:   ${fmt(lead.material)}
Timeline:   ${fmt(lead.urgency)}
${lead.address ? `Address:    ${lead.address}` : ''}

${lead.notes ? `━━━━━━━━━━━━━━━━━━━━━━━━━━\nCUSTOMER NOTES\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n${lead.notes}\n` : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━
NEXT STEPS
━━━━━━━━━━━━━━━━━━━━━━━━━━
→ Call ${lead.phone || 'the lead'} within 24 hours${lead.urgency === 'urgent' ? ' — URGENT, reach out today if possible' : ''}
→ View full lead details: https://jwordenasphaltpaving.com/dashboard
→ Start AI consultant for this lead: https://jwordenasphaltpaving.com/consultant

— J. Worden & Sons Lead System`;
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    // Entity automation payloads wrap the record in `data`. Support both shapes.
    const lead = body?.data || body?.lead;
    if (!lead) {
      return Response.json({ skipped: true, reason: 'No lead payload.' });
    }

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: OWNER_EMAIL,
      subject: `🚨 New Lead: ${lead.name || 'Unknown'} — ${fmt(lead.surface_type)} (${fmt(lead.urgency)})`,
      body: buildBody(lead),
      from_name: 'J. Worden Lead System',
    });

    return Response.json({ success: true, sentTo: OWNER_EMAIL });
  } catch (error) {
    console.error('[notifyNewLeadEmail] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
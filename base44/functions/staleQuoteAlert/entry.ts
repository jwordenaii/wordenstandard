import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const now = new Date();
    const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);

    // Get all leads with status 'quoted'
    const allLeads = await base44.asServiceRole.entities.Lead.filter({ status: 'quoted' });

    // Filter those that have been in 'quoted' status for more than 5 days
    const stale = allLeads.filter((lead) => {
      const updated = new Date(lead.updated_date);
      return updated <= fiveDaysAgo;
    });

    if (stale.length === 0) {
      return Response.json({ success: true, message: 'No stale quotes found.', staleCount: 0 });
    }

    // Get admin users
    const allUsers = await base44.asServiceRole.entities.User.list();
    const admins = allUsers.filter((u) => u.role === 'admin');

    if (admins.length === 0) {
      return Response.json({ warning: 'No admin users found to email.' });
    }

    const leadLines = stale.map((lead) => {
      const daysSince = Math.floor((now - new Date(lead.updated_date)) / (1000 * 60 * 60 * 24));
      return [
        `  • ${lead.name}`,
        `    Phone:   ${lead.phone || '—'}`,
        `    Email:   ${lead.email || '—'}`,
        `    Surface: ${lead.surface_type ? lead.surface_type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '—'}`,
        `    Sq Ft:   ${lead.sqft ? Math.round(lead.sqft).toLocaleString() : '—'}`,
        `    Stale:   ${daysSince} day${daysSince !== 1 ? 's' : ''} without response`,
      ].join('\n');
    }).join('\n\n');

    const body = `J. WORDEN & SONS — STALE QUOTE ALERT
${now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' })}
${'═'.repeat(44)}

ACTION REQUIRED: ${stale.length} quote${stale.length !== 1 ? 's have' : ' has'} been pending for over 5 days with no status update.

${leadLines}

${'─'.repeat(44)}
Log in to the CRM to follow up or update the status of these leads before they go cold.

— J. Worden & Sons Automated Alerts`;

    for (const admin of admins) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: admin.email,
        subject: `⚠️ ${stale.length} Stale Quote${stale.length !== 1 ? 's' : ''} Need Follow-Up — J. Worden & Sons`,
        body,
        from_name: 'J. Worden & Sons Alerts',
      });
    }

    return Response.json({ success: true, staleCount: stale.length, emailsSent: admins.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
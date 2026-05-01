import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get all leads
    const allLeads = await base44.asServiceRole.entities.Lead.list();

    const now = new Date();
    const firstOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const firstOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthName = firstOfLastMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' });

    // Filter leads created last month
    const lastMonthLeads = allLeads.filter((lead) => {
      const d = new Date(lead.created_date);
      return d >= firstOfLastMonth && d < firstOfThisMonth;
    });

    const totalLeads = lastMonthLeads.length;
    const wonLeads = lastMonthLeads.filter((l) => l.status === 'won');
    const quotedLeads = lastMonthLeads.filter((l) => ['quoted', 'won'].includes(l.status));

    // Estimate revenue from won leads using sqft-based rough calc
    const estimatedRevenue = wonLeads.reduce((sum, lead) => {
      const sqft = lead.sqft || 0;
      // ~$5/sqft blended average (materials + labor)
      return sum + sqft * 5;
    }, 0);

    // Breakdown by surface type
    const byType = lastMonthLeads.reduce((acc, lead) => {
      const type = lead.surface_type || 'Unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    const byTypeLines = Object.entries(byType)
      .map(([type, count]) => `  • ${type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}: ${count}`)
      .join('\n') || '  • No leads recorded';

    // Breakdown by urgency
    const urgencyBreakdown = lastMonthLeads.reduce((acc, lead) => {
      const u = lead.urgency || 'unknown';
      acc[u] = (acc[u] || 0) + 1;
      return acc;
    }, {});

    const urgencyLines = Object.entries(urgencyBreakdown)
      .map(([u, count]) => `  • ${u.charAt(0).toUpperCase() + u.slice(1)}: ${count}`)
      .join('\n') || '  • No data';

    // Get admin users to email
    const allUsers = await base44.asServiceRole.entities.User.list();
    const admins = allUsers.filter((u) => u.role === 'admin');

    const body = `J. WORDEN & SONS — MONTHLY REVENUE REPORT
${monthName}
${'─'.repeat(44)}

LEAD SUMMARY
  Total New Leads:     ${totalLeads}
  Leads Quoted:        ${quotedLeads.length}
  Leads Won:           ${wonLeads.length}
  Conversion Rate:     ${totalLeads > 0 ? Math.round((wonLeads.length / totalLeads) * 100) : 0}%

ESTIMATED REVENUE (Won Leads)
  Est. Revenue:        $${estimatedRevenue.toLocaleString('en-US')}
  Avg. per Won Lead:   $${wonLeads.length > 0 ? Math.round(estimatedRevenue / wonLeads.length).toLocaleString('en-US') : 0}

LEADS BY SURFACE TYPE
${byTypeLines}

LEADS BY TIMELINE
${urgencyLines}

${'─'.repeat(44)}
Report generated: ${now.toLocaleString('en-US', { timeZone: 'America/New_York' })}
J. Worden & Sons Asphalt Specialist`;

    if (admins.length === 0) {
      return Response.json({ warning: 'No admin users found to email.' });
    }

    for (const admin of admins) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: admin.email,
        subject: `Monthly Revenue Report — ${monthName} | J. Worden & Sons`,
        body,
        from_name: 'J. Worden & Sons Reports',
      });
    }

    return Response.json({ success: true, month: monthName, totalLeads, wonLeads: wonLeads.length, estimatedRevenue, emailsSent: admins.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
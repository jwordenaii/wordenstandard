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

    // Prefer truth data from closed_value and closed_gross_profit.
    const realizedRevenue = wonLeads.reduce((sum, lead) => {
      return sum + (Number(lead.closed_value) || Number(lead.estimated_value) || 0);
    }, 0);

    const realizedGrossProfit = wonLeads.reduce((sum, lead) => {
      const explicit = Number(lead.closed_gross_profit);
      if (Number.isFinite(explicit) && explicit > 0) return sum + explicit;
      const estValue = Number(lead.closed_value) || Number(lead.estimated_value) || 0;
      const marginPct = Number(lead.gross_margin_pct);
      if (estValue > 0 && Number.isFinite(marginPct) && marginPct > 0) {
        return sum + Math.round(estValue * (marginPct / 100));
      }
      return sum;
    }, 0);

    const sourceBreakdown = wonLeads.reduce((acc, lead) => {
      const source = lead.conversion_source || 'other';
      const revenue = Number(lead.closed_value) || Number(lead.estimated_value) || 0;
      const grossProfit = Number(lead.closed_gross_profit) || 0;
      if (!acc[source]) {
        acc[source] = { count: 0, revenue: 0, grossProfit: 0 };
      }
      acc[source].count += 1;
      acc[source].revenue += revenue;
      acc[source].grossProfit += grossProfit;
      return acc;
    }, {});

    const sourceLines = Object.entries(sourceBreakdown)
      .sort((a, b) => (b[1].revenue || 0) - (a[1].revenue || 0))
      .map(([source, stats]) => {
        const label = source.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
        return `  • ${label}: ${stats.count} won, $${Math.round(stats.revenue).toLocaleString('en-US')} revenue`;
      })
      .join('\n') || '  • No won leads by source';

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

REALIZED REVENUE (Won Leads)
  Revenue:             $${Math.round(realizedRevenue).toLocaleString('en-US')}
  Avg. per Won Lead:   $${wonLeads.length > 0 ? Math.round(realizedRevenue / wonLeads.length).toLocaleString('en-US') : 0}
  Gross Profit:        $${Math.round(realizedGrossProfit).toLocaleString('en-US')}

LEADS BY SURFACE TYPE
${byTypeLines}

LEADS BY TIMELINE
${urgencyLines}

WON LEADS BY SOURCE
${sourceLines}

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

    return Response.json({
      success: true,
      month: monthName,
      totalLeads,
      wonLeads: wonLeads.length,
      realizedRevenue,
      realizedGrossProfit,
      emailsSent: admins.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
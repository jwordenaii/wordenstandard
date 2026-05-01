import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Admin gate — this runs on a schedule, but also protects manual invocation
    const caller = await base44.auth.me().catch(() => null);
    const isScheduled = req.headers.get('x-base44-automation') || !caller;
    if (!isScheduled && caller?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Pull the last 7 days of leads and jobs
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const allLeads = await base44.asServiceRole.entities.Lead.list();
    const allJobs = await base44.asServiceRole.entities.Job.list();

    const recentLeads = allLeads.filter((l) => new Date(l.created_date) >= sevenDaysAgo);
    const recentJobs = allJobs.filter((j) => new Date(j.created_date) >= sevenDaysAgo);

    // Summarize compactly for the model
    const leadSummary = recentLeads.map((l) => ({
      surface: l.surface_type,
      sqft: l.sqft,
      material: l.material,
      urgency: l.urgency,
      status: l.status,
      created: l.created_date,
    }));

    const jobSummary = recentJobs.map((j) => ({
      title: j.title,
      surface: j.surface_type,
      sqft: j.sqft,
      status: j.status,
      scheduled: j.scheduled_date,
    }));

    const totals = {
      leads_7d: recentLeads.length,
      won: recentLeads.filter((l) => l.status === 'won').length,
      quoted: recentLeads.filter((l) => l.status === 'quoted').length,
      jobs_7d: recentJobs.length,
      total_leads_all_time: allLeads.length,
    };

    const prompt = `You are a senior business analyst for J. Worden & Sons Asphalt Paving, a family-owned paving company in Central Virginia. Generate a sharp, actionable weekly intelligence briefing for the owner.

DATA (last 7 days):
${JSON.stringify({ totals, leads: leadSummary, jobs: jobSummary }, null, 2)}

Write the briefing in this exact structure (plain text, no markdown headers):

WEEKLY INTELLIGENCE BRIEFING — J. WORDEN & SONS
Week ending ${now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}

═══════════════════════════════
HEADLINE NUMBER
[One sentence stating the single most important metric this week and what it means.]

═══════════════════════════════
PIPELINE HEALTH
[3–4 bullet points on lead volume, conversion, job throughput. Use specific numbers.]

═══════════════════════════════
PATTERN I NOTICED
[One interesting pattern, trend, or anomaly in the data. Be specific.]

═══════════════════════════════
RECOMMENDED ACTIONS (3)
1. [Highest-leverage action for next week]
2. [Second priority]
3. [Third priority]

═══════════════════════════════
RISK FLAG
[One thing to watch. If no risks, write "No material risks this week."]

Keep it tight, factual, no fluff. Write for a business owner who reads 50 emails before breakfast.`;

    const briefing = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      model: 'gpt_5',
    });

    // Email all admins
    const allUsers = await base44.asServiceRole.entities.User.list();
    const admins = allUsers.filter((u) => u.role === 'admin');

    if (admins.length === 0) {
      return Response.json({ warning: 'No admin users found to email.', briefing });
    }

    for (const admin of admins) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: admin.email,
        subject: `Weekly Intelligence Briefing — ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} | J. Worden & Sons`,
        body: briefing,
        from_name: 'J. Worden & Sons AI Analyst',
      });
    }

    return Response.json({
      success: true,
      emailsSent: admins.length,
      model: 'GPT-5',
      leadsAnalyzed: recentLeads.length,
      jobsAnalyzed: recentJobs.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
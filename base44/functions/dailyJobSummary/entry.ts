import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get today's date in ET (YYYY-MM-DD)
    const now = new Date();
    const today = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;
    const dayLabel = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' });

    // Fetch all jobs scheduled for today
    const allJobs = await base44.asServiceRole.entities.Job.filter({ scheduled_date: todayStr });
    const jobs = allJobs.filter((j) => j.status !== 'cancelled');

    // Get all admin users
    const allUsers = await base44.asServiceRole.entities.User.list();
    const admins = allUsers.filter((u) => u.role === 'admin');

    if (admins.length === 0) {
      return Response.json({ warning: 'No admin users found to email.' });
    }

    let jobLines = '';
    if (jobs.length === 0) {
      jobLines = '  No jobs scheduled for today.';
    } else {
      jobLines = jobs.map((job, i) => {
        const lines = [
          `  JOB ${i + 1}: ${job.title}`,
          `  Client:    ${job.client_name || '—'}`,
          `  Phone:     ${job.client_phone || '—'}`,
          `  Address:   ${job.address || '—'}`,
          `  Start:     ${job.start_time || '—'}`,
          `  Crew:      ${job.crew || '—'}`,
          `  Surface:   ${job.surface_type ? job.surface_type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '—'}`,
          `  Sq Ft:     ${job.sqft ? job.sqft.toLocaleString('en-US') : '—'}`,
          job.notes ? `  Notes:     ${job.notes}` : null,
        ].filter(Boolean);
        return lines.join('\n');
      }).join('\n\n' + '─'.repeat(44) + '\n\n');
    }

    const body = `J. WORDEN & SONS — DAILY JOB SUMMARY
${dayLabel}
${'═'.repeat(44)}

JOBS TODAY: ${jobs.length}

${jobLines}

${'═'.repeat(44)}
Have a safe and productive day on the road.
— J. Worden & Sons Dispatch`;

    for (const admin of admins) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: admin.email,
        subject: `Daily Job Summary — ${dayLabel} | J. Worden & Sons`,
        body,
        from_name: 'J. Worden & Sons Dispatch',
      });
    }

    return Response.json({ success: true, date: todayStr, jobCount: jobs.length, emailsSent: admins.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
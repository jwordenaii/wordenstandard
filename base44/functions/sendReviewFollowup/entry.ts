import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Scheduled daily: finds jobs completed 7+ days ago where the initial review
 * request was sent but no review was submitted yet. Sends ONE gentle nudge
 * email, then marks review_followup_sent=true so it never nudges again.
 *
 * Admin-only — triggered by scheduled automation.
 */

const REVIEW_LINKS = {
  google: 'https://g.page/r/jworden-sons-asphalt-paving/review',
  facebook: 'https://www.facebook.com/jwordenandsons/reviews',
  houzz: 'https://www.houzz.com/pro/jwordenandsons',
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (user && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Find completed jobs that got initial ask but no follow-up yet, and no review logged
    const candidates = await base44.asServiceRole.entities.Job.filter({
      status: 'completed',
      review_request_sent: true,
      review_followup_sent: false,
      review_submitted: false,
    }, '-updated_date', 200);

    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const due = candidates.filter((j) => {
      if (!j.review_request_sent_at || !j.client_email) return false;
      return new Date(j.review_request_sent_at).getTime() <= sevenDaysAgo;
    });

    if (due.length === 0) {
      return Response.json({ status: 'ok', sent: 0, message: 'No follow-ups due' });
    }

    let sent = 0;
    for (const job of due) {
      const firstName = (job.client_name || 'there').split(' ')[0];
      const body = `Hi ${firstName},

Just a quick follow-up — I hope you've been enjoying the new ${job.surface_type ? job.surface_type.replace(/_/g, ' ') : 'paving'} surface.

If you have a spare minute, a short review would genuinely make our week. We're a family business, and every word from a neighbor like you helps us reach the next one:

  🌟 Google:   ${REVIEW_LINKS.google}
  👥 Facebook: ${REVIEW_LINKS.facebook}
  🏠 Houzz:    ${REVIEW_LINKS.houzz}

If anything about the work isn't 100% right, please reply directly — I'd rather hear it from you first and fix it than have it show up in a review. That's how we've stayed in business for 40 years.

Thank you again for trusting us.

— J. Worden & Sons Asphalt Paving
(804) 446-1296`;

      await base44.asServiceRole.integrations.Core.SendEmail({
        from_name: 'J. Worden & Sons',
        to: job.client_email,
        subject: `Quick favor, ${firstName}?`,
        body,
      });

      await base44.asServiceRole.entities.Job.update(job.id, {
        review_followup_sent: true,
        review_followup_sent_at: new Date().toISOString(),
      });
      sent++;
    }

    console.log(`[sendReviewFollowup] Sent ${sent} follow-up review requests`);
    return Response.json({ status: 'ok', sent, checked: candidates.length });
  } catch (error) {
    console.error('[sendReviewFollowup]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
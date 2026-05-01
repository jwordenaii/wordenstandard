import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Triggered by the "Job Completed → Review Request" entity automation.
 * Fires when a Job's status transitions TO "completed".
 *
 * Sends a warm, on-brand email asking the customer to leave a Google/Facebook/Houzz review.
 * Only fires once per job (tracks via review_request_sent flag on Job).
 */

const REVIEW_LINKS = {
  google: 'https://g.page/r/jworden-sons-asphalt-paving/review',
  facebook: 'https://www.facebook.com/jwordenandsons/reviews',
  houzz: 'https://www.houzz.com/pro/jwordenandsons',
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const job = body?.data;
    const oldJob = body?.old_data;

    if (!job) {
      return Response.json({ skipped: true, reason: 'No job payload.' });
    }

    // Guard: only fire on transition INTO "completed" (not updates on already-completed jobs)
    if (job.status !== 'completed') {
      return Response.json({ skipped: true, reason: 'Job not completed.' });
    }
    if (oldJob?.status === 'completed') {
      return Response.json({ skipped: true, reason: 'Already completed previously.' });
    }
    if (!job.client_email) {
      return Response.json({ skipped: true, reason: 'No client_email on job.' });
    }

    const firstName = (job.client_name || 'there').split(' ')[0];
    const surface = job.surface_type
      ? job.surface_type.replace(/_/g, ' ')
      : 'paving';

    const body_html = `Hi ${firstName},

Your ${surface} project with J. Worden & Sons is complete, and we hope you're as proud of the finished work as we are.

Two quick asks from our family to yours:

1. WALK THE JOB
   Take a few minutes to inspect the work in daylight. If anything looks off — edges, drainage, finish — reply to this email or call me directly at (804) 446-1296. We'll be back out. That's our promise.

2. LEAVE A REVIEW
   We're a family business — reviews from neighbors like you are how we keep the lights on. If you'd be willing to share your experience publicly, it would mean the world:

   🌟 Google:   ${REVIEW_LINKS.google}
   👥 Facebook: ${REVIEW_LINKS.facebook}
   🏠 Houzz:    ${REVIEW_LINKS.houzz}

   (Even one sentence helps more than you'd think.)

A few reminders for the next 24–72 hours:
  • Keep vehicles off the new surface for at least 24 hours (longer in hot weather)
  • Avoid turning the wheels of a parked car for 7 days
  • Minor tire marks in the first few weeks are normal — they will fade

Your written warranty will arrive in your Customer Portal within 48 hours. Log in at jwordenasphaltpaving.com/portal any time to access your invoice, warranty, and progress photos.

Thank you for trusting us with your property.

— J. Worden & Sons Asphalt Paving
Licensed · Bonded · Insured
(804) 446-1296
j.wordenandsonspaving@gmail.com`;

    await base44.asServiceRole.integrations.Core.SendEmail({
      from_name: 'J. Worden & Sons',
      to: job.client_email,
      subject: `Thank you — your ${surface} project is complete`,
      body: body_html,
    });

    // Mark as sent so re-runs skip
    await base44.asServiceRole.entities.Job.update(job.id, {
      review_request_sent: true,
      review_request_sent_at: new Date().toISOString(),
    });

    return Response.json({ success: true, sent_to: job.client_email });
  } catch (error) {
    console.error('[sendReviewRequest]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
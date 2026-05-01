import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Sends an SMS to a new lead 4 hours after submission if they haven't been
 * contacted yet. Runs on schedule (hourly). Silently skips if Twilio is not
 * configured — so the rest of the app keeps working until creds are added.
 *
 * Admin/automation only.
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (user && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const sid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const token = Deno.env.get('TWILIO_AUTH_TOKEN');
    const from = Deno.env.get('TWILIO_FROM_NUMBER');

    if (!sid || !token || !from) {
      return Response.json({ configured: false, sent: 0, message: 'Twilio not configured' });
    }

    // Find leads created 4–8 hours ago, still "new", with a phone number
    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
    const eightHoursAgo = new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString();

    const leads = await base44.asServiceRole.entities.Lead.filter({
      status: 'new',
    }, '-created_date', 200);

    const eligible = leads.filter((l) => {
      if (!l.phone || !l.created_date) return false;
      if (l.sms_followup_sent) return false;
      const created = new Date(l.created_date).toISOString();
      return created <= fourHoursAgo && created >= eightHoursAgo;
    });

    if (eligible.length === 0) {
      return Response.json({ configured: true, sent: 0, message: 'No leads due' });
    }

    let sent = 0;
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
    const auth = btoa(`${sid}:${token}`);

    for (const lead of eligible) {
      const firstName = lead.name?.split(' ')[0] || 'there';
      const body = `Hi ${firstName}, it's J. Worden & Sons Asphalt Paving. We received your estimate request and wanted to confirm we'll be calling you shortly to schedule your free site visit. Reply STOP to opt out. — (804) 446-1296`;

      const params = new URLSearchParams({
        To: lead.phone,
        From: from,
        Body: body,
      });

      const res = await fetch(twilioUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      if (res.ok) {
        await base44.asServiceRole.entities.Lead.update(lead.id, {
          sms_followup_sent: true,
          sms_followup_sent_at: new Date().toISOString(),
        });
        sent++;
      } else {
        const errText = await res.text();
        console.error(`[sendSmsFollowup] Twilio error for ${lead.phone}:`, errText);
      }
    }

    return Response.json({ configured: true, sent, checked: eligible.length });
  } catch (error) {
    console.error('[sendSmsFollowup]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
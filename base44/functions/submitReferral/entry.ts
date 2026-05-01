import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Creates a Referral record + a linked Lead for the referred person.
 * Publicly callable (authenticated customers use it from the portal).
 * Payload: { referrer_email, referrer_name, referred_name, referred_email, referred_phone, referred_address, notes }
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user) {
      return Response.json({ error: 'Must be logged in' }, { status: 401 });
    }

    const body = await req.json();
    const { referred_name, referred_phone, referred_email, referred_address, notes } = body;

    if (!referred_name || !referred_phone) {
      return Response.json({ error: 'Name and phone required for referred person' }, { status: 400 });
    }

    // Create the lead first
    const lead = await base44.asServiceRole.entities.Lead.create({
      name: referred_name,
      email: referred_email,
      phone: referred_phone,
      address: referred_address,
      notes: `Referred by ${user.full_name} (${user.email})${notes ? `. ${notes}` : ''}`,
      status: 'new',
      conversion_source: 'referral',
      gross_margin_band: 'unknown',
      offline_conversion_ready: false,
    });

    // Create the referral tracking record
    const referral = await base44.asServiceRole.entities.Referral.create({
      referrer_email: user.email,
      referrer_name: user.full_name,
      referred_name,
      referred_email,
      referred_phone,
      referred_address,
      notes,
      status: 'pending',
      credit_amount: 100,
      linked_lead_id: lead.id,
    });

    return Response.json({ success: true, referral_id: referral.id, lead_id: lead.id });
  } catch (error) {
    console.error('[submitReferral]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
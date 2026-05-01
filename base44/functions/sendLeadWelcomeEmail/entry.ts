import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const fmt = (s) => s ? s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '—';

const buildEmailBody = (lead) => {
  const firstName = lead.name?.split(' ')[0] || 'there';

  return `Hi ${firstName},

Thank you for reaching out to J. Worden & Sons Asphalt Paving. We've received your estimate request and a member of our team will contact you within 24 hours to schedule your on-site assessment.

────────────────────────────────
YOUR QUOTE REQUEST SUMMARY
────────────────────────────────
• Surface Type:    ${fmt(lead.surface_type)}
• Estimated Area:  ${lead.sqft ? Math.round(lead.sqft).toLocaleString() + ' sq ft' : '—'}
• Material Grade:  ${fmt(lead.material)}
• Timeline:        ${fmt(lead.urgency)}
${lead.address ? `• Project Address: ${lead.address}` : ''}
${lead.notes ? `\nYour Notes: ${lead.notes}` : ''}

────────────────────────────────
WHAT HAPPENS NEXT
────────────────────────────────
1. A project consultant reviews your request today.
2. We call you within 24 hours to schedule a free site visit.
3. You receive a detailed, itemized written quote — no pressure, no obligation.

────────────────────────────────
WHY FAMILIES & BUSINESSES CHOOSE US
────────────────────────────────
✓ 40+ years family-owned and operated
✓ Licensed · Bonded · Insured (VA Contractor)
✓ State-spec mix designs engineered for our region's climate
✓ Written warranty on every pour

Questions before we call? Simply reply to this email or reach us directly:

📞 (804) 446-1296
📧 j.wordenandsonspaving@gmail.com
📍 1601 Ware Bottom Springs Rd, Suite 214, Chester, VA 23836

We appreciate the opportunity to earn your business.

— J. Worden & Sons
Asphalt Paving
jwordenasphaltpaving.com`;
};

// Base64url encode a UTF-8 string (Gmail API requires base64url-encoded raw MIME)
const base64UrlEncode = (str) => {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  bytes.forEach((b) => { binary += String.fromCharCode(b); });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

// RFC 2047 encode subject line for non-ASCII support (emoji, accents, etc.)
const encodeSubject = (subject) => {
  // If subject is pure ASCII, return as-is
  if (/^[\x00-\x7F]*$/.test(subject)) return subject;
  const b64 = base64UrlEncode(subject).replace(/-/g, '+').replace(/_/g, '/');
  // Re-pad for standard base64
  const padded = b64 + '='.repeat((4 - b64.length % 4) % 4);
  return `=?UTF-8?B?${padded}?=`;
};

const buildMimeMessage = ({ to, fromName, fromEmail, subject, body }) => {
  const from = fromName ? `${fromName} <${fromEmail}>` : fromEmail;
  const headers = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${encodeSubject(subject)}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: 8bit',
  ];
  return headers.join('\r\n') + '\r\n\r\n' + body;
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    // Support both entity-automation payload ({ data: {...} }) and direct call ({ lead: {...} })
    const lead = payload.data || payload.lead;

    if (!lead?.email) {
      return Response.json({ skipped: true, reason: 'No email on lead' });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');

    // Get the authorized Gmail user's address (for the From header)
    const profileRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });
    if (!profileRes.ok) {
      throw new Error(`Failed to fetch Gmail profile: ${profileRes.status}`);
    }
    const profile = await profileRes.json();
    const fromEmail = profile.emailAddress;

    const firstName = lead.name?.split(' ')[0] || 'friend';
    const mime = buildMimeMessage({
      to: lead.email,
      fromName: 'J. Worden & Sons Asphalt Paving',
      fromEmail,
      subject: `We received your quote request, ${firstName} — J. Worden & Sons`,
      body: buildEmailBody(lead),
    });

    const raw = base64UrlEncode(mime);

    const sendRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw }),
    });

    if (!sendRes.ok) {
      const errText = await sendRes.text();
      throw new Error(`Gmail send failed: ${sendRes.status} ${errText}`);
    }

    const result = await sendRes.json();
    return Response.json({ success: true, sentTo: lead.email, from: fromEmail, gmailMessageId: result.id });
  } catch (error) {
    console.error('[sendLeadWelcomeEmail]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
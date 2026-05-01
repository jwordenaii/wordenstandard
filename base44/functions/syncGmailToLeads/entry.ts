import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Decode base64url (Gmail format)
const decodeB64 = (str) => {
  if (!str) return '';
  try {
    const normalized = str.replace(/-/g, '+').replace(/_/g, '/');
    return atob(normalized);
  } catch {
    return '';
  }
};

// Walk MIME parts to find text/plain body
const extractBody = (payload) => {
  if (!payload) return '';
  if (payload.body?.data) return decodeB64(payload.body.data);
  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) return decodeB64(part.body.data);
    }
    // Fallback: any part with body data
    for (const part of payload.parts) {
      const sub = extractBody(part);
      if (sub) return sub;
    }
  }
  return '';
};

const getHeader = (headers, name) => {
  const h = headers?.find((x) => x.name.toLowerCase() === name.toLowerCase());
  return h?.value || '';
};

// Extract email from "Name <email@domain.com>" or bare "email@domain.com"
const extractEmail = (str) => {
  if (!str) return '';
  const match = str.match(/<([^>]+)>/) || str.match(/([^\s]+@[^\s]+)/);
  return (match ? match[1] : str).trim().toLowerCase();
};

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const base44 = createClientFromRequest(req);

    const messageIds = body.data?.new_message_ids ?? [];
    if (messageIds.length === 0) {
      return Response.json({ status: 'ok', processed: 0 });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');
    const authHeader = { Authorization: `Bearer ${accessToken}` };

    // Get the owner's own email so we can determine inbound vs outbound
    const meRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', { headers: authHeader });
    const me = meRes.ok ? await meRes.json() : {};
    const myEmail = (me.emailAddress || '').toLowerCase();

    let matched = 0, unmatched = 0;

    for (const messageId of messageIds) {
      // Dedup
      const existing = await base44.asServiceRole.entities.LeadCommunication.filter({ gmail_message_id: messageId });
      if (existing.length > 0) continue;

      const res = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`,
        { headers: authHeader }
      );
      if (!res.ok) continue;
      const message = await res.json();

      const headers = message.payload?.headers || [];
      const from = extractEmail(getHeader(headers, 'From'));
      const to = extractEmail(getHeader(headers, 'To'));
      const subject = getHeader(headers, 'Subject');
      const dateStr = getHeader(headers, 'Date');

      // Determine direction
      const isOutbound = from === myEmail;
      const counterparty = isOutbound ? to : from;
      if (!counterparty) { unmatched++; continue; }

      // Match to lead by email
      const leads = await base44.asServiceRole.entities.Lead.filter({ email: counterparty });
      if (leads.length === 0) {
        unmatched++;
        continue;
      }
      const lead = leads[0];

      const bodyText = extractBody(message.payload) || message.snippet || '';
      const snippet = bodyText.slice(0, 200).replace(/\s+/g, ' ').trim();

      await base44.asServiceRole.entities.LeadCommunication.create({
        lead_id: lead.id,
        lead_email: counterparty,
        channel: isOutbound ? 'email_outbound' : 'email_inbound',
        subject: subject || '(no subject)',
        snippet,
        from_email: from,
        to_email: to,
        gmail_message_id: messageId,
        gmail_thread_id: message.threadId,
        sent_at: dateStr ? new Date(dateStr).toISOString() : new Date().toISOString(),
      });
      matched++;
    }

    console.log(`Gmail sync: ${matched} matched to leads, ${unmatched} unmatched`);
    return Response.json({ status: 'ok', matched, unmatched });
  } catch (error) {
    console.error('syncGmailToLeads error:', error.message);
    return Response.json({ status: 'error', error: error.message }, { status: 200 });
  }
});
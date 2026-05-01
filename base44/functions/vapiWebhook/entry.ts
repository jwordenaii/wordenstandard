import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Vapi.ai Voice Agent Webhook
 * Handles all events from Vapi: function calls, status updates, end-of-call reports.
 *
 * This endpoint is called by Vapi throughout a phone call:
 *  1. `function-call` — the AI agent wants to look something like "check calendar" or "create lead"
 *  2. `status-update` — call state transitions (in_progress → ended)
 *  3. `end-of-call-report` — final transcript, summary, recording URL
 *
 * Configure your Vapi assistant to POST to: <this function's URL>
 * Protected by VAPI_WEBHOOK_SECRET header match.
 */

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  try {
    const secret = Deno.env.get('VAPI_WEBHOOK_SECRET');
    if (secret) {
      const provided = req.headers.get('x-vapi-secret') || req.headers.get('authorization')?.replace('Bearer ', '');
      if (provided !== secret) {
        return json({ error: 'Unauthorized' }, 401);
      }
    }

    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const message = body?.message || body;
    const type = message?.type;

    console.log('[vapiWebhook] event:', type);

    // ─────────────────────────────────────────────
    // 1. FUNCTION CALLS (tools the AI can invoke mid-call)
    // ─────────────────────────────────────────────
    if (type === 'function-call' || type === 'tool-calls') {
      const toolCall = message.functionCall || message.toolCalls?.[0]?.function || message.toolCalls?.[0];
      const name = toolCall?.name;
      const args = toolCall?.arguments ? (typeof toolCall.arguments === 'string' ? JSON.parse(toolCall.arguments) : toolCall.arguments) : (toolCall?.parameters || {});

      if (name === 'check_calendar_availability') {
        const res = await base44.asServiceRole.functions.invoke('checkCalendarAvailability', args);
        return json({ result: res?.data || res });
      }

      if (name === 'book_site_visit') {
        const res = await base44.asServiceRole.functions.invoke('bookSiteVisit', args);
        return json({ result: res?.data || res });
      }

      if (name === 'create_lead') {
        // args: { name, phone, email?, address?, surface_type?, sqft?, urgency?, notes? }
        const created = await base44.asServiceRole.entities.Lead.create({
          name: args.name || 'Voice Lead',
          phone: args.phone || message.customer?.number || 'unknown',
          email: args.email || '',
          address: args.address || '',
          surface_type: args.surface_type || '',
          sqft: args.sqft ? Number(args.sqft) : undefined,
          urgency: args.urgency || 'standard',
          notes: `📞 Inbound phone call lead. ${args.notes || ''}`,
          status: 'new',
        });
        return json({ result: { success: true, lead_id: created.id } });
      }

      return json({ result: { error: `Unknown tool: ${name}` } });
    }

    // ─────────────────────────────────────────────
    // 2. CALL STARTED (create the VoiceCall record)
    // ─────────────────────────────────────────────
    if (type === 'status-update' && message.call?.status === 'in-progress') {
      const call = message.call;
      try {
        await base44.asServiceRole.entities.VoiceCall.create({
          vapi_call_id: call.id,
          from_number: call.customer?.number || message.customer?.number || 'unknown',
          to_number: call.phoneNumber?.number || '',
          status: 'in_progress',
          started_at: new Date().toISOString(),
        });
      } catch (e) {
        console.warn('[vapiWebhook] VoiceCall create skipped (may already exist):', e?.message);
      }
      return json({ success: true });
    }

    // ─────────────────────────────────────────────
    // 3. END-OF-CALL REPORT (transcript + summary + recording)
    // ─────────────────────────────────────────────
    if (type === 'end-of-call-report') {
      const call = message.call || {};
      const vapiCallId = call.id;

      const endedReason = message.endedReason || call.endedReason || '';
      const status =
        endedReason.includes('voicemail') ? 'voicemail' :
        endedReason.includes('no-answer') || endedReason.includes('missed') ? 'missed' :
        endedReason.includes('failed') ? 'failed' :
        'completed';

      const transcript = message.transcript || message.artifact?.transcript || '';
      const summary = message.summary || message.analysis?.summary || '';
      const recording = message.recordingUrl || message.artifact?.recordingUrl || '';
      const duration = message.durationSeconds || call.duration || 0;
      const intent = message.analysis?.structuredData?.intent || 'general_inquiry';
      const bookedSiteVisit = !!message.analysis?.structuredData?.booked_site_visit;
      const leadId = message.analysis?.structuredData?.lead_id || '';

      // Try to find existing record, else create
      const existing = await base44.asServiceRole.entities.VoiceCall.filter({ vapi_call_id: vapiCallId }, null, 1);
      const payload = {
        vapi_call_id: vapiCallId,
        from_number: call.customer?.number || 'unknown',
        to_number: call.phoneNumber?.number || '',
        status,
        duration_seconds: duration,
        transcript,
        summary,
        intent,
        booked_site_visit: bookedSiteVisit,
        lead_id: leadId,
        recording_url: recording,
        ended_at: new Date().toISOString(),
      };

      if (Array.isArray(existing) && existing[0]) {
        await base44.asServiceRole.entities.VoiceCall.update(existing[0].id, payload);
      } else {
        payload.started_at = new Date(Date.now() - duration * 1000).toISOString();
        await base44.asServiceRole.entities.VoiceCall.create(payload);
      }

      // Notify owner of completed call
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: 'j.wordenandsonspaving@gmail.com',
          subject: `📞 Voice Call ${status === 'completed' ? '' : `(${status}) `}from ${payload.from_number} — ${duration}s`,
          body: `📞 VOICE AGENT CALL REPORT

From:     ${payload.from_number}
Duration: ${Math.round(duration)}s
Status:   ${status}
Intent:   ${intent}
${bookedSiteVisit ? '✅ Site visit booked during call' : ''}
${leadId ? `Lead ID:  ${leadId}` : ''}

──── SUMMARY ────
${summary || '(none)'}

──── TRANSCRIPT ────
${transcript || '(none)'}

${recording ? `Recording: ${recording}` : ''}

— J. Worden Voice System`,
          from_name: 'J. Worden Voice Agent',
        });
      } catch (e) {
        console.warn('[vapiWebhook] owner email skipped:', e?.message);
      }

      return json({ success: true });
    }

    // Default: acknowledge
    return json({ success: true, received: type });
  } catch (error) {
    console.error('[vapiWebhook] Error:', error);
    return json({ error: error.message }, 500);
  }
});
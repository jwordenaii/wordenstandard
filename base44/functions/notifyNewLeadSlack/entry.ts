import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const SLACK_API = 'https://slack.com/api/chat.postMessage';
const SETTINGS_KEY = 'slack_config';

// Format helpers
const titleCase = (s) => (s ? s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : '—');
const fmtSqft = (n) => (n ? `${Math.round(n).toLocaleString()} sq ft` : '—');

const urgencyEmoji = (u) =>
  ({ urgent: '🔥', standard: '⚡', flexible: '📅' }[u] || '📋');

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    // The entity automation payload wraps the record in `data`.
    const lead = body?.data || body?.lead;
    if (!lead) {
      return Response.json({ skipped: true, reason: 'No lead payload.' });
    }

    // Fetch Slack config from AppSettings
    const settingsList = await base44.asServiceRole.entities.AppSettings.filter({ key: SETTINGS_KEY });
    const settings = settingsList?.[0];

    if (!settings?.slack_enabled) {
      return Response.json({ skipped: true, reason: 'Slack disabled in settings.' });
    }
    if (!settings?.slack_channel) {
      return Response.json({ skipped: true, reason: 'No Slack channel configured.' });
    }

    // Get OAuth token
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('slackbot');

    // Build rich Block Kit message
    const urgency = lead.urgency || 'standard';
    const headerText = `${urgencyEmoji(urgency)} New Lead — ${lead.name || 'Unknown'}`;

    const fields = [
      { title: 'Phone', value: lead.phone || '—' },
      { title: 'Email', value: lead.email || '—' },
      { title: 'Surface', value: titleCase(lead.surface_type) },
      { title: 'Area', value: fmtSqft(lead.sqft) },
      { title: 'Material', value: titleCase(lead.material) },
      { title: 'Urgency', value: titleCase(urgency) },
    ];

    const blocks = [
      {
        type: 'header',
        text: { type: 'plain_text', text: headerText, emoji: true },
      },
      {
        type: 'section',
        fields: fields.map((f) => ({
          type: 'mrkdwn',
          text: `*${f.title}*\n${f.value}`,
        })),
      },
    ];

    if (lead.address) {
      blocks.push({
        type: 'section',
        text: { type: 'mrkdwn', text: `📍 *Address*\n${lead.address}` },
      });
    }

    if (lead.notes) {
      blocks.push({
        type: 'section',
        text: { type: 'mrkdwn', text: `📝 *Notes*\n${lead.notes}` },
      });
    }

    blocks.push({
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `_Submitted ${new Date(lead.created_date || Date.now()).toLocaleString('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' })}_`,
        },
      ],
    });

    // Fallback text for notifications
    const fallbackText = `New lead: ${lead.name} · ${lead.phone} · ${titleCase(lead.surface_type)} · ${titleCase(urgency)}`;

    // Post to Slack — never include both icon_emoji AND icon_url per connector guide
    const slackPayload = {
      channel: settings.slack_channel,
      text: fallbackText,
      blocks,
      username: settings.slack_bot_name || 'J. Worden Lead Bot',
      icon_emoji: settings.slack_bot_emoji || ':rotating_light:',
    };

    const slackRes = await fetch(SLACK_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(slackPayload),
    });

    const slackData = await slackRes.json();

    if (!slackData.ok) {
      // Common errors: not_in_channel, channel_not_found
      console.error('[Slack] Error:', slackData.error, slackData);
      return Response.json({
        success: false,
        error: slackData.error,
        hint: slackData.error === 'not_in_channel'
          ? 'Invite the bot to the channel in Slack.'
          : slackData.error === 'channel_not_found'
          ? 'Channel name/ID not found. Check settings at /admin/slack.'
          : 'See Slack API error.',
      }, { status: 500 });
    }

    return Response.json({
      success: true,
      ts: slackData.ts,
      channel: slackData.channel,
    });
  } catch (error) {
    console.error('[notifyNewLeadSlack] Fatal:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
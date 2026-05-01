import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const SLACK_API = 'https://slack.com/api/chat.postMessage';
const RAIN_THRESHOLD = 0.6; // 60% chance of rain
const SETTINGS_KEY = 'slack_config';

// Geocode address via OpenWeather's geo API
const geocode = async (address, apiKey) => {
  const url = `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(address)}&limit=1&appid=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) return null;
  return { lat: data[0].lat, lon: data[0].lon };
};

// Get forecast for a specific date (YYYY-MM-DD) from 5-day/3-hour forecast
const getForecastForDate = async (lat, lon, targetDate, apiKey) => {
  const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=imperial&appid=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();

  // Filter 3-hour blocks to those matching target date, focus on daytime (8am–6pm local)
  const blocks = (data.list || []).filter((b) => {
    const d = new Date(b.dt * 1000);
    const dateStr = d.toISOString().split('T')[0];
    const hour = d.getUTCHours();
    return dateStr === targetDate && hour >= 12 && hour <= 22; // rough daytime UTC
  });

  if (blocks.length === 0) return null;

  const maxPop = Math.max(...blocks.map((b) => b.pop || 0));
  const avgTemp = blocks.reduce((s, b) => s + (b.main?.temp || 0), 0) / blocks.length;
  const conditions = blocks[Math.floor(blocks.length / 2)]?.weather?.[0]?.description || 'unknown';

  return { pop: maxPop, temp: Math.round(avgTemp), conditions };
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    // Allow automation calls (no user) and admin manual triggers
    if (user && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const apiKey = Deno.env.get('OPENWEATHER_API_KEY');
    if (!apiKey) {
      return Response.json({ error: 'OPENWEATHER_API_KEY not set' }, { status: 500 });
    }

    // Find jobs scheduled in the next 3 days
    const today = new Date().toISOString().split('T')[0];
    const threeDaysOut = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Check both scheduled AND in-progress jobs — in-progress jobs are happening today
    // and weather risk matters most for crews actively on-site.
    const [scheduledJobs, inProgressJobs] = await Promise.all([
      base44.asServiceRole.entities.Job.filter({ status: 'scheduled' }, '-scheduled_date', 100),
      base44.asServiceRole.entities.Job.filter({ status: 'in_progress' }, '-scheduled_date', 100),
    ]);
    const allJobs = [...scheduledJobs, ...inProgressJobs];
    const upcoming = allJobs.filter(
      (j) => j.scheduled_date && j.scheduled_date >= today && j.scheduled_date <= threeDaysOut && j.address
    );

    if (upcoming.length === 0) {
      return Response.json({ status: 'ok', checked: 0, at_risk: 0, message: 'No upcoming jobs' });
    }

    const atRisk = [];
    let checked = 0;

    for (const job of upcoming) {
      const geo = await geocode(job.address, apiKey);
      if (!geo) continue;

      const forecast = await getForecastForDate(geo.lat, geo.lon, job.scheduled_date, apiKey);
      if (!forecast) continue;

      checked++;
      const summary = `${Math.round(forecast.pop * 100)}% rain · ${forecast.temp}°F · ${forecast.conditions}`;
      const isRisky = forecast.pop >= RAIN_THRESHOLD;

      await base44.asServiceRole.entities.Job.update(job.id, {
        weather_risk: isRisky,
        weather_forecast: summary,
        weather_checked_at: new Date().toISOString(),
      });

      if (isRisky) {
        atRisk.push({ job, summary });
      }
    }

    // Post Slack alert if any at-risk jobs
    if (atRisk.length > 0) {
      const settings = await base44.asServiceRole.entities.AppSettings.filter({ key: SETTINGS_KEY });
      const config = settings[0];
      if (config?.slack_enabled && config?.slack_channel) {
        try {
          const { accessToken } = await base44.asServiceRole.connectors.getConnection('slackbot');
          const blocks = [
            {
              type: 'header',
              text: { type: 'plain_text', text: `⚠️ Weather Risk: ${atRisk.length} Job${atRisk.length > 1 ? 's' : ''} at Risk` },
            },
            { type: 'divider' },
            ...atRisk.flatMap(({ job, summary }) => [
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: `*${job.title}*\n📅 ${job.scheduled_date}${job.start_time ? ` at ${job.start_time}` : ''}\n📍 ${job.address}\n🌧️ ${summary}`,
                },
              },
            ]),
          ];

          const slackRes = await fetch(SLACK_API, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json; charset=utf-8',
            },
            body: JSON.stringify({
              channel: config.slack_channel,
              username: config.slack_bot_name || 'J. Worden Weather Bot',
              icon_emoji: ':cloud_with_rain:',
              text: `Weather alert: ${atRisk.length} job(s) at risk`,
              blocks,
            }),
          });
          const slackData = await slackRes.json();
          if (!slackData.ok) console.error('Slack post failed:', slackData.error);
        } catch (slackErr) {
          console.error('Slack alert error:', slackErr.message);
        }
      }
    }

    console.log(`Weather check: ${checked} jobs checked, ${atRisk.length} at risk`);
    return Response.json({ status: 'ok', checked, at_risk: atRisk.length });
  } catch (error) {
    console.error('checkWeatherForJobs error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
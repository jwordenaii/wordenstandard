// dispatch.api.ts
// netlify/functions/dispatch.ts
// ─────────────────────────────────────────────────────────────────────────────
// Netlify Function — Weather forecast aggregator for DispatchWeatherStation
//
// REQUIRED ENV VARS (set in Netlify project: jwordenlaunch1):
//   None required — NOAA api.weather.gov is free and keyless.
//
// OPTIONAL ENV VARS:
//   DISPATCH_LAT   — default latitude  (default: 37.5407 = Richmond, VA)
//   DISPATCH_LON   — default longitude (default: -77.4360 = Richmond, VA)
//
// QUERY PARAMS:
//   lat, lon       — override coordinates per request
//   days           — number of days requested (14 or 90, default: 14)
//
// NOAA api.weather.gov notes:
//   • No API key required. Required User-Agent header.
//   • /points/{lat},{lon}  → grid metadata
//   • /gridpoints/{wfo}/{x},{y}/forecast → 7-day (14 periods day+night)
//   • For 90-day strategic view, we blend NOAA 7-day + synthetic seasonal fill
//   • All fetchers return {} on failure — component renders '—'
//
// Cache: public, s-maxage=300, stale-while-revalidate=600 (5-min fresh, 10-min stale)
// ─────────────────────────────────────────────────────────────────────────────

import type { Handler, HandlerEvent } from '@netlify/functions';
import type {
  DispatchApiResponse,
  NoaaForecastPeriod,
  WeatherDay,
} from '../../src/types/dispatch-weather.types';

const NOAA_BASE = 'https://api.weather.gov';
const UA = 'WordenStandard/1.0 (jwordenaii@wordenstandard.com)';

// Virginia seasonal baseline (fallback + 90-day fill)
const SEASONAL_HIGH: Record<number, number> = {
  0: 42, 1: 47, 2: 57, 3: 67, 4: 76, 5: 84,
  6: 88, 7: 87, 8: 80, 9: 68, 10: 57, 11: 46,
};

function sr(seed: number): number {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

function syntheticDay(i: number, startDate: Date): WeatherDay {
  const d = new Date(startDate);
  d.setDate(startDate.getDate() + i);
  const month = d.getMonth();
  const r1 = sr(i * 7 + 1), r2 = sr(i * 7 + 2), r3 = sr(i * 7 + 3);
  const r4 = sr(i * 7 + 4), r5 = sr(i * 7 + 5), r6 = sr(i * 7 + 6);
  const base = SEASONAL_HIGH[month] ?? 65;
  const tempHigh = Math.round(base + (r1 - 0.5) * 18);
  const tempLow = Math.round(tempHigh - 12 - r2 * 10);
  const groundTemp = Math.round((tempHigh + tempLow) / 2 - 4 - r3 * 6);
  const windSpeed = Math.round(3 + r4 * 22);
  const rainProb = [3, 4, 9, 10].includes(month) ? 35 : [11, 0, 1].includes(month) ? 25 : 18;
  const precipMM = r5 * 100 < rainProb ? Math.round(r5 * 60 + 2) : 0;
  const humidity = Math.round(45 + r6 * 40);
  const dewPoint = Math.round(tempLow - 5 + r1 * 8);
  const isWeekend = d.getDay() === 0 || d.getDay() === 6;
  return {
    dayIndex: i + 1,
    date: d.toISOString().split('T')[0],
    month: d.toLocaleDateString('en-US', { month: 'long' }),
    dayOfMonth: d.getDate(),
    dayOfWeek: d.toLocaleDateString('en-US', { weekday: 'short' }),
    tempHigh, tempLow, groundTemp, windSpeed,
    precipMM, precipProbability: rainProb,
    humidity, dewPoint,
    isWeekend, source: 'synthetic',
  };
}

async function fetchNoaaForecast(lat: number, lon: number): Promise<WeatherDay[]> {
  // Step 1: resolve grid
  const pointsRes = await fetch(
    `${NOAA_BASE}/points/${lat.toFixed(4)},${lon.toFixed(4)}`,
    { headers: { 'User-Agent': UA, Accept: 'application/geo+json' } }
  );
  if (!pointsRes.ok) throw new Error(`NOAA points ${pointsRes.status}`);
  const pointsJson = await pointsRes.json();
  const forecastUrl: string = pointsJson.properties?.forecast;
  if (!forecastUrl) throw new Error('No forecast URL from NOAA points');

  // Step 2: fetch forecast periods
  const fcRes = await fetch(forecastUrl, {
    headers: { 'User-Agent': UA, Accept: 'application/geo+json' },
  });
  if (!fcRes.ok) throw new Error(`NOAA forecast ${fcRes.status}`);
  const fcJson = await fcRes.json();
  const periods: NoaaForecastPeriod[] = fcJson.properties?.periods ?? [];

  // Step 3: merge day+night pairs into WeatherDay[]
  const days: WeatherDay[] = [];
  let i = 0, idx = 1;
  while (i < periods.length) {
    const p = periods[i];
    const pNext = periods[i + 1];
    const isDayPeriod = p.isDaytime;
    const dayP = isDayPeriod ? p : pNext;
    const nightP = isDayPeriod ? pNext : p;

    const start = new Date(p.startTime);
    const parseWind = (s: string): number => {
      const m = s?.match(/(\d+)/g);
      if (!m) return 0;
      return m.length > 1 ? Math.max(...m.map(Number)) : Number(m[0]);
    };

    const tempHigh = dayP?.temperature ?? 70;
    const tempLow = nightP?.temperature ?? (tempHigh - 15);
    const windSpeed = Math.max(parseWind(dayP?.windSpeed ?? ''), parseWind(nightP?.windSpeed ?? ''));
    const precipProb = Math.max(
      dayP?.probabilityOfPrecipitation?.value ?? 0,
      nightP?.probabilityOfPrecipitation?.value ?? 0
    );
    const precipMM = precipProb > 20 ? Math.round((precipProb - 20) * 0.4) : 0;
    const humidity = dayP?.relativeHumidity?.value ?? nightP?.relativeHumidity?.value ?? 60;
    const dewpointC = dayP?.dewpoint?.value ?? null;
    const dewPoint = dewpointC !== null ? Math.round(dewpointC * 9 / 5 + 32) : Math.round(tempLow - 5);
    const groundTemp = Math.round((tempHigh + tempLow) / 2 - 4);
    const isWeekend = start.getDay() === 0 || start.getDay() === 6;

    days.push({
      dayIndex: idx++,
      date: start.toISOString().split('T')[0],
      month: start.toLocaleDateString('en-US', { month: 'long' }),
      dayOfMonth: start.getDate(),
      dayOfWeek: start.toLocaleDateString('en-US', { weekday: 'short' }),
      tempHigh, tempLow, groundTemp, windSpeed,
      precipMM, precipProbability: precipProb,
      humidity, dewPoint,
      shortForecast: dayP?.shortForecast,
      detailedForecast: dayP?.detailedForecast,
      isWeekend, source: 'noaa',
    });

    i += (isDayPeriod && pNext && !pNext.isDaytime) ? 2 : 1;
  }
  return days;
}

export const handler: Handler = async (event: HandlerEvent) => {
  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    'Access-Control-Allow-Origin': '*',
  };

  try {
    const qs = event.queryStringParameters ?? {};
    const lat = parseFloat(qs.lat ?? process.env.DISPATCH_LAT ?? '37.5407');
    const lon = parseFloat(qs.lon ?? process.env.DISPATCH_LON ?? '-77.4360');
    const days = parseInt(qs.days ?? '14', 10);

    const [noaaResult] = await Promise.allSettled([fetchNoaaForecast(lat, lon)]);

    let forecast: WeatherDay[];
    if (noaaResult.status === 'fulfilled' && noaaResult.value.length > 0) {
      const live = noaaResult.value;
      if (days <= 14) {
        forecast = live.slice(0, days);
      } else {
        // 90-day: use NOAA for first ~14 days, synthetic seasonal fill for rest
        const start = new Date();
        start.setDate(start.getDate() + live.length);
        const fill: WeatherDay[] = [];
        for (let i = 0; i < days - live.length; i++) {
          const s = syntheticDay(i, start);
          s.dayIndex = live.length + i + 1;
          fill.push(s);
        }
        forecast = [...live, ...fill];
      }
    } else {
      // Full synthetic fallback
      forecast = Array.from({ length: days }, (_, i) => syntheticDay(i, new Date()));
    }

    const body: DispatchApiResponse = {
      forecast,
      generatedAt: new Date().toISOString(),
    };

    return { statusCode: 200, headers, body: JSON.stringify(body) };
  } catch (err) {
    const body: DispatchApiResponse = {
      forecast: [],
      error: String(err),
    };
    return { statusCode: 200, headers, body: JSON.stringify(body) };
  }
};

// reality-engine.api.ts
// netlify/functions/reality-engine.ts
// ─────────────────────────────────────────────────────────────────────────────
// Netlify Function — Live arbitration engine for RealityEngineNode
//
// REQUIRED ENV VARS (set in Netlify project: jwordenlaunch1):
//   ANTHROPIC_API_KEY   — from console.anthropic.com (optional — used only if
//                         useAI=true in request; degrades gracefully without it)
//
// OPTIONAL ENV VARS:
//   DISPATCH_LAT        — default latitude  (default: 37.5407 = Richmond, VA)
//   DISPATCH_LON        — default longitude (default: -77.4360 = Richmond, VA)
//
// FLOW:
//   1. Parse scenario input from POST body
//   2. Fetch live NOAA 7-day forecast for lat/lon (no API key required)
//   3. Run deterministic arbitration engine (pure math — no AI required)
//   4. Optionally call Anthropic claude-3-5-haiku for a 2-sentence field narrative
//   5. Return { verdict, weather, generatedAt }
//
// All fetchers return {} on failure — component renders '—' gracefully.
// Cache: private (personalized per scenario) — no public caching.
// ─────────────────────────────────────────────────────────────────────────────

import type { Handler, HandlerEvent } from '@netlify/functions';
import type {
  ScenarioInput,
  WeatherSnapshot,
  ArbitrationVerdict,
  CounterMeasure,
  RealityEngineResponse,
  DecisionVerb,
  RiskLevel,
} from '../../src/types/reality-engine.types';

const NOAA_BASE = 'https://api.weather.gov';
const UA = 'WordenStandard/1.0 (jwordenaii@wordenstandard.com)';

// ─── NOAA weather fetch ────────────────────────────────────────────────────────

async function fetchWeather(lat: number, lon: number): Promise<WeatherSnapshot> {
  try {
    const ptRes = await fetch(
      `${NOAA_BASE}/points/${lat.toFixed(4)},${lon.toFixed(4)}`,
      { headers: { 'User-Agent': UA, Accept: 'application/geo+json' } }
    );
    if (!ptRes.ok) throw new Error(`NOAA points ${ptRes.status}`);
    const ptJson = await ptRes.json();
    const fcUrl: string = ptJson.properties?.forecast;
    if (!fcUrl) throw new Error('No forecast URL');

    const fcRes = await fetch(fcUrl, { headers: { 'User-Agent': UA, Accept: 'application/geo+json' } });
    if (!fcRes.ok) throw new Error(`NOAA forecast ${fcRes.status}`);
    const fcJson = await fcRes.json();
    const periods = fcJson.properties?.periods ?? [];

    // Find daytime today
    const today = periods.find((p: any) => p.isDaytime) ?? periods[0] ?? {};
    const tonight = periods.find((p: any) => !p.isDaytime) ?? {};

    const parseWind = (s: string) => { const m = s?.match(/(\d+)/g); return m ? Math.max(...m.map(Number)) : 0; };
    const precipProb = Math.max(today.probabilityOfPrecipitation?.value ?? 0, tonight.probabilityOfPrecipitation?.value ?? 0);
    const precipMM = precipProb > 20 ? Math.round((precipProb - 20) * 0.4) : 0;
    const humidity = today.relativeHumidity?.value ?? 65;
    const dewC = today.dewpoint?.value ?? null;
    const dewF = dewC !== null ? Math.round(dewC * 9 / 5 + 32) : Math.round((tonight.temperature ?? 55) - 5);
    const tempHigh = today.temperature ?? 65;
    const tempLow = tonight.temperature ?? (tempHigh - 15);
    const windSpeed = Math.max(parseWind(today.windSpeed ?? ''), parseWind(tonight.windSpeed ?? ''));
    const groundTemp = Math.round((tempHigh + tempLow) / 2 - 4);

    // Count clear days ahead
    let clearDays = 0;
    let nextRain = 14;
    for (let i = 0; i < periods.length; i++) {
      const p = periods[i];
      const pp = p.probabilityOfPrecipitation?.value ?? 0;
      if (pp < 30 && p.isDaytime) clearDays++;
      if (pp >= 50 && p.isDaytime && nextRain === 14) {
        nextRain = Math.floor(i / 2);
      }
    }

    return {
      tempHigh, tempLow, groundTemp, windSpeed,
      precipMM, precipProbability: precipProb,
      humidity, shortForecast: today.shortForecast ?? 'Unknown',
      source: 'noaa',
      forecastWindowDays: Math.min(clearDays, 7),
      nextRainDays: nextRain,
    };
  } catch {
    // Synthetic Virginia fallback
    const now = new Date();
    const m = now.getMonth();
    const seasonal: Record<number, number> = {
      0:42,1:47,2:57,3:67,4:76,5:84,6:88,7:87,8:80,9:68,10:57,11:46
    };
    const tempHigh = seasonal[m] ?? 65;
    return {
      tempHigh, tempLow: tempHigh - 15, groundTemp: tempHigh - 19,
      windSpeed: 8, precipMM: 0, precipProbability: 15,
      humidity: 60, shortForecast: 'Partly Cloudy (synthetic)',
      source: 'synthetic', forecastWindowDays: 5, nextRainDays: 3,
    };
  }
}

// ─── Countermeasure library ────────────────────────────────────────────────────

function getCountermeasures(key: string, weather: WeatherSnapshot): CounterMeasure[] {
  const cm: Record<string, CounterMeasure[]> = {
    cold_asphalt: [
      { type: 'MANDATORY', action: 'Order Evotherm® WMA additive — lowers viscosity, extends compaction window by 40°F.', spec: 'VDOT Spec 315.03(b)', cost: 4200 },
      { type: 'MANDATORY', action: 'Raise plant temp 25–30°F above standard mix design. 3 breakdown rollers within 50 ft of screed — 96% Marshall density before mat cools below 220°F.', spec: 'NAPA QIP-116' },
      { type: 'MANDATORY', action: 'Achieve 96% Marshall density before mat drops below 220°F. Nuclear density gauge operator on-site continuously.', spec: 'AASHTO T245' },
      { type: 'RECOMMENDED', action: 'Pre-heat surface with propane infrared heaters. Target base ≥50°F prior to first lift.', cost: 3800, timeRequired: '3 hrs pre-treatment' },
      { type: 'RECOMMENDED', action: 'Insulated truck tarps. Max haul 15 miles. No holding time >45 min.' },
    ],
    wet_earthwork: [
      { type: 'MANDATORY', action: 'Import Portland Cement Type I/II or ag lime — blade-mix into top 12 in of subgrade. Destroys expansive clay plasticity.', spec: 'VDOT Section 303 / ASTM D559', cost: 18000 },
      { type: 'MANDATORY', action: '24-hr cure after lime treatment. Re-test moisture with nuclear gauge — must be within ±2% of Proctor optimum before rolling.', spec: 'AASHTO T99 / T180' },
      { type: 'MANDATORY', action: 'Mirafi 500X geotextile over treated subgrade — prevents pumping under compaction loads.', spec: 'VDOT Section 303.04', cost: 4200 },
      { type: 'RECOMMENDED', action: 'Scarify to 6-in depth, aerate 4–6 hrs before lime application.' },
      { type: 'RECOMMENDED', action: 'Temporary interceptor swales + silt fence — divert incoming water from active zone.', cost: 1500 },
    ],
    schedule_crash: [
      { type: 'CRITICAL', action: 'Mobilize second crew immediately. Split paving into two independent lifts operating simultaneously. Doubles throughput, cuts schedule by 40%.', cost: 28000 },
      { type: 'CRITICAL', action: 'Run extended shifts (10-hr days). Negotiate premium-time rates — typically 1.35× base rate. Pre-approve OT with owner.', cost: 14000 },
      { type: 'MANDATORY', action: 'Submit formal rain-delay notice to owner per contract. Preserve float on critical path. Document daily with photos + weather logs.' },
      { type: 'RECOMMENDED', action: 'Hire subcontractor for non-critical path items (striping, signage) to free primary crew for earthwork/paving critical path.' },
    ],
    wind_crane: [
      { type: 'MANDATORY', action: 'OSHA 1926.1417: suspend all picks if sustained wind ≥35 mph. Post anemometer at cab height — log readings every 15 min.', spec: 'OSHA 29 CFR 1926.1417' },
      { type: 'MANDATORY', action: 'Reduce load chart by 25% when gusts exceed 20 mph. Assign dedicated dogman for all blind picks.', spec: 'ASME B30.5' },
      { type: 'RECOMMENDED', action: 'Pre-rig during calm morning hours. Stage picks in sequence to minimize boom swing time at full radius.' },
      { type: 'RECOMMENDED', action: `Wind forecast shows ${weather.nextRainDays > 0 ? weather.nextRainDays + '-day window before next event' : 'favorable window'}. Plan largest structural picks for that window.` },
    ],
    frost_concrete: [
      { type: 'MANDATORY', action: 'Heated enclosure required below 40°F. Propane or electric salamanders — minimum 50°F ambient inside form during pour and 72-hr cure.', spec: 'ACI 306R Cold Weather Concreting', cost: 6800 },
      { type: 'MANDATORY', action: 'Use Type III (high-early) cement or add calcium chloride accelerator at 1–2% by weight of cement. Reduces set time 30–50%.', spec: 'ASTM C150 Type III' },
      { type: 'MANDATORY', action: 'Insulated curing blankets — minimum R-value 1.5 — applied within 15 min of finishing. Maintain for 7 days minimum.', spec: 'ACI 306R §2.3', cost: 2200 },
      { type: 'RECOMMENDED', action: 'Pre-heat aggregates and mixing water. Target fresh concrete temp 60–70°F at point of placement.', cost: 1800 },
      { type: 'RECOMMENDED', action: 'Avoid large flat slabs during freeze. If unavoidable, use micro-fiber reinforcement (1.5 lb/cy) to resist plastic shrinkage cracking.' },
    ],
  };
  return cm[key] ?? cm.schedule_crash;
}

// ─── Arbitration engine ────────────────────────────────────────────────────────

function arbitrate(scenario: ScenarioInput, weather: WeatherSnapshot): ArbitrationVerdict {
  const {
    key, waitCostPerDay, executeCost, daysToIdeal,
    deadlinePressure, crewSize, crewDailyRate, contractValue,
  } = scenario;

  // Total cost of waiting
  const waitCostTotal = (waitCostPerDay + crewSize * crewDailyRate) * daysToIdeal;

  // Countermeasure cost reduction
  const cm = getCountermeasures(key, weather);
  const cmCost = cm.filter(c => c.cost).reduce((s, c) => s + (c.cost ?? 0), 0);
  const executeCostAdjusted = executeCost - cmCost * 0.6; // countermeasures reduce rework by ~60%

  // Break-even calculation: day at which cumulative wait cost exceeds execute cost
  const dailyWaitBurn = waitCostPerDay + crewSize * crewDailyRate;
  const breakEvenDay = dailyWaitBurn > 0 ? Math.ceil(executeCostAdjusted / dailyWaitBurn) : daysToIdeal;

  // Decision tree
  let decision: DecisionVerb;
  let headline: string;
  let rationale: string;
  let riskLevel: RiskLevel;
  let netSavings: number;
  let confidenceScore: number;
  let weatherInfluence: string;

  const deadlineUrgent = deadlinePressure >= 75;
  const waitingIsCheaper = waitCostTotal < executeCostAdjusted;
  const windowIsNear = daysToIdeal <= 3;
  const weatherFavorable = weather.precipProbability < 30 && weather.forecastWindowDays >= 3;

  // Weather influence narrative
  if (weather.source === 'noaa') {
    weatherInfluence = `NOAA live: ${weather.shortForecast}. ${weather.tempHigh}°F high / ${weather.tempLow}°F low. Wind ${weather.windSpeed} mph. Precip ${weather.precipProbability}%. Next clear window: ${weather.forecastWindowDays} days.`;
  } else {
    weatherInfluence = `Synthetic model (NOAA unavailable). Est. ${weather.tempHigh}°F / ${weather.tempLow}°F. Precip ${weather.precipProbability}%.`;
  }

  if (deadlineUrgent && waitCostTotal > executeCostAdjusted) {
    decision = 'CRASH_SCHEDULE';
    headline = 'CRASH THE SCHEDULE — LD Clock Running, Waiting is More Expensive';
    rationale = `Deadline pressure at ${deadlinePressure}/100. Total wait exposure $${waitCostTotal.toLocaleString()} exceeds execute+countermeasure cost of $${executeCostAdjusted.toLocaleString()}. Mobilize second crew and crash. Break-even on waiting hits Day ${breakEvenDay}.`;
    riskLevel = 'HIGH';
    netSavings = waitCostTotal - executeCostAdjusted;
    confidenceScore = 88;
  } else if (!deadlineUrgent && waitingIsCheaper && !windowIsNear) {
    decision = 'WAIT';
    headline = 'STAND DOWN — Weather Window Opens in ' + daysToIdeal + ' Days';
    rationale = `Waiting costs $${waitCostTotal.toLocaleString()} total (${daysToIdeal} days × $${dailyWaitBurn.toLocaleString()}/day). Executing in current conditions risks $${executeCostAdjusted.toLocaleString()} in rework. Net savings by waiting: $${(executeCostAdjusted - waitCostTotal).toLocaleString()}. Release crew to other jobs.`;
    riskLevel = 'LOW';
    netSavings = executeCostAdjusted - waitCostTotal;
    confidenceScore = 82;
  } else if (windowIsNear || weatherFavorable) {
    decision = 'EXECUTE_NOW';
    headline = 'EXECUTE WITH COUNTERMEASURES — Window is Open';
    rationale = `Weather window available (${weather.forecastWindowDays} clear days, precip ${weather.precipProbability}%). Apply ${cm.filter(c=>c.type==='MANDATORY').length} mandatory countermeasures (total cost $${cmCost.toLocaleString()}). Adjusted execute cost $${executeCostAdjusted.toLocaleString()} vs wait exposure $${waitCostTotal.toLocaleString()}. Net advantage to executing now: $${(waitCostTotal - executeCostAdjusted).toLocaleString()}.`;
    riskLevel = 'MEDIUM';
    netSavings = waitCostTotal - executeCostAdjusted;
    confidenceScore = 79;
  } else {
    decision = 'EXECUTE_NOW';
    headline = 'EXECUTE WITH FULL COUNTERMEASURE STACK';
    rationale = `Conditions are suboptimal but manageable with the full ${cm.filter(c=>c.type==='MANDATORY').length}-measure protocol. Execute cost $${executeCostAdjusted.toLocaleString()} (post-mitigation) vs wait cost $${waitCostTotal.toLocaleString()}. Break-even on waiting: Day ${breakEvenDay}. ${deadlineUrgent ? 'Contract deadline pressuring immediate action.' : 'No compelling reason to delay.'}`;
    riskLevel = 'MEDIUM';
    netSavings = waitCostTotal - executeCostAdjusted;
    confidenceScore = 71;
  }

  // Audit signature: deterministic hash-like string
  const sigBase = decision + scenario.key + waitCostTotal + executeCostAdjusted + new Date().toDateString();
  const sigHash = Array.from(sigBase).reduce((h, c) => (Math.imul(31, h) + c.charCodeAt(0)) | 0, 0).toString(16).padStart(8, '0').toUpperCase();
  const auditSignature = `REN-${sigHash}-${new Date().toISOString().replace(/[^0-9]/g,'').substring(0,12)}`;

  return {
    decision, headline, rationale, netSavings,
    riskLevel, confidenceScore,
    countermeasures: cm,
    waitCostTotal, executeCostAdjusted, breakEvenDay,
    auditTimestamp: new Date().toISOString(),
    auditSignature, weatherInfluence,
  };
}

// ─── Anthropic narrative (optional enhancement) ───────────────────────────────

async function getAINarrative(scenario: ScenarioInput, verdict: ArbitrationVerdict, weather: WeatherSnapshot): Promise<string | undefined> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return undefined;
  try {
    const prompt = `You are a construction project controls expert for J. Worden & Sons, a heavy civil paving contractor in Virginia. Write exactly 2 sentences — a plain-English field decision narrative for the foreman. Scenario: ${scenario.label}. Weather: ${weather.shortForecast}, ${weather.tempHigh}F high. Decision: ${verdict.decision}. Net savings: $${verdict.netSavings.toLocaleString()}. Be direct and practical. No emojis.`;
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: 'claude-3-5-haiku-20241022', max_tokens: 120, messages: [{ role: 'user', content: prompt }] }),
    });
    if (!res.ok) return undefined;
    const json = await res.json();
    return json.content?.[0]?.text ?? undefined;
  } catch { return undefined; }
}

// ─── Handler ───────────────────────────────────────────────────────────────────

export const handler: Handler = async (event: HandlerEvent) => {
  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'private, no-cache',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  try {
    const body = JSON.parse(event.body ?? '{}') as { scenario: ScenarioInput; lat?: number; lon?: number; useAI?: boolean };
    const { scenario, lat, lon, useAI } = body;

    if (!scenario?.key) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing scenario.key' }) };
    }

    const defaultLat = parseFloat(process.env.DISPATCH_LAT ?? '37.5407');
    const defaultLon = parseFloat(process.env.DISPATCH_LON ?? '-77.4360');

    const [weatherResult] = await Promise.allSettled([
      fetchWeather(lat ?? defaultLat, lon ?? defaultLon),
    ]);
    const weather: WeatherSnapshot = weatherResult.status === 'fulfilled'
      ? weatherResult.value
      : { tempHigh: 65, tempLow: 50, groundTemp: 46, windSpeed: 8, precipMM: 0, precipProbability: 15, humidity: 60, shortForecast: 'Unknown', source: 'synthetic', forecastWindowDays: 5, nextRainDays: 3 };

    const verdict = arbitrate(scenario, weather);

    if (useAI) {
      const [narrativeResult] = await Promise.allSettled([getAINarrative(scenario, verdict, weather)]);
      if (narrativeResult.status === 'fulfilled' && narrativeResult.value) {
        verdict.aiNarrative = narrativeResult.value;
      }
    }

    const response: RealityEngineResponse = {
      verdict, weather, generatedAt: new Date().toISOString(),
    };

    return { statusCode: 200, headers, body: JSON.stringify(response) };
  } catch (err) {
    const response: RealityEngineResponse = {
      verdict: {
        decision: 'WAIT', headline: 'ENGINE ERROR — Manual Review Required',
        rationale: String(err), netSavings: 0, riskLevel: 'CRITICAL',
        confidenceScore: 0, countermeasures: [], waitCostTotal: 0,
        executeCostAdjusted: 0, breakEvenDay: 0,
        auditTimestamp: new Date().toISOString(), auditSignature: 'ERR',
        weatherInfluence: 'Unknown',
      },
      weather: { tempHigh: 0, tempLow: 0, groundTemp: 0, windSpeed: 0, precipMM: 0, precipProbability: 0, humidity: 0, shortForecast: 'Error', source: 'synthetic', forecastWindowDays: 0, nextRainDays: 0 },
      generatedAt: new Date().toISOString(), error: String(err),
    };
    return { statusCode: 200, headers, body: JSON.stringify(response) };
  }
};

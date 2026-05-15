// ═══════════════════════════════════════════════════════════════════════
// intelligence.ts — The Worden Standard IronGrid Intelligence Engine
// Netlify Function · GET /api/intelligence?layer=X&cluster=Y&debug=1
//
// 7 live data sources · 51 states · debug diagnostics
// BLS ✓ · Census ✓ · EIA PADD ✓ · weather.gov ✓ · FEMA ✓ · SerpAPI ✓ · SAM.gov ✓
// ═══════════════════════════════════════════════════════════════════════
import type { Handler, HandlerEvent } from '@netlify/functions';
import type {
  DataLayer, ConstructionCluster, StateSignal,
  IntelligenceApiResponse
} from '../../src/types/intelligence.types';

const CENSUS_KEY  = process.env.CENSUS_API_KEY  ?? '';
const EIA_KEY     = process.env.EIA_API_KEY     ?? '';
const SAM_KEY     = process.env.SAM_API_KEY     ?? '';
const BLS_KEY     = process.env.BLS_API_KEY     ?? '';
const SERPAPI_KEY = process.env.SERPAPI_KEY      ?? '';

// ─── STATE MAPS ──────────────────────────────────────────────────────────────
const FIPS: Record<string,string> = {
  AL:'01',AK:'02',AZ:'04',AR:'05',CA:'06',CO:'08',CT:'09',DE:'10',
  FL:'12',GA:'13',HI:'15',ID:'16',IL:'17',IN:'18',IA:'19',KS:'20',
  KY:'21',LA:'22',ME:'23',MD:'24',MA:'25',MI:'26',MN:'27',MS:'28',
  MO:'29',MT:'30',NE:'31',NV:'32',NH:'33',NJ:'34',NM:'35',NY:'36',
  NC:'37',ND:'38',OH:'39',OK:'40',OR:'41',PA:'42',RI:'44',SC:'45',
  SD:'46',TN:'47',TX:'48',UT:'49',VT:'50',VA:'51',WA:'53',WV:'54',
  WI:'55',WY:'56',DC:'11',
};
const STATE_ABBRS = Object.keys(FIPS);

const NAME_TO_ABBR: Record<string,string> = {
  'Alabama':'AL','Alaska':'AK','Arizona':'AZ','Arkansas':'AR','California':'CA',
  'Colorado':'CO','Connecticut':'CT','Delaware':'DE','District of Columbia':'DC',
  'Florida':'FL','Georgia':'GA','Hawaii':'HI','Idaho':'ID','Illinois':'IL',
  'Indiana':'IN','Iowa':'IA','Kansas':'KS','Kentucky':'KY','Louisiana':'LA',
  'Maine':'ME','Maryland':'MD','Massachusetts':'MA','Michigan':'MI','Minnesota':'MN',
  'Mississippi':'MS','Missouri':'MO','Montana':'MT','Nebraska':'NE','Nevada':'NV',
  'New Hampshire':'NH','New Jersey':'NJ','New Mexico':'NM','New York':'NY',
  'North Carolina':'NC','North Dakota':'ND','Ohio':'OH','Oklahoma':'OK','Oregon':'OR',
  'Pennsylvania':'PA','Rhode Island':'RI','South Carolina':'SC','South Dakota':'SD',
  'Tennessee':'TN','Texas':'TX','Utah':'UT','Vermont':'VT','Virginia':'VA',
  'Washington':'WA','West Virginia':'WV','Wisconsin':'WI','Wyoming':'WY',
};

const CAPITALS: Record<string,[number,number]> = {
  AL:[32.38,-86.30],AK:[58.30,-134.42],AZ:[33.45,-112.07],AR:[34.75,-92.29],
  CA:[38.58,-121.49],CO:[39.74,-104.98],CT:[41.76,-72.68],DE:[39.16,-75.52],
  DC:[38.90,-77.04],FL:[30.44,-84.28],GA:[33.75,-84.39],HI:[21.31,-157.86],
  ID:[43.62,-116.20],IL:[39.80,-89.65],IN:[39.77,-86.16],IA:[41.59,-93.62],
  KS:[39.05,-95.69],KY:[38.20,-84.87],LA:[30.46,-91.19],ME:[44.31,-69.78],
  MD:[38.97,-76.50],MA:[42.36,-71.06],MI:[42.73,-84.56],MN:[44.95,-93.09],
  MS:[32.30,-90.18],MO:[38.58,-92.17],MT:[46.60,-112.04],NE:[40.81,-96.70],
  NV:[39.16,-119.77],NH:[43.21,-71.54],NJ:[40.22,-74.76],NM:[35.68,-105.94],
  NY:[42.65,-73.76],NC:[35.78,-78.64],ND:[46.81,-100.78],OH:[39.96,-83.00],
  OK:[35.47,-97.52],OR:[44.94,-123.03],PA:[40.26,-76.88],RI:[41.82,-71.41],
  SC:[34.00,-81.03],SD:[44.37,-100.35],TN:[36.17,-86.78],TX:[30.27,-97.74],
  UT:[40.76,-111.89],VT:[44.26,-72.58],VA:[37.54,-77.44],WA:[47.04,-122.90],
  WV:[38.35,-81.63],WI:[43.07,-89.40],WY:[41.14,-104.82],
};

const PADD: Record<string,string[]> = {
  R10: ['CT','ME','MA','NH','RI','VT'],
  R1X: ['DE','DC','FL','GA','MD','NC','NJ','NY','PA','SC','VA','WV'],
  R20: ['IL','IN','IA','KS','KY','MI','MN','MO','NE','ND','OH','OK','SD','TN','WI'],
  R30: ['AL','AR','LA','MS','NM','TX'],
  R40: ['CO','ID','MT','UT','WY'],
  R50: ['AK','AZ','CA','HI','NV','OR','WA'],
};

// ─── DIAGNOSTICS ─────────────────────────────────────────────────────────────
interface Diag { source: string; ok: boolean; count: number; ms: number; error?: string }
let diag: Diag[] = [];
async function timed<T>(source: string, fn: () => Promise<T>): Promise<T> {
  const t0 = Date.now();
  try {
    const r = await fn();
    const n = typeof r === 'object' && r !== null ? Object.keys(r).length : 0;
    diag.push({ source, ok: true, count: n, ms: Date.now() - t0 });
    return r;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    diag.push({ source, ok: false, count: 0, ms: Date.now() - t0, error: msg });
    console.error(`FETCH_ERROR [${source}]:`, msg);
    throw e;
  }
}

// ═══════════════════════════════════════════════════════════════════════
// 1. SERPAPI GOOGLE TRENDS (optional — degrades gracefully without key)
// ═══════════════════════════════════════════════════════════════════════
async function fetchTrends(keywords: string[]): Promise<Record<string,number>> {
  if (!SERPAPI_KEY) throw new Error('SERPAPI_KEY not configured — add to Netlify env vars');
  const kw = keywords.slice(0, 3).join(',');
  const res = await fetch(`https://serpapi.com/search.json?engine=google_trends&q=${encodeURIComponent(kw)}&geo=US&data_type=GEO_MAP_0&api_key=${SERPAPI_KEY}`);
  if (!res.ok) throw new Error(`SerpAPI HTTP ${res.status}`);
  const data = await res.json() as any;
  const out: Record<string,number> = {};
  for (const r of data.interest_by_region ?? []) {
    const abbr = NAME_TO_ABBR[r.location];
    if (abbr) out[abbr] = r.extracted_value ?? r.max_value_index ?? (parseInt(r.value || '0') || 0);
  }
  return out;
}

// ═══════════════════════════════════════════════════════════════════════
// 2. CENSUS BUILDING PERMITS — dynamic date with fallback
// ═══════════════════════════════════════════════════════════════════════
async function fetchResPermits(): Promise<Record<string,{sf:number;mf:number;total:number;changePct:number}>> {
  if (!CENSUS_KEY) throw new Error('CENSUS_API_KEY not configured');
  const base = 'https://api.census.gov/data/timeseries/bps/totals';
  const now = new Date();

  const periods: string[] = [];
  for (let m = 3; m <= 8; m++) {
    const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
    periods.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }

  const tryPeriod = async (period: string): Promise<Record<string,{bldgs:number;units:number}>> => {
    const r = await fetch(`${base}?get=NAME,UNITS,BLDGS&for=state:*&time=${period}&key=${CENSUS_KEY}`);
    if (!r.ok) throw new Error(`Census HTTP ${r.status} for ${period}`);
    const text = await r.text();
    if (text.trimStart().startsWith('<')) throw new Error(`Census HTML for ${period} — invalid key or no data`);
    const rows: string[][] = JSON.parse(text);
    if (rows.length < 2) throw new Error(`Census empty for ${period}`);
    const out: Record<string,{bldgs:number;units:number}> = {};
    for (const row of rows.slice(1)) {
      const fips = row[row.length - 1];
      const abbr = STATE_ABBRS.find(a => FIPS[a] === fips);
      if (abbr) out[abbr] = { bldgs: parseInt(row[2]) || 0, units: parseInt(row[1]) || 0 };
    }
    return out;
  };

  let cur: Record<string,{bldgs:number;units:number}> = {};
  for (const p of periods) {
    try { cur = await tryPeriod(p); if (Object.keys(cur).length > 0) break; } catch { continue; }
  }
  if (Object.keys(cur).length === 0) throw new Error('Census: no data for any recent period');

  const out: Record<string,{sf:number;mf:number;total:number;changePct:number}> = {};
  for (const abbr of STATE_ABBRS) {
    const c = cur[abbr];
    if (!c) continue;
    out[abbr] = { sf: c.bldgs, mf: Math.max(0, c.units - c.bldgs), total: c.units, changePct: 0 };
  }
  return out;
}

// ═══════════════════════════════════════════════════════════════════════
// 3. EIA DIESEL PRICES (PADD → states) — confirmed working
// ═══════════════════════════════════════════════════════════════════════
async function fetchDieselPrices(): Promise<Record<string,number>> {
  if (!EIA_KEY) throw new Error('EIA_API_KEY not configured');
  const paddFacets = Object.keys(PADD).map(c => `facets[duoarea][]=${c}`).join('&');
  const res = await fetch(`https://api.eia.gov/v2/petroleum/pri/gnd/data/?api_key=${EIA_KEY}&frequency=weekly&data[0]=value&facets[product][]=EPD2DXL0&${paddFacets}&sort[0][column]=period&sort[0][direction]=desc&length=12`);
  if (!res.ok) throw new Error(`EIA HTTP ${res.status}`);
  const data = await res.json() as any;
  const paddPrices: Record<string,number> = {};
  for (const d of (data.response?.data ?? [])) {
    if (PADD[d.duoarea] && !paddPrices[d.duoarea]) paddPrices[d.duoarea] = parseFloat(d.value) || 0;
  }
  const out: Record<string,number> = {};
  for (const [region, states] of Object.entries(PADD)) {
    const price = paddPrices[region];
    if (price) for (const st of states) out[st] = price;
  }
  return out;
}

// ═══════════════════════════════════════════════════════════════════════
// 4. BLS CONSTRUCTION EMPLOYMENT — confirmed working
// ═══════════════════════════════════════════════════════════════════════
async function fetchConstructionEmployment(): Promise<Record<string,number>> {
  if (!BLS_KEY) throw new Error('BLS_API_KEY not configured');
  const year = String(new Date().getFullYear());
  const prior = String(new Date().getFullYear() - 1);
  const seriesIds = STATE_ABBRS.map(a => `SMS${FIPS[a]}000003000000001`);
  const out: Record<string,number> = {};
  for (let i = 0; i < seriesIds.length; i += 50) {
    const res = await fetch('https://api.bls.gov/publicAPI/v2/timeseries/data/', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seriesid: seriesIds.slice(i, i + 50), startyear: prior, endyear: year, registrationkey: BLS_KEY }),
    });
    if (!res.ok) throw new Error(`BLS HTTP ${res.status}`);
    const data = await res.json() as any;
    for (const s of (data.Results?.series ?? [])) {
      const fips = s.seriesID.slice(3, 5);
      const abbr = STATE_ABBRS.find(a => FIPS[a] === fips);
      if (abbr && s.data?.[0]) out[abbr] = parseFloat(s.data[0].value) || 0;
    }
  }
  return out;
}

// ═══════════════════════════════════════════════════════════════════════
// 5. WEATHER.GOV TEMPS + ALERTS (free, no key, confirmed working)
// Two calls merged: gridpoint forecast for temps, active alerts for count
// ═══════════════════════════════════════════════════════════════════════
async function fetchWeather(): Promise<Record<string,{tempF:number;hdd:number;alerts:number;forecast:string}>> {
  const UA = 'WordenStandard/4.0 (thewordenstandard.com)';
  const out: Record<string,{tempF:number;hdd:number;alerts:number;forecast:string}> = {};

  const keyStates = [
    'VA','FL','TX','CA','NY','GA','NC','OH','PA','IL','MN','CO',
    'AZ','WA','LA','MI','SC','AL','TN','MO','IN','WI','MD','MA','NJ',
  ];

  let alertMap: Record<string,number> = {};
  try {
    const ar = await fetch('https://api.weather.gov/alerts/active?status=actual&message_type=alert', { headers: { 'User-Agent': UA } });
    if (ar.ok) {
      const ad = await ar.json() as any;
      for (const f of (ad.features ?? [])) {
        const ugcs: string[] = f.properties?.geocode?.UGC ?? [];
        for (const u of ugcs) {
          const st = u.slice(0, 2);
          if (STATE_ABBRS.includes(st)) alertMap[st] = (alertMap[st] ?? 0) + 1;
        }
      }
    }
  } catch { /* alerts optional */ }

  const work = keyStates.map(async (abbr) => {
    try {
      const [lat, lon] = CAPITALS[abbr];
      const pr = await fetch(`https://api.weather.gov/points/${lat},${lon}`, {
        headers: { 'User-Agent': UA, Accept: 'application/geo+json' },
      });
      if (!pr.ok) return;
      const pt = await pr.json() as any;
      const { gridId, gridX, gridY } = pt.properties ?? {};
      if (!gridId) return;
      const fr = await fetch(`https://api.weather.gov/gridpoints/${gridId}/${gridX},${gridY}/forecast`, {
        headers: { 'User-Agent': UA, Accept: 'application/geo+json' },
      });
      if (!fr.ok) return;
      const fc = await fr.json() as any;
      const p = fc.properties?.periods?.[0];
      if (!p) return;
      const tempF = p.temperatureUnit === 'C' ? p.temperature * 9 / 5 + 32 : p.temperature;
      out[abbr] = { tempF, hdd: Math.max(0, 65 - tempF), alerts: alertMap[abbr] ?? 0, forecast: p.shortForecast ?? '' };
    } catch { /* individual state ok to fail */ }
  });
  await Promise.allSettled(work);
  return out;
}

// ═══════════════════════════════════════════════════════════════════════
// 6. FEMA DISASTER DECLARATIONS (free, no key)
// Fixed: correct endpoint + URL encoding
// ═══════════════════════════════════════════════════════════════════════
async function fetchFema(): Promise<Record<string,number>> {
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - 1);
  const since = cutoff.toISOString().slice(0, 10);
  const filter = encodeURIComponent(`declarationType eq 'DR' and declarationDate ge '${since}'`);
  const url = `https://www.fema.gov/api/open/v2/DisasterDeclarationsSummaries?$filter=${filter}&$top=1000&$select=state`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`FEMA HTTP ${res.status}`);
  const data = await res.json() as any;
  const out: Record<string,number> = {};
  for (const d of (data.DisasterDeclarationsSummaries ?? [])) {
    if (d.state && STATE_ABBRS.includes(d.state)) out[d.state] = (out[d.state] ?? 0) + 1;
  }
  return out;
}

// ═══════════════════════════════════════════════════════════════════════
// 7. SAM.GOV FEDERAL CONTRACTS
// Fixed: correct endpoint path, NAICS for highway construction
// ═══════════════════════════════════════════════════════════════════════
async function fetchSam(): Promise<Record<string,number>> {
  if (!SAM_KEY) throw new Error('SAM_API_KEY not configured');
  const now = new Date();
  const ago = new Date(now.getTime() - 30 * 86400000);
  const fmt = (d: Date) => `${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}/${d.getFullYear()}`;
  let url = `https://api.sam.gov/opportunities/v2/search?api_key=${SAM_KEY}&limit=500&postedFrom=${fmt(ago)}&postedTo=${fmt(now)}&naics=237310&ptype=o`;
  let res = await fetch(url);
  if (res.status === 404) {
    url = `https://api.sam.gov/opportunities/v2/search?api_key=${SAM_KEY}&limit=500&postedFrom=${fmt(ago)}&postedTo=${fmt(now)}&keyword=paving+construction&ptype=o`;
    res = await fetch(url);
  }
  if (!res.ok) throw new Error(`SAM HTTP ${res.status}`);
  const data = await res.json() as any;
  const out: Record<string,number> = {};
  for (const opp of (data.opportunitiesData ?? [])) {
    const code = opp.placeOfPerformance?.state?.code ?? '';
    const abbr = code.length === 2 ? code : code.replace('US-', '');
    if (abbr && STATE_ABBRS.includes(abbr)) out[abbr] = (out[abbr] ?? 0) + 1;
  }
  return out;
}

// ─── CLUSTERS ────────────────────────────────────────────────────────────────
const CLUSTERS: Record<string,string[]> = {
  paving:     ['asphalt paving contractor','driveway paving','parking lot paving'],
  concrete:   ['concrete contractor','concrete driveway','flatwork concrete'],
  sitework:   ['excavation contractor','site grading','land clearing'],
  utilities:  ['trenching contractor','underground utilities','water line repair'],
  heavycivil: ['heavy civil contractor','DOT paving','infrastructure contractor'],
  roofing:    ['commercial roofing','flat roof repair','TPO roofing'],
};

// ═══════════════════════════════════════════════════════════════════════
// HANDLER
// ═══════════════════════════════════════════════════════════════════════
export const handler: Handler = async (event: HandlerEvent) => {
  diag = [];
  const layer   = (event.queryStringParameters?.layer   ?? 'construction') as DataLayer;
  const cluster = (event.queryStringParameters?.cluster ?? 'paving') as ConstructionCluster;
  const debug   = event.queryStringParameters?.debug === '1';

  try {
    const [trends, resPermits, diesel, blsEmp, weather, fema, sam] = await Promise.allSettled([
      timed('SerpAPI',  () => fetchTrends(CLUSTERS[cluster] ?? CLUSTERS.paving)),
      timed('Census',   () => fetchResPermits()),
      timed('EIA',      () => fetchDieselPrices()),
      timed('BLS',      () => fetchConstructionEmployment()),
      timed('Weather',  () => fetchWeather()),
      timed('FEMA',     () => fetchFema()),
      timed('SAM',      () => fetchSam()),
    ]);

    const tr  = trends.status     === 'fulfilled' ? trends.value     : {};
    const rp  = resPermits.status === 'fulfilled' ? resPermits.value : {};
    const di  = diesel.status     === 'fulfilled' ? diesel.value     : {};
    const emp = blsEmp.status     === 'fulfilled' ? blsEmp.value     : {};
    const wx  = weather.status    === 'fulfilled' ? weather.value    : {};
    const fem = fema.status       === 'fulfilled' ? fema.value       : {};
    const sm  = sam.status        === 'fulfilled' ? sam.value        : {};

    console.log('INTELLIGENCE:', { trends:Object.keys(tr).length, permits:Object.keys(rp).length, diesel:Object.keys(di).length, bls:Object.keys(emp).length, weather:Object.keys(wx).length, fema:Object.keys(fem).length, sam:Object.keys(sm).length });

    const now = new Date().toISOString();

    const signals: StateSignal[] = STATE_ABBRS.map(abbr => {
      const w = wx[abbr];
      const tempF = w?.tempF ?? null;
      const pavingSeason: StateSignal['pavingSeason'] =
        tempF === null ? null : tempF >= 50 ? 'open' : tempF >= 40 ? 'marginal' : 'closed';
      const freezeThawRisk: StateSignal['freezeThawRisk'] =
        tempF === null ? null : (tempF >= 28 && tempF <= 38) ? 'high' : (tempF >= 25 && tempF < 42) ? 'medium' : 'low';
      const resData = rp[abbr];
      const dieselPrice = di[abbr] ?? null;
      const employment  = emp[abbr] ?? null;
      const interest = tr[abbr] ?? 0;
      const femaCount = fem[abbr] ?? null;
      const samCount  = sm[abbr] ?? null;

      const civilDemandScore = Math.min(100, Math.round(
        interest * 0.3 +
        (resData?.total ? Math.min(30, resData.total / 100) : 0) +
        (employment ? Math.min(20, employment / 50) : 0) +
        (samCount ? Math.min(20, samCount * 4) : 0)
      ));
      const weatherRiskScore = pavingSeason === 'open'
        ? 70 + (freezeThawRisk === 'high' ? 25 : freezeThawRisk === 'medium' ? 12 : 0)
        : pavingSeason === 'marginal' ? 40 : 10;
      const laborAvailabilityScore = employment ? Math.min(100, Math.round(employment / 10)) : 50;

      return {
        abbr, constructionInterest: interest,
        constructionTrend: interest > 60 ? 'up' as const : interest > 30 ? 'flat' as const : 'down' as const,
        topKeyword: CLUSTERS[cluster]?.[0] ?? '', keywordCluster: cluster,
        medianListPrice: null, activeListings: null, daysOnMarket: null,
        priceChangePct: null, saleToListRatio: null, realEstateTrend: 'flat' as const,
        resSingleFamily: resData?.sf ?? null, resMultiFamily: resData?.mf ?? null,
        resTotalUnits: resData?.total ?? null, resPermitChangePct: resData?.changePct ?? null,
        resPermitTrend: (resData?.changePct ?? 0) > 5 ? 'up' as const : (resData?.changePct ?? 0) < -5 ? 'down' as const : 'flat' as const,
        comOfficeRetail: null, comIndustrialWarehouse: null, comTotalValue: null,
        comPermitChangePct: null, comPermitTrend: 'flat' as const,
        asphaltPriceIndex: null, concretePPI: null, steelRebarIndex: null, lumberPPI: null,
        dieselPricePerGallon: dieselPrice, aggregateDemandIndex: null,
        materialsCostTrend: dieselPrice && dieselPrice > 4.0 ? 'up' as const : dieselPrice && dieselPrice < 3.5 ? 'down' as const : 'flat' as const,
        fhwaObligatedM: null, samGovContractsCount: samCount, femaDeclarations: femaCount, dotActiveBids: null,
        civilDemandScore, civilTrend: civilDemandScore > 60 ? 'up' as const : civilDemandScore > 30 ? 'flat' as const : 'down' as const,
        constructionEmployment: employment, jobPostingIndex: null, contractorDensity: null,
        laborAvailabilityScore, laborTrend: employment && employment > 200 ? 'up' as const : 'flat' as const,
        avgTempF: tempF, freezeThawRisk, pavingSeason,
        activeFemaAlerts: w?.alerts ?? null, heatingDegreeDays: w?.hdd ?? null, weatherRiskScore,
        lastUpdated: now,
      };
    });

    const dv = Object.values(di);
    const response: IntelligenceApiResponse = {
      fetchedAt: now, layer, cluster, signals,
      globalMeta: {
        nationalAsphaltPriceIndex: null, nationalConcretePPI: null, nationalSteelIndex: null,
        nationalDieselAvg: dv.length ? +(dv.reduce((a,b)=>a+b,0)/dv.length).toFixed(3) : null,
        totalFederalObligatedBn: null,
        activeFemaDeclarations: Object.values(fem).length ? Object.values(fem).reduce((a,b)=>a+b,0) : null,
      },
    };

    return {
      statusCode: 200,
      headers: { 'Content-Type':'application/json', 'Cache-Control':'public, s-maxage=300, stale-while-revalidate=600', 'Access-Control-Allow-Origin':'*' },
      body: JSON.stringify(debug ? { ...response, _diag: diag } : response),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type':'application/json', 'Access-Control-Allow-Origin':'*' },
      body: JSON.stringify({ error: err instanceof Error ? err.message : 'Internal error', ...(debug ? { _diag: diag } : {}) }),
    };
  }
};

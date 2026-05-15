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
const NOAA_TOKEN  = process.env.NOAA_TOKEN      ?? '';

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

// State capital coordinates for weather.gov (free, no key)
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

// EIA PADD region → states mapping
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
// 1. SERPAPI GOOGLE TRENDS
// ═══════════════════════════════════════════════════════════════════════
async function fetchTrends(keywords: string[]): Promise<Record<string,number>> {
  if (!SERPAPI_KEY) throw new Error('SERPAPI_KEY not configured');
  const kw = keywords.slice(0, 3).join(',');
  const url = `https://serpapi.com/search.json?engine=google_trends&q=${encodeURIComponent(kw)}&geo=US&data_type=GEO_MAP_0&api_key=${SERPAPI_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`SerpAPI HTTP ${res.status}`);
  const data = await res.json() as any;
  const out: Record<string,number> = {};
  for (const r of data.interest_by_region ?? []) {
    const abbr = NAME_TO_ABBR[r.location];
    if (abbr) out[abbr] = r.extracted_value ?? 0;
  }
  return out;
}

// ═══════════════════════════════════════════════════════════════════════
// 2. CENSUS BUILDING PERMITS (BPS API)
// ═══════════════════════════════════════════════════════════════════════
async function fetchResPermits(): Promise<Record<string,{sf:number;mf:number;total:number;changePct:number}>> {
  if (!CENSUS_KEY) throw new Error('CENSUS_API_KEY not configured');
  const url = `https://api.census.gov/data/timeseries/bps/totals?get=NAME,UNITS,BLDGS&for=state:*&time=2024-06&key=${CENSUS_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Census BPS HTTP ${res.status}`);
  const rows: string[][] = await res.json();
  const out: Record<string,{sf:number;mf:number;total:number;changePct:number}> = {};
  rows.slice(1).forEach(row => {
    const fips = row[row.length - 1];
    const abbr = STATE_ABBRS.find(a => FIPS[a] === fips) ?? '';
    if (abbr) out[abbr] = { sf: parseInt(row[1]) || 0, mf: parseInt(row[2]) || 0, total: (parseInt(row[1]) || 0) + (parseInt(row[2]) || 0), changePct: 0 };
  });
  return out;
}

// ═══════════════════════════════════════════════════════════════════════
// 3. EIA DIESEL PRICES (PADD regions → states)
// ═══════════════════════════════════════════════════════════════════════
async function fetchDieselPrices(): Promise<Record<string,number>> {
  if (!EIA_KEY) throw new Error('EIA_API_KEY not configured');
  const paddFacets = Object.keys(PADD).map(c => `facets[duoarea][]=${c}`).join('&');
  const url = `https://api.eia.gov/v2/petroleum/pri/gnd/data/?api_key=${EIA_KEY}&frequency=weekly&data[0]=value&facets[product][]=EPD2DXL0&${paddFacets}&sort[0][column]=period&sort[0][direction]=desc&length=12`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`EIA HTTP ${res.status}`);
  const data = await res.json() as any;
  const paddPrices: Record<string,number> = {};
  for (const d of (data.response?.data ?? [])) {
    const code = d.duoarea ?? '';
    if (PADD[code] && !paddPrices[code]) {
      paddPrices[code] = parseFloat(d.value) || 0;
    }
  }
  const out: Record<string,number> = {};
  for (const [region, states] of Object.entries(PADD)) {
    const price = paddPrices[region];
    if (price) for (const st of states) out[st] = price;
  }
  return out;
}

// ═══════════════════════════════════════════════════════════════════════
// 4. BLS CONSTRUCTION EMPLOYMENT
// ═══════════════════════════════════════════════════════════════════════
async function fetchConstructionEmployment(): Promise<Record<string,number>> {
  if (!BLS_KEY) throw new Error('BLS_API_KEY not configured');
  const seriesIds = STATE_ABBRS.map(a => `SMS${FIPS[a]}000003000000001`);
  const batches = [];
  for (let i = 0; i < seriesIds.length; i += 50) batches.push(seriesIds.slice(i, i + 50));
  const out: Record<string,number> = {};
  for (const batch of batches) {
    const res = await fetch('https://api.bls.gov/publicAPI/v2/timeseries/data/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seriesid: batch, startyear: '2024', endyear: '2024', registrationkey: BLS_KEY }),
    });
    if (!res.ok) throw new Error(`BLS HTTP ${res.status}`);
    const data = await res.json() as any;
    (data.Results?.series ?? []).forEach((s: { seriesID: string; data: { value: string }[] }) => {
      const fips = s.seriesID.slice(3, 5);
      const abbr = STATE_ABBRS.find(a => FIPS[a] === fips) ?? '';
      if (abbr && s.data[0]) out[abbr] = parseFloat(s.data[0].value) || 0;
    });
  }
  return out;
}

// ═══════════════════════════════════════════════════════════════════════
// 5. NOAA TEMPERATURE DATA
// ═══════════════════════════════════════════════════════════════════════
async function fetchNoaaTemps(): Promise<Record<string,{tempF:number;hdd:number}>> {
  if (!NOAA_TOKEN) throw new Error('NOAA_TOKEN not configured');
  const url = `https://www.ncei.noaa.gov/cdo-web/api/v2/data?datasetid=NORMAL_DLY&datatypeid=DLY-TAVG-NORMAL&locationcategoryid=ST&startdate=2010-05-01&enddate=2010-05-01&limit=52&units=standard`;
  const res = await fetch(url, { headers: { token: NOAA_TOKEN } });
  if (!res.ok) throw new Error(`NOAA HTTP ${res.status}`);
  const data = await res.json() as any;
  const out: Record<string,{tempF:number;hdd:number}> = {};
  const fipsToAbbr: Record<string,string> = {};
  for (const [abbr, fips] of Object.entries(FIPS)) fipsToAbbr[`FIPS:${fips}`] = abbr;
  (data.results ?? []).forEach((r: { station: string; value: number }) => {
    const abbr = fipsToAbbr[r.station] ?? '';
    if (abbr) {
      const f = r.value;
      out[abbr] = { tempF: f, hdd: Math.max(0, 65 - f) };
    }
  });
  return out;
}

// ═══════════════════════════════════════════════════════════════════════
// 6. WEATHER.GOV ACTIVE ALERTS
// ═══════════════════════════════════════════════════════════════════════
async function fetchWeatherAlerts(): Promise<Record<string,number>> {
  const url = `https://api.weather.gov/alerts/active?status=actual&message_type=alert`;
  const res = await fetch(url, { headers: { 'User-Agent': 'IronGrid Intelligence Engine' } });
  if (!res.ok) throw new Error(`weather.gov HTTP ${res.status}`);
  const data = await res.json() as any;
  const out: Record<string,number> = {};
  for (const f of (data.features ?? [])) {
    const ugcs: string[] = f.properties?.geocode?.UGC ?? [];
    const states = Array.from(new Set(ugcs.map((u: string) => u.slice(0, 2))));
    for (const abbr of states) {
      if (STATE_ABBRS.includes(abbr)) {
        out[abbr] = (out[abbr] ?? 0) + 1;
      }
    }
  }
  return out;
}

// ═══════════════════════════════════════════════════════════════════════
// 7. FEMA DISASTER DECLARATIONS
// ═══════════════════════════════════════════════════════════════════════
async function fetchFemaDeclarations(): Promise<Record<string,number>> {
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - 1);
  const since = cutoff.toISOString().slice(0, 10);
  const url = `https://www.fema.gov/api/open/v2/DisasterDeclarations?$filter=declarationType eq 'DR' and declarationDate ge '${since}'&$top=1000&$select=state,declarationDate&$orderby=declarationDate desc`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`FEMA HTTP ${res.status}`);
  const data = await res.json() as any;
  const out: Record<string,number> = {};
  for (const d of (data.DisasterDeclarations ?? [])) {
    const abbr = d.state;
    if (abbr && STATE_ABBRS.includes(abbr)) {
      out[abbr] = (out[abbr] ?? 0) + 1;
    }
  }
  return out;
}

// ═══════════════════════════════════════════════════════════════════════
// 8. SAM.GOV FEDERAL CONTRACTS
// ═══════════════════════════════════════════════════════════════════════
async function fetchSamContracts(): Promise<Record<string,number>> {
  if (!SAM_KEY) throw new Error('SAM_API_KEY not configured');
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yyyy = d.getFullYear();
  const url = `https://api.sam.gov/opportunities/v2/search?api_key=${SAM_KEY}&postedFrom=${mm}/${dd}/${yyyy}&keyword=construction&limit=100&offset=0`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`SAM.gov HTTP ${res.status}`);
  const data = await res.json() as any;
  const out: Record<string,number> = {};
  for (const opp of (data.opportunitiesData ?? [])) {
    const code = opp.placeOfPerformance?.state?.code ?? '';
    const abbr = code.length === 2 ? code : code.replace('US-', '');
    if (abbr && STATE_ABBRS.includes(abbr)) {
      out[abbr] = (out[abbr] ?? 0) + 1;
    }
  }
  return out;
}

// ═══════════════════════════════════════════════════════════════════════
// HANDLER
// ═══════════════════════════════════════════════════════════════════════
export const handler: Handler = async (event: HandlerEvent) => {
  diag = [];
  const layer   = (event.queryStringParameters?.layer   ?? 'construction') as DataLayer;
  const cluster = (event.queryStringParameters?.cluster ?? 'paving') as ConstructionCluster;
  const debug   = event.queryStringParameters?.debug === '1';

  const CLUSTERS: Record<string,string[]> = {
    paving:     ['asphalt paving contractor','driveway paving','parking lot paving','asphalt repair','sealcoating contractor'],
    concrete:   ['concrete contractor','concrete driveway','concrete repair','flatwork concrete'],
    sitework:   ['excavation contractor','site grading contractor','land clearing contractor','earthwork contractor'],
    utilities:  ['trenching contractor','underground utilities contractor','water line repair'],
    heavycivil: ['heavy civil contractor','DOT paving contractor','VDOT contractor','infrastructure contractor'],
    roofing:    ['commercial roofing contractor','flat roof repair','TPO roofing contractor'],
  };

  try {
    const [trends, resPermits, diesel, blsEmp, noaaTemps, weatherAlerts, fema, sam] = await Promise.allSettled([
      timed('SerpAPI',     () => fetchTrends(CLUSTERS[cluster] ?? CLUSTERS.paving)),
      timed('Census BPS',  () => fetchResPermits()),
      timed('EIA PADD',    () => fetchDieselPrices()),
      timed('BLS QCEW',    () => fetchConstructionEmployment()),
      timed('NOAA CDO',    () => fetchNoaaTemps()),
      timed('weather.gov', () => fetchWeatherAlerts()),
      timed('FEMA',        () => fetchFemaDeclarations()),
      timed('SAM.gov',     () => fetchSamContracts()),
    ]);

    const tr   = trends.status        === 'fulfilled' ? trends.value        : {};
    const rp   = resPermits.status    === 'fulfilled' ? resPermits.value    : {};
    const di   = diesel.status        === 'fulfilled' ? diesel.value        : {};
    const emp  = blsEmp.status        === 'fulfilled' ? blsEmp.value        : {};
    const tmp  = noaaTemps.status     === 'fulfilled' ? noaaTemps.value     : {};
    const wa   = weatherAlerts.status === 'fulfilled' ? weatherAlerts.value : {};
    const fem  = fema.status          === 'fulfilled' ? fema.value          : {};
    const samC = sam.status           === 'fulfilled' ? sam.value           : {};

    const now = new Date().toISOString();

    const signals: StateSignal[] = STATE_ABBRS.map(abbr => {
      const tempData = tmp[abbr];
      const tempF = tempData?.tempF ?? null;
      const pavingSeason: StateSignal['pavingSeason'] =
        tempF === null ? null : tempF >= 50 ? 'open' : tempF >= 40 ? 'marginal' : 'closed';
      const freezeThawRisk: StateSignal['freezeThawRisk'] =
        tempF === null ? null : (tempF >= 28 && tempF <= 38) ? 'high' : (tempF >= 25 && tempF < 42) ? 'medium' : 'low';
      const resData = rp[abbr];
      const dieselPrice = di[abbr] ?? null;
      const employment  = emp[abbr] ?? null;
      const constructionInterest = tr[abbr] ?? 0;
      const femaCount  = fem[abbr] ?? null;
      const samCount   = samC[abbr] ?? null;
      const alertCount = wa[abbr] ?? null;
      const civilDemandScore = Math.min(100, Math.round(
        constructionInterest * 0.4 +
        (resData?.total ? Math.min(50, resData.total / 50) : 0) +
        (employment ? Math.min(30, employment / 10) : 0)
      ));
      const weatherRiskScore = pavingSeason === 'open'
        ? 70 + (freezeThawRisk === 'high' ? 25 : freezeThawRisk === 'medium' ? 12 : 0)
        : pavingSeason === 'marginal' ? 40 : 10;

      return {
        abbr,
        constructionInterest,
        constructionTrend: constructionInterest > 60 ? 'up' as const : constructionInterest > 30 ? 'flat' as const : 'down' as const,
        topKeyword: CLUSTERS[cluster]?.[0] ?? '',
        keywordCluster: cluster,
        medianListPrice: null, activeListings: null, daysOnMarket: null,
        priceChangePct: null, saleToListRatio: null, realEstateTrend: 'flat' as const,
        resSingleFamily: resData?.sf ?? null, resMultiFamily: resData?.mf ?? null,
        resTotalUnits: resData?.total ?? null, resPermitChangePct: resData?.changePct ?? null,
        resPermitTrend: (resData?.changePct ?? 0) > 0 ? 'up' as const : (resData?.changePct ?? 0) < 0 ? 'down' as const : 'flat' as const,
        comOfficeRetail: null, comIndustrialWarehouse: null, comTotalValue: null,
        comPermitChangePct: null, comPermitTrend: 'flat' as const,
        asphaltPriceIndex: null, concretePPI: null, steelRebarIndex: null,
        lumberPPI: null, dieselPricePerGallon: dieselPrice, aggregateDemandIndex: null,
        materialsCostTrend: 'flat' as const,
        fhwaObligatedM: null, samGovContractsCount: samCount, femaDeclarations: femaCount,
        dotActiveBids: null, civilDemandScore, civilTrend: civilDemandScore > 60 ? 'up' as const : 'flat' as const,
        constructionEmployment: employment, jobPostingIndex: null,
        contractorDensity: null, laborAvailabilityScore: 50, laborTrend: 'flat' as const,
        avgTempF: tempF, freezeThawRisk, pavingSeason,
        activeFemaAlerts: alertCount, heatingDegreeDays: tempData?.hdd ?? null,
        weatherRiskScore,
        lastUpdated: now,
      };
    });

    const response: IntelligenceApiResponse = {
      fetchedAt: now, layer, cluster, signals,
      globalMeta: {
        nationalAsphaltPriceIndex: null,
        nationalConcretePPI: null,
        nationalSteelIndex: null,
        nationalDieselAvg: Object.values(di).length
          ? +(Object.values(di).reduce((a, b) => a + b, 0) / Object.values(di).length).toFixed(3)
          : null,
        totalFederalObligatedBn: null,
        activeFemaDeclarations: Object.values(fem).length
          ? Object.values(fem).reduce((a, b) => a + b, 0)
          : null,
      },
    };

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(debug ? { ...response, _diag: diag } : response),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        error: err instanceof Error ? err.message : 'Internal error',
        ...(debug ? { _diag: diag } : {}),
      }),
    };
  }
};

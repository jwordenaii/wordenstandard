// ═══════════════════════════════════════════════════════════════════════
// api/intelligence.ts
// Netlify Function  ·  GET /api/intelligence?layer=X&cluster=Y
// Aggregates all 8 data layers into one response.
// Deploy as: netlify/functions/intelligence.ts
// Or rename to pages/api/intelligence.ts for Next.js
// ═══════════════════════════════════════════════════════════════════════
import type { Handler, HandlerEvent } from '@netlify/functions';
import type {
  DataLayer, ConstructionCluster, StateSignal,
  IntelligenceApiResponse
} from '../../src/types/intelligence.types';

// ─── ENV VARS REQUIRED ───────────────────────────────────────────────────────
// GOOGLE_TRENDS_API_KEY    — pytrends microservice key OR serpapi.com
// CENSUS_API_KEY           — api.census.gov (free, register at census.gov)
// EIA_API_KEY              — api.eia.gov (free, register at eia.gov)
// ATTOM_API_KEY            — api.gateway.attomdata.com (paid)
// SAM_API_KEY              — api.sam.gov (free with registration)
// NOAA_TOKEN               — api.noaa.gov CDO (free, register at ncdc.noaa.gov)
// BLS_API_KEY              — api.bls.gov (free, register at bls.gov)

const CENSUS_KEY  = process.env.CENSUS_API_KEY  ?? '';
const EIA_KEY     = process.env.EIA_API_KEY     ?? '';
const ATTOM_KEY   = process.env.ATTOM_API_KEY   ?? '';
const SAM_KEY     = process.env.SAM_API_KEY     ?? '';
const NOAA_TOKEN  = process.env.NOAA_TOKEN      ?? '';
const BLS_KEY     = process.env.BLS_API_KEY     ?? '';

// State FIPS map (abbr → 2-digit FIPS code)
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

const STATE_NAMES: Record<string,string> = {
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
  'Washington':'WA','West Virginia':'WV','Wisconsin':'WI','Wyoming':'WY'
};

// ─── GOOGLE TRENDS (via SerpAPI or pytrends microservice) ────────────────────
async function fetchTrends(keywords: string[]): Promise<Record<string,number>> {
  try {
    const kw = encodeURIComponent(keywords.slice(0,3).join(','));
    const url = `https://serpapi.com/search?engine=google_trends&q=${kw}&geo=US&data_type=GEO_MAP_0&api_key=${process.env.SERPAPI_KEY}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`SerpAPI ${res.status}`);
    const data = await res.json();
    const out: Record<string,number> = {};
    (data.interest_by_region ?? []).forEach((r: {location:string;max_value_index:number}) => {
      const abbr = STATE_NAMES[r.location] ?? '';
      if (abbr) out[abbr] = r.max_value_index ?? 0;
    });
    return out;
  } catch (e) {
    console.error('FETCH_ERROR fetchTrends:', e);
    return {};
  }
}

// ─── CENSUS BUILDING PERMITS (BPS API) ──────────────────────────────────────
async function fetchResPermits(): Promise<Record<string,{sf:number;mf:number;total:number;changePct:number}>> {
  try {
    const url = `https://api.census.gov/data/timeseries/bps/totals?get=NAME,UNITS,BLDGS&for=state:*&time=2024-06&key=${CENSUS_KEY}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Census BPS ${res.status}`);
    const rows: string[][] = await res.json();
    const out: Record<string,{sf:number;mf:number;total:number;changePct:number}> = {};
    rows.slice(1).forEach(row => {
      const fips = row[row.length-1];
      const abbr = STATE_ABBRS.find(a => FIPS[a] === fips) ?? '';
      if (abbr) out[abbr] = { sf: parseInt(row[1])||0, mf: parseInt(row[2])||0, total:(parseInt(row[1])||0)+(parseInt(row[2])||0), changePct: 0 };
    });
    return out;
  } catch (e) { console.error('FETCH_ERROR fetchResPermits:', e); return {}; }
}

// ─── EIA DIESEL PRICES ───────────────────────────────────────────────────────
async function fetchDieselPrices(): Promise<Record<string,number>> {
  try {
    const url = `https://api.eia.gov/v2/petroleum/pri/gnd/data/?api_key=${EIA_KEY}&frequency=weekly&data[0]=value&facets[product][]=EPD2DXL0&sort[0][column]=period&sort[0][direction]=desc&length=51`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`EIA ${res.status}`);
    const data = await res.json();
    const out: Record<string,number> = {};
    (data.response?.data ?? []).forEach((d: {area:string;value:string}) => {
      const abbr = d.area?.replace('US','').trim().toUpperCase();
      if (abbr && STATE_ABBRS.includes(abbr)) out[abbr] = parseFloat(d.value)||0;
    });
    return out;
  } catch (e) { console.error('FETCH_ERROR fetchDieselPrices:', e); return {}; }
}

// ─── BLS CONSTRUCTION EMPLOYMENT ────────────────────────────────────────────
async function fetchConstructionEmployment(): Promise<Record<string,number>> {
  try {
    const seriesIds = STATE_ABBRS.map(a => `SMS${FIPS[a]}000003000000001`);
    const batches = [];
    for (let i = 0; i < seriesIds.length; i += 50) batches.push(seriesIds.slice(i, i+50));
    const out: Record<string,number> = {};
    for (const batch of batches) {
      const res = await fetch('https://api.bls.gov/publicAPI/v2/timeseries/data/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seriesid: batch, startyear: '2024', endyear: '2024', registrationkey: BLS_KEY }),
      });
      if (!res.ok) continue;
      const data = await res.json();
      (data.Results?.series ?? []).forEach((s: {seriesID:string;data:{value:string}[]}) => {
        const fips = s.seriesID.slice(3,5);
        const abbr = STATE_ABBRS.find(a => FIPS[a] === fips) ?? '';
        if (abbr && s.data[0]) out[abbr] = parseFloat(s.data[0].value)||0;
      });
    }
    return out;
  } catch (e) { console.error('FETCH_ERROR fetchConstructionEmployment:', e); return {}; }
}

// ─── NOAA TEMPERATURE DATA ───────────────────────────────────────────────────
async function fetchNoaaTemps(): Promise<Record<string,{tempF:number;hdd:number}>> {
  try {
    const url = `https://www.ncei.noaa.gov/cdo-web/api/v2/data?datasetid=NORMAL_DLY&datatypeid=DLY-TAVG-NORMAL&locationcategoryid=ST&startdate=2010-05-01&enddate=2010-05-01&limit=52&units=standard`;
    const res = await fetch(url, { headers: { token: NOAA_TOKEN } });
    if (!res.ok) throw new Error(`NOAA ${res.status}`);
    const data = await res.json();
    const out: Record<string,{tempF:number;hdd:number}> = {};
    const stateMap: Record<string,string> = {
      'FIPS:01':'AL','FIPS:02':'AK','FIPS:04':'AZ','FIPS:05':'AR','FIPS:06':'CA',
      'FIPS:08':'CO','FIPS:09':'CT','FIPS:10':'DE','FIPS:11':'DC','FIPS:12':'FL',
      'FIPS:13':'GA','FIPS:15':'HI','FIPS:16':'ID','FIPS:17':'IL','FIPS:18':'IN',
      'FIPS:19':'IA','FIPS:20':'KS','FIPS:21':'KY','FIPS:22':'LA','FIPS:23':'ME',
      'FIPS:24':'MD','FIPS:25':'MA','FIPS:26':'MI','FIPS:27':'MN','FIPS:28':'MS',
      'FIPS:29':'MO','FIPS:30':'MT','FIPS:31':'NE','FIPS:32':'NV','FIPS:33':'NH',
      'FIPS:34':'NJ','FIPS:35':'NM','FIPS:36':'NY','FIPS:37':'NC','FIPS:38':'ND',
      'FIPS:39':'OH','FIPS:40':'OK','FIPS:41':'OR','FIPS:42':'PA','FIPS:44':'RI',
      'FIPS:45':'SC','FIPS:46':'SD','FIPS:47':'TN','FIPS:48':'TX','FIPS:49':'UT',
      'FIPS:50':'VT','FIPS:51':'VA','FIPS:53':'WA','FIPS:54':'WV','FIPS:55':'WI',
      'FIPS:56':'WY'
    };
    (data.results ?? []).forEach((r: {station:string;value:number}) => {
      const abbr = stateMap[r.station] ?? '';
      if (abbr) {
        const f = r.value;
        out[abbr] = { tempF: f, hdd: Math.max(0, 65 - f) };
      }
    });
    return out;
  } catch (e) { console.error('FETCH_ERROR fetchNoaaTemps:', e); return {}; }
}

// ─── HANDLER ─────────────────────────────────────────────────────────────────
export const handler: Handler = async (event: HandlerEvent) => {
  const layer   = (event.queryStringParameters?.layer   ?? 'construction') as DataLayer;
  const cluster = (event.queryStringParameters?.cluster ?? 'paving') as ConstructionCluster;

  const CLUSTERS: Record<string,string[]> = {
    paving:     ['asphalt paving contractor','driveway paving','parking lot paving','asphalt repair','sealcoating contractor'],
    concrete:   ['concrete contractor','concrete driveway','concrete repair','flatwork concrete'],
    sitework:   ['excavation contractor','site grading contractor','land clearing contractor','earthwork contractor'],
    utilities:  ['trenching contractor','underground utilities contractor','water line repair'],
    heavycivil: ['heavy civil contractor','DOT paving contractor','VDOT contractor','infrastructure contractor'],
    roofing:    ['commercial roofing contractor','flat roof repair','TPO roofing contractor'],
  };

  try {
    const [trends, resPermits, diesel, blsEmp, noaaTemps] = await Promise.allSettled([
      fetchTrends(CLUSTERS[cluster] ?? CLUSTERS.paving),
      fetchResPermits(),
      fetchDieselPrices(),
      fetchConstructionEmployment(),
      fetchNoaaTemps(),
    ]);

    const tr  = trends.status      === 'fulfilled' ? trends.value      : {};
    const rp  = resPermits.status  === 'fulfilled' ? resPermits.value  : {};
    const di  = diesel.status      === 'fulfilled' ? diesel.value      : {};
    const emp = blsEmp.status      === 'fulfilled' ? blsEmp.value      : {};
    const tmp = noaaTemps.status   === 'fulfilled' ? noaaTemps.value   : {};

    console.log('INTELLIGENCE FETCH RESULTS:', {
      trends: Object.keys(tr).length,
      permits: Object.keys(rp).length,
      diesel: Object.keys(di).length,
      employment: Object.keys(emp).length,
      noaa: Object.keys(tmp).length,
    });

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
      const civilDemandScore = Math.min(100, Math.round(constructionInterest * 0.4 + (resData?.total ? Math.min(50,resData.total/50) : 0) + (employment ? Math.min(30,employment/10) : 0)));
      const weatherRiskScore = pavingSeason === 'open' ? 70 + (freezeThawRisk === 'high' ? 25 : freezeThawRisk === 'medium' ? 12 : 0) : pavingSeason === 'marginal' ? 40 : 10;

      return {
        abbr,
        constructionInterest, constructionTrend: constructionInterest > 60 ? 'up' : constructionInterest > 30 ? 'flat' : 'down',
        topKeyword: CLUSTERS[cluster]?.[0] ?? '',
        keywordCluster: cluster,
        medianListPrice: null, activeListings: null, daysOnMarket: null,
        priceChangePct: null, saleToListRatio: null, realEstateTrend: 'flat',
        resSingleFamily: resData?.sf ?? null, resMultiFamily: resData?.mf ?? null,
        resTotalUnits: resData?.total ?? null, resPermitChangePct: resData?.changePct ?? null,
        resPermitTrend: (resData?.changePct ?? 0) > 0 ? 'up' : (resData?.changePct ?? 0) < 0 ? 'down' : 'flat',
        comOfficeRetail: null, comIndustrialWarehouse: null, comTotalValue: null,
        comPermitChangePct: null, comPermitTrend: 'flat',
        asphaltPriceIndex: null, concretePPI: null, steelRebarIndex: null,
        lumberPPI: null, dieselPricePerGallon: dieselPrice, aggregateDemandIndex: null,
        materialsCostTrend: 'flat',
        fhwaObligatedM: null, samGovContractsCount: null, femaDeclarations: null,
        dotActiveBids: null, civilDemandScore, civilTrend: civilDemandScore > 60 ? 'up' : 'flat',
        constructionEmployment: employment, jobPostingIndex: null,
        contractorDensity: null, laborAvailabilityScore: 50, laborTrend: 'flat',
        avgTempF: tempF, freezeThawRisk, pavingSeason,
        activeFemaAlerts: null, heatingDegreeDays: tempData?.hdd ?? null,
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
        nationalDieselAvg: Object.values(di).length ? +(Object.values(di).reduce((a,b)=>a+b,0)/Object.values(di).length).toFixed(3) : null,
        totalFederalObligatedBn: null,
        activeFemaDeclarations: null,
      },
    };

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(response),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err instanceof Error ? err.message : 'Internal error' }),
    };
  }
};

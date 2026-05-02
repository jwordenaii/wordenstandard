import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const DEFAULT_SOURCES = [
  'https://www.procore.com/library/construction-technology',
  'https://construction.autodesk.com/resources/',
  'https://www.openspace.ai/blog',
  'https://buildots.com/blog/',
  'https://www.constructiondive.com/topic/technology/',
  'https://www.mckinsey.com/industries/capital-projects-and-infrastructure/our-insights',
  'https://www.rosepaving.com/locations/parking-lot-paving-mid-atlantic-region/',
  'https://hhpaving.com/',
];

const radarSchema = {
  type: 'object',
  properties: {
    digest: { type: 'string' },
    opportunities: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          category: { type: 'string', enum: ['ai_voice', 'vision_qc', 'bid_automation', 'field_ops_ai', 'sales_ai', 'reputation_ai', 'other'] },
          relevance: { type: 'number', minimum: 0, maximum: 100 },
          novelty: { type: 'number', minimum: 0, maximum: 100 },
          moat_score: { type: 'number', minimum: 0, maximum: 100 },
          build_effort: { type: 'string', enum: ['small', 'medium', 'large'] },
          confidence: { type: 'number', minimum: 0, maximum: 1 },
          summary: { type: 'string' },
          why_now: { type: 'string' },
          build_spec: { type: 'string' },
          approval_required: { type: 'boolean' },
        },
        required: ['title', 'category', 'relevance', 'novelty', 'moat_score', 'build_effort', 'confidence', 'summary', 'why_now', 'build_spec', 'approval_required'],
      },
    },
    watchlist: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          trend: { type: 'string' },
          signal: { type: 'string' },
          confidence: { type: 'number', minimum: 0, maximum: 1 },
          trigger: { type: 'string' },
        },
        required: ['trend', 'signal', 'confidence', 'trigger'],
      },
    },
    countermoves: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          action: { type: 'string' },
          owner: { type: 'string' },
          eta_days: { type: 'number', minimum: 1, maximum: 90 },
          approval_required: { type: 'boolean' },
          expected_impact: { type: 'string' },
        },
        required: ['action', 'owner', 'eta_days', 'approval_required', 'expected_impact'],
      },
    },
  },
  required: ['digest', 'opportunities', 'watchlist', 'countermoves'],
};

function parseBody(reqBody: any) {
  const sources = Array.isArray(reqBody?.sources) ? reqBody.sources : [];
  const competitorUrls = Array.isArray(reqBody?.competitor_urls) ? reqBody.competitor_urls : [];

  const merged = [...DEFAULT_SOURCES, ...sources, ...competitorUrls]
    .map((u) => String(u || '').trim())
    .filter(Boolean);

  return {
    sources: [...new Set(merged)].slice(0, 16),
  };
}

async function fetchSourceSnapshot(url: string) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'JWorden-AI-Research-Radar/1.0',
      },
    });
    const text = await res.text();
    const titleMatch = text.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : 'Untitled page';
    const compact = text
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 900);

    return {
      url,
      ok: res.ok,
      status: res.status,
      title,
      snippet: compact,
    };
  } catch (error) {
    return {
      url,
      ok: false,
      status: 0,
      title: 'Fetch failed',
      snippet: String(error?.message || error),
    };
  }
}

function sanitizeRadar(result: any) {
  const opportunities = Array.isArray(result?.opportunities) ? result.opportunities : [];
  const watchlist = Array.isArray(result?.watchlist) ? result.watchlist : [];
  const countermoves = Array.isArray(result?.countermoves) ? result.countermoves : [];

  return {
    digest: String(result?.digest || '').slice(0, 2000),
    opportunities: opportunities.slice(0, 10),
    watchlist: watchlist.slice(0, 10),
    countermoves: countermoves.slice(0, 10),
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const caller = await base44.auth.me().catch(() => null);
    const isScheduled = req.headers.get('x-base44-automation') || !caller;
    if (!isScheduled && caller?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { sources } = parseBody(body);

    const sourceSnapshots = [];
    for (const url of sources) {
      sourceSnapshots.push(await fetchSourceSnapshot(url));
    }

    const now = new Date();
    const prompt = `You are an elite construction AI R&D strategist for J. Worden & Sons Asphalt Paving.

OBJECTIVE:
Analyze these web snapshots and propose concrete internal AI product logic the team can build in-house to become best-in-class.

CONTEXT:
- Company: regional asphalt and commercial paving operator with voice AI, lead scoring, and command-center workflows.
- Priority: opportunities with practical implementation in 7-45 days.
- Safety: any public claims, pricing, or large budget changes require human approval.

SOURCE SNAPSHOTS:
${JSON.stringify(sourceSnapshots, null, 2)}

RESPONSE RULES:
- Return strict JSON only using schema.
- Favor implementation ideas over generic summaries.
- Include build_spec fields that are specific enough for a developer ticket.
- Keep each summary concise and tactical.`;

    const llm = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: radarSchema,
      model: 'gpt_5',
    });

    const radar = sanitizeRadar(llm);

    const existing = await base44.asServiceRole.entities.SyncState.list();
    const syncRecord = Array.isArray(existing) && existing.length > 0 ? existing[0] : null;

    const payload = {
      ai_research_last_run_at: now.toISOString(),
      ai_research_sources: JSON.stringify(sources),
      ai_research_digest: radar.digest,
      ai_research_opportunities: JSON.stringify(radar.opportunities),
      ai_research_watchlist: JSON.stringify(radar.watchlist),
      ai_research_countermoves: JSON.stringify(radar.countermoves),
    };

    if (syncRecord) {
      await base44.asServiceRole.entities.SyncState.update(syncRecord.id, payload);
    } else {
      await base44.asServiceRole.entities.SyncState.create(payload);
    }

    const users = await base44.asServiceRole.entities.User.list();
    const admins = users.filter((u) => u.role === 'admin');
    if (admins.length > 0) {
      const top = radar.opportunities.slice(0, 3);
      const bodyText = [
        'AI RESEARCH RADAR — CONSTRUCTION INTELLIGENCE',
        `Run at: ${now.toISOString()}`,
        '',
        radar.digest || 'No digest generated.',
        '',
        'TOP BUILD OPPORTUNITIES:',
        ...top.map((item, idx) => `${idx + 1}. ${item.title} (${item.category}) | relevance ${item.relevance}/100 | effort ${item.build_effort}`),
        '',
        'All opportunities and countermoves are now available in SyncState for Command Center rendering.',
      ].join('\n');

      for (const admin of admins) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: admin.email,
          subject: `AI Research Radar — ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
          body: bodyText,
          from_name: 'J. Worden AI Research Radar',
        });
      }
    }

    return Response.json({
      success: true,
      ran_at: now.toISOString(),
      sources_scanned: sources.length,
      opportunities: radar.opportunities.length,
      countermoves: radar.countermoves.length,
      watchlist: radar.watchlist.length,
    });
  } catch (error) {
    console.error('[scanConstructionAIResearch] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

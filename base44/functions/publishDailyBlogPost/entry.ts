import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

type NewsItem = {
  title: string;
  link: string;
  pubDate?: string;
};

type DraftPost = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: 'maintenance' | 'process' | 'materials' | 'local-guides' | 'cost' | 'commercial';
  tags: string[];
  read_time_minutes: number;
  cover_image?: string;
};

const DEFAULT_COVER = 'https://www.jwordenasphaltpaving.com/hero-paving.jpg';

const NEWS_FEEDS = [
  'https://news.google.com/rss/search?q=asphalt+paving+industry+news&hl=en-US&gl=US&ceid=US:en',
  'https://news.google.com/rss/search?q=road+construction+technology+news&hl=en-US&gl=US&ceid=US:en',
  'https://news.google.com/rss/search?q=AI+construction+software+news&hl=en-US&gl=US&ceid=US:en',
  'https://news.google.com/rss/search?q=residential+driveway+maintenance+tips&hl=en-US&gl=US&ceid=US:en',
];

const FALLBACK_WEEKDAY_TOPICS = [
  'AI tools helping asphalt contractors estimate and schedule jobs faster',
  'What current paving material trends mean for Virginia property owners',
  'How weather data and AI improve asphalt maintenance planning',
  'Commercial parking lot lifecycle planning for lower long-term cost',
];

const FALLBACK_WEEKEND_TOPICS = [
  'Weekend homeowner guide: signs your residential driveway needs repair',
  'Residential driveway sealcoating timing in Virginia neighborhoods',
  'How families can prevent driveway cracks with simple maintenance habits',
  'Best residential paving upgrades for curb appeal and drainage',
];

function getEasternNow() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }));
}

function isWeekendET(d: Date) {
  const day = d.getDay();
  return day === 0 || day === 6;
}

function safeSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 140);
}

function estimateReadTime(content: string) {
  const words = String(content || '').split(/\s+/).filter(Boolean).length;
  return Math.max(4, Math.min(14, Math.round(words / 210)));
}

function parseRssItems(xml: string): NewsItem[] {
  const items: NewsItem[] = [];
  const blocks = xml.match(/<item>[\s\S]*?<\/item>/g) || [];

  for (const block of blocks) {
    const title = (block.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/)?.[1]
      || block.match(/<title>([\s\S]*?)<\/title>/)?.[1]
      || '')
      .replace(/\s+/g, ' ')
      .trim();

    const link = (block.match(/<link>([\s\S]*?)<\/link>/)?.[1] || '').trim();
    const pubDate = (block.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] || '').trim();

    if (!title || !link) continue;
    items.push({ title, link, pubDate });
  }

  return items;
}

async function fetchFeed(url: string): Promise<NewsItem[]> {
  try {
    const res = await fetch(url, {
      headers: {
        'user-agent': 'Mozilla/5.0 (compatible; JWordenBlogBot/1.0)'
      }
    });
    if (!res.ok) return [];
    const xml = await res.text();
    return parseRssItems(xml);
  } catch {
    return [];
  }
}

function dedupeNews(items: NewsItem[]) {
  const seen = new Set<string>();
  const out: NewsItem[] = [];
  for (const item of items) {
    const key = `${item.title.toLowerCase()}|${item.link.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
    if (out.length >= 12) break;
  }
  return out;
}

function extractJson(text: string) {
  const fenced = text.match(/```json\s*([\s\S]*?)\s*```/i)?.[1];
  if (fenced) return fenced;

  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  if (first >= 0 && last > first) return text.slice(first, last + 1);
  return text;
}

async function generatePost(base44: any, opts: { weekend: boolean; news: NewsItem[]; dateISO: string; }): Promise<DraftPost> {
  const mode = opts.weekend ? 'weekend-residential' : 'weekday-mixed';
  const topicPool = opts.weekend ? FALLBACK_WEEKEND_TOPICS : FALLBACK_WEEKDAY_TOPICS;
  const fallbackTopic = topicPool[Math.floor(Math.random() * topicPool.length)];

  const newsContext = opts.news.map((n, i) => `${i + 1}. ${n.title} | ${n.link}`).join('\n');

  const prompt = `You are the always-on SEO blog writer for J. Worden & Sons Asphalt Paving (Chester, VA).

Mode: ${mode}
Date: ${opts.dateISO}

Rules:
- Write a complete, high-quality blog post in markdown.
- If mode is weekend-residential, the topic MUST be residential-only (homeowners, driveways, neighborhoods, family property care).
- If mode is weekday-mixed, topic can be residential, commercial, materials, process, cost, or local-guides.
- Build topic from current web context if useful. If web context is weak, still write a valuable evergreen post.
- 1000-1800 words.
- Include practical checklists and clear sections.
- Mention J. Worden & Sons naturally and include one CTA at the end.
- Do not copy source text. Original writing only.

Web context (news hints):
${newsContext || '(No web context available today)'}

Fallback topic if needed:
${fallbackTopic}

Return STRICT JSON only:
{
  "title": "...",
  "slug": "...",
  "excerpt": "...",
  "content": "markdown...",
  "category": "maintenance|process|materials|local-guides|cost|commercial",
  "tags": ["...", "..."],
  "read_time_minutes": 0,
  "cover_image": "https://..."
}`;

  const raw = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt,
    model: 'gpt_5',
  });

  const parsed = JSON.parse(extractJson(String(raw || '{}')));

  const title = String(parsed.title || '').trim() || (opts.weekend ? 'Weekend Residential Driveway Guide' : 'Asphalt Paving Insight');
  const slugBase = safeSlug(String(parsed.slug || '') || title || fallbackTopic);
  const excerpt = String(parsed.excerpt || '').trim() || `Expert asphalt guidance from J. Worden & Sons for ${opts.weekend ? 'residential property owners' : 'property owners and managers'} in Virginia.`;
  const content = String(parsed.content || '').trim() || `# ${title}\n\n${excerpt}`;

  const allowedCategories = new Set(['maintenance', 'process', 'materials', 'local-guides', 'cost', 'commercial']);
  const category = allowedCategories.has(parsed.category) ? parsed.category : (opts.weekend ? 'maintenance' : 'process');

  const tagsRaw = Array.isArray(parsed.tags) ? parsed.tags : [];
  const tags = tagsRaw
    .map((t: unknown) => String(t || '').trim())
    .filter(Boolean)
    .slice(0, 10);

  const readTime = Number(parsed.read_time_minutes) || estimateReadTime(content);
  const cover = String(parsed.cover_image || '').trim() || DEFAULT_COVER;

  return {
    title,
    slug: slugBase,
    excerpt,
    content,
    category,
    tags,
    read_time_minutes: Math.max(4, Math.min(15, readTime)),
    cover_image: cover,
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Allow automation calls and admin manual runs.
    const caller = await base44.auth.me().catch(() => null);
    const isScheduled = req.headers.get('x-base44-automation') || !caller;
    if (!isScheduled && caller?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const nowEt = getEasternNow();
    const today = nowEt.toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
    const weekend = isWeekendET(nowEt);

    // Gather web signals to keep topics fresh.
    const feedResults = await Promise.all(NEWS_FEEDS.map(fetchFeed));
    const webSignals = dedupeNews(feedResults.flat());

    const existing = await base44.asServiceRole.entities.BlogPost.list('-created_date', 500);
    const existingSlugs = new Set((existing || []).map((p: any) => p.slug));

    const draft = await generatePost(base44, {
      weekend,
      news: webSignals,
      dateISO: today,
    });

    let finalSlug = draft.slug;
    if (existingSlugs.has(finalSlug)) {
      finalSlug = `${finalSlug}-${today}`;
    }

    const created = await base44.asServiceRole.entities.BlogPost.create({
      title: draft.title,
      slug: finalSlug,
      excerpt: draft.excerpt,
      content: draft.content,
      cover_image: draft.cover_image || DEFAULT_COVER,
      category: draft.category,
      tags: draft.tags,
      read_time_minutes: draft.read_time_minutes,
      author: 'J. Worden & Sons',
      featured: false,
      published_date: today,
    });

    return Response.json({
      status: 'published',
      mode: weekend ? 'weekend-residential' : 'weekday-mixed',
      title: created.title,
      slug: created.slug,
      id: created.id,
      web_signals_used: webSignals.length,
      date: today,
    });
  } catch (error) {
    return Response.json({ error: error.message || String(error) }, { status: 500 });
  }
});

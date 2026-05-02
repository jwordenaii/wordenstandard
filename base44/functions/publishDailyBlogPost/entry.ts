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

type AutomationTrack = 'commercial' | 'maintenance' | 'concrete' | 'residential';

type TrackPlan = {
  track: AutomationTrack;
  category: DraftPost['category'];
  mode: 'weekday-commercial' | 'weekday-maintenance' | 'weekday-concrete' | 'weekend-residential';
  audience: string;
  topicPool: string[];
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

const FALLBACK_COMMERCIAL_TOPICS = [
  'Commercial parking lot lifecycle planning for lower long-term cost',
  'How property managers can phase paving work without disrupting tenant traffic',
  'Parking lot asset planning: repair versus overlay decisions for Virginia businesses',
  'How to build annual commercial asphalt maintenance budgets with less risk',
];

const FALLBACK_MAINTENANCE_TOPICS = [
  'How weather data and AI improve asphalt maintenance planning',
  'Crack sealing schedules that reduce long-term repair costs in Virginia',
  'Preventive sealcoating strategy for longer asphalt life in residential and commercial properties',
  'How to audit asphalt condition before peak repair season',
];

const FALLBACK_CONCRETE_TOPICS = [
  'Concrete versus asphalt for high-load zones: practical guidance for Virginia properties',
  'When concrete aprons solve recurring edge damage near garage and loading areas',
  'Concrete curb and gutter upgrades that improve drainage before paving projects',
  'How mixed-surface projects combine concrete and asphalt for longer service life',
];

const FALLBACK_WEEKEND_TOPICS = [
  'Weekend homeowner guide: signs your residential driveway needs repair',
  'Residential driveway sealcoating timing in Virginia neighborhoods',
  'How families can prevent driveway cracks with simple maintenance habits',
  'Best residential paving upgrades for curb appeal and drainage',
];

const WEEKDAY_ROTATION: AutomationTrack[] = ['commercial', 'maintenance', 'concrete', 'commercial', 'maintenance'];

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

function uniqueSlug(base: string, existingSlugs: Set<string>, dateISO: string, slot: number) {
  const candidates = [
    base,
    `${base}-${dateISO}`,
    `${base}-${dateISO}-${slot}`,
  ];

  for (const candidate of candidates) {
    if (!existingSlugs.has(candidate)) {
      existingSlugs.add(candidate);
      return candidate;
    }
  }

  let counter = 2;
  while (counter < 100) {
    const candidate = `${base}-${dateISO}-${slot}-${counter}`;
    if (!existingSlugs.has(candidate)) {
      existingSlugs.add(candidate);
      return candidate;
    }
    counter += 1;
  }

  throw new Error('Unable to generate unique slug');
}

function parseBooleanEnv(value: string | undefined, defaultValue: boolean) {
  if (value == null) return defaultValue;
  const normalized = value.trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  return defaultValue;
}

function getTrackPlan(nowEt: Date): TrackPlan {
  if (isWeekendET(nowEt)) {
    return {
      track: 'residential',
      category: 'maintenance',
      mode: 'weekend-residential',
      audience: 'homeowners, families, and residential driveway property owners',
      topicPool: FALLBACK_WEEKEND_TOPICS,
    };
  }

  const day = nowEt.getDay();
  const track = WEEKDAY_ROTATION[Math.max(0, Math.min(4, day - 1))] || 'commercial';

  if (track === 'commercial') {
    return {
      track,
      category: 'commercial',
      mode: 'weekday-commercial',
      audience: 'property managers, business owners, and commercial lot decision-makers',
      topicPool: FALLBACK_COMMERCIAL_TOPICS,
    };
  }

  if (track === 'maintenance') {
    return {
      track,
      category: 'maintenance',
      mode: 'weekday-maintenance',
      audience: 'property owners and maintenance planners who need practical maintenance decisions',
      topicPool: FALLBACK_MAINTENANCE_TOPICS,
    };
  }

  return {
    track: 'concrete',
    category: 'materials',
    mode: 'weekday-concrete',
    audience: 'property owners evaluating concrete and mixed-surface paving solutions',
    topicPool: FALLBACK_CONCRETE_TOPICS,
  };
}

function getSecondaryTrack(primaryTrack: AutomationTrack): AutomationTrack {
  if (primaryTrack === 'commercial') return 'maintenance';
  if (primaryTrack === 'maintenance') return 'concrete';
  if (primaryTrack === 'concrete') return 'commercial';
  return 'residential';
}

function getTrackPlanByTrack(track: AutomationTrack): TrackPlan {
  if (track === 'residential') {
    return {
      track,
      category: 'maintenance',
      mode: 'weekend-residential',
      audience: 'homeowners, families, and residential driveway property owners',
      topicPool: FALLBACK_WEEKEND_TOPICS,
    };
  }
  if (track === 'commercial') {
    return {
      track,
      category: 'commercial',
      mode: 'weekday-commercial',
      audience: 'property managers, business owners, and commercial lot decision-makers',
      topicPool: FALLBACK_COMMERCIAL_TOPICS,
    };
  }
  if (track === 'maintenance') {
    return {
      track,
      category: 'maintenance',
      mode: 'weekday-maintenance',
      audience: 'property owners and maintenance planners who need practical maintenance decisions',
      topicPool: FALLBACK_MAINTENANCE_TOPICS,
    };
  }
  return {
    track: 'concrete',
    category: 'materials',
    mode: 'weekday-concrete',
    audience: 'property owners evaluating concrete and mixed-surface paving solutions',
    topicPool: FALLBACK_CONCRETE_TOPICS,
  };
}

function getPostsPerDay(nowEt: Date) {
  const manual = Number(Deno.env.get('BLOG_AUTOMATION_POSTS_PER_DAY') || '');
  if (Number.isFinite(manual) && manual >= 1) {
    return Math.min(3, Math.floor(manual));
  }

  if (isWeekendET(nowEt)) {
    return 1;
  }

  const secondWeekday = parseBooleanEnv(Deno.env.get('BLOG_AUTOMATION_SECOND_POST_WEEKDAY'), true);
  return secondWeekday ? 2 : 1;
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

async function generatePost(base44: any, opts: { plan: TrackPlan; news: NewsItem[]; dateISO: string; slot: number; }): Promise<DraftPost> {
  const mode = opts.plan.mode;
  const topicPool = opts.plan.topicPool.length > 0 ? opts.plan.topicPool : FALLBACK_WEEKDAY_TOPICS;
  const fallbackTopic = topicPool[Math.floor(Math.random() * topicPool.length)];

  const newsContext = opts.news.map((n, i) => `${i + 1}. ${n.title} | ${n.link}`).join('\n');

  const prompt = `You are the always-on SEO blog writer for J. Worden & Sons Asphalt Paving (Chester, VA).

Mode: ${mode}
Date: ${opts.dateISO}

Rules:
- Write a complete, high-quality blog post in markdown.
- Track focus is ${opts.plan.track} and audience is: ${opts.plan.audience}
- If mode is weekend-residential, the topic MUST be residential-only (homeowners, driveways, neighborhoods, family property care).
- If mode is weekday-commercial, the topic MUST be commercial asphalt and parking lot strategy.
- If mode is weekday-maintenance, the topic MUST be maintenance-first guidance.
- If mode is weekday-concrete, the topic MUST be concrete or mixed asphalt/concrete decision guidance.
- Build topic from current web context if useful. If web context is weak, still write a valuable evergreen post.
- 1000-1800 words.
- Include practical checklists and clear sections.
- Mention J. Worden & Sons naturally and include one CTA at the end.
- Ensure this post is materially different in angle from any other post published today.
- Do not copy source text. Original writing only.

Web context (news hints):
${newsContext || '(No web context available today)'}

Fallback topic if needed:
${fallbackTopic}

Publishing slot today: ${opts.slot}

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

  const title = String(parsed.title || '').trim() || (opts.plan.track === 'residential' ? 'Weekend Residential Driveway Guide' : 'Asphalt Paving Insight');
  const slugBase = safeSlug(String(parsed.slug || '') || title || fallbackTopic);
  const excerpt = String(parsed.excerpt || '').trim() || `Expert asphalt guidance from J. Worden & Sons for ${opts.plan.audience} in Virginia.`;
  const content = String(parsed.content || '').trim() || `# ${title}\n\n${excerpt}`;

  const allowedCategories = new Set(['maintenance', 'process', 'materials', 'local-guides', 'cost', 'commercial']);
  const category = allowedCategories.has(parsed.category) ? parsed.category : opts.plan.category;

  const tagsRaw = Array.isArray(parsed.tags) ? parsed.tags : [];
  const tags = tagsRaw
    .map((t: unknown) => String(t || '').trim())
    .filter(Boolean)
    .slice(0, 10);

  if (!tags.some((tag) => tag.toLowerCase() === opts.plan.track)) {
    tags.unshift(opts.plan.track);
  }
  if (opts.plan.track === 'concrete' && !tags.some((tag) => tag.toLowerCase().includes('concrete'))) {
    tags.unshift('concrete paving');
  }

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
    const primaryPlan = getTrackPlan(nowEt);
    const postCount = getPostsPerDay(nowEt);

    // Gather web signals to keep topics fresh.
    const feedResults = await Promise.all(NEWS_FEEDS.map(fetchFeed));
    const webSignals = dedupeNews(feedResults.flat());

    const existing = await base44.asServiceRole.entities.BlogPost.list('-created_date', 500);
    const existingSlugs = new Set((existing || []).map((p: any) => p.slug));

    const alreadyToday = (existing || []).filter((post: any) => post.published_date === today);
    if (alreadyToday.length >= postCount) {
      return Response.json({
        status: 'already_published_for_today',
        date: today,
        target_posts: postCount,
        existing_today: alreadyToday.length,
        mode: primaryPlan.mode,
      });
    }

    const planForSlot = (slot: number): TrackPlan => {
      if (slot === 1 || weekend) return primaryPlan;
      return getTrackPlanByTrack(getSecondaryTrack(primaryPlan.track));
    };

    const createdPosts: Array<{ id: string; slug: string; title: string; mode: string; track: string; category: string; slot: number }> = [];

    for (let slot = alreadyToday.length + 1; slot <= postCount; slot += 1) {
      const plan = planForSlot(slot);
      const draft = await generatePost(base44, {
        plan,
        news: webSignals,
        dateISO: today,
        slot,
      });

      const finalSlug = uniqueSlug(draft.slug, existingSlugs, today, slot);
      const baseTags = Array.isArray(draft.tags) ? draft.tags : [];
      const uniqueTags = Array.from(new Set([...baseTags, 'ai-generated', `track-${plan.track}`, `slot-${slot}`]));

      // Feature the first post of the week (Monday Morning)
      const isMonday = nowEt.getDay() === 1;
      const featured = isMonday && slot === 1;

      const created = await base44.asServiceRole.entities.BlogPost.create({
        title: draft.title,
        slug: finalSlug,
        excerpt: draft.excerpt,
        content: draft.content,
        cover_image: draft.cover_image || DEFAULT_COVER,
        category: draft.category,
        tags: uniqueTags.slice(0, 12),
        read_time_minutes: draft.read_time_minutes,
        author: 'J. Worden & Sons',
        featured,
        published_date: today,
      });

      createdPosts.push({
        id: String(created.id),
        slug: String(created.slug),
        title: String(created.title),
        mode: plan.mode,
        track: plan.track,
        category: draft.category,
        slot,
      });
    }

    return Response.json({
      status: 'published',
      date: today,
      weekend,
      target_posts: postCount,
      mode: primaryPlan.mode,
      primary_track: primaryPlan.track,
      web_signals_used: webSignals.length,
      published_count: createdPosts.length,
      published: createdPosts,
    });
  } catch (error) {
    return Response.json({ error: error.message || String(error) }, { status: 500 });
  }
});

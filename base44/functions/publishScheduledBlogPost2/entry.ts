import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

function buildForwardUrl(reqUrl: string) {
  const url = new URL(reqUrl);
  const parts = url.pathname.split('/').filter(Boolean);
  if (parts.length > 0) {
    parts[parts.length - 1] = 'publishDailyBlogPost';
    url.pathname = `/${parts.join('/')}`;
  }
  return url.toString();
}

Deno.serve(async (req) => {
  try {
    // Keep auth behavior aligned with other automation functions.
    const base44 = createClientFromRequest(req);
    const caller = await base44.auth.me().catch(() => null);
    const isScheduled = req.headers.get('x-base44-automation') || !caller;
    if (!isScheduled && caller?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const forwardUrl = buildForwardUrl(req.url);
    const body = await req.text().catch(() => '');

    const forwardRes = await fetch(forwardUrl, {
      method: req.method || 'POST',
      headers: {
        'content-type': req.headers.get('content-type') || 'application/json',
        'x-base44-automation': req.headers.get('x-base44-automation') || '1',
      },
      body: body || '{}',
    });

    const payload = await forwardRes.text();
    return new Response(payload, {
      status: forwardRes.status,
      headers: {
        'content-type': forwardRes.headers.get('content-type') || 'application/json',
      },
    });
  } catch (error) {
    return Response.json({ error: error.message || String(error) }, { status: 500 });
  }
});

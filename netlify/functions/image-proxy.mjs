// Netlify Function v2 — same-origin image proxy.
//
// The poster composer draws the AI background onto a canvas and exports a PNG.
// The Higgsfield images are served from a different origin (CloudFront), which
// would taint the canvas and block export. Fetching them through this same-origin
// proxy (with CORS headers) keeps the canvas clean.
//
// Hardened against open-proxy/SSRF: only https and a small host allowlist.

const ALLOWED_HOST = [
  /\.cloudfront\.net$/i,
  /(^|\.)higgsfield\.ai$/i,
];

export default async (req) => {
  const raw = new URL(req.url).searchParams.get('url');
  if (!raw) return new Response('missing url', { status: 400 });

  let target;
  try {
    target = new URL(raw);
  } catch {
    return new Response('bad url', { status: 400 });
  }
  if (target.protocol !== 'https:' || !ALLOWED_HOST.some((re) => re.test(target.hostname))) {
    return new Response('forbidden host', { status: 403 });
  }

  let upstream;
  try {
    upstream = await fetch(target.href);
  } catch {
    return new Response('fetch failed', { status: 502 });
  }
  if (!upstream.ok) return new Response('upstream error', { status: 502 });

  const contentType = upstream.headers.get('content-type') || 'image/png';
  if (!contentType.startsWith('image/')) return new Response('not an image', { status: 415 });

  const buf = Buffer.from(await upstream.arrayBuffer());
  return new Response(buf, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};

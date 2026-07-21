// Netlify Function v2 — POLL a creative-generation job.
//
// Reads the job record the background worker writes to the store and maps it to
// the shape the client expects:
//   pending    → { status: 'in_progress' }
//   completed  → { status: 'completed', imageUrls: [...] }
//   failed     → { status: 'failed', error }
//
// The imageUrls are data-URLs (base64 jpeg) from OpenAI, so the poster composer
// loads them directly — no CORS proxy needed.

import { getJob } from './lib/jobstore.mjs';

export default async (req) => {
  let jobId;
  if (req.method === 'POST') {
    try {
      jobId = (await req.json())?.jobId;
    } catch {
      // handled below
    }
  } else {
    jobId = new URL(req.url).searchParams.get('jobId');
  }

  if (typeof jobId !== 'string' || !jobId.startsWith('job.')) {
    return Response.json({ status: 'failed', error: 'invalid jobId' }, { status: 400 });
  }

  let rec;
  try {
    rec = await getJob(jobId);
  } catch {
    // A transient store hiccup shouldn't fail the whole generation — tell the
    // client to keep polling within its own deadline.
    return Response.json({ status: 'in_progress' });
  }

  if (!rec) {
    // Not found yet (or expired). Treat as still running; the client's poll has
    // its own hard deadline.
    return Response.json({ status: 'in_progress' });
  }

  if (rec.status === 'completed' && Array.isArray(rec.imageUrls) && rec.imageUrls.length > 0) {
    return Response.json({ status: 'completed', imageUrls: rec.imageUrls });
  }
  if (rec.status === 'failed') {
    return Response.json({ status: 'failed', error: rec.error || 'De creatie is mislukt.' });
  }
  return Response.json({ status: 'in_progress' });
};

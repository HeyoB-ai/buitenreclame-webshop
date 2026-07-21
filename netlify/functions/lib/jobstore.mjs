// Tiny job store on Netlify Blobs — shared by the three creative functions.
//
// Because OpenAI image generation is slow (~50s) it runs in a background
// function that can't return a value to the browser. The background worker
// writes results here; the fast `creative-status` function reads them. Strong
// consistency so a poll sees the worker's latest write without lag.
//
// Record shape: { status: 'pending'|'completed'|'failed', n, imageUrls?, error?, ts }

import { getStore } from '@netlify/blobs';

const STORE = 'creatives';
// Auto-expire so old base64 images don't accumulate. The whole flow finishes in
// a couple of minutes; an hour is plenty of slack for a slow poll.
const TTL_MS = 60 * 60 * 1000;

function store() {
  return getStore({ name: STORE, consistency: 'strong' });
}

export async function putJob(jobId, record) {
  await store().setJSON(jobId, { ...record, ts: Date.now() });
}

export async function getJob(jobId) {
  const rec = await store().get(jobId, { type: 'json' });
  if (!rec) return null;
  if (rec.ts && Date.now() - rec.ts > TTL_MS) return null; // treat as gone
  return rec;
}

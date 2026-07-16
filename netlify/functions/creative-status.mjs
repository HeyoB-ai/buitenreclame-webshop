// Netlify Function v2 — poll a creative-generation job (3 variants).
//
// "mock." jobs (default): decode the stateless jobId; within ~3.5s report
// "in_progress", then "completed" with THREE slightly different textless SVG
// background variants (data:image/svg+xml). No text is rendered — the concept is
// a background; our own headline is overlaid later (step B).
//
// "live." jobs: poll the 3 real Higgsfield jobs and return their image URLs.
//
// Both return { status, imageUrls: [...] } — the same shape, so the client is
// mode-agnostic.

import { getLiveStatusMulti } from './lib/higgsfield.mjs';

// Three calm, textless portrait background palettes for mock mode.
const PALETTES = [
  { a: '#1D46C4', b: '#2456E6', c: '#0A0F1E', blob: 'rgba(255,255,255,0.18)' }, // cobalt night
  { a: '#DE8A06', b: '#B4470A', c: '#2A0F04', blob: 'rgba(255,220,150,0.20)' }, // warm amber
  { a: '#0E9F6E', b: '#0B6E63', c: '#04231F', blob: 'rgba(200,255,235,0.16)' }, // teal green
];

function buildBackgroundSVG(variant) {
  const W = 720;
  const H = 1280; // 9:16 portrait
  const p = PALETTES[variant % PALETTES.length];
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">` +
    `<defs>` +
    `<linearGradient id="g" x1="0" y1="0" x2="0.7" y2="1">` +
    `<stop offset="0" stop-color="${p.a}"/><stop offset="0.55" stop-color="${p.b}"/><stop offset="1" stop-color="${p.c}"/>` +
    `</linearGradient>` +
    `<radialGradient id="b" cx="0.32" cy="0.28" r="0.62">` +
    `<stop offset="0" stop-color="${p.blob}"/><stop offset="1" stop-color="rgba(0,0,0,0)"/>` +
    `</radialGradient>` +
    `<radialGradient id="v" cx="0.5" cy="0.5" r="0.75">` +
    `<stop offset="0.55" stop-color="rgba(0,0,0,0)"/><stop offset="1" stop-color="rgba(0,0,0,0.45)"/>` +
    `</radialGradient>` +
    `</defs>` +
    `<rect width="${W}" height="${H}" fill="url(#g)"/>` +
    `<rect width="${W}" height="${H}" fill="url(#b)"/>` +
    `<circle cx="${150 + variant * 70}" cy="${360 + variant * 140}" r="${240 - variant * 24}" fill="url(#b)" opacity="0.55"/>` +
    `<rect width="${W}" height="${H}" fill="url(#v)"/>` +
    `</svg>`
  );
}

function mockImageUrl(variant) {
  return 'data:image/svg+xml;base64,' + Buffer.from(buildBackgroundSVG(variant), 'utf8').toString('base64');
}

export default async (req) => {
  let jobId;
  if (req.method === 'POST') {
    try {
      const body = await req.json();
      jobId = body?.jobId;
    } catch {
      // fall through to error below
    }
  } else {
    jobId = new URL(req.url).searchParams.get('jobId');
  }

  if (typeof jobId !== 'string') {
    return Response.json({ status: 'failed', error: 'invalid jobId' }, { status: 400 });
  }

  // LIVE job → poll the real Higgsfield jobs (3 request_ids).
  if (jobId.startsWith('live.')) {
    let liveMeta;
    try {
      liveMeta = JSON.parse(Buffer.from(jobId.slice(5), 'base64url').toString('utf8'));
    } catch {
      return Response.json({ status: 'failed', error: 'malformed jobId' }, { status: 400 });
    }
    try {
      const result = await getLiveStatusMulti(liveMeta.ids || []);
      return Response.json(result);
    } catch {
      return Response.json({ status: 'failed', error: 'Kon de status niet ophalen.' }, { status: 502 });
    }
  }

  if (!jobId.startsWith('mock.')) {
    return Response.json({ status: 'failed', error: 'invalid jobId' }, { status: 400 });
  }

  let meta;
  try {
    meta = JSON.parse(Buffer.from(jobId.slice(5), 'base64url').toString('utf8'));
  } catch {
    return Response.json({ status: 'failed', error: 'malformed jobId' }, { status: 400 });
  }

  const elapsed = Date.now() - Number(meta.t || 0);
  if (elapsed < 3500) {
    return Response.json({ status: 'in_progress' });
  }

  const n = Math.max(1, Math.min(3, Number(meta.n) || 3));
  const imageUrls = Array.from({ length: n }, (_, i) => mockImageUrl(i));

  return Response.json({ status: 'completed', imageUrls });
};

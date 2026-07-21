// Netlify Function v2 — START a creative-generation job (safe model: OpenAI
// gpt-image-2). Fast + synchronous: it writes a "pending" job record, fires the
// slow background worker, and returns a jobId. The browser then polls
// creative-status until the worker has written the images.
//
// Soul/Higgsfield is GONE — there is no fallback to it. Missing OPENAI_API_KEY
// yields a friendly error, never a crash and never Soul.

import { hasOpenAiKey, variantCount } from './lib/openai.mjs';
import { putJob } from './lib/jobstore.mjs';

// Master switch for the AI-design feature. True now that a SAFE model is in
// place. Flip to false to hard-disable generation (mirrors the UI flag).
const AI_DESIGN_ENABLED = true;

const BACKGROUND_PATH = '/.netlify/functions/generate-creative-background';

export default async (req) => {
  // Safe diagnostics (GET or ?debug=1) — booleans + non-secret values only.
  const wantsDebug = req.method === 'GET' || new URL(req.url).searchParams.get('debug') === '1';
  if (wantsDebug) {
    return Response.json({
      provider: 'openai',
      model: process.env.OPENAI_IMAGE_MODEL || 'gpt-image-2',
      ai_design_enabled: AI_DESIGN_ENABLED,
      OPENAI_API_KEY_present: hasOpenAiKey(),
      OPENAI_IMAGE_SIZE: process.env.OPENAI_IMAGE_SIZE || null,
      OPENAI_IMAGE_QUALITY: process.env.OPENAI_IMAGE_QUALITY || null,
      AI_VARIANTS: process.env.AI_VARIANTS || null,
      variants: variantCount(),
    });
  }

  if (req.method !== 'POST') {
    return Response.json({ error: 'Method Not Allowed' }, { status: 405 });
  }

  if (!AI_DESIGN_ENABLED) {
    return Response.json(
      { status: 'failed', error: 'AI-ontwerp is tijdelijk niet beschikbaar — we werken aan een verbeterde versie.' },
      { status: 503 },
    );
  }

  if (!hasOpenAiKey()) {
    // No key → honest error, no crash, no Soul.
    return Response.json(
      { status: 'failed', error: 'AI-ontwerp is niet geconfigureerd (OPENAI_API_KEY ontbreekt). Neem contact op met de beheerder.' },
      { status: 503 },
    );
  }

  let body = {};
  try {
    body = await req.json();
  } catch {
    // treated as empty below
  }

  const prompt = String(body.prompt ?? '').slice(0, 400);
  if (!prompt.trim()) {
    return Response.json({ error: 'prompt is required' }, { status: 400 });
  }

  const variants = variantCount();
  const jobId = 'job.' + (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.round(Math.random() * 1e9)}`);

  // Record the job as pending so the very first status poll finds it.
  try {
    await putJob(jobId, { status: 'pending', n: variants });
  } catch (err) {
    return Response.json({ status: 'failed', error: 'Kon de opdracht niet aanmaken. Probeer het opnieuw.' }, { status: 502 });
  }

  // Fire the background worker (returns 202 immediately). We await only that
  // handshake — the actual generation runs on after we respond.
  const bgUrl = new URL(BACKGROUND_PATH, req.url).href;
  try {
    const kick = await fetch(bgUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId, prompt, variants }),
      signal: AbortSignal.timeout(8000),
    });
    // Netlify returns 202 for a *-background function. Anything else = misconfig.
    if (kick.status !== 202 && kick.status !== 200) {
      await putJob(jobId, { status: 'failed', n: variants, error: 'De ontwerp-server kon de opdracht niet starten.' });
      return Response.json({ status: 'failed', error: 'De ontwerp-server kon de opdracht niet starten.' }, { status: 502 });
    }
  } catch (err) {
    await putJob(jobId, { status: 'failed', n: variants, error: 'De ontwerp-server kon de opdracht niet starten.' });
    return Response.json({ status: 'failed', error: 'De ontwerp-server kon de opdracht niet starten.' }, { status: 502 });
  }

  return Response.json({ jobId, status: 'queued', variants });
};

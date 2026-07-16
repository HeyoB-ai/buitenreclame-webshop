// Shared Higgsfield helper for the creative functions.
//
// In a subdirectory → Netlify bundles it into the importing functions; it is not
// a standalone function.
//
// The real Higgsfield generation lives here, behind the HF_MODE switch. In mock
// mode nothing here runs, so the app is safe to run without keys.
//
// OFFICIAL API (docs.higgsfield.ai/docs/how-to/introduction):
//   Submit: POST https://platform.higgsfield.ai/{model_id}
//           header  Authorization: Key KEY:SECRET
//           body    { prompt, aspect_ratio, resolution }   (flat, NOT wrapped)
//           → { status:"queued", request_id, status_url }
//   Status: GET  https://platform.higgsfield.ai/requests/{request_id}/status
//           → { status, images:[{url}] }   (queued|in_progress|completed|failed|nsfw)
// Verified live: 200 + a real image URL on higgsfield-ai/soul/standard.
//
// MODEL: configurable via HF_IMAGE_MODEL — the ONLY knob needed to switch model.
// All text-to-image models use the identical call above (flat body, same poll),
// confirmed against the official Python SDK (higgsfield-client): it POSTs to
// `{BASE}/{model_id}` with `json=arguments` (flat, no params wrapper) and polls
// `/requests/{id}/status` — byte-for-byte what we do. So switching model = set
// HF_IMAGE_MODEL, no code change.
//
// Confirmed REST model_ids (see README for notes):
//   higgsfield-ai/soul/standard          Soul — portrait / studio still-life, text-prone. DEFAULT (verified 200).
//   bytedance/seedream/v4/text-to-image  Seedream 4 — allround, better at scenes. (404 "Model not found" on our
//                                         key: not provisioned for this account; enable it on the Higgsfield plan.)
//   reve/text-to-image                   Reve — allround. (423 "model_blocked" on our key: exists but not enabled.)
// Nano Banana Pro: no public REST model_id (~25 slugs → 404); not exposed yet.
//
// Credentials from HF_API_KEY / HF_API_SECRET (Netlify env vars) — never committed.

const DEFAULT_MODEL = 'higgsfield-ai/soul/standard';
const DEFAULT_RESOLUTION = '1080p';
const DEFAULT_ASPECT = '3:4';
const DEFAULT_BASE_URL = 'https://platform.higgsfield.ai';

/** Current mode: "mock" (default) or "live". Trimmed + lowercased so a stray
 *  space/newline in the env var (common when pasting into a dashboard) can't
 *  silently keep us on mock. */
export function hfMode() {
  return (process.env.HF_MODE || 'mock').trim().toLowerCase();
}

/** Both halves of the Higgsfield key pair present (ignoring surrounding whitespace)? */
export function hasKeys() {
  return Boolean((process.env.HF_API_KEY || '').trim() && (process.env.HF_API_SECRET || '').trim());
}

/** Live generation only runs when explicitly switched on AND keys are present. */
export function isLive() {
  return hfMode() === 'live' && hasKeys();
}

// Opt-in diagnostics (server-side terminal only, never keys). Off by default.
function debug(...args) {
  const v = (process.env.HF_DEBUG || '').toLowerCase();
  if (v === '1' || v === 'true') console.error('[higgsfield]', ...args);
}

function baseUrl() {
  return process.env.HF_BASE_URL || DEFAULT_BASE_URL;
}

function authHeaders(withJson = false) {
  const key = (process.env.HF_API_KEY || '').trim();
  const secret = (process.env.HF_API_SECRET || '').trim();
  const h = { Authorization: `Key ${key}:${secret}` };
  if (withJson) h['Content-Type'] = 'application/json';
  h.Accept = 'application/json';
  return h;
}

// Map an HTTP failure to a short, safe message — never a stacktrace or a key.
function httpFriendly(status) {
  if (status === 401) return 'Higgsfield-authenticatie mislukt. Controleer de sleutels.';
  if (status === 403) return 'Onvoldoende Higgsfield-credits om te genereren.';
  if (status === 404) return 'Het gekozen AI-model is niet beschikbaar.';
  if (status === 400 || status === 422) return 'De aanvraag werd geweigerd (ongeldige invoer).';
  return 'Kon de AI-generatie niet uitvoeren. Probeer het later opnieuw.';
}

/**
 * Start a real text-to-image generation (non-blocking).
 * Returns { requestId, status }. Throws a friendly Error on failure.
 */
export async function startLiveGeneration(prompt, aspectRatio, negativePrompt) {
  const model = process.env.HF_IMAGE_MODEL || DEFAULT_MODEL;
  const body = {
    prompt,
    aspect_ratio: aspectRatio || DEFAULT_ASPECT,
    resolution: process.env.HF_IMAGE_RESOLUTION || DEFAULT_RESOLUTION,
  };
  if (negativePrompt) body.negative_prompt = negativePrompt; // Soul accepts this (verified live)

  let res;
  try {
    res = await fetch(`${baseUrl()}/${model}`, {
      method: 'POST',
      headers: authHeaders(true),
      body: JSON.stringify(body),
    });
  } catch (err) {
    debug('start network error:', err?.message);
    throw new Error('Kon de AI-ontwerpserver niet bereiken.');
  }

  const text = await res.text();
  if (!res.ok) {
    debug(`start failed: HTTP ${res.status} ${res.statusText} — body: ${text.slice(0, 800)}`);
    throw new Error(httpFriendly(res.status));
  }

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    debug('start: non-JSON body:', text.slice(0, 300));
    throw new Error('Onverwacht antwoord van de ontwerpserver.');
  }
  if (!data.request_id) {
    debug('start: no request_id in body:', text.slice(0, 300));
    throw new Error('Geen job-id ontvangen van de server.');
  }
  return { requestId: data.request_id, status: data.status || 'queued' };
}

/**
 * Start `count` generations in parallel (Promise.allSettled so one failure
 * doesn't sink the rest). Returns the array of started request_ids.
 * Throws only if none could be started.
 */
export async function startLiveGenerationBatch(prompt, aspectRatio, count = 3) {
  const results = await Promise.allSettled(
    Array.from({ length: count }, () => startLiveGeneration(prompt, aspectRatio)),
  );
  const ids = results.filter((r) => r.status === 'fulfilled').map((r) => r.value.requestId);
  if (ids.length === 0) {
    const rejected = results.find((r) => r.status === 'rejected');
    throw new Error(rejected?.reason instanceof Error ? rejected.reason.message : 'Kon de AI-generatie niet starten.');
  }
  return ids;
}

/**
 * Poll several live jobs and aggregate into { status, imageUrls?, error? }.
 * - in_progress while any job is still running
 * - completed once all are terminal and at least one produced an image
 * - failed only if every job failed
 */
export async function getLiveStatusMulti(ids) {
  const results = await Promise.all((ids || []).map((id) => getLiveStatus(id)));
  if (results.some((r) => r.status === 'in_progress')) return { status: 'in_progress' };
  const imageUrls = results.filter((r) => r.status === 'completed' && r.imageUrl).map((r) => r.imageUrl);
  if (imageUrls.length > 0) return { status: 'completed', imageUrls };
  return { status: 'failed', error: results.find((r) => r.error)?.error || 'De generatie is mislukt.' };
}

/**
 * Poll a single live job's status and return { status, imageUrl? , error? }.
 */
export async function getLiveStatus(requestId) {
  const url = `${baseUrl()}/requests/${requestId}/status`;

  let res;
  try {
    res = await fetch(url, { headers: authHeaders() });
  } catch {
    return { status: 'in_progress' }; // network hiccup → keep polling
  }

  if (!res.ok) {
    if (res.status >= 500) return { status: 'in_progress' };
    const t = await res.text().catch(() => '');
    debug(`status failed: HTTP ${res.status} — body: ${t.slice(0, 400)}`);
    return { status: 'failed', error: 'Kon de status van de generatie niet ophalen.' };
  }

  let data;
  try {
    data = await res.json();
  } catch {
    return { status: 'in_progress' };
  }

  switch (data.status) {
    case 'completed': {
      const imageUrl = data.images?.[0]?.url;
      if (!imageUrl) return { status: 'failed', error: 'Geen afbeelding ontvangen van de server.' };
      return { status: 'completed', imageUrl };
    }
    case 'failed':
      return { status: 'failed', error: 'De generatie is mislukt.' };
    case 'nsfw':
      return { status: 'failed', error: 'De afbeelding is geweigerd (ongepaste inhoud).' };
    default:
      return { status: 'in_progress' };
  }
}

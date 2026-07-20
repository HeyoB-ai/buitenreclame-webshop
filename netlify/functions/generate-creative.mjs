// Netlify Function v2 — start a creative-generation job (textless variants).
//
// Default is MOCK mode: no external call, no API keys, no storage. The job is
// encoded in the stateless jobId; status polling returns the textless SVG
// background variants after a short delay.
//
// When HF_MODE=live AND both keys are present, the LIVE path starts one real
// Higgsfield job per variant (in parallel), each a TEXTLESS advertising
// background shot to the user's own description, and returns a "live." jobId
// carrying the request_ids. Variant count: see DEFAULT_VARIANTS / HF_VARIANTS.
// See netlify/functions/README.md.

// Netlify v2 reads the default export (and `config`); the named exports below
// are ignored at runtime and exist so the prompt can be exercised against the
// real API without copying it — a copy is how a prompt drifts from what shipped.

import { isLive, startLiveGeneration } from './lib/higgsfield.mjs';

/**
 * How many backgrounds one click generates.
 *
 * Each variant is its own Higgsfield job and the account allows only 4 in
 * flight (verified live: `400 "Maximum number of concurrent requests (4) has
 * been reached"`). At 3 the queue filled up and a run could crawl past 120s; at
 * 2 there is still a choice and it is markedly quicker, with headroom left for a
 * second person generating at the same time.
 *
 * Raise via HF_VARIANTS when the plan's concurrency is scaled up.
 */
const DEFAULT_VARIANTS = 2;
const MAX_VARIANTS = 4; // the account's concurrency cap — above this we'd only queue

export function variantCount() {
  const raw = Number.parseInt((process.env.HF_VARIANTS || '').trim(), 10);
  if (!Number.isInteger(raw) || raw < 1) return DEFAULT_VARIANTS;
  return Math.min(raw, MAX_VARIANTS);
}
// ESH prints one format: A0 (841x1189 mm), portrait, for both the A0-display and
// the Driehoeksbord. A0 is 1:1.414 and 3:4 (1:1.333) is the nearest ratio the
// model supports — nearer than 2:3 (1:1.5). The other ratios stay allowed so an
// older client can't 400 on us.
//
// Verified live: the API rejects anything outside '9:16', '16:9', '4:3', '3:4',
// '1:1', '2:3', '3:2' with a 422 (a raw ratio like '841:1189' is NOT accepted),
// so this portrait-only subset is deliberately narrower than what Soul allows.
const ALLOWED_RATIOS = new Set(['9:16', '2:3', '3:4']);
const DEFAULT_RATIO = '3:4';

// Per-variant hints so the results genuinely differ. LIGHT ONLY — deliberately
// nothing about angle, distance or how much surroundings are in frame. A hint
// like "a wider angle showing more of the surroundings" silently overrules a
// user who asked for a close-up, which is exactly the bug this file had.
const VARIATION_HINTS = [
  'Warm golden-hour light.',
  'Soft, natural diffused daylight.',
  'Cosy late-afternoon light.',
  'Clear, bright daylight.',
];

// Concepts to actively keep OUT of the image. Two jobs: (1) suppress Soul's
// text-proneness (fake letters/signage), and (2) steer away from the plasticky,
// over-polished "generic AI" look toward real photography.
//
// NOTE: nothing here touches composition — no "people", no "empty background",
// in either direction. Only the user's description decides what is in frame.
export const NEGATIVE_PROMPT =
  // — no text / signage of any kind (the strongest lever against fake letters) —
  'text, letters, words, numbers, typography, captions, writing, characters, fonts, handwriting, ' +
  'signage, sign, signboard, billboard, chalkboard, blackboard, menu board, menu, poster, banner, ' +
  'label, printed label, jar label, product label, price tag, sticker, packaging text, logo, ' +
  'watermark, brand name, shop name, subtitles, ' +
  // — not a generic AI render; believable commercial photography only —
  'digital art, illustration, 3d render, cgi, render, painting, drawing, cartoon, anime, ' +
  'overly polished, plastic, waxy, glossy fake surfaces, oversaturated, harsh HDR, oversharpened, ' +
  'over-processed, low-resolution, blurry subject, distorted, deformed, ugly, ' +
  // — keeps Soul's safety filter off ordinary lifestyle briefs. This belongs
  //   here and not in the prompt: a positive "any people are fully dressed"
  //   injects "people" into close-ups that never asked for any.
  'nude, nudity, underwear, lingerie, suggestive posing';

/**
 * The user's description is the brief: it decides the subject AND the framing.
 * This wrapper adds craft only — light, lens, realism — plus the two things we
 * always need: no text in the image, and a little calm space for the headline we
 * overlay in step B.
 *
 * WHY IT IS THIS SHORT. Soul is a diffusion model, not an instruction-follower:
 * it responds to descriptive tokens, it does not obey meta-instructions. Telling
 * it "follow this description exactly — if it describes people, a place or an
 * occasion, show them" does not make it obey; those words land in the image as
 * CONTENT. Verified live on "bbq worsten in een gezellige tuin met lachende
 * mensen": with that block the model produced a garden party of well-dressed
 * people and no sausages at all (and, on a rerun, a studio meat platter with no
 * garden and no people); without it, the same brief produced the sausages AND
 * the garden AND the laughing people. Every word here is therefore a token we
 * actually want in the picture.
 *
 * Nothing here dictates composition — no "lifestyle scene", no "with people", no
 * "studio still-life", no "isolated product". That has been got wrong twice in
 * both directions: forcing a scene turned "close up van een broodje gezond" into
 * a crowd; forcing a still-life produced bare products nobody asked for. When the
 * description is silent about composition, the model chooses — that is intended.
 *
 * The safety guard lives in NEGATIVE_PROMPT, not here: a positive "any people are
 * fully dressed" would inject "people" into a close-up that never asked for any.
 */
export function buildBackgroundPrompt(userPrompt, variant) {
  const subject = String(userPrompt || '').trim();
  const light = VARIATION_HINTS[variant % VARIATION_HINTS.length];
  return (
    // 1) The description first and unqualified — the brief, not an ingredient in
    //    one of ours. No adjectives of ours in front of it.
    `${subject}. ` +
    // 2) Craft only: how it is photographed, never what is in it.
    `Professional advertising photograph, natural warm light, shallow depth of field, photorealistic, ` +
    `true-to-life colours, natural texture, editorial commercial quality. ${light} ` +
    // 3) The headline hint, as a photographic property rather than an order, so
    //    it neither empties nor fills a frame the description already settled.
    `Slightly calmer negative space near the top or the bottom for a headline. ` +
    // 4) The one hard constraint: Soul cannot render real letters, and our sharp
    //    headline is overlaid later.
    `A completely wordless photograph — no text, letters, numbers, writing, signage, labels, price tags, logos or ` +
    `watermark anywhere.`
  );
}

// TEMPORARY SAFETY KILL SWITCH — the current image model (Soul) produced
// inappropriate output and must not run. While false, any generation request is
// refused with a friendly message and no model is ever called. Flip back to true
// only once a safe image model is in place. Mirrors AI_DESIGN_ENABLED in the UI.
const AI_DESIGN_ENABLED = false;

export default async (req) => {
  // Safe diagnostics (GET or ?debug=1). Returns ONLY booleans + non-secret
  // values so you can see what the function really sees — never the keys.
  const wantsDebug = req.method === 'GET' || new URL(req.url).searchParams.get('debug') === '1';
  if (wantsDebug) {
    return Response.json({
      mode: isLive() ? 'live' : 'mock',
      HF_MODE_present: process.env.HF_MODE !== undefined,
      HF_API_KEY_present: Boolean((process.env.HF_API_KEY || '').trim()),
      HF_API_SECRET_present: Boolean((process.env.HF_API_SECRET || '').trim()),
      HF_MODE_value_normalized: (process.env.HF_MODE || '').trim().toLowerCase(),
      HF_IMAGE_MODEL: process.env.HF_IMAGE_MODEL || null,
      HF_VARIANTS: process.env.HF_VARIANTS || null,
      variants: variantCount(),
    });
  }

  if (req.method !== 'POST') {
    return Response.json({ error: 'Method Not Allowed' }, { status: 405 });
  }

  // Kill switch: never invoke the image model while disabled.
  if (!AI_DESIGN_ENABLED) {
    return Response.json(
      { status: 'failed', error: 'AI-ontwerp is tijdelijk niet beschikbaar — we werken aan een verbeterde versie.' },
      { status: 503 },
    );
  }

  let body = {};
  try {
    body = await req.json();
  } catch {
    // ignore — treated as empty body below
  }

  const prompt = String(body.prompt ?? '').slice(0, 400);
  if (!prompt.trim()) {
    return Response.json({ error: 'prompt is required' }, { status: 400 });
  }
  const rawRatio = String(body.aspectRatio ?? DEFAULT_RATIO);
  const aspectRatio = ALLOWED_RATIOS.has(rawRatio) ? rawRatio : DEFAULT_RATIO;

  const variants = variantCount();

  // LIVE path — one parallel job per variant, each with its own light hint.
  if (isLive()) {
    const results = await Promise.allSettled(
      Array.from({ length: variants }, (_, i) =>
        startLiveGeneration(buildBackgroundPrompt(prompt, i), aspectRatio, NEGATIVE_PROMPT),
      ),
    );
    const ids = results.filter((r) => r.status === 'fulfilled').map((r) => r.value.requestId);
    if (ids.length === 0) {
      const rejected = results.find((r) => r.status === 'rejected');
      const message = rejected?.reason instanceof Error ? rejected.reason.message : 'Kon de AI-generatie niet starten.';
      return Response.json({ status: 'failed', error: message }, { status: 502 });
    }
    const jobId = 'live.' + Buffer.from(JSON.stringify({ ids }), 'utf8').toString('base64url');
    // `variants` is what actually started (a partial failure still yields a
    // choice), so the UI can say a true number instead of hard-coding one.
    return Response.json({ jobId, status: 'queued', variants: ids.length });
  }

  // MOCK path (default) — encode enough to render the placeholder backgrounds.
  const payload = JSON.stringify({ t: Date.now(), n: variants });
  const jobId = 'mock.' + Buffer.from(payload, 'utf8').toString('base64url');

  return Response.json({ jobId, status: 'queued', variants });
};

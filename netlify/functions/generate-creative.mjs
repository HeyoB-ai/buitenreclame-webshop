// Netlify Function v2 — start a creative-generation job (3 textless variants).
//
// Default is MOCK mode: no external call, no API keys, no storage. The job is
// encoded in the stateless jobId; status polling returns 3 textless SVG
// background variants after a short delay.
//
// When HF_MODE=live AND both keys are present, the LIVE path starts THREE real
// Higgsfield jobs (in parallel), each a mood-rich, on-theme, TEXTLESS advertising
// background, and returns a "live." jobId carrying the 3 request_ids.
// See netlify/functions/README.md.

import { isLive, startLiveGeneration } from './lib/higgsfield.mjs';

const VARIANTS = 3;
// Portrait ratios per screen type: 9:16 (digital 1080x1920) or 2:3 (abri
// 118.5x175cm). The client sends the ratio that matches the chosen screen.
const ALLOWED_RATIOS = new Set(['9:16', '2:3', '3:4']);
const DEFAULT_RATIO = '9:16';

// Per-variant hints so the 3 results genuinely differ — each is a distinct
// light / angle / moment of the SAME lively scene (never emptying it out).
const VARIATION_HINTS = [
  'Warm golden-hour light, eye-level angle, the scene bright, sunny and inviting.',
  'Soft natural daylight, a slightly wider angle that shows more of the surroundings.',
  'Cozy late-afternoon glow, a closer three-quarter angle on the hero subject with the lively scene softly blurred behind.',
];

// Concepts to actively keep OUT of the image. Two jobs: (1) suppress Soul's
// text-proneness (fake letters/signage), and (2) steer away from the plasticky,
// over-polished "generic AI" look toward real photography. NOTE: nothing here
// suppresses people or the scene — we WANT a full, lively environment.
const NEGATIVE_PROMPT =
  // — no text / signage of any kind (the strongest lever against fake letters) —
  'text, letters, words, numbers, typography, captions, writing, characters, fonts, handwriting, ' +
  'signage, sign, signboard, billboard, chalkboard, blackboard, menu board, menu, poster, banner, ' +
  'label, printed label, jar label, product label, price tag, sticker, packaging text, logo, ' +
  'watermark, brand name, shop name, subtitles, ' +
  // — not a generic AI render; believable commercial photography only —
  'digital art, illustration, 3d render, cgi, render, painting, drawing, cartoon, anime, ' +
  'overly polished, plastic, waxy, glossy fake surfaces, oversaturated, harsh HDR, oversharpened, ' +
  'over-processed, low-resolution, blurry subject, distorted, deformed, ugly';

// The user's description IS the scene. We render it in full — people, setting and
// mood included — as a vibrant lifestyle advertising photograph, NOT a studio
// still-life. We only keep text out of frame (Soul can't render real letters; the
// sharp headline is overlaid later in step B) and add a light hint that there be a
// slightly calmer area for that overlay — without emptying the scene.
function buildBackgroundPrompt(userPrompt, variant) {
  const scene = String(userPrompt || '').trim();
  const hint = VARIATION_HINTS[variant % VARIATION_HINTS.length];
  return (
    // 1) Take the whole description as the scene; keep any people/environment/mood
    //    the user described (their own words carry who is in it — we don't inject
    //    people, to avoid tripping the model's content filter).
    `Vibrant lifestyle advertising photograph of ${scene}. ` +
    `Render the full scene the description implies — including any people, surroundings and atmosphere it mentions — ` +
    `as a lively, authentic real-life moment, never an isolated product on a plain background. ` +
    // 2) Advertising-photography quality + a wholesome framing that keeps Soul's
    //    safety filter from false-flagging ordinary lifestyle scenes.
    `Warm natural light, golden hour, shallow depth of field, the main subject prominent and appealing in the ` +
    `foreground, a lively authentic scene alive in the background, editorial commercial photography, photorealistic, ` +
    `true-to-life colours, natural texture, a wholesome and family-friendly atmosphere with everyone tastefully and ` +
    `fully dressed. ${hint} ` +
    // 3) Light hint for our later text overlay — do NOT empty the scene.
    `Compose so there is a slightly calmer, less busy area near the top or the bottom where a headline can be placed ` +
    `later, while keeping the scene full, warm and lively. ` +
    // 4) Text suppression stays — the only hard constraint.
    `A completely wordless photograph — no text, letters, numbers, writing, signage, labels, price tags, logos or ` +
    `watermark anywhere.`
  );
}

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
    });
  }

  if (req.method !== 'POST') {
    return Response.json({ error: 'Method Not Allowed' }, { status: 405 });
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

  // LIVE path — 3 parallel jobs, each with its own variation of the prompt.
  if (isLive()) {
    const results = await Promise.allSettled(
      Array.from({ length: VARIANTS }, (_, i) =>
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
    return Response.json({ jobId, status: 'queued' });
  }

  // MOCK path (default) — encode enough to render VARIANTS placeholder backgrounds.
  const payload = JSON.stringify({ t: Date.now(), n: VARIANTS });
  const jobId = 'mock.' + Buffer.from(payload, 'utf8').toString('base64url');

  return Response.json({ jobId, status: 'queued' });
};

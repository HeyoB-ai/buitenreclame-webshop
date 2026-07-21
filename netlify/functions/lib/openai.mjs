// Shared OpenAI image-generation helper (replaces the old Higgsfield/Soul lib).
//
// Why OpenAI gpt-image-2: it has real safety moderation. Soul produced
// inappropriate output from innocent prompts and has been removed.
//
// OFFICIAL API (developers.openai.com/api/reference/.../images/generate):
//   POST https://api.openai.com/v1/images/generations
//   header  Authorization: Bearer <OPENAI_API_KEY>
//   body    { model, prompt, size, quality, n, output_format, moderation }
//   → { data: [{ b64_json }], ... }   (GPT image models return base64, never a URL)
// Verified live (2026-07): 200 + real images; the exact "meisje likt aan ijsje"
// prompt that Soul mishandled returns an innocent child-with-ice-cream photo.
//
// Generation is SYNCHRONOUS and slow (~50s/image), so it runs inside a Netlify
// *background* function (up to 15 min), never a normal 10s function.
//
// Key: OPENAI_API_KEY (also accepts the legacy name OPENAI_KEY). No key → a
// friendly error, never a crash and NEVER a fallback to Soul.

const ENDPOINT = 'https://api.openai.com/v1/images/generations';
const DEFAULT_MODEL = 'gpt-image-2';
// A0 is 1:1.414 (portrait). 1024x1440 = 1:1.406 — the nearest supported size
// (verified live). Standard 1024x1536 (1:1.5) is an alternative. Override with
// OPENAI_IMAGE_SIZE. A larger size sharpens print at higher cost/latency.
const DEFAULT_SIZE = '1024x1440';
const DEFAULT_QUALITY = 'medium'; // low | medium | high — override OPENAI_IMAGE_QUALITY
const DEFAULT_OUTPUT = 'jpeg'; // smaller than png; fine for a photo background
// moderation 'auto' = OpenAI's standard (stricter) safety filter. This is the
// whole point of the switch, so it is NOT configurable down to 'low'.
const MODERATION = 'auto';

// Per-image time budget. Generous because this runs in a background function.
const GEN_TIMEOUT_MS = 120_000;

// Per-variant hints so results differ. LIGHT ONLY — never anything about angle,
// distance or how much surroundings are in frame, so a "close-up" request is
// never silently widened.
const VARIATION_HINTS = [
  'Warm golden-hour light.',
  'Soft, natural diffused daylight.',
  'Cosy late-afternoon light.',
  'Clear, bright daylight.',
];

const DEFAULT_VARIANTS = 2;
const MAX_VARIANTS = 4; // a sane per-click ceiling on cost/latency

/** Both env names accepted; OPENAI_API_KEY is canonical. */
export function openAiKey() {
  return (process.env.OPENAI_API_KEY || process.env.OPENAI_KEY || '').trim();
}

export function hasOpenAiKey() {
  return Boolean(openAiKey());
}

/** How many backgrounds one click generates. Override with AI_VARIANTS. */
export function variantCount() {
  const raw = Number.parseInt((process.env.AI_VARIANTS || '').trim(), 10);
  if (!Number.isInteger(raw) || raw < 1) return DEFAULT_VARIANTS;
  return Math.min(raw, MAX_VARIANTS);
}

function imageSize() {
  const s = (process.env.OPENAI_IMAGE_SIZE || '').trim();
  return /^\d+x\d+$/.test(s) ? s : DEFAULT_SIZE;
}

function imageQuality() {
  const q = (process.env.OPENAI_IMAGE_QUALITY || '').trim().toLowerCase();
  return ['low', 'medium', 'high', 'auto'].includes(q) ? q : DEFAULT_QUALITY;
}

function model() {
  return (process.env.OPENAI_IMAGE_MODEL || '').trim() || DEFAULT_MODEL;
}

// Opt-in diagnostics (server terminal only, never the key). Off by default.
function debug(...args) {
  const v = (process.env.OPENAI_DEBUG || '').toLowerCase();
  if (v === '1' || v === 'true') console.error('[openai-image]', ...args);
}

/**
 * The user's description is the brief — it decides subject AND framing. This
 * wrapper adds only craft (light, lens, realism) and the two things we always
 * need: no text in the image (we overlay our own headline later) and a bit of
 * calm space for it. The Dutch description is sent AS-IS: gpt-image-2 understands
 * Dutch, so there is no translation step to misinterpret.
 */
export function buildBackgroundPrompt(userPrompt, variant) {
  const subject = String(userPrompt || '').trim();
  const light = VARIATION_HINTS[variant % VARIATION_HINTS.length];
  return (
    `${subject}. ` +
    `Professional advertising photograph, natural warm light, shallow depth of field, photorealistic, ` +
    `true-to-life colours, natural texture, editorial commercial quality. ${light} ` +
    `Leave slightly calmer negative space near the top or the bottom for a headline. ` +
    `A completely wordless photograph — no text, letters, numbers, writing, signage, labels, price tags, logos or ` +
    `watermark anywhere.`
  );
}

/** Map an OpenAI failure to a short, safe Dutch message — never a key or stack. */
function friendly(status, errObj) {
  const code = errObj?.code || '';
  const msg = String(errObj?.message || '');
  if (status === 401) return 'OpenAI-authenticatie mislukt. Controleer de sleutel.';
  if (/moderation|content[_ ]?policy|safety/i.test(code) || /moderation|content policy|safety/i.test(msg)) {
    return 'De beschrijving is geweigerd door het veiligheidsfilter. Pas de tekst aan en probeer opnieuw.';
  }
  if (status === 429 || /rate.?limit/i.test(code)) return 'Te veel aanvragen achter elkaar. Wacht even en probeer opnieuw.';
  if (/billing|quota|insufficient/i.test(code)) return 'Onvoldoende OpenAI-tegoed om te genereren.';
  if (status === 400) return 'De aanvraag werd geweigerd (ongeldige invoer).';
  return 'Kon de AI-generatie niet uitvoeren. Probeer het later opnieuw.';
}

/**
 * Generate ONE image and return it as a data-URL (jpeg base64). Throws a
 * friendly Error on any failure. Never falls back to another model.
 */
export async function generateImage(prompt) {
  const key = openAiKey();
  if (!key) throw new Error('OPENAI_API_KEY ontbreekt — AI-generatie is niet geconfigureerd.');

  const body = {
    model: model(),
    prompt,
    size: imageSize(),
    quality: imageQuality(),
    n: 1,
    output_format: DEFAULT_OUTPUT,
    moderation: MODERATION,
  };

  let res, text;
  try {
    res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(GEN_TIMEOUT_MS),
    });
    text = await res.text();
  } catch (err) {
    debug('network error:', err?.name, err?.message);
    if (err?.name === 'TimeoutError' || err?.name === 'AbortError') {
      throw new Error('De AI-ontwerpserver reageerde niet op tijd. Probeer het opnieuw.');
    }
    throw new Error('Kon de AI-ontwerpserver niet bereiken.');
  }

  if (!res.ok) {
    let errObj;
    try { errObj = JSON.parse(text)?.error; } catch { /* non-JSON */ }
    debug(`HTTP ${res.status}: ${text.slice(0, 400)}`);
    throw new Error(friendly(res.status, errObj));
  }

  let data;
  try { data = JSON.parse(text); } catch { throw new Error('Onverwacht antwoord van de ontwerpserver.'); }
  const b64 = data?.data?.[0]?.b64_json;
  if (!b64) { debug('no b64 in body:', text.slice(0, 300)); throw new Error('Geen afbeelding ontvangen van de server.'); }
  return `data:image/${DEFAULT_OUTPUT};base64,${b64}`;
}

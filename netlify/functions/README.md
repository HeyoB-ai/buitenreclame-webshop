# Netlify Functions — creative generation (OpenAI gpt-image-2)

The "Laat AI ontwerpen" tab of the creative modal is backed by three functions
plus two small libs. The image model is **OpenAI `gpt-image-2`**, chosen for its
real safety moderation. The previous model (Higgsfield "Soul") produced
inappropriate output from innocent prompts and has been **removed** — there is no
fallback to it.

## Flow (why there are three functions)

OpenAI image generation is **synchronous and slow (~50–70s)**. A normal Netlify
function times out at 10s (26s max, by request). So generation runs in a
**background function** (up to 15 min) and the result is passed via **Netlify
Blobs**:

1. **`generate-creative.mjs`** — `POST { prompt }` → validates, writes a `pending`
   job to Blobs, fires the background worker, returns `{ jobId, variants }` fast.
2. **`generate-creative-background.mjs`** — the `-background` suffix makes Netlify
   run it asynchronously. Generates every variant via `gpt-image-2` (parallel,
   one light-hint each) and writes `{ status:"completed", imageUrls }` (or
   `failed`) to Blobs.
3. **`creative-status.mjs`** — `POST { jobId }` → reads the Blobs record →
   `{ status:"in_progress" }` while pending, then `{ status:"completed",
   imageUrls }` or `{ status:"failed", error }`.

`imageUrls` are **data-URLs** (base64 jpeg). The poster composer loads them
directly, so no CORS proxy is needed. `src/lib/creativeClient.ts` polls up to
180s — plenty for a ~50–70s job.

Libs: **`lib/openai.mjs`** (the API call + prompt builder + variant/size config)
and **`lib/jobstore.mjs`** (Blobs get/put, strong consistency, 1h TTL).

## The verified OpenAI call

```
POST https://api.openai.com/v1/images/generations
Authorization: Bearer <OPENAI_API_KEY>
{ "model":"gpt-image-2", "prompt":"…", "size":"1024x1440",
  "quality":"medium", "n":1, "output_format":"jpeg", "moderation":"auto" }
→ 200 { "data":[{ "b64_json":"…" }], … }   (GPT image models return base64, never a URL)
```

Verified live (2026-07): 200 + real images. **`moderation:"auto"`** (OpenAI's
standard, stricter filter) is the safety win and is not configurable down.

**Safety test — the point of the switch.** The exact prompt that Soul mishandled,
*"een close-up van een ijshoorntje met vrolijke kleuren waar een blond meisje aan
likt"*, returns an **innocent child-with-ice-cream photo** through the full
pipeline. If a variant trips the filter it simply fails; the job returns the
variants that succeeded (partial success, never a crash).

## Config (env vars)

| Var | Meaning |
| --- | --- |
| `OPENAI_API_KEY` | **Required.** The OpenAI key. Legacy name `OPENAI_KEY` also accepted. Missing → friendly error, never a crash, never Soul. |
| `OPENAI_IMAGE_MODEL` | Default `gpt-image-2`. |
| `OPENAI_IMAGE_SIZE` | Default `1024x1440` (portrait ≈ A0 1:1.406). `1024x1536` (1:1.5) also works. Larger = sharper print, higher cost/latency. |
| `OPENAI_IMAGE_QUALITY` | `low` \| `medium` (default) \| `high`. |
| `AI_VARIANTS` | Backgrounds per click, 1–4 (default 2). Each is a separate image = that many × cost. |
| `OPENAI_DEBUG` | `1` to log failures server-side (never the key). |

**Deploy note:** set `OPENAI_API_KEY` on the Netlify site (Site config → Env vars),
scoped to the contexts you want (deploy-preview and/or production). Without it the
tab returns the "niet geconfigureerd" error. Netlify Blobs and background
functions need no extra setup (background functions require a non-legacy plan or
Enterprise; this site's Pro plan includes them).

## The prompt contract — the description leads

`buildBackgroundPrompt` sends the **Dutch description as-is** (gpt-image-2
understands Dutch — no translation step to misinterpret) and adds only craft
(light, lens, realism), a hint of calm space for the headline we overlay later,
and "a completely wordless photograph". It does **not** dictate composition
(no "lifestyle scene", "with people", "still-life", "isolated product") — the
description decides subject and framing; the model chooses when the description
is silent. Per-variant `VARIATION_HINTS` vary **light only**.

## Credentials — never in code or git

The key is read at runtime via `process.env` and must never be committed. `.env`
and `.env.*` are gitignored; `.env.example` documents the names.

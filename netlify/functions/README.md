# Netlify Functions — creative generation

Two Netlify Functions (v2, web-standard `Request`/`Response`) back the
"laat AI ontwerpen" tab of the creative modal:

- **`generate-creative.mjs`** — `POST { prompt, aspectRatio }` → `{ jobId, status }`.
- **`creative-status.mjs`** — `POST { jobId }` → `{ status: "in_progress" }` while
  the job runs, then `{ status: "completed", imageUrl }` (or `{ status: "failed",
  error }`).

Both share `lib/higgsfield.mjs` (in a subdirectory → a bundled library, not a
standalone function).
The client layer (`src/lib/creativeClient.ts`) is identical for mock and live —
only the server decides which path runs, keyed off the `jobId` prefix
(`mock.` vs `live.`).

## The switch: `HF_MODE` (default MOCK)

- `HF_MODE` unset / `mock` **(default)** → MOCK: no external call, no API key, no
  credits, no storage. The job is encoded in the stateless `jobId`; after ~3.5s
  `creative-status` returns a **server-rendered SVG poster** (portrait,
  cobalt/amber house style, prompt text baked in) as a `data:image/svg+xml`
  data-URI.
- `HF_MODE=live` **AND both keys present** → LIVE: a real Higgsfield
  text-to-image generation. If the mode is `live` but a key is missing, the code
  falls back to MOCK — so the app is always safe to run without secrets, even on
  the live site.

## LIVE path (Higgsfield)

Uses the **official** Higgsfield API (docs.higgsfield.ai/docs/how-to/introduction):

- **Model:** configurable via **`HF_IMAGE_MODEL`** — a `model_id` of the form
  `merk/model/variant`. Default **`higgsfield-ai/soul/standard`** (verified live:
  `200` + a real image URL).
- Auth header: `Authorization: Key ${HF_API_KEY}:${HF_API_SECRET}`.
- `generate-creative` → **3 parallel** `POST /{model_id}` jobs with a **flat**
  body `{ prompt, aspect_ratio, resolution, negative_prompt }`. ESH prints one
  format — **A0** (841×1189 mm) — for both the A0-display and the Driehoeksbord,
  so the `aspect_ratio` is always **`3:4`**, the nearest supported ratio to A0
  (see *Measured limits*). Returns a `live.`
  jobId carrying the 3 `request_id`s; the client renders 3 textless variants to
  choose from and overlays the sharp text/logo itself (step B).
- `creative-status` → `GET /requests/{request_id}/status`; when `completed` it
  returns `{ status:"completed", imageUrl }` (from `images[0].url`) — the same
  shape as the mock, so `creativeClient.ts` is unchanged. Statuses:
  `queued | in_progress | completed | failed | nsfw` (failed/nsfw refund credits).
- **Errors** (auth, credits, validation, NSFW, network) become a short, friendly
  `{ status: "failed", error }` — never a stacktrace or a key. Set **`HF_DEBUG=1`**
  to log the full HTTP status + body **server-side** (terminal only); off by default.

### Measured limits (verified live, 2026-07)

These are the numbers the timeouts are built on — measure again before changing them.

| Fact | Measured value |
| --- | --- |
| Accepted `aspect_ratio` | `9:16`, `16:9`, `4:3`, `3:4`, `1:1`, `2:3`, `3:2` — **verbatim from the API's own 422**. A raw ratio (`841:1189`, `1:1.414`) is a `422`. |
| Our A0 ratio | `3:4` (1.333) is the **nearest** supported ratio to A0 (1.414); `2:3` (1.5) is further. Verified `200` + a real image URL. |
| Time to a finished image | **~45-60s** for the 3 parallel jobs on an idle account. |
| **Concurrency cap** | **4 in-flight requests per account** — `400 {"detail":"Maximum number of concurrent requests (4) has been reached"}`. |

**The concurrency cap is the trap.** One click starts **3** jobs, so a second
click while the first is still running exceeds 4 and is refused — and jobs that
queue behind the budget can sit in `queued` for **minutes** (measured >180s).
Abandoned jobs are never cancelled, so they keep occupying the budget until they
finish. If generation feels "stuck", this is the first thing to check.

### Why everything has a timeout

`fetch` without a signal can stay pending forever. Both functions bound every
outbound call (`AbortSignal.timeout`), and `creativeClient.ts` bounds every
request *and* the whole poll (180s). Without the per-request bound the poll
deadline can never fire — it is only consulted between requests — which strands
the UI on a spinner with no result and no error.

### Switching model — `HF_IMAGE_MODEL` is the only knob

Every text-to-image model uses the **identical** call (flat body, same poll). This
is confirmed against the official Python SDK (`higgsfield-client`): it POSTs to
`{BASE}/{model_id}` with `json=arguments` (flat, **no** `params` wrapper) and polls
`/requests/{id}/status` — exactly what these functions do. So switching model is
just setting `HF_IMAGE_MODEL`; **no code change**.

**Confirmed REST model_ids** (verified live against our key, 2026-07):

| `model_id` | Note | Live result on our key |
| --- | --- | --- |
| `higgsfield-ai/soul/standard` | **Soul** — portrait / studio still-life. Great product shots; text-prone; on a *studio* prompt it skews bare. On a raw *scene* prompt it does render people/scenes. **DEFAULT.** | `200` ✅ works |
| `bytedance/seedream/v4/text-to-image` | **Seedream 4** — allround, stronger at full scenes (garden, people, context). Also accepts `resolution`/`size` + optional `camera_fixed`. | `404 "Model not found"` — **not provisioned for this account**; enable Seedream on the Higgsfield plan, then set `HF_IMAGE_MODEL` and it works unchanged |
| `reve/text-to-image` | **Reve** — allround text-to-image. | `423 "model_blocked"` — recognised but not enabled on this plan |

Notes: a `404` means the model_id isn't enabled/available for the key (routing,
before body validation — a wrong *field* would be `422`); a `423` means the model
is recognised but blocked for the plan. The model_id string for Seedream is
confirmed correct by the docs, the SDK and the community ComfyUI integration — the
`404` here is purely an account-provisioning matter, not a format error.

### Nano Banana Pro — not yet on the public REST API

Nano Banana Pro (Gemini 3 Pro Image) was requested. Its REST `model_id` is **not**
published in the docs, and ~25 plausible `merk/model/variant` slugs
(`higgsfield-ai/nano-banana-pro/standard`, `google/nano-banana-pro/standard`,
`nano-banana-pro/standard`, …) **all returned `404 "Model not found"`**. The
catalog names from the CLI (`nano_banana_2`) and the Higgsfield MCP
(`nano_banana_pro`) are not valid REST model_ids either. It appears Nano Banana is
only reachable via the app / CLI / MCP for now, not the public REST API. When the
real `model_id` is known, just set `HF_IMAGE_MODEL` to it — the request/response
format is identical, no code change needed.

Config knobs: `HF_IMAGE_MODEL` (model_id), `HF_IMAGE_RESOLUTION` (model-dependent,
e.g. `720p`/`1080p` for Soul), `HF_DEBUG` (`1` to log failures server-side).

### Cost — 3 variants per request

Each "genereren" click makes **3 textless background variants = 3 parallel jobs
= 3× credits** (the user gets 3 options to choose from). `generate-creative`
starts the 3 jobs with `Promise.allSettled`; `creative-status` aggregates them
and returns `{ status, imageUrls: [...] }`. This 3× multiplier is the key input
for the later cost-guarding step (e.g. per-user rate limits or a variant count
knob).

## Credentials — never in code or git

Higgsfield auth is a **key pair**: `HF_API_KEY` + `HF_API_SECRET`. They are read
at runtime via `process.env` and **must never** be committed. `.env`, `.env.*`
and `.netlify/` are in `.gitignore`.

- **Production:** set `HF_MODE`, `HF_API_KEY`, `HF_API_SECRET` (and optionally
  `HF_IMAGE_MODEL`) in the Netlify UI → Site settings → Environment variables.
- **Local:** copy `.env.example` → `.env` and fill in the values. `netlify dev`
  loads `.env` automatically.

## Running locally

```bash
npm run dev:netlify   # Netlify Dev: serves the Vite app + the functions
```

- Default (no `.env` / `HF_MODE=mock`) → the mock poster, no keys needed.
- To test LIVE: put `HF_MODE=live` + real `HF_API_KEY`/`HF_API_SECRET` in `.env`,
  then `npm run dev:netlify` and generate from the "laat AI ontwerpen" tab.

Plain `npm run dev` (Vite only) does not run the functions; the modal then shows
a clear "start met `npm run dev:netlify`" message instead of failing silently.

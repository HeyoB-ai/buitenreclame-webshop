/**
 * Client for the creative-generation Netlify Functions.
 *
 * startCreative → POST /.netlify/functions/generate-creative → jobId
 * pollCreative  → poll /.netlify/functions/creative-status until completed/failed
 *
 * When the functions are unreachable (e.g. running plain `vite dev`, which has
 * no functions server), a clear error is thrown telling the user to run
 * `npm run dev:netlify`.
 *
 * TIMEOUTS — why every request is bounded:
 * A `fetch` without a signal can stay pending indefinitely. The poll deadline
 * below is only consulted *between* requests, so a single stalled request would
 * park the loop forever: no result, no error, an eternal spinner. Bounding each
 * request guarantees the loop keeps turning and therefore always reaches its
 * deadline.
 */

const GENERATE_URL = '/.netlify/functions/generate-creative';
const STATUS_URL = '/.netlify/functions/creative-status';

const UNREACHABLE_MSG =
  'Start de app met `npm run dev:netlify` om de creatie te testen.';

const POLL_INTERVAL_MS = 1500;

/** Per-request ceilings. Both endpoints answer in ~1.5s when healthy. */
const START_REQUEST_TIMEOUT_MS = 30_000;
const STATUS_REQUEST_TIMEOUT_MS = 15_000;

/**
 * Hard ceiling on one generation. Measured live: a single Soul job takes ~45-60s
 * and we run 3 in parallel, so 90s produced false failures on a healthy run.
 * 180s leaves headroom for a queued job while still guaranteeing an end.
 */
const POLL_TIMEOUT_MS = 180_000;

/** Thrown when the functions server isn't answering this route at all. */
class UnreachableError extends Error {
  constructor() {
    super(UNREACHABLE_MSG);
    this.name = 'UnreachableError';
  }
}

/**
 * A single request stalled or the server hiccuped. The job itself may still be
 * fine, so a poll may retry this — always inside the overall deadline.
 */
class TransientError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TransientError';
  }
}

async function postJson(url: string, body: unknown, timeoutMs: number): Promise<any> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    // A timeout means the route exists but stalled — say so, rather than
    // blaming the dev server.
    if (err instanceof DOMException && (err.name === 'TimeoutError' || err.name === 'AbortError')) {
      throw new TransientError('De ontwerp-server reageerde niet op tijd. Probeer het opnieuw.');
    }
    throw new UnreachableError(); // connection refused → no functions server
  }

  // Plain `vite dev` answers unknown routes with the SPA index.html (HTML, 200),
  // so non-JSON *with a 200* means the functions server isn't handling this
  // route. Non-JSON with an error status is a real server fault (e.g. a Netlify
  // 502 HTML page) and must not be reported as "run dev:netlify".
  const contentType = res.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    if (res.ok) throw new UnreachableError();
    // A gateway hiccup (502/504) may pass; a 4xx will not.
    if (res.status >= 500) {
      throw new TransientError(`De ontwerp-server gaf een fout (${res.status}). Probeer het opnieuw.`);
    }
    throw new Error(`De ontwerp-server gaf een fout (${res.status}). Probeer het opnieuw.`);
  }

  let data: any;
  try {
    data = await res.json();
  } catch {
    throw new Error('Onverwacht antwoord van de ontwerp-server.');
  }

  if (!res.ok) {
    throw new Error(data?.error || `Serverfout (${res.status}).`);
  }
  return data;
}

export interface StartedCreative {
  jobId: string;
  /** How many backgrounds actually started. 0 when the server didn't say — the
   *  count is the server's to decide (HF_VARIANTS), so we never assume one. */
  variants: number;
}

/** Start a creative job; returns the jobId to poll and how many variants ran. */
export async function startCreative(prompt: string, aspectRatio: string): Promise<StartedCreative> {
  const data = await postJson(GENERATE_URL, { prompt, aspectRatio }, START_REQUEST_TIMEOUT_MS);
  // The server reports a refused start as a body-level failure; surface its
  // reason instead of falling through to a generic "no jobId".
  if (data?.status === 'failed') {
    throw new Error(data?.error || 'De creatie kon niet worden gestart.');
  }
  if (!data?.jobId) throw new Error('Geen jobId ontvangen van de server.');
  const variants = Number.isInteger(data?.variants) && data.variants > 0 ? (data.variants as number) : 0;
  return { jobId: data.jobId as string, variants };
}

/**
 * Poll a job until it completes; returns the resulting image URLs (one per
 * variant). Calls onProgress with the seconds elapsed so the UI can show that
 * the job is alive rather than a timeless spinner.
 *
 * Guaranteed to settle: every request is bounded, so the deadline below is
 * always reached.
 */
export async function pollCreative(
  jobId: string,
  onProgress?: (elapsedSeconds: number) => void,
): Promise<string[]> {
  const started = Date.now();
  const deadline = started + POLL_TIMEOUT_MS;

  while (Date.now() < deadline) {
    // Never let one request outlive the overall deadline.
    const budget = Math.min(STATUS_REQUEST_TIMEOUT_MS, deadline - Date.now());
    if (budget <= 0) break;

    let data: any;
    try {
      data = await postJson(STATUS_URL, { jobId }, budget);
    } catch (err) {
      // A stalled or hiccuping status request says nothing about the job — keep
      // polling until the deadline. Anything else (a real failure, an
      // unreachable server) ends it now.
      if (err instanceof TransientError) {
        onProgress?.(Math.round((Date.now() - started) / 1000));
        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
        continue;
      }
      throw err;
    }

    if (data.status === 'completed') {
      const urls: string[] = Array.isArray(data.imageUrls)
        ? data.imageUrls
        : data.imageUrl
          ? [data.imageUrl]
          : [];
      if (urls.length === 0) throw new Error('Geen afbeeldingen ontvangen van de server.');
      return urls;
    }
    if (data.status === 'failed') {
      throw new Error(data.error || 'De creatie is mislukt.');
    }

    onProgress?.(Math.round((Date.now() - started) / 1000));
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }

  // Measured: a job that queues behind the account's concurrency budget can sit
  // in "queued" for minutes, so name that cause rather than just "te lang".
  throw new Error(
    `Time-out: de creatie duurde langer dan ${Math.round(POLL_TIMEOUT_MS / 1000)} seconden. ` +
      'Mogelijk draait er nog een eerdere generatie — wacht even en probeer het opnieuw.',
  );
}

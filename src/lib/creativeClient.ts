/**
 * Client for the creative-generation Netlify Functions.
 *
 * startCreative → POST /.netlify/functions/generate-creative → jobId
 * pollCreative  → poll /.netlify/functions/creative-status until completed/failed
 *
 * When the functions are unreachable (e.g. running plain `vite dev`, which has
 * no functions server), a clear error is thrown telling the user to run
 * `npm run dev:netlify`.
 */

const GENERATE_URL = '/.netlify/functions/generate-creative';
const STATUS_URL = '/.netlify/functions/creative-status';

const UNREACHABLE_MSG =
  'Start de app met `npm run dev:netlify` om de creatie te testen.';

const POLL_INTERVAL_MS = 1500;
const POLL_TIMEOUT_MS = 90_000;

async function postJson(url: string, body: unknown): Promise<any> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    // Network error / connection refused → functions server not running.
    throw new Error(UNREACHABLE_MSG);
  }

  // Plain `vite dev` answers unknown routes with the SPA index.html (HTML, 200),
  // so a non-JSON response means the functions server isn't handling this route.
  const contentType = res.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    throw new Error(UNREACHABLE_MSG);
  }

  let data: any;
  try {
    data = await res.json();
  } catch {
    throw new Error(UNREACHABLE_MSG);
  }

  if (!res.ok) {
    throw new Error(data?.error || `Serverfout (${res.status}).`);
  }
  return data;
}

/** Start a creative job; returns the jobId to poll. */
export async function startCreative(prompt: string, aspectRatio: string): Promise<string> {
  const data = await postJson(GENERATE_URL, { prompt, aspectRatio });
  if (!data?.jobId) throw new Error('Geen jobId ontvangen van de server.');
  return data.jobId as string;
}

/**
 * Poll a job until it completes; returns the resulting image URLs (one per
 * variant). Calls onProgress with the poll attempt count while in progress.
 */
export async function pollCreative(
  jobId: string,
  onProgress?: (attempt: number) => void,
): Promise<string[]> {
  const started = Date.now();
  let attempt = 0;

  while (Date.now() - started < POLL_TIMEOUT_MS) {
    const data = await postJson(STATUS_URL, { jobId });

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

    attempt += 1;
    onProgress?.(attempt);
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }

  throw new Error('Time-out: de creatie duurde te lang. Probeer het opnieuw.');
}

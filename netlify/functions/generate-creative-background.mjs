// Netlify BACKGROUND function (the "-background" suffix makes Netlify run it
// asynchronously, up to 15 min — well beyond the 10s limit of a normal
// function). It generates every variant via OpenAI gpt-image-2 and writes the
// result to the job store, where creative-status reads it.
//
// The invoker (generate-creative) gets a 202 immediately; this keeps running.

import { generateImage, buildBackgroundPrompt } from './lib/openai.mjs';
import { putJob } from './lib/jobstore.mjs';

export default async (req) => {
  let jobId, prompt, variants;
  try {
    ({ jobId, prompt, variants } = await req.json());
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }
  if (!jobId || !prompt) return Response.json({ ok: false }, { status: 400 });

  const n = Math.max(1, Math.min(4, Number(variants) || 2));

  // Generate all variants in parallel — each its own light hint for variety.
  const results = await Promise.allSettled(
    Array.from({ length: n }, (_, i) => generateImage(buildBackgroundPrompt(prompt, i))),
  );

  const imageUrls = results.filter((r) => r.status === 'fulfilled').map((r) => r.value);

  try {
    if (imageUrls.length > 0) {
      await putJob(jobId, { status: 'completed', n, imageUrls });
    } else {
      const firstErr = results.find((r) => r.status === 'rejected');
      const error = firstErr?.reason instanceof Error ? firstErr.reason.message : 'De generatie is mislukt.';
      await putJob(jobId, { status: 'failed', n, error });
    }
  } catch {
    // If even the store write fails there is nothing more we can do; the poll
    // will eventually time out on the client with a friendly message.
  }

  return Response.json({ ok: true });
};

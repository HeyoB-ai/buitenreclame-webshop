/**
 * The one place a poster is painted on screen. Shared by the composer's inline
 * preview, its template thumbnails and the fullscreen preview overlay, so all
 * three show exactly the same poster as `composeToDataUrl` exports.
 *
 * `width` is the drawing buffer, not the display size — CSS decides how big the
 * canvas appears. Render the buffer at least as large as it will ever be shown
 * and let CSS scale it down; that keeps the poster crisp.
 */

import { useEffect, useRef, useState } from 'react';
import {
  drawPoster,
  ensureFonts,
  loadImage,
  type PosterFields,
  type TemplateKey,
  type ThemeKey,
  type Ratio,
} from '../lib/posterComposer';

/** Load an image URL into an <img> element, or null while loading / on failure. */
export function useLoadedImage(url: string | null): HTMLImageElement | null {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  useEffect(() => {
    let cancelled = false;
    if (!url) {
      setImg(null);
      return;
    }
    setImg(null);
    loadImage(url)
      .then((el) => { if (!cancelled) setImg(el); })
      .catch(() => { if (!cancelled) setImg(null); });
    return () => { cancelled = true; };
  }, [url]);
  return img;
}

interface Props {
  /** Drawing-buffer width in px. Display size comes from `className`. */
  width: number;
  ratio: Ratio;
  fields: PosterFields;
  template: TemplateKey;
  theme: ThemeKey;
  photo: HTMLImageElement | null;
  logo: HTMLImageElement | null;
  /** Draw the safe-zone guide. Preview only — never in the export. */
  guides?: boolean;
  className?: string;
}

export default function PosterCanvas({
  width, ratio, fields, template, theme, photo, logo, guides = false,
  className = 'w-full h-auto block',
}: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cancelled = false;
    const canvas = ref.current;
    if (!canvas) return;
    const W = width;
    const H = Math.round((width * ratio.h) / ratio.w);
    canvas.width = W;
    canvas.height = H;
    (async () => {
      await ensureFonts();
      if (cancelled) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      drawPoster(ctx, { W, H, photo, logo, fields, template, theme, ratio, guides });
    })();
    return () => { cancelled = true; };
  }, [width, ratio, fields, template, theme, photo, logo, guides]);

  return <canvas ref={ref} className={className} />;
}

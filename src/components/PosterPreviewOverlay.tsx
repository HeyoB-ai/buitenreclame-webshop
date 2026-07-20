/**
 * Beeldvullende poster-weergave — bekijken, niet bewerken.
 *
 * An A0 sheet is 841 × 1189 mm; a ~300px preview cannot tell you whether the
 * thing actually reads. This shows the poster as large as the viewport allows,
 * at the true A0 ratio, so it can be judged before it goes to print.
 *
 * The safe-zone guide can be switched off here: that dashed line is an editing
 * aid and is never printed, so seeing the poster without it is the only way to
 * see what really comes off the press.
 */

import { useEffect, useState } from 'react';
import { X, Ruler, Pencil } from 'lucide-react';
import PosterCanvas, { ImagePreviewCanvas, useLoadedImage } from './PosterCanvas';
import type { PosterFields, TemplateKey, ThemeKey, Ratio } from '../lib/posterComposer';

/** Drawing buffer for the big view: comfortably above any real display size, so
 *  CSS only ever scales it down (sharp), never up (blurry). */
const RENDER_W = 1100;

/**
 * Two modes:
 *  - a composed poster design (fields/template/theme/photoUrl), or
 *  - a plain uploaded image (imageUrl) — an own-supplied creative, shown
 *    cover-fitted into the A0 frame so it can be judged large before print.
 * `imageUrl` decides the mode.
 */
interface Props {
  ratio: Ratio;
  /** Caption under the poster (e.g. street + city). */
  caption?: string;
  /** Shown when the viewer may jump straight into editing (poster mode only). */
  onEdit?: () => void;
  onClose: () => void;

  // Poster mode:
  fields?: PosterFields;
  template?: TemplateKey;
  theme?: ThemeKey;
  photoUrl?: string | null;

  // Upload mode:
  imageUrl?: string | null;
  /** Title shown in the top bar (upload mode has no headline field). */
  title?: string;
}

export default function PosterPreviewOverlay({
  ratio, fields, template, theme, photoUrl, imageUrl, title, caption, onEdit, onClose,
}: Props) {
  // Default ON: the guide is what most people come here to check. Toggling it
  // off answers "how does it really come out?".
  const [showGuides, setShowGuides] = useState(true);

  const isUpload = Boolean(imageUrl);
  const photo = useLoadedImage(isUpload ? imageUrl ?? null : photoUrl ?? null);
  const logo = useLoadedImage(fields?.logo ?? null);
  const barTitle = title?.trim() || fields?.headline?.trim() || 'Poster';

  // Esc closes; while open the page behind must not scroll.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[80] flex flex-col bg-ink/95 backdrop-blur-sm animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-label="Poster beeldvullend bekijken"
    >
      {/* Backdrop: a sibling rather than a parent handler, so the poster can
          absorb its own clicks without stopPropagation plumbing. */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      {/* ---------- TOP BAR ---------- */}
      <div className="relative shrink-0 flex items-center justify-between gap-3 p-3 sm:p-4">
        <div className="min-w-0">
          <p className="text-xs sm:text-sm font-bold text-white truncate">
            {barTitle}
          </p>
          <p className="text-[10px] sm:text-[11px] font-mono text-white/60 truncate">
            {ratio.label}
            {caption ? ` · ${caption}` : ''}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowGuides((v) => !v)}
            aria-pressed={showGuides}
            title="De stippellijn staat niet op de druk"
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[11px] font-bold transition-all cursor-pointer border ${
              showGuides
                ? 'bg-white text-ink border-white'
                : 'bg-white/10 text-white/80 border-white/20 hover:bg-white/20'
            }`}
          >
            <Ruler className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Veilige zone {showGuides ? 'aan' : 'uit'}</span>
            <span className="sm:hidden">Zone</span>
          </button>

          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[11px] font-bold bg-white/10 text-white/80 border border-white/20 hover:bg-white/20 transition-all cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Aanpassen</span>
            </button>
          )}

          {/* Big enough to hit on a phone (min 44px). */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Sluiten"
            className="inline-flex items-center justify-center gap-1.5 rounded-full min-w-11 min-h-11 px-3 text-xs font-bold bg-white text-ink hover:bg-white/90 transition-all cursor-pointer"
          >
            <X className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Sluiten</span>
          </button>
        </div>
      </div>

      {/* ---------- POSTER STAGE ---------- */}
      {/* The canvas must be a DIRECT child: `max-h-full` resolves against the
          nearest definite height, and this flex row is the only box that has
          one. Wrapping it in an auto-height div silently disables the cap and
          the poster overflows the screen.
          `pointer-events-none` lets clicks beside the poster reach the backdrop,
          while the canvas itself takes its clicks back and stays put. */}
      <div className="relative flex-1 min-h-0 flex items-center justify-center px-3 pb-3 sm:px-6 sm:pb-6 pointer-events-none">
        {/* The buffer's own ratio gives the shape; max-h/max-w only shrink it. */}
        {isUpload || !fields || !template || !theme ? (
          <ImagePreviewCanvas
            width={RENDER_W}
            ratio={ratio}
            photo={photo}
            guides={showGuides}
            className="block h-auto w-auto max-h-full max-w-full rounded-md shadow-2xl ring-1 ring-white/10 pointer-events-auto"
          />
        ) : (
          <PosterCanvas
            width={RENDER_W}
            ratio={ratio}
            fields={fields}
            template={template}
            theme={theme}
            photo={photo}
            logo={logo}
            guides={showGuides}
            className="block h-auto w-auto max-h-full max-w-full rounded-md shadow-2xl ring-1 ring-white/10 pointer-events-auto"
          />
        )}
      </div>

      {/* ---------- FOOTER HINT ---------- */}
      <div className="relative shrink-0 pb-3 sm:pb-4 px-4 text-center pointer-events-none">
        <p className="text-[10px] sm:text-[11px] text-white/50 leading-snug">
          {showGuides ? (
            <>
              <span className="inline-block align-middle w-3 border-t border-dashed border-white/60 mr-1" />
              De stippellijn is de veilige zone — het frame valt over de rand. Deze lijn staat niet op de druk.
            </>
          ) : (
            'Dit is de poster zoals hij van de pers komt.'
          )}
          <span className="hidden sm:inline"> · Esc om te sluiten</span>
        </p>
      </div>
    </div>
  );
}

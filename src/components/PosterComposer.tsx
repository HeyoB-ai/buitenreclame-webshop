import { useEffect, useRef, useState } from 'react';
import { UploadCloud, X, Type } from 'lucide-react';
import {
  drawPoster,
  ensureFonts,
  loadImage,
  TEMPLATES,
  THEMES,
  type PosterFields,
  type TemplateKey,
  type ThemeKey,
  type Ratio,
} from '../lib/posterComposer';

const PREVIEW_W = 260;
const THUMB_W = 96;
const MAX_LOGO_BYTES = 2 * 1024 * 1024;

interface Props {
  photoUrl: string | null; // chosen AI background (null → graphic-only template)
  ratio: Ratio;
  fields: PosterFields;
  onFieldsChange: (f: PosterFields) => void;
  template: TemplateKey;
  onTemplateChange: (t: TemplateKey) => void;
  theme: ThemeKey;
  onThemeChange: (t: ThemeKey) => void;
  previewWidth?: number;
}

/** A self-contained canvas that renders one poster (used for the big preview
 *  and the small template thumbnails). Redraws on any input change. */
function PosterCanvas({
  width, ratio, fields, template, theme, photo, logo,
}: {
  width: number;
  ratio: Ratio;
  fields: PosterFields;
  template: TemplateKey;
  theme: ThemeKey;
  photo: HTMLImageElement | null;
  logo: HTMLImageElement | null;
}) {
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
      drawPoster(ctx, { W, H, photo, logo, fields, template, theme });
    })();
    return () => { cancelled = true; };
  }, [width, ratio.w, ratio.h, fields, template, theme, photo, logo]);
  return <canvas ref={ref} className="w-full h-auto block" />;
}

export default function PosterComposer({
  photoUrl, ratio, fields, onFieldsChange, template, onTemplateChange, theme, onThemeChange,
  previewWidth = PREVIEW_W,
}: Props) {
  const [photoImg, setPhotoImg] = useState<HTMLImageElement | null>(null);
  const [logoImg, setLogoImg] = useState<HTMLImageElement | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);

  const set = (patch: Partial<PosterFields>) => onFieldsChange({ ...fields, ...patch });

  useEffect(() => {
    let cancelled = false;
    if (!photoUrl) { setPhotoImg(null); return; }
    setPhotoImg(null);
    loadImage(photoUrl)
      .then((img) => { if (!cancelled) setPhotoImg(img); })
      .catch(() => { if (!cancelled) setPhotoImg(null); });
    return () => { cancelled = true; };
  }, [photoUrl]);

  useEffect(() => {
    let cancelled = false;
    if (!fields.logo) { setLogoImg(null); return; }
    loadImage(fields.logo)
      .then((img) => { if (!cancelled) setLogoImg(img); })
      .catch(() => { if (!cancelled) setLogoImg(null); });
    return () => { cancelled = true; };
  }, [fields.logo]);

  const onLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ok = /(png|jpe?g|svg)/i.test(file.type) || /\.svg$/i.test(file.name);
    if (!ok) { setLogoError('Gebruik een PNG, JPG of SVG.'); return; }
    if (file.size > MAX_LOGO_BYTES) { setLogoError('Logo is te groot (max 2 MB).'); return; }
    setLogoError(null);
    const reader = new FileReader();
    reader.onload = () => set({ logo: String(reader.result) });
    reader.readAsDataURL(file);
  };

  const inputCls =
    'w-full bg-white border border-line rounded-card-sm px-3 py-2 text-ink text-xs placeholder-mist-2 focus:outline-none focus:border-cobalt focus:ring-1 focus:ring-cobalt shadow-soft';

  const activeTpl = TEMPLATES.find((t) => t.key === template);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-mist">Ontwerp je poster</span>
        <span className="text-[10px] font-mono font-bold text-cobalt bg-cobalt-soft border border-cobalt-soft rounded-full px-2 py-0.5">
          Formaat: {ratio.label}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,240px)_1fr] gap-5 items-start">
        {/* Big live preview */}
        <div className="space-y-2">
          <div className="rounded-card-sm overflow-hidden border border-line shadow-soft bg-paper-2 mx-auto" style={{ maxWidth: previewWidth }}>
            <PosterCanvas width={previewWidth} ratio={ratio} fields={fields} template={template} theme={theme} photo={photoImg} logo={logoImg} />
          </div>
          {activeTpl && <p className="text-[10px] text-mist-2 text-center leading-snug px-2">{activeTpl.hint}</p>}
        </div>

        {/* Controls */}
        <div className="space-y-4">
          {/* Text fields */}
          <div className="grid grid-cols-1 gap-2">
            <label className="space-y-1">
              <span className="text-[11px] font-bold text-mist">Kop *</span>
              <input className={inputCls} value={fields.headline} onChange={(e) => set({ headline: e.target.value })} placeholder="Verse pizza uit de steenoven" />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="space-y-1">
                <span className="text-[11px] font-bold text-mist">Kicker</span>
                <input className={inputCls} value={fields.kicker} onChange={(e) => set({ kicker: e.target.value })} placeholder="Nieuw · Pizzeria Roma" />
              </label>
              <label className="space-y-1">
                <span className="text-[11px] font-bold text-mist">Subregel</span>
                <input className={inputCls} value={fields.subline} onChange={(e) => set({ subline: e.target.value })} placeholder="elke dag vers · ook afhalen" />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label className="space-y-1">
                <span className="text-[11px] font-bold text-mist">Aanbieding / prijs</span>
                <input className={inputCls} value={fields.offer} onChange={(e) => set({ offer: e.target.value })} placeholder="2e halve prijs" />
              </label>
              <label className="space-y-1">
                <span className="text-[11px] font-bold text-mist">Website</span>
                <input className={inputCls} value={fields.url} onChange={(e) => set({ url: e.target.value })} placeholder="pizzeriaroma.nl" />
              </label>
            </div>
          </div>

          {/* Logo + uppercase */}
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-mist block">Logo (optioneel)</span>
              <div className="flex items-center gap-2">
                {fields.logo && (
                  <div className="relative w-11 h-11 rounded-card-sm border border-line bg-paper-2 flex items-center justify-center overflow-hidden shrink-0">
                    <img src={fields.logo} alt="logo" className="max-w-full max-h-full object-contain" />
                    <button
                      type="button"
                      onClick={() => set({ logo: null })}
                      className="absolute -top-1.5 -right-1.5 bg-ink text-white rounded-full p-0.5 shadow cursor-pointer"
                      title="Logo verwijderen"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
                <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-card-sm border border-line bg-white hover:bg-paper-2 text-mist text-[11px] font-bold cursor-pointer shadow-soft">
                  <UploadCloud className="w-3.5 h-3.5" />
                  {fields.logo ? 'Vervangen' : 'Logo uploaden'}
                  <input type="file" accept="image/png,image/jpeg,image/svg+xml,.svg" className="hidden" onChange={onLogo} />
                </label>
              </div>
              {logoError && <p className="text-[10px] text-red-600 font-medium">{logoError}</p>}
            </div>

            <button
              type="button"
              onClick={() => set({ uppercase: !fields.uppercase })}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-card-sm text-[11px] font-bold border transition-all cursor-pointer shadow-soft ${
                fields.uppercase ? 'bg-cobalt-soft border-cobalt text-cobalt' : 'bg-white border-line text-mist hover:border-cobalt'
              }`}
              title="Kop in hoofdletters"
            >
              <Type className="w-3.5 h-3.5" />
              Hoofdletters {fields.uppercase ? 'aan' : 'uit'}
            </button>
          </div>

          {/* Template thumbnails */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-mist">Sjabloon</span>
            <div className="grid grid-cols-5 gap-1.5">
              {TEMPLATES.map((t) => {
                const isSel = template === t.key;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => onTemplateChange(t.key)}
                    title={t.hint}
                    className={`rounded-card-sm overflow-hidden border-2 transition-all cursor-pointer ${
                      isSel ? 'border-cobalt ring-2 ring-cobalt/20' : 'border-line hover:border-cobalt'
                    }`}
                  >
                    <PosterCanvas width={THUMB_W} ratio={ratio} fields={fields} template={t.key} theme={theme} photo={photoImg} logo={logoImg} />
                    <span className={`block text-[8px] font-bold py-0.5 leading-tight ${isSel ? 'bg-cobalt text-white' : 'bg-white text-mist'}`}>
                      {t.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Colour theme */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-mist">Kleurthema</span>
            <div className="flex flex-wrap gap-1.5">
              {THEMES.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => onThemeChange(t.key)}
                  title={t.label}
                  className={`w-8 h-8 rounded-full border-2 transition-all cursor-pointer relative ${
                    theme === t.key ? 'border-cobalt ring-2 ring-cobalt/20 scale-110' : 'border-white hover:scale-105'
                  } shadow-soft`}
                  style={{ backgroundColor: t.bg }}
                >
                  <span className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full border border-white/70" style={{ backgroundColor: t.accent }} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

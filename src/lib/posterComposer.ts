/**
 * Poster composer — a GRAPHIC-DESIGN system, not a photo-with-text-on-top.
 *
 * A poster is built from a chosen TEMPLATE (colour blocks, a photo zone, big
 * typography, an offer badge, a footer) and a vibrant THEME. The AI/uploaded
 * photo is one designed element inside the layout — the graphic leads. ALL text
 * is rendered sharply here on a canvas (the AI never draws text), so it is
 * always crisp and legible. The same draw routine powers the live preview, the
 * template thumbnails and the final PNG export (WYSIWYG).
 *
 * The user only picks safe options (template + theme, uppercase toggle) and
 * edits the text fields — no free dragging — so the result stays on the grid.
 */

export interface PosterFields {
  kicker: string; // small eyebrow above the headline (optional)
  headline: string; // the big grabber (required)
  subline: string; // supporting line (optional)
  offer: string; // offer / price → rendered as a badge (optional)
  url: string; // footer website (optional)
  logo: string | null; // data-URL (optional)
  uppercase: boolean; // headline in capitals
}

export type TemplateKey = 'foto-boven' | 'foto-inzet' | 'split' | 'foto-balk' | 'grafisch';
export type ThemeKey = 'groen' | 'geel' | 'koraal' | 'blauw' | 'roze' | 'cobalt' | 'amber';

export interface Template {
  key: TemplateKey;
  label: string;
  usesPhoto: boolean;
  hint: string;
}

// Spectrum from photo-heavy → graphic-heavy.
export const TEMPLATES: Template[] = [
  { key: 'foto-boven', label: 'Foto boven', usesPhoto: true, hint: 'Foto bovenaan, kleurblok met grote kop eronder.' },
  { key: 'foto-inzet', label: 'Kleurvlak + foto', usesPhoto: true, hint: 'Vol kleurvlak, grote kop, foto-inzet en badge.' },
  { key: 'split', label: 'Split', usesPhoto: true, hint: 'Kleurvlak met typografie boven, fotozone onder.' },
  { key: 'foto-balk', label: 'Foto + balk', usesPhoto: true, hint: 'Grote foto met een stevige schuine kleurband.' },
  { key: 'grafisch', label: 'Puur grafisch', usesPhoto: false, hint: 'Geen foto — vol kleur en zeer grote typografie.' },
];

export interface Theme {
  key: ThemeKey;
  label: string;
  bg: string; // main block / background base colour
  accent: string; // badge / ribbon colour
}

// Cheerful, high-energy billboard palettes + the two house colours.
export const THEMES: Theme[] = [
  { key: 'groen', label: 'Fris groen', bg: '#0FA968', accent: '#FFD23F' },
  { key: 'geel', label: 'Zonnig geel', bg: '#FFC93C', accent: '#141414' },
  { key: 'koraal', label: 'Warm koraal', bg: '#FB5E4C', accent: '#FFE45E' },
  { key: 'blauw', label: 'Diep blauw', bg: '#1D3F9E', accent: '#FF9F1C' },
  { key: 'roze', label: 'Roze pop', bg: '#F0559E', accent: '#FFE45E' },
  { key: 'cobalt', label: 'Cobalt', bg: '#2456E6', accent: '#DE8A06' },
  { key: 'amber', label: 'Amber', bg: '#DE8A06', accent: '#16213A' },
];

export interface Ratio {
  key: 'digital' | 'abri';
  label: string;
  aspect: string; // sent to the image model
  w: number; // export canvas pixels
  h: number;
}

/** The poster ratio for the screen this creative hangs on. */
export function ratioForType(type: 'digital' | 'abri'): Ratio {
  return type === 'digital'
    ? { key: 'digital', label: 'digitaal 9:16', aspect: '9:16', w: 1080, h: 1920 }
    : { key: 'abri', label: 'abri 2:3', aspect: '2:3', w: 1200, h: 1800 };
}

// --- colour helpers ---------------------------------------------------------

const INK = '#151515';
const WHITE = '#FFFFFF';

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function relLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const f = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

/** Auto-pick dark-ink or white text so it stays readable on `bg` (contrast check). */
function readableOn(bg: string): string {
  return relLuminance(bg) > 0.42 ? INK : WHITE;
}

/** Mix a colour toward black (amt<0) or white (amt>0), amt in [-1,1]. */
function shade(hex: string, amt: number): string {
  const { r, g, b } = hexToRgb(hex);
  const t = amt < 0 ? 0 : 255;
  const p = Math.abs(amt);
  const mix = (c: number) => Math.round((t - c) * p + c);
  const to2 = (c: number) => c.toString(16).padStart(2, '0');
  return `#${to2(mix(r))}${to2(mix(g))}${to2(mix(b))}`;
}

function rgba(hex: string, a: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}

// --- canvas primitives ------------------------------------------------------

let fontsReady: Promise<void> | null = null;
function ensureFonts(): Promise<void> {
  if (!fontsReady) {
    const anyDoc = document as any;
    fontsReady = anyDoc.fonts
      ? Promise.all([
          anyDoc.fonts.load('800 80px Poppins'),
          anyDoc.fonts.load('700 60px Poppins'),
          anyDoc.fonts.load('600 40px Poppins'),
          anyDoc.fonts.load('500 40px Inter'),
        ]).then(() => undefined).catch(() => undefined)
      : Promise.resolve();
  }
  return fontsReady;
}

/** data: URLs load as-is; everything else goes through the same-origin proxy so
 *  the canvas never taints (enabling PNG export). */
function proxied(url: string): string {
  if (url.startsWith('data:')) return url;
  return `/.netlify/functions/image-proxy?url=${encodeURIComponent(url)}`;
}

export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (!url.startsWith('data:')) img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Kon de afbeelding niet laden.'));
    img.src = proxied(url);
  });
}

function roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

/** Cover-fit an image into an arbitrary rect (optionally rounded). */
function drawPhoto(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null,
  x: number, y: number, w: number, h: number,
  r: number,
  placeholder: string,
) {
  ctx.save();
  roundRectPath(ctx, x, y, w, h, r);
  ctx.clip();
  if (img) {
    const ir = img.width / img.height;
    const rr = w / h;
    let dw: number, dh: number, dx: number, dy: number;
    if (ir > rr) { dh = h; dw = h * ir; dx = x + (w - dw) / 2; dy = y; }
    else { dw = w; dh = w / ir; dx = x; dy = y + (h - dh) / 2; }
    ctx.drawImage(img, dx, dy, dw, dh);
  } else {
    ctx.fillStyle = placeholder;
    ctx.fillRect(x, y, w, h);
  }
  ctx.restore();
}

function fillGradientV(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, c0: string, c1: string) {
  const g = ctx.createLinearGradient(x, y, x, y + h);
  g.addColorStop(0, c0);
  g.addColorStop(1, c1);
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
}

function hardWrap(ctx: CanvasRenderingContext2D, word: string, maxW: number): string[] {
  if (ctx.measureText(word).width <= maxW) return [word];
  const out: string[] = [];
  let cur = '';
  for (const ch of word) {
    if (cur && ctx.measureText(cur + ch).width > maxW) { out.push(cur); cur = ch; }
    else cur += ch;
  }
  if (cur) out.push(cur);
  return out;
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxW: number, hard = true): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const t = line ? line + ' ' + w : w;
    if (ctx.measureText(t).width > maxW && line) {
      lines.push(line);
      line = w;
    } else {
      line = t;
    }
  }
  if (line) lines.push(line);
  // Only hard-break over-wide single words as a last resort. During fitting we
  // pass hard=false so a long word shrinks to fit one line instead of splitting.
  if (!hard) return lines;
  return lines.flatMap((l) => (ctx.measureText(l).width > maxW ? hardWrap(ctx, l, maxW) : [l]));
}

interface Fit { fs: number; lines: string[]; lh: number; height: number }

/** Largest font size (within [min,max]) at which `text` wraps to ≤maxLines and
 *  fits inside maxH. Guarantees text never clips. */
function fitText(
  ctx: CanvasRenderingContext2D,
  text: string,
  opts: { maxW: number; maxH: number; maxLines: number; weight: number; family: string; min: number; max: number; lineFactor?: number },
): Fit {
  const { maxW, maxH, maxLines, weight, family, min, max } = opts;
  const lf = opts.lineFactor ?? 1.06;
  for (let fs = max; fs >= min; fs -= Math.max(1, Math.round(fs * 0.05))) {
    ctx.font = `${weight} ${fs}px ${family}`;
    const lines = wrapLines(ctx, text, maxW, false); // no mid-word breaks while fitting
    const lh = fs * lf;
    const noOverflow = lines.every((l) => ctx.measureText(l).width <= maxW);
    if (noOverflow && lines.length <= maxLines && lines.length * lh <= maxH) {
      return { fs, lines, lh, height: lines.length * lh };
    }
  }
  // Floor: allow a hard break so nothing ever overflows the box.
  ctx.font = `${weight} ${min}px ${family}`;
  const lines = wrapLines(ctx, text, maxW, true).slice(0, maxLines);
  const lh = min * lf;
  return { fs: min, lines, lh, height: lines.length * lh };
}

function drawLines(ctx: CanvasRenderingContext2D, fit: Fit, x: number, y: number, color: string, weight: number, family: string, align: CanvasTextAlign = 'left') {
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'top';
  ctx.font = `${weight} ${fit.fs}px ${family}`;
  fit.lines.forEach((ln, i) => ctx.fillText(ln, x, y + i * fit.lh));
  ctx.textAlign = 'left';
}

/** Small letter-spaced eyebrow line. Returns its height (0 if empty). */
function drawKicker(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, w: number, fs: number, color: string, align: CanvasTextAlign = 'left'): number {
  if (!text) return 0;
  const anyCtx = ctx as any;
  const prev = anyCtx.letterSpacing;
  anyCtx.letterSpacing = `${Math.round(fs * 0.12)}px`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'top';
  ctx.font = `700 ${fs}px Poppins, sans-serif`;
  const t = text.toUpperCase();
  const ax = align === 'center' ? x + w / 2 : align === 'right' ? x + w : x;
  ctx.fillText(t, ax, y);
  anyCtx.letterSpacing = prev ?? '0px';
  ctx.textAlign = 'left';
  return fs * 1.3;
}

interface Badge { w: number; h: number }

/** Rounded accent pill carrying the offer/price. */
function measureBadge(ctx: CanvasRenderingContext2D, text: string, fs: number): Badge {
  ctx.font = `800 ${fs}px Poppins, sans-serif`;
  const tw = ctx.measureText(text.toUpperCase()).width;
  const padX = fs * 0.62;
  const padY = fs * 0.42;
  return { w: tw + padX * 2, h: fs + padY * 2 };
}

function drawBadge(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, fs: number, bg: string, fg: string, angle = 0): Badge {
  const b = measureBadge(ctx, text, fs);
  ctx.save();
  if (angle) {
    ctx.translate(x + b.w / 2, y + b.h / 2);
    ctx.rotate((angle * Math.PI) / 180);
    ctx.translate(-b.w / 2, -b.h / 2);
    x = 0; y = 0;
  }
  ctx.fillStyle = bg;
  roundRectPath(ctx, x, y, b.w, b.h, b.h * 0.3);
  ctx.fill();
  ctx.fillStyle = fg;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `800 ${fs}px Poppins, sans-serif`;
  ctx.fillText(text.toUpperCase(), x + b.w / 2, y + b.h * 0.54);
  ctx.textAlign = 'left';
  ctx.restore();
  return b;
}

/** Footer row: website left, logo right, vertically centred in [y, y+h]. */
function drawFooter(ctx: CanvasRenderingContext2D, url: string, logo: HTMLImageElement | null, x: number, y: number, w: number, h: number, color: string) {
  if (url.trim()) {
    const fs = h * 0.5;
    ctx.fillStyle = color;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = `600 ${fs}px Inter, sans-serif`;
    ctx.fillText(url.trim(), x, y + h / 2);
  }
  if (logo) {
    const lh = h * 0.92;
    const lw = Math.min(lh * (logo.width / logo.height), w * 0.42);
    const rh = lw / (logo.width / logo.height);
    ctx.drawImage(logo, x + w - lw, y + (h - rh) / 2, lw, rh);
  }
}

// --- render context ---------------------------------------------------------

interface RC {
  ctx: CanvasRenderingContext2D;
  W: number; H: number;
  photo: HTMLImageElement | null;
  logo: HTMLImageElement | null;
  f: PosterFields;
  head: string; // cased headline
  bg: string; bgTop: string; bgBot: string; accent: string;
  onBg: string; onAccent: string; onBgMuted: string;
  pad: number;
  photoPlaceholder: string;
}

function footerH(rc: RC): number {
  return rc.f.url.trim() || rc.logo ? rc.H * 0.05 : 0;
}

// --- templates --------------------------------------------------------------

function tplFotoBoven(rc: RC) {
  const { ctx, W, H, pad } = rc;
  const photoH = H * 0.52;
  drawPhoto(ctx, rc.photo, 0, 0, W, photoH, 0, rc.photoPlaceholder);
  // colour block
  fillGradientV(ctx, 0, photoH, W, H - photoH, rc.bgTop, rc.bgBot);
  // accent seam
  ctx.fillStyle = rc.accent;
  ctx.fillRect(0, photoH, W, H * 0.01);

  const bx = pad;
  const bw = W - pad * 2;
  const fh = footerH(rc);
  let y = photoH + pad * 0.9;

  y += drawKicker(ctx, rc.f.kicker.trim(), bx, y, bw, W * 0.032, rgba(rc.onBg, 0.85));

  const bottomLimit = H - pad - fh - (rc.f.offer.trim() ? H * 0.09 : 0) - (rc.f.subline.trim() ? H * 0.07 : 0);
  const head = fitText(ctx, rc.head, { maxW: bw, maxH: bottomLimit - y, maxLines: 3, weight: 800, family: 'Poppins, sans-serif', min: W * 0.06, max: W * 0.135 });
  drawLines(ctx, head, bx, y, rc.onBg, 800, 'Poppins, sans-serif');
  y += head.height + H * 0.02;

  if (rc.f.subline.trim()) {
    const sub = fitText(ctx, rc.f.subline.trim(), { maxW: bw, maxH: H * 0.12, maxLines: 2, weight: 600, family: 'Poppins, sans-serif', min: W * 0.03, max: W * 0.05 });
    drawLines(ctx, sub, bx, y, rgba(rc.onBg, 0.92), 600, 'Poppins, sans-serif');
    y += sub.height + H * 0.02;
  }
  if (rc.f.offer.trim()) {
    drawBadge(ctx, rc.f.offer.trim(), bx, y, W * 0.058, rc.accent, rc.onAccent);
  }
  if (fh) drawFooter(ctx, rc.f.url, rc.logo, bx, H - pad - fh, bw, fh, rgba(rc.onBg, 0.9));
}

function tplFotoInzet(rc: RC) {
  const { ctx, W, H, pad } = rc;
  fillGradientV(ctx, 0, 0, W, H, rc.bgTop, rc.bgBot);
  const bx = pad;
  const bw = W - pad * 2;
  let y = pad * 1.1;

  y += drawKicker(ctx, rc.f.kicker.trim(), bx, y, bw, W * 0.034, rc.accent);
  const head = fitText(ctx, rc.head, { maxW: bw, maxH: H * 0.24, maxLines: 3, weight: 800, family: 'Poppins, sans-serif', min: W * 0.06, max: W * 0.13 });
  drawLines(ctx, head, bx, y, rc.onBg, 800, 'Poppins, sans-serif');
  y += head.height + H * 0.015;
  if (rc.f.subline.trim()) {
    const sub = fitText(ctx, rc.f.subline.trim(), { maxW: bw, maxH: H * 0.08, maxLines: 2, weight: 600, family: 'Poppins, sans-serif', min: W * 0.03, max: W * 0.046 });
    drawLines(ctx, sub, bx, y, rgba(rc.onBg, 0.92), 600, 'Poppins, sans-serif');
  }

  // photo inset panel
  const fh = footerH(rc);
  const panelY = H * 0.40;
  const panelH = H - panelY - pad - (fh ? fh + pad * 0.4 : 0);
  drawPhoto(ctx, rc.photo, bx, panelY, bw, panelH, W * 0.05, rc.photoPlaceholder);

  // offer ribbon over the panel's top-right
  if (rc.f.offer.trim()) {
    const fs = W * 0.055;
    const b = measureBadge(ctx, rc.f.offer.trim(), fs);
    drawBadge(ctx, rc.f.offer.trim(), bx + bw - b.w * 0.92, panelY - b.h * 0.42, fs, rc.accent, rc.onAccent, -7);
  }
  if (fh) drawFooter(ctx, rc.f.url, rc.logo, bx, H - pad - fh, bw, fh, rgba(rc.onBg, 0.9));
}

function tplSplit(rc: RC) {
  const { ctx, W, H, pad } = rc;
  const topH = H * 0.46;
  fillGradientV(ctx, 0, 0, W, topH, rc.bgTop, rc.bgBot);
  drawPhoto(ctx, rc.photo, 0, topH, W, H - topH, 0, rc.photoPlaceholder);

  const bx = pad;
  const bw = W - pad * 2;
  let y = pad;
  y += drawKicker(ctx, rc.f.kicker.trim(), bx, y, bw, W * 0.034, rc.accent);
  const head = fitText(ctx, rc.head, { maxW: bw, maxH: topH - y - pad - (rc.f.subline.trim() ? H * 0.08 : 0), maxLines: 3, weight: 800, family: 'Poppins, sans-serif', min: W * 0.055, max: W * 0.125 });
  drawLines(ctx, head, bx, y, rc.onBg, 800, 'Poppins, sans-serif');
  y += head.height + H * 0.012;
  if (rc.f.subline.trim()) {
    const sub = fitText(ctx, rc.f.subline.trim(), { maxW: bw, maxH: H * 0.08, maxLines: 2, weight: 600, family: 'Poppins, sans-serif', min: W * 0.03, max: W * 0.046 });
    drawLines(ctx, sub, bx, y, rgba(rc.onBg, 0.92), 600, 'Poppins, sans-serif');
  }

  // offer badge straddling the seam
  if (rc.f.offer.trim()) {
    const fs = W * 0.058;
    const b = measureBadge(ctx, rc.f.offer.trim(), fs);
    drawBadge(ctx, rc.f.offer.trim(), bx, topH - b.h / 2, fs, rc.accent, rc.onAccent);
  }

  // footer bar over the photo bottom
  const fh = footerH(rc);
  if (fh) {
    const barH = fh + pad * 0.7;
    ctx.fillStyle = rc.accent;
    ctx.fillRect(0, H - barH, W, barH);
    drawFooter(ctx, rc.f.url, rc.logo, bx, H - barH + (barH - fh) / 2, bw, fh, rc.onAccent);
  }
}

function tplFotoBalk(rc: RC) {
  const { ctx, W, H, pad } = rc;
  drawPhoto(ctx, rc.photo, 0, 0, W, H, 0, rc.photoPlaceholder);
  // depth scrims
  fillGradientV(ctx, 0, 0, W, H * 0.3, rgba('#000000', 0.28), rgba('#000000', 0));
  fillGradientV(ctx, 0, H * 0.7, W, H * 0.3, rgba('#000000', 0), rgba('#000000', 0.35));

  // strong angled colour band carrying the headline
  const bandH = H * 0.30;
  const cx = W / 2;
  const cy = H * 0.60;
  const angle = -6;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((angle * Math.PI) / 180);
  const bw = W * 1.5;
  ctx.fillStyle = rgba(rc.bg, 0.94);
  ctx.fillRect(-bw / 2, -bandH / 2, bw, bandH);
  // text on the band (unrotated-relative)
  const innerW = W * 0.86;
  let ty = -bandH / 2 + bandH * 0.16;
  ty += drawKicker(ctx, rc.f.kicker.trim(), -innerW / 2, ty, innerW, W * 0.032, rgba(rc.onBg, 0.9), 'center');
  const head = fitText(ctx, rc.head, { maxW: innerW, maxH: bandH * 0.62, maxLines: 2, weight: 800, family: 'Poppins, sans-serif', min: W * 0.06, max: W * 0.12 });
  drawLines(ctx, head, 0, ty, rc.onBg, 800, 'Poppins, sans-serif', 'center'); // x=0 is band centre in the rotated frame
  ctx.restore();

  // offer badge just under the band
  if (rc.f.offer.trim()) {
    const fs = W * 0.06;
    const b = measureBadge(ctx, rc.f.offer.trim(), fs);
    drawBadge(ctx, rc.f.offer.trim(), (W - b.w) / 2, cy + bandH * 0.44, fs, rc.accent, rc.onAccent, -3);
  }

  // footer bar
  const fh = footerH(rc);
  if (fh) {
    const barH = fh + pad * 0.7;
    ctx.fillStyle = rc.bg;
    ctx.fillRect(0, H - barH, W, barH);
    drawFooter(ctx, rc.f.url, rc.logo, pad, H - barH + (barH - fh) / 2, W - pad * 2, fh, rc.onBg);
  }
}

function tplGrafisch(rc: RC) {
  const { ctx, W, H, pad } = rc;
  fillGradientV(ctx, 0, 0, W, H, rc.bgTop, rc.bgBot);
  // tasteful decorative accent shapes
  ctx.save();
  ctx.globalAlpha = 0.16;
  ctx.fillStyle = rc.accent;
  ctx.beginPath(); ctx.arc(W * 0.86, H * 0.14, W * 0.26, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(W * 0.1, H * 0.9, W * 0.2, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  const bx = pad;
  const bw = W - pad * 2;
  const fh = footerH(rc);

  // measure the centred stack
  const kFs = W * 0.04;
  const head = fitText(ctx, rc.head, { maxW: bw, maxH: H * 0.42, maxLines: 4, weight: 800, family: 'Poppins, sans-serif', min: W * 0.08, max: W * 0.19 });
  const hasSub = !!rc.f.subline.trim();
  const sub = hasSub ? fitText(ctx, rc.f.subline.trim(), { maxW: bw, maxH: H * 0.12, maxLines: 2, weight: 600, family: 'Poppins, sans-serif', min: W * 0.032, max: W * 0.055 }) : null;
  const offFs = W * 0.075;
  const offB = rc.f.offer.trim() ? measureBadge(ctx, rc.f.offer.trim(), offFs) : null;

  const kH = rc.f.kicker.trim() ? kFs * 1.4 : 0;
  const gap = H * 0.028;
  const total = kH + head.height + (sub ? gap + sub.height : 0) + (offB ? gap * 1.4 + offB.h : 0);
  let y = (H - fh - total) / 2;

  if (rc.f.kicker.trim()) { drawKicker(ctx, rc.f.kicker.trim(), bx, y, bw, kFs, rc.accent, 'center'); y += kH; }
  drawLines(ctx, head, W / 2, y, rc.onBg, 800, 'Poppins, sans-serif', 'center');
  y += head.height;
  if (sub) { y += gap; drawLines(ctx, sub, W / 2, y, rgba(rc.onBg, 0.92), 600, 'Poppins, sans-serif', 'center'); y += sub.height; }
  if (offB) { y += gap * 1.4; drawBadge(ctx, rc.f.offer.trim(), (W - offB.w) / 2, y, offFs, rc.accent, rc.onAccent, -3); }

  if (fh) drawFooter(ctx, rc.f.url, rc.logo, bx, H - pad - fh, bw, fh, rgba(rc.onBg, 0.9));
}

const PAINTERS: Record<TemplateKey, (rc: RC) => void> = {
  'foto-boven': tplFotoBoven,
  'foto-inzet': tplFotoInzet,
  split: tplSplit,
  'foto-balk': tplFotoBalk,
  grafisch: tplGrafisch,
};

export interface DrawArgs {
  W: number;
  H: number;
  photo: HTMLImageElement | null;
  logo: HTMLImageElement | null;
  fields: PosterFields;
  template: TemplateKey;
  theme: ThemeKey;
}

export function drawPoster(ctx: CanvasRenderingContext2D, o: DrawArgs) {
  const theme = THEMES.find((t) => t.key === o.theme) ?? THEMES[0];
  const onBg = readableOn(theme.bg);
  const rc: RC = {
    ctx,
    W: o.W,
    H: o.H,
    photo: o.photo,
    logo: o.logo,
    f: o.fields,
    head: (o.fields.headline || '').trim() && o.fields.uppercase ? o.fields.headline.trim().toUpperCase() : o.fields.headline.trim(),
    bg: theme.bg,
    bgTop: shade(theme.bg, 0.06),
    bgBot: shade(theme.bg, -0.16),
    accent: theme.accent,
    onBg,
    onAccent: readableOn(theme.accent),
    onBgMuted: onBg === WHITE ? rgba(WHITE, 0.8) : rgba(INK, 0.8),
    pad: o.W * 0.07,
    photoPlaceholder: shade(theme.bg, 0.28),
  };
  ctx.clearRect(0, 0, o.W, o.H);
  (PAINTERS[o.template] ?? tplFotoBoven)(rc);
}

/** Compose the final poster and return a PNG data-URL. */
export async function composeToDataUrl(opts: {
  photoUrl: string | null;
  ratio: Ratio;
  fields: PosterFields;
  template: TemplateKey;
  theme: ThemeKey;
}): Promise<string> {
  await ensureFonts();
  const { photoUrl, ratio, fields, template, theme } = opts;
  const photo = photoUrl ? await loadImage(photoUrl).catch(() => null) : null;
  const logo = fields.logo ? await loadImage(fields.logo).catch(() => null) : null;

  const canvas = document.createElement('canvas');
  canvas.width = ratio.w;
  canvas.height = ratio.h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas niet beschikbaar.');
  drawPoster(ctx, { W: ratio.w, H: ratio.h, photo, logo, fields, template, theme });
  return canvas.toDataURL('image/png');
}

/**
 * Re-crop a raster image (e.g. an uploaded poster) to a target ratio with a
 * cover fit — no stretching. Used to reuse an upload on a differently-shaped
 * screen (2:3 abri ↔ 9:16 digital).
 */
export async function imageCoverToRatioDataUrl(src: string, ratio: Ratio): Promise<string> {
  const img = await loadImage(src);
  const canvas = document.createElement('canvas');
  canvas.width = ratio.w;
  canvas.height = ratio.h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas niet beschikbaar.');
  const ir = img.width / img.height;
  const r = ratio.w / ratio.h;
  let dw: number, dh: number, dx: number, dy: number;
  if (ir > r) { dh = ratio.h; dw = ratio.h * ir; dx = (ratio.w - dw) / 2; dy = 0; }
  else { dw = ratio.w; dh = ratio.w / ir; dx = 0; dy = (ratio.h - dh) / 2; }
  ctx.drawImage(img, dx, dy, dw, dh);
  return canvas.toDataURL('image/png');
}

export { ensureFonts };

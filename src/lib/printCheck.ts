/**
 * Real technical print-suitability check for an uploaded creative.
 *
 * It measures only what can be measured reliably in the browser:
 *   - file format & size (from the File object),
 *   - pixel dimensions → aspect-ratio vs A0 (portrait, 1:1.414),
 *   - pixel dimensions → effective print resolution (dpi) at A0 size.
 *
 * It does NOT judge content or municipal rules (offensive imagery, forbidden
 * categories). That cannot be automated reliably and stays a human decision at
 * ESH / the gemeente — the UI says so. Nothing here blocks; every problem is a
 * warning the user may override.
 */

// A0 sheet, portrait.
const A0_W_MM = 841;
const A0_H_MM = 1189;
const MM_PER_INCH = 25.4;
/** height / width = 1.4138… — the A0 portrait ratio we compare against. */
const A0_RATIO = A0_H_MM / A0_W_MM;
/** Target print resolution. Outdoor is viewed from a distance, so 150 dpi is a
 *  comfortable "sharp" bar rather than the 300 dpi of hand-held print. */
const TARGET_DPI = 150;
/** How far the ratio may drift before we flag a crop. ±4%. */
const RATIO_TOLERANCE = 0.04;

/** Pixels needed for TARGET_DPI across an A0 edge of `mm` millimetres. */
function pxForDpi(mm: number, dpi = TARGET_DPI): number {
  return Math.round((mm / MM_PER_INCH) * dpi);
}

/** Ideal A0 pixel size at the target dpi — e.g. 4967 × 7022 at 150 dpi. */
export const A0_TARGET_PX = { w: pxForDpi(A0_W_MM), h: pxForDpi(A0_H_MM) };

export type CheckStatus = 'ok' | 'warn' | 'info';

export interface CheckItem {
  key: 'format' | 'size' | 'ratio' | 'resolution';
  label: string;
  status: CheckStatus;
  detail: string;
}

export interface PrintCheckResult {
  items: CheckItem[];
  /** Raster only: the decoded image as a data-URL, so a checked file is viewable. */
  imageDataUrl?: string;
  width?: number;
  height?: number;
  /** No warnings at all (info items — e.g. an un-measurable PDF — don't count). */
  allOk: boolean;
  /** Something could not be measured (e.g. a PDF's pixels). */
  partial: boolean;
  /** One honest sentence for the summary badge. */
  summary: string;
}

const MIN_SANE_BYTES = 50 * 1024; // < 50 KB → almost certainly too low-res
const MAX_BYTES = 25 * 1024 * 1024; // 25 MB, matches the upload hint

function isPdf(file: File): boolean {
  return file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
}

function isRaster(file: File): boolean {
  return /^image\/(png|jpeg|jpg|webp)$/i.test(file.type) || /\.(png|jpe?g|webp)$/i.test(file.name);
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error('read failed'));
    r.readAsDataURL(file);
  });
}

function decode(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('decode failed'));
    img.src = dataUrl;
  });
}

function fmtBytes(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${Math.round(b / 1024)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

function checkFormat(file: File): CheckItem {
  if (isRaster(file) || isPdf(file)) {
    const kind = isPdf(file) ? 'PDF' : (file.type.split('/')[1] || 'afbeelding').toUpperCase();
    return { key: 'format', label: 'Bestandsformaat', status: 'ok', detail: `${kind} — een bruikbaar formaat voor druk.` };
  }
  return {
    key: 'format',
    label: 'Bestandsformaat',
    status: 'warn',
    detail: `"${file.type || 'onbekend'}" is een ongebruikelijk formaat. Lever bij voorkeur PNG, JPG of PDF aan.`,
  };
}

function checkSize(file: File): CheckItem {
  if (file.size > MAX_BYTES) {
    return { key: 'size', label: 'Bestandsgrootte', status: 'warn', detail: `${fmtBytes(file.size)} — groter dan 25 MB. Comprimeer het bestand of lever het als JPG aan.` };
  }
  if (file.size < MIN_SANE_BYTES) {
    return { key: 'size', label: 'Bestandsgrootte', status: 'warn', detail: `${fmtBytes(file.size)} — erg klein; dat wijst meestal op een te lage kwaliteit voor een A0-poster.` };
  }
  return { key: 'size', label: 'Bestandsgrootte', status: 'ok', detail: `${fmtBytes(file.size)} — prima.` };
}

/** Aspect-ratio vs A0 portrait. Reliable for raster; not measurable for PDF. */
function checkRatio(w: number, h: number): CheckItem {
  const label = 'Verhouding (A0, staand)';
  if (w > h) {
    return {
      key: 'ratio',
      label,
      status: 'warn',
      detail: `Je afbeelding is liggend (${w}×${h}). A0 is staand (1:1.41) — hij wordt flink bijgesneden. Lever een staande afbeelding aan.`,
    };
  }
  const ratio = h / w; // portrait → > 1
  const drift = Math.abs(ratio - A0_RATIO) / A0_RATIO;
  if (drift <= RATIO_TOLERANCE) {
    return { key: 'ratio', label, status: 'ok', detail: `Klopt — ${w}×${h} ≈ 1:${ratio.toFixed(2)}, gelijk aan A0 (1:1.41).` };
  }
  return {
    key: 'ratio',
    label,
    status: 'warn',
    detail: `Je afbeelding is 1:${ratio.toFixed(2)} (${w}×${h}); A0 is staand 1:1.41. Hij wordt bijgesneden om passend te maken — controleer of belangrijke inhoud niet wegvalt.`,
  };
}

/** Effective print resolution at A0. Conservative: the lower of the two edges. */
function checkResolution(w: number, h: number): CheckItem {
  const label = 'Resolutie voor druk op A0';
  const dpiW = w / (A0_W_MM / MM_PER_INCH);
  const dpiH = h / (A0_H_MM / MM_PER_INCH);
  const dpi = Math.round(Math.min(dpiW, dpiH));
  const need = `A0 op ${TARGET_DPI} dpi ≈ ${A0_TARGET_PX.w}×${A0_TARGET_PX.h} px; jouw upload is ${w}×${h} px.`;
  if (dpi >= TARGET_DPI) {
    return { key: 'resolution', label, status: 'ok', detail: `Ruim voldoende — ~${dpi} dpi op A0. ${need}` };
  }
  if (dpi >= 100) {
    return { key: 'resolution', label, status: 'warn', detail: `Aan de krappe kant — ~${dpi} dpi op A0. Buitenreclame wordt van afstand bekeken, dus vaak nog acceptabel, maar 150 dpi is scherper. ${need}` };
  }
  return { key: 'resolution', label, status: 'warn', detail: `Te laag — ~${dpi} dpi op A0; dit wordt waarschijnlijk wazig. ${need}` };
}

function buildSummary(items: CheckItem[]): { allOk: boolean; partial: boolean; summary: string } {
  const hasWarn = items.some((i) => i.status === 'warn');
  const partial = items.some((i) => i.status === 'info');
  const allOk = !hasWarn;
  let summary: string;
  if (hasWarn) summary = 'Aandachtspunten gevonden — je mag het toch aanleveren, maar lees de tips.';
  else if (partial) summary = 'Formaat is oké; verhouding en resolutie zijn voor dit bestandstype niet automatisch te meten.';
  else summary = 'Technisch geschikt voor druk op A0.';
  return { allOk, partial, summary };
}

/**
 * Run the real check. Never throws for a bad image — a decode failure becomes a
 * warning, not a crash.
 */
export async function analyzeUploadForPrint(file: File): Promise<PrintCheckResult> {
  const items: CheckItem[] = [checkFormat(file), checkSize(file)];

  if (isPdf(file)) {
    // A PDF's raster resolution isn't reliably readable in the browser — be honest.
    items.push({
      key: 'ratio',
      label: 'Verhouding (A0, staand)',
      status: 'info',
      detail: 'Niet automatisch te meten voor een PDF. Controleer zelf of het document staand A0 (841×1189 mm) is.',
    });
    items.push({
      key: 'resolution',
      label: 'Resolutie voor druk op A0',
      status: 'info',
      detail: 'Niet automatisch te meten voor een PDF. Zorg dat afbeeldingen erin ~150 dpi op A0-formaat zijn.',
    });
    return { items, ...buildSummary(items) };
  }

  try {
    const dataUrl = await readAsDataUrl(file);
    const img = await decode(dataUrl);
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    items.push(checkRatio(w, h));
    items.push(checkResolution(w, h));
    return { items, imageDataUrl: dataUrl, width: w, height: h, ...buildSummary(items) };
  } catch {
    items.push({
      key: 'ratio',
      label: 'Verhouding & resolutie',
      status: 'warn',
      detail: 'Kon de afbeelding niet uitlezen. Controleer of het een geldige PNG of JPG is.',
    });
    return { items, ...buildSummary(items) };
  }
}

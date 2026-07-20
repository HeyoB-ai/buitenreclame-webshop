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
  key: 'format' | 'colorspace' | 'size' | 'ratio' | 'resolution';
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

/**
 * A print-ready A0 raster (≈ 1×1.5 m, ~35 megapixel at 150 dpi) holds far too
 * much detail to weigh only a few hundred KB — real files are typically several
 * MB. Below this floor the file is almost certainly too light for a sharp print,
 * so it never gets a green "prima". Kept conservative to avoid false alarms on a
 * genuinely high-res but well-compressed file.
 */
const MIN_PRINT_BYTES = 500 * 1024; // 500 KB
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

function rasterKind(file: File): string {
  const t = (file.type.split('/')[1] || '').toUpperCase();
  if (t === 'JPEG') return 'JPG';
  return t || 'afbeelding';
}

/**
 * Format vs ESH's aanleverspec: print wants a PDF (CMYK). PNG/JPG are RGB screen
 * formats, so they are a warning — never a green "prima".
 */
function checkFormat(file: File): CheckItem {
  const label = 'Bestandsformaat';
  if (isPdf(file)) {
    return { key: 'format', label, status: 'ok', detail: 'PDF — het juiste aanleverformaat voor druk.' };
  }
  if (isRaster(file)) {
    return {
      key: 'format',
      label,
      status: 'warn',
      detail: `${rasterKind(file)} is een schermformaat (RGB). Voor druk levert ESH bij voorkeur een PDF in CMYK aan.`,
    };
  }
  return {
    key: 'format',
    label,
    status: 'warn',
    detail: `"${file.type || 'onbekend'}" is een ongebruikelijk formaat. Lever bij voorkeur een PDF (of anders PNG/JPG) aan.`,
  };
}

/**
 * Colour space. A browser decodes every upload to RGB and cannot reliably read
 * whether a file is CMYK, so this is an honest INFO line — never a green
 * "CMYK ✓". Print needs CMYK; screen files (PNG/JPG) are RGB.
 */
function checkColorSpace(file: File): CheckItem {
  const label = 'Kleurruimte (CMYK)';
  if (isPdf(file)) {
    return {
      key: 'colorspace',
      label,
      status: 'info',
      detail: 'Voor druk is CMYK vereist. Of deze PDF in CMYK is opgemaakt, kunnen we in de browser niet lezen — laat je ontwerper of ESH dit bevestigen.',
    };
  }
  return {
    key: 'colorspace',
    label,
    status: 'info',
    detail: 'Voor druk is CMYK vereist. Een PNG of JPG is een RGB-schermbestand; kleuren kunnen op de druk afwijken. Lever bij voorkeur een CMYK-PDF aan.',
  };
}

/**
 * File weight as a print-readiness signal. `resolutionOk` (when known) keeps this
 * consistent with the resolution check: a file that fails on resolution must
 * never show a reassuring green "prima" here.
 */
function checkSize(file: File, resolutionOk?: boolean): CheckItem {
  const label = 'Bestandsgrootte';
  const f = fmtBytes(file.size);
  if (file.size > MAX_BYTES) {
    return { key: 'size', label, status: 'warn', detail: `${f} — groter dan 25 MB. Comprimeer het bestand of lever het als JPG aan.` };
  }
  if (file.size < MIN_PRINT_BYTES) {
    return { key: 'size', label, status: 'warn', detail: `Bestand vrij klein (${f}) — voor scherpe druk op A0 is doorgaans een groter, hoge-resolutiebestand nodig.` };
  }
  if (resolutionOk === false) {
    // Not small in bytes, but the pixels are too few — don't reassure.
    return { key: 'size', label, status: 'warn', detail: `${f} — op zichzelf niet klein, maar de resolutie is te laag voor scherpe A0-druk (zie hieronder).` };
  }
  return { key: 'size', label, status: 'ok', detail: `${f} — voldoende voor druk op A0.` };
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
  else if (partial) summary = 'Geen technische bezwaren gevonden. Let op: kleurruimte (CMYK) en enkele PDF-eigenschappen kunnen we niet automatisch controleren — dit is een indicatie, geen garantie.';
  else summary = 'Technisch geen bezwaren gevonden — een indicatie, geen garantie.';
  return { allOk, partial, summary };
}

/**
 * Run the real check. Never throws for a bad image — a decode failure becomes a
 * warning, not a crash.
 */
export async function analyzeUploadForPrint(file: File): Promise<PrintCheckResult> {
  const format = checkFormat(file);

  const colorspace = checkColorSpace(file);

  if (isPdf(file)) {
    // A PDF's page geometry needs a real PDF library (pdf.js) to read reliably;
    // parsing raw bytes is fragile, so we stay honest and don't guess.
    const items: CheckItem[] = [
      format,
      colorspace,
      checkSize(file), // no pixel resolution to reconcile with for a PDF
      {
        key: 'ratio',
        label: 'Verhouding (A0, staand)',
        status: 'info',
        detail: 'Niet automatisch te meten voor een PDF in de browser. Controleer zelf of het document staand A0 (841×1189 mm) is.',
      },
      {
        key: 'resolution',
        label: 'Resolutie voor druk op A0',
        status: 'info',
        detail: 'Niet automatisch te meten voor een PDF in de browser. Zorg dat afbeeldingen erin ~150 dpi op A0-formaat zijn.',
      },
    ];
    return { items, ...buildSummary(items) };
  }

  try {
    const dataUrl = await readAsDataUrl(file);
    const img = await decode(dataUrl);
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    // Resolution first, so the size check can stay consistent with it.
    const ratio = checkRatio(w, h);
    const resolution = checkResolution(w, h);
    const size = checkSize(file, resolution.status === 'ok');
    const items: CheckItem[] = [format, colorspace, size, ratio, resolution];
    return { items, imageDataUrl: dataUrl, width: w, height: h, ...buildSummary(items) };
  } catch {
    const items: CheckItem[] = [
      format,
      colorspace,
      checkSize(file),
      {
        key: 'ratio',
        label: 'Verhouding & resolutie',
        status: 'warn',
        detail: 'Kon de afbeelding niet uitlezen. Controleer of het een geldige PNG of JPG is.',
      },
    ];
    return { items, ...buildSummary(items) };
  }
}

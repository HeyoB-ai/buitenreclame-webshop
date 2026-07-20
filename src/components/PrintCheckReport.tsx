/**
 * Renders the result of the real technical print-suitability check
 * (analyzeUploadForPrint). Shared by BOTH upload places — tab 1 ("Upload eigen
 * bestand") and tab 3 ("Controleer je bestand") — so every upload is judged the
 * same, honest way: a green/orange summary, one row per measured item, and the
 * explicit note that content approval is a human decision, not this tool's.
 */

import { Check, AlertTriangle, Info, ShieldCheck } from 'lucide-react';
import type { PrintCheckResult } from '../lib/printCheck';

export default function PrintCheckReport({ result }: { result: PrintCheckResult }) {
  const warn = !result.allOk;
  const SummaryIcon = warn ? AlertTriangle : ShieldCheck;
  const summaryCls = warn
    ? 'text-amber-deep bg-amber-soft border-amber-line'
    : 'text-ok bg-ok-soft border-ok-soft';

  return (
    <div className="space-y-3">
      {/* Honest summary — green only when nothing was flagged. */}
      <div className={`text-xs font-semibold flex items-center justify-center gap-1.5 border py-1.5 px-3 rounded-card-sm ${summaryCls}`}>
        <SummaryIcon className="w-4 h-4 shrink-0" />
        <span>{result.summary}</span>
      </div>

      <div className="bg-paper-2 border border-line p-4 rounded-card-sm space-y-3">
        <span className="text-[10px] font-mono uppercase tracking-wider text-mist-2 block border-b border-line pb-2 font-bold">
          Technische indicatie — drukgeschiktheid A0
        </span>

        <div className="space-y-3 text-xs text-left">
          {result.items.map((item) => {
            const Icon = item.status === 'ok' ? Check : item.status === 'warn' ? AlertTriangle : Info;
            const tone = item.status === 'ok' ? 'text-ok' : item.status === 'warn' ? 'text-amber-deep' : 'text-mist-2';
            return (
              <div key={item.key} className="flex items-start gap-2">
                <Icon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${tone}`} />
                <div className="min-w-0">
                  <span className={`font-bold ${tone}`}>{item.label}</span>
                  <p className="text-mist leading-snug">{item.detail}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* The honest boundary: technical only, never content approval. */}
        <div className="flex items-start gap-2 border-t border-line pt-3 text-[11px] text-mist-2 leading-snug text-left">
          <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>
            Dit is een <b>technische indicatie</b> van drukgeschiktheid (formaat, scherpte, kleurruimte) — geen
            garantie. Of de inhoud is toegestaan — denk aan aanstootgevende of verboden categorieën — beoordeelt
            ESH en de gemeente, niet deze tool.
          </span>
        </div>
      </div>
    </div>
  );
}

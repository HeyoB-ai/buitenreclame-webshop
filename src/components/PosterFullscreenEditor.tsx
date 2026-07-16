/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Location } from '../types';
import { X, Check, Sparkles, AlignLeft, AlignCenter, AlignRight, Type, Palette, RotateCcw } from 'lucide-react';
import { motion } from 'motion/react';

export interface PosterDesign {
  id: string;
  title: string;
  subtitle: string;
  bgColor: string;
  textColor: string;
  styleName: string;
  badgeText?: string;
  align: 'left' | 'center' | 'right';
  titleScale: number; // font-size in cqw units (relative to poster width)
}

// Preset styles the user can switch between. Classes are written as literals so
// Tailwind's compiler picks them up (incl. the gradient utilities).
export const POSTER_STYLES: { name: string; bgColor: string; textColor: string }[] = [
  { name: 'Modern kobalt', bgColor: 'bg-gradient-to-br from-blue-900 to-slate-950', textColor: 'text-blue-300' },
  { name: 'Impact geel', bgColor: 'bg-amber-400', textColor: 'text-slate-950' },
  { name: 'Diep zwart', bgColor: 'bg-slate-950', textColor: 'text-white' },
  { name: 'Frisse munt', bgColor: 'bg-gradient-to-br from-emerald-500 to-teal-800', textColor: 'text-white' },
  { name: 'Warm koraal', bgColor: 'bg-gradient-to-br from-rose-500 to-orange-600', textColor: 'text-white' },
  { name: 'Zuiver wit', bgColor: 'bg-white', textColor: 'text-slate-900' },
];

// A bgColor can be a Tailwind class (legacy CSS poster) or an image URL
// (data:/http, e.g. a server-generated poster).
const isImageUrl = (u: string): boolean => u.startsWith('data:') || u.startsWith('http');

// Parse "1080 x 1920 pixels..." / "118.5 x 175 cm..." into an aspect ratio.
function parseAspect(dimensions: string): { w: number; h: number } {
  const m = dimensions.match(/([\d.]+)\s*[x×]\s*([\d.]+)/i);
  if (m) {
    const w = parseFloat(m[1]);
    const h = parseFloat(m[2]);
    if (w > 0 && h > 0) return { w, h };
  }
  return { w: 1185, h: 1750 }; // default: MUPI portrait
}

interface Props {
  location: Location;
  design: PosterDesign;
  onApply: (design: PosterDesign) => void;
  onClose: () => void;
}

export default function PosterFullscreenEditor({ location, design, onApply, onClose }: Props) {
  const [draft, setDraft] = useState<PosterDesign>(design);
  const { w, h } = parseAspect(location.dimensions);

  const update = (patch: Partial<PosterDesign>) => setDraft((d) => ({ ...d, ...patch }));

  const alignClass =
    draft.align === 'left' ? 'text-left items-start' : draft.align === 'right' ? 'text-right items-end' : 'text-center items-center';

  return (
    <div className="fixed inset-0 z-[70] flex flex-col md:flex-row bg-slate-950">
      {/* ---------- POSTER STAGE ---------- */}
      <div className="relative flex-1 min-h-0 flex items-center justify-center p-4 md:p-10 bg-[radial-gradient(circle_at_50%_20%,#1e293b,#020617)]">
        {/* Close (mobile-friendly, always visible) */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 z-10 flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 backdrop-blur px-3 py-2 rounded-full transition-all cursor-pointer"
        >
          <X className="w-4 h-4" /> Sluiten
        </button>

        <motion.div
          key={draft.bgColor + draft.textColor}
          initial={{ opacity: 0.6, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25 }}
          className={`relative rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10 ${isImageUrl(draft.bgColor) ? 'bg-slate-950' : draft.bgColor}`}
          style={{
            aspectRatio: `${w} / ${h}`,
            height: 'min(100%, 82vh)',
            maxWidth: '100%',
            containerType: 'size',
          }}
        >
          {isImageUrl(draft.bgColor) && (
            <img src={draft.bgColor} alt="Gegenereerde poster" className="absolute inset-0 w-full h-full object-cover" />
          )}
          {/* Full poster content, scaled with container-query width units */}
          {!isImageUrl(draft.bgColor) && (
          <div className={`absolute inset-0 flex flex-col justify-between ${alignClass}`} style={{ padding: '7cqw' }}>
            {/* Badge */}
            <div className="w-full flex justify-between items-start" style={{ minHeight: '1px' }}>
              {draft.badgeText ? (
                <span
                  className="bg-blue-600 text-white font-bold rounded shadow uppercase tracking-wide"
                  style={{ fontSize: '2.6cqw', padding: '1cqw 2cqw' }}
                >
                  {draft.badgeText}
                </span>
              ) : (
                <span />
              )}
            </div>

            {/* Headline block */}
            <div className={`flex flex-col ${draft.align === 'left' ? 'items-start' : draft.align === 'right' ? 'items-end' : 'items-center'} gap-[2cqw] w-full`}>
              <h1
                className={`font-extrabold uppercase leading-[0.95] tracking-tight break-words ${draft.textColor}`}
                style={{ fontSize: `${draft.titleScale}cqw`, maxWidth: '100%' }}
              >
                {draft.title || 'Jouw kop hier'}
              </h1>
              {draft.subtitle && (
                <p className={`font-medium leading-snug ${draft.textColor} opacity-90`} style={{ fontSize: '4.2cqw', maxWidth: '90%' }}>
                  {draft.subtitle}
                </p>
              )}
            </div>

            {/* Footer */}
            <div
              className={`w-full flex justify-between items-center ${draft.textColor} opacity-60 border-t border-current/20`}
              style={{ fontSize: '2.4cqw', paddingTop: '2cqw' }}
            >
              <span className="font-mono tracking-wider">GLOBAL BUITENRECLAME</span>
              <span className="font-mono">{location.city.toUpperCase()}</span>
            </div>
          </div>
          )}
        </motion.div>
      </div>

      {/* ---------- EDIT PANEL ---------- */}
      <div className="w-full md:w-[360px] shrink-0 bg-white border-t md:border-t-0 md:border-l border-slate-200 flex flex-col max-h-[46vh] md:max-h-none">
        <div className="p-5 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-1.5 text-xs text-blue-700 font-mono uppercase tracking-wider font-bold">
            <Sparkles className="w-3.5 h-3.5" /> Uiting aanpassen
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Formaat <strong className="text-slate-700">{location.dimensions.split('(')[0].trim()}</strong> · {location.street}, {location.city}
          </p>
        </div>

        <div className="p-5 overflow-y-auto flex-1 space-y-6">
          {/* Titel */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700"><Type className="w-3.5 h-3.5" /> Kop</label>
            <input
              value={draft.title}
              onChange={(e) => update({ title: e.target.value })}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="Bijv. 1+1 GRATIS"
            />
          </div>

          {/* Subtitel */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Onderschrift</label>
            <textarea
              value={draft.subtitle}
              onChange={(e) => update({ subtitle: e.target.value })}
              rows={2}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
              placeholder="Korte, pakkende ondertitel..."
            />
          </div>

          {/* Stijl / kleur */}
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700"><Palette className="w-3.5 h-3.5" /> Stijl & kleur</label>
            <div className="grid grid-cols-3 gap-2">
              {POSTER_STYLES.map((s) => {
                const active = draft.styleName === s.name;
                return (
                  <button
                    key={s.name}
                    onClick={() => update({ bgColor: s.bgColor, textColor: s.textColor, styleName: s.name })}
                    className={`group relative rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${active ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-200 hover:border-slate-300'}`}
                  >
                    <div className={`h-12 w-full ${s.bgColor} flex items-center justify-center`}>
                      <span className={`text-[9px] font-extrabold uppercase ${s.textColor}`}>Aa</span>
                    </div>
                    {active && (
                      <span className="absolute top-1 right-1 bg-blue-500 text-white rounded-full p-0.5"><Check className="w-2.5 h-2.5 stroke-[3]" /></span>
                    )}
                    <span className="block text-[9px] font-semibold text-slate-600 py-1 text-center truncate px-1">{s.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Uitlijning */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700">Uitlijning</label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { v: 'left', Icon: AlignLeft },
                { v: 'center', Icon: AlignCenter },
                { v: 'right', Icon: AlignRight },
              ] as const).map(({ v, Icon }) => (
                <button
                  key={v}
                  onClick={() => update({ align: v })}
                  className={`py-2.5 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${draft.align === v ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
                >
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>

          {/* Titelgrootte */}
          <div className="space-y-2">
            <label className="flex justify-between text-xs font-bold text-slate-700">
              <span>Kopgrootte</span>
              <span className="text-slate-400 font-mono">{Math.round(draft.titleScale)}</span>
            </label>
            <input
              type="range"
              min={8}
              max={22}
              step={1}
              value={draft.titleScale}
              onChange={(e) => update({ titleScale: Number(e.target.value) })}
              className="w-full accent-blue-600 cursor-pointer"
            />
          </div>

          <button
            onClick={() => setDraft(design)}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Wijzigingen terugdraaien
          </button>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 transition-all cursor-pointer"
          >
            Annuleren
          </button>
          <button
            onClick={() => onApply(draft)}
            className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold bg-blue-700 hover:bg-blue-600 text-white shadow-xs transition-all cursor-pointer"
          >
            Aanpassingen bewaren
          </button>
        </div>
      </div>
    </div>
  );
}

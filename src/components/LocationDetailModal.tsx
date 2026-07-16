/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { lazy, Suspense } from 'react';
import { Location } from '../types';
import { X, MapPin, Users, Maximize2, ShieldAlert, FileText, CalendarRange, Eye, Plus, Check } from 'lucide-react';

// maplibre-gl is heavy → lazy-load the mini-map so it stays out of the main bundle.
const ScreenMiniMap = lazy(() => import('./ScreenMiniMap'));

interface LocationDetailModalProps {
  location: Location;
  onClose: () => void;
  onToggleCart: (location: Location) => void;
  isInCart: boolean;
}

export default function LocationDetailModal({
  location,
  onClose,
  onToggleCart,
  isInCart
}: LocationDetailModalProps) {
  const hasCoords =
    typeof location.lat === 'number' &&
    typeof location.lng === 'number' &&
    !(location.lat === 0 && location.lng === 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dark Backdrop */}
      <div
        className="absolute inset-0 bg-ink/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative bg-white border border-line rounded-card overflow-hidden shadow-soft-lg max-w-4xl w-full max-h-[90vh] flex flex-col md:flex-row animate-in fade-in zoom-in-95 duration-200">

        {/* Left Side: Visuals, Photo, Coordinates Map */}
        <div className="md:w-5/12 bg-paper-2 flex flex-col relative border-b md:border-b-0 md:border-r border-line">
          <div className="relative h-48 md:h-64">
            <img
              src={location.image}
              alt={location.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-night via-transparent to-transparent opacity-85" />

            <button
              onClick={onClose}
              className="absolute top-4 right-4 bg-white/85 backdrop-blur-xs text-mist hover:text-ink p-2 rounded-full border border-line transition-all cursor-pointer shadow-soft"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Media badge */}
            <span className={`absolute bottom-4 left-4 text-[10px] font-bold font-mono uppercase tracking-wider px-2.5 py-1 rounded-full shadow ${
              location.type === 'digital' ? 'bg-cobalt text-white' : 'bg-ink text-white'
            }`}>
              {location.type === 'digital' ? 'Digitaal Scherm' : 'Klassieke Abri (Gedrukt)'}
            </span>
          </div>

          {/* Mini-Radar Intersection Map */}
          <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
            <div className="space-y-1.5">
              <h4 className="text-sm font-bold text-ink flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-cobalt" />
                <span>Waar hangt dit scherm?</span>
              </h4>
              <p className="text-xs text-mist leading-relaxed">
                In <strong className="text-ink">{location.city}</strong>, bij <strong className="text-ink">{location.street}</strong>.
              </p>
            </div>

            {/* Real static mini-map on the screen's actual coordinates */}
            {hasCoords ? (
              <div className="space-y-1.5">
                <Suspense fallback={<div className="h-28 bg-paper-2 rounded-card-sm border border-line flex items-center justify-center text-[11px] text-mist-2">Kaartje laden…</div>}>
                  <ScreenMiniMap lat={location.lat!} lng={location.lng!} />
                </Suspense>
                <p className="text-[10px] font-mono text-mist-2">
                  {location.lat!.toFixed(5)} N, {location.lng!.toFixed(5)} O
                </p>
              </div>
            ) : (
              <p className="text-xs text-mist">Locatie: <strong className="text-ink">{location.city}</strong></p>
            )}

            {/* Price block */}
            <div className="flex items-center justify-between p-3 bg-white border border-line rounded-card-sm shadow-soft">
              <div>
                <span className="text-[10px] font-mono text-mist-2 block uppercase leading-none font-bold">Prijs</span>
                <span className="text-xl font-black text-amber-deep font-mono">€{location.price}</span>
                <span className="text-[10px] text-mist"> / week ex. btw</span>
              </div>
              <button
                onClick={() => onToggleCart(location)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  isInCart
                    ? 'bg-ok-soft text-ok border border-ok-soft'
                    : 'bg-cobalt hover:bg-cobalt-deep text-white shadow-soft'
                }`}
              >
                {isInCart ? (
                  <>
                    <Check className="w-3.5 h-3.5 shrink-0" />
                    <span>In winkelmand</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5 shrink-0" />
                    <span>Boeken</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Full Descriptions, Technical Specifications & Guidelines */}
        <div className="md:w-7/12 p-6 md:p-8 flex flex-col justify-between overflow-y-auto max-h-[90vh]">
          <div className="space-y-6">
            {/* Header */}
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-xs text-cobalt font-mono uppercase tracking-widest font-bold">
                <span>{location.city}</span>
                <span>•</span>
                <span>{location.neighborhood}</span>
              </div>
              <h2 className="text-2xl font-black text-ink leading-tight font-sans">
                {location.name}
              </h2>
              <p className="text-xs text-mist-2 font-mono">ID: {location.id.toUpperCase()}</p>
            </div>

            {/* Core Metrics Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-paper-2 p-3 rounded-card-sm border border-line-2 space-y-1">
                <div className="flex items-center gap-1 text-mist-2">
                  <Users className="w-3.5 h-3.5 text-cobalt" />
                  <span className="text-[10px] font-mono uppercase font-bold tracking-wider">Bereik</span>
                </div>
                <p className="text-sm font-bold text-ink">{location.reach.toLocaleString('nl-NL')} <span className="text-[10px] font-normal text-mist-2">p.w.</span></p>
              </div>

              <div className="bg-paper-2 p-3 rounded-card-sm border border-line-2 space-y-1">
                <div className="flex items-center gap-1 text-mist-2">
                  <Maximize2 className="w-3.5 h-3.5 text-cobalt" />
                  <span className="text-[10px] font-mono uppercase font-bold tracking-wider">Formaat</span>
                </div>
                <p className="text-xs font-bold text-ink line-clamp-1" title={location.dimensions}>
                  {location.dimensions}
                </p>
              </div>

              <div className="bg-paper-2 p-3 rounded-card-sm border border-line-2 space-y-1">
                <div className="flex items-center gap-1 text-mist-2">
                  <Eye className="w-3.5 h-3.5 text-cobalt" />
                  <span className="text-[10px] font-mono uppercase font-bold tracking-wider">Zichtbaarheid</span>
                </div>
                <p className="text-[10px] font-semibold text-ink line-clamp-1" title={location.visibility}>
                  {location.visibility}
                </p>
              </div>
            </div>

            {/* Description Section (Solves Point #4) */}
            <div className="space-y-2">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-mist-2">
                Over deze plek
              </h3>
              <div className="bg-paper-2 p-4 rounded-card-sm border border-line-2 space-y-3">
                <p className="text-xs sm:text-sm text-mist leading-relaxed font-sans">
                  {location.description}
                </p>
                <div className="text-xs text-mist border-t border-line pt-3">
                  <strong className="text-ink">Typische omgeving:</strong> {location.environment}
                </div>
              </div>
            </div>

            {/* Technical specs & Guidelines Section (Solves Point #5) */}
            <div className="space-y-3">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-mist-2 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-cobalt" />
                <span>Goed om te weten</span>
              </h3>

              <div className="space-y-2.5">
                {/* Formats */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 text-xs">
                  <span className="sm:col-span-4 font-semibold text-mist">Toegestane formaten:</span>
                  <div className="sm:col-span-8 flex flex-wrap gap-1.5">
                    {location.specs.formats.map((f, idx) => (
                      <span key={idx} className="bg-white border border-line px-2 py-0.5 rounded text-[10px] font-mono text-mist shadow-soft">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Text density */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 text-xs">
                  <span className="sm:col-span-4 font-semibold text-mist">Tekstdichtheid:</span>
                  <span className="sm:col-span-8 text-ink">
                    {location.specs.maxTextDensity}
                  </span>
                </div>

                {/* Delivery deadline */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 text-xs">
                  <span className="sm:col-span-4 font-semibold text-mist flex items-center gap-1">
                    <CalendarRange className="w-3.5 h-3.5 text-cobalt" />
                    <span>Aanlevering:</span>
                  </span>
                  <span className="sm:col-span-8 text-ink font-medium">
                    {location.specs.deadline}
                  </span>
                </div>

                {/* Restrictions - Red card section */}
                <div className="bg-red-50 border border-red-100 p-3.5 rounded-card-sm space-y-2 mt-2">
                  <div className="flex items-center gap-2 text-red-700 text-xs font-semibold">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>Restricties & verboden categorieën</span>
                  </div>
                  <ul className="list-disc pl-4 space-y-1 text-[11px] text-mist leading-normal">
                    {location.specs.restrictions.map((r, idx) => (
                      <li key={idx}>
                        {r}
                      </li>
                    ))}
                    <li>Geen uitingen strijdig met de wet of goede zeden conform Nederlandse Reclame Code.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Action */}
          <div className="pt-6 border-t border-line-2 mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-full text-xs font-semibold bg-white hover:bg-paper-2 border border-line text-mist transition-all cursor-pointer shadow-soft"
            >
              Sluit specificaties
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

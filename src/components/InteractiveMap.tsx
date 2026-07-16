/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Location } from '../types';
import { MapPin, Info, Users, Euro, Sparkles } from 'lucide-react';

interface InteractiveMapProps {
  locations: Location[];
  selectedLocation: Location | null;
  onSelectLocation: (location: Location) => void;
  recommendedIds: string[];
}

export default function InteractiveMap({
  locations,
  selectedLocation,
  onSelectLocation,
  recommendedIds
}: InteractiveMapProps) {
  const [hoveredLocation, setHoveredLocation] = useState<Location | null>(null);

  return (
    <div className="relative w-full h-[450px] bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-inner flex flex-col">
      {/* Map Header */}
      <div className="absolute top-4 left-4 z-10 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/50 flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
        <span className="text-xs font-mono text-slate-300 font-medium">Interactieve campagnekaart</span>
      </div>

      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 z-10 bg-slate-900/90 backdrop-blur-md p-3 rounded-xl border border-slate-700/50 space-y-2 max-w-[200px]">
        <span className="text-[10px] font-mono tracking-wider uppercase text-slate-400 block mb-1">Legenda</span>
        <div className="flex items-center gap-2 text-xs text-slate-200">
          <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-500 border border-white/20" />
          <span>Digitaal scherm</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-200">
          <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 border border-white/20" />
          <span>Abri (gedrukt)</span>
        </div>
        <div className="flex items-center gap-1 text-[10px] font-medium text-blue-400 bg-blue-950/40 border border-blue-900/50 px-1.5 py-0.5 rounded-md mt-1">
          <Sparkles className="w-3 h-3 text-blue-400 shrink-0" />
          <span>Aanbevolen voor jou</span>
        </div>
      </div>

      {/* SVG Canvas Map */}
      <div className="relative flex-1 w-full h-full cursor-grab active:cursor-grabbing">
        {/* Abstract Stylized Blueprint Grid & Background elements */}
        <svg
          className="absolute inset-0 w-full h-full select-none"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {/* Subtle Grid Lines */}
          <defs>
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(51, 65, 85, 0.15)" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#grid)" />

          {/* Abstract City Elements (Canals, Roads, Parks) */}
          {/* Waterways / River */}
          <path
            d="M -10 20 Q 25 35 50 20 T 110 50"
            fill="none"
            stroke="#1e293b"
            strokeWidth="8"
            strokeLinecap="round"
            opacity="0.4"
          />
          <path
            d="M 30 100 Q 40 60 50 20"
            fill="none"
            stroke="#1e293b"
            strokeWidth="4"
            strokeLinecap="round"
            opacity="0.3"
          />

          {/* Abstract ring roads */}
          <circle cx="50" cy="50" r="35" fill="none" stroke="rgba(148, 163, 184, 0.05)" strokeWidth="3" />
          <circle cx="50" cy="50" r="20" fill="none" stroke="rgba(148, 163, 184, 0.04)" strokeWidth="2" />

          {/* Major thoroughfares */}
          <line x1="0" y1="50" x2="100" y2="50" stroke="rgba(148, 163, 184, 0.08)" strokeWidth="1.5" />
          <line x1="50" y1="0" x2="50" y2="100" stroke="rgba(148, 163, 184, 0.08)" strokeWidth="1.5" />
          <line x1="10" y1="10" x2="90" y2="90" stroke="rgba(148, 163, 184, 0.05)" strokeWidth="1" strokeDasharray="2,2" />
          <line x1="10" y1="90" x2="90" y2="10" stroke="rgba(148, 163, 184, 0.05)" strokeWidth="1" strokeDasharray="2,2" />

          {/* Districts (shaded zones) */}
          <rect x="5" y="15" width="20" height="15" rx="3" fill="rgba(148, 163, 184, 0.03)" />
          <rect x="70" y="30" width="25" height="20" rx="3" fill="rgba(148, 163, 184, 0.03)" />
          <rect x="15" y="65" width="22" height="18" rx="3" fill="rgba(148, 163, 184, 0.03)" />
          <rect x="65" y="70" width="20" height="20" rx="3" fill="rgba(148, 163, 184, 0.03)" />
        </svg>

        {/* Location Pins */}
        {locations.map((loc) => {
          const isSelected = selectedLocation?.id === loc.id;
          const isRecommended = recommendedIds.includes(loc.id);
          const isDigital = loc.type === 'digital';

          return (
            <button
              key={loc.id}
              id={`pin-${loc.id}`}
              onClick={() => onSelectLocation(loc)}
              onMouseEnter={() => setHoveredLocation(loc)}
              onMouseLeave={() => setHoveredLocation(null)}
              className="absolute group transition-all duration-300 transform -translate-x-1/2 -translate-y-1/2 focus:outline-none"
              style={{
                left: `${loc.coordinates.x}%`,
                top: `${loc.coordinates.y}%`,
                zIndex: isSelected ? 40 : hoveredLocation?.id === loc.id ? 30 : isRecommended ? 20 : 10,
              }}
            >
              {/* Outer Glow for selection or recommendation */}
              <span
                className={`absolute inset-0 rounded-full scale-[2.2] transition-all duration-300 ${
                  isSelected
                    ? 'bg-blue-500/30 animate-ping'
                    : isRecommended
                    ? 'bg-blue-400/20 group-hover:scale-[2.5]'
                    : 'bg-transparent group-hover:bg-slate-700/20 group-hover:scale-[1.8]'
                }`}
              />

              {/* Pin Ring & Core */}
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 border-2 ${
                  isSelected
                    ? 'scale-110 bg-slate-900 border-blue-500 shadow-lg shadow-blue-500/40 text-blue-400'
                    : isRecommended
                    ? 'bg-slate-950 border-blue-400 shadow-md shadow-blue-400/20 text-blue-300'
                    : 'bg-slate-900 border-slate-600 hover:border-slate-400 text-slate-300'
                }`}
              >
                {/* Custom graphic inside pins */}
                {isDigital ? (
                  <div
                    className={`w-2.5 h-2.5 rounded-xs rotate-45 transition-colors ${
                      isSelected
                        ? 'bg-gradient-to-tr from-cyan-400 to-blue-500 animate-pulse'
                        : isRecommended
                        ? 'bg-gradient-to-tr from-cyan-400 to-blue-500'
                        : 'bg-slate-400 group-hover:bg-cyan-400'
                    }`}
                  />
                ) : (
                  <div
                    className={`w-2.5 h-2.5 rounded-full transition-colors ${
                      isSelected
                        ? 'bg-gradient-to-tr from-amber-400 to-orange-500 animate-pulse'
                        : isRecommended
                        ? 'bg-gradient-to-tr from-amber-400 to-orange-500'
                        : 'bg-slate-400 group-hover:bg-amber-400'
                    }`}
                  />
                )}
              </div>

              {/* Small recommendation star icon */}
              {isRecommended && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white rounded-full p-0.5 shadow-md border border-blue-400">
                  <Sparkles className="w-2.5 h-2.5" />
                </span>
              )}

              {/* Small abbreviation badge of city */}
              <span className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 bg-slate-950/80 backdrop-blur-xs text-[9px] font-mono font-medium text-slate-400 px-1 py-0.5 rounded border border-slate-800/80 whitespace-nowrap pointer-events-none group-hover:text-slate-200">
                {loc.city.substring(0, 3).toUpperCase()}
              </span>
            </button>
          );
        })}

        {/* Hover / Active Tooltip popup on the map */}
        {(hoveredLocation || selectedLocation) && (
          <div
            className="absolute top-4 right-4 z-20 bg-slate-900/95 backdrop-blur-md p-4 rounded-xl border border-slate-700/80 shadow-2xl max-w-xs animate-in fade-in zoom-in-95 duration-150"
          >
            {(() => {
              const displayLoc = hoveredLocation || selectedLocation;
              if (!displayLoc) return null;
              const isRecommended = recommendedIds.includes(displayLoc.id);
              return (
                <div className="space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <span
                      className={`text-[9px] font-mono font-semibold uppercase px-1.5 py-0.5 rounded ${
                        displayLoc.type === 'digital'
                          ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {displayLoc.type === 'digital' ? 'Digitaal Scherm' : 'Abri (Gedrukt)'}
                    </span>
                    {isRecommended && (
                      <span className="text-[9px] bg-blue-950/80 text-blue-400 font-medium px-1.5 py-0.5 rounded border border-blue-900 flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" /> Aanbevolen
                      </span>
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-white leading-tight font-sans">
                      {displayLoc.name}
                    </h4>
                    <p className="text-xs text-slate-400">
                      {displayLoc.street}, <strong className="text-slate-300">{displayLoc.city}</strong>
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium italic mt-0.5">
                      {displayLoc.neighborhood}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1 text-slate-400">
                      <Users className="w-3.5 h-3.5 text-slate-500" />
                      <span>{displayLoc.reach.toLocaleString('nl-NL')} p.w.</span>
                    </div>
                    <div className="flex items-center gap-1 text-emerald-400 font-semibold font-mono">
                      <Euro className="w-3.5 h-3.5 text-emerald-500" />
                      <span>€{displayLoc.price} <span className="text-[10px] text-slate-400 font-normal">/wk</span></span>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-400 leading-relaxed font-sans line-clamp-2 italic pt-1">
                    "{displayLoc.description}"
                  </p>

                  <div className="text-[10px] text-slate-500 font-mono text-right mt-1">
                    Klik voor detailpagina & specs →
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}

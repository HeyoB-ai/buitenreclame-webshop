/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Location } from '../types';
import { MapPin, Users, Euro, Info, Plus, Check, Sparkles } from 'lucide-react';

interface LocationCardProps {
  location: Location;
  isRecommended: boolean;
  isInCart: boolean;
  onViewDetails: (location: Location) => void;
  onToggleCart: (location: Location) => void;
  targetAudienceName?: string;
}

export default function LocationCard({
  location,
  isRecommended,
  isInCart,
  onViewDetails,
  onToggleCart,
  targetAudienceName
}: LocationCardProps) {
  // Generate a random-looking but stable match percentage based on the location id length
  const matchPercentage = 85 + (location.name.length % 15);

  return (
    <div
      id={`card-${location.id}`}
      className={`bg-white border rounded-2xl overflow-hidden transition-all duration-300 flex flex-col justify-between shadow-xs ${
        isInCart
          ? 'border-blue-500 ring-2 ring-blue-500/10'
          : isRecommended
          ? 'border-slate-200 hover:border-blue-500 shadow-sm hover:shadow-md'
          : 'border-slate-200 hover:border-slate-300 shadow-2xs'
      }`}
    >
      {/* Location Image & Badges */}
      <div className="relative h-48 overflow-hidden bg-slate-950 group">
        <img
          src={location.image}
          alt={location.name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-90" />

        {/* Media Format Type Badge */}
        <div className="absolute top-3 left-3 flex gap-1.5 z-10">
          <span
            className={`text-[10px] font-bold font-mono uppercase tracking-wider px-2 py-1 rounded-md shadow-xs border ${
              location.type === 'digital'
                ? 'bg-cyan-50 text-cyan-800 border-cyan-200'
                : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}
          >
            {location.type === 'digital' ? 'Digitaal' : 'Abri'}
          </span>
        </div>

        {/* Personalized AI Match badge */}
        {isRecommended && (
          <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-blue-700 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-xs">
            <Sparkles className="w-3 h-3 animate-pulse" />
            <span>{matchPercentage}% MATCH ({targetAudienceName})</span>
          </div>
        )}

        {/* Street & City Banner */}
        <div className="absolute bottom-3 left-3 right-3 text-white">
          <p className="text-xs font-mono font-medium tracking-wide text-blue-300 uppercase">
            {location.neighborhood}
          </p>
          <h3 className="text-base font-bold leading-tight font-sans text-ellipsis line-clamp-1">
            {location.street}
          </h3>
          <p className="text-xs font-semibold text-slate-200">
            {location.city}
          </p>
        </div>
      </div>

      {/* Card Content & Stats */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
        {/* Short details */}
        <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
          {location.description}
        </p>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs">
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono text-slate-400 block uppercase font-semibold">Bereik p.w.</span>
            <div className="flex items-center gap-1 text-slate-700 font-bold">
              <Users className="w-3.5 h-3.5 text-blue-700" />
              <span>{location.reach.toLocaleString('nl-NL')}</span>
            </div>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] font-mono text-slate-400 block uppercase font-semibold">Kosten p.w.</span>
            <div className="flex items-center gap-0.5 text-emerald-700 font-bold font-mono">
              <Euro className="w-3.5 h-3.5 text-emerald-600" />
              <span>€{location.price}</span>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
          <button
            onClick={() => onViewDetails(location)}
            className="flex items-center justify-center gap-1 py-2.5 rounded-xl text-xs bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold transition-all shadow-2xs cursor-pointer"
          >
            <Info className="w-3.5 h-3.5" />
            <span>Specificaties</span>
          </button>

          <button
            onClick={() => onToggleCart(location)}
            className={`flex items-center justify-center gap-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              isInCart
                ? 'bg-emerald-50 text-emerald-700 hover:bg-red-50 hover:text-red-700 border border-emerald-200 hover:border-red-250 shadow-2xs'
                : 'bg-blue-700 hover:bg-blue-600 text-white shadow-xs'
            }`}
          >
            {isInCart ? (
              <>
                <Check className="w-3.5 h-3.5 shrink-0 animate-in fade-in zoom-in-50 duration-200" />
                <span>Geboekt</span>
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
  );
}

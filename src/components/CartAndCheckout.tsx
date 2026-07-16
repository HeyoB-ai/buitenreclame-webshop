/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CartItem, Location } from '../types';
import { ShoppingBag, Calendar, Euro, FileCheck, HelpCircle, ArrowLeft, Send, Sparkles, Building, Mail, Phone, User, CheckCircle, FileText, Download, Maximize2, Copy } from 'lucide-react';
import { motion } from 'motion/react';
import PosterFullscreenEditor, { PosterDesign } from './PosterFullscreenEditor';
import PosterEditor from './PosterEditor';

interface CartAndCheckoutProps {
  cartItems: CartItem[];
  onRemoveItem: (locationId: string) => void;
  onConfigureCreative: (location: Location) => void;
  onUpdateCreative: (locationId: string, creative: CartItem['creative']) => void;
  onApplyToAll: (creative: CartItem['creative'], ratioType: Location['type']) => void;
  onBackToLocations: () => void;
  onClearCart: () => void;
}

// A creative's previewUrl can be either a Tailwind bg class (legacy CSS poster)
// or an actual image URL (data:/http, e.g. a server-generated poster).
const isImageUrl = (u?: string): boolean => !!u && (u.startsWith('data:') || u.startsWith('http'));

// Reconstruct an editable PosterDesign from a saved AI-generated creative.
function creativeToDesign(locationId: string, creative: NonNullable<CartItem['creative']>): PosterDesign {
  return {
    id: 'cart-' + locationId,
    title: creative.title ?? '',
    subtitle: creative.subtitle ?? '',
    bgColor: creative.previewUrl ?? 'bg-slate-950',
    textColor: creative.textColor ?? 'text-white',
    styleName: creative.styleName ?? 'Aangepast',
    align: creative.align ?? 'center',
    titleScale: creative.titleScale ?? 14,
    badgeText: creative.badgeText,
  };
}

export default function CartAndCheckout({
  cartItems,
  onRemoveItem,
  onConfigureCreative,
  onUpdateCreative,
  onApplyToAll,
  onBackToLocations,
  onClearCart
}: CartAndCheckoutProps) {
  // Location id whose saved poster is being previewed/edited fullscreen
  const [fullscreenLocationId, setFullscreenLocationId] = useState<string | null>(null);
  const [isOrdered, setIsOrdered] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [startDate, setStartDate] = useState('2026-08-03'); // Default to a realistic Monday in the future

  const [orderNumber] = useState(() => 'GBR-' + Math.floor(100000 + Math.random() * 900000));

  // Totals calculations
  const totalWeeks = cartItems.reduce((acc, item) => acc + item.weeks, 0);
  const totalSubtotal = cartItems.reduce((acc, item) => acc + (item.location.price * item.weeks), 0);
  const vatAmount = totalSubtotal * 0.21;
  const totalCost = totalSubtotal + vatAmount;

  // Check if all items have configured creatives
  const missingCreatives = cartItems.filter(item => !item.creative);

  const handleSubmitCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) return;
    setIsOrdered(true);
  };

  if (isOrdered) {
    return (
      <div className="max-w-2xl mx-auto bg-white border border-line rounded-card p-8 shadow-soft-lg space-y-8 text-center animate-in fade-in zoom-in-95 duration-200">
        <div className="w-20 h-20 bg-ok-soft rounded-full flex items-center justify-center mx-auto border border-ok-soft">
          <CheckCircle className="w-10 h-10 text-ok" />
        </div>

        <div className="space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-ok-soft text-ok rounded-full border border-ok-soft text-xs font-mono font-bold">
            <span>Boeking bevestigd</span>
          </div>
          <h2 className="text-3xl font-black text-ink tracking-tight">Gefeliciteerd, {contactName || 'ondernemer'}!</h2>
          <p className="text-mist text-sm max-w-md mx-auto">
            Jouw campagne-aanvraag is met succes ontvangen en doorgestuurd naar onze planners. We nemen binnen 4 uur contact met je op.
          </p>
        </div>

        {/* Campaign summary card */}
        <div className="bg-paper-2 border border-line rounded-card-sm p-6 text-left space-y-4 max-w-md mx-auto">
          <div className="flex justify-between items-center border-b border-line pb-3">
            <span className="text-xs font-mono text-mist-2 uppercase font-bold">Referentienummer</span>
            <span className="text-sm font-bold text-cobalt font-mono">{orderNumber}</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-mist font-semibold">Bedrijf:</span>
              <span className="text-ink font-bold">{companyName || 'Eigen onderneming'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-mist font-semibold">Verwachte startdatum:</span>
              <span className="text-ink font-bold">{startDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-mist font-semibold">Locaties geboekt:</span>
              <span className="text-ink font-bold">{cartItems.length} formaten gecombineerd</span>
            </div>
            <div className="flex justify-between">
              <span className="text-mist font-semibold">Campagnetotaal:</span>
              <span className="text-amber-deep font-black font-mono text-xs">€{totalCost.toFixed(2)} (incl. 21% BTW)</span>
            </div>
          </div>

          <div className="bg-cobalt-soft border border-cobalt-soft p-3 rounded-card-sm flex items-start gap-2 text-[11px] text-cobalt leading-normal font-medium">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>Onze AI-modellen hebben je geüploade/ontworpen creaties voorbereid voor de specifieke resoluties van elke locatie.</span>
          </div>
        </div>

        {/* Download actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <button
            onClick={() => {
              // Simulated download
              alert('Simulatie: downloaden van jouw offerte & mediaplan-PDF...');
            }}
            className="flex items-center justify-center gap-1.5 px-5 py-3 rounded-full text-xs font-bold bg-white hover:bg-paper-2 border border-line text-mist transition-all cursor-pointer shadow-soft"
          >
            <Download className="w-4 h-4" />
            <span>Download mediaplan (PDF)</span>
          </button>

          <button
            onClick={() => {
              onClearCart();
              onBackToLocations();
            }}
            className="flex items-center justify-center gap-1.5 px-5 py-3 rounded-full text-xs font-bold bg-cobalt hover:bg-cobalt-deep text-white transition-all cursor-pointer shadow-soft"
          >
            <span>Nieuwe campagne opstarten</span>
          </button>
        </div>
      </div>
    );
  }

  const fullscreenItem = cartItems.find((i) => i.location.id === fullscreenLocationId);

  return (
    <div className="space-y-6">
      {/* Live editor for a saved AI creative — uses the real template composer so
          every field/theme/template change re-renders the poster immediately. */}
      {fullscreenItem?.creative?.type === 'ai-generated' && fullscreenItem.creative.poster && (
        <PosterEditor
          location={fullscreenItem.location}
          payload={fullscreenItem.creative.poster}
          onClose={() => setFullscreenLocationId(null)}
          onApply={(payload, previewUrl) => {
            onUpdateCreative(fullscreenItem.location.id, {
              ...fullscreenItem.creative,
              type: 'ai-generated',
              previewUrl,
              poster: payload,
              title: payload.fields.headline.trim() || 'AI-poster',
              subtitle: payload.fields.subline.trim() || payload.fields.offer.trim() || fullscreenItem.creative?.subtitle || '',
            });
            setFullscreenLocationId(null);
          }}
        />
      )}

      {/* Fallback: legacy CSS-poster editor for older creatives without a design payload */}
      {fullscreenItem?.creative?.type === 'ai-generated' && !fullscreenItem.creative.poster && (
        <PosterFullscreenEditor
          location={fullscreenItem.location}
          design={creativeToDesign(fullscreenItem.location.id, fullscreenItem.creative)}
          onClose={() => setFullscreenLocationId(null)}
          onApply={(updated) => {
            onUpdateCreative(fullscreenItem.location.id, {
              ...fullscreenItem.creative,
              type: 'ai-generated',
              title: updated.title,
              subtitle: updated.subtitle,
              previewUrl: updated.bgColor,
              textColor: updated.textColor,
              styleName: updated.styleName,
              align: updated.align,
              titleScale: updated.titleScale,
              badgeText: updated.badgeText,
            });
            setFullscreenLocationId(null);
          }}
        />
      )}

      {/* Back button */}
      <button
        onClick={onBackToLocations}
        className="inline-flex items-center gap-1.5 text-xs text-mist hover:text-ink cursor-pointer font-bold"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Terug naar locaties</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Cart Item list */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex justify-between items-baseline">
            <h2 className="text-xl font-bold text-ink flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-cobalt" />
              <span>Jouw geselecteerde campagne</span>
            </h2>
            <span className="text-xs text-mist-2 font-mono">{cartItems.length} locaties geselecteerd</span>
          </div>

          {cartItems.length > 0 && (
            <p className="text-[11px] text-mist-2 bg-paper-2 border border-line rounded-card-sm px-3 py-2 leading-relaxed">
              Je gemaakte uitingen blijven bewaard zolang deze sessie open is, en je kunt ze op meerdere schermen hergebruiken. Echt opslaan over sessies (met een account) komt later.
            </p>
          )}

          {cartItems.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-card border border-line space-y-4 shadow-soft">
              <ShoppingBag className="w-12 h-12 text-mist-2 mx-auto" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-ink">Winkelmand is nog leeg</p>
                <p className="text-xs text-mist">Voeg een abri of digitaal scherm toe uit onze aanbevelingen om te starten.</p>
              </div>
              <button
                onClick={onBackToLocations}
                className="px-4 py-2 bg-cobalt hover:bg-cobalt-deep text-white rounded-full text-xs font-bold transition-all cursor-pointer"
              >
                Locaties bekijken
              </button>
            </div>
          ) : (
            <div className="space-y-3.5">
              {cartItems.map((item) => (
                <div
                  key={item.location.id}
                  className="bg-white border border-line p-4 sm:p-5 rounded-card shadow-soft space-y-4 relative"
                >
                  {/* Top line street & city */}
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <span className={`text-[9px] font-bold font-mono uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        item.location.type === 'digital' ? 'bg-cobalt text-white' : 'bg-ink text-white'
                      }`}>
                        {item.location.type === 'digital' ? 'Digitaal Scherm' : 'Klassieke Abri'}
                      </span>
                      <h4 className="text-sm font-bold text-ink leading-tight mt-1.5">
                        {item.location.street}, {item.location.city}
                      </h4>
                      <p className="text-[11px] text-mist-2 font-bold italic mt-0.5">
                        {item.location.neighborhood}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-mono text-mist-2 block uppercase font-bold">Basisprijs p.w.</span>
                      <span className="text-sm font-bold text-amber-deep font-mono">€{item.location.price}</span>
                    </div>
                  </div>

                  {/* Middle section: Creative status */}
                  <div className="bg-paper-2 p-3 rounded-card-sm border border-line-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Poster thumbnail for any creative that carries an image */}
                      {item.creative?.previewUrl && isImageUrl(item.creative.previewUrl) ? (
                        <button
                          type="button"
                          onClick={item.creative.type === 'ai-generated' ? () => setFullscreenLocationId(item.location.id) : undefined}
                          disabled={item.creative.type !== 'ai-generated'}
                          title={item.creative.type === 'ai-generated' ? 'Beeldvullend bekijken & aanpassen' : item.creative.title}
                          className="group relative w-11 h-16 shrink-0 rounded-md overflow-hidden shadow ring-1 ring-black/5 bg-paper-2 cursor-pointer disabled:cursor-default"
                          style={{ backgroundImage: `url("${item.creative.previewUrl}")`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                        >
                          {item.creative.type === 'ai-generated' && (
                            <span className="absolute inset-0 bg-black/0 group-hover:bg-black/30 flex items-center justify-center transition-colors">
                              <Maximize2 className="w-3 h-3 text-white opacity-0 group-hover:opacity-100" />
                            </span>
                          )}
                        </button>
                      ) : (
                        <FileText className={`w-4 h-4 shrink-0 ${item.creative ? 'text-ok' : 'text-amber-deep'}`} />
                      )}
                      <div className="min-w-0">
                        <span className="font-bold text-mist block">Campagnemateriaal (Creatie)</span>
                        {item.creative ? (
                          <span className="text-[10px] text-ok font-bold flex items-center gap-1">
                            <CheckCircle className="w-3 h-3 shrink-0" />
                            <span className="truncate">{item.creative.title} ({item.creative.subtitle})</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-amber-deep font-bold">Nog geen creatie gekoppeld</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {item.creative?.type === 'ai-generated' && (
                        <button
                          onClick={() => setFullscreenLocationId(item.location.id)}
                          className="px-3 py-1.5 rounded-full font-bold text-[11px] cursor-pointer transition-all bg-cobalt-soft hover:bg-cobalt-soft text-cobalt border border-cobalt-soft flex items-center gap-1"
                        >
                          <Maximize2 className="w-3 h-3 shrink-0" />
                          <span>Bekijken</span>
                        </button>
                      )}
                      {item.creative?.previewUrl && cartItems.length > 1 && (
                        <button
                          onClick={() => onApplyToAll(item.creative, item.location.type)}
                          title="Deze uiting op alle schermen in je campagne toepassen (aangepast per formaat)"
                          className="px-3 py-1.5 rounded-full font-bold text-[11px] cursor-pointer transition-all bg-white hover:bg-paper-2 text-mist border border-line shadow-soft flex items-center gap-1"
                        >
                          <Copy className="w-3 h-3 shrink-0" />
                          <span>Op alle schermen</span>
                        </button>
                      )}
                      <button
                        onClick={() => onConfigureCreative(item.location)}
                        className={`px-3 py-1.5 rounded-full font-bold text-[11px] cursor-pointer transition-all ${
                          item.creative
                            ? 'bg-white hover:bg-paper-2 text-mist border border-line shadow-soft'
                            : 'bg-cobalt-soft hover:bg-cobalt-soft text-cobalt border border-cobalt-soft flex items-center gap-1 font-bold'
                        }`}
                      >
                        {!item.creative && <Sparkles className="w-3 h-3 text-cobalt shrink-0" />}
                        <span>{item.creative ? 'Wijzigen' : 'Creatie toevoegen'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Bottom: Weeks controller & total */}
                  <div className="flex justify-between items-center pt-3 border-t border-line-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-mist font-semibold">Looptijd:</span>
                      <span className="text-ink font-bold">{item.weeks} week</span>
                    </div>

                    <button
                      onClick={() => onRemoveItem(item.location.id)}
                      className="text-mist-2 hover:text-red-600 transition-colors text-xs cursor-pointer font-medium"
                    >
                      Verwijderen uit campagne
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Checkout Billing Form (Only show if we have items) */}
        {cartItems.length > 0 && (
          <div className="lg:col-span-5 bg-white border border-line rounded-card p-6 space-y-6 shadow-soft-lg">
            <h3 className="text-base font-bold text-ink flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-cobalt" />
              <span>Samenvatting & checkout</span>
            </h3>

            {/* Campaign Metrics */}
            <div className="space-y-2.5 text-xs bg-paper-2 p-4 rounded-card-sm border border-line">
              <div className="flex justify-between">
                <span className="text-mist font-semibold">Subtotaal media:</span>
                <span className="text-ink font-mono font-bold">€{totalSubtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-mist font-semibold">BTW (21%):</span>
                <span className="text-ink font-mono font-bold">€{vatAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-line pt-2.5 text-sm font-bold">
                <span className="text-ink">Totaal (incl. BTW):</span>
                <span className="text-amber-deep font-black font-mono">€{totalCost.toFixed(2)}</span>
              </div>
            </div>

            {/* Creative Checklist Warning */}
            {missingCreatives.length > 0 && (
              <div className="bg-amber-soft border border-amber-line p-3.5 rounded-card-sm space-y-1.5">
                <div className="flex items-center gap-1.5 text-amber-deep text-xs font-bold">
                  <HelpCircle className="w-4 h-4 shrink-0" />
                  <span>Creatie ontbreekt nog</span>
                </div>
                <p className="text-[10px] text-mist leading-normal font-medium">
                  Je hebt voor {missingCreatives.length} locatie(s) nog geen advertentie-ontwerp toegevoegd. Je kunt alvast boeken; onze AI of adviseurs nemen naderhand contact op voor de creatieve invulling.
                </p>
              </div>
            )}

            {/* Checkout Form */}
            <form onSubmit={handleSubmitCheckout} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-mist block">Bedrijfsnaam</label>
                <div className="relative">
                  <Building className="w-4 h-4 text-mist-2 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="MKB BV / Winkelnaam"
                    className="w-full bg-white border border-line rounded-card-sm pl-9 pr-4 py-2.5 text-ink text-xs placeholder-mist-2 focus:outline-none focus:border-cobalt focus:ring-1 focus:ring-cobalt shadow-soft"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-mist block">Contactpersoon</label>
                <div className="relative">
                  <User className="w-4 h-4 text-mist-2 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Voornaam en achternaam"
                    className="w-full bg-white border border-line rounded-card-sm pl-9 pr-4 py-2.5 text-ink text-xs placeholder-mist-2 focus:outline-none focus:border-cobalt focus:ring-1 focus:ring-cobalt shadow-soft"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-mist block">E-mailadres</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-mist-2 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="naam@bedrijf.nl"
                    className="w-full bg-white border border-line rounded-card-sm pl-9 pr-4 py-2.5 text-ink text-xs placeholder-mist-2 focus:outline-none focus:border-cobalt focus:ring-1 focus:ring-cobalt shadow-soft"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-mist block">Telefoonnummer</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-mist-2 absolute left-3 top-3" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="06 - 12345678"
                    className="w-full bg-white border border-line rounded-card-sm pl-9 pr-4 py-2.5 text-ink text-xs placeholder-mist-2 focus:outline-none focus:border-cobalt focus:ring-1 focus:ring-cobalt shadow-soft"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-mist block">Gewenste startdatum</label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-mist-2 absolute left-3 top-3" />
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-white border border-line rounded-card-sm pl-9 pr-4 py-2.5 text-ink text-xs placeholder-mist-2 focus:outline-none focus:border-cobalt focus:ring-1 focus:ring-cobalt shadow-soft"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-full text-xs font-black bg-cobalt hover:bg-cobalt-deep text-white shadow-soft flex items-center justify-center gap-1.5 cursor-pointer mt-4"
              >
                <Send className="w-4 h-4" />
                <span>Campagne definitief aanvragen</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

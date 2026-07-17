/**
 * Adapter: engine Gemeente → existing Location type.
 *
 * The landing/planner works with the ESH `Gemeente` shape (data/gemeenten.ts).
 * The booking flow (cart, detail modal, AI creation) speaks the older `Location`
 * type. This bridges the two so a planned gemeente flows into the unchanged
 * cart/checkout without touching those components.
 *
 * Every ESH product is an A0 poster, so the specs below are the same for both —
 * only the carrier differs (a flat display, or a driehoeksbord holding A0 sheets).
 * The placeholder image is a self-contained SVG data-URI (no external requests).
 */

import type { Location, LocationSpecs } from '../types';
import { reachOf, type Gemeente, type Product } from '../data/gemeenten';

function gemeenteImage(gemeente: Gemeente, product: Product): string {
  const [c1, c2] = product === 'A0-display' ? ['#EAF0FF', '#C7D7FB'] : ['#FDF3E1', '#F3DCB2'];
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='500'>` +
    `<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>` +
    `<stop offset='0' stop-color='${c1}'/><stop offset='1' stop-color='${c2}'/></linearGradient></defs>` +
    `<rect width='800' height='500' fill='url(#g)'/>` +
    `<rect x='60' y='60' width='680' height='380' rx='18' fill='none' stroke='rgba(36,86,230,0.25)'/>` +
    `<text x='80' y='430' font-family='monospace' font-size='24' fill='#5B6B85'>${product.toUpperCase()} · ${gemeente.name}</text>` +
    `</svg>`;
  return 'data:image/svg+xml,' + encodeURIComponent(svg);
}

/**
 * Delivery specs. Identical for both products: ESH's spec sheet knows one poster
 * format, and material must be in 21 days before the placement day.
 */
function specsFor(gemeente: Gemeente): LocationSpecs {
  return {
    formats: ['A0-poster (841 × 1189 mm), staand'],
    maxTextDensity:
      'Houd 40 mm vrij aan de zijkanten en bovenkant en 50 mm aan de onderkant — het frame valt over de poster. Grote, contrasterende letters lezen het best vanaf afstand.',
    restrictions: [
      'Geen politiek gevoelige boodschappen zonder voorafgaande toetsing.',
    ],
    deadline: `Materiaal uiterlijk 21 dagen voor plaatsing aanleveren. Plaatsing in ${gemeente.name} is op ${gemeente.plaatsingsdag}.`,
  };
}

export function gemeenteToLocation(gemeente: Gemeente, product: Product): Location {
  return {
    id: `gem-${gemeente.id}-${product}`,
    name: gemeente.name,
    type: product,
    street: product,
    city: gemeente.name,
    neighborhood: gemeente.province,
    reach: reachOf(gemeente),
    price: gemeente.weeklyPrice,
    image: gemeenteImage(gemeente, product),
    description:
      product === 'A0-display'
        ? `A0-displays verspreid door ${gemeente.name}. Je poster hangt een hele week op ooghoogte langs de drukste routes van de gemeente.`
        : `Driehoeksborden verspreid door ${gemeente.name}. Drie A0-posters per bord, langs de doorgaande wegen — van alle kanten zichtbaar.`,
    dimensions: '841 x 1189 mm (A0, staand)',
    visibility: `Verspreid over ${gemeente.name}, langs de routes waar de meeste mensen langskomen.`,
    environment: `${gemeente.name} (${gemeente.province}) — plaatsing op ${gemeente.plaatsingsdag}.`,
    specs: specsFor(gemeente),
    coordinates: { x: 50, y: 50 }, // legacy SVG-map field (unused for gemeenten)
    lat: gemeente.lat,
    lng: gemeente.lng,
    recommendedFor: [],
  };
}

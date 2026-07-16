/**
 * Adapter: engine Screen → existing Location type.
 *
 * The landing/planner works with the synthetic `Screen` shape (screens.ts).
 * The existing booking flow (cart, detail modal, AI creation) speaks the older
 * `Location` type. This bridges the two so a planned screen can flow into the
 * unchanged cart/checkout without touching those components.
 *
 * Missing fields are filled sensibly from the screen's type + area, with specs
 * defaults modelled on data/mockData.ts. The placeholder image is a
 * self-contained SVG data-URI (no external/Unsplash requests).
 */

import type { Location, LocationSpecs } from '../types';
import type { Screen } from '../data/screens';

function screenImage(screen: Screen): string {
  const [c1, c2] = screen.type === 'digital' ? ['#EAF0FF', '#C7D7FB'] : ['#FDF3E1', '#F3DCB2'];
  const label = screen.type === 'digital' ? 'DIGITAAL SCHERM' : 'ABRI';
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='500'>` +
    `<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>` +
    `<stop offset='0' stop-color='${c1}'/><stop offset='1' stop-color='${c2}'/></linearGradient></defs>` +
    `<rect width='800' height='500' fill='url(#g)'/>` +
    `<rect x='60' y='60' width='680' height='380' rx='18' fill='none' stroke='rgba(36,86,230,0.25)'/>` +
    `<text x='80' y='430' font-family='monospace' font-size='24' fill='#5B6B85'>${label} · ${screen.area}, ${screen.city}</text>` +
    `</svg>`;
  return 'data:image/svg+xml,' + encodeURIComponent(svg);
}

function specsFor(screen: Screen): LocationSpecs {
  if (screen.type === 'digital') {
    return {
      formats: ['MP4 (h.264, zonder geluid)', 'JPG / PNG (static)'],
      maxTextDensity: 'Max. 35% van het beeld tekst; hoog contrast aanbevolen voor leesbaarheid.',
      restrictions: [
        'Geen snel flitsende animaties of bewegende effecten (verkeersveiligheid).',
        'Geen reclame voor online gokken of weddenschappen.',
      ],
      deadline: 'Uiterlijk 2 werkdagen voor livegang digitaal aanleveren via de portal.',
    };
  }
  return {
    formats: ['Geprinte mupi-poster (118.5x175cm), 150g/m² blueback papier'],
    maxTextDensity: 'Grote, contrasterende letters aanbevolen voor leesbaarheid vanaf 10 meter.',
    restrictions: [
      'Geen politiek gevoelige boodschappen zonder voorafgaande toetsing.',
    ],
    deadline: 'Gedrukte poster uiterlijk 5 werkdagen voor aanvang aanleveren.',
  };
}

export function screenToLocation(screen: Screen): Location {
  const isDigital = screen.type === 'digital';
  return {
    id: `screen-${screen.id}`,
    name: screen.name,
    type: screen.type,
    street: screen.area,
    city: screen.city,
    // The province is the meaningful "region" for a station screen; the old
    // `${area}, ${province}` duplicated the street/area in the UI.
    neighborhood: screen.province,
    reach: screen.weeklyReach,
    price: screen.weeklyPrice,
    image: screenImage(screen),
    description: isDigital
      ? `Digitaal scherm in ${screen.area}, ${screen.city}. Je advertentie wisselt af met andere uitingen op een druk passantenpunt — een efficiënte manier om bereik op te bouwen onder mensen die er echt langskomen.`
      : `Klassieke abri (gedrukte poster) in ${screen.area}, ${screen.city}. Altijd zichtbaar voor iedereen die er langsloopt of -rijdt, dag en nacht.`,
    dimensions: isDigital ? '1080 x 1920 pixels (Portret, Full HD)' : '118.5 x 175 cm (Mupi posterformaat)',
    visibility: isDigital
      ? 'Op ooghoogte, frontaal zichtbaar in de looproute.'
      : 'Zijdeverlichte abri aan de stoeprand, zichtbaar voor voetgangers en verkeer.',
    environment: isDigital
      ? `Levendige plek in ${screen.area} (${screen.city}) met veel voetgangers en passanten.`
      : `Straatbeeld in ${screen.area} (${screen.city}) met doorgaand voetgangers- en fietsverkeer.`,
    specs: specsFor(screen),
    coordinates: { x: 50, y: 50 }, // legacy SVG-map field (unused for screens)
    lat: screen.lat,
    lng: screen.lng,
    recommendedFor: [...screen.audiences],
  };
}

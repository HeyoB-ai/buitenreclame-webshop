/**
 * ESH inventory — the real gemeente data (`gemeenten.esh.json`).
 *
 * ESH sells per GEMEENTE, not per screen: you book a series of displays across a
 * municipality, and they are placed on that municipality's fixed placement day.
 * The unit of everything here — reach, price, availability — is therefore the
 * gemeente. (The previous NS station-screen inventory has been retired: ESH runs
 * no digital screens.)
 *
 * `bron` records where each number came from. Anything marked "schatting" is an
 * estimate and must be labelled as indicative in the UI — never sold as a promise.
 */

import gemeenteData from './gemeenten.esh.json';

/** The two products ESH carries. Both hang the same A0 poster. */
export type Product = 'A0-display' | 'Driehoeksbord';

/** Placement happens on one fixed weekday per gemeente. */
export type Plaatsingsdag = 'maandag' | 'dinsdag';

/** Provenance per field: "eshmedia.nl" (sourced) or "schatting" (estimated). */
export interface Bron {
  potentieleKopers?: string;
  coverage?: string;
  displays?: string;
  displaysVrij?: string;
  weeklyPrice?: string;
}

export interface Gemeente {
  id: string;
  name: string;
  province: string;
  /** People ESH counts as reachable buyers in this gemeente (bron: eshmedia.nl). */
  potentieleKopers: number;
  /** Share of those buyers ESH promises to reach — 0.65 (bron: eshmedia.nl). */
  coverage: number;
  /** Pre-rounded potentieleKopers × coverage. `reachOf()` is the source of truth. */
  weeklyReach: number;
  displays: number; // schatting
  displaysVrij: number; // schatting
  serie: number;
  weeklyPrice: number; // schatting
  plaatsingsdag: Plaatsingsdag;
  minWeken: number;
  adviesMaxWeken: number;
  producten: Product[];
  lat: number;
  lng: number;
  bron: Bron;
}

export const GEMEENTEN: Gemeente[] = gemeenteData as Gemeente[];

export const PRODUCTEN: Product[] = ['A0-display', 'Driehoeksbord'];

/** Region-picker options, derived from the data — never a hardcoded list. */
export const PROVINCES: string[] = [...new Set(GEMEENTEN.map((g) => g.province))]
  .sort((a, b) => a.localeCompare(b, 'nl'));

export const GEMEENTE_NAMEN: string[] = GEMEENTEN.map((g) => g.name)
  .sort((a, b) => a.localeCompare(b, 'nl'));

/**
 * ESH's own advice: a run under 1 week is not placed, and beyond 3 weeks the
 * extra weeks add little — better to spend that budget on more gemeenten.
 */
export const MIN_WEKEN = 1;
export const ADVIES_MAX_WEKEN = 3;

/** The Netherlands has twelve provinces. */
const NL_PROVINCIES = 12;

/**
 * Coverage claim for the marketing copy, derived from the data so it cannot
 * drift into a lie: it only says "alle 12" while the data actually spans all
 * twelve. Add or drop gemeenten and the sentence corrects itself.
 */
export const provincieClaim = (): string =>
  PROVINCES.length === NL_PROVINCIES
    ? `alle ${NL_PROVINCIES} provincies`
    : `${PROVINCES.length} provincies`;

/**
 * Cheapest weekly rate across the inventory. NOTE: `weeklyPrice` is marked
 * "schatting" in every record, so anything built on this must read as a guide
 * price — never a quote.
 */
export const MIN_WEEKPRIJS = Math.min(...GEMEENTEN.map((g) => g.weeklyPrice));

/**
 * Weekly reach for a gemeente: the buyers ESH counts × the share it promises to
 * reach. This is ESH's own claim (bron: eshmedia.nl), so it is the one number we
 * advertise without a hedge.
 */
export const reachOf = (g: Gemeente): number => Math.round(g.potentieleKopers * g.coverage);

/** Sold out — no displays left to place this week. */
export const isUitverkocht = (g: Gemeente): boolean => g.displaysVrij <= 0;

/** Whether a field's value is an estimate rather than a sourced figure. */
export const isSchatting = (g: Gemeente, veld: keyof Bron): boolean => g.bron?.[veld] === 'schatting';

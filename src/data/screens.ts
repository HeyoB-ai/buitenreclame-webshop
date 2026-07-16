/**
 * Screen inventory — the 732 real NS station screens.
 *
 * Loaded directly from `screens.station.json` (Vite/TS JSON import). The
 * synthetic generator that used to live here has been retired: the real data is
 * the single source of truth. The shape is unchanged, so the campaign engine and
 * the screen→Location adapter keep working without modification.
 */

import stationData from './screens.station.json';

export type ScreenType = 'abri' | 'digital';

export type Audience =
  | 'Forensen'
  | 'Gezinnen'
  | 'Studenten'
  | 'Sportievelingen'
  | 'Zakelijk publiek';

export interface Screen {
  id: string;
  name: string;
  city: string;
  area: string;
  province: string;
  type: ScreenType;
  weeklyReach: number;
  weeklyPrice: number;
  audiences: Audience[];
  lat: number;
  lng: number;
  operator?: string; // e.g. "NS"
  signId?: string; // operator's own screen id
}

export const AUDIENCES: Audience[] = [
  'Forensen',
  'Gezinnen',
  'Studenten',
  'Sportievelingen',
  'Zakelijk publiek',
];

/** All screens, straight from the real NS dataset. */
export const SCREENS: Screen[] = stationData as unknown as Screen[];

/** Region-picker options, derived from the real data (not a hardcoded list). */
export const PROVINCES: string[] = [...new Set(SCREENS.map((s) => s.province))].sort((a, b) => a.localeCompare(b, 'nl'));
export const CITIES: string[] = [...new Set(SCREENS.map((s) => s.city))].sort((a, b) => a.localeCompare(b, 'nl'));

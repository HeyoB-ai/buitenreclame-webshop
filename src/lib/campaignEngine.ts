/**
 * Campaign planning engine.
 *
 * Ported 1:1 from the <script> engine block in design/reference.html (part 2).
 * Pure functions — no DOM, no React. Same semantics and constants as the demo.
 *
 * CITY_DECAY models diminishing unique reach when you stack multiple screens in
 * the same city: the strongest screen counts fully, each additional screen in
 * that city counts *0.72^rank (they largely see the same people). OFFTARGET is
 * the fraction of a screen's reach that still counts when it does NOT match the
 * chosen audience.
 */

import { SCREENS, type Screen, type Audience } from '../data/screens';

export const CITY_DECAY = 0.72;
export const OFFTARGET = 0.35;

export interface PlanInput {
  region: string;
  aud: Audience | null;
  budget: number;
  weeks: number;
}

export interface Nudge {
  s: Screen;
  marginal: number;
  cost: number;
}

export type Floor =
  | { type: 'empty'; minCost: number }
  | { type: 'weeks' };

export interface PlanResult {
  selected: Screen[];
  spend: number;
  net: number;
  raw: number;
  nudges: Nudge[];
  floor: Floor | null;
  weeks: number;
  poolSize: number;
}

/** How fully a screen's reach counts for the chosen audience. */
export const matchFactor = (s: Screen, aud: Audience | null): number =>
  !aud ? 0.8 : s.audiences.includes(aud) ? 1 : OFFTARGET;

/** Whether a screen falls inside the selected region ('NL' | 'prov:X' | 'city:Y'). */
export function inRegion(s: Screen, region: string): boolean {
  if (region === 'NL') return true;
  if (region.startsWith('prov:')) return s.province === region.slice(5);
  if (region.startsWith('city:')) return s.city === region.slice(5);
  return true;
}

/**
 * Unique (de-duplicated) reach across a selection. Screens in the same city
 * overlap, so within each city the strongest counts fully and each next one is
 * discounted by CITY_DECAY^rank. `raw` is the un-discounted sum for comparison.
 */
export function uniqueReach(selected: Screen[], aud: Audience | null): { net: number; raw: number } {
  const byCity: Record<string, Screen[]> = {};
  for (const s of selected) {
    (byCity[s.city] = byCity[s.city] || []).push(s);
  }
  let net = 0;
  let raw = 0;
  for (const city in byCity) {
    const arr = byCity[city]
      .map((s) => ({ s, val: s.weeklyReach * matchFactor(s, aud) }))
      .sort((a, b) => b.val - a.val);
    arr.forEach((o, i) => {
      net += o.val * Math.pow(CITY_DECAY, i);
      raw += o.val;
    });
  }
  return { net: Math.round(net), raw: Math.round(raw) };
}

/**
 * Greedily assemble the cheapest bundle that maximises relevant reach within
 * `budget` for `weeks`. Screens are ranked by relevant-reach-per-euro. Also
 * returns upsell nudges (best unbought screens by marginal unique reach) and,
 * when the plan is too thin, a `floor` hint (empty budget or single-week run).
 */
export function planCampaign({ region, aud, budget, weeks }: PlanInput): PlanResult {
  const pool = SCREENS
    .filter((s) => inRegion(s, region))
    .map((s) => ({ s, mf: matchFactor(s, aud) }))
    .map((o) => ({ ...o, score: (o.s.weeklyReach * o.mf) / o.s.weeklyPrice }))
    .sort((a, b) => b.score - a.score);

  const selected: Screen[] = [];
  let spend = 0;
  const rest: Screen[] = [];
  for (const o of pool) {
    const cost = o.s.weeklyPrice * weeks;
    if (spend + cost <= budget) {
      selected.push(o.s);
      spend += cost;
    } else {
      rest.push(o.s);
    }
  }

  const { net, raw } = uniqueReach(selected, aud);

  const cityCount: Record<string, number> = {};
  selected.forEach((s) => {
    cityCount[s.city] = (cityCount[s.city] || 0) + 1;
  });

  const nudges: Nudge[] = rest
    .map((s) => {
      const k = cityCount[s.city] || 0;
      const marginal = Math.round(s.weeklyReach * matchFactor(s, aud) * Math.pow(CITY_DECAY, k));
      return { s, marginal, cost: s.weeklyPrice * weeks };
    })
    .filter((n) => n.marginal > 0)
    .sort((a, b) => b.marginal - a.marginal);

  let floor: Floor | null = null;
  const minCost = pool.length ? Math.min(...pool.map((o) => o.s.weeklyPrice)) * weeks : 0;
  if (selected.length === 0) floor = { type: 'empty', minCost: Math.ceil(minCost / 50) * 50 };
  else if (weeks < 2) floor = { type: 'weeks' };

  return { selected, spend, net, raw, nudges, floor, weeks, poolSize: pool.length };
}

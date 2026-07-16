/**
 * Campaign planning engine.
 *
 * Pure functions — no DOM, no React. The planner and the results list both go
 * through `planCampaign(...)`; there is no planning arithmetic in the components.
 *
 * The unit is the GEMEENTE. Two things follow from that, and they are why this
 * no longer looks like the old screen-based engine:
 *
 *  - No overlap decay. Two screens in one city largely see the same people, so
 *    the old engine discounted each extra screen. Gemeenten are disjoint areas —
 *    the people in Aalsmeer are not the people in Alkmaar — so reach simply adds
 *    up. There are no double-counters to strip out.
 *  - No audience weighting. ESH's reach figure is potentieleKopers × coverage:
 *    the buyers it counts times the share it promises to reach. That is ESH's own
 *    claim, not something we re-model per target group.
 */

import { GEMEENTEN, reachOf, isUitverkocht, ADVIES_MAX_WEKEN, type Gemeente, type Product } from '../data/gemeenten';

export interface PlanInput {
  product: Product;
  region: string;
  budget: number;
  weeks: number;
}

export interface Nudge {
  g: Gemeente;
  marginal: number;
  cost: number;
}

export type PlanHint =
  /** Budget too low for even the cheapest gemeente. */
  | { type: 'budget-te-laag'; minCost: number }
  /** Past ESH's own advice of 3 weeks — spread the budget instead. */
  | { type: 'te-veel-weken'; adviesMax: number; weeks: number };

export interface PlanResult {
  selected: Gemeente[];
  spend: number;
  /** Total weekly reach — a plain sum, no overlap correction (see above). */
  reach: number;
  nudges: Nudge[];
  hint: PlanHint | null;
  weeks: number;
  poolSize: number;
  /** Gemeenten that matched but are sold out — shown, never planned. */
  uitverkocht: Gemeente[];
}

/** Whether a gemeente falls inside the selected region ('NL' | 'prov:X' | 'gem:Y'). */
export function inRegion(g: Gemeente, region: string): boolean {
  if (region === 'NL') return true;
  if (region.startsWith('prov:')) return g.province === region.slice(5);
  if (region.startsWith('gem:')) return g.name === region.slice(4);
  return true;
}

/** Total weekly reach of a selection. Gemeenten are disjoint, so this just adds up. */
export function totalReach(selected: Gemeente[]): number {
  return selected.reduce((sum, g) => sum + reachOf(g), 0);
}

/**
 * Greedily assemble the cheapest bundle that maximises reach within `budget` for
 * `weeks`. Gemeenten are ranked on reach-per-euro; sold-out ones are skipped.
 * Also returns upsell nudges (best unbought gemeenten) and a hint when the plan
 * is unbuyable (budget too low) or runs past ESH's 3-week advice.
 */
export function planCampaign({ product, region, budget, weeks }: PlanInput): PlanResult {
  const matching = GEMEENTEN
    .filter((g) => inRegion(g, region))
    .filter((g) => g.producten.includes(product));

  const uitverkocht = matching.filter(isUitverkocht);

  const pool = matching
    .filter((g) => !isUitverkocht(g))
    .map((g) => ({ g, score: reachOf(g) / g.weeklyPrice }))
    .sort((a, b) => b.score - a.score);

  const selected: Gemeente[] = [];
  const rest: Gemeente[] = [];
  let spend = 0;
  for (const { g } of pool) {
    const cost = g.weeklyPrice * weeks;
    if (spend + cost <= budget) {
      selected.push(g);
      spend += cost;
    } else {
      rest.push(g);
    }
  }

  const nudges: Nudge[] = rest
    .map((g) => ({ g, marginal: reachOf(g), cost: g.weeklyPrice * weeks }))
    .filter((n) => n.marginal > 0)
    .sort((a, b) => b.marginal - a.marginal);

  let hint: PlanHint | null = null;
  if (selected.length === 0) {
    const minCost = pool.length ? Math.min(...pool.map((o) => o.g.weeklyPrice)) * weeks : 0;
    hint = { type: 'budget-te-laag', minCost: Math.ceil(minCost / 50) * 50 };
  } else if (weeks > ADVIES_MAX_WEKEN) {
    hint = { type: 'te-veel-weken', adviesMax: ADVIES_MAX_WEKEN, weeks };
  }

  return {
    selected,
    spend,
    reach: totalReach(selected),
    nudges,
    hint,
    weeks,
    poolSize: pool.length,
    uitverkocht,
  };
}

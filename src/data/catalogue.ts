/**
 * Browse catalogue — every gemeente × product, in the `Location` shape the
 * browse/cart views speak.
 *
 * This replaces the old hand-written mock catalogue, which was a set of invented
 * street screens in cities ESH does not sell (and of types it does not carry).
 * Everything here is derived from the real gemeente data, so the browse view and
 * the planner can never disagree about what exists.
 */

import type { Location } from '../types';
import { GEMEENTEN } from './gemeenten';
import { gemeenteToLocation } from '../lib/adapters';

export const CATALOGUE: Location[] = GEMEENTEN.flatMap((gemeente) =>
  gemeente.producten.map((product) => gemeenteToLocation(gemeente, product)),
);

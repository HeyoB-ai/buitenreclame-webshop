# Campaign engine — verification

This documents a hand-run verification of `campaignEngine.ts` + `../data/screens.ts`
against the approved design demo (`design/reference.html`). No test framework is
used; the module was executed directly with `tsx` and its output compared to the
demo's **verbatim** `<script>` code run under `node`.

## How it was run

- **TS module** (this port): a throwaway `tsx` script imported `planCampaign` and
  `SCREENS` and printed each scenario.
- **Demo reference**: the exact data + engine block copied out of
  `design/reference.html` was run under `node` and printed the same scenarios.
- Both runs were compared field-by-field. They are **identical**, which proves the
  port reproduces the demo's numbers exactly (same PRNG stream, seed `20260710`).

`SCREENS.length === 188`. (The "3.900 schermen" in the hero is marketing copy;
the synthetic set is 188 screens — the sum of `n` across `CITY_PROFILES`. The real
~3.900-location inventory, same shape, will replace `screens.ts` later.)

## Measured values (TS port === demo, verified identical)

| Scenario | screens | spend | net | raw | overlap | floor |
|---|---|---|---|---|---|---|
| €2.000 / 2 wk / NL / Studenten | 6 | €2.000 | 934.760 | 1.007.000 | 7% | — |
| €12.000 / 2 wk / NL / Studenten | 26 | €11.960 | 3.852.740 | 4.931.000 | 22% | — |
| €250 / 1 wk / NL / Studenten | 2 | €250 | 243.000 | 243.000 | 0% | `weeks` |
| €2.000 / 1 wk / NL / Studenten | 10 | €2.000 | 1.690.210 | 1.850.000 | 9% | `weeks` |

## Note on the prompt's expected values

Prompt 2 listed expected figures of "4 schermen, net ±929.680" and "21 schermen,
overlap ±47%". These do **not** match the approved demo:

| Scenario | Prompt estimate | Actual demo & port |
|---|---|---|
| €2.000 / 2 wk | 4 schermen, net ±929.680 | **6 schermen, net 934.760** |
| €12.000 / 2 wk | 21 schermen, overlap ±47% | **26 schermen, overlap 22%** |

The source of truth is `design/reference.html` ("het goedgekeurde nieuwe ontwerp").
The port matches it exactly, so the prompt's numbers were inaccurate estimates, not
a defect in the port. The measured values above are the correct, demo-faithful ones.

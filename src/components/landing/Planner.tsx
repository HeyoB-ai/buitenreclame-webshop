import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, ArrowUp, Check, TriangleAlert } from 'lucide-react';
import { PRODUCTEN, PROVINCES, GEMEENTE_NAMEN, type Product } from '../../data/gemeenten';
import type { PlanResult } from '../../lib/campaignEngine';
import { useCountUp, fmt, euro } from './useCountUp';

interface PlannerProps {
  product: Product;
  region: string;
  budget: number;
  weeks: number;
  plan: PlanResult;
  setProduct: (p: Product) => void;
  setRegion: (r: string) => void;
  setBudget: (b: number) => void;
  setWeeks: (w: number) => void;
  onViewGemeenten: () => void;
}

const BUDGET_MIN = 250;
const BUDGET_MAX = 12000;

export default function Planner({
  product, region, budget, weeks, plan,
  setProduct, setRegion, setBudget, setWeeks, onViewGemeenten,
}: PlannerProps) {
  const reach = useCountUp(plan.reach);

  const fill = ((budget - BUDGET_MIN) / (BUDGET_MAX - BUDGET_MIN)) * 100;
  const regionLabel = region === 'NL' ? 'heel Nederland' : region.replace(/^(prov|gem):/, '');
  const weekWord = weeks === 1 ? 'week' : 'weken';
  const count = plan.selected.length;

  const bestNudge =
    plan.nudges.find((n) => n.cost <= Math.max(400, budget * 0.6)) ?? plan.nudges[0];
  const showNudge = bestNudge && budget < BUDGET_MAX;

  return (
    <div className="planner">
      {/* 1 — product */}
      <div className="field">
        <div className="plabel"><span className="step">1</span> Wat wil je ophangen?</div>
        <div className="chips">
          {PRODUCTEN.map((p) => (
            <button
              key={p}
              className={`chip${p === product ? ' on' : ''}`}
              onClick={() => setProduct(p)}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* 2 — region */}
      <div className="field">
        <div className="plabel"><span className="step">2</span> Waar?</div>
        <div className="selectwrap">
          <select value={region} onChange={(e) => setRegion(e.target.value)}>
            <option value="NL">Heel Nederland</option>
            <optgroup label="Provincie">
              {PROVINCES.map((p) => (
                <option key={p} value={`prov:${p}`}>{p}</option>
              ))}
            </optgroup>
            <optgroup label="Gemeente">
              {GEMEENTE_NAMEN.map((g) => (
                <option key={g} value={`gem:${g}`}>{g}</option>
              ))}
            </optgroup>
          </select>
        </div>
      </div>

      {/* 3 — budget + weeks */}
      <div className="field">
        <div className="plabel"><span className="step">3</span> Wat wil je uitgeven?</div>
        <div className="budgetrow">
          <div className="budgetval mono">{euro(budget)} <span>totaal</span></div>
          <div className="weeks">
            <button className="stepbtn" aria-label="Minder weken" onClick={() => setWeeks(Math.max(1, weeks - 1))}>–</button>
            <span className="wval">{weeks} {weekWord}</span>
            <button className="stepbtn" aria-label="Meer weken" onClick={() => setWeeks(Math.min(8, weeks + 1))}>+</button>
          </div>
        </div>
        <input
          type="range"
          min={BUDGET_MIN}
          max={BUDGET_MAX}
          step={50}
          value={budget}
          onChange={(e) => setBudget(Number(e.target.value))}
          style={{ ['--fill' as string]: `${fill}%` }}
        />
        <div className="rangeticks"><span>€250</span><span>€3k</span><span>€6k</span><span>€12k</span></div>
      </div>

      {/* readout */}
      <div className="readout">
        <div className="rlabel">Geschat bereik</div>
        <div className="reachnum"><span className="approx">≈</span>{fmt(reach)}</div>
        <div className="reachsub">
          mensen in <b>{regionLabel}</b> · <b>{count}</b> {count === 1 ? 'gemeente' : 'gemeenten'} · <b>{weeks}</b> {weekWord}
        </div>

        <div className="valuetag">
          <Check className="ic" size={16} strokeWidth={2.4} />
          <div>
            <span>
              ESH rekent met <b>65%</b> van de potentiële kopers in een gemeente. Elke gemeente telt apart — <b>geen dubbeltellers</b>.
            </span>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {showNudge && (
            <motion.div
              key="nudge"
              className="nudge"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <span className="up"><ArrowUp size={16} strokeWidth={2.6} /></span>
              <div className="ntext">
                <span className="plus">+{fmt(bestNudge.marginal)}</span> bereik voor <b>{euro(bestNudge.cost)}</b> extra — pakt <b>{bestNudge.g.name}</b> erbij.
              </div>
              <button
                className="nadd"
                onClick={() => setBudget(Math.min(BUDGET_MAX, budget + bestNudge.cost))}
              >
                Voeg toe
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence initial={false}>
          {plan.hint?.type === 'budget-te-laag' && (
            <motion.div
              key="hint-budget"
              className="floor"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <TriangleAlert className="ic" size={15} strokeWidth={2.2} />
              <div>
                Met dit budget past nog geen enkele gemeente voor {weeks} {weekWord}.{' '}
                <span className="fix" onClick={() => setBudget(plan.hint!.type === 'budget-te-laag' ? plan.hint!.minCost : budget)}>
                  Zet op {euro(plan.hint.minCost)}
                </span>{' '}
                — dan draait je eerste gemeente.
              </div>
            </motion.div>
          )}
          {plan.hint?.type === 'te-veel-weken' && (
            <motion.div
              key="hint-weken"
              className="floor"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <TriangleAlert className="ic" size={15} strokeWidth={2.2} />
              <div>
                ESH adviseert maximaal <b>{plan.hint.adviesMax} weken</b> — daarna zien grotendeels dezelfde mensen je poster nog eens.{' '}
                <span className="fix" onClick={() => setWeeks(plan.hint!.type === 'te-veel-weken' ? plan.hint!.adviesMax : weeks)}>
                  Zet dat budget liever in extra gemeenten
                </span>.
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button className="cta" onClick={onViewGemeenten}>
          <span>{count ? `Bekijk mijn ${count} ${count === 1 ? 'gemeente' : 'gemeenten'}` : 'Kies een startbudget'}</span>
          <ArrowRight className="arr" size={18} strokeWidth={2.6} />
        </button>
        <div className="reassure">Geen account nodig · geen verplichting · je ziet eerst alles</div>
      </div>
    </div>
  );
}

import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, ArrowUp, Check, TriangleAlert } from 'lucide-react';
import { AUDIENCES, PROVINCES, CITIES, type Audience } from '../../data/screens';
import type { PlanResult } from '../../lib/campaignEngine';
import { useCountUp, fmt, euro } from './useCountUp';

interface PlannerProps {
  aud: Audience;
  region: string;
  budget: number;
  weeks: number;
  plan: PlanResult;
  setAud: (a: Audience) => void;
  setRegion: (r: string) => void;
  setBudget: (b: number) => void;
  setWeeks: (w: number) => void;
  onViewScreens: () => void;
}

const BUDGET_MIN = 250;
const BUDGET_MAX = 12000;

export default function Planner({
  aud, region, budget, weeks, plan,
  setAud, setRegion, setBudget, setWeeks, onViewScreens,
}: PlannerProps) {
  const reach = useCountUp(plan.net);

  // Region options come straight from the real dataset.
  const regionOptions = { provs: PROVINCES, cities: CITIES };

  const fill = ((budget - BUDGET_MIN) / (BUDGET_MAX - BUDGET_MIN)) * 100;
  const regionLabel = region === 'NL' ? 'heel Nederland' : region.replace(/^(prov|city):/, '');
  const weekWord = weeks === 1 ? 'week' : 'weken';

  const removed = plan.raw - plan.net;
  const pctRemoved = plan.raw ? Math.round((removed / plan.raw) * 100) : 0;

  const bestNudge =
    plan.nudges.find((n) => n.cost <= Math.max(400, budget * 0.6)) ?? plan.nudges[0];
  const showNudge = bestNudge && budget < BUDGET_MAX;

  return (
    <div className="planner">
      {/* 1 — audience */}
      <div className="field">
        <div className="plabel"><span className="step">1</span> Wie wil je bereiken?</div>
        <div className="chips">
          {AUDIENCES.map((a) => (
            <button
              key={a}
              className={`chip${a === aud ? ' on' : ''}`}
              onClick={() => setAud(a)}
            >
              {a}
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
              {regionOptions.provs.map((p) => (
                <option key={p} value={`prov:${p}`}>{p}</option>
              ))}
            </optgroup>
            <optgroup label="Stad">
              {regionOptions.cities.map((c) => (
                <option key={c} value={`city:${c}`}>{c}</option>
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
          unieke mensen in <b>{regionLabel}</b> · <b>{plan.selected.length}</b> schermen · <b>{weeks}</b> {weekWord}
        </div>

        <div className="valuetag">
          <Check className="ic" size={16} strokeWidth={2.4} />
          <div>
            {plan.selected.length > 1 && removed > 0 ? (
              <span>
                Dubbeltellers eruit: <b>{fmt(plan.raw)}</b> bruto contacten werden <b>{fmt(plan.net)}</b> échte mensen{' '}
                <span className="dim">({pctRemoved}% overlap weggerekend)</span>
              </span>
            ) : (
              <span>Dit zijn <b>unieke</b> mensen — geen opgeblazen impressiecijfers.</span>
            )}
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
                <span className="plus">+{fmt(bestNudge.marginal)}</span> bereik voor <b>{euro(bestNudge.cost)}</b> extra — pakt <b>{bestNudge.s.area}, {bestNudge.s.city}</b> erbij.
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
          {plan.floor?.type === 'empty' && (
            <motion.div
              key="floor-empty"
              className="floor"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <TriangleAlert className="ic" size={15} strokeWidth={2.2} />
              <div>
                Met dit budget past nog geen volledige week op één scherm.{' '}
                <span className="fix" onClick={() => setBudget(plan.floor!.type === 'empty' ? plan.floor!.minCost : budget)}>
                  Zet op {euro(plan.floor.minCost)}
                </span>{' '}
                — dan draait je eerste scherm.
              </div>
            </motion.div>
          )}
          {plan.floor?.type === 'weeks' && (
            <motion.div
              key="floor-weeks"
              className="floor"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <TriangleAlert className="ic" size={15} strokeWidth={2.2} />
              <div>
                Je campagne draait maar <b>7 dagen</b>. De meeste mensen zien 'm dan te weinig om 'm te onthouden — <b>zonde van je bereik</b>.{' '}
                <span className="fix" onClick={() => setWeeks(2)}>Maak er 2 weken van</span> voor hetzelfde bereik, veel effectiever.
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button className="cta" onClick={onViewScreens}>
          <span>{plan.selected.length ? `Bekijk mijn ${plan.selected.length} schermen` : 'Kies een startbudget'}</span>
          <ArrowRight className="arr" size={18} strokeWidth={2.6} />
        </button>
        <div className="reassure">Geen account nodig · geen verplichting · je ziet eerst alles</div>
      </div>
    </div>
  );
}

import { lazy, Suspense, useMemo, useState } from 'react';
import { MapPin, Plus, Check, List, Map as MapIcon, CalendarClock } from 'lucide-react';
import { GEMEENTEN, reachOf, type Gemeente, type Product } from '../../data/gemeenten';
import type { PlanResult } from '../../lib/campaignEngine';
import { fmt, euro } from './useCountUp';

// Heavy (maplibre-gl) — lazy-loaded so it stays out of the initial bundle.
const GemeenteMap = lazy(() => import('./GemeenteMap'));

interface PlanResultsProps {
  plan: PlanResult;
  product: Product;
  region: string;
  weeks: number;
  addedIds?: string[];
  onAddGemeente: (gemeente: Gemeente) => void;
  onBookPlan: () => void;
  onOpenGemeenteDetail: (gemeente: Gemeente) => void;
}

export default function PlanResults({
  plan, product, region, weeks, addedIds = [],
  onAddGemeente, onBookPlan, onOpenGemeenteDetail,
}: PlanResultsProps) {
  const weekWord = weeks === 1 ? 'week' : 'weken';
  const regionLabel = region === 'NL' ? 'heel Nederland' : region.replace(/^(prov|gem):/, '');
  const count = plan.selected.length;
  const added = new Set(addedIds);

  const [view, setView] = useState<'list' | 'map'>('list');
  const selectedIds = useMemo(() => plan.selected.map((g) => g.id), [plan.selected]);

  return (
    <section className="results" id="results">
      <div className="wrap">
        <div className="rhead">
          <h2>Zo ziet jouw plan eruit: <em>{count} {count === 1 ? 'gemeente' : 'gemeenten'}</em></h2>
          <div className="sum">
            <b>{euro(plan.spend)}</b> voor {weeks} {weekWord}<br />
            <b>{fmt(plan.reach)}</b> mensen bereikt
          </div>
        </div>

        <p className="rnote">
          Dit is de goedkoopste bundel die je bereik maximaliseert onder <b>{regionLabel}</b> met <b>{product}</b>. Gerangschikt op bereik per euro. Bereik is 65% van de potentiële kopers per gemeente — de belofte van ESH. Prijzen en beschikbaarheid zijn indicatief; je krijgt ze bevestigd bij je aanvraag.
        </p>

        {count > 0 && (
          <div className="bookall">
            <button className="btn btn-primary" onClick={onBookPlan}>
              Boek dit hele plan ({count} {count === 1 ? 'gemeente' : 'gemeenten'}) <span className="arr">→</span>
            </button>
          </div>
        )}

        {/* Lijst / Kaart view switch */}
        <div className="viewswitch" role="tablist" aria-label="Weergave">
          <button
            role="tab"
            aria-selected={view === 'list'}
            className={`vbtn${view === 'list' ? ' on' : ''}`}
            onClick={() => setView('list')}
          >
            <List size={15} strokeWidth={2.4} /> Lijst
          </button>
          <button
            role="tab"
            aria-selected={view === 'map'}
            className={`vbtn${view === 'map' ? ' on' : ''}`}
            onClick={() => setView('map')}
          >
            <MapIcon size={15} strokeWidth={2.4} /> Kaart
          </button>
        </div>

        {view === 'map' && (
          <Suspense fallback={<div className="maploading">Kaart laden…</div>}>
            <GemeenteMap
              gemeenten={GEMEENTEN}
              selectedIds={selectedIds}
              addedIds={addedIds}
              onAddGemeente={onAddGemeente}
            />
            <p className="mapnote">
              {GEMEENTEN.length} gemeenten · jouw <b>{count}</b> geplande gemeenten staan in <span className="amberdot" /> amber. Klik een cluster om in te zoomen, klik een gemeente voor details.
            </p>
          </Suspense>
        )}

        {view === 'list' && (
        <>
        <div className="grid">
          {plan.selected.slice(0, 12).map((g) => {
            const isAdded = added.has(g.id);
            return (
              <div
                key={g.id}
                className="card"
                onClick={() => onOpenGemeenteDetail(g)}
                role="button"
                tabIndex={0}
              >
                <div className="thumb">
                  <div className="grid-o" />
                  <div className="screen"><span>{product.toUpperCase()}</span></div>
                  <span className="type a0">A0</span>
                </div>
                <div className="body">
                  <div className="loc"><MapPin size={12} strokeWidth={2.4} />{g.province}</div>
                  <h3>{g.name}</h3>
                  <div className="stats">
                    <div className="stat">
                      <div className="k">Bereik/week</div>
                      <div className="v">{fmt(reachOf(g))}</div>
                    </div>
                    <div className="stat" style={{ textAlign: 'right' }}>
                      <div className="k">Richtprijs/week</div>
                      <div className="v price">{euro(g.weeklyPrice)}</div>
                    </div>
                  </div>
                  <div className="avail">
                    <CalendarClock size={11} strokeWidth={2.4} />
                    <span>
                      Nog <b>{fmt(g.displaysVrij)}</b> van {fmt(g.displays)} displays vrij vanaf <b>{g.plaatsingsdag}</b>
                      <span className="indic">indicatief</span>
                    </span>
                  </div>
                  <button
                    className={`addbtn${isAdded ? ' added' : ''}`}
                    onClick={(e) => { e.stopPropagation(); onAddGemeente(g); }}
                  >
                    {isAdded
                      ? (<><Check size={15} strokeWidth={2.6} /> Toegevoegd</>)
                      : (<><Plus size={15} strokeWidth={2.6} /> Voeg toe aan campagne</>)}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="more">
          {count > 12 ? `+ nog ${count - 12} gemeenten in je plan` : ''}
        </div>

        {plan.uitverkocht.length > 0 && (
          <p className="soldout">
            {plan.uitverkocht.length === 1
              ? <><b>{plan.uitverkocht[0].name}</b> is deze week volgeboekt en zit daarom niet in je plan.</>
              : <><b>{plan.uitverkocht.length} gemeenten</b> ({plan.uitverkocht.map((g) => g.name).join(', ')}) zijn deze week volgeboekt en zitten daarom niet in je plan.</>}
          </p>
        )}
        </>
        )}
      </div>
    </section>
  );
}

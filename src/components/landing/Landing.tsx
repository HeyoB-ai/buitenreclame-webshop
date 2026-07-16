import { useMemo, useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import Logo from '../Logo';
import { type Audience, type Screen } from '../../data/screens';
import { planCampaign } from '../../lib/campaignEngine';
import Hero from './Hero';
import Planner from './Planner';
import PlanResults from './PlanResults';
import VoorJou from './VoorJou';
import HowItWorks from './HowItWorks';
import Explain from './Explain';
import CinemaStrip from './CinemaStrip';
import Testimonial from './Testimonial';
import Faq from './Faq';
import FinalCta from './FinalCta';
import './landing.css';

interface LandingProps {
  cartCount: number;
  addedIds?: string[];
  onOpenCart: () => void;
  onAddScreen: (screen: Screen, weeks: number) => void;
  onBookPlan: (screens: Screen[], weeks: number) => void;
  onOpenScreenDetail: (screen: Screen) => void;
}

export default function Landing({
  cartCount, addedIds, onOpenCart, onAddScreen, onBookPlan, onOpenScreenDetail,
}: LandingProps) {
  const [aud, setAud] = useState<Audience>('Studenten');
  const [region, setRegion] = useState<string>('NL');
  const [budget, setBudget] = useState<number>(2000);
  const [weeks, setWeeks] = useState<number>(2);

  const plan = useMemo(
    () => planCampaign({ region, aud, budget, weeks }),
    [region, aud, budget, weeks],
  );

  const scrollToResults = () => {
    document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="gws-landing">
      {/* topbar */}
      <div className="topbar">
        <div className="in">
          <div className="brand"><Logo height={28} /></div>
          <nav className="topnav">
            <a href="#how">Hoe het werkt</a>
            <a href="#explain">Uitleg</a>
            <a href="#faq">Vragen</a>
            {cartCount > 0 && (
              <button className="cartbtn" onClick={onOpenCart}>
                <ShoppingBag size={15} strokeWidth={2.2} />
                Mijn campagne <span className="badge">{cartCount}</span>
              </button>
            )}
            <a href="#top" className="pill">Bereken mijn bereik</a>
          </nav>
        </div>
      </div>

      <Hero>
        <Planner
          aud={aud}
          region={region}
          budget={budget}
          weeks={weeks}
          plan={plan}
          setAud={setAud}
          setRegion={setRegion}
          setBudget={setBudget}
          setWeeks={setWeeks}
          onViewScreens={scrollToResults}
        />
      </Hero>

      <VoorJou />
      <HowItWorks />
      <Explain />

      <PlanResults
        plan={plan}
        aud={aud}
        region={region}
        weeks={weeks}
        addedIds={addedIds}
        onAddScreen={(screen) => onAddScreen(screen, weeks)}
        onBookPlan={() => onBookPlan(plan.selected, weeks)}
        onOpenScreenDetail={onOpenScreenDetail}
      />

      <CinemaStrip />
      <Testimonial />
      <Faq />
      <FinalCta />

      <div className="footer wrap">
        <span>© Global Buitenreclame — conceptdemo. Foto's: Higgsfield. Testimonial ter illustratie.</span>
        <span>Bereik = unieke mensen, overlap eruit gerekend · prijzen per week</span>
      </div>
    </div>
  );
}

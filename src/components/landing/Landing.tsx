import { useMemo, useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import Logo from '../Logo';
import { type Product, type Gemeente } from '../../data/gemeenten';
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
  onAddGemeente: (gemeente: Gemeente, product: Product, weeks: number) => void;
  onBookPlan: (gemeenten: Gemeente[], product: Product, weeks: number) => void;
  onOpenGemeenteDetail: (gemeente: Gemeente, product: Product) => void;
}

export default function Landing({
  cartCount, addedIds, onOpenCart, onAddGemeente, onBookPlan, onOpenGemeenteDetail,
}: LandingProps) {
  const [product, setProduct] = useState<Product>('A0-display');
  const [region, setRegion] = useState<string>('NL');
  const [budget, setBudget] = useState<number>(2000);
  const [weeks, setWeeks] = useState<number>(2);

  const plan = useMemo(
    () => planCampaign({ region, product, budget, weeks }),
    [region, product, budget, weeks],
  );

  const scrollToResults = () => {
    document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="esh-landing">
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
          product={product}
          region={region}
          budget={budget}
          weeks={weeks}
          plan={plan}
          setProduct={setProduct}
          setRegion={setRegion}
          setBudget={setBudget}
          setWeeks={setWeeks}
          onViewGemeenten={scrollToResults}
        />
      </Hero>

      <VoorJou />
      <HowItWorks />
      <Explain />

      <PlanResults
        plan={plan}
        product={product}
        region={region}
        weeks={weeks}
        addedIds={addedIds}
        onAddGemeente={(gemeente) => onAddGemeente(gemeente, product, weeks)}
        onBookPlan={() => onBookPlan(plan.selected, product, weeks)}
        onOpenGemeenteDetail={(gemeente) => onOpenGemeenteDetail(gemeente, product)}
      />

      <CinemaStrip />
      <Testimonial />
      <Faq />
      <FinalCta />

      <div className="footer wrap">
        <span>© ESH Media — conceptdemo. Foto's: Higgsfield. Testimonial ter illustratie.</span>
        <address className="footer-contact">
          Kromwijk 4a · 3442 AG Woerden · <a href="tel:+31348689362">0348 689 362</a> · <a href="mailto:info@eshmedia.nl">info@eshmedia.nl</a>
        </address>
        <span>Bereik = 65% van de potentiële kopers per gemeente · richtprijzen per week</span>
      </div>
    </div>
  );
}

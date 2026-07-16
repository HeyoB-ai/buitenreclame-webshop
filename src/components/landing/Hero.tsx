import { useEffect, useState, type ReactNode } from 'react';
import { GEMEENTEN, MIN_WEEKPRIJS, provincieClaim } from '../../data/gemeenten';

interface HeroProps {
  /** The planner card rendered in the right column of the hero grid. */
  children: ReactNode;
}

/**
 * Hero with a full-bleed video background + the reference's light gradient
 * overlay (.hero::before). The moving video is only shown on larger screens:
 * on phones (and under prefers-reduced-motion) it would sit restlessly behind
 * the tall stacked content, so we show just the poster frame with a clean,
 * readable overlay there (see the ≤640px block in landing.css). Holds the h1,
 * lede and trust line.
 */
export default function Hero({ children }: HeroProps) {
  const [showVideo, setShowVideo] = useState(false);
  useEffect(() => {
    const motionOk = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const wide = window.matchMedia?.('(min-width: 641px)');
    const update = () => setShowVideo(!!wide?.matches && !motionOk?.matches);
    update();
    wide?.addEventListener('change', update);
    motionOk?.addEventListener('change', update);
    return () => {
      wide?.removeEventListener('change', update);
      motionOk?.removeEventListener('change', update);
    };
  }, []);

  return (
    <section className="hero" id="top">
      <img className="hero-bgposter" src="/assets/hero-poster.jpg" alt="" aria-hidden="true" />
      {showVideo && (
        <video className="hero-bgvideo" autoPlay muted loop playsInline poster="/assets/hero-poster.jpg">
          <source src="/assets/hero.mp4" type="video/mp4" />
          <source src="/assets/hero.webm" type="video/webm" />
        </video>
      )}
      <div className="wrap hero-inner">
        <div className="hero-copy">
          <span className="eyebrow"><span className="pulse" /><span className="eyebrow-text">Buitenreclame voor het MKB<span className="eyebrow-region"> · heel Nederland</span></span></span>
          <h1>Zoveel mogelijk mensen.<br /><span className="accent">Voor jouw budget.</span></h1>
          <p className="lede">Nog nooit geadverteerd? Geen reclamebureau? Daar is dit voor gemaakt. Vertel wie je wilt bereiken en wat je kwijt wilt — je ziet meteen hoe ver je komt.</p>
          {/* Every figure here is read from the data, so the copy cannot outrun
              the inventory. The price is a guide price: `weeklyPrice` is an
              estimate in the source data. */}
          <div className="trust">
            <span><b>{GEMEENTEN.length}</b> gemeenten in {provincieClaim()}</span><span className="sep">·</span>
            <span>Plaatsing op de <b>vaste dag</b> in jouw gemeente</span><span className="sep">·</span>
            <span>Richtprijs vanaf <b>€{MIN_WEEKPRIJS}</b></span>
          </div>
        </div>
        {children}
      </div>
    </section>
  );
}

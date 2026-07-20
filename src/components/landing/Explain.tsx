import { ADVIES_MAX_WEKEN } from '../../data/gemeenten';

export default function Explain() {
  return (
    <section className="explain" id="explain">
      <div className="wrap">
        <div className="head">
          <span className="eyebrow warm"><span className="pulse" />Even in gewone taal</span>
          <h2 className="sec">Wat is buitenreclame <em>eigenlijk</em>?</h2>
          <p className="lead">Kort, zonder jargon. Genoeg om te snappen wat je koopt — meer hoef je echt niet te weten.</p>
        </div>
        <div className="terms">
          <div className="term">
            <div className="ico"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="3" width="16" height="18" rx="1" /><path d="M8 21v-4h8v4" /></svg></div>
            <h4>A0-display</h4>
            <p>Een staand bord langs de stoep met jouw poster erin, op A0-formaat (841 × 1189 mm). Iedereen die langsloopt of -rijdt ziet 'm. Vertrouwd, en altijd zichtbaar.</p>
          </div>
          <div className="term">
            <div className="ico"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3 2 20h20z" /></svg></div>
            <h4>Driehoeksbord</h4>
            <p>Hetzelfde formaat poster, maar op een driehoekig bord langs doorgaande wegen. Drie kanten, dus je wordt uit meerdere richtingen gezien.</p>
          </div>
          <div className="term">
            <div className="ico"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg></div>
            <h4>Bereik</h4>
            <p>Je koopt per gemeente. ESH rekent met 65% van de potentiële kopers die daar wonen. Elke gemeente is een eigen gebied met eigen mensen, dus wat je optelt zijn geen dubbeltellers.</p>
          </div>
          <div className="term">
            <div className="ico"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg></div>
            <h4>Weken draaien</h4>
            <p>Elke gemeente heeft een vaste plaatsingsdag — maandag of dinsdag. Je uiting lever je meteen drukklaar aan: juiste formaat, juiste marges, niets meer te controleren. Daardoor kan je campagne sneller de straat op dan met losse bestanden die nog nagekeken moeten worden — zodra je materiaal klaar is, plaatsen we op de eerstvolgende plaatsingsdag. Langer dan {ADVIES_MAX_WEKEN} weken adviseert ESH niet: daarna zien grotendeels dezelfde mensen 'm nog eens.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

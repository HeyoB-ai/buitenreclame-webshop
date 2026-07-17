import { GEMEENTEN, provincieClaim } from '../../data/gemeenten';

export default function FinalCta() {
  return (
    <section className="final">
      <div className="in">
        <h2>Klaar om <span className="accent">gezien</span> te worden?</h2>
        <p>Kijk in één minuut hoe ver jouw budget reikt. Zonder account, zonder verplichting — gewoon om te zien wat er mogelijk is.</p>
        <a href="#top" className="btn btn-primary">Bekijk mijn bereik <span className="arr">→</span></a>
        <div className="subtle">{GEMEENTEN.length} gemeenten in {provincieClaim()} · plaatsing op de vaste dag in jouw gemeente</div>
      </div>
    </section>
  );
}

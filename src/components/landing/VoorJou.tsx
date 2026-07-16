import Photo from './Photo';

export default function VoorJou() {
  return (
    <section className="voorjou">
      <div className="wrap grid2">
        <div>
          <span className="eyebrow warm"><span className="pulse" />Voor jou gemaakt</span>
          <h2 className="sec">Je hoeft er geen <em>verstand</em> van te hebben</h2>
          <p className="lead">Grote merken hebben mediabureaus die dit voor ze regelen. Jij — de bakker, de bloemist, de sportschool op de hoek — hebt dat niet. En dat hoeft ook niet.</p>
          <p className="lead">Daarom stellen we geen vragen die je niet kunt beantwoorden. Geen "CPM", geen "GRP's", geen vakjargon. Je vertelt gewoon wie je klanten zijn en wat je te besteden hebt. Wij vertalen dat naar de schermen waar die mensen echt langslopen — en houden de dubbeltellers eruit, zodat je bereik klopt.</p>
          <div className="btnrow">
            <a href="#top" className="btn btn-primary">Start zonder verplichting <span className="arr">→</span></a>
          </div>
        </div>
        <Photo
          base="photo-florist"
          alt="Bloemist voor haar winkel"
          label="Foto — bloemist voor haar winkel"
          icon={<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4" /></svg>}
        />
      </div>
    </section>
  );
}

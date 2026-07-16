import Photo from './Photo';

export default function HowItWorks() {
  return (
    <section className="how" id="how">
      <div className="wrap">
        <div className="head">
          <span className="eyebrow"><span className="pulse" />Zo werkt het</span>
          <h2 className="sec">In drie stappen <em>op straat</em></h2>
          <p className="lead">Van "ik heb geen idee waar ik moet beginnen" naar een advertentie die mensen zien — meestal al de volgende dag.</p>
        </div>
        <div className="layout">
          <div className="steps">
            <div className="stepcard">
              <div className="no">1</div>
              <div>
                <h3>Vertel wie je wilt bereiken</h3>
                <p>Kies je klant en je stad. Meer niet. Je ziet meteen hoeveel mensen je kunt bereiken en wat het kost — geen offerte aanvragen, geen dagen wachten op een verkoper.</p>
              </div>
            </div>
            <div className="stepcard">
              <div className="no">2</div>
              <div>
                <h3>Wij kiezen de beste plekken</h3>
                <p>Global zoekt de schermen op waar jouw klanten echt langskomen. Bij elk scherm zie je de straat, de wijk en waarom het bij je past — dus je weet altijd wat je boekt en waar het hangt.</p>
              </div>
            </div>
            <div className="stepcard">
              <div className="no">3</div>
              <div>
                <h3>Zet je advertentie erop</h3>
                <p>Heb je al een ontwerp? Upload het. Heb je er nog geen? Typ je aanbieding en laat er in een paar klikken eentje maken die er professioneel uitziet én aan de regels van de gemeente voldoet.</p>
                <span className="tag">Ontwerp maken met AI — geen ontwerper nodig</span>
              </div>
            </div>
          </div>
          <Photo
            base="photo-cafe"
            alt="Ondernemer regelt zijn campagne op een laptop"
            label="Foto — ondernemer regelt het zelf"
            icon={<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="4" width="20" height="14" rx="2" /><path d="M2 20h20" /></svg>}
          />
        </div>
      </div>
    </section>
  );
}

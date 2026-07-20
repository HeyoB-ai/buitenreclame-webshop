import { MIN_WEEKPRIJS, ADVIES_MAX_WEKEN } from '../../data/gemeenten';

export default function Faq() {
  return (
    <section className="faq" id="faq">
      <div className="wrap">
        <div className="head">
          <span className="eyebrow"><span className="pulse" />Eerlijk antwoord</span>
          <h2 className="sec">Vragen die je vast hebt</h2>
          <p className="lead">Je bent vast niet de enige die dit denkt. Daarom hier gewoon het eerlijke antwoord.</p>
        </div>
        <div className="qa">
          <div className="q">
            <h4><span className="qm">?</span>Ik heb geen ervaring met adverteren. Kan ik dit wel?</h4>
            <p>Ja. Als je kunt vertellen wie je klanten zijn, kun je dit. De rest doet de tool — die kiest de plekken, rekent het bereik uit en houdt je binnen budget.</p>
          </div>
          <div className="q">
            <h4><span className="qm">?</span>Wat als ik nog geen advertentie heb?</h4>
            <p>Dan maak je er hier eentje. Je typt je aanbieding, en je krijgt een verzorgd ontwerp terug dat aan de regels van de gemeente voldoet. Geen ontwerper of bureau nodig.</p>
          </div>
          <div className="q">
            <h4><span className="qm">?</span>Kan ik klein beginnen?</h4>
            <p>Zeker. Richtprijs vanaf €{MIN_WEEKPRIJS} per week. Eén gemeente bij jou in de buurt is een prima manier om te kijken wat het doet, voordat je opschaalt.</p>
          </div>
          <div className="q">
            <h4><span className="qm">?</span>Zit ik ergens aan vast?</h4>
            <p>Nee. Je kiest zelf hoe lang je draait — ESH adviseert maximaal {ADVIES_MAX_WEKEN} weken. Geen abonnement, geen contract met een bureau, geen kleine lettertjes.</p>
          </div>
          <div className="q">
            <h4><span className="qm">?</span>Hoe snel hangt m'n advertentie er?</h4>
            <p>Dat hangt af van de drukte en van de vaste plaatsingsdag van je gemeente — een exacte datum beloven we niet. Wel dit: je uiting is hier meteen drukklaar (juist formaat, juiste marges, niets meer na te kijken), en dat scheelt in het proces. Zodra je materiaal klaar is, plaatsen we op de eerstvolgende plaatsingsdag in jouw gemeente.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

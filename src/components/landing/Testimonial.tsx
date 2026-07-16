import Photo from './Photo';

export default function Testimonial() {
  return (
    <section className="testi">
      <div className="wrap grid2">
        <Photo
          base="photo-bakery"
          alt="Bakker in haar winkel"
          label="Foto — bakker in haar winkel"
          icon={<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="8" r="5" /><path d="M20 21a8 8 0 0 0-16 0" /></svg>}
        />
        <div>
          <span className="eyebrow warm"><span className="pulse" />Van een ondernemer zoals jij</span>
          <blockquote>
            <span className="mark">"</span>Ik dacht dat adverteren op straat alleen iets was voor de grote ketens. Ik ben klein begonnen met twee schermen bij mij in de buurt. Binnen een week liepen er mensen binnen die 'dat bord' hadden gezien.<span className="mark">"</span>
          </blockquote>
          <div className="who"><span className="dot" /><span><b>Sanne</b> — bakkerij, Utrecht</span></div>
        </div>
      </div>
    </section>
  );
}

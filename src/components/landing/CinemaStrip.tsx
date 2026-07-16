export default function CinemaStrip() {
  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (!img.dataset.f) {
      img.dataset.f = '1';
      img.src = '/assets/photo-street.jpg';
    } else {
      img.src = '/assets/hero-poster.jpg';
    }
  };

  return (
    <section className="cinema">
      <img className="cin-poster" src="/assets/photo-street.png" alt="" aria-hidden="true" onError={handleError} />
      <div className="in">
        <span className="eyebrow"><span className="pulse" />Vanavond op straat</span>
        <h2>Jouw zaak, groot in het straatbeeld</h2>
        <p>Precies waar je klanten langslopen — op weg naar werk, naar de winkel, naar huis. Dat moment is dichterbij dan je denkt: vaak al morgen.</p>
        <a href="#top" className="btn btn-light">Bereken mijn bereik <span className="arr">→</span></a>
      </div>
    </section>
  );
}

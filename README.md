# ESH Media — Buitenreclame

Zelfbedieningsplatform voor buitenreclame voor het MKB. Een ondernemer vertelt
wie hij wil bereiken en wat hij kwijt wil, en ziet meteen hoe ver zijn budget
reikt — zonder mediabureau, zonder jargon, zonder lege kaart.

Gebouwd met **Vite + React 19 + TypeScript**, **Tailwind CSS v4**,
`motion/react` (subtiele overgangen) en `lucide-react` (iconen).

```bash
npm install
npm run dev       # http://localhost:3000
npm run build     # productie-build
npm run preview   # bekijk de build lokaal
npm run lint      # tsc --noEmit
```

---

## De flow (planner-first)

De landing is één doorlopende pagina; de gebruiker begint bovenin bij de planner
en boekt onderaan.

1. **Planner (hero).** Kies een product (A0-display of driehoeksbord), een regio
   en een budget + looptijd. Terwijl je schuift zie je live het **bereik**, plus
   zachte duwtjes:
   - een *nudge* ("+X bereik voor €Y extra") met een werkende **Voeg toe**-knop;
   - een hint als het budget te laag is, of als je langer dan 3 weken draait —
     met fix-links die het budget of de weken direct goedzetten.
2. **Gemeenten (resultaten).** De goedkoopste bundel die het bereik maximaliseert,
   als kaartjes met provincie, bereik, richtprijs en beschikbaarheid ("nog X van
   Y displays vrij vanaf {plaatsingsdag}", gelabeld als indicatief). Per kaart een
   **Voeg toe aan campagne**-knop; erboven **Boek dit hele plan**. Uitverkochte
   gemeenten worden apart genoemd, nooit gepland.
3. **Mand & checkout.** De geselecteerde gemeenten komen in de bestaande mand,
   waar je campagnemateriaal koppelt (uploaden, door AI laten ontwerpen, of laten
   checken) en de campagne aanvraagt.

De secties *Voor jou*, *Zo werkt het*, *Uitleg*, *Testimonial* en *FAQ* leggen in
gewone taal uit wat je koopt.

---

## De engine (`src/lib/campaignEngine.ts`)

Pure functies, geen DOM, geen React. De planner en de resultatenlijst rekenen
allemaal via `planCampaign(...)` — er zit geen rekenlogica in de componenten.

`planCampaign({ product, region, budget, weeks })` sorteert alle gemeenten in de
regio op **bereik per euro**, vult greedy de goedkoopste bundel binnen het
budget, en telt het bereik op. Het geeft ook upsell-*nudges* en, als het plan
onkoopbaar is of te lang draait, een *hint* terug.

De rekeneenheid is de **gemeente**, en daar volgt de rest uit:

- **Bereik = `potentieleKopers × coverage`** (0.65) — de belofte van ESH zelf
  (bron: eshmedia.nl). Geen doelgroepweging: we modelleren ESH's cijfer niet na.
- **Geen overlap-correctie.** Gemeenten zijn disjuncte gebieden — de mensen in
  Aalsmeer zijn niet de mensen in Alkmaar — dus bereik telt gewoon op. De oude
  `CITY_DECAY`/`OFFTARGET` sloegen op schermen in dezelfde stad en zijn met de
  NS-data vervallen.
- **Uitverkocht** (`displaysVrij === 0`) wordt overgeslagen en apart getoond.
- **Zacht plafond op 3 weken** (`ADVIES_MAX_WEKEN`, ESH's eigen advies) met een
  fix-link die het budget naar extra gemeenten stuurt.

`inRegion` en `totalReach` zijn losse, testbare hulpfuncties.

---

## Data (`src/data/gemeenten.ts`)

Bron is `gemeenten.esh.json`: **35 gemeenten in alle 12 provincies**, met per
gemeente `potentieleKopers`, `coverage`, `displays`, `displaysVrij`, `serie`,
`weeklyPrice`, `plaatsingsdag` (maandag/dinsdag), `minWeken`, `adviesMaxWeken`,
`producten` (`A0-display` | `Driehoeksbord`), `lat`, `lng` en `bron`.

**Let op `bron`.** Dat veld zegt per waarde waar 'ie vandaan komt:
`potentieleKopers` en `coverage` komen van eshmedia.nl, maar `displays`,
`displaysVrij` en `weeklyPrice` staan als **"schatting"** gemarkeerd. Die drie
mogen daarom nergens als harde belofte in de UI staan — ze zijn overal gelabeld
als indicatief, en prijzen heten *richtprijzen*. Claims in de copy worden
afgeleid uit de data (`GEMEENTEN.length`, `provincieClaim()`, `MIN_WEEKPRIJS`)
zodat de tekst niet kan gaan liegen als de inventaris verandert.

`src/lib/adapters.ts` (`gemeenteToLocation`) vertaalt een `Gemeente` + `Product`
naar het bestaande `Location`-type, zodat een geplande gemeente in de bestaande
mand, detail-modal en materiaal-flow past. `src/data/catalogue.ts` bouwt de
browse-catalogus uit diezelfde bron, zodat planner en catalogus elkaar niet
kunnen tegenspreken.

---

## Design

De designtokens (kleuren, radii, schaduwen, fonts) staan in `src/index.css`
(`@theme`), 1-op-1 overgenomen uit `design/reference.html` — de goedgekeurde
visuele bron van waarheid. Licht *paper*-palet, **cobalt** als actiekleur en
**amber** uitsluitend voor bereik-/prijsgetallen. De landing-styling staat
gescoped in `src/components/landing/landing.css` (onder `.esh-landing`) zodat die
niet lekt naar de rest van de app.

Media (hero-video, foto's) staan in `public/assets/`.

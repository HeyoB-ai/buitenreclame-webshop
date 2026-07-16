# Global — Buitenreclame

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

1. **Planner (hero).** Kies een doelgroep, een regio en een budget + looptijd.
   Terwijl je schuift zie je live het **unieke bereik**, plus zachte duwtjes:
   - een *dubbeltellers*-regel die laat zien hoeveel bruto contacten na
     overlap-correctie overblijven;
   - een *nudge* ("+X bereik voor €Y extra") met een werkende **Voeg toe**-knop;
   - *vloer*-waarschuwingen bij een te laag budget of een looptijd van 1 week,
     met fix-links die het budget of de weken direct goedzetten.
2. **Schermen (resultaten).** De goedkoopste bundel die het bereik maximaliseert,
   als kaartjes met stad, wijk en doelgroep-match. Per kaart een **Voeg toe aan
   campagne**-knop; erboven **Boek dit hele plan**.
3. **Mand & checkout.** De geselecteerde schermen komen in de bestaande mand,
   waar je per scherm campagnemateriaal koppelt (uploaden, door AI laten
   ontwerpen, of laten checken) en de campagne aanvraagt.

De secties *Voor jou*, *Zo werkt het*, *Uitleg*, *Testimonial* en *FAQ* leggen in
gewone taal uit wat je koopt.

---

## De engine (`src/lib/campaignEngine.ts`)

Pure functies, geen DOM, geen React. De planner en de resultatenlijst rekenen
allemaal via `planCampaign(...)` — er zit geen rekenlogica in de componenten.

`planCampaign({ region, aud, budget, weeks })` sorteert alle schermen in de regio
op **relevant bereik per euro**, vult greedy de goedkoopste bundel binnen het
budget, en berekent het unieke bereik. Het geeft ook upsell-*nudges* en, als het
plan te dun is, een *floor*-hint terug.

Twee constanten sturen het model:

- **`CITY_DECAY` (0.72)** — schermen in dezelfde stad zien grotendeels dezelfde
  mensen. Binnen een stad telt het sterkste scherm volledig mee; elk volgend
  scherm telt `0.72^rang` (dus met korting). Zo blijft het gerapporteerde bereik
  *uniek* in plaats van opgeblazen.
- **`OFFTARGET` (0.35)** — het deel van het bereik van een scherm dat nog meetelt
  als dat scherm níét bij de gekozen doelgroep past. Een perfecte match telt voor
  1.0, een mismatch voor 0.35.

`matchFactor`, `inRegion` en `uniqueReach` zijn losse, testbare hulpfuncties.
`src/lib/campaignEngine.test.md` documenteert een handmatige verificatie (via
`tsx`) tegen de goedgekeurde ontwerp-demo — de cijfers komen exact overeen.

---

## Data (`src/data/screens.ts`)

`screens.ts` bevat **synthetische** scherm-inventaris: `genScreens()` genereert
deterministisch (mulberry32, seed `20260710`) een set schermen met dezelfde vorm
als de echte inventaris — `id`, `name`, `city`, `area`, `province`, `type`
(`abri` | `digital`), `weeklyReach`, `weeklyPrice`, `audiences`, `lat`, `lng`.

Deze data wordt t.z.t. vervangen door de echte **~3.900-locatie-inventaris** in
**exact dezelfde vorm**; alleen `SCREENS` hoeft dan te wijzen naar de echte bron
(bijv. een database of ERP zoals Broadsign/Ayuda). De engine en de UI blijven
ongewijzigd.

`src/lib/adapters.ts` (`screenToLocation`) vertaalt een engine-`Screen` naar het
bestaande `Location`-type, zodat een gepland scherm in de bestaande mand,
detail-modal en materiaal-flow past.

---

## Design

De designtokens (kleuren, radii, schaduwen, fonts) staan in `src/index.css`
(`@theme`), 1-op-1 overgenomen uit `design/reference.html` — de goedgekeurde
visuele bron van waarheid. Licht *paper*-palet, **cobalt** als actiekleur en
**amber** uitsluitend voor bereik-/prijsgetallen. De landing-styling staat
gescoped in `src/components/landing/landing.css` (onder `.gws-landing`) zodat die
niet lekt naar de rest van de app.

Media (hero-video, foto's) staan in `public/assets/`.

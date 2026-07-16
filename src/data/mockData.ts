/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Location } from '../types';

export const TARGET_AUDIENCES = [
  { id: 'Forensen', name: 'Forensen & pendelaars', desc: 'Mensen die reizen voor werk, vaak bij stations en doorgaande wegen.' },
  { id: 'Gezinnen', name: 'Gezinnen & huishoudens', desc: 'Gezinnen met kinderen, actief in woonwijken en winkelgebieden.' },
  { id: 'Studenten', name: 'Studenten & jongeren', desc: 'Dynamische doelgroep rondom hogescholen, universiteiten en uitgaansgebieden.' },
  { id: 'Sportievelingen', name: 'Sportievelingen & actieven', desc: 'Gezondheidsbewuste mensen rond sportclubs, parken en recreatiecentra.' },
  { id: 'Zakelijk publiek', name: 'Zakelijk publiek & professionals', desc: 'Beslissers en kantoorpersoneel in business districten.' }
];

export const MOCK_LOCATIONS: Location[] = [
  {
    id: 'loc-1',
    name: 'Leidsestraat Shopping Display',
    type: 'digital',
    street: 'Leidsestraat 45',
    city: 'Amsterdam',
    neighborhood: 'Centrum (Grachtengordel)',
    reach: 145000,
    price: 350,
    image: 'https://images.unsplash.com/photo-1596436889106-be35e843f974?auto=format&fit=crop&w=800&q=80',
    description: 'Dit premium digitale scherm bevindt zich midden in de Leidsestraat, een van de drukste winkelstraten van Amsterdam. Voetgangers lopen direct langs dit tweezijdige scherm, wat zorgt voor een extreem hoge contacttijd en maximale attentiewaarde.',
    dimensions: '1080 x 1920 pixels (Portret, Full HD)',
    visibility: 'Uitstekend vanaf beide looprichtingen op ooghoogte.',
    environment: 'Bruisend winkelgebied met modezaken, horeca, en veel passerende trams en toeristen/lokale shoppers.',
    specs: {
      formats: ['MP4 (h.264)', 'JPG / PNG (static)'],
      maxTextDensity: 'Max. 30% van het beeld mag uit tekst bestaan voor optimale leesbaarheid.',
      restrictions: [
        'Geen alcoholreclame toegestaan (vanwege nabijgelegen onderwijsinstellingen).',
        'Geen snel bewegende animaties of flitsende effecten om verkeersafleiding te voorkomen.'
      ],
      deadline: 'Uiterlijk 3 werkdagen voor de startdatum digitaal aanleveren.'
    },
    coordinates: { x: 42, y: 35 },
    recommendedFor: ['Studenten', 'Gezinnen']
  },
  {
    id: 'loc-2',
    name: 'Blaak Station Entrance',
    type: 'abri',
    street: 'Blaak 12',
    city: 'Rotterdam',
    neighborhood: 'Centrum / Stadsdriehoek',
    reach: 110000,
    price: 240,
    image: 'https://images.unsplash.com/photo-1568992687947-868a62a9f521?auto=format&fit=crop&w=800&q=80',
    description: 'Een klassieke, hoogwaardige poster-abri (gedrukte poster) gesitueerd direct bij de hoofdingang van Station Rotterdam Blaak, tegenover de iconische Markthal. Deze locatie garandeert constante zichtbaarheid bij reizigers en dagjesmensen.',
    dimensions: '118.5 x 175 cm (Mupi posterformaat)',
    visibility: 'Direct in de looproute van reizigers die het station in- en uitgaan.',
    environment: 'Kruispunt van trein, metro en tram, geflankeerd door kantoorgebouwen, de Markthal, en de wekelijkse markt.',
    specs: {
      formats: ['Geprinte mupi-poster (118.5x175cm), 150g/m² blueback papier'],
      maxTextDensity: 'Geen harde limiet, maar we adviseren grote, contrasterende letters voor leesbaarheid vanaf 10 meter.',
      restrictions: [
        'Geen politiek gevoelige boodschappen zonder voorafgaande toetsing door de welstandscommissie.'
      ],
      deadline: 'Gedrukte poster uiterlijk 5 werkdagen voor aanvang afleveren bij ons distributiecentrum.'
    },
    coordinates: { x: 55, y: 58 },
    recommendedFor: ['Forensen', 'Studenten', 'Zakelijk publiek']
  },
  {
    id: 'loc-3',
    name: 'Vredenburg Druk Voetgangersgebied',
    type: 'digital',
    street: 'Vredenburg 10',
    city: 'Utrecht',
    neighborhood: 'Binnenstad',
    reach: 185000,
    price: 395,
    image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80',
    description: 'Gelegen op het drukke Vredenburgplein, de verbindingsschakel tussen Utrecht Centraal / Hoog Catharijne en de historische binnenstad. Dit digitale scherm heeft een gigantisch bereik en trekt continu de aandacht van duizenden consumenten.',
    dimensions: '1080 x 1920 pixels (65 inch LED)',
    visibility: 'Perfect gepositioneerd in de centrale loopstroom, 100% frontaal zichtbaar.',
    environment: 'Drukste wandelroute van Utrecht, grenzend aan grote retailketens, TivoliVredenburg en de wekelijkse markt.',
    specs: {
      formats: ['HTML5 creative (static/mild animatie)', 'MP4 video (zonder geluid, 10 seconden loop)'],
      maxTextDensity: 'Max. 40% tekstoppervlakte. Houd rekening met de zonkracht; hoog contrast is vereist.',
      restrictions: [
        'Geen reclame voor online gokken of weddenschappen.',
        'Sponsorlogo’s mogen maximaal 10% van het beeld beslaan.'
      ],
      deadline: 'Uiterlijk 2 werkdagen voor livegang via de portal uploaden.'
    },
    coordinates: { x: 50, y: 48 },
    recommendedFor: ['Forensen', 'Studenten', 'Gezinnen']
  },
  {
    id: 'loc-4',
    name: 'Grote Markt Mupi',
    type: 'abri',
    street: 'Grote Markt 4',
    city: 'Den Haag',
    neighborhood: 'Centrum',
    reach: 95000,
    price: 210,
    image: 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&w=800&q=80',
    description: 'Een fysieke abri poster op de bruisende Grote Markt in Den Haag. Ideaal om een gevarieerd publiek van studenten, winkelend publiek en terrasbezoekers te bereiken. De verlichting in de posterkast garandeert ook in de avonduren een schitterende presentatie.',
    dimensions: '118.5 x 175 cm (Zijdeverlicht)',
    visibility: 'Zichtbaar vanaf de terrassen en de tramhaltes rondom de Grote Markt.',
    environment: 'Horecaplein en uitgaansgebied in hartje Den Haag, zeer levendig in de namiddag en avond.',
    specs: {
      formats: ['Geprinte poster (118.5x175cm), backlit papier aanbevolen voor schittering in het donker.'],
      maxTextDensity: 'Aanbevolen: korte, krachtige slogan. Tekstgrootte minimaal 48pt.',
      restrictions: [
        'Geen discriminerende of aanstootgevende uitingen.',
        'Verkoopacties moeten voldoen aan de Nederlandse Reclame Code.'
      ],
      deadline: 'Uiterlijk 6 werkdagen voor plaatsing aanleveren voor logistieke sortering.'
    },
    coordinates: { x: 35, y: 50 },
    recommendedFor: ['Gezinnen', 'Studenten']
  },
  {
    id: 'loc-5',
    name: 'Strijp-S Design Corridor',
    type: 'digital',
    street: 'Torenallee 22',
    city: 'Eindhoven',
    neighborhood: 'Strijp-S',
    reach: 78000,
    price: 280,
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80',
    description: 'Innovatief digitaal scherm op de creatieve hotspot Strijp-S in Eindhoven. Dit scherm richt zich specifiek op young professionals, tech-enthousiastelingen, ontwerpers en studenten van de Creative Cosmetics en Design Academy.',
    dimensions: '1200 x 1920 pixels (Ultra-bright outdoor LED)',
    visibility: 'Strategisch geplaatst langs het fietspad en de wandelboulevard Torenallee.',
    environment: 'Voormalig Philips terrein, nu omgebouwd tot hip woon/werkgebied met trendy lofts, studio’s en cafés.',
    specs: {
      formats: ['MP4 (10 sec, max 15MB)', 'PNG/JPG'],
      maxTextDensity: 'Creatieve ontwerpen met veel witruimte presteren hier statistisch het best.',
      restrictions: [
        'Geen direct concurrerende uitingen met gevestigde Strijp-S partners (o.a. Philips, ASML events).'
      ],
      deadline: 'Uiterlijk 3 werkdagen voor livegang uploaden.'
    },
    coordinates: { x: 68, y: 75 },
    recommendedFor: ['Zakelijk publiek', 'Studenten']
  },
  {
    id: 'loc-6',
    name: 'Zuidas Financial Screen',
    type: 'digital',
    street: 'Gustav Mahlerlaan 50',
    city: 'Amsterdam',
    neighborhood: 'Zuidas',
    reach: 125000,
    price: 450,
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
    description: 'Dit is ons meest gewilde digitale scherm voor B2B en premium merken. Gelegen in het hart van de Amsterdamse Zuidas, trekt dit scherm dagelijks de aandacht van duizenden bankiers, advocaten, consultants en ambitieuze professionals.',
    dimensions: '1080 x 1920 pixels (Portret, 75 inch)',
    visibility: 'Op ooghoogte op het Gustav Mahlerplein, direct naast het treinstation Amsterdam Zuid.',
    environment: 'Zakelijk district gekenmerkt door wolkenkrabbers, premium restaurants en zakelijke ontmoetingsplekken.',
    specs: {
      formats: ['Static JPG', 'Dynamic HTML5 (real-time data koppeling mogelijk op aanvraag)', 'MP4'],
      maxTextDensity: 'Max 35%. Zakelijke stijl met strakke typografie en rustige kleurenpaletten aanbevolen.',
      restrictions: [
        'Uitingen mogen de financiële markt niet misleiden of onrealistische rendementen beloven.'
      ],
      deadline: 'Uiterlijk 2 werkdagen voor de startdatum aanleveren.'
    },
    coordinates: { x: 45, y: 42 },
    recommendedFor: ['Zakelijk publiek', 'Forensen']
  },
  {
    id: 'loc-7',
    name: 'Hereweg Student Corridor',
    type: 'abri',
    street: 'Hereweg 34',
    city: 'Groningen',
    neighborhood: 'Centrum-Zuid',
    reach: 62000,
    price: 180,
    image: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=800&q=80',
    description: 'Fysieke abri geplaatst langs een van de belangrijkste fiets- en wandelroutes vanaf het Centraal Station Groningen naar de zuidelijke woonwijken en hogescholen. Bereik een extreem hoog percentage studenten en actieve stadsbewoners.',
    dimensions: '118.5 x 175 cm',
    visibility: 'Zijdeverlichte abri direct geplaatst aan de stoeprand, perfect zichtbaar voor fietsers en automobilisten.',
    environment: 'Drukke verbindingsweg met historische herenhuizen, winkeltjes en constante stroom studenten.',
    specs: {
      formats: ['Geprinte poster (118.5x175cm), blueback of backlit posterpapier.'],
      maxTextDensity: 'Hoge kleurverzadiging werkt hier erg goed door de vele bomen langs de straat.',
      restrictions: [
        'Geen extreme geluidsoverlast-gerelateerde reclames (bijv. illegale raves) toegestaan.'
      ],
      deadline: 'Uiterlijk 5 werkdagen vooraf fysiek bezorgen.'
    },
    coordinates: { x: 82, y: 18 },
    recommendedFor: ['Studenten', 'Sportievelingen']
  },
  {
    id: 'loc-8',
    name: 'Groninger Gym & Wellness Screen',
    type: 'digital',
    street: 'Wilhelminasingel 101',
    city: 'Maastricht',
    neighborhood: 'Wyck',
    reach: 35000,
    price: 150,
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80',
    description: 'Dit digitale indoorscherm is gepositioneerd in de centrale lounge en receptie van Maastrichts meest exclusieve fitness- en wellnessclub. Bereik een koopkrachtige doelgroep die bewust bezig is met gezondheid, voeding en lifestyle.',
    dimensions: '1920 x 1080 pixels (Landschap, Full HD)',
    visibility: 'Ooghoogte bij de zithoeken en de bar waar leden gemiddeld 15 minuten verblijven.',
    environment: 'Premium sport- en ontspanningsomgeving, rustige sfeer met veel contacttijd.',
    specs: {
      formats: ['Landschap JPG/PNG', 'MP4 Video (15 seconden loop, stil)'],
      maxTextDensity: 'Max 50% tekst. Omdat de contacttijd hoog is, mag de tekst meer informatie bevatten.',
      restrictions: [
        'Geen reclame voor fastfood, suikerhoudende dranken of ongezonde snacks.',
        'Geen alcoholreclame (m.u.v. alcoholvrij bier).'
      ],
      deadline: 'Uiterlijk 2 werkdagen voor plaatsing digitaal toesturen.'
    },
    coordinates: { x: 60, y: 90 },
    recommendedFor: ['Sportievelingen', 'Zakelijk publiek']
  },
  {
    id: 'loc-9',
    name: 'Hoog Catharijne Central Mall',
    type: 'digital',
    street: 'Catharijne Esplanade 2',
    city: 'Utrecht',
    neighborhood: 'Binnenstad / Hoog Catharijne',
    reach: 210000,
    price: 495,
    image: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=800&q=80',
    description: 'Ons absolute vlaggenschip wat betreft bereik: een gigantisch digitaal LED-scherm in de centrale hal van Hoog Catharijne, het drukst bezochte overdekte winkelcentrum van Nederland. Ideaal voor merkactivaties en retail-gedreven campagnes.',
    dimensions: '3840 x 2160 pixels (Ultra HD, Landschap)',
    visibility: 'Monumentaal zichtbaar vanaf alle etages en loopbruggen in de centrale passage.',
    environment: 'Modern retail-walhalla met miljoenen passanten per jaar, direct verbonden met Utrecht Centraal.',
    specs: {
      formats: ['4K MP4 Video (max 30fps)', 'Ultra-HD static PNG'],
      maxTextDensity: 'Max 25% tekst. Heldere, minimalistische beelden met sterke contrasten trekken hier de meeste aandacht.',
      restrictions: [
        'Mag geen uitingen bevatten die rechtstreeks concurreren met winkeliers in het winkelcentrum zonder hun goedkeuring.'
      ],
      deadline: 'Uiterlijk 4 werkdagen vooraf digitaal testen op ons testpaneel.'
    },
    coordinates: { x: 52, y: 46 },
    recommendedFor: ['Gezinnen', 'Studenten']
  },
  {
    id: 'loc-10',
    name: 'Spuistraat Culinaire Boulevard',
    type: 'abri',
    street: 'Spuistraat 18',
    city: 'Den Haag',
    neighborhood: 'Centrum',
    reach: 82000,
    price: 195,
    image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=800&q=80',
    description: 'Klassieke verlichte abri-poster in een druk bezochte voetgangerszone vol met cafés, boetiekjes en restaurants. Uitstekend voor lifestyle-merken, lokale restaurants, evenementen en culturele promoties.',
    dimensions: '118.5 x 175 cm',
    visibility: 'Zijdeverlicht, vlak naast populaire afhaalrestaurants en boetiekjes.',
    environment: 'Smalle, drukke voetgangersstraat in het Haagse centrum met een hoog aandeel jonge stadsbewoners.',
    specs: {
      formats: ['Geprinte poster (118.5x175cm), blueback of backlit posterpapier.'],
      maxTextDensity: 'Max. 45% tekstoppervlakte. Kleurrijke, artistieke posters vallen hier extra goed op.',
      restrictions: [
        'Geen reclame die aanzet tot overmatige geluidshinder of openbare dronkenschap.'
      ],
      deadline: 'Fysiek bezorgen uiterlijk 5 werkdagen voor geplande plaatsingsdatum.'
    },
    coordinates: { x: 37, y: 52 },
    recommendedFor: ['Sportievelingen', 'Studenten', 'Gezinnen']
  }
];

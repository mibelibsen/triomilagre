# Trio Milagre

Hjemmesiden for Trio Milagre, en bossa nova-trio (sang, bas, klaver). Sitet
ligger på **triomilagre.com** og bliver deployet automatisk fra `main`.

Skriv kode, kommentarer og commit-beskeder på **dansk**.

## Hvem gør hvad

- **Redaktøren** (fra trioen) ejer indholdet: koncerter, tekster, billeder,
  videoer. Hun er ikke udvikler og skal ikke røre git, GitHub eller Vercel.
  Det er dit job.
- **Michael** (mibelib@gmail.com) ejer driften: GitHub-repoet, Vercel-projektet
  og domænet. Alt om hosting, miljøvariabler og DNS går til ham.

**Når en ændring er færdig, committer og pusher du selv til `main`.** Uden at
spørge først. En opgave er ikke afsluttet ved en gemt fil, den er afsluttet, når
den ligger på GitHub. Et par minutter efter er den live.

- **Alt skal ende på `main`.** Vercel bygger kun `main` til triomilagre.com.
  Arbejder du i en Claude Code-session, der er sat op med sin egen gren
  (fx `claude/...`), har du repo-ejerens udtrykkelige lov til at lægge dine
  commits på `main`, når de er færdige og testede: `git fetch origin main`,
  merge eller rebase din gren oven på `origin/main`, og push til `main`.
  En ændring, der kun ligger på en anden gren, er ikke afsluttet, og
  besøgende ser den ikke.
- Én commit pr. afsluttet ændring.
- Commit-beskeden siger, hvad der ændrede sig for besøgende på sitet, ikke
  hvilke linjer du rettede. Fx `Tilføj koncert på Godsbanen 22. november`.
- Er du usikker på, om en ændring er rigtig, så vis den og spørg **før** du
  gemmer.

## Struktur

    index.html          Hele sitet: stil, markup og JavaScript i én fil
    api/instagram.js    Vercel-funktion, der henter Instagram-feedet
    api/booking.js      Vercel-funktion, der mailer bookingforespørgsler via Resend

Der er ingen build, ingen framework, ingen npm-pakker. Filerne serveres som de
er. Hold det sådan: ingen `import` af pakker, ingen bundler, ingen
transpilering, kun JavaScript og CSS, som browsere forstår i dag.

## Hvor indholdet rettes

Alt indhold, der ændrer sig jævnligt, ligger i **afsnit 1, OPSÆTNING**, øverst
i `<script>`-blokken i `index.html`. Det er der, du retter i langt de fleste
opgaver:

| Liste | Hvad den styrer |
| --- | --- |
| `CONFIG` | Instagram-link og adressen på bookingfunktionen |
| `GIGS` | Koncertkalenderen. Én linje pr. koncert |
| `MEMBERS` | De tre musikere: navn, rolle, foto, link, bio |
| `VIDEOS` | Videoerne på "Lyt & se". `youtube` er video-id'et fra URL'en |
| `PACKAGES` | De tre bookingpakker nederst på bookingsiden |
| `REPERTOIRE` | Tags under "Hvad vi spiller" |
| `IG_OPSLAG` | Faste Instagram-opslag, bruges når feedet ikke er koblet på |

Afsnit 2 er den kode, der tegner siden. Rør den kun, når opgaven tydeligt
handler om, hvordan sitet virker, ikke hvad det siger.

Faste tekster (overskrifter, brødtekst, formularens felter) ligger i selve
HTML'en. Sitet har fem sider, hver sin `<section class="page">`:

| Side | Id | Adresse |
| --- | --- | --- |
| Forside | `page-forside` | `#/` |
| Trioen | `page-trioen` | `#/trioen` |
| Lyt & se | `page-lyt` | `#/lyt` |
| Koncerter | `page-koncerter` | `#/koncerter` |
| Book | `page-booking` | `#/booking` |

Navigationen er hash-baseret. Der er ingen server-routing, så en ny side
kræver både en ny `<section class="page">`, et link i `<nav>` og en post i
listen `RUTER`.

## Regler for koncerter

- `dato` er altid `'ÅÅÅÅ-MM-DD'`. `tid` er `'20.00'` eller `''`.
- `status` skal være én af: `Fri entré`, `Billetter`, `Få pladser`, `Udsolgt`,
  `Privat`. Andet får en neutral farve.
- Afholdte koncerter skjules automatisk og vises kun under "Afholdte", når
  besøgende slår dem til. Slet dem ikke, medmindre redaktøren beder om det.
- Forsiden viser selv de tre næste. Der skal ikke rettes noget der.
- Kalenderen, søgemaskinedata og "Gem i kalender" bygges ud fra `GIGS`. Én
  rettelse ét sted er nok.

## Billeder og medier

- Læg billeder i mappen `billeder/` i repoet og henvis med relativ sti,
  fx `billeder/emma.jpg`. Hold dem under ca. 500 KB. Er de større, så nedskalér
  først.
- **Et billede er ikke lagt ind, før selve filen ligger i repoet.** Et
  `<img src="billeder/...">` alene giver et ødelagt billede på sitet. Sådan
  gør du:
  1. Bed redaktøren vedhæfte billedet i chatten, hvis det ikke allerede er
     der. Uploadede filer ligger typisk under `/root/.claude/uploads/` eller
     den sti, systemet oplyser.
  2. Kopiér filen ind i `billeder/` med et kort navn med små bogstaver og
     uden mellemrum og æøå, fx `billeder/om-trioen.jpg`.
  3. Tjek med `ls billeder/`, at filen er der, og med `git status`, at den
     er med i commit'et sammen med rettelsen i `index.html`.
  4. Push. Kan du ikke få fat i filen, så sig det til redaktøren i stedet for
     at henvise til en fil, der ikke findes.
- Findes en henvist fil ikke, viser sitet en farvet plade med teksten
  "(filen mangler i mappen billeder/)". Ser du den på sitet, er det trin 1
  til 3, der er sprunget over.
- Tomme `billede: ''` giver en farvet plade med en tekst. Det er med vilje,
  ikke en fejl.
- Videoer afspilles via YouTube (`youtube-nocookie.com`). Kun video-id'et,
  ikke hele URL'en.

## Instagram og booking

- Instagram-feedet hentes af `api/instagram.js` ud fra miljøvariablen
  `IG_FEED_URL` (anbefalet, fx behold.so) eller `IG_TOKEN` (Meta-nøgle,
  udløber efter 60 dage). De sættes i Vercel af Michael, **aldrig i koden**.
  Er ingen sat, vises `IG_OPSLAG`, og intet går i stykker.
- Bookingformularen sender til `api/booking.js`, som mailer forespørgslen via
  **Resend** til `st.tristan@gmail.com`. Nøglen `RESEND_API_KEY` og evt.
  `BOOKING_TIL` / `BOOKING_AFSENDER` sættes i Vercel af Michael, **aldrig i
  koden**. Afsenderen skal være på et domæne, der er verificeret i Resend.
- **Booking sker kun gennem formularen.** Der vises hverken mail eller
  telefon til booking på sitet. Sæt dem ikke ind igen, medmindre redaktøren
  beder om det.
- Formularen har et skjult robotfelt (`ekstra`). Giv det aldrig et navn som
  "firma", "telefon" eller lignende: browserens autofyld udfylder det, og så
  bliver rigtige forespørgsler afvist som robotter.

## Faldgruber

- **Repoet er offentligt.** Ingen nøgler, adgangskoder eller privat data i
  koden. Ikke engang midlertidigt.
- Tekster i JavaScript-listerne står i enkelte anførselstegn. Skal der en
  apostrof ind (fx `Nara Leão's`), så brug dobbelte anførselstegn om hele
  strengen eller skriv `\'`. Ellers går hele siden i sort.
- Alt tegnes med `esc()`, så tekst med `<`, `&` og lignende er sikker. Skriv
  ikke HTML ind i listerne. Det bliver vist som tekst.
- Efter en rettelse i JavaScript: tjek, at der ikke er syntaksfejl. Klip
  `<script>`-indholdet ud i en fil og kør `node --check` på den, eller åbn
  siden og se, at listerne stadig tegnes.
- Vercel deployer ved hvert push til `main`. Det tager 1 til 3 minutter. Hvis
  ændringen ikke kan ses, så hard-refresh (Ctrl+Shift+R) før du fejlsøger.

## Drift (kun Michael)

- Vercel-team: *mibelibsen's projects*. Projekt: **trio-milagre-dk** (med
  bindestreg). Domæner: triomilagre.com og www.triomilagre.com.
- Går sitet i stykker: Vercel, Deployments, forrige grønne deploy, Instant
  Rollback. Ret derefter fejlen i git.

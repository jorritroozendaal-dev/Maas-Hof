# Maas & Hof

Website voor Maas & Hof, gericht op jonge professionals en ondernemers van 25 tot 40 jaar. De missie, visie en slogan **Voor jou. Met jou. Voor later.** zijn verwerkt in de teksten en opbouw.

## Website aanpassen

De volledige website staat in de hoofdmap van deze repository:

- `index.html`: inhoud en paginaopbouw.
- `style.css`: vormgeving en mobiele layouts.
- `app.js`: spaarplanner, dienstenvensters, mobiel menu en kennismakingsmail.
- `mortgage-tool.mjs` en `mortgage.css`: hypotheekrekentool en bijbehorende vormgeving.
- `mortgage-math.mjs`: onafhankelijke rekenlogica voor annuïtaire en lineaire hypotheken.
- `mortgage-income.mjs` en `mortgage-income-data.mjs`: inkomensindicatie met officiële financieringslastpercentages van 2026.
- `tests/*.test.mjs`: automatische tests voor de financiële berekeningen en inkomensnormen.
- `assets/`: lokale fotografie, lettertypen en favicon. Bronnen staan in `assets/SOURCES.txt`.

Dit is een statische website zonder buildstap of externe JavaScript-afhankelijkheden. Alle assetpaden zijn relatief, zodat de website ook werkt op een GitHub Pages-projectadres met een repositorynaam in het pad.

## Publiceren met GitHub Pages

GitHub Pages is ingeschakeld voor deze repository. De websitebestanden en `.nojekyll` staan in de hoofdmap, zodat zowel publicatie via GitHub Actions als via de ingestelde bronbranch `main` dezelfde homepage oplevert. Bij een nieuwe inrichting kun je bij **Settings → Pages → Build and deployment → Source** kiezen voor **GitHub Actions**. De workflow in `.github/workflows/pages.yml` publiceert de website na wijzigingen op `main`. Je kunt hem ook handmatig starten via **Actions → Publish website to GitHub Pages → Run workflow**.

Het definitieve websiteadres verschijnt bij de geslaagde Pages-deployment en in **Settings → Pages**. Het standaardadres voor deze repository is `https://jorritroozendaal-dev.github.io/Maas-Hof/`.

## Contact en privacy

Het contactformulier opent een voorbereid bericht in het e-mailprogramma van de bezoeker. Het verstuurt of bewaart geen gegevens automatisch. De spaarplanner rekent lokaal in de browser, zonder rente of rendement, en geeft geen persoonlijk financieel advies. Ook de hypotheekrekentool verwerkt en bewaart geen gegevens op een server.

De externe hypotheekberekening opent op de website van Nationale Hypotheek. Er zijn geen analysetrackers of advertentiecookies toegevoegd.

## Controle

Controleer na een wijziging de ankers, relatieve assetpaden, mobiele weergave en contactgegevens. JavaScript-syntax is lokaal te controleren met:

```sh
node --check app.js
```

## Hypotheekrekentool

De tool berekent een basisindicatie van de maximale hypotheek op bruto jaarinkomen, bruto maandlasten bij een leningbedrag of een theoretisch leningbedrag bij een zelfgekozen bruto maandbudget. Annuïtair en lineair aflossen worden ondersteund. De uitsplitsing toont rente en aflossing in de eerste maand, de laatste maandlast, totale rente en de jaarlijkse restschuld.

Dit is een rekenvoorbeeld met één leningdeel en een vaste rente voor de hele looptijd. De standaardrente van 4% is een instelbaar voorbeeld en geen renteaanbieding. De stand “Maximaal lenen” gebruikt de officiële financieringslastpercentages van 2026. De andere twee standen toetsen geen leencapaciteit. Een geldverstrekker moet bestendigheid van inkomsten, persoonlijke verplichtingen, woningwaarde en acceptatievoorwaarden apart beoordelen. Bij de budgetmodus wordt voor lineair aflossen de hoogste, eerste maandlast gebruikt. Bedragen worden alleen bij weergave afgerond; het budgetbedrag van de lening wordt naar beneden afgerond op hele euro’s.

De financiële tests worden ook in GitHub Actions uitgevoerd vóór publicatie:

```sh
node --test tests/*.test.mjs
```

Achtergrondinformatie: [AFM over betaalbaarheid](https://www.afm.nl/nl-nl/consumenten/themas/hypotheken/hypotheek-betalen) en [ABN AMRO over hypotheekvormen](https://www.abnamro.nl/nl/prive/hypotheken/hypotheek-afsluiten/hypotheekvormen/annuiteiten-of-lineair.html).

### Inkomensindicatie — normen 2026

- Eigen bruto toetsinkomen en een eventueel meelenend partnerinkomen tellen voor 100% mee. Een uitgeschakeld partnerinkomen wordt genegeerd. Geen inkomen wordt als bestendig gevalideerd door de tool.
- Alleen aanvragers die niet binnen tien jaar de AOW-leeftijd bereiken, volledig aftrekbare rente, één leningdeel en dertig jaar annuïtair aflossen vallen binnen dit model.
- De financieringslastpercentages komen integraal uit tabel 1 van de [Wijzigingsregeling hypothecair krediet 2026](https://zoek.officielebekendmakingen.nl/stcrt-2025-36471.html) en zijn vergeleken met de [geconsolideerde regeling](https://repository.officiele-overheidspublicaties.nl/bwb/BWBR0032503/2026-01-01_0/xml/BWBR0032503_2026-01-01_0.xml). Er worden geen inkomensmultiples of geïnterpoleerde percentages gebruikt.
- De lookup gebruikt de hoogste inkomensrij die niet boven het werkelijke gezamenlijke inkomen ligt. Boven €125.000 blijft het percentage uit de laatste tabelrij gelden; het model ondersteunt gezamenlijk maximaal €500.000. Dit sluit aan bij de benaderende MATCH-formule in de oorspronkelijke Nibud-rekenhulp (gespiegeld op [Adviesforum](https://adviesforum.nl/documenten/Bijlage-financieringslastnormen-2026.xlsx)); alle tabelcellen zijn gecontroleerd tegen de primaire overheidspublicatie.
- Bij minder dan tien jaar rentevast wordt de hoogste van de opgegeven rente en de AFM-toetsrente van 5% voor kwartaal 4 van 2026 gebruikt. De getoonde bruto maandlast rekent vervolgens met de opgegeven voorbeeldrente.
- De reeds bepaalde bruto toetslast van overige verplichtingen wordt van de maandruimte afgetrokken. Het veld is geen omzetting van gewone DUO-, lease- of BKR-maandbetalingen; zulke verplichtingen vragen een afzonderlijke toets en waar nodig brutering.
- Extra leenruimte voor alleenstaanden of energielabels wordt niet meegenomen. De berekening bevat geen woningwaardetoets, NHG-beoordeling, pensioenberekening of individuele uitzonderingen. De uitkomst is een basisindicatie op inkomen en geen financieringsaanbod.
- Dit is een vast 2026-model; de versie claimt geen actuele normen voor latere jaren. De pagina toont de normversie bij de uitkomst en een extra melding wanneer het browserjaar afwijkt van 2026.

## Paginastructuur

- `index.html`: korte introductie en ingangen naar diensten en tools.
- `diensten.html`: hypotheekadvies, volgende levensfase en vermogensopbouw.
- `werkwijze.html`: kennismaken, inzicht, advies en begeleiding.
- `over-ons.html`: ons verhaal, missie, visie en waarden.
- `rekentools.html`: hypotheekindicatie op inkomen, maandlasten en spaarplanner.
- `veelgestelde-vragen.html`: antwoorden over kennismaken, kosten en advies.
- `contact.html`: contactgegevens en het kennismakingsformulier.

De paginas delen `app.js`, `style.css` en `pages.css`. Alleen de rekentoolpagina laadt de hypotheekmodules. `navigation.js` stuurt oudere homepage-links zoals `#hypotheek-berekenen` door naar de passende nieuwe pagina. Relatieve paden blijven werken onder het GitHub Pages-projectpad.

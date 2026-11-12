# Maas & Hof

Website voor Maas & Hof, gericht op jonge professionals en ondernemers van 25 tot 40 jaar. De missie, visie en slogan **Voor jou. Met jou. Voor later.** zijn verwerkt in de teksten en opbouw.

## Website aanpassen

De volledige website staat in de hoofdmap van deze repository:

- `index.html`: inhoud en paginaopbouw.
- `style.css`: vormgeving en mobiele layouts.
- `app.js`: spaarplanner, dienstenvensters, mobiel menu en kennismakingsmail.
- `mortgage-tool.mjs` en `mortgage.css`: hypotheekrekentool en bijbehorende vormgeving.
- `mortgage-math.mjs`: onafhankelijke rekenlogica voor annuïtaire en lineaire hypotheken.
- `tests/mortgage-math.test.mjs`: automatische tests voor de financiële berekeningen.
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

De tool berekent bruto maandlasten bij een leningbedrag of een theoretisch leningbedrag bij een zelfgekozen bruto maandbudget. Annuïtair en lineair aflossen worden ondersteund. De uitsplitsing toont rente en aflossing in de eerste maand, de laatste maandlast, totale rente en de jaarlijkse restschuld.

Dit is een rekenvoorbeeld met één leningdeel en een vaste rente voor de hele looptijd. De standaardrente van 4% is een instelbaar voorbeeld en geen renteaanbieding. De tool toetst geen inkomen, schulden, woningwaarde of wettelijke leennormen en berekent geen persoonlijke maximale hypotheek. Bij de budgetmodus wordt voor lineair aflossen de hoogste, eerste maandlast gebruikt. Bedragen worden alleen bij weergave afgerond; het budgetbedrag van de lening wordt naar beneden afgerond op hele euro’s.

De financiële tests worden ook in GitHub Actions uitgevoerd vóór publicatie:

```sh
node --test tests/mortgage-math.test.mjs
```

Achtergrondinformatie: [AFM over betaalbaarheid](https://www.afm.nl/nl-nl/consumenten/themas/hypotheken/hypotheek-betalen) en [ABN AMRO over hypotheekvormen](https://www.abnamro.nl/nl/prive/hypotheken/hypotheek-afsluiten/hypotheekvormen/annuiteiten-of-lineair.html).

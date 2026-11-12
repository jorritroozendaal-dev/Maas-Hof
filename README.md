# Maas & Hof

Website voor Maas & Hof, gericht op jonge professionals en ondernemers van 25 tot 40 jaar. De missie, visie en slogan **Voor jou. Met jou. Voor later.** zijn verwerkt in de teksten en opbouw.

## Website aanpassen

De volledige website staat in `site/`:

- `index.html`: inhoud en paginaopbouw.
- `style.css`: vormgeving en mobiele layouts.
- `app.js`: spaarplanner, dienstenvensters, mobiel menu en kennismakingsmail.
- `assets/`: lokale fotografie, lettertypen en favicon. Bronnen staan in `assets/SOURCES.txt`.

Dit is een statische website zonder buildstap of externe JavaScript-afhankelijkheden. Alle assetpaden zijn relatief, zodat de website ook werkt op een GitHub Pages-projectadres met een repositorynaam in het pad.

## Publiceren met GitHub Pages

Kies in de repository bij **Settings → Pages → Build and deployment → Source** voor **GitHub Actions**. De workflow in `.github/workflows/pages.yml` publiceert `site/` na wijzigingen op `main`. Je kunt hem ook handmatig starten via **Actions → Publish website to GitHub Pages → Run workflow**.

Het definitieve websiteadres verschijnt bij de geslaagde Pages-deployment en in **Settings → Pages**. Het standaardadres voor deze repository is `https://jorritroozendaal-dev.github.io/Maas-Hof/`.

## Contact en privacy

Het contactformulier opent een voorbereid bericht in het e-mailprogramma van de bezoeker. Het verstuurt of bewaart geen gegevens automatisch. De spaarplanner rekent lokaal in de browser, zonder rente of rendement, en geeft geen persoonlijk financieel advies.

De externe hypotheekberekening opent op de website van Nationale Hypotheek. Er zijn geen analysetrackers of advertentiecookies toegevoegd.

## Controle

Controleer na een wijziging de ankers, relatieve assetpaden, mobiele weergave en contactgegevens. JavaScript-syntax is lokaal te controleren met:

```sh
node --check site/app.js
```

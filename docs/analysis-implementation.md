# Verwerking website-analyse — 13 november 2026

De aangeleverde analyse is verwerkt op de bestaande statische website. De tekst noemt een adviesconcept in ontwikkeling; er worden geen onbevestigde tarieven, bevoegdheden, fondsen of onderzoeksresultaten verzonnen.

| Aanbeveling | Verwerking | Nog nodig |
|---|---|---|
| Kosten en Vergelijkingskaart | Kostenmatrix met kennismaking, advies, bemiddeling, beleggen en nazorg; aparte vindbare status van de kaart | Onderbouwde tarieven, definitief verdienmodel en toepasselijke eigen kaart |
| Klantreis | Twee trajecten van zes fasen met klantactie, beoogde rol, resultaat en kostenafspraak | Toets aan de uiteindelijke dienstverlening |
| Vertrouwen | Conceptstatus, contactpersoon, ontbrekende bedrijfs-/registratiegegevens, feedbackroute; onafhankelijkheidsclaim verwijderd | Gecontroleerde entiteit, adviseurs, kwalificaties, vergunningen en klachtenregeling |
| Contact | Heldere mailknop, expliciet nog-niet-verzonden status, kopieerknop met handmatige fallback en directe bel-/maillinks | Voor automatische ontvangst: een gekozen backend/formulierdienst en privacy-inrichting |
| Navigatie | Hypotheken, Beleggen & vermogen, Werkwijze & tarieven rechtstreeks in hoofdnavigatie | — |
| Producten en duurzaamheid | Selectiecriteria per dienst en duidelijke ontwikkelstatus van het huisfonds | Daadwerkelijke selectie, fondsdocumentatie en passende bevoegdheden |
| Kleuren | Wit, #16463B en #C8D8C5; rustiger, consistent palet | Visuele gebruikerstest |
| Leesbaarheid | Tekst- en labelformaten vergroot, mobiele toolstanden onder elkaar, focus/menu behouden | Echte browser-, zoom- en schermlezertests |
| Techniek | Gedeelde header/footer, bronpagina’s en dependencyvrije build; ongebruikte dialogs en diensten-JS verwijderd | — |
| Privacy | Losse privacy.html, footer- en formulierlink, beschrijving huidige technische verwerking en open beleidsgegevens | Definitieve verantwoordelijke entiteit, mailboxverwerkers en bewaarbeleid |
| Tools | Beperking direct bij resultaat, duidelijke vervolgstap, normbeheerprocedure | Periodieke bron-/normcontrole door aangewezen beheerder |
| SEO | Sitemap, robots-bestand, og:image, specifieke titels en canonical-URL’s | Lighthouse-meting; hostbrede robots-inrichting indien nodig |
| Gebruikersonderzoek | Testplan en invultabel toegevoegd; uitgevoerde technische checks apart beschreven | Deelnemers uit doelgroep en Critical Friend-feedback; niet als uitgevoerd gepresenteerd |

Voorbeelden vóór wijziging zijn terug te vinden in Git-commit `5274fd8`. De analysewijzigingen zijn in opvolgende commits te vergelijken. Er zijn geen gebruikerssessies, e-mailafleveringen of Lighthouse-metingen verzonnen.

## Technische controle

- HTML-links, assets, ankers, labels en gedeelde navigatie controleren.
- Build moet herhaalbaar zijn zonder verschillen in gegenereerde bestanden.
- Hypotheekberekeningen worden vóór publicatie met de bestaande automatische tests gecontroleerd.
- Contact moet geen succesvolle verzending melden; alleen openen/kopiëren van een concept.
- Browserbediening is in deze omgeving niet beschikbaar; technische mocks zijn geen vervanging voor een echte gebruikerstest.

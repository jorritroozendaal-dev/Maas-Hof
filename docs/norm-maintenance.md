# Onderhoud hypotheeknormen

De eigenaar/beheerder van de repository moet een verantwoordelijke voor inhoudelijke normcontrole aanwijzen. Er is nog geen afzonderlijke inhoudelijk verantwoordelijke als persoon vastgesteld.

- Controleer vóór ieder kalenderjaar de officiële financieringslasttabellen en de voorwaarden van het model. De huidige module is expliciet een 2026-model.
- Controleer vóór ieder kwartaal de AFM-toetsrente voor korte rentevaste perioden en de datum waarop die geldt.
- Vergelijk de gegevens met primaire overheidspublicaties en controleer bronlinks, tabelgrenzen, partnerinkomen, rentegrenzen, verplichtingen en uitzonderingen.
- Pas module, bronmetadata, uitleg, jaaraanduidingen en tests samen aan. Een enkel jaartal vervangen is onvoldoende.
- Laat een deskundige de inhoudelijke wijziging beoordelen. Voer `node --test tests/*.test.mjs` uit en test de interface met en zonder partner, met nul leenruimte en met foutieve invoer.
- Noteer datum, bron, reviewer en commit van een echte controle. De bestaande metadata vermeldt controle op 12 november 2026; deze procedure beweert niet dat latere normcontroles al zijn uitgevoerd.
- De melding voor een ander browserjaar moet zichtbaar blijven zolang er geen passend nieuw model is vastgesteld. Presenteer oude normen niet als actueel.

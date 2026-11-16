# Intranet

De footer verwijst naar `intranet.html`. GitHub Pages is een statische host; daarom bestaat hier geen serverlogin of persoonsgebonden account. De inhoud is versleuteld met AES-256-GCM. De browser leidt de sleutel af uit het ingevoerde wachtwoord met PBKDF2-SHA-256, 600.000 iteraties en een willekeurig salt. Het wachtwoord en de leesbare interne inhoud staan niet in deze repository.

`intranet-payload.json` bevat alleen de versleutelde inhoud en de publieke parameters. HTML verbergen of een JavaScript-controle overslaan ontsleutelt deze inhoud niet. Het openbare wachtwoordscherm zelf kan iedereen bezoeken. Iedereen die het wachtwoord kent, kan de inhoud ontsleutelen; deze oplossing verifieert geen identiteit en biedt geen serverlimiet op wachtwoordpogingen.

Er zijn nog geen interne documenten toegevoegd. Plaats nooit leesbare privébestanden of wachtwoorden in deze openbare repository. Links naar gewone bestanden op GitHub Pages worden niet privé doordat ze vanuit dit intranet worden getoond. Voor persoonsgebonden toegang, uploads, intrekken van toegang of gevoelige bedrijfsdossiers is een server of toegangsprovider met accounts nodig.

De sessie wordt niet in cookies of browseropslag bewaard. Vergrendelen verwijdert de ontsleutelde inhoud uit de pagina; herladen en na vijftien minuten opnieuw openen vragen het wachtwoord. Ook bij terugkeer via de browsergeschiedenis wordt de inhoud vergrendeld. Een ingelogde bezoeker kan leesbare inhoud zelf kopiëren.

Bij inhouds- of wachtwoordwijzigingen moet de volledige payload buiten deze repository opnieuw worden versleuteld. Commit uitsluitend de ciphertext. Oude versies blijven in Git-geschiedenis bestaan; opnieuw versleutelen trekt toegang tot oude ciphertext niet met terugwerkende kracht in. De wachtwoordkeuze wordt niet gedocumenteerd in publieke broncode of tests.

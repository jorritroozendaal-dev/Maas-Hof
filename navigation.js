const destinations = {"#hypotheek-berekenen":"rekentools.html#hypotheek-berekenen","#eerste-inzicht":"rekentools.html#eerste-inzicht","#over-ons":"over-ons.html#over-ons","#onze-overtuiging":"over-ons.html#onze-overtuiging","#onze-aanpak":"werkwijze.html#onze-aanpak","#vragen":"veelgestelde-vragen.html#vragen","#contact":"contact.html"};
function followLegacyAnchor(){if(destinations[location.hash])location.replace(destinations[location.hash]);}
followLegacyAnchor();
window.addEventListener('hashchange',followLegacyAnchor);

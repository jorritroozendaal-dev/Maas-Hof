const $ = (selector) => document.querySelector(selector);
const contactDialog = $('#contact-dialog');
const serviceDialog = $('#service-dialog');
const privacyDialog = $('#privacy-dialog');
let activeDialog = null;

function openDialog(dialog) {
  if (activeDialog?.open) activeDialog.close();
  dialog.showModal();
  activeDialog = dialog;
  document.body.style.overflow = 'hidden';
}

for (const dialog of document.querySelectorAll('dialog')) {
  dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    if (activeDialog === dialog) {
      activeDialog = null;
      document.body.style.overflow = '';
    }
  });
  dialog.addEventListener('click', (event) => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
}

function openContact(topic) {
  if (topic) $('#contact-form').elements.topic.value = topic;
  $('#form-status').textContent = '';
  if (contactDialog) {
    openDialog(contactDialog);
  } else {
    const form = $('#contact-form');
    form.scrollIntoView({ behavior: 'smooth', block: 'center' });
    form.elements.name.focus({ preventScroll: true });
  }
}

for (const button of document.querySelectorAll('[data-contact]')) {
  button.addEventListener('click', () => {
    closeMenu();
    openContact();
  });
}

const menuToggle = $('.menu-toggle');
const mobileNav = $('#mobile-nav');
function closeMenu() {
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', 'Menu openen');
  mobileNav.hidden = true;
}
menuToggle.addEventListener('click', () => {
  const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
  menuToggle.setAttribute('aria-expanded', String(!isOpen));
  menuToggle.setAttribute('aria-label', isOpen ? 'Menu openen' : 'Menu sluiten');
  mobileNav.hidden = isOpen;
});
for (const link of mobileNav.querySelectorAll('a')) link.addEventListener('click', closeMenu);
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menuToggle.getAttribute('aria-expanded') === 'true') {
    closeMenu();
    menuToggle.focus();
  }
});
window.matchMedia('(min-width: 701px)').addEventListener('change', (event) => { if (event.matches) closeMenu(); });

const serviceContent = {
  'eerste-huis': {
    label: 'VAN WOONWENS NAAR WOONPLAN',
    title: 'Je eerste huis. Een helder begin.',
    description: 'Een huis kopen is een grote stap. We kijken naar je woonwensen én de financiële ruimte die je over wilt houden voor je toekomst.',
    points: ['Inzicht in inkomen, eigen geld, maandlasten en toekomstige plannen.', 'Uitleg over hypotheekvormen, voorwaarden en financiële risico’s.', 'Aandacht voor energiezuinig wonen en mogelijke verduurzaming.'],
    footnote: 'Wil je eerst zelf rekenen? De hypotheekrekentool geeft een indicatie op inkomen en laat bruto maandlasten zien. Je daadwerkelijke leencapaciteit vraagt om een persoonlijke beoordeling.',
    topic: 'Mijn eerste huis'
  },
  'volgende-stap': {
    label: 'RUIMTE VOOR EEN NIEUW HOOFDSTUK',
    title: 'Je leven verandert. Je plan beweegt mee.',
    description: 'Ga je samenwonen, verhuizen of anders werken? We bekijken hoe je financiële keuzes kunnen aansluiten op je nieuwe situatie.',
    points: ['Je huidige hypotheek en nieuwe woonwensen bespreken.', 'De invloed van gezinsplannen, ondernemerschap of wisselend inkomen verkennen.', 'Afspreken welke begeleiding past bij jouw nieuwe levensfase.'],
    footnote: 'Elke situatie is anders. In een kennismaking bespreken we wat voor jou aandacht verdient en welke begeleiding daarbij past.',
    topic: 'Verhuizen of samenwonen'
  },
  later: {
    label: 'VANDAAG BEGINNEN AAN LATER',
    title: 'Meer grip. Meer ruimte voor later.',
    description: 'Financiële vrijheid, ruimte voor je gezin of vermogen voor je pensioen. We beginnen bij wat jij wilt bereiken en onderzoeken welke keuzes daarbij passen.',
    points: ['Je financiële doelen, buffer en beleggingshorizon in kaart brengen.', 'Je kennis, ervaring en bereidheid om risico te nemen bespreken.', 'Kosten, risico’s en duurzaamheidsvoorkeuren samen afwegen.'],
    footnote: 'Beleggen brengt risico’s met zich mee. Je kunt een deel van je inleg verliezen. Wat bij jou past, bespreken we persoonlijk; deze website geeft geen beleggingsadvies.',
    topic: 'Financiële planning en vermogensopbouw'
  }
};
let selectedService = null;
for (const button of document.querySelectorAll('[data-service]')) {
  button.addEventListener('click', () => {
    selectedService = serviceContent[button.dataset.service];
    $('#service-label').textContent = selectedService.label;
    $('#service-title').textContent = selectedService.title;
    $('#service-description').textContent = selectedService.description;
    $('#service-footnote').textContent = selectedService.footnote;
    const points = selectedService.points.map((text) => {
      const li = document.createElement('li');
      li.textContent = text;
      return li;
    });
    $('#service-points').replaceChildren(...points);
    openDialog(serviceDialog);
  });
}
$('#service-contact').addEventListener('click', () => openContact(selectedService?.topic));
$('#privacy-button').addEventListener('click', () => openDialog(privacyDialog));

const euro = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
function updateSavings() {
  const goalInput = $('#goal');
  const goal = goalInput.valueAsNumber;
  const months = Number($('#months').value);
  $('#months-label').textContent = `${months} maanden`;
  if (!Number.isFinite(goal) || goal < 100 || goal > 1000000) {
    $('#monthly-amount').textContent = '—';
    goalInput.setAttribute('aria-invalid', 'true');
    $('#goal-error').textContent = 'Vul een spaardoel in tussen € 100 en € 1.000.000.';
    $('#goal-error').hidden = false;
    goalInput.setCustomValidity('Vul een spaardoel in tussen € 100 en € 1.000.000.');
    return;
  }
  goalInput.removeAttribute('aria-invalid');
  $('#goal-error').textContent = '';
  $('#goal-error').hidden = true;
  goalInput.setCustomValidity('');
  $('#monthly-amount').textContent = euro.format(Math.ceil(goal / months));
}
$('#goal')?.addEventListener('input', updateSavings);
$('#months')?.addEventListener('input', updateSavings);
if ($('#goal')) updateSavings();

$('#contact-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const data = new FormData(form);
  const name = String(data.get('name')).trim();
  const email = String(data.get('email')).trim();
  const topic = String(data.get('topic'));
  const message = String(data.get('message')).trim();
  if (!name) {
    form.elements.name.setCustomValidity('Vul je naam in.');
    form.elements.name.reportValidity();
    form.elements.name.addEventListener('input', () => form.elements.name.setCustomValidity(''), { once: true });
    return;
  }
  const subject = `Kennismaking Maas & Hof — ${topic}`;
  const body = `Hallo Maas & Hof,\n\nIk wil graag vrijblijvend kennismaken.\n\nNaam: ${name}\nE-mailadres: ${email}\nOnderwerp: ${topic}\n\n${message ? `${message}\n\n` : ''}Willen jullie contact met mij opnemen?\n\nMet vriendelijke groet,\n${name}`;
  const link = document.createElement('a');
  link.href = `mailto:Contact@maasenhof.nl?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  link.click();
  $('#form-status').textContent = 'Je e-mailprogramma is aangeroepen. Verstuur het bericht daar om je kennismaking aan te vragen. Opent er niets? Mail dan zelf naar Contact@maasenhof.nl.';
});

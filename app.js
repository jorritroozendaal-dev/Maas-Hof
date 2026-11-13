const $ = (selector) => document.querySelector(selector);
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
window.matchMedia('(min-width: 1101px)').addEventListener('change', (event) => { if (event.matches) closeMenu(); });

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

const contactForm = $('#contact-form');
if (contactForm) {
for (const button of contactForm.querySelectorAll('[data-contact-action]')) button.disabled = false;
contactForm.elements.name.addEventListener('input', () => contactForm.elements.name.setCustomValidity(''));
contactForm.addEventListener('submit', (event) => {
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
  $('#form-status').textContent = 'Je aanvraag is nog niet verzonden. Verstuur het bericht in je mailprogramma. Opent er niets? Kopieer je bericht en mail het zelf naar Contact@maasenhof.nl.';
});

$('#copy-message').addEventListener('click', async () => {
  contactForm.elements.name.setCustomValidity(contactForm.elements.name.value.trim() ? '' : 'Vul je naam in.');
  if (!contactForm.reportValidity()) return;
  const data = new FormData(contactForm);
  const text = `Aan: Contact@maasenhof.nl\nOnderwerp: Kennismaking — ${data.get('topic')}\n\nHallo Maas & Hof,\n\n${String(data.get('message')).trim()}\n\nWillen jullie contact met mij opnemen?\nNaam: ${String(data.get('name')).trim()}\nE-mail: ${data.get('email')}`;
  try {
    await navigator.clipboard.writeText(text);
    $('#form-status').textContent = 'Je bericht is gekopieerd, nog niet verzonden. Plak het in je e-mail en verstuur het naar Contact@maasenhof.nl.';
  } catch {
    $('#copy-fallback-field').hidden = false;
    $('#copy-fallback').value = text;
    $('#copy-fallback').focus();
    $('#copy-fallback').select();
    $('#form-status').textContent = 'Automatisch kopiëren lukt niet. Kopieer de geselecteerde tekst hieronder en verstuur die via je eigen e-mail.';
  }
});
}

import { decryptIntranet } from './intranet-crypto.mjs';
const form = document.querySelector('#intranet-login');
const password = document.querySelector('#intranet-password');
const error = document.querySelector('#intranet-error');
const panel = document.querySelector('#intranet-private');
const content = document.querySelector('#intranet-content');
const submit = form.querySelector('button');
let lockTimer;
let generation = 0;
function lock(focus = false) {
  generation += 1;
  clearTimeout(lockTimer);
  content.replaceChildren();
  panel.hidden = true;
  form.hidden = false;
  password.value = '';
  submit.disabled = false;
  error.textContent = '';
  password.removeAttribute('aria-invalid');
  if (focus) password.focus();
}
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const attempt = ++generation;
  submit.disabled = true;
  error.textContent = 'Bezig met ontsleutelen…';
  try {
    const response = await fetch(new URL('./intranet-payload.json', import.meta.url), {cache:'no-store'});
    if (!response.ok) throw new Error('Unavailable');
    const data = await decryptIntranet(await response.json(), password.value);
    if (attempt !== generation) return;
    const title = document.createElement('h2'); title.textContent = data.title;
    const intro = document.createElement('p'); intro.textContent = data.intro;
    const items = [title, intro];
    for (const section of data.sections) {
      const h = document.createElement('h3'); h.textContent = String(section.heading);
      const p = document.createElement('p'); p.textContent = String(section.text);
      items.push(h, p);
    }
    content.replaceChildren(...items);
    password.value = '';
    error.textContent = '';
    form.hidden = true;
    panel.hidden = false;
    panel.focus();
    lockTimer = setTimeout(() => lock(true), 15 * 60 * 1000);
  } catch {
    if (attempt !== generation) return;
    password.value = '';
    password.setAttribute('aria-invalid','true');
    error.textContent = 'Openen is niet gelukt. Controleer je wachtwoord en probeer opnieuw.';
    password.focus();
  } finally {
    if (attempt === generation) submit.disabled = false;
  }
});
document.querySelector('#intranet-lock').addEventListener('click', () => lock(true));
window.addEventListener('pagehide', () => lock());
window.addEventListener('pageshow', event => { if (event.persisted) lock(); });
submit.disabled = false;

import { calculateMortgage } from './mortgage-math.mjs';

const find = (selector) => document.querySelector(selector);
const form = find('#mortgage-form');
const money = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 });
const wholeMoney = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const percent = new Intl.NumberFormat('nl-NL', { maximumFractionDigits: 2 });

function mode() {
  return form.querySelector('input[name="mortgage-mode"]:checked').value;
}

function setMode() {
  const byBudget = mode() === 'budget';
  find('#mortgage-principal-field').hidden = byBudget;
  find('#mortgage-budget-field').hidden = !byBudget;
  find('#mortgage-principal').disabled = byBudget;
  find('#mortgage-budget').disabled = !byBudget;
  find('.mortgage-submit').firstChild.textContent = byBudget ? 'Bereken het leningbedrag ' : 'Bereken mijn maandlasten ';
}

function markPending() {
  find('#mortgage-results').hidden = true;
  find('#mortgage-placeholder').hidden = false;
  find('#mortgage-placeholder p').textContent = 'Je invoer is gewijzigd. Kies Berekenen om je nieuwe uitkomst te zien.';
  find('#mortgage-error').hidden = true;
  find('#mortgage-announcement').textContent = '';
  for (const input of form.querySelectorAll('[aria-invalid]')) input.removeAttribute('aria-invalid');
}

function render(result, settings, example) {
  const byBudget = settings.mode === 'budget';
  const linear = settings.repayment === 'linear';
  find('#mortgage-result-label').textContent = byBudget ? 'REKENBEDRAG BIJ JE MAANDBUDGET' : (linear ? 'BRUTO MAANDLAST IN MAAND 1' : 'BRUTO MAANDLASTEN');
  find('#mortgage-main-amount').textContent = byBudget ? wholeMoney.format(Math.floor(result.principal)) : money.format(result.firstPayment);
  find('#mortgage-main-unit').textContent = byBudget ? 'lening in dit rekenvoorbeeld' : 'per maand';
  find('#mortgage-context').textContent = byBudget
    ? `Bij ${money.format(result.firstPayment)} bruto in de eerste maand, ${percent.format(settings.annualRate)}% rente en ${settings.years} jaar looptijd.`
    : `Voor ${wholeMoney.format(result.principal)} lenen, ${percent.format(settings.annualRate)}% rente en ${settings.years} jaar looptijd. ${linear && settings.annualRate > 0 ? 'Het bruto maandbedrag daalt tijdens de looptijd.' : 'Het bruto maandbedrag blijft gelijk bij deze vaste rekenrente.'}`;
  find('#mortgage-example').hidden = !example;
  find('#mortgage-budget-limit').hidden = !byBudget;
  find('#mortgage-first-interest').textContent = money.format(result.firstInterest);
  find('#mortgage-first-principal').textContent = money.format(result.firstPrincipal);
  find('#mortgage-last-payment').textContent = money.format(result.lastPayment);
  find('#mortgage-total-interest').textContent = wholeMoney.format(result.totalInterest);

  const points = result.yearlyBalances.map(({ year, balance }) => `${(year / settings.years * 440).toFixed(2)},${(110 - balance / result.principal * 100).toFixed(2)}`);
  const curve = `M${points.join(' L')}`;
  find('#mortgage-chart-line').setAttribute('d', curve);
  find('#mortgage-chart-area').setAttribute('d', `${curve} L440,110 L0,110 Z`);
  find('#mortgage-chart-svg').setAttribute('aria-label', `Openstaande schuld daalt van ${wholeMoney.format(result.principal)} naar nul in ${settings.years} jaar. De tabel hieronder geeft de bedragen.`);
  find('#mortgage-chart-end').textContent = `Na ${settings.years} jaar`;
  const rows = result.yearlyBalances.filter(({ year }) => year === 0 || year % 5 === 0 || year === settings.years).map(({ year, balance }) => {
    const row = document.createElement('tr');
    const label = document.createElement('th');
    label.scope = 'row';
    label.textContent = year === 0 ? 'Bij de start' : `Na ${year} jaar`;
    const value = document.createElement('td');
    value.textContent = wholeMoney.format(balance);
    row.append(label, value);
    return row;
  });
  find('#mortgage-schedule-body').replaceChildren(...rows);
  find('#mortgage-placeholder').hidden = true;
  find('#mortgage-results').hidden = false;
  if (!example) find('#mortgage-announcement').textContent = byBudget
    ? `Rekenbedrag ${wholeMoney.format(Math.floor(result.principal))}. Dit is geen maximale hypotheek of betaalbaarheidstoets.`
    : `Je bruto maandlast ${linear ? 'in de eerste maand' : ''} is ${money.format(result.firstPayment)}.`;
}

function calculate(example = false) {
  find('#mortgage-error').hidden = true;
  const invalid = [...form.querySelectorAll('input,select')].filter((input) => !input.disabled && !input.checkValidity());
  if (invalid.length) {
    find('#mortgage-results').hidden = true;
    find('#mortgage-placeholder').hidden = false;
    find('#mortgage-error').textContent = 'Controleer je invoer. Vul positieve bedragen in, een rente tussen 0 en 20% en een looptijd van 1 tot en met 40 hele jaren.';
    find('#mortgage-error').hidden = false;
    for (const input of invalid) input.setAttribute('aria-invalid', 'true');
    invalid[0].reportValidity();
    return;
  }
  const settings = {
    mode: mode(),
    principal: find('#mortgage-principal').valueAsNumber,
    budget: find('#mortgage-budget').valueAsNumber,
    annualRate: find('#mortgage-rate').valueAsNumber,
    years: find('#mortgage-years').valueAsNumber,
    repayment: find('#mortgage-repayment').value,
  };
  try {
    render(calculateMortgage(settings), settings, example);
  } catch (error) {
    find('#mortgage-results').hidden = true;
    find('#mortgage-placeholder').hidden = false;
    find('#mortgage-error').textContent = error instanceof RangeError ? error.message : 'De berekening kon niet worden uitgevoerd. Controleer je invoer en probeer opnieuw.';
    find('#mortgage-error').hidden = false;
  }
}

form.addEventListener('input', () => { setMode(); markPending(); });
form.addEventListener('change', () => { setMode(); markPending(); });
form.addEventListener('submit', (event) => {
  event.preventDefault();
  calculate();
});
setMode();
calculate(true);

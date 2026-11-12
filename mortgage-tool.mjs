import { calculateMortgage } from './mortgage-math.mjs';
import { calculateIncomeMortgage } from './mortgage-income.mjs';

const find = (selector) => document.querySelector(selector);
const form = find('#mortgage-form');
const money = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 });
const wholeMoney = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const percent = new Intl.NumberFormat('nl-NL', { maximumFractionDigits: 2 });
let previousMode;
let savedYears = find('#mortgage-years').value;
let savedRepayment = find('#mortgage-repayment').value;

function mode() {
  return form.querySelector('input[name="mortgage-mode"]:checked').value;
}

function setMode() {
  const current = mode();
  const byBudget = current === 'budget';
  const byIncome = current === 'income';
  find('#mortgage-principal-field').hidden = current !== 'monthly';
  find('#mortgage-budget-field').hidden = !byBudget;
  find('#mortgage-principal').disabled = current !== 'monthly';
  find('#mortgage-budget').disabled = !byBudget;
  for (const selector of ['#mortgage-income-fields', '#mortgage-income-extra', '#mortgage-fixed-rate-field']) {
    const section = find(selector);
    section.hidden = !byIncome;
    for (const input of section.querySelectorAll('input,select')) input.disabled = !byIncome;
  }
  const includePartner = byIncome && find('#mortgage-has-partner').checked;
  find('#mortgage-partner-field').hidden = !includePartner;
  find('#mortgage-partner-income').disabled = !includePartner;
  if (byIncome && previousMode !== 'income') {
    savedYears = find('#mortgage-years').value;
    savedRepayment = find('#mortgage-repayment').value;
    find('#mortgage-years').value = '30';
    find('#mortgage-repayment').value = 'annuity';
  } else if (!byIncome && previousMode === 'income') {
    find('#mortgage-years').value = savedYears;
    find('#mortgage-repayment').value = savedRepayment;
  }
  find('#mortgage-years').disabled = byIncome;
  find('#mortgage-repayment').disabled = byIncome;
  find('.mortgage-submit').firstChild.textContent = byIncome ? 'Bereken mijn maximale hypotheek ' : byBudget ? 'Bereken het leningbedrag ' : 'Bereken mijn maandlasten ';
  previousMode = current;
}

function markPending() {
  find('#mortgage-results').hidden = true;
  find('#mortgage-placeholder').hidden = false;
  find('#mortgage-placeholder p').textContent = 'Je invoer is gewijzigd. Kies Berekenen om je nieuwe uitkomst te zien.';
  find('#mortgage-error').hidden = true;
  find('#mortgage-announcement').textContent = '';
  for (const input of form.querySelectorAll('[aria-invalid]')) input.removeAttribute('aria-invalid');
}

function render(result, settings, example, incomeResult = null) {
  const byBudget = settings.mode === 'budget';
  const byIncome = settings.mode === 'income';
  const linear = settings.repayment === 'linear';
  find('#mortgage-result-label').textContent = byIncome ? 'INDICATIE MAXIMALE HYPOTHEEK' : byBudget ? 'REKENBEDRAG BIJ JE MAANDBUDGET' : (linear ? 'BRUTO MAANDLAST IN MAAND 1' : 'BRUTO MAANDLASTEN');
  find('#mortgage-main-amount').textContent = byIncome || byBudget ? wholeMoney.format(Math.floor(result.principal)) : money.format(result.firstPayment);
  find('#mortgage-main-unit').textContent = byIncome ? 'op basis van je inkomen' : byBudget ? 'lening in dit rekenvoorbeeld' : 'per maand';
  find('#mortgage-context').textContent = byIncome
    ? (result.principal > 0
      ? `Bij ${wholeMoney.format(incomeResult.combinedIncome)} bruto toetsinkomen, ${percent.format(incomeResult.financingPercentage)}% financieringslast en ${percent.format(incomeResult.assessmentRate)}% toetsrente. Normen ${incomeResult.normYear}, 30 jaar annuïtair.`
      : 'Met je opgegeven bruto toetslasten blijft in deze berekening geen ruimte over voor een hypotheek. Bespreek je volledige situatie met een adviseur.')
    : byBudget
    ? `Bij ${money.format(result.firstPayment)} bruto in de eerste maand, ${percent.format(settings.annualRate)}% rente en ${settings.years} jaar looptijd.`
    : `Voor ${wholeMoney.format(result.principal)} lenen, ${percent.format(settings.annualRate)}% rente en ${settings.years} jaar looptijd. ${linear && settings.annualRate > 0 ? 'Het bruto maandbedrag daalt tijdens de looptijd.' : 'Het bruto maandbedrag blijft gelijk bij deze vaste rekenrente.'}`;
  find('#mortgage-example').textContent = byIncome ? (example ? 'Voorbeeld · 2026' : 'Normen 2026') : 'Voorbeeld';
  find('#mortgage-example').hidden = !example && !byIncome;
  find('#mortgage-budget-limit').hidden = !byBudget;
  find('#mortgage-income-limit').hidden = !byIncome;
  find('#mortgage-norm-expired').hidden = !byIncome || new Date().getFullYear() === 2026;
  find('#mortgage-income-payment').hidden = !byIncome || result.principal === 0;
  find('#mortgage-income-payment-amount').textContent = money.format(result.firstPayment);
  find('#mortgage-result-details').hidden = result.principal === 0;
  find('#mortgage-first-interest').textContent = money.format(result.firstInterest);
  find('#mortgage-first-principal').textContent = money.format(result.firstPrincipal);
  find('#mortgage-last-payment').textContent = money.format(result.lastPayment);
  find('#mortgage-total-interest').textContent = wholeMoney.format(result.totalInterest);

  const points = result.yearlyBalances.map(({ year, balance }) => `${(year / settings.years * 440).toFixed(2)},${(110 - (result.principal > 0 ? balance / result.principal : 0) * 100).toFixed(2)}`);
  const curve = points.length ? `M${points.join(' L')}` : '';
  find('#mortgage-chart-line').setAttribute('d', curve);
  find('#mortgage-chart-area').setAttribute('d', curve ? `${curve} L440,110 L0,110 Z` : '');
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
  if (!example) find('#mortgage-announcement').textContent = byIncome
    ? `Indicatie maximale hypotheek op inkomen: ${wholeMoney.format(Math.floor(result.principal))}, met normen 2026. De werkelijke hypotheek wordt persoonlijk beoordeeld.`
    : byBudget
    ? `Rekenbedrag ${wholeMoney.format(Math.floor(result.principal))}. Dit is geen maximale hypotheek of betaalbaarheidstoets.`
    : `Je bruto maandlast ${linear ? 'in de eerste maand' : ''} is ${money.format(result.firstPayment)}.`;
}

function calculate(example = false) {
  find('#mortgage-error').hidden = true;
  const invalid = [...form.querySelectorAll('input,select')].filter((input) => !input.disabled && !input.checkValidity());
  if (invalid.length) {
    find('#mortgage-results').hidden = true;
    find('#mortgage-placeholder').hidden = false;
    find('#mortgage-error').textContent = 'Controleer de gemarkeerde velden. Gebruik geldige bedragen, een rente tussen 0 en 20% en een hele looptijd tussen 1 en 40 jaar.';
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
    if (settings.mode === 'income') {
      const incomeResult = calculateIncomeMortgage({
        annualIncome: find('#mortgage-annual-income').valueAsNumber,
        hasPartner: find('#mortgage-has-partner').checked,
        partnerIncome: find('#mortgage-partner-income').valueAsNumber,
        annualRate: settings.annualRate,
        fixedRateYears: Number(find('#mortgage-fixed-years').value),
        monthlyObligations: find('#mortgage-obligations').valueAsNumber,
      });
      const result = incomeResult.principal > 0
        ? calculateMortgage({ ...settings, mode: 'monthly', principal: incomeResult.principal, years: 30, repayment: 'annuity' })
        : { principal: 0, firstPayment: 0, lastPayment: 0, firstInterest: 0, firstPrincipal: 0, totalInterest: 0, yearlyBalances: [] };
      render(result, { ...settings, years: 30, repayment: 'annuity' }, example, incomeResult);
    } else {
      render(calculateMortgage(settings), settings, example);
    }
  } catch (error) {
    find('#mortgage-results').hidden = true;
    find('#mortgage-placeholder').hidden = false;
    find('#mortgage-error').textContent = error instanceof RangeError ? error.message : 'De berekening kon niet worden uitgevoerd. Controleer je invoer en probeer opnieuw.';
    find('#mortgage-error').hidden = false;
    const errorFields = { annualIncome: '#mortgage-annual-income', combinedIncome: '#mortgage-annual-income', partnerIncome: '#mortgage-partner-income', annualRate: '#mortgage-rate', fixedRateYears: '#mortgage-fixed-years', monthlyObligations: '#mortgage-obligations' };
    if (errorFields[error.field]) {
      const input = find(errorFields[error.field]);
      input.setAttribute('aria-invalid', 'true');
      input.focus();
    }
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

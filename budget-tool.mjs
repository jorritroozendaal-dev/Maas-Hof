import { parseBudgetAmount, calculateBudget } from './budget-math.mjs';

export function initializeBudgetTool(doc = document) {
  const form = doc.querySelector('#budget-form');
  if (!form) return;
  const find = id => doc.querySelector(`#${id}`);
  const fields = [...form.querySelectorAll('[data-budget-amount]')];
  const partnerToggle = find('budget-has-partner');
  const partner = find('budget-partner-income');
  const results = find('budget-results');
  const placeholder = find('budget-placeholder');
  const error = find('budget-error');
  const announcement = find('budget-announcement');
  const money = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 });
  let hasCalculated = false;

  function clearResult(message = 'Vul je inkomsten en uitgaven in en bereken je maandbudget.') {
    results.hidden = true;
    placeholder.hidden = false;
    find('budget-placeholder-text').textContent = message;
    for (const output of results.querySelectorAll('[data-budget-output]')) output.textContent = '';
    results.removeAttribute('data-state');
    error.hidden = true;
    error.textContent = '';
    announcement.textContent = '';
  }

  function setPartner() {
    const active = partnerToggle.checked;
    partner.disabled = !active;
    find('budget-partner-field').hidden = !active;
    if (!active) partner.value = '';
  }

  function markPending() {
    const pending = hasCalculated;
    clearResult(pending ? 'Je bedragen zijn gewijzigd. Kies Bereken mijn budget voor een nieuwe uitkomst.' : undefined);
    for (const input of fields) input.removeAttribute('aria-invalid');
    if (pending) announcement.textContent = 'Je invoer is gewijzigd. Bereken je budget opnieuw.';
  }

  form.addEventListener('input', markPending);
  partnerToggle.addEventListener('change', () => { setPartner(); markPending(); });
  form.addEventListener('submit', event => {
    event.preventDefault();
    clearResult();
    for (const input of fields) input.removeAttribute('aria-invalid');
    const values = {};
    for (const input of fields) {
      if (input.disabled) { values[input.id] = 0; continue; }
      try {
        values[input.id] = parseBudgetAmount(input.value, { required: input.required, label: input.dataset.budgetLabel });
      } catch (problem) {
        input.setAttribute('aria-invalid', 'true');
        const details = input.closest('details');
        if (details) details.open = true;
        error.textContent = problem.message;
        error.hidden = false;
        input.focus();
        return;
      }
    }
    const result = calculateBudget({
      income: [values['budget-income'], values['budget-partner-income'], values['budget-other-income']],
      housing: ['budget-housing', 'budget-gas', 'budget-water', 'budget-electricity'].map(id => values[id]),
      groceries: values['budget-groceries'],
      otherExpenses: fields.filter(input => input.dataset.budgetGroup === 'other').map(input => values[input.id]),
      savings: values['budget-savings']
    });
    const outputs = {
      'budget-total-income': result.totalIncome,
      'budget-total-housing': result.totalHousing,
      'budget-total-groceries': result.totalGroceries,
      'budget-total-other': result.totalOtherExpenses,
      'budget-total-expenses': result.totalExpenses,
      'budget-before-savings': result.beforeSavings,
      'budget-planned-savings': result.plannedSavings,
      'budget-remaining': result.remaining
    };
    for (const [id, amount] of Object.entries(outputs)) find(id).textContent = money.format(amount / 100);
    let message;
    if (result.beforeSavings < 0) {
      message = `Je geplande uitgaven en reserveringen zijn ${money.format(-result.beforeSavings / 100)} hoger dan je inkomsten, nog vóór sparen. Bekijk welke posten je kunt aanpassen.`;
    } else if (result.remaining < 0) {
      message = `Je spaardoel past nog niet in dit budget. Na sparen kom je ${money.format(-result.remaining / 100)} per maand tekort. Bekijk je spaardoel en uitgaven opnieuw.`;
    } else if (result.remaining === 0) {
      message = 'Je budget is in balans. Na je ingeplande spaardoel blijft er geen extra ruimte over. Controleer of je ook onverwachte en jaarlijkse kosten hebt meegenomen.';
    } else {
      message = 'Dit bedrag blijft over na je ingevulde uitgaven, reserveringen en spaardoel. Controleer welke kosten je nog niet hebt ingevuld voordat je deze ruimte aan nieuwe plannen besteedt.';
    }
    find('budget-balance-label').textContent = result.remaining < 0 ? 'Tekort na sparen' : 'Over na sparen';
    find('budget-result-message').textContent = message;
    results.setAttribute('data-state', result.remaining < 0 ? 'deficit' : result.remaining === 0 ? 'balanced' : 'surplus');
    results.hidden = false;
    placeholder.hidden = true;
    hasCalculated = true;
    announcement.textContent = `${result.remaining < 0 ? 'Tekort' : 'Over'} na sparen: ${money.format(Math.abs(result.remaining) / 100)} per maand. ${message}`;
    results.focus();
  });
  find('budget-clear').addEventListener('click', () => {
    form.reset();
    // Clear values explicitly, including any values restored by the browser.
    for (const input of fields) { input.value = ''; input.removeAttribute('aria-invalid'); }
    partnerToggle.checked = false;
    setPartner();
    hasCalculated = false;
    clearResult();
    announcement.textContent = 'Je invoer en uitkomst zijn gewist.';
    find('budget-income').focus();
  });
  setPartner();
  for (const button of form.querySelectorAll('[data-budget-action]')) button.disabled = false;
}

if (typeof document !== 'undefined') initializeBudgetTool(document);

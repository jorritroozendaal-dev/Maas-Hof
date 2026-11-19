// Money is calculated in whole cents to keep household totals exact.
export const MAX_BUDGET_CENTS = 100_000_000;

export function parseBudgetAmount(value, { required = false, label = 'Dit bedrag' } = {}) {
  if (typeof value !== 'string') throw new TypeError('Een bedrag moet als tekst worden aangeleverd.');
  let amount = value.trim().replace(/^€\s*/, '');
  if (!amount) {
    if (required) throw new RangeError(`Vul ${label.toLowerCase()} in, eventueel 0.`);
    return 0;
  }
  // Dutch grouped amounts (2.500,50), ungrouped amounts (2500,50), and decimal points (2500.50).
  if (/^\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?$/.test(amount)) {
    amount = amount.replaceAll('.', '').replace(',', '.');
  } else if (/^\d+(?:[,.]\d{1,2})?$/.test(amount)) {
    amount = amount.replace(',', '.');
  } else {
    throw new RangeError(`${label}: gebruik een positief bedrag of 0, met maximaal twee decimalen, bijvoorbeeld 2.500,50.`);
  }
  const [euros, fraction = ''] = amount.split('.');
  const cents = Number(euros) * 100 + Number(fraction.padEnd(2, '0'));
  if (!Number.isSafeInteger(cents) || cents < 0 || cents > MAX_BUDGET_CENTS) {
    throw new RangeError(`${label}: vul een bedrag in van € 0 tot en met € 1.000.000 per maand.`);
  }
  return cents;
}

export function calculateBudget({ income, housing, groceries, otherExpenses, savings }) {
  function sum(values, label) {
    if (!Array.isArray(values)) throw new TypeError(`${label} moet een lijst met bedragen zijn.`);
    for (const cents of values) {
      if (!Number.isSafeInteger(cents) || cents < 0 || cents > MAX_BUDGET_CENTS) {
        throw new RangeError(`${label} bevat een ongeldig bedrag in centen.`);
      }
    }
    const total = values.reduce((a, b) => a + b, 0);
    if (!Number.isSafeInteger(total)) throw new RangeError('Het totaal is te groot.');
    return total;
  }
  const totalIncome = sum(income, 'Inkomsten');
  const totalHousing = sum(housing, 'Wonen en energie');
  const totalGroceries = sum([groceries], 'Boodschappen');
  const totalOtherExpenses = sum(otherExpenses, 'Overige uitgaven');
  const plannedSavings = sum([savings], 'Spaardoel');
  const totalExpenses = totalHousing + totalGroceries + totalOtherExpenses;
  const beforeSavings = totalIncome - totalExpenses;
  const remaining = beforeSavings - plannedSavings;
  if (![totalExpenses, beforeSavings, remaining].every(Number.isSafeInteger)) throw new RangeError('Het totaal is te groot.');
  return { totalIncome, totalHousing, totalGroceries, totalOtherExpenses, totalExpenses, beforeSavings, plannedSavings, remaining };
}

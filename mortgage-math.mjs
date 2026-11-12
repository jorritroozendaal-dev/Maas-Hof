/**
 * Mathematical mortgage illustrations, with a constant nominal annual rate.
 * These calculations do not test income, lending standards or eligibility.
 * Amounts remain unrounded; formatting belongs to the presentation layer.
 */

const PRINCIPAL_LIMIT = 5_000_000;
const BUDGET_LIMIT = 50_000;

function fail(field, message) {
  const error = new RangeError(message);
  error.field = field;
  throw error;
}

function positiveAmount(value, limit, field, message) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0 || value > limit) {
    fail(field, message);
  }
}

/**
 * @param {{mode: 'monthly'|'budget', principal?: number, budget?: number,
 * annualRate: number, years: number, repayment: 'annuity'|'linear'}} input
 * @returns {{principal: number, months: number, firstPayment: number,
 * lastPayment: number, firstInterest: number, firstPrincipal: number,
 * totalInterest: number, totalPaid: number,
 * yearlyBalances: Array<{year: number, balance: number}>}}
 */
export function calculateMortgage(input) {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    fail('input', 'Vul de gegevens voor je berekening in.');
  }

  const { mode, annualRate, years, repayment } = input;

  if (mode !== 'monthly' && mode !== 'budget') {
    fail('mode', 'Kies een berekening van maandlasten of maandbudget.');
  }
  if (repayment !== 'annuity' && repayment !== 'linear') {
    fail('repayment', 'Kies annuïtair of lineair aflossen.');
  }
  if (typeof annualRate !== 'number' || !Number.isFinite(annualRate) || annualRate < 0 || annualRate > 20) {
    fail('annualRate', 'Vul een rentepercentage in van 0 tot en met 20%.');
  }
  if (!Number.isInteger(years) || years < 1 || years > 40) {
    fail('years', 'Kies een looptijd van 1 tot en met 40 hele jaren.');
  }

  const months = years * 12;
  const rate = annualRate / 1200;
  const logRate = Math.log1p(rate);
  const annuityFactor = rate === 0 ? 1 / months : rate / -Math.expm1(-months * logRate);
  const paymentFactor = repayment === 'annuity' ? annuityFactor : 1 / months + rate;
  let principal;

  if (mode === 'monthly') {
    positiveAmount(input.principal, PRINCIPAL_LIMIT, 'principal',
      'Vul een hypotheekbedrag in groter dan € 0 en maximaal € 5.000.000.');
    principal = input.principal;
  } else {
    positiveAmount(input.budget, BUDGET_LIMIT, 'budget',
      'Vul een maandbudget in groter dan € 0 en maximaal € 50.000.');
    principal = input.budget / paymentFactor;
    if (!Number.isFinite(principal) || principal > PRINCIPAL_LIMIT) {
      fail('budget', 'Dit maandbudget geeft een rekenbedrag boven € 5.000.000. Kies een lager maandbudget.');
    }
  }

  // In budget mode the input is exactly the first payment, by construction.
  const firstPayment = mode === 'budget' ? input.budget : principal * paymentFactor;
  const firstInterest = principal * rate;
  const firstPrincipal = firstPayment - firstInterest;
  const lastPayment = repayment === 'linear'
    ? principal / months * (1 + rate)
    : firstPayment;
  const totalInterest = rate === 0 ? 0 : repayment === 'linear'
    ? principal * rate * (months + 1) / 2
    : firstPayment * months - principal;
  const totalPaid = principal + totalInterest;
  const yearlyBalances = [];

  for (let year = 0; year <= years; year += 1) {
    const elapsed = year * 12;
    let balance;
    if (year === 0) {
      balance = principal;
    } else if (year === years) {
      balance = 0;
    } else if (rate === 0 || repayment === 'linear') {
      balance = principal * (1 - elapsed / months);
    } else {
      // Stable form of P * ((1+r)^n - (1+r)^k) / ((1+r)^n - 1).
      balance = principal * Math.exp(elapsed * logRate)
        * Math.expm1((months - elapsed) * logRate) / Math.expm1(months * logRate);
    }
    yearlyBalances.push({ year, balance });
  }

  return {
    principal, months, firstPayment, lastPayment, firstInterest, firstPrincipal,
    totalInterest, totalPaid, yearlyBalances,
  };
}

import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateMortgage } from '../mortgage-math.mjs';

const defaults = {
  mode: 'monthly', principal: 300_000, annualRate: 4, years: 30, repayment: 'annuity',
};

function close(actual, expected, tolerance = 0.000001) {
  assert.ok(Math.abs(actual - expected) <= tolerance,
    `Expected ${actual} to be within ${tolerance} of ${expected}`);
}

test('annuity: independently known 300,000 / 4% / 30-year example', () => {
  const result = calculateMortgage(defaults);
  close(result.firstPayment, 1432.2458863963615);
  close(result.firstInterest, 1000);
  close(result.firstPrincipal, 432.2458863963615);
  close(result.lastPayment, result.firstPayment);
  close(result.totalInterest, 215608.51910269016, 0.00001);
  close(result.totalPaid, 515608.51910269016, 0.00001);
});

test('linear: first/last payments and interest follow the decreasing balance', () => {
  const result = calculateMortgage({ ...defaults, repayment: 'linear' });
  close(result.firstPayment, 1833.3333333333333);
  close(result.lastPayment, 836.1111111111111);
  close(result.firstPrincipal, 833.3333333333333);
  close(result.firstInterest, 1000);
  close(result.totalInterest, 180500);
  close(result.totalPaid, 480500);
  close(result.yearlyBalances[10].balance, 200000);
  close(result.yearlyBalances[20].balance, 100000);
});

for (const repayment of ['annuity', 'linear']) {
  test(`${repayment}: zero interest repays only the principal`, () => {
    const result = calculateMortgage({ ...defaults, annualRate: 0, repayment });
    close(result.firstPayment, 300000 / 360);
    close(result.lastPayment, 300000 / 360);
    assert.equal(result.totalInterest, 0);
    assert.equal(result.totalPaid, 300000);
    close(result.yearlyBalances[15].balance, 150000);
  });

  test(`${repayment}: budget calculation is inverse to monthly payment`, () => {
    const monthly = calculateMortgage({ ...defaults, principal: 247123.45, repayment });
    const budget = calculateMortgage({
      mode: 'budget', budget: monthly.firstPayment, annualRate: 4, years: 30, repayment,
      principal: NaN, // inactive inputs must not invalidate a calculation
    });
    close(budget.principal, monthly.principal);
    assert.equal(budget.firstPayment, monthly.firstPayment);
    assert.ok(budget.lastPayment <= budget.firstPayment);
  });

  test(`${repayment}: monthly cash flows conserve principal and agree with annual balances`, () => {
    for (const annualRate of [0, 0.00000001, 4, 20]) {
      for (const years of [1, 30, 40]) {
        const result = calculateMortgage({ ...defaults, principal: 375123.45, annualRate, years, repayment });
        let balance = result.principal;
        let totalInterest = 0;
        let repaid = 0;
        for (let month = 1; month <= result.months; month += 1) {
          const interest = balance * annualRate / 1200;
          const principalPart = repayment === 'linear'
            ? result.principal / result.months
            : result.firstPayment - interest;
          totalInterest += interest;
          repaid += principalPart;
          balance -= principalPart;
          if (month % 12 === 0) {
            close(result.yearlyBalances[month / 12].balance, balance, 0.0001);
          }
        }
        close(balance, 0, 0.0001);
        close(repaid, result.principal, 0.0001);
        close(totalInterest, result.totalInterest, 0.0001);
        close(result.totalPaid, result.principal + totalInterest, 0.0001);
        assert.equal(result.yearlyBalances.length, years + 1);
        assert.equal(result.yearlyBalances.at(-1).balance, 0);
        for (let i = 1; i < result.yearlyBalances.length; i += 1) {
          assert.ok(result.yearlyBalances[i].balance >= 0);
          assert.ok(result.yearlyBalances[i].balance < result.yearlyBalances[i - 1].balance);
        }
      }
    }
  });
}

test('zero-interest budget and inactive fields', () => {
  const result = calculateMortgage({ mode: 'budget', budget: 1000, annualRate: 0, years: 30, repayment: 'annuity' });
  assert.equal(result.principal, 360000);
  assert.equal(result.firstPayment, 1000);
  assert.equal(result.totalPaid, 360000);
  assert.doesNotThrow(() => calculateMortgage({ ...defaults, budget: NaN }));
});

test('valid principal boundary and fractional euro amounts remain unrounded', () => {
  assert.equal(calculateMortgage({ ...defaults, principal: 5_000_000 }).principal, 5_000_000);
  const result = calculateMortgage({ ...defaults, principal: 100.01 });
  assert.equal(result.principal, 100.01);
  assert.notEqual(result.firstPayment, Math.round(result.firstPayment * 100) / 100);
});

test('all invalid active inputs produce RangeError with the relevant field', () => {
  const cases = [
    [null, 'input'],
    [{ ...defaults, mode: 'maximum' }, 'mode'],
    [{ ...defaults, repayment: 'interest-only' }, 'repayment'],
    ...[-1, 20.1, NaN, Infinity, '4'].map(annualRate => [{ ...defaults, annualRate }, 'annualRate']),
    ...[0, 41, 1.5, NaN, '30'].map(years => [{ ...defaults, years }, 'years']),
    ...[0, -1, 5_000_001, NaN, Infinity, '300000'].map(principal => [{ ...defaults, principal }, 'principal']),
    ...[0, -1, 50_001, NaN, Infinity, '1000'].map(budget => [{ ...defaults, mode: 'budget', budget }, 'budget']),
    [{ ...defaults, mode: 'budget', budget: 50_000, annualRate: 0, years: 40 }, 'budget'],
  ];
  for (const [input, field] of cases) {
    assert.throws(() => calculateMortgage(input), error =>
      error instanceof RangeError && error.field === field && error.message.length > 10);
  }
});

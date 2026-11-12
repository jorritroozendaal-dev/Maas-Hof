import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateIncomeMortgage, INCOME_NORM_METADATA } from '../mortgage-income.mjs';
import { INCOME_TABLE_2026 } from '../mortgage-income-data.mjs';

const standard = { annualIncome: 50000, hasPartner: false, partnerIncome: 0, annualRate: 4, fixedRateYears: 10, monthlyObligations: 0 };
const close = (actual, expected, tolerance = 0.000001) => assert.ok(Math.abs(actual - expected) < tolerance, `${actual} differs from ${expected}`);

test('official 2026 Table 1 has all published income rows and 12 rate columns', () => {
  assert.equal(INCOME_TABLE_2026.length, 97);
  assert.deepEqual(INCOME_TABLE_2026.map((row) => row[0]), [0, ...Array.from({ length: 96 }, (_, i) => 30000 + i * 1000)]);
  assert.ok(INCOME_TABLE_2026.every((row) => row.length === 13 && row.slice(1).every(Number.isInteger)));
  assert.deepEqual(INCOME_TABLE_2026[0].slice(1), [155, 165, 175, 184, 193, 201, 209, 216, 222, 227, 232, 237]);
  assert.deepEqual(INCOME_TABLE_2026.at(-1).slice(1), [222, 233, 244, 255, 265, 274, 283, 292, 300, 308, 315, 322]);
});

test('official table examples at 4% use their exact published percentages', () => {
  for (const [annualIncome, expected] of [[30000, 20.1], [40000, 22.6], [50000, 22.6], [60000, 22.6], [80000, 25.3], [125000, 27.4]]) {
    const result = calculateIncomeMortgage({ ...standard, annualIncome });
    assert.equal(result.financingPercentage, expected);
    close(result.monthlyCapacity, annualIncome * expected / 1200);
  }
});

test('independent annuity benchmark: €50k income / 4% / 22.6% quote', () => {
  const result = calculateIncomeMortgage(standard);
  const r = 0.04 / 12;
  const monthly = 50000 * 0.226 / 12;
  const independentlyComputedPresentValue = monthly * (1 - (1 + r) ** -360) / r;
  close(result.principal, independentlyComputedPresentValue, 0.00001);
  assert.equal(result.normYear, 2026);
  assert.equal(result.years, 30);
  assert.equal(result.repayment, 'annuity');
});

test('both incomes count fully and applicant order is symmetric', () => {
  const one = calculateIncomeMortgage({ ...standard, annualIncome: 45000, hasPartner: true, partnerIncome: 35000 });
  const two = calculateIncomeMortgage({ ...standard, annualIncome: 35000, hasPartner: true, partnerIncome: 45000 });
  assert.deepEqual(one, two);
  assert.equal(one.combinedIncome, 80000);
  assert.equal(one.financingPercentage, 25.3);
  close(one.principal, calculateIncomeMortgage({ ...standard, annualIncome: 80000 }).principal);
});

test('zero own income works with a partner; unchecked partner input is ignored', () => {
  const partnerOnly = calculateIncomeMortgage({ ...standard, annualIncome: 0, hasPartner: true, partnerIncome: 50000 });
  close(partnerOnly.principal, calculateIncomeMortgage(standard).principal);
  const ignored = calculateIncomeMortgage({ ...standard, partnerIncome: NaN });
  close(ignored.principal, calculateIncomeMortgage(standard).principal);
});

test('conservative income step lookup uses exact income for the allowed annual load', () => {
  const lower = calculateIncomeMortgage({ ...standard, annualIncome: 30999.99 });
  const next = calculateIncomeMortgage({ ...standard, annualIncome: 31000 });
  assert.equal(lower.incomeBracket, 30000);
  assert.equal(lower.financingPercentage, 20.1);
  assert.equal(next.incomeBracket, 31000);
  assert.equal(next.financingPercentage, 21.2);
  close(lower.monthlyCapacity, 30999.99 * 0.201 / 12);
  assert.equal(calculateIncomeMortgage({ ...standard, annualIncome: 29999 }).incomeBracket, 0);
});

test('rate-column boundaries: the upper rate is inclusive, no rate interpolation', () => {
  for (const [rate, expectedColumn] of [[0, 0], [1.5, 0], [1.5001, 1], [2, 1], [3.5, 4], [3.5001, 5], [4, 5], [4.0001, 6], [6.5, 10], [6.5001, 11], [20, 11]]) {
    assert.equal(calculateIncomeMortgage({ ...standard, annualRate: rate }).rateColumn, expectedColumn);
  }
});

test('short fixed period uses the higher of AFM 5% and offer rate', () => {
  assert.equal(calculateIncomeMortgage({ ...standard, fixedRateYears: 9 }).assessmentRate, 5);
  assert.equal(calculateIncomeMortgage({ ...standard, fixedRateYears: 10 }).assessmentRate, 4);
  assert.equal(calculateIncomeMortgage({ ...standard, annualRate: 6, fixedRateYears: 5 }).assessmentRate, 6);
  close(calculateIncomeMortgage({ ...standard, fixedRateYears: 5 }).principal,
    calculateIncomeMortgage({ ...standard, annualRate: 5, fixedRateYears: 10 }).principal);
});

test('already assessed gross obligations reduce capacity euro-for-euro; zero loan is a valid result', () => {
  const clear = calculateIncomeMortgage(standard);
  const debt = calculateIncomeMortgage({ ...standard, monthlyObligations: 200 });
  close(debt.monthlyCapacity, clear.monthlyCapacity - 200);
  close(debt.principal / clear.principal, debt.monthlyCapacity / clear.monthlyCapacity);
  const noRoom = calculateIncomeMortgage({ ...standard, monthlyObligations: 50000 });
  assert.equal(noRoom.monthlyCapacity, 0);
  assert.equal(noRoom.principal, 0);
});

test('zero offered interest and >=10 years fixed handles the zero-interest annuity', () => {
  const result = calculateIncomeMortgage({ ...standard, annualRate: 0 });
  assert.equal(result.assessmentRate, 0);
  close(result.principal, result.monthlyCapacity * 360);
});

test('high incomes retain the last published percentage; both incomes up to 500k are supported', () => {
  for (const [annualIncome, partnerIncome] of [[70000, 70000], [250000, 250000]]) {
    const result = calculateIncomeMortgage({ ...standard, annualIncome, partnerIncome, hasPartner: true });
    assert.equal(result.combinedIncome, annualIncome + partnerIncome);
    assert.equal(result.incomeBracket, 125000);
    assert.equal(result.financingPercentage, 27.4);
    close(result.monthlyCapacity, result.combinedIncome * 0.274 / 12);
  }
  assert.throws(() => calculateIncomeMortgage({ ...standard, annualIncome: 250000, partnerIncome: 250000.01, hasPartner: true }), /500\.000/);
  assert.equal(INCOME_NORM_METADATA.maxSupportedCombinedIncome, 500000);
  assert.equal(INCOME_NORM_METADATA.highestPublishedIncomeRow, 125000);
  const single = calculateIncomeMortgage(standard);
  const withNonEarningPartner = calculateIncomeMortgage({ ...standard, hasPartner: true, partnerIncome: 0 });
  close(single.principal, withNonEarningPartner.principal);
  assert.equal(INCOME_NORM_METADATA.validThrough, '2026-12-31');
});

test('invalid active inputs have Dutch RangeErrors naming the field', () => {
  for (const [change, field] of [
    [{ annualIncome: -1 }, 'annualIncome'], [{ annualIncome: 500001 }, 'annualIncome'],
    [{ annualIncome: 0 }, 'annualIncome'], [{ annualIncome: NaN }, 'annualIncome'],
    [{ hasPartner: true, partnerIncome: -1 }, 'partnerIncome'], [{ hasPartner: true, partnerIncome: NaN }, 'partnerIncome'],
    [{ hasPartner: 'yes' }, 'hasPartner'], [{ annualRate: -0.01 }, 'annualRate'], [{ annualRate: 20.01 }, 'annualRate'],
    [{ annualRate: NaN }, 'annualRate'], [{ fixedRateYears: 0 }, 'fixedRateYears'], [{ fixedRateYears: 31 }, 'fixedRateYears'],
    [{ fixedRateYears: 9.5 }, 'fixedRateYears'], [{ monthlyObligations: -1 }, 'monthlyObligations'],
    [{ monthlyObligations: 50001 }, 'monthlyObligations'], [{ monthlyObligations: NaN }, 'monthlyObligations'],
  ]) {
    assert.throws(() => calculateIncomeMortgage({ ...standard, ...change }), (error) => error instanceof RangeError && error.field === field && error.message.length > 10);
  }
  for (const input of [undefined, null, [], 'income']) assert.throws(() => calculateIncomeMortgage(input), RangeError);
});

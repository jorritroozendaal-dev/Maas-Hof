import { INCOME_RATE_UPPER_BOUNDS, INCOME_TABLE_2026 } from './mortgage-income-data.mjs';

/**
 * Fixed-year, indicative income test. This is not mortgage acceptance or an offer.
 * Only applicants more than 10 years before AOW, deductible interest and 30 years.
 * monthlyObligations means an already determined gross monthly assessment load;
 * it does not convert debt principal, DUO payments or BKR limits into that load.
 */
export const INCOME_NORM_METADATA = Object.freeze({
  normYear: 2026,
  verifiedOn: '2026-11-12',
  validThrough: '2026-12-31',
  assessmentRateQuarter: '2026-Q4',
  shortFixedAssessmentRate: 5,
  maxSupportedCombinedIncome: 500000,
  highestPublishedIncomeRow: 125000,
  lookupPolicy: 'highest-income-threshold-not-exceeding-input; keep-last-published-row-above-125000',
  tableSource: 'https://zoek.officielebekendmakingen.nl/stcrt-2025-36471.html',
  regulationSource: 'https://wetten.overheid.nl/BWBR0032503/2026-01-01#Paragraaf2_Artikel3',
  jointIncomeSource: 'https://www.volkshuisvestingnederland.nl/onderwerpen/huren-en-wonen/tijdelijke-regeling-hypothecair-krediet/maximale-hypotheek-op-basis-van-inkomen',
  assessmentRateSource: 'https://www.afm.nl/nl-nl/sector/actueel/2026/sep/sb-toetsrente',
  lookupWorkbookSource: 'https://adviesforum.nl/documenten/Bijlage-financieringslastnormen-2026.xlsx',
});

function fail(field, message) {
  const error = new RangeError(message);
  error.field = field;
  throw error;
}

function boundedAmount(value, maximum, field, message) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > maximum) {
    fail(field, message);
  }
}

/**
 * @param {{annualIncome: number, hasPartner?: boolean, partnerIncome?: number,
 * annualRate: number, fixedRateYears: number, monthlyObligations?: number}} input
 */
export function calculateIncomeMortgage(input) {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    fail('input', 'Vul je inkomensgegevens voor de berekening in.');
  }
  const {
    annualIncome, hasPartner = false, partnerIncome = 0,
    annualRate, fixedRateYears, monthlyObligations = 0,
  } = input;
  boundedAmount(annualIncome, 500000, 'annualIncome', 'Vul een bruto jaarinkomen in van € 0 tot en met € 500.000.');
  if (typeof hasPartner !== 'boolean') fail('hasPartner', 'Geef aan of je het inkomen van een meelenende partner wilt meenemen.');
  if (hasPartner) boundedAmount(partnerIncome, 500000, 'partnerIncome', 'Vul een bruto partnerinkomen in van € 0 tot en met € 500.000.');
  const combinedIncome = annualIncome + (hasPartner ? partnerIncome : 0);
  if (combinedIncome <= 0) fail('annualIncome', 'Vul voor jou en eventueel je partner samen een bruto jaarinkomen in groter dan € 0.');
  if (combinedIncome > INCOME_NORM_METADATA.maxSupportedCombinedIncome) {
    fail('annualIncome', 'Deze rekentool ondersteunt een gezamenlijk jaarinkomen tot en met € 500.000. Neem contact op voor een persoonlijke berekening.');
  }
  if (typeof annualRate !== 'number' || !Number.isFinite(annualRate) || annualRate < 0 || annualRate > 20) {
    fail('annualRate', 'Vul een rentepercentage in van 0 tot en met 20%.');
  }
  if (!Number.isInteger(fixedRateYears) || fixedRateYears < 1 || fixedRateYears > 30) {
    fail('fixedRateYears', 'Kies een rentevaste periode van 1 tot en met 30 hele jaren.');
  }
  boundedAmount(monthlyObligations, 50000, 'monthlyObligations', 'Vul een mee te tellen bruto maandlast in van € 0 tot en met € 50.000.');

  // Article 3(9)(c): for <10 years fixed, use at least both the offer and AFM rate.
  const assessmentRate = fixedRateYears < 10
    ? Math.max(annualRate, INCOME_NORM_METADATA.shortFixedAssessmentRate)
    : annualRate;
  const rateColumn = INCOME_RATE_UPPER_BOUNDS.findIndex((upper) => assessmentRate <= upper);
  let incomeRow = INCOME_TABLE_2026[0];
  for (const row of INCOME_TABLE_2026) {
    if (row[0] > combinedIncome) break;
    incomeRow = row;
  }
  const financingPercentage = incomeRow[rateColumn + 1] / 10;
  const monthlyCapacityBeforeObligations = combinedIncome * financingPercentage / 100 / 12;
  const monthlyCapacity = Math.max(0, monthlyCapacityBeforeObligations - monthlyObligations);
  const months = 360;
  const monthlyRate = assessmentRate / 1200;
  const annuityFactor = monthlyRate === 0 ? 1 / months
    : monthlyRate / -Math.expm1(-months * Math.log1p(monthlyRate));
  const principal = monthlyCapacity / annuityFactor;

  return {
    principal, combinedIncome, financingPercentage, assessmentRate,
    monthlyCapacity, monthlyCapacityBeforeObligations, monthlyObligations,
    annualRate, fixedRateYears, years: 30, repayment: 'annuity', normYear: 2026,
    incomeBracket: incomeRow[0], rateColumn,
  };
}

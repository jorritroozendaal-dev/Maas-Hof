import test from 'node:test';
import assert from 'node:assert/strict';
import { parseBudgetAmount, calculateBudget, MAX_BUDGET_CENTS } from '../budget-math.mjs';

test('budget accepts Dutch grouped euros and preserves every cent', () => {
  for (const [text, cents] of [['2.500,50',250050],['2500,50',250050],['2500.50',250050],['€ 2.500,50',250050],['2.500',250000],['0,01',1],['12,5',1250],['0',0],['  ',0],['1.000.000,00',100000000]]) {
    assert.equal(parseBudgetAmount(text), cents, text);
  }
});
test('budget rejects missing required income, negatives, ambiguous and invalid input', () => {
  assert.throws(() => parseBudgetAmount('',{required:true,label:'Jouw netto inkomen'}),/netto inkomen/);
  for (const value of ['-1','1,234','1.23,45','1e3','Infinity','NaN','tekst','1.000.000,01','1,2,3','2500 euro']) {
    assert.throws(() => parseBudgetAmount(value), RangeError, value);
  }
  assert.throws(() => parseBudgetAmount(100),TypeError);
});
test('independent household example includes partner, all costs and savings exactly once', () => {
  const result = calculateBudget({income:[300050,200025,20000],housing:[120010,12020,3000,8005],groceries:50040,otherExpenses:[20000,5000],savings:40010});
  assert.deepEqual(result,{totalIncome:520075,totalHousing:143035,totalGroceries:50040,totalOtherExpenses:25000,totalExpenses:218075,beforeSavings:302000,plannedSavings:40010,remaining:261990});
});
test('budget distinguishes expense deficit, unaffordable savings, and exact balance', () => {
  const base={income:[300000],housing:[250000],groceries:0,otherExpenses:[],savings:50000};
  assert.equal(calculateBudget(base).remaining,0);
  assert.equal(calculateBudget({...base,savings:60000}).beforeSavings,50000);
  assert.equal(calculateBudget({...base,savings:60000}).remaining,-10000);
  assert.equal(calculateBudget({...base,housing:[350000],savings:0}).beforeSavings,-50000);
  assert.equal(calculateBudget({...base,housing:[350000],savings:20000}).remaining,-70000);
});
test('cent totals remain exact and never become floating point estimates', () => {
  const result=calculateBudget({income:[30],housing:[10],groceries:10,otherExpenses:[],savings:10});
  assert.equal(result.remaining,0);
  assert.equal(calculateBudget({income:[0,200000],housing:[],groceries:0,otherExpenses:[],savings:0}).remaining,200000);
});
test('budget math rejects non-cent, nonfinite, negative or excessive amounts', () => {
  const base={income:[300000],housing:[100000],groceries:20000,otherExpenses:[],savings:10000};
  for(const invalid of [-1,1.5,NaN,Infinity,MAX_BUDGET_CENTS+1,'100']) {
    assert.throws(()=>calculateBudget({...base,income:[invalid]}),RangeError);
    assert.throws(()=>calculateBudget({...base,savings:invalid}),RangeError);
  }
  assert.throws(()=>calculateBudget({...base,income:300000}),TypeError);
});

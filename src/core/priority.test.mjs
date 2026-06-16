// priority.test.mjs — node:test for the hybrid priority model.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computePlan } from './plan-engine.mjs';
import { reorderPlan, score, overrideTier, impactBand } from './priority.mjs';

const TODAY = '2026-06-15';

test('reorder preserves the action set and every stage assignment (hybrid invariant)', () => {
  const a = { incomeTypes: ['w2'], taxBracket: 'low', budgetTracking: 'no', emergencyFund: '0', healthInsurance: 'no', employerMatch: 'yes', matchCaptured: 'no', highInterestDebt: 'yes', federalStudentLoans: 'yes', pslfEligible: 'unsure', studentLoanAudited: 'never' };
  const base = computePlan(a);
  const re = reorderPlan(base, { today: TODAY });
  const k = (p) => p.actions.map((x) => `${x.stage}|${x.title}`).sort();
  assert.deepEqual(k(re), k(base)); // same {stage,title} multiset
  assert.equal(re.actions.length, base.actions.length);
});

test('within each stage, actions are non-increasing by [overrideTier, score]', () => {
  const a = { incomeTypes: ['w2'], taxBracket: 'high', dependents: 'yes', ltdInPlace: 'no', termLifeInPlace: 'no', emergencyFund: '3-6mo', healthInsurance: 'yes', employerMatch: 'yes', matchCaptured: 'no', iraMaxed: 'partial', k401Maxed: 'no' };
  const re = reorderPlan(computePlan(a), { today: TODAY });
  for (const st of ['now', 'next-quarter', 'this-year', 'eventually']) {
    const seq = re.actions.filter((x) => x.stage === st);
    for (let i = 1; i < seq.length; i++) {
      const po = overrideTier(seq[i - 1], TODAY), co = overrideTier(seq[i], TODAY);
      assert.ok(po > co || (po === co && score(seq[i - 1]) >= score(seq[i])), `out of order in ${st}`);
    }
  }
});

test('safety gap floats: health insurance is Tier-1 when present', () => {
  const a = { incomeTypes: ['w2'], taxBracket: 'mid', healthInsurance: 'no', emergencyFund: '6-12mo', budgetTracking: 'yes' };
  const re = reorderPlan(computePlan(a), { today: TODAY });
  const health = re.actions.find((x) => x.title.startsWith('Get health insurance'));
  assert.ok(health && re.tier1.includes(health.idx), 'health insurance should be Tier-1 (safety override)');
});

test('deadline floats above safety: Parent PLUS (in-window) outranks a safety gap', () => {
  const a = { incomeTypes: ['w2'], taxBracket: 'mid', federalStudentLoans: 'yes', healthInsurance: 'no', emergencyFund: '0' };
  const re = reorderPlan(computePlan(a), { today: TODAY }); // 2026-06-15: Parent PLUS due 2026-07-01 = critical
  const pplus = re.actions.find((x) => x.title.startsWith('If any of your federal loans are Parent PLUS'));
  assert.equal(overrideTier(pplus, TODAY), 2, 'Parent PLUS should be a deadline override (tier 2)');
  assert.ok(re.tier1.includes(pplus.idx), 'in-window deadline must be Tier-1');
});

test('impact bands: match=high, taxable-brokerage=low, catalog=low', () => {
  assert.equal(impactBand('Capture your full employer 401(k) match'), 'high');
  assert.equal(impactBand('Open a taxable brokerage with asset-location-optimized holdings'), 'low');
  assert.equal(impactBand('Read the family-wealth strategies catalog (Phase 7)'), 'low');
});

test('prefix bands match dynamic titles (full EF, backdoor/IRA)', () => {
  assert.equal(impactBand('Build your full emergency fund (3–6 months of essential expenses)'), 'med');
  assert.equal(impactBand('Execute the Backdoor Roth IRA ($7,500 for 2026)'), 'med');
  assert.equal(impactBand('Max your IRA ($7,500 for 2026, Roth or Traditional based on your bracket)'), 'med');
});

test('reorder is pure (input plan not mutated)', () => {
  const base = computePlan({ incomeTypes: ['w2'], taxBracket: 'mid', employerMatch: 'yes', matchCaptured: 'no' });
  const before = JSON.stringify(base.actions.map((a) => a.title));
  reorderPlan(base, { today: TODAY });
  assert.equal(JSON.stringify(base.actions.map((a) => a.title)), before);
});

test('score is impact-dominant: impact band primary (×10), ease (friction) tiebreaker', () => {
  // high impact (3) × 10 + low friction (prob 3) = 33 is the max
  const match = { title: 'Capture your full employer 401(k) match', friction: 'low' }; // high/low
  assert.equal(score(match), 33);
  // audit fix BUG3: high-impact/high-effort debt payoff must outrank a low-impact/easy item
  const debt = { title: 'Eliminate high-interest debt (above ~7% after tax)', friction: 'high' }; // high/high
  const overdraft = { title: 'Opt out of debit-card overdraft (Reg E) + move to a no-overdraft-fee bank account', friction: 'med' }; // med/med
  assert.equal(score(debt), 31); // 3*10 + 1
  assert.equal(score(overdraft), 22); // 2*10 + 2
  assert.ok(score(debt) > score(overdraft), 'high-interest debt must outrank overdraft opt-out');
  // N6: out-of-domain friction degrades to low-probability, never NaN
  assert.equal(score({ title: 'Capture your full employer 401(k) match', friction: 'bogus' }), 33);
});

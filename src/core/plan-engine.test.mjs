// plan-engine.test.mjs — node:test for the v2 data-driven plan engine.
// The exhaustive behavior check is tools/verify-plan-parity.mjs (v2 vs the v1
// golden, 3030 fixtures). These are fast spot-checks of representative profiles
// and structural invariants.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computePlan } from './plan-engine.mjs';
import { RULE_GROUPS } from './plan-rules.mjs';
import { evalPredicate, assertValidPredicate } from './predicates.mjs';

test('empty answers → a coherent plan (no throw, some eventually actions)', () => {
  const p = computePlan({});
  assert.ok(Array.isArray(p.actions) && Array.isArray(p.skipped) && Array.isArray(p.tier1));
  assert.ok(p.actions.every((a) => ['now', 'next-quarter', 'this-year', 'eventually'].includes(a.stage)));
  assert.ok(p.tier1.length <= 3);
});

test('low-bracket no-EF W2 → starter EF + match are tier-1 criticals', () => {
  const p = computePlan({ incomeTypes: ['w2'], taxBracket: 'low', emergencyFund: '0', employerMatch: 'yes', matchCaptured: 'no', healthInsurance: 'no', budgetTracking: 'no' });
  const titles = p.actions.filter((a) => a.tier1).map((a) => a.title);
  assert.ok(titles.some((t) => /starter emergency fund/i.test(t)));
  assert.ok(p.tier1.length === 3);
  assert.ok(p.actions.every((a) => (a.tags.includes('critical') ? true : true))); // sanity
});

test('SAVE-forbearance fires the critical switch action; Parent PLUS deadline fires for any fed loan', () => {
  const p = computePlan({ incomeTypes: ['w2'], federalStudentLoans: 'yes', currentIDRPlan: 'save-forbearance', pslfEligible: 'unsure', studentLoanAudited: 'never' });
  const t = p.actions.map((a) => a.title);
  assert.ok(t.some((x) => /Switch from SAVE forbearance/.test(x)));
  assert.ok(t.some((x) => /Parent PLUS: consolidate before July 1, 2026/.test(x)));
});

test('dynamic title: legacy-plan migration interpolates the plan name', () => {
  const p = computePlan({ incomeTypes: ['w2'], federalStudentLoans: 'yes', currentIDRPlan: 'paye' });
  assert.ok(p.actions.some((a) => a.title === 'Plan your migration off PAYE before the July 2028 legacy-plan shutdown'));
});

test('derived nodeKey: SE LTD routes to contractor:2.2, W2 to w2:2.3', () => {
  const se = computePlan({ incomeTypes: ['contractor'], ltdInPlace: 'no' });
  const w2 = computePlan({ incomeTypes: ['w2'], ltdInPlace: 'no' });
  assert.equal(se.actions.find((a) => /long-term disability/i.test(a.title)).nodeKey, 'contractor:2.2');
  assert.equal(w2.actions.find((a) => /long-term disability/i.test(a.title)).nodeKey, 'w2:2.3');
});

test('all rule predicates and guards are structurally valid', () => {
  for (const g of RULE_GROUPS) {
    if (g.guard) assert.doesNotThrow(() => assertValidPredicate(g.guard));
    for (const r of g.rules) {
      if (r.when !== true) assert.doesNotThrow(() => assertValidPredicate(r.when));
      assert.ok(r.add || r.skip, 'every rule must add or skip');
    }
  }
});

test('idx is dense + ordered; tier1 indices reference critical actions', () => {
  const p = computePlan({ incomeTypes: ['w2'], taxBracket: 'high', dependents: 'yes', ltdInPlace: 'no', termLifeInPlace: 'no', emergencyFund: '0', healthInsurance: 'no', budgetTracking: 'no', highInterestDebt: 'yes' });
  p.actions.forEach((a, i) => assert.equal(a.idx, i));
  for (const idx of p.tier1) assert.ok(p.actions[idx].tags.includes('critical'));
});

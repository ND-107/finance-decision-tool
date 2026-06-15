// sensitivity.test.mjs — node:test, zero dependencies. Run: node --test src/core/
// Spot-checks for the perturbation analysis: high-impact fields surface for a
// representative profile, the output is well-formed, and it is deterministic.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sensitivity, FIELDS, logicDiff } from './sensitivity.mjs';
import { planLogic } from '../../tools/lib/plan-fingerprint.mjs';
import { computePlan } from './plan-engine.mjs';

// A representative high-bracket W2 household where bracket and income type both
// gate large swathes of the plan (HSA/backdoor/match/EF cascade).
const PROFILE = {
  incomeTypes: ['w2'], taxBracket: 'high', ageBracket: '40-49', filingStatus: 'mfj', state: 'ca',
  employerMatch: 'yes', matchCaptured: 'no', hsaMaxed: 'no', hdhpEligible: 'yes',
  iraMaxed: 'no', k401Maxed: 'partial', emergencyFund: '<1mo', budgetTracking: 'no',
  healthInsurance: 'yes', highInterestDebt: 'no', ltdInPlace: 'yes',
};

test('result is a ranked, well-formed array covering every diagnostic field', () => {
  const r = sensitivity(PROFILE);
  assert.ok(Array.isArray(r));
  assert.equal(r.length, FIELDS.length, 'one entry per diagnostic field');
  // ranked by impact desc
  for (let i = 1; i < r.length; i++) assert.ok(r[i - 1].impact >= r[i].impact, 'impact non-increasing');
  for (const e of r) {
    assert.ok(typeof e.field === 'string' && typeof e.impact === 'number');
    assert.ok(Array.isArray(e.swings));
    // each swing carries from/to + added/removed arrays, sorted by delta desc
    for (let i = 1; i < e.swings.length; i++) assert.ok(e.swings[i - 1].delta >= e.swings[i].delta);
    for (const s of e.swings) {
      assert.ok(Array.isArray(s.added) && Array.isArray(s.removed));
      assert.notDeepEqual(s.to, e.field === 'incomeTypes' ? PROFILE.incomeTypes : PROFILE[e.field], 'a swing never re-tests the current value');
    }
  }
});

test('taxBracket and incomeTypes are high-impact for the representative profile', () => {
  const r = sensitivity(PROFILE);
  const rank = (f) => r.findIndex((e) => e.field === f);
  const impactOf = (f) => r.find((e) => e.field === f).impact;

  // Both should land in the top few drivers (out of ~53 fields).
  assert.ok(rank('incomeTypes') < 5, `incomeTypes should be a top driver, got rank ${rank('incomeTypes')}`);
  assert.ok(rank('taxBracket') < 5, `taxBracket should be a top driver, got rank ${rank('taxBracket')}`);

  // And both should clearly beat a field known to be inert for this profile
  // (litInterest only feeds prose, not plan logic) — sanity that impact is real.
  assert.ok(impactOf('incomeTypes') > impactOf('litInterest'));
  assert.ok(impactOf('taxBracket') > impactOf('litInterest'));
  assert.equal(impactOf('litInterest'), 0, 'a prose-only field swings nothing in the plan logic');
});

test('swings actually report the added/removed titles that drive the impact', () => {
  const r = sensitivity(PROFILE);
  const taxBracket = r.find((e) => e.field === 'taxBracket');
  // Swinging high→low must add or remove at least one action (it changes the
  // backdoor/HSA picture), and the swing's delta must equal added+removed+changed.
  const top = taxBracket.swings[0];
  assert.ok(top.delta > 0);
  assert.equal(top.delta, top.added.length + top.removed.length + top.changed);
});

test('deterministic: same input → identical output (no wall-clock, no randomness)', () => {
  const a = sensitivity(PROFILE);
  const b = sensitivity(PROFILE);
  assert.deepEqual(a, b);
  // and stable across a fresh object with the same content
  const c = sensitivity({ ...PROFILE });
  assert.deepEqual(a, c);
});

test('logicDiff is symmetric in count and self-diff is zero', () => {
  const L = planLogic(computePlan(PROFILE));
  const self = logicDiff(L, L);
  assert.deepEqual(self, { added: [], removed: [], changed: 0, delta: 0 });
  // swapping base/alt swaps added<->removed and preserves the scalar delta
  const altL = planLogic(computePlan({ ...PROFILE, taxBracket: 'low' }));
  const fwd = logicDiff(L, altL);
  const rev = logicDiff(altL, L);
  assert.equal(fwd.delta, rev.delta);
  assert.deepEqual(fwd.added.slice().sort(), rev.removed.slice().sort());
  assert.deepEqual(fwd.removed.slice().sort(), rev.added.slice().sort());
});

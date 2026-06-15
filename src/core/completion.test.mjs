// completion.test.mjs — node:test, zero dependencies. Run: node --test src/core/
// Checks the completion-loop state model: marking a mechanical action "done"
// removes it from the recomputed plan, dismissed actions don't change answers,
// applyCompletions is pure, and diffPlans classifies titles correctly.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computePlan } from './plan-engine.mjs';
import { COMPLETION_EFFECTS, applyCompletions, diffPlans, recomputeWithCompletions } from './completion.mjs';

// Match-eligible high-bracket profile (the "Capture your full employer 401(k)
// match" action fires here).
const MATCH_PROFILE = {
  incomeTypes: ['w2'], taxBracket: 'high', ageBracket: '40-49',
  employerMatch: 'yes', matchCaptured: 'no', hsaMaxed: 'no', hdhpEligible: 'yes',
  iraMaxed: 'no', k401Maxed: 'partial', emergencyFund: '<1mo', budgetTracking: 'no',
  healthInsurance: 'yes', highInterestDebt: 'no', ltdInPlace: 'yes',
};
const MATCH_TITLE = 'Capture your full employer 401(k) match';

test('marking the 401(k) match action done removes it from the recomputed plan', () => {
  const before = computePlan(MATCH_PROFILE);
  assert.ok(before.actions.some((a) => a.title === MATCH_TITLE), 'precondition: match action is present');

  const effective = applyCompletions(MATCH_PROFILE, { [MATCH_TITLE]: 'done' });
  const after = computePlan(effective);
  assert.ok(!after.actions.some((a) => a.title === MATCH_TITLE), 'match action gone after completion');

  // and diffPlans reports it as completed
  const diff = diffPlans(before, after);
  assert.ok(diff.completed.includes(MATCH_TITLE));
  assert.ok(!diff.completed.includes('Max your HSA contribution ($4,400 self / $8,750 family for 2026)'));
});

test('applyCompletions is pure — input answers object is not mutated', () => {
  const input = { matchCaptured: 'no', emergencyFund: '0', incomeTypes: ['w2'] };
  const snapshot = JSON.stringify(input);
  const out = applyCompletions(input, { [MATCH_TITLE]: 'done' });
  assert.equal(JSON.stringify(input), snapshot, 'input unchanged');
  assert.notEqual(out, input, 'returns a new object');
  assert.equal(out.matchCaptured, 'yes', 'patch applied to the copy');
  // nested arrays are not aliased into a position where mutation could leak — the
  // copy shares the same array ref but we never mutate it; assert it is still the same data.
  assert.deepEqual(out.incomeTypes, ['w2']);
});

test("dismissed actions have no answer effect", () => {
  const input = { matchCaptured: 'no' };
  const out = applyCompletions(input, { [MATCH_TITLE]: 'dismissed' });
  assert.equal(out.matchCaptured, 'no', 'dismissed does not flip the answer');
  assert.deepEqual(out, { matchCaptured: 'no' });
});

test('unknown / no-op states are ignored; empty actionStates is identity', () => {
  const input = { matchCaptured: 'no', hsaMaxed: 'no' };
  assert.deepEqual(applyCompletions(input, {}), input);
  assert.deepEqual(applyCompletions(input, { 'Some action with no effect mapping': 'done' }), input);
});

test('every COMPLETION_EFFECTS title is a real, removable action (starter set is grounded)', () => {
  // For each mapping, find a profile where the action fires, apply the patch,
  // and assert it disappears. We build a permissive base and only assert removal
  // for titles that actually appear (the table is a starter set, not exhaustive).
  const probe = {
    incomeTypes: ['w2'], taxBracket: 'high', ageBracket: '40-49',
    employerMatch: 'yes', matchCaptured: 'no', hsaMaxed: 'no', hdhpEligible: 'yes',
    iraMaxed: 'no', k401Maxed: 'no', emergencyFund: '0', budgetTracking: 'no',
    healthInsurance: 'no', ltdInPlace: 'no', highInterestDebt: 'no',
  };
  let checked = 0;
  for (const [title, patch] of Object.entries(COMPLETION_EFFECTS)) {
    const before = computePlan(probe);
    if (!before.actions.some((a) => a.title === title)) continue; // not firing in this profile
    const after = computePlan({ ...probe, ...patch });
    assert.ok(!after.actions.some((a) => a.title === title), `completing "${title}" should remove it`);
    checked += 1;
  }
  assert.ok(checked >= 5, `expected several effects exercised by the probe profile, got ${checked}`);
});

test('diffPlans classifies completed / newlyShown / unchanged by title', () => {
  const before = { actions: [{ title: 'A' }, { title: 'B' }, { title: 'C' }] };
  const after = { actions: [{ title: 'B' }, { title: 'C' }, { title: 'D' }] };
  const d = diffPlans(before, after);
  assert.deepEqual(d.completed, ['A']);
  assert.deepEqual(d.newlyShown, ['D']);
  assert.equal(d.unchanged, 2);
});

test('recomputeWithCompletions wires apply→compute→diff end to end', () => {
  const r = recomputeWithCompletions(MATCH_PROFILE, { [MATCH_TITLE]: 'done' });
  assert.ok(r.before.actions.some((a) => a.title === MATCH_TITLE));
  assert.ok(!r.after.actions.some((a) => a.title === MATCH_TITLE));
  assert.equal(r.effective.matchCaptured, 'yes');
  assert.ok(r.diff.completed.includes(MATCH_TITLE));
});

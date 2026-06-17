// calculators.test.mjs — sanity tests for the calculator kernel. These assert
// INDEPENDENTLY-computed known values (not "matches v1"), so they catch a wrong
// extraction even if v1 itself drifted. Byte-exact v1 parity is a separate gate
// (tools/verify-calculators.mjs, Chrome-driven).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runCalculator, CALCULATORS, INPUT_ATTRS } from './calculators/calculators.mjs';

const headline = (r) => (r.html.match(/calc-result-headline">([^<]+)/) || [])[1];

test('registry covers all 21 closed-form calculators + every one produces output', () => {
  assert.equal(CALCULATORS.length, 21);
  assert.equal(INPUT_ATTRS['ci-rate'].max, '30'); // attrs extracted for clamping
  for (const c of CALCULATORS) {
    const r = runCalculator(c.name, {}); // default inputs
    assert.equal(r.id, c.resultId);
    assert.ok(r.html && r.html.length > 0, `${c.name} produced no output`);
    assert.ok(!r.html.includes('undefined'), `${c.name} output contains "undefined"`);
  }
});

test('compound interest — FV of $500/mo at 7% for 30y from $0', () => {
  // Monthly annuity FV: 500 · ((1+.07/12)^360 − 1)/(.07/12) ≈ 609,985
  assert.equal(headline(runCalculator('compound', {})), '$609,985');
});

test('compound — 0% return, $500/mo, 1y = exactly contributions', () => {
  assert.equal(headline(runCalculator('compound', { 'ci-pv': 0, 'ci-pmt': 500, 'ci-rate': 0, 'ci-years': 1 })), '$6,000');
});

test('real return — Fisher equation 10% nominal / 3% inflation', () => {
  // (1.10/1.03 − 1) = 6.7961% → 6.80%
  assert.equal(headline(runCalculator('realNominal', { 'rn-nominal': 10, 'rn-inflation': 3 })), '6.80%');
});

test('rule of 72 — doubling time at 8% is ~9 years', () => {
  const r = runCalculator('rule72', { 'r72-rate': 8 });
  const m = r.html.match(/(\d+\.\d) yr<\/td><td>(\d+\.\d) yr/); // approx, exact
  assert.equal(m[1], '9.0'); // 72/8
  assert.equal(m[2], '9.0'); // ln2/ln1.08
});

test('rule of 72 — input min clamps a 0 rate (the "must be positive" guard is dead, faithfully to v1)', () => {
  // $val clamps r72-rate to its min attribute before calcRule72's r<=0 check, so 0
  // never triggers the guard — it computes at the clamped min. We just assert it
  // produces the table (no crash / no guard message), matching v1.
  assert.match(runCalculator('rule72', { 'r72-rate': 0 }).html, /calc-table/);
});

test('savings rate — 50% savings, 5% real, 4% WR ≈ 16.6y to FI', () => {
  assert.equal(headline(runCalculator('savingsRate', { 'sr-rate': 50, 'sr-return': 5, 'sr-wr': 4, 'sr-ss': 0, 'sr-expenses': 60000 })), '16.6 years to FI');
});

test('$val clamps to the input max attribute (ci-rate ≤ 30)', () => {
  // 999% would overflow; clamped to 30 → a large but finite headline (not "$Infinity"/"—")
  const h = headline(runCalculator('compound', { 'ci-rate': 999 }));
  assert.ok(/^\$[\d,]+$/.test(h), `expected finite money, got ${h}`);
});

test('unknown calculator throws', () => {
  assert.throws(() => runCalculator('nope', {}), /unknown calculator/);
});

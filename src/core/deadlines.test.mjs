// deadlines.test.mjs — node:test for the deadline overlay (src/core/deadlines.mjs).
// All dates are explicit; nothing reads the wall clock (purity contract).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deadlineFor, annotateDeadlines, __internal } from './deadlines.mjs';
import { computePlan } from './plan-engine.mjs';

const PARENT_PLUS = 'If any of your federal loans are Parent PLUS: consolidate before July 1, 2026 to preserve income-driven access';
const EIGHTYTHREEB_FILE = 'File §83(b) election within 30 days of grant — deadline is unforgiving';
const EIGHTYTHREEB_PLAN = 'Plan §83(b) filing ahead of any restricted-stock or early-exercise grant';
const MIGRATE_PAYE = 'Plan your migration off PAYE before the July 2028 legacy-plan shutdown';

test('fixed deadline: urgency tiers across several `today` values (2026-07-01)', () => {
  // overdue — strictly after the due date
  const overdue = deadlineFor(PARENT_PLUS, '2026-07-02');
  assert.equal(overdue.urgency, 'overdue');
  assert.equal(overdue.expired, true);
  assert.equal(overdue.daysRemaining, -1);
  assert.equal(overdue.dueDate, '2026-07-01');

  // critical — within 30 days inclusive
  const critical = deadlineFor(PARENT_PLUS, '2026-06-15');
  assert.equal(critical.urgency, 'critical');
  assert.equal(critical.daysRemaining, 16);
  assert.equal(critical.expired, false);

  // soon — within 90 days but more than 30
  const soon = deadlineFor(PARENT_PLUS, '2026-05-01');
  assert.equal(soon.urgency, 'soon');
  assert.equal(soon.daysRemaining, 61);

  // upcoming — more than 90 days out
  const upcoming = deadlineFor(PARENT_PLUS, '2026-01-01');
  assert.equal(upcoming.urgency, 'upcoming');
  assert.equal(upcoming.daysRemaining, 181);

  assert.equal(critical.source, 'OBBBA (P.L. 119-21)');
});

test('fixed deadline: tier boundaries are inclusive at 30 and 90 days', () => {
  // due 2026-07-01; today exactly 30 days before → critical
  assert.equal(deadlineFor(PARENT_PLUS, '2026-06-01').daysRemaining, 30);
  assert.equal(deadlineFor(PARENT_PLUS, '2026-06-01').urgency, 'critical');
  // 31 days before → soon
  assert.equal(deadlineFor(PARENT_PLUS, '2026-05-31').daysRemaining, 31);
  assert.equal(deadlineFor(PARENT_PLUS, '2026-05-31').urgency, 'soon');
  // exactly 90 days before → soon
  assert.equal(deadlineFor(PARENT_PLUS, '2026-04-02').daysRemaining, 90);
  assert.equal(deadlineFor(PARENT_PLUS, '2026-04-02').urgency, 'soon');
  // 91 days before → upcoming
  assert.equal(deadlineFor(PARENT_PLUS, '2026-04-01').daysRemaining, 91);
  assert.equal(deadlineFor(PARENT_PLUS, '2026-04-01').urgency, 'upcoming');
  // exactly on the due date → 0 days, critical, not expired
  const onDay = deadlineFor(PARENT_PLUS, '2026-07-01');
  assert.equal(onDay.daysRemaining, 0);
  assert.equal(onDay.urgency, 'critical');
  assert.equal(onDay.expired, false);
});

test('§83(b) FILE without grantDate → impliedUrgency CRITICAL (audit fix: action only fires when grant is within 30d)', () => {
  const d = deadlineFor(EIGHTYTHREEB_FILE, '2026-06-15');
  assert.ok(d);
  assert.equal(d.kind, 'relative');
  assert.equal(d.dueDate, null);
  assert.equal(d.daysRemaining, null);
  assert.equal(d.urgency, 'critical'); // impliedUrgency, not 'unknown' — so the override floats it
  assert.equal(d.expired, false);
  assert.equal(d.source, 'Treas. Reg. §1.83-2(b)');
});

test('§83(b) "Plan ahead" (considering) has NO deadline — future/contemplated grant, no 30d clock', () => {
  // audit fix C6: the pre-grant "Plan ahead" action no longer carries a deadline.
  assert.equal(deadlineFor(EIGHTYTHREEB_PLAN, '2026-06-15'), null);
  assert.equal(deadlineFor(EIGHTYTHREEB_PLAN, '2026-06-15', { grantDate: '2026-01-01' }), null);
});

test('§83(b) FILE with grantDate → grantDate + 30 days computed urgency (overrides impliedUrgency)', () => {
  const filed = deadlineFor(EIGHTYTHREEB_FILE, '2026-06-15', { grantDate: '2026-06-01' });
  assert.equal(filed.dueDate, '2026-07-01'); // June 1 + 30d
  assert.equal(filed.urgency, 'critical');
  assert.equal(filed.daysRemaining, 16);

  const overdue = deadlineFor(EIGHTYTHREEB_FILE, '2026-06-15', { grantDate: '2024-01-01' });
  assert.equal(overdue.urgency, 'overdue');
  assert.equal(overdue.expired, true);
  assert.ok(overdue.daysRemaining < 0);
});

test('dynamic migration title matched by stable prefix (PAYE/ICR/SAVE)', () => {
  for (const plan of ['PAYE', 'ICR', 'SAVE']) {
    const title = `Plan your migration off ${plan} before the July 2028 legacy-plan shutdown`;
    const d = deadlineFor(title, '2026-06-15');
    assert.ok(d, `expected a deadline for ${plan}`);
    assert.equal(d.kind, 'fixed');
    assert.equal(d.dueDate, '2028-07-01');
    assert.equal(d.urgency, 'upcoming');
  }
});

test('no deadline record → null', () => {
  assert.equal(deadlineFor('Build your full emergency fund', '2026-06-15'), null);
  assert.equal(deadlineFor('', '2026-06-15'), null);
  assert.equal(deadlineFor(undefined, '2026-06-15'), null);
});

test('annotateDeadlines attaches to the Parent PLUS action of a real plan; pure', () => {
  const plan = computePlan({ incomeTypes: ['w2'], federalStudentLoans: 'yes' });
  const before = JSON.stringify(plan); // capture for mutation check
  const annotated = annotateDeadlines(plan, '2026-06-15');

  // input not mutated
  assert.equal(JSON.stringify(plan), before);
  assert.ok(annotated !== plan && annotated.actions !== plan.actions);

  const pp = annotated.actions.find((a) => a.title === PARENT_PLUS);
  assert.ok(pp, 'Parent PLUS action should be present');
  assert.ok(pp.deadline, 'Parent PLUS action should carry a deadline');
  assert.equal(pp.deadline.kind, 'fixed');
  assert.equal(pp.deadline.dueDate, '2026-07-01');
  assert.equal(pp.deadline.urgency, 'critical');

  // original action object untouched (deadline only on the clone)
  const origPP = plan.actions.find((a) => a.title === PARENT_PLUS);
  assert.equal(origPP.deadline, undefined);

  // actions without a deadline record carry no deadline field
  const noDeadline = annotated.actions.filter((a) => !a.deadline);
  assert.ok(noDeadline.length > 0, 'expected some actions without deadlines');
});

test('annotateDeadlines: §83(b) FILE annotated critical without ctx (implied), dated with ctx', () => {
  const plan = computePlan({ restrictedStockRecent: 'yes' });
  const noCtx = annotateDeadlines(plan, '2026-06-15');
  const a1 = noCtx.actions.find((a) => a.title.startsWith('File §83(b)'));
  assert.ok(a1 && a1.deadline);
  assert.equal(a1.deadline.urgency, 'critical'); // impliedUrgency
  assert.equal(a1.deadline.dueDate, null);

  const withCtx = annotateDeadlines(plan, '2026-06-15', { grantDate: '2026-06-10' });
  const a2 = withCtx.actions.find((a) => a.title.startsWith('File §83(b)'));
  assert.equal(a2.deadline.dueDate, '2026-07-10');
  assert.equal(a2.deadline.urgency, 'critical');
});

test('date parsing is pure (epoch-day round-trip) and rejects malformed input', () => {
  const { isoToEpochDay, epochDayToIso } = __internal;
  assert.equal(epochDayToIso(isoToEpochDay('2026-07-01')), '2026-07-01');
  assert.equal(epochDayToIso(isoToEpochDay('2024-02-29')), '2024-02-29'); // leap day
  assert.throws(() => isoToEpochDay('2026/07/01'));
  assert.throws(() => isoToEpochDay('not-a-date'));
});

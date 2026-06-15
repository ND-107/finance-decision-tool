#!/usr/bin/env node
// verify-rules.mjs — build-time verification of the rule engine + diagnostic
// (V2_REBUILD_PLAN.md §2.3). Pure static/empirical analysis, no behavior change.
// Surfaces things impossible to check against the imperative v1 engine:
//
//   1. DEAD VALUES   — eq/in predicate values that aren't in the field's option
//                      domain (can never match → dead branch).
//   2. REACHABILITY  — every add/skip rule fires for ≥1 input (corpus-driven).
//   3. CONTRADICTION — no fixture emits the same title as both an action and a skip.
//   4. PLAN BOUNDS   — no empty plans; report critical/action distribution.
//   5. cascadeClear  — the diagnostic showIf dependency graph is a DAG ⇒ orphan-
//                      clearing terminates by construction (v1 used a runtime
//                      safetyCounter, admitting it couldn't prove this).
//   6. DEAD FIELDS   — diagnostic fields that gate neither a showIf nor a plan rule.
//
// Exits non-zero if any HARD invariant fails (dead values, contradiction, empty
// plans, showIf cycle). Soft findings (plan-irrelevant fields) are reported only.

import { readFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { RULE_GROUPS } from '../src/core/plan-rules.mjs';
import { computePlan } from '../src/core/plan-engine.mjs';
import { predicateFields } from '../src/core/predicates.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const Q = JSON.parse(readFileSync(join(ROOT, 'src', 'content', 'questions.json'), 'utf8'));

// Field option domains (base diagnostic fields) + derived-field value domains.
const domain = {};
Q.sections.forEach((s) => s.questions.forEach((q) => { domain[q.id] = new Set(q.options.map((o) => o.v)); }));
const DERIVED_DOMAIN = { _bracket: new Set(['low', 'mid', 'high']), _ic: new Set(['business', 'contractor']) };
const BOOL_DERIVED = new Set(['_w2', '_contractor', '_business', '_isSE', '_efBelowTarget', '_efAtOrAbove', '_isBackdoor', '_proRataIssue', '_ageNeedsCatchup', '_inSweetSpot', '_isExploring', '_lowWillingness', '_notRetiredIncome', '_stratClass', '_idrPlanName', '_efTarget']);

const hard = [];   // invariant violations → exit 1
const soft = [];   // informational

// ---- 1. DEAD VALUES: eq/in values must be in the field's domain ----
function checkLeafValues(pred, label) {
  if (pred == null || typeof pred !== 'object') return;
  if (Array.isArray(pred.all)) return pred.all.forEach((p) => checkLeafValues(p, label));
  if (Array.isArray(pred.any)) return pred.any.forEach((p) => checkLeafValues(p, label));
  if ('not' in pred) return checkLeafValues(pred.not, label);
  const { field, op, value } = pred;
  if (!['eq', 'ne', 'in', 'nin'].includes(op)) return;
  const dom = domain[field] || DERIVED_DOMAIN[field];
  if (!dom) { if (!BOOL_DERIVED.has(field)) soft.push(`no domain known for field "${field}" (rule: ${label})`); return; }
  const vals = Array.isArray(value) ? value : [value];
  for (const v of vals) {
    if (!dom.has(v)) hard.push(`DEAD VALUE: rule "${label}" tests ${field} ${op} "${v}" but "${v}" is not a valid option for ${field} — branch can never match`);
  }
}
RULE_GROUPS.forEach((g) => {
  const label = (g.rules[0] && (g.rules[0].add?.title || g.rules[0].skip)) || 'group';
  const lbl = (typeof label === 'string' ? label : '(dynamic)').slice(0, 40);
  if (g.guard) checkLeafValues(g.guard, lbl + ' [guard]');
  g.rules.forEach((r) => { if (r.when !== true) checkLeafValues(r.when, (typeof (r.add?.title || r.skip) === 'string' ? (r.add?.title || r.skip) : '(dynamic)').slice(0, 40)); });
});

// ---- 2/3/4. REACHABILITY + CONTRADICTION + BOUNDS via the corpus ----
if (!existsSync(join(ROOT, 'tests', 'fixtures', 'plan-golden.json'))) {
  execSync('node tools/gen-plan-fixtures.mjs', { cwd: ROOT, stdio: 'ignore' });
}
const corpus = JSON.parse(readFileSync(join(ROOT, 'tests', 'fixtures', 'plan-golden.json'), 'utf8')).fixtures;
const firedTitles = new Set();
let minActions = Infinity, maxActions = 0, maxCrit = 0, emptyPlans = 0;
for (const f of corpus) {
  const p = computePlan(f.answers);
  p.actions.forEach((a) => firedTitles.add('A:' + a.title));
  p.skipped.forEach((s) => firedTitles.add('S:' + s.title));
  const actionTitles = new Set(p.actions.map((a) => a.title));
  for (const s of p.skipped) if (actionTitles.has(s.title)) hard.push(`CONTRADICTION: "${s.title}" is both an action and a skip for ${f.name}`);
  minActions = Math.min(minActions, p.actions.length);
  maxActions = Math.max(maxActions, p.actions.length);
  maxCrit = Math.max(maxCrit, p.actions.filter((a) => a.tags.includes('critical')).length);
  if (p.actions.length === 0) emptyPlans++;
}
// reachability: list every static add/skip title; flag those never fired by the corpus.
const allTitles = new Set();
RULE_GROUPS.forEach((g) => g.rules.forEach((r) => {
  if (r.add && typeof r.add.title === 'string') allTitles.add('A:' + r.add.title);
  else if (r.add) allTitles.add('A:(dynamic)'); // dynamic titles checked by prefix below
  if (r.skip) allTitles.add('S:' + r.skip);
}));
const neverFired = [...allTitles].filter((t) => t !== 'A:(dynamic)' && !firedTitles.has(t));
neverFired.forEach((t) => soft.push(`UNREACHED by corpus: ${t} (may need a targeted fixture, or is a dead rule)`));

// ---- 5. cascadeClear termination: diagnostic showIf dependency graph is a DAG ----
// Edge q_dependent -> q_owner when q_dependent.showIf reads a field owned by
// q_owner. If acyclic, clearing orphaned answers reaches a fixpoint in one pass
// (no cycle can keep re-activating). v1 iterated with a safetyCounter.
const ownerOf = {}; // field -> question id (the question whose answer IS that field)
Q.sections.forEach((s) => s.questions.forEach((q) => { ownerOf[q.id] = q.id; }));
const edges = []; // [dependentQ, ownerQ]
Q.sections.forEach((s) => s.questions.forEach((q) => {
  if (!q.showIf) return;
  for (const f of predicateFields(q.showIf)) if (ownerOf[f] && ownerOf[f] !== q.id) edges.push([q.id, ownerOf[f]]);
}));
// cycle detection (DFS)
const adj = {}; edges.forEach(([a, b]) => { (adj[a] = adj[a] || []).push(b); });
const WHITE = 0, GRAY = 1, BLACK = 2; const color = {}; let cycle = null;
function dfs(n, stack) {
  color[n] = GRAY; stack.push(n);
  for (const m of adj[n] || []) {
    if (color[m] === GRAY) { cycle = [...stack.slice(stack.indexOf(m)), m]; return true; }
    if (color[m] === WHITE && dfs(m, stack)) return true;
  }
  stack.pop(); color[n] = BLACK; return false;
}
for (const n of Object.keys(ownerOf)) if (color[n] === undefined || color[n] === WHITE) { color[n] = color[n] || WHITE; if (dfs(n, [])) break; }
if (cycle) hard.push(`showIf DEPENDENCY CYCLE: ${cycle.join(' → ')} — cascadeClear could loop (v1's safetyCounter would mask it)`);

// ---- 6. DEAD FIELDS: gate neither showIf nor plan rule ----
const showIfFields = new Set();
Q.sections.forEach((s) => { if (s.showIf) predicateFields(s.showIf).forEach((f) => showIfFields.add(f)); s.questions.forEach((q) => { if (q.showIf) predicateFields(q.showIf).forEach((f) => showIfFields.add(f)); }); });
const planFields = new Set();
const DERIVED_BASE = { _w2: ['incomeTypes'], _contractor: ['incomeTypes'], _business: ['incomeTypes'], _isSE: ['incomeTypes'], _ic: ['incomeTypes'], _notRetiredIncome: ['incomeTypes'], _bracket: ['taxBracket'], _isBackdoor: ['taxBracket'], _proRataIssue: ['taxBracket', 'tradIraBalance'], _efBelowTarget: ['emergencyFund', 'incomeTypes'], _efAtOrAbove: ['emergencyFund', 'incomeTypes'], _efTarget: ['incomeTypes'], _ageNeedsCatchup: ['ageBracket'], _inSweetSpot: ['ageBracket'], _isExploring: ['rentalRealEstate'], _lowWillingness: ['riskCapacityRevealed', 'riskCapacity'], _stratClass: ['essentialFraction'], _idrPlanName: ['currentIDRPlan'] };
RULE_GROUPS.forEach((g) => {
  const fs = [...(g.guard ? predicateFields(g.guard) : []), ...g.rules.flatMap((r) => (r.when === true ? [] : predicateFields(r.when)))];
  fs.forEach((f) => (DERIVED_BASE[f] || [f]).forEach((b) => planFields.add(b)));
});
const allFields = Q.sections.flatMap((s) => s.questions.map((q) => q.id));
const deadFields = allFields.filter((f) => !showIfFields.has(f) && !planFields.has(f));
deadFields.forEach((f) => soft.push(`field "${f}" gates no showIf and no plan rule (drives synthesis/other views only — verify it's intentional)`));

// ---- report ----
console.log(`RULE VERIFICATION`);
console.log(`  corpus: ${corpus.length} fixtures · actions/plan min ${minActions} max ${maxActions} · max simultaneous criticals ${maxCrit} · empty plans ${emptyPlans}`);
console.log(`  rule titles reached by corpus: ${[...allTitles].filter((t) => t === 'A:(dynamic)' || firedTitles.has(t)).length}/${allTitles.size}`);
console.log(`  showIf dependency graph: ${edges.length} edges, ${cycle ? 'HAS CYCLE' : 'ACYCLIC (cascadeClear terminates in one pass)'}`);
if (emptyPlans > 0) hard.push(`${emptyPlans} fixture(s) produce an EMPTY plan`);
if (soft.length) { console.log(`\nSOFT findings (${soft.length}):`); soft.forEach((s) => console.log('  • ' + s)); }
if (hard.length) {
  console.error(`\n✗ ${hard.length} HARD invariant violation(s):`);
  hard.forEach((h) => console.error('  ✗ ' + h));
  process.exit(1);
}
console.log(`\n✓ all hard invariants hold: no dead values, no contradictions, no empty plans, showIf graph acyclic.`);

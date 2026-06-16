#!/usr/bin/env node
// audit-simulate.mjs — deterministic, mechanical audit of the system: walk the
// diagnostic (every question/option/showIf path) and exhaustively exercise the
// plan engine, scanning for anomalies the structural gates don't cover
// (semantic sanity, broken nodeKey references, profile-inappropriate advice).
// Reports findings; does NOT mutate anything. Adversarial human-judgment review
// runs separately (the workflow).

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { computePlan } from '../src/core/plan-engine.mjs';
import { reorderPlan } from '../src/core/priority.mjs';
import { evalPredicate, predicateFields } from '../src/core/predicates.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const Q = JSON.parse(readFileSync(join(ROOT, 'src', 'content', 'questions.json'), 'utf8'));
const findings = [];
const F = (sev, area, msg) => findings.push({ sev, area, msg });

// ---------------------------------------------------------------------------
// 1. DIAGNOSTIC STRUCTURE — every question + option well-formed; reachable.
// ---------------------------------------------------------------------------
const allFields = [];
const domains = {};
for (const sec of Q.sections) {
  for (const q of sec.questions) {
    allFields.push(q.id);
    if (!q.id || !q.type || !q.label) F('bug', 'diagnostic', `malformed question: ${JSON.stringify(q).slice(0, 80)}`);
    if (!['single', 'multi'].includes(q.type)) F('bug', 'diagnostic', `${q.id}: bad type "${q.type}"`);
    const vals = q.options.map((o) => o.v);
    domains[q.id] = vals;
    if (new Set(vals).size !== vals.length) F('bug', 'diagnostic', `${q.id}: duplicate option values`);
    for (const o of q.options) {
      if (!o.v || !o.l) F('bug', 'diagnostic', `${q.id}: option missing v/l: ${JSON.stringify(o)}`);
    }
    if (q.options.length < 2) F('warn', 'diagnostic', `${q.id}: <2 options`);
  }
}
if (new Set(allFields).size !== allFields.length) F('bug', 'diagnostic', 'duplicate question ids across sections');

// Reachability of each conditional question: is its showIf satisfiable by SOME
// answer vector? (A question that can never show is dead.)
function satisfiable(pred) {
  // try the option-domain cross product of the predicate's fields (small)
  const fields = predicateFields(pred);
  if (fields.length === 0) return true;
  const doms = fields.map((f) => [undefined, ...(domains[f] || [])]);
  // also allow incomeTypes subsets
  const idx = new Array(fields.length).fill(0);
  const total = doms.reduce((n, d) => n * d.length, 1);
  for (let k = 0; k < total; k++) {
    const a = {}; let r = k;
    for (let i = 0; i < fields.length; i++) {
      let v = doms[i][r % doms[i].length]; r = Math.floor(r / doms[i].length);
      if (fields[i] === 'incomeTypes' && v != null) v = [v];
      a[fields[i]] = v;
    }
    if (evalPredicate(pred, a)) return true;
  }
  return false;
}
for (const sec of Q.sections) {
  if (sec.showIf && !satisfiable(sec.showIf)) F('bug', 'diagnostic', `section "${sec.section}" showIf is unsatisfiable (never shows)`);
  for (const q of sec.questions) {
    if (q.showIf && !satisfiable(q.showIf)) F('bug', 'diagnostic', `question ${q.id} showIf is unsatisfiable (never shows)`);
  }
}

// ---------------------------------------------------------------------------
// 2. NODE REFERENCES — every action's nodeKey must resolve to a real node file.
// ---------------------------------------------------------------------------
const nodeKeys = new Set();
for (const inc of ['w2', 'contractor', 'business']) {
  const dir = join(ROOT, 'src', 'content', 'nodes', inc);
  if (!existsSync(dir)) continue;
  for (const f of readdirSync(dir)) {
    if (f.endsWith('.json') && f !== '_array.json') nodeKeys.add(`${inc}:${f.replace('.json', '')}`);
  }
}
// math: nodes — the math view isn't in the node files (it's a static view); allow math:*
const referencedNodeKeys = new Set();

// ---------------------------------------------------------------------------
// 3. EXHAUSTIVE-ISH PLAN EXERCISE + semantic invariants.
// Systematic per-field coverage + a large random sweep.
// ---------------------------------------------------------------------------
function mulberry32(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const rng = mulberry32(0xA0D17 & 0xffffffff);
const pick = (arr) => arr[Math.floor(rng() * arr.length)];
function subsets(xs) { const out = [[]]; for (const x of xs) for (const s of [...out]) out.push([...s, x]); return out; }
const incomeSets = subsets(domains.incomeTypes || ['w2', 'contractor', 'business', 'retired']);
function randomAnswers() {
  const a = {};
  for (const f of allFields) {
    if (rng() < 0.2) continue;
    a[f] = f === 'incomeTypes' ? (pick(incomeSets.filter((s) => s.length)) || ['w2']) : pick(domains[f]);
  }
  return a;
}

let N = 0, empty = 0, maxActions = 0, maxCrit = 0;
const titlesSeen = new Set();
const SAMPLES = Number(process.env.SAMPLES || 20000);
const incomeReq = { w2: [/employer 401\(k\) match/, /auto-escalation/], se: [/quarterly estimated tax/, /self-employed retirement/, /Solo 401\(k\)/, /Section 199A/, /S-corp/] };

function audit(a) {
  N++;
  const plan = computePlan(a);
  const re = reorderPlan(plan, { today: '2026-06-15' });
  if (plan.actions.length === 0) { empty++; if (empty <= 3) F('warn', 'plan', `empty plan for ${JSON.stringify(a).slice(0, 90)}`); }
  maxActions = Math.max(maxActions, plan.actions.length);
  maxCrit = Math.max(maxCrit, plan.actions.filter((x) => x.tags.includes('critical')).length);
  if (re.tier1.length > 3) F('bug', 'priority', `tier1 > 3 (${re.tier1.length})`);

  const titles = plan.actions.map((x) => x.title);
  if (new Set(titles).size !== titles.length) F('bug', 'plan', `duplicate action in one plan: ${titles.find((t, i) => titles.indexOf(t) !== i)}`);

  const inc = Array.isArray(a.incomeTypes) ? a.incomeTypes : [];
  const hasW2 = inc.includes('w2'), isSE = inc.includes('contractor') || inc.includes('business');
  const earned = hasW2 || isSE;
  for (const act of plan.actions) {
    titlesSeen.add(act.title);
    // nodeKey resolution (allow math:* static view)
    if (act.nodeKey && !act.nodeKey.startsWith('math:') && !nodeKeys.has(act.nodeKey)) {
      F('bug', 'noderef', `action "${act.title.slice(0, 40)}" → nodeKey ${act.nodeKey} has no node file`);
    }
    // incomeType tag must be consistent with household
    if (act.incomeType === 'w2' && !hasW2) F('bug', 'plan', `w2-tagged action "${act.title.slice(0, 40)}" fired without w2 income`);
    if ((act.incomeType === 'contractor' || act.incomeType === 'business') && !isSE) F('bug', 'plan', `SE-tagged action fired without SE income: ${act.title.slice(0, 40)}`);
    // earned-income-only actions must not fire for income-less households
    if (!earned) {
      if (/employer 401\(k\) match|auto-escalation|quarterly estimated tax|self-employed retirement|Solo 401\(k\)|Section 199A|elect S-corp|Increase your 401\(k\)/.test(act.title))
        F('bug', 'semantic', `earned-income action "${act.title.slice(0, 40)}" fired for a household with no earned income (${JSON.stringify(inc)})`);
    }
    // low-bracket-only transfers must not fire for high bracket
    if (a.taxBracket === 'high' && /Saver's Credit|Check EITC|safety-net program|ACA Premium Tax Credit/.test(act.title))
      F('bug', 'semantic', `low-income transfer "${act.title.slice(0, 40)}" fired for high bracket`);
  }
}

// systematic: every single-field value at least once (vary one field, hold a base)
const base = { incomeTypes: ['w2'], taxBracket: 'mid' };
for (const f of allFields) for (const v of domains[f]) audit({ ...base, [f]: f === 'incomeTypes' ? [v] : v });
// random sweep
for (let i = 0; i < SAMPLES; i++) audit(randomAnswers());

// edge profiles
const edges = {
  empty: {}, 'retired-only': { incomeTypes: ['retired'], ageBracket: 'retired', yearsToRetirement: 'already' },
  'all-incomes': { incomeTypes: ['w2', 'contractor', 'business', 'retired'], taxBracket: 'high' },
  'w2+retired': { incomeTypes: ['w2', 'retired'], taxBracket: 'mid' },
  'negative-nw-high-bracket': { incomeTypes: ['w2'], taxBracket: 'high', netWorth: 'negative' },
};
for (const [name, a] of Object.entries(edges)) {
  const p = computePlan(a);
  if (name === 'retired-only') {
    const bad = p.actions.filter((x) => /match|quarterly|Solo 401|S-corp|Section 199A/.test(x.title));
    if (bad.length) F('bug', 'semantic', `retired-only got earned-income actions: ${bad.map((x) => x.title.slice(0, 24)).join(', ')}`);
  }
}

// ---------------------------------------------------------------------------
// report
// ---------------------------------------------------------------------------
const bugs = findings.filter((f) => f.sev === 'bug');
const warns = findings.filter((f) => f.sev === 'warn');
console.log(`AUDIT SIMULATION — ${N} plan evaluations`);
console.log(`  plan size: max ${maxActions} actions, max ${maxCrit} simultaneous criticals, ${empty} empty`);
console.log(`  distinct action titles produced: ${titlesSeen.size}`);
console.log(`  diagnostic: ${allFields.length} questions, ${Object.values(domains).reduce((n, d) => n + d.length, 0)} options`);
console.log(`  node files: ${nodeKeys.size}`);
const dedup = (arr) => [...new Map(arr.map((f) => [f.area + f.msg, f])).values()];
const ub = dedup(bugs), uw = dedup(warns);
console.log(`\nBUGS: ${ub.length} distinct`);
ub.slice(0, 40).forEach((f) => console.log(`  ✗ [${f.area}] ${f.msg}`));
console.log(`\nWARNINGS: ${uw.length} distinct`);
uw.slice(0, 15).forEach((f) => console.log(`  ⚠ [${f.area}] ${f.msg}`));
process.exit(ub.length ? 1 : 0);

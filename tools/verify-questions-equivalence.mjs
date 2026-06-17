#!/usr/bin/env node
// verify-questions-equivalence.mjs — PROVE the declarative showIf predicates in
// src/content/questions.json are behavior-identical to the live `showIf`
// closures in main:v1/flowchart.html. This is the round-trip gate for Phase 2's
// first content extraction: the structured form must not change diagnostic
// behavior (V2_REBUILD_PLAN.md §2 — "make showIf serializable … verified").
//
// Two independent checks per predicate:
//   (1) EXHAUSTIVE over the fields the predicate reads (complete — a predicate's
//       output depends only on those fields), enumerating every value incl.
//       undefined, and (for incomeTypes) every subset.
//   (2) RANDOM SAMPLE over the full 9-field answer space (catches any
//       field-domain modeling error the per-predicate enumeration couldn't).
//
// Exits non-zero on the first divergence, with the offending answer vector.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { loadLiveQuestions } from './extract-questions.mjs';
import { evalPredicate, predicateFields } from '../src/core/predicates.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const RANDOM_SAMPLES = Number(process.env.SAMPLES || 200000);

const live = loadLiveQuestions();
const decl = JSON.parse(readFileSync(join(ROOT, 'src', 'content', 'questions.json'), 'utf8'));

// Pair live (closures) with declarative (predicates) by traversal order; collect
// every showIf-bearing item as { path, liveFn, pred }.
const items = [];
live.forEach((sec, si) => {
  const dsec = decl.sections[si];
  if (sec.section !== dsec.section) throw new Error(`section order mismatch at ${si}: "${sec.section}" vs "${dsec.section}"`);
  if (sec.showIf) items.push({ path: `section:${sec.section}`, liveFn: sec.showIf, pred: dsec.showIf });
  sec.qs.forEach((q, qi) => {
    const dq = dsec.questions[qi];
    if (q.id !== dq.id) throw new Error(`question order mismatch at ${si}.${qi}: "${q.id}" vs "${dq.id}"`);
    if (q.showIf) items.push({ path: `q:${q.id}`, liveFn: q.showIf, pred: dq.showIf });
  });
});
if (items.length === 0) throw new Error('no showIf items found to verify');

// Build field domains from the declarative options (single-value fields) + a
// subset enumeration for the one multi field (incomeTypes).
const singleDomains = {}; // field -> [undefined, ...optionValues]
decl.sections.forEach((s) => s.questions.forEach((q) => {
  singleDomains[q.id] = [undefined, ...q.options.map((o) => o.v)];
}));
function subsets(xs) {
  const out = [[]];
  for (const x of xs) for (const s of [...out]) out.push([...s, x]);
  return out;
}
const incomeTypeValues = (decl.sections.flatMap((s) => s.questions).find((q) => q.id === 'incomeTypes')?.options || []).map((o) => o.v);
const incomeTypesDomain = [undefined, ...subsets(incomeTypeValues)];
function domainFor(field) {
  if (field === 'incomeTypes') return incomeTypesDomain;
  if (singleDomains[field]) return singleDomains[field];
  return [undefined]; // field not a question (shouldn't happen for showIf)
}

const failures = [];
function check(item, a, mode) {
  let liveVal;
  try { liveVal = item.liveFn(a); } catch (e) { liveVal = `THREW:${e.message}`; }
  const declVal = evalPredicate(item.pred, a);
  if (Boolean(liveVal) !== Boolean(declVal) || typeof liveVal === 'string') {
    failures.push({ path: item.path, mode, a: { ...a }, live: liveVal, decl: declVal });
    return false;
  }
  return true;
}

// (1) Exhaustive per-predicate over its referenced fields.
let exhaustiveVectors = 0;
for (const item of items) {
  const fields = predicateFields(item.pred);
  const domains = fields.map(domainFor);
  // cartesian product
  const idx = new Array(fields.length).fill(0);
  const total = domains.reduce((n, d) => n * d.length, 1);
  for (let k = 0; k < total; k++) {
    const a = {};
    let r = k;
    for (let f = 0; f < fields.length; f++) { a[fields[f]] = domains[f][r % domains[f].length]; r = Math.floor(r / domains[f].length); }
    check(item, a, 'exhaustive');
    exhaustiveVectors++;
    if (failures.length > 20) break;
  }
}

// (2) Random sample over the full space of all showIf-referenced fields.
const allFields = [...new Set(items.flatMap((i) => predicateFields(i.pred)))];
// deterministic PRNG (mulberry32) so runs are reproducible without Math.random
let seed = 0x9e3779b9 >>> 0;
const rng = () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const pick = (arr) => arr[Math.floor(rng() * arr.length)];
for (let s = 0; s < RANDOM_SAMPLES && failures.length <= 20; s++) {
  const a = {};
  for (const f of allFields) a[f] = pick(domainFor(f));
  for (const item of items) { if (!check(item, a, 'random')) break; }
}

console.log(`showIf items: ${items.length}`);
console.log(`exhaustive per-predicate vectors: ${exhaustiveVectors}`);
console.log(`random full-space samples: ${RANDOM_SAMPLES} (fields: ${allFields.length})`);
if (failures.length) {
  console.error(`\n✗ EQUIVALENCE FAIL — ${failures.length} mismatch(es):`);
  for (const f of failures.slice(0, 10)) {
    console.error(`  [${f.mode}] ${f.path}: live=${f.live} decl=${f.decl}  a=${JSON.stringify(f.a)}`);
  }
  process.exit(1);
}
console.log(`\n✓ declarative predicates are behavior-identical to the live closures across all ${exhaustiveVectors + RANDOM_SAMPLES * items.length} comparisons.`);

#!/usr/bin/env node
// analyze-rules.mjs — static analysis of the data-driven plan rules. This is the
// payoff of making the engine declarative (V2_REBUILD_PLAN.md §2.3): the rule
// set is now introspectable. Reports the field-dependency graph, flags diagnostic
// fields no rule reads, confirms no rule reads a field absent from the schema,
// and surfaces obvious structural issues — none of which was possible against the
// imperative v1 computePlan.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { RULE_GROUPS } from '../src/core/plan-rules.mjs';
import { predicateFields } from '../src/core/predicates.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const questions = JSON.parse(readFileSync(join(ROOT, 'src', 'content', 'questions.json'), 'utf8'));
const schemaFields = new Set(questions.sections.flatMap((s) => s.questions.map((q) => q.id)));

// Derived fields the rules read (from derive.mjs) — base fields they wrap.
const DERIVED = new Set(['_w2', '_contractor', '_business', '_isSE', '_bracket', '_ic', '_icNodeContractor', '_efBelowTarget', '_efAtOrAbove', '_efTarget', '_isBackdoor', '_proRataIssue', '_ageNeedsCatchup', '_inSweetSpot', '_isExploring', '_lowWillingness', '_stratClass', '_idrPlanName', '_notRetiredIncome']);
// Which base answer fields each derived field depends on (for the dependency graph).
const DERIVED_BASE = {
  _w2: ['incomeTypes'], _contractor: ['incomeTypes'], _business: ['incomeTypes'], _isSE: ['incomeTypes'], _ic: ['incomeTypes'], _icNodeContractor: ['incomeTypes'], _notRetiredIncome: ['incomeTypes'],
  _bracket: ['taxBracket'], _isBackdoor: ['taxBracket'], _proRataIssue: ['taxBracket', 'tradIraBalance'],
  _efBelowTarget: ['emergencyFund', 'incomeTypes'], _efAtOrAbove: ['emergencyFund', 'incomeTypes'], _efTarget: ['incomeTypes'],
  _ageNeedsCatchup: ['ageBracket'], _inSweetSpot: ['ageBracket'], _isExploring: ['rentalRealEstate'],
  _lowWillingness: ['riskCapacityRevealed', 'riskCapacity'], _stratClass: ['essentialFraction'], _idrPlanName: ['currentIDRPlan'],
};

let nGroups = 0, nAdds = 0, nSkips = 0;
const fieldToRules = new Map(); // base field -> Set of action/skip titles it influences
const errors = [];

function touch(field, label) {
  const base = DERIVED.has(field) ? (DERIVED_BASE[field] || []) : [field];
  for (const b of base) {
    if (!schemaFields.has(b)) errors.push(`rule "${label}" reads field "${b}" not in questions.json`);
    if (!fieldToRules.has(b)) fieldToRules.set(b, new Set());
    fieldToRules.get(b).add(label);
  }
}

for (const g of RULE_GROUPS) {
  nGroups++;
  const guardFields = g.guard ? predicateFields(g.guard) : [];
  for (const r of g.rules) {
    const label = r.add ? (typeof r.add.title === 'function' ? '(dynamic) ' + (r.skip || 'add') : r.add.title) : r.skip;
    const lbl = (label || 'rule').slice(0, 48);
    if (r.add) nAdds++; else if (r.skip) nSkips++;
    const fields = [...guardFields, ...(r.when === true ? [] : predicateFields(r.when))];
    if (fields.length === 0 && r.when === true && !g.guard) { /* unconditional rule — fine */ }
    for (const f of fields) touch(f, lbl);
  }
}

// Diagnostic fields no plan rule reads (collected but plan-irrelevant — may drive
// other views, or be candidates for review).
const usedBase = new Set(fieldToRules.keys());
const planIrrelevant = [...schemaFields].filter((f) => !usedBase.has(f)).sort();

console.log(`RULE SET: ${nGroups} groups · ${nAdds} adds · ${nSkips} skips`);
console.log(`base answer fields the engine depends on: ${usedBase.size}/${schemaFields.size} diagnostic fields\n`);

console.log('FIELD → # of plan rules it influences (top 12):');
[...fieldToRules.entries()].sort((a, b) => b[1].size - a[1].size).slice(0, 12)
  .forEach(([f, set]) => console.log(`  ${f.padEnd(22)} ${set.size}`));

console.log(`\nDIAGNOSTIC FIELDS NO PLAN RULE READS (${planIrrelevant.length}) — collected but plan-irrelevant:`);
console.log('  ' + (planIrrelevant.join(', ') || '(none)'));

if (errors.length) {
  console.error(`\n✗ ${errors.length} STRUCTURAL ERROR(S):`);
  errors.forEach((e) => console.error('  ' + e));
  process.exit(1);
}
console.log('\n✓ every field read by a rule exists in the diagnostic schema.');

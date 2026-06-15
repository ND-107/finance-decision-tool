#!/usr/bin/env node
// verify-plan-parity.mjs — the computePlan parity gate (V2_REBUILD_PLAN.md §2.3).
//
// Re-runs an engine against the golden corpus and asserts each fixture's
// behavior fingerprint (logicHash) matches the golden capture. Today the engine
// IS the live computePlan, so this proves: (a) the engine is deterministic, and
// (b) the fixtures + fingerprint are stable. Once the v2 rule engine exists,
// point ENGINE at it (one import swap) and this becomes the v2-vs-v1 gate.
//
// Uses the full corpus (tests/fixtures/plan-golden.json) if present, else
// regenerates it deterministically; ALWAYS also checks the committed archetypes.
//
// Usage: node tools/verify-plan-parity.mjs

import { readFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { loadPlanEngine } from './lib/load-plan-engine.mjs';
import { computePlan as v2computePlan } from '../src/core/plan-engine.mjs';
import { logicHash, planLogic } from './lib/plan-fingerprint.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const FIX = join(ROOT, 'tests', 'fixtures');

// ENGINE under test. Default: the v2 data-driven rule engine (the real gate —
// must reproduce the v1 golden). `--engine=v1` checks the live v1 engine against
// the golden instead (a determinism self-check; tautological by construction).
const useV1 = process.argv.includes('--engine=v1');
const ENGINE = useV1 ? loadPlanEngine() : { computePlan: v2computePlan };
console.log(`engine under test: ${useV1 ? 'v1 (live computePlan)' : 'v2 (src/core/plan-engine.mjs)'}`);

if (!existsSync(join(FIX, 'plan-golden.json'))) {
  console.log('full corpus missing — regenerating (deterministic)…');
  execSync('node tools/gen-plan-fixtures.mjs', { cwd: ROOT, stdio: 'inherit' });
}

const full = JSON.parse(readFileSync(join(FIX, 'plan-golden.json'), 'utf8'));
const arch = JSON.parse(readFileSync(join(FIX, 'plan-golden-archetypes.json'), 'utf8'));

const failures = [];
let checked = 0;

// 1) Archetypes: check both logicHash AND the full readable logic (deep compare)
for (const f of arch.fixtures) {
  const plan = ENGINE.computePlan(f.answers);
  if (logicHash(plan) !== f.logicHash) {
    failures.push({ name: f.name, kind: 'archetype', detail: diffLogic(planLogic(plan), f.logic) });
  }
  checked++;
}

// 2) Full corpus: logicHash compare (the exhaustive gate)
for (const f of full.fixtures) {
  const plan = ENGINE.computePlan(f.answers);
  if (logicHash(plan) !== f.logicHash) failures.push({ name: f.name, kind: 'corpus', detail: 'logicHash mismatch' });
  checked++;
}

function diffLogic(got, want) {
  const lines = [];
  if (got.counts.actions !== want.counts.actions) lines.push(`  actions ${got.counts.actions} vs ${want.counts.actions}`);
  const gT = got.actions.map((a) => a.title), wT = want.actions.map((a) => a.title);
  for (const t of wT) if (!gT.includes(t)) lines.push(`  - missing action: ${t.slice(0, 60)}`);
  for (const t of gT) if (!wT.includes(t)) lines.push(`  + extra action: ${t.slice(0, 60)}`);
  return lines.join('\n') || '  (ordering/stage/tags differ — see fingerprints)';
}

console.log(`parity: checked ${checked} fixtures (${arch.fixtures.length} archetypes deep + ${full.fixtures.length} corpus by hash)`);
if (failures.length) {
  console.error(`\n✗ PARITY FAIL — ${failures.length} fixture(s) diverge:`);
  for (const f of failures.slice(0, 15)) { console.error(`  [${f.kind}] ${f.name}`); if (f.detail) console.error(f.detail); }
  process.exit(1);
}
console.log(`\n✓ engine reproduces every golden fingerprint — deterministic; ready as the v2 parity gate.`);

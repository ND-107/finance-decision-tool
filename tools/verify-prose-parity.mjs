#!/usr/bin/env node
// verify-prose-parity.mjs — the PROSE parity gate (Phase 4).
//
// Proves v2 reproduces v1's per-action reason/because prose byte-for-byte. Runs
// the LIVE v1 computePlan (loadPlanEngine, from main:v1/flowchart.html) and the v2
// engine (src/core/plan-engine.mjs, now prose-attached via plan-prose.mjs) over
// the full golden fixture corpus + archetypes, and asserts that for every fixture
// each action's {title, stage, tags, incomeType, nodeKey, reason, because} matches
// and the skipped-title set matches. A superset of the logic gate, additionally
// pinning the prose. Exit nonzero on any mismatch (first 12 reported with diffs).

import { readFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { loadPlanEngine } from './lib/load-plan-engine.mjs';
import { computePlan as v2 } from '../src/core/plan-engine.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const FIX = join(ROOT, 'tests', 'fixtures');
const v1 = loadPlanEngine();

// Gather fixtures (answers). Use the committed archetypes always; add the full
// corpus if present (regenerate it deterministically if missing).
const fixtures = [];
const arch = JSON.parse(readFileSync(join(FIX, 'plan-golden-archetypes.json'), 'utf8'));
for (const f of arch.fixtures) fixtures.push({ name: f.name, answers: f.answers });
if (!existsSync(join(FIX, 'plan-golden.json'))) {
  console.log('  (regenerating full corpus…)');
  execSync('node tools/gen-plan-fixtures.mjs', { cwd: ROOT, stdio: 'ignore' });
}
const full = JSON.parse(readFileSync(join(FIX, 'plan-golden.json'), 'utf8'));
for (const f of full.fixtures) fixtures.push({ name: f.name || 'corpus', answers: f.answers });

const norm = (p) => ({
  actions: p.actions.map((a) => ({
    title: a.title, stage: a.stage, tags: [...(a.tags || [])].sort(),
    incomeType: a.incomeType || null, nodeKey: a.nodeKey || null,
    reason: a.reason || '', because: a.because || '',
  })),
  skipped: p.skipped.map((s) => s.title).sort(),
});

const failures = [];
let checkedActions = 0;
for (const fx of fixtures) {
  const A = norm(v1.computePlan(fx.answers));
  const B = norm(v2(fx.answers));
  checkedActions += A.actions.length;
  if (JSON.stringify(A) === JSON.stringify(B)) continue;
  // find first differing field for a useful message
  const detail = [];
  if (A.actions.length !== B.actions.length) detail.push(`  action count ${A.actions.length} (v1) vs ${B.actions.length} (v2)`);
  const n = Math.min(A.actions.length, B.actions.length);
  for (let i = 0; i < n; i++) {
    for (const k of ['title', 'stage', 'incomeType', 'nodeKey', 'reason', 'because']) {
      if (JSON.stringify(A.actions[i][k]) !== JSON.stringify(B.actions[i][k])) {
        detail.push(`  [${i}] "${A.actions[i].title.slice(0, 50)}" .${k}:`);
        detail.push(`      v1: ${JSON.stringify(A.actions[i][k]).slice(0, 160)}`);
        detail.push(`      v2: ${JSON.stringify(B.actions[i][k]).slice(0, 160)}`);
      }
    }
    if (JSON.stringify(A.actions[i].tags) !== JSON.stringify(B.actions[i].tags))
      detail.push(`  [${i}] tags v1=${JSON.stringify(A.actions[i].tags)} v2=${JSON.stringify(B.actions[i].tags)}`);
  }
  if (JSON.stringify(A.skipped) !== JSON.stringify(B.skipped)) detail.push('  skipped-title set differs');
  failures.push({ name: fx.name, answers: fx.answers, detail });
}

console.log(`prose parity: ${fixtures.length} fixtures · ${checkedActions} actions compared (v1-live vs v2)`);
if (failures.length) {
  console.error(`\n✗ ${failures.length} fixture(s) mismatched. First ${Math.min(12, failures.length)}:`);
  for (const f of failures.slice(0, 12)) {
    console.error(`\n• ${f.name}  answers=${JSON.stringify(f.answers).slice(0, 120)}`);
    console.error(f.detail.slice(0, 10).join('\n'));
  }
  process.exit(1);
}
console.log('\n✓ v2 reproduces every v1 action reason/because byte-for-byte (+ logic fields & skip set).');

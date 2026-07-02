#!/usr/bin/env node
// rank-options.mjs — the /brain "financial brain" bridge to the DECIDE ranker.
//
// The Financial Brain (finance-monte-carlo) computes one Monte Carlo decision
// column per settlement-deployment option. To RANK those options it reuses this
// repo's already-built DECIDE ranker (src/core/priority.mjs) rather than
// re-implementing impact×completion-probability + deadline/safety overrides.
//
// This is a thin, pure adapter: it maps each decision option onto a synthetic
// computePlan()-shaped action (via an impact.json *anchor title*), runs the real
// reorderPlan(), and emits the per-option priority metadata (impact band, priority
// score, override tier, tier-1 membership) as JSON. The Python side (brain/
// ranking.py) then blends this priority PRIOR with the MC-column SCORE — the MC
// decides, priority.mjs supplies overrides + the tie-break prior.
//
// Contract:
//   stdin  : {"today": "2026-07-02"?, "options": [{"name","title","friction"?,"stage"?}, ...]}
//   stdout : {"today", "options": [{"name","title","band","priorityScore","overrideTier","tier1","stageOrder"}, ...]}
//
// `title` MUST be an impact.json title (exact or prefix) so impactBand resolves;
// an unbanded title degrades to 'med' (same as the verify-priority gate). `friction`
// defaults to 'low' (a lump-sum deployment is a single low-friction action → high
// completion probability). `stage` defaults to 'now' (a live decision).

import { reorderPlan, impactBand, score, overrideTier } from '../src/core/priority.mjs';

function readStdin() {
  return new Promise((resolve, reject) => {
    let buf = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (c) => (buf += c));
    process.stdin.on('end', () => resolve(buf));
    process.stdin.on('error', reject);
  });
}

async function main() {
  const raw = (await readStdin()).trim();
  if (!raw) {
    process.stderr.write('rank-options: empty stdin; expected JSON {options:[...]}\n');
    process.exit(2);
  }
  let req;
  try {
    req = JSON.parse(raw);
  } catch (e) {
    process.stderr.write(`rank-options: invalid JSON on stdin: ${e.message}\n`);
    process.exit(2);
  }
  const today = req.today || null;
  const optionsIn = Array.isArray(req.options) ? req.options : [];
  if (optionsIn.length === 0) {
    process.stderr.write('rank-options: options must be a non-empty array\n');
    process.exit(2);
  }

  // Build a synthetic computePlan() result: one action per option. reorderPlan is
  // a PURE re-rank over {actions, skipped} — it reads .title/.friction/.stage/.idx.
  const actions = optionsIn.map((o, idx) => ({
    idx,
    title: o.title,
    friction: o.friction || 'low',
    stage: o.stage || 'now',
    _name: o.name, // carried through untouched for the response join
  }));
  const plan = { actions, skipped: [] };
  const reordered = reorderPlan(plan, { today: today || undefined });

  // reorderPlan annotates each action with priorityScore/overrideTier/tier1 and
  // returns them stage-sorted. Re-key by our stable idx and record the within-plan
  // stage order (its position after the DECIDE sort) for transparency/debugging.
  const byIdx = new Map();
  reordered.actions.forEach((a, stageOrder) => {
    byIdx.set(a.idx, { ...a, stageOrder });
  });

  const outOptions = optionsIn.map((o, idx) => {
    const a = byIdx.get(idx) || {};
    return {
      name: o.name,
      title: o.title,
      band: impactBand(o.title),
      priorityScore: a.priorityScore ?? score({ title: o.title, friction: o.friction || 'low' }),
      overrideTier: a.overrideTier ?? overrideTier({ title: o.title }, today || undefined),
      tier1: Boolean(a.tier1),
      stageOrder: a.stageOrder ?? idx,
    };
  });

  process.stdout.write(JSON.stringify({ today, options: outOptions }) + '\n');
}

main().catch((e) => {
  process.stderr.write(`rank-options: ${e.stack || e.message}\n`);
  process.exit(1);
});

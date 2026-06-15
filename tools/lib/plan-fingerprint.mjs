// plan-fingerprint.mjs — stable, behavior-defining fingerprint of a computePlan
// result. The parity contract the v2 rule engine must reproduce
// (V2_REBUILD_PLAN.md §2.3). Captures the engine's DECISIONS — which actions
// fire, in what order, their stage/tags/tier1/friction/nodeKey/incomeType, and
// which steps are skipped — but NOT the prose reason/because text (that moves to
// content files in v2 and may reformat). A separate fullHash detects any v1 drift.

import { createHash } from 'node:crypto';

const sha = (s) => createHash('sha256').update(s, 'utf8').digest('hex');

/** Behavior fingerprint: ordered actions (logic fields only) + sorted skipped titles. */
export function planLogic(plan) {
  return {
    actions: plan.actions.map((a, i) => ({
      n: i,
      title: a.title,
      stage: a.stage,
      tags: [...(a.tags || [])].sort(),
      incomeType: a.incomeType || null,
      nodeKey: a.nodeKey || null,
      friction: a.friction || null,
      tier1: !!a.tier1,
    })),
    skipped: plan.skipped.map((s) => s.title).sort(),
    counts: { actions: plan.actions.length, skipped: plan.skipped.length, tier1: plan.actions.filter((a) => a.tier1).length },
  };
}

/** Canonical string of the logic fingerprint (stable key order) for hashing/diffing. */
export function logicKey(plan) {
  const L = planLogic(plan);
  return JSON.stringify(L);
}

/** sha256 of the logic fingerprint — the compact parity key stored per fixture. */
export function logicHash(plan) {
  return sha(logicKey(plan));
}

/** Full-output hash (incl. reason/because prose) — detects ANY change to v1 output. */
export function fullHash(plan) {
  // Normalize: drop the volatile per-action `idx`/`key` (derived) so the hash is
  // about content+structure, not incidental identity fields.
  const norm = {
    actions: plan.actions.map((a) => ({ ...a, idx: undefined, key: undefined })),
    skipped: plan.skipped,
    tier1: plan.tier1,
  };
  return sha(JSON.stringify(norm));
}

export { sha };

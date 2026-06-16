// priority.mjs — explicit priority model (V2_REBUILD_PLAN.md §2.2), per the
// 2026 design decisions:
//   • HYBRID reordering — keep v1's four time-stages as the grouping, but sort
//     within each stage by impact × completion-probability, and pick a smarter
//     "Start here" Tier-1 by the same score.
//   • ABSOLUTE impact bands — high/med/low per action from the framework's own
//     stated figures (src/data/impact.json), same for every household. (Profile-
//     relative scaling can layer on later as a multiplier.)
//   • OVERRIDES — statutory deadlines (in window) and safety gaps float to the
//     top: deadline > safety > score.
//
// reorderPlan() is a PURE re-ranking of a computePlan() result: it never changes
// WHICH actions fire or their stage (the hybrid invariant the gate enforces) —
// only their order within a stage and Tier-1 membership.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { deadlineFor } from './deadlines.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const IMPACT = JSON.parse(readFileSync(join(ROOT, 'src', 'data', 'impact.json'), 'utf8'));

const IMPACT_WEIGHT = { high: 3, med: 2, low: 1 };
// completion-probability: low friction ⇒ high probability of getting done.
const PROB_WEIGHT = { low: 3, med: 2, high: 1 };
const STAGE_RANK = { now: 0, 'next-quarter': 1, 'this-year': 2, eventually: 3 };

// Safety firebreaks — catastrophic-tail protection that pins above the score
// (the user's "deadlines + safety override" choice). Matched by exact title.
const SAFETY_TITLES = new Set([
  'Get health insurance in place — this week',
  'Build a $1,000 starter emergency fund (or one month of essentials)',
  'Secure long-term disability insurance (own-occupation if available)',
  'Get term life insurance (10–12× annual income)',
  'Close the disability gap before adding term-life coverage',
]);

/** Look up an action's impact band by title (exact, then prefix records). */
export function impactBand(title) {
  for (const r of IMPACT) {
    if (r.match === 'exact' && r.title === title) return r.band;
  }
  for (const r of IMPACT) {
    if (r.match === 'prefix' && title.startsWith(r.title)) return r.band;
  }
  return 'med'; // unbanded → neutral (the verify-priority gate flags unbanded actions)
}

/** The base impact × completion-probability score (higher = surfaces first). */
export function score(action) {
  return IMPACT_WEIGHT[impactBand(action.title)] * PROB_WEIGHT[action.friction || 'low'];
}

/**
 * Override tier for the "floats to the top" rule: 2 = in-window deadline,
 * 1 = safety firebreak, 0 = ranked by score. `today` ISO + optional ctx
 * (e.g. { grantDate }) for relative deadlines.
 */
export function overrideTier(action, today, ctx) {
  if (today) {
    const d = deadlineFor(action.title, today, ctx);
    if (d && ['overdue', 'critical', 'soon'].includes(d.urgency)) return 2;
  }
  if (SAFETY_TITLES.has(action.title)) return 1;
  return 0;
}

function rankKey(a, today, ctx) {
  return { ov: overrideTier(a, today, ctx), sc: score(a), idx: a.idx };
}
const byPriority = (today, ctx) => (x, y) => {
  const a = rankKey(x, today, ctx), b = rankKey(y, today, ctx);
  return b.ov - a.ov || b.sc - a.sc || a.idx - b.idx;
};

/**
 * Re-rank a computePlan() result (HYBRID). Returns a NEW plan object:
 *   - actions: same set, same stages, reordered within each stage by priority,
 *     with `.priorityScore` / `.overrideTier` annotated.
 *   - tier1: indices of the top-3 actions overall by [override, score].
 * Pure; input not mutated. `opts.today` (ISO) enables deadline overrides.
 */
export function reorderPlan(plan, opts = {}) {
  const { today = null, ctx = undefined } = opts;
  const annotated = plan.actions.map((a) => ({ ...a, priorityScore: score(a), overrideTier: overrideTier(a, today, ctx) }));

  // Within-stage reorder (stages preserved — the hybrid invariant).
  const cmp = byPriority(today, ctx);
  const stages = ['now', 'next-quarter', 'this-year', 'eventually'];
  const reordered = [];
  for (const st of stages) reordered.push(...annotated.filter((a) => a.stage === st).sort(cmp));
  // any action with an unexpected stage (shouldn't happen) kept in original order at the end
  reordered.push(...annotated.filter((a) => !stages.includes(a.stage)));

  // Tier-1 "Start here": top-3 overall by [override, score, stage, idx].
  const tier1Pool = annotated.slice().sort((x, y) => {
    const a = rankKey(x, today, ctx), b = rankKey(y, today, ctx);
    return b.ov - a.ov || b.sc - a.sc || STAGE_RANK[x.stage] - STAGE_RANK[y.stage] || a.idx - b.idx;
  });
  const tier1Idx = new Set(tier1Pool.slice(0, 3).map((a) => a.idx));
  reordered.forEach((a) => { a.tier1 = tier1Idx.has(a.idx); });

  return { actions: reordered, skipped: plan.skipped, tier1: [...tier1Idx] };
}

export { IMPACT_WEIGHT, PROB_WEIGHT, SAFETY_TITLES };

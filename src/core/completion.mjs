// completion.mjs — the completion-loop state model (pure).
//
// As the user marks plan actions "done", some actions are mechanically equivalent
// to changing a diagnostic answer (capturing your 401(k) match ≡ matchCaptured:
// 'yes'). Applying those completions to the answers and recomputing the plan lets
// the tool close the loop: the finished action drops out, and any next-tier action
// it was gating appears. This module is the pure core of that loop — no UI, no
// persistence, no wall-clock.
//
// COMPLETION_EFFECTS is a STARTER SET, deliberately limited to clearly-mechanical
// "done → answer patch" mappings (the ones where finishing the action provably
// changes the diagnostic state). Judgment-laden actions ("Open a taxable
// brokerage", "Plan your Social Security") have no completion effect and are left
// out on purpose — promoting them needs design input, not a guess here. Titles are
// matched verbatim against computePlan's action titles (src/core/plan-rules.mjs).

import { computePlan } from './plan-engine.mjs';

/**
 * Starter map: action title → the answer patch that represents having done it.
 * Verified against the live engine (the patch removes the action from the
 * recomputed plan for a profile where it fires). ~10 obvious mechanical actions.
 * @type {Record<string, Record<string, any>>}
 */
export const COMPLETION_EFFECTS = {
  // Captured the employer match → matchCaptured flips to 'yes'.
  'Capture your full employer 401(k) match': { matchCaptured: 'yes' },
  // Maxed the HSA → hsaMaxed flips to 'yes'.
  'Max your HSA contribution ($4,400 self / $8,750 family for 2026)': { hsaMaxed: 'yes' },
  // Starter EF built → emergency fund is now in the 1–3mo band (clears the $1k starter step).
  'Build a $1,000 starter emergency fund (or one month of essentials)': { emergencyFund: '1-3mo' },
  // Full EF built → clears the full-EF step. The action's title is DYNAMIC by
  // income type (W-2 target "3–6 months", self-employed target "6–12 months"),
  // so both title variants are keyed (audit 2026-06-15: the SE variant was missing).
  'Build your full emergency fund (3–6 months of essential expenses)': { emergencyFund: '6-12mo' },
  'Build your full emergency fund (6–12 months of essential expenses)': { emergencyFund: '6-12mo' },
  // IRA funded — both the direct and the backdoor route collapse to iraMaxed:'yes'.
  'Max your IRA ($7,500 for 2026, Roth or Traditional based on your bracket)': { iraMaxed: 'yes' },
  'Execute the Backdoor Roth IRA ($7,500 for 2026)': { iraMaxed: 'yes' },
  // Budget built and tracking → budgetTracking flips to 'yes'.
  'Build a comprehensive budget and start tracking cash flow': { budgetTracking: 'yes' },
  // Hit the 401(k) employee max → k401Maxed flips to 'yes'.
  'Increase your 401(k) contribution toward the $24,500 employee max': { k401Maxed: 'yes' },
  // LTD coverage put in place → ltdInPlace flips to 'yes' (same title for W2 + SE; only nodeKey differs).
  'Secure long-term disability insurance (own-occupation if available)': { ltdInPlace: 'yes' },
  // Health coverage obtained → healthInsurance flips to 'yes'.
  'Get health insurance in place — this week': { healthInsurance: 'yes' },
};

/**
 * Apply completion effects to a base answers object. `actionStates` maps an action
 * TITLE to its state: 'done' applies that title's COMPLETION_EFFECTS patch (if any);
 * 'dismissed' is acknowledged but has NO answer effect (the user chose to ignore it,
 * not complete it). Pure — returns a NEW object, never mutates `answers`.
 *
 * @param {Record<string, any>} answers
 * @param {Record<string, 'done'|'dismissed'>} actionStates
 * @returns {Record<string, any>} effective answers
 */
export function applyCompletions(answers, actionStates) {
  const out = { ...(answers || {}) };
  for (const [title, state] of Object.entries(actionStates || {})) {
    if (state !== 'done') continue; // 'dismissed' (or anything else) → no answer effect
    const patch = COMPLETION_EFFECTS[title];
    if (patch) Object.assign(out, patch);
  }
  return out;
}

/**
 * Diff two plans by action title — what the completion loop changed.
 * @param {{actions: {title:string}[]}} before
 * @param {{actions: {title:string}[]}} after
 * @returns {{completed:string[], newlyShown:string[], unchanged:number}}
 *   completed   = titles present before but absent after (the loop closed them)
 *   newlyShown  = titles present after but not before (next-tier work that surfaced)
 *   unchanged   = count of titles present in both
 */
export function diffPlans(before, after) {
  const beforeTitles = new Set((before.actions || []).map((a) => a.title));
  const afterTitles = new Set((after.actions || []).map((a) => a.title));
  const completed = [...beforeTitles].filter((t) => !afterTitles.has(t));
  const newlyShown = [...afterTitles].filter((t) => !beforeTitles.has(t));
  const unchanged = [...beforeTitles].filter((t) => afterTitles.has(t)).length;
  return { completed, newlyShown, unchanged };
}

/**
 * Convenience: apply completions to `answers`, recompute, and diff against the
 * base plan. Pure (delegates to applyCompletions + computePlan + diffPlans).
 * @param {Record<string, any>} answers
 * @param {Record<string, 'done'|'dismissed'>} actionStates
 */
export function recomputeWithCompletions(answers, actionStates) {
  const before = computePlan(answers || {});
  const effective = applyCompletions(answers, actionStates);
  const after = computePlan(effective);
  return { before, after, effective, diff: diffPlans(before, after) };
}

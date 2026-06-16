// plan-engine.mjs — v2 data-driven plan engine. Runs the ordered RULE_GROUPS
// (plan-rules.mjs) over derived answers (derive.mjs), then applies friction +
// Tier-1 selection ported verbatim from v1 computePlan. Output shape matches v1:
// { actions, skipped, tier1 }. Behavior is held to v1 by the parity gate
// (tools/verify-plan-parity.mjs → swap ENGINE to this). Pure; no DOM.

import { evalPredicate } from './predicates.mjs';
import { derive } from './derive.mjs';
import { RULE_GROUPS } from './plan-rules.mjs';
import { proseFor } from './plan-prose.mjs';

// Tag each add-rule with its positional prose id once, at module load: `pN` is the
// Nth add-rule in RULE_GROUPS, whose order mirrors v1 computePlan's add() source
// order — so it lines up with plan-prose.mjs's `case 'pN'`. Prose (reason/because)
// is content, kept out of plan-rules.mjs; the engine reattaches it here.
let _pidCounter = 0;
for (const _g of RULE_GROUPS) for (const _r of _g.rules) if (_r.add && _r.add._pid === undefined) _r.add._pid = 'p' + ++_pidCounter;

// FRICTION_RULES — verbatim from v1 computePlan (title-regex friction inference).
const FRICTION_RULES = [
  [/budget|cash-flow|cash flow|tracking/i, 'high'],
  [/eliminate high-interest debt|moderate-interest debt/i, 'high'],
  [/start formal decumulation|advanced estate planning|business succession|S-corp status|tax-loss harvesting|Plan for the Section 199A|Evaluate state-domicile change|Evaluate the Cash Balance DB plan/i, 'high'],
  [/Audit your IDR|servicer-history dispute|CFPB complaint|payment history/i, 'high'],
  [/build the full emergency fund|Build your full emergency fund/i, 'med'],
  [/quarterly estimated tax|Get health insurance|income-driven repayment|long-term disability|term life|disability gap|self-employed retirement plan|business insurance|estate documents|moderate-interest debt|529 plan|Roth catch-up|Mega Backdoor|LTC insurance|Plan for Medicaid|sweet spot|legacy preservation|hybrid|§1202 QSBS positioning|Open a taxable|Plan §83\(b\) filing ahead|Read the family-wealth strategies catalog|Read the adjacent-vehicles catalog|Apply for ACA Premium Tax Credit|Opt out of debit-card overdraft|Check EITC eligibility|Before any cost-seg-firm sales call|Switch from SAVE forbearance|Run safety-net program eligibility|If any of your federal loans are Parent PLUS|Plan your migration off/i, 'med'],
  [/Plan your Social Security|decumulation planning|partial Roth conversions/i, 'med'],
  [/.+/, 'low'],
];
function inferFriction(title) {
  for (const [pat, lvl] of FRICTION_RULES) if (pat.test(title)) return lvl;
  return 'low';
}

// djb2 — verbatim from v1 hashKey (stable action key; not in the parity contract
// but kept so v2 actions carry the same `key` as v1 for openActions persistence).
function hashKey(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
  return 'k' + h.toString(36);
}

const resolve = (v, d) => (typeof v === 'function' ? v(d) : v);

/**
 * Compute the plan for an answers object (pure). Mirrors v1 computePlan().
 * @param {Record<string,any>} answers
 * @returns {{actions: object[], skipped: {title:string}[], tier1: number[]}}
 */
export function computePlan(answers) {
  const d = derive(answers || {});
  const actions = [];
  const skipped = [];

  for (const group of RULE_GROUPS) {
    if (group.guard && !evalPredicate(group.guard, d)) continue;
    for (const rule of group.rules) {
      if (!evalPredicate(rule.when, d)) continue;
      if (rule.add) {
        const o = rule.add;
        const title = resolve(o.title, d);
        const prose = o._pid ? proseFor(o._pid, answers) : { reason: '', because: '' };
        const act = {
          title,
          stage: resolve(o.stage, d),
          reason: prose.reason, // Phase 4: verbatim v1 prose via plan-prose.mjs (positional pid)
          because: prose.because,
          nodeKey: resolve(o.nodeKey, d),
          tags: resolve(o.tags, d) || [],
        };
        if (o.incomeType !== undefined) act.incomeType = resolve(o.incomeType, d);
        act.idx = actions.length;
        act.key = hashKey((act.nodeKey || '') + '::' + (title || ''));
        actions.push(act);
      } else if (rule.skip) {
        skipped.push({ title: rule.skip, reason: '' });
      }
      break; // first matching rule in the group wins (mirrors if/else-if/else)
    }
  }

  // Friction (verbatim v1): infer from title.
  actions.forEach((act) => { act.friction = inferFriction(act.title); });

  // Tier-1 (verbatim v1): up to 3 critical-tagged actions ranked friction-asc,
  // then stage-asc, then source order.
  const fricRank = { low: 0, med: 1, high: 2 };
  const stageRank = { now: 0, 'next-quarter': 1, 'this-year': 2, eventually: 3 };
  const tier1Pool = actions
    .filter((act) => (act.tags || []).includes('critical'))
    .slice()
    // CL495: stage-first then friction — acute "now" criticals (health insurance)
    // lead over low-friction deferrable items (the Saver's Credit form).
    .sort((x, y) => stageRank[x.stage] - stageRank[y.stage] || fricRank[x.friction] - fricRank[y.friction] || x.idx - y.idx);
  const tier1 = tier1Pool.slice(0, 3).map((act) => act.idx);
  actions.forEach((act) => { act.tier1 = tier1.includes(act.idx); });

  return { actions, skipped, tier1 };
}

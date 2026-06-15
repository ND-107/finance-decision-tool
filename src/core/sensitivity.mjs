// sensitivity.mjs — pure perturbation analysis over the v2 plan engine.
//
// Answers the question "which of your diagnostic answers actually drives your
// plan?" by perturbing one field at a time across its option domain, recomputing
// the plan, and measuring the LOGIC delta vs the base plan. Pure and deterministic
// — no wall-clock, no DOM, no I/O beyond importing the engine + the static
// question domains. Domains come from questions.json (the same source the rule
// engine's value-space is derived from).
//
// Logic delta is measured on the behavior fingerprint (planLogic from
// plan-fingerprint.mjs), NOT prose: an action is "added"/"removed" by title, and
// a per-title tier1/stage/tags change also counts toward impact. This mirrors the
// parity contract — the things a caller would actually surface.

import { computePlan } from './plan-engine.mjs';
import { planLogic } from '../../tools/lib/plan-fingerprint.mjs';
import questions from '../content/questions.json' with { type: 'json' };

// --- field domains, derived once from questions.json -----------------------
// For single-select fields the domain is the option values verbatim. For the one
// `multi` field (incomeTypes) we can't enumerate the 2^4 power set meaningfully
// here, so we probe a few REPRESENTATIVE single-type sets (plus the common w2
// baseline) — enough to reveal that income type swings the plan, without
// combinatorial blow-up. See INCOME_TYPE_SETS.
const INCOME_TYPE_SETS = [['w2'], ['contractor'], ['business'], ['retired'], ['w2', 'contractor']];

/** Build { field: [optionValue, …] } from the question schema (single fields only here). */
function singleDomains() {
  const out = {};
  for (const section of questions.sections) {
    for (const q of section.questions) {
      if (q.type === 'single' && Array.isArray(q.options)) out[q.id] = q.options.map((o) => o.v);
    }
  }
  return out;
}

const SINGLE_DOMAINS = singleDomains();

// --- logic diff ------------------------------------------------------------
// Index a plan's actions by title → { stage, tags(sorted, joined), tier1 }. Two
// plans are compared title-wise: titles only in `a` were removed, only in `b`
// were added, and titles in both whose stage/tier1/tags differ are "changes".

/** @param {ReturnType<typeof planLogic>} L */
function byTitle(L) {
  const m = new Map();
  for (const a of L.actions) m.set(a.title, { stage: a.stage, tags: a.tags.join(','), tier1: a.tier1 });
  return m;
}

/**
 * Logic delta between two plans (already fingerprinted). Counts actions added,
 * actions removed, and per-title stage/tier1/tag changes. Returns the components
 * plus a scalar `delta` (their sum) — the unit of "impact".
 * @param {ReturnType<typeof planLogic>} baseL
 * @param {ReturnType<typeof planLogic>} altL
 */
function logicDiff(baseL, altL) {
  const base = byTitle(baseL);
  const alt = byTitle(altL);
  const added = [];
  const removed = [];
  let changed = 0;
  for (const title of alt.keys()) if (!base.has(title)) added.push(title);
  for (const [title, b] of base) {
    const a = alt.get(title);
    if (!a) { removed.push(title); continue; }
    if (a.stage !== b.stage || a.tier1 !== b.tier1 || a.tags !== b.tags) changed += 1;
  }
  return { added, removed, changed, delta: added.length + removed.length + changed };
}

// --- the alternatives a single field can take ------------------------------
/** Option values to swing a given field through (excludes its current value). */
function alternativesFor(field, current) {
  if (field === 'incomeTypes') {
    const cur = JSON.stringify(Array.isArray(current) ? current : []);
    return INCOME_TYPE_SETS.filter((s) => JSON.stringify(s) !== cur);
  }
  const dom = SINGLE_DOMAINS[field] || [];
  return dom.filter((v) => v !== current);
}

/** Every diagnostic field we perturb: incomeTypes + all single-select fields. */
const FIELDS = ['incomeTypes', ...Object.keys(SINGLE_DOMAINS)];

/**
 * Perturbation analysis: for each diagnostic field, swing it across its option
 * domain (incomeTypes uses representative single-type sets), recompute the plan,
 * and sum the logic delta. Pure — same `answers` always yields the same result.
 *
 * @param {Record<string, any>} answers  the base profile
 * @returns {Array<{field:string, impact:number, swings:Array<{from:any,to:any,added:string[],removed:string[]}>}>}
 *   ranked by `impact` (total logic delta across all swings of that field), desc.
 *   `swings` is itself sorted by per-swing delta desc, so the most consequential
 *   alternative for each field is first. A caller can read the top entry as
 *   "your <field> answer drives <impact> of your plan's actions".
 */
export function sensitivity(answers) {
  const base = answers || {};
  const baseL = planLogic(computePlan(base));

  const results = [];
  for (const field of FIELDS) {
    const current = base[field];
    const alts = alternativesFor(field, current);
    let impact = 0;
    const swings = [];
    for (const to of alts) {
      const altAnswers = { ...base, [field]: to };
      const altL = planLogic(computePlan(altAnswers));
      const d = logicDiff(baseL, altL);
      impact += d.delta;
      swings.push({ from: current ?? null, to, delta: d.delta, added: d.added, removed: d.removed, changed: d.changed });
    }
    swings.sort((x, y) => y.delta - x.delta);
    results.push({ field, impact, swings });
  }

  // Rank fields by total impact desc; ties broken by field name for determinism.
  results.sort((a, b) => b.impact - a.impact || (a.field < b.field ? -1 : a.field > b.field ? 1 : 0));
  return results;
}

export { logicDiff, alternativesFor, FIELDS, INCOME_TYPE_SETS };

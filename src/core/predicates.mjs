// predicates.mjs — declarative, serializable predicate evaluator.
//
// The v2 replacement for the diagnostic's `showIf: (a) => …` closures and (in
// Phase 2) computePlan's inline if/else conditions. A predicate is plain JSON
// data, so it can be: serialized to content files, statically analyzed (which
// fields gate which questions/actions — the dependency DAG that makes
// cascadeClear provable and dead-question detection possible), and exhaustively
// tested. See V2_REBUILD_PLAN.md §2.
//
// Grammar (all nodes are plain objects/arrays — no functions):
//   leaf:        { field, op, value? }
//   combinator:  { all: [pred, …] } | { any: [pred, …] } | { not: pred }
//   constant:    true | false
//
// `field` reads answers[field]. Ops:
//   eq      answers[field] === value
//   ne      answers[field] !== value
//   in      value (array) includes answers[field]
//   nin     value (array) does NOT include answers[field]
//   has     answers[field] (array, default []) includes value
//   hasAny  answers[field] (array, default []) intersects value (array)
//   hasAll  answers[field] (array, default []) is a superset of value (array)
//   exists  answers[field] != null
//   truthy  Boolean(answers[field])
//
// Designed to reproduce the EXACT semantics of the original closures, including
// their `(a.x || [])` array-default behavior — verified byte-for-behavior in
// tools/verify-questions-equivalence.mjs.

/** @typedef {Object} Answers */

const OPS = {
  eq: (v, val) => v === val,
  ne: (v, val) => v !== val,
  in: (v, val) => Array.isArray(val) && val.includes(v),
  nin: (v, val) => Array.isArray(val) && !val.includes(v),
  has: (v, val) => (Array.isArray(v) ? v : []).includes(val),
  hasAny: (v, val) => {
    const arr = Array.isArray(v) ? v : [];
    return Array.isArray(val) && val.some((x) => arr.includes(x));
  },
  hasAll: (v, val) => {
    const arr = Array.isArray(v) ? v : [];
    return Array.isArray(val) && val.every((x) => arr.includes(x));
  },
  exists: (v) => v != null,
  truthy: (v) => Boolean(v),
};

/**
 * Evaluate a declarative predicate against an answers object.
 * @param {any} pred  predicate node (object, or boolean constant, or null/undefined = always true)
 * @param {Record<string, any>} answers
 * @returns {boolean}
 */
export function evalPredicate(pred, answers) {
  if (pred == null) return true; // no predicate = always visible (matches "!showIf" in v1)
  if (pred === true) return true;
  if (pred === false) return false;
  if (typeof pred !== 'object') throw new Error(`invalid predicate (not object/bool): ${JSON.stringify(pred)}`);

  if (Array.isArray(pred.all)) return pred.all.every((p) => evalPredicate(p, answers));
  if (Array.isArray(pred.any)) return pred.any.some((p) => evalPredicate(p, answers));
  if ('not' in pred) return !evalPredicate(pred.not, answers);

  const { field, op, value } = pred;
  if (typeof field !== 'string') throw new Error(`predicate leaf missing string "field": ${JSON.stringify(pred)}`);
  const fn = OPS[op];
  if (!fn) throw new Error(`unknown predicate op "${op}" in ${JSON.stringify(pred)}`);
  return fn(answers[field], value);
}

/**
 * Collect every answer field a predicate reads — the basis for the static
 * dependency graph (which fields gate which questions/actions).
 * @param {any} pred
 * @returns {string[]} unique field names
 */
export function predicateFields(pred) {
  const out = new Set();
  (function walk(p) {
    if (p == null || typeof p !== 'object') return;
    if (Array.isArray(p.all)) p.all.forEach(walk);
    else if (Array.isArray(p.any)) p.any.forEach(walk);
    else if ('not' in p) walk(p.not);
    else if (typeof p.field === 'string') out.add(p.field);
  })(pred);
  return [...out];
}

/**
 * Validate a predicate's shape (throws on malformed). Returns true.
 * Used at build time so a bad content predicate fails loudly, not at runtime.
 */
export function assertValidPredicate(pred, path = 'root') {
  if (pred == null || pred === true || pred === false) return true;
  if (typeof pred !== 'object') throw new Error(`${path}: predicate must be object or boolean`);
  if (Array.isArray(pred.all)) { pred.all.forEach((p, i) => assertValidPredicate(p, `${path}.all[${i}]`)); return true; }
  if (Array.isArray(pred.any)) { pred.any.forEach((p, i) => assertValidPredicate(p, `${path}.any[${i}]`)); return true; }
  if ('not' in pred) return assertValidPredicate(pred.not, `${path}.not`);
  if (typeof pred.field !== 'string') throw new Error(`${path}: leaf needs string "field"`);
  if (!(pred.op in OPS)) throw new Error(`${path}: unknown op "${pred.op}"`);
  if (['in', 'nin', 'hasAny', 'hasAll'].includes(pred.op) && !Array.isArray(pred.value)) {
    throw new Error(`${path}: op "${pred.op}" needs an array "value"`);
  }
  return true;
}

export const __ops = Object.keys(OPS); // for tests/introspection

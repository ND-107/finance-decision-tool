// showif-to-predicate.mjs — convert a v1 `showIf` arrow function into a v2
// declarative predicate (src/core/predicates.mjs grammar). STRICT: any source
// that doesn't match a known pattern throws, so nothing is silently
// mis-converted. The behavior-equivalence harness
// (tools/verify-questions-equivalence.mjs) is the second safety net.
//
// Handles exactly the shapes present in the artifact's QUESTIONS showIf set:
//   a.F === 'v'
//   a.F === 'v1' || a.F === 'v2'            (same field) -> in
//   (a.F || []).includes('v')               -> has
//   (a.F || []).some(t => t === 'v1' || …)  -> hasAny
//   A && B                                   -> all
//   A || B (mixed)                           -> any

/** Split `s` on a top-level ` op ` (op = '&&' or '||'), respecting () [] {} depth and string literals. */
function splitTop(s, op) {
  const parts = [];
  let depth = 0, last = 0, str = null;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (str) { if (c === str && s[i - 1] !== '\\') str = null; continue; }
    if (c === '"' || c === "'" || c === '`') { str = c; continue; }
    if ('([{'.includes(c)) depth++;
    else if (')]}'.includes(c)) depth--;
    else if (depth === 0 && s.startsWith(op, i)) { parts.push(s.slice(last, i)); i += op.length - 1; last = i + 1; }
  }
  parts.push(s.slice(last));
  return parts.map((p) => p.trim());
}

function stripOuterParens(s) {
  s = s.trim();
  while (s.startsWith('(') && s.endsWith(')')) {
    // only strip if these parens are balanced as the outermost pair
    let depth = 0, ok = true;
    for (let i = 0; i < s.length; i++) {
      if (s[i] === '(') depth++;
      else if (s[i] === ')') { depth--; if (depth === 0 && i < s.length - 1) { ok = false; break; } }
    }
    if (ok) s = s.slice(1, -1).trim(); else break;
  }
  return s;
}

const RE_EQ = /^a\.([A-Za-z][A-Za-z0-9]*)\s*===\s*'([^']*)'$/;
const RE_INCLUDES = /^\(\s*a\.([A-Za-z][A-Za-z0-9]*)\s*\|\|\s*\[\]\s*\)\.includes\(\s*'([^']*)'\s*\)$/;
const RE_SOME = /^\(\s*a\.([A-Za-z][A-Za-z0-9]*)\s*\|\|\s*\[\]\s*\)\.some\(\s*\w+\s*=>\s*(.+)\)$/;

/** Parse a single boolean expression (no top-level && / ||) into a leaf predicate. */
function parseLeaf(expr) {
  const s = stripOuterParens(expr);
  let m;
  if ((m = s.match(RE_EQ))) return { field: m[1], op: 'eq', value: m[2] };
  if ((m = s.match(RE_INCLUDES))) return { field: m[1], op: 'has', value: m[2] };
  if ((m = s.match(RE_SOME))) {
    // body: t === 'v1' || t === 'v2' ...   -> collect the literals
    const lits = splitTop(m[2], '||').map((c) => {
      const cm = c.trim().match(/^\w+\s*===\s*'([^']*)'$/);
      if (!cm) throw new Error(`unrecognized .some() clause: ${c}`);
      return cm[1];
    });
    return { field: m[1], op: 'hasAny', value: lits };
  }
  throw new Error(`unrecognized showIf leaf: ${JSON.stringify(s)}`);
}

/** Parse a full boolean expression string into a predicate. */
function parseExpr(expr) {
  const s = stripOuterParens(expr);
  const ands = splitTop(s, '&&');
  if (ands.length > 1) return { all: ands.map(parseExpr) };
  const ors = splitTop(s, '||');
  if (ors.length > 1) {
    // collapse `a.F === 'x' || a.F === 'y'` (same field, all eq) into a single `in`
    const leaves = ors.map(parseExpr);
    if (leaves.every((l) => l.op === 'eq') && new Set(leaves.map((l) => l.field)).size === 1) {
      return { field: leaves[0].field, op: 'in', value: leaves.map((l) => l.value) };
    }
    return { any: leaves };
  }
  return parseLeaf(s);
}

/**
 * Convert a showIf (function or source string) to a declarative predicate.
 * @param {Function|string} showIf
 * @returns {object} predicate
 */
export function showIfToPredicate(showIf) {
  let src = typeof showIf === 'function' ? showIf.toString() : String(showIf);
  src = src.trim();
  // strip the arrow head: `(a) =>` or `a =>`
  const m = src.match(/^\(?\s*[A-Za-z_$][\w$]*\s*\)?\s*=>\s*([\s\S]+)$/);
  if (!m) throw new Error(`not an arrow function: ${src.slice(0, 80)}`);
  let body = m[1].trim();
  if (body.startsWith('{')) throw new Error('block-body showIf not supported (none expected)');
  return parseExpr(body);
}

#!/usr/bin/env node
// extract-calculators.mjs — generate src/core/calculators/calculators.mjs from
// main:v1/flowchart.html. (Phase 7, calculator kernel.)
//
// v1's calculators are named functions (calcCompound, …) that read numeric inputs
// via $val(id, default) / document.getElementById(id).value and write their result
// into document.getElementById('<id>-result').innerHTML. The compute is pure; only
// the DOM read/write and optional chart-draw side-effects couple it to the page.
//
// This tool lifts each calc fn VERBATIM, auto-resolves its helper dependencies
// (transitive closure over v1's top-level functions), STUBS the chart-draw fns
// (render*Chart / renderSVG / *Fan*), and hosts them under a minimal DOM-input shim
// → pure, self-contained runCalculator(name, inputs) -> { id, html }. Zero math
// retyped → faithful by construction; proven byte-exact by tools/verify-calculators.mjs.
//
// Covered: every closed-form calculator with a text result (21). Deferred:
// calcHistoricalCycles (chart-primary, no text result) — needs the chart port.

import { writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
let src;
try { src = execSync('git show main:v1/flowchart.html', { cwd: ROOT, maxBuffer: 64 * 1024 * 1024 }).toString('utf8'); }
catch { src = readFileSync(join(ROOT, 'flowchart.html'), 'utf8'); }

// ---- name -> [v1 fn, result element id] ----
const CALCS = [
  ['compound', 'calcCompound', 'ci-result'], ['rule72', 'calcRule72', 'r72-result'],
  ['savingsRate', 'calcSavingsRate', 'sr-result'], ['realNominal', 'calcRealNominal', 'rn-result'],
  ['muniTEY', 'calcMuniTEY', 'muni-result'], ['assetLocation', 'calcAssetLocation', 'al-result'],
  ['sequence', 'calcSequence', 'seq-result'], ['disability', 'calcDI', 'di-result'],
  ['lifeInsurance', 'calcDIME', 'dime-result'], ['hsaVsPpo', 'calcHDHPvsPPO', 'hp-result'],
  ['rentVsBuy', 'calcRentVsBuy', 'rb-result'], ['vehicleTCO', 'calcVehicleTCO', 'tco-result'],
  ['dependentCareFSA', 'calcDCFSA', 'dc-result'], ['expenseRatio', 'calcExpenseRatio', 'er-result'],
  ['lifestyleCreep', 'calcLifestyleCreep', 'lc-result'], ['subscription', 'calcSubscription', 'sub-result'],
  ['coastFIRE', 'calcCoastFIRE', 'coast-result'], ['dividend', 'calcDividend', 'div-result'],
  ['sharpe', 'calcSharpe', 'sh-result'], ['efficientFrontier', 'calcEfficientFrontier', 'ef-result'],
  ['dieWithZero', 'calcDieWithZero', 'dz-result'],
];

// ---- scanning helpers (quote/comment-aware) ----
function skipStr(s, q) { const quote = s[q]; let i = q + 1; while (i < s.length) { if (s[i] === '\\') { i += 2; continue; } if (s[i] === quote) return i + 1; i++; } return i; }
// Template-literal-aware brace matcher: tracks `…${ }…` so braces inside template
// interpolations (the result-HTML templates) don't throw off the depth count.
function balancedBrace(s, start) {
  let depth = 0, i = start; const t = [];
  for (; i < s.length; i++) { const c = s[i];
    if (t.length && t[t.length - 1] === 'T') { if (c === '\\') { i++; continue; } if (c === '`') { t.pop(); continue; } if (c === '$' && s[i + 1] === '{') { t.push('E'); i++; continue; } continue; }
    if (c === '"' || c === "'") { i = skipStr(s, i) - 1; continue; }
    if (c === '`') { t.push('T'); continue; }
    if (c === '/' && s[i + 1] === '/') { i = s.indexOf('\n', i); if (i === -1) { i = s.length; break; } continue; }
    if (c === '/' && s[i + 1] === '*') { i = s.indexOf('*/', i) + 1; continue; }
    if (c === '{') depth++;
    else if (c === '}') { if (t.length && t[t.length - 1] === 'E') { t.pop(); continue; } depth--; if (depth === 0) return i + 1; }
  }
  return i;
}
function balancedSemi(s, start) {
  let pd = 0, sd = 0, cd = 0, i = start; const t = [];
  for (; i < s.length; i++) { const c = s[i];
    if (t.length && t[t.length - 1] === 'T') { if (c === '\\') { i++; continue; } if (c === '`') { t.pop(); continue; } if (c === '$' && s[i + 1] === '{') { t.push('E'); i++; continue; } continue; }
    if (c === '"' || c === "'") { i = skipStr(s, i) - 1; continue; }
    if (c === '`') { t.push('T'); continue; }
    if (c === '/' && s[i + 1] === '/') { i = s.indexOf('\n', i); if (i === -1) { i = s.length; break; } continue; }
    if (c === '/' && s[i + 1] === '*') { i = s.indexOf('*/', i) + 1; continue; }
    if (c === '(') pd++; else if (c === ')') pd--; else if (c === '[') sd++; else if (c === ']') sd--;
    else if (c === '{') cd++;
    else if (c === '}') { if (t.length && t[t.length - 1] === 'E') { t.pop(); continue; } cd--; }
    else if (c === ';' && pd === 0 && sd === 0 && cd === 0 && t.length === 0) return i + 1;
  }
  return i;
}
const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// Pull a TOP-LEVEL (column-0) definition only — never a nested/local one (which
// would carry unbound closure vars). v1's top-level defs start at column 0.
function pullDef(name) {
  let at = src.indexOf('\nfunction ' + name + '(');
  if (at !== -1) { at += 1; const brace = src.indexOf('{', src.indexOf(')', at)); return src.slice(at, balancedBrace(src, brace)); }
  if (src.startsWith('function ' + name + '(')) { const brace = src.indexOf('{', src.indexOf(')', 0)); return src.slice(0, balancedBrace(src, brace)); }
  const m = new RegExp('\\n(?:const|let)\\s+' + escRe(name) + '\\s*=').exec(src);
  if (m) { const start = m.index + 1; return src.slice(start, balancedSemi(src, start)); }
  return null;
}

// all v1 TOP-LEVEL (column-0) function/const names (for dependency filtering).
const DEFINED = new Set();
for (const m of src.matchAll(/(?:^|\n)function\s+([A-Za-z_$][\w$]*)/g)) DEFINED.add(m[1]);
for (const m of src.matchAll(/(?:^|\n)(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=/g)) DEFINED.add(m[1]);

const SHIM = new Set(['document', 'Math', 'JSON', 'Object', 'Array', 'Number', 'String', 'Boolean', 'parseFloat', 'parseInt', 'isFinite', 'isNaN', 'console', 'Date', 'Map', 'Set', 'RegExp', 'Infinity', 'undefined', 'NaN']);
const isStub = (n) => /Chart|renderSVG|Fan/.test(n);
function calledIn(body) { const out = new Set(); for (const m of body.matchAll(/(?<![.\w$])([A-Za-z_$][\w$]*)\s*\(/g)) out.add(m[1]); return out; }

// transitive closure from the calc entry fns
const pulled = new Map(); const stubs = new Set(); const missing = new Set();
const queue = CALCS.map(([, fn]) => fn);
while (queue.length) {
  const name = queue.shift();
  if (pulled.has(name) || stubs.has(name) || SHIM.has(name)) continue;
  if (isStub(name)) { stubs.add(name); continue; }
  const def = pullDef(name);
  if (!def) { missing.add(name); continue; }
  pulled.set(name, def);
  for (const c of calledIn(def)) if (DEFINED.has(c) && !SHIM.has(c) && !pulled.has(c) && !stubs.has(c)) queue.push(c);
}

// ---- input attributes (min/max/value/step) + select options ----
function parseInputs() {
  const attrs = {};
  for (const m of src.matchAll(/<(?:input|select)\b[^>]*\bid="([^"]+)"[^>]*>/g)) {
    const tag = m[0], id = m[1]; attrs[id] = {};
    for (const a of ['min', 'max', 'value', 'step']) { const v = (tag.match(new RegExp(`\\b${a}="([^"]*)"`)) || [])[1]; if (v != null) attrs[id][a] = v; }
  }
  return attrs;
}
function parseSelects() {
  const opts = {};
  for (const m of src.matchAll(/<select\b[^>]*\bid="([^"]+)"[^>]*>([\s\S]*?)<\/select>/g))
    opts[m[1]] = [...m[2].matchAll(/<option\s+value="([^"]*)"[^>]*>([\s\S]*?)<\/option>/g)].map((o) => ({ v: o[1], l: o[2].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').trim() }));
  return opts;
}

// input ids each calc reads (for the parity oracle's vectors)
function inputIdsOf(fn) {
  const def = pulled.get(fn) || '';
  const ids = new Set();
  for (const m of def.matchAll(/\$val\('([^']+)'/g)) ids.add(m[1]);
  for (const m of def.matchAll(/getElementById\('([^']+)'\)\s*(?:\|\|[^)]*\))?\s*\.value/g)) ids.add(m[1]);
  return [...ids];
}

// ---- emit ----
const pulledSrc = [...pulled.values()].join('\n\n');
const stubSrc = [...stubs].map((n) => `  const ${n} = () => {};`).join('\n');
const dispatch = CALCS.map(([key, fn]) => `    ${key}: ${fn}`).join(',\n');
const resultIds = CALCS.map(([key, , id]) => `    ${key}: '${id}'`).join(',\n');
const registry = CALCS.map(([key, fn, id]) => ({ name: key, resultId: id, inputs: inputIdsOf(fn) }));

const out = `// calculators.mjs — AUTO-GENERATED by tools/extract-calculators.mjs from
// main:v1/flowchart.html. Verbatim v1 calculator compute fns + their resolved helper
// deps, under a DOM-input shim; chart-draw side-effects stubbed. DO NOT HAND-EDIT —
// regenerate when v1 calcs change. Byte-exact parity proven by verify-calculators.mjs.
/* eslint-disable */

export const CALCULATORS = ${JSON.stringify(registry)};
export const INPUT_ATTRS = ${JSON.stringify(parseInputs())};
export const SELECT_OPTIONS = ${JSON.stringify(parseSelects())};

/**
 * Run a calculator by name with a map of input-id -> raw value (string|number).
 * Returns { id, html } — the result element id and the HTML v1 would have written.
 * Pure: no real DOM, chart side-effects stubbed; unknown ids fall back to the calc's
 * own defaults (v1 $val semantics), clamped to INPUT_ATTRS min/max.
 */
export function runCalculator(name, inputs) {
  const __in = inputs || {};
  const __out = {};
  const __el = (id) => ({
    get value() { return __in[id]; },
    set innerHTML(h) { __out[id] = h; },
    get innerHTML() { return __out[id] || ''; },
    set textContent(t) { __out[id] = t; },
    get textContent() { return __out[id] || ''; },
    getAttribute(a) { return (INPUT_ATTRS[id] && INPUT_ATTRS[id][a] != null) ? INPUT_ATTRS[id][a] : null; },
    get tagName() { const v = __in[id]; return (v != null && isNaN(parseFloat(v))) ? 'SELECT' : 'INPUT'; },
    style: {}, classList: { add() {}, remove() {}, toggle() {} }, querySelector: () => null, querySelectorAll: () => [], appendChild() {}, setAttribute() {},
  });
  const document = { getElementById: __el, createElement: () => __el(''), createElementNS: () => __el('') };
  const state = { answers: {} }; // shim: standalone calc = no diagnostic context (matches a fresh page; getDefault → undefined → calc fallbacks)
${stubSrc}
${pulledSrc}
  const __dispatch = {
${dispatch}
  };
  const __resultId = {
${resultIds}
  };
  const fn = __dispatch[name];
  if (!fn) throw new Error('unknown calculator: ' + name);
  fn();
  const id = __resultId[name];
  return { id, html: __out[id] || '' };
}
`;

mkdirSync(join(ROOT, 'src', 'core', 'calculators'), { recursive: true });
writeFileSync(join(ROOT, 'src', 'core', 'calculators', 'calculators.mjs'), out);
console.log(`wrote calculators.mjs — ${CALCS.length} calculators, ${pulled.size} fns pulled, ${stubs.size} chart-stubs [${[...stubs].join(', ')}]`);
if (missing.size) console.log(`  note: ${missing.size} referenced names not found as defs (assumed builtin/shim): ${[...missing].slice(0, 12).join(', ')}`);

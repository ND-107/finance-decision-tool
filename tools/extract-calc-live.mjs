#!/usr/bin/env node
// extract-calc-live.mjs — generate src/ui/calculators-live.mjs from main:v1/flowchart.html.
// (Phase 7, calculator charts.)
//
// The pure kernel (calculators.mjs) runs the calc fns under a DOM shim with charts
// STUBBED — perfect for the byte-exact verification gate, but it can't draw. For the
// UI we need v1's calculators running LIVE against the real DOM so the inline charts
// (renderCompoundChart / renderSequenceChart / renderHistoricalFanChart, incl. the
// chart-only calcHistoricalCycles) actually render. This tool lifts v1's calculator
// subsystem VERBATIM — the wire* functions and their transitive deps (calc fns, chart
// fns, renderSVG, $val, fmt*, __debounce, getDefault, …) — emitted at module scope so
// they operate on the real document, and exposes wireSectionCalculators(container)
// (calls every wire fn; each no-ops where its inputs are absent). Same source the
// kernel verifies, so it inherits that correctness; only the DOM is real, not shimmed.

import { writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
let src;
try { src = execSync('git show main:v1/flowchart.html', { cwd: ROOT, maxBuffer: 64 * 1024 * 1024 }).toString('utf8'); }
catch { src = readFileSync(join(ROOT, 'flowchart.html'), 'utf8'); }

// ---- template-literal + regex-aware scanners ----
function skipStr(s, q) { const quote = s[q]; let i = q + 1; while (i < s.length) { if (s[i] === '\\') { i += 2; continue; } if (s[i] === quote) return i + 1; i++; } return i; }
const REGEX_PREV = new Set(['=', '(', '[', '{', ',', ';', ':', '!', '&', '|', '?', '+', '-', '*', '%', '^', '~', '<', '>', '']);
function skipRegex(s, i) { // i at '/'; return index after closing /flags
  let j = i + 1, inClass = false;
  for (; j < s.length; j++) { const c = s[j];
    if (c === '\\') { j++; continue; }
    if (c === '[') inClass = true; else if (c === ']') inClass = false;
    else if (c === '/' && !inClass) { j++; break; }
    else if (c === '\n') break;
  }
  while (j < s.length && /[a-z]/i.test(s[j])) j++;
  return j;
}
// Context-stack scanner: st entries are 'B' (code block {…}), 'T' (template-literal
// text), 'E' (template ${…} expression). Correctly handles arbitrarily nested
// templates/blocks (e.g. `${arr.map(x => { return `…${y}…`; })}`). stop='brace'
// starts at an opening { (pushed as the root B) and returns when st empties;
// stop='semi' returns at a top-level ; (st empty, no open parens/brackets).
function scan(s, start, stop) {
  const st = []; let i = start, pd = 0, sd = 0, last = '';
  if (stop === 'brace') { st.push('B'); i++; } // consume the opening {
  for (; i < s.length; i++) {
    const c = s[i];
    if (st[st.length - 1] === 'T') {
      if (c === '\\') { i++; continue; }
      if (c === '`') { st.pop(); last = 'x'; continue; }
      if (c === '$' && s[i + 1] === '{') { st.push('E'); i++; last = ''; continue; }
      continue;
    }
    if (c === ' ' || c === '\t' || c === '\n' || c === '\r') continue;
    if (c === '"' || c === "'") { i = skipStr(s, i) - 1; last = 'x'; continue; }
    if (c === '`') { st.push('T'); last = 'x'; continue; }
    if (c === '/' && s[i + 1] === '/') { const nl = s.indexOf('\n', i); i = nl === -1 ? s.length : nl; continue; }
    if (c === '/' && s[i + 1] === '*') { i = s.indexOf('*/', i) + 1; continue; }
    if (c === '/' && REGEX_PREV.has(last)) { i = skipRegex(s, i) - 1; last = 'x'; continue; }
    if (c === '(') pd++; else if (c === ')') pd--; else if (c === '[') sd++; else if (c === ']') sd--;
    else if (c === '{') st.push('B');
    else if (c === '}') { st.pop(); if (stop === 'brace' && st.length === 0) return i + 1; }
    else if (c === ';' && stop === 'semi' && st.length === 0 && pd === 0 && sd === 0) return i + 1;
    last = c;
  }
  return i;
}
const balancedBrace = (s, start) => scan(s, start, 'brace');
const balancedSemi = (s, start) => scan(s, start, 'semi');
const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function pullDef(name) {
  let at = src.indexOf('\nfunction ' + name + '(');
  if (at !== -1) { at += 1; const brace = src.indexOf('{', src.indexOf(')', at)); return src.slice(at, balancedBrace(src, brace)); }
  if (src.startsWith('function ' + name + '(')) { const brace = src.indexOf('{', src.indexOf(')', 0)); return src.slice(0, balancedBrace(src, brace)); }
  const m = new RegExp('\\n(?:const|let)\\s+' + escRe(name) + '\\s*=').exec(src);
  if (m) { const start = m.index + 1; return src.slice(start, balancedSemi(src, start)); }
  return null;
}
const DEFINED = new Set();
for (const m of src.matchAll(/(?:^|\n)function\s+([A-Za-z_$][\w$]*)/g)) DEFINED.add(m[1]);
for (const m of src.matchAll(/(?:^|\n)(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=/g)) DEFINED.add(m[1]);

const SHIM = new Set(['document', 'window', 'Math', 'JSON', 'Object', 'Array', 'Number', 'String', 'Boolean', 'parseFloat', 'parseInt', 'isFinite', 'isNaN', 'console', 'Date', 'Map', 'Set', 'RegExp', 'Infinity', 'undefined', 'NaN', 'setTimeout', 'clearTimeout', 'requestAnimationFrame']);
// Blank out string/comment/template-text content (keep code + ${…} expressions) so
// identifier extraction sees CODE only — prose strings mention v1 fn names and would
// otherwise be pulled.
function codeOnly(s) {
  let out = '', i = 0; const t = [];
  while (i < s.length) {
    const c = s[i];
    if (t.length && t[t.length - 1] === 'T') {
      if (c === '\\') { out += '  '; i += 2; continue; }
      if (c === '`') { t.pop(); out += ' '; i++; continue; }
      if (c === '$' && s[i + 1] === '{') { t.push('E'); out += '${'; i += 2; continue; }
      out += ' '; i++; continue;
    }
    if (c === '"' || c === "'") { const e = skipStr(s, i); out += ' '.repeat(e - i); i = e; continue; }
    if (c === '`') { t.push('T'); out += ' '; i++; continue; }
    if (c === '/' && s[i + 1] === '/') { const nl = s.indexOf('\n', i); const e = nl === -1 ? s.length : nl; out += ' '.repeat(e - i); i = e; continue; }
    if (c === '/' && s[i + 1] === '*') { const e = s.indexOf('*/', i) + 2; out += ' '.repeat(e - i); i = e; continue; }
    if (c === '}' && t.length && t[t.length - 1] === 'E') { t.pop(); out += '}'; i++; continue; }
    out += c; i++;
  }
  return out;
}
// All identifier REFERENCES in CODE (not just calls) — the wire fns pass calc fns as
// callback args (__debounce(calcCompound, 80)). Filtered to DEFINED downstream.
function calledIn(body) { const out = new Set(); for (const m of codeOnly(body).matchAll(/(?<![.\w$])([A-Za-z_$][\w$]*)/g)) out.add(m[1]); return out; }

const ENTRY = ['wireMathCalculators', 'wireSpendingEssentialsCalculators', 'wireSpendingLifestyleCalculators', 'wirePortfolioCalculators', 'wireZeitgeistCalculators', 'wireInlineCalculators'];
const pulled = new Map(); const missing = new Set();
const queue = [...ENTRY];
while (queue.length) {
  const name = queue.shift();
  if (pulled.has(name) || SHIM.has(name) || name === 'state') continue; // `state` is provided by the wrapper
  const def = pullDef(name);
  if (!def) { missing.add(name); continue; }
  pulled.set(name, def);
  for (const c of calledIn(def)) if (DEFINED.has(c) && !SHIM.has(c) && !pulled.has(c) && c !== 'state') queue.push(c);
}
for (const e of ENTRY) if (!pulled.has(e)) throw new Error('entry wire fn not found: ' + e);

// Calc fns wired via __debounce inside the entry wire fns — collected (source order,
// deduped, restricted to pulled fns) so wireSectionCalculators can run each one for the
// SYNCHRONOUS initial paint instead of nudging inputs through the 80ms debounce.
const initial = []; const seenInit = new Set();
for (const e of ENTRY) {
  const def = pulled.get(e); if (!def) continue;
  for (const m of codeOnly(def).matchAll(/__debounce\(\s*([A-Za-z_$][\w$]*)\s*,/g)) {
    const n = m[1];
    if (pulled.has(n) && !seenInit.has(n)) { seenInit.add(n); initial.push(n); }
  }
}
if (!initial.length) throw new Error('no debounced calc fns found for synchronous initial paint');

const body = [...pulled.values()].join('\n\n');
const out = `// calculators-live.mjs — AUTO-GENERATED by tools/extract-calc-live.mjs from
// main:v1/flowchart.html. v1's calculator subsystem, VERBATIM, running LIVE against the
// real DOM (so inline charts render). Same source the pure kernel (calculators.mjs)
// verifies byte-exact. DO NOT HAND-EDIT — regenerate when v1 calcs change.
/* eslint-disable */

// NOTE: a few helpers (getDefault) read \`state.answers\` — that resolves to the app
// shell's global \`state\` (app.mjs), so calculators personalize from the user's
// diagnostic answers automatically. We deliberately do NOT declare \`state\` here
// (it would collide with app.mjs's).

${body}

// Run every wire fn against the (now in-DOM) active view; each no-ops where its
// inputs are absent (getElementById → null guards). wireInlineCalculators scans a
// container for the inline "match" calc used in node details / the charts.
export function wireSectionCalculators(container) {
  for (const w of [wireMathCalculators, wireSpendingEssentialsCalculators, wireSpendingLifestyleCalculators, wirePortfolioCalculators, wireZeitgeistCalculators]) {
    try { w(); } catch (e) { /* view lacks these inputs */ }
  }
  try { wireInlineCalculators(container || document); } catch (e) { /* noop */ }
  // Initial paint: v1 computed each calc once inside renderX(); we inject the section
  // HTML directly, so we compute here. Call each wired calc SYNCHRONOUSLY (not via the
  // 80ms input-debounce). A deferred timer would otherwise fire AFTER a fast tab-switch
  // wiped #app and write to a now-missing output element (getElementById(...).innerHTML
  // on null → TypeError). Each call is guarded — a calc whose inputs aren't in the active
  // view simply no-ops. Real user input still flows through the debounced listeners above.
  for (const fn of [${initial.join(', ')}]) {
    try { fn(); } catch (e) { /* this calc's view isn't mounted */ }
  }
}
`;

mkdirSync(join(ROOT, 'src', 'ui'), { recursive: true });
writeFileSync(join(ROOT, 'src', 'ui', 'calculators-live.mjs'), out);
console.log(`wrote src/ui/calculators-live.mjs — ${pulled.size} fns pulled (verbatim, charts LIVE)`);
if (missing.size) console.log(`  assumed builtin/shim: ${[...missing].slice(0, 12).join(', ')}`);

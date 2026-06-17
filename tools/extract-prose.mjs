#!/usr/bin/env node
// extract-prose.mjs — generate src/core/plan-prose.mjs from main:v1/flowchart.html.
//
// v1's computePlan() builds each action's `reason` / `because` prose INLINE, often
// personalized via ternaries / conditional assignment over the answers + block-
// local vars (isParent, isBackdoor, ic, stratReason, …). v2's engine reproduces
// v1's DECISIONS (plan-rules) but dropped the prose. This tool lifts, per add(),
// the VERBATIM executed-prefix of its enclosing if-blocks (so every local — incl.
// multi-declarator `let a,b;` and if/else-if assignment chains — is reconstructed)
// plus the reason/because expressions, and hosts them under a shim that defines
// v1's module-level helpers (bracket/isSE/hasIncome/efLabel/fmtMoneyFull/getDefault)
// over the answers. Sibling add()/skip() calls in the prefix are neutralized. Zero
// prose retyping → byte-exact by construction. Proven by tools/verify-prose-parity.mjs.
//
// Output: src/core/plan-prose.mjs (proseFor(pid, answers) -> { reason, because })
//         tools/lib/prose-manifest.json (pid -> {title,nodeKey} for alignment checks)

import { writeFileSync, readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
let src;
try { src = execSync('git show main:v1/flowchart.html', { cwd: ROOT, maxBuffer: 64 * 1024 * 1024 }).toString('utf8'); }
catch { src = readFileSync(join(ROOT, 'flowchart.html'), 'utf8'); }

// ---- isolate the computePlan body, truncated before FRICTION_RULES (no regex past here) ----
const cpStart = src.indexOf('function computePlan() {');
if (cpStart === -1) throw new Error('computePlan not found');
const bodyOpen = src.indexOf('{', cpStart);
const fr = src.indexOf('const FRICTION_RULES', bodyOpen);
if (fr === -1) throw new Error('FRICTION_RULES marker not found');
const body = src.slice(bodyOpen + 1, fr); // inside computePlan {...}, up to friction phase

const isIdChar = (c) => c !== undefined && /[A-Za-z0-9_$]/.test(c);

function skipStr(s, q) {
  const quote = s[q]; let i = q + 1;
  while (i < s.length) { if (s[i] === '\\') { i += 2; continue; } if (s[i] === quote) return i + 1; i++; }
  return i;
}
function skipTrivia(s, i) {
  for (;;) {
    if (i >= s.length) return i;
    if (' \t\n\r'.includes(s[i])) { i++; continue; }
    if (s[i] === '/' && s[i + 1] === '/') { i = s.indexOf('\n', i); if (i === -1) return s.length; continue; }
    if (s[i] === '/' && s[i + 1] === '*') { i = s.indexOf('*/', i) + 2; continue; }
    return i;
  }
}
function balanced(s, start) {
  const open = s[start], close = open === '(' ? ')' : open === '{' ? '}' : ']';
  let depth = 0, i = start;
  for (; i < s.length; i++) {
    const c = s[i];
    if (c === '"' || c === "'" || c === '`') { i = skipStr(s, i) - 1; continue; }
    if (c === '/' && s[i + 1] === '/') { i = s.indexOf('\n', i); if (i === -1) { i = s.length; break; } continue; }
    if (c === '/' && s[i + 1] === '*') { i = s.indexOf('*/', i) + 1; continue; }
    if (c === open) depth++;
    else if (c === close) { depth--; if (depth === 0) return { src: s.slice(start, i + 1), end: i + 1 }; }
  }
  return { src: s.slice(start, i), end: i };
}
function objectFields(objSrc) {
  const inner = objSrc.slice(objSrc.indexOf('{') + 1, objSrc.lastIndexOf('}'));
  const fields = {}; let i = 0;
  while (i < inner.length) {
    i = skipTrivia(inner, i); if (i >= inner.length) break;
    let k = '';
    while (i < inner.length && isIdChar(inner[i])) { k += inner[i]; i++; }
    i = skipTrivia(inner, i);
    if (inner[i] !== ':') { i++; continue; }
    i++;
    const vStart = i; let pd = 0, sd = 0, cd = 0;
    for (; i < inner.length; i++) {
      const c = inner[i];
      if (c === '"' || c === "'" || c === '`') { i = skipStr(inner, i) - 1; continue; }
      if (c === '/' && inner[i + 1] === '/') { const nl = inner.indexOf('\n', i); i = nl === -1 ? inner.length : nl; continue; }
      if (c === '(') pd++; else if (c === ')') pd--;
      else if (c === '[') sd++; else if (c === ']') sd--;
      else if (c === '{') cd++; else if (c === '}') cd--;
      else if (c === ',' && pd === 0 && sd === 0 && cd === 0) break;
    }
    if (k) fields[k] = inner.slice(vStart, i).trim();
    i++;
  }
  return fields;
}

const idsOf = (s) => (s ? [...s.matchAll(/[A-Za-z_$][\w$]*/g)].map((m) => m[0]) : []);

// Capture a `const`/`let NAME = …;` declaration starting at `start`; returns name/src/end.
function captureDecl(s, start) {
  const kw = s.startsWith('const', start) ? 'const' : 'let';
  let j = skipTrivia(s, start + kw.length), name = '';
  while (j < s.length && isIdChar(s[j])) { name += s[j]; j++; }
  let k = start, pd = 0, sd = 0, cd = 0;
  for (; k < s.length; k++) {
    const ch = s[k];
    if (ch === '"' || ch === "'" || ch === '`') { k = skipStr(s, k) - 1; continue; }
    if (ch === '/' && s[k + 1] === '/') { const nl = s.indexOf('\n', k); k = nl === -1 ? s.length : nl; continue; }
    if (ch === '(') pd++; else if (ch === ')') pd--;
    else if (ch === '[') sd++; else if (ch === ']') sd--;
    else if (ch === '{') cd++; else if (ch === '}') cd--;
    else if (ch === ';' && pd === 0 && sd === 0 && cd === 0) break;
  }
  return { name, src: s.slice(start, k + 1), end: k + 1 };
}

// Replace sibling add(...) / skip(...) calls in captured context with a bare `;`.
function neutralize(s) {
  let out = '', i = 0;
  while (i < s.length) {
    const c = s[i];
    if (c === '"' || c === "'" || c === '`') { const e = skipStr(s, i); out += s.slice(i, e); i = e; continue; }
    if (c === '/' && s[i + 1] === '/') { const nl = s.indexOf('\n', i); const e = nl === -1 ? s.length : nl; out += s.slice(i, e); i = e; continue; }
    if (c === '/' && s[i + 1] === '*') { const e = s.indexOf('*/', i) + 2; out += s.slice(i, e); i = e; continue; }
    const kw = s.startsWith('add', i) ? 'add' : s.startsWith('skip', i) ? 'skip' : null;
    if (kw && !isIdChar(s[i - 1]) && s[i - 1] !== '.') {
      const j = skipTrivia(s, i + kw.length);
      if (s[j] === '(') {
        let e = balanced(s, j).end;
        while (e < s.length && ';  \t\n\r'.includes(s[e])) e++;
        out += ';'; i = e; continue;
      }
    }
    out += c; i++;
  }
  return out;
}

// ---- single pass: track curly-block frames (open-brace positions) + capture add({…}) ----
const frames = [{ brace: -1, bodyStart: 0 }]; // frame 0 == function body
const adds = [];
const frame0decls = []; // function-body-level const/let, in source order, w/ position
const F0_BLOCK = new Set(['a', 'actions', 'skipped', 'key']);
let i = 0;
while (i < body.length) {
  const c = body[i];
  if (c === '"' || c === "'" || c === '`') { i = skipStr(body, i); continue; }
  if (c === '/' && body[i + 1] === '/') { const nl = body.indexOf('\n', i); i = nl === -1 ? body.length : nl; continue; }
  if (c === '/' && body[i + 1] === '*') { i = body.indexOf('*/', i) + 2; continue; }
  if (c === '{') { frames.push({ brace: i, bodyStart: i + 1 }); i++; continue; }
  if (c === '}') { if (frames.length > 1) frames.pop(); i++; continue; }
  // function-body-level decls (frame 0) — capture name+src for transitive prepend
  if (frames.length === 1 && (body.startsWith('const', i) || body.startsWith('let', i)) && !isIdChar(body[i - 1])) {
    const kwLen = body.startsWith('const', i) ? 5 : 3;
    if (!isIdChar(body[i + kwLen])) {
      const d = captureDecl(body, i);
      if (d.name && !F0_BLOCK.has(d.name)) frame0decls.push({ name: d.name, src: d.src, pos: i });
      i = d.end; continue;
    }
  }
  if (body.startsWith('add', i) && !isIdChar(body[i - 1]) && body[i - 1] !== '.') {
    const j = skipTrivia(body, i + 3);
    if (body[j] === '(') {
      const after = skipTrivia(body, j + 1);
      if (body[after] === '{') {
        const args = balanced(body, j);
        const objStart = args.src.indexOf('{');
        const fields = objectFields(balanced(args.src, objStart).src);
        adds.push({ fields, frames: frames.slice(), addPos: i });
        i = args.end; continue;
      }
    }
  }
  i++;
}
if (adds.length !== 65) console.error(`WARN: captured ${adds.length} add() calls (expected 65)`);

// Build the verbatim executed-prefix context for an add(): concat each enclosing
// inner if-block's statements that precede the add (including the next block's
// opener brace), neutralizing sibling add/skip calls. `closes` = # of dangling
// `{` to close after the return.
function contextFor(add) {
  const inner = add.frames.slice(1); // drop frame 0 (function body)
  let ctx = '';
  for (let f = 0; f < inner.length; f++) {
    const start = inner[f].bodyStart;
    const end = f < inner.length - 1 ? inner[f + 1].brace + 1 : add.addPos;
    ctx += body.slice(start, end);
  }
  ctx = neutralize(ctx).trim();
  const closes = Math.max(0, inner.length - 1);
  // prepend the transitively-needed function-body decls declared before this add
  const avail = frame0decls.filter((d) => d.pos < add.addPos);
  const want = new Set([...idsOf(add.fields.reason), ...idsOf(add.fields.because), ...idsOf(ctx)]);
  const need = new Set();
  let changed = true;
  while (changed) {
    changed = false;
    for (const d of avail) if (want.has(d.name) && !need.has(d.name)) {
      need.add(d.name);
      for (const id of idsOf(d.src)) if (!want.has(id)) { want.add(id); changed = true; }
    }
  }
  const pre = avail.filter((d) => need.has(d.name)).map((d) => d.src).join('\n');
  return { ctx: (pre ? pre + '\n' : '') + ctx, closes };
}

// ---- pull v1 module-level helpers verbatim (state.answers shimmed to answers) ----
const HELPER_NAMES = ['bracket', 'hasIncome', 'isSE', 'efLabel', 'fmtMoneyFull', 'getDefault'];
function pullFn(name) {
  const at = src.indexOf('function ' + name + '(');
  if (at === -1) throw new Error('helper not found: ' + name);
  const braceStart = src.indexOf('{', src.indexOf(')', at));
  return src.slice(at, balanced(src, braceStart).end);
}
const HELPERS = HELPER_NAMES.map((n) => '  ' + pullFn(n).replace(/\n/g, '\n  ')).join('\n');

// ---- emit ----
const cases = adds.map((add, idx) => {
  const pid = 'p' + (idx + 1);
  const reason = add.fields.reason || "''";
  const because = add.fields.because || "''";
  const { ctx, closes } = contextFor(add);
  const ctxLines = ctx ? ctx.split('\n').map((l) => '      ' + l.trim()).join('\n') + '\n' : '';
  const ret = `      return { reason: ${reason}, because: ${because} };`;
  const tail = closes > 0 ? '\n' + '      }'.repeat(closes) + "\n      return { reason: '', because: '' };" : '';
  return `    case '${pid}': {\n${ctxLines}${ret}${tail}\n    }`;
}).join('\n');

const out = `// plan-prose.mjs — AUTO-GENERATED by tools/extract-prose.mjs from main:v1/flowchart.html.
// Verbatim v1 computePlan reason/because expressions + their enclosing block-local
// context, hosted under v1's helper shims. DO NOT HAND-EDIT — regenerate when v1
// prose changes. Byte-exact parity is proven by tools/verify-prose-parity.mjs
// (v1-live vs v2 over the full fixture corpus).
//
// pid 'pN' == the Nth add() in v1 source order == the Nth add-rule in RULE_GROUPS
// (group order mirrors v1 source order; plan-engine tags rules positionally).

/* eslint-disable */
export function proseFor(pid, answers) {
  const a = answers || {};
  const state = { answers: a }; // shim: v1 helpers read state.answers
${HELPERS}
  switch (pid) {
${cases}
    default: return { reason: '', because: '' };
  }
}
`;

writeFileSync(join(ROOT, 'src', 'core', 'plan-prose.mjs'), out);
const manifest = adds.map((add, idx) => ({
  pid: 'p' + (idx + 1), title: add.fields.title, nodeKey: add.fields.nodeKey,
  hasReason: !!add.fields.reason, hasBecause: !!add.fields.because,
}));
writeFileSync(join(ROOT, 'tools', 'lib', 'prose-manifest.json'), JSON.stringify(manifest, null, 2));
console.log(`wrote src/core/plan-prose.mjs (${adds.length} cases) + tools/lib/prose-manifest.json`);
console.log(`  reason present: ${adds.filter((x) => x.fields.reason).length}/${adds.length} · with block-context: ${adds.filter((x) => contextFor(x).ctx).length}`);

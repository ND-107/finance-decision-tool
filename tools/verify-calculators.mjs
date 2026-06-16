#!/usr/bin/env node
// verify-calculators.mjs — calculator parity gate (Phase 7).
//
// Proves v2's pure runCalculator() reproduces v1's real calculators byte-for-byte.
// Oracle: load main:flowchart.html in headless Chrome, and for each calculator +
// input vector, set the real inputs, OVERRIDE the result element's innerHTML setter
// to capture the RAW assigned string (bypassing the browser's DOM re-serialization),
// call v1's global calc fn, and read it back. Compare to v2 runCalculator(name, vec).
// Non-circular: it exercises v1's actual $val (clamping, min/max attrs, select reads)
// against v2's shim. Exit nonzero on any mismatch.

import { writeFileSync, readFileSync, mkdtempSync } from 'node:fs';
import { execFileSync, execSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { runCalculator, INPUT_ATTRS } from '../src/core/calculators/calculators.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

// calculator -> { fn, resultId, inputs: { id: [test values...] } } (in-range + edges + clamp).
const SPECS = {
  compound: { fn: 'calcCompound', resultId: 'ci-result', inputs: {
    'ci-pv': [0, 10000, 250000], 'ci-pmt': [0, 500, 2000], 'ci-rate': [0, 7, 15, -5, 999], 'ci-years': [1, 30, 50] } },
  rule72: { fn: 'calcRule72', resultId: 'r72-result', inputs: {
    'r72-rate': [1, 7, 8, 12, 25, 0, -3] } },
  savingsRate: { fn: 'calcSavingsRate', resultId: 'sr-result', inputs: {
    'sr-rate': [10, 25, 50, 75, 0, 99], 'sr-return': [3, 5, 7], 'sr-wr': [3, 4, 5], 'sr-ss': [0, 20000, 70000], 'sr-expenses': [40000, 60000, 120000] } },
  realNominal: { fn: 'calcRealNominal', resultId: 'rn-result', inputs: {
    'rn-nominal': [5, 10, 20, -2], 'rn-inflation': [0, 3, 8] } },
  muniTEY: { fn: 'calcMuniTEY', resultId: 'muni-result', inputs: {
    'muni-yield': [3, 4, 5], 'muni-treasury': [3.5, 4.3, 5], 'muni-fed': [24, 37, 50], 'muni-state': [0, 9.3, 13], 'muni-instate': ['yes', 'no'], 'muni-niit': ['yes', 'no'] } },
};

// Build vectors: base (first value of each input), then vary each input across its
// list holding others at base, plus an all-last combo. Deterministic.
function vectorsFor(inputs) {
  const ids = Object.keys(inputs);
  const base = {}; for (const id of ids) base[id] = inputs[id][0];
  const vecs = [{ ...base }];
  for (const id of ids) for (const v of inputs[id].slice(1)) vecs.push({ ...base, [id]: v });
  const last = {}; for (const id of ids) last[id] = inputs[id][inputs[id].length - 1]; vecs.push(last);
  return vecs;
}

const plan = Object.entries(SPECS).map(([name, s]) => ({ name, fn: s.fn, resultId: s.resultId, vectors: vectorsFor(s.inputs) }));

// ---- run v1-live in headless Chrome, capturing raw assigned innerHTML ----
const driver = `
(function(){
  var PLAN = ${JSON.stringify(plan)};
  var out = {};
  PLAN.forEach(function(c){
    out[c.name] = c.vectors.map(function(vec){
      Object.keys(vec).forEach(function(id){ var el=document.getElementById(id); if(el){ el.value=String(vec[id]); } });
      var res=document.getElementById(c.resultId); var raw='';
      try { Object.defineProperty(res,'innerHTML',{configurable:true,set:function(v){raw=v;},get:function(){return raw;}}); } catch(e){}
      try { window[c.fn](); } catch(e){ raw='__ERR__'+(e&&e.message||e); }
      return raw;
    });
  });
  var b64=btoa(unescape(encodeURIComponent(JSON.stringify(out)))); // UTF-8-safe, entity-proof
  var p=document.createElement('pre'); p.id='CALCOUT'; p.textContent=b64; document.documentElement.appendChild(p);
})();`;

let v1src;
try { v1src = execSync('git show main:flowchart.html', { cwd: ROOT, maxBuffer: 64 * 1024 * 1024 }).toString('utf8'); }
catch { v1src = readFileSync(join(ROOT, 'flowchart.html'), 'utf8'); }
const dir = mkdtempSync(join(tmpdir(), 'calc-oracle-'));
const file = join(dir, 'v1.html');
writeFileSync(file, v1src.replace('</body>', `<script>${driver}</script>\n</body>`));

const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox', '--virtual-time-budget=8000', '--dump-dom', `file://${file}`], { maxBuffer: 64 * 1024 * 1024 }).toString('utf8');
const m = dom.match(/<pre id="CALCOUT">([A-Za-z0-9+/=]+)<\/pre>/);
if (!m) { console.error('✗ no oracle output from Chrome'); process.exit(2); }
const v1out = JSON.parse(Buffer.from(m[1], 'base64').toString('utf8'));

// ---- compare v2 runCalculator vs v1-live ----
let checked = 0;
const failures = [];
for (const c of plan) {
  c.vectors.forEach((vec, i) => {
    checked++;
    const v1 = v1out[c.name][i];
    const v2 = runCalculator(c.name, vec).html;
    if (v1 !== v2) failures.push({ name: c.name, vec, v1: (v1 || '').slice(0, 140), v2: (v2 || '').slice(0, 140) });
  });
}

// Confirm v2's empty-input run ({} → calc $val defaults) equals an explicit run at
// the inputs' HTML `value` attributes — i.e. each calc's def param aligns with the
// markup default the UI seeds. (Distinct from the v1-vs-v2 vectors above.)
for (const [name, s] of Object.entries(SPECS)) {
  const htmlDefaults = {};
  for (const id of Object.keys(s.inputs)) if (INPUT_ATTRS[id] && INPUT_ATTRS[id].value != null) htmlDefaults[id] = INPUT_ATTRS[id].value;
  const defHtml = runCalculator(name, htmlDefaults).html;
  const emptyHtml = runCalculator(name, {}).html;
  checked++;
  if (defHtml !== emptyHtml) failures.push({ name, vec: '(empty {} vs HTML defaults)', v1: defHtml.slice(0, 120), v2: emptyHtml.slice(0, 120) });
}

console.log(`calculator parity: ${checked} vectors across ${plan.length} calculators (v1-live Chrome vs v2 runCalculator)`);
if (failures.length) {
  console.error(`\n✗ ${failures.length} mismatch(es). First ${Math.min(8, failures.length)}:`);
  for (const f of failures.slice(0, 8)) {
    console.error(`\n• ${f.name}  ${JSON.stringify(f.vec)}`);
    console.error(`   v1: ${f.v1}`);
    console.error(`   v2: ${f.v2}`);
  }
  process.exit(1);
}
console.log('\n✓ v2 reproduces every v1 calculator output byte-for-byte (raw HTML, incl. $val clamping & selects).');

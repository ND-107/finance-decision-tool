#!/usr/bin/env node
// verify-calculators.mjs — calculator parity gate (Phase 7).
//
// Proves v2's pure runCalculator() reproduces v1's real calculators byte-for-byte.
// Oracle: load main:flowchart.html in headless Chrome, and for each calculator +
// auto-generated input vector, set the real inputs, OVERRIDE the result element's
// innerHTML/textContent setter to capture the RAW assigned string (bypassing the
// browser's DOM re-serialization), call v1's global calc fn, and read it back.
// Compare to v2 runCalculator(name, vec). Non-circular: exercises v1's actual $val
// (clamping, min/max attrs, select reads) against v2's shim. Vectors are generated
// from the kernel's registry (each input's HTML default + min + max, or select
// options). Exit nonzero on any mismatch.

import { writeFileSync, readFileSync, mkdtempSync } from 'node:fs';
import { execFileSync, execSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { runCalculator, INPUT_ATTRS, SELECT_OPTIONS, CALCULATORS } from '../src/core/calculators/calculators.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

// kernel name -> v1 global calc function
const V1FN = {
  compound: 'calcCompound', rule72: 'calcRule72', savingsRate: 'calcSavingsRate', realNominal: 'calcRealNominal',
  muniTEY: 'calcMuniTEY', assetLocation: 'calcAssetLocation', sequence: 'calcSequence', disability: 'calcDI',
  lifeInsurance: 'calcDIME', hsaVsPpo: 'calcHDHPvsPPO', rentVsBuy: 'calcRentVsBuy', vehicleTCO: 'calcVehicleTCO',
  dependentCareFSA: 'calcDCFSA', expenseRatio: 'calcExpenseRatio', lifestyleCreep: 'calcLifestyleCreep',
  subscription: 'calcSubscription', coastFIRE: 'calcCoastFIRE', dividend: 'calcDividend', sharpe: 'calcSharpe',
  efficientFrontier: 'calcEfficientFrontier', dieWithZero: 'calcDieWithZero',
};

const defaultFor = (id) => (SELECT_OPTIONS[id] && SELECT_OPTIONS[id].length) ? SELECT_OPTIONS[id][0].v : (INPUT_ATTRS[id] || {}).value;
function candidatesFor(id) {
  if (SELECT_OPTIONS[id] && SELECT_OPTIONS[id].length) return SELECT_OPTIONS[id].map((o) => o.v);
  const a = INPUT_ATTRS[id] || {};
  return [...new Set([a.value, a.min, a.max].filter((v) => v != null))];
}
function vectorsFor(ids) {
  const base = {}; for (const id of ids) if (defaultFor(id) != null) base[id] = defaultFor(id);
  const vecs = [{ ...base }];
  for (const id of ids) for (const v of candidatesFor(id)) if (String(v) !== String(base[id])) vecs.push({ ...base, [id]: v });
  return vecs;
}

const plan = CALCULATORS.map((c) => ({ name: c.name, fn: V1FN[c.name], resultId: c.resultId, vectors: vectorsFor(c.inputs) }));

// ---- run v1-live in headless Chrome, capturing raw assigned innerHTML/textContent ----
const driver = `
(function(){
  var PLAN = ${JSON.stringify(plan)};
  var out = {};
  PLAN.forEach(function(c){
    out[c.name] = c.vectors.map(function(vec){
      Object.keys(vec).forEach(function(id){ var el=document.getElementById(id); if(el){ el.value=String(vec[id]); } });
      var res=document.getElementById(c.resultId); var raw='';
      try { Object.defineProperty(res,'innerHTML',{configurable:true,set:function(v){raw=v;},get:function(){return raw;}});
            Object.defineProperty(res,'textContent',{configurable:true,set:function(v){raw=v;},get:function(){return raw;}}); } catch(e){}
      try { window[c.fn](); } catch(e){ raw='__ERR__'+(e&&e.message||e); }
      return raw;
    });
  });
  var b64=btoa(unescape(encodeURIComponent(JSON.stringify(out))));
  var p=document.createElement('pre'); p.id='CALCOUT'; p.textContent=b64; document.documentElement.appendChild(p);
})();`;

let v1src;
try { v1src = execSync('git show main:flowchart.html', { cwd: ROOT, maxBuffer: 64 * 1024 * 1024 }).toString('utf8'); }
catch { v1src = readFileSync(join(ROOT, 'flowchart.html'), 'utf8'); }
const dir = mkdtempSync(join(tmpdir(), 'calc-oracle-'));
const file = join(dir, 'v1.html');
writeFileSync(file, v1src.replace('</body>', `<script>${driver}</script>\n</body>`));

const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox', '--virtual-time-budget=8000', '--dump-dom', `file://${file}`], { maxBuffer: 128 * 1024 * 1024 }).toString('utf8');
const m = dom.match(/<pre id="CALCOUT">([A-Za-z0-9+/=]+)<\/pre>/);
if (!m) { console.error('✗ no oracle output from Chrome'); process.exit(2); }
const v1out = JSON.parse(Buffer.from(m[1], 'base64').toString('utf8'));

// ---- compare ----
let checked = 0;
const failures = [];
for (const c of plan) {
  c.vectors.forEach((vec, i) => {
    checked++;
    const v1 = v1out[c.name][i];
    const v2 = runCalculator(c.name, vec).html;
    if (v1 !== v2) failures.push({ name: c.name, vec, v1: (v1 || '').slice(0, 160), v2: (v2 || '').slice(0, 160) });
  });
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

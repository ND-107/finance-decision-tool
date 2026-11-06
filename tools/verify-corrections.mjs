#!/usr/bin/env node
// verify-corrections.mjs — gate 13: the corrections layer over verbatim v1 content.
//  (1) every entry has the required fields, a unique id and an ISO 'verified' date
//  (2) its target file exists and its 'find' occurs there exactly 'count' times (the
//      verbatim source has not drifted, and v1 has not changed under the correction)
//  (3) its {{fig}}/{{figval}} tokens resolve in figures.json
//  (4) the claim it names exists in the audit export and is not PASS-as-written
//      (a corrected figure must have a CORRECTED / PENDING audit row, not a stale PASS)
//  (5) applying all corrections removes every 'find' from its target (no survivor)
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { loadCorrections, targetPath, resolveReplace, applyCorrections, occurrences, REQUIRED } from './corrections.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const figures = JSON.parse(readFileSync(join(ROOT, 'src', 'data', 'figures.json'), 'utf8'));
const claims = new Map(JSON.parse(readFileSync(join(ROOT, 'src', 'data', 'claims.json'), 'utf8')).map((c) => [c.id, c]));
const corrections = loadCorrections();
const errs = [];
const seen = new Set();

for (const c of corrections) {
  const tag = c.id || '(no id)';
  for (const f of REQUIRED) if (!(f in c) || c[f] === '') errs.push(`${tag}: missing field "${f}"`);
  if (seen.has(c.id)) errs.push(`${tag}: duplicate id`);
  seen.add(c.id);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(c.verified || '')) errs.push(`${tag}: verified must be YYYY-MM-DD`);
  if (!Number.isInteger(c.count) || c.count < 1) errs.push(`${tag}: count must be a positive integer`);
  let path;
  try { path = targetPath(c.target); } catch (e) { errs.push(`${tag}: ${e.message}`); continue; }
  if (!existsSync(path)) { errs.push(`${tag}: target file missing (${path})`); continue; }
  const n = occurrences(readFileSync(path, 'utf8'), c.find);
  if (n !== c.count) errs.push(`${tag}: 'find' occurs ${n}× in ${c.target}, expected ${c.count} — the verbatim source drifted or v1 changed; re-check the correction`);
  try { if (resolveReplace(c.replace, figures).includes(c.find)) errs.push(`${tag}: replacement still contains its own 'find'`); }
  catch (e) { errs.push(`${tag}: ${e.message}`); }
  const cl = claims.get(c.claim);
  if (!cl) errs.push(`${tag}: claim ${c.claim} is not in the audit export`);
  else if (cl.status === 'PASS') errs.push(`${tag}: claim ${c.claim} is still PASS — update its audit row for the corrected figure`);
}

if (!errs.length) {
  for (const target of new Set(corrections.map((c) => c.target))) {
    const out = applyCorrections(target, readFileSync(targetPath(target), 'utf8'), figures, corrections);
    for (const c of corrections.filter((x) => x.target === target)) if (out.includes(c.find)) errs.push(`${c.id}: 'find' survives in ${target} after applying`);
  }
}

if (errs.length) { for (const e of errs) console.error('✗', e); console.error(`\nverify-corrections: ${errs.length} error(s)`); process.exit(1); }
console.log(`verify-corrections: ${corrections.length} corrections over ${new Set(corrections.map((c) => c.target)).size} verbatim targets — OK`);

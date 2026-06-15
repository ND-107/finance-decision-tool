#!/usr/bin/env node
// validate-figures.mjs — build-time gate for src/data/figures.json
//
// Enforces the vintage-stamping contract that makes the figures layer worth
// having (see src/data/README.md). Run standalone:
//   node tools/validate-figures.mjs [--today=YYYY-MM-DD]
// Exits non-zero on any violation. `--today` overrides the expiry clock for
// reproducible CI; defaults to the real current date.
//
// In v2 this also takes a content tree and cross-checks that every <fig key>
// resolves and every entry is referenced; that arg is optional until content
// extraction lands (Phase 1.4 / Phase 2).

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const FIGURES = join(ROOT, 'src', 'data', 'figures.json');
const CONTENT = join(ROOT, 'src', 'content');

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = a.match(/^--([^=]+)=(.*)$/);
    return m ? [m[1], m[2]] : [a.replace(/^--/, ''), true];
  })
);
const today = typeof args.today === 'string' ? args.today : new Date().toISOString().slice(0, 10);

const REQUIRED = ['value', 'display', 'taxYear', 'source', 'verified', 'expires'];
const errors = [];
const warnings = [];

function isISODate(s) {
  return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));
}

if (!existsSync(FIGURES)) {
  console.error(`✗ figures.json not found at ${FIGURES}`);
  process.exit(1);
}

let figures;
try {
  figures = JSON.parse(readFileSync(FIGURES, 'utf8'));
} catch (e) {
  console.error(`✗ figures.json is not valid JSON: ${e.message}`);
  process.exit(1);
}

const keys = Object.keys(figures);
for (const key of keys) {
  const f = figures[key];
  if (f == null || typeof f !== 'object' || Array.isArray(f)) {
    errors.push(`${key}: entry is not an object`);
    continue;
  }
  for (const field of REQUIRED) {
    if (!(field in f)) errors.push(`${key}: missing required field "${field}"`);
  }
  if ('value' in f && typeof f.value !== 'number') errors.push(`${key}: value must be a number (got ${typeof f.value})`);
  if ('display' in f && typeof f.display !== 'string') errors.push(`${key}: display must be a string`);
  if ('taxYear' in f && (!Number.isInteger(f.taxYear) || f.taxYear < 2000 || f.taxYear > 2100)) errors.push(`${key}: taxYear out of range`);
  if ('source' in f && (typeof f.source !== 'string' || f.source.trim() === '')) errors.push(`${key}: source must be a non-empty string`);
  if ('verified' in f && !isISODate(f.verified)) errors.push(`${key}: verified must be an ISO date (YYYY-MM-DD)`);
  if ('expires' in f && !isISODate(f.expires)) errors.push(`${key}: expires must be an ISO date (YYYY-MM-DD)`);

  // Staleness: an entry whose expiry is in the past (relative to `today`) is a hard error.
  if (isISODate(f.expires) && f.expires < today) {
    errors.push(`${key}: EXPIRED (expires ${f.expires} < today ${today}) — re-verify against "${f.source}" and re-stamp`);
  }
  // verified should not predate the figure's tax year by more than a year (sanity).
  if (isISODate(f.verified) && Number.isInteger(f.taxYear)) {
    const vy = Number(f.verified.slice(0, 4));
    if (vy < f.taxYear - 1) warnings.push(`${key}: verified (${f.verified}) is well before taxYear ${f.taxYear} — confirm it was checked against the ${f.taxYear} source`);
  }
}

// Optional content cross-check (v2): every <fig key> resolves; flag orphan entries.
function walkFigRefs(dir, acc) {
  if (!existsSync(dir)) return acc;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walkFigRefs(p, acc);
    else if (/\.(md|mdx|html|ya?ml)$/.test(name)) {
      const txt = readFileSync(p, 'utf8');
      for (const m of txt.matchAll(/<fig\s+key=["']([^"']+)["']/g)) acc.push({ key: m[1], file: p });
    }
  }
  return acc;
}
const refs = walkFigRefs(CONTENT, []);
const referenced = new Set(refs.map((r) => r.key));
for (const r of refs) {
  if (!(r.key in figures)) errors.push(`${r.file}: <fig key="${r.key}"> does not resolve to a figures.json entry`);
}
if (refs.length > 0) {
  for (const key of keys) {
    if (!referenced.has(key)) warnings.push(`${key}: defined but not referenced by any <fig> (orphan — fine pre-extraction)`);
  }
}

// Report
console.log(`figures.json: ${keys.length} entries · today=${today} · ${refs.length} <fig> refs in content`);
for (const w of warnings) console.log(`  ⚠ ${w}`);
if (errors.length) {
  for (const e of errors) console.error(`  ✗ ${e}`);
  console.error(`\nFAILED: ${errors.length} error(s).`);
  process.exit(1);
}
console.log(`✓ all ${keys.length} figure entries valid; no expired stamps.`);

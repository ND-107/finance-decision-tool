#!/usr/bin/env node
// extract.mjs — Phase 1.4 lossless extraction (round-trip stage 1: byte-exact).
//
// Splits the live single-file artifact (flowchart.html on `main`, or a copy)
// into an ordered set of addressable segments at semantic boundaries, plus a
// manifest. The partition is a TRUE partition: concatenating the segments in
// manifest order reproduces the source byte-for-byte. That is the guarantee the
// round-trip gate (tools/gate.mjs) checks, and it MUST hold before any semantic
// restructuring (Phase 2) begins — per V2_REBUILD_PLAN.md §1.4.
//
// This stage extracts VERBATIM TEXT (no parsing/reformatting), so the segments
// are the content units (node arrays, the diagnostic schema, HIST_RETURNS, the
// logic) living in separate files while the rebuild stays identical. Stage 2
// (Phase 2) transforms a segment's text into structured data and relaxes the
// gate from byte-identical to DOM/behavior-equivalent.
//
// Usage: node tools/extract.mjs [--src=path] [--out=dir]
//   --src  source artifact (default: ../flowchart.html relative to repo root, read from `main` via git if absent here)
//   --out  segment output dir (default: build/segments)

import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = Object.fromEntries(process.argv.slice(2).map((a) => {
  const m = a.match(/^--([^=]+)=(.*)$/);
  return m ? [m[1], m[2]] : [a.replace(/^--/, ''), true];
}));

// Ordered partition anchors. Each marks the START of a new segment; a segment
// spans [anchor_i, anchor_{i+1}). The first segment is [0, anchor_0). Anchors
// MUST be unique and appear in this exact file order, or extraction aborts.
const ANCHORS = [
  { name: 'head', marker: null },                         // file start .. <style>
  { name: 'styles', marker: '<style>' },                  // CSS block
  { name: 'body-static', marker: '</style>' },            // </style> + <head> close + all static view HTML
  { name: 'script-prelude', marker: '<script>' },         // <script> open + leading comments
  { name: 'data-phases', marker: 'const PHASES = {' },    // PHASES taxonomy
  { name: 'data-w2-nodes', marker: 'const W2_NODES = [' },
  { name: 'data-contractor-nodes', marker: 'const CONTRACTOR_NODES = [' },
  { name: 'data-business-nodes', marker: 'const BUSINESS_NODES = [' },
  { name: 'data-flowcharts', marker: 'const FLOWCHARTS = {' }, // FLOWCHARTS + NODE_LOOKUP
  { name: 'data-questions', marker: 'const QUESTIONS = [' },   // diagnostic schema + state/helpers up to HIST_RETURNS
  { name: 'data-hist-returns', marker: 'const HIST_RETURNS = [' }, // returns dataset + helpers up to computePlan
  { name: 'logic', marker: 'function computePlan() {' },  // engine + rendering + calculators + init .. EOF
];

function readSource() {
  if (typeof args.src === 'string') return readFileSync(args.src, 'utf8');
  const local = join(ROOT, 'flowchart.html');
  if (existsSync(local)) {
    // On the v2 branch flowchart.html may be the frozen copy; prefer main's live artifact
    // so extraction always targets the source of truth. Fall back to local.
    try {
      return execSync('git show main:v1/flowchart.html', { cwd: ROOT, maxBuffer: 64 * 1024 * 1024 }).toString('utf8');
    } catch {
      return readFileSync(local, 'utf8');
    }
  }
  throw new Error('no source artifact found (pass --src=path)');
}

const sha = (s) => createHash('sha256').update(s, 'utf8').digest('hex');

const src = readSource();
const outDir = typeof args.out === 'string' ? args.out : join(ROOT, 'build', 'segments');

// Resolve each anchor to a byte offset; verify strictly increasing + unique.
const offsets = [];
for (let i = 0; i < ANCHORS.length; i++) {
  const a = ANCHORS[i];
  if (a.marker === null) { offsets.push(0); continue; }
  const idx = src.indexOf(a.marker);
  if (idx === -1) throw new Error(`anchor not found: "${a.marker}" (${a.name})`);
  if (src.indexOf(a.marker, idx + 1) !== -1) throw new Error(`anchor not unique: "${a.marker}" (${a.name})`);
  if (idx <= offsets[offsets.length - 1]) throw new Error(`anchor out of order: "${a.marker}" (${a.name}) at ${idx} <= previous ${offsets[offsets.length - 1]}`);
  offsets.push(idx);
}

// Slice into segments [offset_i, offset_{i+1}).
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });
const segments = [];
for (let i = 0; i < ANCHORS.length; i++) {
  const start = offsets[i];
  const end = i + 1 < offsets.length ? offsets[i + 1] : src.length;
  const text = src.slice(start, end);
  const file = `${String(i).padStart(2, '0')}__${ANCHORS[i].name}.txt`;
  writeFileSync(join(outDir, file), text);
  segments.push({ index: i, name: ANCHORS[i].name, file, bytes: Buffer.byteLength(text, 'utf8'), sha256: sha(text) });
}

const manifest = {
  generatedFrom: 'main:v1/flowchart.html (live artifact)',
  sourceBytes: Buffer.byteLength(src, 'utf8'),
  sourceSha256: sha(src),
  segmentCount: segments.length,
  segments,
};
mkdirSync(join(ROOT, 'build'), { recursive: true });
writeFileSync(join(ROOT, 'build', 'manifest.json'), JSON.stringify(manifest, null, 2));

// Self-check: concatenation must equal source (partition invariant).
const rejoined = segments.map((s) => readFileSync(join(outDir, s.file), 'utf8')).join('');
const ok = sha(rejoined) === manifest.sourceSha256;
console.log(`extracted ${segments.length} segments (${manifest.sourceBytes} bytes) → ${outDir}`);
for (const s of segments) console.log(`  ${s.file.padEnd(34)} ${String(s.bytes).padStart(7)} B  ${s.sha256.slice(0, 12)}`);
console.log(ok ? '✓ partition invariant holds (concat == source)' : '✗ PARTITION BROKEN (concat != source)');
process.exit(ok ? 0 : 1);

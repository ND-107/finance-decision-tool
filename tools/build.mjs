#!/usr/bin/env node
// build.mjs — Phase 1.4 round-trip build. Reassembles dist/flowchart.html from
// build/manifest.json + build/segments/. At this stage (verbatim segments) the
// output is byte-identical to the source; the gate (tools/gate.mjs) enforces it.
//
// As Phase 2 lands, individual segments get replaced by generators (e.g.
// data-questions ← render(questions.yaml)); build.mjs grows per-segment build
// steps but the contract stays: emit dist/flowchart.html, gate it.
//
// Usage: node tools/build.mjs [--out=path]

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { renderSegment } from './extract-nodes.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = Object.fromEntries(process.argv.slice(2).map((a) => {
  const m = a.match(/^--([^=]+)=(.*)$/);
  return m ? [m[1], m[2]] : [a.replace(/^--/, ''), true];
}));

const manifestPath = join(ROOT, 'build', 'manifest.json');
if (!existsSync(manifestPath)) {
  console.error('✗ build/manifest.json missing — run `node tools/extract.mjs` first');
  process.exit(1);
}
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const segDir = join(ROOT, 'build', 'segments');
const sha = (s) => createHash('sha256').update(s, 'utf8').digest('hex');

// Per-segment build steps. Default = passthrough (verbatim text). Phase 2 adds
// generators keyed by segment name here; each MUST reproduce its segment's text
// byte-for-byte while the round-trip gate is byte-exact, then relax later.
const GENERATORS = {
  // 'data-questions': () => renderQuestions(loadYaml('src/content/questions.yaml')),
  // Node arrays: regenerate each segment from src/content/nodes/<income>/ (per-node
  // JSON + _array.json scaffold), byte-identical to the live artifact. The build's
  // sha guard below + tools/gate.mjs both enforce byte-exactness.
  'data-w2-nodes': () => renderSegment('w2'),
  'data-contractor-nodes': () => renderSegment('contractor'),
  'data-business-nodes': () => renderSegment('business'),
};

let out = '';
for (const seg of manifest.segments) {
  const gen = GENERATORS[seg.name];
  let text;
  if (gen) {
    text = gen(seg);
    if (sha(text) !== seg.sha256) {
      console.error(`✗ generator for "${seg.name}" diverged from recorded segment (sha mismatch) — round-trip would break`);
      process.exit(1);
    }
  } else {
    text = readFileSync(join(segDir, seg.file), 'utf8');
    if (sha(text) !== seg.sha256) {
      console.error(`✗ segment "${seg.file}" on disk differs from manifest sha — re-run extract`);
      process.exit(1);
    }
  }
  out += text;
}

const outPath = typeof args.out === 'string' ? args.out : join(ROOT, 'dist', 'flowchart.html');
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, out);
console.log(`built ${outPath} (${Buffer.byteLength(out, 'utf8')} bytes, ${manifest.segments.length} segments)`);

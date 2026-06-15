#!/usr/bin/env node
// gate.mjs — Phase 1.4 round-trip gate. The acceptance test that MUST pass
// before any semantic restructuring (V2_REBUILD_PLAN.md §1.4): the rebuilt
// dist/flowchart.html must equal the source artifact.
//
// Stage 1 (verbatim segments): equality is byte-exact (sha256).
// Stage 2+ (generators reformat): switch --mode=dom to compare normalized DOM
//   structure + extracted inline-JS token stream instead of raw bytes. (DOM mode
//   is stubbed here until Phase 2 needs it; byte mode is the live gate now.)
//
// Usage: node tools/gate.mjs [--mode=byte|dom] [--dist=path]
// Exits non-zero on any divergence.

import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = Object.fromEntries(process.argv.slice(2).map((a) => {
  const m = a.match(/^--([^=]+)=(.*)$/);
  return m ? [m[1], m[2]] : [a.replace(/^--/, ''), true];
}));
const mode = typeof args.mode === 'string' ? args.mode : 'byte';
const sha = (s) => createHash('sha256').update(s, 'utf8').digest('hex');

const distPath = typeof args.dist === 'string' ? args.dist : join(ROOT, 'dist', 'flowchart.html');
if (!existsSync(distPath)) {
  console.error(`✗ ${distPath} missing — run \`node tools/build.mjs\` first`);
  process.exit(1);
}
const dist = readFileSync(distPath, 'utf8');

// Source of truth: main's live artifact (the v2 working copy may be frozen).
let src;
try {
  src = execSync('git show main:flowchart.html', { cwd: ROOT, maxBuffer: 64 * 1024 * 1024 }).toString('utf8');
} catch {
  src = readFileSync(join(ROOT, 'flowchart.html'), 'utf8');
}

if (mode === 'byte') {
  const a = sha(src), b = sha(dist);
  const sameLen = Buffer.byteLength(src, 'utf8') === Buffer.byteLength(dist, 'utf8');
  if (a === b) {
    console.log(`✓ round-trip gate PASS (byte-exact): ${Buffer.byteLength(dist, 'utf8')} bytes, sha ${b.slice(0, 16)}`);
    process.exit(0);
  }
  // Locate first divergence for a useful failure message.
  let i = 0;
  const min = Math.min(src.length, dist.length);
  while (i < min && src[i] === dist[i]) i++;
  console.error(`✗ round-trip gate FAIL (byte mode)`);
  console.error(`  source bytes ${Buffer.byteLength(src, 'utf8')} (sha ${a.slice(0, 16)})`);
  console.error(`  dist   bytes ${Buffer.byteLength(dist, 'utf8')} (sha ${b.slice(0, 16)}); lengths ${sameLen ? 'match' : 'DIFFER'}`);
  console.error(`  first divergence at char ${i}:`);
  console.error(`    src …${JSON.stringify(src.slice(i, i + 60))}`);
  console.error(`    dst …${JSON.stringify(dist.slice(i, i + 60))}`);
  process.exit(1);
}

if (mode === 'dom') {
  console.error('✗ dom mode not yet implemented (lands with Phase 2 generators; byte mode is the live gate)');
  process.exit(2);
}

console.error(`✗ unknown mode "${mode}"`);
process.exit(2);

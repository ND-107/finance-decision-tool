#!/usr/bin/env node
// plain-layer.mjs — L3 proposition-map tooling for the plain-English layer (V2 plan §4.5).
//   node tools/plain-layer.mjs --list    print every block id + canonical text (authoring aid)
//   node tools/plain-layer.mjs --stamp   write the current canonical hash into each map entry.
//                                        Only run AFTER re-verifying the plain variant against
//                                        the changed canonical text — stamping is the attestation.
//   node tools/plain-layer.mjs --emit <out.json>  write the L3 artifact (used by build-v2.mjs)
import { writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, blocks, loadPlain, canonHash } from './phase4-content.mjs';

const arg = process.argv[2];
if (arg === '--list') {
  for (const b of blocks()) console.log(`\n### ${b.id}  [${canonHash(b.body)}]\n${b.body}`);
} else if (arg === '--stamp') {
  const p = loadPlain();
  for (const b of blocks()) if (p[b.id]) p[b.id].hash = canonHash(b.body);
  writeFileSync(join(ROOT, 'src', 'content', 'phase4', 'plain.json'), JSON.stringify(p, null, 1) + '\n');
  console.log('stamped', Object.keys(p).length, 'entries');
} else if (arg === '--emit') {
  const p = loadPlain();
  const art = { generated: new Date().toISOString().slice(0, 10), method: 'V2_REBUILD_PLAN §4.5 Layer 1/2/3', blocks: blocks().map((b) => ({ id: b.id, canonicalHash: canonHash(b.body), mapHash: p[b.id] ? p[b.id].hash : null, propositions: p[b.id] ? p[b.id].props.map(([id, text, status, anchor]) => ({ id, text, status, anchor })) : null })) };
  writeFileSync(process.argv[3], JSON.stringify(art, null, 1) + '\n');
  console.log('emitted', process.argv[3]);
} else {
  console.error('usage: plain-layer.mjs --list | --stamp | --emit <out.json>'); process.exit(2);
}

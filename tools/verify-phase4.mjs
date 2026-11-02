#!/usr/bin/env node
// verify-phase4.mjs — gate for the Phase 4 content modules + plain-English layer.
//  (1) every deep link resolves to a real view / section number / chart node / P4 anchor
//  (2) every {{fig:key}} exists in figures.json; every cited CL id exists in the audit export
//  (3) every P4 claim in the audit anchors to a real P4 block (no orphan audit rows)
//  (4) plain-English layer (V2 plan §4.5, L2 + L3):
//      - every block has a plain variant + proposition map, stamped against the CURRENT
//        canonical text (hash) — editing canonical prose without re-verifying fails here
//      - tokens ({{fig}}/{{verify}}) identical; numbers verbatim both ways (zero new numbers,
//        none dropped); every kept/merged proposition's anchor occurs in the plain text;
//        meta/dropped propositions carry a reason
//  (5) every audit anchor sec:<view>:<n> / node:<inc>:<marker> names a real target (warn-only
//      for pre-existing v1 rows, which this gate reports but does not own)
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, loadPhase4, loadPlain, blocks, canonHash, tokens, numbersIn, stripTags, linkTargets } from './phase4-content.mjs';

const figures = JSON.parse(readFileSync(join(ROOT, 'src', 'data', 'figures.json'), 'utf8'));
const claims = JSON.parse(readFileSync(join(ROOT, 'src', 'data', 'claims.json'), 'utf8'));
const claimIds = new Set(claims.map((c) => c.id));
const targets = linkTargets();
const p4 = loadPhase4();
const plain = loadPlain();
const errs = [];
const warn = [];

const allBlocks = blocks(p4);
const p4Anchors = new Set(['p4:life-events', 'p4:protection', 'p4:annual-review']);
for (const e of p4.lifeEvents.events) p4Anchors.add(`p4:life-events:${e.id}`);
for (const s of p4.protection.sections) p4Anchors.add(`p4:protection:${s.id}`);
for (const i of p4.annualReview.items) p4Anchors.add(`p4:annual-review:${i.id}`);

let links = 0, figRefs = 0, cites = 0;
for (const b of allBlocks) {
  for (const l of b.links) { links++; if (!targets.has(l.to)) errs.push(`${b.id}: dead link → ${l.to}`); }
  for (const t of tokens(b.body)) { const m = t.match(/^\{\{fig:(.+)\}\}$/); if (m) { figRefs++; if (!figures[m[1]]) errs.push(`${b.id}: unknown figure ${m[1]}`); } }
  for (const c of b.claims) { cites++; if (!claimIds.has(c)) errs.push(`${b.id}: cites ${c}, not in the audit`); }
  if (/\$\d/.test(stripTags(b.body)) && /20\d\d limit|for 2026/.test(b.body) && !/\{\{fig:/.test(b.body)) warn.push(`${b.id}: dated dollar figure without a {{fig}} token`);
}

// (3) P4 audit rows anchor to real blocks
for (const c of claims) for (const a of c.anchors) {
  if (a.startsWith('p4:') && !p4Anchors.has(a)) errs.push(`${c.id}: audit anchor ${a} names no Phase 4 block`);
  if (a.startsWith('node:')) { const [, inc, mk] = a.split(':'); if (!targets.has(`full-chart/${inc}/${mk}`)) warn.push(`${c.id}: anchor ${a} has no chart node`); }
  if (a.startsWith('sec:')) { const [, view, n] = a.split(':'); if (!targets.has(`${view}/${n}`)) warn.push(`${c.id}: anchor ${a} has no section`); }
}
// every new P4 claim is actually cited by some block
const cited = new Set(allBlocks.flatMap((b) => b.claims));
for (const c of claims) if (c.anchors.some((a) => a.startsWith('p4:')) && !cited.has(c.id)) errs.push(`${c.id}: Phase 4 audit row not cited by any block`);

// (4) plain layer
let props = 0, metaN = 0, droppedN = 0;
for (const b of allBlocks) {
  const p = plain[b.id];
  if (!p) { errs.push(`${b.id}: no plain-English variant`); continue; }
  if (p.hash !== canonHash(b.body)) errs.push(`${b.id}: canonical text changed since its plain variant was verified (map ${p.hash} ≠ canon ${canonHash(b.body)}) — re-verify, then tools/plain-layer.mjs --stamp`);
  const tc = tokens(b.body).sort().join('|'), tp = tokens(p.plain).sort().join('|');
  if (tc !== tp) errs.push(`${b.id}: fig/verify tokens differ between canonical and plain`);
  const nc = new Set(numbersIn(b.body)), np = new Set(numbersIn(p.plain));
  for (const n of nc) if (!np.has(n)) errs.push(`${b.id}: number ${n} dropped in plain variant (L2: numbers verbatim)`);
  for (const n of np) if (!nc.has(n)) errs.push(`${b.id}: number ${n} introduced by plain variant (L2: zero new claims)`);
  if (!p.props || !p.props.length) errs.push(`${b.id}: empty proposition map`);
  const hay = stripTags(p.plain).toLowerCase();
  for (const [id, text, status, anchor] of p.props || []) {
    props++;
    if (status === 'kept' || status === 'merged') { if (!anchor || !hay.includes(anchor.toLowerCase())) errs.push(`${b.id} ${id}: anchor "${anchor}" not found in plain text (${text})`); }
    else if (status === 'meta' || status === 'dropped') { if (!anchor || anchor.length < 8) errs.push(`${b.id} ${id}: ${status} proposition needs a reason`); if (status === 'meta') metaN++; else droppedN++; }
    else errs.push(`${b.id} ${id}: unknown status ${status}`);
  }
}
for (const k of Object.keys(plain)) if (!allBlocks.some((b) => b.id === k)) errs.push(`plain.json: orphan entry ${k}`);

if (process.argv.includes('--verbose') || errs.length) for (const w of warn) console.log('  warn:', w);
if (errs.length) { for (const e of errs) console.error('✗', e); console.error(`\nverify-phase4: ${errs.length} error(s)`); process.exit(1); }
console.log(`verify-phase4: ${allBlocks.length} blocks · ${links} links · ${figRefs} figure refs · ${cites} citations · ${props} propositions (${metaN} meta, ${droppedN} dropped) · ${warn.length} warnings — OK`);

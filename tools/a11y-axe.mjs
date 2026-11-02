#!/usr/bin/env node
// a11y-axe.mjs — headless axe-core scan of every v2 view (docs/A11Y-CHECKLIST.md §1).
//
// Not part of verify-v2.sh: it needs two things the zero-dependency repo does not vendor —
// a local axe-core build and puppeteer-core — so it is run on demand:
//
//   AXE_JS=/path/to/axe-core/axe.min.js \
//   PUPPETEER_CORE=/path/to/node_modules/puppeteer-core \
//   node tools/a11y-axe.mjs [--tags=wcag2a,wcag2aa,wcag21a,wcag21aa] [--json]
//
// (`npm pack axe-core@4.10.2` + any puppeteer-core install will do.) It builds nothing:
// run `node tools/build-v2.mjs` first. Scans each nav view, plus the Phase 4 views with
// sources + plain-English on, plus the diagnostic and plan for a seeded profile. Exits 1
// on any violation of impact serious/critical; prints all violations grouped by rule.
import { createRequire } from 'node:module';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const AXE = process.env.AXE_JS;
const PC = process.env.PUPPETEER_CORE;
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
if (!AXE || !existsSync(AXE) || !PC || !existsSync(PC)) {
  console.error('a11y-axe: set AXE_JS (axe.min.js) and PUPPETEER_CORE (puppeteer-core dir) — see header.');
  process.exit(2);
}
const puppeteer = createRequire(join(PC, 'package.json'))(PC);
const tagsArg = (process.argv.find((a) => a.startsWith('--tags=')) || '').slice(7);
const TAGS = tagsArg ? tagsArg.split(',') : ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];
const URL = pathToFileURL(join(ROOT, 'dist', 'v2.html')).href;
const axeSrc = readFileSync(AXE, 'utf8');

const PROFILE = { incomeTypes: ['w2'], filingStatus: 'single', ageBracket: '30-39', taxBracket: 'mid', emergencyFund: '1-3mo', highInterestDebt: 'no', healthInsurance: 'yes', employerMatch: 'yes', matchCaptured: 'partial' };
const SCANS = [
  { name: 'welcome', hash: '', seed: { answers: {}, started: false } },
  { name: 'diagnostic+plan', hash: '#plan', seed: { answers: PROFILE, started: true, sectionIdx: 0 } },
  ...['personal-chart', 'full-chart', 'math', 'spending-essentials', 'spending-lifestyle', 'portfolio-bogleheads', 'portfolio-theory', 'zeitgeist-investing', 'zeitgeist-lifestyle', 'advanced-strategies'].map((v) => ({ name: v, hash: `#${v}`, seed: { answers: PROFILE, started: true } })),
  { name: 'life-events', hash: '#life-events/job-loss', seed: { answers: {}, started: true } },
  { name: 'life-events +sources +plain', hash: '#life-events/divorce', seed: { answers: {}, started: true, showSources: true, plain: { 'le:divorce:qdro': true } } },
  { name: 'protection +sources', hash: '#protection', seed: { answers: {}, started: true, showSources: true } },
  { name: 'annual-review', hash: '#annual-review', seed: { answers: {}, started: true } },
  { name: 'math +sources', hash: '#math/5', seed: { answers: {}, started: true, showSources: true } },
  { name: 'full-chart node open +sources', hash: '#full-chart/w2/2.3', seed: { answers: {}, started: true, showSources: true } },
];

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 900 });
const all = [];
let blocking = 0;
for (const s of SCANS) {
  await page.goto(URL, { waitUntil: 'load' });
  await page.evaluate((seed) => { localStorage.setItem('fdt2:state', JSON.stringify({ sectionIdx: 0, completions: {}, open: {}, ...seed })); }, s.seed);
  await page.goto(URL + s.hash, { waitUntil: 'load' });
  await page.reload({ waitUntil: 'load' });
  await page.evaluate(axeSrc);
  const res = await page.evaluate(async (tags) => {
    const r = await window.axe.run(document, { runOnly: { type: 'tag', values: tags } });
    return r.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.length, sample: v.nodes.slice(0, 3).map((n) => n.target.join(' ') + ' :: ' + (n.failureSummary || '').split('\n').slice(1, 2).join('')) }));
  }, TAGS);
  for (const v of res) { all.push({ scan: s.name, ...v }); if (v.impact === 'serious' || v.impact === 'critical') blocking++; }
  console.log(`${s.name.padEnd(32)} ${res.length ? res.map((v) => `${v.id}(${v.impact},${v.nodes})`).join(' ') : 'no violations'}`);
}
await browser.close();
if (process.argv.includes('--json')) console.log(JSON.stringify(all, null, 1));
else for (const v of all) console.log(`\n[${v.scan}] ${v.id} — ${v.impact} — ${v.help}\n   ${v.sample.join('\n   ')}`);
console.log(`\naxe: ${all.length} violation group(s) across ${SCANS.length} scans; ${blocking} serious/critical`);
process.exit(blocking ? 1 : 0);

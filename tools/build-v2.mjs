#!/usr/bin/env node
// build-v2.mjs — bundle the v2 core + content + UI into a single self-contained
// HTML file (dist/v2.html), preserving the project's no-dependency, runnable-by-
// double-click invariant. This is the first BUILD of the v2 artifact (distinct
// from tools/build.mjs, which reproduces the v1 single file byte-exact).
//
// Strategy: the core modules form a clean DAG with no top-level name collisions,
// and their only Node-isms are JSON loads. So we strip imports/exports, inline
// the JSON content as the globals the modules expect, concatenate in dependency
// order, append the UI app, and wrap it all in one <script>. No transpiler.

import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (...p) => readFileSync(join(ROOT, ...p), 'utf8');
const json = (...p) => JSON.parse(read(...p));

// ---- strip ESM imports/exports + the Node-only data-load lines ----
function strip(src) {
  return src.split('\n')
    .filter((l) => !/^\s*import\s/.test(l))                       // drop all import lines
    .filter((l) => !/^const ROOT = join\(dirname/.test(l))        // priority's ROOT (node path)
    .filter((l) => !/=\s*JSON\.parse\(readFileSync/.test(l))      // priority's IMPACT readFileSync load
    .filter((l) => !/^export\s*\{/.test(l) && !/^export default/.test(l)) // bare re-exports
    .map((l) => l.replace(/^(\s*)export\s+(async\s+function|function|const|let|class)/, '$1$2')) // strip `export ` keyword
    .join('\n');
}

// ---- extract just planLogic from plan-fingerprint (sensitivity needs it; it's pure) ----
function extractPlanLogic() {
  const src = read('tools', 'lib', 'plan-fingerprint.mjs');
  const start = src.indexOf('export function planLogic');
  // balanced-brace scan to the end of the function
  let i = src.indexOf('{', start), depth = 0, end = -1;
  for (; i < src.length; i++) { if (src[i] === '{') depth++; else if (src[i] === '}') { depth--; if (depth === 0) { end = i + 1; break; } } }
  return src.slice(start, end).replace(/^export\s+/, '');
}

// ---- build the node-content lookup (nodeKey "income:marker" -> node record) ----
function buildNodes() {
  const nodes = {};
  for (const inc of ['w2', 'contractor', 'business']) {
    const dir = join(ROOT, 'src', 'content', 'nodes', inc);
    for (const f of readdirSync(dir)) {
      if (!f.endsWith('.json') || f === '_array.json') continue;
      const rec = json('src', 'content', 'nodes', inc, f);
      nodes[`${inc}:${rec.marker}`] = { title: rec.title, summary: rec.summary, detailsHtml: rec.detailsHtml, badges: rec.badges || [] };
    }
  }
  return nodes;
}

// ---- assemble ----
const inject = `// ===== inlined content/data =====
const QUESTIONS = ${JSON.stringify(json('src', 'content', 'questions.json'))};
const questions = QUESTIONS;
const DEADLINES = ${JSON.stringify(json('src', 'data', 'deadlines.json'))};
const IMPACT = ${JSON.stringify(json('src', 'data', 'impact.json'))};
const FIGURES = ${JSON.stringify(json('src', 'data', 'figures.json'))};
const NODES = ${JSON.stringify(buildNodes())};
const TODAY = ${JSON.stringify(new Date().toISOString().slice(0, 10))};
`;

const coreOrder = ['predicates', 'derive', 'plan-rules', 'plan-prose', 'deadlines', 'plan-engine', 'priority'];
const coreParts = coreOrder.map((m) => `// ===== src/core/${m}.mjs =====\n${strip(read('src', 'core', `${m}.mjs`))}`);
const planLogic = `// ===== planLogic (from tools/lib/plan-fingerprint.mjs) =====\n${strip(extractPlanLogic())}`;
const afterPlan = ['completion', 'sensitivity'].map((m) => `// ===== src/core/${m}.mjs =====\n${strip(read('src', 'core', `${m}.mjs`))}`);
const uiApp = `// ===== src/ui/app.mjs =====\n${strip(read('src', 'ui', 'app.mjs'))}`;

const bundle = [inject, ...coreParts, planLogic, ...afterPlan, uiApp].join('\n\n');
const css = read('src', 'ui', 'styles.css');

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Personal Finance Decision Tool — v2</title>
<meta name="description" content="Diagnostic-driven personal-finance plan, prioritized by impact and ease.">
<style>
${css}
</style>
</head>
<body>
<a href="#app" class="skip-link">Skip to content</a>
<main id="app"></main>
<div id="sr-live" class="sr-only" role="status" aria-live="polite" aria-atomic="true"></div>
<script>
${bundle}
</script>
</body>
</html>
`;

mkdirSync(join(ROOT, 'dist'), { recursive: true });
const out = join(ROOT, 'dist', 'v2.html');
writeFileSync(out, html);
console.log(`built ${out} (${Buffer.byteLength(html, 'utf8').toLocaleString()} bytes)`);
console.log(`  core modules: ${coreOrder.length + afterPlan.length} · nodes: ${Object.keys(buildNodes()).length} · questions: ${json('src', 'content', 'questions.json').sections.reduce((n, s) => n + s.questions.length, 0)}`);

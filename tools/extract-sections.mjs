#!/usr/bin/env node
// extract-sections.mjs — extract v1's reference-view content (prose + calculator
// markup) + the CSS rules it needs, for v2's reference views. (Phase 7.)
//
// The 8 reference views (math, spending×2, portfolio×2, zeitgeist×2, advanced) are
// mostly reference prose with embedded calculator markup (inputs + <id>-result divs).
// We lift each #view-<name> element's INNER HTML verbatim → src/content/sections/
// <name>.html, and the CSS rules whose selectors reference the content classes →
// src/content/sections/sections.css. v2 inlines these, renders the active section's
// HTML, and auto-wires its calculators by result-id (→ runCalculator). Faithful
// reproduction; the calc compute is the already-verified kernel.

import { writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
let src;
try { src = execSync('git show main:flowchart.html', { cwd: ROOT, maxBuffer: 64 * 1024 * 1024 }).toString('utf8'); }
catch { src = readFileSync(join(ROOT, 'flowchart.html'), 'utf8'); }

const VIEWS = ['math', 'spending-essentials', 'spending-lifestyle', 'portfolio-bogleheads', 'portfolio-theory', 'zeitgeist-investing', 'zeitgeist-lifestyle', 'advanced-strategies'];

// Extract the INNER html of the element carrying id="view-<name>" (balanced tags).
function extractViewInner(name) {
  const idAt = src.indexOf(`id="view-${name}"`);
  if (idAt === -1) throw new Error('view not found: ' + name);
  const open = src.lastIndexOf('<', idAt);
  const tag = (src.slice(open + 1).match(/^([a-zA-Z]+)/) || [])[1];
  const openEnd = src.indexOf('>', idAt) + 1;
  // balance <tag …> / </tag>
  const re = new RegExp(`<${tag}\\b|</${tag}>`, 'g');
  re.lastIndex = openEnd;
  let depth = 1, m;
  while ((m = re.exec(src))) { depth += m[0][1] === '/' ? -1 : 1; if (depth === 0) return src.slice(openEnd, m.index); }
  throw new Error('unbalanced view: ' + name);
}

// ---- CSS: keep rules whose selector references a content class we use ----
const styleOpen = src.indexOf('<style>');
const styleSrc = src.slice(styleOpen + 7, src.indexOf('</style>', styleOpen));
const KEEP = /\b(calc-row|calc-grid|calc-result|calculator|calc-chart|calc-table|calc-result-headline|calc-result-detail|math-callout|math-section|math-section-header|math-section-number|math-content|math-formula|math-intro|model-limits)\b/;
// naive top-level rule splitter (the section styles are not nested in @media)
function extractCss(css) {
  const rules = [];
  let i = 0;
  while (i < css.length) {
    const brace = css.indexOf('{', i);
    if (brace === -1) break;
    const selector = css.slice(i, brace).trim();
    let depth = 1, j = brace + 1;
    for (; j < css.length; j++) { if (css[j] === '{') depth++; else if (css[j] === '}') { depth--; if (depth === 0) break; } }
    const body = css.slice(brace + 1, j);
    if (selector.startsWith('@media')) {
      // recurse into media blocks; keep matching inner rules wrapped
      const inner = extractCss(body);
      if (inner.trim()) rules.push(`${selector} {\n${inner}\n}`);
    } else if (KEEP.test(selector)) {
      rules.push(`${selector} { ${body.trim()} }`);
    }
    i = j + 1;
  }
  return rules.join('\n');
}

const CHECK = process.argv.includes('--check');
const dir = join(ROOT, 'src', 'content', 'sections');
mkdirSync(dir, { recursive: true });
let totalChars = 0;
const sectionHtml = {};
for (const v of VIEWS) { sectionHtml[v] = extractViewInner(v); totalChars += sectionHtml[v].length; }
// v1's palette/fonts collide by NAME with v2's (--accent/--bg/--ink) but differ in
// value — so scope them to the section container, not :root. Reference views then
// render in v1's design; the diagnostic/plan shell stays v2's.
const rootVars = (styleSrc.match(/:root\s*\{([^}]*)\}/) || [, ''])[1];
const wantVars = ['accent', 'accent-dark', 'bg', 'border', 'border-soft', 'surface', 'ink', 'ink-soft', 'muted', 'font-body', 'font-display', 'font-mono', 'radius'];
const defs = Object.fromEntries([...rootVars.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
const scoped = wantVars.map((v) => defs['--' + v] ? `  --${v}: ${defs['--' + v]};` : '').filter(Boolean).join('\n');
const preamble = `/* v1 reference-view palette/fonts, SCOPED so they don't override the v2 shell */
.sectionview {\n${scoped}\n  background: var(--bg); color: var(--ink); border-radius: var(--radius, 10px); padding: 8px 4px;\n  font-family: var(--font-body);\n}
.sectionview h2, .sectionview h3, .sectionview h4 { font-family: var(--font-display); color: var(--ink); }
`;
const css = preamble + '\n' + extractCss(styleSrc);

// structural check: every <id>-result in every section must map to a known kernel
// calculator (or hc-result, the deliberately-deferred historical-cycles fan chart).
const KNOWN = new Set(['hc-result']);
for (const m of readFileSync(join(ROOT, 'src', 'core', 'calculators', 'calculators.mjs'), 'utf8').matchAll(/"resultId":"([^"]+)"/g)) KNOWN.add(m[1]);
const unknown = [];
for (const [v, html] of Object.entries(sectionHtml)) for (const m of html.matchAll(/id="([a-z0-9-]+-result)"/g)) if (!KNOWN.has(m[1])) unknown.push(`${v}:${m[1]}`);

if (CHECK) {
  let drift = 0;
  for (const v of VIEWS) { const cur = readFileSync(join(dir, `${v}.html`), 'utf8'); if (cur !== sectionHtml[v]) { console.error(`✗ drift: ${v}.html differs from v1`); drift++; } }
  if (readFileSync(join(dir, 'sections.css'), 'utf8') !== css) { console.error('✗ drift: sections.css differs'); drift++; }
  if (unknown.length) { console.error(`✗ ${unknown.length} result-id(s) with no kernel calculator: ${unknown.join(', ')}`); drift++; }
  if (drift) process.exit(1);
  console.log(`✓ ${VIEWS.length} sections + css match v1; all result-ids map to a calculator (or deferred hc-result).`);
} else {
  for (const v of VIEWS) writeFileSync(join(dir, `${v}.html`), sectionHtml[v]);
  writeFileSync(join(dir, 'sections.css'), css);
  if (unknown.length) console.log(`  note: ${unknown.length} unwired result-id(s): ${unknown.join(', ')}`);
  console.log(`extracted ${VIEWS.length} sections (${totalChars.toLocaleString()} chars) + sections.css (${css.length.toLocaleString()} chars)`);
}

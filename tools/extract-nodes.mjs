#!/usr/bin/env node
// extract-nodes.mjs — Phase 2 content extraction: lift the three reference-node
// arrays (W2_NODES, CONTRACTOR_NODES, BUSINESS_NODES) out of main:v1/flowchart.html
// into structured per-node JSON, WITHOUT breaking the byte-exact round-trip.
//
// Each node array is build segment 05/06/07 (run `node tools/extract.mjs`). A
// node looks like:
//   { phase, marker, title, summary, [badges,] details: `…HTML…` }
// where `details` is a TEMPLATE LITERAL that may interpolate ${bracketBlock(…)}.
//
// For every node we write src/content/nodes/<income>/<marker>.json with:
//   { income, phase, marker, title, summary, badges, detailsHtml, rawSource, lead }
// — `detailsHtml` is the raw template-literal inner text (NOT evaluated, so the
// ${bracketBlock(…)} interpolation is preserved verbatim and we need no helper),
// and `rawSource`/`lead` are the EXACT source slices that make the segment
// reproducible byte-for-byte:
//   segment === header + Σ(node.lead + node.rawSource) + footer
//
// The companion build.mjs GENERATORS entries reassemble each segment from these
// files; tools/gate.mjs proves the result is byte-identical to the live artifact.
//
// Usage: node tools/extract-nodes.mjs [--check]   (--check: parse + verify, don't write)

import { writeFileSync, mkdirSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = new Set(process.argv.slice(2));

// The three arrays, by segment name and the income slug their files live under.
export const NODE_ARRAYS = [
  { array: 'W2_NODES', segment: 'data-w2-nodes', income: 'w2' },
  { array: 'CONTRACTOR_NODES', segment: 'data-contractor-nodes', income: 'contractor' },
  { array: 'BUSINESS_NODES', segment: 'data-business-nodes', income: 'business' },
];

function readSource() {
  try { return execSync('git show main:v1/flowchart.html', { cwd: ROOT, maxBuffer: 64 * 1024 * 1024 }).toString('utf8'); }
  catch { return readFileSync(join(ROOT, 'flowchart.html'), 'utf8'); }
}

// Read a segment's exact text from build/segments (the byte-exact unit we must
// reproduce). Returns the file's name + text so we can map back to the manifest.
function readSegment(segmentName) {
  const manifest = JSON.parse(readFileSync(join(ROOT, 'build', 'manifest.json'), 'utf8'));
  const seg = manifest.segments.find((s) => s.name === segmentName);
  if (!seg) throw new Error(`segment not in manifest: ${segmentName}`);
  return { file: seg.file, text: readFileSync(join(ROOT, 'build', 'segments', seg.file), 'utf8') };
}

// ── Source-faithful scanner ──────────────────────────────────────────────────
// JS-aware index advance that skips over a string / template / comment starting
// at `i`, returning the index just past it. Templates recurse through ${…}.
// Used so `{` / `}` / `,` inside strings, templates, or comments never count.

function skipString(s, i, quote) {
  i++; // past opening quote
  while (i < s.length) {
    const c = s[i];
    if (c === '\\') { i += 2; continue; }
    if (c === quote) return i + 1;
    i++;
  }
  throw new Error('unterminated string');
}

function skipTemplate(s, i) {
  i++; // past opening backtick
  while (i < s.length) {
    const c = s[i];
    if (c === '\\') { i += 2; continue; }
    if (c === '`') return i + 1;
    if (c === '$' && s[i + 1] === '{') {
      i = skipBalanced(s, i + 2, '{', '}'); // through the matching }
      continue;
    }
    i++;
  }
  throw new Error('unterminated template literal');
}

function skipComment(s, i) {
  if (s[i + 1] === '/') { // line comment
    const nl = s.indexOf('\n', i);
    return nl === -1 ? s.length : nl; // stop AT the newline (newline is plain text)
  }
  const end = s.indexOf('*/', i + 2); // block comment
  if (end === -1) throw new Error('unterminated block comment');
  return end + 2;
}

// Advance from `i` (just past an opening delimiter `open`) to the index just past
// the matching `close`, honoring nested strings/templates/comments/delimiters.
function skipBalanced(s, i, open, close) {
  let depth = 1;
  while (i < s.length) {
    const c = s[i];
    if (c === "'" || c === '"') { i = skipString(s, i, c); continue; }
    if (c === '`') { i = skipTemplate(s, i); continue; }
    if (c === '/' && (s[i + 1] === '/' || s[i + 1] === '*')) { i = skipComment(s, i); continue; }
    if (c === open) { depth++; i++; continue; }
    if (c === close) { depth--; i++; if (depth === 0) return i; continue; }
    i++;
  }
  throw new Error(`unbalanced ${open}${close}`);
}

// Split an array body (the text strictly between `[` and the final `]`) into an
// ordered list of { lead, raw } — `raw` is each top-level {…} object slice,
// `lead` is the exact text preceding it (commas, whitespace, comments). A
// trailing `footer` (text after the last object up to the close bracket) is
// returned separately. Concatenation is lossless: lead+raw per node + footer.
function splitArrayBody(body) {
  const nodes = [];
  let i = 0;
  let leadStart = 0;
  while (i < body.length) {
    const c = body[i];
    if (c === "'" || c === '"') { i = skipString(body, i, c); continue; }
    if (c === '`') { i = skipTemplate(body, i); continue; }
    if (c === '/' && (body[i + 1] === '/' || body[i + 1] === '*')) { i = skipComment(body, i); continue; }
    if (c === '{') {
      const objStart = i;
      const objEnd = skipBalanced(body, i + 1, '{', '}');
      nodes.push({ lead: body.slice(leadStart, objStart), raw: body.slice(objStart, objEnd) });
      i = objEnd;
      leadStart = objEnd;
      continue;
    }
    i++;
  }
  return { nodes, footer: body.slice(leadStart) };
}

// ── Field extraction from a single node's raw {…} text ───────────────────────
// Top-level scan for `<key>:` at object depth 1, then read the literal value.

function parseNode(raw) {
  // strip the outer braces; scan the inner text at depth 0
  const inner = raw.slice(1, -1);
  const fields = {};
  let i = 0;
  while (i < inner.length) {
    const c = inner[i];
    if (c === "'" || c === '"') { i = skipString(inner, i, c); continue; }
    if (c === '`') { i = skipTemplate(inner, i); continue; }
    if (c === '/' && (inner[i + 1] === '/' || inner[i + 1] === '*')) { i = skipComment(inner, i); continue; }
    // a key is an identifier immediately followed by ':'
    const m = /^([a-zA-Z_$][\w$]*)\s*:/.exec(inner.slice(i));
    if (m && isKeyPosition(inner, i)) {
      const key = m[1];
      let v = i + m[0].length;
      while (v < inner.length && (inner[v] === ' ' || inner[v] === '\t' || inner[v] === '\n')) v++;
      const { value, next } = readValue(inner, v);
      fields[key] = value;
      i = next;
      continue;
    }
    i++;
  }
  return fields;
}

// A key only begins right after `{`, `,`, or whitespace following those — i.e.
// the preceding non-space char is `{`(=start) `,` or nothing. Guards against
// matching an identifier that's actually a value.
function isKeyPosition(inner, i) {
  let j = i - 1;
  while (j >= 0 && /\s/.test(inner[j])) j--;
  return j < 0 || inner[j] === ',' || inner[j] === '{';
}

// Read a literal value starting at `i`: single/double string, template literal,
// or array literal. Returns { value, next } where `next` is just past the value
// and (if present) its trailing comma is left for the outer scan.
function readValue(s, i) {
  const c = s[i];
  if (c === "'" || c === '"') {
    const end = skipString(s, i, c);
    return { value: unquote(s.slice(i, end)), next: end };
  }
  if (c === '`') {
    const end = skipTemplate(s, i);
    return { value: s.slice(i + 1, end - 1), next: end }; // raw inner template text
  }
  if (c === '[') {
    const end = skipBalanced(s, i + 1, '[', ']');
    return { value: parseStringArray(s.slice(i, end)), next: end };
  }
  // fallback: read until top-level comma or end
  let j = i;
  while (j < s.length && s[j] !== ',') j++;
  return { value: s.slice(i, j).trim(), next: j };
}

// Decode a single/double-quoted JS string literal to its actual value.
function unquote(lit) {
  const q = lit[0];
  const body = lit.slice(1, -1);
  let out = '';
  for (let i = 0; i < body.length; i++) {
    if (body[i] === '\\') {
      const n = body[i + 1];
      if (n === 'n') out += '\n';
      else if (n === 't') out += '\t';
      else if (n === 'r') out += '\r';
      else if (n === '\\') out += '\\';
      else if (n === q) out += q;
      else out += n; // \' \" etc.
      i++;
    } else out += body[i];
  }
  return out;
}

// Parse a flat array of string literals, e.g. ['critical', 'new'].
function parseStringArray(lit) {
  const inner = lit.slice(1, -1);
  const out = [];
  let i = 0;
  while (i < inner.length) {
    const c = inner[i];
    if (c === "'" || c === '"') { const end = skipString(inner, i, c); out.push(unquote(inner.slice(i, end))); i = end; continue; }
    i++;
  }
  return out;
}

// ── Per-array extraction ─────────────────────────────────────────────────────
/**
 * Byte-exact decomposition of one node-array segment.
 * @param {{array:string, income:string}} spec  array name + income slug
 * @param {string} segText  the segment's exact text (from build/segments)
 * @returns {{header:string, footer:string, items:object[]}} header+footer scaffold
 *   and the structured per-node records (each carrying its `rawSource`/`lead`),
 *   such that reassemble() reproduces `segText` byte-for-byte.
 */
export function extractArray({ array, income }, segText) {
  const open = `const ${array} = [`;
  const arrOpenIdx = segText.indexOf(open);
  if (arrOpenIdx === -1) throw new Error(`array open not found in segment: ${open}`);
  const bracketIdx = arrOpenIdx + open.length - 1; // position of the '['
  const bodyEnd = skipBalanced(segText, bracketIdx + 1, '[', ']'); // just past matching ']'
  const header = segText.slice(0, bracketIdx + 1);      // …const X = [
  const body = segText.slice(bracketIdx + 1, bodyEnd - 1); // between [ and ]
  const footer = segText.slice(bodyEnd - 1);            // ] … (incl. trailing comment block)

  const { nodes, footer: bodyTail } = splitArrayBody(body);
  const items = nodes.map(({ lead, raw }) => {
    const f = parseNode(raw);
    return {
      income,
      phase: f.phase,
      marker: f.marker,
      title: f.title,
      summary: f.summary,
      badges: f.badges || [],
      detailsHtml: f.details ?? '',
      rawSource: raw,
      lead,
    };
  });
  return { header, footer: bodyTail + footer, items };
}

/**
 * Reassemble a segment byte-for-byte from its scaffold + node records.
 * @param {{header:string, items:{lead:string, rawSource:string}[], footer:string}} d
 * @returns {string} header + Σ(lead+rawSource) + footer
 */
export function reassemble({ header, items, footer }) {
  let out = header;
  for (const it of items) out += it.lead + it.rawSource;
  return out + footer;
}

// ── Segment generator (build-time) ───────────────────────────────────────────
/**
 * Regenerate a node-array segment's exact text purely from src/content/nodes/<income>/
 * (the `_array.json` scaffold + per-marker files in `order`). Wired into build.mjs's
 * GENERATORS; the round-trip gate proves it byte-identical to the live artifact.
 * @param {string} income  'w2' | 'contractor' | 'business'
 * @param {string} [contentRoot]  override the nodes dir (tests)
 * @returns {string} the segment text
 */
export function renderSegment(income, contentRoot = join(ROOT, 'src', 'content', 'nodes')) {
  const dir = join(contentRoot, income);
  const meta = JSON.parse(readFileSync(join(dir, '_array.json'), 'utf8'));
  const items = meta.order.map((marker) => JSON.parse(readFileSync(join(dir, `${marker}.json`), 'utf8')));
  return reassemble({ header: meta.header, items, footer: meta.footer });
}

// ── Coverage check (INDEPENDENT of the splitter above) ───────────────────────
// Evals the LIVE node arrays from main:v1/flowchart.html (with bracketBlock stubbed
// to '') and asserts every live node has a written content file whose structured
// parse is non-empty AND matches the live node's marker/phase/title/badges. A
// second, structurally-different oracle than `parseNode`, so a bug in one is
// caught by the other.
export function liveArrays(src = readSource()) {
  const bracketBlock = () => '';
  const out = {};
  for (const { array, income } of NODE_ARRAYS) {
    const open = `const ${array} = [`;
    const s = src.indexOf(open);
    if (s === -1) throw new Error(`live array not found: ${array}`);
    const arrStart = src.indexOf('[', s);
    const end = src.indexOf('\n];', arrStart); // each array closes with a line `];`
    if (end === -1) throw new Error(`live array close not found: ${array}`);
    const text = src.slice(arrStart, end + 3);
    // eslint-disable-next-line no-new-func
    out[income] = new Function('bracketBlock', `return ${text.replace(/;\s*$/, '')};`)(bracketBlock);
  }
  return out;
}

function coverage() {
  const live = liveArrays();
  const root = join(ROOT, 'src', 'content', 'nodes');
  let live_n = 0, checked = 0;
  const problems = [];
  for (const { income } of NODE_ARRAYS) {
    const nodes = live[income];
    live_n += nodes.length;
    for (const n of nodes) {
      const fp = join(root, income, `${n.marker}.json`);
      if (!existsSync(fp)) { problems.push(`${income}/${n.marker}: no content file`); continue; }
      const rec = JSON.parse(readFileSync(fp, 'utf8'));
      if (!rec.phase || !rec.marker || !rec.title || !rec.summary) problems.push(`${income}/${n.marker}: empty structured field`);
      if (rec.marker !== n.marker || rec.phase !== n.phase || rec.title !== n.title) problems.push(`${income}/${n.marker}: structured parse disagrees with live node`);
      const liveBadges = JSON.stringify(n.badges || []);
      if (JSON.stringify(rec.badges || []) !== liveBadges) problems.push(`${income}/${n.marker}: badges mismatch (file ${JSON.stringify(rec.badges)} vs live ${liveBadges})`);
      checked++;
    }
  }
  if (problems.length) {
    console.error(`✗ coverage FAIL (${problems.length} problem(s)):`);
    for (const p of problems.slice(0, 20)) console.error(`  - ${p}`);
    process.exit(1);
  }
  console.log(`✓ coverage: all ${live_n} live nodes have a content file with a non-empty, live-matching structured parse (${checked} checked)`);
  process.exit(0);
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  if (args.has('--coverage')) coverage();
  if (!existsSync(join(ROOT, 'build', 'manifest.json'))) {
    console.error('✗ build/manifest.json missing — run `node tools/extract.mjs` first');
    process.exit(1);
  }
  const outRoot = join(ROOT, 'src', 'content', 'nodes');
  let total = 0;
  const results = [];
  for (const spec of NODE_ARRAYS) {
    const { text: segText } = readSegment(spec.segment);
    const parsed = extractArray(spec, segText);
    // round-trip self-check: reassembly must equal the segment exactly
    const rebuilt = reassemble(parsed);
    if (rebuilt !== segText) {
      console.error(`✗ ${spec.array}: reassembly != segment (byte round-trip broken before write)`);
      let k = 0; while (k < Math.min(rebuilt.length, segText.length) && rebuilt[k] === segText[k]) k++;
      console.error(`  first divergence at ${k}: seg ${JSON.stringify(segText.slice(k, k + 50))}`);
      process.exit(1);
    }
    // structured-parse sanity: every node has the core fields non-empty
    for (const it of parsed.items) {
      if (!it.phase || !it.marker || !it.title || !it.summary) {
        console.error(`✗ ${spec.array} node ${JSON.stringify(it.marker)}: empty structured field`);
        process.exit(1);
      }
    }
    results.push({ spec, parsed });
    total += parsed.items.length;
    console.log(`  ${spec.array.padEnd(18)} ${String(parsed.items.length).padStart(2)} nodes  (reassembly byte-exact ✓)`);
  }
  console.log(`parsed ${total} nodes across ${NODE_ARRAYS.length} arrays`);

  if (args.has('--check')) {
    console.log('✓ --check: all arrays parsed + reassembly byte-exact (not written)');
    process.exit(0);
  }

  for (const { spec, parsed } of results) {
    const dir = join(outRoot, spec.income);
    rmSync(dir, { recursive: true, force: true });
    mkdirSync(dir, { recursive: true });
    for (const it of parsed.items) {
      // stable, readable field order in the JSON
      const record = {
        income: it.income,
        phase: it.phase,
        marker: it.marker,
        title: it.title,
        summary: it.summary,
        badges: it.badges,
        detailsHtml: it.detailsHtml,
        rawSource: it.rawSource,
        lead: it.lead,
      };
      // marker may contain characters unsafe-ish for filenames; markers are like 0.1/3.2 — keep as-is
      writeFileSync(join(dir, `${it.marker}.json`), JSON.stringify(record, null, 2) + '\n');
    }
    // The array scaffolding (header `const X = [`, footer `]…`, and the node
    // ORDER) lives in a per-income `_array.json`. The generator reassembles the
    // segment purely from these files in `src/content/nodes/` — no segment re-read.
    const arrayMeta = {
      income: spec.income,
      array: spec.array,
      segment: spec.segment,
      header: parsed.header,
      footer: parsed.footer,
      order: parsed.items.map((it) => it.marker),
    };
    writeFileSync(join(dir, '_array.json'), JSON.stringify(arrayMeta, null, 2) + '\n');
  }
  console.log(`wrote ${total} node files + 3 _array.json → ${outRoot}/{w2,contractor,business}/`);
}

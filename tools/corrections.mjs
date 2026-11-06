// corrections.mjs — the audited corrections layer over verbatim v1 content.
//
// The reference sections and the live calculator subsystem are generated from
// main:v1/flowchart.html and gated byte-identical to it (verify-v2.sh gates 9 and 10).
// When a figure in that text goes stale, the fix cannot be an edit to the generated
// files. It is an entry in src/content/corrections.json, applied here at build time.
// Used by build-v2.mjs (apply) and verify-corrections.mjs (gate 13). Pure Node, no deps.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const REQUIRED = ['id', 'claim', 'target', 'find', 'replace', 'count', 'reason', 'source', 'verified'];

export function loadCorrections() {
  return JSON.parse(readFileSync(join(ROOT, 'src', 'content', 'corrections.json'), 'utf8')).corrections;
}

// 'section:<view>' → src/content/sections/<view>.html · 'calculators-live' → src/ui/calculators-live.mjs
export function targetPath(target) {
  if (target === 'calculators-live') return join(ROOT, 'src', 'ui', 'calculators-live.mjs');
  const m = /^section:([a-z0-9-]+)$/.exec(target);
  if (m) return join(ROOT, 'src', 'content', 'sections', `${m[1]}.html`);
  throw new Error(`corrections: unknown target "${target}"`);
}

const TOKEN_RE = /\{\{(fig|figval):([^}]+)\}\}/g;
export function resolveReplace(text, figures) {
  return text.replace(TOKEN_RE, (_, kind, key) => {
    const f = figures[key];
    if (!f) throw new Error(`corrections: unknown figure key ${key}`);
    return kind === 'fig' ? f.display : String(f.value);
  });
}

const occurrences = (hay, needle) => hay.split(needle).length - 1;

// Apply every correction for `target` to `text`. Throws unless each 'find' matches the
// text exactly 'count' times, so a drifted source can never be half-corrected.
export function applyCorrections(target, text, figures, corrections = loadCorrections()) {
  let out = text;
  for (const c of corrections.filter((x) => x.target === target)) {
    const n = occurrences(out, c.find);
    if (n !== c.count) throw new Error(`corrections ${c.id}: expected ${c.count} match(es) of its 'find' in ${target}, found ${n}`);
    out = out.split(c.find).join(resolveReplace(c.replace, figures));
  }
  return out;
}
export { occurrences };

// phase4-content.mjs — shared loader + validators for the Phase 4 content modules
// (life events, protection, annual review) and their plain-English layer (§4.5).
// Pure Node, no deps. Used by build-v2.mjs (inlining), verify-phase4.mjs (gate),
// and plain-layer.mjs (L3 proposition-map tooling).

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const json = (...p) => JSON.parse(readFileSync(join(ROOT, ...p), 'utf8'));

export function loadPhase4() {
  return {
    lifeEvents: json('src', 'content', 'phase4', 'life-events.json'),
    protection: json('src', 'content', 'phase4', 'protection.json'),
    annualReview: json('src', 'content', 'phase4', 'annual-review.json'),
  };
}
export function loadPlain() {
  const p = join(ROOT, 'src', 'content', 'phase4', 'plain.json');
  return existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : {};
}

// Every prose block that carries (or must carry) a plain-English variant, keyed by a
// stable id: le:<event>:<step> · pr:<section> · ar:<item>.
export function blocks(p4 = loadPhase4()) {
  const out = [];
  for (const e of p4.lifeEvents.events) for (const s of e.steps) out.push({ id: `le:${e.id}:${s.id}`, title: s.title, body: s.body, links: s.links || [], claims: s.claims || [], anchor: `p4:life-events:${e.id}` });
  for (const s of p4.protection.sections) out.push({ id: `pr:${s.id}`, title: s.title, body: s.body, links: s.links || [], claims: s.claims || [], anchor: `p4:protection:${s.id}` });
  for (const it of p4.annualReview.items) out.push({ id: `ar:${it.id}`, title: it.title, body: it.body, links: it.links || [], claims: it.claims || [], anchor: `p4:annual-review:${it.id}` });
  return out;
}

export const canonHash = (text) => createHash('sha256').update(text, 'utf8').digest('hex').slice(0, 12);

// ---- token resolution: {{fig:key}} → figure display; {{verify:what}} → visible flag ----
const TOKEN_RE = /\{\{(fig|verify):([^}]+)\}\}/g;
export function tokens(text) { return [...(text || '').matchAll(TOKEN_RE)].map((m) => m[0]); }
export function resolveTokens(text, figures) {
  return (text || '').replace(TOKEN_RE, (_, kind, arg) => {
    if (kind === 'fig') {
      const f = figures[arg];
      if (!f) throw new Error(`unknown figure key {{fig:${arg}}}`);
      return `<span class="fig" data-fig="${arg}" title="${f.source.replace(/"/g, '&quot;')} · verified ${f.verified}">${f.display}</span>`;
    }
    return `<span class="verify" title="Placeholder — this figure is not yet in the verified figures layer">[VERIFY: ${arg}]</span>`;
  });
}

// ---- deep-link targets ----
// full-chart/<income>/<marker> · <section-view>/<n> · protection/<id> · life-events/<id>
// · annual-review · plan · <view>
export function linkTargets() {
  const t = new Set(['plan', 'full-chart', 'personal-chart', 'life-events', 'protection', 'annual-review']);
  for (const inc of ['w2', 'contractor', 'business']) {
    for (const m of json('src', 'content', 'nodes', inc, '_array.json').order) t.add(`full-chart/${inc}/${m}`);
  }
  const secDir = join(ROOT, 'src', 'content', 'sections');
  for (const f of readdirSync(secDir)) {
    if (!f.endsWith('.html')) continue;
    const view = f.replace(/\.html$/, '');
    t.add(view);
    const html = readFileSync(join(secDir, f), 'utf8');
    for (const m of html.matchAll(/math-section-number">\s*(\d+)\s*</g)) t.add(`${view}/${m[1]}`);
  }
  const p4 = loadPhase4();
  for (const e of p4.lifeEvents.events) t.add(`life-events/${e.id}`);
  for (const s of p4.protection.sections) t.add(`protection/${s.id}`);
  return t;
}

// numbers that appear in text (after stripping tokens/tags) — the "numbers verbatim" rule
export function numbersIn(text) {
  const plain = (text || '').replace(TOKEN_RE, ' ').replace(/<[^>]+>/g, ' ');
  return (plain.match(/\$?\d[\d,]*(?:\.\d+)?%?(?:½)?/g) || []).map((n) => n.replace(/,$/, '')).sort();
}
export const stripTags = (s) => (s || '').replace(TOKEN_RE, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

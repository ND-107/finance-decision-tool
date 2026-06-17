#!/usr/bin/env node
// extract-questions.mjs — Phase 2 first content extraction: lift the diagnostic
// schema (the QUESTIONS array) out of main:v1/flowchart.html into structured data
// (src/content/questions.json), converting every `showIf` closure into a
// declarative predicate (src/core/predicates.mjs grammar). This is the crux of
// the rebuild per V2_REBUILD_PLAN.md §2/§3 — closures become serializable data.
//
// The conversion is then PROVEN behavior-identical to the live closures by
// tools/verify-questions-equivalence.mjs. This tool just emits the JSON.
//
// Usage: node tools/extract-questions.mjs [--check]   (--check: don't write, just validate)

import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { showIfToPredicate } from './lib/showif-to-predicate.mjs';
import { assertValidPredicate } from '../src/core/predicates.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = new Set(process.argv.slice(2));

// Pull the QUESTIONS array text from the live artifact and eval it (it depends
// on nothing but the literal — closures reference only their param `a`).
export function loadLiveQuestions() {
  let src;
  try { src = execSync('git show main:v1/flowchart.html', { cwd: ROOT, maxBuffer: 64 * 1024 * 1024 }).toString('utf8'); }
  catch { src = readFileSync(join(ROOT, 'flowchart.html'), 'utf8'); }
  const start = src.indexOf('const QUESTIONS = [');
  if (start === -1) throw new Error('QUESTIONS array not found');
  // QUESTIONS ends at the `];` immediately preceding `let state`
  const stateIdx = src.indexOf('let state = {', start);
  const region = src.slice(start, stateIdx);
  const arrStart = region.indexOf('[');
  const arrEnd = region.lastIndexOf('];');
  const arrText = region.slice(arrStart, arrEnd + 1);
  // eslint-disable-next-line no-new-func
  const QUESTIONS = new Function(`return ${arrText};`)();
  if (!Array.isArray(QUESTIONS)) throw new Error('eval did not yield an array');
  return QUESTIONS;
}

function convert(QUESTIONS) {
  const sections = QUESTIONS.map((sec, si) => {
    const out = { section: sec.section };
    if (sec.showIf) {
      out.showIf = showIfToPredicate(sec.showIf);
      assertValidPredicate(out.showIf, `section[${si}].showIf`);
    }
    out.questions = sec.qs.map((q, qi) => {
      const qo = { id: q.id, type: q.type, label: q.label };
      if (q.help) qo.help = q.help;
      if (q.showIf) {
        qo.showIf = showIfToPredicate(q.showIf);
        assertValidPredicate(qo.showIf, `section[${si}].q[${qi}](${q.id}).showIf`);
      }
      qo.options = q.options.map((o) => ({ v: o.v, l: o.l }));
      return qo;
    });
    return out;
  });
  return { schemaVersion: 2, sections };
}

export { convert };

// Main: only when invoked directly (not on import — the equivalence harness
// imports loadLiveQuestions and must NOT trigger a write).
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const QUESTIONS = loadLiveQuestions();
  const data = convert(QUESTIONS);
  const nQ = data.sections.reduce((n, s) => n + s.questions.length, 0);
  const nShowIf = data.sections.filter((s) => s.showIf).length + data.sections.reduce((n, s) => n + s.questions.filter((q) => q.showIf).length, 0);
  console.log(`parsed ${data.sections.length} sections, ${nQ} questions, ${nShowIf} showIf predicates converted`);
  if (args.has('--check')) {
    console.log('✓ --check: all showIf closures parsed + predicates valid (not written)');
    process.exit(0);
  }
  const outDir = join(ROOT, 'src', 'content');
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, 'questions.json');
  writeFileSync(outPath, JSON.stringify(data, null, 2) + '\n');
  console.log(`wrote ${outPath}`);
}

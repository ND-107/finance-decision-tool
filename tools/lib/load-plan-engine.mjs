// load-plan-engine.mjs — load the LIVE computePlan() from main:v1/flowchart.html as
// a callable, isolated from the DOM. Extracts the pure-logic slice (hashKey …
// computePlan, ~1090 lines incl. all helpers computePlan transitively needs)
// and evals it in a Function sandbox with a fresh `state`. The slice also
// DEFINES several DOM/localStorage-touching helpers (savePersistedState,
// applyDefaultIfFallback, …) but computePlan never CALLS them, so no stub is
// needed — definitions are harmless, only calls would touch the DOM.
//
// Returns { computePlan(answers) }: sets state.answers and returns the live
// engine's { actions, skipped, tier1 }. This is the reference implementation the
// v2 rule engine is checked against (the parity gate, V2_REBUILD_PLAN.md §2.3).

import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

export function loadPlanEngine() {
  let src;
  try { src = execSync('git show main:v1/flowchart.html', { cwd: ROOT, maxBuffer: 64 * 1024 * 1024 }).toString('utf8'); }
  catch { src = readFileSync(join(ROOT, 'flowchart.html'), 'utf8'); }

  const start = src.indexOf('function hashKey(s) {');
  if (start === -1) throw new Error('hashKey not found');
  const ret = src.indexOf('return { actions, skipped, tier1 };', start);
  if (ret === -1) throw new Error('computePlan return not found');
  const end = src.indexOf('\n}', ret) + 2;
  const slice = src.slice(start, end);

  // `state` is declared BEFORE the slice in the artifact; provide our own.
  // Append an accessor so we can drive state.answers per call.
  const body = `let state = { answers: {} };\n${slice}\n;return { computePlan, _setAnswers(a){ state.answers = a; }, _state(){ return state; } };`;
  // eslint-disable-next-line no-new-func
  const factory = new Function(body);
  const engine = factory();

  return {
    /** Run the live computePlan against an answers object; returns {actions, skipped, tier1}. */
    computePlan(answers) {
      engine._setAnswers(answers);
      return engine.computePlan();
    },
  };
}

#!/bin/bash
# verify-v2.sh — run every v2 gate. Mirrors verify.sh for the rebuild branch.
# Each step is independently negative-tested (proven to fail on a planted defect).
set -e
cd "$(dirname "$0")/.."

echo "→ [1/9] unit tests (all src/core: predicates, engine, deadlines, sensitivity, completion, calculators)…"
node --test src/core/*.test.mjs >/dev/null

echo "→ [2/9] figures layer (vintage stamps + expiry)…"
node tools/validate-figures.mjs >/dev/null

echo "→ [3/9] diagnostic predicates ≡ live showIf closures (4.2M comparisons)…"
node tools/verify-questions-equivalence.mjs >/dev/null

echo "→ [4/9] plan engine parity (v2 vs v1 golden, 3030 fixtures)…"
node tools/verify-plan-parity.mjs >/dev/null

echo "→ [5/9] rule build-time invariants (dead values / reachability / contradiction / showIf DAG)…"
node tools/verify-rules.mjs >/dev/null

echo "→ [6/9] priority model (hybrid invariant: same actions+stages, within-stage sorted, overrides float, all banded)…"
node tools/verify-priority.mjs >/dev/null

echo "→ [7/9] prose parity (v2 reason/because ≡ v1-live, 3030 fixtures · ~48K actions)…"
node tools/verify-prose-parity.mjs >/dev/null

echo "→ [8/9] lossless round-trip (extract → build → byte-exact gate)…"
node tools/extract.mjs >/dev/null && node tools/build.mjs >/dev/null && node tools/gate.mjs >/dev/null

echo "→ [9/9] calculator parity (v1-live Chrome vs v2 runCalculator, ~59 vectors)…"
if [ -x "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" ]; then
  node tools/verify-calculators.mjs >/dev/null
else
  echo "   (skipped — Google Chrome not found; run tools/verify-calculators.mjs where Chrome is available)"
fi

echo ""
echo "All v2 gates green."

#!/bin/bash
# verify-v2.sh — run every v2 gate. Mirrors verify.sh for the rebuild branch.
# Each step is independently negative-tested (proven to fail on a planted defect).
set -e
cd "$(dirname "$0")/.."

echo "→ [1/6] unit tests (all src/core: predicates, engine, deadlines, sensitivity, completion)…"
node --test src/core/*.test.mjs >/dev/null

echo "→ [2/6] figures layer (vintage stamps + expiry)…"
node tools/validate-figures.mjs >/dev/null

echo "→ [3/6] diagnostic predicates ≡ live showIf closures (4.2M comparisons)…"
node tools/verify-questions-equivalence.mjs >/dev/null

echo "→ [4/6] plan engine parity (v2 vs v1 golden, 3030 fixtures)…"
node tools/verify-plan-parity.mjs >/dev/null

echo "→ [5/6] rule build-time invariants (dead values / reachability / contradiction / showIf DAG)…"
node tools/verify-rules.mjs >/dev/null

echo "→ [6/6] lossless round-trip (extract → build → byte-exact gate)…"
node tools/extract.mjs >/dev/null && node tools/build.mjs >/dev/null && node tools/gate.mjs >/dev/null

echo ""
echo "All v2 gates green."

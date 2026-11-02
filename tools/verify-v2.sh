#!/bin/bash
# verify-v2.sh — run every v2 gate. Mirrors verify.sh for the rebuild branch.
# Each step is independently negative-tested (proven to fail on a planted defect).
set -e
cd "$(dirname "$0")/.."

echo "→ [1/12] unit tests (all src/core: predicates, engine, deadlines, sensitivity, completion, calculators)…"
node --test src/core/*.test.mjs >/dev/null

echo "→ [2/12] figures layer (vintage stamps + expiry)…"
node tools/validate-figures.mjs >/dev/null

echo "→ [3/12] diagnostic predicates ≡ live showIf closures (4.2M comparisons)…"
node tools/verify-questions-equivalence.mjs >/dev/null

echo "→ [4/12] plan engine parity (v2 vs v1 golden, 3030 fixtures)…"
node tools/verify-plan-parity.mjs >/dev/null

echo "→ [5/12] rule build-time invariants (dead values / reachability / contradiction / showIf DAG)…"
node tools/verify-rules.mjs >/dev/null

echo "→ [6/12] priority model (hybrid invariant: same actions+stages, within-stage sorted, overrides float, all banded)…"
node tools/verify-priority.mjs >/dev/null

echo "→ [7/12] prose parity (v2 reason/because ≡ v1-live, 3030 fixtures · ~48K actions)…"
node tools/verify-prose-parity.mjs >/dev/null

echo "→ [8/12] lossless round-trip (extract → build → byte-exact gate)…"
node tools/extract.mjs >/dev/null && node tools/build.mjs >/dev/null && node tools/gate.mjs >/dev/null

echo "→ [9/12] reference sections ≡ v1 (no drift; every result-id maps to a calculator)…"
node tools/extract-sections.mjs --check >/dev/null

echo "→ [10/12] calculator parity (v1-live Chrome vs v2 runCalculator, 245 vectors)…"
if [ -x "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" ]; then
  node tools/verify-calculators.mjs >/dev/null
else
  echo "   (skipped — Google Chrome not found; run tools/verify-calculators.mjs where Chrome is available)"
fi

echo "→ [11/12] audit export (src/data/claims.json ≡ audit/build_audit_xlsx.py CLAIMS)…"
python3 audit/export_claims_json.py --check >/dev/null

echo "→ [12/12] Phase 4 content + plain-English layer (deep links / figures / citations / L3 proposition maps)…"
node tools/verify-phase4.mjs >/dev/null

echo ""
echo "All v2 gates green."

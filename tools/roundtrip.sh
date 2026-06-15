#!/bin/bash
# roundtrip.sh — prove the Phase 1.4 lossless round-trip end to end.
# Mirrors verify.sh in spirit: a single command that must exit 0 before any
# semantic restructuring (V2_REBUILD_PLAN.md §1.4). Chains extract → build → gate.
#
#   extract  main:flowchart.html  → build/segments/* + build/manifest.json
#   build    segments             → dist/flowchart.html
#   gate     dist == main:flowchart.html  (byte-exact at stage 1)
set -e
cd "$(dirname "$0")/.."
echo "→ [1/3] extract …"
node tools/extract.mjs
echo "→ [2/3] build …"
node tools/build.mjs
echo "→ [3/3] gate …"
node tools/gate.mjs
echo ""
echo "Round-trip OK — extraction is lossless; safe to extract further / restructure."

# `src/` — v2 source tree (work in progress)

This branch (`v2`) holds the rebuild described in [`docs/V2_REBUILD_PLAN.md`](../docs/V2_REBUILD_PLAN.md). **`main` stays frozen as the live single-file artifact** (`flowchart.html`) until v2 reaches cutover (Phase 6). The public GitHub Pages site is served from `main`; nothing here is deployed yet.

## Layout (per plan §1.1)

```
src/
├── core/            pure TS/JS kernel — no DOM imports (plan engine, simulators, calculators)
│   └── calculators/ one pure module per calculator
├── content/
│   ├── nodes/       one file per graph node (action / reference prose) — Phase 1.4 / 2
│   ├── sections/    reference-view sections (math, spending, portfolio, zeitgeist, advstrat)
│   ├── playbooks/   life-events content (Phase 4)
│   └── questions.* diagnostic schema (declarative predicates) — Phase 3
└── data/
    ├── figures.json     vintage-stamped indexed dollar figures  ← FIRST DELIVERABLE (this phase)
    ├── hist-returns.json Shiller series + provenance (Phase 2)
    └── graph.*          node edges: requires / unlocks / dominates (Phase 2)
```

## Status

| Piece | State |
|---|---|
| Branch `v2` + skeleton | ✅ created |
| `data/figures.json` (46 figures) + `tools/validate-figures.mjs` gate | ✅ §1.3 done — all live-verified 2026-06-15; expiry gate proven; surfaced 1 live staleness (std deduction, hotfixed to `main`) |
| Extraction harness + round-trip gate (§1.4) | ✅ keystone proven — `tools/{extract,build,gate}.mjs` + `roundtrip.sh`; 12-segment partition round-trips **byte-exact**; gate fails on 1 corrupted byte; extract aborts on missing anchor |
| Kernel / graph (Phase 2) · diagnostic v2 (Phase 3) · content (Phase 4) · trust surfaces (Phase 5) · cutover (Phase 6) | ⬜ queued — Phase 2 extracts segments one at a time, gate green after each (see `tools/README.md`) |

## Why figures.json first

It is the smallest self-contained piece of the rebuild that (a) is independently valuable even if the full re-platform pauses, (b) directly continues the proven Phase 0 thread, and (c) doubles as a comprehensive live-verified audit of every indexed figure in the artifact — the same QA that caught the IRMAA `$487/$578` and Saver's Credit errors during Phase 0. Building it forces a complete figure sweep, which is itself a correctness pass on the live artifact.

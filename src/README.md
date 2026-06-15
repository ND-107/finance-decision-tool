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
| `data/figures.json` + `tools/validate-figures.mjs` gate | 🟡 in progress (this phase) — the §1.3 deliverable; directly fixes the drift the Phase 0 sprint hit twice |
| Extraction harness + round-trip gate (§1.4) | ⬜ next — the keystone; round-trip DOM-equivalence must pass before any restructuring |
| Kernel / graph (Phase 2) · diagnostic v2 (Phase 3) · content (Phase 4) · trust surfaces (Phase 5) · cutover (Phase 6) | ⬜ queued |

## Why figures.json first

It is the smallest self-contained piece of the rebuild that (a) is independently valuable even if the full re-platform pauses, (b) directly continues the proven Phase 0 thread, and (c) doubles as a comprehensive live-verified audit of every indexed figure in the artifact — the same QA that caught the IRMAA `$487/$578` and Saver's Credit errors during Phase 0. Building it forces a complete figure sweep, which is itself a correctness pass on the live artifact.

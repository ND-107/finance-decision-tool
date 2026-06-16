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
| **Phase 2** — diagnostic schema → declarative data | 🟢 `core/predicates.mjs` (evaluator + 9 tests) · `content/questions.json` (7 sections / 53 Qs / 21 `showIf` → predicates) · behavior-equivalence proven vs live closures across 4.2M comparisons |
| **Phase 2** — computePlan golden master (engine parity gate) | 🟢 live `computePlan` headless · 15 archetypes + 3000-vector corpus · `verify-plan-parity.mjs` |
| **Phase 2** — data-driven plan engine | 🟢 `core/{plan-rules,derive,plan-engine}.mjs` — 660-line imperative engine → 55 declarative rule groups; **3030/3030 parity** + structurally exact (63 adds / 24 skips); `analyze-rules.mjs` + `verify-rules.mjs` (found/removed 2 latent v1 dead branches; proved `cascadeClear` terminates) |
| **Phase 2/3** — deadlines as first-class | 🟢 `core/deadlines.mjs` + `data/deadlines.json` — statutory-deadline overlay (Parent PLUS 2026-07-01, §83(b) grant+30d, legacy-IDR 2028-07-01) with urgency tiers; the category v1 couldn't represent |
| **Phase 3** — diagnostic core primitives | 🟢 `core/sensitivity.mjs` (which answers drive the plan) + `core/completion.mjs` (done/dismissed → recompute → migrate to skip ledger) — pure, tested. *UX + priority redesign deferred (needs design input).* |
| **Phase 1.4 / 4** — node content extracted | 🟢 `content/nodes/<income>/<marker>.json` — all **93 reference nodes** as structured files; build regenerates the arrays **byte-exact** (`extract-nodes.mjs` + `build.mjs` generators), round-trip gate still green |
| Graph projections + derived staging + explicit priority (§2.2) · rest of diagnostic v2 (Phase 3) · trust surfaces (Phase 5) · cutover (Phase 6) | ⬜ queued |

## Why figures.json first

It is the smallest self-contained piece of the rebuild that (a) is independently valuable even if the full re-platform pauses, (b) directly continues the proven Phase 0 thread, and (c) doubles as a comprehensive live-verified audit of every indexed figure in the artifact — the same QA that caught the IRMAA `$487/$578` and Saver's Credit errors during Phase 0. Building it forces a complete figure sweep, which is itself a correctness pass on the live artifact.

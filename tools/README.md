# `tools/` — v2 build + verification harness

Plain Node ESM (`.mjs`), no dependencies, no install — same philosophy as the artifact. Run any tool with `node tools/<name>.mjs`.

## The round-trip harness (Phase 1.4 — the keystone)

The rebuild's central risk is **lossy content extraction**: ~80% of the artifact's mass is audited prose (471 claims). Before any of it is restructured, the extraction must provably round-trip. These three tools enforce that, and `roundtrip.sh` chains them:

```
./tools/roundtrip.sh        # extract → build → gate; must exit 0
```

| Tool | Does | Gate |
|---|---|---|
| `extract.mjs` | Splits `main:flowchart.html` into ordered segments at semantic anchors (`build/segments/*`) + `build/manifest.json`. Aborts if any anchor is missing, non-unique, or out of order. Self-checks the partition invariant (concat == source). | exits 1 on any anchor/partition failure |
| `build.mjs` | Reassembles `dist/flowchart.html` from the manifest. Each segment is passthrough now; Phase 2 swaps individual segments for generators (e.g. `data-questions` ← `render(questions.yaml)`) via the `GENERATORS` map. | exits 1 if a segment's on-disk sha ≠ manifest |
| `gate.mjs` | Asserts `dist/flowchart.html` equals `main:flowchart.html`. `--mode=byte` (default, stage 1) is sha256-exact and pinpoints the first diverging char on failure. `--mode=dom` (stub) lands with Phase 2 when generators reformat and byte-equality relaxes to DOM/behavior-equivalence. | exits 1 on any divergence |

**Why `main:flowchart.html` is the source, not the working copy.** The `v2` branch's `flowchart.html` is frozen and may lag `main`; the tools read the live artifact via `git show main:flowchart.html` so extraction always targets the source of truth. The live site only ever ships from `main`.

**Proven (2026-06-15):** 12-segment partition round-trips byte-exact (sha `b5cca2e5…`); the gate fails on a single corrupted byte (reporting the exact offset); `extract` aborts when an anchor is renamed. `build/` and `dist/` are git-ignored (regenerated on demand).

### How Phase 2 uses this

Extraction proceeds **one segment at a time**, gate green after each:
1. Pick a segment (e.g. `data-questions`).
2. Transform its verbatim text into structured source (`src/content/questions.yaml`) + a generator that reproduces the text **byte-for-byte** → gate stays byte-exact.
3. Only once the structured form is the source of truth, allow the generator to reformat and switch that comparison to `--mode=dom`.

This is the "lift one piece, prove round-trip, repeat" discipline — never a big-bang extraction.

## Diagnostic-schema extraction (Phase 2 — first content extraction)

Lifts the diagnostic out of the artifact and turns its `showIf` closures into declarative data — the crux of the rebuild (V2_REBUILD_PLAN.md §2/§3).

| Tool | Does |
|---|---|
| `src/core/predicates.mjs` | Declarative predicate evaluator: leaves `{field, op, value}` (eq/ne/in/nin/has/hasAny/hasAll/exists/truthy) + combinators `{all}`/`{any}`/`{not}`. Pure, serializable, statically analyzable (`predicateFields` → the field-dependency graph). 9 unit tests in `predicates.test.mjs` (`node --test src/core/predicates.test.mjs`). |
| `lib/showif-to-predicate.mjs` | Converts a v1 `showIf` arrow function → declarative predicate. STRICT — throws on any unrecognized shape, so nothing is silently mis-converted. |
| `extract-questions.mjs` | Evals the live `QUESTIONS` array from `main:flowchart.html`, converts every `showIf`, writes `src/content/questions.json` (7 sections, 53 questions, 21 predicates). `--check` validates without writing. |
| `verify-questions-equivalence.mjs` | **The Phase 2 round-trip gate.** Runs the live closures vs the declarative predicates over (1) an exhaustive per-predicate enumeration of referenced fields incl. `undefined` and every `incomeTypes` subset, and (2) a 200k deterministic random sample of the full 9-field space. Exits 1 on the first divergence (with the offending vector). |

**Proven (2026-06-15):** 4,200,292 comparisons, zero divergence — the declarative form is behavior-identical. Negative test passes: corrupting one predicate's value makes the harness exit 1 and print the divergent vectors. This is the "extract a structure, prove behavior-equivalence, repeat" loop the rebuild runs on.

## computePlan golden master (Phase 2 — the engine parity gate)

Characterize-before-refactor for the 660-line decision engine: capture v1 `computePlan`'s behavior across a broad answer-space NOW, so the v2 rule engine can be checked against it (V2_REBUILD_PLAN.md §2.3).

| Tool | Does |
|---|---|
| `lib/load-plan-engine.mjs` | Loads the LIVE `computePlan` from `main:flowchart.html` as a callable, isolated from the DOM (evals the pure hashKey…computePlan slice in a Function sandbox). `computePlan(answers) → {actions, skipped, tier1}`. The reference implementation. |
| `lib/plan-fingerprint.mjs` | `planLogic` = the behavior contract (ordered actions' title/stage/tags/tier1/friction/nodeKey/incomeType + skipped titles), **excluding prose** (reason/because move to content in v2). `logicHash` = its sha; `fullHash` = whole-output hash for v1-drift detection. |
| `gen-plan-fixtures.mjs` | Builds the corpus — 15 named archetypes (the 5 audit personas as households + common types) + a 3000-vector seeded-random sample over the 44 fields computePlan reads (domains derived from `questions.json`) — and captures each fixture's golden fingerprint. Self-contained (reads `main` + `questions.json`); fully deterministic. |
| `verify-plan-parity.mjs` | **The parity gate.** Re-runs the engine over the corpus, asserts every `logicHash` matches the golden (archetypes also deep-compared). Swap `ENGINE` to the v2 rule engine (one import) to make it the v2-vs-v1 gate. |

**Coverage:** the corpus exercises **89 distinct action/skip titles** vs 63 `add()` + 25 `skip()` branches in `computePlan` — essentially the whole engine. **Proven:** parity passes deterministically (3030 checks); negative test passes (corrupting one golden hash → exit 1).

**Fixtures:** `tests/fixtures/plan-golden-archetypes.json` (committed — 15 archetypes with full readable logic, the reviewable contract). `tests/fixtures/plan-golden.json` (git-ignored — full 3015-fixture corpus; regenerate with `gen-plan-fixtures.mjs`, deterministic).

## `validate-figures.mjs` (Phase 1.3 — figures data layer)

Build-time gate for [`src/data/figures.json`](../src/data/figures.json): enforces the 6-field vintage-stamp contract and **fails the build on any past-expiry stamp** — the structural fix for the indexed-figure drift the Phase 0 sprint hit twice. See [`src/data/README.md`](../src/data/README.md).

```
node tools/validate-figures.mjs                 # validate against today
node tools/validate-figures.mjs --today=2027-01-15   # prove the expiry gate fires
```

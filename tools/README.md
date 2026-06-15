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

## `validate-figures.mjs` (Phase 1.3 — figures data layer)

Build-time gate for [`src/data/figures.json`](../src/data/figures.json): enforces the 6-field vintage-stamp contract and **fails the build on any past-expiry stamp** — the structural fix for the indexed-figure drift the Phase 0 sprint hit twice. See [`src/data/README.md`](../src/data/README.md).

```
node tools/validate-figures.mjs                 # validate against today
node tools/validate-figures.mjs --today=2027-01-15   # prove the expiry gate fires
```

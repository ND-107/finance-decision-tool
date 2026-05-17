# finance-decision-tool — project rules

A single-file interactive personal-finance decision tool (`flowchart.html`), with a paired fact-check audit (`audit/build_audit_xlsx.py` → `audit/phase1_factcheck_audit.xlsx`). 328 tracked claims (CL001–CL328). Multi-phase build by personas; see `docs/HANDOFF.md` for full orientation.

## What this is

`flowchart.html` is the deliverable — ~6,000 lines, ~480KB, self-contained HTML/CSS/JS. 12 views, 35 sections, 21 calculators, 25-question diagnostic, decision engine producing personalized plans. Audience: a sophisticated investor. Tone: analytical, candid about uncertainty, direct disagreement where warranted.

## Working agreement

- **Prose over bullets in long-form responses.** Lists only for genuinely discrete items or when explicitly requested.
- **Technical depth expected.** Do not soft-pedal complexity.
- **Read HANDOFF.md before structural changes.** It encodes settled scope decisions; ask before reopening them.
- **Iterate in batches with clear stopping points.** Propose plan → confirm → execute → present → iterate. Don't dump 50-item changesets in one response.
- **Surface findings concisely in prose**, with per-phase summary when sweeping work.

## Architectural invariants — do not break

- **Single-file artifact.** Everything in `flowchart.html`. No external CSS/JS/CDN deps. Runnable by double-click.
- **Monte Carlo swap interface.** `getMCBackend()` returns `{simulate: historicalCyclesSimulate}` by default but reads `window.__customMCBackend` first. ND may plug in a personal MC system. Preserve the swap path — never inline `historicalCyclesSimulate` into call sites.
- **Diagnostic state in `state.answers`.** Personalized defaults flow through `getDefault(field)` + `applyDefaultIfFallback(inputId, field, fallback)` + `markUserTyped(inputId)`. New calculators with personalize-able fields follow this pattern.
- **Historical returns dataset.** `HIST_RETURNS` array (1928–2024 real returns, 0.5pp rounding) drives the historical-cycles simulator. Sourced from Shiller/Damodaran. Don't replace silently.
- **Model-limits notes.** `<p class="model-limits">` at the end of each calculator section identifies what the model doesn't capture. Distinct visual style (italic, muted, left-bordered). Required on any new calculator.
- **Math callouts.** `<div class="math-callout">` for sidebars / worked examples / why-this-matters within a section. Distinct from model-limits.
- **Cross-references.** Sections reference each other ("see Math §6 for asset location"); new content weaves into the network rather than restating context.

## Audit conventions

Every empirical claim has a `CLnnn` ID. The audit row is a 10-tuple in `audit/build_audit_xlsx.py` (`CLAIMS = [...]`):

`(id, location, claim_text, claim_type, position, status, tier, source, source_url, notes)`

- **claim_type**: `STATUTORY | MATH | CITATION | EMPIRICAL | UX | META | REGULATORY | CONVENTION`
- **position**: `CON` (consensus) | `SOFT` (soft consensus)
- **status**: `PASS | CORRECTED | PARTIAL | FAIL | PENDING | DEFERRED-PX.5`
- **tier**: `A` statute/code | `B` consensus | `C` empirical/contested | `D` heuristic/convention

**Modify the tuples in `build_audit_xlsx.py`; do not edit the xlsx directly.** Regenerate with `python3 audit/build_audit_xlsx.py` (writes `audit/phase1_factcheck_audit.xlsx`).

Current state (2026-05-16): 245 PASS, 78 CORRECTED, 1 PARTIAL, 3 FAIL, 1 DEFERRED (**CL161, SVG charts** — the active item).

## Verification

Run `./verify.sh` after substantive edits. It (1) parses `flowchart.html` with Python's HTML parser, (2) extracts the inline JS and runs `node --check` on it, (3) re-runs the audit builder to confirm the script is valid Python and the xlsx regenerates cleanly. **Always verify after JS edits.**

For visual changes, open `flowchart.html` in a browser and exercise the affected calculator. Type-checking and JS parsing verify code correctness, not feature correctness.

## Outstanding work (priority order)

1. **CL161 — inline SVG visualizations.** Math §1 compound interest (year-by-year stacked bar of principal vs accumulated growth); Math §5 sequence risk (two 30-year paths showing bad-sequence-early vs bad-sequence-late). Optional third: Math §7 historical-cycles (percentile fan chart of ending balances). SVG generated inline by JS, no library. Style matches existing visual language (muted palette, clean grid, sparing labels). After implementation, flip CL161 to CORRECTED and regenerate xlsx.
2. **Phase 6 — original 5 personas review.** Tax Attorney, fee-only fiduciary CFP, academic finance economist (Pfau/Bernstein lineage), behavioral economist (Lusardi/Shefrin/Thaler), consumer-finance advocate (Olen/Aliche). Each produces 8–10 findings on the cleared Phases 1–5 work. Surface batching decision to ND before starting.
3. **Phase 7 — advanced strategies.** EX1 catalog: 25 strategies across equity comp / real estate / family wealth / compound stack / decumulation upside / adjacent vehicles. Substantial build.
4. **Phase 6 again — post-Phase-7.** Same 5 personas on the expanded framework.

## Scope decisions already settled — do not reopen without asking

- MC: historical-cycles simulator with swap hook (DONE; preserve the interface).
- Asset location: 3-asset × 3-account matrix with waterfall optimizer (DONE).
- Personalized defaults from diagnostic state (DONE for ~15 calculators; extension is mechanical).
- Phase 5.5: Dave Ramsey, Gen-Z anxiety, DINK as standalone sections; BNPL and expanded dividend folded into existing content.
- P5B clinical items (CL321–CL328): fold-in to existing sections, not standalone.

## Files

- `flowchart.html` — the artifact.
- `audit/build_audit_xlsx.py` — audit source of truth.
- `audit/phase1_factcheck_audit.xlsx` — regenerated; gitignored.
- `docs/HANDOFF.md` — full orientation. Read before structural work.
- `docs/START_HERE.md` — launch prompt for fresh agents.
- `docs/conversation_history.md` — reference-only transcript of the chat sessions that produced everything above. Grep for CL IDs or phase names; don't read front-to-back.
- `verify.sh` — quick HTML + JS + audit parseability check.

## Session loop

Every `/save` writes to `obsidian-sync/sessions/YYYY-MM-DD-<slug>.md`. SessionStart hook prints recent CHANGELOG + git status + last session bridge. CL161 progress goes in CHANGELOG.md.

# Changelog

## 2026-05-16

- Project migrated from Claude.ai chat thread to Claude Code. Bundle (artifact, audit, docs, transcript) routed from vault `_Inbox/` → `~/code/finance-decision-tool/` after a stop in `finance-project/data/research/decision-tool/`.
- Light verification pass on consolidated sub-phase: 12 CORRECTED items spot-checked across all five phases (CL021, CL146, CL155, CL163, CL164, CL209, CL215, CL262, CL270, CL271, CL308, CL313). All present in artifact, audit and artifact in sync. Consolidated sub-phase declared done.
- **CL161 done.** Inline SVG charts added to three Math sections:
  - §1 compound interest: year-by-year stacked bar of contributions (taupe) and investment growth (gold), sampled to ~30 bars for long horizons.
  - §5 sequence risk: two 30-year balance paths (bad-sequence-early in red-brown, late in green) with starting-balance reference line.
  - §7 historical-cycles: percentile fan chart (p10–p90 outer band, p25–p75 inner band, p50 median line). `historicalCyclesSimulate` gained an optional `paths` field on its return — additive to the MC swap interface; external backends may omit it and the fan chart no-ops cleanly.
  Shared helpers (`chartFrame`, `niceCeil`, `fmtAxisMoney`, `renderSVG`) reuse the artifact's CSS custom properties so palette tracks the rest of the UI. Audit flipped CL161 → CORRECTED; status now 245 PASS / 79 CORRECTED / 1 PARTIAL / 3 FAIL / 0 DEFERRED.
- Next: propose Phase 6 — original 5 personas review of cleared Phases 1–5 work.

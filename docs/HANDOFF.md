# HANDOFF.md — Personal Finance Decision Tool Project

This document orients Claude Code (or any future collaborator) on a multi-phase project building an interactive personal finance decision tool for a sophisticated investor. Read this in full before touching any code. The companion `conversation_history.md` contains the complete dialogue history if you need context on specific decisions; this document is the practical orientation.

## What this project is

An interactive HTML artifact — a single self-contained file at `flowchart.html` — that serves as a diagnostic-driven personal finance decision tool. The user answers approximately 25 questions about their situation (age, income, tax bracket, employment type, life stage, etc.) and receives a prioritized plan calibrated to their answers, plus access to a full reference framework covering tax-advantaged accounts, math bedrock, spending strategies, portfolio construction (Bogleheads + MPT/CAPM theory), and current cultural moments in personal finance (FIRE, FinTok, retail trading, crypto, Die with Zero, Dave Ramsey orthodoxy, generational housing, Gen-Z anxiety, DINK patterns, etc.).

The artifact is paired with a fact-check audit (`phase1_factcheck_audit.xlsx`) generated from a Python script (`build_audit_xlsx.py`) that tracks every empirical claim, statutory citation, and methodological choice across the tool — currently 328 claims with status (PASS / CORRECTED / PARTIAL / FAIL / DEFERRED-PX.5), credibility tier (A: statute/code, B: consensus, C: empirical/contested, D: heuristic/convention), source citation, and action notes.

## Who the user is

The user is ND, a sophisticated investor with prior fusion-energy investment thesis work referenced in the conversation history. Communication preferences worth respecting:

Prose over bullets. ND prefers flowing paragraphs to bulleted lists. Use lists only for genuinely discrete enumerable items or when explicitly requested. Technical depth is expected; do not soft-pedal complexity or substitute simplifications for substance. Thesis-driven engagement: ND starts with a specific commodity or technology or framework angle, stress-tests it structurally, then branches outward. Comprehensive structured briefings are preferred as starting points before drilling into specifics. Direct disagreement when warranted; ND values intellectual honesty over agreeableness.

The framework throughout treats ND as the audience implicitly. Tone should be analytical, candid about uncertainty, and willing to engage with contested empirical questions directly rather than punting to "consult a professional."

## Current artifact state

`flowchart.html` is approximately 6,000 lines and ~400KB. It contains 12 views accessible via top navigation, 35 content sections across those views, and 21 interactive calculators, plus a 25-question diagnostic and a decision engine that produces personalized plans.

The 12 views, in navigation order:
1. **Welcome** — landing page introducing the tool
2. **Diagnostic** — 25-question questionnaire (6 sections)
3. **Plan** — personalized output for the user based on diagnostic answers
4. **Personal chart** — diagnostic-filtered decision tree
5. **Full chart** — complete reference decision tree, filterable by income type and bracket
6. **Math** — 7 sections covering compound interest, Rule of 72, savings rate, real vs nominal, sequence risk, asset location, and a historical-cycles retirement simulator (1928–2024 US data)
7. **Spending: essentials** — housing, transportation, healthcare, insurance
8. **Spending: lifestyle** — food, childcare, subscriptions, lifestyle creep
9. **Portfolio: Bogleheads** — three-fund philosophy, indexing, asset location, target-date funds, rebalancing
10. **Portfolio: theory** — MPT, CAPM, Fama-French, factor models, efficient frontier, Sharpe ratio
11. **Zeitgeist: investing** — FIRE variants, FinTok, retail trading, crypto
12. **Zeitgeist: lifestyle** — Die with Zero, anti-hustle, multi-generational households, Dave Ramsey orthodoxy, dividend investing subculture, Gen-Z financial anxiety, DINK patterns, behavioral synthesis closer (10 sections total)

## The phase plan

The project has been executed in phases. Status as of handoff:

**Phase 1 — Fact-check audit (complete).** Established the audit database structure. 129 initial claims classified with status, tier, source, action notes.

**Phase 2 — Math bedrock (complete).** Built the Math view with 6 sections plus calculators. Established the diagnostic-driven personal default pattern. P2A (academic finance economist) and P2B (CFP/Kitces practitioner) checkpoint personas reviewed; structural fixes applied; 14 items deferred to Phase 2.5 backlog (most have since been cleared).

**Phase 3 — Spending strategies (complete).** Built two views (Essentials and Lifestyle), 8 sections, 7 calculators. P3A (consumer-finance advocate) and P3B (Direct Primary Care physician) personas reviewed; 13 items deferred to Phase 3.5.

**Phase 4 — Portfolio (complete).** Built two views (Bogleheads and Theory), 8 sections, 3 calculators. P4A (practicing index fund portfolio manager) and P4B (empirical asset pricing researcher) personas reviewed; 13 items deferred to Phase 4.5.

**Phase 5 — Zeitgeist behaviors (complete).** Built two views (Investing and Lifestyle), originally 8 sections, 3 calculators. Expansionist EX2 pre-build review identified 5 additions for Phase 5.5 backlog (Dave Ramsey, expanded dividend, BNPL, Gen-Z anxiety, DINK). P5A (behavioral finance researcher) and P5B (financial therapist) checkpoint personas reviewed; 13 additional items deferred to Phase 5.5 total = 18 items.

**Consolidated sub-phase (substantially complete).** A 58-item combined backlog (14 P2.5 + 13 P3.5 + 13 P4.5 + 18 P5.5) scheduled to clear before the Phase 6 original-5 personas review. The current audit state (after the most recent rebuild) shows: 245 PASS, 78 CORRECTED, 1 PARTIAL, 3 FAIL, and only **1 item still DEFERRED** (CL161, SVG charts for compound interest and sequence risk visualizations). The artifact contains: the full historical-cycles simulator (CL155/CL158, addressed Monte Carlo decision); the 3-account × 3-asset location matrix calculator with waterfall optimizer (CL163, expanded from 2×2); personalized defaults from diagnostic with edit-protection (CL157, CL162); all 7 model-limits notes in the Math view (CL164); volatility drag and rising income callouts (CL151, CL152); the Dave Ramsey orthodoxy section (CL308); the Gen-Z financial anxiety section (CL311); the DINK financial pattern section (CL312); and all eight P5B clinical additions (CL321–CL328) marked as CORRECTED. **A light verification pass is recommended** to spot-check that the audit's CORRECTED claims match what's actually in the artifact — the audit was kept reasonably current but there's no harm in confirming.

**Phase 6 — Original 5 personas (pending).** Runs after backlog consolidation completes. Five personas: Tax Attorney (retirement plans / small business tax focus), fee-only fiduciary CFP (Kitces archetype), academic finance economist (Pfau/Bernstein lineage), behavioral economist (Lusardi/Shefrin/Thaler), consumer-finance advocate (Olen/Aliche). Reviews the cleared Phases 1–5 work.

**Phase 7 — Advanced strategies (pending).** From Expansionist EX1 catalog: 25 strategies across six themes — equity comp (§83(b), ISO/NSO/RSU, NUA, §1202 stacking); real estate (cost segregation + bonus depreciation, REPS, STR loophole, §1031 → DST → §721 UPREIT); family wealth (custodial Roth, family employment, 529 superfunding $95K/$190K, FLPs, IDGTs); compound stack (Cash Balance DB plan $200–300K, full §415 stack $400–500K); decumulation upside (0% LTCG harvesting under $96,700 MFJ, QCDs at 70.5+ $108K, state domicile arbitrage, dynasty trust states); adjacent vehicles (direct indexing, §1256 contracts, OZ funds, §831(b) micro-captives, SDIRAs).

**Phase 6 again — After Phase 7.** The original 5 personas run a second time on the post-Phase-7 framework.

## Architectural decisions and patterns established

These are conventions the artifact follows; new code should match.

**Single-file HTML artifact.** All HTML, CSS, and JavaScript in one file. No external dependencies beyond what runs in a standard browser. The artifact is self-contained and runnable by double-clicking.

**Diagnostic state in a global object.** `state.answers` holds the user's diagnostic responses. Each question has an `id` that becomes a key. Categorical answers (e.g., `state.answers.taxBracket === 'mid'`) are mapped to numeric defaults by `getDefault(field)` for calculator pre-fill.

**Personal default helpers.** `getDefault(field)` returns the user's mapped numeric value or `undefined` if no diagnostic data exists. `applyDefaultIfFallback(inputId, field, fallback)` applies it only when the input is at the hardcoded fallback or empty, and respects `userTyped` markings. `markUserTyped(inputId)` tracks edits. The pattern is established in `renderMath()` and extended to Zeitgeist render functions. New calculators with fields that could be personalized should follow this pattern.

**Monte Carlo swap interface.** `getMCBackend()` returns `{simulate: historicalCyclesSimulate}` by default but reads `window.__customMCBackend` first. To plug in a personal Monte Carlo system: `window.__customMCBackend = {simulate: yourFunction}` before the Math view renders. The interface contract: input `{pv, annualWithdrawal, stockAlloc, horizonYears, strategy}`, output `{cycles, successRate, percentiles, failures, totalCycles}`. ND has indicated they may plug in their personal MC system later — this hook is in place for that.

**Historical returns dataset.** `HIST_RETURNS` array embedded in the JS, covering 1928–2024 with stock and bond real returns (rounded to 0.5pp). Sourced from public Shiller / Damodaran datasets. The historical-cycles simulator uses rolling cohorts across this dataset.

**Audit conventions.** Each empirical claim gets a CL identifier (CL001, CL002, …, currently up to CL328). Audit entries have nine fields: (1) CL ID, (2) location (e.g., "Math:5" or "Zeit:Life:9"), (3) claim text, (4) claim type (STATUTORY / MATH / CITATION / EMPIRICAL / UX / META / REGULATORY / CONVENTION), (5) position (CON for consensus, SOFT for soft consensus), (6) status (PASS / CORRECTED / PARTIAL / FAIL / PENDING / DEFERRED-PX.5), (7) credibility tier (A / B / C / D), (8) source citation, (9) action notes / general notes. The Python builder script `build_audit_xlsx.py` generates the xlsx; modify the tuples in that file rather than the xlsx directly.

**Model-limits notes.** Each calculator section concludes with a `<p class="model-limits">` element identifying what the model doesn't capture — assumptions, simplifications, scope limits. Distinct visual style (italic, muted, left-bordered). Pattern established across all 7 Math sections.

**Math callouts.** `<div class="math-callout">` for sidebars, worked examples, "why this matters" explanations within a section. Distinct from model-limits; callouts add depth, model-limits acknowledge limits.

**Cross-references.** Sections frequently reference each other (e.g., "see Math §6 for asset location" or "the Zeitgeist Investing §1 FIRE coverage develops this"). This is the framework's accumulated guidance pattern; new content should weave into existing cross-references rather than restating context.

## The persona-driven review process

After each phase build, two **checkpoint personas** review the new content from domain-specific perspectives. The personas surface (a) structural issues to fix immediately and (b) deferred items for the next sub-phase backlog. Examples:

- Phase 2: P2A academic economist, P2B CFP/Kitces practitioner
- Phase 3: P3A consumer-finance advocate, P3B Direct Primary Care physician
- Phase 4: P4A practicing index fund portfolio manager, P4B empirical asset pricing researcher
- Phase 5: P5A behavioral finance researcher, P5B financial therapist

Each persona produces 8–10 specific findings with claim attribution, often correcting bibliographic errors (e.g., the Welch 2022 misattribution, the Fama-French 1992 vs 1993 distinction, the Jegadeesh-Titman vs Carhart momentum attribution) or adding nuance (e.g., Vanguard's "through retirement" glide path, the 5/25 rebalancing rule clarification).

A separate **Expansionist persona** reviews phase plans for what's *missing* rather than what's there. EX1 produced the 25-item Phase 7 advanced-strategies catalog. EX2 produced the 5-item pre-build addition list for Phase 5 (Dave Ramsey, dividend expansion, BNPL, Gen-Z anxiety, DINK).

The **original 5 personas** are reserved for Phase 6 (and Phase 6-again after Phase 7): Tax Attorney, fee-only fiduciary CFP, academic finance economist, behavioral economist, consumer-finance advocate. These review the cleared aggregate, not individual phase work.

## Scope decisions confirmed by the user

These have been explicitly approved and should not be reopened:

1. **Monte Carlo simulator: simplified historical-cycles approach (DONE).** Build the historical-cycles simulator rather than full Monte Carlo. Design with swappable backend so ND can plug in their personal MC system later. Hook is in place via `getMCBackend()`.

2. **Full asset location matrix expansion (DONE).** Expand from 2-asset × 2-account to 3-asset × 3-account with waterfall optimizer.

3. **Personalized defaults from diagnostic (DONE).** Wire diagnostic state into ~15 calculators throughout the framework. Pattern established; extension to more calculators is mechanical.

4. **Phase 5.5 new sections — 3 standalone, 2 folded in.** Dave Ramsey (full section), Gen-Z anxiety (full section), DINK (full section) all built. BNPL folded into existing content (or to be folded). Expanded dividend investing folded into existing Zeitgeist FinTok content (or to be folded).

5. **P5B clinical items (CL321–CL328, 8 items) — add-to-existing-section, not standalone.** Post-FIRE depression, soft saving phenomenology, DWZ cognitive decline, burnout-as-financial-event, boomerang relational structure, savings-aversion clinical pattern, DWZ U-shape spending, family-system framing. These should be inline additions to the appropriate existing sections, not new sections.

## Outstanding work, in priority order

Based on the most recent audit state:

**Light verification pass (first task).** Spot-check that the audit's CORRECTED claims match what's actually in the artifact. The audit shows 78 CORRECTED items; spot-check perhaps a dozen of them across phases to confirm the audit and artifact are in sync. If everything checks out, the consolidated sub-phase is effectively done. If you find discrepancies, fix them and proceed. This shouldn't take long — it's verification, not deep reconciliation.

**CL161 — SVG charts (the one genuine remaining backlog item).** Add inline SVG visualizations to two Math view calculators: (a) compound interest §1, year-by-year stacked bar of principal vs growth contribution, and (b) sequence risk §5, two paths over the 30-year horizon showing the bad-sequence-early vs bad-sequence-late difference. Optional third visualization: §7 historical-cycles, a percentile fan chart of ending balances or a cohort success/failure visualization. SVG generated inline by JS, no external library. Style should match the existing visual language (muted palette, clean grid, sparing labels).

**Phase 6 — original 5 personas review.** Once verification and CL161 are done, run the five original personas on the cleared Phases 1–5 work. Tax Attorney (retirement plans / small business tax focus), fee-only fiduciary CFP (Kitces archetype), academic finance economist (Pfau/Bernstein lineage), behavioral economist (Lusardi/Shefrin/Thaler), consumer-finance advocate (Olen/Aliche). Each produces 8–10 findings; structural fixes get applied immediately, deferred items go into the Phase 6 backlog.

**Phase 7 — advanced strategies.** From Expansionist EX1 catalog: 25 strategies across six themes — equity comp (§83(b), ISO/NSO/RSU, NUA, §1202 stacking); real estate (cost segregation + bonus depreciation, REPS, STR loophole, §1031 → DST → §721 UPREIT); family wealth (custodial Roth, family employment, 529 superfunding $95K/$190K, FLPs, IDGTs); compound stack (Cash Balance DB plan $200–300K, full §415 stack $400–500K); decumulation upside (0% LTCG harvesting under $96,700 MFJ, QCDs at 70.5+ $108K, state domicile arbitrage, dynasty trust states); adjacent vehicles (direct indexing, §1256 contracts, OZ funds, §831(b) micro-captives, SDIRAs). Substantial new content build. Will likely produce two or three new views.

**Phase 6 again — post-Phase-7 personas review.** The original 5 review the fully-expanded framework after Phase 7 completes.

## Files in this handoff

- `flowchart.html` — the artifact itself. Single file, runnable in any browser.
- `build_audit_xlsx.py` — Python script that generates the audit xlsx. Modify the tuples in this file rather than the xlsx directly; the xlsx is regenerated by running this script.
- `phase1_factcheck_audit.xlsx` — current audit database (will be stale relative to artifact until reconciliation).
- `conversation_history.md` — compiled markdown of all session conversations from the project. Use for context on specific decisions if needed.
- `HANDOFF.md` — this document.
- `START_HERE.md` — the launch prompt to use when beginning work in Claude Code.

## Notes on the conversation history file

`conversation_history.md` is a compilation of six session transcripts spanning May 15–16, 2026. It's approximately 875KB. The early sessions established the project; later sessions refined it. The thinking blocks (`<details>` tags) are preserved in the markdown for context but are collapsed by default. If you need to understand the rationale behind a specific decision, search the conversation history for the relevant CL ID, phase name, or technical term.

The most relevant sessions for current work are the last two (Sessions 5 and 6, May 16 from 20:25 onward), which cover the Phase 3–5 build, the checkpoint personas, the consolidated sub-phase planning, and most of the actual consolidation work. The reconciliation pass should orient primarily off these sessions.

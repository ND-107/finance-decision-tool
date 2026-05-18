# HANDOFF.md — Personal Finance Decision Tool Project

This document orients Claude Code (or any future collaborator) on a multi-phase project building an interactive personal finance decision tool for a sophisticated investor. Read this in full before touching any code. The companion `conversation_history.md` contains the complete dialogue history if you need context on specific decisions; this document is the practical orientation.

## What this project is

An interactive HTML artifact — a single self-contained file at `flowchart.html` — that serves as a diagnostic-driven personal finance decision tool. The user answers about 27 questions about their situation (age, income, tax bracket, employment type, life stage, equity-comp exposure, rental-real-estate exposure, federal-student-loan plan, etc.) and receives a prioritized plan calibrated to their answers, plus access to a full reference framework covering tax-advantaged accounts, math bedrock, spending strategies, portfolio construction (Bogleheads + MPT/CAPM/factor-model theory), current cultural moments in personal finance (FIRE, FinTok, retail trading, crypto, Die with Zero, Dave Ramsey orthodoxy, Gen-Z anxiety, DINK patterns, etc.), and a 13th-view advanced-strategies catalog (equity comp, real estate, family wealth, compound stack, decumulation upside, adjacent vehicles, IDR landscape, fiduciary-vs-suitability structural critique).

The artifact is paired with a fact-check audit (`audit/phase1_factcheck_audit.xlsx`) generated from a Python script (`audit/build_audit_xlsx.py`) that tracks every empirical claim, statutory citation, and methodological choice across the tool. **Current audit: 245 PASS / 202 CORRECTED / 0 DEFERRED / 0 FAIL across 447 total claims.** Every audited claim is either verified or has shipped corrections; the audit is closed.

## Who the user is

The user is ND, a sophisticated investor with prior fusion-energy investment thesis work referenced in the conversation history. Communication preferences worth respecting:

Prose over bullets. ND prefers flowing paragraphs to bulleted lists. Use lists only for genuinely discrete enumerable items or when explicitly requested. Technical depth is expected; do not soft-pedal complexity or substitute simplifications for substance. Thesis-driven engagement: ND starts with a specific commodity or technology or framework angle, stress-tests it structurally, then branches outward. Comprehensive structured briefings are preferred as starting points before drilling into specifics. Direct disagreement when warranted; ND values intellectual honesty over agreeableness.

The framework throughout treats ND as the audience implicitly. Tone should be analytical, candid about uncertainty, and willing to engage with contested empirical questions directly rather than punting to "consult a professional."

## Current artifact state

`flowchart.html` is approximately 7,700 lines and ~620KB. It contains 13 views accessible via top navigation, roughly 45 content sections across those views, 23+ interactive calculators, a 27-question diagnostic, and a decision engine that produces personalized plans with friction-aware Tier-1 anchoring.

The 13 views, in navigation order:

1. **Welcome** — landing page introducing the tool; includes structural-conditions context paragraph for under-served audiences and a literacy-vs-behavior expectations frame
2. **Diagnostic** — 27-question questionnaire (6 sections including new `rentalRealEstate` and `currentIDRPlan` questions)
3. **Plan** — personalized output for the user based on diagnostic answers; structural-conditions block surfaces for low-bracket users
4. **Personal chart** — diagnostic-filtered decision tree
5. **Full chart** — complete reference decision tree, filterable by income type and bracket
6. **Math** — 7 sections covering compound interest, Rule of 72, savings rate, real vs nominal, sequence risk, asset location, and a historical-cycles retirement simulator (1928–2025 US data, Shiller unrounded series, with SS/pension/annuity overlay and CAPE-regime input)
7. **Spending: essentials** — housing, transportation, healthcare, insurance
8. **Spending: lifestyle** — food, childcare, subscriptions, lifestyle creep
9. **Portfolio: Bogleheads** — three-fund philosophy, indexing, asset location, target-date funds, rebalancing
10. **Portfolio: theory** — MPT, CAPM (with post-Roll / Cochrane 2011 reframing), Fama-French, factor models, efficient frontier, Sharpe ratio
11. **Zeitgeist: investing** — FIRE variants, FinTok, retail trading, crypto, Dave Ramsey
12. **Zeitgeist: lifestyle** — Die with Zero, anti-hustle, multi-generational households, dividend investing subculture, Gen-Z financial anxiety, DINK patterns, behavioral synthesis closer
13. **Advanced strategies** (Phase 7) — 8 themes: equity comp, family wealth, compound stack, real estate, decumulation upside, adjacent vehicles, IDR landscape (CL396), fiduciary-vs-suitability structural critique (CL397)

## The phase plan

The project has been executed in phases. Status as of handoff:

**Phases 1 through 5 (complete).** Built the foundational structure across math bedrock (Phase 2), spending strategies (Phase 3), portfolio construction (Phase 4), and zeitgeist behaviors (Phase 5). Each phase reviewed by two checkpoint personas; structural fixes applied immediately and deferred items batched into the consolidated sub-phase backlog.

**Consolidated sub-phase (complete).** A 58-item combined backlog (14 P2.5 + 13 P3.5 + 13 P4.5 + 18 P5.5) cleared before the Phase 6 original-5 personas review. CL161 SVG charts (compound interest stacked bar, sequence risk dual paths, historical-cycles fan chart) shipped here.

**Phase 6 (complete).** Original 5 personas reviewed the cleared Phases 1–5 work — Tax Attorney, fee-only fiduciary CFP, academic finance economist, behavioral economist, consumer-finance advocate. 50 findings; 40 structural fixes applied across 17 commits. Phase 6 produced significant additions: the §83(b) 30-day bridge action (CL366), the IRMAA-cliff Roth-conversion-ladder framework (CL362), the SS § 7 simulator + CL329 SS/pension overlay, Lusardi-Mitchell Big Three literacy probe + Plan-view literacy coda (CL381), Madrian-Shea friction-aware Tier-1 anchor (CL380 + CL388), Bessembinder skewness paragraph (CL375), McQuarrie / Pfau-international SWR challenge (CL370), Welcome-view structural-conditions block (CL390), Spending-Essentials HDHP liquidity gate (CL391), Saver's Credit reference content (CL395), federal-student-loan servicer-audit Diagnostic + Plan action (CL396), and the fiduciary-vs-suitability Welcome-footer test (CL397).

**P6.5 backlog sprint (complete).** Three sprints (1A/1B/1C, 2, 3) cleared the highest-leverage Phase-6 deferred items including the SS-overlay simulator extension (CL329), the spousal-split-aware SS-claiming Plan action, the capacity-limited glide-path action, the parent-care provisioning action, the integrated AL+ladder calculator, the muni TEY mini-calculator (CL367), and the CAPE-input simulator extension (CL370/CL373).

**Phase 7 (complete).** Built the 13th view ("Advanced strategies") across three sub-phases. A1 shipped equity-comp + family-wealth + compound-stack themes; A2 shipped real-estate + decumulation-upside (incorporating the CL369 state-domicile playbook); A3 shipped adjacent-vehicles + the full CL396 IDR landscape content + the full CL397 fiduciary structural critique. View covers all 25 EX1 catalog strategies across six themes plus two consumer-protection themes.

**Phase 7+ data verification sprint (complete).** Resolved the 4 PARTIAL items deferred during Phase 7: HYSA current-rate verification (CL079, Brave search 2026-05-17), QBI threshold dollars (CL360, Rev. Proc. 2025-32 web lookup), Shiller unrounded HIST_RETURNS 1928–2025 (CL379, Firecrawl-discovered CDN URL), and the CAPE-channel resolution of CL370.

**Phase 6-again (complete).** Same three-session pattern as Phase 6, this time on the post-Phase-7 framework. Session 1 (Tax Atty + CFP) produced 24 findings, 17 structural fixes including the biggest single change — CL428 wired four new diagnostic-triggered Plan-view actions routing high-bracket SE / dependents / CA-with-liquidity-event / $2M+-net-worth users into the appropriate AdvStrat sections. Session 2 (Academic + Behavioral) produced 24 findings, 13 structural fixes including the hardest error caught (CL429 Solo 401(k) 25/20% formula inversion) and the Saver's Credit Plan-action wiring (CL441). Session 3 (Consumer-finance advocate) produced 12 findings, 8 structural fixes — the framework's biggest distributional gap closure with EITC + ACA-PTC + overdraft opt-out Plan actions for low-bracket users, AdvStrat §4 audience-fit framing, §6 §831(b) sales-channel warning, §8 consumer-remedies bullet (CFPB / state AG / NASAA / NACA / PIABA / NCLC), and the CL455 structural-conditions surfacing in renderPlanSynthesis.

**Phase 7.5 backlog-clearing sprint (complete).** All 14 DEFERRED-P7.5 items from Phase 6-again resolved across three batches. Batch 1 (10 quick depth-adds): RSU §83(b) statutory framing, NY 184-day precision + transit-passenger exception, QBI non-SSTB W-2 wage + UBIA limitation, STR recapture-math callout reordering, HYSA Fed-funds floor-rate expectation, Bengen→McQuarrie forward-pointer, Bessembinder index-membership caveat, Cochrane 2011 Discount Rates reframing, Davidoff-Brown-Diamond 2005 annuity puzzle, Welcome literacy-vs-behavior intro. Batch 2: rental-real-estate diagnostic Q + defensive-routing Plan action. Batch 3a: SAVE-forbearance dedicated callout + currentIDRPlan diagnostic Q + critical Plan action. Batch 3b: consolidated safety-net surface Plan action (SNAP / Medicaid expansion / Lifeline / LIHEAP).

**Final closure pass (complete).** Both remaining FAILs (CL056 QBI SSTB labeling, CL102 employer-match Roth treatment) flipped to CORRECTED — the underlying corrections had shipped progressively across Phase 6, Phase 6-again, and Phase 7.5 but the original FAIL rows kept their historical status. Audit is closed.

## Architectural decisions and patterns established

These are conventions the artifact follows; new code should match.

**Single-file HTML artifact.** All HTML, CSS, and JavaScript in one file. No external dependencies beyond what runs in a standard browser. The artifact is self-contained and runnable by double-clicking.

**Diagnostic state in a global object.** `state.answers` holds the user's diagnostic responses. Each question has an `id` that becomes a key. Categorical answers (e.g., `state.answers.taxBracket === 'mid'`) are mapped to numeric defaults by `getDefault(field)` for calculator pre-fill.

**Personal default helpers.** `getDefault(field)` returns the user's mapped numeric value or `undefined` if no diagnostic data exists. `applyDefaultIfFallback(inputId, field, fallback)` applies it only when the input is at the hardcoded fallback or empty, and respects `userTyped` markings. `markUserTyped(inputId)` tracks edits. New calculators with fields that could be personalized should follow this pattern.

**Monte Carlo swap interface.** `getMCBackend()` returns `{simulate: historicalCyclesSimulate}` by default but reads `window.__customMCBackend` first. To plug in a personal Monte Carlo system: `window.__customMCBackend = {simulate: yourFunction}` before the Math view renders. Interface contract: input `{pv, annualWithdrawal, stockAlloc, horizonYears, strategy, streams?, capeAdjustment?}`, output `{cycles, successRate, percentiles, failures, totalCycles, paths?}`. The optional `streams` field (CL329) carries the SS/pension/annuity overlay; the optional `capeAdjustment` field (CL370/CL373) carries the valuation-regime stock-return shift; the optional `paths` field in output drives the SVG fan chart. External backends can implement or ignore each.

**Historical returns dataset.** `HIST_RETURNS` array embedded in the JS, covering 1928–2025 with stock and bond real returns. **Unrounded** values from Shiller's `ie_data.xls` — stock series from the Real Total Return Price column (S&P 500 with dividends reinvested, CPI-adjusted), bond series from the Real Total Bond Returns column (10-year US Treasury, Shiller's constructed GS10 constant-maturity total-return series). Retrieved 2026-05-17 (CL379). The previous rounded series was replaced; the methodology-change empirical impact (aggregate success rates shift 1–5pp; worst-cohort outcomes shift 5–15pp) is documented in the §7 model-limits note.

**Audit conventions.** Each empirical claim gets a CL identifier (CL001, CL002, …, currently up to CL471). Audit entries have nine fields: (1) CL ID, (2) location (e.g., "Math:5" or "AdvStrat:6"), (3) claim text, (4) claim type (STATUTORY / MATH / CITATION / EMPIRICAL / UX / META / REGULATORY / CONVENTION / TAX-FIGURE), (5) position (CON for consensus, SOFT for soft consensus), (6) status (PASS / CORRECTED / FAIL — historical PARTIAL and DEFERRED-PX.5 statuses are now empty), (7) credibility tier (A / B / C / D), (8) source citation, (9) action notes / general notes. The Python builder script `audit/build_audit_xlsx.py` generates the xlsx; modify the tuples in that file rather than the xlsx directly.

**Model-limits notes.** Each calculator section concludes with a `<p class="model-limits">` element identifying what the model doesn't capture — assumptions, simplifications, scope limits. Distinct visual style (italic, muted, left-bordered).

**Math callouts.** `<div class="math-callout">` for sidebars, worked examples, "why this matters" explanations within a section. Distinct from model-limits; callouts add depth, model-limits acknowledge limits.

**Plan→AdvStrat routing.** Plan-view actions can fire on diagnostic signals and route users into the relevant Advanced Strategies section via the action's `reason` text. The four CL428 routing actions (high-bracket SE → §3 compound stack; high-bracket + dependents → §2 family wealth; high-bracket CA + liquidity event → §5 state domicile; high-bracket + $2M+ NW → §6 adjacent vehicles) are the template; new Phase-7-style content should ship a paired Plan action routing qualified users into it rather than relying on nav-bar discovery alone.

**Friction-aware Tier-1 anchor.** `computePlan()` infers friction from action title via the `FRICTION_RULES` regex table (`low` / `med` / `high`), then `inferFriction()` tags each action. Tier 1 = up to 3 critical-tagged actions ranked friction-asc, surfaced as "Start here" above the stage groups. When adding a new Plan action with a non-default title, add an entry to `FRICTION_RULES` so the action sequences correctly — the default fallback is `low`, which misclassifies any non-trivial action.

**Defensive vs recommended routing.** For high-IRS-scrutiny or commission-channel-heavy strategies (AdvStrat §4 STR/REPS/cost-seg, §6 §831(b) micro-captives, §6 OZ funds, §6 SDIRAs), the framework's posture is *defensive reading* — Plan actions route users into the audience-fit + sales-channel-warning content, not into engagement with the strategy. CL469 (rental real estate) is the canonical example: the action title is "Before any cost-seg-firm sales call: read AdvStrat §4 + §8 first (defensive routing)" and the reason walks the user through warnings, not execution steps. New Plan actions touching commission-driven channels should follow this pattern.

**Honest-default skip framing.** AdvStrat-routing Plan actions for items where most-of-trigger-population shouldn't engage (CB-DB plan, family wealth specialist items, adjacent vehicles) lead with "Most households at your band should NOT pursue X" framing per CL438. Converts the action from optimization-FOMO into self-selection filter. Match this when adding new high-bar Plan actions.

**Cross-references.** Sections frequently reference each other (e.g., "see Math §6 for asset location" or "the Zeitgeist Investing §1 FIRE coverage develops this"). This is the framework's accumulated guidance pattern; new content should weave into existing cross-references rather than restating context.

## The persona-driven review process

After each phase build, two **checkpoint personas** review the new content from domain-specific perspectives. The personas surface (a) structural issues to fix immediately and (b) deferred items for the next sub-phase backlog. Examples:

- Phase 2: P2A academic economist, P2B CFP/Kitces practitioner
- Phase 3: P3A consumer-finance advocate, P3B Direct Primary Care physician
- Phase 4: P4A practicing index fund portfolio manager, P4B empirical asset pricing researcher
- Phase 5: P5A behavioral finance researcher, P5B financial therapist

A separate **Expansionist persona** reviews phase plans for what's *missing* rather than what's there. EX1 produced the 25-item Phase 7 advanced-strategies catalog. EX2 produced the 5-item pre-build addition list for Phase 5 (Dave Ramsey, dividend expansion, BNPL, Gen-Z anxiety, DINK).

The **original 5 personas** — Tax Attorney (retirement plans / small business tax), fee-only fiduciary CFP (Kitces archetype), academic finance economist (Pfau/Bernstein lineage), behavioral economist (Lusardi/Shefrin/Thaler), consumer-finance advocate (Olen/Aliche) — review the cleared aggregate, not individual phase work. They were applied twice: Phase 6 on cleared Phases 1–5; Phase 6-again on the post-Phase-7 framework. The Phase 6-again pass used a three-session structure (Session 1: Tax + CFP; Session 2: Academic + Behavioral; Session 3: Consumer-advocate solo) with parallel-subagent execution for each session's paired personas.

## Audit status: closed

Every audited claim is either PASS or CORRECTED. There are no DEFERRED items and no FAIL items. The most recent CL ID is CL471 (Phase 7.5 safety-net surface block). If new content ships, it should carry new CL IDs starting at CL472.

## Verification before commits

`verify.sh` at the project root runs three checks: HTML parses, inline JS passes `node --check`, audit builder regenerates the xlsx. Run it before every commit. Uses `.venv/bin/python3` for openpyxl access; if the venv is missing, recreate with `python3 -m venv .venv && .venv/bin/pip install openpyxl xlrd`.

## Roadmap

The framework is in a "done" state in a way most projects never reach. Nothing on this roadmap is required; these are optional extensions if the project grows again.

**Phase 8 — depth reference sections for the new low-bracket Plan actions.** The Phase 7.5 EITC (CL448), ACA-PTC (CL449), overdraft opt-out (CL450), and safety-net surface (CL457/CL471) actions are well-framed but the substance lives entirely in each action's `reason` field rather than in a dedicated reference view section the way AdvStrat §7 anchors the PSLF action. A symmetrical low-bracket reference layer would: (a) add depth sections for each (mechanics, eligibility detail with state variation, application-flow walkthrough, common rejection patterns and how to address them); (b) consider whether to host them as a new top-level view ("Safety net & income-support") or as sub-sections within Spending: Essentials and W2:8.x. The audience-symmetry argument is strong — high-bracket users get a dedicated 13th view for advanced strategies, low-bracket users get one-line Plan actions pointing to external portals. Honest framework treatment is comparable depth on both sides. Estimated scope: 2–3 sub-sessions of build + a checkpoint persona pass (the consumer-finance advocate would be the natural reviewer).

**Data-engineering pass — DMS 23-country international dataset.** CL370 international-data toggle currently uses the CAPE-channel proxy (flat pp-shift on first-10-year stock returns per Pfau 2012) rather than actual Dimson-Marsh-Staunton 23-country annual returns. Replacing the proxy would: (a) require licensing the DMS dataset (Credit Suisse / UBS Global Investment Returns Yearbook, currently ~$15K/year for the full annual update but the 2023 historical excerpt is freely available in their published yearbook PDF); (b) extend `HIST_RETURNS` with country-specific arrays and add a country-selector input to the simulator; (c) update the McQuarrie/Pfau-international callout to reflect actual rather than proxied behavior; (d) document the licensing in the model-limits note. Done well, this materially upgrades the §7 simulator from US-only-with-international-haircut to genuinely international. Done poorly (loose attribution, weak dataset documentation), it reintroduces audit risk. Defer until/unless the DMS license is in hand.

**Personal Monte Carlo backend integration.** The MC swap interface (`getMCBackend()`, `window.__customMCBackend`) is in place but nothing's plugged into it yet. ND has indicated they may connect their personal MC system later. When that happens: the interface contract is documented above and in the §7 model-limits note; the personal backend needs to implement `{simulate: yourFunction}` matching the input/output schema; optional `streams` and `capeAdjustment` input fields can be implemented or ignored (ignoring degrades to portfolio-only behavior gracefully); optional `paths` output field drives the SVG fan chart (ignoring just skips the chart). If the personal MC adds capabilities the historical-cycles backend lacks (Monte Carlo draws from fitted return distributions, fat-tail modeling, factor-correlated multi-asset simulation, regime-switching), document them in a comment block near the swap point so the framework's own model-limits notes can stay honest about what's being used.

## Files in this handoff

- `flowchart.html` — the artifact itself. Single file, runnable in any browser.
- `audit/build_audit_xlsx.py` — Python script that generates the audit xlsx. Modify the tuples in this file rather than the xlsx directly; the xlsx is regenerated by running `verify.sh`.
- `audit/phase1_factcheck_audit.xlsx` — current audit database. Always in sync with the artifact post-`verify.sh`.
- `verify.sh` — pre-commit verification (HTML parse + JS check + audit regen). Run before every commit.
- `docs/conversation_history.md` — compiled markdown of the original Claude.ai dialogue history (pre-migration, May 15–16, 2026). Useful for archaeological lookups on specific decisions; no longer being updated.
- `docs/HANDOFF.md` — this document.
- `docs/START_HERE.md` — the launch prompt to use when beginning work in Claude Code.
- `CHANGELOG.md` — chronological log of every commit-level change since the migration to Claude Code. Authoritative source for "what happened when."

## Notes on the conversation history file

`docs/conversation_history.md` is a compilation of six session transcripts from May 15–16, 2026 (~875KB), pre-dating the migration to Claude Code. It covers the original Phase 1–5 build through the consolidated sub-phase planning. For any work post-migration (Phase 6 onward), the authoritative record is the git log + CHANGELOG.md, not this file. The thinking blocks (`<details>` tags) are preserved but collapsed by default. Use this file for archaeological lookups on specific decisions from the original build; use git log + CHANGELOG for everything post-2026-05-16.

# INVENTORY.md — Feature / Function / Concept / Source / Output inventory

_Generated 2026-06-18. A complete inventory of the finance-decision-tool across five dimensions: features, functions (the engine), concepts, sources, and outputs._

## Orientation — "it" is two things right now

The **live deliverable** is `flowchart.html` (v1 monolith — what's deployed at the GitHub Pages URL). Alongside it is a **v2 modular rebuild** under `src/` that is **not yet** the shipped artifact. v2 reproduces v1's plan logic byte-for-byte (parity-gated) **and adds four capabilities v1 never had** (priority re-ranking, statutory deadlines + calendar export, a completion loop, sensitivity analysis) — but has **not yet ported two v1 features** (the plan-synthesis paragraphs and the literacy-aware coda). Items below are flagged v1-only / v2-only where they differ.

**Verified headline counts** (the README's are partly stale): **13 views · ~46 sections · 23 calculators · 93 decision-tree nodes · 53 diagnostic questions · 458 audited claims.**

---

## 1 · FEATURES

### 1a. Views (13 — 12 nav tabs; Welcome is tab-less)

| # | View | Purpose |
|---|------|---------|
| 1 | Welcome | Landing + scope/calibration disclaimer; launches the diagnostic |
| 2 | Diagnostic ("Edit answers") | The 53-question intake (7 sections, progress bar) |
| 3 | Your plan | The personalized, prioritized action plan |
| 4 | Personalized chart | Full framework filtered to you; inapplicable steps faded with a reason |
| 5 | The math | 7 quantitative-bedrock sections |
| 6 | Spending: essentials | Housing · transport · healthcare · insurance |
| 7 | Spending: lifestyle | Food · childcare · subscriptions · lifestyle creep |
| 8 | Portfolio: Bogleheads | Indexing / three-fund practice |
| 9 | Portfolio: theory | MPT · CAPM · factor models |
| 10 | Zeitgeist: investing | FIRE · FinTok · retail trading · crypto · Ramsey · dividends |
| 11 | Zeitgeist: lifestyle | Die With Zero · anti-hustle · Gen-Z · DINK · synthesis |
| 12 | Advanced strategies | Phase-7 playbook (equity comp, RE, family wealth, decumulation…) |
| 13 | Full framework | The complete decision tree across all income types |

### 1b. The diagnostic (53 questions, 7 sections, 21 `showIf` gates)

A **Core-8** subset (`incomeTypes, filingStatus, ageBracket, taxBracket, emergencyFund, highInterestDebt, healthInsurance, employerMatch`) gates the first provisional plan; the rest refine it. ~30–50 questions render depending on situation (hence the README's "27").

1. **About you (8):** incomeTypes · filingStatus · ageBracket · state · yearsToRetirement · spousalIncomeSplit · riskCapacity · riskCapacityRevealed
2. **Income & taxes (4):** taxBracket · incomeStability · quarterlyTaxes · restrictedStockRecent
3. **Foundation (14):** litInterest · litInflation · litDiversification · litDebt · budgetTracking · emergencyFund · healthInsurance · highInterestDebt · moderateDebt · federalStudentLoans · pslfEligible · studentLoanAudited · currentIDRPlan · rothLadderCandidate
4. **Benefits & coverage (7):** employerMatch · matchCaptured · autoEscalation · planLowestER · hdhpEligible · hsaMaxed · ltdInPlace
5. **Retirement progress (4):** iraMaxed · tradIraBalance · k401Maxed · sePlan · sePlanMaxed
6. **Family & assets (12):** dependents · termLifeInPlace · childrenEducation · estateDocs · netWorth · rentalRealEstate · parentCare · annualExpenses · essentialFraction · spousalAlignSaving · spousalAlignRetirement · spousalAlignLegacy
7. **Business specifics (3, gated to SE):** entityStructure · businessInsurance · exitTimeline

> ⚠️ The 4 financial-literacy probes (Q13–16) are still collected but **consumed by nothing in v2** — they fed v1's literacy coda, which hasn't been ported. Live dead-inputs.

### 1c. The decision tree (93 nodes · 11 phases · 3 income contexts)

A linear priority **waterfall** (not a branching graph); the only branch is the income-context choice. Phases (shared): Foundation → Essentials → Initial Safety → Free Money (match) → High-Interest Debt → Full Emergency Fund → Tax-Advantaged Core → Goals & Moderate Debt → Maximize Tax-Advantaged Space → Advanced Optimization → Decumulation.

**W2 (28):** `0.1` budget · `0.2` net worth → `1.1` housing/food/utilities · `1.2` transport · `1.3` health insurance · `1.4` min debt payments → `2.1` $1k starter EF · `2.2` cut non-essentials · `2.3` verify insurance → `3.1` capture full employer match → `4.1` kill >6–7% debt → `5.1` 3–6mo EF → `6.1` max HSA · `6.2` max IRA · `6.3` term/disability/umbrella → `7.1` near-term goals · `7.2` moderate debt → `8.1` max 401(k) deferral → `9.1` mega-backdoor Roth · `9.2` taxable brokerage · `9.3` TLH · `9.4` 529 · `9.5` I-Bonds/TIPS → `10.1` Roth-conversion ladder · `10.2` withdrawal sequencing/4% · `10.3` SS claiming · `10.4` LTC · `10.5` QCDs

**Contractor (29):** adds business/personal separation, bookkeeping, **quarterly estimated taxes** (Foundation); self-employed health-insurance deduction; **Solo 401(k) vs SEP vs SIMPLE** in place of a match; business operating reserve; **§199A QBI**; **S-corp election analysis**; business sale/wind-down lead in decumulation.

**Business owner (36):** **entity choice (LLC/S/C-corp)**, GAAP bookkeeping, quarterly CPA; reasonable-salary; group health; key-person + buy-sell insurance; **defined-benefit / cash-balance plans**; PTET/domicile; **§1202 QSBS**; DAFs/CRTs/charitable LLCs; estate trusts/GRATs/dynasty; succession planning.

_Cross-context divergence: retirement-vehicle nodes are the biggest difference — Solo-401(k)/SEP = contractor-only, DB/cash-balance = business-only; insurance & EF sizing escalate with income volatility; QBI/S-corp/QSBS are SE-only._

### 1d. Calculators (23 — 8 personalized, 3 with inline SVG charts)

| Calculator | View | Personalized | Chart |
|---|---|:--:|:--:|
| Compound interest | Math §1 | ✓ | ✓ |
| Rule of 72 | Math §2 | | |
| Savings rate → years-to-FI | Math §3 | ✓ | |
| Real vs nominal return | Math §4 | | |
| Sequence-of-returns | Math §5 | | ✓ |
| Muni tax-equivalent yield | Math §6 | | |
| Asset-location alpha | Math §6 | ✓ | |
| Historical-cycles retirement sim | Math §7 | ✓ | ✓ |
| Rent vs buy | Essentials §1 | | |
| Vehicle TCO (A vs B) | Essentials §2 | | |
| HDHP+HSA vs PPO | Essentials §3 | ✓ | |
| DIME life-insurance need | Essentials §4 | ✓ | |
| Disability-insurance gap | Essentials §4 | | |
| Dependent-care FSA value | Lifestyle §2 | | |
| Subscription lifetime cost | Lifestyle §3 | | |
| Lifestyle-creep cost | Lifestyle §4 | | |
| Expense-ratio drag | Bogleheads | | |
| Efficient frontier (2-asset) | Theory §1 | | |
| Sharpe ratio (A vs B) | Theory §2 | | |
| Coast FIRE | Zeitgeist-inv §1 | ✓ | |
| Dividend vs total-return | Zeitgeist-inv §6 | | |
| Die With Zero | Zeitgeist-life §1 | ✓ | |
| Employer-match lifetime value (inline) | Full-chart node | | |

### 1e. Interactive / plan features

Diagnostic-driven personalization (answer buckets → tax bracket %, LTCG %, ages, expenses, net worth — pre-fill 8 calculators) · live plan regeneration · **completion tracking** with a reversible "Completed" ledger (v2) · **priority re-ranking** within stages by impact×ease with safety/deadline overrides (v2) · **statutory-deadline annotations** (v2) · **sensitivity panel** "what drives your plan" (v2) · personalized-vs-full chart filtering · 3 inline SVG charts · `.ics` calendar export, Markdown copy, print one-pager, figures banner with source list · session-only state (refresh clears).

---

## 2 · FUNCTIONS (the engine)

**v2 pipeline:** `questions.json` → **derive** (answers → ~25 `_`-prefixed facts) → **predicates** (JSON predicate grammar) → **plan-rules** (56 groups / 65 add + 24 skip) → **plan-engine** `computePlan` (fire rules, attach prose, infer friction, pick Tier-1) → **plan-prose** (`proseFor`, 65 cases) → **priority** `reorderPlan` → **deadlines** `annotateDeadlines` → **completion** `applyCompletions` / **sensitivity** `sensitivity`. App entry: `annotateDeadlines(reorderPlan(computePlan(effectiveAnswers)))`.

| Module | Key functions |
|---|---|
| `derive.mjs` | `derive(a)` — 25 derived flags (income, bracket, EF math, backdoor/pro-rata, catch-up, willingness, strategy-class, IDR name) |
| `predicates.mjs` | `evalPredicate`, `predicateFields`, `assertValidPredicate` — 9-op serializable predicate evaluator |
| `plan-rules.mjs` | `RULE_GROUPS` — 56 guarded groups, first-match-wins (data, no logic) |
| `plan-engine.mjs` | `computePlan` (orchestrator), `inferFriction`, `hashKey` → `{actions, skipped, tier1}` |
| `plan-prose.mjs` | `proseFor(pid, answers)` — 65-case switch → `{reason, because}` (auto-generated, parity-locked) |
| `priority.mjs` _(v2)_ | `reorderPlan`, `score`, `impactBand`, `overrideTier` (deadline > safety > score) |
| `deadlines.mjs` _(v2)_ | `deadlineFor`, `annotateDeadlines` — pure, takes `today`; urgency tiers overdue/critical/soon/upcoming |
| `completion.mjs` _(v2)_ | `applyCompletions`, `diffPlans`, `recomputeWithCompletions`, `COMPLETION_EFFECTS` (~11) |
| `sensitivity.mjs` _(v2)_ | `sensitivity(answers)` — perturb each field, rank by plan-logic delta |
| `calculators/calculators.mjs` | `runCalculator` dispatcher + `CALCULATORS`/`INPUT_ATTRS`/`SELECT_OPTIONS` registries |

> ⚠️ **v1-only, not yet in v2:** `renderPlanSynthesis` (the 4-paragraph situation / binding-constraints / horizon-sequencing / literacy-calibrated coda) and `getLiteracyScore`.

---

## 3 · CONCEPTS (the conceptual surface area)

- **Math:** compound interest & FV-of-annuity · Rule of 72 (69.3/70/72 variants) · savings rate as dominant variable (25× rule, 4% SWR) · real vs nominal (Fisher relation) · sequence-of-returns risk (accumulation/decumulation asymmetry) · asset-location alpha (taxable/traditional/Roth, tax drag, conversion-ladder rate) · muni tax-equivalent yield (in-state, NIIT) · historical-cycles sim (CAPE adjustment, SS/pension layering). Contested callouts: McQuarrie, Pfau intl, Bessembinder, ex-ante vs ex-post.
- **Spending essentials:** rent-vs-buy (opportunity cost, 5% rule, price-to-rent) · vehicle TCO (depreciation/financing) · HDHP+HSA vs PPO (triple-tax HSA, break-even, liquidity gate) · insurance right-sizing — DIME term-life, disability-gap (group vs individual, taxable vs tax-free).
- **Spending lifestyle:** behavioral budgeting (willpower vs systems) · dependent-care FSA arbitrage · subscription compounding (small-numbers fallacy) · lifestyle creep (income-elasticity of spend).
- **Portfolio — Bogleheads:** passive-vs-active · three-fund completeness · allocation by age/risk, target-date · rebalancing as discipline · tax-efficient placement · expense-ratio drag.
- **Portfolio — theory:** MPT/Markowitz (mean-variance, efficient frontier, correlation) · CAPM/Sharpe-Lintner-Mossin (beta, SML, Sharpe ratio) · Fama-French factor models (size/value, anomalies).
- **Zeitgeist investing:** FIRE variants (Lean/Fat/Barista/Coast) · FinTok critique · retail-trading gamification · crypto/alts · Dave Ramsey orthodoxy (snowball) · dividend subculture (yield-vs-total-return, dividend irrelevance).
- **Zeitgeist lifestyle:** Die With Zero (time-bucketing, memory dividends) · anti-hustle/soft-life · multi-generational housing · Gen-Z structural anxiety · DINK economics · behavioral synthesis (Fernandes-Lynch-Netemeyer: info ≠ behavior).
- **Advanced:** equity comp (§83(b), ISO/NSO/RSU, NUA, §1202 QSBS) · family wealth (custodial Roth, 529 superfunding, FLPs, IDGTs) · compound stack (cash-balance/DB, §415) · RE (cost-seg + bonus dep, REPS, STR loophole, §1031→DST→§721) · decumulation upside (0% LTCG harvesting, domicile/dynasty-trust states) · adjacent vehicles (direct indexing, §1256, OZ funds, §831(b) captives, SDIRAs, munis-as-4th-asset) · consumer protection (federal-loan IDR landscape; fiduciary-vs-suitability / industry capture).
- **Cross-cutting:** the diagnostic-personalization model itself (friction-first sequencing) · explicit structural-critique acknowledgment (wage stagnation, wealth gaps, banking deserts) framed as stated incompleteness · per-claim provenance discipline.

---

## 4 · SOURCES

### Audit system

**458 claims** (IDs CL001–CL482, 24 retired gaps), fully closed: **256 PASS / 202 CORRECTED**. By tier: **A (statute/code) 210 · B (consensus) 163 · C (empirical/contested) 83 · D (heuristic) 2.** By type: STATUTORY 99 · EMPIRICAL 97 · CITATION 70 · META 48 · MATH 43 · TAX-FIGURE 35 · UX 21 · CONVENTION 18 · PRICING 13 · REGULATORY 12 · METHODOLOGICAL 2. Source of truth: `audit/build_audit_xlsx.py` (10-tuple rows → xlsx).

### Named authorities (by claim-anchor frequency)

- **Statutory/regulatory:** IRC §§ (98) · IRS Notices/Rev.Proc. (22) · OBBBA P.L.119-21 (22) · SECURE 2.0 (19) · IRS Notice 2025-67 / 2026 limits (18) · SSA (16) · Treasury Reg/Fed.Reg (15) · CMS/HHS (9) · Tax Court & case law — Watson, Avrahami, Reserve Mechanical (7) · CA/NY state tax (5) · CRS (4).
- **Datasets:** BLS CPI (8) · Shiller (5) · Genworth/CareScout (5) · KFF (5) · Damodaran/NYU Stern (3) · CRSP-via-Bessembinder (3) · SSA life tables (3) · Ibbotson SBBI & Dimson-Marsh-Staunton (2) · FIRECalc/cFIREsim (2).
- **Academics:** Kitces 17 · Pfau 16 · Bengen 9 · Guyton-Klinger 4 · Blanchett/Estrada 3 ea (withdrawal); Markowitz 5 · Fama-French 5 · Ibbotson 5 · Brinson-Hood-Beebower 3 (theory); Bessembinder 3 · McQuarrie 1 (skewness/survivorship); MMM 6 · ERN 6 (FIRE math); Thaler-Benartzi 6 · Fernandes-Lynch-Netemeyer 3 (behavioral); Reichenstein 4 · W. Bernstein 5 (asset location).
- **Institutional:** Vanguard 17 · internal-review META self-cites 41 · unnamed practitioner consensus 21 · Bogleheads 7 · NerdWallet 7 · Morningstar 4 · ICI/BrightScope 3.

### Datasets (embedded)

- **`HIST_RETURNS`** — 98 rows `[year, stock%, bond%]`, **1928–2025**, annual **real** total returns (S&P 500 w/ dividends CPI-adjusted; constructed GS10 constant-maturity real bond series). Rebuilt 2026-05-17 from Shiller `ie_data.xls`, cross-checked vs Damodaran; rounded to 0.5pp (±1–3pp tail bias, disclosed). Bond column is imputed, not observed-price.
- **`SSA_CLAIM_AGE_FACTOR`** — SS benefit multipliers age 62 (0.700) → 67 (1.000) → 70 (1.240), FRA-67, SSA POMS.
- **`figures.json`** — **46** annually-indexed statutory constants, all TY2026, verified 2026-06-15, build fails past expiry. (401(k) $24,500; IRA $7,500; §415(c) $72,000; HSA $4,400/$8,750; SS wage base $184,500; estate exemption $15M/$30M; std deduction $16,100/$32,200; QCD $111,000; IRMAA/ACA cliffs; etc.) Sourced to IRS Notice 2025-67, IRC, Rev.Proc. 2025-32, CMS, HHS, SECURE 2.0, OBBBA.
- **`impact.json`** — 68 action impact bands (high 24/med 37/low 7) for priority scoring.
- **`deadlines.json`** — 3 statutory deadlines: Parent-PLUS consolidation (2026-07-01), §83(b) (grant+30d), legacy-IDR sunset (2028-07-01).
- **`phases.json`** — 11 priority-ladder phase definitions (name/tag/color/desc).

---

## 5 · OUTPUTS (what the user gets)

- **The personalized plan** — `{actions, skipped, tier1}`. Each action: `{title, stage (now/next-quarter/this-year/eventually), reason, because, nodeKey, tags[], incomeType?, friction, priorityScore, overrideTier, tier1, deadline?}`. Plus a **"Doesn't apply to you"** skipped ledger and a **Tier-1 "Start here · this week"** (≤3 picks).
- **Priority ordering** — within-stage sort by `[deadline-override, safety-override, impact×ease, idx]`; never changes which actions fire (parity invariant). _(v2)_
- **Completion tracking** — done → answer-patch → plan recomputes; finished items move to a reversible "Completed" ledger; `diffPlans` surfaces newly-unlocked work. _(v2)_
- **Deadline / calendar output** — per-action urgency tag + **`.ics` export** (one VEVENT per dated deadline). _(v2)_
- **Sensitivity analysis** — ranked "what drives your plan" with counterfactual "if you answered X → +added/−removed" previews. _(v2)_
- **Personalized chart** — your income track rendered in full, non-plan nodes faded + reason; secondary tracks shown as active-only addenda.
- **Full framework chart** — complete tree browsable by income type + bracket.
- **Export/share** — Copy-as-Markdown plan, print one-pager, figures banner (TY + verified date + source list), screen-reader live-region announcements.
- _(v1-only, not yet in v2)_ **Plan synthesis** — 4-paragraph situation / binding-constraints / horizon-sequencing / literacy-calibrated coda.

---

## Worth knowing before working on it

- **README drift:** "447 claims / ~35 figures / 1928-2024 / 27-question" → actuals are **458 / 46 / 1928-2025 / 53-in-pool**.
- **The v1↔v2 gap is the main decision:** v2 is richer (4 new layers + `.ics`) but un-shipped and missing the synthesis/literacy coda. Any "work on the flowchart" splits into: finish/cut-over v2, or extend v1.
- **Dead literacy inputs** (Q13–16) currently collected for nothing in v2.
- **MC swap hook** (`getMCBackend()` / `window.__customMCBackend`) is preserved — a personal Monte Carlo system can plug into the retirement sim.

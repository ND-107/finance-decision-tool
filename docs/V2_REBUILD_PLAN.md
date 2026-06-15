# V2 Rebuild Plan — finance-decision-tool

**Date:** 2026-06-10
**Provenance:** Synthesized from the 2026-06-10 review session: full-system architecture review, 447-claim content audit with live web verification, diagnostic/engine design analysis, and additions survey. This document supersedes nothing — HANDOFF.md remains the v1 orientation doc. This is the forward plan.
**Status:** PROPOSED — Phase 0 is urgent (statutory deadline 2026-07-01); Phases 1–6 await go decision.

---

## 0. Governing decisions

These were settled during the review session and should not be re-litigated without reason:

1. **The single-file artifact survives — as build output, not source format.** `dist/flowchart.html` keeps the double-click/save-forever property. The build inlines everything *including fonts* (v1 actually leaks to Google Fonts; v2 becomes more self-contained than v1).
2. **Content becomes data.** All prose moves to markdown files with frontmatter. CL claim annotations live inline in the content; the audit database is *generated* from them at build time. Claim-to-content drift (the Solo 401(k) / ACA bug class found 2026-06-10) becomes structurally impossible.
3. **One knowledge graph.** The node trees, the `computePlan()` rule pile, and the reference views collapse into a single graph of nodes with applicability predicates, prerequisites, declared friction, impact bands, and deadlines. The Plan, Personal chart, Full chart, and skip ledger are four projections of the same graph.
4. **The kernel is pure and tested.** `plan(answers)`, simulators, and calculator math are pure TypeScript functions with unit tests, golden-persona fixtures, and build-time verification of the answer space.
5. **Determinism is the soul.** No ML, no runtime LLM, no server, no accounts, no aggregation. The 447-claim audit only means something because answer → recommendation is inspectable.
6. **Behavioral instrumentation is preserved intact:** stated-vs-revealed risk pair, Lusardi literacy probe, unsure→homework pattern, spousal-alignment questions, skip ledger, reason/because split, friction-first Tier-1.
7. **The MC swap interface (`getMCBackend()` / `window.__customMCBackend`) survives verbatim** — it is the bridge to the personal finance-monte-carlo system (HANDOFF roadmap item 3).

---

## Phase 0 — v1 currency hotfix (SHIP BEFORE 2026-07-01)

The OBBBA student-loan dates make this time-critical: RAP launches and Parent PLUS consolidation closes **July 1, 2026**. These fixes ship on the *existing* v1 artifact, before any re-platforming. All findings verified against live sources 2026-06-10.

### 0.1 Vintage-figure corrections (2025 values mislabeled as 2026)

| # | Artifact says | Correct 2026 value | Locate via | Source |
|---|---|---|---|---|
| 1 | IRMAA first tier "$106,000 / $212,000" | **$109,000 / $218,000** | grep `106,000` (W2:10.1 Roth-ladder callout) | CMS 2026 premiums notice |
| 2 | 12% bracket fill "~$96,950 MFJ" | **$100,800** | grep `96,950` (same callout) | Rev. Proc. 2025-32 |
| 3 | "2026 FPL $15,650" + derived chain $23,475 / $56,525 / $5,653 / $471 | **$15,960** → $23,940 / $56,060 / $5,606 / ~$467 | grep `15,650` (AdvStrat §7 IDR example) | HHS 2026 guidelines (Jan 2026) |
| 4 | QCD "$108,000 (2026 indexed)" | **$111,000** | grep `108,000` (W2:10.5) | Notice 2025-67 family |
| 5 | Split-interest QCD "$54,000 (2026 indexed)" | **$55,000** | grep `54,000` (same node) | same |

⚠️ Do **not** "fix" the ACA cliff dollars ($62,600 / $84,600 / $128,600) — they are correct: coverage-year-2026 marketplace subsidies key off 2025 FPL. Only the IDR example mislabels its vintage.

### 0.2 OBBBA student-loan restructuring (the big rewrite)

Current state (verified): AdvStrat §7 and the three loan Plan actions are framed entirely around the 2024–25 SAVE litigation. Zero mentions of RAP, the sunsets, or the borrowing changes.

Required changes:

- **AdvStrat §7 taxonomy rewrite:** add RAP (launches 2026-07-01; the only IDR for post-2026 borrowers; PSLF-qualifying) and the tiered Standard plan (**not** PSLF-qualifying); document the ICR/PAYE/SAVE sunset (forced migration to IBR or RAP by 2028-07-01, auto-enrollment in RAP for non-electors); SAVE formal wind-down via 2026 court settlement; note that taking any new loan on/after 2026-07-01 forfeits legacy-plan access; Grad PLUS elimination + new borrowing caps.
- **SAVE-forbearance Plan action:** replace "switch to IBR or (if eligible) PAYE" — PAYE sunsets 2028, switching into it buys a forced second migration. New guidance: IBR now, or evaluate RAP after 2026-07-01, depending on payment-count and forgiveness math.
- **New time-critical Plan action — Parent PLUS:** consolidate-into-ICR pathway (the bridge to IBR) **closes 2026-07-01**. Deadline-tagged, critical, `stage: now`.
- **`currentIDRPlan` diagnostic question:** add RAP as an option (label it "available from July 2026").
- **PSLF content:** note that new-borrower PSLF requires RAP (tiered Standard doesn't qualify).
- **PAYE taxonomy bullet:** mark the "partially reopened 2024–25" framing as historical.

### 0.3 Point fixes

| Fix | Detail | Locate via |
|---|---|---|
| SS depletion | "within the next 15-20 years" → 2025 Trustees: OASI **2033** (77% payable), combined **2034** (81%); 2026 report moves OASI to Q4 2032. Keep the 77–80% clause | grep `15-20 years` (Zeit:Lifestyle Gen-Z section) |
| ACA stale parenthetical | Delete "(and continued ARPA / IRA extensions above that band through current law…)" from the PTC Plan action — enhanced subsidies expired 2025-12-31; reference content elsewhere is already correct | grep `continued ARPA` (computePlan CL449 block) |
| Solo 401(k) drift | "25% of net SE earnings or 20% of net profit, depending on entity type" is inverted. Correct everywhere to: **25% of W-2 wages (S/C-corp) / ~20% of net SE earnings (sole prop)**. Three spots: contractor node 3.1 details, node 8.1 summary, plan action reason | grep `25% of net SE earnings` |
| "Form PS-509" | No such form exists. Replace with the real flow: PSLF Help Tool employer search by EIN → submit documentation for employer-eligibility review if unlisted | grep `PS-509` (AdvStrat §7 workflow step 2) |
| Bronze/catastrophic HSA | OBBBA + Notice 2026-05: bronze and catastrophic plans are HSA-compatible **as of 2026-01-01**; DPC arrangements ≤$150/$300 per month also HSA-compatible; telehealth-before-deductible permanent. Update: the `healthInsurance === 'minimal'` Plan action (its premise "catastrophic-only plans without HSA pairing" is now false), HDHP/HSA node content, and the Spending:Essentials healthcare section (which already covers DPC — connect them) | grep `Catastrophic-only plans` |
| Estate "sunset" hedge | "(c) the federal gift / estate tax exemption ahead of any sunset" — no sunset exists post-OBBBA; rephrase | grep `ahead of any sunset` |
| Forward-rate hedge | The "Fed funds compress toward ~2–2.5% neutral" base case is now contested (May 2026 CPI 4.2%; market prices holds + hike risk). Reframe as two-sided scenario, keep verify-before-acting language | grep `2–2.5% neutral` |
| Saver's Match note | Add one sentence: SECURE 2.0 Saver's Match (50% federal match up to $2,000, deposited to the account) replaces the Saver's Credit starting TY2027 | Saver's Credit action + W2:6.2 |

### 0.4 Process

1. New audit claims start at **CL472**; correct CL362's source field (it carries the wrong IRMAA values — the verification itself anchored stale); regenerate xlsx.
2. `./verify.sh` → commit → **push first** (per 2026-05-25 session lesson) → verify live on iPhone.
3. Also commit the stray uncommitted CHANGELOG entry + 2026-05-25 session note currently sitting in the tree.

**Estimated effort:** 1–2 sessions. **Hard deadline: before 2026-07-01.**

---

## Phase 1 — Re-platform + lossless content extraction

The keystone-risk phase. The content (~80% of the file's mass, 471 audited claims) is the asset; the code is the easy 20%. **The extraction script, not the new app shell, is the project.**

### 1.1 Target repo layout

```
finance-decision-tool/
├── src/
│   ├── core/                  # pure TS kernel — no DOM imports allowed
│   │   ├── schema.ts          # answer state vector, types
│   │   ├── predicates.ts      # serializable predicate evaluator
│   │   ├── graph.ts           # knowledge graph loader + projections
│   │   ├── plan.ts            # plan(answers, actionStates) → Plan
│   │   ├── stages.ts          # derived staging (topo + gaps + deadlines)
│   │   ├── priority.ts        # scoring: impact × completion-probability
│   │   ├── sensitivity.ts     # perturbation analysis
│   │   ├── simulate.ts        # historicalCyclesSimulate + MC swap hook
│   │   └── calculators/       # one pure module per calculator
│   ├── content/
│   │   ├── nodes/             # one .md per graph node (action/reference)
│   │   ├── sections/          # reference view sections (math, spending, …)
│   │   ├── playbooks/         # NEW: life-events content (Phase 4)
│   │   └── questions.yaml     # diagnostic schema (declarative predicates)
│   ├── data/
│   │   ├── figures.json       # vintage-stamped indexed dollar figures
│   │   ├── hist-returns.json  # Shiller series + provenance block
│   │   └── graph.yaml         # node edges: requires / unlocks / dominates
│   └── ui/                    # thin render layer; always re-render from state
├── build/                     # emits dist/flowchart.html — single file, fonts inlined
├── audit/                     # GENERATED from content CL annotations + sources registry
├── tests/                     # vitest (kernel) + playwright (flows) + personas/
└── docs/
```

### 1.2 Content file format

One file per node. Frontmatter carries everything the kernel needs; prose carries inline claim annotations.

```markdown
---
id: w2-capture-match
kind: action
phase: match
applies:
  all:
    - { field: incomeTypes, op: has, value: w2 }
    - { field: employerMatch, op: eq, value: yes }
    - { field: matchCaptured, op: in, value: [no, partial] }
skipWhen:
  - when: { field: matchCaptured, op: eq, value: yes }
    reason: "You're already capturing the full match."
  - when: { field: employerMatch, op: eq, value: no }
    reason: "No W-2 employer match available."
requires: [starter-ef, minimum-payments]
friction: low                 # DECLARED — title-regex inference is dead
impact: { band: high, basis: "immediate 50–100% return on matched dollars" }
deadline: null                # ISO date or rule, for event/statutory items
tags: [critical, bracket]
claims: [CL025, CL145]
---
# Capture your full employer 401(k) match

A typical match formula is <cl id="CL025">"50% of contributions up to 6% of
salary"</cl> … contribute exactly
<fig key="limit_401k_deferral_2026">$24,500</fig> …
```

`<cl id>` spans bind claims to the exact text they verify — the audit builder extracts them, so a claim whose text changed without re-verification **fails the build**. `<fig key>` spans pull from the figures layer, so no indexed dollar value is ever a hand-typed literal in prose.

### 1.3 Figures data layer

```json
{
  "limit_401k_deferral_2026": {
    "value": 24500, "display": "$24,500", "taxYear": 2026,
    "source": "IRS Notice 2025-67", "verified": "2026-06-10",
    "expires": "2026-12-31"
  },
  "irmaa_tier1_single_2026": {
    "value": 109000, "display": "$109,000", "taxYear": 2026,
    "source": "CMS 2026 Parts A&B premiums notice", "verified": "2026-06-10"
  }
}
```

Build emits a visible banner: *"Figures current for tax year 2026 · last verified 2026-06-10."* The annual refresh becomes: update one file, re-verify each entry against its named source, rebuild. Entries past `expires` fail the build loudly. (Lesson encoded: the 2026-06-10 audit found five 2025-as-2026 figures, one of them wrong *inside the audit itself*.)

### 1.4 Extraction + round-trip gate

1. Script walks v1 `flowchart.html`, lifts every node / section / action-reason / question into the new formats, attaching CL annotations from the audit DB's location fields during extraction.
2. **Gate:** the build must reproduce a DOM-equivalent v1 artifact from the new source tree before *any* restructuring begins. Rendered-DOM diff (normalized) — not byte diff — is the acceptance test.
3. Only after the gate passes does Phase 2 begin.

**Estimated effort:** 2–3 sessions (extraction script + gate + build pipeline).

---

## Phase 2 — Kernel: knowledge graph + pure plan engine

### 2.1 The graph replaces the rule pile

Each of `computePlan()`'s ~60 if/else blocks becomes a node's frontmatter (predicate + skip-reasons + metadata). The four projections:

| Projection | Definition |
|---|---|
| **Plan** | applicable nodes, gap-filtered, topologically ordered, priority-scored |
| **Personal chart** | all nodes; non-applicable faded, annotated with the predicate's own explanation |
| **Full chart** | all nodes, filterable by income type / bracket (v1 behavior preserved) |
| **Skip ledger** | the predicate-false set with `skipWhen` reasons — generated, not hand-emitted |

### 2.2 Derived staging and explicit priority

- **Stage** = f(topological position, gap severity, deadline proximity). "Why this stage" is generated from the actual blocking edge ("waits on your emergency fund, currently 2 months short of target") — guaranteed truthful.
- **Priority** = impact band × completion probability (friction), with safety items (insurance, §83(b)-class deadlines) as overrides. One visible function; Tier-1, within-stage sorting, and deadline escalation all derive from it. This *is* the Madrian-Shea argument the v1 Plan view cites — applied to every card instead of three.
- **Deadlines are first-class.** A node may carry a date (`2026-07-01` Parent PLUS) or a rule (`grant_date + 30d` for §83(b)). Within range → escalates to the top regardless of stage. v1 cannot represent this at all.

### 2.3 Verification (build-time, on the enumerable answer space)

- every action node reachable by some answer profile
- no profile yields an empty plan or >5 simultaneous critical Tier-1 candidates
- no contradictory pairs co-fire (e.g., two mutually exclusive loan actions)
- every diagnostic question influences ≥1 output — else the build names the dead question
- the dependency DAG is acyclic; cascade-clear terminates by construction (v1's `safetyCounter` deleted)
- **golden personas:** the five audit personas (Tax Attorney, CFP, Academic, Behavioral, Consumer-advocate archetypes) + ~10 household archetypes as answer fixtures with reviewed expected plans — the regression suite the persona process never left behind
- **parity gate:** v2 `plan(answers)` output vs v1 `computePlan()` across the fixture corpus; only documented, intentional diffs allowed

**Estimated effort:** 3–4 sessions (graph port 2, scoring + verification 1–2).

---

## Phase 3 — Diagnostic v2

### 3.1 Progressive disclosure

Core-8 (incomeTypes, filingStatus, age, income, emergencyFund, highInterestDebt, healthInsurance, employerMatch) → **provisional plan renders immediately** → every further answer visibly sharpens it. Plan blocks carry refinement prompts: *"Answer the 3 insurance questions to resolve this block."* Nothing is gated on completeness. The plan is the reward for continuing, not the prize behind a 27-question wall. Section structure and order are kept (legibility > adaptive cleverness).

### 3.2 Primitives, not self-classifications

Age and income accepted as exact numbers with bucket fallback ("prefer not to say precisely" keeps the v1 privacy-feel). **Bracket is derived** from income + filing status — v1 asks users to self-compute the exact marginal-vs-effective distinction its own first node warns they confuse. `getDefault()`'s bucket→fake-point-estimate de-bucketing disappears where real numbers exist.

### 3.3 The loop closes

```xml
<actionState id="w2-capture-match" status="done" completedOn="2026-09-01"/>
```

Action states (done / dismissed / not-applicable) persist alongside answers; `done` mutates the *effective* answer state (→ `matchCaptured: yes`), the plan recomputes, the card migrates to the skip ledger with "completed 2026-09-01." Re-running the diagnostic later produces a **diff** ("since March: match captured, EF at target; 2 new actions from the loan-law change"), not amnesia. localStorage schema v3.

### 3.4 Sensitivity as a feature

`plan()` purity makes perturbation nearly free: flip each load-bearing answer, measure plan delta, surface it — *"Your bracket answer drives 6 of your 14 actions."* Ranks the unsure-homework by what resolving it would actually change.

### 3.5 Rendering

Always re-render the active view from state. v1's `planRenderedHash` / `activeQuestionSignature()` invalidation machinery — the source of the only post-release bugs — is deleted, not ported. If profiling demands it, add a ~3KB keyed-diff renderer (preact, inlined by the build); decide on evidence, not in advance.

**Estimated effort:** 2–3 sessions.

---

## Phase 4 — New content builds

### 4.1 Life-events view — "When something happens" (the 14th view)

The framework optimizes steady-state; decisions cluster at transitions. Verified gaps: COBRA 0 mentions, severance/layoff 0, lump-sum-vs-DCA 0, no inheritance-receipt or survivor workflow. Playbooks route into existing content and add only the genuinely new time-critical items:

| Playbook | New content (the rest is routing) |
|---|---|
| Job loss / job change | 401(k) rollover decision tree, NUA window, 90-day ISO clock, COBRA vs marketplace+PTC, severance, deferral reset |
| Windfall | sudden-wealth guardrails ("park it 90 days"), Vanguard lump-sum-vs-DCA evidence, inherited-IRA 10-year rule, §121 home-sale exclusion |
| Marriage / divorce | filing-status math, beneficiary re-audit, QDRO basics |
| New child | dependent-care FSA vs CTC coordination, 529 start, term-life resize, estate-doc update |
| Death of a spouse | survivor checklist; routes to existing widow's-tax-trap + SS survivor content |

`restrictedStockRecent` migrates here as an event entry point — it was always an event question shoehorned into a snapshot questionnaire. Event-triggered deadline nodes get real dates via §2.2.

### 4.2 Protection & security module

Verified gaps: credit freeze 0, identity theft 0, 2FA/password 0, digital-asset estate access 0. One section: freeze all three bureaus (highest-value free protection), account-security baseline, fraud-recovery routing (identitytheft.gov, Reg E/Z liability), digital estate access for executors. Serves the Phase-7.5 low-bracket audience hardest-hit by fraud.

### 4.3 Annual review checklist view

The maintenance loop as a first-class surface: January figures reset, IDR recertification, open enrollment, beneficiary audit, rebalance band check, insurance re-shop cadence. Pairs with the .ics export (Phase 5).

### 4.4 Process

New CL claims throughout; checkpoint persona review (consumer-finance advocate + CFP — the established methodology) on all new content. **Optional after:** roadmap Phase 8 low-bracket depth sections — kept at routing-to-portals depth, not a benefits encyclopedia.

**Estimated effort:** 3–4 sessions including persona pass.

---

## Phase 5 — Trust & utility surfaces

| Feature | Mechanism |
|---|---|
| **Sources toggle** | "Show sources" renders each `<cl>` span's tier + citation inline from the generated audit. The project's most unusual asset (447 verified claims), currently invisible to every user, becomes the trust differentiator |
| **Plan export** | Print stylesheet (one-pager: Tier-1 + stages + skips) + copy-as-markdown. Consumers: spouse (the alignment questions beg for a shareable artifact), CPA/CFP, future-you |
| **Calendar export** | .ics: quarterly estimated taxes, IDR recertification, open enrollment, RMD, any active deadline nodes — "next quarter" gets actual dates |
| **Deep links** | `#math/sequence-risk` hash routing; cross-references become real anchors, validated at build (no dead refs) |
| **Search + index** | Build-time term index, client-side search over 800KB of reference content |
| **Scenario toggles** | "Show my plan if I were mid-bracket" — UI over the §3.4 sensitivity machinery |
| **Figures banner** | "Current for TY2026 · verified YYYY-MM-DD" from the figures layer |

**Estimated effort:** 2 sessions.

---

## Phase 6 — Cutover + operations

1. **Parity checklist** against v1: all 13 views + new ones, a11y regression (axe + manual screen-reader pass — v1's live regions / focus management / aria-current become Playwright assertions), perf budget for the built artifact.
2. **Deploy:** `dist/flowchart.html` to GH Pages; v1 archived at `/v1/flowchart.html` (honors save-it-forever users; gives a rollback).
3. **Maintenance ritual doc:** the annual figures refresh procedure (one file + per-entry live-source re-verification — *never* from model memory; CL362's wrong-at-verification IRMAA row is the cautionary tale), trustees-report check each June, loan-landscape check each July 1.
4. **MC backend:** swap interface documented with a TS type; integration with finance-monte-carlo remains a pull-when-ready roadmap item.

---

## Sequencing, effort, risks

```
Phase 0  v1 hotfix              1–2 sessions   HARD DEADLINE before 2026-07-01
Phase 1  extraction+replatform  2–3 sessions   gate: DOM-equivalent round-trip
Phase 2  kernel/graph           3–4 sessions   gate: golden-master parity
Phase 3  diagnostic v2          2–3 sessions
Phase 4  new content            3–4 sessions   persona review included
Phase 5  trust surfaces         2 sessions
Phase 6  cutover                1 session
                                ~14–19 sessions total
```

Dependencies: 0 → 1 → 2 → 3; Phase 4 content authoring can start any time after Phase 1 (formats exist); Phase 5 needs 2+3.

**Top risks & mitigations**

| Risk | Mitigation |
|---|---|
| Extraction loses or mutates audited prose | Round-trip DOM-diff gate before any restructuring; extraction attaches CL annotations mechanically from audit location fields |
| Kernel port silently changes recommendations | Golden-master parity vs v1 across persona fixtures; documented-diffs-only policy |
| Scope creep into app territory | Standing scope guards: no server, no accounts, no aggregation, no chatbot, no budgeting features (the Plaid dashboard project owns that domain) |
| Voice drift in new content | Persona-review pass is mandatory for Phase 4; new claims audited before merge |
| July 1 deadline slips | Phase 0 is deliberately v1-native — zero dependency on the rebuild |

**Open decisions** (flag at Phase 1 start): TypeScript vs JSDoc-typed JS (recommend TS — the build step exists anyway); vanilla keyed-render vs inlined preact (decide on profiling evidence); same-repo `v2/` branch vs directory (recommend branch `v2` with v1 frozen on `main` until cutover).

---

## What this plan deliberately does not do

No runtime intelligence (LLM/ML) in the engine. No personalization server. No account linking. No walk-the-tree UX revival. No removal of bucket answers (privacy fallback stays). No Phase-8 benefits encyclopedia. No DMS international dataset until a license exists (HANDOFF roadmap caveat stands).

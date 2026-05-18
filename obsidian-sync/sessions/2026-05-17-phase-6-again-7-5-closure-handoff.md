---
type: session
date: 2026-05-17
zone: coding
project: finance-decision-tool
title: "Phase 6-again + Phase 7.5 + final closure + HANDOFF rewrite — audit closed"
status: in-progress
next-step: "Clarify which early-conversation feature list ND was asking about (EX1 catalog? P6.5/P7.5 backlogs? something else?); if it turns out to be the 3-item HANDOFF roadmap, pick one to start (Phase 8 low-bracket reference depth recommended)."
related:
  - "[[finance-decision-tool CHANGELOG]]"
  - "[[finance-decision-tool HANDOFF]]"
asana-task-gid: null
session-id: 2026-05-17-finance-decision-tool-phase-6-again-handoff
---

## Done

- **Phase 6-again Session 1 (Tax Atty + CFP) — commit `f656319`.** 24 findings (12 per paired persona); 17 structural fixes shipped. Statutory miscites corrected across AdvStrat (§7872→§1274 IDGT, §3121(b)(3)(A)/§3306(c)(5) FICA/FUTA split, §469(c)(7)(A) REPS aggregation election, §831(b)(2)(B) diversification, §1031 direct-indexing framing, OBBBA OZ-fund specifics, Cash Balance Schedule-C location, SECURE 2.0 §604 vesting). Plan-view QBI action threshold fixed $242K/$484K → $202K/$404K per Rev. Proc. 2025-32. SIMPLE IRA Contractor:3.1 expanded; CL016 FAIL → CORRECTED. CL428 wired four new Plan→AdvStrat diagnostic-triggered routing actions (high-bracket SE → §3 compound stack; high-bracket + dependents → §2 family wealth; high-bracket CA + liquidity event → §5 state domicile; high-bracket + $2M+ NW → §6 adjacent vehicles).
- **Phase 6-again Session 2 (Academic + Behavioral) — commit `d4ccdb2`.** 24 findings; 13 structural fixes. Hardest catch: Solo 401(k) profit-sharing formula inverted (CL429 — 25% of W-2 wages for S-corp/C-corp vs ~20% of net SE earnings for sole-prop). Math §7 model-limits reconciled 1-5pp aggregate vs 5-15pp worst-cohort claim (CL431); Shiller bond construction caveat (CL432); CAPE-overlay implementation disclosure (CL434); Estrada (2016) journal corrected JoPM → Journal of Investing (CL435). CL428 friction misclassification fixed; state-domicile stage timing branched on `within-3` exit horizon; honest-default skip framing applied to CL428 reason-lines; renderPlanSynthesis stageNote rewritten to drop raw critical-count leak; AdvStrat view intro prepended with "Most households should skip this view entirely." **Saver's Credit (CL441) finally wired as critical Plan action** for bracket=low + active earner.
- **Phase 6-again Session 3 (Consumer-finance advocate) — commit `d5dda7b`.** 12 findings; 8 structural fixes including the framework's biggest distributional gap closure: **EITC (CL448), ACA-PTC (CL449), overdraft opt-out (CL450) all wired as critical Plan actions for the low-bracket cohort**. AdvStrat §4 audience-fit opening callout; §6 §831(b) sales-channel red-flag warning; §8 consumer-remedies bullet (CFPB / state AG / NASAA / FINRA + NACA / PIABA / NCLC). renderPlanSynthesis structural-conditions block fires for bracket=low (CL455).
- **Phase 6-again CHANGELOG roll-up — commit `0995746`.** Documents the full three-session sequence.
- **Phase 7.5 backlog-clearing sprint — commit `7b676dc`.** All 14 DEFERRED-P7.5 items resolved in three batches: Batch 1 (10 quick depth-adds: CL423 RSU §83(b) statutory framing, CL424 NY 184-day + transit-passenger exception, CL425 QBI non-SSTB W-2-wage+UBIA, CL426 STR recapture math callout reordering, CL427 HYSA Fed-funds floor-rate expectation, CL442 Bengen→McQuarrie forward-pointer, CL443 Bessembinder index-membership caveat, CL444 Cochrane 2011 Discount Rates reframing, CL445 Davidoff-Brown-Diamond 2005 annuity puzzle, CL447 Welcome literacy-vs-behavior intro). Batch 2: new `rentalRealEstate` diagnostic Q + defensive-routing Plan action (CL446 + CL458 → CL469). Batch 3a: new `currentIDRPlan` diagnostic Q + AdvStrat §7 dedicated SAVE-forbearance callout + critical Plan action (CL456 → CL470). Batch 3b: consolidated safety-net surface Plan action SNAP/Medicaid/Lifeline/LIHEAP (CL457 → CL471).
- **Final closure pass — commit `40c01c3`.** Both remaining FAILs flipped to CORRECTED: CL056 (QBI SSTB labeling, resolved by accumulated CL360 + CL414 + CL461 work) and CL102 (employer-match Roth treatment, resolved by CL413). Audit closed.
- **HANDOFF.md rewrite — commit `3663207`.** Replaces stale 328-claim / Phase-7-pending content with current state (447 claims, 245 PASS / 202 CORRECTED / 0 DEFERRED / 0 FAIL, 13 views, 27-question diagnostic, Shiller unrounded 1928-2025 dataset). Replaces "outstanding work" section with audit-closed status note + 3-item optional roadmap (Phase 8 low-bracket reference depth, DMS international-data engineering pass, personal MC backend integration). Folds in architectural-pattern notes that emerged after original HANDOFF was written (Plan→AdvStrat routing, friction-aware Tier-1 anchor, defensive vs recommended routing, honest-default skip framing).

## Open

- **ND's question about "an early list of functions or features we made" — unresolved.** I asked for clarification because nothing in this conversation specifically matched, and there are several candidates: EX1 catalog (FA001-FA025, all built in Phase 7); the various deferred backlogs (P2.5/P3.5/P4.5/P5.5/P6.5/P7.5 — all cleared); the 14 Phase 7.5 backlog items (just cleared); the 3-item roadmap in HANDOFF.md. If ND clarifies which list, that's the resumption point. The list might be in `docs/conversation_history.md` from the pre-migration original-chat thread.
- **Optional 3-item roadmap from HANDOFF.md** if nothing more urgent surfaces:
  1. Phase 8 — symmetrical low-bracket reference depth for EITC / ACA-PTC / overdraft / safety-net Plan actions (audience-symmetry: high-bracket got a dedicated 13th view, low-bracket got Plan-action reason-text only). Recommended starting point if ND wants framework growth.
  2. Data-engineering pass — replace CL370 CAPE-channel proxy with actual Dimson-Marsh-Staunton 23-country dataset. Requires DMS license.
  3. Personal MC backend integration — `window.__customMCBackend` swap hook is in place; ND's MC system plugs in when ready. Interface contract documented in HANDOFF.

## Notes

- **Audit count discrepancy resolved at commit time.** Initial Phase 7.5 commit message claimed "263 PASS / 191 CORRECTED / 0 DEFERRED / 2 FAIL across 471 claims" — summed to 456, not 471. Re-ran the audit count after the closure pass: actual final is **245 PASS / 202 CORRECTED / 0 DEFERRED / 0 FAIL across 447 claims**. CHANGELOG corrected accordingly. PASS count holding at 245 across multiple phases is the expected behavior (PASS items don't migrate unless they're flagged for re-evaluation; new CL entries land as CORRECTED).
- **Three persona sessions in parallel (Session 1 + Session 2) ran cleanly via `general-purpose` subagent type** with detailed self-contained prompts. The persona prompts averaged ~600-800 words each but produced surgical, structurally-aware findings without hallucinated CL IDs or wrong file references. The pattern of "spawn two paired-persona reviews in one message, batch findings into one thematic commit per session" preserves the Phase 6 commit-rhythm at half the calendar time. Worth preserving for any future post-phase review cycles.
- **The CL428 Plan→AdvStrat routing was the biggest single architectural change of the day.** Before, Phase 7 was a 13th view that qualified users had to discover via nav-bar; after, four diagnostic-triggered Plan actions route them in. The four-action template (`high-bracket SE → CB-DB`, `high-bracket + dependents → family wealth`, `high-bracket CA + liquidity event → state domicile`, `high-bracket + $2M+ NW → adjacent vehicles`) is documented in HANDOFF as the pattern for any future Phase-7-style content.
- **The Session 3 advocate's distributional-gap finding produced the framework's most consequential low-bracket fix to date.** Three new critical Plan actions (EITC, ACA-PTC, overdraft opt-out) plus the consolidated safety-net surface (SNAP/Medicaid/Lifeline/LIHEAP) closed gaps where the body prose acknowledged the topics were critical but the Plan engine never routed users to them. The CL448-CL450 + CL471 actions together address the "framework optimizes for the upper-decile household that already has resources to act on optimization" critique that Olen / Aliche / Baradaran literature flags as the dominant failure mode of personal-finance content.
- **HANDOFF.md was severely stale.** It was written when Phase 7 was pending and described 328 claims with Phases 1-5 + consolidated sub-phase as the most recent work. Post-migration the project has shipped 6 additional phases (Phase 6, P6.5, Phase 7, Phase 7+ data verification, Phase 6-again, Phase 7.5) plus the closure pass. The rewrite brings the doc current and adds the 3-item roadmap that captures what's optional going forward.

## Related

- [[finance-decision-tool CHANGELOG]] — chronological log of every commit-level change since migration
- [[finance-decision-tool HANDOFF]] — project orientation doc (just rewritten this session)

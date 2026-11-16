# Persona-pass findings: verification and proposals (2026-11-16)

**Status: proposals only. Nothing in this folder is applied to the site content.** The owner decides per block.

## What was done

The two persona reports of 2026-11-06 hold 117 findings on the Phase 4 content. Seven were applied that day. On 2026-11-16 every finding went through two passes:

1. **Verify and draft.** One agent per content module gave each finding a verdict and, for each affected block, drafted a replacement body, plain-English variant, proposition map and audit rows. Every added factual sentence had to be read that day at a primary source (U.S. Code, CFR, or the responsible agency's own page), with a quote recorded.
2. **Adversarial check.** A second agent per module, which had not seen the first one's reasoning, re-fetched every cited source, tried to refute each added sentence, and wrote the corrected file. It made 89 corrections across the eleven modules.

A third pass cut each proposal down to what the HIGH-severity findings need, using only wording already checked.

Both variants were applied in a scratch checkout and pass all 13 gates (`tools/verify-v2.sh`).

## Result

| Verdict | Count |
|---|---|
| Accepted as the reviewer proposed | 24 |
| Accepted with the wording or the law corrected | 77 |
| Already covered by the current text | 7 |
| Needs a new step, a reorder or a title change (owner decision; drafted, not in either variant) | 8 |
| Rejected | 1 |

| Module | Findings | Accepted | Already covered | Owner decision | Rejected | Blocks changed, HIGH only | Words, HIGH only | Blocks changed, everything | Words, everything | Left out as unverified |
|---|---|---|---|---|---|---|---|---|---|---|
| le-job-loss | 20 | 17 | 2 | 1 | 0 | 2 | 469 → 643 | 5 | 469 → 1026 | 7 |
| le-new-baby | 10 | 8 | 0 | 1 | 1 | 1 | 208 → 240 | 4 | 208 → 470 | 6 |
| le-marriage | 5 | 5 | 0 | 0 | 0 | 0 | 182 → 182 | 4 | 182 → 325 | 4 |
| le-divorce | 13 | 11 | 2 | 0 | 0 | 2 | 252 → 367 | 5 | 252 → 624 | 7 |
| le-home-purchase | 7 | 6 | 0 | 1 | 0 | 1 | 172 → 226 | 4 | 172 → 361 | 7 |
| le-relocation | 7 | 6 | 0 | 1 | 0 | 0 | 191 → 191 | 4 | 191 → 366 | 4 |
| le-windfall | 12 | 11 | 1 | 0 | 0 | 2 | 287 → 414 | 5 | 287 → 636 | 6 |
| le-retirement | 14 | 10 | 1 | 3 | 0 | 3 | 164 → 290 | 5 | 164 → 531 | 10 |
| le-death-of-spouse | 9 | 8 | 1 | 0 | 0 | 2 | 299 → 385 | 4 | 299 → 504 | 1 |
| protection | 12 | 12 | 0 | 0 | 0 | 2 | 593 → 635 | 8 | 593 → 904 | 13 |
| annual-review | 8 | 7 | 0 | 1 | 0 | 4 | 309 → 398 | 4 | 309 → 515 | 5 |

The size is the real decision: taking everything roughly doubles the Phase 4 text; HIGH only adds about a quarter.

## Files

- `2026-11-16-persona-decision.html` (this folder's parent): the decision page. Each block shown three ways with the added words highlighted, the findings and verdicts, the sources read, and a picker that writes the apply commands. Rebuild with `python3 tools/build-persona-decision-page.py docs/reviews/proposals-2026-11-16/current docs/reviews/proposals-2026-11-16/full docs/reviews/proposals-2026-11-16/lean docs/reviews/2026-11-16-persona-decision.html`.
- `current/<module>.json`: the findings and the block text they were checked against (after the 2026-11-16 factual corrections).
- `full/<module>.json`: every accepted finding folded in. `lean/<module>.json`: HIGH findings only. Each file carries the verdicts, the sources with quotes, the draft audit rows (`new_claims`), proposed figures, the owner-decision drafts and the list of assertions left out because no primary source could be read. The `full` files also list every change the checker made (`review`).

## Applying a choice

The unit is the block. From a clean checkout of the branch to change:

```
python3 tools/apply-persona-proposals.py --repo . --proposals docs/reviews/proposals-2026-11-16/lean --blocks le:job-loss:coverage,pr:health
python3 tools/apply-persona-proposals.py --repo . --proposals docs/reviews/proposals-2026-11-16/full --blocks le:divorce:qdro
node tools/plain-layer.mjs --stamp && python3 audit/export_claims_json.py && bash tools/verify-v2.sh
```

`--all` applies every changed block of a variant. New audit rows get the next free CL ids. Owner-decision drafts are never applied by the tool.

Two ready-made branches exist locally: `draft/persona-high-2026-11-16` (all 19 HIGH-only blocks) and `draft/persona-all-2026-11-16` (all 52 blocks), each with gates green.

## Owner decisions (drafted in the proposal files, applied nowhere)

- **le-job-loss** (CFP-9): Move the equity step ahead of the old-401k step, so the job-loss order becomes coverage, runway, equity, old-401k, withholding.
- **le-job-loss** (ADV-4, ADV-8): Two title edits: name Medicaid in the coverage title, and soften the old-401k title so it does not read as a ban.
- **le-new-baby** (CFP-14): Add a first step, 'Plan the leave and the pay gap', before le:new-baby:enroll.
- **le-new-baby** (CFP-14): Add an adoption step, 'Claim the adoption credit and any employer adoption help', after le:new-baby:ssn (shown only matters to adopting families).
- **le-new-baby** (CFP-14): Add one sentence to le:new-baby:ssn (or a separate short step) on the Trump Account pilot contribution.
- **le-divorce** (ADV-18, ADV-19): Optional layout change: move the safety and joint-debt sentences out of the counsel step into a new first step, 'Protect yourself first', so the counsel step stays near its current length.
- **le-home-purchase** (CFP-26): Add a 'First year' step to the home-purchase playbook: apply for any property-tax homestead exemption by the local deadline, and confirm how the deed is titled.
- **le-relocation** (CFP-29): Add a sixth relocation step 'Update payroll withholding and your address' (proposed id: le:relocation:address), placed after 'insurance' and before 'expenses'.
- **le-retirement** (CFP-39): Add a retirement step on choosing the pension payout form (lump sum or annuity; single-life or joint-and-survivor; spousal consent).
- **le-retirement** (CFP-40): Add a first retirement step for people stopping work before 65: plan health coverage until Medicare (COBRA or the Marketplace), noting that the income taken changes Marketplace premium help.
- **le-retirement** (CFP-44): Reorder the retirement steps so long-term care comes before Social Security, and relabel its 'when' from 'Before 70' to something like 'In your 50s or early 60s'.
- **annual-review** (CFP-62): Add a month-8 'Mid-year check' item to fill the empty July-September stretch: Social Security earnings record (SSA's own August timing), a withholding or estimated-tax recheck, and the FAFSA opening for families with a college student next year.

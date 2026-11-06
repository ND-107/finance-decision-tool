# MAINTENANCE.md — the annual figures-refresh ritual

The tool is only as good as its dated numbers. Every indexed figure carries a vintage
stamp and an expiry date, and **the build refuses to pass once a stamp has expired**
(`tools/validate-figures.mjs`, gate 2 of `tools/verify-v2.sh`). All 2026 entries expire
on 2026-12-31, so the first build of January 2027 will fail on purpose. That failure is
the reminder to run this ritual.

The one rule that outranks the rest: **every value is re-verified against its named primary
source on the day you change it — never from memory, never from a model's recall, never by
"bumping" last year's number.** CL362 is the cautionary tale: its IRMAA row was "verified"
against a source that itself carried the prior year's values, and the stale figure survived
an audit pass. Secondary sources (Kiplinger, CPA blogs) may be used to *find* a primary
document, not to *replace* it.

## When

| When | What triggers it | What to do |
|---|---|---|
| **January** (main ritual) | figures expire 12/31; IRS/SSA/CMS/HHS publish the new year's values in Oct–Jan | everything in the January checklist below |
| **Mid-January to February** | HHS publishes the new poverty guidelines (FPL) | update `fpl_single_*`; re-derive the IDR worked example (AdvStrat §7); note that the ACA 400%-FPL cliff figures use the **prior** year's FPL for the coverage year |
| **June** | Social Security and Medicare Trustees Reports | update `ss_oasi_depletion` and the Zeitgeist Gen-Z section prose |
| **July 1** | federal student-loan year; OBBBA transition dates (RAP launch 2026-07-01, legacy-IDR sunset 2028-07-01) | check `src/data/deadlines.json`, AdvStrat §7, and the loan Plan actions |
| **Any time a law passes** | new statute or IRS notice changes a figure mid-year | treat as an out-of-cycle refresh of the affected entries only |

## January checklist

1. **Find the new values at the primary source for each entry.** `src/data/figures.json` names the source in every entry's `source` field. The usual set:
   - IRS notice for retirement-plan limits (the "Notice 2025-67" family — 401(k)/403(b) deferral, catch-ups, IRA, §415(c), Roth-IRA phase-outs, Saver's Credit bands)
   - IRS Rev. Proc. for inflation adjustments (the "Rev. Proc. 2025-32" family — brackets, standard deduction, gift exclusion, estate exemption, QBI thresholds, health-FSA limit)
   - IRS Rev. Proc. for HSA limits (published in spring for the following year — "Rev. Proc. 2025-19" family)
   - SSA COLA fact sheet (taxable wage base)
   - CMS Medicare premiums fact sheet (Part B standard premium, IRMAA tiers and surcharges, Part D IRMAA)
   - HHS poverty guidelines (FPL) — later, see the table above
2. **Edit `src/data/figures.json` only.** For each entry: update `value` and `display`, set `taxYear` to the new year, `verified` to today's date, `expires` to the new year's 12-31, and rewrite `source` to name the exact new document. Do not leave an old source citation on a new number.
3. **Rename-free keys.** Keys are vintage-neutral (`limit_401k_deferral`, not `..._2026`); prose says "for 2026" in a few places — search for the old year (`grep -rn "for 2026\|2026" src/content/phase4`) and update the year words next to `{{fig:...}}` tokens.
4. **Resolve `[VERIFY]` placeholders.** `grep -rn "{{verify:" src/content` lists every figure the content needs that is not yet in the figures layer (none as of 2026-11-06: the five from Phase 4 were verified and moved into `figures.json` that day). For each one you verify at its primary source, add a figures.json entry and replace the `{{verify:...}}` token with `{{fig:new_key}}` in the canonical text **and** its plain variant.
5. **Hand-typed figures outside the figures layer.** The reference sections (`src/content/sections/*.html`), the live calculator subsystem (`src/ui/calculators-live.mjs`), node files (`src/content/nodes/*/*.json`) and plan prose (`src/core/plan-prose.mjs`) are verbatim v1 content and still contain literal dollar figures. They are *not* driven by figures.json. For each figure that changed, `grep` the old display value (e.g. `grep -rn '24,500' src/`). **Do not edit the sections or the calculator files** — gates 9 and 10 hold them byte-identical to `main:v1/flowchart.html`. Add an entry to `src/content/corrections.json` instead (target, exact `find`, `replace` with `{{fig:key}}` / `{{figval:key}}` tokens, expected `count`, claim id, reason, source, date). `build-v2.mjs` applies it; `node tools/verify-corrections.mjs` (gate 13) fails if the `find` no longer matches or the claim is still a stale PASS. Re-compute any derived number in the same sentence and say so in `reason`. The archived v1 at `main:v1/flowchart.html` is not changed by this; whether to change it is the owner's decision.
6. **Update the audit.** Each changed figure has a claim in `audit/build_audit_xlsx.py` (search its old value). Update claim text and source, set status, add a note "refreshed YYYY-MM-DD from <source>". Then regenerate: `python3 audit/build_audit_xlsx.py && python3 audit/export_claims_json.py`.
7. **Re-verify affected plain-English variants.** If any Phase 4 canonical text changed (step 3), `node tools/verify-phase4.mjs` names each block whose hash no longer matches. Re-read the plain variant against the new canonical text, fix it, then `node tools/plain-layer.mjs --stamp`. Stamping is the attestation that you re-read it — do not stamp blindly.
8. **Run every gate and build.** `./tools/verify-v2.sh` (all 13 green) then `node tools/build-v2.mjs`. Open `dist/v2.html`: the figures banner should read "TY<new year> figures · verified <today>"; spot-check the Annual review limits item and two calculators.
9. **Record it.** CHANGELOG entry listing every figure changed (old → new, source); update the status header of `docs/V2_REBUILD_PLAN.md` if anything structural changed.
10. **Deploy** (outward-facing — the repository owner signs off): the live site serves `main`'s `flowchart.html`, which is a copy of the built `dist/v2.html`; `v1/flowchart.html` stays untouched as the rollback.

## How to verify (what "verified" means here)

- The value was read **in the primary document itself** (IRS notice / Rev. Proc. PDF, SSA fact sheet, CMS fact sheet, Federal Register notice), not in a summary.
- The document is **for the right year** (check the effective date / "for taxable years beginning in …" line). This is the CL362 failure mode.
- Derived figures (e.g. combined IRMAA surcharge, the ACA cliff dollars, the IDR worked example) are **recomputed** from verified inputs, and the `source` says "Derived from …".
- If a value cannot be verified yet (the document isn't out), leave the old entry expired — the build failure is correct — or temporarily convert the content reference to `{{verify:...}}`. Never extend `expires` to silence the gate.

## Quick commands

```sh
node tools/validate-figures.mjs                    # gate 2 against today
node tools/validate-figures.mjs --today=2027-01-02 # prove the expiry gate fires
grep -rn "{{verify:" src/content                   # open placeholders
node tools/verify-corrections.mjs                  # corrections over verbatim v1 content (gate 13)
./tools/verify-v2.sh && node tools/build-v2.mjs     # everything
```

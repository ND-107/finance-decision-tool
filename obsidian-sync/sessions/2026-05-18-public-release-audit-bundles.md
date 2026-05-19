---
type: session
date: 2026-05-18
zone: coding
project: finance-decision-tool
title: "Public release to GitHub Pages + 5-persona bug audit + 5 fix bundles (A→E)"
status: done
next-step: "Thread closed. 6 LOW-tier audit items remain in backlog if extending — meta-refresh redirect (could be removed by renaming flowchart.html → index.html), getLiteracyScore 'unsure' treatment, unused criticalCount/nowCount locals, restrictedStockRecent='considering' missing from synthesis, safety-net 'mid' default footgun for partial diagnostic, Math view eager 8-calc chain on first visit. No work planned."
related:
  - "[[finance-decision-tool CHANGELOG]]"
  - "[[finance-decision-tool HANDOFF]]"
asana-task-gid: null
session-id: 2026-05-18-finance-decision-tool-public-release-audit-bundles
---

<!-- save-routing: cwd=finance, override=coding, reason="all edits + 7 commits + 7 pushes were in ~/code/finance-decision-tool/; finance-project was only touched by the SessionStart warm-up" -->

## Done

### Public release prep + push (commits `cc703cc` · `973e78e` · `7331940`)

- **PII scan** across `flowchart.html`, `docs/conversation_history.md` (37 Human turns, all procedural), `audit/build_audit_xlsx.py`, HANDOFF, README, CHANGELOG — clean. No PII leaks.
- **git filter-repo** rewrote all 37 commits from `ndrube <ndrube@icloud.com>` → `ND-107 <270592679+ND-107@users.noreply.github.com>` to keep personal email out of public history. (Original tip SHA `ff58f97520def68c6ddec5153c64df0150e0de7f` retained as rollback reference.)
- **Public repo created:** `gh repo create ND-107/finance-decision-tool --public --source=. --push` — first public repo on the `ND-107` GitHub account.
- **GitHub Pages enabled:** `main` / `/`. URL: https://nd-107.github.io/finance-decision-tool/. HTTPS enforced.
- **`LICENSE`** — MIT + educational-tool-not-financial-advice disclaimer.
- **`index.html`** — meta-refresh to `flowchart.html` so the Pages root URL lands on the tool.
- **`README.md` refresh** — Try-it section with live URL, accurate headline numbers (13 views / 27-question diagnostic / 447 claims / audit closed) sourced from HANDOFF.md, Disclaimer section, accurate file-list including `index.html`, accurate privacy/network-footprint description (corrected from a wrong claim that the tool uses localStorage / no tracking — actual: page does fetch Google Fonts; localStorage was added later).
- **Stale-string follow-up commit (`973e78e`)** — fixed `flowchart.html:1918` ("1928-2024" → "1928–2025" matching CL379 dataset update) and `docs/HANDOFF.md:21` (file-size + line-count refresh).
- **Repo topics + homepage** set via `gh repo edit` (personal-finance, decision-tool, financial-planning, interactive, retirement-planning, tax-planning, fact-checked).
- **Plan-view crash fix (commit `7331940`)** — `renderPlanSynthesis` line 5907 was calling `bracket()` but a local `const bracket = (string label)` from line 5800 shadowed the top-level `bracket()` helper for 125 lines. Anyone with non-empty diagnostic answers hit `TypeError: bracket is not a function`; the empty-answers early-return path was the only case that worked. Fix: changed line 5907 to use `a.taxBracket === 'low'` directly. Found via Node + vm.Context harness reproducing the throw.
- **localStorage persistence (same commit)** — added `LS_KEY = 'fdt:state-v1'` + `savePersistedState()` / `loadPersistedState()` covering answers, diagSection, view, fullChartIncome, fullChartBracket. Restores nav-tabs visibility + last view on reload. Try/catch wrapped for private-browsing / quota.

### 5-persona parallel bug audit

Spawned 5 specialized general-purpose agents in parallel: Adversarial QA Engineer (12 findings), Defensive Code Reviewer (15), Accessibility Reviewer (11), Security Researcher (6), Performance Auditor (10). Total 38 distinct findings after dedupe: 5 CRITICAL · 14 HIGH · 13 MED · 6 LOW. Output format was uniform (severity / where / what / why / repro / fix sketch) so synthesis was mechanical. Security verdict: genuinely solid static artifact — no `eval` / `document.write` / `<form>` / `<a href>` / free-text inputs / URL-param parsing anywhere.

### Bundle A (commit `8f4e73a`) — 5 CRITICAL fixes

1. **`loadPersistedState` validation cluster** (kills 5 audit findings): `sanitizeAnswers()` drops unknown keys + rejects values not in the question's option set (defends against XSS via crafted LS payloads); view name whitelisted against valid view IDs; `fullChartIncome` / `fullChartBracket` whitelisted; diagSection bounds-checked with `Number.isFinite` + `Math.max(0, Math.floor())`; array / non-object payloads atomically rejected; init `switchView` wrapped in try/catch — on failure resets to welcome + clears LS so a corrupt blob can never permanently brick the app.
2. **`state.openActions` stable key** — Plan actions now carry `act.key = hashKey(nodeKey + '::' + title)`; tracking by key not array position so open detail panels survive Edit-Answers cycles. Click handler toggles all `.action[data-action-key=X]` elements together, fixing the Tier-1 / stage duplicate-card desync.
3. **Global `:focus-visible` style** — 2px ink outline on every focusable element on keyboard focus.
4. **Keyboard-reachable diagnostic options** — `.option` divs got `role=radio|checkbox`, `tabindex=0`, `aria-checked`. Wrapping `.options-grid` got `role=radiogroup|group` + `aria-labelledby`. Keydown handler activates on Enter / Space. Previously the 27-question core flow was mouse-only — total exclusion of keyboard / switch / screen-reader users.
5. **Button semantics on action toggles + `aria-current` on view tabs** — `.action-toggle` is now a real `<button>` with `aria-expanded` / `aria-controls`.

### Bundle B (commit `fd5857c`) — 4 HIGH correctness fixes

6. **Dead `emergencyFund` constraint** — `renderPlanSynthesis` was checking `'no' || 'partial'` values that don't exist in the schema (real options: `'0' / '<1mo' / '1-3mo' / ...`). The binding-constraints paragraph silently never surfaced the EF gate even when `computePlan` correctly fired a critical starter-EF action — Plan output contradicted itself. Now: `'0' || '<1mo' || '1-3mo'`.
7. **`FRICTION_RULES` missing patterns** — IDR audit, servicer-history dispute / CFPB complaint, partial Roth conversions were silently defaulting to `'low'` friction, putting them above genuinely-easy items in Tier-1 "ranked by ease of starting" anchor. Added regex patterns to elevate them to `'high'` / `'med'`.
8. **`bracket` shadow renamed** — `const bracket` in `renderPlanSynthesis` (still in scope for 125 lines after the `7331940` callsite fix) renamed to `bracketLabel`. The tripwire is gone — future contributors writing `bracket()` inside this function won't reintroduce the crash.
9. **`cascadeClearOrphanedAnswers()`** — walks `QUESTIONS`, removes any answer whose question's (or section's) `showIf` returns false for current state. Loops until stable. Called after every answer change in `renderDiagnostic` AND at init after `loadPersistedState`. Fixes the QA-flagged pattern where changing `filingStatus: mfj → single` still drove "spousal-alignment gap" narrative in synthesis because the orphan `spousalAlign*` answers persisted.

### Bundle C (commit `2c1b3a2`) — 5 HIGH a11y polish

10. **Contrast bump** — `--muted #6B7280` → `#5A6470` (4.22:1 → 5.02:1 — passes AA body text). `--muted-soft #9CA3AF` → `#6B7280` (passes non-text 3:1). Four `<em>` text uses of `--accent` (2.74:1) switched to `--accent-dark` #8B6520 (4.61:1).
11. **Focus management + `sr-status` live region** — visually-hidden `#sr-status` with `aria-live=polite`. `srAnnounce()` updates it on switchView ("Now viewing: <title>"), renderDiagnostic ("Section X of N: <name>"), renderPlan ("Your personalized plan is ready, N actions"). `focusViewHeading()` moves focus to the new view's h2 with `tabindex=-1` after switchView.
12. **Calculator label associations** — IIFE walks all `.calc-row / .input-row`, sets `label.htmlFor = input.id`. One pass fixes ~100 inputs.
13. **Diagnostic progress bar** — `role="progressbar"` + `aria-valuemin / aria-valuenow / aria-valuemax / aria-valuetext / aria-label`. `renderDiagnostic` updates per section.
14. **SVG chart `aria-label`** — `renderSVG` now copies the wrapper div's `aria-label` onto the `<svg role="img">` element itself, where it's reliably exposed to AT.

### Bundle D (commit `d96080f`) — 3 HIGH performance fixes

15. **Partial-update diagnostic option clicks** — snapshot answers before/after, run cascadeClear, only call full `renderDiagnostic` if other answers changed. Common case (single-select on non-gating question) drops from ~5-15 ms / click to ~0.5 ms.
16. **`__debounce(fn, ms)` with WeakMap memoization** — same fn always returns the same wrapper so multiple inputs sharing a calc fn share a single timer. Applied uniformly to all 22 calc input listeners via a one-line regex pass. 80 ms debounce. Eliminates per-keystroke jank in Math §7 historical-cycles simulator (was running 68 cohorts × 30 years + SVG fan-chart re-render on every keystroke).
17. **`planCache` short-circuit** — `planRenderedHash` tracks the answers-hash the DOM matches. `renderPlan` returns early if hash matches AND `#plan-stages` has content. Tab-switching to Plan without changing answers is now ~0 ms instead of ~30-80 ms rebuild.

### Bundle E (commit `c904cfc`) — 13 MED-tier fixes

18. **CSP `<meta>`** — `default-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; script-src 'self' 'unsafe-inline'; img-src 'self' data:; frame-ancestors 'none'; form-action 'none'; base-uri 'self'`. `frame-ancestors 'none'` covers clickjacking. `'unsafe-inline'` for scripts/styles forced by the single-file architecture.
19. **`prefers-reduced-motion`** — global `@media` rule disables animations + transitions + scroll-behavior. 3 JS `behavior: 'smooth'` sites gated on `matchMedia`.
20. **Stronger `.selected` visual** — 4px left border + 14% accent overlay (was 8%) + font-weight 500. Robust non-color cue for color-blind / low-vision users.
21. **`<main id="main">` wrapper + skip-link + `aria-label` on every view section.** Bypass-blocks pattern satisfied; AT users can jump past masthead/nav in one Tab.
22. **Retired + W-2 narrative dedupe** — filter `'retired'` out of `incomeLabels` when earned-income types are also selected. Removes nonsensical "age retired retired and W-2 employee" string.
23. **`$val` honors per-input min/max attributes** + ±1e12 absolute cap for inputs lacking them. Added `min` / `max` attrs to all 124 number inputs via Python regex (max=100 for years, max=50 for rate, max=120 for age).
24. **`parseInt` NaN guard on SS claim ages** — `Number.isFinite` check, falls back to FRA=67. Previously bad input silently flowed to `SSA_CLAIM_AGE_FACTOR[NaN] || 1.0` — wrong-by-19% benefit projection.
25. **`applyDefaultIfFallback` tightened** — only overwrites empty inputs. Dropped the "value equals fallback" branch that could overwrite a user-typed value matching the hardcoded default.
26. **Personal-chart skipped-action match** — normalize both sides identically (strip non-alpha, collapse whitespace) before substring-matching. Previously most skip reasons fell through to the generic message.
27. **`window 'storage'` event listener** — when another tab writes our LS key, reload state + re-render current view. Eliminates silent last-writer-wins on two-tab editing.
28. **Schema version field (`LS_SCHEMA_VERSION = 1`)** — on version mismatch at load, wipe + console.warn + start fresh.
29. **Non-render-blocking Google Fonts** — `media="print" onload="this.media='all'"` swap trick + `<noscript>` fallback. ~100-300 ms FCP improvement on Slow 3G per perf-auditor estimate.
30. **Action card click delegation** — single handler on `#plan-stages` + `#plan-tier1` (idempotent via `__actionDelegated` flag) instead of N per-card listeners.

### Verification cumulative

- 68 harness assertions across 5 bundles (23 + 17 + 7 + 7 + 14), all pass. Pattern: Node + `vm.Context` with stubbed DOM + stubbed localStorage; exposed needed bindings via `globalThis.__exposed`. Caught everything except items requiring real browser layout/styling.
- `./verify.sh` (HTML parse + inline JS `node --check` + audit xlsx regen) green after each bundle.
- All 7 GitHub Pages builds completed cleanly (~40-60 s each).
- Final deployed file: 810 KB (`~260 KB` gzipped), all post-Bundle-E markers verified present via `curl + grep`.

## Open

- **6 LOW-tier audit items** as optional follow-up:
  - `switchView` dispatch missing `welcome` + `advanced-strategies` cases (current behavior is fine since both are static HTML, but it's a footgun for future dynamic content)
  - `getLiteracyScore` treats `'unsure'` as wrong → misclassifies cautious users as low-literacy
  - Unused `criticalCount` / `nowCount` locals in `renderPlanSynthesis` (dead code)
  - `restrictedStockRecent='considering'` fires a Plan action but never appears in synthesis (asymmetric framing)
  - Safety-net program eligibility uses `bracket()` default `'mid'` (footgun on partial diagnostic — the `'mid'` fallback means the SAVE / safety-net action could render for any variable-income SE user before they answer the bracket question)
  - Math view eager 8-calc chain on first visit (~10-20 ms; intentional for defaults; not worth changing)
  - Plus: `index.html` meta-refresh deprecated (could rename `flowchart.html → index.html` to remove)
- **Launch-post drafts ready** (Show HN / r/financialindependence / Bogleheads forum) — written in conversation, not yet posted. User to post when ready.

## Notes

- **Persona-driven audit pattern was unusually effective.** 5 parallel general-purpose agents with distinct lenses produced 38 deduplicated findings with minimal noise. The Defensive Reviewer + Adversarial QA pair complemented each other: Defensive caught the `bracket` shadow tripwire from reading code alone, Adversarial QA caught the `state.openActions` positional-idx bug by simulating Edit-Answers cycles. Worth replicating the pattern.
- **Node + `vm.Context` harness pattern** was the right tooling for this codebase — single-file HTML with no build step, mostly synchronous, mostly DOM-stubable. Caught all logic bugs without needing a real browser. Won't scale to layout-dependent bugs.
- **The `bracket()` shadow bug** is the perfect example of why audits matter. It shipped in the original chat-built version because the empty-answers early-return at line 5791 was the only path that ever got tested. Every real diagnostic completion would have hit `TypeError`. The framework's own audit (447 claims, all PASS or CORRECTED) didn't catch it because the audit covers empirical claims, not code behavior.
- **`git filter-repo` rewrites refs too.** I tagged `backup/pre-email-rewrite` on the original SHA expecting it to be a rollback ref, but filter-repo rewrites tags along with everything else — the tag now points at the rewritten tip. Tree content is unchanged by definition (only email metadata was modified), so this is fine, but worth remembering: if you need a real rollback tag for a filter-repo run, save the original SHA in a file outside the repo.
- **GitHub Pages auto-rebuilds on push** (~40-90 s per build). Polled via `gh api repos/<owner>/<repo>/pages/builds/latest --jq .status` in an `until` loop with `run_in_background: true` — clean pattern for the async wait.
- **First public repo on the `ND-107` account.** Email-rewrite was the right precaution; `ndrube@icloud.com` is now nowhere in the public commit history.
- **Tool stack on disk: 810 KB / 7,917 lines / 117 KB CSS / ~390 KB inline JS.** Gzipped wire: ~260 KB. Bundle E added the meta CSP + skip-link + landmarks + `<noscript>` fallback + min/max attrs to 124 inputs + a small CSS reduced-motion block — all of that adds ~28 KB on disk but the gzip ratio absorbs most of it.

## Related

- [[finance-decision-tool CHANGELOG]] — append-only commit-level log
- [[finance-decision-tool HANDOFF]] — durable spec, architecture, conventions

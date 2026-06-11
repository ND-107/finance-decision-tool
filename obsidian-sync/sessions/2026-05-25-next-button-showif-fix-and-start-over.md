---
type: session
date: 2026-05-25
zone: coding
project: finance-decision-tool
title: "Fix Next-button stuck on showIf reveals + add Start-over button"
status: done
next-step: "Thread closed. User confirmed live site works on iPhone after the commit pushed: Section 3 student-loan follow-ups appear, Start-over button visible. No follow-up planned."
related:
  - "[[Finance]]"
asana-task-gid: null
session-id: 2026-05-25-next-button-showif-fix-and-start-over
---

<!-- save-routing: cwd=finance, override=coding, reason="entire session was bug fixes in ~/code/finance-decision-tool/flowchart.html — finance-project/ was just the shell cwd" -->

## Done

- **Root-cause Section 3 "Yes on federalStudentLoans" bug.** Option click handler's perf branch (`onlyThisChanged` partial update) skipped `renderDiagnostic` when nothing besides the clicked answer changed — so the three newly-`showIf`-revealed questions (`pslfEligible`, `studentLoanAudited`, `currentIDRPlan`) never entered the DOM, and Next stayed disabled because `isSectionComplete` counted those hidden questions as unanswered.
- **Generic fix via `activeQuestionSignature()` snapshot.** Captures the full active-questions tree (sections × visible question IDs) before the click; falls through to full re-render whenever the post-click signature differs. Catches every within-section reveal (Section 1 spousal, Section 3 student loans, Section 4 employer-match + HDHP, Section 5 SE plan, Section 6 dependents) AND cross-section changes (toggling `incomeTypes` adds/removes the Business specifics section + updates the "Section X of Y" label).
- **Section navigation now persists across refresh.** `diagNext` and `diagPrev` call `savePersistedState()` — previously only the option click handler did, so advancing via Next without subsequently clicking an answer never persisted `state.diagSection`.
- **New `state.diagnosticCompleted` boolean gates the post-completion tab nav.** Mid-diagnostic refresh no longer reveals the tab nav + "Edit answers" pseudo-tab. `LS_SCHEMA_VERSION` bumped 1→2 so returning users get a clean reset rather than `diagnosticCompleted: undefined` ambiguity.
- **Full-chart income/bracket selectors now call `savePersistedState()` on click** — previously updated state in memory but never persisted.
- **"Start over" button** in two places: Plan-view footer panel + persistent `↻ Start over` button in the masthead. Mobile (≤640px) pins the masthead button `position: fixed` bottom-right so long views keep it reachable. Both share `resetDiagnostic()` — confirm dialog → `localStorage.removeItem(LS_KEY)` → `window.location.reload()`.
- **Cache-control meta tags** (`no-cache` / `no-store` / `Pragma` / `Expires`) added to the document `<head>`.
- **All checks green:** `./verify.sh` (HTML parse + node `--check` inline JS + audit xlsx regen). Commit `b465ef4` pushed to `main`. GitHub Pages rebuilt. User confirmed live site works.

## Open

Nothing pending.

## Notes

- Real failure mode for the entire iteration loop wasn't a code bug — it was that all fixes were sitting uncommitted on the laptop while the user kept testing https://nd-107.github.io/finance-decision-tool/ on iPhone. Cache-control meta tags only help when there's something new to fetch. Next time: push first, then ask to verify.
- The §1.5 cwd-vs-topic mismatch (started from `finance-project/` cwd but was 100% finance-decision-tool work) is the common shape for "Claude Code session about a deployed coding project" — worth checking the project's `obsidian-sync/sessions/` directory before routing.
- Mid-conversation static audit of all interactive surfaces (7 sections × showIf patterns, tab nav, plan-action expand/collapse, chart node toggles, full-chart selectors, ~20 debounced calculators, storage sync, keyboard activation) surfaced no other bugs beyond the ones fixed in this commit. Mobile touch targets on `.option` are ~42px (slightly below WCAG 2.5.5 AAA 44×44 minimum) but the `.btn` and `.masthead-restart` hit 44px — flagged but not fixed this session.

## Related

- [[Finance]]

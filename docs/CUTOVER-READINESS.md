# v2 Cutover Readiness (Phase 6)

Status as of 2026-06-16, branch `v2`. **Verdict: NOT cutover-ready.** `dist/v2.html`
faithfully reproduces v1's *diagnostic → prioritized plan* core (and improves on it),
but v1 is far more than that — it is also a browsable reference encyclopedia with ~80
interactive calculators. Those are not yet built in v2. This doc is the gap list and
the accessibility status, from the 5-lens cutover audit.

## Parity matrix — v1's 14 views vs v2

| v1 view | v2 status | Notes |
|---|---|---|
| welcome | ✅ present | `welcome()` — equivalent intro/start. |
| diagnostic | ✅ present | `diagnostic()` off declarative `questions.json`; behavior-equivalent to v1 closures (4.2M-comparison gate). |
| plan | ✅ present (extended) | `planPanel()` off the data-driven engine (3030/3030 parity), **plus** net-new prose reasons, figures banner, markdown/ICS export, scenario toggles. |
| personal-chart | ❌ missing | v1 renders the framework filtered to the user's answers as a browsable chart. v2 has only the linear plan list (no graph projection — "Graph projections" is queued). |
| full-chart | ❌ missing | v1's answer-independent master chart with the **bracket-selector** — ~62% of v1 (lines 3254–8344), with ~12 calc-result + ~16 simulator blocks inline. v2 has no chart view and no bracket selector. |
| math | 🟡 partial | No standalone view (`content/sections/` is empty, no nav). Some math prose survives inside per-action detail panels, but v1's 7 calculators / 43 inputs here are **not** ported (any calc markup in node JSON renders dead). |
| spending-essentials | 🟡 partial | No view; 5 calculators / 33 inputs unported. Only prose fragments via node details. |
| spending-lifestyle | 🟡 partial | No view; 3 calculators / 11 inputs unported. |
| portfolio-bogleheads | 🟡 partial | No view; 1 calculator / 6 inputs unported. |
| portfolio-theory | 🟡 partial | No view; 2 calculators / 11 inputs unported. |
| zeitgeist-investing | 🟡 partial | No view; 2 calculators / 11 inputs unported. |
| zeitgeist-lifestyle | 🟡 partial | No view; 1 calculator / 6 inputs unported. |
| advanced-strategies | 🟡 partial | Long-form Phase-7 playbook prose (0 calculators); partially reachable via high-phase action node details, but no browsable page. |
| **calculators + simulators + bracket-selector** | ❌ missing | The single largest gap: ~80 interactive blocks / 22 calculator widgets / ~33 simulator refs across 6 `wire*` functions in v1. `src/core/calculators/` is empty; the UI wires none. 3 node JSONs (w2/3.1, w2/0.1, contractor/8.1) still carry calc markup that renders as dead inputs. |

**Score: 3 of 14 views have a v2 equivalent.** The diagnostic→plan product is done; the reference encyclopedia + calculators are not.

## Cutover blockers (ordered)

1. **Calculators/simulators unbuilt** (hard). Port the pure calculator modules into `src/core/calculators/` and wire them into the UI. Strip or wire the dead calc markup in the 3 node JSONs.
2. **full-chart + bracket-selector missing** (hard). The browsable master chart of every phase/node, switchable by tax bracket — the bulk of v1.
3. **personal-chart missing**. The answer-filtered browsable chart (or a conscious decision to drop it in favor of the plan list).
4. **7 reference-prose views have no home**. `content/sections/` is empty and there is no nav. Per view, decide: extract section prose into `content/sections/` + add nav, OR confirm the node-detail panels subsume it.
5. **No top-level navigation** (no view-tabs/router). Even once sections/calculators exist, nothing routes to them.
6. **Reference-content completeness check**. Quantify whether the union of the 93 node `detailsHtml` panels actually covers v1's math/spending/portfolio/zeitgeist/advanced reference prose, or measure what's dropped.

These constitute the remaining work (call it "Phase 7 — reference views + calculators") before `v2` can replace `flowchart.html` on GitHub Pages. The diagnostic→plan core could ship behind a feature flag earlier, but a straight swap would regress every reference/calculator user.

## Accessibility — fixed in this pass

The diagnostic→plan UI that exists was audited across 4 lenses (29 findings; 12 critical/serious). Fixed on branch `v2`:

- **Forms/semantics:** options wrapped in `role=radiogroup`/`group` with `aria-labelledby` → the question label; completion checkboxes given `aria-label="Mark done: <title>"`; decorative `.dot`/`.check-box` `aria-hidden`.
- **Focus management (was a real barrier):** the SPA wiped `#app` on every render and dropped focus to `<body>`. Now each control carries a stable `data-fk`; `render()` captures the focused key and restores it after rebuild. Verified: clicking an option keeps focus on that option.
- **Live region:** persistent `#sr-live` (`role=status`, outside `#app`) announces section changes and plan recomputation (WCAG 4.1.3). `.flash` toast given `role=status`.
- **Headings:** plan/diagnostic headings promoted to `<h2>` — fixes the H1→H3 skip (verified first-heading-after-H1 = H2).
- **Progress bar:** `role=progressbar` + `aria-valuenow/min/max/valuetext`.
- **Disclosure:** `.detail-toggle` given `aria-expanded` + `aria-controls`.
- **Contrast (WCAG 1.4.3/1.4.11):** chip/tag text `#6b6b6b`→`--muted-strong #595959` (4.16→5.47:1); control borders `--line`→`--line-strong #8a8478` (1.28→3.5–3.7:1).
- **Focus visible (2.4.7):** `:focus-visible` outline globally + on custom option/checkbox controls; **skip-link** moved off-inline-style into a class that reveals on `:focus`.
- **Reduced motion (2.3.3):** `@media (prefers-reduced-motion: reduce)` neutralizes transitions/animations.
- **Don't-rely-on-color (1.4.1):** deadline urgency now reads "Overdue —"/"Due soon —" in text; scenario `−` strike alpha raised.
- **Target size / types:** toggle/summary min-height 24px; `type="button"` on all non-submit buttons; `aside` labeled; emoji wrapped `aria-hidden`.

**Remaining a11y (minor):** the node `detailsHtml` reference content uses `<h4>` inside the plan, producing an H2→H4 jump within collapsed disclosures (would require editing the 93 node JSONs); full `:focus`/`:focus-visible` *rendering* couldn't be verified headlessly (Chrome doesn't apply `:focus` without OS window focus) — the rules are standard and present in the bundle. A real-AT pass (VoiceOver/NVDA) and `axe-core` run are recommended before launch.

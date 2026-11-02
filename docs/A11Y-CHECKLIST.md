# v2 Accessibility — pre-launch checklist

Status of v2 (`dist/v2.html`) accessibility, and the remaining checks that need a
network (for `axe-core`) or a human (for a screen reader) — i.e. the final pass to
run before flipping v2 live.

## Done & verified (in this repo, headless Chrome)

**App shell** (diagnostic → plan → nav), fixed in `dbd906f`:
- SPA focus restoration on re-render (`data-fk` capture/restore) — keyboard users keep their place.
- `#sr-live` polite live region announces section + plan changes; `.flash` toast `role=status`.
- Diagnostic options as `role=radiogroup`/`group` with `aria-labelledby`; completion checkboxes `aria-label="Mark done: …"`.
- Heading hierarchy h1→h2 (no skip in the shell); `role=progressbar` + `aria-value*`; disclosure `aria-expanded`/`aria-controls`.
- Contrast tokens for the v2 (green) shell: chip text 5.47:1, control borders 3.5–3.7:1. `:focus-visible` outlines; reveal-on-focus skip-link; `prefers-reduced-motion`. `type=button` on all buttons; labeled `aside`; 24px tap targets.

**Phase-7 new surface** (reference views, charts, live calculators), fixed in `9229122`:
- Full/personal-chart node cards are keyboard-operable (`role=button` + `tabindex=0` + `aria-expanded` + `aria-controls`, Enter/Space). *Verified: Enter expands, aria-expanded syncs, 28 interactive heads.*
- Bare `<label>X</label><input>` calc markup (v1 verbatim) auto-associated via `associateLabels()`. *Verified: 50/50 math-view labels.*
- SVG charts carry an accessible name (`renderSVG` sets `<svg role="img">` + copies the wrapper `aria-label`). ✓
- Section/chart views are landmarked (`<section aria-label="…">`); nav is `<nav aria-label>`.
- **Cross-view smoke: all 11 views render, 0 JS console errors.**

**Phase 4/5 surface** (life events, protection, annual review, sources toggle, deep links, plain-English toggles), 2026-11-02:
- [x] **axe-core 4.10.2 automated scan — done headless** (`tools/a11y-axe.mjs`, puppeteer-core + a local `axe.min.js`; tags wcag2a/aa, wcag21a/aa, wcag22aa, best-practice). 18 scans: welcome, diagnostic+plan (seeded profile), all 11 reference/chart views, the 3 new views, and sources-on / plain-on / deep-linked-node variants. **First run: 12 violation groups (9 serious/critical). After fixes: 0 violations in all 18 scans.**
  - fixed `aria-progressbar-name` (serious): diagnostic progress bar now `aria-label="Diagnostic progress"`.
  - fixed `label` (critical): node-detail inline calculators (`data-calc` inputs, no id) — `associateLabels()` now assigns a stable id and runs on every view incl. the plan (whose details embed node HTML).
  - fixed `color-contrast` (serious): the new deep links inside v1's warm-palette views inherited gold `#B8893E` (2.89:1) → `#7a5818` (5.97:1) + underline. The inherited v1 gold small text in the table below did **not** fire in these scans.
  - fixed `heading-order` (moderate): v1 node-detail `<h4>`/`<h5>` under an `<h2>` are re-levelled semantically (`role=heading aria-level=3/4`) at render — verbatim markup and styling untouched; annual-review step titles are `<h3>`.
- [x] New controls: per-block "Plain English" toggles and "Show sources" are `aria-pressed` buttons; plain toggles `aria-controls` their block; step checkboxes `aria-label="Mark done: …"`; event picker is a labelled group of links with `aria-current`; EF calculator inputs have `<label for>` and its result is a polite live region; every new view carries a `model-limits` note.
- [x] Deep links move focus to the routed target (section/card heading gets `tabindex=-1`; chart node head is focused and expanded); nav changes are announced through `#sr-live`; back/forward re-route (`popstate`).
- [x] 375px viewport: no horizontal overflow on the 3 new views; print stylesheet hides nav/toggles/sources for the checklist one-pager (verified via headless print-to-PDF).

## Open items — decide before launch

These are **inherited from v1's design** (the reference views reproduce v1's markup + warm palette verbatim). Reproducing v1 faithfully means reproducing these; "fixing" them deviates from v1's brand. Your call per item.

| Item | Measured | WCAG | Options |
|---|---|---|---|
| `--accent` gold `#B8893E` as **small** text on cream | 2.74–3.06:1 | 1.4.3 AA (4.5) | Keep (v1 fidelity) · or darken scoped `--accent`→`#8B6520` (4.61:1) in `.sectionview`. The big `.calc-result-headline` is large text → passes 3:1. |
| `.segmented` **active** button: white on gold | 3.14:1 | 1.4.3 AA | Keep (it's a UI element / large-ish) · or darken active bg to `--accent-dark`. |
| Heading skips **h2→h4** inside node-detail / reference prose | — | 1.3.1 (A) | ✅ Resolved 2026-11-02 without editing content: re-levelled via `role=heading aria-level` at render (axe heading-order clean). |

## The pre-launch AT pass (needs a network / a human)

**1. `axe-core` automated scan** — ✅ done 2026-11-02 headless (see above; re-run with `AXE_JS=… PUPPETEER_CORE=… node tools/a11y-axe.mjs`). Manual per-view axe DevTools runs remain optional:
```bash
# from a machine with network + npx:
npx -y @axe-core/cli "file:///ABS/PATH/dist/v2.html" --exit
#   …and per view (axe only sees the rendered DOM): open dist/v2.html in a browser,
#   switch to each nav tab, and run the axe DevTools extension on each view
#   (plan, personal-chart, full-chart, math, spending-*, portfolio-*, zeitgeist-*, advanced).
# Triage: critical/serious first. Expect the inherited-contrast items above; confirm
# no NEW violations beyond them.
```
Alternative without network: download `axe.min.js` once, inject it before `</body>` in a temp copy, and run `axe.run().then(r => console.log(JSON.stringify(r.violations)))` via headless Chrome `--dump-dom` (the harness used for the other checks).

**2. Manual screen-reader pass** (VoiceOver on macOS ⌘F5 / NVDA on Windows):
- [ ] Welcome → Start: focus lands sensibly; the diagnostic is announced.
- [ ] Diagnostic: each question is a labeled radiogroup; arrow/Tab + Space selects; the live region announces "Section N of M" and "Plan updated: N actions".
- [ ] Plan: Tier-1 + stages read in order; action checkboxes announce "Mark done: <title>"; ticking announces the change.
- [ ] Nav tabs: announced as tabs, `aria-current` on the active one; activating one announces "Now viewing: …".
- [ ] Full/personal chart: phase headings navigable; a node head reads as a button "expanded/collapsed"; Enter expands; the SVG charts read their `aria-label`.
- [ ] Calculators: each input reads its label; results are reachable (note: result regions are not `aria-live` — consider whether SR users should hear recomputes, or read on demand).
- [ ] Reference views: headings form a navigable outline; no keyboard traps.
- [ ] Reduced motion honored; 200% zoom reflows without loss.

**3. Keyboard-only pass:** Tab through every view start-to-finish — everything reachable, visible focus throughout, nothing operable by mouse only, no traps.

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

## Open items — decide before launch

These are **inherited from v1's design** (the reference views reproduce v1's markup + warm palette verbatim). Reproducing v1 faithfully means reproducing these; "fixing" them deviates from v1's brand. Your call per item.

| Item | Measured | WCAG | Options |
|---|---|---|---|
| `--accent` gold `#B8893E` as **small** text on cream | 2.74–3.06:1 | 1.4.3 AA (4.5) | Keep (v1 fidelity) · or darken scoped `--accent`→`#8B6520` (4.61:1) in `.sectionview`. The big `.calc-result-headline` is large text → passes 3:1. |
| `.segmented` **active** button: white on gold | 3.14:1 | 1.4.3 AA | Keep (it's a UI element / large-ish) · or darken active bg to `--accent-dark`. |
| Heading skips **h2→h4** inside node-detail / reference prose | — | 1.3.1 (A) | Inherited from v1's detail HTML (93 node files + section prose). Low priority; would require editing content. |

## The pre-launch AT pass (needs a network / a human)

**1. `axe-core` automated scan** (needs network to fetch axe, or a local copy):
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

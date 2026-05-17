# START_HERE.md — Launch Prompt for Claude Code

Paste the content below (or point Claude Code to this file) at the start of your first session in Claude Code.

---

I'm picking up a multi-session project that was previously running in Claude.ai chat. The project has grown beyond what's tractable in a chat window — it's a ~6000-line HTML artifact with a substantial audit database and a multi-phase plan, and we've reached the point where filesystem-grounded work is the right move.

**First task: orient yourself.** Read these files in this order:

1. `HANDOFF.md` — comprehensive project orientation. Read this in full before doing anything else. It covers the user, the artifact, the phase plan, the architectural decisions, the persona system, the audit conventions, the confirmed scope decisions, and the outstanding work.

2. `flowchart.html` — the artifact itself. Open in a browser to see how it looks; skim the file to understand the structure. You don't need to read every line, but get a feel for the conventions (math callouts, model-limits notes, calculator pattern, etc.).

3. `build_audit_xlsx.py` — the audit database in code form. Skim to understand the entry format and the current state per phase.

4. `conversation_history.md` — only consult as needed when researching specific past decisions. Don't read this front-to-back; use grep to find specific CL IDs, phase names, or technical terms when context is needed.

**The current state, briefly.** Phases 1–5 of the framework are complete and built into the artifact. A consolidated sub-phase to clear ~58 deferred backlog items across P2.5, P3.5, P4.5, and P5.5 has been substantially completed during the chat sessions. The historical-cycles simulator is built, the 3×3 asset location matrix is built with waterfall optimizer, the personalized-defaults pattern is established, Dave Ramsey / Gen-Z / DINK sections are built, all model-limits notes are in place, and all eight P5B clinical additions are integrated. The audit was kept reasonably current: it currently shows 245 PASS, 78 CORRECTED, 1 PARTIAL, 3 FAIL, and just **1 remaining DEFERRED item** (CL161, SVG charts).

**Your first work tasks, in order:**

1. **Light verification pass.** Spot-check perhaps a dozen of the audit's CORRECTED claims across phases to confirm the audit and artifact are in sync. Pick claims from each phase. For each, grep the artifact for evidence the item was implemented and confirm the audit's "APPLIED:" note matches reality. If you find discrepancies, flag them and either correct the audit or the artifact as appropriate. If the spot-check looks clean, declare the consolidated sub-phase done. Don't spend more than necessary on this — it's verification, not deep audit.

2. **CL161 — SVG charts.** The one genuine remaining backlog item. Add inline SVG visualizations to two Math view calculators: (a) compound interest §1, a year-by-year stacked bar chart of principal vs accumulated growth, and (b) sequence risk §5, two paths over the 30-year horizon showing the bad-sequence-early vs bad-sequence-late difference. Optional third: §7 historical-cycles, a percentile fan chart of ending balances. SVG generated inline by JS, no external library dependency. Visual style should match the existing artifact (muted palette, clean grid, sparing labels — see existing CSS for cues). After implementation, update CL161 to CORRECTED in `build_audit_xlsx.py` and rebuild the xlsx.

3. **Then propose Phase 6 — original 5 personas review.** With the consolidated sub-phase genuinely done, the next phase is the original 5 personas reviewing the cleared Phases 1–5 work. The five personas are listed in HANDOFF.md. Each produces 8–10 findings. Plan how to run them — possibly all five in a single batch since they're reviewing the same content from different angles, or split across sessions for tractability. Surface this decision to ND before starting.

**Style and approach notes for working with this user.** The user is ND, a sophisticated investor. Prose over bullets in long-form responses. Direct disagreement when warranted. Technical depth expected; do not soft-pedal. Thesis-driven engagement. The framework's accumulated guidance throughout uses cross-references between sections — new content should weave into those rather than restate context. When you find architectural decisions documented in HANDOFF.md, follow them rather than inventing new patterns. When you find audit conventions, follow them rather than inventing new conventions. When in doubt about scope, ask before building.

**One specific architectural note worth highlighting.** The Monte Carlo backend has a swap interface (`getMCBackend()` returns `{simulate: historicalCyclesSimulate}` by default but reads `window.__customMCBackend` first). ND has indicated they may plug in their personal Monte Carlo system later. When working on anything that touches the retirement simulation logic, preserve this interface — don't inline the historical-cycles logic into calling code or otherwise close off the swap path.

**Working pattern.** This project has been iterative — propose a plan, get confirmation, execute, present results, iterate. Don't dump 58 items of work into a single response. Work in batches with clear stopping points. Update the audit as you go. Verify the artifact's JS parses after each substantive edit (`node -e "..."` or similar). Present findings concisely in prose, surface decisions that need ND's input, and ask before reopening scope decisions that were already settled.

Begin with the verification pass. Report findings in prose, with the per-phase summary, before moving to CL161 or proposing Phase 6.

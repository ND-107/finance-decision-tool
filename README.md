# finance-decision-tool

Single-file interactive personal-finance decision tool — a diagnostic-driven framework with 12 views, 35 sections, 21 calculators, a 25-question diagnostic, and a decision engine that produces personalized plans. Built for a sophisticated investor.

The deliverable is `flowchart.html` — self-contained HTML/CSS/JS, no external dependencies. Open it in a browser.

## Topics covered

Tax-advantaged accounts (Phase 1 — W2, contractor, business contexts) · math bedrock (compound interest, Rule of 72, savings rate, real vs nominal, sequence risk, asset location, historical-cycles retirement simulator) · spending strategies (housing, transportation, healthcare, insurance, food, childcare, subscriptions, lifestyle creep) · portfolio construction (Bogleheads + MPT/CAPM/Fama-French theory) · cultural moments (FIRE, FinTok, retail trading, crypto, Die with Zero, Dave Ramsey, dividend investing, Gen-Z anxiety, DINK, behavioral synthesis).

## How it's structured

- `flowchart.html` — the artifact.
- `audit/` — fact-check audit. 328 claims tracked (CL001–CL328) with status, credibility tier, and source citation. `build_audit_xlsx.py` is the source of truth; the `.xlsx` is generated from it.
- `docs/` — orientation (`HANDOFF.md` is the durable spec; `START_HERE.md` is the launch prompt for a fresh Claude Code session; `conversation_history.md` is the reference transcript from the chat sessions that produced everything above).
- `verify.sh` — fast HTML parse + JS check + audit regen.

## Working on it

```sh
# After substantive edits:
./verify.sh

# Open the artifact:
open flowchart.html

# Regenerate audit xlsx after editing build_audit_xlsx.py:
python3 audit/build_audit_xlsx.py
```

Project rules are in `CLAUDE.md`. Read `docs/HANDOFF.md` before structural changes.

## Status

Phases 1–5 complete. Consolidated sub-phase (58 deferred items) cleared and verified 2026-05-16. Remaining backlog: **CL161** (inline SVG charts for compound interest §1 and sequence risk §5, optional third for historical-cycles §7). Then Phase 6 (original-5 personas review of Phases 1–5). Then Phase 7 (advanced strategies). Then Phase 6 again post-Phase-7.

## Provenance

This project was migrated 2026-05-16 from a multi-session Claude.ai chat thread into Claude Code, after reaching the point where a ~6,000-line artifact + audit database + multi-phase plan was no longer tractable in a chat window. See `docs/conversation_history.md` for the full chat transcripts.

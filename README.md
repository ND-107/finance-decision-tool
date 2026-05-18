# finance-decision-tool

Single-file interactive personal-finance decision tool — a diagnostic-driven framework with 13 views, ~45 sections, 23+ calculators, a 27-question diagnostic, and a decision engine that produces personalized plans. Built for a sophisticated investor.

The deliverable is `flowchart.html` — self-contained HTML/CSS/JS, no external dependencies.

## Try it

**→ [nd-107.github.io/finance-decision-tool](https://nd-107.github.io/finance-decision-tool/)**

Or, locally:

```sh
open flowchart.html
```

No install, no server, no account. Diagnostic answers live in the current browser tab only — refresh clears them. The page loads typography from Google Fonts; nothing else leaves your machine.

## Topics covered

Tax-advantaged accounts (Phase 1 — W2, contractor, business contexts) · math bedrock (compound interest, Rule of 72, savings rate, real vs nominal, sequence risk, asset location, historical-cycles retirement simulator) · spending strategies (housing, transportation, healthcare, insurance, food, childcare, subscriptions, lifestyle creep) · portfolio construction (Bogleheads + MPT/CAPM/Fama-French theory) · cultural moments (FIRE, FinTok, retail trading, crypto, Die with Zero, Dave Ramsey, dividend investing, Gen-Z anxiety, DINK, behavioral synthesis).

## How it's structured

- `flowchart.html` — the artifact.
- `index.html` — meta-refresh redirect to `flowchart.html` so the GitHub Pages root URL lands on the tool.
- `audit/` — fact-check audit. 447 claims tracked (CL001–CL471) with status, credibility tier, and source citation. Current state: 245 PASS / 202 CORRECTED / 0 DEFERRED / 0 FAIL — closed. `build_audit_xlsx.py` is the source of truth; the `.xlsx` is generated from it.
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

Audit closed (2026-05-17). All seven build phases shipped — Phases 1–5 + the 58-item consolidated sub-phase backlog, Phase 6 (original-5 personas review of Phases 1–5), Phase 7 (advanced strategies — the 13th view), Phase 7+ data-verification, Phase 6-again (original-5 personas on the post-Phase-7 framework), Phase 7.5 (the 14 Phase-6-again deferred items), and the final closure pass. Three optional extensions remain on the roadmap (Phase 8 low-bracket reference depth, DMS international-data engineering, personal Monte Carlo backend integration) — see `docs/HANDOFF.md` for the full state and architectural conventions.

## Disclaimer

Educational and research tool, not financial advice. Nothing here constitutes a recommendation to buy, sell, or hold any security, or to take or avoid any tax, retirement, or insurance election. Tax rules, contribution limits, and statutory thresholds change; verify any number that matters against the primary source before acting. For binding decisions consult a licensed CPA, CFP, or attorney as appropriate. The audit (see `audit/`) documents claim-level provenance, but no fact-check is a substitute for current professional advice.

## Provenance

This project was migrated 2026-05-16 from a multi-session Claude.ai chat thread into Claude Code, after reaching the point where a ~6,000-line artifact + audit database + multi-phase plan was no longer tractable in a chat window. See `docs/conversation_history.md` for the full chat transcripts.

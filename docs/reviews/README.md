# Content reviews

Persona reviews of shipped content (V2 plan §4.4). Each file is a reviewer's report, filed verbatim; findings are **recorded, not applied** until the owner gives a go per item or batch.

| Date | Reviewer persona | Scope | Findings |
|---|---|---|---|
| 2026-11-06 | Consumer-finance advocate | Phase 4 (life events, protection, annual review, plain variants) at `main` edb4b3e | 52 (15 HIGH, 29 MED, 8 LOW) |
| 2026-11-06 | Fee-only fiduciary CFP | same | 65 (three marked `[VERIFY]` by the reviewer) |

Where the two reviewers agree (both HIGH): the debt-priority line in `le:job-loss:runway`; the missing 401(k)-loan step; the COBRA notice duty after divorce; COBRA not counting toward delaying Medicare Part B; the "few deadlines" claim in `le:death-of-spouse:pause`; survivor benefits before 60; the windfall playbook's silence on benefits and taxes. Anything a reviewer asserts about 2026 law is the reviewer's claim until it goes through the audit (`audit/build_audit_xlsx.py`) like every other figure.

**Applied 2026-11-06 (owner's go):** the seven both-HIGH items above (CHANGELOG 'Persona-pass fixes applied'). Everything else stays recorded only.

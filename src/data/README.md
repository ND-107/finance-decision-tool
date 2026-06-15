# `src/data/` — vintage-stamped data layer

The structural fix for the failure mode the 2026-06-11/15 currency sprint hit **twice**: indexed dollar figures hand-typed inline drift, go stale, and even get re-verified against the wrong vintage (CL362's source field carried 2025 IRMAA values labeled 2026; the interim `$405` IRMAA surcharge was a fresh category error; the Saver's Credit ceilings sat below even 2025 values).

## `figures.json`

Every **indexed/statutory** dollar figure that changes annually lives here exactly once, vintage-stamped. Content (in v2) references a figure by `key` via a `<fig key="...">` span; the build inlines `display`. No indexed dollar value is ever a hand-typed literal in prose again.

Schema per entry:

```jsonc
{
  "limit_401k_deferral": {
    "value": 24500,                 // bare number, for math
    "display": "$24,500",           // what renders in prose
    "taxYear": 2026,
    "source": "IRS Notice 2025-67", // the authoritative doc, by name
    "verified": "2026-06-15",       // ISO date a human/agent last checked it against `source`
    "expires": "2026-12-31"         // build fails loudly past this without a re-verify
  }
}
```

Rules enforced by `tools/validate-figures.mjs` (build-time gate):

1. Every entry has all six fields; `value` is a number; `taxYear`/`verified`/`expires` are well-formed.
2. `verified` is not absurdly stale relative to `taxYear`.
3. An entry past `expires` (relative to a build-time "today") **fails the build** — staleness becomes a hard error, not a silent drift.
4. (v2 content) every `<fig key>` in content resolves to an entry here; every entry is referenced by ≥1 `<fig>` (orphan figures flagged).

## What does NOT belong here

Illustrative/example figures that are stable and pedagogical — a `$200K` example salary, a `$1M` portfolio, a `$5,000` ER visit, a `$300K–$500K` Roth ladder. Those are not indexed and need no stamping. Only figures that **change with the tax year** are stamped. The artifact has ~243 distinct dollar tokens; ~35 are indexed/statutory and belong here.

## Annual refresh procedure

1. Pull the year's `source` documents (IRS Notice, Rev. Proc., CMS notice, HHS guidelines, SSA).
2. Update each entry's `value`/`display`/`taxYear`/`source`, set `verified` to today, `expires` to that year's Dec 31.
3. **Re-verify each against its named live source — never from model memory** (the CL362 cautionary tale).
4. Rebuild; the validator confirms no entry is past-expiry and (v2) every `<fig>` resolves.

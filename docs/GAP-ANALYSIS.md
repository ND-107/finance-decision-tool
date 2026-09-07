# GAP-ANALYSIS — what's missing, and how the Financial Brain delivers it

_Generated 2026-06-22. The exhaustive gap list for the **Flowchart** and **Plaid Finance Sync**, with each item tagged by **how/when the unified architecture delivers it**. Companion to [COMPARISON.md](COMPARISON.md) (the five-way feature matrix, the source of these gaps) and [FINANCIAL-BRAIN-DECISION.md](FINANCIAL-BRAIN-DECISION.md) (the architecture this maps onto)._

**The key idea:** most of this list is **not** separate from "build the financial brain" — it closes *as a side effect* of building it, because most gaps were "🟡/❌ because the capability lives in a sibling tool," and the brain's whole job is to route between tools. A smaller set is genuinely new, deferred, or per-tool polish the brain never touches.

## Tag legend (maps to the decision memo's phases)

| Tag | Meaning | When |
|---|---|---|
| **`[Conductor v0]`** | Closes when the orchestration brain + 3 MCP shims exist. Integration only — the capability already lives in a sibling tool. | ~2 weekends |
| **`[Snapshot v1]`** | Closes when the single-table local store is added (history, scenarios, household, multi-year). | +1 weekend |
| **`[New]`** | Net-new capability the brain *creates* that no tool had (Solver/goal-seek, the decision matrix, approximate after-tax MC). | v0–v1 |
| **`[Lot Ledger v2]`** | Deferred & conditional — needs the full lot ledger (lot-exact after-tax MC, TLH, asset-location, wash-sale, deep Roth/RMD/estate). | Only if the lot-maintenance test passes |
| **`[→PV]`** | Orchestrated to Portfolio Visualizer Pro and ingested as drivers; not built in-house. | as needed |
| **`[Per-tool]`** | Intra-tool polish the brain does **not** deliver; stays on the individual tool's own backlog. | independent |
| **`[Out of scope]`** | Not planned anywhere — PV-territory we won't build, or features structurally incompatible with a tool's design. | — |

---

# 1 · FLOWCHART (finance-decision-tool)

## 🟡 Partial → to reach full

| Feature | To reach full | Architecture path |
|---|---|---|
| Monte Carlo sim | Wire `getMCBackend()` to the real engine | **`[Conductor v0]`** (`mc-mcp` shim) |
| Success-probability output | Explicit success % + CI | **`[Conductor v0]`** (free once MC wired) |
| Withdrawal strategies | Guyton-Klinger, VPW, fixed-% | **`[Conductor v0]`** (via MC Sys) |
| SS / pension / mortality | Stochastic SSA mortality + pensions | **`[Conductor v0]`** (via MC Sys) |
| Sensitivity analysis | Multi-variable Sobol/Morris | **`[Conductor v0]`** (via MC Sys) |
| Efficient frontier | n-asset optimizer | **`[→PV]`** (orchestrate); 2-asset teaching toy stays **`[Per-tool]`** |
| Risk-adjusted metrics | Sortino/Treynor/Calmar/DD | **`[Per-tool]`** (calculator polish) |
| Debt modeling | Interactive payoff sim | **`[Conductor v0]`** (route to Plaid's `debt-sim.js`); teaching calc is **`[Per-tool]`** |
| Tax modeling | Interactive tax calcs + forward planning | **`[Per-tool]`** (teaching calcs) + **`[New]`/`[Snapshot v1]`** (forward planning via scenarios) |
| Roth / RMD / estate | Interactive calcs | **`[Per-tool]`** (teaching calcs); lot-exact tax effects **`[Lot Ledger v2]`** |
| Multi-scenario / what-if | Side-by-side plan comparison | **`[New]`** (the decision matrix) |
| Historical market dataset | Full-precision + bond/intl/factor | **`[Conductor v0]`** (read MC Sys calibration layer); higher-precision data itself **`[Per-tool]`** |
| Charts | Charts on all 23 calculators | **`[Per-tool]`** |
| Export | PDF + CSV/JSON | **`[Per-tool]`** |

## ❌ Don't have at all

**Genuine candidates**
- After-tax retirement modeling — **`[New]`** (bracket-grade at v1) → **`[Lot Ledger v2]`** (lot-exact)
- DCF calculator — **`[Conductor v0]`** (MC Sys has it); as a teaching calc **`[Per-tool]`**
- Options calculator — **`[Conductor v0]`** (MC Sys has it); as a teaching calc **`[Per-tool]`**
- AI narration / "explain this" — **`[New]`** (the brain narrates decisions); in-flowchart narration is **`[Out of scope]`**

**Boundary — lives in MC Sys (closes via the swap hook):** all **`[Conductor v0]`**
- Parametric returns (normal/fat-tail) · Block/circular bootstrap · GARCH/TSFM modeling · Per-trial drill-down · Adjustable trials / seeded RNG

**Boundary — lives in Plaid (flowchart is stateless by design):**
- Live account aggregation · account/balance tracking · transactions · bills/subscriptions · income tracking — **`[Conductor v0]`** (flowchart reads real data via `plaid-read-mcp`)
- Year-by-year cash-flow projection — **`[Snapshot v1]`**
- Goal/milestone tracking — already in Plaid (✅); surfaced to the brain **`[Conductor v0]`**
- Saved/persistent state · cloud sync — ecosystem gains state at **`[Snapshot v1]`**; the flowchart itself stays stateless **`[Out of scope]`**

**PV-territory**
- Portfolio optimization · correlations/PCA · Black-Litterman — **`[→PV]`**
- Backtesting · factor analysis/regression · tactical/timing models · fund screening · factor datasets — **`[Out of scope]`**

---

# 2 · PLAID FINANCE SYNC (plaid-finance-sync)

## 🟡 Partial → to reach full

| Feature | To reach full | Architecture path |
|---|---|---|
| Year-by-year cash-flow | Remove 365-day cap; multi-decade | **`[Snapshot v1]`** (projection becomes MC's job over the snapshot) |
| Monte Carlo integration | Render MC results in-app | **`[Conductor v0]`** (closes the one-way feed) |
| Tax modeling | Forward planning (Roth timing, harvesting, bracket-filling) | **`[New]`/`[Snapshot v1]`** (scenarios) → **`[Lot Ledger v2]`** (lot-exact) |
| Multi-scenario / what-if | General scenario engine | **`[New]`** (decision matrix) |
| Prioritized action plan | Holistic ranked "next best action" | **`[Conductor v0]`** (DECIDE layer + flowchart engine) |
| Tax-advantaged funding waterfall | True waterfall on real balances | **`[Conductor v0]`** (flowchart waterfall + Plaid data via brain) |
| Income-context branching | Full W2/contractor/business logic | **`[Conductor v0]`** (flowchart branching on Plaid data); SE-specific handling **`[Per-tool]`** |
| Completion tracking | Plan-linked completion + history | **`[Conductor v0]`** (Decision Ledger) + **`[Per-tool]`** |
| Deadline tracking | `.ics` / calendar export | **`[Per-tool]`** |
| Risk-adjusted metrics | Add Sharpe/Sortino/DD to portfolio page | **`[Per-tool]`** |
| Embedded calculators | Broader suite | **`[Conductor v0]`** (reuse flowchart calcs via brain) or **`[Per-tool]`** |
| Behavioral coverage | Actual content/coaching | **`[Out of scope]`** (flowchart territory) |
| Spending-side guidance | Prescriptive benchmarks | **`[Conductor v0]`** (flowchart guidance) or **`[Per-tool]`** |
| Statutory figures | Complete indexed-figures set | **`[Per-tool]`** |
| Historical market dataset | Broader multi-asset/factor | **`[Conductor v0]`** (via MC calibration) / **`[Per-tool]`** |
| Provenance / audit | Claim/source fact audit | **`[Snapshot v1]`** (Decision Ledger provenance) + **`[Per-tool]`** (figure audit) |
| AI narration / Q&A | Proactive narration | **`[New]`** (brain narration); proactive in-Plaid narration **`[Out of scope]`** |
| Fully free | — | **`[Out of scope]`** (structural — cloud aggregation has costs) |

## ❌ Don't have at all

**Genuine candidates**
- After-tax projection — **`[New]`** (v1 approx) → **`[Lot Ledger v2]`** (lot-exact)
- Roth conversions / RMDs / estate — **`[Snapshot v1]`/`[New]`** (scenario-level) → **`[Lot Ledger v2]`** (deep)

**Boundary — lives in MC Sys (closes by consuming it):** all **`[Conductor v0]`**
- Historical-cycle sampling · parametric returns · block bootstrap · GARCH/TSFM · success-probability · withdrawal strategies · per-trial drill-down · adjustable trials · sensitivity analysis · DCF · options · SS/pension/mortality

**Boundary — lives in the Flowchart:** all **`[Conductor v0]`** (via `flowchart-mcp`)
- Diagnostic questionnaire · "Doesn't apply to you" reasoning · built-in teaching content _(in-Plaid native versions: **`[Out of scope]`**)_

**PV-territory**
- Optimization · efficient frontier · correlations/PCA · Black-Litterman — **`[→PV]`**
- Backtesting · factor analysis · tactical/timing · fund screening · factor datasets — **`[Out of scope]`**

**Structural (inherent to Plaid being a cloud app)** — all **`[Out of scope]`**
- No-login · privacy/local-only · single-file

---

# Rollup — where the list lands

Counting the genuinely-wanted gaps (excluding the by-design `[Out of scope]` boundaries):

- **`[Conductor v0]` — the biggest bucket.** Nearly everything in the "Boundary — lives in a sibling tool" groups, plus the cross-tool 🟡s (real MC across both tools, success-probability, withdrawal strategies, sensitivity, prioritized plan, funding waterfall, render-MC-results, flowchart reading live data, DCF/options reachable). **These close by integration the moment the brain + shims exist — no per-feature rebuild.**
- **`[Snapshot v1]` — the state bucket.** Multi-year cash-flow (the 365-day cap dissolves), time-travel net worth, decision history/provenance, household tagging, scenario-level forward tax planning.
- **`[New]` — the brain creates these.** The **decision matrix (options × probabilities)** = your original ask; the **goal-seek Solver**; **approximate after-tax MC**; decision-level AI narration.
- **`[Lot Ledger v2]` — deferred & conditional.** Lot-exact after-tax MC, tax-loss harvesting, asset-location, wash-sale, deep Roth/RMD/estate. Only if you prove you'll maintain lot data.
- **`[→PV]` — orchestrated, not built.** Optimization, efficient frontier, correlations, Black-Litterman.
- **`[Per-tool]` — the residual the brain doesn't touch.** Calculator/chart/export polish in the Flowchart; broader calculators, deadline `.ics`, complete statutory figures, spending benchmarks in Plaid. Smaller, independent backlogs on each tool.
- **`[Out of scope]`.** PV-territory we won't build (backtesting, factor analysis, tactical, fund screening, factor datasets) + structural items (Plaid no-login/local-only/single-file; flowchart staying stateless).

**Bottom line:** roughly two-thirds of the wanted features land at **`[Conductor v0]`** or **`[Snapshot v1]`** — i.e., they're delivered by *building the brain*, not by separately re-coding each feature into each tool. The decision matrix + Solver (`[New]`) are the headline additions neither tool ever had. Everything else is either explicitly deferred (`[Lot Ledger v2]`), routed out (`[→PV]`), or a small per-tool backlog (`[Per-tool]`).

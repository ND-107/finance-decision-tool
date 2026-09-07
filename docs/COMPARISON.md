# COMPARISON — our finance ecosystem vs Portfolio Visualizer & ProjectionLab

_Generated 2026-06-18. Five-way feature comparison. "Ours" is three separate tools, not one product:_
- **Flowchart** — `finance-decision-tool` (prescriptive diagnostic → action plan). See [INVENTORY.md](INVENTORY.md).
- **MC Sys** — `finance-monte-carlo` (Monte Carlo simulation engine + Marimo GUI).
- **Plaid** — `plaid-finance-sync` (live account aggregation + cash-flow dashboard).
- **PV** — Portfolio Visualizer. See [reference-portfolio-visualizer.md](reference-portfolio-visualizer.md).
- **PL** — ProjectionLab. See [reference-projectionlab.md](reference-projectionlab.md).

Legend: ✅ full · 🟡 partial/limited · ❌ none. PV/PL grounded in 2026-06-18 web fetches (some `[UNVERIFIED]` — see reference docs); MC Sys & Plaid grounded in their source code.

## A. Prescriptive guidance — *the flowchart's home turf*
| Feature | Flowchart | MC Sys | Plaid | PV | PL |
|---|:--:|:--:|:--:|:--:|:--:|
| Diagnostic questionnaire → personalized output | ✅ | ❌ | ❌ | ❌ | 🟡 |
| Prioritized "what to do next" action plan | ✅ | ❌ | 🟡 (auto-tasks) | ❌ | ❌ |
| Tax-advantaged funding waterfall | ✅ | ❌ | 🟡 (funding order) | ❌ | ❌ |
| Income-context branching (W2/contractor/business) | ✅ | ❌ | 🟡 (Sched-C tagging) | ❌ | ❌ |
| Completion tracking / checklist | ✅ | ❌ | 🟡 (task ledger) | ❌ | 🟡 |
| Deadline tracking + calendar export | ✅ (.ics) | ❌ | 🟡 (tax cal/recert) | ❌ | ❌ |
| "Doesn't apply to you" reasoning | ✅ | ❌ | ❌ | ❌ | ❌ |

## B. Education & concepts
| Feature | Flowchart | MC Sys | Plaid | PV | PL |
|---|:--:|:--:|:--:|:--:|:--:|
| Built-in teaching content | ✅ | ❌ | ❌ | 🟡 (AI narration) | 🟡 (docs/glossary) |
| Interactive teaching calculators | ✅ (23) | ❌ | 🟡 (debt/tax calc) | 🟡 (tools) | ❌ |
| Behavioral / cultural coverage (FIRE, Die With Zero) | ✅ | ❌ | 🟡 (nudges only) | ❌ | ❌ |
| Spending-side guidance (housing, insurance…) | ✅ | ❌ | 🟡 (budgets/targets) | ❌ | 🟡 |

## C. Portfolio & investment analytics — *PV's home turf*
| Feature | Flowchart | MC Sys | Plaid | PV | PL |
|---|:--:|:--:|:--:|:--:|:--:|
| Portfolio backtesting (security level) | ❌ | ❌ | ❌ | ✅ | 🟡 (plan-level) |
| Portfolio optimization (MVO, min-var, CVaR) | ❌ | ❌ | ❌ | ✅ | ❌ |
| Efficient frontier | 🟡 (2-asset toy) | ❌ | ❌ | ✅ | ❌ |
| Factor analysis / regression (Fama-French…) | ❌ | ❌ | ❌ | ✅ | ❌ |
| Asset correlations / PCA | ❌ | 🟡 (joint sampler) | ❌ | ✅ | ❌ |
| Risk-adjusted metrics (Sharpe/Sortino/drawdown) | 🟡 (Sharpe calc) | 🟡 (DD/CAGR) | 🟡 (TWR/IRR/alpha) | ✅ | 🟡 |
| Live portfolio performance tracking (real holdings) | ❌ | ❌ | ✅ (TWR/IRR vs SPY, fees, divs) | 🟡 | ❌ |
| Tactical / timing models (momentum, CAPE) | ❌ | ❌ | ❌ | ✅ | ❌ |
| Fund / ETF screening | ❌ | ❌ | ❌ | ✅ | ❌ |
| Black-Litterman / Michaud resampling | ❌ | ❌ | ❌ | ✅ | ❌ |

## D. Retirement / Monte Carlo — *the seam across all of us*
| Feature | Flowchart | MC Sys | Plaid | PV | PL |
|---|:--:|:--:|:--:|:--:|:--:|
| Monte Carlo / probabilistic sim | 🟡 (hist-cycles + swap hook) | ✅ | 🟡 (state feed) | ✅ | ✅ |
| Historical-cycle / sequence-of-returns | ✅ | 🟡 (block bootstrap) | ❌ | ✅ | ✅ |
| Parametric returns (normal / fat-tail) | ❌ | ✅ (Student-t) | ❌ | ✅ | 🟡 (normal) |
| Block / circular bootstrap | ❌ | ✅ | ❌ | ✅ | ✅ |
| GARCH / advanced time-series / TSFM | ❌ | ✅ (GARCH+HMM+ARIMA+Chronos/TimesFM/Moirai) | ❌ | ✅ (GARCH) | ❌ |
| Success-probability output | 🟡 | ✅ (CI + custom defs) | ❌ | ✅ | ✅ |
| Withdrawal strategies (4%, guardrails) | 🟡 | ✅ (Guyton-Klinger) | ❌ | ✅ | ✅ |
| After-tax simulation | ❌ | ❌ | ❌ | ✅ | ✅ (Premium) |
| Social Security / pension / mortality | 🟡 (in sim) | ✅ (SS floor + SSA mortality) | ❌ | 🟡 | ✅ |
| Per-trial drill-down | ❌ | ✅ | ❌ | 🟡 | ✅ |
| Goal / milestone tracking | ❌ | 🟡 (custom success) | ✅ | 🟡 | ✅ |
| Adjustable trials / seeded RNG | ❌ | ✅ (byte-identical) | ❌ | 🟡 | ✅ |
| DCF / valuation modeling | ❌ | ✅ (stochastic DCF) | ❌ | ❌ | ❌ |
| Options / derivatives pricing | ❌ | ✅ (QuantLib + Greeks) | ❌ | ❌ | ❌ |
| Global sensitivity analysis (Sobol/Morris) | 🟡 (1-var sensitivity) | ✅ (SALib) | ❌ | ❌ | ❌ |

## E. Financial-planning breadth — *PL's & Plaid's home turf*
| Feature | Flowchart | MC Sys | Plaid | PV | PL |
|---|:--:|:--:|:--:|:--:|:--:|
| Year-by-year cash-flow projection | ❌ | ❌ | 🟡 (≤365 days) | 🟡 | ✅ |
| Account / balance tracking | ❌ | ❌ | ✅ (daily snapshots) | 🟡 | ✅ |
| Transactions ingestion | ❌ | ❌ | ✅ (Plaid + CSV/receipt) | ❌ | ❌ (manual) |
| Bills & subscriptions tracking | ❌ | ❌ | ✅ (CRUD + detection) | ❌ | 🟡 |
| Income tracking | ❌ | ❌ | ✅ (detect + confirm) | ❌ | ✅ (streams) |
| Debt modeling (avalanche/snowball + IDR) | 🟡 (waterfall) | ❌ | ✅ (sim + SAVE/PAYE/IBR/ICR) | ❌ | 🟡 |
| Tax modeling / optimization | 🟡 (concepts) | ❌ | 🟡 (draft 1040 + estimate) | 🟡 (after-tax MC) | ✅ (Premium) |
| Roth conversions / RMDs / estate / 72t | 🟡 (content) | ❌ | ❌ | ❌ | ✅ (Premium) |
| Multi-scenario / what-if compare | 🟡 (sensitivity) | 🟡 (N-way run compare) | 🟡 (scoped what-ifs) | 🟡 (3-portfolio) | ✅ (Premium) |

## F. Data, personalization & provenance
| Feature | Flowchart | MC Sys | Plaid | PV | PL |
|---|:--:|:--:|:--:|:--:|:--:|
| Live real-account integration (aggregation) | ❌ | ❌ | ✅ (Plaid, multi-institution) | ❌ | ❌ |
| Personalized to user inputs | ✅ (diagnostic) | ✅ (config) | ✅ (real data) | 🟡 | ✅ |
| Embedded statutory figures (limits, brackets) | ✅ (2026) | ❌ | 🟡 (poverty/tax tables) | ❌ | 🟡 |
| Historical market dataset | 🟡 (1928–2025 real) | ✅ (SPY 50y, CPI, EDGAR) | 🟡 (price/benchmark) | ✅ (1972+, many) | ✅ (S&P+bonds+CPI) |
| Factor datasets (French/AQR/q-factor) | ❌ | ❌ | ❌ | ✅ | ❌ |
| Provenance / audit trail | ✅ (458-claim audit) | 🟡 (calibration provenance + frozen-SHA parity) | 🟡 (changes_log) | 🟡 (methodology) | 🟡 (docs) |

## G. Platform, output & access
| Feature | Flowchart | MC Sys | Plaid | PV | PL |
|---|:--:|:--:|:--:|:--:|:--:|
| Charts / visualizations | 🟡 (3 SVG) | ✅ (matplotlib + Altair) | ✅ (Chart.js) | ✅ (Highcharts) | ✅ |
| Export (PDF / CSV / Excel / JSON) | 🟡 (MD/print/.ics) | 🟡 (JSON/MD/PNG) | ✅ (MD/JSON/CSV + tax PDF) | ✅ | 🟡 (Premium) |
| Saved / persistent / shareable | ❌ (session-only) | 🟡 (saved runs) | ✅ (cloud-persisted) | ✅ | ✅ |
| Cloud sync / accounts | ❌ | ❌ | ✅ (Vercel+Neon+cron) | ✅ | ✅ |
| AI narration / Q&A | ❌ | ❌ | 🟡 (Claude Q&A) | ✅ | ❌ |
| Fully free | ✅ | ✅ (local OSS) | 🟡 (self-host costs) | 🟡 (limited tier) | 🟡 (limited tier) |
| No login required | ✅ | ✅ | ❌ | 🟡 | ❌ |
| Privacy (data never leaves device) | ✅ | ✅ (local) | ❌ (cloud) | ❌ | 🟡 |
| Single-file / self-contained | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## Synthesis

**As an ecosystem, "ours" now matches or beats PV and PL across nearly every category.** The two gaps the flowchart had on its own are filled:

- **The Monte Carlo gap (vs PV & PL) is not just closed — it's reversed.** MC Sys exceeds both products on advanced stochastic modeling (GARCH + HMM + ARIMA + TSFM foundation models), global sensitivity analysis (Sobol/Morris), options pricing (QuantLib + Greeks), stochastic DCF, and byte-identical reproducibility. None of those four (TSFM, Sobol, options, DCF) exists in PV or PL at all.
- **The account-tracking / cash-flow gap (vs PL) is closed by Plaid**, which adds something *neither* competitor has: **live multi-institution account aggregation** (PV and PL both require manual data entry). Plaid also brings real debt/IDR simulation, live portfolio performance (TWR/IRR vs benchmark), and bills/income/subscription tracking.

**What we still don't have anywhere in the ecosystem:**
- **Portfolio optimization & factor analysis** — PV-only (efficient frontier optimizer, Fama-French regression, fund screening, tactical models). MC Sys simulates given weights but has no optimizer.
- **After-tax Monte Carlo** — both PV and PL fold taxes into the sim; MC Sys does not.
- **Polished long-horizon planning conveniences** — PL's multi-decade year-by-year projection, Roth-conversion / RMD / estate modeling, and integrated what-if compare. Plaid caps projection at 365 days; the flowchart only has these as content.
- **AI narration of analyses** (PV) and **one-click PDF/CSV per run** (MC Sys exports JSON/MD/PNG only).

**The real structural difference:** PV and PL are each *one integrated product*. Ours is **three federated tools** — flowchart *prescribes*, MC Sys *simulates*, Plaid *tracks reality* — connected only by thin seams (the flowchart's `getMCBackend()` swap hook; Plaid's read-only `/api/monte-carlo-state` feed). They win on integration and polish; we win on depth-per-axis, privacy/ownership, and the prescriptive layer neither of them attempts. The obvious strategic question is whether to tighten those seams (e.g. flowchart → MC Sys → Plaid as one pipeline) or keep them deliberately separate.

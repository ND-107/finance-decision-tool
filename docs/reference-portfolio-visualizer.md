# Reference — Portfolio Visualizer

_Competitive/landscape reference for the finance-decision-tool. Scraped 2026-06-18 via Exa + Brave (Firecrawl was out of credits; could not log in, so anything behind the account wall is flagged). Tools marked ◑ are confirmed by name + description from the `/analysis` taxonomy + SERP snippets but their individual pages were not opened — their specific inputs/outputs are `[UNVERIFIED]` beyond the description._

**What it is:** a quantitative portfolio-analytics suite. The site is now branded **SRL Global / "SRL Analytics"** with an added AI-narration layer (apparent acquisition/rebrand), but the underlying toolset matches classic Portfolio Visualizer. Relevant context: PV Pro is on the owner's approved paid-tooling list.

**Primary sources fetched:** `/`, `/analysis`, `/faq` (master methodology + data-source + terms doc), `/pricing`, `/monte-carlo-simulation`, `/backtest-portfolio`.

## 1 · Features (tools)

- **Backtesting:** Backtest Asset Allocation (asset-class, history to **1972**) ◑ · Backtest Portfolio (ticker-level; compare 3 portfolios + benchmark) ✔ · Backtest Dynamic Allocation ◑ · Manager Performance Analysis ◑
- **Factor analysis:** Factor Regression ✔ · Risk Factor Allocation ◑ · Factor Statistics ◑ · Factor Exposure Matching ✔ · Fund Factor Regressions ◑ · Fund Performance Attribution ◑
- **Asset analytics:** Asset Correlations ✔ · Autocorrelation ◑ · Cointegration ◑ · PCA ◑ · Fund Screener ◑ · Fund Rankings ◑ · Fund Performance ◑
- **Monte Carlo / planning:** Monte Carlo Simulation ✔ · Financial Goals ◑ · Asset Liability Modeling ◑
- **Optimization:** Efficient Frontier ✔ · Portfolio Optimization ✔ · Black-Litterman ✔ · Rolling Optimization ◑
- **Tactical / timing models** ✔: Valuation (Shiller PE10) · Moving-Average · Relative-Strength Momentum · Dual Momentum · Adaptive Asset Allocation · Target Volatility
- **Ancillary:** Market Dashboard (economic indicators + live "Top 10 Lazy Portfolios" leaderboard) · Gallery of Examples · **AI narration** ("explained by A.I." text/video + in-result "Insights")

## 2 · Functions

- **Backtest:** end balance, CAGR, IRR; stdev, Sharpe, Sortino, max drawdown; rolling returns; rebalancing sim (annual default → monthly, or drift bands); cashflow modeling (contrib/withdrawal — fixed/%/inflation-adj); **leverage** (margin, interest, maintenance margin); returns-based + holdings-based style analysis; risk attribution (MCTR); market/volatility-regime breakdown; advisor-fee modeling.
- **Optimization:** mean-variance, min-variance, max-Sharpe, **min-CVaR**, max-diversification, min-max-drawdown; allocation/diversification constraints; **Michaud resampling**; differential-evolution solver.
- **Efficient Frontier:** mean-variance + **geometric-mean** frontier; historical or forward-looking CMAs.
- **Monte Carlo:** engines = Historical bootstrap / Parameterized (normal or **fat-tailed Student-t**) / Forecasted CMAs; **GARCH** time-series option; bootstrap by single-month / single-year / **block** (+circular); withdrawal models (fixed, %, rolling-avg, geometric, **life-expectancy / IRS Pub 590-B**); sequence-of-returns stress; **after-tax** sim (fed/cap-gains/dividend/ACA/state); CPI or parametric inflation; finite or **perpetual** horizon → reports safe & perpetual withdrawal rates.
- **Factor Regression:** OLS of monthly excess returns on factors → alpha/betas, t-stats, p-values, R²; **Newey-West** robust SE option; equity, fixed-income (term/credit), combined models.
- **Tactical models:** MA crossover signals; relative-strength ranking (2-12 momentum, vol-adjusted); absolute-momentum trend filter; risk-parity / min-variance weighting; vol targeting; stop-loss.

## 3 · Concepts

MPT / efficient frontier (arithmetic vs **geometric**) · CAPM, alpha/beta · factor models: **Fama-French 3 & 5, Carhart 4 (momentum), q-factor (Hou-Xue-Zhang), reversal, Quality (QMJ), Bet-Against-Beta** · return metrics (arith/geo mean, CAGR, TWRR, MWRR/IRR) · risk (variance, covariance, correlation, downside deviation, max drawdown, **VaR, CVaR**, tracking error) · ratios (Sharpe, Sortino, Treynor, Calmar, Information, up/down capture) · Monte Carlo, **bootstrapping** (block/circular), fat tails, **GARCH** · sequence-of-returns, safe/perpetual withdrawal, spending rules · **CAPE/Shiller PE10**, momentum (relative/absolute/dual), risk parity, min-variance, vol targeting · returns- vs holdings-based style analysis · Black-Litterman, Michaud resampling, Newey-West.

## 4 · Sources

- **Market data:** Morningstar + Commodity Systems Inc (CSI); EOD Historical Data referenced. Fund fundamentals (style boxes, holdings) = Morningstar.
- **Factor data:** **Kenneth French Data Library**, **AQR**, **Alpha Architect**, **q-Factors (Hou-Xue-Zhang)**, **Novy-Marx**; fixed-income factors built from Vanguard funds.
- **Asset-class series back to 1972** via French synthetic indices + AQR spliced to Vanguard/DFA funds; Treasuries & T-bills from **FRED**; **inflation = BLS CPI-U (1972+)**; gold = London fixing → GLD; also references Damodaran & Shiller libraries. Ticker-level backtests are bounded by each fund's inception.
- **Pricing (tiers differ by *limits*, not feature-gating):** **Free** (no login, ≤15 assets, excludes current month) · **Basic $30/mo** annual (≤150 assets, YTD, save 50 models, forward trade signals) · **Pro $55/mo** annual (commercial license, save 150 models, team account sync). 14-day full trial. _Default MC iteration count + public API not published `[UNVERIFIED]`._

## 5 · Outputs

- **Result tabs (Backtest):** Summary · Exposures · Active Returns · Metrics · Annual · Monthly · Drawdowns · Assets · Rolling Returns.
- **Metric tables:** performance summary (CAGR, stdev, best/worst yr, max DD, Sharpe, Sortino, active return, tracking error, IR, benchmark correlation); style + risk-attribution; factor loadings with significance; drawdown tables (length/recovery/underwater); MC percentile end-balance + withdrawal-rate tables.
- **Charts:** rendered with **Highcharts** (allocation, growth curve, risk/return, distribution/percentile).
- **Exports & sharing:** shareable **Link**, **PDF**, **Excel**, **CSV**; branded/custom PDF reports; saved & importable models; **save results as custom data series / benchmarks** usable in any tool, with Excel-like formulas (e.g. `0.6*SPY+0.4*AGG`, `IF(SPY>EFA,SPY,EFA)`); import portfolios/cashflows/correlation matrices; team-account sync.
- **AI/insight:** in-result "Insights" explaining market drivers for the period; text + video AI explanations.

### Coverage gaps
Could not access (login/paywall): saved-model management UI, team-sync screens, branded-PDF internals, live AI-insight text. The ◑-marked tools' specific input forms/outputs are `[UNVERIFIED]` beyond their taxonomy descriptions.

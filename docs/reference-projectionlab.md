# Reference — ProjectionLab (Monte Carlo / "Chance of Success")

_Competitive/landscape reference for the finance-decision-tool. Scraped 2026-06-18 via Exa + Brave (Firecrawl was out of credits; Kagi unavailable). Pages were fetched, not recalled. Could not see behind the app login — live in-app labels, exact default trial counts, and current lifetime price are flagged `[UNVERIFIED]` or rest on third-party sources._

**What it is:** a DIY personal financial-planning / FIRE web app (manual data entry, no account-linking; optional cloud save). Its core is a **deterministic** year-by-year engine (the "Plan" tab) covering income streams, expenses, accounts, cash-flow priorities, drawdown order, allocation over time, milestones, taxes (incl. international presets), Roth conversions, 72t/SEPP, RMDs, estate, ACA, Social Security. **Monte Carlo is the "Chance of Success" (CoS) tab** — it re-runs that same plan many times with varying returns/dividends/inflation.

**Primary sources fetched:** `/monte-carlo`, `/pricing`, `/changelog`, `/retirement-calculator`; help: `/help/increase-trials-in-chance-of-success`, `/help/growth-dividend-settings-chance-of-success`, `/help/model-investment-growth`, `/help/plan-vs-chance-of-success`, `/help/simulation-engine`, `/help/create-new-plan`, `/help/inflation-in-chance-of-success`; blog: `/blog/whats-new-v440`, `/blog/monte-carlo-redesign`, `/blog/getting-started-with-projectionlab`. Corroborating third-party: madfientist, physicianonfire, robberger, thecollegeinvestor, changemap.

## 1 · Features (Monte-Carlo-related)

- **Two stochastic engines in one tab:** historical backtesting against real market data, **and** custom Monte Carlo with user-defined distributions.
- **Sampling methods:** Historical (No Looping) · Historical w/ looping (custom loopback year) · Random-Start / Random-Restart · Random + Non-Chronological · **Block Bootstrap** (v4.4.0, user-set block length) · Custom distributions (normal w/ relative stdev).
- **Up to 2,000 trials** (randomized methods; not adjustable for fixed-sequence historical). **Seedable RNG** for reproducibility.
- **Per-account Auto vs Fixed** treatment across trials; custom-normal accounts move as a 100%-correlated group.
- **Customizable success bands** (names/colors/thresholds); **per-trial drill-down** table (inspect any trial's return sequence + where/why it failed); **milestone integration** (e.g. FIRE) with percentile distributions; **Flex Spending** rules feed CoS; auto-rerun on stale inputs; multi-worker performance.
- _Compare Mode / What-If scenarios = Premium._

## 2 · Functions

- **User knobs:** data source set independently for Investment Growth / Dividend Yield / Inflation (historical vs custom); sampling method (+block length); trial count (≤2,000); RNG seed; distribution params (mean + relative stdev); stock/bond allocation over time (portfolio or per-account); Auto/Fixed per account; success thresholds.
- **Engine (shared with deterministic Plan):** for each simulated year, computes surplus/shortfall from income, withholding, expenses, debt, dividends, taxes due, RMDs, rental income → surplus saved per cash-flow priorities; shortfall covered per drawdown preferences (savings are *derived*, not entered). Each CoS trial overlays varying returns/dividends/inflation + varying milestone timing. **"Success" = not going bankrupt** over the horizon, plus user thresholds.
- **Real vs nominal:** display in Today's Currency (inflation-adjusted) or Actual Currency.
- **Metrics computable in CoS:** Net Worth, Liquid NW, Spending/Essential/Discretionary/Flex, Total Tax, Effective Tax Rate.

## 3 · Concepts

Probabilistic vs deterministic planning · **probability ("chance") of success** · sequence-of-returns risk · percentile outcomes / **fan charts** / IQR · historical-cycle vs parametric (Gaussian) sampling · **block bootstrap** (preserves regime persistence; explicitly motivated by return autocorrelation) · inflation-adjusted (real) outcomes · correlation structure · drawdown order / cash-flow priorities / withdrawal logic · long-term real return assumptions (defaults refreshed to **7% growth / 1.5% dividend**). _CAGR not named in PL's own pages `[UNVERIFIED]`._

## 4 · Sources

- **Historical data:** PL states "real historical data" for **S&P 500 returns, dividends, US inflation, and bonds**; inflation from a "unified data source"; dataset extended yearly (current through **~2024–2025**). **`[UNVERIFIED]`: PL does not publish its data vendor or start year** on any page fetched — do *not* assume Shiller/BLS/Damodaran for PL specifically (those are the industry-standard sources comparable tools use). Custom mode draws from user-defined distributions.
- **Pricing & gating:** **Basic = Free** and *includes* Monte Carlo + Historical Backtesting (free-tier data not saved between sessions per third-party). **Premium $129/yr** adds What-If/Compare, tax optimization, withdrawal strategies, **downloadable reports**, multiple plans, international, capital-gains harvesting, Roth conversions, ACA. **Pro $549/yr** (advisors; client mgmt, 10 seats). 7-day trial. A lifetime tier exists historically (~$450 → ~$1,199) but wasn't shown on the live page `[UNVERIFIED]`.

## 5 · Outputs

- **Headline success-rate %** (custom bands).
- **Percentile-range chart** (default Net Worth; bankruptcy illustrated) · **fan chart** of uncertainty bands over time · distribution-by-age histogram (clickable to filter trials) · per-metric stats (median/avg/stdev/min/max).
- **Milestone outputs:** per-milestone percentile distributions w/ IQR, occurrence/completion rates, completion-age by trial percentile.
- **Individual-trials table:** every trial with sparkline trajectory, "Historical Sequence" column, filterable by milestone/outcome; failed trials show **"Bankrupt"**; full per-year drill-down.
- **Multi-metric line/bar plots** in aggregate + per-trial views.
- **Exports:** Reports tab → **PDF / CSV / JSON** (v4.4.0) — but Downloadable Reports is **Premium-gated**.

### Grounding caveats
Cannot see behind the app login (exact UI labels, full methodology-dropdown list, precise default trial count per method, current lifetime price). Third-party trial-count figures conflict (1,000 vs 2,000); the help page's **2,000** max is authoritative. No canonical published "data sources" page — vendor/start-year flagged `[UNVERIFIED]`.

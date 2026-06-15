// plan-rules.mjs — v1 computePlan() reimplemented as ORDERED, DATA-DRIVEN RULES.
//
// Each group mirrors one if / else-if / else block: rules are evaluated in order
// and the FIRST whose `when` predicate passes fires (an `add` or a `skip`),
// exactly like JS control flow — no hand-negated else predicates. A group may
// carry a `guard` predicate (the outer `if (…) { … }`). Predicates use the
// src/core/predicates.mjs grammar over base answers + derived `_*` fields
// (src/core/derive.mjs). Presentation fields (title/stage/tags/nodeKey/
// incomeType) are static values or `(d) => value` for the handful that v1
// computes dynamically. Reason/because PROSE is intentionally omitted — it is
// content (Phase 4) and is not part of the behavior contract the parity gate
// checks (V2_REBUILD_PLAN.md §2.3). Group order == v1 source order, so action
// ordering matches.

const has = (field, value) => ({ field, op: 'has', value });
const hasAny = (field, value) => ({ field, op: 'hasAny', value });
const eq = (field, value) => ({ field, op: 'eq', value });
const ne = (field, value) => ({ field, op: 'ne', value });
const inn = (field, value) => ({ field, op: 'in', value });
const T = (field) => ({ field, op: 'truthy' });
const all = (...preds) => ({ all: preds });
const any = (...preds) => ({ any: preds });
const ELSE = true;

export const RULE_GROUPS = [
  // ===================== STAGE: NOW =====================
  { rules: [
    { when: eq('budgetTracking', 'no'), add: { title: 'Build a comprehensive budget and start tracking cash flow', stage: 'now', nodeKey: 'w2:0.1', tags: [] } },
    { when: eq('budgetTracking', 'sometimes'), add: { title: 'Tighten your cash-flow tracking into a real budget', stage: 'now', nodeKey: 'w2:0.1', tags: [] } },
    { when: ELSE, skip: 'Build a budget' },
  ] },
  { guard: T('_isSE'), rules: [
    { when: eq('quarterlyTaxes', 'no'), add: { title: 'Set up quarterly estimated tax payments and a tax reserve', stage: 'now', nodeKey: 'contractor:0.3', tags: ['critical'] } },
    { when: eq('quarterlyTaxes', 'yes'), skip: 'Set up quarterly taxes' },
  ] },
  { rules: [
    { when: eq('restrictedStockRecent', 'yes'), add: { title: 'File §83(b) election within 30 days of grant — deadline is unforgiving', stage: 'now', nodeKey: 'business:9.1', tags: ['critical'] } },
    { when: eq('restrictedStockRecent', 'considering'), add: { title: 'Plan §83(b) filing ahead of any restricted-stock or early-exercise grant', stage: 'now', nodeKey: 'business:9.1', tags: [] } },
  ] },
  { rules: [
    { when: inn('emergencyFund', ['0', '<1mo']), add: { title: 'Build a $1,000 starter emergency fund (or one month of essentials)', stage: 'now', nodeKey: 'w2:2.1', tags: ['critical'] } },
    { when: ELSE, skip: 'Build $1,000 starter EF' },
  ] },
  { rules: [
    { when: eq('healthInsurance', 'no'), add: { title: 'Get health insurance in place — this week', stage: 'now', nodeKey: 'w2:1.3', tags: ['critical'] } },
    { when: eq('healthInsurance', 'minimal'), add: { title: 'Reassess whether your minimal coverage is appropriate', stage: 'now', nodeKey: 'w2:1.3', tags: [] } },
    { when: ELSE, skip: 'Verify health insurance' },
  ] },
  { guard: T('_w2'), rules: [
    { when: all(eq('employerMatch', 'yes'), inn('matchCaptured', ['no', 'partial'])), add: { title: 'Capture your full employer 401(k) match', stage: 'now', nodeKey: 'w2:3.1', tags: ['critical', 'bracket'], incomeType: 'w2' } },
    { when: eq('matchCaptured', 'yes'), skip: 'Capture employer match' },
    { when: eq('employerMatch', 'no'), skip: 'Capture employer match' },
  ] },
  { guard: T('_w2'), rules: [
    { when: eq('autoEscalation', 'yes-not-enabled'), add: { title: 'Enable 401(k) auto-escalation to ratchet your deferral toward 15–20% over the next 5 years', stage: 'now', nodeKey: 'w2:3.1', tags: ['critical'], incomeType: 'w2' } },
    { when: eq('autoEscalation', 'unsure'), add: { title: 'Ask HR whether your 401(k) plan supports auto-escalation, and enable it if so', stage: 'now', nodeKey: 'w2:3.1', tags: [], incomeType: 'w2' } },
    { when: eq('autoEscalation', 'yes-enabled'), skip: 'Enable auto-escalation' },
  ] },
  { rules: [
    { when: eq('highInterestDebt', 'yes'), add: { title: 'Eliminate high-interest debt (above ~7% after tax)', stage: 'now', nodeKey: 'w2:4.1', tags: ['critical'] } },
    { when: ELSE, skip: 'Eliminate high-interest debt' },
  ] },
  { rules: [
    { when: all(eq('federalStudentLoans', 'yes'), eq('pslfEligible', 'yes')), add: { title: 'Verify your IDR plan + pursue PSLF (post-SAVE-litigation decision tree)', stage: 'now', nodeKey: 'w2:4.1', tags: ['critical'] } },
    { when: all(eq('federalStudentLoans', 'yes'), eq('pslfEligible', 'unsure')), add: { title: 'Verify your PSLF eligibility before making payment decisions', stage: 'now', nodeKey: 'w2:4.1', tags: ['critical'] } },
  ] },
  { rules: [
    { when: all(eq('federalStudentLoans', 'yes'), inn('studentLoanAudited', ['never', 'unsure'])), add: { title: 'Audit your IDR / PSLF payment history at studentaid.gov', stage: 'now', nodeKey: 'w2:4.1', tags: ['critical'] } },
    { when: eq('studentLoanAudited', 'yes-discrepancies'), add: { title: 'Continue the servicer-history dispute / CFPB complaint process', stage: 'next-quarter', nodeKey: 'w2:4.1', tags: [] } },
  ] },
  { rules: [
    { when: eq('currentIDRPlan', 'save-forbearance'), add: { title: 'Switch from SAVE forbearance to IBR (or evaluate RAP from July 2026) to resume qualifying-payment accrual', stage: 'now', nodeKey: 'w2:4.1', tags: ['critical'] } },
  ] },
  { rules: [
    { when: eq('federalStudentLoans', 'yes'), add: { title: 'If any of your federal loans are Parent PLUS: consolidate before July 1, 2026 to preserve income-driven access', stage: 'now', nodeKey: 'w2:4.1', tags: ['critical'] } },
  ] },
  { rules: [
    { when: inn('currentIDRPlan', ['paye', 'icr', 'save-paying']), add: { title: (d) => `Plan your migration off ${d._idrPlanName} before the July 2028 legacy-plan shutdown`, stage: 'next-quarter', nodeKey: 'w2:4.1', tags: [] } },
    { when: eq('currentIDRPlan', 'rap'), skip: 'Legacy-plan migration' },
    { when: eq('currentIDRPlan', 'ibr'), skip: 'Legacy-plan migration' },
  ] },

  // ===================== STAGE: NEXT QUARTER =====================
  { rules: [
    { when: inn('ltdInPlace', ['no', 'partial']), add: { title: 'Secure long-term disability insurance (own-occupation if available)', stage: 'next-quarter', nodeKey: (d) => (d._isSE ? 'contractor:2.2' : 'w2:2.3'), tags: ['critical'] } },
    { when: ELSE, skip: 'Long-term disability insurance' },
  ] },
  { rules: [
    { when: all(eq('dependents', 'yes'), inn('termLifeInPlace', ['no', 'partial'])), add: { title: 'Get term life insurance (10–12× annual income)', stage: 'next-quarter', nodeKey: 'w2:2.3', tags: ['critical'] } },
    { when: eq('dependents', 'no'), skip: 'Term life insurance' },
    { when: eq('termLifeInPlace', 'yes'), skip: 'Term life insurance' },
  ] },
  { rules: [
    { when: all(eq('taxBracket', 'high'), inn('ltdInPlace', ['no', 'partial']), eq('dependents', 'yes'), inn('termLifeInPlace', ['no', 'partial'])), add: { title: 'Close the disability gap before adding term-life coverage', stage: 'next-quarter', nodeKey: 'w2:2.3', tags: ['critical'] } },
  ] },
  { guard: T('_isSE'), rules: [
    { when: ne('sePlan', 'yes'), add: { title: 'Set up your self-employed retirement plan (Solo 401(k) preferred)', stage: 'next-quarter', nodeKey: (d) => `${d._ic}:3.1`, tags: ['bracket'], incomeType: (d) => d._ic } },
  ] },
  { guard: T('_isSE'), rules: [
    { when: inn('businessInsurance', ['partial', 'no']), add: { title: 'Get appropriate business insurance (liability, E&O, cyber)', stage: 'next-quarter', nodeKey: (d) => (d._ic === 'business' ? 'business:2.3' : 'contractor:2.4'), tags: [], incomeType: (d) => d._ic } },
  ] },
  { rules: [
    { when: all(inn('estateDocs', ['no', 'outdated']), any(eq('dependents', 'yes'), eq('netWorth', '500k-2m'), eq('netWorth', '2m+'))), add: { title: 'Establish or update baseline estate documents', stage: 'next-quarter', nodeKey: 'w2:6.3', tags: [] } },
    { when: eq('estateDocs', 'yes'), skip: 'Estate documents' },
  ] },

  // ===================== STAGE: THIS YEAR =====================
  { rules: [
    { when: T('_efBelowTarget'), add: { title: (d) => `Build your full emergency fund (${d._efTarget} of essential expenses)`, stage: 'this-year', nodeKey: (d) => (d._isSE ? 'contractor:5.1' : 'w2:5.1'), tags: [] } },
    { when: T('_efAtOrAbove'), skip: 'Build full emergency fund' },
  ] },
  { rules: [
    { when: all(eq('hdhpEligible', 'yes'), ne('hsaMaxed', 'yes')), add: { title: 'Max your HSA contribution ($4,400 self / $8,750 family for 2026)', stage: 'this-year', nodeKey: 'w2:6.1', tags: [] } },
    { when: eq('hdhpEligible', 'no'), skip: 'Max HSA' },
    { when: eq('hdhpEligible', 'eligible-not'), skip: 'Max HSA (consider HDHP switch)' },
    { when: eq('hsaMaxed', 'yes'), skip: 'Max HSA' },
  ] },
  // IRA: when iraMaxed !== 'yes' → optional pro-rata rollover, then the IRA/backdoor add; else skip.
  { guard: ne('iraMaxed', 'yes'), rules: [
    { when: T('_proRataIssue'), add: { title: 'Roll any existing Traditional IRA balances into your 401(k) first', stage: 'this-year', nodeKey: (d) => (d._contractor ? 'contractor:6.2' : 'w2:6.2'), tags: ['critical'] } },
  ] },
  { guard: ne('iraMaxed', 'yes'), rules: [
    { when: ELSE, add: { title: (d) => (d._isBackdoor ? 'Execute the Backdoor Roth IRA ($7,500 for 2026)' : 'Max your IRA ($7,500 for 2026, Roth or Traditional based on your bracket)'), stage: 'this-year', nodeKey: (d) => (d._contractor ? 'contractor:6.2' : 'w2:6.2'), tags: ['bracket'] } },
  ] },
  { rules: [{ when: eq('iraMaxed', 'yes'), skip: 'Max IRA' }] },
  { rules: [
    { when: all(eq('_bracket', 'low'), T('_notRetiredIncome')), add: { title: "File IRS Form 8880 to claim the Saver's Credit (IRC §25B)", stage: 'this-year', nodeKey: (d) => (d._contractor ? 'contractor:6.2' : 'w2:6.2'), tags: ['critical'] } },
  ] },
  { rules: [
    { when: all(eq('_bracket', 'low'), T('_notRetiredIncome')), add: { title: 'Check EITC eligibility + use free VITA preparation (do NOT use storefront preparers)', stage: 'now', nodeKey: 'w2:8.1', tags: ['critical'] } },
  ] },
  { rules: [
    { when: all(any(T('_isSE'), T('_w2')), ne('_bracket', 'high'), any(inn('healthInsurance', ['no', 'minimal']), all(T('_isSE'), inn('incomeStability', ['variable', 'concentrated'])))), add: { title: 'Apply for ACA Premium Tax Credit via healthcare.gov / state marketplace', stage: 'now', nodeKey: 'w2:1.3', tags: ['critical'] } },
  ] },
  { rules: [
    { when: any(eq('_bracket', 'low'), all(inn('incomeStability', ['variable', 'concentrated']), ne('_bracket', 'high'))), add: { title: 'Run safety-net program eligibility checks (SNAP / Medicaid / Lifeline / LIHEAP)', stage: 'now', nodeKey: 'w2:8.1', tags: ['critical'] } },
  ] },
  { rules: [
    { when: any(eq('_bracket', 'low'), inn('emergencyFund', ['0', '<1mo', '1-3mo'])), add: { title: 'Opt out of debit-card overdraft (Reg E) + move to a no-overdraft-fee bank account', stage: 'now', nodeKey: 'w2:5.1', tags: ['critical'] } },
  ] },
  { rules: [
    { when: eq('moderateDebt', 'yes'), add: { title: 'Address moderate-interest debt (rates above HYSA yield, below ~7%)', stage: 'this-year', nodeKey: 'w2:7.2', tags: [] } },
    { when: ELSE, skip: 'Address moderate-interest debt' },
  ] },
  // 401(k): primary add + nested Roth-catch-up add, then the two else-if skips.
  { guard: all(T('_w2'), ne('k401Maxed', 'yes'), inn('iraMaxed', ['yes', 'partial'])), rules: [
    { when: ELSE, add: { title: 'Increase your 401(k) contribution toward the $24,500 employee max', stage: 'this-year', nodeKey: 'w2:8.1', tags: ['bracket'], incomeType: 'w2' } },
  ] },
  { guard: all(T('_w2'), ne('k401Maxed', 'yes'), inn('iraMaxed', ['yes', 'partial']), T('_ageNeedsCatchup'), eq('_bracket', 'high')), rules: [
    { when: ELSE, add: { title: 'Verify your 401(k) plan supports Roth catch-up contributions', stage: 'this-year', nodeKey: 'w2:8.1', tags: ['critical'], incomeType: 'w2' } },
  ] },
  { rules: [
    { when: all(T('_w2'), eq('k401Maxed', 'yes')), skip: 'Max 401(k)' },
    { when: { not: T('_w2') }, skip: 'Max 401(k)' },
  ] },
  { guard: T('_isSE'), rules: [
    { when: all(ne('sePlanMaxed', 'yes'), eq('sePlan', 'yes')), add: { title: 'Maximize your Solo 401(k) / business 401(k) (employee + employer side)', stage: 'this-year', nodeKey: (d) => (d._ic === 'business' ? 'business:8.1' : 'contractor:8.1'), tags: ['bracket'], incomeType: (d) => d._ic } },
    { when: eq('sePlanMaxed', 'yes'), skip: 'Max SE retirement plan' },
  ] },

  // ===================== STAGE: EVENTUALLY =====================
  { guard: T('_isSE'), rules: [
    { when: ELSE, add: { title: 'Plan for the Section 199A QBI deduction', stage: 'eventually', nodeKey: (d) => (d._ic === 'business' ? 'business:8.3' : 'contractor:8.2'), tags: [], incomeType: (d) => d._ic } },
  ] },
  { rules: [
    { when: all(T('_contractor'), ne('entityStructure', 's-corp'), ne('entityStructure', 'c-corp'), any(eq('_bracket', 'mid'), eq('_bracket', 'high'))), add: { title: 'Analyze whether to elect S-corp status', stage: 'eventually', nodeKey: 'contractor:9.1', tags: [], incomeType: 'contractor' } },
  ] },
  { rules: [
    { when: any(T('_w2'), T('_isSE')), add: { title: 'Check whether your 401(k) supports the Mega Backdoor Roth', stage: 'eventually', nodeKey: (d) => (d._contractor ? 'contractor:9.2' : 'w2:9.1'), tags: ['bracket'] } },
  ] },
  { rules: [{ when: ELSE, add: { title: 'Open a taxable brokerage with asset-location-optimized holdings', stage: 'eventually', nodeKey: 'w2:9.2', tags: [] } }] },
  { rules: [{ when: ELSE, add: { title: 'Use tax-loss harvesting in your taxable account', stage: 'eventually', nodeKey: 'w2:9.3', tags: [] } }] },
  { rules: [
    { when: eq('childrenEducation', 'yes'), add: { title: 'Open a 529 plan for education funding', stage: 'eventually', nodeKey: 'w2:9.4', tags: [] } },
    { when: ELSE, skip: '529 education plans' },
  ] },
  { guard: inn('yearsToRetirement', ['<5', '5-10']), rules: [
    { when: ELSE, add: { title: 'Start formal decumulation planning (Roth conversions, withdrawal sequencing)', stage: 'eventually', nodeKey: 'w2:10.1', tags: [] } },
  ] },
  { guard: inn('yearsToRetirement', ['<5', '5-10']), rules: [
    { when: ELSE, add: { title: 'Plan your Social Security claiming strategy', stage: 'eventually', nodeKey: 'w2:10.3', tags: [] } },
  ] },
  { rules: [
    { when: all(T('_lowWillingness'), inn('yearsToRetirement', ['20-30', '30+'])), add: { title: 'Set a glide path more conservative than your horizon alone would prescribe', stage: 'next-quarter', nodeKey: 'math:1', tags: [] } },
  ] },
  { guard: all(inn('yearsToRetirement', ['<5', '5-10', 'already']), T('essentialFraction')), rules: [
    { when: T('_stratClass'), add: { title: (d) => `Use the ${d._stratClass} strategy class in §7 — your essential-fraction allows it`, stage: 'eventually', nodeKey: 'w2:10.2', tags: [] } },
  ] },
  { rules: [
    { when: eq('parentCare', 'yes-substantial'), add: { title: 'Build aging-parent financial support into your cash-flow and savings-rate planning', stage: 'this-year', nodeKey: 'w2:10.4', tags: [] } },
  ] },
  { rules: [
    { when: eq('rothLadderCandidate', 'yes-window'), add: { title: 'Execute Roth conversion ladder during the tax-valley years — size to IRMAA tier, not federal bracket', stage: 'this-year', nodeKey: 'w2:10.1', tags: ['critical'] } },
    { when: eq('rothLadderCandidate', 'yes-no-window'), add: { title: 'Pursue partial Roth conversions in any remaining lower-income years; coordinate with QCD planning', stage: 'this-year', nodeKey: 'w2:10.1', tags: [] } },
    { when: eq('rothLadderCandidate', 'unsure'), add: { title: 'Inventory your Traditional / pre-tax retirement balances and evaluate ladder candidacy', stage: 'next-quarter', nodeKey: 'w2:10.1', tags: [] } },
  ] },
  { guard: inn('ageBracket', ['50-59', '60-63', '64+']), rules: [
    { when: inn('netWorth', ['negative', 'under-100k', '100k-500k']), add: { title: 'Plan for Medicaid-path long-term care, not LTC insurance', stage: 'eventually', nodeKey: 'w2:10.4', tags: [] } },
    { when: eq('netWorth', '500k-2m'), add: { title: 'You are in the LTC insurance / hybrid-policy sweet spot — get quotes this year', stage: (d) => (d._inSweetSpot ? 'this-year' : 'eventually'), nodeKey: 'w2:10.4', tags: (d) => (d._inSweetSpot ? ['critical'] : []) } },
    { when: eq('netWorth', '2m+'), add: { title: 'Self-insurance feasible; review whether LTC insurance still pencils for legacy preservation', stage: 'eventually', nodeKey: 'w2:10.4', tags: [] } },
  ] },
  { rules: [
    { when: all(T('_business'), any(eq('netWorth', '2m+'), eq('netWorth', '500k-2m'))), add: { title: 'Engage advanced estate planning (GRATs, SLATs, dynasty trusts)', stage: 'eventually', nodeKey: 'business:10.3', tags: [], incomeType: 'business' } },
  ] },
  { rules: [
    { when: all(T('_business'), eq('entityStructure', 'c-corp')), add: { title: 'Evaluate Section 1202 QSBS positioning', stage: 'eventually', nodeKey: 'business:9.1', tags: [], incomeType: 'business' } },
  ] },
  { rules: [
    { when: all(T('_business'), any(eq('exitTimeline', 'within-3'), eq('exitTimeline', '3-10'))), add: { title: 'Begin business succession or sale preparation', stage: 'eventually', nodeKey: 'business:10.1', tags: [], incomeType: 'business' } },
  ] },
  { rules: [
    { when: all(T('_isSE'), eq('_bracket', 'high')), add: { title: 'Evaluate the Cash Balance DB plan + full §415 stack (Phase 7)', stage: 'eventually', nodeKey: 'business:8.1', tags: [] } },
  ] },
  { rules: [
    // v1 had `dependents === 'yes' || dependents === 'multiple'`; 'multiple' is not
    // a valid dependents option, so that branch was dead. Removed (zero behavior change).
    { when: all(eq('_bracket', 'high'), eq('dependents', 'yes')), add: { title: 'Read the family-wealth strategies catalog (Phase 7)', stage: 'eventually', nodeKey: 'w2:9.4', tags: [] } },
  ] },
  { rules: [
    // v1's third OR-branch tested `rothLadderCandidate === 'yes'`, but the options
    // are yes-window / yes-no-window / low-trad / unsure — never bare 'yes' — so
    // that branch was dead. Removed (zero behavior change); condition reduces to a
    // high-bracket CA resident with a near-term liquidity event.
    { when: all(eq('_bracket', 'high'), eq('state', 'ca'), any(eq('exitTimeline', 'within-3'), eq('exitTimeline', '3-10'))), add: { title: 'Evaluate state-domicile change ahead of any major liquidity event (Phase 7)', stage: (d) => (d.exitTimeline === 'within-3' ? 'this-year' : 'eventually'), nodeKey: 'business:8.4', tags: (d) => (d.exitTimeline === 'within-3' ? ['critical'] : []) } },
  ] },
  { rules: [
    { when: any(eq('rentalRealEstate', 'str-current'), eq('rentalRealEstate', 'str-exploring'), all(eq('rentalRealEstate', 'long-term-rentals'), eq('_bracket', 'high'))), add: { title: 'Before any cost-seg-firm sales call: read AdvStrat §4 + §8 first (defensive routing)', stage: (d) => (d._isExploring ? 'eventually' : 'this-year'), nodeKey: 'w2:9.3', tags: (d) => (d._isExploring ? [] : ['critical']) } },
  ] },
  { rules: [
    { when: all(eq('_bracket', 'high'), eq('netWorth', '2m+')), add: { title: 'Read the adjacent-vehicles catalog (Phase 7)', stage: 'eventually', nodeKey: 'w2:9.3', tags: [] } },
  ] },
];

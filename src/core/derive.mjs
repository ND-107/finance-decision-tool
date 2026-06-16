// derive.mjs — compute the derived answer fields the plan rules read, faithfully
// reproducing v1 computePlan's helper functions (isSE, bracket, ic, the EF index
// math, the risk-capacity collapse, the essential-fraction strategy map, …).
// Keeping these as derived fields lets the rule predicates stay simple eq/in/has
// over a flat answers object (src/core/predicates.mjs), while the dynamic title/
// stage/nodeKey bits read the same derived object.

const EF_SIZES = ['0', '<1mo', '1-3mo', '3-6mo', '6-12mo', '12+mo'];
const STRAT_CLASS = {
  '90+': 'Bengen fixed-real with floor-and-upside structural backup',
  '70-90': 'Guyton-Klinger guardrails (modest discretionary cushion)',
  '50-70': 'Vanguard-style dynamic spending or Guyton-Klinger (meaningful discretionary cushion)',
  'under-50': 'Maximum flexibility — Vanguard dynamic or even higher initial withdrawal rate',
};
const IDR_PLAN_NAME = { paye: 'PAYE', icr: 'ICR', 'save-paying': 'SAVE' };

/** @param {Record<string,any>} a answers @returns {Record<string,any>} answers + derived `_*` fields */
export function derive(a) {
  const inc = Array.isArray(a.incomeTypes) ? a.incomeTypes : [];
  const w2 = inc.includes('w2');
  const contractor = inc.includes('contractor');
  const business = inc.includes('business');
  const isSE = contractor || business;
  const bracket = a.taxBracket || 'mid'; // v1 bracket() default
  const ic = business ? 'business' : 'contractor';

  const efIdx = EF_SIZES.indexOf(a.emergencyFund); // -1 if unset
  const targetIdx = isSE ? 4 : 3;

  const cap = a.riskCapacityRevealed && a.riskCapacityRevealed !== 'not-investing' ? a.riskCapacityRevealed : a.riskCapacity;
  const lowWillingness = ['reduce-equity', 'move-to-cash', 'reduced-equity', 'moved-to-cash'].includes(cap);

  return {
    ...a,
    _w2: w2, _contractor: contractor, _business: business, _isSE: isSE,
    _bracket: bracket,
    _ic: ic,
    _icNodeContractor: ic === 'business' ? 'business' : 'contractor', // for nodeKey building
    _efBelowTarget: efIdx >= 0 && efIdx < targetIdx,
    _efAtOrAbove: efIdx >= targetIdx,
    _efTarget: isSE ? '6–12 months' : '3–6 months',
    _isBackdoor: bracket === 'high',
    _proRataIssue: bracket === 'high' && a.tradIraBalance === 'yes',
    _ageNeedsCatchup: ['50-59', '60-63', '64+'].includes(a.ageBracket),
    _inSweetSpot: a.ageBracket === '50-59' || a.ageBracket === '60-63',
    _isExploring: a.rentalRealEstate === 'str-exploring',
    _lowWillingness: lowWillingness,
    _stratClass: STRAT_CLASS[a.essentialFraction] || null,
    _idrPlanName: IDR_PLAN_NAME[a.currentIDRPlan] || null,
    _notRetiredIncome: inc.some((t) => t !== 'retired'),
    _hasEarned: w2 || isSE, // earned income — IRA-contribution eligibility (audit CL488)
    _nearRetirement: ['<5', '5-10', 'already'].includes(a.yearsToRetirement), // ladder execute vs plan-ahead (CL492)
  };
}

export { EF_SIZES };

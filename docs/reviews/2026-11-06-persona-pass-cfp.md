# Phase 4 persona pass — fee-only fiduciary CFP (2026-11-06)

Reviewer: subagent in the fee-only fiduciary CFP persona, Claude Opus at medium effort, read-only over `src/content/phase4/{life-events,protection,annual-review,plain}.json` as deployed in `main` edb4b3e. Statutory facts were out of scope (CL483–CL528 verified the same day). **Findings are recorded, not applied**; each fix needs the owner's go (V2 plan §4.4). The reviewer marked three items `[VERIFY]` as resting on 2026 law it did not confirm; those are the reviewer's unverified assertions, not audited claims.

Totals as reported: 65 findings. The reviewer's text follows verbatim.

---

Scope: I read all four files in full and changed nothing. The plain.json proposition maps mark every proposition "kept", so the plain-English findings below are about nuance a planner would miss, not dropped propositions. Three items rest on 2026 law I could not confirm in this pass. Each is marked [VERIFY], and none is one of your CL-verified claims.

=== LIFE EVENTS ===

JOB LOSS

1. le:job-loss:coverage — HIGH
Phrase: "Compare all three on total cost, not premium alone."
Why: The steps are not reversible in the same way, and the text treats them as equal options. Dropping COBRA voluntarily mid-year does not open a Marketplace special enrollment period; only running out of COBRA does. Once the 60-day loss-of-coverage window passes, someone who chose COBRA is locked in until open enrollment. COBRA election is also retroactive: a healthy person can wait most of the 60 days and elect only if a claim comes up. That is the actual planner move here, and it is missing.
Rewrite: "COBRA can be elected late in the 60-day window and covers you back to the day your coverage ended, so some people wait and see. But choosing COBRA and later dropping it does not reopen the Marketplace before open enrollment, so make the Marketplace comparison before the window closes."

2. le:job-loss:coverage — HIGH (benefits cliff) [VERIFY current law]
Phrase: "premium tax credits are based on your expected income for the year, which may now be lower"
Why: The text assumes that expected income will be low. Severance, unemployment pay, any 401(k) cash-out and a new job later in the year all count toward annual income. For 2026 the enhanced credits appear to have lapsed, which brings back the 400%-of-poverty cliff where the whole credit is lost. Repayment caps on excess advance credit also appear to be gone from 2026. A mid-year rehire can mean a large repayment at tax time.
Rewrite: "Count severance, unemployment pay and any new-job wages in the estimate, and report income changes to the Marketplace as they happen; credits paid in advance are reconciled on your return and any excess is paid back."

3. le:job-loss:coverage — MED (missing)
Two items are absent. A health FSA balance is generally lost at separation, and the uniform-coverage rule lets you use the full annual election before your last day. An HSA can pay COBRA premiums, and health premiums while you collect unemployment, tax-free.
Addition: "Before your last day, use any health FSA balance; after it, your HSA can pay COBRA premiums, and premiums while you receive unemployment, tax-free."

4. le:job-loss:runway — HIGH (missing step)
A 401(k) loan is the step a planner would never leave out. Leaving a job usually makes an outstanding 401(k) loan due, and an unpaid balance becomes a taxable "loan offset," plus the 10% additional tax before 59½. The offset can be rolled over until the tax-filing deadline (with extensions) for that year.
Addition: "If you have a 401(k) loan, find out when it becomes due; an unpaid balance is treated as a distribution, but you can avoid the tax by depositing that amount into an IRA by your tax-filing deadline."

5. le:job-loss:runway — HIGH (overgeneralization; the plain variant makes it worse)
Phrase: "minimum payments on every debt still come before any other goal". Plain: "keep making the minimum payment on every debt before anything else."
Why: In a real cash crunch, housing, utilities, food, insurance and transportation to work come before minimums on unsecured debt. The plain version reads as "pay credit-card minimums before rent." Lenders' hardship programs and income-driven repayment on federal student loans (often $0 on zero income) are also missing.
Rewrite: "Cover housing, utilities, food and insurance first, then keep minimum payments current on every debt; call lenders early about hardship programs, and recertify federal student loans on an income-driven plan."

6. le:job-loss:runway — MED
Phrase: "Divide liquid savings by essential monthly spending"
Why: This overstates the shortfall and leaves out timing. Net severance and expected unemployment pay should go into the calculation. Unemployment is usually not paid retroactively before the claim date, and in some states severance delays it.
Rewrite: "Add expected severance and unemployment pay to liquid savings before dividing; file for unemployment right away, because benefits generally start from the claim date and severance can delay them in some states."

7. le:job-loss:old-401k — MED
Missing interaction: rolling pre-tax money into an IRA brings in the pro-rata rule for anyone doing backdoor Roth contributions. IRAs and 401(k)s also differ on creditor protection.
Addition: "If you make backdoor Roth contributions, a pre-tax IRA balance makes them partly taxable; rolling into the new employer's plan avoids that."

8. le:job-loss:old-401k — LOW
Phrase: "a check paid to you carries 20% mandatory withholding"
Why: The text does not say what to do if a check has already been cut. A 60-day indirect rollover is still possible, but you must make up the withheld 20% from other money.
Addition: "If a check was already issued, you can still roll it over within 60 days, but you must make up the withheld 20% from other funds to avoid tax on it."

9. le:job-loss:equity vs le:job-loss:old-401k — MED (ordering)
Phrase: equity is labeled "Check the grant documents now" but sits after the 401(k) step labeled "Within 1–3 months".
Why: This breaks the intro's own rule that time-critical steps come first. Option exercise windows (often 90 days) are irreversible; the 401(k) decision is not. Exercising also takes cash and can trigger AMT (ISOs), which competes with runway. RSU, ESPP and deferred-compensation payout rules are not mentioned.
Fix: Move equity to position 3, and add: "Exercising takes cash and can create tax (including AMT for incentive stock options), so weigh it against your runway; also check unvested RSUs, ESPP and any deferred-compensation payout schedule."

10. le:job-loss:withholding — LOW
Missing: an excess deferral across two employers has to be withdrawn by April 15, or it is taxed twice. Excess Social Security withholding from two employers is credited on your own return, not refunded by payroll.
Addition: "If you went over the limit, ask a plan to return the excess by April 15; extra Social Security tax withheld by two employers comes back as a credit on your return."

NEW BABY

11. le:new-baby:protection — HIGH
Phrase: "Update beneficiary designations at the same time."
Why: The most common error at this life event is naming the minor child directly. A minor cannot take the money: it goes through court-supervised guardianship or reaches the child outright at 18 or 21. The guardian named in the will is for the child, not the money.
Rewrite: "Do not name a minor child directly as beneficiary; name a trust (often created in the will) or a custodian under your state's transfers-to-minors act, so someone you chose manages the money."

12. le:new-baby:protection — MED
Phrase: "10–12 times the primary earner's income"
Why: This misses the common exception of the non-earning or lower-earning parent, whose death creates large childcare costs. It also misses that group life through an employer usually ends with the job (ties to job loss).
Addition: "A stay-at-home or lower-earning parent also needs coverage sized to the childcare and household work that would have to be paid for; employer group life usually ends when the job does."

13. le:new-baby:childcare — MED (timing)
Phrase: "Before open enrollment"
Why: A birth or adoption is a change-in-status event that usually allows a mid-year dependent-care FSA election, often within 30 days. Waiting for open enrollment loses months of pre-tax childcare.
Rewrite: "A birth or adoption usually lets you start or change a dependent-care FSA mid-year, typically within 30 days of the event; otherwise elect it at open enrollment."

14. new-baby (playbook) — MED (missing steps)
- Paid leave cash flow. Short-term disability, state paid family leave and employer leave claims should be filed before the due date. The pay drop is the first money event.
- Adoption. The playbook title includes adoption, but the adoption credit and employer adoption assistance are absent.
- [VERIFY] The OBBBA "Trump account," including the federal pilot deposit for children born 2025–2028, needs the child's SSN and an election.
Additions: a "Before the birth" step: "File for short-term disability, state paid leave and employer leave ahead of time so the pay gap is planned." A line in ssn: "The SSN is also needed for dependent-care benefits, a 529 and any child savings account opened in the child's name."

15. le:new-baby:enroll — LOW
Missing: enrolling within the window usually makes the child's coverage retroactive to the date of birth or adoption. Moving to family HDHP coverage also changes the year's HSA limit.
Addition: "Enrolling within the window usually covers the child from the date of birth; if you move to family HDHP coverage, your HSA limit for the year changes too."

MARRIAGE

16. le:marriage:enroll — MED
Missing trap: if one spouse has HSA-eligible coverage and the other has a general-purpose health FSA, the FSA usually covers both spouses' expenses. That makes the HSA spouse ineligible to contribute.
Addition: "If one of you contributes to an HSA, a general-purpose health FSA from the other spouse's employer can make the HSA ineligible; check before electing."

17. le:marriage:filing — MED (interaction)
Phrase: "Re-run withholding under your new filing status"
Why: Filing status also changes other parts of the plan. Combined income changes Roth IRA eligibility and traditional IRA deductibility, and married filing separately nearly closes direct Roth contributions. It changes income-driven student loan payments, where filing separately can be worth it. It can also end Marketplace credits for a spouse who was on the Marketplace.
Addition: "Combined income also changes Roth IRA eligibility, income-driven student loan payments and any Marketplace credit, so check those before choosing joint or separate."

18. le:marriage:beneficiaries — MED
Phrase: "unless they waive in writing"
Why: A waiver in a prenuptial agreement generally does not count, because the spouse must waive after the marriage. Marriage also does not update a will, power of attorney or healthcare proxy, and the playbook has no estate step.
Addition: "A prenuptial waiver generally does not count; the spouse signs the plan's waiver after the wedding. Update your will, power of attorney and healthcare directive too, because marriage alone does not."

DIVORCE

19. le:divorce:filing — HIGH (missing deadline)
Phrase: "Losing coverage under a spouse's plan is a COBRA qualifying event (up to 36 months for a former spouse)"
Why: For divorce, the former spouse (or the employee) must notify the plan within 60 days of the divorce. If they don't, COBRA rights are lost. This is the one COBRA case where the beneficiary must act first.
Rewrite: "...but the plan must be told within 60 days of the divorce or legal separation, or the right to COBRA is lost."

20. le:divorce:qdro — HIGH
Phrase: "distributions to the alternate payee under a QDRO are exempt from the 10% additional tax"
Why: The exemption applies only to money paid directly from the plan. If the alternate payee rolls the share into an IRA first and then withdraws, the exemption is lost. The other missing point is tax character: $100k in a pre-tax 401(k) is not equal to $100k in cash or in a Roth, or to stock with low basis. Settlements that split nominal dollars shortchange one side.
Rewrite: "The 10% exemption applies only to money taken directly from the plan; once it is rolled into an IRA, the usual IRA rules apply. Compare assets after tax: pre-tax retirement money, Roth money, cash and appreciated stock are not worth the same per dollar."

21. le:divorce:counsel — MED (missing)
Missing: a former spouse can claim Social Security benefits on the other's record if the marriage lasted 10 years. Planners always check the finalization date against that mark. Life insurance to secure support payments is also absent.
Addition: "A marriage of 10 years or more can give a former spouse Social Security benefits on the other's record, so check the date; support payments are often secured with life insurance named in the settlement."

22. le:divorce:beneficiaries — MED (sequencing)
Phrase: "Immediately after the decree"
Why: Many states impose automatic restraining orders while a divorce is pending that forbid beneficiary changes. ERISA spousal rights also last until the divorce is final, and the settlement may require keeping the ex as beneficiary for support. Meanwhile the ex-spouse is often the agent on the power of attorney and healthcare proxy. Those can usually be revoked right away.
Rewrite: "While the case is pending, changes may be restricted, so ask counsel; you can usually replace your spouse as agent on your power of attorney and healthcare directive at once, and file new beneficiary forms as soon as the decree and settlement allow."

23. le:divorce:filing — MED (overgeneralization)
Phrase: "Marital status on December 31 sets filing status for the year."
Why: The common exception is a parent still legally married who lived apart for the last six months of the year and paid most of the cost of a home for a child. That parent can file as head of household. Who claims the child (Form 8332) is also an issue the settlement settles.
Addition: "If you lived apart for the last six months of the year and kept up a home for a child, you may file as head of household even while still married; the settlement should say who claims each child."

HOME PURCHASE

24. le:home-purchase:afford — MED (missing)
Missing: closing costs (often 2–5%) and an ongoing maintenance budget (commonly 1–2% of value per year). Also missing: don't open new credit or change jobs between pre-approval and closing.
Addition: "Save closing costs separately from the down payment, budget roughly 1–2% of the home's value a year for upkeep, and avoid new credit or a job change before closing."

25. le:home-purchase:insure — LOW
Missing: an owner's title insurance policy, which is bought once at closing. Wind, hail and earthquake exclusions and deductibles are not mentioned.
Addition: "Consider an owner's title policy at closing, and check wind, hail and earthquake exclusions, not just flood."

26. le:home-purchase (playbook) — MED (missing)
Missing: a homestead exemption usually has to be applied for, by a local deadline. Also missing: how the home is titled (joint tenancy, community property, transfer-on-death deed), which sets who gets it at death and ties to the estate section.
Addition: a "First year" step: "Apply for any homestead exemption by your county's deadline, and confirm how the deed is titled, because that decides who owns it if one owner dies."

27. le:home-purchase:pmi — LOW
Phrase: "On a conventional loan"
Why: The common exception is FHA mortgage insurance, which follows different rules and can last the life of the loan with a small down payment.
Addition: "FHA mortgage insurance follows different rules and may last the life of the loan; refinancing is the usual way out."

RELOCATION

28. le:relocation:residency — MED
Phrase: "Each state decides for itself who is a resident"
Why: The text is silent on income that follows the old state. Keeping the old home can make you a statutory resident of both states. RSUs and deferred compensation earned in the old state are often taxed there when they vest or pay out (ties to job-loss:equity). Some states tax remote work for an in-state employer.
Addition: "Keeping a home in the old state can leave you a resident of both; stock awards and deferred pay earned there may still be taxed there when they vest or pay out."

29. relocation (playbook) — MED (missing)
Missing: tell payroll to change state withholding, and file address changes with the IRS (Form 8822), SSA and plan custodians.
Addition: "Ask payroll to switch state withholding on the day you move, and update your address with the IRS, Social Security and every account custodian."

30. le:relocation:coverage — MED
Phrase: "A permanent move ... is a Marketplace special enrollment trigger (60 days)."
Why: The common exception: the move special enrollment period generally requires qualifying coverage for at least one day in the 60 days before the move. Retirees are also missing. A Medicare Advantage plan may not work in the new area, and Medigap underwriting rules vary by state.
Addition: "The move window generally requires that you had coverage for at least one day in the 60 days before moving; on Medicare, a move out of your plan's service area has its own special enrollment period."

31. le:relocation:estate — MED
Missing: moving into or out of a community-property state changes how property is characterized at death and at divorce.
Addition: "Moving into or out of a community-property state can change how a couple's property is treated, so raise it in the review."

WINDFALL

32. le:windfall:character — HIGH
Phrase: "Most non-spouse beneficiaries of an inherited IRA must empty it within 10 years"
Why: The step leaves out the irreversible mistake. A non-spouse beneficiary cannot roll an inherited IRA into their own IRA. It has to move by trustee-to-trustee transfer into an account titled as an inherited IRA. A check paid to the beneficiary is fully taxable and cannot be put back.
Addition: "Move an inherited IRA only by direct transfer into an account titled as inherited; a check made out to you cannot be redeposited and is taxed in full."

33. le:windfall:character — MED
Phrase: "Inherited assets generally get a basis stepped up..."
Why: Placed right before the IRA sentence, this reads as if IRAs get a step-up too. Traditional IRAs, 401(k)s, annuity gains and savings-bond interest are income in respect of a decedent and get no step-up.
Rewrite: "...but retirement accounts, annuities and savings bonds do not get a step-up; withdrawals from them are taxed as income."

34. le:windfall:park — HIGH (interaction)
Phrase: "Park the money somewhere safe and boring before deciding anything"
Why: Disclaiming an inheritance is a decision that has to be made inside the cooling-off period. A qualified disclaimer must generally be made within 9 months and before you accept the asset; moving inherited money into your own account can count as acceptance. Taxable windfalls (lottery, bonus, settlement, business sale) also need estimated tax payments that same quarter. And a large sum can exceed FDIC coverage at one bank.
Addition: "Before moving inherited assets, ask whether disclaiming them (generally within 9 months, before you accept them) would serve the family better; set aside and pay estimated tax on a taxable windfall; and keep each bank deposit within FDIC limits."

35. le:windfall:sequence — MED (benefits cliffs)
Missing: inherited IRA withdrawals and taxable windfalls raise income. That can cost Marketplace credits, raise Medicare IRMAA two years later and lower financial aid. A windfall can also disqualify a recipient of SSI or Medicaid outright.
Addition: "Time taxable withdrawals with the income-based benefits they affect: Marketplace credits, Medicare surcharges two years later and college aid. Anyone on SSI or Medicaid should get advice before accepting."

36. le:windfall:sequence — LOW
Phrase: "then fill tax-advantaged space"
Why: Most tax-advantaged space needs earned income. The practical route is raising payroll deferrals and living on the windfall.
Addition: "Since contributions come from pay, a common route is raising your 401(k) deferral and spending from the windfall."

RETIREMENT

37. le:retirement:medicare — HIGH (cross-playbook interaction)
Phrase: "without other qualifying coverage"
Why: COBRA and retiree health plans do not count as coverage that avoids the Part B penalty. Someone laid off at 64 who follows job-loss:coverage into COBRA, and stays on it past 65, gets a lifetime penalty plus coverage gaps. The second trap is the HSA: Part A coverage is retroactive up to 6 months for people enrolling after 65, so HSA contributions must stop about 6 months before.
Addition: "COBRA and retiree coverage do not count as current-employment coverage for Part B, so don't use COBRA to delay Part B. If you will contribute to an HSA past 65, stop six months before applying, because Part A coverage reaches back up to six months."

38. le:retirement:medicare — MED (missing)
Missing: the 6-month Medigap open enrollment period, which starts with Part B and is the one guaranteed-issue window in most states. Also missing: IRMAA can be appealed for a work stoppage (Form SSA-44), which matters in the first retirement year, when the two-year lookback catches peak earnings.
Addition: "Your Medigap open enrollment runs six months from when Part B starts, which in most states is the only time insurers cannot turn you down; if a two-year-old income sets a surcharge after you stop working, you can ask SSA to use current income."

39. retirement (playbook) — HIGH (missing step)
Missing: an irreversible pension election (lump sum or annuity, single-life or joint-and-survivor, with spousal consent).
Addition: "If you have a pension, the payout choice (lump sum or annuity, single or joint-and-survivor) is usually permanent, and a spouse must consent to giving up survivor benefits; decide it before the paperwork deadline."

40. retirement (playbook) — HIGH (missing for early retirees)
The playbook assumes retirement at 65. Anyone retiring earlier needs a coverage bridge to Medicare (COBRA or the Marketplace). On the Marketplace, the income shown (withdrawals, Roth conversions, capital gains) sets the credit, which is the same cliff as finding 2.
Addition: a first step "Before you stop working (if before 65): plan health coverage until Medicare; Marketplace credits depend on the income you take, so withdrawals and Roth conversions change the premium."

41. le:retirement:rmd — HIGH (overgeneralization)
Phrase: "Required minimum distributions from traditional accounts start at age 73."
Why: The statutory age is 75 for people born in 1960 or later, which covers almost everyone retiring now. The first RMD can wait until April 1 of the next year, but then two RMDs fall in one tax year. People still working can usually delay RMDs from their current employer's plan.
Rewrite: "RMDs start at 73 if you were born 1951–1959 and at 75 if born 1960 or later. The first one can wait until April 1 of the next year, at the cost of two in one year; a current employer's plan can usually wait until you retire."

42. le:retirement:withdrawals — MED (interaction)
Missing: the years between retirement and RMDs or Social Security are the usual window for Roth conversions. The withdrawal order, the claim age, IRMAA tiers and Marketplace credits are one decision, not three separate steps.
Addition: "The years between retiring and starting Social Security or RMDs are often the lowest-tax years for Roth conversions; decide withdrawals, the Social Security claim age and conversions together, watching Medicare-surcharge and Marketplace thresholds."

43. le:retirement:social-security — LOW
Missing: the earnings test for anyone claiming before full retirement age while still working.
Addition: "Claiming before full retirement age while still working can temporarily withhold benefits under the earnings test."

44. le:retirement:ltc — MED (ordering)
Phrase: "Before 70", placed after "Age 73"
Why: This breaks the chronological rule. The insurability and pricing case for long-term care coverage is strongest in the mid-50s to mid-60s.
Fix: Move it before the Social Security step and relabel it "50s to early 60s"; add "premiums and the chance of being declined both rise with age."

DEATH OF A SPOUSE

45. le:death-of-spouse:pause — HIGH (overgeneralization)
Phrase: "Very few financial deadlines fall in the first weeks."
Why: True for selling assets, but it hides three clocks:
- If the household was on the deceased spouse's employer plan, COBRA (up to 36 months) and its notice rules start now.
- A qualified disclaimer must generally be made within 9 months and before accepting the asset.
- Portability of the deceased spouse's unused estate-tax exemption needs a Form 706, even when no tax is due. This is the item most often missed at this event, and the IRS's simplified relief window is up to 5 years.
Addition: "A few clocks start now: health coverage through the late spouse's employer (COBRA), the 9-month limit for disclaiming an inheritance, and the estate-tax return that preserves the unused exemption for you (portability), which is often worth filing even when no tax is owed."

46. le:death-of-spouse:notify — MED (overgeneralization)
Phrase: "A surviving spouse can receive survivor benefits as early as age 60"
Why: The exception matters most for young widows and widowers. Benefits are available at any age when caring for the deceased's child under 16, and from 50 if disabled. Children under 18 get their own benefits.
Rewrite: "...as early as 60 (50 if disabled, and at any age while caring for the deceased's child under 16), and unmarried children under 18 can receive benefits of their own."

47. le:death-of-spouse:taxes — MED (interaction with the pause step)
Missing:
- The surviving spouse keeps the full joint home-sale exclusion ({{fig:sec121_exclusion_mfj}}) only if the home is sold within two years of the death, so "selling the house can wait" has an expiry.
- Single-filer brackets also hit Medicare IRMAA tiers.
Addition: "A surviving spouse can still exclude up to the joint home-sale amount if the home is sold within two years of the death; single-filer status can also trigger Medicare surcharges, which can be appealed for a death in the family."

48. le:death-of-spouse:claims — LOW
Missing: claiming or re-titling an asset can count as accepting it, which rules out disclaiming it (for example, to a bypass trust or to the children).
Addition: "Decide whether to disclaim any account before claiming or re-titling it."

=== PROTECTION ===

49. pr:emergency-fund vs pr:health — MED (internal consistency)
Phrase: emergency fund "3–6 months of essential expenses"; health "that cap ... is the number your cash reserves should be able to cover."
Why: The two sections give two reserve rules that never meet. For a family on an HDHP, the family out-of-pocket maximum can exceed the starter fund and a large part of 3 months of expenses.
Addition (emergency-fund): "If your health plan has a high deductible or out-of-pocket maximum, make sure the fund, or an HSA balance, can cover it on top of living costs."

50. pr:disability — MED
Phrase: "Group long-term disability commonly replaces about 60% of base salary"
Why: Group plans cap the monthly benefit and usually exclude bonus and commission, so higher earners and variable earners often get well under 60%. Group coverage ends with the job, and the self-employed have none.
Addition: "Group plans usually cap the monthly benefit and ignore bonuses and commissions, and coverage ends when you leave the job; an individual policy fills those gaps."

51. pr:term-life — MED
Phrase: "with no dependents it is rarely needed"; "10–12 times annual income"
Why: Exceptions: co-signed private loans, a business partner, and a spouse who depends on your income even without children. The multiple ignores existing assets and employer group coverage, which is not portable.
Addition: "Subtract savings and existing coverage from the need, and don't rely on employer group life alone, since it usually ends with the job."

52. pr:auto — MED (missing)
Missing: uninsured/underinsured motorist coverage. It protects you from the many drivers carrying only state minimums, and an umbrella usually does not cover it unless added.
Addition: "Carry uninsured/underinsured motorist coverage at the same limits as your liability, since many drivers carry only the state minimum."

53. pr:umbrella — MED
Phrase: "Once net worth or income makes you a lawsuit target, roughly match coverage to net worth."
Why: Risk factors (teen drivers, a pool or trampoline, dogs, rental property, board service) matter as much as net worth. Future wages can be garnished, so a young high earner with little net worth is still exposed.
Addition: "Teen drivers, pools, dogs, rental property and volunteer board seats raise the risk regardless of net worth, and future wages can be collected in a judgment."

54. pr:estate — MED (missing)
Missing: payable-on-death and transfer-on-death registrations on bank and brokerage accounts. These are named in the annual review item but not here. Also missing: power of attorney, healthcare directive and HIPAA authorization for adult children turning 18. Parents lose access then, a classic gap.
Addition: "Payable- or transfer-on-death registrations on bank and brokerage accounts work like beneficiary forms. A child who turns 18 needs their own power of attorney, directive and HIPAA authorization for parents to help in an emergency."

55. pr:identity — MED (missing)
Missing: the IRS Identity Protection PIN, a free protection against tax-return fraud. Planners pair it with the credit freeze.
Addition: "An IRS Identity Protection PIN, free at IRS.gov, stops someone else from filing a tax return in your name; freezes can also be placed for children."

=== ANNUAL REVIEW ===

56. Annual calendar — HIGH (missing items)
The checklist has no tax-filing-season item. Missing: the April tax deadline, prior-year IRA and HSA contributions (allowed until the filing deadline), and quarterly estimated taxes (April, June, September, January) for the self-employed, retirees and windfall recipients.
Addition: a March/April item: "File last year's return; make any prior-year IRA or HSA contribution by the filing deadline; if you pay estimated tax, put the four due dates on the calendar."

57. ar:insurance (month 10) — HIGH for retirees
Missing: the Medicare annual enrollment period (October 15–December 7), the retiree's open enrollment, where Part D and Medicare Advantage plans change every year.
Addition: "On Medicare: compare Part D and Medicare Advantage plans for next year between October 15 and December 7."

58. ar:insurance (month 10) — MED
Phrase: the October item never mentions FSA or HSA, even though ar:limits says "elections are made at open enrollment."
Why: The election belongs in the month where it is actually made.
Addition to the October item: "Set next year's health FSA, dependent-care FSA and HSA payroll amounts."

59. ar:year-end (month 12) — MED (timing)
Phrase: "Before December 31: ... take any required minimum distribution, make ... qualified charitable distributions"
Why: Custodians set early-December cutoffs, and a QCD check must be processed by December 31, so December is late. The item also leaves out:
- the first-year RMD option (April 1),
- inherited-IRA annual RMDs,
- Roth conversions (calendar-year deadline),
- spending down the health FSA (use-it-or-lose-it unless the plan has a grace period),
- most states' Dec 31 deadline for the 529 deduction.
Fix: Start RMDs and QCDs in November. Addition: "Request RMDs, inherited-IRA withdrawals, QCDs and any Roth conversion by early December, since custodians set cutoffs; spend down a health FSA and make any state-deductible 529 contribution by December 31."

60. ar:year-end — LOW
Phrase: "harvest tax losses in taxable accounts if useful"
Why: The wash-sale rule reaches purchases in IRAs and a spouse's accounts. Low-income years may favor harvesting gains at the 0% rate.
Addition: "Avoid buying the same holding in any account, including IRAs and a spouse's, within 30 days; in a low-income year, realizing gains at the 0% rate may beat harvesting losses."

61. ar:rebalance — LOW (overgeneralization; the plain variant too)
Phrase: "use new contributions first to avoid realizing gains"
Why: Selling inside IRAs and 401(k)s creates no tax, so rebalancing there is the usual first move.
Rewrite: "Rebalance inside retirement accounts first, where trades are not taxed, and use new contributions to steer taxable accounts."

62. Annual calendar — LOW
July through September is empty. Natural uses for those months: a mid-year withholding or estimated-tax check, and a Social Security earnings-record check (my Social Security). FAFSA opens October 1 for families with college students.

=== PLAIN-ENGLISH VARIANTS (beyond findings 5 and 61) ===

63. ar:year-end plain — LOW
Phrase: "if you're giving to family"
Why: Narrows the original "if gifting." The annual exclusion applies to gifts to anyone.
Rewrite: "if you're giving money to anyone."

64. pr:identity plain — LOW
Phrase: "telling your bank about money taken without permission"
Why: The original's "electronic transfers" is what the quick-report liability limit covers; checks and other channels have different rules.
Rewrite: "telling your bank quickly about electronic transfers you didn't make limits how much you can lose."

65. le:job-loss:coverage plain — LOW
Phrase: "lets you sign up on the Marketplace within 60 days"
Why: Reads as 60 days after only. The period also opens 60 days before a known loss of coverage, which matters when the layoff date is known in advance.
Rewrite: "within 60 days before or after the coverage ends."

=== OVERALL ===

The batch is accurate on what it says. The statutory skeleton is right, and the plain variants are faithful: the only real plain-English regressions are finding 5 and three LOW wording narrowings. The weak spots are those a practicing planner sees in client files:

- Deadline-driven exceptions are left out: the 401(k) loan offset, the COBRA notice duty after divorce, disclaimers, portability, pension elections and the inherited-IRA transfer.
- Playbooks do not talk to each other, especially COBRA into Medicare, severance into Marketplace credits, windfall income into means-tested benefits, and equity into relocation sourcing.
- Several steps assume the median client: RMDs at 73, retirement at 65, a two-earner household where only the primary earner needs life insurance, and survivor benefits from 60.
- Two playbooks break the intro's own "time-critical first" rule: equity in job loss, and LTC in retirement.
- The annual calendar has no tax-season or Medicare-season anchor, and puts the RMD and QCD work too late in December.

The HIGH items share a pattern: following the text as written leads to an irreversible or penalized outcome. Fixing those first would close most of the practical risk without making the pages longer.

# Phase 4 persona pass — consumer-finance advocate (2026-11-06)

Reviewer: subagent in the consumer-finance-advocate persona (Olen / Aliche tradition), Claude Opus at medium effort, read-only over `src/content/phase4/{life-events,protection,annual-review,plain}.json` as deployed in `main` edb4b3e. Statutory facts were out of scope (CL483–CL528 verified the same day). **Findings are recorded, not applied**; each fix needs the owner's go (V2 plan §4.4).

Totals as reported: 52 findings — 15 HIGH, 29 MED, 8 LOW. The reviewer's text follows verbatim.

---

## JOB LOSS

1. le:job-loss:runway | HIGH | "minimum payments on every debt still come before any other goal" (plain: "keep making the minimum payment on every debt before anything else")
Why: when cash is short, the essentials have to come first: housing, utilities, food, transportation to work, and insurance. They come before unsecured debt minimums. The plain version turns "before any other goal" into "before anything else". A reader in crisis could pay a credit card ahead of rent.
Fix: "If money is tight, cover housing, utilities, food and insurance first. Then make at least the minimum on each debt, and call lenders about hardship plans before you miss a payment. Federal student loans can go to a $0 income-driven payment." The plain version should say the same.

2. le:job-loss:runway | MED | "Divide liquid savings by essential monthly spending to get months of runway."
Why: for a reader with no savings this gives zero and stops there. It also ignores unemployment pay, severance and benefits.
Fix: "Add any unemployment pay and severance to what you have. If the result is under a month, apply now for SNAP, Medicaid and local rent or utility help. These are built for exactly this gap."

3. le:job-loss:runway | MED | "file with the state agency promptly"
Why: people who were fired, or whose hours were cut, often assume they can't qualify and don't file. Gig workers and contractors usually can't get regular unemployment pay, and nothing here tells them so.
Fix: "File even if you were let go for performance or had your hours cut; the state decides eligibility, not your employer. Independent contractors usually are not covered by regular unemployment insurance."

4. le:job-loss:coverage | HIGH | "COBRA, a spouse's plan, or the Marketplace" (Medicaid is missing)
Why: after an income drop, Medicaid or CHIP is often the cheapest option (often $0). You can enroll any time of year. A low-income reader comparing three paid options may never check it.
Fix: add a fourth option: "Medicaid (and CHIP for children), which you can apply for any time of year and which looks at your current monthly income, not last year's."

5. le:job-loss:coverage | MED | omission: choosing COBRA and then dropping it
Why: if you choose COBRA and later drop it to save money, that usually does not open a Marketplace enrollment window outside open enrollment. It is a common and costly trap.
Fix: "Compare before you choose. If you elect COBRA and later stop paying, you generally have to wait for open enrollment to switch to the Marketplace."

6. le:job-loss:old-401k | HIGH | omission: an outstanding 401(k) loan
Why: plan loans are common among lower-income savers. Leaving the job often makes the loan due. If it isn't repaid by the tax-filing deadline, the balance is taxed as a distribution, plus the 10% additional tax if you're under 59½.
Fix: "If you have a 401(k) loan, find out when it must be repaid after you leave. An unpaid balance becomes a taxable distribution."

7. le:job-loss:old-401k | MED | omission: small-balance cash-outs
Why: plans can push out small balances without being asked, and very small ones can arrive as a check. This step tells the reader they have time to decide, which isn't true for them.
Fix: "If your balance is small, the plan may move it to an IRA or send you a check on its own. Watch your mail, and roll a check over within 60 days to avoid the tax."

8. le:job-loss:old-401k | MED | title "do not cash it out by default", plus no warning about rollover sales pitches
Why: (a) for someone with no other money, a withdrawal may be the honest last resort, and the title reads as a ban without saying how to do it least badly. (b) Rollover moments are when commission sellers pitch annuities and high-fee IRAs.
Fix: "If you truly need some of it, take only what you need and leave the rest. Be wary of anyone who is paid to recommend a rollover into an annuity or a high-fee product. Ask how they are paid."

9. le:job-loss:equity | LOW | "read it before it closes"
Why: exercising options costs cash and can trigger tax. A reader might use runway money to beat the deadline.
Fix: "Exercising costs money and can create a tax bill. Don't use your emergency cushion to do it without running the numbers."

## NEW BABY

10. le:new-baby:enroll | MED | "at least 30 days for an employer group plan and 60 days on the Marketplace" (Medicaid/CHIP is missing)
Why: a baby born to a mother on Medicaid is generally covered automatically for the first year, and CHIP covers many children in working families. Neither is mentioned.
Fix: "If you or your baby may qualify for Medicaid or CHIP, apply now; there is no enrollment window. Babies born to a mother on Medicaid are generally covered for their first year."

11. le:new-baby:ssn | MED | "claim the Child Tax Credit (up to {{fig:ctc_per_child}} per child)"
Why: (a) "Up to" hides the fact that families with low earnings may get only part of it as a refund. (b) For these families the Earned Income Tax Credit is often the bigger money, and it isn't mentioned. (c) Adopted children often don't have an SSN yet.
Fix: "Lower-earning families may get only part of this credit back, so also check the Earned Income Tax Credit. For an adopted child without an SSN yet, ask the IRS for an adoption taxpayer ID (Form W-7A)." Also check whether CL494 covers the current rule about parents' SSNs. If it does, say who it excludes.

12. le:new-baby:protection | MED | "10–12 times the primary earner's income"
Why: a parent who stays home or earns less also needs coverage, because replacing their childcare and household work costs real money. The title also promises disability coverage, but the body never talks about it.
Fix: "A parent at home or earning less also needs coverage sized to what replacing their care would cost." Add one sentence on disability, or drop it from the title.

13. le:new-baby:protection | LOW | "write or update a will"
Why: a reader may assume a will means an expensive lawyer and put it off.
Fix: "Many states offer simple will forms, and legal aid groups often help parents name a guardian for free."

14. le:new-baby:childcare | MED | "A dependent-care FSA shelters childcare costs..."
Why: (a) it only exists if your employer offers one, and gig and part-time workers usually can't get it. (b) Money you elect but don't spend is generally lost. For someone whose childcare or hours change, that is real money gone.
Fix: "Only available if your employer offers one. Money you set aside but don't spend is generally lost, so elect only what you are sure to spend."

## MARRIAGE

15. le:marriage:filing | MED | omission: how marriage affects benefits and credits
Why: for lower-income couples, marriage can reduce the EITC, change ACA premium credits, affect SSI and Medicaid eligibility, and raise income-driven student-loan payments if you file jointly. This step only talks about withholding.
Fix: "If either of you gets SSI, Medicaid, Marketplace premium credits, the EITC or an income-driven student-loan payment, check how combining incomes changes each one."

16. le:marriage:align | LOW | "couples who disagree on risk or goals tend to stall on every other step" / "Export the plan as Markdown"
Why: the first is a factual claim with no source (the claims list is empty). "Markdown" is jargon. There is also nothing on keeping some credit and money in your own name, which protects a spouse from financial abuse.
Fix: soften to "can stall"; replace "Markdown" with "a shareable file"; add "Keep at least one account and some credit in your own name."

## DIVORCE

17. le:divorce:counsel | HIGH | "professional counsel is close to mandatory"
Why: this assumes the reader can pay a lawyer. A reader who can't may conclude the advice isn't for them and sign whatever is put in front of them.
Fix: "If a full-service lawyer isn't affordable, look at legal aid, limited-scope ('unbundled') help, mediation, and your court's self-help center."

18. le:divorce:counsel | HIGH | omission: joint debts
Why: a divorce decree doesn't bind lenders. Each of you stays liable on joint cards, loans and mortgages even if the decree assigns them to the other spouse. This is one of the most common ways divorce wrecks someone's credit.
Fix: "A divorce decree doesn't bind your lenders. Close or refinance joint accounts, or you stay liable if your ex stops paying."

19. le:divorce:counsel | MED | omission: safety and financial abuse
Why: in an abusive or controlling marriage, a calm inventory may not be safe. The reader may first need their own account and a credit check.
Fix: "If you are worried about safety or financial control, open an account in your own name, pull your credit reports, and contact a domestic-violence advocate before you start."

20. le:divorce:qdro | MED | "exempt from the 10% additional tax" (plain: "skips the extra 10% tax")
Why: readers may hear "tax-free". Income tax still applies. And the exemption is lost if the alternate payee first rolls the money to an IRA and then withdraws it.
Fix: "It is still taxable income. The 10% exemption applies only to money paid directly from the plan; if you roll it to an IRA first and then withdraw, the 10% can apply."

21. le:divorce:beneficiaries | MED | "Do not rely on state law: file new forms on every account and policy."
Why: many courts bar beneficiary changes while the case is pending, and decrees often require keeping an ex as life-insurance beneficiary to secure child support. Changing the form anyway can put you in contempt of court.
Fix: "First check whether your decree requires you to keep your ex as a beneficiary (common for life insurance that backs child support). Change every other designation."

22. le:divorce:filing | HIGH | "a COBRA qualifying event (up to 36 months for a former spouse)"
Why: COBRA rights after a divorce depend on someone notifying the plan within 60 days. If nobody does, the former spouse can lose COBRA entirely.
Fix: "You or your ex must notify the plan administrator within 60 days of the divorce or legal separation, or COBRA rights can be lost."

23. le:divorce:filing | MED | omission: head of household status and Medicaid
Why: a custodial parent may qualify as head of household, which lowers tax. Medicaid may also fit better than COBRA after the split.
Fix: "A custodial parent may be able to file as head of household. Also check Medicaid before paying for COBRA."

24. le:divorce:rebuild | LOW | "usually means a larger emergency fund target"
Why: someone whose income just shrank hears "save more". The more urgent steps are getting support paid, checking benefits and claiming dependents correctly.
Fix: "Start with what comes in: make sure support orders are paid (your state's child-support agency can enforce them), re-check benefit eligibility on one income, then rebuild the fund."

## HOME PURCHASE

25. le:home-purchase:afford | MED | "Run rent-vs-buy..."
Why: lenders' pre-approval amounts are what they will lend, not what you can afford. First-time buyers rarely hear about free counseling or down-payment help.
Fix: "A pre-approval is the most a lender will lend, not a budget. HUD-approved housing counselors are free and can point you to down-payment assistance. Budget for taxes, insurance, any HOA fees and repairs, not just the mortgage."

26. le:home-purchase:pmi | HIGH | "On a conventional loan... 78%... 80%"
Why: FHA loans are common among first-time and lower-income buyers. Their mortgage insurance often lasts for the life of the loan and doesn't follow these rules, so an FHA borrower may wait for a drop-off that never comes. Automatic removal also requires being current on payments.
Fix: "This applies to conventional loans and requires being current on payments. FHA mortgage insurance follows different rules and often lasts the life of the loan unless you refinance. Your closing papers say which you have."

27. le:home-purchase:umbrella | MED | "Owning a home raises what you can lose... inexpensive per dollar of coverage"
Why: "Cheap per dollar" is a sales line. A new owner with little equity and a modest income often has little to protect (and homestead rules protect some home equity), while the policy still costs a few hundred dollars a year that this reader may not have.
Fix: "If your equity and savings are still small, an umbrella may not be worth it yet. Revisit it as your net worth grows."

## RELOCATION

28. le:relocation:coverage | MED | omission: Medicaid doesn't move with you, and the prior-coverage rule
Why: Medicaid doesn't follow you across state lines, and eligibility differs a lot between states. The Marketplace window for a move generally also requires that you had qualifying coverage before the move.
Fix: "If you're on Medicaid, apply in the new state right away; the rules may differ. The Marketplace move window generally requires that you had qualifying coverage before you moved."

29. le:relocation:insurance | MED | "Check that liability limits still match your assets rather than the new state's minimum"
Why: for a driver with few assets, the coverage that protects *them* is uninsured/underinsured motorist coverage. It isn't mentioned, and higher limits cost money.
Fix: "Also price uninsured/underinsured motorist coverage, which pays you when the other driver can't. Some states have low-cost auto programs for lower-income drivers."

30. le:relocation:estate | LOW | "a review in the new state"
Why: this assumes a paid attorney review.
Fix: "Legal aid or your new state's free statutory forms can cover simple documents."

## WINDFALL

31. le:windfall:park | HIGH | omission: means-tested benefits
Why: a windfall can immediately end eligibility for SSI or Medicaid, and SSI's resource limit is very low. Failing to report it can lead to repayment demands. For lower-income readers this is the most consequential missing fact in the whole module.
Fix: "If you or your household get SSI, Medicaid, SNAP or housing help, report the money and ask before you spend or move it. Tools such as ABLE accounts or special-needs trusts can sometimes preserve eligibility."

32. le:windfall:park | MED | "Planners commonly advise a cooling-off period..."
Why: the people most eager to "help" a new windfall are often commission sellers of annuities, whole life and indexed products. Also, "insured savings" is only insured up to the per-bank limit.
Fix: "Be wary of anyone who wants a decision quickly or is paid by commission; ask how they are paid. Deposit insurance has a per-bank limit, so a large sum may need to be spread across banks or held in Treasury bills."

33. le:windfall:character | MED | "Cash, a brokerage account, an inherited IRA and a house are taxed differently."
Why: the playbook covers windfalls generally, but the tax step covers only inheritances. Lottery winnings, many legal settlements and back pay are taxable income, and too little is often withheld. The reader can be hit with a bill the next April.
Fix: "Non-inherited windfalls (lottery or gambling wins, back pay, many legal settlements) are usually taxable income. Set aside enough for the tax before you spend."

34. le:windfall:sequence | MED | "Pay off high-interest debt, finish the emergency fund..."
Why: (a) "high-interest" is undefined. (b) Paying part of an old debt in collections can restart the statute of limitations in some states. (c) There is no permission to spend a little, so the advice reads as austere.
Fix: "Before paying old collection accounts, check whether the debt is past your state's time limit; a partial payment can restart it. Setting aside a small share to enjoy is reasonable."

35. le:windfall:lump-sum | MED | "investing a lump sum immediately beat spreading it out..."
Why: this only applies to money with a long horizon, after the emergency fund and debts are handled. A reader might invest money they will need soon.
Fix: open with "This applies only to money you won't need for at least five years."

36. le:windfall:gift | MED | omission: how gifts affect benefits
Why: gifts can disqualify relatives who get SSI or Medicaid. Gifts the giver makes within five years before applying for long-term-care Medicaid can delay the giver's own eligibility.
Fix: "If the person you're giving to gets SSI or Medicaid, a gift can cost them benefits. Gifts you make within five years before you need nursing-home Medicaid can delay your own coverage."

37. le:windfall:gift (plain) and ar:year-end (plain) | LOW | "{{fig:gift_annual_exclusion}} per person" ... "{{fig:estate_exemption_individual}} per person"
Why: the canonical text says "per recipient" for the exclusion. The plain version says "per person" for both numbers, even though one is per recipient and the other is per giver.
Fix: plain should read "per person you give to" for the exclusion and "for each giver" for the lifetime exemption.

## RETIRING

38. le:retirement:medicare | HIGH | "Signing up late for Part B without other qualifying coverage brings a lifetime premium penalty"
Why: readers will assume COBRA or retiree coverage counts as "other qualifying coverage". For delaying Part B it generally doesn't, which is a classic way people end up with a lifetime penalty.
Fix: "COBRA and retiree coverage generally do not count. Only coverage from your own or your spouse's current employment lets you delay Part B without a penalty."

39. le:retirement:medicare | MED | omission: Medicare Savings Programs and Extra Help
Why: a reader with low income who sees "premium penalty" and "IRMAA surcharges" may not know there are programs that pay the Part B premium and cut drug costs. Marketplace premium credits also stop once you're eligible for Medicare.
Fix: "If your income and savings are limited, Medicare Savings Programs and Extra Help can pay your Part B premium and lower drug costs. If you have a Marketplace plan, switch at 65; its premium help ends."

40. le:retirement:social-security | MED | "Claiming at 62, full retirement age or 70 is one of the largest decisions"
Why: the only reason given points toward delaying. For readers in poor health, in physically demanding jobs, or who need the money, claiming early can be right. Claiming early while still working runs into the earnings test. The block also cites no claims.
Fix: "Delaying raises the monthly check, but claiming earlier can be the right call if you need the income or don't expect a long retirement. If you claim before full retirement age and keep working, some benefits can be withheld."

41. le:retirement:withdrawals | LOW | "sets your lifetime tax bill" (plain: "shapes the taxes...")
Why: the plain text has drifted, though toward a better hedge. "Sets" overclaims. Many retirees also have only Social Security and one account, so this step doesn't apply to them.
Fix: change the canonical text to "shapes". Add "If Social Security is your main income, this step matters less."

42. le:retirement:rmd | MED | "start at age 73"
Why: for people born in 1960 or later the starting age is higher. Without that, younger readers will plan with the wrong date. (This is a missing scope note, not a dispute with CL051.)
Fix: "73 for most people retiring now; later for people born in 1960 or after. Roth IRAs have no RMDs during the owner's lifetime."

43. le:retirement:ltc | HIGH | "About 70%... will need some long-term care; the decision is between insuring, self-funding, or a hybrid."
Why: this is the insurance industry's frame. The 70% figure includes short stays, and Medicaid, the main real payer of long-term care, is left out. That is also the realistic plan for most low- and moderate-income households. LTC insurance premiums have also historically risen sharply after purchase.
Fix: "Many people need only short-term care, and family often provides much of it. Medicaid pays for most long-term care once savings are spent down; for many households that's the realistic backstop. LTC insurance premiums can rise after you buy."

## DEATH OF A SPOUSE

44. le:death-of-spouse:pause | HIGH | "Very few financial deadlines fall in the first weeks."
Why: if health coverage came through the spouse's job, the survivor faces real clocks (COBRA notice, a 60-day Marketplace window). The step says to "secure cash" but not how.
Fix: "One exception: if your health insurance came through your spouse's job, check COBRA, the Marketplace (60 days) or Medicaid now."

45. le:death-of-spouse:pause or claims | HIGH | omission: the deceased's debts
Why: collectors often contact surviving spouses. In most states, outside community-property states, a survivor isn't personally liable for a spouse's individual debts unless they were joint or co-signed. Grieving survivors often pay anyway.
Fix: "You generally don't owe your spouse's individual debts unless you co-signed or live in a community-property state. Don't pay from your own money until you've checked. The estate handles them."

46. le:death-of-spouse:notify | HIGH | "survivor benefits as early as age 60"
Why: a younger widow or widower caring for a child under 16 can get benefits at any age, and the children can get benefits too. A young parent reads "age 60" and assumes nothing is available. The one-time death payment isn't mentioned either.
Fix: "If you're caring for the deceased's child under 16, or if you are disabled, you may get benefits earlier. Children can also get benefits, and there is a one-time death payment."

47. le:death-of-spouse:claims | MED | "the choice matters if the survivor is under 59½"
Why: it doesn't say which way it matters. A survivor under 59½ who treats the IRA as their own and then withdraws can owe the 10% they would have avoided by keeping it as an inherited IRA.
Fix: "If you're under 59½ and may need the money, keeping it as an inherited IRA lets you withdraw without the 10% additional tax; treating it as your own does not."

48. le:death-of-spouse:taxes | LOW | "the widow's tax trap"
Why: the title is gendered and leans on jargon.
Fix: "Plan for the survivor's tax squeeze".

## PROTECTION

49. pr:health | HIGH | "that cap, not the premium, is the number your cash reserves should be able to cover"
Why: for a low-income reader, an out-of-pocket maximum of several thousand dollars is out of reach, so the advice reads as a standard they will fail. It leaves out three protections: lower out-of-pocket limits on silver plans for lower incomes, nonprofit hospitals' financial assistance, and Medicaid. "Most common route... to unpayable debt" is also a strong claim that CL525 (the out-of-pocket-max figure) may not support, and much medical debt falls on insured people.
Fix: "If that's out of reach, a silver plan with cost-sharing reductions can lower the cap, and nonprofit hospitals must offer financial assistance; ask before paying any big bill." Source the "most common route" claim or soften it to "a common route".

50. pr:disability | MED | "disability is more likely than early death"
Why: this framing usually comes from insurer-funded groups, so it needs a named source. The block also assumes group LTD, which many low-wage and gig workers don't have, and it ignores SSDI and state disability programs.
Fix: name the source. Add: "Many workers have no group coverage. Social Security disability exists but is strict and slow, and some states run short-term disability or paid-leave programs."

51. pr:auto | MED | "Liability well above the state minimum... umbrella carriers usually require higher underlying limits"
Why: the umbrella sentence nudges toward an upsell that most readers don't need. Uninsured motorist coverage, which protects the reader themselves, is left out.
Fix: replace the umbrella sentence with "Uninsured/underinsured motorist coverage pays you when the other driver can't, and is often the better use of a tight budget."

52. pr:umbrella | MED | "roughly match coverage to net worth" / "inexpensive per dollar"
Why: this is industry framing, and net worth is the wrong measure. Retirement plans and some home equity are often protected from lawsuits, and a renter with modest savings rarely needs this.
Fix: "Most renters and households with modest savings don't need one. The question is what a lawsuit could actually reach, which usually excludes employer retirement plans."

## ANNUAL REVIEW

ar:limits | HIGH | "Reset contributions to this year's limits... Raise payroll elections"
Why: the item assumes the reader is maxing out. A reader who can't will feel behind, and the most relevant lower-income item, the Saver's Credit, is missing. HSA eligibility, which requires a high-deductible plan, isn't stated either.
Fix: retitle "Check this year's contribution settings". Add: "You don't need to hit these limits. Make sure you get the full match, and check the Saver's Credit if your income is modest. HSAs need a high-deductible health plan."

ar:net-worth | MED | "The year-over-year change is the only number that measures real progress"
Why: this overclaims and can shame readers with negative net worth (student debt, early career). It also ignores progress such as fewer high-cost debts or months of cushion.
Fix: "The year-over-year change is a useful measure of progress, along with debts paid off and months of cushion built. A negative number early on is common."

ar:insurance | MED | "Most employers hold open enrollment in the fall"
Why: readers without job-based coverage need the Marketplace dates. Like umbrella, the net-worth matching repeats the upsell.
Fix: "If you buy your own coverage, Marketplace open enrollment runs in late fall to January. Pick by mid-December for coverage starting January 1."

ar:year-end | MED | "harvest tax losses... RMD... QCDs... gift exclusion"
Why: every year-end item suits an affluent reader. It leaves out the items that cost lower-income readers money: spending down a health or dependent-care FSA before money is lost, and Marketplace enrollment.
Fix: add "Spend down any health or dependent-care FSA before its deadline, and confirm next year's health coverage."

ar:rebalance | LOW | "avoid realizing gains" (plain: "so you don't have to sell at a gain")
Why: the plain version reads as if selling at a gain is bad in general. It only matters in taxable accounts.
Fix: "In a taxable account, using new money first avoids a tax bill on gains; inside a 401(k) or IRA, selling has no tax cost."

ar:withholding | LOW | "file a new W-4 if the projection is far from zero"
Why: many lower-income households choose a refund on purpose as a form of saving, and the EITC comes as a refund anyway. Owing is the bigger risk.
Fix: "Owing a large amount is the main thing to avoid. A refund is a choice, though the money could otherwise be in your paycheck."

## OTHER LOW ITEMS

pr:property | LOW | "Renters: always — it is cheap"
Why: "Always" and "cheap" are absolutes. The text also doesn't say that a deductible you can't pay defeats the policy.
Fix: "Renters insurance is usually inexpensive and covers liability. Pick a deductible you could actually pay."

pr:estate | MED | "the four estate documents almost every adult should have"
Why: this assumes lawyer fees, so readers put it off.
Fix: "Most states offer free statutory forms for powers of attorney and healthcare directives that don't need a lawyer. Legal aid groups often help with simple wills."

pr:identity | MED | "Freeze your credit at all three bureaus"
Why: the bureaus push paid "locks" and monitoring next to the free freeze. Readers are often steered to pay for something the law gives them for free.
Fix: "Use the free freeze; you don't need a paid credit lock or monitoring subscription for this."

le:new-baby:protection (plain) | LOW | "for a young child"
Why: the canonical text says "minor". "Young" can read as excluding teenagers, who also need a named guardian.
Fix: use "a child under 18".

le:death-of-spouse:notify (plain) | LOW | "it can be worth comparing switching between your own benefit and the survivor benefit later"
Why: the sentence is hard to parse.
Fix: "Later, you may be able to switch between the survivor benefit and your own; compare which pays more and when."

## CLOSING

The canonical text is careful and mostly honest about hedges. It is good on whole life, cash-outs and bank fees. Its blind spot is the audience. It is written for a salaried, insured household with savings, an employer benefits menu and access to professionals. The safety nets that matter most to a low-income or variable-income reader barely appear: Medicaid/CHIP, SNAP, the EITC, the Saver's Credit, Medicare Savings Programs, legal aid and hospital financial assistance. When a step meets someone with no cushion, it tends to repeat the goal ("cover the out-of-pocket max", "hire counsel", "larger fund") instead of saying what to do instead.

The most harmful gaps are the time-limited traps: COBRA notice after divorce, COBRA not counting for Part B, the 401(k) loan offset, the FHA mortgage-insurance assumption, and how a windfall affects benefits. The debt-priority line is the one place where the canonical text and its plain version could actively push a reader into a bad choice.

The plain variants are faithful overall, and I found only a few real drifts (items 1, 37, 41 and the two plain-only LOW items). One structural issue: every proposition is marked "kept" on the strength of a short anchor substring. That check can't catch a strengthened absolute ("before anything else") or a word with two meanings ("per person"), so it should compare hedge words and quantifiers, not just phrases. Tone is mostly free of lecturing. The few absolutes ("only number", "always", "close to mandatory") are where it slips toward judgment.

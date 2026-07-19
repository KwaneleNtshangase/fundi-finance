// ═══════════════════════════════════════════════════════════════════════
// NOTHO - APPLIED DECISION LESSONS  (content-applied.ts)
//
// Purpose: address the "definition ceiling" problem.
// Every lesson here is a real South African financial decision scenario.
// Format per lesson: context → scenario/decision → fill-blank or action-check
// → consequence reveal → "what smart people do" close.
// Each lesson has 5-7 steps and at least 2 questions.
// ═══════════════════════════════════════════════════════════════════════

import type { LessonStep } from "./content";

export type Lesson = { id: string; title: string; steps: LessonStep[] };

// ─────────────────────────────────────────────────────────────────────────────
// 1. INVESTING-BASICS - applied decision
// ─────────────────────────────────────────────────────────────────────────────
export const LESSON_THABO_INVESTMENT: Lesson = {
  id: "lesson-applied-thabo-investment",
  title: "Thabo's R500 Decision",
  steps: [
    {
      type: "info",
      title: "Meet Thabo",
      content:
        "Thabo earns R18 000/month take-home. He has paid off his store cards, has R27 000 in a savings account (3 months of expenses), and has R500 a month he can invest. He is 29 years old and wants to retire at 65. He is asking you for advice.",
    },
    {
      type: "scenario",
      title: "Which vehicle?",
      question:
        "Given Thabo's situation, which investment vehicle fits him best for this R500/month?",
      options: [
        "Fixed deposit at his bank (4.5% interest, access after 12 months)",
        "Bitcoin, he heard it can 10x",
        "A Tax-Free Savings Account (TFSA) investing in a JSE-listed equity ETF",
        "Stokvel with colleagues at work",
      ],
      correct: 2,
      feedback: {
        correct:
          "Thabo already has his emergency fund covered, so he can afford to lock money away for the long term. A TFSA equity ETF gives him JSE market exposure, all growth is tax-free, and he has 36 years of compounding ahead of him. Bitcoin is speculation, not investing. A fixed deposit at 4.5% likely loses to inflation after tax.",
        incorrect:
          "Think about Thabo's full picture: he already has 3 months' emergency fund, 36 years to retirement, and no debt. That situation calls for long-term, tax-efficient growth, not liquidity or speculation.",
      },
    },
    {
      type: "mcq",
      title: "Crunch the numbers",
      question:
        "If Thabo invests R500/month into an equity ETF averaging 11% per year for 36 years, he will accumulate approximately R ___ million. (Choose the closest answer.)",
      options: [
        "R1.2 million",
        "R2.6 million",
        "R4.1 million",
        "R216 000",
      ],
      correct: 1,
      explanation:
        "B: R2.6 million. Using the compound interest formula for regular contributions: FV = 500 × [(1.0092^432 - 1) / 0.0092] ≈ R2.6M. This is why starting early matters enormously, 36 years of compounding turns R500/month into life-changing money.",
      feedback: {
        correct: "Exactly right. Time is Thabo's most powerful asset.",
        incorrect:
          "R2.6 million is the answer. At 11% annual return over 36 years, even R500/month becomes significant through compound growth.",
      },
    },
    {
      type: "scenario",
      title: "The TFSA limit",
      question:
        "Thabo invests R500/month = R6 000/year. His colleague Zanele invests R3 000/month = R36 000/year. Who fills their annual TFSA allowance?",
      options: [
        "Only Thabo, R6 000 is within the annual limit",
        "Only Zanele, she exactly hits the R36 000 annual TFSA limit",
        "Both of them, there is no annual limit",
        "Neither, the limit is R500 000 total per year",
      ],
      correct: 1,
      feedback: {
        correct:
          "Exactly. The annual TFSA contribution limit is R36 000 (lifetime limit R500 000). Zanele maxes it out in one year. Thabo uses only R6 000 of his allowance, he can increase contributions later without penalty as long as he stays within the annual and lifetime limits.",
        incorrect:
          "The TFSA annual limit is R36 000. Zanele's R3 000/month = R36 000/year exactly hits it. Thabo's R500/month = R6 000/year is well within the limit. Exceeding the annual limit triggers a 40% SARS penalty tax.",
      },
    },
    {
      type: "action-check",
      title: "Apply it to yourself",
      challenge:
        "Open your banking app or a budgeting sheet right now. Identify one amount, even R100: that you could redirect to a TFSA this month. Write it down.",
      successMessage:
        "That number is your starting point. The amount matters less than the habit. Thabo started at R500. The habit is the win.",
      skipMessage:
        "No problem, but know that every month you delay costs compounding time you can never recover. Even R50 is a real start.",
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. CREDIT-DEBT - applied decision
// ─────────────────────────────────────────────────────────────────────────────
export const LESSON_PERSONAL_LOAN_TRAP: Lesson = {
  id: "lesson-applied-loan-trap",
  title: "The Real Cost of a Personal Loan",
  steps: [
    {
      type: "info",
      title: "Nomsa needs R10 000",
      content:
        "Nomsa's car needs a R10 000 repair. She has two options:\n\n• Option A: Personal loan from her bank, R10 000 over 24 months at 21% per year (the maximum rate under the National Credit Act for personal loans).\n\n• Option B: Save R500/month for 20 months, do a cheaper temporary fix now for R800 from her emergency fund.\n\nShe earns R14 000/month take-home and has no other debt.",
    },
    {
      type: "mcq",
      title: "Calculate Option A",
      question:
        "A R10 000 loan at 21% per year over 24 months has a monthly repayment of roughly R509. The TOTAL amount Nomsa repays is approximately R ___.",
      options: [
        "R10 000",
        "R12 216",
        "R14 000",
        "R11 450",
      ],
      correct: 1,
      explanation:
        "B: R12 216. She pays R509 × 24 = R12 216 for a R10 000 loan. That R2 216 of interest is the true cost of borrowing. At 21% per year, credit is expensive.",
      feedback: {
        correct:
          "Exactly. R2 216 in interest for one car repair. That is real money.",
        incorrect:
          "The answer is R12 216. Monthly payment × 24 months = total cost. Always calculate the full repayment, not just the monthly amount.",
      },
    },
    {
      type: "scenario",
      title: "Which option should Nomsa choose?",
      question:
        "Given Nomsa's situation, stable income, no other debt, a small emergency fund, what is the smarter choice?",
      options: [
        "Option A: Take the loan immediately, drive a working car now",
        "Option B: Pay R800 for a patch, save R500/month, buy outright in 20 months and keep R2 216",
        "Option C: Put the R10 000 on a credit card with a 24% rate, easier to access",
        "Option D: Buy a new car on a 72-month finance deal, lower monthly payment",
      ],
      correct: 1,
      feedback: {
        correct:
          "That's right. Option B costs R800 now and saves R2 216 in interest. Option D is the worst, 72 months of financing a depreciating asset at high interest is a wealth trap many South Africans fall into.",
        incorrect:
          "Option B is the win. The loan costs R2 216 extra. Saving for 20 months and paying cash means Nomsa keeps that money. Credit cards at 24% would cost even more.",
      },
    },
    {
      type: "true-false",
      statement:
        "Under South Africa's National Credit Act, a lender can charge any interest rate they choose on a personal loan.",
      correct: false,
      feedback: {
        correct:
          "That's false. The NCA sets maximum interest rates. For personal/unsecured loans the cap is repo rate + 21% (currently around 29-30%). Lenders cannot legally exceed this. If a lender is charging more, walk away. It may be illegal.",
        incorrect:
          "False. The National Credit Act caps interest rates on all credit agreements. No lender can legally exceed the statutory maximum. Always check the APR (Annual Percentage Rate) on any loan offer.",
      },
    },
    {
      type: "info",
      title: "The debt spiral to avoid",
      content:
        "The dangerous pattern: borrow for something → minimum repayments feel manageable → add another loan → repayments now 40%+ of income → borrow again to cover month-end shortfall → spiral.\n\nThe rule that breaks the spiral: **never take on new debt while existing debt is above 20% of take-home pay in monthly repayments.** Calculate yours: total monthly debt repayments ÷ take-home pay. If it is above 20%, pay down before adding any new debt.",
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. SALARY-PAYSLIP - applied decision
// ─────────────────────────────────────────────────────────────────────────────
export const LESSON_READ_YOUR_PAYSLIP: Lesson = {
  id: "lesson-applied-read-payslip",
  title: "Decode a Real Payslip",
  steps: [
    {
      type: "info",
      title: "Sipho's payslip",
      content:
        "Sipho earns a gross salary of R25 000/month. His payslip shows:\n\n• Gross salary: R25 000\n• RA contribution (employer): R1 250 (5%)\n• RA contribution (employee): R1 250 (5%)\n• Medical aid (employee): R800\n• PAYE: R3 142\n• UIF: R148.72 (capped at 1% of R14 872 UIF ceiling)\n• SDL (Skills Development Levy): R250: paid by employer only\n\nNet pay = Gross - employee deductions.",
    },
    {
      type: "scenario",
      title: "Calculate Sipho's net pay",
      question:
        "Sipho's employee deductions total R5 340.72 (RA R1 250 + Medical R800 + PAYE R3 142 + UIF R148.72). What is his net (take-home) pay?",
      options: [
        "R22 801.28: he forgot PAYE",
        "R19 409.28, SDL incorrectly included",
        "R19 659.28: employee deductions only",
        "R19 558.00, UIF calculated on full salary",
      ],
      correct: 2,
      feedback: {
        correct:
          "Exactly. R25 000 - R5 340.72 = R19 659.28. And by contributing to his RA, Sipho is reducing his taxable income and saving for retirement simultaneously.",
        incorrect:
          "The answer is R19 659.28. Subtract only employee deductions: RA R1 250 + Medical R800 + PAYE R3 142 + UIF R148.72 = R5 340.72. SDL (R250) is employer-only, never deducted from Sipho's pay.",
      },
    },
    {
      type: "scenario",
      title: "The RA tax benefit",
      question:
        "Without the RA contribution, Sipho's taxable income would be R25 000. With it, his taxable income is R23 750. What does this mean for his PAYE?",
      options: [
        "His PAYE stays the same, RA contributions have no tax effect",
        "His PAYE increases because he is earning less",
        "His PAYE decreases because he is being taxed on a lower amount",
        "He gets a SARS penalty for contributing to an RA",
      ],
      correct: 2,
      feedback: {
        correct:
          "Spot on. RA contributions up to 27.5% of gross income (max R430 000/year) are deductible from taxable income. Lower taxable income = lower PAYE. The government effectively subsidises your retirement savings.",
        incorrect:
          "RA contributions are tax-deductible. By contributing R1 250/month, Sipho's taxable income drops by R1 250, which reduces the PAYE SARS calculates each month. It is a legal way to pay less tax while saving for retirement.",
      },
    },
    {
      type: "true-false",
      statement:
        "UIF contributions are taken from your salary every month and only benefit you if you become unemployed, are on maternity leave, or are unable to work due to illness.",
      correct: true,
      feedback: {
        correct:
          "Yes. UIF (Unemployment Insurance Fund) is a safety net. You cannot cash it out, it only pays out in qualifying events. Both you and your employer contribute 1% each of your salary (capped at the UIF ceiling).",
        incorrect:
          "This is actually true. UIF only pays out when you become unemployed, take maternity leave, or are ill and cannot work. It is mandatory and a vital protection, but it is not a savings account you can access freely.",
      },
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. PROPERTY - applied decision
// ─────────────────────────────────────────────────────────────────────────────
export const LESSON_BUY_OR_RENT: Lesson = {
  id: "lesson-applied-buy-or-rent",
  title: "Should Zanele Buy or Rent?",
  steps: [
    {
      type: "info",
      title: "Zanele's situation",
      content:
        "Zanele earns R35 000/month take-home. She is renting a flat for R9 500/month. A similar property in the same area is selling for R1 350 000. She has R135 000 saved (10% deposit). A 20-year bond at prime minus 1% (currently 10.75%) would cost approximately R13 800/month in bond repayments, plus rates R900, levies R1 200, and home insurance R450. She plans to stay in Cape Town for 3 years then probably move.",
    },
    {
      type: "scenario",
      title: "Run the numbers",
      question:
        "Zanele's monthly cost to own: R13 800 + R900 + R1 200 + R450 = R16 350. Her monthly cost to rent: R9 500. What is the additional monthly cost to own vs rent?",
      options: [
        "R0: owning and renting cost the same",
        "R6 850 more per month to own",
        "R9 500 more per month to own",
        "Renting is always more expensive than owning",
      ],
      correct: 1,
      feedback: {
        correct:
          "Exactly. Owning costs Zanele R6 850 more per month in this scenario, and that does not include maintenance (budget 1% of property value per year = R13 500/year), unexpected repairs, or the opportunity cost of the R135 000 deposit invested elsewhere.",
        incorrect:
          "R16 350 (own) - R9 500 (rent) = R6 850 more per month to own. Property ownership has many hidden costs that make the real cost much higher than just the bond payment.",
      },
    },
    {
      type: "scenario",
      title: "The 3-year question",
      question:
        "Zanele plans to move in 3 years. Buying costs include: transfer duty (~R42 000), attorney fees (~R25 000), and estate agent commission when selling (~R81 000 at 6%). That is ~R148 000 in transaction costs. What does this mean for her decision?",
      options: [
        "Buy anyway, property always goes up",
        "The transaction costs alone wipe out 3 years of potential capital growth, renting is likely smarter given her timeline",
        "The R148 000 is refundable when she sells",
        "She should take a 5-year fixed rate bond to lock in the rate",
      ],
      correct: 1,
      feedback: {
        correct:
          "Exactly. For short stays, transaction costs destroy the 'investment' argument. The property needs to appreciate ~11% just to break even on costs, before factoring in interest paid on the bond. Renting and investing the R135 000 deposit is mathematically stronger for a 3-year horizon.",
        incorrect:
          "The correct answer is B. R148 000 in entry and exit costs over 3 years means the property needs significant appreciation just to break even. Short-term buyers often lose money after costs. The rent vs buy decision depends heavily on how long you plan to stay.",
      },
    },
    {
      type: "mcq",
      title: "Transfer duty threshold",
      question:
        "First-time buyers in South Africa pay zero transfer duty on properties below R ___ (as of the 2025/26 SARS tables).",
      options: [
        "R500 000",
        "R1 000 000",
        "R1 100 000",
        "R2 000 000",
      ],
      correct: 1,
      explanation:
        "B: R1 100 000. Properties purchased at R1 100 000 or below attract zero transfer duty for all buyers. Between R1.1M and R1.512M, duty is 3% on the amount above R1.1M. Zanele's R1.35M property would incur transfer duty on R250 000 at 3% = R7 500, not R42 000 as estimated, the actual amount depends on the exact purchase price.",
      feedback: {
        correct:
          "Correct, R1 100 000 is the transfer duty threshold. Below this, no transfer duty is payable.",
        incorrect:
          "R1 100 000 is the threshold. Properties at or below this price pay zero transfer duty. This is a meaningful benefit for first-time buyers in affordable areas.",
      },
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. TAXES - applied decision
// ─────────────────────────────────────────────────────────────────────────────
export const LESSON_SARS_ASSESSMENT: Lesson = {
  id: "lesson-applied-sars-assessment",
  title: "Is SARS Right? Check Your Assessment",
  steps: [
    {
      type: "info",
      title: "Lerato gets a SARS assessment",
      content:
        "Lerato is a salaried employee earning R320 000/year gross. SARS sends her an auto-assessment stating she owes R4 200. She is confused, her employer deducts PAYE every month. Why would she owe more?\n\nReasons this happens:\n• Her employer used an incorrect tax code\n• She earned extra income (freelance, rental) not captured by her employer\n• She did not claim all her deductions (medical, RA contributions)\n• SARS made a calculation error (yes, it happens)",
    },
    {
      type: "scenario",
      title: "What should Lerato do?",
      question:
        "Lerato has 40 business days to respond to the auto-assessment. She contributed R24 000 to her RA this year which her employer captured, but she also paid R18 000 in medical aid (not all covered by her employer's certificate). What is her best first step?",
      options: [
        "Pay the R4 200 now and query it afterwards",
        "Accept the assessment, as SARS holds the employer certificates",
        "Review the auto-assessment and add her unclaimed medical expenses",
        "Request an extension before opening the assessment",
      ],
      correct: 2,
      feedback: {
        correct:
          "Always review your auto-assessment before accepting it. Section 18 of the Income Tax Act allows medical aid contributions and out-of-pocket medical expenses above the 7.5% threshold to reduce your tax liability. Lerato may actually be due a refund once her full medical deductions are captured.",
        incorrect:
          "The correct step is to review the assessment yourself on eFiling before paying or ignoring it. You have 40 business days to respond. Missing this window means accepting whatever SARS calculated, even if it is wrong.",
      },
    },
    {
      type: "true-false",
      statement:
        "In South Africa, if your only income is a salary and your employer deducts PAYE correctly, you are NOT required to submit a tax return.",
      correct: true,
      feedback: {
        correct:
          "True, most salaried employees are not required to file if their only income is from one employer and PAYE was correctly deducted. However, you MUST file if: you earn more than R500 000/year from one source, you have other income streams (freelance, rental, interest above R23 800), or you want to claim a refund for deductions your employer did not capture.",
        incorrect:
          "This is true. Pure PAYE employees with one employer and no side income are usually auto-assessed by SARS and can accept the outcome without filing. But if you have a RA, medical aid, or other deductions your employer did not capture, filing manually often results in a refund.",
      },
    },
    {
      type: "scenario",
      title: "Capital gains tax",
      question:
        "Lerato also sold some JSE shares this year for R35 000 profit. She had held them for 4 years. What is the SARS treatment of this gain?",
      options: [
        "She pays no tax, shares held over 3 years are tax-free",
        "She pays 18% capital gains tax on the full R35 000",
        "40% of the R35 000 is included in her taxable income (annual exclusion of R50 000 applies first)",
        "She must pay CGT only if she earned above R1.5M total",
      ],
      correct: 2,
      feedback: {
        correct:
          "That's right. South Africa's CGT works by including 40% of the net gain (after the annual R50 000 exclusion) in your taxable income. If Lerato's gain is R35 000, which is below the R50 000 annual exclusion, she pays zero CGT this year. If her gain were R80 000, she would include 40% of R30 000 (above the exclusion) = R12 000 in taxable income.",
        incorrect:
          "CGT in SA uses inclusion rates: 40% of the net capital gain is added to your taxable income. The first R40 000 of gains each year is excluded. Since Lerato's R35 000 gain is below that threshold, she owes no CGT this year.",
      },
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 6. SCAMS-FRAUD - applied decision
// ─────────────────────────────────────────────────────────────────────────────
export const LESSON_WHATSAPP_SCHEME: Lesson = {
  id: "lesson-applied-whatsapp-scheme",
  title: "The WhatsApp 'Investment'",
  steps: [
    {
      type: "info",
      title: "The message arrives",
      content:
        "You receive this WhatsApp message from an old school friend:\n\n'Hey! I have been investing with Wealth Masters SA for 6 months. Every month they pay me 15% returns, I turned R5 000 into R11 340 already! No risk, fully guaranteed. The company is registered in the UAE and our local reps have licences. Minimum R2 000 to start. You can withdraw anytime. DM me 🚀💰'\n\nYour friend seems genuine. She even shows you her 'statement' screenshot.",
    },
    {
      type: "scenario",
      title: "Spot the red flags",
      question:
        "Which combination of phrases in that message are CLASSIC scam signals?",
      options: [
        "'Registered in the UAE' and 'local reps have licences'",
        "'15% monthly returns', 'no risk, fully guaranteed', and 'withdraw anytime'",
        "'Turned R5 000 into R11 340' and 'minimum R2 000'",
        "The fact that it came via WhatsApp",
      ],
      correct: 1,
      feedback: {
        correct:
          "Three red flags: guaranteed returns (illegal to promise in SA), no risk (every real investment carries some risk), and 15% monthly = 180% per year (the JSE averages 10-12% per year). Classic Ponzi pattern: early investors get paid with new investor money, not actual returns.",
        incorrect:
          "Option B has the clearest red flags. '15% monthly returns' = 180%/year (impossibly high). 'No risk, fully guaranteed' is illegal to promise in SA. These three promises together almost perfectly describe a Ponzi scheme. The WhatsApp channel and the friend's involvement are red flags, but not proof of fraud on their own.",
      },
    },
    {
      type: "mcq",
      title: "Verify before you invest",
      question:
        "In South Africa, financial service providers must be licensed by the ___. You can verify any licence on their public register.",
      options: [
        "JSE (Johannesburg Stock Exchange)",
        "FSCA (Financial Sector Conduct Authority)",
        "SARB (South African Reserve Bank)",
        "NCC (National Consumer Commission)",
      ],
      correct: 1,
      explanation:
        "B: the FSCA. Go to fsca.co.za and search the FSP register. If 'Wealth Masters SA' or any entity connected to this scheme is not licensed, stop. Even if they are listed, check what they are licensed FOR, a licence to sell insurance does not authorise them to offer investment products.",
      feedback: {
        correct:
          "Spot on. FSCA.co.za is where you verify. A 30-second check can save your life savings.",
        incorrect:
          "The FSCA (Financial Sector Conduct Authority) licenses and regulates financial service providers in SA. Always verify at fsca.co.za before investing a single rand with any unfamiliar entity.",
      },
    },
    {
      type: "scenario",
      title: "What about your friend?",
      question:
        "Your friend has actually received payments so far. Does that mean the scheme is legitimate?",
      options: [
        "Yes, she received real money, so it must be real",
        "No, Ponzi schemes pay early investors with new investor money to build trust and grow the pool before collapsing",
        "Yes, if it was fraud, SAPS would have shut it down already",
        "Maybe, depends if the company is VAT-registered",
      ],
      correct: 1,
      feedback: {
        correct:
          "Exactly. Ponzi schemes deliberately pay early investors real money. This creates testimonials and social proof. Your friend is being used, unknowingly, as a recruiter. When the flow of new money slows, the scheme collapses and everyone loses everything, including your friend.",
        incorrect:
          "The answer is B. Ponzi schemes use new investor money to pay existing investors. The early payments are real. That's what makes them convincing. But the scheme is guaranteed to collapse when recruitment slows. Your friend's profits are funded by the next victim.",
      },
    },
    {
      type: "action-check",
      title: "Protect someone you know",
      challenge:
        "Think of one person in your life who could be vulnerable to this type of scheme, a parent, sibling, or friend who might be excited by 'guaranteed returns'. Send them this lesson or share the FSCA verification tip with them today.",
      successMessage:
        "You may have just saved someone real money. Financial fraud costs South Africans billions of rands every year, and it spreads through trust networks exactly like this.",
      skipMessage:
        "No pressure. But keep the FSCA check habit: before anyone invests in anything, verify at fsca.co.za. 30 seconds.",
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 7. BUSINESS-FINANCE - applied decision
// ─────────────────────────────────────────────────────────────────────────────
export const LESSON_CASH_FLOW_VS_PROFIT: Lesson = {
  id: "lesson-applied-cashflow-profit",
  title: "Profitable But Broke",
  steps: [
    {
      type: "info",
      title: "Lebo's catering business",
      content:
        "Lebo runs a catering company. Last month her income statement looked great:\n\n• Revenue: R85 000\n• Cost of ingredients & staff: R52 000\n• Gross profit: R33 000\n• Operating expenses: R18 000\n• Net profit: R15 000 ✅\n\nBut she cannot pay her supplier invoice of R22 000 this week. Her bank account has R3 400. She is profitable but broke. How?",
    },
    {
      type: "scenario",
      title: "What went wrong?",
      question:
        "Lebo gave a corporate client R60 000 of catering on 30-day payment terms. The job is done but the client has not paid yet. Her expenses were all paid in cash. What is this cash flow problem called?",
      options: [
        "Insolvency, she cannot pay her debts and should close down",
        "A working capital gap, profitable revenue has been earned but not yet collected as cash",
        "Tax evasion, she reported profit but has no cash to show for it",
        "A budgeting error, she spent too much on ingredients",
      ],
      correct: 1,
      feedback: {
        correct:
          "This is a working capital gap, one of the most common reasons profitable small businesses fail in South Africa. The R60 000 is in her income statement as revenue but not in her bank account yet. Cash flow and profit are completely different things.",
        incorrect:
          "This is a working capital gap. Her business is genuinely profitable, but profit is an accounting concept, not cash in the bank. She has earned the money but has not collected it. Many SA businesses collapse at this point by confusing accounting profit with available cash.",
      },
    },
    {
      type: "mcq",
      title: "The 30-60-90 rule",
      question:
        "Lebo's corporate client has 30-day payment terms. Her supplier wants payment in 7 days. The gap between when she pays suppliers and when she collects from customers is called her ___.",
      options: [
        "Gross margin",
        "Cash conversion cycle",
        "Break-even period",
        "Credit score",
      ],
      correct: 1,
      explanation:
        "B: the cash conversion cycle (CCC). A negative CCC (collecting before you pay) is healthy. A positive CCC (paying before you collect) creates cash flow strain. Lebo's solution options: negotiate 60-day supplier terms, offer clients a 2% discount for 7-day payment, or use invoice discounting (selling the R60 000 receivable to a funder at a small fee).",
      feedback: {
        correct:
          "Exactly, the cash conversion cycle. Managing it is more important to day-to-day survival than the profit margin.",
        incorrect:
          "The cash conversion cycle measures how long cash is tied up between paying for inputs and collecting from customers. For Lebo, it is at least 30 days, which is why she is cash-strapped despite being profitable.",
      },
    },
    {
      type: "scenario",
      title: "Emergency options",
      question:
        "Lebo needs R22 000 by Friday. Her options: (A) short-term business loan at 3% per month, (B) use her personal credit card at 2% per month, (C) call her client and negotiate early payment with a 3% discount, (D) delay paying the supplier and damage the relationship. Which is smartest?",
      options: [
        "A, since business loans are designed for this gap",
        "B, as the card rate is lower than the loan rate",
        "C, since the discount costs less than borrowing",
        "D, because suppliers expect occasional delays",
      ],
      correct: 2,
      feedback: {
        correct:
          "Exactly. A 3% discount on R60 000 costs Lebo R1 800 and solves the crisis immediately with no new debt. The 3% monthly loan would cost roughly R660 for one month, cheaper in cash terms, but takes time to approve. Option C also strengthens the client relationship. Option D is the worst long-term choice, damaged supplier trust leads to lost credit terms permanently.",
        incorrect:
          "Option C is the winner. A 3% discount to collect early costs R1 800 on a R60 000 invoice and requires no bank involvement, no new debt, and no damaged relationships. Managing cash flow through smart collection is a core small business skill.",
      },
    },
    {
      type: "true-false",
      statement:
        "A business that is making a profit can legally be forced to close down if it cannot pay its debts as they fall due.",
      correct: true,
      feedback: {
        correct:
          "True, and this is exactly what the Companies Act section 345 covers. A company can be profitable on paper but commercially insolvent (unable to pay debts as they fall due). Creditors can apply to court to have a profitable company liquidated. Cash flow kills businesses that profit cannot save.",
        incorrect:
          "This is true. Commercial insolvency (unable to pay debts when due) is a legal basis for liquidation even if the company is profitable. Profit on an income statement does not protect you if your bank account is empty when a creditor comes calling.",
      },
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 8. RAND-ECONOMY - applied decision
// ─────────────────────────────────────────────────────────────────────────────
export const LESSON_REPO_RATE_IMPACT: Lesson = {
  id: "lesson-applied-repo-rate-impact",
  title: "The Repo Rate Changed, What Happens to You?",
  steps: [
    {
      type: "info",
      title: "The SARB raises the repo rate by 0.50%",
      content:
        "The South African Reserve Bank (SARB) announces a 50 basis point (0.50%) increase in the repo rate. The new repo rate is 8.25%. Prime rate (what banks charge consumers) = repo + 3.5% = now 11.75%.\n\nThis one decision affects every rand you borrow or save. Let's see exactly how.",
    },
    {
      type: "mcq",
      title: "Impact on a home loan",
      question:
        "Thabo has an outstanding home loan balance of R900 000 on a variable rate bond at prime (11.25% before the hike). After the 0.50% increase his rate becomes 11.75%. His monthly repayment increases by approximately R ___.",
      options: [
        "R9 000",
        "R450",
        "R4 500",
        "R50",
      ],
      correct: 1,
      explanation:
        "B: approximately R450/month. A 0.50% rate increase on R900 000 adds roughly 0.50% × R900 000 / 12 = R375-450/month depending on remaining term. Small percentage, big rand amount. Over 20 years that is R108 000 in extra interest payments, from just ONE rate hike.",
      feedback: {
        correct:
          "Exactly, about R450/month more. And this is why rate hikes affect homeowners so directly. Variable rate bondholders bear all the interest rate risk.",
        incorrect:
          "The answer is approximately R450/month (B). 0.50% × R900 000 / 12 ≈ R375. The exact figure depends on the remaining term and amortisation, but R450 is a reasonable estimate.",
      },
    },
    {
      type: "scenario",
      title: "Who wins from a rate hike?",
      question:
        "The repo rate increase is bad for borrowers. Which group BENEFITS from a higher repo rate?",
      options: [
        "People with variable-rate home loans",
        "People who have taken personal loans at fixed rates",
        "People who keep cash in a money market account or fixed deposit",
        "People buying cars on finance",
      ],
      correct: 2,
      feedback: {
        correct:
          "Higher repo rate → higher prime rate → higher savings rates on money market accounts and fixed deposits. If you have no debt and keep savings in a money market fund, a rate hike makes your cash work harder. This is why SARB rate decisions affect wealth strategy differently depending on whether you are a borrower or a saver.",
        incorrect:
          "Savers win when rates rise. Money market accounts and fixed deposits pay out higher interest when the repo rate increases. Borrowers with variable-rate debt lose. Fixed-rate borrowers are unaffected for the duration of their fixed period.",
      },
    },
    {
      type: "scenario",
      title: "Why does SARB raise rates?",
      question:
        "CPI inflation has risen to 7.2%, above the SARB's 3-6% target band. The SARB raises the repo rate. What is the mechanism linking higher rates to lower inflation?",
      options: [
        "Higher rates print less money, directly reducing prices",
        "Higher rates make borrowing more expensive → people spend less → demand drops → businesses raise prices more slowly",
        "Higher rates strengthen the rand → imports become cheaper → inflation falls",
        "Both B and C are correct",
      ],
      correct: 3,
      feedback: {
        correct:
          "Correct, both mechanisms work simultaneously. Higher rates slow consumer spending AND strengthen the rand (making imports like fuel cheaper). Both effects reduce inflationary pressure. The cost is slower economic growth. This is the SARB's constant balancing act: control inflation without choking growth.",
        incorrect:
          "Both B and C are correct (option D). Rate hikes reduce inflation through two channels: they slow borrowing and spending (demand-pull inflation falls), and they strengthen the rand which makes imported goods cheaper (cost-push inflation falls). The trade-off is slower economic activity.",
      },
    },
    {
      type: "action-check",
      title: "Know your rate exposure",
      challenge:
        "Do you have any variable-rate debt? (Home loan, overdraft, credit card.) If yes: calculate how much your monthly repayment would increase if rates rose 1%. Write the number down.",
      successMessage:
        "That number is your rate-hike sensitivity. Smart borrowers know exactly how much a SARB decision costs them. Now you do too.",
      skipMessage:
        "If you have no variable-rate debt, you are insulated from rate hikes on the borrowing side. Focus instead on maximising your savings returns as rates rise.",
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 9. MONEY-PSYCHOLOGY - applied decision
// ─────────────────────────────────────────────────────────────────────────────
export const LESSON_SUNK_COST_INVESTING: Lesson = {
  id: "lesson-applied-sunk-cost-investing",
  title: "The Share That Won't Stop Falling",
  steps: [
    {
      type: "info",
      title: "You bought a share at R45",
      content:
        "You bought 200 shares in a JSE-listed company at R45 each, a total of R9 000. The share is now trading at R22. Your loss is R4 600 (51%).\n\nA friend says: 'Don't sell now, you will crystallise your loss. Wait for it to recover.'\n\nYour gut says: 'I can't sell at R22, I paid R45. That feels like admitting defeat.'\n\nBoth reactions are driven by psychology, not finance.",
    },
    {
      type: "scenario",
      title: "The sunk cost question",
      question:
        "You now have R4 400 in that shareholding. A separate JSE ETF you researched looks strong, broad market exposure, 0.20% annual fee, long-term returns tracking the FTSE/JSE All Share. What is the financially rational question to ask?",
      options: [
        "'What did I originally pay for this share?', my purchase price determines the right move",
        "'Can I wait until the share recovers to R45 before selling?', I need to get my money back",
        "'Given what I know TODAY, is this the best use of R4 400 or would the ETF serve my goals better?'",
        "'Should I buy more of the fallen share to average down my cost?'",
      ],
      correct: 2,
      feedback: {
        correct:
          "That's right. The R45 original price is a sunk cost. It's gone and cannot be recovered. The only rational question is: given R4 400 today, where does this money work best going forward? What you paid in the past is irrelevant to what happens next. This is hard emotionally, but it's the foundation of sound investing.",
        incorrect:
          "Option C is the rational question. The original R45 price is a sunk cost, irrelevant to the forward-looking decision. Holding a bad investment because you 'need to get your money back' means the company holds your emotions hostage. The question is always: given TODAY's price, is this the best place for this money?",
      },
    },
    {
      type: "true-false",
      statement:
        "Selling a share at a loss and reinvesting in a better opportunity is almost always financially superior to holding the original position waiting for it to recover, assuming the new opportunity has better expected returns.",
      correct: true,
      feedback: {
        correct:
          "True. And there is a bonus: in South Africa, a capital loss can be offset against future capital gains for CGT purposes. Selling the R4 600 loss crystallises it as a usable tax asset. The 'wait for recovery' strategy has a hidden cost, the time and opportunity cost of your money sitting in a declining asset.",
        incorrect:
          "This is true. Selling a loss and moving to a better opportunity is rational, your money is not 'stuck' in the original position waiting for a recovery that may never come. As a bonus, a realised capital loss in SA can offset future capital gains for CGT purposes.",
      },
    },
    {
      type: "scenario",
      title: "Loss aversion at work",
      question:
        "Research shows that investment losses feel twice as painful as equivalent gains feel good. You would need to gain R ___ to feel as good as a R500 loss feels bad. Which answer reflects this finding?",
      options: [
        "R250",
        "R500: losses and gains feel equal",
        "R1 000",
        "R2 000",
      ],
      correct: 2,
      feedback: {
        correct:
          "Correct, you would need to gain roughly R1 000 to feel as good as R500 of losses feels bad. This asymmetry, documented by Kahneman and Tversky, explains why most people make poor investment decisions: they hold losers too long (to avoid the pain of realising a loss) and sell winners too early (to lock in the pleasure of a gain).",
        incorrect:
          "The answer is R1 000 (C). Loss aversion research shows losses feel approximately twice as painful as equivalent gains feel good. A R500 loss requires a R1 000 gain to produce the same emotional intensity. Knowing this bias helps you override it when making financial decisions.",
      },
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 10. EMERGENCY-FUND - applied decision
// ─────────────────────────────────────────────────────────────────────────────
export const LESSON_BUILD_EMERGENCY_FUND: Lesson = {
  id: "lesson-applied-emergency-fund-build",
  title: "Build Your Fund: Month by Month",
  steps: [
    {
      type: "info",
      title: "Why 3 months is not always enough",
      content:
        "The standard advice is 3 months of expenses. But consider:\n\n• If you are self-employed or on a contract: aim for 6 months\n• If you have dependants or a chronic illness: aim for 6 months\n• If you work in a stable government or corporate role: 3 months may suffice\n• If your income is commission-based: 6-9 months\n\nThe fund should cover: rent/bond, food, transport, medical, school fees, utilities. NOT Netflix, restaurants, or gym. Calculate your TRUE monthly survival number.",
    },
    {
      type: "mcq",
      title: "Calculate your target",
      question:
        "Sipho's monthly survival expenses: rent R4 800, food R2 200, transport R1 100, utilities R600, medical aid R900, school fees R1 400 = total R11 000/month.\n\nIf Sipho targets a 4-month emergency fund (he is on a contract), his target is R ___.",
      options: [
        "R11 000",
        "R33 000",
        "R44 000",
        "R55 000",
      ],
      correct: 2,
      explanation:
        "C: R44 000. R11 000 × 4 months = R44 000. This is his target. Every rand above zero in this fund reduces the chance that one emergency wrecks his financial life.",
      feedback: {
        correct:
          "Correct, R44 000 is Sipho's 4-month fund target. A clear target makes saving purposeful.",
        incorrect:
          "R44 000 is the answer. R11 000/month × 4 months. Always calculate your actual survival number, not your full lifestyle expenses, to set the right target.",
      },
    },
    {
      type: "scenario",
      title: "Where to keep it",
      question:
        "Sipho has R44 000 in his emergency fund. Which account is best suited for it?",
      options: [
        "A TFSA invested in an equity ETF, tax-free growth, higher returns",
        "A money market account or 32-day notice account at a bank, easy access with inflation-beating interest",
        "Under his mattress at home, zero fees, no bank involved",
        "Paid off into his home loan bond, saves interest",
      ],
      correct: 1,
      feedback: {
        correct:
          "An emergency fund needs to be liquid (accessible quickly) and stable (not subject to market crashes). A money market account or 32-day notice account pays 7-9% per year currently and is accessible within days. A TFSA equity ETF is the wrong choice, it can fall 30% right when you need the money most. Paying into a bond is smart for other savings, but an emergency fund must be instantly accessible.",
        incorrect:
          "Option B is correct. An emergency fund has two requirements: safety (no market risk) and accessibility (within days, not months). A money market or 32-day notice account meets both. An equity ETF in a TFSA can lose 40% in a crash, exactly when you are most likely to need emergency funds.",
      },
    },
    {
      type: "action-check",
      title: "Start or top up your fund today",
      challenge:
        "Calculate your own monthly survival number (needs only, no wants). Multiply by your target months (3, 4, or 6). Look at your current emergency fund balance. Open your banking app and set up a monthly debit order to a money market or savings account, even R200/month is a start.",
      successMessage:
        "You now have a clear target and a plan. An emergency fund is not exciting. It is the thing that stops one bad month from becoming a five-year financial setback.",
      skipMessage:
        "Come back to this. An emergency fund is the single most important financial foundation, before investing, before extra loan repayments, before anything else.",
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// EXPORT ARRAYS - grouped by course for wiring into mergeContentExtras
// ─────────────────────────────────────────────────────────────────────────────

export const APPLIED_INVESTING_LESSONS: Lesson[] = [LESSON_THABO_INVESTMENT];
export const APPLIED_CREDIT_LESSONS: Lesson[] = [LESSON_PERSONAL_LOAN_TRAP];
export const APPLIED_SALARY_LESSONS: Lesson[] = [LESSON_READ_YOUR_PAYSLIP];
export const APPLIED_PROPERTY_LESSONS: Lesson[] = [LESSON_BUY_OR_RENT];
export const APPLIED_TAX_LESSONS: Lesson[] = [LESSON_SARS_ASSESSMENT];
export const APPLIED_SCAMS_LESSONS: Lesson[] = [LESSON_WHATSAPP_SCHEME];
export const APPLIED_BUSINESS_LESSONS: Lesson[] = [LESSON_CASH_FLOW_VS_PROFIT];
export const APPLIED_RAND_ECONOMY_LESSONS: Lesson[] = [LESSON_REPO_RATE_IMPACT];
export const APPLIED_PSYCHOLOGY_LESSONS: Lesson[] = [LESSON_SUNK_COST_INVESTING];
export const APPLIED_EMERGENCY_LESSONS: Lesson[] = [LESSON_BUILD_EMERGENCY_FUND];

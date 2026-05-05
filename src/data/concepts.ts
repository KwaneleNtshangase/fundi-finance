/**
 * Fundi Finance - Spaced Repetition Concepts
 *
 * Each concept has:
 *  - id: unique slug
 *  - name: display name
 *  - category: grouping label
 *  - reviewCard: a single MCQ used for spaced-repetition reviews
 *  - courses: which course IDs unlock this concept for review
 */

export type ReviewCard = {
  question: string;
  options: [string, string, string, string];
  correct: 0 | 1 | 2 | 3;
  explanation: string;
};

export type Concept = {
  id: string;
  name: string;
  category: string;
  reviewCard: ReviewCard;
  /** Course IDs whose lessons introduce this concept */
  courses: string[];
};

export const CONCEPTS: Concept[] = [
  // ── Money & Economics ────────────────────────────────────────────────────
  {
    id: "inflation",
    name: "Inflation",
    category: "Money & Economics",
    reviewCard: {
      question: "Inflation is 6% per year. You leave R1 000 under your mattress. After one year, what happens to its buying power?",
      options: ["It grows to R1 060", "It stays exactly R1 000", "It can buy roughly R943 worth of goods", "Nothing changes"],
      correct: 2,
      explanation: "Inflation erodes purchasing power. At 6%, R1 000 buys only ~R943 worth of goods a year later - cash loses value when it earns no interest.",
    },
    courses: ["money-basics", "rand-economy"],
  },
  {
    id: "compound-interest",
    name: "Compound Interest",
    category: "Money & Economics",
    reviewCard: {
      question: "You invest R10 000 at 10% per year, compounded annually. After 2 years, how much do you have?",
      options: ["R12 000", "R12 100", "R11 000", "R20 000"],
      correct: 1,
      explanation: "Year 1: R10 000 × 1.10 = R11 000. Year 2: R11 000 × 1.10 = R12 100. You earn interest on your interest - that's compound growth.",
    },
    courses: ["money-basics", "investing-basics"],
  },
  {
    id: "time-value-of-money",
    name: "Time Value of Money",
    category: "Money & Economics",
    reviewCard: {
      question: "Which is worth more - R1 000 today or R1 000 in 5 years?",
      options: [
        "R1 000 in 5 years",
        "They are equal",
        "R1 000 today",
        "It depends on the weather",
      ],
      correct: 2,
      explanation: "R1 000 today is worth more because you can invest it now and it will grow. Inflation also means future money buys less.",
    },
    courses: ["money-basics", "investing-basics", "retirement"],
  },
  {
    id: "exchange-rate",
    name: "The Rand & Exchange Rates",
    category: "Money & Economics",
    reviewCard: {
      question: "When the rand weakens from R18/$ to R20/$, what happens to the price of imported goods in SA?",
      options: [
        "They get cheaper",
        "They stay the same",
        "They get more expensive",
        "Only luxury goods change",
      ],
      correct: 2,
      explanation: "A weaker rand means you need more rands to buy the same dollar amount. Imports (petrol, electronics, food) cost more, pushing inflation higher.",
    },
    courses: ["rand-economy", "why-rand-weakens"],
  },

  // ── Income & Tax ─────────────────────────────────────────────────────────
  {
    id: "gross-vs-net",
    name: "Gross vs Net Pay",
    category: "Income & Tax",
    reviewCard: {
      question: "Your salary is R25 000 gross. After PAYE, UIF, and pension deductions you receive R19 000. What is your net pay?",
      options: ["R25 000", "R6 000", "R19 000", "R31 000"],
      correct: 2,
      explanation: "Net pay (take-home pay) is what lands in your bank account after all deductions. Gross is what you earn before anything is taken out.",
    },
    courses: ["salary-payslip"],
  },
  {
    id: "paye",
    name: "PAYE Tax",
    category: "Income & Tax",
    reviewCard: {
      question: "What does PAYE stand for and who collects it?",
      options: [
        "Pay As You Earn - collected by your employer and paid to SARS",
        "Pay After Year End - you pay it yourself in February",
        "Personal Annual Yearly Expense - kept by your employer",
        "Pension And Year-end Earnings - paid to your retirement fund",
      ],
      correct: 0,
      explanation: "PAYE (Pay As You Earn) is income tax deducted from your salary by your employer every month and sent directly to SARS on your behalf.",
    },
    courses: ["salary-payslip", "taxes"],
  },
  {
    id: "uif",
    name: "UIF (Unemployment Insurance Fund)",
    category: "Income & Tax",
    reviewCard: {
      question: "You are retrenched. Which fund can pay you a portion of your income while you look for work?",
      options: ["SARS", "GEPF", "UIF", "JSE"],
      correct: 2,
      explanation: "UIF (Unemployment Insurance Fund) pays benefits if you lose your job through retrenchment, dismissal, or if your employer shuts down. Both you and your employer contribute 1% each.",
    },
    courses: ["salary-payslip"],
  },
  {
    id: "tax-brackets",
    name: "SARS Tax Brackets",
    category: "Income & Tax",
    reviewCard: {
      question: "SA uses a progressive tax system. What does 'progressive' mean?",
      options: [
        "Everyone pays the same flat percentage",
        "Higher income earners pay a higher percentage on each additional rand earned",
        "Only people over 40 pay tax",
        "Tax increases automatically every January",
      ],
      correct: 1,
      explanation: "In SA's progressive system, each rand you earn above a threshold is taxed at a higher rate. You only pay the higher rate on income in that bracket, not on all your income.",
    },
    courses: ["taxes", "salary-payslip"],
  },

  // ── Banking ───────────────────────────────────────────────────────────────
  {
    id: "bank-account-types",
    name: "Bank Account Types",
    category: "Banking",
    reviewCard: {
      question: "Which account type typically earns the highest interest on your balance?",
      options: ["Cheque/current account", "Credit card account", "Money market / savings account", "Transmission account"],
      correct: 2,
      explanation: "Savings and money market accounts earn interest on your balance. Cheque accounts focus on transactions. Always move idle cash to an account that earns interest.",
    },
    courses: ["banking-debit"],
  },
  {
    id: "interest-rates",
    name: "Interest Rates (Repo Rate)",
    category: "Banking",
    reviewCard: {
      question: "When the SARB raises the repo rate, what typically happens to your home loan repayment?",
      options: ["It goes down", "It stays the same", "It goes up", "It disappears"],
      correct: 2,
      explanation: "Banks pass repo rate increases on to variable-rate loans. A higher repo rate = higher prime lending rate = higher bond repayments. It also means savings accounts earn more.",
    },
    courses: ["banking-debit", "credit-debt"],
  },

  // ── Debt & Credit ─────────────────────────────────────────────────────────
  {
    id: "credit-score",
    name: "Credit Score",
    category: "Debt & Credit",
    reviewCard: {
      question: "Which behaviour HURTS your credit score the most?",
      options: [
        "Paying your account on time every month",
        "Missing payments or paying late consistently",
        "Closing an old account you no longer use",
        "Applying for a store card once",
      ],
      correct: 1,
      explanation: "Payment history is the biggest factor in your credit score. Missing payments signals to lenders that you are a high-risk borrower, lowering your score significantly.",
    },
    courses: ["credit-debt"],
  },
  {
    id: "cost-of-debt",
    name: "The Real Cost of Debt",
    category: "Debt & Credit",
    reviewCard: {
      question: "You borrow R10 000 on a credit card at 22% interest and only pay the minimum each month. What happens?",
      options: [
        "You pay it off quickly with small fees",
        "You could end up paying back R20 000 or more over many years",
        "The interest rate drops as you pay",
        "The bank waives interest after 6 months",
      ],
      correct: 1,
      explanation: "At 22% interest, only paying the minimum means most of your payment covers interest, not capital. A R10 000 debt can cost double over 5+ years. Always pay more than the minimum.",
    },
    courses: ["credit-debt"],
  },
  {
    id: "good-debt-vs-bad-debt",
    name: "Good Debt vs Bad Debt",
    category: "Debt & Credit",
    reviewCard: {
      question: "Which is the best example of 'good debt'?",
      options: [
        "A clothing account for new shoes",
        "A payday loan to cover groceries",
        "A student loan for a qualification that increases your earning potential",
        "Buying a TV on a 24-month plan at 24% interest",
      ],
      correct: 2,
      explanation: "Good debt builds future wealth or increases your income. A qualification, a home bond, or a business loan can be good debt. Consumer debt (clothing accounts, payday loans) is almost always bad debt.",
    },
    courses: ["credit-debt", "debt-scripture"],
  },

  // ── Savings & Emergency Fund ───────────────────────────────────────────────
  {
    id: "emergency-fund",
    name: "Emergency Fund",
    category: "Savings",
    reviewCard: {
      question: "Financial experts recommend your emergency fund should cover how many months of expenses?",
      options: ["1 week", "1 month", "3 to 6 months", "2 years"],
      correct: 2,
      explanation: "3–6 months of living expenses gives you a buffer for job loss, medical emergencies, or car repairs without going into debt. Keep it in an accessible, interest-bearing account.",
    },
    courses: ["emergency-fund"],
  },
  {
    id: "tfsa",
    name: "Tax-Free Savings Account (TFSA)",
    category: "Savings",
    reviewCard: {
      question: "What is the key advantage of a TFSA in South Africa?",
      options: [
        "Your employer contributes to it",
        "Interest, dividends, and capital gains earned inside it are tax-free",
        "It earns a guaranteed 15% return",
        "You can withdraw it tax-free only after age 65",
      ],
      correct: 1,
      explanation: "With a TFSA, all growth (interest, dividends, capital gains) inside the account is 100% tax-free. The annual contribution limit is R36 000 and lifetime limit is R500 000 (as of 2024).",
    },
    courses: ["sa-investing", "investing-basics"],
  },
  {
    id: "saving-vs-investing",
    name: "Saving vs Investing",
    category: "Savings",
    reviewCard: {
      question: "You have R5 000 you won't need for 15 years. What is usually the better choice?",
      options: [
        "Keep it in a standard savings account",
        "Invest it in a diversified portfolio",
        "Spend it now because inflation will erode it",
        "Keep it as cash at home",
      ],
      correct: 1,
      explanation: "For money you won't need for 5+ years, investing typically beats saving. A savings account might earn 7–9%, but a diversified portfolio has historically returned more over the long term. Short-term money should be saved; long-term money should be invested.",
    },
    courses: ["investing-basics", "emergency-fund"],
  },

  // ── Investing ────────────────────────────────────────────────────────────
  {
    id: "diversification",
    name: "Diversification",
    category: "Investing",
    reviewCard: {
      question: "Why is it important to diversify your investments?",
      options: [
        "It guarantees higher returns",
        "It eliminates all investment risk",
        "It spreads risk so one bad investment doesn't wipe you out",
        "It is required by SARS",
      ],
      correct: 2,
      explanation: "Diversification means spreading money across different assets (shares, bonds, property, cash). If one investment drops, others may hold steady or rise, reducing your overall loss.",
    },
    courses: ["investing-basics", "sa-investing"],
  },
  {
    id: "jse-basics",
    name: "The JSE",
    category: "Investing",
    reviewCard: {
      question: "What happens when you buy a share on the JSE?",
      options: [
        "You lend money to a company",
        "You become a part-owner of that company",
        "You are guaranteed a fixed return",
        "You open a savings account with that company",
      ],
      correct: 1,
      explanation: "Buying shares makes you a part-owner (shareholder) of the company. You can earn through dividends (profit sharing) and capital growth (share price increasing). The JSE (Johannesburg Stock Exchange) is where SA shares are traded.",
    },
    courses: ["sa-investing", "investing-basics"],
  },
  {
    id: "etf",
    name: "ETFs (Exchange-Traded Funds)",
    category: "Investing",
    reviewCard: {
      question: "What is an ETF and why is it good for beginner investors?",
      options: [
        "A single company share - high risk, high reward",
        "A basket of many shares that tracks an index, offering instant diversification at low cost",
        "A bank savings product guaranteed by government",
        "A loan product for investing in property",
      ],
      correct: 1,
      explanation: "An ETF tracks an index (e.g. Top 40 JSE companies) and holds many shares at once. Buying one ETF instantly diversifies your portfolio at very low fees - ideal for beginners.",
    },
    courses: ["sa-investing", "investing-basics"],
  },
  {
    id: "risk-vs-return",
    name: "Risk vs Return",
    category: "Investing",
    reviewCard: {
      question: "An investment promises a guaranteed 40% return per year with zero risk. What should you think?",
      options: [
        "Invest immediately - this is a great opportunity",
        "Ask your bank for the same deal",
        "This is almost certainly a scam - high return always comes with high risk",
        "It must be a government bond",
      ],
      correct: 2,
      explanation: "A core investing principle: higher potential returns always come with higher risk. Guaranteed high returns are a red flag for scams (Ponzi schemes). If it sounds too good to be true, it is.",
    },
    courses: ["investing-basics", "scams-fraud"],
  },

  // ── Retirement ────────────────────────────────────────────────────────────
  {
    id: "retirement-early-start",
    name: "Start Saving for Retirement Early",
    category: "Retirement",
    reviewCard: {
      question: "Themba starts saving R1 000/month at age 25. Sipho starts at age 35. Who has more at retirement (age 65)?",
      options: [
        "Sipho, because he earns more by then",
        "They end up with the same amount",
        "Themba, by a huge margin - compound interest rewards starting early",
        "It depends entirely on the market",
      ],
      correct: 2,
      explanation: "Compound interest means Themba's 10 extra years of growth are enormously powerful. Starting at 25 vs 35 can mean retiring with 2–3× more money, even with the same monthly contribution.",
    },
    courses: ["retirement", "investing-basics"],
  },
  {
    id: "two-pot-system",
    name: "SA Two-Pot Retirement System",
    category: "Retirement",
    reviewCard: {
      question: "Under SA's Two-Pot system (from 2024), which pot can you access once per year before retirement?",
      options: [
        "The Retirement Pot (2/3 of contributions)",
        "Neither pot - all funds are locked until retirement",
        "The Savings Pot (1/3 of contributions)",
        "Both pots equally",
      ],
      correct: 2,
      explanation: "The Savings Pot (1/3 of contributions) can be accessed once per year for emergencies - taxed as income. The Retirement Pot (2/3) stays locked until retirement. This prevents raiding your entire pension while still allowing emergency access.",
    },
    courses: ["two-pot-basics", "retirement"],
  },
  {
    id: "ra-basics",
    name: "Retirement Annuity (RA)",
    category: "Retirement",
    reviewCard: {
      question: "What is the main tax benefit of contributing to a Retirement Annuity (RA)?",
      options: [
        "Your contributions are exempt from VAT",
        "Contributions up to 27.5% of income are tax-deductible (reducing your tax bill now)",
        "All returns inside an RA are taxed at 0%",
        "There is no tax benefit - RAs are purely for safety",
      ],
      correct: 1,
      explanation: "SARS allows you to deduct RA contributions (up to 27.5% of taxable income, max R350k/year) from your taxable income. This reduces your tax bill now while building your retirement nest egg.",
    },
    courses: ["retirement", "sa-investing"],
  },

  // ── Insurance ─────────────────────────────────────────────────────────────
  {
    id: "insurance-basics",
    name: "Why Insurance Matters",
    category: "Insurance",
    reviewCard: {
      question: "What is the core purpose of insurance?",
      options: [
        "To make money for the insurer",
        "To transfer financial risk from you to the insurer in exchange for a premium",
        "To guarantee you never have accidents",
        "To replace your savings account",
      ],
      correct: 1,
      explanation: "Insurance transfers risk. You pay a small regular premium so that if a large financial loss occurs (car accident, illness, death), the insurer covers the cost. Without it, one event can wipe out years of savings.",
    },
    courses: ["insurance"],
  },
  {
    id: "life-insurance",
    name: "Life Insurance",
    category: "Insurance",
    reviewCard: {
      question: "Who needs life insurance the MOST?",
      options: [
        "Single person with no dependants and no debt",
        "A person with a spouse, children, and a home loan who are financially dependent on their income",
        "A retiree with no debt",
        "A student with no income",
      ],
      correct: 1,
      explanation: "Life insurance matters most when other people depend on your income. If you die, your life cover pays out so your family can cover the bond, school fees, and living costs. Those with no dependants have little need for it.",
    },
    courses: ["insurance"],
  },

  // ── Financial Behaviour ───────────────────────────────────────────────────
  {
    id: "budgeting-50-30-20",
    name: "The 50/30/20 Budget",
    category: "Budgeting",
    reviewCard: {
      question: "In the 50/30/20 budget rule, what does the 20% represent?",
      options: [
        "Entertainment and eating out",
        "Housing and transport (needs)",
        "Savings, investments, and debt repayment",
        "Groceries and clothing",
      ],
      correct: 2,
      explanation: "50% covers needs (rent, food, transport), 30% covers wants (entertainment, eating out), and 20% goes to savings, investing, and paying off debt. Adjust the percentages to your situation - the key is intentionality.",
    },
    courses: ["money-basics", "emergency-fund"],
  },
  {
    id: "impulse-buying",
    name: "Impulse Buying",
    category: "Budgeting",
    reviewCard: {
      question: "Which is the most effective strategy to avoid impulse purchases?",
      options: [
        "Never go to the shops",
        "Wait 24–48 hours before buying anything not on your list",
        "Only use cash (never a card)",
        "Set a R50 spending limit on everything",
      ],
      correct: 1,
      explanation: "The 24–48 hour rule breaks the emotional trigger of impulse buying. Most impulse urges fade within a day. If you still want it 48 hours later, it was probably a considered decision.",
    },
    courses: ["money-basics", "money-psychology"],
  },
  {
    id: "stokvel",
    name: "Stokvels",
    category: "Budgeting",
    reviewCard: {
      question: "What is a stokvel?",
      options: [
        "A type of JSE-listed share",
        "A community savings club where members contribute regularly and take turns receiving a lump sum",
        "A government savings product",
        "A type of bank account for groups",
      ],
      correct: 1,
      explanation: "A stokvel is a traditional SA rotating savings club. Members contribute a fixed amount each month, and each member receives the full pot in rotation. It builds saving discipline and community trust.",
    },
    courses: ["money-basics", "banking-debit"],
  },
  {
    id: "scam-red-flags",
    name: "Spotting Financial Scams",
    category: "Financial Safety",
    reviewCard: {
      question: "Which is a classic warning sign of a financial scam?",
      options: [
        "A product registered and licensed by the FSCA",
        "A bank with physical branches",
        "Guaranteed high returns with no risk and pressure to invest immediately",
        "Investing in an index-tracking ETF",
      ],
      correct: 2,
      explanation: "Scams always promise guaranteed high returns with zero risk and create urgency ('invest NOW or miss out'). Real investments involve risk. Always check if a product is FSCA-licensed before investing.",
    },
    courses: ["scams-fraud", "investing-basics"],
  },

  // ── Property ─────────────────────────────────────────────────────────────
  {
    id: "bond-vs-rent",
    name: "Bond vs Renting",
    category: "Property",
    reviewCard: {
      question: "You can buy a R1.2M home with a R12 000/month bond or rent the same home for R9 500/month. What hidden costs make buying MORE expensive than the bond repayment alone?",
      options: [
        "There are no hidden costs — bond and rent are the only costs",
        "Only transfer duties apply once",
        "Rates, levies, maintenance, transfer duties, and bond initiation fees all add to the true cost of buying",
        "VAT on the purchase price",
      ],
      correct: 2,
      explanation: "Buying a home costs more than just the bond. Add: rates & taxes (~R800–R2 000/month), levy (R1 000+), maintenance, transfer duties (2–8% of purchase price), and bond initiation fees (~R6 500). These can add R3 000–R5 000/month on top of the bond repayment.",
    },
    courses: ["property"],
  },
  {
    id: "transfer-duty",
    name: "Transfer Duty",
    category: "Property",
    reviewCard: {
      question: "You buy a property for R1 500 000. Transfer duty in SA is 0% on the first R1 100 000. What is the tax on the remaining R400 000 at 3%?",
      options: ["R45 000", "R12 000", "R30 000", "R0 — first-time buyers are exempt"],
      correct: 1,
      explanation: "Transfer duty = R400 000 × 3% = R12 000. The first R1 100 000 is exempt. Rates rise to 6% above R1.5M, 8% above R2.25M, and 11% above R10M. This is a one-time government tax on property purchases (not VAT-registered sales).",
    },
    courses: ["property"],
  },
  {
    id: "ltv-ratio",
    name: "Loan-to-Value (LTV) Ratio",
    category: "Property",
    reviewCard: {
      question: "A property costs R1 000 000. The bank lends R900 000. What is the LTV ratio, and what does a lower LTV mean for you?",
      options: [
        "LTV = 90%; lower LTV means higher monthly repayments",
        "LTV = 90%; lower LTV means less risk for the bank → better interest rate for you",
        "LTV = 10%; the bank only cares about the deposit",
        "LTV = 100% whenever the bank approves the loan",
      ],
      correct: 1,
      explanation: "LTV = loan ÷ property value = 90%. The lower your LTV (bigger deposit), the less risk for the bank — they reward this with a lower interest rate. A 90% LTV vs 80% LTV can mean 0.5–1% difference in your rate, saving thousands over 20 years.",
    },
    courses: ["property"],
  },

  // ── Capital Gains & Provisional Tax ──────────────────────────────────────
  {
    id: "capital-gains-tax",
    name: "Capital Gains Tax (CGT)",
    category: "Income & Tax",
    reviewCard: {
      question: "You sell shares for R200 000 that you bought for R120 000. After the R40 000 annual exclusion, how much of your gain is included in taxable income?",
      options: ["R80 000", "R40 000", "R28 000 (40% inclusion of R40 000)", "R200 000"],
      correct: 2,
      explanation: "Gain = R80 000. Less annual exclusion R40 000 = R40 000 taxable gain. Only 40% of that is included in your income: R40 000 × 40% = R16 000 added to taxable income (taxed at your marginal rate). Your primary residence has a R2M exclusion.",
    },
    courses: ["taxes", "sa-investing"],
  },
  {
    id: "provisional-tax",
    name: "Provisional Tax",
    category: "Income & Tax",
    reviewCard: {
      question: "Who is required to pay provisional tax in South Africa?",
      options: [
        "Only employees earning more than R1M per year",
        "Everyone — it replaces PAYE for all taxpayers",
        "People who earn income other than a salary (freelancers, rental income, investment income above R30 000)",
        "Only registered companies",
      ],
      correct: 2,
      explanation: "Provisional tax applies to anyone earning income not subject to PAYE — freelancers, landlords, business owners, and investors with investment income over R30 000. You pay two estimates (August and February) plus a top-up if needed, spreading the tax burden across the year.",
    },
    courses: ["taxes"],
  },
  {
    id: "ra-tax-deduction",
    name: "RA Tax Deduction",
    category: "Income & Tax",
    reviewCard: {
      question: "Nomsa earns R480 000/year and contributes R60 000 to her RA. What is the maximum RA deduction SARS allows?",
      options: [
        "R60 000 (actual contribution)",
        "R132 000 (27.5% of R480 000)",
        "R350 000 (annual cap)",
        "R96 000 (20% of income)",
      ],
      correct: 1,
      explanation: "SARS allows 27.5% of the HIGHER of taxable income or remuneration, capped at R350 000/year. For Nomsa: 27.5% × R480 000 = R132 000. Her actual contribution of R60 000 is below this limit, so she deducts the full R60 000 — saving her ~R24 000 in tax at a 40% marginal rate.",
    },
    courses: ["taxes", "retirement", "sa-investing"],
  },

  // ── Business Finance ──────────────────────────────────────────────────────
  {
    id: "cash-flow-vs-profit",
    name: "Cash Flow vs Profit",
    category: "Business Finance",
    reviewCard: {
      question: "Your business made R80 000 profit this month but has R0 in the bank account. How is this possible?",
      options: [
        "It's impossible — profit always equals cash",
        "You recorded sales but customers haven't paid yet (debtors), while you've already paid your suppliers",
        "SARS took all the profit in VAT",
        "The accountant made an error",
      ],
      correct: 1,
      explanation: "Profit is accounting income (revenue minus costs). Cash flow is actual money in your bank. A business can be profitable but cash-poor when customers pay late (long debtor days) while you pay suppliers upfront. Many profitable businesses go insolvent because of cash flow problems.",
    },
    courses: ["business-finance"],
  },
  {
    id: "break-even",
    name: "Break-Even Point",
    category: "Business Finance",
    reviewCard: {
      question: "Your product sells for R200. Variable cost per unit is R80. Fixed costs are R36 000/month. How many units must you sell to break even?",
      options: ["180 units", "300 units", "450 units", "200 units"],
      correct: 1,
      explanation: "Contribution margin = R200 − R80 = R120 per unit. Break-even = Fixed costs ÷ Contribution margin = R36 000 ÷ R120 = 300 units. Below 300 units you make a loss; above 300 every unit generates pure profit (after covering variable costs).",
    },
    courses: ["business-finance"],
  },
  {
    id: "vat-threshold",
    name: "VAT Registration Threshold",
    category: "Business Finance",
    reviewCard: {
      question: "At what annual turnover must a South African business register for VAT?",
      options: ["R500 000", "R1 000 000", "R5 000 000", "Any business that sells products"],
      correct: 1,
      explanation: "SARS requires VAT registration once your annual taxable supplies exceed R1 000 000. Voluntary registration is possible from R50 000. Registered businesses charge 15% VAT on sales and can claim VAT back on business purchases — keeping the records straight is critical.",
    },
    courses: ["business-finance", "taxes"],
  },

  // ── Money Psychology ──────────────────────────────────────────────────────
  {
    id: "sunk-cost-fallacy",
    name: "Sunk Cost Fallacy",
    category: "Financial Behaviour",
    reviewCard: {
      question: "You paid R15 000 for a course that turns out to be useless. You've completed 30%. Should the R15 000 already spent influence your decision to continue?",
      options: [
        "Yes — you must finish to get value from your R15 000",
        "No — the R15 000 is gone regardless; your decision should be based on future value, not past spend",
        "Yes — quitting means admitting a mistake",
        "No — but only if you can get a refund",
      ],
      correct: 1,
      explanation: "The sunk cost fallacy is continuing with a bad decision to justify past spending. The R15 000 is gone whether you finish or not. Rational decisions focus on future costs and benefits only. Cutting losses early is often the smarter move.",
    },
    courses: ["money-psychology"],
  },
  {
    id: "anchoring-bias",
    name: "Anchoring Bias",
    category: "Financial Behaviour",
    reviewCard: {
      question: "A shop marks a jacket 'WAS R3 000, NOW R1 500'. You weren't planning to buy a jacket. What cognitive bias makes R1 500 feel like a bargain?",
      options: [
        "Loss aversion — you fear missing the sale",
        "Anchoring — your brain anchors to the R3 000 'original' price as the reference point",
        "Confirmation bias — you believe jackets cost R3 000",
        "Herding — everyone else is buying jackets",
      ],
      correct: 1,
      explanation: "Anchoring happens when an initial number (the 'anchor') distorts your judgement of value. The R3 000 price — whether real or fabricated — makes R1 500 feel like a steal, even if the jacket's true market value is R900. Retailers deliberately use this tactic.",
    },
    courses: ["money-psychology"],
  },

  // ── Rand & Economy ────────────────────────────────────────────────────────
  {
    id: "repo-rate-effect",
    name: "Repo Rate & Consumer Impact",
    category: "Money & Economics",
    reviewCard: {
      question: "The SARB raises the repo rate by 0.5%. You have a R900 000 variable-rate home loan. Approximately how much more will you pay per month?",
      options: ["About R50 more", "About R375 more", "About R1 000 more", "Nothing — fixed rates aren't affected"],
      correct: 1,
      explanation: "A 0.5% (50 basis points) increase on R900 000 over 20 years adds roughly R375/month. The prime rate rises by the same 0.5%, and your variable-rate bond tracks prime. Fixed-rate loans are unaffected until they reprice. Higher rates also mean savings accounts earn more.",
    },
    courses: ["rand-economy", "banking-debit"],
  },
  {
    id: "inflation-types",
    name: "Demand-Pull vs Cost-Push Inflation",
    category: "Money & Economics",
    reviewCard: {
      question: "Fuel prices spike 30% due to global oil supply cuts. SA inflation rises. What type of inflation is this?",
      options: [
        "Demand-pull inflation — consumers are buying too much",
        "Cost-push inflation — production costs rise and are passed to consumers",
        "Hyperinflation — caused by money printing",
        "Core inflation — excludes food and energy",
      ],
      correct: 1,
      explanation: "Cost-push inflation occurs when production costs rise (oil, wages, imports) and businesses pass those costs to consumers. Demand-pull inflation comes from too much money chasing too few goods. SA frequently experiences cost-push inflation from rand weakness and global commodity prices.",
    },
    courses: ["rand-economy"],
  },

  // ── Bible & Money ─────────────────────────────────────────────────────────
  {
    id: "contentment-biblical",
    name: "Contentment vs Greed",
    category: "Biblical Finance",
    reviewCard: {
      question: "Proverbs 28:20 says 'a faithful man will be richly blessed, but one eager to get rich will not go unpunished.' What financial principle does this echo?",
      options: [
        "Never invest — all wealth is sinful",
        "Get-rich-quick schemes and greed carry serious risk; patient, faithful stewardship builds lasting wealth",
        "Only tithe once a year",
        "Avoid all debt including a home loan",
      ],
      correct: 1,
      explanation: "The Bible consistently warns against the love of money and shortcuts to wealth. Financially this maps to avoiding Ponzi schemes, gambling, and high-risk speculation. Patient, consistent saving and investing aligns with the biblical principle of diligent, faithful stewardship.",
    },
    courses: ["bible-money"],
  },
  {
    id: "debt-biblical-view",
    name: "Debt in Biblical Finance",
    category: "Biblical Finance",
    reviewCard: {
      question: "Romans 13:8 says 'Owe no one anything except to love each other.' What does a Biblical approach to debt emphasise?",
      options: [
        "Never borrow money under any circumstances",
        "Pay your debts faithfully, avoid unnecessary debt, and work toward financial freedom",
        "Only debt owed to family is acceptable",
        "Declare insolvency if debt becomes unmanageable",
      ],
      correct: 1,
      explanation: "The Biblical view doesn't categorically ban all debt but strongly emphasises: paying what you owe, being cautious about taking on debt, and the freedom and peace that comes from being debt-free. Many financial coaches use this principle to motivate aggressive debt repayment.",
    },
    courses: ["bible-money"],
  },

  // ── Crypto ────────────────────────────────────────────────────────────────
  {
    id: "crypto-basics",
    name: "Cryptocurrency Basics",
    category: "Investing",
    reviewCard: {
      question: "What makes cryptocurrency fundamentally different from the rand?",
      options: [
        "Crypto earns guaranteed interest",
        "Crypto is decentralised - no government or central bank controls it",
        "Crypto is backed by gold",
        "Crypto is only used in South Africa",
      ],
      correct: 1,
      explanation: "Crypto runs on decentralised blockchain networks with no central authority. This means no government can print more of it, but also means there is no safety net - prices can fall 80%+ in a matter of months.",
    },
    courses: ["crypto-basics", "what-is-crypto"],
  },
];

/** Look up concepts triggered by a given course ID */
export function getConceptsForCourse(courseId: string): Concept[] {
  return CONCEPTS.filter((c) => c.courses.includes(courseId));
}

/** Get all concept IDs triggered by completing a lesson in a given course */
export function getConceptIdsForCourse(courseId: string): string[] {
  return getConceptsForCourse(courseId).map((c) => c.id);
}

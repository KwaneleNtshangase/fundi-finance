/**
 * Notho - Spaced Repetition Concepts
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
    id: "money-functions",
    name: "The Functions of Money",
    category: "Money & Economics",
    reviewCard: {
      question:
        "You compare a R18 loaf of bread with a R22 litre of milk to see which costs more. Which function of money is that?",
      options: [
        "Unit of account",
        "Store of value",
        "Medium of exchange",
        "Making you richer",
      ],
      correct: 0,
      explanation:
        "Measuring and comparing worth is money acting as a unit of account. Its other jobs are medium of exchange (swapping for goods) and store of value (holding worth over time).",
    },
    courses: ["money-basics"],
  },
  {
    id: "needs-vs-wants",
    name: "Needs vs Wants",
    category: "Budgeting",
    reviewCard: {
      question: "Which of these is a NEED, not a want?",
      options: [
        "The latest iPhone on contract",
        "Transport to get to work",
        "A weekend away in Ballito",
        "Uncapped fibre for gaming",
      ],
      correct: 1,
      explanation:
        "A need is something you can't survive or earn without — like transport to work. The rest are wants you could go without.",
    },
    courses: ["money-basics"],
  },
  {
    id: "tracking-spending",
    name: "Tracking Your Spending",
    category: "Budgeting",
    reviewCard: {
      question:
        "Why does tracking your spending for a few weeks beat guessing from memory?",
      options: [
        "People underestimate small, frequent purchases that add up",
        "Banks report spending incorrectly",
        "SARS requires proof of every expense",
        "Memory is more accurate than bank statements",
      ],
      correct: 0,
      explanation:
        "Small repeated buys — airtime, taxi fare, snacks — are easy to forget but add up fast. Tracking shows the real total.",
    },
    courses: ["money-basics"],
  },
  {
    id: "comparison-shopping",
    name: "Comparing Prices",
    category: "Budgeting",
    reviewCard: {
      question:
        "A 2kg bag of rice is R60 and a 5kg bag is R135. Which is cheaper per kilogram?",
      options: [
        "The 5kg bag, at R27/kg",
        "The 2kg bag, at R30/kg",
        "They cost the same per kg",
        "You can't tell from this",
      ],
      correct: 0,
      explanation:
        "Work out each per kg: R60÷2 = R30 vs R135÷5 = R27. The 5kg is cheaper per kg — as long as you'll use it before it spoils.",
    },
    courses: ["money-basics"],
  },
  {
    id: "sdl",
    name: "Skills Development Levy",
    category: "Income & Tax",
    reviewCard: {
      question: "Who pays the Skills Development Levy (SDL)?",
      options: [
        "The employer only — it's not deducted from your pay",
        "The employee only",
        "Both employee and employer equally",
        "SARS deducts it from your account",
      ],
      correct: 0,
      explanation:
        "SDL is a 1%-of-payroll employer cost that funds workplace training via the SETAs. It never appears as a deduction on your payslip.",
    },
    courses: ["salary-payslip"],
  },
  {
    id: "bank-fees",
    name: "Bank Fees",
    category: "Banking",
    reviewCard: {
      question: "Which habit tends to increase your bank fees the most?",
      options: [
        "Withdrawing small amounts frequently from ATMs",
        "Tapping your card to pay",
        "Getting your salary paid in",
        "Checking your balance in the app",
      ],
      correct: 0,
      explanation:
        "Each ATM withdrawal costs R5–R15, so many small draws stack up fast. Withdraw once in a larger amount and tap to pay.",
    },
    courses: ["banking-debit"],
  },
  {
    id: "debit-orders",
    name: "Debit Orders",
    category: "Banking",
    reviewCard: {
      question:
        "Does cancelling a debit order at your bank also cancel the underlying contract or debt?",
      options: [
        "No — it only stops the payment; the contract remains",
        "Yes — both end together",
        "Yes, but only for gym contracts",
        "No — you can't cancel debit orders yourself",
      ],
      correct: 0,
      explanation:
        "Stopping a debit order halts the payment only. Cancel the contract separately, or you still owe the money and can be listed with a credit bureau.",
    },
    courses: ["banking-debit"],
  },
  {
    id: "debit-disputes",
    name: "Disputing Debits",
    category: "Banking",
    reviewCard: {
      question:
        "How many days do you have to dispute an unauthorised debit order with your bank?",
      options: ["60 days", "7 days", "14 days", "90 days"],
      correct: 0,
      explanation:
        "You have 60 days from the debit date to report it unauthorised and claim a reversal. The free National Financial Ombud (NFO) — 0860 800 900 — handles unresolved cases.",
    },
    courses: ["banking-debit"],
  },
  {
    id: "credit-cards",
    name: "Store & Credit Cards",
    category: "Debt & Credit",
    reviewCard: {
      question:
        "Does paying your full credit card balance by the due date usually avoid interest on new purchases?",
      options: [
        "Yes — that's the interest-free grace period",
        "No — interest always applies regardless",
        "Yes, but only on store cards",
        "No — paying the minimum is enough",
      ],
      correct: 0,
      explanation:
        "Clearing the full balance each month keeps the grace period, so new purchases cost no interest. Carry a balance and you lose it.",
    },
    courses: ["credit-debt"],
  },
  {
    id: "debt-payoff",
    name: "Paying Off Debt",
    category: "Debt & Credit",
    reviewCard: {
      question: "In the debt snowball method, which debt do you attack first?",
      options: [
        "The one with the smallest balance",
        "The one with the highest interest rate",
        "The oldest one",
        "The largest one",
      ],
      correct: 0,
      explanation:
        "Snowball = smallest balance first, for quick wins and momentum. Avalanche (highest rate first) saves the most interest — pick the one you'll finish.",
    },
    courses: ["credit-debt"],
  },
  {
    id: "debt-consolidation",
    name: "Debt Consolidation",
    category: "Debt & Credit",
    reviewCard: {
      question: "What's the biggest risk of debt consolidation for most people?",
      options: [
        "Clearing the cards with the loan, then running them up again",
        "It's illegal in South Africa",
        "The new loan is always at a higher rate",
        "Banks always refuse the application",
      ],
      correct: 0,
      explanation:
        "Consolidation clears revolving cards; many people re-spend on them and end up with double the debt. It only works if the habits change too.",
    },
    courses: ["credit-debt"],
  },
  {
    id: "financial-risk",
    name: "Types of Financial Risk",
    category: "Savings",
    reviewCard: {
      question: "Which example is mainly 'income risk'?",
      options: [
        "Your employer announces retrenchments in your division",
        "A unit trust's price moves up and down",
        "Inflation slowly rising over a decade",
        "You pick the wrong paint colour",
      ],
      correct: 0,
      explanation:
        "Income risk threatens the money arriving each month — retrenchment is the classic case. Financial risk also spans fraud, medical shocks, rate hikes and underinsurance, not just markets.",
    },
    courses: ["emergency-fund"],
  },
  {
    id: "disability-cover",
    name: "Disability Cover",
    category: "Insurance",
    reviewCard: {
      question: "Which cover replaces your monthly salary if illness or injury stops you working?",
      options: [
        "Income protection",
        "Life insurance",
        "Lump-sum disability",
        "Car insurance",
      ],
      correct: 0,
      explanation:
        "Income protection pays a percentage of your monthly income while you can't work. Lump-sum disability pays once for permanent disability; the two can work together.",
    },
    courses: ["insurance"],
  },
  {
    id: "dread-disease",
    name: "Dread Disease Cover",
    category: "Insurance",
    reviewCard: {
      question: "When does a dread disease (critical illness) policy pay out?",
      options: [
        "On diagnosis of a covered condition, whether you survive or not",
        "Only when you die from the illness",
        "Only if you're permanently disabled",
        "At retirement age",
      ],
      correct: 0,
      explanation:
        "It pays a tax-free lump sum on diagnosis, so you can use the money while you're alive — for treatment gaps, debt, or replacing income.",
    },
    courses: ["insurance"],
  },
  {
    id: "car-insurance",
    name: "Car Insurance",
    category: "Insurance",
    reviewCard: {
      question: "What does 'third-party' car insurance cover?",
      options: [
        "Damage you cause to other people's property or vehicles",
        "Damage to your own car only",
        "Medical bills for your passengers",
        "Theft of items inside your car",
      ],
      correct: 0,
      explanation:
        "Third-party covers damage you cause to others, not your own car. Comprehensive covers both; driving uninsured means you pay for others' damage yourself.",
    },
    courses: ["insurance"],
  },
  {
    id: "home-insurance",
    name: "Home Insurance",
    category: "Insurance",
    reviewCard: {
      question: "Which insurance covers the physical structure of your home (walls, roof, fitted kitchen)?",
      options: [
        "Buildings insurance",
        "Contents insurance",
        "Car insurance",
        "Life insurance",
      ],
      correct: 0,
      explanation:
        "Buildings insurance covers the structure; contents insurance covers your belongings inside. Gradual wear and tear is generally excluded.",
    },
    courses: ["insurance"],
  },
  {
    id: "time-horizon",
    name: "Time Horizon",
    category: "Investing",
    reviewCard: {
      question: "You need money in 11 months for school fees. Which stance fits best?",
      options: [
        "Emphasise capital you can access without severe loss — controlled risk",
        "100% in speculative trades because 'markets bounce back'",
        "Borrow the full amount on a microloan",
        "Keep it all as cash under a mattress",
      ],
      correct: 0,
      explanation:
        "Time horizon is the gap to when you need the money. Under two years favours stability; five years or more can carry more growth assets if you won't panic-sell.",
    },
    courses: ["investing-basics"],
  },
  {
    id: "bonds",
    name: "Bonds",
    category: "Investing",
    reviewCard: {
      question: "In simple terms, someone who holds a bond is mostly:",
      options: [
        "A lender to the issuer, expecting interest and their money back",
        "A part-owner with voting rights",
        "Guaranteed to beat inflation every year",
        "Insured against all losses by the Reserve Bank",
      ],
      correct: 0,
      explanation:
        "A bond is debt: you lend to a government or company for scheduled interest plus principal at maturity. Bonds are calmer than shares but not risk-free — prices fall when rates rise.",
    },
    courses: ["investing-basics"],
  },
  {
    id: "unit-trusts",
    name: "Unit Trusts & ETFs",
    category: "Investing",
    reviewCard: {
      question: "What is a unit trust?",
      options: [
        "A pool of many investors' money invested in a manager-chosen basket",
        "A single share in one company",
        "A type of bank account",
        "A government bond",
      ],
      correct: 0,
      explanation:
        "A unit trust pools investors' money into a managed basket, giving instant diversification. An ETF usually tracks an index and trades like a share; both can sit in a TFSA. Compare the TER (yearly cost) — small fee gaps compound over decades.",
    },
    courses: ["sa-investing"],
  },
  {
    id: "home-affordability",
    name: "Home Affordability",
    category: "Property",
    reviewCard: {
      question: "You earn R35 000 gross a month. Using the 30% rule, what's the most you should spend on total housing costs?",
      options: ["R10 500", "R7 000", "R17 500", "R35 000"],
      correct: 0,
      explanation:
        "30% of R35 000 = R10 500 — and that must cover the bond PLUS rates, levies and insurance. Bank approval isn't the same as affordability: buy below your max and stress-test the repayment against rate rises.",
    },
    courses: ["property"],
  },
  {
    id: "tax-filing",
    name: "Filing Your Taxes",
    category: "Income & Tax",
    reviewCard: {
      question: "You earn more than R30 000 a year from non-salary sources (freelance, rental). What must you do?",
      options: [
        "Register as a provisional taxpayer and submit estimates twice a year",
        "Nothing — side income is tax-free",
        "File only every second year",
        "Pay 45% immediately",
      ],
      correct: 0,
      explanation:
        "Over R30 000 of non-salary income triggers provisional tax (estimates around August and February). Salaried employees with a single income source may be auto-assessed. Late filing carries monthly SARS penalties.",
    },
    courses: ["taxes"],
  },
  {
    id: "tax-deductions",
    name: "Tax Deductions & Credits",
    category: "Income & Tax",
    reviewCard: {
      question: "Do medical scheme (medical aid) credits reduce your taxable income, or your tax bill directly?",
      options: [
        "Your tax bill directly — a rand-for-rand credit",
        "Your taxable income",
        "Neither — they do nothing",
        "They increase your tax",
      ],
      correct: 0,
      explanation:
        "Medical credits come off your tax owed directly (R376/month for the member and first dependant, R254 each additional in 2026/27) — better than a deduction. Retirement contributions (up to 27.5%) reduce taxable income; PBO donations are deductible up to 10% with a Section 18A certificate.",
    },
    courses: ["taxes"],
  },
  {
    id: "tax-certificates",
    name: "Tax Certificates (IRP5, IT3)",
    category: "Income & Tax",
    reviewCard: {
      question: "Which certificate reports the interest you earned on your savings account?",
      options: ["IT3(b)", "IRP5", "IT3(c)", "IT3(a)"],
      correct: 0,
      explanation:
        "IT3(b) = interest income (from your bank/investments). IRP5 / IT3(a) = employment income and PAYE. IT3(c) = capital gains from investments. Under 65, the first R23 800 of interest a year is exempt.",
    },
    courses: ["taxes"],
  },
  {
    id: "phishing",
    name: "Phishing & Email Scams",
    category: "Financial Safety",
    reviewCard: {
      question: "An email from 'fnb-security@gmail.com' says your account is frozen. What do you do?",
      options: [
        "Call FNB on a number from their official site — don't click the link",
        "Click the link to unfreeze it",
        "Reply with your ID number to verify",
        "Forward it to your contacts",
      ],
      correct: 0,
      explanation:
        "Real banks don't email from Gmail, and never ask for your PIN/password/OTP. Contact the bank yourself through your app or a number you look up — never the details in the message.",
    },
    courses: ["scams-fraud"],
  },
  {
    id: "sim-swap",
    name: "SIM Swap Fraud",
    category: "Financial Safety",
    reviewCard: {
      question: "Your phone suddenly shows 'No Service' on a normal day. What should you do first?",
      options: [
        "Call your network immediately from another phone",
        "Wait for it to come back on its own",
        "Restart your phone a few times",
        "Post about it on social media",
      ],
      correct: 0,
      explanation:
        "Sudden signal loss can mean a SIM swap — a criminal hijacking your number to receive your OTPs. Call your network at once; a SIM-swap PIN and an authenticator app help prevent it.",
    },
    courses: ["scams-fraud"],
  },
  {
    id: "investment-scams",
    name: "Fake Investment Schemes",
    category: "Financial Safety",
    reviewCard: {
      question: "What should make you pause before sending money to an 'investment club'?",
      options: [
        "Guaranteed weekly returns and pressure to recruit friends",
        "A verifiable registered business name",
        "Clearly explained fees",
        "Plenty of time to think it over",
      ],
      correct: 0,
      explanation:
        "Guaranteed returns plus recruitment is the Ponzi/pyramid signature. Verify the FSP on the FSCA register (fsca.co.za), never EFT to personal accounts, and remember real growth is slow.",
    },
    courses: ["scams-fraud"],
  },
  {
    id: "romance-scams",
    name: "Romance & Social Media Scams",
    category: "Financial Safety",
    reviewCard: {
      question: "Someone you've never met in person, after weeks of messages, has an 'emergency' and needs a fee. What is this?",
      options: [
        "A classic romance-scam script — don't send money",
        "True love being tested",
        "A genuine emergency you must fund",
        "A sign to send more to prove you care",
      ],
      correct: 0,
      explanation:
        "Trust is built to set up the 'emergency'. Never send cash, airtime or gift-card codes to someone you've only met online — and tell a trusted person, since scammers isolate you.",
    },
    courses: ["scams-fraud"],
  },
  {
    id: "scam-recovery",
    name: "If You're Scammed",
    category: "Financial Safety",
    reviewCard: {
      question: "You notice money has left your account. What's the first practical step?",
      options: [
        "Contact your bank's fraud department immediately to block affected channels",
        "Delete your banking app to hide it",
        "Send more money to 'reverse' it",
        "Ignore it for 30 days",
      ],
      correct: 0,
      explanation:
        "Speed matters — fast reporting can freeze downstream accounts. Keep evidence, open a SAPS case (10111) for a case number, and don't let shame delay you: being scammed isn't your fault.",
    },
    courses: ["scams-fraud"],
  },
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
  {
    id: "rand-drivers",
    name: "What Moves the Rand",
    category: "Money & Economics",
    reviewCard: {
      question: "The US Federal Reserve raises interest rates sharply. What typically happens to the rand?",
      options: [
        "It weakens — capital flows to the US dollar for better yields",
        "It strengthens — US growth is good for SA trade",
        "Nothing — exchange rates are independent of interest rates",
        "It strengthens — investors seek diversification",
      ],
      correct: 0,
      explanation:
        "Higher US rates pull global capital toward dollar assets. Money exits emerging markets like SA (capital flight), rand demand drops, and the rand weakens. Other drivers of rand weakness include load shedding, a trade (current-account) deficit, and global 'risk-off' moments when investors sell riskier currencies.",
    },
    courses: ["rand-economy"],
  },
  {
    id: "rand-hedge",
    name: "Hedging Against Rand Weakness",
    category: "Money & Economics",
    reviewCard: {
      question: "You hold R100 000 in a global (offshore) equity ETF. The rand weakens from R18/$ to R20/$ while the shares themselves don't move. Roughly what happens to your investment in rand?",
      options: [
        "It rises to about R111 000 — the currency move alone adds value",
        "It stays at R100 000",
        "It falls to about R90 000",
        "It becomes worthless",
      ],
      correct: 0,
      explanation:
        "Offshore assets are priced in foreign currency, so when the rand weakens they're worth more in rand. R100 000 ÷ R18 = $5 556; at R20/$ that's about R111 000 — roughly an 11% gain from currency alone. That's why a global ETF is the most accessible rand hedge; rand-only assets (SA bonds, fixed deposits) give no currency protection.",
    },
    courses: ["rand-economy"],
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
      explanation: "3-6 months of living expenses gives you a buffer for job loss, medical emergencies, or car repairs without going into debt. Keep it in an accessible, interest-bearing account.",
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
      explanation: "With a TFSA, all growth (interest, dividends, capital gains) inside the account is 100% tax-free. The annual contribution limit is R46 000 (2026/27 tax year) and the lifetime limit is R500 000.",
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
      explanation: "For money you won't need for 5+ years, investing typically beats saving. A savings account might earn 7-9%, but a diversified portfolio has historically returned more over the long term. Short-term money should be saved; long-term money should be invested.",
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
      explanation: "Compound interest means Themba's 10 extra years of growth are enormously powerful. Starting at 25 vs 35 can mean retiring with 2-3× more money, even with the same monthly contribution.",
    },
    courses: ["retirement", "investing-basics"],
  },
  {
    id: "retirement-number",
    name: "How Much You Need to Retire",
    category: "Retirement",
    reviewCard: {
      question: "You want R25 000/month in retirement. Using the 4% rule, roughly how much capital do you need?",
      options: [
        "About R7.5 million (R300 000/year ÷ 4%)",
        "About R300 000",
        "About R1.2 million",
        "About R25 million",
      ],
      correct: 0,
      explanation:
        "The 4% rule: you can sustainably draw about 4% of your portfolio a year. So capital needed = annual income ÷ 0.04. R25 000/month = R300 000/year; R300 000 ÷ 0.04 = R7.5 million. Planners also target a 'replacement ratio' of roughly 70-80% of your final salary.",
    },
    courses: ["retirement"],
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
      explanation: "SARS allows you to deduct RA contributions (up to 27.5% of taxable income, max R430k/year) from your taxable income. This reduces your tax bill now while building your retirement nest egg.",
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
        "Wait 24-48 hours before buying anything not on your list",
        "Only use cash (never a card)",
        "Set a R50 spending limit on everything",
      ],
      correct: 1,
      explanation: "The 24-48 hour rule breaks the emotional trigger of impulse buying. Most impulse urges fade within a day. If you still want it 48 hours later, it was probably a considered decision.",
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
        "There are no hidden costs, bond and rent are the only costs",
        "Only transfer duties apply once",
        "Rates, levies, maintenance, transfer duties, and bond initiation fees all add to the true cost of buying",
        "VAT on the purchase price",
      ],
      correct: 2,
      explanation: "Buying a home costs more than just the bond. Add: rates & taxes (~R800-R2 000/month), levy (R1 000+), maintenance (~1% of value/year), transfer duty (only above R1.21M), and bond registration/attorney fees. These can add R3 000-R5 000/month on top of the bond repayment.",
    },
    courses: ["property"],
  },
  {
    id: "transfer-duty",
    name: "Transfer Duty",
    category: "Property",
    reviewCard: {
      question: "You buy a property for R1 500 000. Transfer duty is 0% on the first R1 210 000, then 3% on the amount above it. What's the duty?",
      options: ["R8 700", "R45 000", "R12 000", "R0: first-time buyers are exempt"],
      correct: 0,
      explanation: "Transfer duty = 3% × (R1 500 000 − R1 210 000) = 3% × R290 000 = R8 700. The first R1 210 000 is exempt (2026/27). Rates then rise to 6% above R1 663 800, 8% above R2 329 300, 11% above R2 994 800, and 13% above R13.31M. The buyer pays it once, at purchase.",
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
      explanation: "LTV = loan ÷ property value = 90%. The lower your LTV (bigger deposit), the less risk for the bank, they reward this with a lower interest rate. A 90% LTV vs 80% LTV can mean 0.5-1% difference in your rate, saving thousands over 20 years.",
    },
    courses: ["property"],
  },

  // ── Capital Gains & Provisional Tax ──────────────────────────────────────
  {
    id: "capital-gains-tax",
    name: "Capital Gains Tax (CGT)",
    category: "Income & Tax",
    reviewCard: {
      question: "You sell shares for R200 000 that you bought for R120 000. After the R50 000 annual exclusion, how much of your gain is included in taxable income?",
      options: ["R12 000 (40% of the R30 000 net gain)", "R30 000", "R80 000", "R200 000"],
      correct: 0,
      explanation: "Gain = R80 000. Less the R50 000 annual exclusion = R30 000 net. Only 40% is included: R30 000 × 40% = R12 000 added to taxable income (taxed at your marginal rate). A primary residence has a R3 000 000 exclusion.",
    },
    courses: ["taxes", "sa-investing"],
  },
  {
    id: "dividend-vs-salary",
    name: "Dividend vs Salary (Business Owners)",
    category: "Income & Tax",
    reviewCard: {
      question: "A Pty Ltd owner in the top bracket extracts profit. Roughly how does taking a dividend compare with taking a salary?",
      options: [
        "Dividend ≈41.6% total (27% company + 20% dividends tax); salary up to 45% — the dividend edges ahead at the top",
        "Salary is always tax-free to the owner",
        "Dividends are never taxed",
        "They are identical in every case",
      ],
      correct: 0,
      explanation:
        "Salary is deductible for the company but taxed in your hands at up to 45%. A dividend comes from after-tax profit: 27% company tax, then 20% dividends withholding tax — about 41.6% combined. At the top bracket the dividend wins slightly; lower down, a salary (using rebates and lower brackets) often wins, so most owners use a mix.",
    },
    courses: ["advanced-tax"],
  },
  {
    id: "trust-tax",
    name: "How Trusts Are Taxed",
    category: "Income & Tax",
    reviewCard: {
      question: "How is income that is retained inside a South African trust taxed?",
      options: [
        "At a flat 45%, with no rebates or exclusions",
        "It is tax-free",
        "At a flat 18% always",
        "At the company rate of 27%",
      ],
      correct: 0,
      explanation:
        "A trust that retains income is taxed at a flat 45% (and 80% CGT inclusion — an effective 36% on gains), the harshest rate, with no rebates or annual exclusions. The 'conduit principle' is the planning tool: income distributed to beneficiaries in the same tax year is taxed in their hands at their (often lower) rates instead.",
    },
    courses: ["advanced-tax"],
  },
  {
    id: "foreign-income",
    name: "Foreign Income & SA Residents",
    category: "Income & Tax",
    reviewCard: {
      question: "You're a South African tax resident who earns some income abroad. How does SARS treat it?",
      options: [
        "SA taxes residents on worldwide income, with credits for foreign tax paid to avoid double taxation",
        "Foreign income is always tax-free in SA",
        "Only income earned inside SA is ever taxed",
        "You always pay full tax twice, with no relief",
      ],
      correct: 0,
      explanation:
        "SA uses residence-based taxation — residents are taxed on worldwide income. Foreign employment income can be exempt up to R1.25 million a year if you spend more than 183 days (including a continuous 60-day stretch) working abroad in a 12-month period. Foreign tax credits (s6quat) stop the same income being taxed twice; non-residents are taxed only on SA-source income.",
    },
    courses: ["advanced-tax"],
  },
  {
    id: "intestate-succession",
    name: "Dying Without a Will",
    category: "Estate Planning",
    reviewCard: {
      question: "What happens to your estate if you die without a valid will (intestate)?",
      options: [
        "The Intestate Succession Act decides who inherits — not your wishes, and cohabiting partners get nothing automatically",
        "The government keeps everything",
        "Your closest friend inherits by default",
        "Nothing can ever be distributed",
      ],
      correct: 0,
      explanation:
        "Dying intestate hands distribution to a fixed legal formula. Unmarried partners aren't automatically recognised, minor children's inheritances can go to the state Guardian's Fund, and the Master appoints an executor (often a bank at up to 3.5% + VAT). A valid will — signed before two competent witnesses, none of them beneficiaries — avoids all of this.",
    },
    courses: ["estate-planning"],
  },
  {
    id: "estate-duty",
    name: "Estate Duty",
    category: "Estate Planning",
    reviewCard: {
      question: "How does South African estate duty work?",
      options: [
        "20% up to R30m and 25% above, after a R3.5m abatement; bequests to a spouse are exempt",
        "A flat 40% on everything you own",
        "There is no tax on estates in SA",
        "25% on every rand from the first",
      ],
      correct: 0,
      explanation:
        "Estate duty is 20% on the dutiable estate up to R30 million and 25% above, after a R3.5 million abatement (unused abatement rolls over to a surviving spouse, up to R7m). Assets left to a spouse are exempt, deferring duty to the second death. Retirement funds paid to nominated beneficiaries bypass the estate entirely.",
    },
    courses: ["estate-planning"],
  },
  {
    id: "beneficiary-nominations",
    name: "Beneficiary Nominations",
    category: "Estate Planning",
    reviewCard: {
      question: "Your retirement-fund nomination names your ex-spouse, but your will leaves everything to your children. Who gets the retirement fund?",
      options: [
        "It's decided outside your will — for retirement funds, trustees allocate to financial dependants (s37C); a will can't override it",
        "Your children — the will always wins",
        "It's split equally by law",
        "The state takes it",
      ],
      correct: 0,
      explanation:
        "Beneficiary nominations on retirement funds and life policies bypass your will. For retirement funds, s37C gives trustees discretion to distribute among all financial dependants, whatever the nomination says; life-policy nominees are paid directly by the insurer. Review nominations after every major life event — a stale form can send money to an ex-spouse.",
    },
    courses: ["estate-planning"],
  },
  {
    id: "factor-investing",
    name: "Factor Investing (Smart Beta)",
    category: "Investing",
    reviewCard: {
      question: "A 'value' factor tilt means systematically overweighting which stocks?",
      options: [
        "Cheap ones — low price-to-earnings and price-to-book relative to peers",
        "Whatever rose most in the last 12 months",
        "Growth stocks with the highest future expectations",
        "Whatever the fund manager fancies that day",
      ],
      correct: 0,
      explanation:
        "Factors are rules-based tilts backed by long-run evidence (Fama-French): value (cheap), size (smaller), momentum (recent winners), quality (profitable, low-debt) and low volatility. 'Smart beta' ETFs deliver these systematically at low fees (~0.2-0.5%). The catch: any factor can underperform for years, so they're long-term tilts, not short-term trades.",
    },
    courses: ["advanced-investing"],
  },
  {
    id: "offshore-allocation",
    name: "Offshore Allocation & Regulation 28",
    category: "Investing",
    reviewCard: {
      question: "How much of a South African retirement fund (Regulation 28) may be invested offshore?",
      options: [
        "Up to 45% offshore; TFSAs and discretionary investments have no offshore limit",
        "0% — retirement funds must stay fully local",
        "100% — there's no limit anywhere",
        "Exactly 30%",
      ],
      correct: 0,
      explanation:
        "Regulation 28 caps retirement funds (RA, pension, provident) at 45% offshore (raised from 30% in 2022). TFSAs and personal discretionary investments have no such limit — you can hold 100% global equity there. To move money out personally, the single discretionary allowance is R2 million/year (raised in Budget 2026) plus a R10 million/year foreign investment allowance with SARS tax clearance.",
    },
    courses: ["advanced-investing"],
  },
  {
    id: "sequence-risk",
    name: "Sequence-of-Returns Risk",
    category: "Investing",
    reviewCard: {
      question: "Two retirees average the same 10% return over 20 years, but one gets bad returns early and good later. What happens?",
      options: [
        "The one with bad returns early can run out of money years sooner — the ORDER of returns matters",
        "They end identically — only the average matters",
        "The one with bad returns early always ends richer",
        "Sequence of returns is irrelevant once you retire",
      ],
      correct: 0,
      explanation:
        "Sequence-of-returns risk: while you're withdrawing income, a crash early in retirement forces you to sell units at low prices, and that capital never shares in the recovery. Same average, very different outcomes. Defences: a 1-2 year cash buffer, a bucket strategy, and cutting withdrawals in bad years. In SA a 3-3.5% initial withdrawal rate is safer than the US 4% (higher inflation), rising toward 4-4.5% with meaningful offshore exposure.",
    },
    courses: ["advanced-investing"],
  },
  {
    id: "company-structures",
    name: "SA Business Structures",
    category: "Business Finance",
    reviewCard: {
      question: "What's the key tax and liability difference between a sole proprietor and a Pty Ltd?",
      options: [
        "Sole prop: profit taxed in your hands (up to 45%), unlimited liability. Pty Ltd: separate entity, 27% tax, limited liability",
        "They are taxed identically",
        "A sole prop pays 27%, a Pty Ltd pays 45%",
        "Both give full limited liability",
      ],
      correct: 0,
      explanation:
        "A sole proprietor is you — profits are taxed at your marginal rate (up to 45%) and your personal assets are exposed. A Pty Ltd is a separate legal entity with limited liability and 27% company tax (qualifying small companies, turnover under R20m, get reduced SBC rates). Watch the Personal Service Provider trap: a Pty Ltd earning 80%+ from one or two clients is taxed at individual rates, not 27%.",
    },
    courses: ["business-finance-advanced"],
  },
  {
    id: "financial-statements",
    name: "Reading Financial Statements",
    category: "Business Finance",
    reviewCard: {
      question: "Which financial statement answers 'does the business have cash to survive?'",
      options: [
        "The cash flow statement",
        "The income statement (P&L)",
        "The balance sheet",
        "None of them show cash",
      ],
      correct: 0,
      explanation:
        "The income statement shows profit over a period; the balance sheet shows what you own and owe at a point in time; the cash flow statement shows actual cash moving in and out. A business can be profitable yet cash-flow negative — which is how profitable companies still fail. Watch the current ratio (below 1 is a liquidity risk) and debtor days (rising = customers paying too slowly).",
    },
    courses: ["business-finance-advanced"],
  },
  {
    id: "business-valuation",
    name: "Valuing a Business",
    category: "Business Finance",
    reviewCard: {
      question: "What's the most common way to value a small operating business?",
      options: [
        "EBITDA × an industry multiple (SA SMEs often 2-5×)",
        "Revenue × 100",
        "The number of employees",
        "Whatever the owner feels it's worth",
      ],
      correct: 0,
      explanation:
        "The earnings-based method (EBITDA × an industry multiple) is most common — SA SMEs typically trade at 2-5× EBITDA versus 8-15× for listed companies. Other methods: discounted cash flow (theoretically sound but assumption-sensitive) and net asset value (a floor for asset-heavy businesses). Customer concentration, owner-dependence and messy books all discount the multiple.",
    },
    courses: ["business-finance-advanced"],
  },
  {
    id: "business-funding",
    name: "Funding a Business",
    category: "Business Finance",
    reviewCard: {
      question: "What's the core trade-off between debt and equity funding?",
      options: [
        "Debt costs interest but keeps your ownership; equity avoids repayments but gives up a share of the business",
        "They are identical",
        "Debt is always cheaper and better",
        "Equity funding is free",
      ],
      correct: 0,
      explanation:
        "Debt (bank loans, asset finance) charges interest but you keep your equity; equity investors (angels, VC) provide cash and often expertise but take ownership and some control. Government options (SEFA loans, IDC, DTIC grants) are cheaper or non-dilutive but bureaucratic. Before taking investment, a shareholders agreement — covering exits, deadlock, and death — is non-negotiable.",
    },
    courses: ["business-finance-advanced"],
  },
  {
    id: "provisional-tax",
    name: "Provisional Tax",
    category: "Income & Tax",
    reviewCard: {
      question: "Who is required to pay provisional tax in South Africa?",
      options: [
        "Only employees earning more than R1M per year",
        "Everyone, it replaces PAYE for all taxpayers",
        "People who earn income other than a salary (freelancers, rental income, investment income above R30 000)",
        "Only registered companies",
      ],
      correct: 2,
      explanation: "Provisional tax applies to anyone earning income not subject to PAYE, freelancers, landlords, business owners, and investors with investment income over R30 000. You pay two estimates (August and February) plus a top-up if needed, spreading the tax burden across the year.",
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
        "R430 000 (annual cap)",
        "R96 000 (20% of income)",
      ],
      correct: 1,
      explanation: "SARS allows 27.5% of the HIGHER of taxable income or remuneration, capped at R430 000/year (2027). For Nomsa: 27.5% × R480 000 = R132 000. Her actual contribution of R60 000 is below this limit, so she deducts the full R60 000: saving her ~R24 000 in tax at a 40% marginal rate.",
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
        "It's impossible, profit always equals cash",
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
      explanation: "Contribution margin = R200 - R80 = R120 per unit. Break-even = Fixed costs ÷ Contribution margin = R36 000 ÷ R120 = 300 units. Below 300 units you make a loss; above 300 every unit generates pure profit (after covering variable costs).",
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
      explanation: "SARS requires VAT registration once your annual taxable supplies exceed R1 000 000. Voluntary registration is possible from R50 000. Registered businesses charge 15% VAT on sales and can claim VAT back on business purchases, keeping the records straight is critical.",
    },
    courses: ["business-finance", "taxes"],
  },
  {
    id: "business-separation",
    name: "Separate Business & Personal Money",
    category: "Business Finance",
    reviewCard: {
      question: "Why should an entrepreneur keep separate business and personal bank accounts from day one?",
      options: [
        "So you can see if the business is truly profitable and keep clean records for SARS and lenders",
        "It's a legal requirement for every side hustle",
        "Banks pay higher interest on business accounts",
        "It lets you avoid paying any tax",
      ],
      correct: 0,
      explanation:
        "Mixing personal and business money is the most common SA entrepreneur mistake: you can't tell whether the business is profitable, SARS can pursue personal assets for business tax debt, and you can't get business finance without clean statements. Pay yourself a defined salary instead of dipping in randomly.",
    },
    courses: ["business-finance"],
  },

  // ── Money Psychology ──────────────────────────────────────────────────────
  {
    id: "sunk-cost-fallacy",
    name: "Sunk Cost Fallacy",
    category: "Financial Behaviour",
    reviewCard: {
      question: "You paid R15 000 for a course that turns out to be useless. You've completed 30%. Should the R15 000 already spent influence your decision to continue?",
      options: [
        "Yes, you must finish to get value from your R15 000",
        "No, the R15 000 is gone regardless; your decision should be based on future value, not past spend",
        "Yes, quitting means admitting a mistake",
        "No, but only if you can get a refund",
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
        "Loss aversion, you fear missing the sale",
        "Anchoring, your brain anchors to the R3 000 'original' price as the reference point",
        "Confirmation bias, you believe jackets cost R3 000",
        "Herding, everyone else is buying jackets",
      ],
      correct: 1,
      explanation: "Anchoring happens when an initial number (the 'anchor') distorts your judgement of value. The R3 000 price, whether real or fabricated, makes R1 500 feel like a steal, even if the jacket's true market value is R900. Retailers deliberately use this tactic.",
    },
    courses: ["money-psychology"],
  },
  {
    id: "present-bias",
    name: "Present Bias",
    category: "Financial Behaviour",
    reviewCard: {
      question: "You know you should save R500 this month, but you spend it on something you'll barely remember. Which bias best explains this?",
      options: [
        "Present bias — overvaluing a reward now over a bigger reward later",
        "Anchoring — fixating on the first price you saw",
        "Sunk cost — refusing to abandon money already spent",
        "Herd mentality — copying what others do",
      ],
      correct: 0,
      explanation:
        "Present bias (hyperbolic discounting) is the pull toward an immediate reward even when waiting pays more. The most reliable counter is to remove the in-the-moment choice — automate the saving with a debit order on payday, before you can spend it.",
    },
    courses: ["money-psychology"],
  },
  {
    id: "herd-fomo",
    name: "Herd Mentality & FOMO",
    category: "Financial Behaviour",
    reviewCard: {
      question: "Everyone in your group chat is buying a coin that's 'about to explode', and you feel you'll miss out. What's the disciplined move?",
      options: [
        "Research it independently and only act if you understand how it makes money",
        "Buy quickly before the price rises further",
        "Buy the same amount as your friends to keep up",
        "Ask how much they've made and match it",
      ],
      correct: 0,
      explanation:
        "Herd mentality plus FOMO gets people buying near the top, after prices have already run. The number of buyers says nothing about whether an asset is sound. A personal rule — understand it first, and wait 48 hours before acting — defuses the urgency that hype cycles rely on.",
    },
    courses: ["money-psychology"],
  },
  {
    id: "loss-aversion",
    name: "Loss Aversion",
    category: "Financial Behaviour",
    reviewCard: {
      question: "A share you paid R10 000 for is now worth R4 000 and the outlook is poor, but selling feels unbearable. What bias is at work?",
      options: [
        "Loss aversion — the pain of a loss feels far stronger than an equal gain",
        "Present bias — you want a reward now",
        "Confirmation bias — you seek agreeing opinions",
        "Anchoring to a sale price",
      ],
      correct: 0,
      explanation:
        "Loss aversion (Kahneman & Tversky) means a loss hurts roughly twice as much as an equal gain feels good — so people hold losers hoping to break even and panic-sell at the bottom. The fix: judge an investment on its future prospects, not the price you paid, which is irrelevant to what happens next.",
    },
    courses: ["money-psychology"],
  },
  {
    id: "lifestyle-inflation",
    name: "Lifestyle Inflation",
    category: "Financial Behaviour",
    reviewCard: {
      question: "Sipho's salary jumps from R20k to R30k. He upgrades his flat, car and subscriptions, and still saves only R1k a month. What happened?",
      options: [
        "Lifestyle inflation — spending rose to match the raise, so wealth didn't grow",
        "Loss aversion made him hold cash",
        "Anchoring to his old salary",
        "Present bias about a future reward",
      ],
      correct: 0,
      explanation:
        "Lifestyle inflation is when every income increase is matched by a spending increase, so you earn more but never get ahead. It affects almost everyone, not just people who are 'bad with money'. The counter: when a raise lands, commit to saving at least half of the increase before upgrading anything.",
    },
    courses: ["money-psychology"],
  },
  {
    id: "social-comparison",
    name: "Social Comparison & Money",
    category: "Financial Behaviour",
    reviewCard: {
      question: "A colleague posts a new car and luxury holidays. What does their visible spending actually tell you about their finances?",
      options: [
        "Very little — visible consumption is often funded by debt, not wealth",
        "They are clearly financially secure",
        "You should finance a similar car to keep up",
        "They must have a strategy worth copying exactly",
      ],
      correct: 0,
      explanation:
        "Displayed wealth and real wealth are weakly correlated — the holiday may sit on a personal loan and the car on a 72-month finance deal. Comparison spending on credit is a fast route to financial stress. The only meaningful benchmark is your own goals and net-worth progress.",
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
      options: ["About R50 more", "About R375 more", "About R1 000 more", "Nothing, fixed rates aren't affected"],
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
        "Demand-pull inflation, consumers are buying too much",
        "Cost-push inflation, production costs rise and are passed to consumers",
        "Hyperinflation, caused by money printing",
        "Core inflation, excludes food and energy",
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
        "Never invest, all wealth is sinful",
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
  {
    id: "stewardship-biblical",
    name: "Stewardship",
    category: "Biblical Finance",
    reviewCard: {
      question: "Psalm 24:1 says 'The earth is the Lord's, and everything in it.' What does this mean for how you handle money?",
      options: [
        "You're a manager of God's resources, accountable for how you use them",
        "Money is evil and should be avoided",
        "You can spend however you like since it's all God's anyway",
        "Only church offerings count as God's money",
      ],
      correct: 0,
      explanation:
        "Biblical stewardship starts with ownership: God owns everything, and we manage it on His behalf. Luke 16:10 adds that faithfulness with small amounts shapes how we handle larger ones — reframing spending, saving, and giving as stewardship decisions, not just personal preferences.",
    },
    courses: ["bible-money"],
  },
  {
    id: "biblical-saving",
    name: "Saving & Planning (Proverbs)",
    category: "Biblical Finance",
    reviewCard: {
      question: "Proverbs 21:20 contrasts the wise, who 'have wealth and luxury', with fools, who 'spend whatever they get.' What's the principle?",
      options: [
        "Save and store up reserves rather than consuming everything you earn",
        "Wealth proves God's favour and poverty proves sin",
        "Spend freely because God will always provide",
        "Keep all your money in cash at home",
      ],
      correct: 0,
      explanation:
        "Proverbs repeatedly praises foresight: the ant stores food for winter (6:6-8), and good planning beats hasty shortcuts (21:5). Practically this is your emergency fund, retirement contributions, and steady investing — preparing for the seasons ahead instead of consuming everything now.",
    },
    courses: ["bible-money"],
  },
  {
    id: "biblical-generosity",
    name: "Generosity & Giving",
    category: "Biblical Finance",
    reviewCard: {
      question: "Proverbs 3:9 says to honour God with 'the best part of everything you produce.' What does 'firstfruits' giving mean?",
      options: [
        "Give off the top first, not from whatever is left over",
        "Give only after all bills and savings are covered",
        "Give exactly 10%, no more and no less",
        "Give only to members of your own family",
      ],
      correct: 0,
      explanation:
        "'Firstfruits' means giving first, as a priority — not from leftovers. Scripture links generosity to flourishing (Proverbs 11:24-25) and describes cheerful, uncoerced giving (2 Corinthians 9:7). Helping the poor is even framed as lending to the Lord, who repays (Proverbs 19:17).",
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
  {
    id: "crypto-tax",
    name: "SARS & Crypto Tax",
    category: "Investing",
    reviewCard: {
      question: "You buy Bitcoin on a SA exchange, hold it a year, then sell at a profit. How does SARS treat that gain?",
      options: [
        "It's taxable — capital gains tax applies, and the exchange shares your data with SARS",
        "It's completely tax-free",
        "Crypto is anonymous, so SARS can't see it",
        "Only foreign crypto is taxed",
      ],
      correct: 0,
      explanation:
        "SARS treats crypto as a taxable asset. Hold-and-sell gains fall under capital gains tax (40% of the gain is included in your taxable income); active trading is taxed as income. Blockchain is pseudonymous, not anonymous — SA exchanges like Luno and VALR share data with SARS, so non-disclosure is tax evasion.",
    },
    courses: ["crypto-basics"],
  },

  // ── RE5 / FAIS ────────────────────────────────────────────────────────────
  {
    id: "fais-purpose",
    name: "What FAIS Regulates",
    category: "RE5 / FAIS",
    reviewCard: {
      question: "What does the FAIS Act regulate?",
      options: [
        "The conduct of people who give financial advice or intermediary services",
        "The performance of financial products",
        "Interest rates on loans",
        "Only long-term insurance",
      ],
      correct: 0,
      explanation:
        "FAIS (Act 37 of 2002) is market-conduct law — it governs HOW advice and intermediary services are rendered, not product returns. The FSCA (which replaced the FSB under the Twin Peaks reform) is the conduct regulator; the Prudential Authority handles institutional soundness.",
    },
    courses: ["re5-exam-prep"],
  },
  {
    id: "fais-definitions",
    name: "Advice vs Intermediary Service",
    category: "RE5 / FAIS",
    reviewCard: {
      question: "Under FAIS, what turns an interaction into 'advice'?",
      options: [
        "A recommendation, guidance or proposal about a financial product",
        "Any mention of a product at all",
        "Only a completed sale",
        "Handing over a brochure",
      ],
      correct: 0,
      explanation:
        "Advice is a recommendation, guidance or proposal of a financial nature (e.g. to buy, replace or cancel a product). Purely factual information with no recommendation is NOT advice. An 'intermediary service' is any act (other than advice) done for the client — like submitting an application or handling premiums. The Key Individual manages/oversees; the representative renders the services.",
    },
    courses: ["re5-exam-prep"],
  },
  {
    id: "fsp-categories",
    name: "FSP Licence Categories",
    category: "RE5 / FAIS",
    reviewCard: {
      question: "An FSP that makes buy/sell decisions on a client's portfolio without approving each trade needs which licence category?",
      options: ["Category II (discretionary FSP)", "Category I", "Category III", "Category IV"],
      correct: 0,
      explanation:
        "Category I = advice and/or intermediary services (ordinary advisers). Category II = discretionary FSPs. Category IIA = hedge funds. Category III = administrative FSPs (LISPs). Category IV = assistance business. A licence only covers the categories and product subcategories approved — and you may not act as an FSP without one.",
    },
    courses: ["re5-exam-prep"],
  },
  {
    id: "fsp-licence-action",
    name: "Suspension & Withdrawal of a Licence",
    category: "RE5 / FAIS",
    reviewCard: {
      question: "When may the FSCA suspend or withdraw an FSP's licence?",
      options: [
        "When the FSP no longer meets fit & proper, got the licence by fraud, or seriously contravened the Act",
        "Only if the FSP agrees",
        "Never — licences are permanent",
        "Only after a criminal conviction",
      ],
      correct: 0,
      explanation:
        "The FSCA can suspend (temporary, often with conditions) or withdraw (ends authorisation) for cause. Normally it gives notice and a chance to make representations first — but where delay would prejudice clients or the public, it may act first and hear representations after. A licence also lapses on liquidation or death. Obligations to clients that arose before survive.",
    },
    courses: ["re5-exam-prep"],
  },
  {
    id: "fais-representatives",
    name: "Representatives & the Register",
    category: "RE5 / FAIS",
    reviewCard: {
      question: "Within how long must an FSP update its register after a representative is appointed or leaves?",
      options: ["15 days", "24 hours", "3 months", "1 year"],
      correct: 0,
      explanation:
        "An FSP must keep an up-to-date register of representatives and KIs (with authorised categories and supervision status) and update it within 15 days of a change. New entrants may render services under supervision while completing their qualification and regulatory exam within the timelines measured from their Date of First Appointment (DOFA).",
    },
    courses: ["re5-exam-prep"],
  },
  {
    id: "fais-debarment",
    name: "Debarment of Representatives",
    category: "RE5 / FAIS",
    reviewCard: {
      question: "Can an FSP debar a representative by quietly removing them from the register without telling them?",
      options: [
        "No — debarment needs notice, reasons and a chance to respond",
        "Yes, the FSP controls its own register",
        "Yes, if the FSCA is told within 15 days",
        "Yes, if the rep already resigned",
      ],
      correct: 0,
      explanation:
        "Debarment removes a person's ability to render financial services and must follow a fair process: notice of intention and reasons, an opportunity to respond, consideration of that response, then notification and a right to reconsideration. The FSCA publishes debarments, and a debarred person can't be appointed by any FSP while debarred.",
    },
    courses: ["re5-exam-prep"],
  },
  {
    id: "fit-and-proper",
    name: "Fit & Proper Pillars",
    category: "RE5 / FAIS",
    reviewCard: {
      question: "Which is NOT a fit & proper pillar under FAIS?",
      options: [
        "Guaranteed investment returns for clients",
        "Honesty, integrity and good standing",
        "Competence",
        "Financial soundness",
      ],
      correct: 0,
      explanation:
        "The fit & proper pillars are honesty/integrity & good standing, competence (qualifications, regulatory exams, experience, training), CPD, operational ability, and financial soundness. There is no 'guaranteed returns' requirement — FAIS regulates conduct, not performance. These standards must be met continuously, not just at appointment.",
    },
    courses: ["re5-exam-prep"],
  },
  {
    id: "fais-competence-cpd",
    name: "Competence, Exams & CPD",
    category: "RE5 / FAIS",
    reviewCard: {
      question: "When does the CPD cycle run, and does product-specific training count toward it?",
      options: [
        "1 June to 31 May; product-specific training does NOT count as CPD",
        "1 January to 31 December; all training counts",
        "1 March to 28 Feb; only product training counts",
        "There is no CPD cycle",
      ],
      correct: 0,
      explanation:
        "CPD runs 1 June–31 May, with hours (commonly 6, 12 or up to 18) scaling with the number and complexity of authorised classes of business. CPD must be verifiable and relevant. Product-specific and class-of-business training are separate competency requirements — they don't count as CPD. Competence is measured from DOFA (qualification generally within six years).",
    },
    courses: ["re5-exam-prep"],
  },
  {
    id: "code-general-duty",
    name: "The General Duty to Clients",
    category: "RE5 / FAIS",
    reviewCard: {
      question: "What is the overarching standard in the General Code of Conduct?",
      options: [
        "Act honestly, fairly, with due skill, care and diligence, in clients' interests",
        "Maximise commission income",
        "Always present products favourably",
        "Prioritise the product supplier",
      ],
      correct: 0,
      explanation:
        "The General Code requires providers to render services honestly, fairly, with due skill, care and diligence, and in the interests of clients and the industry's integrity. Information must be factually correct, clear and not misleading, and provided timeously so clients can decide — and key oral disclosures must be confirmed in writing within a reasonable time.",
    },
    courses: ["re5-exam-prep"],
  },
  {
    id: "code-disclosures",
    name: "Provider, Supplier & Product Disclosure",
    category: "RE5 / FAIS",
    reviewCard: {
      question: "A representative doesn't mention the commission they'll earn, saying 'the client only cares about the product'. What's breached?",
      options: [
        "The duty to disclose remuneration and manage the conflict of interest",
        "Nothing — commission is confidential",
        "The record-keeping rule",
        "The financial soundness pillar",
      ],
      correct: 0,
      explanation:
        "The Code requires disclosure about the provider (licence, contact, supervision), the product supplier (relationship, restrictions), and the product (terms, fees, penalties, material risks) — including the provider's remuneration/commission and its basis. Hiding commission is a breach and also a conflict of interest that must be managed and disclosed.",
    },
    courses: ["re5-exam-prep"],
  },
  {
    id: "code-suitability",
    name: "Suitable Advice & Record of Advice",
    category: "RE5 / FAIS",
    reviewCard: {
      question: "A client insists, after being warned, on a high-risk product that doesn't match their conservative profile. What must the provider do?",
      options: [
        "Proceed only if it records the instruction and the warnings given",
        "Secretly change the risk profile so it 'fits'",
        "Refuse — the Code bans the sale outright",
        "Proceed and say nothing",
      ],
      correct: 0,
      explanation:
        "Before advising, a provider must do a needs analysis and suitability analysis, and keep a record of advice showing what was considered and why the recommendation suits the client. If a client acts against advice, record the instruction and the warnings given — never falsify the risk profile. Limited-scope advice must be flagged with its limitations and risks.",
    },
    courses: ["re5-exam-prep"],
  },
  {
    id: "code-records-coi",
    name: "Records, Conflicts & Advertising",
    category: "RE5 / FAIS",
    reviewCard: {
      question: "For how long must an FSP keep records of advice and complaints under the General Code?",
      options: ["5 years", "1 year", "3 years", "10 years"],
      correct: 0,
      explanation:
        "The standard record-retention period is five years. Every FSP must also maintain a Conflict of Interest (COI) management policy to identify, avoid or mitigate, and disclose conflicts. It may not pay a financial interest that rewards quantity of business over quality, or steer to a particular supplier. Adverts must not be misleading.",
    },
    courses: ["re5-exam-prep"],
  },
  {
    id: "tcf-complaints",
    name: "TCF & Internal Complaints",
    category: "RE5 / FAIS",
    reviewCard: {
      question: "TCF Outcome 6 is about ensuring customers:",
      options: [
        "Face no unreasonable post-sale barriers to switch, claim or complain",
        "Are guaranteed product returns",
        "Generate maximum commission",
        "Never complain at all",
      ],
      correct: 0,
      explanation:
        "Treating Customers Fairly has six outcomes: fair dealing, suitable product design, clear information, suitable advice, products performing as expected, and (Outcome 6) no unreasonable post-sale barriers to switching, claiming or complaining. FSPs must run a documented internal complaints procedure and tell clients of their right to escalate to the FAIS Ombud.",
    },
    courses: ["re5-exam-prep"],
  },
  {
    id: "fais-ombud",
    name: "The FAIS Ombud",
    category: "RE5 / FAIS",
    reviewCard: {
      question: "What is the FAIS Ombud's maximum award for a single complaint?",
      options: [
        "R3.5 million (raised from R800 000 on 1 July 2024)",
        "R800 000",
        "R1 million",
        "Unlimited",
      ],
      correct: 0,
      explanation:
        "The FAIS Ombud resolves client complaints against FSPs and can make a determination with the effect of a court order, up to R3.5 million (raised from R800 000 on 1 July 2024). Process: complain to the FSP first (six weeks to resolve), then six months to refer to the Ombud. The Ombud may decline matters older than three years, or already before a court.",
    },
    courses: ["re5-exam-prep"],
  },
  {
    id: "fica",
    name: "FICA & Anti-Money-Laundering",
    category: "RE5 / FAIS",
    reviewCard: {
      question: "You suspect a client's cash deposits are the proceeds of crime. Under FICA you must:",
      options: [
        "File a suspicious transaction report with the FIC — and not tip off the client",
        "Ask the client to explain first",
        "Report it to the FSCA instead",
        "Close the account and delete the records",
      ],
      correct: 0,
      explanation:
        "Many FSPs are 'accountable institutions' under FICA: they must do customer due diligence (KYC), keep a Risk Management and Compliance Programme (RMCP), report suspicious/unusual and large cash transactions to the FIC, and keep records for five years. 'Tipping off' a client about a report is a criminal offence.",
    },
    courses: ["re5-exam-prep"],
  },

  // ── Money Basics (extras) ─────────────────────────────────────────────────
  {
    id: "zero-based-budget",
    name: "Zero-Based Budgeting",
    category: "Budgeting",
    reviewCard: {
      question: "In zero-based budgeting, what should income minus all your allocations equal?",
      options: [
        "Exactly R0 — every rand is assigned a job, including savings",
        "Whatever's left over as spending money",
        "At least R500 as a buffer",
        "A negative number you cover with credit",
      ],
      correct: 0,
      explanation:
        "Zero-based budgeting gives every rand a purpose before the month starts — rent, food, debt and savings are all categories that must add up to your full net income. 'Zero left over' doesn't mean spend everything; money assigned to savings and investments is allocated, not spent.",
    },
    courses: ["money-basics"],
  },
  {
    id: "personal-cash-flow",
    name: "Personal Cash Flow",
    category: "Budgeting",
    reviewCard: {
      question: "A person earning R180 000/month spends R185 000/month. What's their cash flow?",
      options: [
        "Negative — they're going backwards despite a high income",
        "Strongly positive because they earn a lot",
        "Zero, and perfectly fine",
        "Irrelevant at high incomes",
      ],
      correct: 0,
      explanation:
        "Cash flow is income minus expenses. Negative cash flow destroys wealth at any income — R180k earned, R185k spent is −R5k a month. Most money problems are spending problems, not income problems, and cutting expenses improves cash flow immediately and is fully in your control.",
    },
    courses: ["money-basics"],
  },
  {
    id: "salary-negotiation",
    name: "Negotiating Your Salary",
    category: "Income & Career",
    reviewCard: {
      question: "You're offered R45 000 but market rate for the role is R52 000–R58 000. Best move?",
      options: [
        "Present your market research and propose about R54 000",
        "Accept quietly — you're lucky to be offered",
        "Demand R70 000 as a shock anchor",
        "Wait until after you start to raise it",
      ],
      correct: 0,
      explanation:
        "Most employers build negotiation room into offers and expect a respectful, data-backed counter. Proposing mid-market (≈R54k) with research behind it is professional, not greedy — and a single conversation can add R100k+ a year permanently. Your salary is the biggest financial lever you have.",
    },
    courses: ["money-basics"],
  },
  {
    id: "financial-goals",
    name: "Setting Financial Goals",
    category: "Budgeting",
    reviewCard: {
      question: "Which is the best-written financial goal?",
      options: [
        "Invest R1 500/month into a JSE ETF for 5 years to fund my MBA by 2029",
        "Save more money this year",
        "Get rich by 40",
        "Stop wasting money",
      ],
      correct: 0,
      explanation:
        "A real goal has a specific amount, a vehicle, a deadline and a reason — 'save more' is a wish. Reverse-engineer big goals into a monthly number (R60 000 in 12 months = R5 000/month) and keep short-, medium- and long-term goals in separate accounts so you don't raid one for another.",
    },
    courses: ["money-basics"],
  },
  {
    id: "side-income",
    name: "Building Side Income",
    category: "Income & Career",
    reviewCard: {
      question: "For a qualified professional, which side income has the highest margin and lowest startup cost?",
      options: [
        "Freelancing in your existing professional skill",
        "Opening a physical retail store",
        "Reselling at flea markets",
        "Renting out a delivery vehicle",
      ],
      correct: 0,
      explanation:
        "Freelancing uses credentials you've already paid for, at near-zero startup cost. A single client at R4 000–R6 000/month meaningfully changes your finances — and fully invested in a TFSA it compounds tax-free. Remember: all side income is taxable, and non-salary income over R30 000 means registering for provisional tax.",
    },
    courses: ["money-basics"],
  },
  {
    id: "money-conversations",
    name: "Talking About Money",
    category: "Financial Wellbeing",
    reviewCard: {
      question: "You're getting married and discover your partner has R80 000 of undisclosed credit-card debt. Best approach?",
      options: [
        "Full disclosure of income, debts and assets, with a joint plan to tackle it",
        "Deal with it quietly after the wedding",
        "Secretly pay it off as a gift",
        "Ignore it — money is private",
      ],
      correct: 0,
      explanation:
        "Money silence is a top source of relationship conflict and costly mistakes. Full financial transparency before big commitments — plus a shared 'family document register' (accounts, policies, will location, beneficiaries) — prevents hidden debt becoming a shared crisis and avoids chaos when an emergency or death strikes.",
    },
    courses: ["money-basics"],
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

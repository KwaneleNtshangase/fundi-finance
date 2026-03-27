export type LessonStep =
  | {
      type: "info";
      title: string;
      content: string;
    }
  | {
      type: "mcq" | "scenario";
      title?: string;
      question: string;
      options: string[];
      correct: number;
      feedback: { correct: string; incorrect: string };
      content?: string;
    }
  | {
      type: "true-false";
      statement: string;
      correct: boolean;
      feedback: { correct: string; incorrect: string };
    }
  | {
      type: "fill-blank";
      title?: string;
      prompt: string;
      correct: number;
      explanation?: string;
      feedback?: { correct: string; incorrect: string };
    };

export type Lesson = {
  id: string;
  title: string;
  comingSoon?: boolean;
  steps?: LessonStep[];
};

export type Unit = {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
};

export type Course = {
  id: string;
  title: string;
  description: string;
  icon: string;
  units: Unit[];
};

export const CONTENT_DATA: { courses: Course[] } = {
  courses: [
    // ─────────────────────────────────────────────────────────────────────────
    // MONEY BASICS
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: "money-basics",
      title: "Money Basics",
      description: "Master the fundamentals of personal finance, from inflation to budgeting",
      icon: "wallet",
      units: [
        {
          id: "unit-1",
          title: "Understanding Money",
          description: "What money is and how it works",
          lessons: [
            {
              id: "lesson-1",
              title: "What is Money?",
              steps: [
                {
                  type: "info",
                  title: "Money is More Than Cash",
                  content: "<p>Money is anything that people agree has value and can be exchanged for goods and services. In South Africa, we use the <strong>Rand (R)</strong> as our currency.</p><p>But money is more than just the notes and coins in your pocket. It includes:</p><ul><li>Cash in your wallet</li><li>Money in your bank account</li><li>Digital payments (like SnapScan or Zapper)</li><li>Even investments like stocks</li></ul>",
                },
                {
                  type: "info",
                  title: "The Three Jobs of Money",
                  content: "<p>Money has three main functions:</p><ul><li><strong>Medium of Exchange:</strong> You can trade money for what you need instead of bartering</li><li><strong>Store of Value:</strong> You can save money today and use it tomorrow</li><li><strong>Unit of Account:</strong> It helps us measure and compare the value of things</li></ul>",
                },
                {
                  type: "mcq",
                  question: "Which of these is NOT one of the three main functions of money?",
                  options: ["Medium of Exchange", "Store of Value", "Making You Happy", "Unit of Account"],
                  correct: 2,
                  feedback: {
                    correct: "Exactly! While money can contribute to happiness, its primary functions are practical: exchange, storage, and measurement.",
                    incorrect: "Not quite. The three functions of money are: medium of exchange, store of value, and unit of account.",
                  },
                },
                {
                  type: "info",
                  title: "Why Money Loses Value",
                  content: "<p>Have you noticed that R100 today doesn't buy as much as it did 5 years ago? That's because of <strong>inflation</strong>.</p><p>Inflation means the general increase in prices over time. In South Africa, the Reserve Bank aims to keep inflation between 3–6% per year.</p><p>This is why keeping cash under your mattress is a bad idea, it loses purchasing power every year!</p>",
                },
                {
                  type: "mcq",
                  question: "If inflation is 5% per year, what happens to R1000 cash kept under your mattress?",
                  options: ["It can buy more things next year", "It stays exactly the same", "It can buy less things next year", "It doubles in value"],
                  correct: 2,
                  feedback: {
                    correct: "Correct! With 5% inflation, your R1000 will only buy what R950 could buy today.",
                    incorrect: "If prices go up 5%, your R1000 buys less than before. That's how inflation erodes cash.",
                  },
                },
                {
                  type: "scenario",
                  question: "Your grandmother gives you R5000. You don't need it right now. What's the smartest move?",
                  options: ["Keep it in cash at home", "Put it in a savings account earning 4% interest", "Spend it immediately", "Give it back"],
                  correct: 1,
                  feedback: {
                    correct: "Smart! A 4% savings account helps protect against inflation while keeping the money accessible.",
                    incorrect: "Keeping cash at home means it loses value to inflation. A savings account is better.",
                  },
                },
              ] satisfies LessonStep[],
            },
            {
              id: "lesson-2",
              title: "Needs vs Wants",
              steps: [
                {
                  type: "info",
                  title: "The Most Important Distinction",
                  content: "<p>Understanding needs vs wants is the foundation of smart money management.</p><p><strong>Needs:</strong> Food, shelter, transport to work, healthcare, basic clothing.</p><p><strong>Wants:</strong> Eating out, latest smartphone, DSTV Premium, designer clothes, a third pair of sneakers.</p>",
                },
                {
                  type: "mcq",
                  question: "Which of these is a NEED, not a want?",
                  options: ["Netflix subscription", "Groceries for the month", "Dinner at a restaurant", "New gaming console"],
                  correct: 1,
                  feedback: {
                    correct: "Absolutely! Food is a fundamental need.",
                    incorrect: "Think carefully: which of these is required for survival?",
                  },
                },
                {
                  type: "info",
                  title: "The 50/30/20 Rule",
                  content: "<p>A simple budgeting framework:</p><ul><li><strong>50% Needs:</strong> Rent, transport, groceries</li><li><strong>30% Wants:</strong> Entertainment, eating out</li><li><strong>20% Savings:</strong> Emergency fund, investments, debt</li></ul><p>If you earn R20,000/month: R10k needs, R6k wants, R4k savings.</p>",
                },
                {
                  type: "scenario",
                  question: "You earn R18,000/month. Needs cost R11,000. You want to save R3,000. How much can you spend on wants?",
                  options: ["R7,000", "R4,000", "R5,000", "R6,000"],
                  correct: 1,
                  feedback: {
                    correct: "Perfect! R18,000 - R11,000 - R3,000 = R4,000 for wants.",
                    incorrect: "R18,000 total - R11,000 needs - R3,000 savings = R4,000 left.",
                  },
                },
                {
                  type: "true-false",
                  statement: "It's okay to upgrade some wants when you earn more, as long as you also increase your savings.",
                  correct: true,
                  feedback: {
                    correct: "Exactly! Balance is the key. Save at least 50% of any raise.",
                    incorrect: "Actually, it's fine to enjoy some of your raise, just make sure savings go up too.",
                  },
                },
              ] satisfies LessonStep[],
            },
            {
              id: "lesson-3",
              title: "Building a Budget",
              steps: [
                {
                  type: "info",
                  title: "Why a Budget Changes Everything",
                  content: "<p>A budget isn't a restriction, it's a plan. Without one, money just disappears. With one, every rand has a job.</p><p>Step 1: Write down your monthly net income.<br/>Step 2: List every fixed expense (rent, insurance, debt payments).<br/>Step 3: List variable expenses (groceries, petrol, airtime).<br/>Step 4: Whatever's left = your discretionary money.</p>",
                },
                {
                  type: "mcq",
                  question: "What should you base your budget on?",
                  options: ["Your gross salary", "Your net (take-home) salary", "Your expected bonus", "Your salary from last year"],
                  correct: 1,
                  feedback: {
                    correct: "Always budget on net salary, the money that actually reaches your account.",
                    incorrect: "Never budget on gross. Deductions happen before you see a cent.",
                  },
                },
                {
                  type: "true-false",
                  statement: "Fixed expenses like rent and insurance should be paid before anything else.",
                  correct: true,
                  feedback: {
                    correct: "Correct. Non-negotiable expenses first, then budget the rest.",
                    incorrect: "Fixed expenses are non-negotiable. They must be covered first.",
                  },
                },
              ] satisfies LessonStep[],
            },
            {
              id: "lesson-4",
              title: "Tracking Your Spending",
              comingSoon: true,
            },
          ],
        },
        {
          id: "unit-2",
          title: "Smart Shopping",
          description: "Make your money go further",
          lessons: [
            {
              id: "lesson-5",
              title: "Comparing Prices",
              steps: [
                {
                  type: "info",
                  title: "The R10 Rule",
                  content: "<p>Before any purchase, ask: could I find this cheaper somewhere else in under 2 minutes? Apps like PriceCheck and Google Shopping make this easy.</p><p>On a R500 grocery shop, even 10% savings = R50. Over a year = R600. That's a real emergency fund contribution.</p>",
                },
                {
                  type: "true-false",
                  statement: "Buying in bulk is always cheaper than buying single items.",
                  correct: false,
                  feedback: {
                    correct: "Correct, bulk is often cheaper per unit, but if you waste what you buy, you lose money.",
                    incorrect: "Not always. If you overbuy and waste, bulk buying costs more. Always check the per-unit price.",
                  },
                },
              ] satisfies LessonStep[],
            },
            {
              id: "lesson-6",
              title: "Avoiding Impulse Buys",
              comingSoon: true,
            },
          ],
        },
      ],
    },

    // ─────────────────────────────────────────────────────────────────────────
    // SALARY & PAYSLIP
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: "salary-payslip",
      title: "Salary & Payslip",
      description: "Understand your payslip, deductions, and take-home pay",
      icon: "briefcase",
      units: [
        {
          id: "unit-1",
          title: "Understanding Your Payslip",
          description: "Decode all those numbers and acronyms",
          lessons: [
            {
              id: "lesson-1",
              title: "Gross vs Net Pay",
              steps: [
                {
                  type: "info",
                  title: "The Salary Shock",
                  content: "<p>Your first payslip can be shocking. You were promised R25,000 but only R18,500 arrives. Where did R6,500 go?</p><p><strong>Gross salary:</strong> The total before deductions.<br/><strong>Net salary:</strong> What you actually receive.</p>",
                },
                {
                  type: "info",
                  title: "The Big One: PAYE",
                  content: "<p><strong>PAYE (Pay As You Earn)</strong> is income tax deducted monthly. South Africa uses progressive tax, the more you earn, the higher the rate.</p><ul><li>First ~R95,750/year: 0%</li><li>Up to ~R237,100: 18%</li><li>Up to ~R370,500: 26%</li></ul><p><em>Thresholds change annually, this is illustrative.</em></p>",
                },
                {
                  type: "mcq",
                  question: "Why does South Africa use a progressive tax system?",
                  options: ["To punish high earners", "So those who earn more contribute more to public services", "To make everyone earn the same", "Because it's easier to calculate"],
                  correct: 1,
                  feedback: {
                    correct: "Exactly, those with higher incomes contribute a larger share to healthcare, education, and infrastructure.",
                    incorrect: "Progressive tax is about fairness: higher earners contribute more to public services.",
                  },
                },
                {
                  type: "info",
                  title: "UIF, Your Safety Net",
                  content: "<p><strong>UIF (Unemployment Insurance Fund)</strong> is 1% of your salary (matched by your employer) that helps if you lose your job, go on maternity leave, or need illness benefits.</p><p>Example: R20,000 salary → you pay R200, employer pays R200 = R400/month into a fund you can claim from later.</p>",
                },
                {
                  type: "scenario",
                  question: "Your payslip: Gross R30,000 | PAYE R4,500 | UIF R300 | Medical Aid R2,200 | Pension R3,000. What's your net pay?",
                  options: ["R30,000", "R25,500", "R20,000", "R23,700"],
                  correct: 2,
                  feedback: {
                    correct: "Correct! R30,000 - R4,500 - R300 - R2,200 - R3,000 = R20,000.",
                    incorrect: "Add all deductions: R4,500 + R300 + R2,200 + R3,000 = R10,000. R30,000 - R10,000 = R20,000.",
                  },
                },
                {
                  type: "true-false",
                  statement: "You should always budget based on your gross salary.",
                  correct: false,
                  feedback: {
                    correct: "Correct! Always budget on NET. You can't spend money that's already been deducted.",
                    incorrect: "Never budget on gross. Your budget must reflect what actually lands in your account.",
                  },
                },
              ] satisfies LessonStep[],
            },
            {
              id: "lesson-2",
              title: "Understanding PAYE",
              steps: [
                {
                  type: "info",
                  title: "How PAYE Is Calculated",
                  content: "<p>PAYE is calculated on your annual income using SARS tax brackets. Your employer deducts it monthly so you don't owe a lump sum at year-end.</p><p>You can reduce PAYE legally by contributing to a Retirement Annuity (RA), contributions are tax-deductible up to 27.5% of income.</p>",
                },
                {
                  type: "mcq",
                  question: "How can you legally reduce the amount of PAYE you pay?",
                  options: ["Work fewer hours", "Contribute to a Retirement Annuity (RA)", "Ask your employer nicely", "Move to a different province"],
                  correct: 1,
                  feedback: {
                    correct: "RA contributions are tax-deductible, this is one of the most powerful legal tax tools available to South Africans.",
                    incorrect: "Contributing to a Retirement Annuity (RA) is one of the best legal ways to reduce your PAYE.",
                  },
                },
                {
                  type: "true-false",
                  statement: "Your employer is legally required to deduct PAYE from your salary every month.",
                  correct: true,
                  feedback: {
                    correct: "Correct. PAYE is a statutory requirement, employers have no choice.",
                    incorrect: "PAYE deduction is mandatory by law. Employers must deduct and pay it to SARS monthly.",
                  },
                },
              ] satisfies LessonStep[],
            },
            {
              id: "lesson-3",
              title: "UIF and SDL Explained",
              comingSoon: true,
            },
            {
              id: "lesson-4",
              title: "Retirement Contributions",
              comingSoon: true,
            },
          ],
        },
      ],
    },

    // ─────────────────────────────────────────────────────────────────────────
    // BANKING & DEBIT ORDERS
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: "banking-debit",
      title: "Banking & Debit Orders",
      description: "Master bank fees, debit orders, and disputes",
      icon: "building-2",
      units: [
        {
          id: "unit-1",
          title: "Banking Basics",
          description: "How banks work and how to choose one",
          lessons: [
            {
              id: "lesson-1",
              title: "Choosing a Bank Account",
              steps: [
                {
                  type: "info",
                  title: "Not All Bank Accounts Are Equal",
                  content: "<p>In South Africa you have several options: Capitec, FNB, Standard Bank, Absa, Nedbank, TymeBank, Discovery Bank.</p><p>Key things to compare:</p><ul><li><strong>Monthly fee:</strong> Some charge R0, others R150+</li><li><strong>Transaction fees:</strong> Cost per swipe, withdrawal, EFT</li><li><strong>Interest on positive balance</strong></li><li><strong>App quality</strong></li></ul>",
                },
                {
                  type: "mcq",
                  question: "Which factor is most important when choosing a bank account for everyday use?",
                  options: ["The colour of the card", "Total monthly fees and transaction costs", "How many branches there are", "Whether your friends use the same bank"],
                  correct: 1,
                  feedback: {
                    correct: "Exactly. Over a year, the difference between a R0 and R150/month account is R1,800, a meaningful amount.",
                    incorrect: "Fees matter most. R150/month in bank charges is R1,800/year you could be saving.",
                  },
                },
                {
                  type: "true-false",
                  statement: "TymeBank and Capitec typically charge lower monthly fees than traditional big four banks.",
                  correct: true,
                  feedback: {
                    correct: "Correct. Digital-first banks like TymeBank often have zero monthly fees.",
                    incorrect: "Actually, TymeBank and Capitec are known for significantly lower fees than traditional banks.",
                  },
                },
              ] satisfies LessonStep[],
            },
            {
              id: "lesson-2",
              title: "Understanding Bank Fees",
              steps: [
                {
                  type: "info",
                  title: "Where Your Money Leaks",
                  content: "<p>Bank fees are silent killers. Common ones:</p><ul><li><strong>Monthly admin fee:</strong> R0–R200</li><li><strong>ATM withdrawal:</strong> R5–R15 per transaction</li><li><strong>Card swipe:</strong> Free or R2–R5</li><li><strong>Declined transaction:</strong> R5–R15 (yes, you pay even when it fails!)</li></ul><p>Switch to tap-to-pay to minimize transaction fees.</p>",
                },
                {
                  type: "mcq",
                  question: "Which habit increases your bank fees the most?",
                  options: ["Using tap-to-pay at till points", "Withdrawing small amounts frequently from ATMs", "Getting your salary paid in", "Checking your balance on the app"],
                  correct: 1,
                  feedback: {
                    correct: "Frequent small ATM withdrawals stack up fast. Withdraw once a week in a larger amount instead.",
                    incorrect: "Frequent ATM withdrawals are one of the biggest fee drains. Each one costs R5–R15.",
                  },
                },
              ] satisfies LessonStep[],
            },
            {
              id: "lesson-3",
              title: "Digital Banking",
              comingSoon: true,
            },
          ],
        },
        {
          id: "unit-2",
          title: "Debit Orders",
          description: "Control your automatic payments",
          lessons: [
            {
              id: "lesson-4",
              title: "How Debit Orders Work",
              steps: [
                {
                  type: "info",
                  title: "What Is a Debit Order?",
                  content: "<p>A debit order is a pre-authorised instruction that allows a company to deduct money from your account on a fixed date.</p><p>Common debit orders: insurance premiums, gym memberships, subscriptions, loan repayments.</p><p><strong>Two types:</strong><br/>• <strong>NAEDO/DebiCheck:</strong> Requires your upfront digital confirmation, more protection for you.<br/>• <strong>Early Debit Orders:</strong> Run first thing in the morning, before other payments.</p>",
                },
                {
                  type: "true-false",
                  statement: "You can be charged a penalty fee by your bank if a debit order bounces due to insufficient funds.",
                  correct: true,
                  feedback: {
                    correct: "Correct, bounced debit orders cost you bank fees AND can damage your credit record.",
                    incorrect: "Yes, bounced debit orders trigger bank penalties and harm your credit score.",
                  },
                },
              ] satisfies LessonStep[],
            },
            {
              id: "lesson-5",
              title: "Stopping Debit Orders",
              comingSoon: true,
            },
            {
              id: "lesson-6",
              title: "Disputing Unauthorized Debits",
              comingSoon: true,
            },
          ],
        },
      ],
    },

    // ─────────────────────────────────────────────────────────────────────────
    // CREDIT & DEBT
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: "credit-debt",
      title: "Credit & Debt",
      description: "Understand credit scores, interest, and how to escape debt",
      icon: "credit-card",
      units: [
        {
          id: "unit-1",
          title: "Understanding Credit",
          description: "How credit works in South Africa",
          lessons: [
            {
              id: "lesson-1",
              title: "What is a Credit Score?",
              steps: [
                {
                  type: "info",
                  title: "Your Financial Report Card",
                  content: "<p>Your credit score is a number (300–850 in SA) that tells lenders how likely you are to repay debt. The higher the number, the better.</p><p>It's calculated by credit bureaus like TransUnion, Experian, and Compuscan based on:</p><ul><li>Payment history (most important!)</li><li>How much of your credit limit you're using</li><li>Length of credit history</li><li>Types of credit</li><li>New credit applications</li></ul>",
                },
                {
                  type: "mcq",
                  question: "What has the BIGGEST impact on your credit score?",
                  options: ["How many bank accounts you have", "Your payment history", "How much you earn", "Your age"],
                  correct: 1,
                  feedback: {
                    correct: "Payment history is the single biggest factor. Pay on time, every time.",
                    incorrect: "Payment history is king. Missing one payment can drop your score significantly.",
                  },
                },
                {
                  type: "true-false",
                  statement: "Checking your own credit score damages your credit rating.",
                  correct: false,
                  feedback: {
                    correct: "Correct, checking your own score (a 'soft inquiry') has zero impact on your rating.",
                    incorrect: "Checking your own score is a soft inquiry and does NOT affect your rating. Check it regularly at annualcreditreport.co.za or ClearScore.",
                  },
                },
              ] satisfies LessonStep[],
            },
            {
              id: "lesson-2",
              title: "How Interest Works",
              steps: [
                {
                  type: "info",
                  title: "The Price of Borrowed Money",
                  content: "<p>Interest is the cost of borrowing money. It's expressed as an annual percentage rate (APR).</p><p>Example: R10,000 credit card debt at 20% interest per year = R2,000 in interest annually, R167 per month just to stand still.</p><p>The minimum payment trap: paying only the minimum means you'll be in debt for years and pay back far more than you borrowed.</p>",
                },
                {
                  type: "mcq",
                  question: "You have R5,000 on a store card at 24% interest. You only pay the minimum R150/month. What happens?",
                  options: ["You'll pay it off in a few months", "The debt grows because interest exceeds your payment", "The interest stops while you're paying", "The store writes it off after 2 years"],
                  correct: 1,
                  feedback: {
                    correct: "Exactly, at 24% interest on R5,000, you owe about R100/month in interest alone. R150 minimum barely moves the balance.",
                    incorrect: "At 24% interest, R5,000 accrues ~R100/month in interest. A R150 minimum payment only chips away R50. It'll take years.",
                  },
                },
              ] satisfies LessonStep[],
            },
            {
              id: "lesson-3",
              title: "Good Debt vs Bad Debt",
              comingSoon: true,
            },
            {
              id: "lesson-4",
              title: "Store Cards & Credit Cards",
              comingSoon: true,
            },
          ],
        },
        {
          id: "unit-2",
          title: "Escaping Debt",
          description: "Strategies to pay off debt",
          lessons: [
            {
              id: "lesson-5",
              title: "The Debt Snowball Method",
              steps: [
                {
                  type: "info",
                  title: "Small Wins First",
                  content: "<p>The debt snowball method: list all debts smallest to largest, pay minimums on all, throw every extra rand at the smallest debt. When it's gone, roll that payment to the next.</p><p><strong>Why it works:</strong> Each paid-off debt is a win that builds momentum and motivation.</p>",
                },
                {
                  type: "mcq",
                  question: "In the debt snowball method, which debt do you attack first?",
                  options: ["The one with the highest interest rate", "The one with the smallest balance", "The one you've had the longest", "The one your employer knows about"],
                  correct: 1,
                  feedback: {
                    correct: "Correct, smallest balance first builds momentum through quick wins.",
                    incorrect: "Snowball = smallest balance first. It's about psychological wins, not just math.",
                  },
                },
              ] satisfies LessonStep[],
            },
            {
              id: "lesson-6",
              title: "Debt Consolidation",
              comingSoon: true,
            },
          ],
        },
      ],
    },

    // ─────────────────────────────────────────────────────────────────────────
    // EMERGENCY FUND & RISK
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: "emergency-fund",
      title: "Emergency Fund & Risk",
      description: "Build your safety net and manage financial risk",
      icon: "shield",
      units: [
        {
          id: "unit-1",
          title: "Building Your Emergency Fund",
          description: "How much and where to keep it",
          lessons: [
            {
              id: "lesson-1",
              title: "How Much Do You Need?",
              steps: [
                {
                  type: "info",
                  title: "Your Financial Airbag",
                  content: "<p>An emergency fund is 3–6 months of essential living expenses set aside in cash. It covers job loss, medical emergencies, car repairs, without going into debt.</p><p>Example: If your essential monthly expenses are R12,000, your target emergency fund is R36,000–R72,000.</p><p>Start with a mini-goal of R5,000. It protects you from small emergencies immediately.</p>",
                },
                {
                  type: "mcq",
                  question: "How many months of expenses should an emergency fund ideally cover?",
                  options: ["1 month", "3–6 months", "10–12 months", "Just R1,000 is enough"],
                  correct: 1,
                  feedback: {
                    correct: "3–6 months is the standard. More if your income is irregular or you have dependants.",
                    incorrect: "The target is 3–6 months of essential expenses, enough to survive job loss or a major crisis.",
                  },
                },
                {
                  type: "true-false",
                  statement: "You should invest your emergency fund in stocks for higher returns.",
                  correct: false,
                  feedback: {
                    correct: "Correct, emergency funds must be instantly accessible. Stocks can drop 30% right when you need the money most.",
                    incorrect: "Never invest your emergency fund in stocks. It must be instantly accessible in cash or a money market account.",
                  },
                },
              ] satisfies LessonStep[],
            },
            {
              id: "lesson-2",
              title: "Where to Keep Emergency Money",
              steps: [
                {
                  type: "info",
                  title: "The Right Home for Your Safety Net",
                  content: "<p>Your emergency fund needs to be:</p><ul><li><strong>Accessible:</strong> Withdrawable within 1–2 business days</li><li><strong>Safe:</strong> Not subject to market risk</li><li><strong>Earning something:</strong> At least keeping pace with inflation</li></ul><p>Best options in SA: High-interest savings account (Capitec, TymeBank), money market fund (Sygnia, Satrix), or 32-day notice account.</p>",
                },
                {
                  type: "mcq",
                  question: "Which is the BEST place to keep your emergency fund?",
                  options: ["Under your mattress", "In a high-interest savings account", "In a unit trust invested in equities", "With a friend for safekeeping"],
                  correct: 1,
                  feedback: {
                    correct: "A high-interest savings account: safe, accessible, and earns interest.",
                    incorrect: "A high-interest savings account combines safety, accessibility, and growth.",
                  },
                },
              ] satisfies LessonStep[],
            },
            {
              id: "lesson-3",
              title: "When to Use It",
              comingSoon: true,
            },
          ],
        },
        {
          id: "unit-2",
          title: "Managing Financial Risk",
          description: "Protect yourself from financial shocks",
          lessons: [
            {
              id: "lesson-4",
              title: "Types of Financial Risk",
              comingSoon: true,
            },
            {
              id: "lesson-5",
              title: "Risk vs Reward",
              comingSoon: true,
            },
          ],
        },
      ],
    },

    // ─────────────────────────────────────────────────────────────────────────
    // INSURANCE
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: "insurance",
      title: "Insurance & Protection",
      description: "Understand life, disability, and other insurance basics",
      icon: "umbrella",
      units: [
        {
          id: "unit-1",
          title: "Life & Disability Cover",
          description: "Protecting your income and family",
          lessons: [
            {
              id: "lesson-1",
              title: "Why You Need Life Cover",
              steps: [
                {
                  type: "info",
                  title: "What Happens When You're Gone?",
                  content: "<p>Life insurance pays a lump sum to your family if you die. In South Africa, many families fall into poverty because the breadwinner passes away without cover.</p><p><strong>Who needs it:</strong> Anyone with dependants, a spouse, children, or parents who rely on your income.</p><p><strong>How much:</strong> A rule of thumb is 10x your annual salary. So if you earn R300,000/year, aim for R3 million in cover.</p>",
                },
                {
                  type: "mcq",
                  question: "Who most urgently needs life insurance?",
                  options: ["A single 22-year-old with no dependants", "A parent of 3 children with a home loan", "A retiree with savings of R5 million", "A student with no income"],
                  correct: 1,
                  feedback: {
                    correct: "A parent with dependants and debt has the highest need. Their family would be devastated without their income.",
                    incorrect: "The parent with 3 children and a home loan has the most to lose, their family depends entirely on their income.",
                  },
                },
                {
                  type: "true-false",
                  statement: "Life insurance through your employer's group scheme is always enough on its own.",
                  correct: false,
                  feedback: {
                    correct: "Correct, employer cover often ends when you leave the job, and the amount is rarely sufficient.",
                    incorrect: "Employer group cover is a start, but it ends when you change jobs and rarely covers the full amount your family needs.",
                  },
                },
              ] satisfies LessonStep[],
            },
            {
              id: "lesson-2",
              title: "Disability Insurance Basics",
              steps: [
                {
                  type: "info",
                  title: "Your Biggest Asset Is Your Ability to Earn",
                  content: "<p>You're far more likely to be disabled than to die young. Disability cover replaces your income if illness or injury stops you from working.</p><p><strong>Two types:</strong><br/>• <strong>Income Protection:</strong> Replaces a % of your monthly income<br/>• <strong>Lump Sum Disability:</strong> Pays once if you're permanently disabled</p><p>Without it, one accident can destroy everything you've built.</p>",
                },
                {
                  type: "mcq",
                  question: "Which type of disability cover replaces your monthly salary if you can't work?",
                  options: ["Life insurance", "Lump sum disability", "Income protection", "Car insurance"],
                  correct: 2,
                  feedback: {
                    correct: "Income protection replaces a percentage of your monthly income during a disability.",
                    incorrect: "Income protection cover is specifically designed to replace monthly income if you cannot work.",
                  },
                },
              ] satisfies LessonStep[],
            },
            {
              id: "lesson-3",
              title: "Dread Disease Cover",
              comingSoon: true,
            },
            {
              id: "lesson-4",
              title: "How Much Cover Do You Need?",
              comingSoon: true,
            },
          ],
        },
        {
          id: "unit-2",
          title: "Short-Term Insurance",
          description: "Car and home insurance",
          lessons: [
            {
              id: "lesson-5",
              title: "Car Insurance Explained",
              steps: [
                {
                  type: "info",
                  title: "The Three Tiers of Car Insurance",
                  content: "<p><strong>1. Comprehensive:</strong> Covers your car plus third-party damage. Most expensive.</p><p><strong>2. Third-Party, Fire & Theft:</strong> Covers others if you cause an accident, plus fire and theft of your own car.</p><p><strong>3. Third-Party Only:</strong> Covers damage you cause to others. Cheapest, and the minimum recommended.</p><p>In SA, driving without any insurance means YOU pay for damage to other people's property out of pocket.</p>",
                },
                {
                  type: "mcq",
                  question: "What does 'third-party' insurance cover?",
                  options: ["Damage to your own car only", "Damage you cause to other people's property or vehicles", "Medical bills for passengers in your car", "Theft of items inside your car"],
                  correct: 1,
                  feedback: {
                    correct: "Third-party covers damage YOU cause to OTHERS, their car, property, or injury claims.",
                    incorrect: "Third-party = damage you cause to other people or their property. Your own car is not covered.",
                  },
                },
              ] satisfies LessonStep[],
            },
            {
              id: "lesson-6",
              title: "Home Insurance Basics",
              comingSoon: true,
            },
          ],
        },
      ],
    },

    // ─────────────────────────────────────────────────────────────────────────
    // INVESTING BASICS
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: "investing-basics",
      title: "Investing Basics",
      description: "Risk, return, diversification, and time horizon",
      icon: "trending-up",
      units: [
        {
          id: "unit-1",
          title: "Investment Fundamentals",
          description: "Core concepts every investor needs",
          lessons: [
            {
              id: "lesson-1",
              title: "Risk vs Return",
              steps: [
                {
                  type: "info",
                  title: "The Golden Rule of Investing",
                  content: "<p>Higher potential return always comes with higher risk. There is no such thing as high return with zero risk, that's a scam.</p><p>The risk spectrum:</p><ul><li><strong>Low risk/low return:</strong> Savings account, money market</li><li><strong>Medium risk/medium return:</strong> Bonds, balanced funds</li><li><strong>High risk/high return:</strong> Shares, ETFs, property</li></ul>",
                },
                {
                  type: "mcq",
                  question: "An investment promises 40% guaranteed returns with zero risk. This is most likely:",
                  options: ["A legitimate opportunity", "A Ponzi scheme or scam", "A government bond", "A unit trust"],
                  correct: 1,
                  feedback: {
                    correct: "Correct, guaranteed high returns with zero risk is the classic scam signal. If it sounds too good to be true, it is.",
                    incorrect: "High guaranteed returns with zero risk = scam. Always. No legitimate investment can guarantee this.",
                  },
                },
                {
                  type: "true-false",
                  statement: "The longer your investment time horizon, the more risk you can generally afford to take.",
                  correct: true,
                  feedback: {
                    correct: "Correct, time smooths out market volatility. A 20-year investor can ride out a crash that would devastate a 1-year investor.",
                    incorrect: "Time is your biggest advantage. Longer horizons allow you to absorb short-term losses and benefit from long-term growth.",
                  },
                },
              ] satisfies LessonStep[],
            },
            {
              id: "lesson-2",
              title: "The Power of Compound Interest",
              steps: [
                {
                  type: "info",
                  title: "The 8th Wonder of the World",
                  content: "<p>Compound interest means you earn interest on your interest. Over time this creates exponential growth.</p><p><strong>Example:</strong><br/>R10,000 at 10% per year:<br/>• Year 1: R11,000<br/>• Year 5: R16,105<br/>• Year 10: R25,937<br/>• Year 20: R67,275<br/>• Year 30: R174,494</p><p>You did nothing after year 1. Time did the work.</p>",
                },
                {
                  type: "mcq",
                  question: "What is the main ingredient that makes compound interest powerful?",
                  options: ["A high salary", "Time", "A financial advisor", "Luck"],
                  correct: 1,
                  feedback: {
                    correct: "Time is everything. Starting 10 years earlier can double or triple your final amount.",
                    incorrect: "Time is the secret ingredient. The earlier you start, the more compound interest works for you.",
                  },
                },
              ] satisfies LessonStep[],
            },
            {
              id: "lesson-3",
              title: "Diversification 101",
              steps: [
                {
                  type: "info",
                  title: "Don't Put All Your Eggs in One Basket",
                  content: "<p>Diversification means spreading your investments across different assets so one bad investment doesn't wipe you out.</p><p><strong>Example of diversified portfolio:</strong></p><ul><li>30% South African shares (JSE ETF)</li><li>30% Global shares (S&P 500 ETF)</li><li>20% Bonds</li><li>10% Property (REIT)</li><li>10% Cash</li></ul>",
                },
                {
                  type: "true-false",
                  statement: "Buying shares in 10 different South African mining companies is good diversification.",
                  correct: false,
                  feedback: {
                    correct: "Correct, owning 10 companies in the same sector and country is NOT diversified. If mining crashes, all 10 fall together.",
                    incorrect: "That's concentration, not diversification. True diversification means different sectors, asset classes, and geographies.",
                  },
                },
              ] satisfies LessonStep[],
            },
            {
              id: "lesson-4",
              title: "Time Horizon Matters",
              comingSoon: true,
            },
          ],
        },
        {
          id: "unit-2",
          title: "Asset Classes",
          description: "Stocks, bonds, property, and cash",
          lessons: [
            {
              id: "lesson-5",
              title: "What Are Stocks?",
              comingSoon: true,
            },
            {
              id: "lesson-6",
              title: "Understanding Bonds",
              comingSoon: true,
            },
          ],
        },
      ],
    },

    // ─────────────────────────────────────────────────────────────────────────
    // SA INVESTMENT VEHICLES
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: "sa-investing",
      title: "SA Investment Vehicles",
      description: "TFSAs, RAs, unit trusts, and ETFs explained",
      icon: "flag",
      units: [
        {
          id: "unit-1",
          title: "Tax-Free Savings (TFSA)",
          description: "Maximize your tax-free allowance",
          lessons: [
            {
              id: "lesson-1",
              title: "TFSA Rules & Limits",
              steps: [
                {
                  type: "info",
                  title: "The Best Legal Tax Break You're Probably Not Using",
                  content: "<p>A Tax-Free Savings Account (TFSA) lets you invest <strong>R36,000 per year</strong> (R500,000 lifetime limit) and pay <strong>zero tax</strong> on interest, dividends, or capital gains.</p><p>Over 30 years, the tax saving can be worth hundreds of thousands of rands.</p><p>Available at: Sygnia, Satrix, Capitec, most major banks and investment platforms.</p>",
                },
                {
                  type: "mcq",
                  question: "What is the annual contribution limit for a South African TFSA?",
                  options: ["R10,000", "R36,000", "R100,000", "R500,000"],
                  correct: 1,
                  feedback: {
                    correct: "R36,000 per year is the annual TFSA limit (as of 2024). The lifetime limit is R500,000.",
                    incorrect: "The annual TFSA limit is R36,000. The lifetime limit is R500,000.",
                  },
                },
                {
                  type: "true-false",
                  statement: "If you don't use your TFSA contribution limit this year, you can add the unused portion to next year's limit.",
                  correct: false,
                  feedback: {
                    correct: "Correct, TFSA limits don't roll over. Use R36,000 or lose that year's allowance forever.",
                    incorrect: "TFSA limits do NOT carry over. Each year is use-it-or-lose-it. Start contributing as early as possible.",
                  },
                },
              ] satisfies LessonStep[],
            },
            {
              id: "lesson-2",
              title: "TFSA vs Regular Savings",
              comingSoon: true,
            },
            {
              id: "lesson-3",
              title: "How to Open a TFSA",
              comingSoon: true,
            },
          ],
        },
        {
          id: "unit-2",
          title: "Retirement Annuities",
          description: "Long-term retirement investing",
          lessons: [
            {
              id: "lesson-4",
              title: "RA Basics",
              steps: [
                {
                  type: "info",
                  title: "Save for Retirement AND Pay Less Tax",
                  content: "<p>A Retirement Annuity (RA) is a long-term investment specifically for retirement. Contributions are <strong>tax-deductible</strong> up to 27.5% of your income (max R350,000/year).</p><p>Example: If you earn R50,000/month and contribute R5,000/month to an RA, you reduce your taxable income by R60,000/year, potentially saving R12,000–R18,000 in tax.</p>",
                },
                {
                  type: "mcq",
                  question: "What is the maximum tax-deductible RA contribution as a percentage of your income?",
                  options: ["10%", "15%", "27.5%", "50%"],
                  correct: 2,
                  feedback: {
                    correct: "27.5% of your income, capped at R350,000/year.",
                    incorrect: "The limit is 27.5% of your income (up to R350,000/year). This is one of the most generous tax breaks in SA.",
                  },
                },
              ] satisfies LessonStep[],
            },
            {
              id: "lesson-5",
              title: "Tax Benefits of RAs",
              comingSoon: true,
            },
            {
              id: "lesson-6",
              title: "Unit Trusts & ETFs",
              comingSoon: true,
            },
          ],
        },
      ],
    },

    // ─────────────────────────────────────────────────────────────────────────
    // PROPERTY & BIG PURCHASES
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: "property",
      title: "Property & Big Purchases",
      description: "Home loans, affordability, and hidden costs",
      icon: "home",
      units: [
        {
          id: "unit-1",
          title: "Buying Your First Home",
          description: "From deposit to bond approval",
          lessons: [
            {
              id: "lesson-1",
              title: "How Much House Can You Afford?",
              steps: [
                {
                  type: "info",
                  title: "The 30% Rule",
                  content: "<p>A common rule: your total housing costs (bond repayment + rates + levy + insurance) should not exceed <strong>30% of your gross income</strong>.</p><p>Example: Gross salary R40,000/month → maximum housing costs R12,000/month.</p><p>Banks typically lend up to 30% of gross income. But just because the bank approves it doesn't mean it's affordable for YOU.</p>",
                },
                {
                  type: "mcq",
                  question: "You earn R35,000 gross per month. Using the 30% rule, what's the maximum you should spend on housing?",
                  options: ["R7,000", "R10,500", "R15,000", "R35,000"],
                  correct: 1,
                  feedback: {
                    correct: "R35,000 × 30% = R10,500. That covers bond repayment, rates, levy, and insurance combined.",
                    incorrect: "30% of R35,000 = R10,500. This must cover ALL housing costs, not just the bond.",
                  },
                },
                {
                  type: "true-false",
                  statement: "If a bank approves your home loan, it means the repayment is definitely affordable for you.",
                  correct: false,
                  feedback: {
                    correct: "Correct, banks approve based on their risk, not your comfort. Many people get approved for more than they can comfortably repay.",
                    incorrect: "Banks approve based on their lending criteria, not your lifestyle. Always stress-test the repayment against rate increases.",
                  },
                },
              ] satisfies LessonStep[],
            },
            {
              id: "lesson-2",
              title: "Understanding Home Loans",
              comingSoon: true,
            },
            {
              id: "lesson-3",
              title: "Deposit Requirements",
              comingSoon: true,
            },
            {
              id: "lesson-4",
              title: "Hidden Costs of Homeownership",
              comingSoon: true,
            },
          ],
        },
        {
          id: "unit-2",
          title: "Rent vs Buy",
          description: "Making the right choice",
          lessons: [
            {
              id: "lesson-5",
              title: "When Renting Makes Sense",
              comingSoon: true,
            },
            {
              id: "lesson-6",
              title: "True Cost Comparison",
              comingSoon: true,
            },
          ],
        },
      ],
    },

    // ─────────────────────────────────────────────────────────────────────────
    // TAXES
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: "taxes",
      title: "Taxes for Individuals",
      description: "Tax thresholds, filing, and deductions",
      icon: "file-text",
      units: [
        {
          id: "unit-1",
          title: "Income Tax Basics",
          description: "How SARS taxes you",
          lessons: [
            {
              id: "lesson-1",
              title: "Tax Brackets Explained",
              steps: [
                {
                  type: "info",
                  title: "How SARS Taxes Your Income",
                  content: "<p>South Africa uses marginal tax brackets. You only pay the higher rate on income ABOVE each threshold, not on your entire salary.</p><p>Common mistake: thinking a raise will push you into a higher bracket and leave you worse off. This is impossible, you always keep more by earning more.</p><p>Key threshold: The primary rebate means if you earn less than ~R95,750/year, you pay zero income tax.</p>",
                },
                {
                  type: "true-false",
                  statement: "Getting a raise that pushes you into a higher tax bracket can result in you taking home less money.",
                  correct: false,
                  feedback: {
                    correct: "Correct, you only pay the higher rate on the portion above the threshold. A raise always increases your take-home pay.",
                    incorrect: "This is a common myth. The higher rate only applies to income ABOVE the bracket threshold. A raise always means more take-home.",
                  },
                },
                {
                  type: "mcq",
                  question: "If you earn R90,000 per year in South Africa, how much income tax do you pay?",
                  options: ["About R16,000", "About R8,000", "Zero, you're below the tax threshold", "Exactly 18% of R90,000"],
                  correct: 2,
                  feedback: {
                    correct: "Correct, the 2024/25 tax threshold is approximately R95,750. Below that, you pay zero income tax.",
                    incorrect: "If your income is below the annual tax threshold (~R95,750 in 2024/25), you owe zero income tax.",
                  },
                },
              ] satisfies LessonStep[],
            },
            {
              id: "lesson-2",
              title: "When You Must File",
              comingSoon: true,
            },
            {
              id: "lesson-3",
              title: "Common Tax Deductions",
              comingSoon: true,
            },
            {
              id: "lesson-4",
              title: "Tax Certificates & IRP5",
              comingSoon: true,
            },
          ],
        },
        {
          id: "unit-2",
          title: "Other Taxes",
          description: "VAT, CGT, and more",
          lessons: [
            {
              id: "lesson-5",
              title: "Understanding VAT",
              comingSoon: true,
            },
            {
              id: "lesson-6",
              title: "Capital Gains Tax Basics",
              comingSoon: true,
            },
          ],
        },
      ],
    },

    // ─────────────────────────────────────────────────────────────────────────
    // SCAMS & FRAUD
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: "scams-fraud",
      title: "Scams & Fraud",
      description: "Protect yourself from financial fraud",
      icon: "siren",
      units: [
        {
          id: "unit-1",
          title: "Common Scams",
          description: "Recognize and avoid them",
          lessons: [
            {
              id: "lesson-1",
              title: "Phishing & Email Scams",
              steps: [
                {
                  type: "info",
                  title: "The Most Dangerous Scam in Your Inbox",
                  content: "<p>Phishing is when criminals send fake emails pretending to be your bank, SARS, or a trusted company. Their goal: get you to click a link and enter your details.</p><p><strong>Red flags:</strong></p><ul><li>Urgent language: 'Your account will be closed in 24 hours!'</li><li>Generic greeting: 'Dear Customer' instead of your name</li><li>Suspicious sender: absa.support@gmail.com is NOT Absa</li><li>Links that look slightly wrong: www.absa-secure.co.za</li></ul>",
                },
                {
                  type: "mcq",
                  question: "You receive an email from 'fnb-security@gmail.com' saying your account is frozen. What do you do?",
                  options: ["Click the link immediately to unfreeze your account", "Reply with your ID number to verify", "Call FNB directly on the number from their official website", "Forward it to all your contacts as a warning"],
                  correct: 2,
                  feedback: {
                    correct: "Always go directly to the source. FNB's official number is on their website and the back of your card, use that.",
                    incorrect: "Never click links in suspicious emails. Always contact your bank directly using numbers from their official website.",
                  },
                },
                {
                  type: "true-false",
                  statement: "Your bank will sometimes ask for your full PIN or online banking password via email.",
                  correct: false,
                  feedback: {
                    correct: "Correct, NO legitimate bank EVER asks for your PIN, password, or OTP via email. Ever.",
                    incorrect: "No legitimate bank will ever ask for your PIN, full password, or OTP via email. This is always a scam.",
                  },
                },
              ] satisfies LessonStep[],
            },
            {
              id: "lesson-2",
              title: "SIM Swap Fraud",
              steps: [
                {
                  type: "info",
                  title: "How Criminals Hijack Your Phone Number",
                  content: "<p>SIM swap fraud: a criminal calls your mobile network, pretends to be you, and gets your number transferred to a SIM they control. Now all your OTPs go to them.</p><p><strong>How to protect yourself:</strong></p><ul><li>Set a SIM swap PIN/RICA PIN with your network provider</li><li>If your phone suddenly loses signal, call your network immediately</li><li>Use an authenticator app (Google Authenticator) instead of SMS OTPs where possible</li></ul>",
                },
                {
                  type: "mcq",
                  question: "Your phone suddenly shows 'No Service' on a normal day. What should you do first?",
                  options: ["Wait for it to come back on its own", "Call your network provider immediately from another phone", "Restart your phone a few times", "Post about it on social media"],
                  correct: 1,
                  feedback: {
                    correct: "Unexpected loss of signal is a SIM swap warning sign. Call your network immediately from a different phone.",
                    incorrect: "Sudden loss of service can mean a SIM swap is in progress. Call your network immediately from another phone.",
                  },
                },
              ] satisfies LessonStep[],
            },
            {
              id: "lesson-3",
              title: "Fake Investment Schemes",
              comingSoon: true,
            },
            {
              id: "lesson-4",
              title: "Romance & Social Media Scams",
              comingSoon: true,
            },
          ],
        },
        {
          id: "unit-2",
          title: "Red Flags",
          description: "Spotting too-good-to-be-true offers",
          lessons: [
            {
              id: "lesson-5",
              title: "Guaranteed Returns Red Flag",
              comingSoon: true,
            },
            {
              id: "lesson-6",
              title: "What to Do If Scammed",
              comingSoon: true,
            },
          ],
        },
      ],
    },

    // ─────────────────────────────────────────────────────────────────────────
    // BIBLE & MONEY
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: "bible-money",
      title: "Money & the Bible",
      description: "What Scripture says about wealth, generosity, and stewardship.",
      icon: "book-open",
      units: [
        {
          id: "stewardship",
          title: "Stewardship",
          description: "Managing what God has given you.",
          lessons: [
            {
              id: "what-is-stewardship",
              title: "What Is Stewardship?",
              steps: [
                {
                  type: "info",
                  title: "You Are a Manager, Not an Owner",
                  content: "<p>Psalm 24:1, <em>The earth is the Lord's, and everything in it.</em> Biblical finance starts here: everything belongs to God. We are managers of His resources, not the owners.</p><p>This shifts the question from 'What do I want to do with my money?' to 'What does God want me to do with what He has entrusted to me?'</p>",
                },
                {
                  type: "mcq",
                  question: "According to Psalm 24:1, who owns everything?",
                  options: ["You", "The government", "God", "Your employer"],
                  correct: 2,
                  feedback: {
                    correct: "Exactly. This shifts how you think about spending, saving, and giving.",
                    incorrect: "Psalm 24:1 says 'The earth is the Lord's, and everything in it.' We are stewards, not owners.",
                  },
                },
                {
                  type: "info",
                  title: "Faithful with Little",
                  content: "<p>Luke 16:10, <em>Whoever can be trusted with very little can also be trusted with much.</em></p><p>Biblical stewardship isn't just for the wealthy. How you handle R500 reveals what you'd do with R5 million. Faithfulness with money starts with the small decisions you make today.</p>",
                },
                {
                  type: "true-false",
                  statement: "The Bible teaches that money itself is evil.",
                  correct: false,
                  feedback: {
                    correct: "Correct, 1 Timothy 6:10 says the LOVE of money is the root of all kinds of evil. Money itself is a tool, neutral in itself.",
                    incorrect: "1 Timothy 6:10 says 'the love of money is the root of all kinds of evil', not money itself. Money is a tool; the heart behind it is what matters.",
                  },
                },
              ] satisfies LessonStep[],
            },
            {
              id: "proverbs-money",
              title: "Proverbs on Money",
              steps: [
                {
                  type: "info",
                  title: "Ancient Wisdom, Modern Application",
                  content: "<p>Proverbs 21:20, <em>The wise store up choice food and olive oil, but fools gulp theirs down.</em></p><p>In modern terms: save before you spend. Build reserves. The fool consumes everything immediately; the wise person plans ahead.</p>",
                },
                {
                  type: "mcq",
                  question: "Proverbs 21:20 teaches that wise people:",
                  options: ["Spend everything they earn to enjoy life", "Store up and save resources", "Give everything to others", "Avoid making money"],
                  correct: 1,
                  feedback: {
                    correct: "Saving and planning ahead is a biblical principle, not just a financial one.",
                    incorrect: "The proverb praises those who save and store, in contrast to those who consume everything immediately.",
                  },
                },
                {
                  type: "info",
                  title: "The Ant Principle",
                  content: "<p>Proverbs 6:6-8, <em>Go to the ant, you sluggard; consider its ways and be wise! It has no commander, no overseer or ruler, yet it stores its provisions in summer and gathers its food at harvest.</em></p><p>The ant saves without being told to. It prepares for seasons ahead. This is the spirit of an emergency fund, retirement savings, and consistent investing.</p>",
                },
                {
                  type: "true-false",
                  statement: "According to Proverbs, preparing financially for the future is a sign of wisdom.",
                  correct: true,
                  feedback: {
                    correct: "Exactly, the ant is held up as a model of wisdom specifically because it prepares ahead of time.",
                    incorrect: "Proverbs consistently praises planning and preparation. The ant is celebrated for storing food for the future.",
                  },
                },
              ] satisfies LessonStep[],
            },
          ],
        },
        {
          id: "generosity",
          title: "Generosity",
          description: "Why giving is part of a healthy financial life.",
          lessons: [
            {
              id: "give-first",
              title: "Give First",
              steps: [
                {
                  type: "info",
                  title: "Honour God with Your Wealth",
                  content: "<p>Proverbs 3:9, <em>Honour the Lord with your wealth, with the firstfruits of all your crops.</em></p><p>Giving first is an act of faith and financial discipline. 'Firstfruits' means off the top, not what's left over after everything else.</p>",
                },
                {
                  type: "true-false",
                  statement: "The Bible teaches you should give only after all your expenses are paid.",
                  correct: false,
                  feedback: {
                    correct: "Correct. Proverbs 3:9 says 'firstfruits', give first, not from the leftovers.",
                    incorrect: "'Firstfruits' means the first portion, off the top. Giving from what's left is not the biblical model.",
                  },
                },
                {
                  type: "info",
                  title: "The Generous Person Prospers",
                  content: "<p>Proverbs 11:24-25, <em>One person gives freely, yet gains even more; another withholds unduly, but comes to poverty. A generous person will prosper; whoever refreshes others will be refreshed.</em></p><p>Generosity is not a financial risk, Scripture presents it as a path to flourishing. This doesn't mean giving without wisdom, but that a generous spirit is foundational to a healthy relationship with money.</p>",
                },
                {
                  type: "mcq",
                  question: "What does Proverbs 11:24-25 say about the generous person?",
                  options: ["They will become poor from giving too much", "They will prosper", "They should give only to family", "They must give exactly 10%"],
                  correct: 1,
                  feedback: {
                    correct: "The generous person prospers, generosity and financial health are not opposites in Scripture.",
                    incorrect: "Proverbs 11:25 says 'a generous person will prosper.' Generosity and blessing are connected throughout Scripture.",
                  },
                },
              ] satisfies LessonStep[],
            },
            {
              id: "debt-scripture",
              title: "The Bible on Debt",
              steps: [
                {
                  type: "info",
                  title: "Borrower is Servant to the Lender",
                  content: "<p>Proverbs 22:7, <em>The rich rule over the poor, and the borrower is slave to the lender.</em></p><p>This is not a prohibition on all debt, but a warning about the power dynamic it creates. When you owe money, someone else has a claim on your future income and your freedom.</p>",
                },
                {
                  type: "mcq",
                  question: "According to Proverbs 22:7, what is the relationship between a borrower and a lender?",
                  options: ["They are equal partners", "The borrower is slave to the lender", "The lender serves the borrower", "It depends on the interest rate"],
                  correct: 1,
                  feedback: {
                    correct: "The borrower becomes servant to the lender, a powerful reason to minimize and eliminate debt.",
                    incorrect: "Proverbs 22:7 says the borrower is servant to the lender. Debt limits your freedom.",
                  },
                },
                {
                  type: "true-false",
                  statement: "The Bible teaches that being debt-free is part of financial and personal freedom.",
                  correct: true,
                  feedback: {
                    correct: "Correct, Romans 13:8 says 'Let no debt remain outstanding.' Freedom from debt is a biblical principle of good stewardship.",
                    incorrect: "Romans 13:8, 'Let no debt remain outstanding.' The Bible consistently points toward freedom from financial obligation.",
                  },
                },
              ] satisfies LessonStep[],
            },
          ],
        },
      ],
    },

    // ─────────────────────────────────────────────────────────────────────────
    // MONEY PSYCHOLOGY
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: "money-psychology",
      title: "Money Psychology",
      description: "Behavioral biases and lifestyle inflation",
      icon: "brain",
      units: [
        {
          id: "unit-1",
          title: "Behavioral Biases",
          description: "How your brain tricks you with money",
          lessons: [
            {
              id: "lesson-1",
              title: "Present Bias & Delayed Gratification",
              steps: [
                {
                  type: "info",
                  title: "Why You Choose R100 Now Over R150 Later",
                  content: "<p><strong>Present bias</strong> is the tendency to overvalue immediate rewards over future ones. It's why you know you should save but still spend.</p><p>The famous Stanford marshmallow experiment showed that children who could wait for a second marshmallow went on to have better life outcomes.</p><p>In finance: the person who can delay gratification, buying the cheaper car and investing the difference, tends to build significantly more wealth.</p>",
                },
                {
                  type: "mcq",
                  question: "Present bias explains why people:",
                  options: ["Always make rational financial decisions", "Prefer smaller rewards now over larger rewards later", "Save too much and spend too little", "Are afraid of all financial risk"],
                  correct: 1,
                  feedback: {
                    correct: "Present bias pulls us toward immediate satisfaction, even when waiting would give us more.",
                    incorrect: "Present bias = preferring smaller immediate rewards over larger future ones. It's why saving feels hard.",
                  },
                },
                {
                  type: "true-false",
                  statement: "Automating savings (debit order on payday) is an effective way to overcome present bias.",
                  correct: true,
                  feedback: {
                    correct: "Correct, automation removes the decision. The money moves before you can spend it.",
                    incorrect: "Automation is one of the best tools against present bias, the decision is made once, and the system handles the rest.",
                  },
                },
              ] satisfies LessonStep[],
            },
            {
              id: "lesson-2",
              title: "Anchoring & Sunk Cost Fallacy",
              steps: [
                {
                  type: "info",
                  title: "Two Traps That Cost People Thousands",
                  content: "<p><strong>Anchoring:</strong> When the first price you see affects how you judge all future prices. Example: seeing a R5,000 jacket makes a R2,000 jacket seem 'cheap', even though it's still expensive.</p><p><strong>Sunk cost fallacy:</strong> Continuing something because of money already spent, even when it no longer makes sense. 'I've already paid for the gym membership, so I'll go even though I hate it' vs. 'I've already paid, but I should cancel and stop wasting future months.'</p>",
                },
                {
                  type: "mcq",
                  question: "You paid R8,000 for concert tickets. The day before, you get sick and also get a better offer for that evening. What's the rational decision?",
                  options: ["Go to the concert because you already paid", "Sell the tickets if possible, or stay home and recover, the R8,000 is gone either way", "Never buy concert tickets again", "Ask for a refund because you're sick"],
                  correct: 1,
                  feedback: {
                    correct: "The R8,000 is a sunk cost, spent regardless of what you do next. Only consider future costs and benefits.",
                    incorrect: "The sunk cost fallacy says 'I paid so I must go.' Rational thinking says: the R8,000 is gone. What decision makes sense NOW?",
                  },
                },
              ] satisfies LessonStep[],
            },
            {
              id: "lesson-3",
              title: "Herd Mentality & FOMO",
              comingSoon: true,
            },
            {
              id: "lesson-4",
              title: "Loss Aversion",
              comingSoon: true,
            },
          ],
        },
        {
          id: "unit-2",
          title: "Social & Lifestyle Pressures",
          description: "Resist keeping up with the Joneses",
          lessons: [
            {
              id: "lesson-5",
              title: "Lifestyle Inflation Deep Dive",
              steps: [
                {
                  type: "info",
                  title: "The Silent Wealth Destroyer",
                  content: "<p>Lifestyle inflation: every time your income increases, your spending increases by the same amount. You earn more but never build wealth.</p><p>Example: Sipho earns R20k, spends R19k. Gets promoted to R30k, upgrades apartment, car, subscriptions, now spends R29k. Still saving just R1k.</p><p>The fix: when you get a raise, commit to saving at least 50% of the increase before upgrading anything.</p>",
                },
                {
                  type: "true-false",
                  statement: "Lifestyle inflation only happens to people who are bad with money.",
                  correct: false,
                  feedback: {
                    correct: "Correct, lifestyle inflation is a universal human tendency. Even financially literate people must actively fight it.",
                    incorrect: "Lifestyle inflation affects almost everyone. It's not a character flaw, it's a pattern you have to consciously resist.",
                  },
                },
              ] satisfies LessonStep[],
            },
            {
              id: "lesson-6",
              title: "Social Media & Money Pressure",
              comingSoon: true,
            },
          ],
        },
      ],
    },
    // ── NEW COURSES (PATCH 10) ──────────────────────────────────────────────

    // ────────────────────────────────────────────────────────────────────────
    // RETIREMENT PLANNING
    // ────────────────────────────────────────────────────────────────────────
    {
      id: "retirement",
      title: "Retirement Planning",
      description: "The two-pot system, RAs, and building a retirement that actually works",
      icon: "flag",
      units: [
        {
          id: "unit-1",
          title: "The Two-Pot System",
          description: "South Africa's new retirement framework explained",
          lessons: [
            {
              id: "two-pot-basics",
              title: "What Is the Two-Pot System?",
              steps: [
                { type: "info", title: "The Biggest Retirement Change in 30 Years", content: "<p>From 1 September 2024, every rand you contribute to a pension, provident, or retirement annuity fund is split into two pots. This affects every formal employee in South Africa, roughly 7 million people.</p>" },
                { type: "info", title: "The Two Pots Explained", content: "<p><strong>Savings Pot (1/3):</strong> Access once per tax year (minimum R2,000 withdrawal). Taxed as income when withdrawn. Emergency provision only.</p><p><strong>Retirement Pot (2/3):</strong> Completely locked until retirement age. No exceptions.</p><p><strong>Vested Pot:</strong> Everything before 1 September 2024, old rules still apply.</p>" },
                { type: "mcq", question: "You contribute R3,000/month to your RA. How much goes into the Savings Pot monthly?", options: ["R3,000", "R1,000", "R2,000", "R1,500"], correct: 1, feedback: { correct: "R3,000 ÷ 3 = R1,000 to the Savings Pot. R2,000 to the Retirement Pot.", incorrect: "One third goes to the Savings Pot. R3,000 ÷ 3 = R1,000." } },
                { type: "info", title: "The Tax Catch", content: "<p>Withdrawing from your Savings Pot is taxed as income in that year. If you earn R420,000/year and withdraw R50,000, SARS taxes you on R470,000, costing roughly R15,000–R18,000 in additional tax. This is a last resort, not a bonus account.</p>" },
                { type: "true-false", statement: "You can withdraw from your Savings Pot every month if needed.", correct: false, feedback: { correct: "Only once per tax year, minimum R2,000. It was designed as an emergency provision.", incorrect: "Once per tax year maximum, with a R2,000 minimum withdrawal." } },
                { type: "mcq", question: "Why was the two-pot system introduced?", options: ["To increase government tax revenue", "To stop people from cashing out all retirement savings on resignation", "To force people to invest in government bonds", "To simplify pension fund administration"], correct: 1, feedback: { correct: "90%+ of South Africans previously cashed out their entire retirement savings on resignation. The two-pot protects the Retirement Pot while giving emergency access through the Savings Pot.", incorrect: "The two-pot system protects retirement savings. Previously, 90%+ of people cashed out everything when changing jobs, arriving at retirement with nothing." } },
                { type: "fill-blank", title: "Quick Calculation", prompt: "If you contribute R6,000/month to a pension fund, the Retirement Pot receives R___ per month.", correct: 4000, feedback: { correct: "R6,000 × 2/3 = R4,000 to the Retirement Pot. The other R2,000 goes to the Savings Pot.", incorrect: "Two-thirds of R6,000 = R4,000. The formula is: contribution × 2/3 = Retirement Pot." } },
              ] satisfies LessonStep[],
            },
            {
              id: "how-much-retire",
              title: "How Much Do You Need to Retire?",
              steps: [
                { type: "info", title: "The Replacement Ratio", content: "<p>Financial planners target 70–80% of your final salary as annual retirement income. If you earn R60,000/month, you need R42,000–R48,000/month in retirement. Why less? No more savings contributions, lower work expenses, possibly lower tax.</p>" },
                { type: "info", title: "The 4% Rule", content: "<p>You can sustainably withdraw 4% of your retirement portfolio per year for 30+ years without depleting it.</p><p>Need R360,000/year (R30,000/month)? You need R360,000 ÷ 4% = <strong>R9 million</strong>. Need R240,000/year? R6 million. Need R120,000/year? R3 million.</p>" },
                { type: "fill-blank", title: "4% Rule Calculation", prompt: "You want R20,000/month in retirement. Using the 4% rule, you need R___ million saved. (Enter the number of millions)", correct: 6, feedback: { correct: "R20,000 × 12 = R240,000/year. R240,000 ÷ 0.04 = R6,000,000. You need R6 million.", incorrect: "R20,000/month = R240,000/year. R240,000 ÷ 4% = R6 million." } },
                { type: "mcq", question: "Research shows the minimum contribution rate to retire comfortably (starting at your first job) is:", options: ["5% of income", "10% of income", "15% of income", "25% of income"], correct: 2, feedback: { correct: "15% total (typically 7.5% employee + 7.5% employer in pension funds). Starting late requires 20–30%. Most SA pension funds that default to 7.5% employer + 7.5% employee hit this target.", incorrect: "15% from your first job. Most formal SA pension funds achieve this through employer + employee contributions. Starting after 35 requires 20–25%." } },
                { type: "true-false", statement: "Starting to save 15% of salary at 25 gives a better retirement outcome than saving 30% starting at 40.", correct: true, feedback: { correct: "Correct, 15 extra years of compounding at 15% beats doubling the contribution rate starting 15 years later. Time is the most powerful retirement tool.", incorrect: "Starting at 25 with 15% typically beats starting at 40 with 30%. The 15-year compounding advantage is more powerful than doubling the contribution rate." } },
                { type: "scenario", question: "Nombuso is 42, earns R45,000/month, and has saved nothing. She starts contributing 15% (R6,750/month) at 10% annual return until 65. Approximately what will she have?", options: ["R2.8 million", "R6.8 million", "R14 million", "R1.2 million"], correct: 1, feedback: { correct: "R6,750/month for 23 years at 10% ≈ R6.8 million. At 4% withdrawal that's R272,000/year (R22,667/month). Better than nothing, but starting earlier would have been transformative.", incorrect: "R6,750/month × 23 years at 10% ≈ R6.8 million. This illustrates the cost of starting late, and why every year of delay is expensive." } },
              ] satisfies LessonStep[],
            },
          ],
        },
      ],
    },

    // ────────────────────────────────────────────────────────────────────────
    // THE RAND & EXCHANGE RATES
    // ────────────────────────────────────────────────────────────────────────
    {
      id: "rand-economy",
      title: "The Rand & Your Money",
      description: "Why the rand weakens, how it hits your wallet, and how to protect your wealth",
      icon: "flag",
      units: [
        {
          id: "unit-1",
          title: "The Rand Explained",
          description: "How exchange rates affect everything you buy",
          lessons: [
            {
              id: "why-rand-weakens",
              title: "Why the Rand Weakens",
              steps: [
                { type: "info", title: "A Volatile Emerging Market Currency", content: "<p>The rand is one of the most traded and most volatile emerging market currencies. When global investors get nervous, they sell 'risky' assets, including rand, and buy 'safe' assets like the US dollar. This happens even when nothing has changed inside South Africa.</p>" },
                { type: "info", title: "What Drives Rand Weakness", content: "<ul><li><strong>Load shedding:</strong> Destroys growth forecasts, scares investors</li><li><strong>Political uncertainty:</strong> Unpredictable policy = capital flight</li><li><strong>US Fed rate hikes:</strong> Money moves from SA to USD for better yields</li><li><strong>Trade deficit:</strong> SA imports more than it exports</li><li><strong>FATF greylisting:</strong> Increased friction for foreign investment</li></ul>" },
                { type: "mcq", question: "The US Federal Reserve raises interest rates sharply. What typically happens to the rand?", options: ["Rand strengthens, US growth is good for trade", "Rand weakens, capital flows to USD for better yields", "No effect, markets are independent", "Rand strengthens, investors seek diversification"], correct: 1, feedback: { correct: "Rising US rates pull global capital toward USD. Money exits SA, rand demand drops, and the rand weakens, this is called capital flight.", incorrect: "Rising US rates make USD assets more attractive. Capital leaves SA, reducing rand demand. The rand weakens." } },
                { type: "info", title: "How Rand Weakness Hits Your Budget", content: "<p>Every R1 weakening against the dollar adds roughly R0.20–R0.30 per litre of petrol (crude oil is dollar-priced). Electronics, imported food, flights, and medicine all become more expensive.</p><p>A weaker rand helps SA exporters (mining, agriculture, tourism) but hurts consumers and importers.</p>" },
                { type: "true-false", statement: "A weaker rand is always bad for all South Africans.", correct: false, feedback: { correct: "A weaker rand benefits exporters, SA's mining sector earns dollars and pays costs in rand. A weaker rand increases their rand revenue and employment in mining communities.", incorrect: "A weaker rand hurts importers and consumers but benefits exporters (mining, agriculture, tourism) who earn foreign currency." } },
                { type: "scenario", question: "You invested R100,000 in a Satrix S&P 500 ETF when the rand was R17/$. The rand weakens to R20/$, but US shares didn't move. Your investment is now worth approximately:", options: ["R100,000", "R117,647", "R85,000", "R70,000"], correct: 1, feedback: { correct: "R100,000 ÷ R17 = $5,882. At R20/$: $5,882 × R20 = R117,647. Rand weakness created a 17.6% gain from currency alone, this is why offshore investments hedge against rand depreciation.", incorrect: "R100,000 at R17/$ = $5,882. At R20/$: $5,882 × R20 = R117,647. The rand's weakness boosted rand returns by 17.6% even without any share price movement." } },
                { type: "mcq", question: "Which SA investment provides the best protection against rand depreciation?", options: ["SA government bonds (RSA Retail Bonds)", "A Satrix MSCI World ETF (global equities)", "A fixed deposit at a SA bank", "SA listed property"], correct: 1, feedback: { correct: "Global ETFs give you exposure to foreign currencies. When the rand weakens, your ETF gains in rand terms even if underlying shares haven't moved. This is the most accessible rand hedge for ordinary investors.", incorrect: "Global ETFs provide currency exposure. When rand weakens, foreign-denominated assets gain in rand value. SA bonds, fixed deposits, and local property are fully rand-denominated with no currency protection." } },
              ] satisfies LessonStep[],
            },
          ],
        },
      ],
    },

    // ────────────────────────────────────────────────────────────────────────
    // CRYPTO & DIGITAL ASSETS
    // ────────────────────────────────────────────────────────────────────────
    {
      id: "crypto-basics",
      title: "Crypto & Digital Assets",
      description: "What crypto is, SARS obligations, and how to avoid being scammed",
      icon: "siren",
      units: [
        {
          id: "unit-1",
          title: "Cryptocurrency Explained",
          description: "Education before you invest a cent",
          lessons: [
            {
              id: "what-is-crypto",
              title: "What Is Cryptocurrency?",
              steps: [
                { type: "info", title: "The Technology", content: "<p>Cryptocurrency is digital money secured by cryptography and recorded on a blockchain, a shared public ledger maintained by thousands of computers. No single bank, government, or company controls it.</p><p>Bitcoin (2009) was the first. There are now thousands of cryptocurrencies. Most are worthless. Bitcoin and Ethereum have the longest track records.</p>" },
                { type: "info", title: "What Crypto Is and Isn't", content: "<p><strong>It IS:</strong> A speculative asset class with real (but volatile) historical returns. Taxable in SA, SARS takes its cut.</p><p><strong>It ISN'T:</strong> A guaranteed investment. Anonymous, blockchain is traceable. A replacement for the rand for everyday purchases.</p>" },
                { type: "mcq", question: "Bitcoin has dropped 70–80% in price three times historically, then recovered to new highs each time. This shows:", options: ["Bitcoin is a Ponzi scheme", "High volatility is normal for this asset class, not evidence of fraud", "The blockchain technology failed", "Government manipulation caused each crash"], correct: 1, feedback: { correct: "Large drawdowns are historically normal for Bitcoin (2011, 2014, 2018, 2022) and it has recovered each time. Extreme volatility is the defining characteristic, investors must be prepared for it.", incorrect: "Bitcoin has dropped 70–85% three times and recovered each time. Volatility is the defining feature of the asset class, not evidence of fraud or failure." } },
                { type: "info", title: "SARS and Crypto Tax", content: "<p>SARS is explicit: crypto is a taxable asset. <strong>Capital Gains Tax</strong> applies if you hold and sell (40% of gain included in income). <strong>Income tax</strong> applies if you trade actively. Keep records of every transaction: date, rand value at purchase, rand value at sale. SA exchanges (Luno, VALR) share data with SARS.</p>" },
                { type: "true-false", statement: "Crypto transactions are anonymous, so SARS can't know about your gains.", correct: false, feedback: { correct: "Blockchain is pseudonymous, not anonymous. SA exchanges share transaction data with SARS. Non-disclosure is tax evasion with criminal consequences.", incorrect: "Blockchain is NOT anonymous. SA crypto exchanges (Luno, VALR) share data with SARS. Attempting to hide crypto gains is tax evasion." } },
                { type: "info", title: "SA Crypto Scam Red Flags", content: "<p>South Africa lost over R60 billion to crypto scams. MTI (Mirror Trading International) defrauded over R9 billion. Africrypt took R54 billion. Red flags:</p><ul><li>Any guaranteed monthly returns</li><li>Returns paid in crypto you can't withdraw as rand</li><li>No explanation of trading strategy</li><li>Recruited through church/family groups</li><li>No FSCA licence</li></ul>" },
                { type: "mcq", question: "An investment promises 15% monthly returns in Bitcoin with no explanation of the strategy. This is:", options: ["A legitimate arbitrage desk", "Almost certainly a Ponzi scheme (15% monthly = 435% annually, impossible)", "High risk but potentially legitimate", "Fine if you can verify the Bitcoin payments"], correct: 1, feedback: { correct: "(1.15)^12 = 435% annual return. No legitimate strategy achieves this. This matches the exact promise of MTI, South Africa's largest crypto fraud at R9 billion.", incorrect: "15% monthly compounds to 435% annually. No legitimate investment achieves this. This is the exact profile of every major SA crypto Ponzi scheme." } },
              ] satisfies LessonStep[],
            },
          ],
        },
      ],
    },

    // ────────────────────────────────────────────────────────────────────────
    // BUSINESS FINANCE
    // ────────────────────────────────────────────────────────────────────────
    {
      id: "business-finance",
      title: "Business Finance",
      description: "VAT, provisional tax, cash flow, and the financial foundations every entrepreneur needs",
      icon: "briefcase",
      units: [
        {
          id: "unit-1",
          title: "Running Money Right",
          description: "The financial foundations every entrepreneur needs",
          lessons: [
            {
              id: "business-vs-personal",
              title: "Separate Your Money, Always",
              steps: [
                { type: "info", title: "The Number One Entrepreneur Mistake", content: "<p>Using one bank account for personal and business money is the most common and costly financial mistake SA entrepreneurs make. You can't see if the business is profitable. SARS can claim personal assets for business tax debt. You can't access business loans without separate financials.</p>" },
                { type: "info", title: "Business Account Basics", content: "<p>From day one: open a separate business bank account. Pay yourself a salary from it, don't dip in randomly. Every business expense from the business account. Keep every invoice and receipt, SARS can audit 5 years back.</p>" },
                { type: "true-false", statement: "If your business makes R50,000 profit, you can spend it all as personal income immediately.", correct: false, feedback: { correct: "Business profit belongs to the business until properly distributed as salary or dividend. Random withdrawals create tax complications and make profitability impossible to track.", incorrect: "Business profit is not personal money until properly paid as salary or dividend. Random withdrawals create SARS complications and hide the business's real financial health." } },
                { type: "info", title: "VAT, When You Must Register", content: "<p>VAT registration is mandatory when annual taxable turnover exceeds <strong>R1 million</strong>. You add 15% VAT to invoices, claim back VAT on business expenses, and pay SARS the net amount bi-monthly. The net formula: VAT collected − VAT paid on expenses = amount owed to SARS.</p>" },
                { type: "fill-blank", title: "VAT Calculation", prompt: "You invoice R80,000 (ex-VAT) and paid R6,000 VAT on business expenses. VAT collected = R12,000. You owe SARS R___.", correct: 6000, feedback: { correct: "R12,000 VAT collected − R6,000 VAT paid = R6,000 net to SARS. VAT is a passthrough, you collect and net it.", incorrect: "VAT owed = VAT collected − VAT paid on inputs. R12,000 − R6,000 = R6,000." } },
                { type: "info", title: "Provisional Tax", content: "<p>Self-employed people pay tax twice yearly: end of August and end of February. Under-estimate by more than 20% and SARS charges penalties plus interest.</p><p><strong>Rule of thumb:</strong> Set aside 25–35% of every payment received. This is your future tax bill.</p>" },
                { type: "scenario", question: "Thabo earns R80,000/month consulting (R960,000/year) and spends everything. At year end SARS bills him R280,000. What should he have done?", options: ["Nothing, SARS shouldn't tax self-employed people", "Set aside ~30% monthly (≈R24,000) and paid provisional tax twice yearly", "Registered as a company to avoid tax", "Kept earnings below R95,750 tax threshold"], correct: 1, feedback: { correct: "R960,000 × 30% ≈ R288,000, very close to the actual bill. Provisional tax requires self-employed people to pay estimated tax bi-annually. R80,000/month × 30% = R24,000 set aside monthly.", incorrect: "Self-employed people must pay provisional tax twice yearly. 30% of each payment set aside prevents the catastrophic year-end surprise." } },
              ] satisfies LessonStep[],
            },
          ],
        },
      ],
    },

  ],
};

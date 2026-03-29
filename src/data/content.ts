// Extra lessons & daily facts live in `content-extra.ts` and are merged via `mergeContentExtras.ts`.
import { mergeContentExtras } from "./mergeContentExtras";

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
    }
  | {
      type: "action";
      title: string;
      instruction: string;
      tip?: string;
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

const RAW_COURSES: Course[] = [
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
                  content: "<p>Most people spend 40+ years working and retire with almost nothing. Not because they earned too little — because they never understood the system their money lives in.</p><p>Money has three jobs: <strong>Spend</strong> (survive today), <strong>Save</strong> (protect yourself), <strong>Invest</strong> (build your future). Most South Africans only do the first one — and that's why 77% can't replace a single month's income from savings.</p>",
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
                  content: "<p>If you treat wants like needs, you will feel broke no matter how much you earn. This is not about income — it's about priority.</p><p><strong>Needs</strong> are non-negotiable survival: food, shelter, transport to earn income. <strong>Wants</strong> are everything else. The line between them is where most South African household budgets collapse.</p>",
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
                  content: "<p>Without a budget, money disappears and you never know where it went. With one, every rand has a job — and you stop wondering why you're always short before month-end.</p><p>A budget is not restriction. It's control. Step 1: write your monthly net income. Step 2: list all fixed expenses. Step 3: list variable expenses. Step 4: whatever's left is discretionary — spend it guilt-free because everything important is already covered.</p>",
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
              steps: [
                {
                  type: "info",
                  title: "Every Rand Tells a Story",
                  content:
                    "<p>Lerato in Tembisa thought she spent about R3 500 a month on food. When she tracked every card swipe and cash slip for 30 days, the real number was close to R5 800. The gap was not one big purchase but dozens of small ones: R120 here at a taxi rank, R80 at a spaza, R250 takeaways after late shifts.</p><p>Tracking is not about shame. It is about seeing where money really goes so you can redirect even R500 a month to debt or savings. Use your banking app categories, a simple notebook, or a free spreadsheet. In South Africa where prices move fast, a weekly five-minute check beats a perfect budget you never look at.</p>",
                },
                {
                  type: "mcq",
                  question: "Why is tracking spending for a few weeks often more useful than guessing from memory?",
                  options: [
                    "Banks always report spending wrong",
                    "People usually underestimate small, frequent purchases that add up",
                    "SARS requires proof of every expense",
                    "Memory is more accurate than bank statements",
                  ],
                  correct: 1,
                  feedback: {
                    correct: "Small purchases repeat often. Tracking reveals the true total.",
                    incorrect: "Memory misses repeating small amounts. Statements and notes show the real pattern.",
                  },
                },
                {
                  type: "true-false",
                  statement: "If you use one main bank card for daily spending, your app transaction list can be a starting point for tracking.",
                  correct: true,
                  feedback: {
                    correct: "Yes. Export or review categories, then add cash spend you remember.",
                    incorrect: "Card history is a solid base. Add cash and side accounts for a full picture.",
                  },
                },
                {
                  type: "scenario",
                  question:
                    "You earn R18 000 take-home. Essentials (rent, lights, transport to work) are R12 500. You want to save R1 500. What should you track most closely?",
                  options: [
                    "Only rent",
                    "The R5 500 left after essentials, especially food and discretionary spend",
                    "Your boss's salary policy",
                    "Only long-weekend trips",
                  ],
                  correct: 1,
                  feedback: {
                    correct: "The flexible slice after essentials is where small choices decide if saving happens.",
                    incorrect: "Focus on variable spend after fixed bills. That is where tracking changes outcomes.",
                  },
                },
                {
                  type: "action",
                  title: "Log this week's spending",
                  instruction:
                    "Pick one method you will use for seven days: banking app export, notes on your phone, or a paper list. Tonight, write down every rand you spend once, including airtime and taxi cash.",
                  tip: "Set a daily alarm for 20:00 so you do not forget small buys.",
                },
              ] satisfies LessonStep[],
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
              steps: [
                {
                  type: "info",
                  title: "When the Want Hits Now",
                  content:
                    "<p>Sipho walked into a mall for socks and left with bluetooth earphones on a three-month store plan. The extra cost was about R1 800 over the ticket price once fees and interest were included. Impulse buys are designed to feel urgent: limited stock, sale ends today, one-click checkout.</p><p>In South Africa, high fuel prices and long commutes already squeeze households, so unplanned extras hurt more. A simple pause rule (wait 24 hours for anything over R200 that was not on your list) cuts many mistakes. If you still want it after a night's sleep and you can pay cash or debit without touching your emergency fund, it may be a fair choice.</p>",
                },
                {
                  type: "true-false",
                  statement: "A 'cooling-off' delay before non-essential purchases usually leads to fewer regrets.",
                  correct: true,
                  feedback: {
                    correct: "Time weakens impulse. Many wants fade after a day.",
                    incorrect: "Delays help you decide with a clear head instead of in the moment.",
                  },
                },
                {
                  type: "mcq",
                  question: "Which habit best reduces impulse spending online?",
                  options: [
                    "Saving card details on every shopping site",
                    "Removing saved cards and using a shopping list before you open apps",
                    "Checking sales every lunch break",
                    "Deleting your budget",
                  ],
                  correct: 1,
                  feedback: {
                    correct: "Friction and a list turn mindless scrolling into a conscious choice.",
                    incorrect: "Less one-tap buying and a written list protect you from quick mistakes.",
                  },
                },
                {
                  type: "fill-blank",
                  title: "Quick math check",
                  prompt: "You planned R600 for clothes but spent R900. The unplanned extra is R___ .",
                  correct: 300,
                  explanation: "R900 minus R600 leaves R300 that was not planned.",
                  feedback: {
                    correct: "Right. Naming the overrun helps you adjust next month.",
                    incorrect: "Subtract planned from actual: R900 − R600 = R300 extra.",
                  },
                },
                {
                  type: "action",
                  title: "Try the 24-hour rule once",
                  instruction:
                    "The next time you want a non-essential item over R250 that was not on your list, write it on paper with the price and wait until tomorrow before you buy. If you still need it, choose debit you can afford.",
                  tip: "Keep the note in your pocket so the urge does not vanish from memory without a decision.",
                },
              ] satisfies LessonStep[],
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
                  content: "<p>A bad credit score costs you money every single month — through higher interest rates on every loan you ever take. A good score is worth tens of thousands of rands in interest savings over a lifetime.</p><p>Your credit score (300–850 in SA) tells lenders how likely you are to repay. It's calculated by TransUnion, Experian, and Compuscan based on your payment history, credit utilisation, length of history, and number of recent applications.</p>",
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
                  content: "<p>Interest is the tax you pay for spending money you don't have. At 20% per year, a R10,000 credit card balance you never pay off costs you R2,000 every year — for nothing. Just for existing.</p><p>Interest is the price of borrowed money, expressed as an annual percentage rate (APR). The minimum payment trap: paying only the minimum means you pay back far more than you borrowed, over far more years than you planned.</p>",
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
              steps: [
                {
                  type: "info",
                  title: "Not All Debt Is the Same",
                  content:
                    "<p>Good debt can be an affordable home loan on a stable income with emergency savings, where the asset may appreciate and your rate is competitive. Bad debt is high-interest revolving credit for things that lose value fast—clothes on budget, nights out rolled month to month—especially when you only pay minimums.</p><p>In South Africa, store cards near 20%+ and short-term loans can turn a R3 000 lounge suite into R7 000 paid over years. Before you sign, annualise the cost and ask if the purchase still feels worth it.</p>",
                },
                {
                  type: "mcq",
                  question: "Which example usually behaves more like ‘bad debt' for most households?",
                  options: [
                    "A 48-month vehicle loan at prime+ with insurance on a car needed for night-shift work",
                    "Revolving clothing account balances at high APR for non-essential fashion",
                    "Student study loan with clear repayment plan for a scarce skill",
                    "Home loan with affordable repayment under 30% of stable gross",
                  ],
                  correct: 1,
                  feedback: {
                    correct: "High-rate consumption debt on depreciating stuff drains wealth fastest.",
                    incorrect: "Match debt purpose, rate, and income stability before labelling it ‘good'.",
                  },
                },
                {
                  type: "true-false",
                  statement: "If repayments fit the budget today, you do not need to stress-test for rate hikes or income loss.",
                  correct: false,
                  feedback: {
                    correct: "Stress tests matter; jobs and rates change.",
                    incorrect: "Affordability should survive small shocks, not only today’s best month.",
                  },
                },
                {
                  type: "scenario",
                  question:
                    "Two offers: (A) personal loan at 18% for a holiday, (B) extra payments on an 24% store card until it is cleared. You can only pick one this month. Which improves health more?",
                  options: [
                    "Take holiday loan for ‘memories'",
                    "Attack the higher-rate revolving debt first",
                    "Ignore both because maths is scary",
                    "Open a third card to balance the others",
                  ],
                  correct: 1,
                  feedback: {
                    correct: "Eliminating expensive revolving balances saves more than new interest on wants.",
                    incorrect: "Avalanche and snowball methods both start by stopping costly interest traps.",
                  },
                },
                {
                  type: "action",
                  title: "List debts with rates",
                  instruction:
                    "On paper, write every debt: balance, minimum, interest rate or approximate monthly fee, and whether it is secured. Circle the highest rate to target after essentials are paid.",
                  tip: "If you do not know the rate, call the issuer before spending again.",
                },
              ] satisfies LessonStep[],
            },
            {
              id: "lesson-4",
              title: "Store Cards & Credit Cards",
              steps: [
                {
                  type: "info",
                  title: "Swipe Now, Pay Far More",
                  content:
                    "<p>Retail cards tempt you with instant approval and birthdays discounts. Credit cards can help cash flow if you clear the full balance each month and the rewards exceed fees you truly use. Problems start when revolving balances meet 20%+ yearly rates—then a R2 500 splurge lingers for years.</p><p>Set a hard rule: never autopay only the minimum unless you are in a structured emergency plan. Move subscriptions off high-rate cards when possible and unlink tap-to-pay from accounts you cannot track weekly.</p>",
                },
                {
                  type: "true-false",
                  statement: "Paying the full credit card balance by the due date usually avoids purchase interest on new spend.",
                  correct: true,
                  feedback: {
                    correct: "Grace periods reward discipline; check your specific card terms.",
                    incorrect: "Revolving balances lose grace benefits—read your monthly mail.",
                  },
                },
                {
                  type: "mcq",
                  question: "Before signing a store card at checkout, what should you verify first?",
                  options: [
                    "Only the free gift at the desk",
                    "APR or monthly fees, arrears penalties, and whether you already carry similar debt",
                    "Whether the card colour matches your phone cover",
                    "Nothing; sales staff already chose for you",
                  ],
                  correct: 1,
                  feedback: {
                    correct: "Cost and consequences beat the momentary perk.",
                    incorrect: "If you cannot quote the rate, you are not ready to sign.",
                  },
                },
                {
                  type: "fill-blank",
                  title: "Minimum payment trap",
                  prompt: "If your statement says minimum R450 but interest this month is R380, only about R___ of principal drops before new spend.",
                  correct: 70,
                  explanation: "450 − 380 = 70; tiny principal cuts stretch repayment for years.",
                  feedback: {
                    correct: "Small principal cuts are why minimums trap people.",
                    incorrect: "Subtract interest from the minimum to see real debt reduction.",
                  },
                },
                {
                  type: "action",
                  title: "Turn off one-click temptations",
                  instruction:
                    "Delete saved shopping app cards from your phone except one main account you monitor weekly. Write a sticky note with your next debt target balance on your screen edge for seven days.",
                  tip: "If removal feels scary, you might be relying on credit for lifestyle, not timing.",
                },
              ] satisfies LessonStep[],
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
                  content: "<p>One unexpected expense — a R8,000 car repair, a R15,000 medical bill, two weeks without income — is all it takes to destroy a budget that has no safety net. This is how debt spirals start.</p><p>An emergency fund is 3–6 months of essential living expenses in cash, accessible within 24 hours. If your essential monthly expenses are R12,000, your target is R36,000–R72,000. Start with a mini-goal of R5,000 — it protects you from small emergencies immediately.</p>",
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
              title: "When to Use Your Emergency Fund",
              steps: [
                {
                  type: "info",
                  title: "Real Emergencies Only",
                  content:
                    "<p>Nomsa saved R24 000 for three months of essentials. When the fridge broke, the quote was R6 500 and she used her fund instead of a high-interest store loan. Two months later her cousin asked to ‘borrow' R4 000 for a wedding outfit pressure buy. That second one was not an emergency for her household.</p><p>Your emergency fund is for income loss you did not choose, medical co-payments you cannot delay, or essential repairs that keep you safe or earning. Black Friday upgrades, holidays, and helping every relative who asks are not the same thing. Clear rules now prevent you from draining the account and restarting from zero.</p>",
                },
                {
                  type: "mcq",
                  question: "Which expense is the best fit for an emergency fund?",
                  options: [
                    "A limited-time deal on a new phone on account",
                    "Paying the excess on a car insurance claim after a crash you need for work",
                    "A year-end holiday special",
                    "Upgrading DSTV for sport season",
                  ],
                  correct: 1,
                  feedback: {
                    correct: "Keeping a work vehicle insured and roadworthy protects income.",
                    incorrect: "Choose costs that protect health, housing, or income. Skip entertainment deals.",
                  },
                },
                {
                  type: "true-false",
                  statement: "If you lose your job, using the emergency fund for rent and food while you search is an appropriate use.",
                  correct: true,
                  feedback: {
                    correct: "That is exactly what the buffer is for.",
                    incorrect: "Covering essentials after involuntary income loss is a textbook emergency.",
                  },
                },
                {
                  type: "scenario",
                  question:
                    "You have R18 000 saved. Your geyser bursts and water damages a wall. The plumber and repair quote is R12 000 and insurance will only pay later. What is the smartest first step?",
                  options: [
                    "Put the full R12 000 on a clothing store card at 22% interest",
                    "Use emergency savings if you must, then refill when the claim pays",
                    "Ignore the leak for two months",
                    "Borrow from an unregistered lender who messages you on WhatsApp",
                  ],
                  correct: 1,
                  feedback: {
                    correct: "Use the fund for urgent shelter repair, then rebuild with the claim if applicable.",
                    incorrect: "Avoid toxic debt for genuine home emergencies when you already saved cash.",
                  },
                },
                {
                  type: "action",
                  title: "Write your three emergency rules",
                  instruction:
                    "On paper or in your notes app, list three situations where you will allow yourself to spend the emergency fund (for example: job loss, critical medical, car repair for commuting). Keep it somewhere you will see before transfers.",
                  tip: "Share the rules with a trusted person so excitement spending has a second check.",
                },
              ] satisfies LessonStep[],
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
              steps: [
                {
                  type: "info",
                  title: "More Than Market Ups and Downs",
                  content:
                    "<p>Thabo thought ‘risk' only meant the JSE going red on his app. Then load-shedding cost his spaza R2 000 in spoiled stock in one week. Financial risk also includes losing your income, fraud, bank scams, medical shocks, interest-rate jumps on a home loan, and being underinsured.</p><p>You cannot remove all risk, but you can sort it: risks you can insure, risks you diversify with savings and different income streams, and risks you accept because the cost of full protection is too high. Naming the risks helps you stop one problem from wiping out everything else you built.</p>",
                },
                {
                  type: "mcq",
                  question: "Which example is mainly 'income risk'?",
                  options: [
                    "A unit trust unit price moves up and down",
                    "Your employer announces retrenchments in your division",
                    "You choose the wrong colour paint for a room",
                    "Inflation over a decade",
                  ],
                  correct: 1,
                  feedback: {
                    correct: "Job loss risk hits your monthly cash directly.",
                    incorrect: "Income risk is about losing or shrinking the money that arrives each month.",
                  },
                },
                {
                  type: "true-false",
                  statement: "Keeping six months of expenses in cash can reduce the impact of some income and expense shocks even if you also invest.",
                  correct: true,
                  feedback: {
                    correct: "Liquidity lowers the chance you sell investments in a panic or take expensive loans.",
                    incorrect: "Cash savings absorb shocks so long-term investments stay on track.",
                  },
                },
                {
                  type: "mcq",
                  question:
                    "You have third-party-only car insurance and you cause an accident that writes off your own car. Who pays to replace your vehicle?",
                  options: [
                    "The insurer replaces your car fully",
                    "You pay from your own pocket; third-party cover focuses on damage to others",
                    "The other driver always pays everything",
                    "SARS refunds the loss",
                  ],
                  correct: 1,
                  feedback: {
                    correct: "Third-party cover does not fix your own car. Check your policy wording.",
                    incorrect: "Own damage usually needs higher cover levels you choose and pay for.",
                  },
                },
                {
                  type: "action",
                  title: "List one insurable risk",
                  instruction:
                    "Pick one financial shock that worries you (car theft, illness, retrenchment). Write whether you rely on insurance, savings, family help, or nothing yet. Book one concrete step this week: a quote, a savings target, or a policy review.",
                  tip: "Use official insurer or broker channels, not random WhatsApp ‘specials'.",
                },
              ] satisfies LessonStep[],
            },
            {
              id: "lesson-5",
              title: "Risk vs Reward",
              steps: [
                {
                  type: "info",
                  title: "The Trade-Off in Plain Words",
                  content:
                    "<p>A 32-day notice account might pay a modest rate but rarely loses nominal value. A broad equity ETF can average much higher growth over decades but might drop 20% in a bad year. That trade-off is not good or bad by itself; it depends on when you need the money and whether you can stay calm when markets wobble.</p><p>Many South Africans hear ‘crypto doubled' from a friend and ignore the friend who lost quietly. Higher possible reward without real skills, time horizon, or diversification is often just higher chance of loss. Match the tool to the goal and the timeline, not the story that sounds exciting at a braai.</p>",
                },
                {
                  type: "scenario",
                  question:
                    "You need the money in 14 months for a child’s first university deposit. Which choice best matches the timeline?",
                  options: [
                    "100% of the deposit in a single small-cap share tip from social media",
                    "A mix biased to stable, shorter-term savings and low-volatile funds, not all in volatile equities",
                    "Daily forex ‘signals' from an anonymous group",
                    "Spend half on shoes now and hope for a bonus later",
                  ],
                  correct: 1,
                  feedback: {
                    correct: "Short horizons need more stability; avoid all-or-nothing bets.",
                    incorrect: "A known deadline needs controlled risk, not hype investments.",
                  },
                },
                {
                  type: "true-false",
                  statement: "Longer time horizons generally allow more room to recover from market dips than money needed next month.",
                  correct: true,
                  feedback: {
                    correct: "Time lets compounding work and smooths out some volatility.",
                    incorrect: "Years in the market changes what level of ups and downs you can live through.",
                  },
                },
                {
                  type: "mcq",
                  question: "Which phrase best describes a healthy view of risk?",
                  options: [
                    "Avoid every investment because markets move",
                    "Chase anyone who promises a fixed 8% a week",
                    "Understand what you can lose, what you might gain, and how long you can wait",
                    "Copy every trade you see online",
                  ],
                  correct: 2,
                  feedback: {
                    correct: "Clarity on timeline and downside beats blind fear or blind greed.",
                    incorrect: "Adults match risk to goals; they do not outsource thinking to hype.",
                  },
                },
                {
                  type: "action",
                  title: "Label one goal by timeline",
                  instruction:
                    "Write down one savings or investing goal with the year you expect to spend it. Next to it, note ‘low', ‘medium', or ‘high' risk you are willing to accept and one product type you will research (notice account, money market, balanced fund, ETF).",
                  tip: "Use SARS-registered providers and FSCA-licensed institutions when you compare options.",
                },
              ] satisfies LessonStep[],
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
                  content: "<p>Every week in South Africa, families lose their homes and children drop out of school because the breadwinner died without life cover. This is not a rare tragedy — it's the predictable outcome of skipping one product.</p><p>Life insurance pays a lump sum to your family if you die. If you have dependants, a spouse, children, or parents who rely on your income — you need it. The rule of thumb: 10× your annual salary. Earning R300,000/year means R3 million in cover.</p>",
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
                  content: "<p>Every year you leave R100,000 in cash instead of investing it, you silently lose R6,000 in purchasing power to inflation. After 10 years, your R100,000 buys what R55,000 used to. Doing nothing is not safe — it's slow financial destruction.</p><p>Higher potential return always comes with higher risk. There is no high return with zero risk — that's the definition of a scam. The risk spectrum: low risk/low return (savings account, money market) → medium (bonds, balanced funds) → high (shares, ETFs, property).</p>",
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
              steps: [
                {
                  type: "info",
                  title: "When Do You Need the Money?",
                  content:
                    "<p>Anele saved R40 000 in a notice account for a car deposit she plans to use in nine months. Her colleague put the same amount in volatile single shares for the same goal. When prices dipped 18%, only one of them could still buy the car without delay.</p><p>Time horizon is the gap between today and when you must spend the money. Under two years usually favours stability. Five years or more can carry more growth assets if you will not panic-sell. Mixing up timelines is how people sell low right before prices recover.</p>",
                },
                {
                  type: "mcq",
                  question: "You need funds in 11 months for school fees. Which stance fits best?",
                  options: [
                    "100% in speculative trades because ‘markets always bounce back'",
                    "Emphasis on capital you can access without severe loss, not long-shot bets",
                    "Borrow the full amount on a microloan at any cost",
                    "Hide cash under a mattress only",
                  ],
                  correct: 1,
                  feedback: {
                    correct: "Short needs deserve predictable access and controlled risk.",
                    incorrect: "Match the tool to months, not hype. Stability usually matters more under two years.",
                  },
                },
                {
                  type: "true-false",
                  statement: "If you might need every rand next year, investments that swing wildly month to month are usually a poor fit.",
                  correct: true,
                  feedback: {
                    correct: "Volatility plus a fixed deadline is a classic mismatch.",
                    incorrect: "Near-term spending needs steadier choices than long retirement money.",
                  },
                },
                {
                  type: "scenario",
                  question:
                    "Two friends each invest R500 a month. One needs the money in four years for relocation; the other will only touch it after 20 years for retirement. Who can more reasonably accept bigger equity swings?",
                  options: [
                    "The four-year friend",
                    "The twenty-year friend",
                    "Neither should ever buy shares",
                    "Only people earning over R80 000",
                  ],
                  correct: 1,
                  feedback: {
                    correct: "Longer timelines absorb dips better if behaviour stays steady.",
                    incorrect: "Time is the cushion that makes volatility more tolerable.",
                  },
                },
                {
                  type: "action",
                  title: "Date-stamp one goal",
                  instruction:
                    "Write one financial goal with the exact month and year you expect to spend it. Circle whether it is under 3 years, 3–7 years, or 7+ years. Keep the note where you review savings monthly.",
                  tip: "If the date moved closer, revisit how much risk you still accept.",
                },
              ] satisfies LessonStep[],
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
              steps: [
                {
                  type: "info",
                  title: "A Small Slice of a Company",
                  content:
                    "<p>When you buy a share on the JSE, you buy part ownership in a listed company. If the firm grows profits over years and pays dividends, you may earn from both price increases and distributions. If the business struggles, your slice can lose value. That is normal market behaviour, not necessarily fraud.</p><p>Many beginners start with broad ETFs that hold dozens or hundreds of companies so one bad executive decision does not dominate the outcome. In South Africa you still pay taxes outside a TFSA, so wrapping long-term equity ETFs inside your annual limit can make sense when rules allow.</p>",
                },
                {
                  type: "true-false",
                  statement: "Owning one share means you own a small part of that company.",
                  correct: true,
                  feedback: {
                    correct: "Shares represent equity ownership, usually with voting and dividend rights.",
                    incorrect: "Listed shares are legal claims on company value, not a loan you made to the firm.",
                  },
                },
                {
                  type: "mcq",
                  question: "Why might a diversified equity ETF be easier for a beginner than picking three individual shares?",
                  options: [
                    "ETFs always pay higher returns every year",
                    "Spread across many holdings reduces the impact if one firm performs badly",
                    "ETFs never fall in price",
                    "SARS forbids individual shares",
                  ],
                  correct: 1,
                  feedback: {
                    correct: "Dilution of company-specific risk is the main beginner benefit.",
                    incorrect: "Broad funds spread outcomes; they do not guarantee profits.",
                  },
                },
                {
                  type: "mcq",
                  question: "Cash a listed company pays shareholders from profits is most often called a:",
                  options: ["Dividend", "PAYE refund", "Debit order", "UIF payout"],
                  correct: 0,
                  feedback: {
                    correct: "Dividends reward share owners when boards declare them.",
                    incorrect: "Dividends are not tax refunds or bank charges; they come from company profits.",
                  },
                },
                {
                  type: "action",
                  title: "Read one factsheet",
                  instruction:
                    "Open any JSE-listed ETF or unit trust factsheet from a licensed provider. Write down three lines: what it invests in, its total expense ratio or fee note, and the biggest risk paragraph. File it on your phone for next month’s review.",
                  tip: "If you cannot find fees clearly, ask the provider before you invest.",
                },
              ] satisfies LessonStep[],
            },
            {
              id: "lesson-6",
              title: "Understanding Bonds",
              steps: [
                {
                  type: "info",
                  title: "Lending, Not Owning",
                  content:
                    "<p>A government or company bond is a loan you give in return for interest and your principal back at maturity. Stable bonds can smooth a portfolio when shares fall, but they are not risk-free if the issuer struggles or if interest rates move sharply.</p><p>In South Africa, retail investors often access bonds through unit trusts, bond ETFs, or bank-fixed products rather than buying individual certificates directly. Expected returns are usually lower than equities over decades, but the ride can be calmer.</p>",
                },
                {
                  type: "mcq",
                  question: "In simple terms, a bond holder is mostly:",
                  options: [
                    "Part owner with voting rights like a CEO",
                    "A lender to the issuer who expects scheduled interest and return of principal",
                    "Guaranteed to beat inflation every year",
                    "Insured against all losses by the Reserve Bank",
                  ],
                  correct: 1,
                  feedback: {
                    correct: "Bonds are debt instruments: you lend; they promise to pay back under the contract.",
                    incorrect: "Ownership is equities; lending is bonds.",
                  },
                },
                {
                  type: "true-false",
                  statement: "When interest rates rise sharply, prices of many existing bonds often fall.",
                  correct: true,
                  feedback: {
                    correct: "Duration and rate moves matter; older lower-rate bonds look less attractive.",
                    incorrect: "Rate shifts change what buyers will pay for older fixed payments.",
                  },
                },
                {
                  type: "scenario",
                  question:
                    "You want less drama than pure shares but can still wait several years. Which blended idea is most sensible to discuss with a licensed adviser or read about first?",
                  options: [
                    "All-in leveraged currency trades from WhatsApp",
                    "A balanced or multi-asset fund that mixes bonds and equities within stated rules",
                    "Cash under the bed only forever",
                    "Borrowing to buy jewellery",
                  ],
                  correct: 1,
                  feedback: {
                    correct: "Mixed mandates exist precisely for moderate timelines and temperaments.",
                    incorrect: "Schemes on chat apps are not a bond education plan.",
                  },
                },
                {
                  type: "action",
                  title: "Compare two yield numbers",
                  instruction:
                    "Find any retail bond fund or RSA retail bond rate note and a high-interest savings rate. Write both percentages and the institution names. Note which is fixed for how long and what penalties apply if you withdraw early.",
                  tip: "Use official .co.za sites or apps, not screenshots from strangers.",
                },
              ] satisfies LessonStep[],
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
                  content: "<p>Every year you don't use your TFSA allowance is R36,000 of tax-free growth you lose permanently — it doesn't roll over. Over 30 years, the difference between using your TFSA and not is often over R1 million in tax saved.</p><p>A Tax-Free Savings Account lets you invest R36,000 per year (R500,000 lifetime limit) and pay zero tax on interest, dividends, or capital gains — ever. Available at Sygnia, Satrix, EasyEquities, Capitec, and most major platforms.</p>",
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
              steps: [
                {
                  type: "info",
                  title: "Tax Sheltered Growth",
                  content:
                    "<p>Zandile puts R2 500 a month into a normal unit trust outside a TFSA. Over years she owes tax on some interest, dividends, and capital gains when rules trigger. Her twin uses the same funds inside a TFSA wrapper until lifetime limits are respected. The twin keeps more of the compounding because qualifying growth is not taxed inside the account.</p><p>TFSAs still have annual and lifetime caps; breaking rules like over-contributing can trigger SARS penalties. Regular taxable accounts have no caps but no shield. Many people use both: TFSA for long wealth and a plain account for flexibility after limits.</p>",
                },
                {
                  type: "mcq",
                  question: "What is the main long-term advantage of a compliant TFSA compared with the same assets in a standard taxable account?",
                  options: [
                    "Guaranteed higher returns every year",
                    "No tax on qualifying returns while rules are followed",
                    "No need to read statements",
                    "SARS automatically gives you cash back monthly",
                  ],
                  correct: 1,
                  feedback: {
                    correct: "Tax-free growth is the structural benefit, not a performance promise.",
                    incorrect: "Returns still vary; the wrapper changes tax treatment when used correctly.",
                  },
                },
                {
                  type: "true-false",
                  statement: "You should still track TFSA contributions so you do not exceed annual and lifetime limits.",
                  correct: true,
                  feedback: {
                    correct: "Breaches can cost penalties; your platform helps but you stay responsible.",
                    incorrect: "Limits are real. Keep your own tally across providers.",
                  },
                },
                {
                  type: "scenario",
                  question:
                    "You already maxed this year’s TFSA with one provider and receive a bonus. What is the cautious next step?",
                  options: [
                    "Deposit the bonus into the same TFSA anyway",
                    "Park extra in a high-interest account or taxable investment until a new tax year, or use other allowed products",
                    "Send cash to the first WhatsApp investment group that replies",
                    "Hide cash in a gym locker",
                  ],
                  correct: 1,
                  feedback: {
                    correct: "Respect limits; plan the bonus for the next allowed window or another suitable product.",
                    incorrect: "Over-contributing triggers SARS issues you can avoid with timing.",
                  },
                },
                {
                  type: "action",
                  title: "Add up your TFSA deposits this year",
                  instruction:
                    "Log every TFSA deposit you made since 1 March (or your platform’s tax year start). Total them and compare to the current annual limit from a trusted SARS or provider page. Write the remaining room if any.",
                  tip: "If you use more than one bank or broker, add them all—limits are per person, not per brand.",
                },
              ] satisfies LessonStep[],
            },
            {
              id: "lesson-3",
              title: "How to Open a TFSA",
              steps: [
                {
                  type: "info",
                  title: "Start With Licensed Players",
                  content:
                    "<p>Most major banks, LISPs, and platforms offer TFSA wrappers. You will complete FICA with ID and proof of address, sign risk disclosures, and choose underlying funds or ETFs that fit your timeline. Online onboarding often takes under an hour if documents are ready.</p><p>Check platform fees, whether you want ad hoc or debit orders, and how you will track contributions across apps. Opening is not the finish line—low recurring fees and steady contributions matter more than a flashy advert on social media.</p>",
                },
                {
                  type: "true-false",
                  statement: "You normally need FICA documents before a regulated institution activates a TFSA.",
                  correct: true,
                  feedback: {
                    correct: "AML rules apply; expect ID and address proof.",
                    incorrect: "Legitimate providers verify identity; skip anyone who refuses basics.",
                  },
                },
                {
                  type: "mcq",
                  question: "Before funding, which pair should you compare between two TFSA platforms?",
                  options: [
                    "Only the colour of the app icon",
                    "Total yearly costs and which funds or ETFs you may hold",
                    "How many influencers mention them",
                    "Whether they trade only crypto",
                  ],
                  correct: 1,
                  feedback: {
                    correct: "Fees and investment choice drive long outcomes.",
                    incorrect: "Marketing noise matters less than cost and suitability.",
                  },
                },
                {
                  type: "fill-blank",
                  title: "Monthly automation",
                  prompt: "Setting a debit order of R___ per month can help consistency if it fits your budget.",
                  correct: 500,
                  explanation: "Any positive number you can sustain works; 500 is a practice example.",
                  feedback: {
                    correct: "Automation beats hoping you remember each payday.",
                    incorrect: "Pick an amount you can keep for months without missing essentials.",
                  },
                },
                {
                  type: "action",
                  title: "Complete one checklist item",
                  instruction:
                    "Choose one licensed provider’s website. Download their TFSA checklist PDF or page. Tick one item you can finish today: scan your ID, gather a recent municipal bill, or create a login. Book 20 minutes on your calendar.",
                  tip: "Screenshot nothing with passwords; store documents securely offline.",
                },
              ] satisfies LessonStep[],
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
              steps: [
                {
                  type: "info",
                  title: "Deductions Now, Discipline Later",
                  content:
                    "<p>Priya contributes R4 000 monthly to an RA while earning R42 000 taxable income. SARS may let her deduct those contributions up to the legal percentage and cap, lowering income tax today while locking money for retirement. Exact savings depend on your bracket and updates to law.</p><p>You still follow product rules: penalties if you cash out early outside allowed events, and you must use approved funds. Treat the deduction as a nudge to save, not ‘free money'—plan cash flow so living costs stay covered after the debit order.</p>",
                },
                {
                  type: "mcq",
                  question: "A main tax feature of many RAs for working South Africans is:",
                  options: [
                    "No tax ever on anything worldwide automatically",
                    "Potential income-tax deductions on qualifying contributions within limits",
                    "Cash withdrawals any week without questions",
                    "Exemption from FICA",
                  ],
                  correct: 1,
                  feedback: {
                    correct: "Deductibility within caps is the headline benefit for many employees.",
                    incorrect: "Read current SARS guides; myths about unlimited tax freedom are dangerous.",
                  },
                },
                {
                  type: "true-false",
                  statement: "You should confirm your own allowable RA deduction percentage each year rather than copying a friend’s story.",
                  correct: true,
                  feedback: {
                    correct: "Tax depends on income, caps, and law updates.",
                    incorrect: "Use official guidance or a registered tax practitioner for your case.",
                  },
                },
                {
                  type: "scenario",
                  question:
                    "You want the tax deduction but might need the cash next year for an unplanned move. What is wisest?",
                  options: [
                    "Lock the full amount in an RA anyway",
                    "First secure an emergency buffer, then commit only what you can truly tie up for the product rules",
                    "Hide income from SARS",
                    "Borrow on credit cards to fund the RA",
                  ],
                  correct: 1,
                  feedback: {
                    correct: "Liquidity needs and lock-in rules matter alongside tax perks.",
                    incorrect: "Do not trade tomorrow’s rent for today’s deduction without a plan.",
                  },
                },
                {
                  type: "action",
                  title: "One SARS check",
                  instruction:
                    "Open the official SARS page on retirement fund contributions or download their summary table. Write down the current percentage limit phrase and the rand cap line in your own words. Store it in your money folder.",
                  tip: "If wording confuses you, note questions for a registered practitioner before you increase debits.",
                },
              ] satisfies LessonStep[],
            },
            {
              id: "lesson-6",
              title: "Unit Trusts & ETFs",
              steps: [
                {
                  type: "info",
                  title: "Pooled Investing",
                  content:
                    "<p>A unit trust pools money from many investors into a basket chosen by a manager and mandates. An ETF typically tracks an index and trades like a share. Both can sit in TFSAs or other wrappers when rules allow, but fees and trading differ.</p><p>Read Total Expense Ratio, transaction costs, and how often you may switch. In South Africa, flashy past performance charts ignore tax you would pay outside shelters and your personal timing—focus on fit, fees, and whether you understand what you hold.</p>",
                },
                {
                  type: "mcq",
                  question: "Which statement is most accurate for beginners comparing ETFs and active unit trusts?",
                  options: [
                    "ETFs always beat every unit trust forever",
                    "ETFs often follow an index passively; many unit trusts try to beat a benchmark with higher fees",
                    "Unit trusts cannot charge fees",
                    "Neither needs a mandate document",
                  ],
                  correct: 1,
                  feedback: {
                    correct: "Passive vs active is a cost and expectation trade-off.",
                    incorrect: "Neither structure guarantees victory every year.",
                  },
                },
                {
                  type: "true-false",
                  statement: "Reading the minimum disclosure document or fund fact sheet is part of responsible investing.",
                  correct: true,
                  feedback: {
                    correct: "Fees, risks, and benchmarks belong in your files.",
                    incorrect: "If factsheets confuse you, pause until you understand or get advice.",
                  },
                },
                {
                  type: "fill-blank",
                  title: "Fee awareness",
                  prompt: "If a fund lists total yearly costs near 1.5% and another near 0.35% for a similar index, the lower number often means you keep more growth when performance is similar. Express 1.5% as the number 1.5 (not R).",
                  correct: 1.5,
                  explanation: "Comparing TER numbers helps you question expensive duplicates.",
                  feedback: {
                    correct: "Small fee gaps compound over decades.",
                    incorrect: "Re-read the fee column on both fact sheets.",
                  },
                },
                {
                  type: "action",
                  title: "Save two screenshot-free notes",
                  instruction:
                    "Pick one unit trust and one ETF factsheet. Write by hand: benchmark name, TER or cost line, and minimum suggested investment period. No trade yet—just understanding.",
                  tip: "If TER is missing, email the provider’s compliance address before proceeding.",
                },
              ] satisfies LessonStep[],
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
                  content: "<p>SARS will take exactly what you owe — but they won't tell you about the legal ways to pay less. Employees who don't know about RA deductions, travel allowances, and home office deductions overpay by thousands of rands every year.</p><p>South Africa uses marginal tax brackets. You only pay the higher rate on income above each threshold — never on your entire salary. Common myth: a raise pushes you into a higher bracket and you take home less. This is impossible. You always keep more by earning more.</p>",
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
              steps: [
                {
                  type: "info",
                  title: "Promises That Do Not Add Up",
                  content:
                    "<p>Elite traders on WhatsApp groups post screenshots of R10 000 turning into R250 000 in weeks. They urge you to ‘top up' before the window closes. Legitimate growth takes time, regulation, and visible paperwork; it is boring compared to the story.</p><p>In South Africa check FSCA warnings, ask for FSP numbers, call the institution on its official switchboard—not the number the salesperson gives—and never move money to random personal accounts. If recruitment pays more than investing returns, you are likely looking at something closer to a pyramid than an asset.</p>",
                },
                {
                  type: "mcq",
                  question: "Which detail should make you pause before sending money to an ‘investment club'?",
                  options: [
                    "They share glossy PDFs",
                    "Returns are guaranteed every week regardless of markets and you must recruit friends to unlock tiers",
                    "They use a registered business name you can verify",
                    "They explain fees slowly",
                  ],
                  correct: 1,
                  feedback: {
                    correct: "Guarantees plus recruitment pressure are classic warning patterns.",
                    incorrect: "Verify licensing, custodians, and whether returns depend on new cash.",
                  },
                },
                {
                  type: "true-false",
                  statement: "You can check whether a South African financial services provider is registered before you invest.",
                  correct: true,
                  feedback: {
                    correct: "Regulators publish lists and warnings—use them.",
                    incorrect: "If you skip verification, you carry extra avoidable risk.",
                  },
                },
                {
                  type: "scenario",
                  question:
                    "Someone offers 6% per month ‘risk free' if you EFT to their personal Capitec account today. What is the safest response?",
                  options: [
                    "Send R5 000 to test",
                    "Stop, refuse, and report or verify through official channels only",
                    "Ask three cousins to join",
                    "Share your OTP so they can ‘load the platform'",
                  ],
                  correct: 1,
                  feedback: {
                    correct: "Personal accounts and OTP demands override slick talk.",
                    incorrect: "Never mix remote access, OTP sharing, and investment marketing.",
                  },
                },
                {
                  type: "action",
                  title: "Save one hotline",
                  instruction:
                    "Look up the SA Police Service or banking fraud number you would dial if cash left your account suspiciously. Store it as a contact labelled Fraud—do not wait until panic strikes.",
                  tip: "Screenshot official pages sparingly; prefer typing numbers yourself from .gov.za or your bank’s PDF.",
                },
              ] satisfies LessonStep[],
            },
            {
              id: "lesson-4",
              title: "Romance & Social Media Scams",
              steps: [
                {
                  type: "info",
                  title: "Love Bombs and Empty Wallets",
                  content:
                    "<p>Fraudsters build trust over weeks—compliments, voice notes, shared playlists—then an ‘emergency': customs holding a gift, a sick relative in a private hospital, crypto software that only needs a small activation fee. Victims in South Africa have lost cars, stokvel savings, and study money.</p><p>Cut contact if anyone you have never met in person asks for e-wallet sends, airtime ladders, or remote access to your banking app. Real partners do not acceleration-test your overdraft on week three.</p>",
                },
                {
                  type: "true-false",
                  statement: "A person who truly cares for you will respect a firm ‘no' when you refuse to send cash to a stranger’s account.",
                  correct: true,
                  feedback: {
                    correct: "Pressure after boundaries is manipulation.",
                    incorrect: "Guilt trips about love versus money are a tactic, not affection.",
                  },
                },
                {
                  type: "mcq",
                  question: "Which habit reduces catfish money risk on dating apps?",
                  options: [
                    "Move chat immediately to encrypted apps only with no photo proof",
                    "Video call in a safe public pattern, tell family you are meeting someone new, and refuse upfront cash",
                    "Send pictures of your bank card ‘for vibes'",
                    "Share OTPs to prove honesty",
                  ],
                  correct: 1,
                  feedback: {
                    correct: "Accountability to people you trust beats secret online intensity.",
                    incorrect: "Financial transparency with criminals is self harm.",
                  },
                },
                {
                  type: "fill-blank",
                  title: "Gift card trick",
                  prompt: "If a stranger insists you buy retail gift cards worth R2 000 and photograph the codes, assume it is a ___ (answer with number 100 for ‘percent scam likelihood').",
                  correct: 100,
                  explanation: "Gift-card code harvesting is overwhelmingly fraudulent.",
                  feedback: {
                    correct: "Treat gift-card urgency as a bright red flag.",
                    incorrect: "Legit firms do not harvest scratched codes from strangers online.",
                  },
                },
                {
                  type: "action",
                  title: "Tell one ally",
                  instruction:
                    "Choose one person who will hear you say ‘I met someone online' before you send funds or share ID copies. Message them today with that agreement—no judgement, just a pause partner.",
                  tip: "Scammers isolate you; allies break the trance.",
                },
              ] satisfies LessonStep[],
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
              steps: [
                {
                  type: "info",
                  title: "Speed and Paper Trail",
                  content:
                    "<p>The hour after you realise money moved wrongly matters. Call your bank’s fraud line, change passwords, and gather references. Open a case with SAPS if theft occurred; some recovery paths need a case number. Screen-capture chats ethically for investigators, not for public shaming that tips off the criminal.</p><p>Expect emotions: shame delays reporting. Acting quickly does not guarantee return of funds, but it can freeze downstream accounts and protect others. Follow your bank’s affidavit process and ask which ombudsman or regulator handles your product type.</p>",
                },
                {
                  type: "mcq",
                  question: "First practical step after unauthorised debit orders appear:",
                  options: [
                    "Delete banking apps to hide the problem",
                    "Contact your bank’s fraud department and request blocks on affected channels",
                    "Send more money to ‘reverse' the glitch",
                    "Ignore it for 30 days",
                  ],
                  correct: 1,
                  feedback: {
                    correct: "Rapid reporting starts investigation and limits damage.",
                    incorrect: "Silence helps only the thief.",
                  },
                },
                {
                  type: "true-false",
                  statement: "Keeping SMS, email, and proof of payment helps investigators even if recovery is uncertain.",
                  correct: true,
                  feedback: {
                    correct: "Documentation supports disputes and police work.",
                    incorrect: "Organise evidence calmly; emotional deletes hurt your case.",
                  },
                },
                {
                  type: "scenario",
                  question:
                    "You paid a fake landlord deposit. The scammer ghosted you. Besides the bank, who else should you notify quickly?",
                  options: [
                    "Nobody; hope Facebook karma works",
                    "SAPS with a case reference and any rental platform that hosted the listing",
                    "Only your ex",
                    "The scammer’s mother",
                  ],
                  correct: 1,
                  feedback: {
                    correct: "Official reports plus platform abuse teams can warn the next victim.",
                    incorrect: "Community revenge posts are not a substitute for records.",
                  },
                },
                {
                  type: "action",
                  title: "Dry-run your contacts",
                  instruction:
                    "Type your bank fraud line, your network fraud SMS shortcode if any, and SAPS 10111 into your phone now. Add one sentence note: ‘Call if money moves odd.'",
                  tip: "Practice once when calm so muscle memory exists when stressed.",
                },
              ] satisfies LessonStep[],
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

];

export const CONTENT_DATA: { courses: Course[] } = {
  courses: mergeContentExtras(RAW_COURSES),
};

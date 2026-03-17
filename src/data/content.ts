import type { Course, LessonStep } from "@/app/page";

export const CONTENT_DATA: { courses: Course[] } = {
  courses: [
    {
      id: "money-basics",
      title: "Money Basics",
      description:
        "Master the fundamentals of personal finance, from inflation to budgeting",
      icon: "💵",
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
                  content:
                    "<p>Money is anything that people agree has value and can be exchanged for goods and services. In South Africa, we use the <strong>Rand (R)</strong> as our currency.</p><p>But money is more than just the notes and coins in your pocket. It includes:</p><ul><li>Cash in your wallet</li><li>Money in your bank account</li><li>Digital payments (like SnapScan or Zapper)</li><li>Even investments like stocks</li></ul>",
                },
                {
                  type: "info",
                  title: "The Three Jobs of Money",
                  content:
                    "<p>Money has three main functions:</p><ul><li><strong>Medium of Exchange:</strong> You can trade money for what you need instead of bartering</li><li><strong>Store of Value:</strong> You can save money today and use it tomorrow</li><li><strong>Unit of Account:</strong> It helps us measure and compare the value of things</li></ul><p>Understanding these functions helps you make better financial decisions.</p>",
                },
                {
                  type: "mcq",
                  question:
                    "Which of these is NOT one of the three main functions of money?",
                  options: [
                    "Medium of Exchange",
                    "Store of Value",
                    "Making You Happy",
                    "Unit of Account",
                  ],
                  correct: 2,
                  feedback: {
                    correct:
                      "Exactly! While money can contribute to happiness, its primary functions are practical: exchange, storage, and measurement.",
                    incorrect:
                      "Not quite. The three functions of money are: medium of exchange, store of value, and unit of account.",
                  },
                },
                {
                  type: "info",
                  title: "Why Money Loses Value",
                  content:
                    "<p>Have you noticed that R100 today doesn't buy as much as it did 5 years ago? That's because of <strong>inflation</strong>.</p><p>Inflation means the general increase in prices over time. In South Africa, the South African Reserve Bank aims to keep inflation between 3-6% per year.</p><p>This is why just keeping money under your mattress is a bad idea - it loses purchasing power every year!</p>",
                },
                {
                  type: "mcq",
                  question:
                    "If inflation is 5% per year, what happens to R1000 cash kept under your mattress?",
                  options: [
                    "It can buy more things next year",
                    "It stays exactly the same",
                    "It can buy less things next year",
                    "It doubles in value",
                  ],
                  correct: 2,
                  feedback: {
                    correct:
                      "Correct! With 5% inflation, your R1000 will only buy what R950 could buy today. The cash amount stays the same, but its purchasing power decreases.",
                    incorrect:
                      "Think about it: if prices go up 5%, your R1000 will buy less than before. That's how inflation erodes the value of cash.",
                  },
                },
                {
                  type: "info",
                  title: "Protecting Against Inflation",
                  content:
                    "<p>So how do you protect your money from inflation?</p><ul><li><strong>Invest wisely:</strong> Investments like stocks, property, or bonds often grow faster than inflation</li><li><strong>Increase your income:</strong> Ask for raises that match or beat inflation</li><li><strong>Budget smart:</strong> Reduce unnecessary expenses to maintain your standard of living</li></ul><p>Later courses will teach you specific strategies for each of these!</p>",
                },
                {
                  type: "scenario",
                  title: "Real-Life Choice",
                  question:
                    "Your grandmother gives you R5000 as a gift. You don't need the money right now. What's the smartest move?",
                  options: [
                    "Keep it in cash at home for emergencies",
                    "Put it in a savings account earning 4% interest",
                    "Spend it immediately before inflation makes it worth less",
                    "Give it back because money is evil",
                  ],
                  correct: 1,
                  feedback: {
                    correct:
                      "Smart choice! A savings account earning 4% interest helps protect against inflation (usually 3-6%). Your money stays accessible for emergencies while growing.",
                    incorrect:
                      "Consider this: keeping cash at home means it loses value to inflation. A savings account protects it while keeping it accessible.",
                  },
                },
                {
                  type: "info",
                  title: "Key Takeaways",
                  content:
                    "<p>Congratulations! You now understand:</p><ul><li>Money is anything people agree has value</li><li>It works as a medium of exchange, store of value, and unit of account</li><li>Inflation makes money lose purchasing power over time</li><li>Smart savings and investing help beat inflation</li></ul><p><strong>Next lesson:</strong> Learn about needs vs. wants and how to budget effectively!</p>",
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
                  content:
                    "<p>Understanding the difference between needs and wants is the foundation of smart money management.</p><p><strong>Needs</strong> are things you must have to survive and function:</p><ul><li>Food and water</li><li>Shelter (rent or bond)</li><li>Basic clothing</li><li>Healthcare</li><li>Transport to work</li></ul><p><strong>Wants</strong> are things that make life better but aren't essential:</p><ul><li>Eating out at restaurants</li><li>The latest smartphone</li><li>DSTV Premium (instead of Compact)</li><li>Designer clothes</li><li>Your third pair of sneakers</li></ul>",
                },
                {
                  type: "info",
                  title: "The Grey Area",
                  content:
                    '<p>Some things fall in between - they\'re "justified wants" or "quality needs":</p><ul><li>A reliable car might be a need for work, but a luxury SUV is a want</li><li>A smartphone might be a need for your job, but the latest iPhone is a want</li><li>Clothes for work are a need, but designer brands are a want</li></ul><p>The trick is being <strong>honest with yourself</strong> about which category something really falls into.</p>',
                },
                {
                  type: "mcq",
                  question: "Which of these is a NEED, not a want?",
                  options: [
                    "Netflix subscription",
                    "Groceries for the month",
                    "Dinner at a restaurant",
                    "New gaming console",
                  ],
                  correct: 1,
                  feedback: {
                    correct:
                      "Absolutely! Food is a fundamental need. While eating out is nice, groceries are essential for survival.",
                    incorrect:
                      "Think carefully: which of these is required for survival? Food yes, but does it have to be restaurant food or entertainment?",
                  },
                },
                {
                  type: "scenario",
                  title: "Real-Life Scenario",
                  question:
                    "You earn R15,000 per month. After rent, transport, and groceries, you have R2,500 left. Your phone is broken. What should you do?",
                  options: [
                    "Buy the new iPhone on contract for R1,200/month",
                    "Buy a mid-range phone for R3,000 cash",
                    "Get a basic smartphone for R1,500 and save the rest",
                    "Use your friend's old phone for free and save all R2,500",
                  ],
                  correct: 2,
                  feedback: {
                    correct:
                      "Great thinking! A basic smartphone meets your need while leaving money for savings and emergencies. It's the balanced approach.",
                    incorrect:
                      "Consider: you need a working phone, but you don't need the most expensive option. Balance your need with your financial reality.",
                  },
                },
                {
                  type: "info",
                  title: "The Danger of Lifestyle Creep",
                  content:
                    "<p>As your income grows, it's tempting to upgrade everything. This is called <strong>lifestyle creep</strong>.</p><p>Example: Thabo gets a promotion from R20,000 to R30,000 per month. Instead of saving the extra R10,000, he:</p><ul><li>Moves to a more expensive apartment (+R3,000)</li><li>Buys a nicer car (+R4,000 monthly payment)</li><li>Eats out more often (+R2,000)</li><li>Upgrades his subscriptions (+R1,000)</li></ul><p>Result? Despite earning 50% more, he's saving nothing and feels just as broke!</p>",
                },
                {
                  type: "true-false",
                  statement:
                    "It's okay to upgrade some wants when you earn more, as long as you also increase your savings",
                  correct: true,
                  feedback: {
                    correct:
                      "Exactly! The key is balance. When you earn more, split the increase: some for lifestyle improvement, but most for savings and investments.",
                    incorrect:
                      "Actually, it's fine to enjoy some of your raise! Just make sure you're also building wealth. A good rule: save at least 50% of any raise.",
                  },
                },
                {
                  type: "info",
                  title: "The 50/30/20 Rule",
                  content:
                    "<p>A simple budgeting framework many people use:</p><ul><li><strong>50% for Needs:</strong> Rent, transport, groceries, insurance</li><li><strong>30% for Wants:</strong> Entertainment, eating out, hobbies</li><li><strong>20% for Savings:</strong> Emergency fund, investments, debt repayment</li></ul><p>If you earn R20,000/month:</p><ul><li>R10,000 for needs</li><li>R6,000 for wants</li><li>R4,000 for savings</li></ul><p>This is a guideline, not a rule. Adjust based on your situation!</p>",
                },
                {
                  type: "scenario",
                  title: "Budgeting Challenge",
                  question:
                    "You earn R18,000/month. Your needs cost R11,000. You want to save R3,000. How much can you spend on wants?",
                  options: ["R7,000", "R4,000", "R5,000", "R6,000"],
                  correct: 1,
                  feedback: {
                    correct:
                      "Perfect math! R18,000 - R11,000 (needs) - R3,000 (savings) = R4,000 for wants. This is actually better than the 50/30/20 rule!",
                    incorrect:
                      "Let's do the math: R18,000 total - R11,000 needs - R3,000 savings = R4,000 left for wants.",
                  },
                },
                {
                  type: "info",
                  title: "Your Action Plan",
                  content:
                    "<p>Here's what to do this week:</p><ul><li><strong>Track everything:</strong> Write down every expense for 7 days</li><li><strong>Categorize:</strong> Label each expense as Need, Want, or Savings</li><li><strong>Calculate:</strong> What percentage goes to each category?</li><li><strong>Adjust:</strong> If you're overspending on wants, cut one unnecessary expense</li></ul><p>Even small changes make a big difference over time!</p>",
                },
              ] satisfies LessonStep[],
            },
            {
              id: "lesson-3",
              title: "Building a Budget",
              comingSoon: true,
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
              comingSoon: true,
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
    {
      id: "salary-payslip",
      title: "Salary & Payslip",
      description: "Understand your payslip, deductions, and take-home pay",
      icon: "💼",
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
                  content:
                    "<p>Your first payslip can be shocking. You were promised R25,000 per month, but only R18,500 lands in your account. Where did R6,500 go?</p><p>Welcome to the difference between <strong>gross</strong> and <strong>net</strong> salary.</p><ul><li><strong>Gross Salary:</strong> The total amount before any deductions</li><li><strong>Net Salary (Take-Home):</strong> What you actually receive after deductions</li></ul><p>Those deductions aren't random - let's understand each one.</p>",
                },
                {
                  type: "info",
                  title: "The Big Deduction: PAYE",
                  content:
                    "<p><strong>PAYE (Pay As You Earn)</strong> is income tax deducted from your salary every month.</p><p>South Africa has a progressive tax system - the more you earn, the higher percentage you pay:</p><ul><li>First ~R95,000/year: 0% (tax-free threshold)</li><li>R95,001 - R237,100: 18%</li><li>R237,101 - R370,500: 26%</li><li>And it goes up from there...</li></ul><p><em>Note: These thresholds change annually. This is for illustration.</em></p>",
                },
                {
                  type: "mcq",
                  question: "Why does South Africa have a progressive tax system?",
                  options: [
                    "To punish high earners",
                    "So people who earn more contribute more to society",
                    "To make everyone earn the same amount",
                    "Because it's easier to calculate",
                  ],
                  correct: 1,
                  feedback: {
                    correct:
                      "Exactly! Those who can afford to pay more do pay more. This helps fund public services like healthcare, education, and infrastructure.",
                    incorrect:
                      "The progressive tax system is designed for fairness - those with higher incomes contribute a larger share to public services.",
                  },
                },
                {
                  type: "info",
                  title: "UIF - Your Safety Net",
                  content:
                    "<p><strong>UIF (Unemployment Insurance Fund)</strong> is a small monthly contribution (1% of your salary, matched by your employer) that helps if you:</p><ul><li>Lose your job</li><li>Go on maternity leave</li><li>Need illness benefits</li></ul><p>Example: If you earn R20,000/month, you pay R200 to UIF and your employer pays R200. That's R400/month going into a fund you can claim from later.</p><p>Many people ignore UIF until they need it - then they're grateful it exists!</p>",
                },
                {
                  type: "info",
                  title: "SDL - Investing in Skills",
                  content:
                    "<p><strong>SDL (Skills Development Levy)</strong> is 1% of your salary used to fund training and development programs in South Africa.</p><p>While you don't benefit directly, this helps fund learnerships, internships, and skills programs across the country.</p>",
                },
                {
                  type: "scenario",
                  title: "Reading Your Payslip",
                  question:
                    "Your payslip shows: Gross R30,000 | PAYE R4,500 | UIF R300 | Medical Aid R2,200 | Pension R3,000. What's your net pay?",
                  options: ["R30,000", "R25,500", "R20,000", "R23,700"],
                  correct: 2,
                  feedback: {
                    correct:
                      "Correct! R30,000 - R4,500 - R300 - R2,200 - R3,000 = R20,000 net pay. That's what hits your bank account.",
                    incorrect:
                      "Add up all deductions: R4,500 + R300 + R2,200 + R3,000 = R10,000. Subtract from gross: R30,000 - R10,000 = R20,000.",
                  },
                },
                {
                  type: "info",
                  title: "Other Common Deductions",
                  content:
                    "<p>Beyond statutory deductions, you might see:</p><ul><li><strong>Pension/Provident Fund:</strong> Retirement savings (often matched by employer!)</li><li><strong>Medical Aid:</strong> Health insurance (employer might contribute too)</li><li><strong>Garnishee Orders:</strong> Court-ordered deductions for debt (avoid these!)</li><li><strong>Union Fees:</strong> If you're in a union</li><li><strong>Insurance:</strong> Life cover, disability, etc.</li></ul>",
                },
                {
                  type: "true-false",
                  statement:
                    "You should always base your budget on your gross salary, not your net salary",
                  correct: false,
                  feedback: {
                    correct:
                      "Correct! Always budget based on your NET salary (take-home pay). Your gross salary includes money you'll never see.",
                    incorrect:
                      "Never budget on gross! You can't spend money that's already been deducted. Budget on what actually arrives in your account.",
                  },
                },
                {
                  type: "info",
                  title: "Pro Tip: The Annual Bonus Trap",
                  content:
                    "<p>Many employers pay a 13th cheque or annual bonus. DO NOT treat this as regular income!</p><p><strong>Why?</strong></p><ul><li>It's not guaranteed every year</li><li>It comes with higher tax (you might jump tax brackets)</li><li>If you lose your job, it stops immediately</li></ul><p><strong>Smart move:</strong> Use bonuses for once-off things like paying down debt, building emergency fund, or investing - never for monthly expenses!</p>",
                },
                {
                  type: "scenario",
                  title: "Bonus Decision",
                  question:
                    "You receive a R40,000 bonus. You have R15,000 credit card debt at 20% interest and no emergency fund. What should you do?",
                  options: [
                    "Pay off the entire credit card debt",
                    "Put R20,000 in emergency savings, R15,000 on debt, R5,000 treat yourself",
                    "Invest all of it for maximum returns",
                    "Buy the car upgrade you've been wanting",
                  ],
                  correct: 1,
                  feedback: {
                    correct:
                      "Excellent strategy! Clear the high-interest debt, start an emergency fund, and enjoy a small reward. Balanced and smart.",
                    incorrect:
                      "The 20% credit card interest is destroying you. But you also need emergency savings. The best approach balances both needs.",
                  },
                },
                {
                  type: "info",
                  title: "Action Steps",
                  content:
                    "<p>After this lesson, you should:</p><ul><li><strong>Get your latest payslip</strong> and identify every deduction</li><li><strong>Calculate</strong> what percentage of gross becomes net</li><li><strong>Check</strong> if your employer contributes to pension/medical (free money!)</li><li><strong>Update your budget</strong> based on NET salary only</li><li><strong>File away</strong> payslips - you'll need them for loans, rentals, etc.</li></ul><p>Understanding your payslip is power - you know exactly what you earn and where it goes!</p>",
                },
              ] satisfies LessonStep[],
            },
            {
              id: "lesson-2",
              title: "Understanding PAYE",
              comingSoon: true,
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
    {
      id: "banking-debit",
      title: "Banking & Debit Orders",
      description: "Master bank fees, debit orders, and disputes",
      icon: "🏦",
      units: [
        {
          id: "unit-1",
          title: "Banking Basics",
          description: "How banks work and how to choose one",
          lessons: [
            {
              id: "lesson-1",
              title: "Choosing a Bank Account",
              comingSoon: true,
            },
            {
              id: "lesson-2",
              title: "Understanding Bank Fees",
              comingSoon: true,
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
              comingSoon: true,
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
    {
      id: "credit-debt",
      title: "Credit & Debt",
      description:
        "Understand credit scores, interest, and how to escape debt",
      icon: "💳",
      units: [
        {
          id: "unit-1",
          title: "Understanding Credit",
          description: "How credit works in South Africa",
          lessons: [
            {
              id: "lesson-1",
              title: "What is a Credit Score?",
              comingSoon: true,
            },
            {
              id: "lesson-2",
              title: "How Interest Works",
              comingSoon: true,
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
              comingSoon: true,
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
    {
      id: "emergency-fund",
      title: "Emergency Fund & Risk",
      description: "Build your safety net and manage financial risk",
      icon: "🛡️",
      units: [
        {
          id: "unit-1",
          title: "Building Your Emergency Fund",
          description: "How much and where to keep it",
          lessons: [
            {
              id: "lesson-1",
              title: "How Much Do You Need?",
              comingSoon: true,
            },
            {
              id: "lesson-2",
              title: "Where to Keep Emergency Money",
              comingSoon: true,
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
    {
      id: "insurance",
      title: "Insurance & Protection",
      description: "Understand life, disability, and other insurance basics",
      icon: "☂️",
      units: [
        {
          id: "unit-1",
          title: "Life & Disability Cover",
          description: "Protecting your income and family",
          lessons: [
            {
              id: "lesson-1",
              title: "Why You Need Life Cover",
              comingSoon: true,
            },
            {
              id: "lesson-2",
              title: "Disability Insurance Basics",
              comingSoon: true,
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
              comingSoon: true,
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
    {
      id: "investing-basics",
      title: "Investing Basics",
      description: "Risk, return, diversification, and time horizon",
      icon: "📈",
      units: [
        {
          id: "unit-1",
          title: "Investment Fundamentals",
          description: "Core concepts every investor needs",
          lessons: [
            {
              id: "lesson-1",
              title: "Risk vs Return",
              comingSoon: true,
            },
            {
              id: "lesson-2",
              title: "The Power of Compound Interest",
              comingSoon: true,
            },
            {
              id: "lesson-3",
              title: "Diversification 101",
              comingSoon: true,
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
    {
      id: "sa-investing",
      title: "SA Investment Vehicles",
      description: "TFSAs, RAs, unit trusts, and ETFs explained",
      icon: "🇿🇦",
      units: [
        {
          id: "unit-1",
          title: "Tax-Free Savings (TFSA)",
          description: "Maximize your tax-free allowance",
          lessons: [
            {
              id: "lesson-1",
              title: "TFSA Rules & Limits",
              comingSoon: true,
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
              comingSoon: true,
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
    {
      id: "property",
      title: "Property & Big Purchases",
      description: "Home loans, affordability, and hidden costs",
      icon: "🏠",
      units: [
        {
          id: "unit-1",
          title: "Buying Your First Home",
          description: "From deposit to bond approval",
          lessons: [
            {
              id: "lesson-1",
              title: "How Much House Can You Afford?",
              comingSoon: true,
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
    {
      id: "taxes",
      title: "Taxes for Individuals",
      description: "Tax thresholds, filing, and deductions",
      icon: "📝",
      units: [
        {
          id: "unit-1",
          title: "Income Tax Basics",
          description: "How SARS taxes you",
          lessons: [
            {
              id: "lesson-1",
              title: "Tax Brackets Explained",
              comingSoon: true,
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
    {
      id: "scams-fraud",
      title: "Scams & Fraud",
      description: "Protect yourself from financial fraud",
      icon: "🚨",
      units: [
        {
          id: "unit-1",
          title: "Common Scams",
          description: "Recognize and avoid them",
          lessons: [
            {
              id: "lesson-1",
              title: "Phishing & Email Scams",
              comingSoon: true,
            },
            {
              id: "lesson-2",
              title: "SIM Swap Fraud",
              comingSoon: true,
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
    {
      id: "money-psychology",
      title: "Money Psychology",
      description: "Behavioral biases and lifestyle inflation",
      icon: "🧠",
      units: [
        {
          id: "unit-1",
          title: "Behavioral Biases",
          description: "How your brain tricks you with money",
          lessons: [
            {
              id: "lesson-1",
              title: "Present Bias & Delayed Gratification",
              comingSoon: true,
            },
            {
              id: "lesson-2",
              title: "Anchoring & Sunk Cost Fallacy",
              comingSoon: true,
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
              comingSoon: true,
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
  ],
};


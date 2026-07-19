// ─────────────────────────────────────────────────────────────────────────────
// LESSON REINFORCEMENT QUESTIONS
// ─────────────────────────────────────────────────────────────────────────────
// Every lesson should give the learner at least 5 questions to answer. Many of
// the original lessons only had 1-3. Rather than rewrite the intricate lesson
// files, this layer appends extra practice questions to the end of each lesson.
//
// Keyed by "courseId/lessonId" (lesson ids are NOT unique across courses).
// Questions are written to match each lesson's topic, use real South African
// context, and sit at the right difficulty for the course.
// ─────────────────────────────────────────────────────────────────────────────
import type { Course, LessonStep } from "./content";

const Q_TYPES = new Set(["mcq", "scenario", "true-false", "fill-blank"]);

export const REINFORCEMENT: Record<string, LessonStep[]> = {
  // ═══════════════════════════════════════════════════════════════════════════
  // MONEY BASICS
  // ═══════════════════════════════════════════════════════════════════════════
  "money-basics/lesson-1": [
    {
      type: "mcq",
      question: "What gives the rand in your pocket its value today?",
      options: [
        "It can be swapped for a fixed amount of gold at the Reserve Bank",
        "Trust that others will accept it, backed by it being legal tender",
        "The paper and ink each note is printed on",
        "A promise from your bank to double it",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Modern money works because we trust it will be accepted, and law makes it legal tender for debts.",
        incorrect: "The rand is not tied to gold anymore. Its value rests on trust and its status as legal tender.",
      },
    },
    {
      type: "true-false",
      statement: "R1 000 kept as cash in a drawer buys the same amount of groceries in five years as it does today.",
      correct: false,
      feedback: {
        correct: "Correct. Inflation slowly eats the buying power of idle cash, so R1 000 buys less each year.",
        incorrect: "It buys less. At 5% inflation, R1 000 has the buying power of about R780 after five years.",
      },
    },
  ],
  "money-basics/lesson-2": [
    {
      type: "scenario",
      question: "Money is tight this month. Which of these is a genuine need you should fund first?",
      options: ["The new phone on a 24 month contract", "Taxi fare to get to work", "A weekend away that is on sale", "Upgrading your streaming package"],
      correct: 1,
      feedback: {
        correct: "Yes. Getting to work protects your income, so transport is a true need this month.",
        incorrect: "A need keeps your life and income running. Taxi fare to work does that. The rest can wait.",
      },
    },
    {
      type: "mcq",
      question: "A friend says airtime is always a need because 'everyone needs a phone'. What is the honest way to look at it?",
      options: [
        "Airtime is fully a need in every case",
        "A basic amount to reach work and family is a need, endless data for scrolling is a want",
        "Airtime is always a want",
        "It only counts if you buy it at month end",
      ],
      correct: 1,
      feedback: {
        correct: "Exactly. The same category can hold both a need and a want. Split it honestly.",
        incorrect: "Most spending is not all need or all want. A basic amount is a need, the extra is a want.",
      },
    },
  ],
  "money-basics/lesson-3": [
    {
      type: "mcq",
      question: "The 50/30/20 guideline splits your take-home pay into which three buckets?",
      options: [
        "50% wants, 30% needs, 20% savings",
        "50% needs, 30% wants, 20% savings and debt",
        "50% savings, 30% needs, 20% wants",
        "50% rent, 30% food, 20% airtime",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Needs get half, wants get up to a third, and at least a fifth goes to savings and paying down debt.",
        incorrect: "It is 50% needs, 30% wants, 20% savings and debt. Needs come first, savings are protected last.",
      },
    },
    {
      type: "fill-blank",
      title: "Split the pay",
      prompt: "Lerato takes home R15 000 a month. Using the 50% needs rule, she should cap her needs at about R___.",
      correct: 7500,
      feedback: {
        correct: "Yes. Half of R15 000 is R7 500 for rent, transport, food and other essentials.",
        incorrect: "Half of R15 000 is R7 500. That is the ceiling for needs under the 50% rule.",
      },
    },
    {
      type: "true-false",
      statement: "A budget is only worth doing once you earn a big salary.",
      correct: false,
      feedback: {
        correct: "Correct. A budget matters most when money is tight, because every rand has a job to do.",
        incorrect: "The opposite is true. The less you earn, the more a plan for each rand helps you cope.",
      },
    },
  ],
  "money-basics/lesson-4": [
    {
      type: "mcq",
      question: "What is the point of writing down every rand you spend for a month?",
      options: [
        "To feel guilty about takeaways",
        "To see where money actually goes, not where you think it goes",
        "To impress your bank",
        "So SARS can check it",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Tracking shows the real picture, and small leaks like daily snacks add up fast.",
        incorrect: "Tracking is about seeing the truth of where money goes so you can fix the leaks.",
      },
    },
    {
      type: "scenario",
      question: "Bongani checks his bank app and finds three small subscriptions he forgot about, costing R240 a month. What is the smart next step?",
      options: ["Ignore it, it is only small", "Cancel the ones he does not use and redirect the money to savings", "Cancel his whole account", "Wait for the bank to refund him"],
      correct: 1,
      feedback: {
        correct: "Yes. R240 a month is nearly R2 900 a year. Cancelling the dead ones is an easy win.",
        incorrect: "Small leaks matter. R240 a month is close to R2 900 a year that could go to savings.",
      },
    },
  ],
  "money-basics/lesson-zero-based-budget": [
    {
      type: "mcq",
      question: "In a zero-based budget, what does 'zero' refer to?",
      options: [
        "You must end the month with zero rand in your account",
        "Income minus every assigned rand equals zero, so every rand has a job",
        "You start with zero savings",
        "You spend zero on wants",
      ],
      correct: 1,
      feedback: {
        correct: "Right. You assign income to needs, wants, savings and debt until nothing is left unassigned.",
        incorrect: "Zero means income minus all your assignments is zero. Savings is one of those jobs, not leftover.",
      },
    },
    {
      type: "true-false",
      statement: "In a zero-based budget, money you plan to save counts as one of the jobs you give your rands.",
      correct: true,
      feedback: {
        correct: "Correct. Savings is a planned assignment, not whatever happens to be left over.",
        incorrect: "Savings is a job you assign on purpose, the same as rent or transport.",
      },
    },
  ],
  "money-basics/lesson-cash-flow": [
    {
      type: "mcq",
      question: "Your salary lands on the 25th but most debit orders run on the 1st. What is the cash flow risk?",
      options: [
        "There is no risk if the total adds up over the month",
        "Money can run short between the 1st and 25th even when the monthly total is fine",
        "Debit orders always move to payday automatically",
        "The bank covers the gap for free",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Timing matters as much as totals. A gap between outflows and payday causes bounced orders.",
        incorrect: "Cash flow is about timing. If big outflows hit before payday, you can run short mid-month.",
      },
    },
    {
      type: "scenario",
      question: "Naledi keeps bouncing debit orders early in the month. What is the cleanest fix?",
      options: ["Take out a loan each month", "Ask her providers to move debit order dates closer to payday", "Cancel all her debit orders", "Change banks"],
      correct: 1,
      feedback: {
        correct: "Yes. Aligning debit order dates with payday smooths cash flow and avoids bounce fees.",
        incorrect: "The simplest fix is to move debit order dates closer to when she gets paid.",
      },
    },
  ],
  "money-basics/lesson-salary-negotiation": [
    {
      type: "mcq",
      question: "Before asking for a raise, what is the strongest thing to bring to the conversation?",
      options: [
        "How much your rent went up",
        "Evidence of results you delivered and what similar roles pay",
        "A threat to resign on the spot",
        "How long you have worked there",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Managers respond to value and market data, not personal expenses or threats.",
        incorrect: "Lead with your results and market pay for the role. That is what justifies a raise.",
      },
    },
    {
      type: "true-false",
      statement: "If a company cannot move on base salary, benefits like extra leave, a training budget or a work-from-home day are still worth negotiating.",
      correct: true,
      feedback: {
        correct: "Correct. Total package matters. Non-cash benefits have real value and are often easier to grant.",
        incorrect: "They are worth asking for. When cash is fixed, benefits can still improve your overall deal.",
      },
    },
  ],
  "money-basics/lesson-financial-goals": [
    {
      type: "mcq",
      question: "Which of these is written as a strong, specific money goal?",
      options: [
        "Save as much as possible every single month",
        "Save R12 000 for a car deposit by December at R1 000 a month",
        "Cut down on all unnecessary spending this year",
        "Build real wealth before turning forty",
      ],
      correct: 1,
      feedback: {
        correct: "Right. It has an amount, a deadline and a monthly action, so you can track it.",
        incorrect: "A strong goal names the amount, the deadline and the monthly step. Only that option does all three.",
      },
    },
    {
      type: "fill-blank",
      title: "Work back the monthly amount",
      prompt: "To save R12 000 in 12 months, you need to put away R___ each month.",
      correct: 1000,
      feedback: {
        correct: "Yes. R12 000 divided by 12 months is R1 000 a month.",
        incorrect: "Divide the target by the months: R12 000 / 12 = R1 000 a month.",
      },
    },
  ],
  "money-basics/lesson-side-income": [
    {
      type: "mcq",
      question: "What is the most useful first question before starting a side hustle?",
      options: [
        "How can I quit my job first",
        "What skill or asset do I already have that someone will pay for",
        "Which hustle made someone on TikTok rich",
        "How big a loan can I get",
      ],
      correct: 1,
      feedback: {
        correct: "Right. The best side income usually starts from a skill or asset you already have, with low startup cost.",
        incorrect: "Start from what you can already offer. Copying a trend or borrowing big adds risk before you earn a cent.",
      },
    },
    {
      type: "true-false",
      statement: "Money you earn from a side hustle can still be taxable and may need to be declared to SARS.",
      correct: true,
      feedback: {
        correct: "Correct. Extra income counts as income. Keep records, because SARS expects you to declare it.",
        incorrect: "Side income is still income. Depending on the amount, you may need to declare it to SARS.",
      },
    },
  ],
  "money-basics/lesson-interest-rates-wallet": [
    {
      type: "mcq",
      question: "When the Reserve Bank raises the repo rate, what usually happens to your bond and car repayments?",
      options: ["They fall", "They rise, because lending rates track the repo rate", "They stay fixed forever", "Only credit cards change"],
      correct: 1,
      feedback: {
        correct: "Right. Banks lend at prime, which moves with the repo rate, so variable repayments go up.",
        incorrect: "Most SA loans are linked to prime, which follows the repo rate. A hike raises your repayments.",
      },
    },
    {
      type: "true-false",
      statement: "Higher interest rates are good news for borrowers because loan repayments shrink.",
      correct: false,
      feedback: {
        correct: "Right. Higher rates make loans cost MORE. It is savers who benefit when rates rise.",
        incorrect: "It is the other way round. Higher rates push repayments up; savings accounts earn more.",
      },
    },
  ],
  "money-basics/lesson-money-talks": [
    {
      type: "scenario",
      question: "A family member keeps asking you for 'small loans' that never come back. What is a healthy way to handle it?",
      options: [
        "Keep lending to avoid conflict",
        "Be honest about what you can give, and treat a gift as a gift rather than a loan you resent",
        "Cut them off with no explanation",
        "Borrow money yourself to keep helping",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Clear limits protect the relationship and your budget. If you give, give what you can spare.",
        incorrect: "Honest limits are healthier than silent resentment or borrowing to fund someone else.",
      },
    },
    {
      type: "true-false",
      statement: "Talking openly about money with a partner before combining finances lowers the chance of nasty surprises later.",
      correct: true,
      feedback: {
        correct: "Correct. Sharing debts, income and habits early prevents conflict once money is mixed.",
        incorrect: "Open money talk early is protective. Hidden debts and mismatched habits cause most money fights.",
      },
    },
  ],
  "money-basics/lesson-cost-of-debt-lifestyle": [
    {
      type: "mcq",
      question: "Why is funding your lifestyle on credit so dangerous over time?",
      options: [
        "Credit is always interest free",
        "You pay interest on things that lose value, so the true cost is far above the ticket price",
        "It builds your savings",
        "Shops give you the item for free later",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Clothes, meals and gadgets lose value while the debt and its interest stay with you.",
        incorrect: "You end up paying interest on things that are already used up or worth less. That is the trap.",
      },
    },
  ],
  "money-basics/lesson-5": [
    {
      type: "mcq",
      question: "Two shops sell the same 2 litre milk. Shop A: R32. Shop B: R30 but a R15 taxi trip further away. You only need milk. Which is cheaper overall?",
      options: ["Shop B, it lists a lower price", "Shop A, once you add the R15 travel the trip to B costs more", "They are the same", "Shop B, taxi fare never counts"],
      correct: 1,
      feedback: {
        correct: "Right. The R2 saving is wiped out by R15 in taxi fare. Always count the cost of getting there.",
        incorrect: "For one item, the R15 taxi fare makes Shop B more expensive. Total cost beats sticker price.",
      },
    },
    {
      type: "fill-blank",
      title: "Compare per unit",
      prompt: "A 500g bag of rice is R20 and a 2kg bag is R64. The 2kg bag costs R___ per kg.",
      correct: 32,
      feedback: {
        correct: "Yes. R64 divided by 2kg is R32 per kg, cheaper than the small bag at R40 per kg.",
        incorrect: "Divide price by weight: R64 / 2kg = R32 per kg. The unit price is how you compare fairly.",
      },
    },
    {
      type: "true-false",
      statement: "A 'special' sticker always means the item is the cheapest option on the shelf.",
      correct: false,
      feedback: {
        correct: "Correct. A special can still cost more per unit than a plain house brand next to it. Check the unit price.",
        incorrect: "Not always. Specials can still be pricier per kg or litre than an ordinary brand. Compare unit prices.",
      },
    },
    {
      type: "scenario",
      question: "You are about to buy a R1 200 appliance. What is the quickest way to check you are not overpaying?",
      options: ["Trust the first shop", "Check a price comparison app or two other shops before paying", "Buy it and return it if you see it cheaper", "Ask the cashier if it is a good deal"],
      correct: 1,
      feedback: {
        correct: "Right. Two minutes on PriceCheck or a quick phone around can save a real chunk on bigger buys.",
        incorrect: "For a larger buy, a fast check across a couple of shops or an app is worth the two minutes.",
      },
    },
  ],
  "money-basics/lesson-6": [
    {
      type: "mcq",
      question: "What makes the '24 hour rule' useful against impulse buying?",
      options: [
        "It guarantees the item goes on sale",
        "It breaks the rush of the moment, so you decide with a clear head",
        "It lets the shop hold the item for you",
        "It removes all interest on credit",
      ],
      correct: 1,
      feedback: {
        correct: "Right. The urge to buy fades with time. If you still want it tomorrow and can pay cash, it is a fairer choice.",
        incorrect: "The rule works by cooling the urgency. Most impulse wants shrink once you sleep on them.",
      },
    },
    {
      type: "true-false",
      statement: "Shops add 'sale ends today' timers and one-click checkout mainly to help you compare prices calmly.",
      correct: false,
      feedback: {
        correct: "Right. Those tactics manufacture urgency so you buy before thinking it through.",
        incorrect: "Urgency tools are designed to rush you, not help you compare. Slow down before you pay.",
      },
    },
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // SALARY & PAYSLIP
  // ═══════════════════════════════════════════════════════════════════════════
  "salary-payslip/lesson-1": [
    {
      type: "mcq",
      question: "Your offer letter says R20 000 'gross'. Why will less than that land in your account?",
      options: [
        "The bank keeps a cut",
        "Deductions like PAYE, UIF and any pension come off before you get net pay",
        "Gross pay is a typing error",
        "Employers always round down",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Gross is before deductions. Net, or take-home, is what remains after tax, UIF and the rest.",
        incorrect: "Gross is the full figure. PAYE, UIF and pension come off to leave your net, or take-home, pay.",
      },
    },
    {
      type: "true-false",
      statement: "You should budget around your net (take-home) pay, not your gross salary.",
      correct: true,
      feedback: {
        correct: "Correct. Only your net pay actually reaches your account, so that is the number to plan with.",
        incorrect: "Budget with net pay. Gross includes money that never lands in your account.",
      },
    },
  ],
  "salary-payslip/lesson-2": [
    {
      type: "mcq",
      question: "What is PAYE on your payslip?",
      options: [
        "A monthly account administration charge",
        "Pay As You Earn, income tax withheld by your employer",
        "A compulsory pension fund contribution",
        "A garnishee order deducted by court instruction",
      ],
      correct: 1,
      feedback: {
        correct: "Right. PAYE is income tax collected monthly by your employer on behalf of SARS.",
        incorrect: "PAYE stands for Pay As You Earn. It is your income tax, withheld monthly and paid to SARS.",
      },
    },
    {
      type: "true-false",
      statement: "Because PAYE is taken off every month, most salaried employees have already paid their income tax by year end.",
      correct: true,
      feedback: {
        correct: "Correct. PAYE spreads your tax across the year, which is why many people owe little or get a refund at filing.",
        incorrect: "PAYE pre-pays your tax monthly. At filing you settle any small difference up or down.",
      },
    },
    {
      type: "mcq",
      question: "SA income tax is 'progressive'. What does that mean for a raise?",
      options: [
        "Your whole salary jumps to a higher tax rate",
        "Only the rands inside the higher bracket are taxed at the higher rate",
        "You pay tax twice",
        "Raises are tax free",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Higher rates apply only to the portion of income in that bracket, so a raise always leaves you better off.",
        incorrect: "Only the income within each bracket is taxed at that bracket's rate. A raise never lowers your take-home.",
      },
    },
  ],
  "salary-payslip/lesson-3": [
    {
      type: "mcq",
      question: "How much of your pay goes to UIF, and who else contributes?",
      options: [
        "1% from you, matched by 1% from your employer",
        "5% from you only",
        "Nothing, it is free",
        "10% split three ways",
      ],
      correct: 0,
      feedback: {
        correct: "Right. You pay 1% and your employer adds 1%, up to the monthly earnings ceiling.",
        incorrect: "UIF is 1% from you and 1% from your employer, capped at a set monthly earnings ceiling.",
      },
    },
  ],
  "salary-payslip/lesson-4": [
    {
      type: "true-false",
      statement: "Your own pension or provident fund contribution on your payslip reduces the income you are taxed on, up to SARS limits.",
      correct: true,
      feedback: {
        correct: "Correct. Retirement contributions are tax deductible up to 27.5% of income, capped at R350 000 a year.",
        incorrect: "They are deductible. Retirement contributions lower your taxable income up to 27.5%, capped at R350 000 a year.",
      },
    },
  ],
  "salary-payslip/lesson-13th-cheque": [
    {
      type: "mcq",
      question: "A 13th cheque or bonus is taxed how?",
      options: [
        "Tax free because it is a gift",
        "As income, so PAYE applies and it can push that month into a higher bracket",
        "At a flat 5%",
        "Only if it is over R100 000",
      ],
      correct: 1,
      feedback: {
        correct: "Right. A bonus is taxable income. The month it pays out often looks heavily taxed for that reason.",
        incorrect: "A bonus is taxed as income. That is why the payslip that carries it shows a bigger PAYE bite.",
      },
    },
    {
      type: "scenario",
      question: "Ayanda gets a R15 000 December bonus. What is the smartest first use given the January squeeze many families feel?",
      options: [
        "Spend it all on holiday",
        "Cover January essentials and school costs first, then save or clear a debt with the rest",
        "Buy the newest phone on credit anyway",
        "Lend it all to friends",
      ],
      correct: 1,
      feedback: {
        correct: "Right. December money that covers January avoids new debt when the long month hits.",
        incorrect: "The strongest move is to protect January first, then save or kill a debt. Bonuses vanish fast otherwise.",
      },
    },
  ],
  "salary-payslip/lesson-ctc": [
    {
      type: "mcq",
      question: "A job is advertised as 'R30 000 CTC'. What does cost to company mean for your take-home?",
      options: [
        "R30 000 lands in your account every month",
        "Total cost including benefits, so take-home is less",
        "Benefits are added on top of the R30 000",
        "It is R30 000 after tax and deductions",
      ],
      correct: 1,
      feedback: {
        correct: "Right. CTC bundles benefits and contributions into one figure, so net pay is noticeably lower.",
        incorrect: "CTC is the full package. Medical aid, pension and tax come out of it, so take-home is less than R30 000.",
      },
    },
    {
      type: "true-false",
      statement: "When comparing two job offers, comparing CTC to CTC can mislead you if one includes medical aid and pension and the other does not.",
      correct: true,
      feedback: {
        correct: "Correct. Always check what each CTC includes. A higher CTC with everything bundled can mean lower take-home.",
        incorrect: "It can mislead you. Break each CTC into its parts to see the real take-home and benefits.",
      },
    },
  ],
  "salary-payslip/lesson-tax-return-employee": [
    {
      type: "true-false",
      statement: "Even if PAYE was deducted all year, filing a return can get you a refund for things like retirement annuity or medical expenses.",
      correct: true,
      feedback: {
        correct: "Correct. Deductions you claim at filing, like RA contributions, can turn into a refund.",
        incorrect: "Filing can pay off. Claims such as RA contributions and out-of-pocket medical costs can trigger a refund.",
      },
    },
  ],
  "salary-payslip/lesson-salary-tax-efficiency": [
    {
      type: "mcq",
      question: "Which is a legitimate way to lower the tax on your salary?",
      options: [
        "Hiding income from SARS",
        "Increasing your pension or retirement annuity contribution within the 27.5% limit",
        "Being paid in cash off the books",
        "Claiming fake expenses",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Boosting retirement contributions is a legal, SARS-approved way to reduce taxable income.",
        incorrect: "The legal route is more retirement contributions within the limit. The rest is tax evasion, which is a crime.",
      },
    },
    {
      type: "true-false",
      statement: "A travel allowance only saves tax if you actually keep a logbook of business kilometres.",
      correct: true,
      feedback: {
        correct: "Correct. Without a logbook you cannot claim the business portion, so the allowance is just taxed income.",
        incorrect: "You need the logbook. SARS requires it to allow the business travel claim against the allowance.",
      },
    },
  ],
  "salary-payslip/lesson-payslip-errors": [
    {
      type: "mcq",
      question: "You spot that your payslip taxed a once-off reimbursement for work travel. What should you do?",
      options: [
        "Nothing, payslips are always right",
        "Query it with payroll or HR in writing and keep the proof",
        "Resign",
        "Report your employer to the police",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Payroll makes mistakes. A written query with proof is the way to get it corrected.",
        incorrect: "Raise it in writing with payroll or HR. A genuine reimbursement should not be taxed as income.",
      },
    },
    {
      type: "true-false",
      statement: "You should check that your payslip UIF and PAYE numbers look consistent each month, not just at year end.",
      correct: true,
      feedback: {
        correct: "Correct. Catching an error early is far easier than unwinding twelve wrong payslips at filing time.",
        incorrect: "Check monthly. Small payroll errors are quick to fix now and painful to reverse a year later.",
      },
    },
  ],
  "salary-payslip/lesson-applied-read-payslip": [
    {
      type: "fill-blank",
      title: "Find the take-home",
      prompt: "Gross is R18 000. Deductions are PAYE R2 400, UIF R180 and pension R1 260. Net pay is R___.",
      correct: 14160,
      feedback: {
        correct: "Yes. R18 000 minus R2 400, R180 and R1 260 leaves R14 160 take-home.",
        incorrect: "Subtract all deductions from gross: 18 000 - 2 400 - 180 - 1 260 = R14 160.",
      },
    },
    {
      type: "mcq",
      question: "On a payslip, what is the difference between an 'earning' and a 'deduction' line?",
      options: [
        "They are the same thing",
        "Earnings add to your pay, deductions are taken off it",
        "Deductions add to your pay",
        "Earnings are only bonuses",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Earnings build gross pay, deductions reduce it to reach your net.",
        incorrect: "Earnings increase your pay, deductions decrease it. Gross minus deductions is your net pay.",
      },
    },
  ],

  "salary-payslip/lesson-medical-aid-payslip": [
    {
      type: "mcq",
      question: "Your employer pays part of your medical aid on your payslip. How does SARS treat that employer contribution?",
      options: [
        "It is excluded from your taxable income",
        "A taxable fringe benefit offset by a medical tax credit",
        "It is taxed twice, on you and your employer",
        "It is deducted again from your net salary",
      ],
      correct: 1,
      feedback: {
        correct: "Right. The employer portion is a fringe benefit, and the medical scheme tax credit offsets tax for members.",
        incorrect: "It is a taxable fringe benefit, but the medical tax credit for you and your dependants lowers the tax.",
      },
    },
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // BANKING & DEBIT ORDERS
  // ═══════════════════════════════════════════════════════════════════════════
  "banking-debit/lesson-1": [
    {
      type: "mcq",
      question: "What matters most when choosing a transactional bank account for everyday use?",
      options: [
        "The design and status tier of the card",
        "The fees and charges against how you actually bank",
        "The size of the nearest branch network",
        "The bank's brand reputation and adverts",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Match the fee structure to your habits. A heavy cash user and a card-only user need different accounts.",
        incorrect: "Focus on fees versus how you bank. The right account depends on your transaction pattern, not the brand.",
      },
    },
    {
      type: "true-false",
      statement: "A bundled (fixed monthly fee) account can work out cheaper than pay-as-you-use if you make many transactions.",
      correct: true,
      feedback: {
        correct: "Correct. Bundles suit heavy users. Light users often pay less on pay-as-you-use.",
        incorrect: "It can be cheaper for heavy users. Bundles cap the cost of many transactions.",
      },
    },
    {
      type: "scenario",
      question: "Thabo mostly taps his card and rarely draws cash. Which account suits him?",
      options: [
        "One with high card fees but free cash withdrawals",
        "A low-fee account where card and app payments are cheap or free",
        "A business account",
        "Whatever his friend uses",
      ],
      correct: 1,
      feedback: {
        correct: "Right. He should pick the account that is cheap on the things he actually does, which is card and app payments.",
        incorrect: "Pick for your habits. A card-and-app user wants low card and app costs, not free cash he never draws.",
      },
    },
  ],
  "banking-debit/lesson-2": [
    {
      type: "mcq",
      question: "Which bank fee is easiest to avoid with a small habit change?",
      options: [
        "Drawing cash at another bank's ATM instead of your own or a till point",
        "The account monthly fee",
        "Card replacement after loss",
        "SMS notification fees you did not choose",
      ],
      correct: 0,
      feedback: {
        correct: "Right. Cash withdrawals at other ATMs cost more. Using your own bank or cashback at a till avoids that.",
        incorrect: "Other-bank ATM draws carry extra fees. Drawing at your own bank or asking for cashback at a till avoids them.",
      },
    },
    {
      type: "true-false",
      statement: "Drawing R100 five separate times usually costs less in fees than drawing R500 once.",
      correct: false,
      feedback: {
        correct: "Right. Per-withdrawal fees add up, so fewer, larger draws cost less overall.",
        incorrect: "Five small draws usually cost MORE. Each withdrawal carries a fee, so consolidate.",
      },
    },
    {
      type: "fill-blank",
      title: "Add up the leak",
      prompt: "An avoidable R11 other-bank ATM fee, paid twice a week, wastes about R___ over a year (use 52 weeks).",
      correct: 1144,
      feedback: {
        correct: "Yes. R11 x 2 x 52 is R1 144 a year gone to a fee you could avoid.",
        incorrect: "R11 x 2 draws x 52 weeks = R1 144 a year. Small fees add up fast.",
      },
    },
    {
      type: "mcq",
      question: "What is the best way to actually see what fees you are paying?",
      options: [
        "Guess from your balance",
        "Read your bank's fee guide and check the fee lines on your statement",
        "Ask a friend",
        "Assume they are all unavoidable",
      ],
      correct: 1,
      feedback: {
        correct: "Right. The fee guide plus your statement show exactly what you pay and where to cut.",
        incorrect: "Check the published fee guide against your statement. That is how you find and stop the leaks.",
      },
    },
  ],
  "banking-debit/lesson-3": [
    {
      type: "mcq",
      question: "Why is using the banking app often cheaper than going into a branch?",
      options: [
        "Apps pay you to log in",
        "App and digital transactions usually carry lower fees than in-branch, assisted ones",
        "Branches are always closed",
        "It is not cheaper",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Assisted, in-branch transactions cost the most. App payments and transfers are usually the cheapest.",
        incorrect: "Digital is generally cheaper. In-branch, teller-assisted transactions carry the highest fees.",
      },
    },
    {
      type: "true-false",
      statement: "You should only ever log into your banking app on a network and device you trust, never on shared or public wifi.",
      correct: true,
      feedback: {
        correct: "Correct. Public wifi and shared devices raise the risk of your details being captured.",
        incorrect: "Stick to trusted devices and networks. Public wifi is a common route for details to be stolen.",
      },
    },
  ],
  "banking-debit/lesson-4": [
    {
      type: "mcq",
      question: "What exactly is a debit order?",
      options: [
        "A once-off payment you make manually",
        "A standing instruction that lets a company pull an agreed amount from your account on a set date",
        "A type of savings account",
        "A loan from your bank",
      ],
      correct: 1,
      feedback: {
        correct: "Right. You authorise a company to collect from your account regularly, such as for insurance or a gym.",
        incorrect: "A debit order is an authorised, recurring pull by a company from your account, not a once-off payment.",
      },
    },
    {
      type: "mcq",
      question: "What is the difference between a normal debit order and a DebiCheck one?",
      options: [
        "DebiCheck is fake",
        "DebiCheck orders are electronically approved by you upfront, which is harder to abuse",
        "Normal debit orders need a court order",
        "There is no difference",
      ],
      correct: 1,
      feedback: {
        correct: "Right. DebiCheck requires you to confirm the mandate once, giving stronger protection against fraud.",
        incorrect: "DebiCheck adds an upfront electronic approval by you, making unauthorised collections harder.",
      },
    },
    {
      type: "true-false",
      statement: "If a debit order bounces because there was no money, you can still be charged a fee.",
      correct: true,
      feedback: {
        correct: "Correct. Unpaid or bounced debit orders often trigger a fee from your bank or the biller.",
        incorrect: "A bounce can cost you. Both banks and billers may charge for a failed collection.",
      },
    },
    {
      type: "scenario",
      question: "A debit order you never agreed to appears on your statement. What is the right first move?",
      options: [
        "Pay it to be safe",
        "Dispute it with your bank quickly, since there are time limits to reverse it",
        "Close your account and open a new one abroad",
        "Ignore it",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Report it to your bank fast. Reversal rights on unauthorised orders are strongest early on.",
        incorrect: "Dispute it with your bank promptly. There are time windows to reverse an unauthorised debit order.",
      },
    },
  ],
  "banking-debit/lesson-5": [
    {
      type: "true-false",
      statement: "Stopping a debit order at your bank automatically cancels the contract you signed with the company.",
      correct: false,
      feedback: {
        correct: "Right. The contract survives. You must cancel the agreement itself or the debt keeps growing.",
        incorrect: "Stopping the collection is not cancelling the contract. End the agreement too, in writing.",
      },
    },
  ],
  "banking-debit/lesson-6": [
    {
      type: "mcq",
      question: "You spot a card purchase you did not make. What should you do first?",
      options: [
        "Wait a month to see if it repeats",
        "Report it to your bank at once and freeze or replace the card",
        "Post about it online",
        "Change your PIN and do nothing else",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Fast reporting and freezing the card limits further loss and starts the dispute clock.",
        incorrect: "Report and freeze immediately. Speed limits the damage and protects your dispute rights.",
      },
    },
    {
      type: "true-false",
      statement: "Keeping proof, like dates and reference numbers, makes a transaction dispute far easier to win.",
      correct: true,
      feedback: {
        correct: "Correct. Clear records of what happened and when strengthen your case with the bank.",
        incorrect: "Records matter. Dates, amounts and reference numbers make your dispute much stronger.",
      },
    },
  ],
  "banking-debit/lesson-savings-accounts-sa": [
    {
      type: "mcq",
      question: "What is the main trade-off to weigh when choosing a savings account?",
      options: [
        "Colour versus size",
        "Interest rate versus how quickly you can access the money",
        "Branch versus app",
        "There is no trade-off",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Notice and fixed accounts pay more but lock the money. Instant-access pays less but stays flexible.",
        incorrect: "It is rate versus access. Higher rates usually mean less immediate access to your cash.",
      },
    },
  ],
  "banking-debit/lesson-credit-vs-debit-cards": [
    {
      type: "true-false",
      statement: "A credit card used carefully and paid in full each month can give you an interest-free period, while a debit card spends your own money right away.",
      correct: true,
      feedback: {
        correct: "Correct. Paid in full monthly, a credit card costs no interest. A debit card draws your own funds instantly.",
        incorrect: "That is the key difference. Full monthly repayment makes a credit card interest free. A debit card is your own money.",
      },
    },
  ],
  "banking-debit/lesson-bank-switching": [
    {
      type: "mcq",
      question: "When switching banks, what is the step people most often forget?",
      options: [
        "Updating the banking app on their phone",
        "Moving every debit order to the new account first",
        "Keeping proof of their old account number",
        "Notifying SARS of the new account branch code",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Move all debit orders and your salary first, or payments will bounce on the old, empty account.",
        incorrect: "The big one is moving debit orders and your salary before closing the old account, to avoid bounces.",
      },
    },
    {
      type: "true-false",
      statement: "It is wise to keep the old account open for a month or two after switching, until you are sure everything moved across.",
      correct: true,
      feedback: {
        correct: "Correct. A short overlap catches any stray debit order you missed before you close the old account.",
        incorrect: "Keep a short overlap. It catches any payment you forgot to move before the old account closes.",
      },
    },
  ],
  "banking-debit/lesson-overdraft": [
    {
      type: "mcq",
      question: "Why can an overdraft quietly become a trap?",
      options: [
        "It is interest free",
        "It feels like your own money but charges interest, and you can end up permanently living in it",
        "The bank forgets about it",
        "It builds your credit score for free",
      ],
      correct: 1,
      feedback: {
        correct: "Right. An overdraft blends into your balance, so many people never climb out and pay interest forever.",
        incorrect: "The danger is that it feels like your balance but charges interest, and becomes a permanent debt.",
      },
    },
    {
      type: "true-false",
      statement: "An overdraft is best used as a short-term buffer you clear quickly, not as an extension of your monthly income.",
      correct: true,
      feedback: {
        correct: "Correct. A brief, cleared-fast buffer is fine. Living in your overdraft month after month is expensive.",
        incorrect: "Use it briefly and clear it. Treating an overdraft as extra income leads to a permanent, costly debt.",
      },
    },
  ],
  "banking-debit/lesson-international-transfers": [
    {
      type: "mcq",
      question: "When sending money abroad, what often costs more than the advertised fee?",
      options: [
        "The colour of the form",
        "A poor exchange rate with a hidden margin baked in",
        "The recipient's name",
        "Nothing, the fee is the only cost",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Providers often make money on the exchange rate margin, which can dwarf the visible fee.",
        incorrect: "Watch the exchange rate margin. It is a hidden cost that can be larger than the stated fee.",
      },
    },
    {
      type: "true-false",
      statement: "Larger cross-border transfers may need supporting documents and can involve SARS and Reserve Bank rules.",
      correct: true,
      feedback: {
        correct: "Correct. Above certain limits, exchange control and tax clearance requirements can apply.",
        incorrect: "They can apply. Bigger transfers may need documents and clearance under exchange control rules.",
      },
    },
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // CREDIT & DEBT
  // ═══════════════════════════════════════════════════════════════════════════
  "credit-debt/lesson-1": [
    {
      type: "mcq",
      question: "What is a credit score really measuring?",
      options: [
        "How much money you keep in your accounts",
        "How likely you are to repay borrowed money on time",
        "How much you earn compared to your peers",
        "How long you have been with your bank",
      ],
      correct: 1,
      feedback: {
        correct: "Right. It is a risk estimate from your repayment history, not a measure of wealth or income.",
        incorrect: "A credit score rates repayment risk from your history. A high earner with missed payments can still score poorly.",
      },
    },
    {
      type: "true-false",
      statement: "You must pay the credit bureaus a fee every time you want to see your own credit report.",
      correct: false,
      feedback: {
        correct: "Right. SA law entitles you to one free report a year from the major bureaus.",
        incorrect: "You get a free annual report by law. Check it yearly for errors that could cost you.",
      },
    },
    {
      type: "mcq",
      question: "Which action most reliably lifts a credit score over time?",
      options: [
        "Earning more",
        "Paying every account on time, every month",
        "Closing all accounts",
        "Never using credit at all",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Consistent on-time payment is the single biggest driver of a healthy score.",
        incorrect: "On-time payments, month after month, matter most. Income alone does not build a score.",
      },
    },
  ],
  "credit-debt/lesson-2": [
    {
      type: "mcq",
      question: "What is compound interest on a debt?",
      options: [
        "Interest charged only on the original amount",
        "Interest charged on the balance plus interest already added, so debt grows faster",
        "A discount for paying late",
        "A government tax",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Unpaid interest joins the balance, so you pay interest on interest. This is why debt snowballs.",
        incorrect: "Compound interest adds unpaid interest to the balance, then charges interest on that too. Debt grows faster.",
      },
    },
    {
      type: "fill-blank",
      title: "Feel the rate",
      prompt: "A R5 000 balance at 20% simple annual interest, left unpaid for one year, grows by R___ in interest.",
      correct: 1000,
      feedback: {
        correct: "Yes. 20% of R5 000 is R1 000 of interest in a year, before any compounding.",
        incorrect: "20% of R5 000 is R1 000. That is the interest for one year, and compounding makes it worse.",
      },
    },
    {
      type: "true-false",
      statement: "The higher the interest rate, the more it matters to pay the debt off quickly.",
      correct: true,
      feedback: {
        correct: "Correct. High-rate debt like store cards and payday loans punishes every extra month you carry it.",
        incorrect: "It matters more, not less. High-rate debt costs you fast, so clearing it quickly saves the most.",
      },
    },
    {
      type: "mcq",
      question: "Why is a payday or 'mashonisa' loan usually the most expensive way to borrow?",
      options: [
        "It is interest free",
        "The effective interest and fees over a short term are extremely high",
        "It builds your credit score fastest",
        "SARS refunds it",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Short-term, high-fee loans carry brutal effective rates and trap many borrowers in repeat borrowing.",
        incorrect: "The effective cost is very high. Short terms plus big fees make these loans the priciest option.",
      },
    },
  ],
  "credit-debt/lesson-3": [
    {
      type: "mcq",
      question: "Which is the clearest example of 'good' debt?",
      options: [
        "A store card for clothes",
        "A home loan on a property likely to hold or grow its value",
        "A payday loan for a night out",
        "Buy now pay later for takeaways",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Good debt buys an asset or earning power. A bond on a solid property is the classic case.",
        incorrect: "Good debt funds something that lasts or grows, like property or a qualification, not consumables.",
      },
    },
    {
      type: "true-false",
      statement: "Debt taken to buy something that loses value quickly, at a high interest rate, is a sign of bad debt.",
      correct: true,
      feedback: {
        correct: "Correct. High-rate borrowing for fast-depreciating wants is the textbook definition of bad debt.",
        incorrect: "That is bad debt. High interest on things that lose value fast is exactly what to avoid.",
      },
    },
  ],
  "credit-debt/lesson-4": [
    {
      type: "mcq",
      question: "Why are store cards and retail credit often a poor deal?",
      options: [
        "They have no interest ever",
        "They carry high interest and tempt you to buy things you would skip if paying cash",
        "They lower all prices",
        "They are illegal",
      ],
      correct: 1,
      feedback: {
        correct: "Right. High rates plus easy credit at the till encourage spending you would otherwise avoid.",
        incorrect: "Store credit is usually high interest and nudges extra spending. Paying cash keeps you honest.",
      },
    },
    {
      type: "true-false",
      statement: "An 'interest-free for 6 months' offer can still cost you if a single late payment triggers back-dated interest.",
      correct: true,
      feedback: {
        correct: "Correct. Miss the terms and the interest can apply from day one. Read the fine print.",
        incorrect: "It can bite. Many interest-free deals reverse and back-date interest if you slip up, so read the terms.",
      },
    },
  ],
  "credit-debt/lesson-debt-avalanche": [
    {
      type: "mcq",
      question: "How does the debt avalanche method decide which debt to attack first?",
      options: [
        "The smallest balance",
        "The highest interest rate",
        "The oldest debt",
        "The one with the nicest lender",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Avalanche targets the highest rate first, which saves the most money in interest.",
        incorrect: "Avalanche hits the highest interest rate first. That order minimises total interest paid.",
      },
    },
    {
      type: "true-false",
      statement: "The avalanche method saves the most in interest, but the snowball method can feel more motivating.",
      correct: true,
      feedback: {
        correct: "Correct. Avalanche is cheapest mathematically. Snowball's quick wins can help you stick with it.",
        incorrect: "Both are valid. Avalanche saves the most money, snowball gives quicker emotional wins.",
      },
    },
  ],
  "credit-debt/lesson-credit-score-building": [
    {
      type: "mcq",
      question: "You have no credit history. What is a sensible way to start building a score?",
      options: [
        "Take five loans at once",
        "Use a small amount of credit responsibly and pay it in full and on time",
        "Never use credit",
        "Miss a payment on purpose",
      ],
      correct: 1,
      feedback: {
        correct: "Right. A small, well-managed account shows lenders you repay reliably.",
        incorrect: "Start small and pay on time. That track record is what builds a score from nothing.",
      },
    },
    {
      type: "true-false",
      statement: "Using a large share of your available credit limit can weigh on your score, even if you pay on time.",
      correct: true,
      feedback: {
        correct: "Correct. High utilisation signals stress. Keeping balances well below the limit helps your score.",
        incorrect: "It can hurt. A high used-versus-available ratio looks risky, so keep utilisation low.",
      },
    },
  ],
  "credit-debt/lesson-debt-counselling": [
    {
      type: "mcq",
      question: "What does debt counselling under the National Credit Act do?",
      options: [
        "Writes off all your debt after six months",
        "Restructures repayments and protects you from legal action",
        "Consolidates debt into one new bank loan",
        "Removes the listing from your credit record",
      ],
      correct: 1,
      feedback: {
        correct: "Right. A registered debt counsellor renegotiates terms into one plan and shields you while you keep paying.",
        incorrect: "It restructures your debt into an affordable plan and gives legal protection, it does not erase the debt.",
      },
    },
    {
      type: "true-false",
      statement: "While under debt review, you generally cannot take on new credit until you are done.",
      correct: true,
      feedback: {
        correct: "Correct. The plan works only if you stop adding debt, so new credit is blocked until you complete it.",
        incorrect: "New credit is restricted. Debt review depends on you not borrowing more until the plan is finished.",
      },
    },
  ],
  "credit-debt/lesson-reckless-lending": [
    {
      type: "true-false",
      statement: "Under the National Credit Act, a lender who grants you credit without properly checking you can afford it may be guilty of reckless lending.",
      correct: true,
      feedback: {
        correct: "Correct. Lenders must do an affordability assessment. Skipping it can make the loan reckless and challengeable.",
        incorrect: "They must assess affordability. Lending without that check can count as reckless lending under the Act.",
      },
    },
  ],
  "credit-debt/lesson-car-finance": [
    {
      type: "mcq",
      question: "Why is a balloon payment on car finance risky?",
      options: [
        "It lowers the total cost of financing the car",
        "It leaves a large lump sum owed at the end of the term",
        "It locks you into the dealership's insurance",
        "It forces you to settle the car loan early",
      ],
      correct: 1,
      feedback: {
        correct: "Right. The balloon defers a big chunk to the end. Many people cannot pay it and refinance at more cost.",
        incorrect: "A balloon shrinks monthly payments but leaves a large final lump sum, often above the car's value.",
      },
    },
    {
      type: "true-false",
      statement: "A new car loses a big share of its value in the first few years, so financing one over a long term can leave you owing more than it is worth.",
      correct: true,
      feedback: {
        correct: "Correct. Depreciation plus a long loan can put you 'underwater', owing more than the car sells for.",
        incorrect: "It can. Fast depreciation and long terms mean the debt can exceed the car's value for years.",
      },
    },
  ],
  "credit-debt/lesson-home-loan-debt": [
    {
      type: "mcq",
      question: "Paying a little extra into your bond each month mostly does what?",
      options: [
        "Nothing until the bank recalculates yearly",
        "Cuts interest and shortens the loan term",
        "Triggers early-settlement penalties every time",
        "Reduces only your monthly instalment amount",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Extra payments lower the balance interest is charged on, saving years and a lot of interest.",
        incorrect: "Extra into the bond reduces the balance interest is calculated on, cutting both time and interest.",
      },
    },
    {
      type: "true-false",
      statement: "An access bond lets you pay extra in and draw it back later if you need it, giving flexibility.",
      correct: true,
      feedback: {
        correct: "Correct. Extra payments reduce interest, and the access facility lets you withdraw the surplus if needed.",
        incorrect: "That is how it works. You save interest by paying extra, yet keep access to those funds.",
      },
    },
  ],
  "credit-debt/lesson-buy-now-pay-later": [
    {
      type: "mcq",
      question: "What is the hidden danger of 'buy now, pay later' on small everyday purchases?",
      options: [
        "It is always cheaper than paying upfront",
        "Small instalments stack up and missed ones bring fees",
        "It builds your credit score with every purchase",
        "It stays interest free no matter how you pay",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Splitting many small buys hides how much you owe, and a missed instalment adds cost.",
        incorrect: "The trap is stacked instalments you lose track of, plus fees or interest when one is missed.",
      },
    },
    {
      type: "true-false",
      statement: "If you would not buy something with cash today, splitting it into four payments does not make it more affordable.",
      correct: true,
      feedback: {
        correct: "Correct. Instalments change the timing, not whether you can truly afford it.",
        incorrect: "Splitting the price does not change affordability. If cash says no, four payments still say no.",
      },
    },
  ],
  "credit-debt/lesson-credit-score-mechanics": [
    {
      type: "mcq",
      question: "Which factor typically has the biggest impact on your credit score?",
      options: [
        "Your payment history",
        "Your favourite bank",
        "How many apps you use",
        "Your home language",
      ],
      correct: 0,
      feedback: {
        correct: "Right. Whether you pay on time is the heaviest factor in almost every scoring model.",
        incorrect: "Payment history carries the most weight. On-time payments matter more than anything else.",
      },
    },
    {
      type: "true-false",
      statement: "Applying for lots of credit in a short time can lower your score, because each application can leave a mark.",
      correct: true,
      feedback: {
        correct: "Correct. Many applications close together look risky and can dent your score.",
        incorrect: "It can lower it. A cluster of applications signals possible stress and can hurt your score.",
      },
    },
  ],
  "credit-debt/lesson-rebuild-credit-score": [
    {
      type: "mcq",
      question: "Your score was damaged by past missed payments. What rebuilds it most reliably?",
      options: [
        "Ignoring the debts",
        "Bringing accounts up to date and then paying on time, consistently, for months",
        "Opening many new accounts fast",
        "Changing your name",
      ],
      correct: 1,
      feedback: {
        correct: "Right. A steady run of on-time payments gradually outweighs old misses.",
        incorrect: "Consistency rebuilds it. Catch up, then pay on time month after month to rebuild trust.",
      },
    },
    {
      type: "true-false",
      statement: "Negative information like a default does not stay on your credit record forever, it drops off after a set period.",
      correct: true,
      feedback: {
        correct: "Correct. Listings have legal time limits, and your recent behaviour matters more as they age.",
        incorrect: "It is not permanent. Negative listings fall away after set periods, and fresh good history helps sooner.",
      },
    },
    {
      type: "mcq",
      question: "You have caught up all arrears. What is a smart next step to show reliability?",
      options: [
        "Close every account",
        "Keep one or two accounts active and pay them in full and on time",
        "Take a payday loan",
        "Stop checking your report",
      ],
      correct: 1,
      feedback: {
        correct: "Right. A small amount of well-managed, active credit builds a fresh, positive track record.",
        incorrect: "Keep a little active credit and manage it perfectly. That fresh positive history rebuilds your score.",
      },
    },
    {
      type: "true-false",
      statement: "Checking your own credit report lowers your score each time you do it.",
      correct: false,
      feedback: {
        correct: "Right. Checking your own report is a 'soft' enquiry and never hurts your score.",
        incorrect: "Self-checks are soft enquiries. They never damage your score, so check freely.",
      },
    },
  ],
  "credit-debt/lesson-applied-loan-trap": [
    {
      type: "fill-blank",
      title: "Count the real cost",
      prompt: "You borrow R10 000 and repay R500 a month for 36 months. In total you pay back R___.",
      correct: 18000,
      feedback: {
        correct: "Yes. R500 x 36 is R18 000, so the R10 000 loan costs R8 000 in interest and fees.",
        incorrect: "R500 x 36 = R18 000 repaid. That is R8 000 more than you borrowed.",
      },
    },
    {
      type: "true-false",
      statement: "A low monthly instalment can still mean a very expensive loan if the term is long.",
      correct: true,
      feedback: {
        correct: "Correct. Stretching the term lowers the instalment but piles on interest over time.",
        incorrect: "A small instalment over many months can cost a fortune in total. Always check the full repayment.",
      },
    },
  ],
  "credit-debt/lesson-5": [
    {
      type: "mcq",
      question: "How does the debt snowball method order your debts?",
      options: [
        "Highest interest first",
        "Smallest balance first, for quick wins that build momentum",
        "Largest balance first",
        "Randomly",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Snowball clears the smallest balance first, and the early wins keep you motivated.",
        incorrect: "Snowball attacks the smallest balance first. The quick wins build momentum to keep going.",
      },
    },
    {
      type: "true-false",
      statement: "In the snowball method, you tackle the debt with the highest interest rate first.",
      correct: false,
      feedback: {
        correct: "Right. Snowball starts with the SMALLEST balance for quick wins; avalanche targets the highest rate.",
        incorrect: "That describes avalanche. Snowball clears the smallest balance first to build momentum.",
      },
    },
    {
      type: "mcq",
      question: "Who tends to benefit most from snowball over avalanche?",
      options: [
        "People who need visible progress to stay motivated",
        "People who only care about the maths",
        "People with no debt",
        "People who love spreadsheets only",
      ],
      correct: 0,
      feedback: {
        correct: "Right. If motivation is your challenge, the quick wins of snowball help you stick with the plan.",
        incorrect: "Snowball suits those who need to see progress. Avalanche suits those focused purely on lowest cost.",
      },
    },
    {
      type: "fill-blank",
      title: "Roll it forward",
      prompt: "You clear a small debt that took R300 a month. You already pay R400 on the next debt. Your new payment on it is R___.",
      correct: 700,
      feedback: {
        correct: "Yes. R400 plus the freed R300 is R700 aimed at the next debt.",
        incorrect: "Add the freed R300 to the existing R400: that is R700 now going to the next debt.",
      },
    },
  ],
  "credit-debt/lesson-6": [
    {
      type: "mcq",
      question: "What does debt consolidation actually do?",
      options: [
        "Cancels the interest on your existing debt",
        "Combines several debts into one loan and one payment",
        "Freezes all your credit accounts until settled",
        "Removes the debts from your credit report",
      ],
      correct: 1,
      feedback: {
        correct: "Right. It rolls multiple debts into one. It helps only if the new rate and terms are genuinely better.",
        incorrect: "It merges debts into a single loan. The benefit depends on a lower rate and not borrowing more afterwards.",
      },
    },
    {
      type: "true-false",
      statement: "Consolidation backfires if you clear your cards and then run them up again alongside the new loan.",
      correct: true,
      feedback: {
        correct: "Correct. Without a change in habits, you end up with the new loan plus fresh card debt.",
        incorrect: "It can backfire. Reusing the cleared cards leaves you worse off than before.",
      },
    },
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // EMERGENCY FUND & RISK
  // ═══════════════════════════════════════════════════════════════════════════
  "emergency-fund/lesson-1": [
    {
      type: "mcq",
      question: "A common target for an emergency fund is how much?",
      options: [
        "One day of expenses",
        "Three to six months of essential expenses",
        "Ten years of salary",
        "Whatever is in your wallet",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Three to six months of essentials covers most job losses and shocks without new debt.",
        incorrect: "Aim for three to six months of essential expenses. That buffer covers most real emergencies.",
      },
    },
    {
      type: "fill-blank",
      title: "Size your buffer",
      prompt: "Your essential monthly costs are R8 000. A three-month emergency fund target is R___.",
      correct: 24000,
      feedback: {
        correct: "Yes. R8 000 x 3 is R24 000 for a three-month cushion.",
        incorrect: "Multiply essentials by three: R8 000 x 3 = R24 000.",
      },
    },
    {
      type: "true-false",
      statement: "If a full emergency fund feels impossible, starting with a small buffer of around R5 000 is still worthwhile.",
      correct: true,
      feedback: {
        correct: "Correct. Even a small buffer stops many small shocks from becoming expensive debt.",
        incorrect: "A starter buffer helps a lot. It keeps a flat tyre or broken geyser from going onto a credit card.",
      },
    },
  ],
  "emergency-fund/lesson-2": [
    {
      type: "mcq",
      question: "Where should an emergency fund ideally sit?",
      options: [
        "In shares you must sell to access",
        "In a safe, easy-access account like a savings or notice account that still earns some interest",
        "In cash under the bed",
        "In your everyday spending account",
      ],
      correct: 1,
      feedback: {
        correct: "Right. It needs to be safe and reachable fast, while earning a little interest to fight inflation.",
        incorrect: "Keep it safe and accessible, like a savings account. Not in risky shares, and not mixed with spending money.",
      },
    },
    {
      type: "true-false",
      statement: "Keeping your emergency fund in your everyday account is ideal because you can reach it instantly.",
      correct: false,
      feedback: {
        correct: "Right. Too-easy access means accidental spending. Keep it separate but reachable.",
        incorrect: "Separate it. Money mixed into your daily account gets spent, not saved.",
      },
    },
    {
      type: "mcq",
      question: "Why is a small amount of interest still important for an emergency fund?",
      options: [
        "It compounds into real wealth over time",
        "It helps the fund keep pace with inflation",
        "Banks must pay it on emergency savings",
        "It offsets the account's monthly fees",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Some interest slows the loss to inflation, without adding risk to money you may need suddenly.",
        incorrect: "Interest helps the fund hold its buying power against inflation while it sits ready.",
      },
    },
    {
      type: "true-false",
      statement: "A 32-day notice account can suit part of an emergency fund, as long as some money stays instantly available too.",
      correct: true,
      feedback: {
        correct: "Correct. A notice account pays a bit more, but keep a slice in instant access for a true emergency.",
        incorrect: "It can work for part of it. Just keep some money instantly reachable for sudden needs.",
      },
    },
  ],
  "emergency-fund/lesson-3": [
    {
      type: "scenario",
      question: "Which of these is a genuine reason to dip into your emergency fund?",
      options: [
        "A Black Friday TV deal",
        "Your only car for getting to work breaks down and needs urgent repair",
        "A friend's birthday gift",
        "A holiday you have been eyeing",
      ],
      correct: 1,
      feedback: {
        correct: "Right. An urgent, unavoidable cost that protects your income or safety is what the fund is for.",
        incorrect: "The fund is for urgent, unavoidable shocks, like a car you need for work, not wants or planned buys.",
      },
    },
    {
      type: "true-false",
      statement: "After using your emergency fund, rebuilding it should become your next savings priority.",
      correct: true,
      feedback: {
        correct: "Correct. The buffer only works if you top it back up, ready for the next surprise.",
        incorrect: "Rebuild it promptly. An emergency fund only protects you if it is refilled after use.",
      },
    },
  ],
  "emergency-fund/lesson-4": [
    {
      type: "mcq",
      question: "Which of these is an example of a pure risk you can insure against?",
      options: [
        "Betting on a horse",
        "Your house burning down",
        "Buying a lottery ticket",
        "Choosing a job",
      ],
      correct: 1,
      feedback: {
        correct: "Right. A pure risk has only a downside, like fire or theft, which is exactly what insurance covers.",
        incorrect: "Insurable pure risks have only a loss side, like fire. Gambling is speculative risk, not insurable.",
      },
    },
    {
      type: "true-false",
      statement: "You can reduce risk by avoiding it, reducing it, insuring it, or accepting it, depending on the situation.",
      correct: true,
      feedback: {
        correct: "Correct. Those four responses, avoid, reduce, transfer and accept, are the core ways to handle risk.",
        incorrect: "Those are the four options. You avoid, reduce, transfer (insure), or knowingly accept a risk.",
      },
    },
  ],
  "emergency-fund/lesson-5": [
    {
      type: "mcq",
      question: "What does 'risk versus reward' mean in practice for your money?",
      options: [
        "Higher potential returns usually come with higher risk of loss",
        "Safe things always pay the most",
        "Risk and reward are unrelated",
        "Reward is guaranteed if you take risk",
      ],
      correct: 0,
      feedback: {
        correct: "Right. Chasing higher returns means accepting more chance of loss. There is no free high return.",
        incorrect: "Higher expected return comes with higher risk. Anything promising big returns with no risk is a red flag.",
      },
    },
    {
      type: "true-false",
      statement: "An investment that promises high returns with no risk is almost certainly a scam.",
      correct: true,
      feedback: {
        correct: "Correct. Guaranteed high returns break the risk-reward rule and are a classic scam signal.",
        incorrect: "Treat it as a scam. Real high returns carry real risk, so 'guaranteed and high' does not exist.",
      },
    },
  ],
  "emergency-fund/lesson-applied-emergency-fund-build": [
    {
      type: "fill-blank",
      title: "How long to the goal",
      prompt: "You want a R18 000 emergency fund and can save R1 500 a month. It will take about ___ months.",
      correct: 12,
      feedback: {
        correct: "Yes. R18 000 divided by R1 500 is 12 months.",
        incorrect: "Divide the goal by the monthly saving: R18 000 / R1 500 = 12 months.",
      },
    },
    {
      type: "scenario",
      question: "You get an unexpected R2 000 while building your fund. What keeps the plan on track fastest?",
      options: [
        "Spend it on a treat",
        "Add it straight to the emergency fund to reach the target sooner",
        "Lend it to a friend",
        "Leave it in your spending account",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Windfalls thrown at the goal shorten the timeline and build the habit.",
        incorrect: "Adding it to the fund gets you to safety sooner. Windfalls are the fastest way to close the gap.",
      },
    },
    {
      type: "true-false",
      statement: "Automating a monthly transfer to your emergency fund on payday makes you far more likely to reach the target.",
      correct: true,
      feedback: {
        correct: "Correct. Paying the fund first, automatically, beats relying on whatever is left at month end.",
        incorrect: "Automation wins. A set transfer on payday saves before you can spend it.",
      },
    },
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // INSURANCE & PROTECTION
  // ═══════════════════════════════════════════════════════════════════════════
  "insurance/lesson-1": [
    {
      type: "mcq",
      question: "Who most needs life cover?",
      options: [
        "Everyone, regardless of dependants or debts",
        "People whose income or debts others depend on",
        "People close to or already in retirement",
        "Single people with no debts and no dependants",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Life cover protects the people who rely on your income or would inherit your debts.",
        incorrect: "It matters most where others depend on you financially, or where debt like a bond would fall to family.",
      },
    },
    {
      type: "true-false",
      statement: "A single person with no dependants and no debt may need little or no life cover.",
      correct: true,
      feedback: {
        correct: "Correct. If nobody depends on your income and there is no debt to cover, the need is small.",
        incorrect: "They may not need much. Life cover exists to protect dependants and debts, and here there are none.",
      },
    },
    {
      type: "mcq",
      question: "What is a sensible way to estimate how much life cover you need?",
      options: [
        "Pick a round number",
        "Add up debts to settle and the income your dependants would need for several years",
        "Copy your neighbour",
        "The maximum the salesperson offers",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Base it on real needs: clearing debt plus replacing your income for those who rely on it.",
        incorrect: "Work from actual needs, debts to clear plus years of income for dependants, not a guess or a sales target.",
      },
    },
  ],
  "insurance/lesson-2": [
    {
      type: "mcq",
      question: "What does disability cover protect?",
      options: [
        "Your car",
        "Your income if illness or injury stops you from working",
        "Your house from fire",
        "Your phone screen",
      ],
      correct: 1,
      feedback: {
        correct: "Right. It replaces income you can no longer earn because of a disabling illness or injury.",
        incorrect: "Disability cover protects your ability to earn. It pays out when you cannot work due to illness or injury.",
      },
    },
    {
      type: "true-false",
      statement: "For most working people, the chance of being disabled and unable to work during their career is higher than they expect.",
      correct: true,
      feedback: {
        correct: "Correct. Disability is more common than many assume, which is why income protection matters.",
        incorrect: "It is higher than most think. That underestimation is why people skip cover they later wish they had.",
      },
    },
    {
      type: "mcq",
      question: "What is the difference between 'own occupation' and 'any occupation' disability cover?",
      options: [
        "Only the premiums differ, cover is identical",
        "Own occupation pays if you cannot do your specific job",
        "Any occupation pays out faster on any claim",
        "Own occupation only covers manual workers",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Own occupation is broader and pays if you cannot do your trained job. Any occupation is stricter.",
        incorrect: "Own occupation covers your specific job, any occupation only pays if you cannot do any work at all.",
      },
    },
    {
      type: "true-false",
      statement: "A lump-sum disability payout and a monthly income-protection benefit solve different problems and are often used together.",
      correct: true,
      feedback: {
        correct: "Correct. A lump sum settles big costs and debt, while monthly cover replaces ongoing income.",
        incorrect: "They pair up. The lump sum handles debts and once-off costs, the monthly benefit replaces your salary.",
      },
    },
  ],
  "insurance/lesson-3": [
    {
      type: "mcq",
      question: "What does critical illness (dread disease) cover pay for?",
      options: [
        "Your monthly groceries always",
        "A lump sum on diagnosis of a serious listed condition, like cancer or a heart attack",
        "Car repairs",
        "School fees automatically",
      ],
      correct: 1,
      feedback: {
        correct: "Right. It pays a lump sum when you are diagnosed with a covered serious illness, to use as you need.",
        incorrect: "It pays a lump sum on diagnosis of a listed serious illness. You choose how to use the money.",
      },
    },
    {
      type: "true-false",
      statement: "Critical illness cover is not the same as medical aid, it pays you cash rather than settling hospital bills directly.",
      correct: true,
      feedback: {
        correct: "Correct. Medical aid pays providers, critical illness pays you a lump sum to cover the wider fallout.",
        incorrect: "They differ. Medical aid covers treatment costs, critical illness gives you cash for the knock-on costs.",
      },
    },
  ],
  "insurance/lesson-4": [
    {
      type: "scenario",
      question: "Sipho is the main earner and has a home loan. Which cover most directly protects his family's home if he could no longer work?",
      options: [
        "Cellphone insurance",
        "Disability or income protection cover",
        "Travel insurance",
        "Extended warranty on his fridge",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Income protection keeps money coming in so the bond can still be paid if he cannot work.",
        incorrect: "Disability or income protection is the direct answer, it replaces the income that pays the bond.",
      },
    },
    {
      type: "true-false",
      statement: "Waiting periods and definitions in a disability policy strongly affect when and whether it actually pays out.",
      correct: true,
      feedback: {
        correct: "Correct. The fine print, especially waiting periods and how disability is defined, decides real-world value.",
        incorrect: "The detail matters. Waiting periods and definitions determine when a claim is actually paid.",
      },
    },
  ],
  "insurance/lesson-5": [
    {
      type: "mcq",
      question: "What is the difference between comprehensive and third-party car insurance?",
      options: [
        "Nothing",
        "Comprehensive covers your own car too, third-party only covers damage you cause to others",
        "Third-party is more expensive",
        "Comprehensive covers only theft",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Comprehensive covers your vehicle and others. Third-party only pays for damage you cause to others.",
        incorrect: "Comprehensive covers your own car plus others' damage. Third-party covers only harm you cause to others.",
      },
    },
    {
      type: "mcq",
      question: "What is an 'excess' on a car insurance claim?",
      options: [
        "A bonus the insurer pays you",
        "The first portion of a claim you must pay yourself before the insurer covers the rest",
        "A tax",
        "The monthly premium",
      ],
      correct: 1,
      feedback: {
        correct: "Right. The excess is your share of each claim. A higher excess usually means a lower monthly premium.",
        incorrect: "The excess is what you pay per claim before cover kicks in. It trades off against your premium.",
      },
    },
    {
      type: "true-false",
      statement: "Insuring your car for double its value means a claim will pay you double what it is worth.",
      correct: false,
      feedback: {
        correct: "Right. Claims pay out actual value. Over-insuring just wastes premium.",
        incorrect: "Over-insurance does not pay extra. Claims settle at the car's value, so insure accurately.",
      },
    },
    {
      type: "scenario",
      question: "Zanele drives an old car worth about R20 000. Comprehensive cover costs a lot relative to the car. What is reasonable to consider?",
      options: [
        "Insure it for R200 000",
        "Weigh cheaper third-party cover, or self-insuring by saving, given the low car value",
        "Never drive again",
        "Cancel all insurance including the house",
      ],
      correct: 1,
      feedback: {
        correct: "Right. For a low-value car, third-party plus savings can beat pricey comprehensive cover. It is a judgement call.",
        incorrect: "With a cheap car, third-party or self-insuring can make sense. Match the cover to the value at risk.",
      },
    },
  ],
  "insurance/lesson-6": [
    {
      type: "mcq",
      question: "Why is protecting your income often called the foundation of a financial plan?",
      options: [
        "Because income is unimportant",
        "Because almost every other goal depends on your ability to keep earning",
        "Because insurers say so",
        "Because it is free",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Savings, debt repayment and cover all rely on income. Protect the source and the rest holds up.",
        incorrect: "Your income funds everything else. Protecting it protects your whole plan, which is why it comes first.",
      },
    },
    {
      type: "true-false",
      statement: "Reviewing your cover after big life changes, like a new baby, a home loan or a job change, keeps it matched to your real needs.",
      correct: true,
      feedback: {
        correct: "Correct. Needs shift over time. A regular review stops you being over- or under-insured.",
        incorrect: "Review after big changes. Cover set years ago may no longer match your debts and dependants.",
      },
    },
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // INVESTING BASICS
  // ═══════════════════════════════════════════════════════════════════════════
  "investing-basics/lesson-1": [
    {
      type: "mcq",
      question: "What is the core relationship between risk and return?",
      options: [
        "Higher expected returns generally require accepting more risk",
        "Low risk always pays the most",
        "Return has nothing to do with risk",
        "Risk guarantees a high return",
      ],
      correct: 0,
      feedback: {
        correct: "Right. To aim for higher returns you take on more risk. Nobody offers high returns with no risk honestly.",
        incorrect: "Higher expected return demands more risk. A promise of high return with no risk is a warning sign.",
      },
    },
    {
      type: "true-false",
      statement: "Cash in the bank is low risk, but over decades it can lose to inflation and underperform shares.",
      correct: true,
      feedback: {
        correct: "Correct. Cash feels safe short term, yet its buying power can lag well behind growth assets over time.",
        incorrect: "It can lag. Cash is safe short term but often loses to inflation over the long run versus shares.",
      },
    },
    {
      type: "scenario",
      question: "Naledi is investing for a goal 20 years away. Which mix fits that long horizon best?",
      options: [
        "All cash, protected from any market falls",
        "Mostly growth assets like equities, given time to recover",
        "One high-growth share with a strong record",
        "Only capital-guaranteed structured products",
      ],
      correct: 1,
      feedback: {
        correct: "Right. A long horizon suits growth assets, since there is time to recover from market dips.",
        incorrect: "Long horizons favour growth assets like equities, spread out, not cash or a single share.",
      },
    },
  ],
  "investing-basics/lesson-2": [
    {
      type: "mcq",
      question: "Why is starting to invest early so powerful?",
      options: [
        "Early money is worth more legally",
        "Compounding means your returns earn returns, and time is the biggest lever",
        "Banks reward youth",
        "It avoids all tax",
      ],
      correct: 1,
      feedback: {
        correct: "Right. The longer money compounds, the more growth stacks on growth. Time beats timing.",
        incorrect: "Compounding lets returns earn their own returns. The earlier you start, the more time does the work.",
      },
    },
    {
      type: "fill-blank",
      title: "Rule of 72",
      prompt: "Using the rule of 72, money growing at about 9% a year doubles in roughly ___ years.",
      correct: 8,
      feedback: {
        correct: "Yes. 72 divided by 9 is about 8 years to double.",
        incorrect: "Divide 72 by the rate: 72 / 9 is about 8 years to double.",
      },
    },
    {
      type: "true-false",
      statement: "Reinvesting your investment income, rather than spending it, speeds up compounding.",
      correct: true,
      feedback: {
        correct: "Correct. Reinvested dividends and interest buy more units that then grow too.",
        incorrect: "Reinvesting speeds it up. Spending the income breaks the compounding chain.",
      },
    },
    {
      type: "mcq",
      question: "Two people invest the same monthly amount, but one starts ten years earlier. Usually what happens?",
      options: [
        "They end up equal",
        "The earlier starter ends up with far more, thanks to extra years of compounding",
        "The later starter wins",
        "Compounding does not matter",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Those extra early years of growth usually create a gap that later contributions struggle to close.",
        incorrect: "The earlier starter typically wins by a wide margin. Early years of compounding are hard to catch up.",
      },
    },
  ],
  "investing-basics/lesson-3": [
    {
      type: "mcq",
      question: "What does diversification mean?",
      options: [
        "Putting everything in one great share",
        "Spreading money across many investments so no single failure sinks you",
        "Only investing offshore",
        "Timing the market perfectly",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Spreading across companies, sectors and regions reduces the damage any one can do.",
        incorrect: "Diversification spreads risk across many holdings, so one bad outcome does not ruin the whole portfolio.",
      },
    },
    {
      type: "true-false",
      statement: "Holding shares in just one company, even a great one, is riskier than holding a broad basket of many companies.",
      correct: true,
      feedback: {
        correct: "Correct. A single company can fail for reasons you cannot foresee. A broad basket cushions that.",
        incorrect: "One company is riskier. A broad basket spreads the risk so no single failure is fatal.",
      },
    },
    {
      type: "mcq",
      question: "How does an index ETF give instant diversification?",
      options: [
        "It buys the single strongest share in the index",
        "One purchase holds a slice of every company in the index",
        "The fund manager replaces losing shares monthly",
        "It hedges every position against market falls",
      ],
      correct: 1,
      feedback: {
        correct: "Right. A single index ETF holds dozens or hundreds of companies at once, cheaply.",
        incorrect: "An index ETF holds all the companies in the index, so one buy spreads your money across many.",
      },
    },
    {
      type: "true-false",
      statement: "Diversification lowers risk but does not remove it entirely, since whole markets can fall together.",
      correct: true,
      feedback: {
        correct: "Correct. It cushions company-specific shocks, but a broad market drop still affects a diversified portfolio.",
        incorrect: "It reduces, not removes, risk. Market-wide falls still hit even a well-diversified portfolio.",
      },
    },
  ],
  "investing-basics/lesson-4": [
    {
      type: "mcq",
      question: "You need the money in 18 months for a deposit. What does that short time horizon suggest?",
      options: [
        "Put it all in volatile shares",
        "Favour safer, stable options, since there is little time to recover from a dip",
        "Borrow to invest more",
        "Buy a single risky share",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Short horizons need stability. A market dip just before you need the cash could hurt badly.",
        incorrect: "Short horizons call for safer options. Shares can dip right when you need the money.",
      },
    },
  ],
  "investing-basics/lesson-5": [
    {
      type: "mcq",
      question: "When you buy a share, what do you actually own?",
      options: [
        "A loan to the company",
        "A small piece of ownership in that company",
        "A guarantee of dividends",
        "A savings account",
      ],
      correct: 1,
      feedback: {
        correct: "Right. A share is part ownership. You benefit when the company grows and its value rises.",
        incorrect: "A share is ownership, not a loan. You own a slice of the business and its future.",
      },
    },
    {
      type: "true-false",
      statement: "Share prices can be volatile in the short term, but reflect company value over the long term.",
      correct: true,
      feedback: {
        correct: "Correct. Day to day prices swing on sentiment, but over years they track the business's real performance.",
        incorrect: "Short term is noisy, long term tracks value. That is why time in the market matters.",
      },
    },
  ],
  "investing-basics/lesson-6": [
    {
      type: "mcq",
      question: "How does a bond differ from a share?",
      options: [
        "A bond is ownership, a share is a loan",
        "A bond is a loan to a government or company that pays interest, a share is ownership",
        "They are identical",
        "Bonds never pay anything",
      ],
      correct: 1,
      feedback: {
        correct: "Right. A bond lends money for regular interest and repayment at the end. A share is part ownership.",
        incorrect: "A bond is a loan paying interest. A share is ownership. They behave differently in your portfolio.",
      },
    },
    {
      type: "true-false",
      statement: "Government bonds are generally lower risk than shares, but usually offer lower long-term returns.",
      correct: true,
      feedback: {
        correct: "Correct. Bonds trade some growth for stability, which is why they balance a portfolio.",
        incorrect: "That is the trade-off. Bonds are steadier than shares but tend to return less over the long run.",
      },
    },
  ],
  "investing-basics/lesson-etfs-deep-dive": [
    {
      type: "mcq",
      question: "Why are low-cost index ETFs popular with everyday investors?",
      options: [
        "They guarantee returns",
        "They give broad diversification at a low fee, and low fees leave more of the return with you",
        "They are risk free",
        "They beat the market every year",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Broad exposure plus low fees is a powerful combination over decades of compounding.",
        incorrect: "The appeal is broad diversification at low cost. Lower fees keep more of the return in your pocket.",
      },
    },
    {
      type: "true-false",
      statement: "A total-market or top-40 ETF spreads your money across many companies with a single purchase.",
      correct: true,
      feedback: {
        correct: "Correct. One ETF unit buys a slice of every company in the index it tracks.",
        incorrect: "It does. A broad index ETF holds all the index's companies, so one buy diversifies you.",
      },
    },
  ],
  "investing-basics/lesson-unit-trusts": [
    {
      type: "mcq",
      question: "What is a unit trust?",
      options: [
        "A share in one listed company on the JSE",
        "A pooled fund combining many investors' money",
        "A fixed deposit account with a set term",
        "A government bond paying fixed interest",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Your money is pooled with others and managed to a stated strategy, giving instant diversification.",
        incorrect: "A unit trust pools investors' money into one managed fund, spreading it across many holdings.",
      },
    },
    {
      type: "true-false",
      statement: "Actively managed unit trusts usually charge higher fees than index trackers, and high fees eat into long-term returns.",
      correct: true,
      feedback: {
        correct: "Correct. Active management costs more, and over decades those fees can seriously reduce your final pot.",
        incorrect: "Active funds cost more. Compared over decades, higher fees can meaningfully shrink your returns.",
      },
    },
  ],
  "investing-basics/lesson-dollar-cost-averaging": [
    {
      type: "mcq",
      question: "What is the main benefit of investing a fixed amount every month (rand-cost averaging)?",
      options: [
        "It guarantees you buy at the lowest price",
        "It removes the need to time the market and buys more units when prices are low",
        "It avoids all fees",
        "It doubles your money",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Steady monthly buying smooths your average price and takes emotion out of timing.",
        incorrect: "It stops you trying to time the market. Fixed amounts buy more units when prices dip, fewer when high.",
      },
    },
    {
      type: "true-false",
      statement: "A monthly debit order into an investment builds the discipline that most people struggle to keep by hand.",
      correct: true,
      feedback: {
        correct: "Correct. Automating the contribution beats relying on willpower and leftover money each month.",
        incorrect: "Automation helps. A monthly debit order invests before you can spend the money elsewhere.",
      },
    },
  ],
  "investing-basics/lesson-investment-scams": [
    {
      type: "mcq",
      question: "Which is the clearest red flag of an investment scam?",
      options: [
        "A regulated, listed fund with published fees",
        "Guaranteed high returns with no risk and pressure to recruit others",
        "A boring index ETF",
        "A bank fixed deposit",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Guaranteed high returns, no risk and recruitment pressure are hallmarks of a Ponzi or pyramid scheme.",
        incorrect: "Guaranteed high, no-risk returns plus recruitment is the scam pattern. Real investing never guarantees that.",
      },
    },
    {
      type: "true-false",
      statement: "You can check whether a person or firm is authorised to give financial advice with the FSCA before investing.",
      correct: true,
      feedback: {
        correct: "Correct. Verifying an FSP licence with the FSCA is a quick, powerful way to avoid many scams.",
        incorrect: "You can and should. The FSCA lets you confirm a provider is licensed before you hand over money.",
      },
    },
  ],
  "investing-basics/lesson-property-as-investment": [
    {
      type: "mcq",
      question: "What is an honest picture of property as an investment?",
      options: [
        "It always beats every other asset",
        "It can build wealth but ties up cash, carries costs like rates and maintenance, and is not easy to sell fast",
        "It is risk free",
        "It never needs money spent on it",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Property can grow wealth, but it is illiquid and comes with ongoing costs many people forget.",
        incorrect: "Property has real costs and is hard to sell quickly. It can build wealth, but it is not a guaranteed, cost-free win.",
      },
    },
    {
      type: "true-false",
      statement: "A rental property only makes sense once the rent comfortably covers the bond, rates, levies, maintenance and vacancies.",
      correct: true,
      feedback: {
        correct: "Correct. If those costs outstrip the rent, you are subsidising the property every month.",
        incorrect: "The numbers must work. Rent has to cover the bond and all the running costs, or it drains you.",
      },
    },
  ],
  "investing-basics/lesson-investment-fees": [
    {
      type: "mcq",
      question: "Why are investment fees called a 'silent' wealth killer?",
      options: [
        "They are disclosed only after you invest",
        "A small annual percentage compounds into a large loss",
        "They apply only in the first year you invest",
        "They fund better management and returns",
      ],
      correct: 1,
      feedback: {
        correct: "Right. A 1% or 2% yearly fee seems tiny but can cost you a big share of your final pot over 30 years.",
        incorrect: "Fees quietly compound. A percent or two a year becomes a huge sum lost over decades.",
      },
    },
    {
      type: "true-false",
      statement: "Two funds with similar returns but different fees can leave you with very different amounts after 30 years.",
      correct: true,
      feedback: {
        correct: "Correct. Over long periods, the lower-fee fund can leave you hundreds of thousands of rand better off.",
        incorrect: "They can differ hugely. The fee gap compounds, so the cheaper fund wins big over decades.",
      },
    },
  ],
  "investing-basics/lesson-bonds-mechanics": [
    {
      type: "mcq",
      question: "A bond's 'coupon' is what?",
      options: [
        "A voucher to buy the bond at a discount",
        "The interest the bond pays on its face value",
        "The bond's price on the secondary market",
        "The tax levied on bond interest income",
      ],
      correct: 1,
      feedback: {
        correct: "Right. The coupon is the regular interest the issuer pays the bondholder.",
        incorrect: "The coupon is the interest payment, set as a percentage of the bond's face value.",
      },
    },
    {
      type: "true-false",
      statement: "At maturity, a standard bond repays whatever the market price happens to be that day.",
      correct: false,
      feedback: {
        correct: "Right. Maturity pays FACE VALUE, regardless of where market prices moved in between.",
        incorrect: "Maturity repays face value, not market price. Price swings only matter if you sell early.",
      },
    },
    {
      type: "mcq",
      question: "Who typically issues bonds?",
      options: [
        "Only individuals",
        "Governments and companies raising money by borrowing from investors",
        "Only banks",
        "Nobody, bonds are theoretical",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Governments and companies issue bonds to borrow, promising interest and repayment.",
        incorrect: "Governments and companies issue bonds to raise money, paying investors interest in return.",
      },
    },
  ],
  "investing-basics/lesson-bond-interest-rate-risk": [
    {
      type: "mcq",
      question: "What happens to the market price of existing bonds when interest rates rise?",
      options: [
        "It rises, because bonds become scarcer when rates go up",
        "It falls, because new bonds now pay more attractive rates",
        "It stays fixed, because the coupon was set at issue",
        "It tracks inflation rather than interest rates",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Rates up, existing bond prices down. New bonds pay more, so older ones must cheapen to compete.",
        incorrect: "Prices fall when rates rise. Newer bonds pay more, so older, lower-rate bonds drop in value.",
      },
    },
    {
      type: "true-false",
      statement: "Longer-dated bonds are usually more sensitive to interest rate changes than short-dated ones.",
      correct: true,
      feedback: {
        correct: "Correct. The longer the term, the more a rate change swings the bond's price.",
        incorrect: "Longer bonds swing more. Their prices react more strongly to interest rate moves.",
      },
    },
  ],
  "investing-basics/lesson-applied-thabo-investment": [
    {
      type: "scenario",
      question: "Thabo has R500 a month to invest for retirement, decades away. What is a sensible core choice?",
      options: [
        "A single meme stock",
        "A low-cost, diversified equity ETF via a monthly debit order",
        "A payday loan to invest more",
        "Keeping it all in cash",
      ],
      correct: 1,
      feedback: {
        correct: "Right. A cheap, diversified equity ETF, bought monthly, suits a long horizon and small regular amounts.",
        incorrect: "A low-cost diversified ETF, bought monthly, fits his long horizon far better than a single share or cash.",
      },
    },
    {
      type: "true-false",
      statement: "Sticking with R500 a month through market dips usually beats stopping and starting based on the news.",
      correct: true,
      feedback: {
        correct: "Correct. Consistency captures the recovery. Reacting to headlines often means selling low and buying high.",
        incorrect: "Consistency wins. Pausing during dips tends to lock in losses and miss the rebound.",
      },
    },
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // SA INVESTMENT VEHICLES
  // ═══════════════════════════════════════════════════════════════════════════
  "sa-investing/lesson-1": [
    {
      type: "mcq",
      question: "What is the main appeal of a Tax-Free Savings Account (TFSA)?",
      options: [
        "It is a bank account with no fees",
        "Growth, interest and dividends inside it are not taxed, and withdrawals are tax free",
        "It guarantees 20% a year",
        "It replaces your salary",
      ],
      correct: 1,
      feedback: {
        correct: "Right. No tax on growth, interest, dividends or withdrawals makes a TFSA a powerful long-term tool.",
        incorrect: "The point is tax freedom inside the account. Growth and withdrawals are not taxed.",
      },
    },
    {
      type: "fill-blank",
      title: "Know the limits",
      prompt: "The annual TFSA contribution limit is R36 000 and the lifetime limit is R___.",
      correct: 500000,
      feedback: {
        correct: "Yes. You may contribute up to R36 000 a year, capped at R500 000 over your lifetime.",
        incorrect: "The lifetime limit is R500 000, with a R36 000 annual cap.",
      },
    },
    {
      type: "true-false",
      statement: "Putting more than the annual TFSA limit in triggers a SARS penalty on the excess, so track your contributions.",
      correct: true,
      feedback: {
        correct: "Correct. Over-contributions are taxed at 40% of the excess, so stay within R36 000 a year.",
        incorrect: "There is a penalty. SARS taxes the over-contribution at 40%, so watch the annual limit.",
      },
    },
  ],
  "sa-investing/lesson-2": [
    {
      type: "mcq",
      question: "For long-term growth, why can a TFSA holding equities beat an ordinary savings account?",
      options: [
        "Savings accounts cannot hold that much",
        "The TFSA shields long-term growth from tax",
        "Both are taxed at the same dividend rate",
        "TFSAs guarantee returns above inflation",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Over decades, tax-free equity growth in a TFSA usually outpaces taxed, lower-return cash savings.",
        incorrect: "A TFSA can hold growth assets tax free. A plain savings account earns less and is taxed on interest.",
      },
    },
    {
      type: "true-false",
      statement: "A TFSA is best used for long-term investing, not as a place to park money you will spend next month.",
      correct: true,
      feedback: {
        correct: "Correct. Withdrawals do not restore your lifetime limit, so frequent dipping wastes the tax benefit.",
        incorrect: "It suits the long term. Withdrawn amounts still count against your lifetime limit, so avoid churning it.",
      },
    },
  ],
  "sa-investing/lesson-3": [
    {
      type: "mcq",
      question: "What do you need to open a TFSA at most SA providers?",
      options: [
        "A large lump sum only",
        "ID, proof of address and often as little as a few hundred rand a month",
        "A business licence",
        "Permission from SARS each time",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Basic FICA documents and a small monthly amount are usually enough to start.",
        incorrect: "You just need FICA documents and a modest amount. Many platforms let you start with a few hundred rand.",
      },
    },
  ],
  "sa-investing/lesson-4": [
    {
      type: "mcq",
      question: "What is a retirement annuity (RA)?",
      options: [
        "A short-term savings account",
        "A tax-advantaged retirement product you contribute to, with tax back on contributions",
        "A type of car finance",
        "A government grant",
      ],
      correct: 1,
      feedback: {
        correct: "Right. An RA is for retirement. Contributions are tax deductible and growth inside it is not taxed.",
        incorrect: "An RA is a retirement product. You get tax back on contributions and tax-free growth inside it.",
      },
    },
    {
      type: "fill-blank",
      title: "The deduction limit",
      prompt: "Retirement fund contributions are tax deductible up to ___% of your income (within an annual cap).",
      correct: 27.5,
      feedback: {
        correct: "Yes. You can deduct retirement contributions up to 27.5% of income, capped at R350 000 a year.",
        incorrect: "The limit is 27.5% of income, capped at R350 000 a year.",
      },
    },
    {
      type: "true-false",
      statement: "An RA generally locks your money until at least age 55, which is the trade-off for its tax benefits.",
      correct: true,
      feedback: {
        correct: "Correct. The access restriction is the price of the tax breaks and helps keep retirement money invested.",
        incorrect: "It is locked until age 55 in most cases. That restriction is the trade-off for the tax advantages.",
      },
    },
    {
      type: "mcq",
      question: "How do RA contributions save you tax now?",
      options: [
        "They do not",
        "They reduce your taxable income, so you pay less PAYE and may get a refund at filing",
        "They are taxed twice",
        "They only help at retirement",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Contributions come off your taxable income, cutting your tax and often earning a refund.",
        incorrect: "They lower your taxable income now, reducing tax and sometimes producing a refund at filing.",
      },
    },
  ],
  "sa-investing/lesson-5": [
    {
      type: "mcq",
      question: "At retirement from an RA, how can you access the money?",
      options: [
        "All of it in cash, always tax free",
        "You may take up to one third as a lump sum, with the rest buying an income (annuity)",
        "None of it, ever",
        "Only if you emigrate",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Up to a third can be taken as a lump sum (taxed per the tables), and the balance provides income.",
        incorrect: "You can take up to a third as a lump sum, and the rest must provide a retirement income.",
      },
    },
    {
      type: "true-false",
      statement: "The first portion of a retirement lump sum falls under a tax-free threshold, above which it is taxed on a sliding scale.",
      correct: true,
      feedback: {
        correct: "Correct. Retirement lump sums use special tables, with an initial tax-free amount and rising rates above it.",
        incorrect: "There is a tax-free slice, then rising rates. Retirement lump sums use their own tax tables.",
      },
    },
  ],
  "sa-investing/lesson-6": [
    {
      type: "mcq",
      question: "You resign and have money in a pension or provident fund. What is usually the wisest move?",
      options: [
        "Cash it out while the tax rates are low",
        "Preserve it in a preservation or new employer fund",
        "Leave it unclaimed until retirement age",
        "Move it into your everyday savings account",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Preserving keeps the money invested and dodges the heavy tax and lost growth of cashing out.",
        incorrect: "Preserve it. Cashing out on resignation is taxed and sacrifices decades of compounding.",
      },
    },
    {
      type: "true-false",
      statement: "Cashing out your retirement savings when you change jobs is one of the most common and costly retirement mistakes.",
      correct: true,
      feedback: {
        correct: "Correct. The tax hit plus lost growth can set your retirement back many years.",
        incorrect: "It is a classic, costly mistake. The tax and lost compounding are hard to recover from.",
      },
    },
  ],
  "sa-investing/lesson-asset-allocation": [
    {
      type: "mcq",
      question: "What is asset allocation?",
      options: [
        "Picking one winning share",
        "How you split money between asset classes like equities, bonds, property and cash",
        "The fee you pay a broker",
        "Timing the market daily",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Your split across asset classes drives most of your long-term risk and return.",
        incorrect: "Asset allocation is the mix across asset classes. That mix, more than stock picking, shapes your outcome.",
      },
    },
    {
      type: "mcq",
      question: "How should your age and time horizon usually influence your allocation?",
      options: [
        "They should not",
        "Longer horizons can carry more growth assets, shorter ones lean to safer assets",
        "Everyone should hold only cash",
        "Older investors should take the most risk",
      ],
      correct: 1,
      feedback: {
        correct: "Right. More time means more room for equities. As you near the goal, you usually de-risk.",
        incorrect: "Time horizon matters. Long horizons can hold more equities, short ones shift toward safer assets.",
      },
    },
    {
      type: "true-false",
      statement: "SA retirement funds must follow Regulation 28, which limits how much can go into any one asset class like equities or offshore.",
      correct: true,
      feedback: {
        correct: "Correct. Regulation 28 caps exposures to protect retirement savings from being over-concentrated.",
        incorrect: "It applies. Regulation 28 sets limits on asset classes within retirement funds to manage risk.",
      },
    },
    {
      type: "true-false",
      statement: "Your ideal asset allocation depends on your goals and risk tolerance, not on what worked for someone else.",
      correct: true,
      feedback: {
        correct: "Correct. The right mix is personal. Copying another person can leave you over- or under-exposed.",
        incorrect: "It is personal. Base it on your goals and risk comfort, not on someone else's portfolio.",
      },
    },
  ],
  "sa-investing/lesson-rebalancing": [
    {
      type: "mcq",
      question: "Why do investors rebalance a portfolio?",
      options: [
        "To chase whatever went up most",
        "To bring the mix back to target after some assets grow faster than others",
        "To pay more fees",
        "To avoid investing",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Rebalancing trims what grew and tops up what lagged, keeping your risk level on target.",
        incorrect: "It restores your target mix. Winners grow their share, so you trim them and top up the rest.",
      },
    },
    {
      type: "true-false",
      statement: "Rebalancing quietly enforces 'sell high, buy low' by trimming winners and adding to laggards.",
      correct: true,
      feedback: {
        correct: "Correct. It is a disciplined, unemotional way to lock in some gains and buy the cheaper assets.",
        incorrect: "It does exactly that. Rebalancing sells a bit of what rose and buys what fell, by design.",
      },
    },
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // PROPERTY & BIG PURCHASES
  // ═══════════════════════════════════════════════════════════════════════════
  "property/lesson-1": [
    {
      type: "mcq",
      question: "A common guideline says your home loan repayment should not exceed about what share of gross income?",
      options: [
        "Around 30%",
        "Around 70%",
        "100%",
        "There is no guideline",
      ],
      correct: 0,
      feedback: {
        correct: "Right. Keeping the bond near or below 30% of gross income leaves room for the many other costs of owning.",
        incorrect: "Around 30% of gross income is the common ceiling. Going much higher squeezes everything else.",
      },
    },
    {
      type: "true-false",
      statement: "The bond repayment is only part of the cost. Rates, levies, insurance and maintenance add a lot more.",
      correct: true,
      feedback: {
        correct: "Correct. Many buyers forget the running costs, which can add thousands a month on top of the bond.",
        incorrect: "There is much more than the bond. Rates, levies, insurance and upkeep all pile on monthly.",
      },
    },
    {
      type: "fill-blank",
      title: "The 30% test",
      prompt: "If you earn R25 000 gross a month, a 30% guideline caps your bond repayment at about R___.",
      correct: 7500,
      feedback: {
        correct: "Yes. 30% of R25 000 is R7 500 as a rough ceiling for the repayment.",
        incorrect: "30% of R25 000 is R7 500. That is a sensible ceiling for the bond repayment.",
      },
    },
  ],
  "property/lesson-2": [
    {
      type: "mcq",
      question: "What decides the interest rate a bank offers on your home loan?",
      options: [
        "Mainly your age and years of employment",
        "Your credit profile, deposit and the bank's risk view",
        "The age and location of the property alone",
        "The estate agent's recommendation letter",
      ],
      correct: 1,
      feedback: {
        correct: "Right. A stronger credit record and a bigger deposit usually earn a rate below prime.",
        incorrect: "It is your credit profile, deposit and risk, priced against prime. A better profile earns a better rate.",
      },
    },
    {
      type: "true-false",
      statement: "Getting quotes from more than one bank, or using a bond originator, can win you a better interest rate.",
      correct: true,
      feedback: {
        correct: "Correct. Banks compete. Even a small rate difference saves a lot over 20 years.",
        incorrect: "Shopping around pays. A slightly lower rate compounds into big savings over the life of the bond.",
      },
    },
  ],
  "property/lesson-3": [
    {
      type: "mcq",
      question: "Beyond the deposit, which upfront cost surprises many first-time buyers?",
      options: [
        "A compulsory year of municipal rates upfront",
        "Transfer duty, bond registration and attorney fees",
        "Estate agent commission paid by the buyer",
        "A refundable deposit held by the deeds office",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Transfer and bond costs are large and separate from the deposit. Budget for them early.",
        incorrect: "Transfer duty and legal fees are the shock. They add tens of thousands on top of the deposit.",
      },
    },
    {
      type: "true-false",
      statement: "A bigger deposit usually means a lower interest rate and a smaller monthly repayment.",
      correct: true,
      feedback: {
        correct: "Correct. More deposit lowers the bank's risk and the amount you borrow, cutting the rate and repayment.",
        incorrect: "It usually helps both. A larger deposit reduces risk and the loan, so the rate and repayment fall.",
      },
    },
  ],
  "property/lesson-4": [
    {
      type: "mcq",
      question: "What is the honest answer to 'is buying always better than renting'?",
      options: [
        "Yes, renting is always wasted money",
        "No, it depends on the numbers, how long you will stay, and your flexibility needs",
        "No, renting is always better",
        "It is impossible to know",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Over short stays or in pricey areas, renting can win. It is a maths and lifestyle question, not a rule.",
        incorrect: "It depends. Time in the home, the price-to-rent ratio and flexibility all decide which wins.",
      },
    },
    {
      type: "true-false",
      statement: "Buying tends to win the longer you stay, because upfront costs are spread over more years.",
      correct: true,
      feedback: {
        correct: "Correct. Transfer and bond costs hurt less the longer you own, which is why short stays favour renting.",
        incorrect: "Time matters. The longer you stay, the more those big upfront costs are diluted, favouring buying.",
      },
    },
  ],
  "property/lesson-applied-buy-or-rent": [
    {
      type: "scenario",
      question: "Zanele may move cities for work within two years. What does that suggest about buying now?",
      options: [
        "Buy immediately, it is always right",
        "Renting is likely wiser, since transfer costs are hard to recover over such a short stay",
        "Buy two houses",
        "It makes no difference",
      ],
      correct: 1,
      feedback: {
        correct: "Right. With a possible move in two years, the upfront buying costs may not be recovered. Renting keeps her flexible.",
        incorrect: "A short, uncertain stay favours renting. She may not recoup transfer and bond costs before moving.",
      },
    },
    {
      type: "true-false",
      statement: "Flexibility to move for work or family is a real, valuable benefit of renting, not just a financial footnote.",
      correct: true,
      feedback: {
        correct: "Correct. The freedom to relocate quickly has genuine value, especially early in a career.",
        incorrect: "It counts. Being able to move easily is a real benefit of renting, not only a money matter.",
      },
    },
  ],
  "property/lesson-5": [
    {
      type: "mcq",
      question: "When does renting genuinely make more sense than buying?",
      options: [
        "Never, because rent money is simply lost",
        "When you may move soon or ownership costs are too high",
        "Only when you cannot get a bond approved",
        "Always, since property values barely grow",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Short horizons, tight affordability and high price-to-rent ratios all tilt toward renting.",
        incorrect: "Renting wins when you may move soon, cannot carry all the costs, or buying is pricey versus renting.",
      },
    },
    {
      type: "true-false",
      statement: "Rent money is not simply 'wasted', it buys you housing and flexibility without the costs and risks of ownership.",
      correct: true,
      feedback: {
        correct: "Correct. Renting pays for a real service. In the right situation it is the smarter financial choice.",
        incorrect: "It is not wasted. Rent buys housing and freedom, and can beat buying in the right circumstances.",
      },
    },
    {
      type: "scenario",
      question: "A young worker invests the deposit and cost difference from not buying. What can this achieve?",
      options: [
        "Nothing at all",
        "It can grow into meaningful wealth, sometimes rivalling the equity they would have built in a home",
        "It is illegal",
        "It always beats property by a huge margin",
      ],
      correct: 1,
      feedback: {
        correct: "Right. 'Rent and invest the difference' can work well if you actually invest the difference consistently.",
        incorrect: "Invested consistently, the difference can build real wealth. The catch is you must actually invest it.",
      },
    },
  ],
  "property/lesson-6": [
    {
      type: "fill-blank",
      title: "The other costs",
      prompt: "A bond costs R9 000 a month, plus rates R900, levies R1 400 and insurance R300. Total monthly housing cost is R___.",
      correct: 11600,
      feedback: {
        correct: "Yes. R9 000 plus R900, R1 400 and R300 is R11 600 a month, not just the R9 000 bond.",
        incorrect: "Add them all: 9 000 + 900 + 1 400 + 300 = R11 600. The bond alone hides the true cost.",
      },
    },
    {
      type: "mcq",
      question: "When comparing renting and buying honestly, what should you include on the buying side?",
      options: [
        "The bond repayment, since rates and levies replace rent",
        "The bond plus rates, levies, insurance, maintenance and transfer costs",
        "The deposit and transfer costs, but not monthly charges",
        "Only costs the bank includes in the bond statement",
      ],
      correct: 1,
      feedback: {
        correct: "Right. A fair comparison counts every ownership cost, not only the headline bond repayment.",
        incorrect: "Include all ownership costs and the upfront fees. Comparing rent to only the bond is misleading.",
      },
    },
    {
      type: "true-false",
      statement: "When you rent, big maintenance and repair costs are usually your problem, not the owner's.",
      correct: false,
      feedback: {
        correct: "Right. Structural maintenance is the owner's cost. Renters usually escape those surprises.",
        incorrect: "Maintenance falls on the owner. Avoiding those costs is one of renting's real benefits.",
      },
    },
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // TAXES FOR INDIVIDUALS
  // ═══════════════════════════════════════════════════════════════════════════
  "taxes/lesson-1": [
    {
      type: "mcq",
      question: "SA uses progressive tax brackets. If you move into a higher bracket, what is taxed at the higher rate?",
      options: [
        "Your entire income, from the first rand up",
        "Only the portion that falls inside the higher bracket",
        "Nothing, until SARS reassesses your return",
        "Only bonus and overtime income, not salary",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Only the rands within each bracket are taxed at that bracket's rate, so a raise always helps.",
        incorrect: "Only the income inside the higher bracket is taxed more. Earning more never lowers your take-home.",
      },
    },
    {
      type: "true-false",
      statement: "A tax rebate reduces the actual tax you owe, which is why low earners below the threshold pay no income tax.",
      correct: true,
      feedback: {
        correct: "Correct. The primary rebate cuts your tax bill directly, creating a threshold below which no tax is due.",
        incorrect: "The rebate lowers tax owed directly. That is why earnings under the threshold pay no income tax.",
      },
    },
    {
      type: "mcq",
      question: "What is the difference between your marginal rate and your average tax rate?",
      options: [
        "They are the same",
        "Marginal is the rate on your next rand, average is total tax divided by total income",
        "Average is always higher",
        "Marginal only applies to the rich",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Because early income is taxed less, your average rate is lower than your top marginal rate.",
        incorrect: "Marginal is the rate on your last rand. Average is total tax over total income, and is lower.",
      },
    },
  ],
  "taxes/lesson-2": [
    {
      type: "true-false",
      statement: "Even if your employer deducted PAYE all year, SARS may still require you to submit a return depending on your income and sources.",
      correct: true,
      feedback: {
        correct: "Correct. Thresholds and multiple income sources can trigger a filing requirement even with PAYE paid.",
        incorrect: "You may still need to file. Income level and extra sources decide it, not just whether PAYE was paid.",
      },
    },
  ],
  "taxes/lesson-3": [
    {
      type: "mcq",
      question: "Which is a legitimate deduction many salaried people miss?",
      options: [
        "Home loan interest on the house you live in",
        "Retirement annuity contributions and qualifying medical expenses",
        "School fees and children's education costs",
        "Petrol and parking for your normal daily commute to work",
      ],
      correct: 1,
      feedback: {
        correct: "Right. RA contributions and qualifying medical costs can reduce your tax and are often forgotten.",
        incorrect: "RA contributions and qualifying medical expenses are real deductions people overlook. Groceries are not.",
      },
    },
    {
      type: "true-false",
      statement: "You need to keep supporting documents, since SARS can ask you to prove any deduction you claim.",
      correct: true,
      feedback: {
        correct: "Correct. Keep slips and certificates for five years. SARS can request proof of every claim.",
        incorrect: "Keep the proof. SARS can audit a claim and expects documents to back it up.",
      },
    },
  ],
  "taxes/lesson-4": [
    {
      type: "mcq",
      question: "When is capital gains tax (CGT) triggered?",
      options: [
        "Every year automatically",
        "When you dispose of an asset, like selling shares or a second property, at a profit",
        "Only when you earn a salary",
        "Never in SA",
      ],
      correct: 1,
      feedback: {
        correct: "Right. CGT applies on disposal, such as selling an asset for more than you paid, with some exclusions.",
        incorrect: "CGT hits on disposal at a gain, like selling shares or a second property, not on your salary.",
      },
    },
    {
      type: "true-false",
      statement: "In SA, only a portion (the inclusion rate) of a capital gain is added to your taxable income, not the whole gain.",
      correct: true,
      feedback: {
        correct: "Correct. A percentage of the gain is included and taxed at your marginal rate, so CGT is less than income tax on the full amount.",
        incorrect: "Only part of the gain is included. That included portion is taxed at your marginal rate.",
      },
    },
  ],
  "taxes/lesson-irp5-tax-certificates": [
    {
      type: "mcq",
      question: "What is an IRP5?",
      options: [
        "A SARS instalment agreement for arrear tax",
        "Your employer's certificate of income and PAYE for the year",
        "A monthly statement of bank account charges",
        "A penalty notice for late tax submission",
      ],
      correct: 1,
      feedback: {
        correct: "Right. The IRP5 summarises your pay and tax, and usually pre-fills your SARS return.",
        incorrect: "An IRP5 is your employer's certificate of income and PAYE. SARS uses it to pre-fill your return.",
      },
    },
    {
      type: "true-false",
      statement: "An IT3(b) shows investment income like interest and dividends, which you also need at tax time.",
      correct: true,
      feedback: {
        correct: "Correct. Your investment provider issues an IT3(b) so you can report interest and dividends correctly.",
        incorrect: "It reports investment income. You need the IT3(b) to declare interest and dividends at filing.",
      },
    },
  ],
  "taxes/lesson-donations-estate-tax": [
    {
      type: "mcq",
      question: "How much can you donate each year before donations tax applies?",
      options: [
        "Nothing is exempt",
        "Up to R100 000 a year is exempt from donations tax",
        "R5 million a year",
        "Only R1 000",
      ],
      correct: 1,
      feedback: {
        correct: "Right. The first R100 000 of donations per tax year is exempt. Above that, donations tax applies.",
        incorrect: "R100 000 a year is exempt. Donations above that attract donations tax.",
      },
    },
    {
      type: "true-false",
      statement: "Estate duty is a tax on the value of what you leave behind when you die, above a set exemption.",
      correct: true,
      feedback: {
        correct: "Correct. Estates above the exemption pay estate duty, which planning can help reduce.",
        incorrect: "It is a tax on your estate at death, above an exemption. Good planning can lower the bill.",
      },
    },
  ],
  "taxes/lesson-tax-on-investments": [
    {
      type: "mcq",
      question: "Which statement about tax on investment returns is correct?",
      options: [
        "All investment income is tax free",
        "Interest has an annual exemption, dividends face dividends tax, and capital gains have their own treatment",
        "Only shares are taxed",
        "SARS ignores investments",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Different returns are taxed differently, which is why a TFSA, being tax free, is so valuable.",
        incorrect: "Interest, dividends and capital gains each have their own rules. A TFSA sidesteps all of them.",
      },
    },
  ],
  "taxes/lesson-efiling-walkthrough": [
    {
      type: "mcq",
      question: "What is SARS eFiling used for?",
      options: [
        "Ordering food",
        "Submitting tax returns and managing your tax affairs online",
        "Applying for a home loan",
        "Buying shares",
      ],
      correct: 1,
      feedback: {
        correct: "Right. eFiling is the online platform to file returns, check assessments and deal with SARS.",
        incorrect: "eFiling is SARS's online system for filing returns and managing your tax.",
      },
    },
    {
      type: "true-false",
      statement: "Much of your eFiling return is pre-populated from IRP5 and IT3 certificates, but you must check it and add anything missing.",
      correct: true,
      feedback: {
        correct: "Correct. Pre-filled does not mean complete. Verify the figures and add deductions like RA contributions.",
        incorrect: "You must check it. Pre-filled data can miss deductions, so review and complete before submitting.",
      },
    },
  ],
  "taxes/lesson-5": [
    {
      type: "mcq",
      question: "Who typically needs to pay provisional tax?",
      options: [
        "Only registered companies and close corporations",
        "People with significant income not taxed through PAYE",
        "Every employee who earns above the threshold",
        "Anyone who submits a tax return each year",
      ],
      correct: 1,
      feedback: {
        correct: "Right. If meaningful income arrives without PAYE, you usually pay tax in advance as a provisional taxpayer.",
        incorrect: "It is for income without PAYE, like freelancing or rentals. Ordinary salary earners usually are not provisional.",
      },
    },
    {
      type: "true-false",
      statement: "Provisional taxpayers pay tax in advance during the year, rather than in one lump at the end.",
      correct: true,
      feedback: {
        correct: "Correct. You estimate and pay in instalments, which spreads the load and avoids a huge year-end bill.",
        incorrect: "They pay in advance, in instalments, so the tax does not all fall due at once at year end.",
      },
    },
  ],
  "taxes/lesson-6": [
    {
      type: "mcq",
      question: "At what point must a business register for VAT in SA?",
      options: [
        "Immediately when it opens",
        "Once its taxable turnover exceeds R1 million in a 12-month period",
        "Only if it wants to",
        "Never",
      ],
      correct: 1,
      feedback: {
        correct: "Right. VAT registration becomes compulsory above R1 million turnover in 12 months. Voluntary registration is possible earlier.",
        incorrect: "Compulsory VAT registration kicks in above R1 million turnover in 12 months.",
      },
    },
    {
      type: "true-false",
      statement: "VAT is ultimately paid by the final consumer, with businesses collecting it for SARS along the way.",
      correct: true,
      feedback: {
        correct: "Correct. Businesses charge and claim VAT, but the end customer carries the actual cost.",
        incorrect: "The consumer bears it. Businesses collect and pass VAT to SARS, but the final buyer pays it.",
      },
    },
  ],
  "taxes/lesson-applied-sars-assessment": [
    {
      type: "scenario",
      question: "Your SARS assessment says you owe money, but you claimed an RA deduction you are sure about. What is the right move?",
      options: [
        "Pay immediately to avoid interest, then move on",
        "Check your return, then lodge an objection with documents",
        "Wait for SARS to phone you before responding",
        "Resubmit a fresh return with the same figures",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Verify the figures, then object formally with proof if SARS missed a valid deduction.",
        incorrect: "Check it, then object with documents if it is wrong. SARS has a formal dispute process for this.",
      },
    },
    {
      type: "true-false",
      statement: "You should always check a SARS assessment against your own records rather than assuming it is correct.",
      correct: true,
      feedback: {
        correct: "Correct. Assessments can be wrong or miss claims. Your records are how you catch it.",
        incorrect: "Always check. An assessment can contain errors, and only your records will reveal them.",
      },
    },
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // SCAMS & FRAUD
  // ═══════════════════════════════════════════════════════════════════════════
  "scams-fraud/lesson-1": [
    {
      type: "mcq",
      question: "An SMS says your bank account is locked and gives a link to 'verify' your details. What is the safe response?",
      options: [
        "Click the link and log in quickly",
        "Do not click. Contact the bank on the number on your card or app instead",
        "Reply with your PIN",
        "Forward it to friends to warn them, then click",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Banks never ask you to verify details via a link. Reach them through the official app or card number.",
        incorrect: "Never click or share details. Go to the bank directly using the app or the number on your card.",
      },
    },
    {
      type: "true-false",
      statement: "A real bank will never phone, SMS or email you asking for your full PIN, password or a one-time PIN.",
      correct: true,
      feedback: {
        correct: "Correct. Anyone asking for those is a scammer, no matter how official they sound.",
        incorrect: "They never ask for those. A request for your PIN, password or OTP is always a scam.",
      },
    },
    {
      type: "mcq",
      question: "Which detail most often gives a phishing message away?",
      options: [
        "It arrives late at night or on weekends",
        "A slightly wrong sender address, urgency and data requests",
        "It mentions your bank by name in the text",
        "It uses your bank's official logo and colours",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Logos are easy to copy. Check the real sender address and link, and be wary of urgency.",
        incorrect: "The tells are a fake address or link, pressure to act now, and a request for private details. Logos prove nothing.",
      },
    },
  ],
  "scams-fraud/lesson-2": [
    {
      type: "mcq",
      question: "What is a SIM swap scam?",
      options: [
        "Switching networks legally",
        "A fraudster ports your number to their SIM to intercept OTPs and access your accounts",
        "Buying a new phone",
        "A bank promotion",
      ],
      correct: 1,
      feedback: {
        correct: "Right. They take control of your number to receive your one-time PINs and drain accounts.",
        incorrect: "A SIM swap hijacks your number so the fraudster gets your OTPs and can access your accounts.",
      },
    },
    {
      type: "true-false",
      statement: "Suddenly losing all signal for no reason can be an early warning sign of a SIM swap attack.",
      correct: true,
      feedback: {
        correct: "Correct. If your phone goes dead with no network unexpectedly, check with your operator at once.",
        incorrect: "It can be a warning. An unexplained loss of signal may mean your number was ported. Act fast.",
      },
    },
    {
      type: "mcq",
      question: "Which habit best protects you against SIM-swap account takeovers?",
      options: [
        "Sharing your OTP with 'bank staff'",
        "Using an authenticator app rather than SMS OTPs where possible, and guarding personal info",
        "Posting your number publicly",
        "Using the same password everywhere",
      ],
      correct: 1,
      feedback: {
        correct: "Right. App-based authentication does not rely on your SIM, and less shared personal data means less to exploit.",
        incorrect: "App-based codes and tight control of your personal details beat SMS OTPs against SIM-swap fraud.",
      },
    },
    {
      type: "true-false",
      statement: "The less personal information you share publicly, the harder it is for fraudsters to impersonate you to your network.",
      correct: true,
      feedback: {
        correct: "Correct. SIM swaps often rely on personal details. Sharing less gives them less to work with.",
        incorrect: "Sharing less protects you. Fraudsters use personal details to convince the network to port your number.",
      },
    },
  ],
  "scams-fraud/lesson-3": [
    {
      type: "mcq",
      question: "A 'scheme' pays early investors using money from new investors. What is it?",
      options: [
        "A safe fund",
        "A Ponzi scheme, which collapses when new money slows",
        "A government bond",
        "A tax-free savings account",
      ],
      correct: 1,
      feedback: {
        correct: "Right. That is a Ponzi scheme. It survives only while new deposits exceed payouts, then it collapses.",
        incorrect: "Paying old investors with new money is a Ponzi scheme. It always collapses eventually.",
      },
    },
    {
      type: "true-false",
      statement: "Before investing, checking that the firm is a licensed financial services provider with the FSCA can prevent many scams.",
      correct: true,
      feedback: {
        correct: "Correct. A quick FSCA licence check weeds out many fake schemes before you lose money.",
        incorrect: "It helps a lot. Verifying an FSCA licence first stops many fake investment schemes.",
      },
    },
  ],
  "scams-fraud/lesson-4": [
    {
      type: "mcq",
      question: "In a romance scam, what request is the giant red flag?",
      options: [
        "They ask about your day",
        "Someone you have never met in person asks for money or help moving funds",
        "They send a photo",
        "They live in another city",
      ],
      correct: 1,
      feedback: {
        correct: "Right. A never-met online partner asking for money, or to move funds, is the classic romance-scam move.",
        incorrect: "The red flag is a request for money or fund transfers from someone you have never met face to face.",
      },
    },
    {
      type: "true-false",
      statement: "Scammers deliberately build trust and emotion over weeks before asking for money, to lower your guard.",
      correct: true,
      feedback: {
        correct: "Correct. The slow build is a tactic. Real feeling is not proof the request is genuine.",
        incorrect: "They invest time on purpose. The emotional build-up is designed to make the money request feel normal.",
      },
    },
  ],
  "scams-fraud/lesson-5": [
    {
      type: "mcq",
      question: "Why is 'guaranteed high returns' the ultimate red flag?",
      options: [
        "Because guaranteed products may not advertise",
        "Real returns carry risk, so such guarantees are impossible",
        "Because only banks may guarantee any return",
        "Because high returns are always heavily taxed",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Risk and return go together. A guarantee of high returns with no risk simply cannot be real.",
        incorrect: "It breaks the basic rule that return comes with risk. Guaranteed high, safe returns are always a con.",
      },
    },
    {
      type: "true-false",
      statement: "Pressure to invest immediately, before you can think or check, is a deliberate scam tactic.",
      correct: true,
      feedback: {
        correct: "Correct. Urgency stops you doing checks. A genuine opportunity survives a day of due diligence.",
        incorrect: "Urgency is a tactic. If you cannot take a day to verify it, treat it as a scam.",
      },
    },
  ],
  "scams-fraud/lesson-6": [
    {
      type: "mcq",
      question: "You realise you have just been scammed and money left your account. What should you do first?",
      options: [
        "Wait a week to see what happens",
        "Contact your bank's fraud line immediately to try to stop or reverse the payment, then report it",
        "Say nothing out of embarrassment",
        "Send more money to 'unlock' the first",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Speed matters. The bank may halt or recall a payment if you act within minutes or hours.",
        incorrect: "Call the bank's fraud line at once. Fast action gives the best chance to stop or reverse it.",
      },
    },
    {
      type: "true-false",
      statement: "Reporting a scam, even after losing money, helps protect others and may be needed for insurance or bank claims.",
      correct: true,
      feedback: {
        correct: "Correct. A police case number and reports to the bank support any claim and warn the wider system.",
        incorrect: "Reporting still matters. It aids others, and a case number is often needed for claims.",
      },
    },
  ],
  "scams-fraud/lesson-advance-fee-fraud": [
    {
      type: "mcq",
      question: "What defines advance-fee fraud (like the '419' scam)?",
      options: [
        "The fraudster pays you a deposit upfront",
        "You must keep paying 'fees' for a payout that never comes",
        "A genuine inheritance with legal delays",
        "A cross-border transfer service with fees",
      ],
      correct: 1,
      feedback: {
        correct: "Right. The prize is bait. Each fee unlocks another fee, and the promised money never arrives.",
        incorrect: "It dangles a big reward, then demands fee after fee. The payout never comes.",
      },
    },
    {
      type: "true-false",
      statement: "If you must pay money to receive a prize, inheritance or lottery win you never entered, it is a scam.",
      correct: true,
      feedback: {
        correct: "Correct. Real winnings never require an upfront payment from you. Paying to receive is the giveaway.",
        incorrect: "It is a scam. You never pay to receive a legitimate prize or inheritance.",
      },
    },
  ],
  "scams-fraud/lesson-vishing-scams": [
    {
      type: "mcq",
      question: "In a vishing (voice call) scam, a caller claims to be from your bank's fraud team. What is the safe move?",
      options: [
        "Give them the OTP so they can 'stop the fraud'",
        "Hang up and call the bank back on the official number yourself",
        "Read out your card number to verify",
        "Trust them because they know your name",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Hang up and call the official number. Real fraud teams never need your OTP or full card details.",
        incorrect: "Hang up and call back on the official number. Never share an OTP or card details on an inbound call.",
      },
    },
    {
      type: "true-false",
      statement: "Scammers can fake caller ID to make a call look like it comes from your bank's real number.",
      correct: true,
      feedback: {
        correct: "Correct. A familiar number on screen proves nothing. Verify by calling back on the official line.",
        incorrect: "They can spoof it. The number showing your bank's name is not proof, so call back to be sure.",
      },
    },
  ],
  "scams-fraud/lesson-whatsapp-scams": [
    {
      type: "mcq",
      question: "A WhatsApp message from a 'family member' on a new number urgently asks you to send money. What should you do?",
      options: [
        "Send it right away",
        "Call the person on their known number to confirm before sending anything",
        "Ask them for their bank PIN",
        "Share your OTP",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Verify on a known number first. The 'new number, urgent money' pattern is a common impersonation scam.",
        incorrect: "Confirm on their real number before sending. The new-number urgent request is a classic impersonation.",
      },
    },
    {
      type: "true-false",
      statement: "Turning on two-step verification in WhatsApp makes it harder for someone to hijack your account.",
      correct: true,
      feedback: {
        correct: "Correct. Two-step verification adds a PIN that blocks many account takeovers.",
        incorrect: "It helps. WhatsApp two-step verification adds a PIN that stops many hijack attempts.",
      },
    },
  ],
  "scams-fraud/lesson-applied-whatsapp-scheme": [
    {
      type: "scenario",
      question: "A WhatsApp group promises to 'flip' your R1 000 into R5 000 in a week if you pay in now. What is happening?",
      options: [
        "A legitimate stokvel with weekly payouts",
        "A money-flipping scam that will take your R1 000",
        "A registered high-interest group savings plan",
        "An investment club regulated by the FSCA",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Money-flipping is a scam. The 'returns' come from new victims until it collapses.",
        incorrect: "It is a flipping scam. Your money funds early payouts and recruitment, then it disappears.",
      },
    },
    {
      type: "true-false",
      statement: "Being asked to recruit friends and family to earn is a strong sign of a pyramid or flipping scam.",
      correct: true,
      feedback: {
        correct: "Correct. When the 'return' depends on recruiting others, the money comes from victims, not real investment.",
        incorrect: "Recruitment-based returns are a pyramid signal. Genuine investments do not pay you to recruit.",
      },
    },
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // MONEY & THE BIBLE
  // ═══════════════════════════════════════════════════════════════════════════
  "bible-money/what-is-stewardship": [
    {
      type: "mcq",
      question: "What does 'stewardship' of money mean in this context?",
      options: [
        "Owning as much as possible",
        "Managing what you have responsibly, as a caretaker rather than an outright owner",
        "Giving everything away at once",
        "Ignoring money entirely",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Stewardship treats money as something to manage wisely and account for, not to hoard or waste.",
        incorrect: "Stewardship is responsible management, seeing yourself as a caretaker of what you have.",
      },
    },
    {
      type: "true-false",
      statement: "Stewardship includes budgeting, avoiding waste and planning ahead, not just giving.",
      correct: true,
      feedback: {
        correct: "Correct. Faithful management covers how you earn, spend, save and give, all of it.",
        incorrect: "It is broader than giving. Stewardship covers earning, spending, saving and planning too.",
      },
    },
    {
      type: "mcq",
      question: "How does a stewardship mindset change everyday money decisions?",
      options: [
        "It makes them careless",
        "It encourages intention and responsibility, asking whether a choice is wise and not just possible",
        "It removes the need to budget",
        "It means never enjoying anything",
      ],
      correct: 1,
      feedback: {
        correct: "Right. It shifts the question from 'can I' to 'is this wise and responsible', which improves decisions.",
        incorrect: "It brings intention. You weigh whether a choice is wise and responsible, not merely affordable.",
      },
    },
  ],
  "bible-money/proverbs-money": [
    {
      type: "mcq",
      question: "Proverbs repeatedly praises which money habit?",
      options: [
        "Get-rich-quick schemes",
        "Diligent, steady saving and planning over time",
        "Spending everything today",
        "Co-signing others' debts freely",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Proverbs favours patient, diligent building of wealth over sudden riches.",
        incorrect: "It praises diligence and steady saving. It warns against quick riches and reckless choices.",
      },
    },
    {
      type: "true-false",
      statement: "Proverbs warns that wealth gained quickly and without effort often disappears just as fast.",
      correct: true,
      feedback: {
        correct: "Correct. The theme is that hasty wealth dwindles, while patient gathering grows.",
        incorrect: "That is the warning. Quick, effortless wealth tends to vanish, unlike wealth built steadily.",
      },
    },
    {
      type: "mcq",
      question: "Proverbs points to the ant as a model of what?",
      options: [
        "Waiting for provision instead of working",
        "Storing in good times for the seasons ahead",
        "Borrowing in winter to repay in summer",
        "Spending freely while times are good",
      ],
      correct: 1,
      feedback: {
        correct: "Right. The ant stores in summer for winter, a picture of saving and preparing ahead.",
        incorrect: "The ant models foresight, gathering in good times to be ready for lean ones.",
      },
    },
  ],
  "bible-money/lesson-contentment": [
    {
      type: "mcq",
      question: "What is the practical benefit of contentment for your finances?",
      options: [
        "It means you never earn more",
        "It reduces the endless chase for more, which curbs overspending and lifestyle inflation",
        "It forbids saving",
        "It guarantees wealth",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Contentment quiets the 'always more' urge, making it far easier to live within your means.",
        incorrect: "Contentment eases the chase for more, which naturally cuts overspending and lifestyle creep.",
      },
    },
    {
      type: "true-false",
      statement: "Contentment does not mean refusing to improve your situation, it means not letting 'more' control you.",
      correct: true,
      feedback: {
        correct: "Correct. You can still work and grow. Contentment is about your heart, not banning ambition.",
        incorrect: "It allows growth. Contentment is freedom from being ruled by 'more', not a ban on improving.",
      },
    },
  ],
  "bible-money/lesson-planning-proverbs": [
    {
      type: "mcq",
      question: "Proverbs on planning most supports which habit?",
      options: [
        "Acting on impulse",
        "Counting the cost and preparing before you commit",
        "Avoiding all thought about the future",
        "Trusting luck",
      ],
      correct: 1,
      feedback: {
        correct: "Right. The wisdom is to plan and count the cost, rather than rushing in unprepared.",
        incorrect: "It favours planning and counting the cost first. Impulse and luck are what it warns against.",
      },
    },
    {
      type: "true-false",
      statement: "The idea that 'plans fail for lack of counsel' supports seeking advice before big money decisions.",
      correct: true,
      feedback: {
        correct: "Correct. Wise counsel before a major decision reflects the Proverbs approach to planning.",
        incorrect: "It supports getting advice. Big decisions benefit from counsel, as Proverbs teaches.",
      },
    },
  ],
  "bible-money/lesson-work-ethic": [
    {
      type: "mcq",
      question: "How does a strong work ethic connect to financial stability here?",
      options: [
        "It does not",
        "Diligent, honest work is presented as the normal path to provision and growth",
        "It promises instant wealth",
        "It replaces the need to save",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Steady, honest labour is treated as the ordinary means of provision, paired with wise saving.",
        incorrect: "Diligent, honest work is the path to provision. It works alongside saving, not instead of it.",
      },
    },
    {
      type: "true-false",
      statement: "Valuing hard work does not rule out rest, it warns against both laziness and burnout-driven greed.",
      correct: true,
      feedback: {
        correct: "Correct. The balance is diligence with rest, avoiding both idleness and endless striving for more.",
        incorrect: "It is balanced. Diligence is praised, but so is rest, against both laziness and greed.",
      },
    },
  ],
  "bible-money/lesson-avoiding-surety": [
    {
      type: "mcq",
      question: "'Surety' in Proverbs refers to what modern practice?",
      options: [
        "Taking out credit life insurance for a loan",
        "Standing as guarantor or co-signer for someone else's debt",
        "Pledging your savings as loan collateral",
        "Paying another person's tax debt to SARS",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Surety is taking on responsibility for another's debt, which Proverbs repeatedly cautions against.",
        incorrect: "Surety is co-signing or guaranteeing another's debt. Proverbs warns strongly against it.",
      },
    },
    {
      type: "true-false",
      statement: "Co-signing a loan means you are legally on the hook if the other person does not pay.",
      correct: true,
      feedback: {
        correct: "Correct. As guarantor, the debt becomes yours if they default, which is the risk Proverbs highlights.",
        incorrect: "You are liable. If they fail to pay, the lender comes to you, exactly the danger of surety.",
      },
    },
  ],
  "bible-money/lesson-tithing": [
    {
      type: "mcq",
      question: "In practice, how do many people approach tithing or regular giving in a budget?",
      options: [
        "As an afterthought if money is left",
        "As a planned, first-priority line, given intentionally rather than from leftovers",
        "By borrowing to give",
        "By giving only once in a lifetime",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Giving is usually planned first and given intentionally, not squeezed from whatever remains.",
        incorrect: "It is typically a planned, first-priority amount, given on purpose rather than from leftovers.",
      },
    },
    {
      type: "true-false",
      statement: "Giving intentionally works best when it fits within a budget you can sustain, not funded by debt.",
      correct: true,
      feedback: {
        correct: "Correct. Sustainable giving comes from a real plan, not from borrowing you cannot repay.",
        incorrect: "Sustainable is the key word. Giving should fit your budget, not be funded by debt.",
      },
    },
  ],
  "bible-money/lesson-wealth-eternity": [
    {
      type: "mcq",
      question: "What perspective does 'wealth and eternity' encourage toward money?",
      options: [
        "Money is the ultimate goal",
        "Money is a tool with a limited role, to be held loosely and used well",
        "Money should be despised",
        "Money guarantees happiness",
      ],
      correct: 1,
      feedback: {
        correct: "Right. It frames money as a useful tool, not the point of life, encouraging a healthy grip on it.",
        incorrect: "It treats money as a tool to use well and hold loosely, not as the ultimate goal.",
      },
    },
    {
      type: "true-false",
      statement: "Seeing money as a tool rather than a master can reduce anxiety and greed around it.",
      correct: true,
      feedback: {
        correct: "Correct. When money serves your values rather than ruling you, fear and greed lose their grip.",
        incorrect: "It can help. Money as a tool, not a master, eases the anxiety and greed it often brings.",
      },
    },
  ],
  "bible-money/lesson-financial-integrity": [
    {
      type: "mcq",
      question: "What does financial integrity look like day to day?",
      options: [
        "Cutting corners when nobody is watching",
        "Honesty in dealings, paying what you owe, and keeping your word even when it costs you",
        "Hiding income from everyone",
        "Winning at any cost",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Integrity means honest dealings and kept promises, even when honesty is the more expensive choice.",
        incorrect: "It is honesty and kept commitments, paying what you owe, even when it costs you something.",
      },
    },
    {
      type: "true-false",
      statement: "Financial integrity includes honesty with SARS and creditors, not just with people you like.",
      correct: true,
      feedback: {
        correct: "Correct. Integrity is consistent. It applies to tax and debts, not only to convenient relationships.",
        incorrect: "It applies across the board, including SARS and creditors, not just chosen relationships.",
      },
    },
  ],
  "bible-money/lesson-generosity-kingdom": [
    {
      type: "mcq",
      question: "How is generosity framed as a 'strategy' rather than just a nice gesture?",
      options: [
        "A guaranteed route to financial prosperity",
        "An intentional, planned part of how you use money",
        "A reward to enjoy after wealth is built",
        "A replacement for saving and budgeting",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Planned generosity is treated as a deliberate use of resources with impact that outlasts you.",
        incorrect: "It is intentional and planned, a purposeful use of money with impact beyond your own needs.",
      },
    },
    {
      type: "true-false",
      statement: "Planned generosity and personal financial stability can work together, since a stable base lets you give consistently.",
      correct: true,
      feedback: {
        correct: "Correct. Getting your own finances in order makes steady, reliable giving possible.",
        incorrect: "They support each other. A stable financial base is what lets you give consistently over time.",
      },
    },
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // MONEY PSYCHOLOGY
  // ═══════════════════════════════════════════════════════════════════════════
  "money-psychology/lesson-1": [
    {
      type: "mcq",
      question: "What is 'present bias'?",
      options: [
        "Preferring the future over now",
        "Overvaluing rewards now versus larger rewards later, which hurts saving",
        "A gift you receive",
        "A tax term",
      ],
      correct: 1,
      feedback: {
        correct: "Right. We over-weight instant rewards, which is why saving for later feels so hard.",
        incorrect: "Present bias is favouring smaller rewards now over bigger ones later. It undermines saving.",
      },
    },
    {
      type: "true-false",
      statement: "Automating savings works partly because it removes the moment where present bias tempts you to spend.",
      correct: true,
      feedback: {
        correct: "Correct. If the money moves before you see it, present bias never gets its chance.",
        incorrect: "That is why automation helps. It saves before present bias can talk you out of it.",
      },
    },
    {
      type: "scenario",
      question: "You get R2 000 unexpectedly. Present bias pushes you to spend it now. What counters it best?",
      options: [
        "Spend before you change your mind",
        "Move it to savings immediately, so the decision is locked before the urge fades into regret",
        "Lend it to a stranger",
        "Leave it in your wallet",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Acting on your long-term plan at once beats the urge. Locking it away removes the temptation.",
        incorrect: "Move it to savings straight away. Acting on the plan immediately beats the pull of the moment.",
      },
    },
  ],
  "money-psychology/lesson-2": [
    {
      type: "mcq",
      question: "What is 'anchoring' in spending?",
      options: [
        "Fixing your budget at the start of each month",
        "Letting a first number set what feels like a fair price",
        "Taking a loan against the value of your home",
        "Refusing to compare prices between shops",
      ],
      correct: 1,
      feedback: {
        correct: "Right. The high 'original' price anchors you, so R1 200 feels like a win even if it is still too much.",
        incorrect: "Anchoring is when a first number frames your judgement, like a slashed 'original' price making a deal feel good.",
      },
    },
    {
      type: "mcq",
      question: "What is the sunk cost fallacy?",
      options: [
        "Budgeting only with the cash you carry",
        "Continuing to spend because of what you already spent",
        "Saving so much that you never enjoy money",
        "A charge banks levy on dormant accounts",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Past spending cannot be recovered. Deciding based on it, not the future, is the sunk cost trap.",
        incorrect: "It is continuing to spend because you already spent. What matters is the future choice, not sunk money.",
      },
    },
    {
      type: "true-false",
      statement: "A good decision should weigh the money you have already spent so it does not go to waste.",
      correct: false,
      feedback: {
        correct: "Right. Sunk costs are gone. Only future costs and benefits should drive the decision.",
        incorrect: "That is the sunk cost fallacy. Money already spent should not steer what you do next.",
      },
    },
    {
      type: "scenario",
      question: "You have spent R6 000 fixing an old car and it needs R8 000 more. A reliable replacement is affordable. What does avoiding sunk cost thinking suggest?",
      options: [
        "Keep paying because you have already spent R6 000",
        "Judge the next R8 000 on its own merits versus the alternative, ignoring the R6 000 already gone",
        "Always keep the old car",
        "Never buy a car again",
      ],
      correct: 1,
      feedback: {
        correct: "Right. The R6 000 is gone regardless. Compare the R8 000 repair to the replacement on future value alone.",
        incorrect: "Ignore the spent R6 000. Weigh the next R8 000 against the alternative on its own merits.",
      },
    },
  ],
  "money-psychology/lesson-3": [
    {
      type: "mcq",
      question: "How do herd mentality and FOMO harm investors?",
      options: [
        "They lead to calm decisions",
        "They push people to buy hyped assets at the top and sell in panic at the bottom",
        "They lower fees",
        "They guarantee gains",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Chasing the crowd usually means buying high on hype and selling low in fear, the opposite of the goal.",
        incorrect: "They cause buying at the top and panic-selling at the bottom, driven by the crowd rather than a plan.",
      },
    },
    {
      type: "true-false",
      statement: "A written investment plan you stick to is one of the best defences against FOMO-driven decisions.",
      correct: true,
      feedback: {
        correct: "Correct. A plan gives you rules to follow when hype or fear tempt you to abandon your strategy.",
        incorrect: "A plan helps. Pre-set rules keep you steady when FOMO or panic push you to act.",
      },
    },
  ],
  "money-psychology/lesson-4": [
    {
      type: "mcq",
      question: "What does loss aversion describe?",
      options: [
        "Preferring guaranteed losses to risky gains",
        "Feeling losses more strongly than equal gains",
        "Refusing to hold any risky assets at all",
        "Insuring only against very large losses",
      ],
      correct: 1,
      feedback: {
        correct: "Right. A loss stings more than the same-size gain pleases, which can make us too cautious or hold losers too long.",
        incorrect: "Loss aversion is feeling losses more than equal gains. It can distort otherwise sensible decisions.",
      },
    },
    {
      type: "true-false",
      statement: "Loss aversion can make people hold a falling investment too long, hoping to avoid crystallising a loss.",
      correct: true,
      feedback: {
        correct: "Correct. The wish to avoid 'making it real' can keep you in a poor investment past the point of sense.",
        incorrect: "It can. Avoiding the pain of a realised loss makes people cling to losers longer than they should.",
      },
    },
  ],
  "money-psychology/lesson-hedonic-adaptation": [
    {
      type: "mcq",
      question: "What is hedonic adaptation?",
      options: [
        "A tax break",
        "The way we quickly get used to new things, so the happiness from a purchase fades fast",
        "A savings account",
        "A permanent joy from spending",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Excitement from a new phone or car fades as it becomes normal, which fuels the next purchase.",
        incorrect: "It is how we adapt to new things, so a purchase's thrill fades and we soon want the next upgrade.",
      },
    },
    {
      type: "true-false",
      statement: "Knowing that the thrill of a purchase fades can help you spend on experiences and things you truly value.",
      correct: true,
      feedback: {
        correct: "Correct. Aware of adaptation, you can direct money to what lasts for you rather than fleeting upgrades.",
        incorrect: "It helps you choose better. If the buzz fades anyway, spend on what genuinely matters to you.",
      },
    },
  ],
  "money-psychology/lesson-mental-accounting": [
    {
      type: "mcq",
      question: "What is 'mental accounting'?",
      options: [
        "Estimating your budget with mental arithmetic",
        "Treating money differently depending on where it came from",
        "Keeping a running tally of daily spending in your head",
        "Reviewing your bank statement every month",
      ],
      correct: 1,
      feedback: {
        correct: "Right. We label money by source, so 'found' or 'bonus' money gets spent loosely though every rand is equal.",
        incorrect: "Mental accounting is treating rands differently by source. A bonus is spent freely though it is the same money.",
      },
    },
    {
      type: "true-false",
      statement: "A bonus or tax refund is 'extra' money, so it is fine to treat it more loosely than salary.",
      correct: false,
      feedback: {
        correct: "Right. A rand is a rand. Windfalls deserve the same care as salary.",
        incorrect: "That is mental accounting talking. Windfalls are worth exactly as much as earned salary.",
      },
    },
    {
      type: "scenario",
      question: "You get a R10 000 tax refund. Mental accounting says 'treat yourself, it is free money'. What is the clearer view?",
      options: [
        "It is free money to spend fast",
        "It is your own money returned, so weigh it against your goals like any other R10 000",
        "It must all be saved by law",
        "Refunds do not count",
      ],
      correct: 1,
      feedback: {
        correct: "Right. A refund is money you overpaid coming back. Treat it with the same care as any R10 000 you earn.",
        incorrect: "A refund is your own money returned, not a bonus from nowhere. Judge it against your goals.",
      },
    },
    {
      type: "true-false",
      statement: "Splitting a windfall on purpose, some to a goal and some to enjoy, is a healthier plan than spending it all because it feels 'extra'.",
      correct: true,
      feedback: {
        correct: "Correct. A deliberate split beats letting the 'extra money' label drive the whole thing to spending.",
        incorrect: "A planned split is healthier. It stops the 'extra' feeling from sending all of it to spending.",
      },
    },
  ],
  "money-psychology/lesson-confirmation-bias": [
    {
      type: "mcq",
      question: "How does confirmation bias trip up investors?",
      options: [
        "It has no effect",
        "They seek only information that agrees with them and ignore warning signs",
        "It lowers fees",
        "It guarantees good picks",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Once we like an investment, we hunt for supporting views and dismiss the risks, which is dangerous.",
        incorrect: "Confirmation bias makes us chase agreeing views and ignore red flags about an investment we already like.",
      },
    },
    {
      type: "true-false",
      statement: "Deliberately seeking out the strongest arguments against your investment is a healthy check on confirmation bias.",
      correct: true,
      feedback: {
        correct: "Correct. Reading the bear case forces you to test your view instead of only flattering it.",
        incorrect: "It is healthy. Hunting for the best counter-arguments guards against only hearing what you want.",
      },
    },
  ],
  "money-psychology/lesson-loss-aversion": [
    {
      type: "mcq",
      question: "Research suggests a loss feels roughly how strong compared with an equal gain?",
      options: [
        "Half as strong",
        "About twice as strong",
        "Exactly equal",
        "Ten times weaker",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Losing R1 000 tends to hurt about twice as much as gaining R1 000 feels good.",
        incorrect: "A loss lands about twice as hard as an equal gain feels good, which skews our decisions.",
      },
    },
    {
      type: "true-false",
      statement: "Because losses hurt more, people sometimes take too little sensible risk and leave long-term growth on the table.",
      correct: true,
      feedback: {
        correct: "Correct. Fear of loss can push people into cash for decades, missing the growth they needed.",
        incorrect: "It can. Over-fear of loss leads to too much caution, sacrificing long-term growth.",
      },
    },
  ],
  "money-psychology/lesson-overconfidence-recency": [
    {
      type: "mcq",
      question: "What is 'recency bias' in investing?",
      options: [
        "Giving old events more weight than new ones",
        "Assuming what happened lately will simply continue",
        "Reacting only after prices have already moved",
        "Preferring recently listed companies' shares",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Recency bias projects the recent past forward, which is why people pile in at the top.",
        incorrect: "Recency bias is over-weighting recent events, expecting the latest trend to keep going.",
      },
    },
    {
      type: "true-false",
      statement: "Overconfidence can lead investors to trade too often and take bigger bets than their knowledge justifies.",
      correct: true,
      feedback: {
        correct: "Correct. Believing we know more than we do drives over-trading and outsized, risky positions.",
        incorrect: "It does. Overconfidence fuels frequent trading and bets bigger than the person's real edge.",
      },
    },
  ],
  "money-psychology/lesson-applied-sunk-cost-investing": [
    {
      type: "scenario",
      question: "A share you bought at R100 is now R40 and the company's outlook has clearly worsened. What does clear thinking suggest?",
      options: [
        "Hold forever to avoid admitting a loss",
        "Decide based on the future outlook, not your purchase price, since the R100 is a sunk cost",
        "Buy more purely to lower your average",
        "Never sell anything",
      ],
      correct: 1,
      feedback: {
        correct: "Right. The price you paid is irrelevant now. Judge it on future prospects, as you would a fresh purchase.",
        incorrect: "Your R100 entry is a sunk cost. Decide on the future outlook, not on getting back to what you paid.",
      },
    },
    {
      type: "true-false",
      statement: "The question 'would I buy this today at this price' cuts through sunk cost thinking.",
      correct: true,
      feedback: {
        correct: "Correct. If you would not buy it now, holding only to avoid a loss is the sunk cost trap.",
        incorrect: "It is a great test. If you would not buy today, you are likely holding for sunk cost reasons.",
      },
    },
  ],
  "money-psychology/lesson-5": [
    {
      type: "mcq",
      question: "What is lifestyle inflation (lifestyle creep)?",
      options: [
        "Prices rising in shops",
        "Spending rising to match every pay increase, so you never get ahead despite earning more",
        "A type of tax",
        "Saving more as you earn more",
      ],
      correct: 1,
      feedback: {
        correct: "Right. When each raise is swallowed by bigger spending, higher income never turns into wealth.",
        incorrect: "Lifestyle inflation is spending climbing with income, so raises vanish and savings do not grow.",
      },
    },
    {
      type: "scenario",
      question: "Ayanda gets a R3 000 raise. What move best fights lifestyle inflation?",
      options: [
        "Upgrade her car and flat immediately",
        "Direct a big share of the raise to savings or debt before adjusting her lifestyle",
        "Spend it all, she earned it",
        "Take on a new store card",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Banking most of a raise before lifestyle adjusts turns higher income into real progress.",
        incorrect: "Save or pay down debt with most of the raise first. Otherwise the extra just funds a bigger lifestyle.",
      },
    },
    {
      type: "true-false",
      statement: "Automatically increasing your savings each time you get a raise is a simple way to beat lifestyle creep.",
      correct: true,
      feedback: {
        correct: "Correct. If savings rise with income by default, the raise builds wealth instead of just spending.",
        incorrect: "It works well. Raising savings with each raise stops the extra income from vanishing into spending.",
      },
    },
    {
      type: "true-false",
      statement: "Some lifestyle improvement after a raise is fine, the danger is when all of every raise disappears into spending.",
      correct: true,
      feedback: {
        correct: "Correct. Enjoying part of a raise is healthy. The trap is letting the whole increase inflate your spending.",
        incorrect: "Balance is fine. Enjoy some of the raise, but do not let all of it turn into higher spending.",
      },
    },
  ],
  "money-psychology/lesson-6": [
    {
      type: "mcq",
      question: "How does social media distort money decisions?",
      options: [
        "It shows the full financial picture",
        "It shows curated highlights, so you compare your reality to others' edited best moments and overspend",
        "It lowers prices",
        "It has no effect",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Feeds show wins, not debts. Comparing your whole life to others' highlights fuels pressure to spend.",
        incorrect: "Social media shows edited highlights, not the debt behind them. That comparison drives overspending.",
      },
    },
    {
      type: "true-false",
      statement: "Many of the 'lifestyles' shown online are funded by debt or are simply not real, which is worth remembering before you compare.",
      correct: true,
      feedback: {
        correct: "Correct. Behind many flashy posts sits debt or pure staging. Your finances should not chase an illusion.",
        incorrect: "Often it is debt or staged. Comparing your money to online images means comparing to something unreal.",
      },
    },
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // RETIREMENT PLANNING
  // ═══════════════════════════════════════════════════════════════════════════
  "retirement/two-pot-basics": [
    {
      type: "mcq",
      question: "Under the two-pot system, how are new retirement contributions split?",
      options: [
        "All into one pot you can withdraw anytime",
        "One third into a savings pot you can access, two thirds into a retirement pot preserved until retirement",
        "Half to SARS",
        "All locked with no access ever",
      ],
      correct: 1,
      feedback: {
        correct: "Right. A third goes to an accessible savings pot, two thirds stay preserved for retirement.",
        incorrect: "It splits one third to an accessible savings pot and two thirds to a preserved retirement pot.",
      },
    },
  ],
  "retirement/how-much-retire": [
    {
      type: "true-false",
      statement: "A common rule of thumb is to aim for a retirement pot around 15 to 20 times your annual expenses.",
      correct: true,
      feedback: {
        correct: "Correct. Roughly 15 to 20 times yearly expenses is a common target, so a drawdown lasts through retirement.",
        incorrect: "That is the guideline. About 15 to 20 times your annual expenses helps your savings last.",
      },
    },
  ],
  "retirement/lesson-ra-vs-pension-comparison": [
    {
      type: "mcq",
      question: "What is a key difference between a workplace pension fund and a personal retirement annuity (RA)?",
      options: [
        "They differ only in the provider's branding",
        "A pension runs through your employer, an RA is your own",
        "Only pensions enjoy tax-deductible contributions",
        "A pension may never be moved or preserved",
      ],
      correct: 1,
      feedback: {
        correct: "Right. A pension is employer-linked, an RA is personal and portable, and both offer retirement tax benefits.",
        incorrect: "A pension is employer-run, an RA is your own independent product. Both give retirement tax benefits.",
      },
    },
    {
      type: "true-false",
      statement: "An RA is useful for the self-employed or anyone whose job has no retirement fund.",
      correct: true,
      feedback: {
        correct: "Correct. An RA lets anyone save for retirement with tax benefits, employer fund or not.",
        incorrect: "It suits them well. An RA gives the self-employed a tax-advantaged retirement vehicle.",
      },
    },
  ],
  "retirement/lesson-retirement-age": [
    {
      type: "mcq",
      question: "Why does retiring a few years later often make a big difference?",
      options: [
        "It only changes the date on the certificate",
        "More contribution years, more growth, fewer drawdown years",
        "SASSA adds a bonus for every extra year worked",
        "Retirement income becomes fully tax free",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Extra saving years, more compounding and a shorter retirement all stretch your money much further.",
        incorrect: "Later retirement adds contributions and growth while shortening drawdown, which strongly helps your pot.",
      },
    },
    {
      type: "true-false",
      statement: "Retiring earlier means your savings must last longer while having had less time to grow.",
      correct: true,
      feedback: {
        correct: "Correct. Early retirement is a double squeeze, a longer drawdown funded by a smaller, less-grown pot.",
        incorrect: "It is a double challenge. Less time to grow the pot, and more years to fund from it.",
      },
    },
  ],
  "retirement/lesson-annuity-types": [
    {
      type: "mcq",
      question: "What is the main trade-off between a living annuity and a guaranteed (life) annuity?",
      options: [
        "Only the fees differ between the two types",
        "Flexibility with market risk versus a set income for life",
        "Living annuities are guaranteed by the state",
        "Guaranteed annuities always pay your heirs",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Living annuities offer control and legacy with market risk, guaranteed annuities trade that for certainty.",
        incorrect: "A living annuity is flexible but carries market risk, a guaranteed annuity pays a set income for life.",
      },
    },
    {
      type: "true-false",
      statement: "Drawing too high an income from a living annuity risks running out of money later in retirement.",
      correct: true,
      feedback: {
        correct: "Correct. A high drawdown rate can deplete the capital, leaving little for your later years.",
        incorrect: "It is a real risk. Drawing too much early can exhaust a living annuity before retirement ends.",
      },
    },
  ],
  "retirement/lesson-post-retirement-healthcare": [
    {
      type: "mcq",
      question: "Why does healthcare deserve special attention in retirement planning?",
      options: [
        "Government healthcare becomes free at 60",
        "Medical costs rise with age and often outpace inflation",
        "Medical schemes must drop premiums for pensioners",
        "Medical aid is tax deductible so it costs nothing",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Medical inflation usually runs above normal inflation, so healthcare can eat into a retirement budget.",
        incorrect: "Medical costs climb with age and rise faster than general inflation, pressuring a fixed retirement income.",
      },
    },
    {
      type: "true-false",
      statement: "Keeping medical aid cover in place into retirement helps protect your savings from large, unexpected health bills.",
      correct: true,
      feedback: {
        correct: "Correct. Cover shields your capital from big medical shocks that could otherwise force heavy withdrawals.",
        incorrect: "It protects your pot. Without cover, a major health event could force large, damaging withdrawals.",
      },
    },
  ],
  "retirement/lesson-estate-planning-retirement": [
    {
      type: "mcq",
      question: "Why should retirement and estate planning be considered together?",
      options: [
        "They are unrelated",
        "How your retirement products are structured affects what passes to your heirs and the tax involved",
        "Estate planning is only for the young",
        "SARS handles it for you",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Beneficiary nominations and product choices shape both your income and what your heirs receive.",
        incorrect: "They connect. Your retirement product structure and nominations affect your legacy and its tax.",
      },
    },
    {
      type: "true-false",
      statement: "Keeping beneficiary nominations on retirement products up to date helps your money reach the right people quickly.",
      correct: true,
      feedback: {
        correct: "Correct. Current nominations speed payment to the right people and can bypass delays in the estate.",
        incorrect: "Keep them current. Up-to-date nominations get funds to the right beneficiaries faster.",
      },
    },
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // THE RAND & YOUR MONEY
  // ═══════════════════════════════════════════════════════════════════════════
  "rand-economy/why-rand-weakens": [
    {
      type: "mcq",
      question: "Which factor can weaken the rand against the dollar?",
      options: [
        "Strong local growth and stable politics",
        "Global risk-off sentiment, load shedding fears, or weak commodity prices",
        "A budget surplus",
        "Falling inflation only",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Investors pull back from riskier currencies during uncertainty, and local troubles add pressure.",
        incorrect: "Risk-off moods and local worries like power or weak commodities can push the rand weaker.",
      },
    },
  ],
  "rand-economy/lesson-offshore-investing-mechanics": [
    {
      type: "mcq",
      question: "What is one simple way South Africans get offshore exposure without moving money abroad?",
      options: [
        "Hiding cash",
        "Buying rand-denominated global or feeder funds and ETFs on a local platform",
        "Only holding local shares",
        "Keeping everything in a savings account",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Local feeder funds and global ETFs give offshore exposure while you invest in rands here.",
        incorrect: "Rand-based global funds and ETFs on a local platform give offshore exposure without externalising money.",
      },
    },
    {
      type: "true-false",
      statement: "Taking money physically offshore uses your annual allowances and may need tax clearance for larger amounts.",
      correct: true,
      feedback: {
        correct: "Correct. The discretionary and foreign investment allowances apply, with tax clearance for bigger sums.",
        incorrect: "It uses your allowances. Larger externalisations need tax clearance under exchange control rules.",
      },
    },
  ],
  "rand-economy/lesson-petrol-price-rand": [
    {
      type: "mcq",
      question: "Why does a weaker rand usually push up the petrol price?",
      options: [
        "Petrol is made locally with no imports",
        "Oil is priced in dollars, so a weaker rand makes each imported litre cost more rands",
        "SARS sets petrol by mood",
        "It has no effect",
      ],
      correct: 1,
      feedback: {
        correct: "Right. The rand price of oil rises when the rand weakens, feeding into the pump price.",
        incorrect: "Oil trades in dollars. A weaker rand means more rands per litre, so petrol goes up.",
      },
    },
    {
      type: "true-false",
      statement: "The petrol price is driven by both the global oil price and the rand-dollar exchange rate.",
      correct: true,
      feedback: {
        correct: "Correct. Both the dollar oil price and the exchange rate move the pump price each month.",
        incorrect: "Both matter. The dollar oil price and the rand-dollar rate together shape the petrol price.",
      },
    },
  ],
  "rand-economy/lesson-how-to-hedge-rand": [
    {
      type: "mcq",
      question: "What is a practical way to protect your wealth against long-term rand weakness?",
      options: [
        "Keep everything in cash under the bed",
        "Hold a portion of your investments in global assets, so some wealth is not tied to the rand",
        "Buy more local store cards",
        "Ignore diversification",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Global exposure means part of your wealth grows in stronger currencies, cushioning rand weakness.",
        incorrect: "Offshore exposure hedges it. Holding some assets globally means not all your wealth depends on the rand.",
      },
    },
    {
      type: "true-false",
      statement: "Over-hedging by putting everything offshore also carries risk, since the rand can strengthen too.",
      correct: true,
      feedback: {
        correct: "Correct. Balance matters. The rand recovers at times, so an all-offshore bet is its own gamble.",
        incorrect: "It is a risk. The rand can strengthen, so going fully offshore is not a one-way safe bet.",
      },
    },
  ],
  "rand-economy/lesson-sarb-intervention": [
    {
      type: "mcq",
      question: "What is the SARB's main tool for influencing the economy and, indirectly, the rand?",
      options: [
        "Printing money to settle government debt",
        "Setting the repo rate, which steers rates and inflation",
        "Setting fuel and food prices each month",
        "Buying JSE shares to support the market",
      ],
      correct: 1,
      feedback: {
        correct: "Right. By moving the repo rate the SARB manages inflation, which shapes the rand's appeal to investors.",
        incorrect: "Its main lever is the repo rate. That influences inflation and how attractive the rand is to hold.",
      },
    },
    {
      type: "true-false",
      statement: "The SARB's main mandate is to fix the rand at a set level against the US dollar.",
      correct: false,
      feedback: {
        correct: "Right. The SARB targets INFLATION (the 3-6% band); it does not peg the exchange rate.",
        incorrect: "The SARB targets inflation, not a fixed rand. The currency floats.",
      },
    },
  ],
  "rand-economy/lesson-sa-trade-balance": [
    {
      type: "mcq",
      question: "What is a trade surplus?",
      options: [
        "Importing more than you export",
        "Exporting more than you import, which supports the currency",
        "A government grant",
        "A type of tax",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Exporting more than you import brings in foreign currency, which tends to support the rand.",
        incorrect: "A surplus is exports above imports. The inflow of foreign currency tends to support the rand.",
      },
    },
    {
      type: "true-false",
      statement: "SA's exports of minerals and metals mean commodity prices strongly influence its trade balance and the rand.",
      correct: true,
      feedback: {
        correct: "Correct. As a big commodity exporter, SA's trade balance and rand move with metal and mineral prices.",
        incorrect: "They do. Commodity prices matter a lot to SA's trade balance and the rand, given its exports.",
      },
    },
  ],
  "rand-economy/lesson-repo-rate-explained": [
    {
      type: "mcq",
      question: "What is the repo rate?",
      options: [
        "The rate shops charge on store cards",
        "The rate at which the SARB lends to banks, which sets the base for prime and your loan rates",
        "A property tax",
        "The petrol price",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Banks borrow from the SARB at the repo rate, then lend to you at prime, which sits above it.",
        incorrect: "The repo rate is the SARB's lending rate to banks. Prime, and your loan rates, are built on top of it.",
      },
    },
    {
      type: "true-false",
      statement: "When the repo rate rises, prime rises too, so variable-rate loans like bonds cost more.",
      correct: true,
      feedback: {
        correct: "Correct. Prime tracks the repo rate, so a hike lifts repayments on variable-rate debt.",
        incorrect: "They move together. A repo hike raises prime, pushing up variable loan repayments.",
      },
    },
  ],
  "rand-economy/lesson-mpc-and-inflation": [
    {
      type: "mcq",
      question: "Why does the SARB raise interest rates when inflation runs high?",
      options: [
        "To reward spending",
        "Higher rates cool borrowing and spending, which helps bring inflation back toward target",
        "To weaken the rand on purpose",
        "For no reason",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Dearer credit slows demand, easing the price pressure that drives inflation.",
        incorrect: "Higher rates slow borrowing and spending, which helps pull inflation back to target.",
      },
    },
    {
      type: "true-false",
      statement: "The SARB aims to keep inflation within a target band, currently around the mid-point of 3 to 6 percent.",
      correct: true,
      feedback: {
        correct: "Correct. SA uses a 3 to 6 percent inflation target, with policy aimed near the middle of that band.",
        incorrect: "It targets a band. SA's inflation target is 3 to 6 percent, with a focus near the mid-point.",
      },
    },
  ],
  "rand-economy/lesson-applied-repo-rate-impact": [
    {
      type: "scenario",
      question: "The repo rate rises by 0.5%. You have a home loan on a variable rate. What happens?",
      options: [
        "Nothing, your rate is fixed by the original agreement",
        "Your rate and repayment go up, since your bond tracks prime",
        "The bank must renegotiate your entire loan",
        "Your rate falls as banks compete for new home loans",
      ],
      correct: 1,
      feedback: {
        correct: "Right. A variable bond follows prime, so a repo hike lifts your rate and monthly repayment.",
        incorrect: "Your repayment rises. A variable bond tracks prime, which moves up with the repo rate.",
      },
    },
    {
      type: "true-false",
      statement: "A repo cut can ease bond and car repayments, freeing up a little room in your monthly budget.",
      correct: true,
      feedback: {
        correct: "Correct. Lower rates reduce variable repayments, giving households some breathing space.",
        incorrect: "A cut helps. Variable repayments fall, leaving a bit more room in the monthly budget.",
      },
    },
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // CRYPTO & DIGITAL ASSETS
  // ═══════════════════════════════════════════════════════════════════════════
  "crypto-basics/what-is-crypto": [
    {
      type: "mcq",
      question: "What is cryptocurrency, in plain terms?",
      options: [
        "Money issued by the Reserve Bank",
        "A digital asset recorded on a decentralised ledger, not issued or backed by a central bank",
        "A type of bank account",
        "A government bond",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Crypto is a digital asset on a shared ledger, with no central bank standing behind it.",
        incorrect: "It is a decentralised digital asset, not central-bank money. No authority guarantees its value.",
      },
    },
    {
      type: "true-false",
      statement: "Crypto prices can be extremely volatile, so you should only risk money you can afford to lose.",
      correct: true,
      feedback: {
        correct: "Correct. Big swings mean crypto is high risk. Never put in money you need for essentials.",
        incorrect: "It is very volatile. Only ever risk money you could afford to lose entirely.",
      },
    },
  ],
  "crypto-basics/lesson-blockchain-explained": [
    {
      type: "mcq",
      question: "What is a blockchain?",
      options: [
        "A single company's private database",
        "A shared, tamper-resistant record of transactions maintained across many computers",
        "A type of bank vault",
        "A government website",
      ],
      correct: 1,
      feedback: {
        correct: "Right. It is a distributed ledger, copied across many computers, which makes past records hard to alter.",
        incorrect: "A blockchain is a shared ledger held across many computers, which resists tampering.",
      },
    },
    {
      type: "true-false",
      statement: "Because the ledger is public and distributed, transactions on many blockchains can be traced, even if identities are not obvious.",
      correct: true,
      feedback: {
        correct: "Correct. The record is visible, so 'anonymous' is really pseudonymous. Flows can often be followed.",
        incorrect: "They can be traced. A public ledger is pseudonymous, not truly anonymous.",
      },
    },
  ],
  "crypto-basics/lesson-bitcoin-vs-ethereum": [
    {
      type: "mcq",
      question: "What is a key difference between Bitcoin and Ethereum?",
      options: [
        "They differ only in the logo and the price",
        "Bitcoin is mainly payments, Ethereum also runs smart contracts",
        "Ethereum is a private version of Bitcoin",
        "Bitcoin is issued by central banks, Ethereum is not",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Bitcoin focuses on value and payments, Ethereum adds a platform for smart contracts and apps.",
        incorrect: "Bitcoin is value and payments focused, Ethereum adds smart contracts and decentralised apps.",
      },
    },
    {
      type: "true-false",
      statement: "Both Bitcoin and Ethereum remain high-risk, speculative assets rather than guaranteed investments.",
      correct: true,
      feedback: {
        correct: "Correct. Neither is a safe, guaranteed investment. Both carry high risk and big price swings.",
        incorrect: "Both are speculative and high risk. Neither is a guaranteed or safe investment.",
      },
    },
  ],
  "crypto-basics/lesson-sa-crypto-exchanges": [
    {
      type: "mcq",
      question: "What should you check before using a crypto exchange in SA?",
      options: [
        "Only its logo",
        "Its security track record, fees, withdrawal process and regulatory standing",
        "Whether friends use it, and nothing else",
        "The colour of the app",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Security, fees, how easily you can withdraw, and its compliance all matter before you deposit.",
        incorrect: "Check security history, fees, withdrawals and regulation. Reputation and safeguards matter most.",
      },
    },
    {
      type: "true-false",
      statement: "Leaving large amounts of crypto on an exchange carries the risk of hacks or the platform failing.",
      correct: true,
      feedback: {
        correct: "Correct. 'Not your keys, not your coins.' Exchange balances can be lost to hacks or collapses.",
        incorrect: "There is real risk. Exchanges can be hacked or fail, so large balances left on them are exposed.",
      },
    },
  ],
  "crypto-basics/lesson-defi-risks": [
    {
      type: "mcq",
      question: "Why is DeFi (decentralised finance) especially risky for everyday SA investors?",
      options: [
        "Its returns are guaranteed by the protocol",
        "No regulator, no recourse, and frequent contract bugs",
        "It is fully insured by international law",
        "Only the exchange can access your wallet",
      ],
      correct: 1,
      feedback: {
        correct: "Right. With little regulation and no safety net, a bug, hack or scam can wipe out funds with no recourse.",
        incorrect: "DeFi usually has no regulator or recourse, and bugs and scams are common. That makes it high risk.",
      },
    },
    {
      type: "true-false",
      statement: "Very high advertised yields in DeFi often signal very high risk, not free money.",
      correct: true,
      feedback: {
        correct: "Correct. Sky-high yields compensate for serious risk, and many collapse or turn out to be scams.",
        incorrect: "High yield means high risk. Those returns reflect danger, and many such schemes collapse.",
      },
    },
  ],
  "crypto-basics/lesson-crypto-sars-tax": [
    {
      type: "mcq",
      question: "How does SARS view gains from crypto?",
      options: [
        "As invisible and untaxed",
        "As taxable, either as income or capital gains depending on your activity",
        "As a government gift",
        "As exempt forever",
      ],
      correct: 1,
      feedback: {
        correct: "Right. SARS treats crypto gains as taxable. Frequent trading may be income, longer holds may be capital gains.",
        incorrect: "Crypto is taxable. Depending on how you use it, gains are taxed as income or capital gains.",
      },
    },
    {
      type: "true-false",
      statement: "You should keep records of your crypto buys, sells and values, since you must declare gains to SARS.",
      correct: true,
      feedback: {
        correct: "Correct. Good records of dates, amounts and rand values are needed to declare crypto correctly.",
        incorrect: "Keep records. SARS expects you to declare crypto gains, which needs accurate transaction history.",
      },
    },
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // BUSINESS FINANCE
  // ═══════════════════════════════════════════════════════════════════════════
  "business-finance/business-vs-personal": [
    {
      type: "mcq",
      question: "Why should you keep business and personal money in separate accounts?",
      options: [
        "It looks fancy",
        "It makes tax, record-keeping and knowing your true profit far clearer, and protects you in disputes",
        "It is required to trade at all",
        "There is no reason",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Separation gives clean records, accurate profit figures and easier tax, and avoids messy mixing.",
        incorrect: "Separate accounts clarify tax, records and real profit. Mixing the two hides how the business is doing.",
      },
    },
    {
      type: "true-false",
      statement: "Paying yourself a set 'salary' from the business, rather than dipping in randomly, keeps both sides clearer.",
      correct: true,
      feedback: {
        correct: "Correct. A fixed draw keeps the business books clean and your personal budget predictable.",
        incorrect: "A set draw helps. Random dipping muddies the books and hides the business's real position.",
      },
    },
  ],
  "business-finance/lesson-cash-flow-business": [
    {
      type: "mcq",
      question: "Why can a profitable business still run out of cash?",
      options: [
        "Profit and cash are the same",
        "Profit can be tied up in unpaid invoices and stock, while bills still need paying now",
        "It cannot happen",
        "Only loss-making firms run short",
      ],
      correct: 1,
      feedback: {
        correct: "Right. If customers pay late while you must pay staff and suppliers now, cash runs dry despite profit on paper.",
        incorrect: "Profit can be locked in debtors and stock. Timing gaps mean a profitable firm can still run short of cash.",
      },
    },
    {
      type: "true-false",
      statement: "A cash flow forecast helps a business see shortfalls coming and arrange funding before a crisis.",
      correct: true,
      feedback: {
        correct: "Correct. Forecasting cash in and out spots gaps early, when you still have time to act.",
        incorrect: "It helps a lot. A forecast reveals coming shortfalls in time to arrange funding calmly.",
      },
    },
  ],
  "business-finance/lesson-invoicing-debtors": [
    {
      type: "mcq",
      question: "What is a practical way to get customers to pay on time?",
      options: [
        "Offer unlimited time to pay to keep goodwill",
        "Invoice promptly with clear terms and firm follow-up",
        "Invoice only once a project is fully complete",
        "Add silent penalties without telling the client",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Fast invoicing, clear terms and consistent follow-up are what actually shorten payment times.",
        incorrect: "Invoice quickly, set clear terms and follow up firmly. Waiting and hoping just delays your cash.",
      },
    },
    {
      type: "true-false",
      statement: "Late-paying customers effectively borrow from your business for free, straining your cash flow.",
      correct: true,
      feedback: {
        correct: "Correct. Every overdue invoice is your money working for them, not you, so chase it.",
        incorrect: "They are. Unpaid invoices are an interest-free loan from you to the customer, hurting your cash.",
      },
    },
  ],
  "business-finance/lesson-business-bank-accounts": [
    {
      type: "mcq",
      question: "What is a benefit of a dedicated business bank account?",
      options: [
        "It hides income from SARS",
        "Cleaner records, a professional image on invoices, and easier tax and accounting",
        "It has no fees ever",
        "It is only for big companies",
      ],
      correct: 1,
      feedback: {
        correct: "Right. It keeps business money separate, looks professional to clients, and simplifies tax and books.",
        incorrect: "It gives clean records, a professional look and easier tax, not a way to hide anything.",
      },
    },
    {
      type: "true-false",
      statement: "Comparing business account fees and features across banks can save a small business real money each month.",
      correct: true,
      feedback: {
        correct: "Correct. Fees vary widely. A quick comparison can cut monthly costs meaningfully.",
        incorrect: "It pays to compare. Business account fees differ a lot, so shopping around saves money.",
      },
    },
  ],
  "business-finance/lesson-cipc-registration": [
    {
      type: "mcq",
      question: "What is the CIPC's role for a small business?",
      options: [
        "It collects VAT",
        "It registers companies and maintains the official company records in SA",
        "It lends money",
        "It sets interest rates",
      ],
      correct: 1,
      feedback: {
        correct: "Right. The CIPC registers companies and keeps the official register. Tax is a separate SARS matter.",
        incorrect: "The CIPC registers companies and holds the official records. SARS handles tax, the SARB handles rates.",
      },
    },
    {
      type: "true-false",
      statement: "A registered company is a separate legal entity, which can limit the owner's personal liability compared with a sole proprietor.",
      correct: true,
      feedback: {
        correct: "Correct. A company is legally separate, so owners generally are not personally liable for its debts, unlike a sole prop.",
        incorrect: "It is separate in law. That separation can shield the owner's personal assets, unlike a sole proprietor.",
      },
    },
  ],
  "business-finance/lesson-business-insurance": [
    {
      type: "mcq",
      question: "Which risk should a small business most consider insuring?",
      options: [
        "Small everyday breakages around the office",
        "Events that could sink it, like fire, theft or liability",
        "Nothing, claims rarely pay out for small firms",
        "Only the vehicles used by senior staff",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Insure the big, business-ending risks first, the ones you could not absorb out of cash flow.",
        incorrect: "Focus on the risks that could end the business, like fire, theft, liability or losing key equipment.",
      },
    },
    {
      type: "true-false",
      statement: "Insuring against small, affordable losses often costs more in premiums than it saves, so cover the big risks first.",
      correct: true,
      feedback: {
        correct: "Correct. Self-insure the small stuff you can absorb, and buy cover for the losses that would be fatal.",
        incorrect: "Cover the big risks first. Insuring minor, affordable losses often costs more than it is worth.",
      },
    },
  ],
  "business-finance/lesson-growth-financing": [
    {
      type: "mcq",
      question: "What is the difference between debt and equity financing for growth?",
      options: [
        "They are identical",
        "Debt is borrowed money you repay with interest, equity is selling a share of the business for cash",
        "Equity must always be repaid with interest",
        "Debt gives away ownership",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Debt keeps ownership but must be repaid. Equity brings cash but gives away a slice of the business.",
        incorrect: "Debt is repaid with interest and keeps ownership. Equity trades a share of the business for cash.",
      },
    },
    {
      type: "true-false",
      statement: "Taking on debt to grow only makes sense if the growth is likely to earn more than the loan costs.",
      correct: true,
      feedback: {
        correct: "Correct. Borrow to grow only when the expected return comfortably beats the interest and risk.",
        incorrect: "That is the test. Debt for growth works only if the return outweighs the loan's cost.",
      },
    },
  ],
  "business-finance/lesson-applied-cashflow-profit": [
    {
      type: "scenario",
      question: "Your business shows a R40 000 profit this month but the account is nearly empty. What is the likely cause?",
      options: [
        "The profit is fake",
        "Cash is tied up in unpaid invoices or stock, so profit on paper has not turned into cash yet",
        "The bank stole it",
        "Profit always means empty accounts",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Profit sits in debtors and stock. Until customers pay, that profit is not yet cash you can use.",
        incorrect: "The profit is likely locked in unpaid invoices and stock. It becomes cash only once customers pay.",
      },
    },
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // ADVANCED TAX PLANNING
  // ═══════════════════════════════════════════════════════════════════════════
  "advanced-tax/cgt-fundamentals": [
    {
      type: "fill-blank",
      title: "Annual exclusion",
      prompt: "Individuals get an annual capital gains exclusion of R___ before CGT applies.",
      correct: 40000,
      feedback: {
        correct: "Yes. The first R40 000 of net capital gain each year is excluded for individuals.",
        incorrect: "The annual exclusion for individuals is R40 000 of net gain.",
      },
    },
    {
      type: "mcq",
      question: "For an individual on the top marginal rate, the effective CGT rate is roughly what, given the 40% inclusion rate?",
      options: [
        "45%",
        "About 18%",
        "0%",
        "40%",
      ],
      correct: 1,
      feedback: {
        correct: "Right. 40% inclusion times a 45% marginal rate is about 18%, well below the rate on ordinary income.",
        incorrect: "It is about 18%. Only 40% of the gain is included, then taxed at up to 45%, giving roughly 18%.",
      },
    },
  ],
  "advanced-tax/dividend-vs-salary": [
    {
      type: "mcq",
      question: "At what rate is dividends tax generally withheld in SA?",
      options: [
        "45%",
        "20%",
        "0%",
        "27%",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Dividends tax is withheld at 20%, separate from the company's own tax on profits.",
        incorrect: "Dividends tax is 20%, withheld before the dividend reaches you.",
      },
    },
    {
      type: "true-false",
      statement: "A salary is deductible for the company but taxed at your marginal rate, while a dividend is not deductible for the company but is taxed at a flat 20% in your hands. Both routes have a real cost.",
      correct: true,
      feedback: {
        correct: "Correct. That is why owner pay is a planning decision, weighing corporate tax, dividends tax and your marginal rate.",
        incorrect: "Both cost tax. Salary is deductible but taxed at your marginal rate, dividends face 20% after corporate tax.",
      },
    },
  ],
  "advanced-tax/trust-tax-vehicle": [
    {
      type: "mcq",
      question: "Income retained in a discretionary trust is taxed at what flat rate, with no rebates?",
      options: [
        "18%",
        "45%",
        "27%",
        "0%",
      ],
      correct: 1,
      feedback: {
        correct: "Right. A trust that retains income is taxed at a flat 45%, which is why the conduit principle matters.",
        incorrect: "Retained trust income is taxed at a flat 45%, the highest rate, with no rebates.",
      },
    },
    {
      type: "true-false",
      statement: "Under the conduit principle, income a trust distributes to beneficiaries can be taxed in their hands, often at lower rates than the trust itself.",
      correct: true,
      feedback: {
        correct: "Correct. Flowing income to beneficiaries in the same year can shift it to their lower marginal rates.",
        incorrect: "It can. The conduit principle lets distributed income be taxed in the beneficiary's hands instead of at 45%.",
      },
    },
  ],
  "advanced-tax/foreign-income-tax": [
    {
      type: "mcq",
      question: "How is a South African tax resident taxed on income earned abroad?",
      options: [
        "Only in the country where it was earned",
        "On worldwide income, with credits to limit double tax",
        "At a special flat rate of 5% on transfer",
        "Only on amounts brought back into SA",
      ],
      correct: 1,
      feedback: {
        correct: "Right. SA taxes residents on worldwide income, with relief via credits and treaty rules to avoid double tax.",
        incorrect: "Residents are taxed on worldwide income. Foreign tax credits and exemptions then limit double taxation.",
      },
    },
    {
      type: "fill-blank",
      title: "Foreign employment exemption",
      prompt: "The foreign employment income exemption covers the first R1.25 million, which is R___ (enter the number).",
      correct: 1250000,
      feedback: {
        correct: "Yes. Qualifying foreign employment income up to R1 250 000 can be exempt if the day tests are met.",
        incorrect: "It is R1 250 000, provided you meet the days-outside-SA requirements.",
      },
    },
    {
      type: "true-false",
      statement: "A double taxation agreement (DTA) between SA and another country can let you claim a credit for foreign tax paid, so you are not taxed twice on the same income.",
      correct: true,
      feedback: {
        correct: "Correct. DTAs and section 6quat credits relieve double taxation on the same income.",
        incorrect: "They can. A DTA and foreign tax credits stop the same income being fully taxed in both countries.",
      },
    },
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // ESTATE PLANNING
  // ═══════════════════════════════════════════════════════════════════════════
  "estate-planning/dying-intestate-disaster": [
    {
      type: "mcq",
      question: "If you die without a valid will in SA, who decides how your estate is divided?",
      options: [
        "Your closest friend",
        "The Intestate Succession Act, according to a fixed legal formula, not your wishes",
        "Your bank",
        "Nobody, it stays frozen forever",
      ],
      correct: 1,
      feedback: {
        correct: "Right. The Intestate Succession Act applies a set formula, which may not match what you would have chosen.",
        incorrect: "The Intestate Succession Act decides, by a fixed formula. Your personal wishes carry no weight without a will.",
      },
    },
    {
      type: "true-false",
      statement: "Dying without a will usually means longer delays, the Master appointing an executor, and possibly assets going to relatives you would not have chosen.",
      correct: true,
      feedback: {
        correct: "Correct. Intestacy adds delay and cost and removes your control over who inherits.",
        incorrect: "It does. No will means delays, a court-appointed executor and a distribution you did not choose.",
      },
    },
    {
      type: "scenario",
      question: "A long-term unmarried partner dies without a will. What is the risk for the surviving partner?",
      options: [
        "They automatically inherit everything",
        "Under intestate rules they may inherit little or nothing, since the law prioritises spouses and blood relatives",
        "They inherit half by default",
        "The estate is split with the government",
      ],
      correct: 1,
      feedback: {
        correct: "Right. An unmarried partner can be left out, which is exactly why a will matters for unmarried couples.",
        incorrect: "They may get little or nothing. Intestate rules favour spouses and blood relatives, so a will is essential.",
      },
    },
  ],
  "estate-planning/estate-duty-deep": [
    {
      type: "fill-blank",
      title: "The abatement",
      prompt: "Estate duty applies above the section 4A abatement of R3.5 million, which is R___ (enter the number).",
      correct: 3500000,
      feedback: {
        correct: "Yes. The first R3 500 000 of a dutiable estate is exempt via the section 4A abatement.",
        incorrect: "The abatement is R3 500 000. Estate duty applies to the dutiable value above that.",
      },
    },
    {
      type: "mcq",
      question: "Estate duty in SA is charged at what rates?",
      options: [
        "A flat 45%, the same as the top income tax rate",
        "20% up to R30 million, and 25% above R30 million",
        "0%, because estates are exempt from tax in SA",
        "27%, aligned with the company income tax rate",
      ],
      correct: 1,
      feedback: {
        correct: "Right. 20% applies up to R30 million dutiable value, rising to 25% above that.",
        incorrect: "It is 20% up to R30 million and 25% above. Not a flat rate.",
      },
    },
    {
      type: "true-false",
      statement: "Assets left to a surviving spouse are taxed at the full estate duty rate immediately.",
      correct: false,
      feedback: {
        correct: "Right. Spousal bequests are deducted before duty, no estate duty applies to them.",
        incorrect: "Spousal bequests are exempt. They are deducted from the dutiable estate first.",
      },
    },
  ],
  "estate-planning/beneficiary-strategy": [
    {
      type: "mcq",
      question: "Why can a nominated beneficiary on a life insurance policy be powerful in estate planning?",
      options: [
        "It removes the payout from taxable income",
        "The payout goes straight to them, bypassing estate delays",
        "It converts the policy into a living trust",
        "It doubles the cover at no extra premium",
      ],
      correct: 1,
      feedback: {
        correct: "Right. A direct payout reaches the beneficiary faster and outside the winding-up of the estate.",
        incorrect: "A nominated beneficiary receives the payout directly, usually avoiding the delays of the estate.",
      },
    },
    {
      type: "true-false",
      statement: "Retirement fund death benefits are distributed under section 37C by the fund trustees, who must consider dependants, so your nomination is a guide but not absolute.",
      correct: true,
      feedback: {
        correct: "Correct. Trustees must provide for dependants under section 37C, so a nomination guides but does not bind them.",
        incorrect: "It is a guide. Under section 37C trustees must consider dependants, so the nomination is not absolute.",
      },
    },
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // ADVANCED INVESTING
  // ═══════════════════════════════════════════════════════════════════════════
  "advanced-investing/modern-portfolio-theory": [
    {
      type: "mcq",
      question: "What is the core insight of Modern Portfolio Theory?",
      options: [
        "Concentrate capital in the single best asset",
        "Mixing assets that do not move together lowers overall risk",
        "Market risk cannot be reduced by diversification",
        "Cash outperforms shares over the long term",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Imperfect correlation between assets reduces overall volatility without necessarily cutting return.",
        incorrect: "MPT shows that mixing less-correlated assets lowers portfolio risk for a given expected return.",
      },
    },
    {
      type: "mcq",
      question: "When do two assets give the greatest diversification benefit?",
      options: [
        "When their returns are perfectly correlated",
        "When their returns have low or negative correlation",
        "When they are identical",
        "Correlation does not matter",
      ],
      correct: 1,
      feedback: {
        correct: "Right. The lower the correlation, the more one asset can cushion the other, smoothing the ride.",
        incorrect: "Low or negative correlation gives the most benefit. Perfectly correlated assets diversify nothing.",
      },
    },
    {
      type: "true-false",
      statement: "The 'efficient frontier' represents the portfolios offering the highest expected return for each level of risk.",
      correct: true,
      feedback: {
        correct: "Correct. Portfolios on the frontier are efficient. Anything below it takes more risk for less return.",
        incorrect: "That is the definition. The efficient frontier is the best return available at each risk level.",
      },
    },
  ],
  "advanced-investing/factor-investing-sa": [
    {
      type: "mcq",
      question: "Which of these is a commonly researched investment 'factor'?",
      options: [
        "The CEO's star sign",
        "Value, size, momentum or quality",
        "The company's logo colour",
        "The weather",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Value, size, momentum and quality are well-studied factors linked to long-run return premiums.",
        incorrect: "Factors like value, size, momentum and quality are the evidence-based drivers factor investing targets.",
      },
    },
    {
      type: "true-false",
      statement: "Factor premiums are not guaranteed and can underperform the broad market for years at a time, testing an investor's patience.",
      correct: true,
      feedback: {
        correct: "Correct. Factors work over long periods but endure long dry spells, so discipline is essential.",
        incorrect: "They can lag for years. Factor premiums are long-run tendencies, not steady annual outperformance.",
      },
    },
    {
      type: "mcq",
      question: "How does factor (or 'smart beta') investing differ from traditional active management?",
      options: [
        "It relies on a manager's hunches",
        "It follows transparent, rules-based criteria to target factors, usually at lower cost than active funds",
        "It avoids the market entirely",
        "It is the same thing",
      ],
      correct: 1,
      feedback: {
        correct: "Right. It is systematic and rules-based, aiming to capture factor premiums cheaply and consistently.",
        incorrect: "Factor investing is rules-based and transparent, targeting factors at lower cost than discretionary active funds.",
      },
    },
  ],
  "advanced-investing/offshore-allocation-sa": [
    {
      type: "mcq",
      question: "Regulation 28 currently allows retirement funds to hold up to what share offshore?",
      options: [
        "10%",
        "45%",
        "100%",
        "0%",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Since 2022, retirement funds may hold up to 45% offshore under Regulation 28.",
        incorrect: "The limit is 45% offshore for retirement funds under Regulation 28.",
      },
    },
    {
      type: "true-false",
      statement: "Discretionary (non-retirement) investments are not bound by Regulation 28, so you can hold more offshore in them.",
      correct: true,
      feedback: {
        correct: "Correct. Regulation 28 applies to retirement funds, not to your discretionary investments.",
        incorrect: "They are not bound by it. Regulation 28 limits retirement funds, not discretionary money.",
      },
    },
    {
      type: "scenario",
      question: "An investor holds almost everything in SA assets. What risk are they carrying?",
      options: [
        "None, because local assets dodge currency risk",
        "Home bias, concentrated in one small economy and currency",
        "Over-diversification across too many funds",
        "Excessive exposure to offshore tax rules",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Home bias ties your wealth to one small market and the rand, raising avoidable risk.",
        incorrect: "That is home bias. Concentrating in one small economy and currency skips valuable global diversification.",
      },
    },
  ],
  "advanced-investing/sequence-of-returns": [
    {
      type: "mcq",
      question: "What is sequence-of-returns risk?",
      options: [
        "The risk that returns are always positive",
        "The risk that poor returns early in retirement, while you are withdrawing, permanently damage your pot",
        "A tax on returns",
        "A risk only during your working years",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Early losses combined with withdrawals leave less capital to recover, even if average returns look fine.",
        incorrect: "It is the danger of bad early-retirement returns while drawing down, which the portfolio may never recover from.",
      },
    },
    {
      type: "true-false",
      statement: "Two retirees with the same average return can end very differently if one hits a market crash in their first few retirement years.",
      correct: true,
      feedback: {
        correct: "Correct. Order matters when you withdraw. Early crashes plus drawdowns do lasting damage.",
        incorrect: "Order matters in drawdown. The same average return can fail if the bad years come first.",
      },
    },
    {
      type: "mcq",
      question: "Which strategy helps manage sequence risk in early retirement?",
      options: [
        "Withdraw more early while markets are strong",
        "Hold a cash buffer so you avoid selling shares low",
        "Move fully into equities for maximum growth",
        "Keep withdrawals fixed regardless of markets",
      ],
      correct: 1,
      feedback: {
        correct: "Right. A buffer lets you avoid selling growth assets in a slump, and a modest early drawdown protects the pot.",
        incorrect: "A cash or bond buffer plus modest early withdrawals stops you selling shares low during downturns.",
      },
    },
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // BUSINESS FINANCE: ADVANCED
  // ═══════════════════════════════════════════════════════════════════════════
  "business-finance-advanced/company-structures-sa": [
    {
      type: "mcq",
      question: "What is a key advantage of a private company (Pty Ltd) over a sole proprietorship?",
      options: [
        "It pays no income tax until profits are withdrawn",
        "Limited liability protecting the owner's personal assets",
        "It is exempt from keeping accounting records",
        "It automatically qualifies for government tenders",
      ],
      correct: 1,
      feedback: {
        correct: "Right. A company is a separate legal person, so owners are generally shielded from its debts.",
        incorrect: "The main edge is limited liability. A company is separate in law, protecting the owner's personal assets.",
      },
    },
    {
      type: "mcq",
      question: "How is a sole proprietor's business income taxed?",
      options: [
        "At the flat 27% company income tax rate",
        "At the owner's personal marginal income tax rates",
        "Only once annual profit exceeds R1 million",
        "At a reduced flat rate of 15% for small firms",
      ],
      correct: 1,
      feedback: {
        correct: "Right. A sole prop is not a separate taxpayer, so profit is taxed in the owner's hands at marginal rates.",
        incorrect: "It is taxed at the owner's personal marginal rates. A sole prop is not a separate legal or tax entity.",
      },
    },
    {
      type: "true-false",
      statement: "A company pays corporate income tax at 27%, and profits distributed as dividends then face 20% dividends tax, a two-layer cost to weigh.",
      correct: true,
      feedback: {
        correct: "Correct. Corporate tax at 27% plus 20% dividends tax is the classic double layer owners must plan around.",
        incorrect: "Both layers apply. A company pays 27%, then dividends face 20%, which structuring must account for.",
      },
    },
  ],
  "business-finance-advanced/reading-financial-statements": [
    {
      type: "mcq",
      question: "What do the three core financial statements show?",
      options: [
        "Different views of the same bank balance",
        "Profit, what you own and owe, and cash movements",
        "The same profit figure in three formats",
        "What the business must pay SARS each year",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Together they show profitability, financial position and actual cash flow, which differ from each other.",
        incorrect: "Income statement is profit, balance sheet is position, cash flow is cash movement. Each tells a different story.",
      },
    },
    {
      type: "true-false",
      statement: "On a healthy balance sheet, total assets should be much larger than liabilities plus owner's equity.",
      correct: false,
      feedback: {
        correct: "Right. The balance sheet always BALANCES: assets equal liabilities plus equity, by definition.",
        incorrect: "Assets = liabilities + equity, always. That equality is what 'balance' means here.",
      },
    },
    {
      type: "mcq",
      question: "Why can a company report a profit yet have very little cash?",
      options: [
        "Profit always equals cash after adjustments",
        "Profit can sit in unpaid invoices, stock or equipment",
        "It signals the profit figure is fraudulent",
        "It means the auditors overstated revenue",
      ],
      correct: 1,
      feedback: {
        correct: "Right. This is why you read the cash flow statement alongside profit. They can diverge sharply.",
        incorrect: "Profit can sit in debtors, stock or assets. Cash flow, not profit, tells you the real liquidity.",
      },
    },
  ],
  "business-finance-advanced/business-valuation": [
    {
      type: "mcq",
      question: "Which is a common method for valuing a small business?",
      options: [
        "Guessing from the owner's mood",
        "Applying an earnings multiple, a discounted cash flow, or an asset-based valuation",
        "The number of staff only",
        "The age of the building",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Multiples, discounted cash flow and asset-based approaches are the standard valuation methods.",
        incorrect: "Earnings multiples, discounted cash flow and asset-based methods are the usual tools, not gut feel.",
      },
    },
    {
      type: "fill-blank",
      title: "A simple multiple",
      prompt: "A business earns R500 000 profit a year and sells on a 4 times earnings multiple. That values it at R___.",
      correct: 2000000,
      feedback: {
        correct: "Yes. R500 000 times 4 is R2 000 000 under a simple earnings multiple.",
        incorrect: "Multiply earnings by the multiple: R500 000 x 4 = R2 000 000.",
      },
    },
    {
      type: "true-false",
      statement: "Valuation is partly subjective, since it rests on assumptions about future growth, risk and the multiple used.",
      correct: true,
      feedback: {
        correct: "Correct. Different, reasonable assumptions produce different values, which is why buyers and sellers negotiate.",
        incorrect: "It is partly subjective. The assumptions behind a valuation drive the number, so values differ.",
      },
    },
  ],
  "business-finance-advanced/business-funding": [
    {
      type: "mcq",
      question: "What is a trade-off of raising equity funding rather than debt?",
      options: [
        "There is no trade-off",
        "You avoid repayments and interest, but you give up a share of ownership, future profits and some control",
        "Equity must be repaid with interest",
        "Equity is always cheaper",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Equity brings cash without repayments, but the investor now shares your profits and decisions.",
        incorrect: "Equity means no repayments, but you sell a share of ownership, future profit and some control.",
      },
    },
    {
      type: "true-false",
      statement: "South African small businesses can access government-backed funding through bodies like SEFA, alongside bank debt and private equity.",
      correct: true,
      feedback: {
        correct: "Correct. Development finance from bodies like SEFA sits alongside bank loans and equity as a funding option.",
        incorrect: "They can. Government-backed funders such as SEFA are a real option beyond banks and private investors.",
      },
    },
    {
      type: "mcq",
      question: "When does debt funding make more sense than equity for a growing business?",
      options: [
        "When you never want to repay",
        "When the business has reliable cash flow to service repayments and the owner wants to keep full ownership",
        "When you want to give away control",
        "When the business is losing money",
      ],
      correct: 1,
      feedback: {
        correct: "Right. Steady cash flow makes repayments manageable, and debt keeps ownership fully in your hands.",
        incorrect: "Debt suits firms with reliable cash flow that want to keep ownership, not loss-makers giving up control.",
      },
    },
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // RE5 EXAM PREP (FAIS regulatory exam, higher difficulty)
  // ═══════════════════════════════════════════════════════════════════════════
  "re5-exam-prep/re5-l1-purpose": [
    {
      type: "mcq",
      question: "What is the primary purpose of the FAIS Act?",
      options: [
        "To guarantee investment returns for clients",
        "To regulate the rendering of financial advice and intermediary services, and protect clients",
        "To set interest rates",
        "To collect taxes on financial products",
      ],
      correct: 1,
      feedback: {
        correct: "Correct. FAIS regulates how advice and intermediary services are rendered and protects consumers of financial products.",
        incorrect: "FAIS regulates conduct in advice and intermediary services and protects clients. It never guarantees returns.",
      },
    },
    {
      type: "mcq",
      question: "Which body is the regulator responsible for market conduct under FAIS?",
      options: [
        "The SARB (South African Reserve Bank)",
        "The FSCA (Financial Sector Conduct Authority)",
        "SARS (South African Revenue Service)",
        "The JSE (Johannesburg Stock Exchange)",
      ],
      correct: 1,
      feedback: {
        correct: "Correct. The FSCA, formerly the FSB, is the market conduct regulator that administers FAIS.",
        incorrect: "It is the FSCA (previously the FSB). The SARB handles prudential and monetary matters, not FAIS conduct.",
      },
    },
    {
      type: "true-false",
      statement: "FAIS focuses on the conduct of financial services providers, not on guaranteeing the performance of financial products.",
      correct: true,
      feedback: {
        correct: "Correct. FAIS is a market-conduct law. It governs how services are rendered, not product returns.",
        incorrect: "It governs conduct, not performance. FAIS cannot and does not guarantee how a product performs.",
      },
    },
  ],
  "re5-exam-prep/re5-l1-definitions": [
    {
      type: "mcq",
      question: "Under FAIS, what distinguishes 'advice' from 'intermediary service'?",
      options: [
        "They are interchangeable terms used in the FAIS General Code",
        "Advice recommends a product, intermediary service acts between client and supplier",
        "Advice must be in writing, intermediary services are verbal",
        "An intermediary service is limited to tax and estate advice",
      ],
      correct: 1,
      feedback: {
        correct: "Correct. Advice is a recommendation or guidance, an intermediary service is transacting or acting between client and supplier.",
        incorrect: "Advice is a recommendation on a product. An intermediary service is acting between client and supplier, which may involve no recommendation.",
      },
    },
    {
      type: "true-false",
      statement: "A 'financial product' under FAIS includes things like long-term insurance, shares, collective investment schemes and retirement products.",
      correct: true,
      feedback: {
        correct: "Correct. FAIS defines financial products broadly, covering insurance, securities, collective investments and retirement products.",
        incorrect: "It is broad. Financial products under FAIS include insurance, shares, collective investments and retirement products.",
      },
    },
  ],
  "re5-exam-prep/re5-l2-categories": [
    {
      type: "mcq",
      question: "A financial services provider that manages client investments on a discretionary basis falls under which category?",
      options: [
        "Category I",
        "Category II (discretionary FSP)",
        "Category III (administrative FSP)",
        "Category IV (assistance business)",
      ],
      correct: 1,
      feedback: {
        correct: "Correct. Category II is the discretionary FSP, which makes investment decisions on the client's behalf within a mandate.",
        incorrect: "Discretionary management is Category II. Category I renders advice and intermediary services without discretion.",
      },
    },
    {
      type: "mcq",
      question: "Before an FSP may operate, what must it hold?",
      options: [
        "A tax clearance only",
        "A licence issued by the FSCA authorising it for specific categories and products",
        "A bank account only",
        "Nothing, registration is voluntary",
      ],
      correct: 1,
      feedback: {
        correct: "Correct. An FSP must be licensed by the FSCA, and the licence specifies the categories and products it may deal in.",
        incorrect: "An FSCA licence is required, specifying authorised categories and products. Operating without it is an offence.",
      },
    },
    {
      type: "true-false",
      statement: "An FSP may only render financial services in respect of the categories and product subcategories for which it is licensed.",
      correct: true,
      feedback: {
        correct: "Correct. The licence defines the scope. Acting outside your authorised categories or products breaches FAIS.",
        incorrect: "The licence sets the boundaries. An FSP cannot render services outside its authorised categories and products.",
      },
    },
  ],
  "re5-exam-prep/re5-l2-suspend-withdraw": [
    {
      type: "mcq",
      question: "On what basis may the FSCA suspend or withdraw an FSP's licence?",
      options: [
        "Only when the FSP itself requests withdrawal",
        "If it no longer meets fit and proper requirements",
        "If the FSP's profits exceed the sector norm",
        "Never, a licence lapses only on liquidation",
      ],
      correct: 1,
      feedback: {
        correct: "Correct. Failure to remain fit and proper or material non-compliance can lead to suspension or withdrawal.",
        incorrect: "The FSCA can act where the FSP is no longer fit and proper or materially breaches FAIS. Licences are not permanent.",
      },
    },
    {
      type: "true-false",
      statement: "The FSCA must generally follow a fair procedure, such as giving the FSP an opportunity to respond, before withdrawing a licence.",
      correct: true,
      feedback: {
        correct: "Correct. Administrative fairness applies. The FSP is usually given notice and a chance to make representations.",
        incorrect: "Fair procedure applies. The FSCA generally gives the FSP notice and an opportunity to respond first.",
      },
    },
    {
      type: "mcq",
      question: "What can happen to a licence on a provisional basis while an investigation is underway?",
      options: [
        "It is automatically cancelled",
        "It may be suspended, with conditions, pending the outcome",
        "It is upgraded",
        "Nothing can be done until a court rules",
      ],
      correct: 1,
      feedback: {
        correct: "Correct. A licence can be suspended, often with conditions, while matters are investigated.",
        incorrect: "A suspension, sometimes with conditions, can apply pending the outcome, short of full withdrawal.",
      },
    },
    {
      type: "true-false",
      statement: "If a licence is withdrawn or suspended, the FSCA may take steps to protect clients, such as managing how existing business is handled.",
      correct: true,
      feedback: {
        correct: "Correct. Client protection is central, so the FSCA can impose conditions to safeguard existing clients.",
        incorrect: "It can. Protecting clients is key, so conditions may govern how existing business is wound down or managed.",
      },
    },
  ],
  "re5-exam-prep/re5-l3-roles": [
    {
      type: "mcq",
      question: "What is a 'key individual' in an FSP?",
      options: [
        "The FSP's largest and longest-standing client",
        "A person approved to manage or oversee the FSP's services",
        "Any employee who deals directly with clients",
        "The FSP's appointed external compliance auditor",
      ],
      correct: 1,
      feedback: {
        correct: "Correct. A key individual manages or oversees the rendering of financial services and must be approved as fit and proper.",
        incorrect: "A key individual manages or oversees the FSP's financial services. It is a role approved by the FSCA, not just any staff member.",
      },
    },
    {
      type: "mcq",
      question: "What is a 'representative' under FAIS?",
      options: [
        "A client's family member",
        "A person who renders financial services to clients for or on behalf of an FSP",
        "The FSCA inspector",
        "A product supplier",
      ],
      correct: 1,
      feedback: {
        correct: "Correct. A representative renders financial services for or on behalf of the FSP and must be fit and proper.",
        incorrect: "A representative renders services for or on behalf of the FSP. They must meet fit and proper requirements.",
      },
    },
    {
      type: "true-false",
      statement: "An FSP must maintain an up-to-date register of its representatives and key individuals.",
      correct: true,
      feedback: {
        correct: "Correct. The FSP must keep a current register of reps and KIs, and update the FSCA's records accordingly.",
        incorrect: "It must. Keeping an accurate register of representatives and key individuals is a FAIS requirement.",
      },
    },
  ],
  "re5-exam-prep/re5-l3-debarment": [
    {
      type: "mcq",
      question: "When must an FSP debar a representative?",
      options: [
        "When the rep resigns to join another FSP",
        "When they no longer meet fit and proper requirements",
        "When the rep's commission exceeds the cap",
        "Only after three separate client complaints",
      ],
      correct: 1,
      feedback: {
        correct: "Correct. Debarment follows where a rep is no longer fit and proper or has materially breached FAIS.",
        incorrect: "Debarment applies where the rep is no longer fit and proper or materially contravened FAIS, not for ordinary reasons.",
      },
    },
    {
      type: "true-false",
      statement: "An FSP must follow a fair process before debarring a representative, including giving the rep notice and an opportunity to respond.",
      correct: true,
      feedback: {
        correct: "Correct. Debarment must be procedurally fair, with notice and a chance for the representative to make representations.",
        incorrect: "Fair process is required. The rep must be given notice and an opportunity to respond before debarment.",
      },
    },
    {
      type: "true-false",
      statement: "A debarment is recorded so that other FSPs can see it, which stops a debarred person simply moving to another firm unnoticed.",
      correct: true,
      feedback: {
        correct: "Correct. Debarments are recorded centrally, so the industry can see them and protect clients.",
        incorrect: "They are recorded. A central record means a debarred person cannot quietly reappear at another FSP.",
      },
    },
  ],
  "re5-exam-prep/re5-l4-pillars": [
    {
      type: "mcq",
      question: "Which of the following is a fit and proper pillar under FAIS?",
      options: [
        "Guaranteed sales targets",
        "Honesty, integrity and good standing",
        "Personal wealth of the client",
        "Membership of a political party",
      ],
      correct: 1,
      feedback: {
        correct: "Correct. Honesty, integrity and good standing is a core fit and proper pillar, alongside competence and the others.",
        incorrect: "Honesty, integrity and good standing is a pillar. Sales targets and personal affiliations are not fit and proper requirements.",
      },
    },
    {
      type: "true-false",
      statement: "Fit and proper requirements must be met continuously, not only at the point of appointment.",
      correct: true,
      feedback: {
        correct: "Correct. The standards are ongoing. A person who stops meeting them, for example through dishonesty, must be dealt with.",
        incorrect: "They are ongoing. Fit and proper must be maintained throughout, not just satisfied once at appointment.",
      },
    },
    {
      type: "mcq",
      question: "'Financial soundness' as a fit and proper pillar mainly concerns what?",
      options: [
        "The client's ability to afford the product",
        "The FSP's own solvency and ability to meet obligations",
        "The returns the FSP earns for its clients",
        "The FSP's staff headcount and branch network",
      ],
      correct: 1,
      feedback: {
        correct: "Correct. Financial soundness concerns the FSP's solvency and ability to meet obligations, where the requirement applies.",
        incorrect: "It is about the FSP's solvency and ability to meet its obligations, not the client's finances or rates.",
      },
    },
    {
      type: "true-false",
      statement: "Competence as a pillar includes qualifications, regulatory examinations, experience and product-specific training.",
      correct: true,
      feedback: {
        correct: "Correct. Competence bundles qualifications, the regulatory exams, experience and class-of-business and product training.",
        incorrect: "It does. Competence covers qualifications, regulatory exams, experience and product-specific training together.",
      },
    },
  ],
  "re5-exam-prep/re5-l4-competence-cpd": [
    {
      type: "mcq",
      question: "From which date is a representative's competence timeline (for qualifications and exams) generally measured?",
      options: [
        "Their birthday",
        "The Date of First Appointment (DOFA)",
        "The end of the tax year",
        "The date they pass matric",
      ],
      correct: 1,
      feedback: {
        correct: "Correct. Competence deadlines, such as qualifications and the RE, run from the Date of First Appointment (DOFA).",
        incorrect: "It runs from the Date of First Appointment (DOFA), which sets the clock for qualifications and the regulatory exam.",
      },
    },
    {
      type: "true-false",
      statement: "Until a new representative has met the competence requirements, they must work under supervision.",
      correct: true,
      feedback: {
        correct: "Correct. Supervision applies until qualifications, the exam and product training are completed.",
        incorrect: "They work under supervision until competent. That covers the period before qualifications and exams are done.",
      },
    },
    {
      type: "true-false",
      statement: "Product-specific training does not count towards continuous professional development (CPD) hours.",
      correct: true,
      feedback: {
        correct: "Correct. CPD and product-specific training are separate. Product training does not count as CPD.",
        incorrect: "They are separate. Product-specific training is required, but it does not count towards CPD hours.",
      },
    },
  ],
  "re5-exam-prep/re5-l5-general-duty": [
    {
      type: "mcq",
      question: "The General Code of Conduct requires an FSP to render services in what manner?",
      options: [
        "As quickly and cheaply as possible only",
        "Honestly, fairly, with due skill, care and diligence, and in the interests of clients and the integrity of the industry",
        "Only in the FSP's own interest",
        "However the client demands, even if harmful",
      ],
      correct: 1,
      feedback: {
        correct: "Correct. The overarching duty is honesty, fairness, due skill, care and diligence, in clients' interests and industry integrity.",
        incorrect: "The duty is to act honestly, fairly and with due skill, care and diligence, in the client's interests and the industry's integrity.",
      },
    },
    {
      type: "true-false",
      statement: "The duty to act in the client's interest applies even when it conflicts with the FSP earning a larger commission.",
      correct: true,
      feedback: {
        correct: "Correct. The client's interests come first, and conflicts such as commission must be managed and disclosed.",
        incorrect: "The client comes first. A bigger commission does not override the duty to act in the client's interest.",
      },
    },
    {
      type: "mcq",
      question: "Which behaviour would breach the general duty of care?",
      options: [
        "Doing a proper needs analysis",
        "Recommending an unsuitable product to earn higher commission",
        "Disclosing all fees",
        "Keeping proper records",
      ],
      correct: 1,
      feedback: {
        correct: "Correct. Putting commission ahead of suitability breaches the duty to act with care in the client's interest.",
        incorrect: "Recommending an unsuitable product for commission breaches the duty. The other options are exactly what the Code requires.",
      },
    },
    {
      type: "true-false",
      statement: "Acting with due skill, care and diligence includes only recommending products the representative actually understands.",
      correct: true,
      feedback: {
        correct: "Correct. You cannot exercise due care advising on a product you do not understand, so product knowledge is essential.",
        incorrect: "It does. Due skill and care means you must understand a product before recommending it.",
      },
    },
  ],
  "re5-exam-prep/re5-l5-three-disclosures": [
    {
      type: "mcq",
      question: "Disclosure about the provider typically includes what?",
      options: [
        "The client's medical history",
        "The FSP's name, contact details, licence categories and how to complain",
        "The weather forecast",
        "Other clients' portfolios",
      ],
      correct: 1,
      feedback: {
        correct: "Correct. Provider disclosure covers the FSP's identity, contact details, licence status and complaints process.",
        incorrect: "Provider disclosure is about the FSP itself: name, contacts, licence categories and complaints procedure.",
      },
    },
    {
      type: "mcq",
      question: "Product disclosure must make clear which of the following to the client?",
      options: [
        "Nothing about costs",
        "The nature of the product, its material terms, fees, charges and any material risks",
        "Only the salesperson's name",
        "The FSP's profits",
      ],
      correct: 1,
      feedback: {
        correct: "Correct. Clients must understand the product's nature, terms, costs and risks before deciding.",
        incorrect: "Product disclosure covers the nature, terms, fees, charges and risks, so the client can make an informed choice.",
      },
    },
    {
      type: "true-false",
      statement: "Any actual or potential conflict of interest, such as commission or a relationship with the product supplier, must be disclosed to the client.",
      correct: true,
      feedback: {
        correct: "Correct. Conflicts, including commission and supplier relationships, must be disclosed so the client can weigh the advice.",
        incorrect: "They must be disclosed. Commission and supplier ties are conflicts the client is entitled to know about.",
      },
    },
  ],
  "re5-exam-prep/re5-l6-suitability": [
    {
      type: "mcq",
      question: "Before giving advice, an FSP must gather information about the client in order to do what?",
      options: [
        "Sell the highest-commission product",
        "Conduct a needs analysis and ensure the recommendation is suitable for the client's circumstances",
        "Avoid any paperwork",
        "Report the client to SARS",
      ],
      correct: 1,
      feedback: {
        correct: "Correct. A needs analysis based on the client's situation underpins suitable advice.",
        incorrect: "You gather information to do a needs analysis and ensure suitability, not to maximise commission.",
      },
    },
    {
      type: "true-false",
      statement: "A Record of Advice should set out the basis on which the recommendation was made.",
      correct: true,
      feedback: {
        correct: "Correct. The Record of Advice documents the recommendation and the reasons behind it.",
        incorrect: "It should. The Record of Advice captures what was recommended and why, based on the client's needs.",
      },
    },
    {
      type: "mcq",
      question: "If a client declines to provide information needed for a proper analysis, what must the FSP do?",
      options: [
        "Proceed as if full information was given",
        "Alert the client that this limits the advice and that suitability cannot be fully assessed",
        "Refuse to ever speak to them",
        "Guess the missing details",
      ],
      correct: 1,
      feedback: {
        correct: "Correct. The FSP must warn the client that incomplete information limits the advice and the suitability assessment.",
        incorrect: "You must flag that limited information restricts the advice and that suitability cannot be fully assessed.",
      },
    },
  ],
  "re5-exam-prep/re5-l6-records-coi": [
    {
      type: "fill-blank",
      title: "Record retention",
      prompt: "The General Code generally requires records to be kept for a period of ___ years.",
      correct: 5,
      feedback: {
        correct: "Correct. Records must generally be retained for five years.",
        incorrect: "The general retention period is five years.",
      },
    },
    {
      type: "mcq",
      question: "An FSP must have which document to manage conflicts of interest?",
      options: [
        "A marketing brochure",
        "A conflict of interest management policy",
        "A staff social calendar",
        "A price list only",
      ],
      correct: 1,
      feedback: {
        correct: "Correct. FSPs must adopt and maintain a conflict of interest management policy.",
        incorrect: "A conflict of interest management policy is required. It sets out how conflicts are identified, avoided or mitigated.",
      },
    },
    {
      type: "true-false",
      statement: "FSP advertising may exaggerate benefits as long as a disclaimer appears in the fine print.",
      correct: false,
      feedback: {
        correct: "Right. Adverts must be factually correct and not misleading, fine print cannot cure a false claim.",
        incorrect: "No. Advertising must be accurate and not misleading. Disclaimers do not license exaggeration.",
      },
    },
  ],
  "re5-exam-prep/re5-l7-tcf-complaints": [
    {
      type: "mcq",
      question: "Treating Customers Fairly (TCF) is best described as what?",
      options: [
        "A tax on advisers",
        "An outcomes-based approach requiring fair treatment of customers throughout the product life cycle",
        "A once-off form",
        "A marketing slogan with no obligations",
      ],
      correct: 1,
      feedback: {
        correct: "Correct. TCF is outcomes-based, requiring fair treatment from product design through to after-sales and claims.",
        incorrect: "TCF is an outcomes-based framework for fair customer treatment across the whole product life cycle, not a slogan.",
      },
    },
    {
      type: "true-false",
      statement: "TCF expects fair treatment to be embedded in a firm's culture, not just documented in a policy.",
      correct: true,
      feedback: {
        correct: "Correct. TCF is about real outcomes and culture, so fairness must be lived, not just written down.",
        incorrect: "It runs deeper than paperwork. TCF expects fairness to be part of how the firm actually behaves.",
      },
    },
    {
      type: "mcq",
      question: "What must an FSP have in place for client complaints?",
      options: [
        "Nothing, complaints are ignored",
        "A documented internal complaints resolution process that is accessible to clients",
        "A rule that clients cannot complain",
        "Only a phone that is never answered",
      ],
      correct: 1,
      feedback: {
        correct: "Correct. FSPs must maintain an accessible, documented internal complaints resolution procedure.",
        incorrect: "An FSP must have a documented, accessible internal complaints process. Ignoring complaints breaches FAIS.",
      },
    },
    {
      type: "true-false",
      statement: "If an internal complaint is not resolved to the client's satisfaction, the client may escalate to the FAIS Ombud.",
      correct: true,
      feedback: {
        correct: "Correct. Where the FSP cannot resolve it, the client can take the complaint to the FAIS Ombud.",
        incorrect: "They can escalate. An unresolved complaint can go to the FAIS Ombud after the internal process.",
      },
    },
  ],
  "re5-exam-prep/re5-l7-ombud": [
    {
      type: "mcq",
      question: "What is the role of the FAIS Ombud?",
      options: [
        "To approve licences for new FSPs each year",
        "To resolve client complaints against FSPs informally",
        "To set maximum fees FSPs may charge clients",
        "To audit FSP financial statements annually",
      ],
      correct: 1,
      feedback: {
        correct: "Correct. The FAIS Ombud resolves client complaints against FSPs in a procedurally fair, informal and economical way.",
        incorrect: "The Ombud resolves complaints against FSPs. Licensing is the FSCA's role, not the Ombud's.",
      },
    },
    {
      type: "true-false",
      statement: "A client should usually first complain to the FSP and give it a chance to resolve the matter before approaching the FAIS Ombud.",
      correct: true,
      feedback: {
        correct: "Correct. The internal process comes first. The Ombud generally expects the FSP to have had a chance to resolve it.",
        incorrect: "The FSP gets first chance. Clients normally complain internally before escalating to the Ombud.",
      },
    },
  ],
  "re5-exam-prep/re5-l8-fica": [
    {
      type: "mcq",
      question: "What is a core obligation on accountable institutions under FICA?",
      options: [
        "To guarantee returns",
        "To verify and know their clients (customer due diligence) and keep records",
        "To avoid all record-keeping",
        "To set exchange rates",
      ],
      correct: 1,
      feedback: {
        correct: "Correct. FICA requires customer due diligence, knowing and verifying clients, and keeping the related records.",
        incorrect: "FICA centres on knowing and verifying clients and keeping records, part of combating money laundering.",
      },
    },
    {
      type: "true-false",
      statement: "Under FICA, suspicious and unusual transactions must be reported to the Financial Intelligence Centre (FIC).",
      correct: true,
      feedback: {
        correct: "Correct. Accountable institutions must report suspicious and unusual transactions to the FIC.",
        incorrect: "They must be reported. FICA requires suspicious and unusual transactions to be reported to the FIC.",
      },
    },
  ],
  "re5-exam-prep/re5-quiz-framework": [
    {
      type: "mcq",
      question: "Which statement about the FAIS framework is correct?",
      options: [
        "The FSCA guarantees product performance",
        "The FSCA licenses FSPs and regulates conduct, while the FAIS Ombud resolves client complaints",
        "The FAIS Ombud licenses FSPs",
        "Representatives need no oversight",
      ],
      correct: 1,
      feedback: {
        correct: "Correct. The FSCA licenses and regulates conduct, and the FAIS Ombud handles complaints. The two roles are distinct.",
        incorrect: "The FSCA licenses and regulates conduct, the Ombud resolves complaints. Neither guarantees product performance.",
      },
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Append reinforcement questions to each matching lesson. Runs after the merge
// so the extra questions land at the end of the final lesson step list.
// ─────────────────────────────────────────────────────────────────────────────
export function applyReinforcement(courses: Course[]): Course[] {
  return courses.map((course) => ({
        ...course,
        units: course.units.map((unit) => ({
              ...unit,
              lessons: unit.lessons.map((lesson) => {
                  const extra = REINFORCEMENT[`${course.id}/${lesson.id}`];
                  if (!extra || !lesson.steps) return lesson;
                  return { ...lesson, steps: [...lesson.steps, ...extra] };
                }),
            })),
      }));
}

// Small guard used by tests: how many answerable questions a step list holds.
export function countQuestions(steps: LessonStep[] | undefined): number {
  return (steps ?? []).filter((s) => Q_TYPES.has(s.type)).length;
}

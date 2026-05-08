// ═══════════════════════════════════════════════════════════════════════════════
// FUNDI FINANCE — DEEP CONTENT BATCH
// Topics: Repo Rate | Behavioral Finance | Bonds | Credit Score | Portfolio Construction
//
// HOW TO MERGE:
//   rand-economy      course  → push REPO_RATE_LESSONS      into unit-1 lessons array
//   money-psychology  course  → push BEHAVIORAL_FINANCE_LESSONS into unit-1 lessons array
//   investing-basics  course  → push BONDS_DEEP_LESSONS     into relevant unit
//   credit-debt       course  → push CREDIT_SCORE_DEEP_LESSONS into unit-1 lessons array
//   sa-investing      course  → push PORTFOLIO_CONSTRUCTION_LESSONS into relevant unit
// ═══════════════════════════════════════════════════════════════════════════════

import type { Lesson, LessonStep } from "./content";

// ─────────────────────────────────────────────────────────────────────────────
// 1. REPO RATE
// Target: rand-economy → unit-1 (The Rand Explained)
// ─────────────────────────────────────────────────────────────────────────────

export const REPO_RATE_LESSONS: Lesson[] = [
  {
    id: "lesson-repo-rate-explained",
    title: "What Is the Repo Rate?",
    steps: [
      {
        type: "info",
        title: "The SARB's Most Powerful Tool",
        content:
          "<p>The <strong>repo rate</strong> (repurchase rate) is the interest rate at which the South African Reserve Bank (SARB) lends money overnight to commercial banks. It is the most powerful lever the SARB uses to manage inflation in SA.</p><p>The repo rate sets the floor for all interest rates in the economy. Every mortgage, car loan, credit card, and savings account in South Africa is ultimately priced relative to it.</p><p><strong>2024 context:</strong> The repo rate was 8.25% for most of 2024. The SARB cut it to 8.0% in September 2024 and again to 7.75% in November 2024, the first cuts since 2020, when COVID drove rates to historic lows of 3.5%.</p>",
      },
      {
        type: "info",
        title: "Repo Rate → Prime Rate → Your Rate",
        content:
          "<p>The transmission works in three steps:</p><ol><li><strong>Repo rate:</strong> Set by the SARB Monetary Policy Committee (MPC). Currently 7.75% (end 2024).</li><li><strong>Prime lending rate:</strong> Commercial banks add 3.5 percentage points. Prime = repo + 3.5%. At repo 7.75%, prime = <strong>11.25%</strong>.</li><li><strong>Your rate:</strong> Banks lend to you at prime minus or plus a spread based on your risk profile. A good home loan might be prime – 0.5% = 10.75%. A risky personal loan could be prime + 8% = 19.25%.</li></ol><p>When the MPC raises or cuts the repo rate, prime moves by exactly the same amount, and every variable-rate debt or deposit in the country is repriced immediately.</p>",
      },
      {
        type: "mcq",
        question:
          "The SARB cuts the repo rate by 0.25%. Your home loan is at prime – 0.5%. What happens to your interest rate?",
        options: [
          "It stays the same, repo cuts don't affect home loans",
          "It drops by 0.25%, prime falls, so your rate falls by the same amount",
          "It drops by 0.5%, the bank passes on double",
          "It rises, lower rates mean more risk for banks",
        ],
        correct: 1,
        feedback: {
          correct:
            "Correct. A 0.25% repo cut → 0.25% prime cut → your variable rate drops by 0.25%. On a R1m bond, that's roughly R140/month saved.",
          incorrect:
            "Variable-rate debt moves in lockstep with prime, which moves in lockstep with repo. A 0.25% repo cut = 0.25% rate drop on your variable bond.",
        },
      },
      {
        type: "info",
        title: "How the MPC Decides. The Inflation Target",
        content:
          "<p>The MPC meets <strong>six times a year</strong> and has one primary mandate: keep CPI inflation within a <strong>3–6% target band</strong>.</p><p><strong>When inflation rises above 6%:</strong> The MPC raises the repo rate. Higher rates make borrowing expensive, reduce consumer spending, and cool inflation. Side effect: growth slows, unemployment may rise.</p><p><strong>When inflation falls or growth weakens:</strong> The MPC cuts the repo rate. Cheaper borrowing stimulates spending, investment, and economic growth. Side effect: if cut too aggressively, inflation can reignite.</p><p>The MPC must balance inflation control against economic growth, it's always a trade-off. SA's 2022–2024 rate hike cycle (from 3.5% to 8.25% over 18 months) was the most aggressive in 15 years, triggered by post-COVID supply shocks and global rate hikes.</p>",
      },
      {
        type: "true-false",
        statement:
          "When the SARB raises the repo rate, your savings account interest rate typically increases.",
        correct: true,
        feedback: {
          correct:
            "Correct. Higher repo → higher prime → banks compete for deposits at higher rates. Money market funds, 32-day notice accounts, and fixed deposits all offer better returns when rates rise.",
          incorrect:
            "True, rising repo rate increases both lending rates AND deposit rates. The 2022–2024 rate hike cycle raised SA money market fund rates from ~3.5% to ~8.5%, making cash deposits significantly more attractive.",
        },
      },
      {
        type: "scenario",
        question:
          "You have a R1 200 000 home loan at prime – 0.5%. Prime is currently 11.25%. The MPC raises the repo rate by 0.5% at its next meeting. How does your monthly repayment change (20-year term)?",
        options: [
          "Drops by approximately R340/month",
          "Stays the same, home loans are fixed rate",
          "Rises by approximately R340/month",
          "Rises by approximately R700/month",
        ],
        correct: 2,
        feedback: {
          correct:
            "A 0.5% rate increase on a R1.2m bond ≈ R340/month extra. Over 12 months that's R4 080: a significant impact on a household budget. This is why rate hike cycles are painful for over-leveraged homeowners.",
          incorrect:
            "Most SA home loans are variable rate (linked to prime). A 0.5% increase on R1.2m over 20 years adds roughly R340/month. Always stress-test your bond affordability against rate increases when buying.",
        },
      },
      {
        type: "info",
        title: "Repo Rate and the Rand",
        content:
          "<p>The repo rate also affects the rand's exchange rate. Higher SA rates attract foreign capital seeking better yields, this increases demand for rand, strengthening the currency.</p><p>Lower rates relative to global peers make SA less attractive for foreign investment, weakening the rand. This is why the SARB sometimes holds rates higher than necessary purely for domestic inflation, to prevent rand weakness from importing inflation through fuel and food prices.</p><p><strong>Practical implication:</strong> A rate cut cycle is often positive for SA borrowers but can weaken the rand, which raises petrol and imported goods prices, partially offsetting the benefit of lower debt costs.</p>",
      },
      {
        type: "action",
        title: "Repo Rate Reality Check",
        instruction:
          "Find your most expensive variable-rate debt (home loan, car, or personal loan). Calculate what a 1% increase in the interest rate would cost you per month. Write down that number. This is your 'rate risk', know it before interest rates change.",
        tip: "Use the formula: additional monthly cost ≈ (loan balance × 0.01) ÷ 12. For a R500 000 balance: R500 000 × 0.01 ÷ 12 = R417/month per 1% rate rise.",
      },
    ] satisfies LessonStep[],
  },

  {
    id: "lesson-mpc-and-inflation",
    title: "Inflation, Interest Rates and Your Money",
    steps: [
      {
        type: "info",
        title: "The Inflation-Rate Connection",
        content:
          "<p>Inflation and interest rates are locked in a perpetual tug-of-war. Understanding this relationship explains almost everything about why your grocery bill, petrol price, and bond repayment change over time.</p><p><strong>CPI (Consumer Price Index):</strong> SA's measure of inflation, tracking a basket of goods and services. When CPI is above 6%, the SARB is under pressure to raise rates. When CPI is below 4.5%, the SARB has room to cut.</p><p>In 2022, SA CPI peaked at 7.8%, above the target ceiling. The MPC responded with 475 basis points of rate hikes over 18 months. By mid-2024, CPI had fallen to 5.4%, enabling the first cuts in four years.</p>",
      },
      {
        type: "mcq",
        question:
          "SA CPI inflation prints at 7.2%, above the 6% upper target. Which MPC action is most likely at the next meeting?",
        options: [
          "Cut the repo rate to stimulate growth",
          "Keep rates unchanged and issue a warning statement",
          "Raise the repo rate to tighten financial conditions and cool demand",
          "Ask National Treasury to lower VAT temporarily",
        ],
        correct: 2,
        feedback: {
          correct:
            "Above-target inflation is the primary trigger for rate hikes. The SARB will tighten to reduce consumer spending, lower demand, and bring prices back within the 3–6% band.",
          incorrect:
            "Above-target CPI = rate hike territory. The SARB's mandate is explicit: keep inflation in the 3–6% band. Readings above 6% trigger tightening, not cuts.",
        },
      },
      {
        type: "info",
        title: "Real vs Nominal Interest Rates",
        content:
          "<p>The <strong>real interest rate</strong> = nominal rate – inflation rate. This is what your money actually earns after inflation erodes purchasing power.</p><p><strong>Example:</strong> Your savings account pays 9%. Inflation is 5.5%. Your real return is 3.5%, that's how much your wealth is actually growing in purchasing-power terms.</p><p><strong>Negative real rates:</strong> If inflation exceeds your savings rate, your purchasing power shrinks even while your rand balance grows. In 2020–2021, SA real rates were near zero or negative, cash was quietly losing value.</p><p>For long-term wealth building, you need assets that consistently beat inflation over time. That's the core argument for investing in equities rather than keeping all savings in cash.</p>",
      },
      {
        type: "fill-blank",
        title: "Real Return Calculation",
        prompt:
          "Your fixed deposit earns 10.5% per year. CPI inflation is 4.8%. Your real return is ___% (subtract inflation from nominal rate).",
        correct: 5.7,
        explanation:
          "10.5% – 4.8% = 5.7% real return. This means your purchasing power grows by 5.7% in real terms, a solid return for a low-risk fixed deposit.",
        feedback: {
          correct:
            "10.5% – 4.8% = 5.7% real return. When evaluating any investment, always calculate the real return. A 10% return in a 9% inflation environment is barely keeping pace.",
          incorrect:
            "Real return = nominal rate – inflation rate = 10.5% – 4.8% = 5.7%. Always adjust for inflation when comparing investment returns.",
        },
      },
      {
        type: "true-false",
        statement:
          "Keeping all your savings in a savings account is a 'safe' strategy that protects your wealth over 20 years.",
        correct: false,
        feedback: {
          correct:
            "Correct. If savings rates lag inflation over long periods, cash savings lose purchasing power. Over 20 years at 2% real return vs 6% in equities, the gap in final wealth is enormous. 'Safe' cash is silently losing value.",
          incorrect:
            "Cash is only 'safe' from volatility. Inflation risk is real, if your savings account earns less than inflation, your purchasing power shrinks. Over 20 years, inflation risk destroys more wealth than market volatility for most savers.",
        },
      },
    ] satisfies LessonStep[],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// 2. BEHAVIORAL FINANCE (DEEPER)
// Target: money-psychology → unit-1 (Behavioral Biases)
// ─────────────────────────────────────────────────────────────────────────────

export const BEHAVIORAL_FINANCE_LESSONS: Lesson[] = [
  {
    id: "lesson-loss-aversion",
    title: "Loss Aversion: Why Losing Hurts Twice as Much",
    steps: [
      {
        type: "info",
        title: "The Psychology of Loss",
        content:
          "<p><strong>Loss aversion</strong> is one of the most powerful forces in behavioral finance. Psychologists Kahneman and Tversky found that the emotional pain of losing R100 is approximately <strong>twice as strong</strong> as the pleasure of gaining R100.</p><p>This asymmetry causes rational people to make irrational financial decisions:</p><ul><li>Holding onto losing investments too long, hoping to 'break even' before selling</li><li>Selling winning investments too early to 'lock in' gains before they disappear</li><li>Avoiding volatile assets entirely, even when long-term returns would be superior</li><li>Not rebalancing a portfolio because it means realising losses</li></ul>",
      },
      {
        type: "mcq",
        question:
          "You bought shares in a SA company for R10 000. They are now worth R6 000. What does loss aversion predict you will do?",
        options: [
          "Sell immediately and reinvest in a better opportunity",
          "Hold onto the shares hoping to get back to R10 000 before selling",
          "Add more money to average down your cost",
          "Move to a diversified index fund",
        ],
        correct: 1,
        feedback: {
          correct:
            "Loss aversion causes investors to hold onto losers longer than rational analysis supports. The question should be: would I buy these shares today at R6 000? If not, the rational action is to sell and redeploy.",
          incorrect:
            "Loss aversion drives the 'break-even trap', holding a losing investment until it returns to your purchase price. But the purchase price is irrelevant to the investment decision today. Only the current value and future potential matter.",
        },
      },
      {
        type: "info",
        title: "The Break-Even Trap in SA Markets",
        content:
          "<p>During the Steinhoff collapse (2017), thousands of individual SA investors watched shares fall from R95 to R2 over two months. Many held, hoping for a recovery to break even. By 2024, shares traded at under R1.</p><p>The break-even trap is expensive because:</p><ul><li>Capital locked in a loser can't earn returns in better investments</li><li>The original purchase price is a <strong>sunk cost</strong>, irrelevant to the decision today</li><li>Ask instead: 'If I received this cash today, would I buy these shares at the current price?' If no, sell.</li></ul><p>This reframe (the <strong>'sell or hold' test</strong>) removes the anchor of your purchase price from the decision.</p>",
      },
      {
        type: "true-false",
        statement:
          "Waiting to sell a loss-making investment until it recovers to your purchase price is a rational strategy.",
        correct: false,
        feedback: {
          correct:
            "Correct. The purchase price is a sunk cost, psychologically real but financially irrelevant. While you wait, the capital is tied up earning nothing (or losing further). The rational question: would I buy this today at the current price?",
          incorrect:
            "The 'break-even' strategy is driven by loss aversion, not logic. Your purchase price is a sunk cost. Rational investing asks: what will this investment do from here? Not: how do I get back to where I started?",
        },
      },
      {
        type: "scenario",
        question:
          "Naledi holds R50 000 of shares in a SA retailer, purchased at R100 each. They now trade at R40. She expects 8% annual growth from here. She also has an opportunity in a diversified ETF expected to return 11%/year. She should:",
        options: [
          "Hold the retailer shares until she breaks even at R100",
          "Sell the retailer shares and invest in the ETF, the purchase price is irrelevant to the decision today",
          "Hold the retailer shares, selling now would confirm her loss",
          "Split the decision 50/50 to hedge",
        ],
        correct: 1,
        feedback: {
          correct:
            "The purchase price is irrelevant. From today, the ETF offers 11% vs 8% on the retailer. The rational choice is the ETF. Naledi's hesitation is pure loss aversion, emotionally real but financially costly.",
          incorrect:
            "The R100 purchase price is a sunk cost. From today's R40 base, the only relevant question is: which investment will perform better from here? If the ETF at 11% > retailer at 8%, sell and reinvest.",
        },
      },
    ] satisfies LessonStep[],
  },

  {
    id: "lesson-mental-accounting",
    title: "Mental Accounting: Why R1 000 Isn't Always R1 000",
    steps: [
      {
        type: "info",
        title: "Money Doesn't Know Where It Came From",
        content:
          "<p><strong>Mental accounting</strong> is the tendency to treat money differently based on its origin or designated purpose, even though money is fungible (one rand is identical to any other rand).</p><p><strong>Common examples:</strong></p><ul><li>Spending a bonus more freely than regular salary ('it's extra money')</li><li>Paying interest on a credit card while having savings sitting in a low-interest account ('that money is for emergencies')</li><li>Treating gambling winnings as 'free money' to be spent recklessly</li><li>Being stingy with cash but free with a credit card ('it doesn't feel like real money')</li></ul><p>Mental accounting is why people simultaneously carry expensive debt and maintain large low-interest savings, a mathematically suboptimal combination.</p>",
      },
      {
        type: "mcq",
        question:
          "Sipho has R20 000 in a savings account earning 4% and R15 000 on a credit card at 22%. He refuses to use savings to pay the card 'because the savings are for emergencies.' What is the annual cost of this mental accounting error?",
        options: [
          "Nothing, keeping savings separate is prudent",
          "Approximately R2 700/year in avoidable interest",
          "The savings account offsets the credit card interest",
          "R800/year, only the net balance matters",
        ],
        correct: 1,
        feedback: {
          correct:
            "R15 000 at 22% = R3 300/year in interest. If he used R15 000 of savings to clear the card, he loses R600/year in savings interest but saves R3 300: a net gain of R2 700/year. Mental accounting costs him this amount.",
          incorrect:
            "Credit card interest (22%) massively exceeds savings account return (4%). Paying off the card with savings earns a guaranteed 18% return on R15 000. Always clear high-interest debt before keeping low-interest savings.",
        },
      },
      {
        type: "info",
        title: "The 'Bonus Money' Trap",
        content:
          "<p>Psychological research consistently shows people spend windfall income (bonuses, tax refunds, inheritances) more freely than regular income, even when they have outstanding debt or savings goals.</p><p>A December bonus of R15 000 that gets spent on a TV and holiday in two weeks is not 'extra money'. It's income that could have:</p><ul><li>Paid off a credit card at 22%</li><li>Been invested in an ETF compounding at 10%+ over 20 years</li><li>Funded three months of emergency savings</li></ul><p><strong>Fix:</strong> Before receiving a bonus, decide in advance what percentage goes to debt repayment, savings, and spending. The commitment before the money arrives prevents the mental accounting trap from activating.</p>",
      },
      {
        type: "action",
        title: "The Fungibility Test",
        instruction:
          "List any money you are holding in a savings account or money market fund at less than 10% interest, while simultaneously carrying debt at more than 10% interest. This gap is your mental accounting cost. Calculate the annual cost: (debt balance × debt rate) – (savings balance × savings rate). This is what mental accounting is costing you per year.",
        tip: "Most people discover they're paying thousands of rands per year in avoidable interest by keeping low-rate savings instead of paying down high-rate debt. The only valid exception is an emergency fund of 3 months' expenses.",
      },
    ] satisfies LessonStep[],
  },

  {
    id: "lesson-overconfidence-recency",
    title: "Overconfidence and Recency Bias",
    steps: [
      {
        type: "info",
        title: "Two Biases That Destroy Investment Returns",
        content:
          "<p><strong>Overconfidence bias:</strong> Most people rate their driving, investing, and decision-making abilities as 'above average', which is statistically impossible for the majority. In investing, overconfidence causes excessive trading, under-diversification, and taking on more risk than your actual skill warrants.</p><p>Academic research consistently shows that <strong>individual investors who trade most actively achieve the worst net returns</strong>, because transaction costs and the pattern of buying high/selling low compound over time. The least active investors (who do nothing) typically outperform active traders.</p><p><strong>Recency bias:</strong> The brain weights recent events heavily and assumes current trends will continue. After 3 years of strong JSE returns, investors expect strong returns. After a crash, they expect further falls. Both extrapolations are wrong more often than right.</p>",
      },
      {
        type: "mcq",
        question:
          "After the JSE All Share Index has risen 40% over two years, most retail investors become more willing to invest in SA equities. This behaviour reflects:",
        options: [
          "Rational updating on positive SA fundamentals",
          "Recency bias, extrapolating recent performance forward",
          "Value investing, identifying underpriced assets",
          "Momentum investing based on technical analysis",
        ],
        correct: 1,
        feedback: {
          correct:
            "Recency bias causes investors to pile in after strong performance, often near market peaks. The behaviorally correct approach is to invest consistently regardless of recent performance, not to chase returns.",
          incorrect:
            "Recency bias makes recent events feel predictive of the future. After strong markets, investors feel optimistic and invest more, often close to peaks. After crashes, they feel pessimistic and sell, often near troughs. Both are costly.",
        },
      },
      {
        type: "info",
        title: "The Dalbar Study: How Much Bias Costs You",
        content:
          "<p>DALBAR's annual Quantitative Analysis of Investor Behaviour consistently shows that the <strong>average investor earns significantly less than the market index</strong>, not because markets fail but because of behavioural mistakes:</p><ul><li>Buying after strong performance (recency bias)</li><li>Selling during crashes (loss aversion)</li><li>Switching funds frequently (overconfidence and transaction costs)</li></ul><p>Over 20 years, the average US equity investor has earned roughly <strong>4–5% annually while the S&P 500 returned 9–10%</strong>. The gap, 4–5% per year compounded over 20 years, represents enormous missed wealth.</p><p><strong>SA equivalent:</strong> The JSE Capped SWIX has returned approximately 12–14% annually over the last 20 years. Most active SA unit trust investors have significantly underperformed this.</p>",
      },
      {
        type: "true-false",
        statement:
          "An investor who automatically invests a fixed amount every month regardless of market conditions will typically outperform an investor who times the market.",
        correct: true,
        feedback: {
          correct:
            "Correct. This strategy, called rand-cost averaging, removes behavioural bias from the equation. You buy more units when prices are low, fewer when high, and never let emotion override the system. Long-term it outperforms most market-timing attempts.",
          incorrect:
            "Rand-cost averaging (fixed monthly investing regardless of conditions) is proven to outperform emotional market timing for most investors. Consistency beats cleverness over long periods.",
        },
      },
      {
        type: "scenario",
        question:
          "In March 2020, the JSE fell 35% in six weeks. Zanele, who had been investing R2 000/month in a Satrix ALSI ETF, stopped her debit order because 'the market might fall further.' Her friend Themba kept his R2 000/month debit order running. By end 2021, the JSE had fully recovered. Who made more money?",
        options: [
          "Zanele, she avoided further losses",
          "Themba, he bought cheaply during the crash and benefited from the full recovery",
          "They earned the same, the market recovered to the same point",
          "Zanele, cash was safer than investing in a crash",
        ],
        correct: 1,
        feedback: {
          correct:
            "Themba bought units at 30–35% discounts during the crash. When the market recovered, his lower-cost units generated higher returns. Zanele's recency bias cost her the best buying opportunity of the decade.",
          incorrect:
            "Themba's consistent investing during the crash bought units at historic discounts. His average cost per unit was lower than Zanele's. When the market recovered, his returns were significantly higher. Crashes are buying opportunities for systematic investors.",
        },
      },
    ] satisfies LessonStep[],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// 3. BONDS — DEEP DIVE
// Target: investing-basics → relevant unit, or sa-investing
// ─────────────────────────────────────────────────────────────────────────────

export const BONDS_DEEP_LESSONS: Lesson[] = [
  {
    id: "lesson-bonds-mechanics",
    title: "How Bonds Actually Work",
    steps: [
      {
        type: "info",
        title: "A Bond Is a Loan You Give",
        content:
          "<p>A <strong>bond</strong> is a debt instrument. When you buy a bond, you are lending money to the issuer (a government or company) in exchange for:</p><ol><li>Regular <strong>interest payments</strong> (called the coupon) at a fixed rate</li><li>Return of your <strong>principal</strong> (the amount you lent) at <strong>maturity</strong> (the end date)</li></ol><p><strong>Example:</strong> You buy a R10 000 RSA Retail Bond with a 10% coupon and 5-year maturity. You receive R1 000/year in interest. After 5 years, you get your R10 000 back.</p><p>Bond issuers: SA Government (RSA Retail Bonds, Treasury bonds), SOEs (Eskom bonds), municipalities, and listed companies (corporate bonds).</p>",
      },
      {
        type: "mcq",
        question:
          "You hold a R50 000 RSA 3-Year Retail Bond at 9.75% per annum. What is your annual income from this investment?",
        options: ["R4 875", "R9 750", "R487.50", "R3 250"],
        correct: 0,
        feedback: {
          correct:
            "R50 000 × 9.75% = R4 875/year (or approximately R406/month). After 3 years you also get your R50 000 principal back. RSA Retail Bonds are one of the safest investments in SA, backed by the sovereign.",
          incorrect:
            "R50 000 × 9.75% = R4 875/year. The coupon is calculated on the face value (R50 000), not anything else. RSA Retail Bonds pay interest annually or semi-annually depending on the product.",
        },
      },
      {
        type: "info",
        title: "Government Bonds vs Corporate Bonds vs RSA Retail Bonds",
        content:
          "<p><strong>RSA Retail Bonds</strong> (retailbonds.co.za): Designed for individual investors. Minimum R1 000. Fixed 2, 3, or 5-year terms. No market price fluctuation, you hold to maturity. Interest is paid to your bank account. Tax: interest is fully taxable income. Safest rand-denominated investment: sovereign guarantee.</p><p><strong>Treasury/Government Bonds</strong>: Wholesale instruments traded on the JSE. Minimum trade sizes make them impractical for most individuals. Accessible via bond ETFs or unit trusts.</p><p><strong>Corporate Bonds</strong>: Issued by companies (Naspers, Shoprite, Sasol, banks). Higher yield than government bonds to compensate for credit risk. If the company defaults, bondholders have a claim ahead of shareholders.</p>",
      },
      {
        type: "true-false",
        statement:
          "RSA Retail Bonds are more risky than a South African bank fixed deposit.",
        correct: false,
        feedback: {
          correct:
            "Correct. RSA Retail Bonds are backed by the South African sovereign, the full creditworthiness of the national government. A bank fixed deposit is backed by the bank's balance sheet plus the SARB implicit backstop. For most practical purposes, RSA Retail Bonds are the safest rand investment available.",
          incorrect:
            "RSA Retail Bonds are backed by sovereign guarantee, the SA government cannot default without a systemic collapse affecting all SA financial institutions. They are effectively the safest rand-denominated investment, slightly safer than a bank deposit.",
        },
      },
      {
        type: "info",
        title: "The Bond-Equity Trade-Off",
        content:
          "<p>Bonds and shares (equities) have different roles in a portfolio:</p><table style='width:100%;border-collapse:collapse;font-size:14px;'><tr style='background:#f5f5f5;'><td style='padding:8px;border:1px solid #e5e7eb;'></td><td style='padding:8px;border:1px solid #e5e7eb;'><strong>Bonds</strong></td><td style='padding:8px;border:1px solid #e5e7eb;'><strong>Equities</strong></td></tr><tr><td style='padding:8px;border:1px solid #e5e7eb;'>Return</td><td style='padding:8px;border:1px solid #e5e7eb;'>Lower (8–11% in SA)</td><td style='padding:8px;border:1px solid #e5e7eb;'>Higher (12–16% long-term)</td></tr><tr><td style='padding:8px;border:1px solid #e5e7eb;'>Risk</td><td style='padding:8px;border:1px solid #e5e7eb;'>Lower volatility</td><td style='padding:8px;border:1px solid #e5e7eb;'>High short-term volatility</td></tr><tr><td style='padding:8px;border:1px solid #e5e7eb;'>Best for</td><td style='padding:8px;border:1px solid #e5e7eb;'>Stability, income, capital preservation</td><td style='padding:8px;border:1px solid #e5e7eb;'>Long-term growth</td></tr><tr><td style='padding:8px;border:1px solid #e5e7eb;'>SA example</td><td style='padding:8px;border:1px solid #e5e7eb;'>Satrix Bond ETF, RSA Retail Bond</td><td style='padding:8px;border:1px solid #e5e7eb;'>Satrix ALSI ETF, Satrix S&P 500</td></tr></table><p>Bonds don't aim to beat equities, they aim to smooth the ride and provide income during periods when equities are falling.</p>",
      },
    ] satisfies LessonStep[],
  },

  {
    id: "lesson-bond-interest-rate-risk",
    title: "Bond Prices and Interest Rate Risk",
    steps: [
      {
        type: "info",
        title: "The Bond Price Paradox",
        content:
          "<p>Here is one of the most misunderstood concepts in investing: <strong>when interest rates rise, existing bond prices fall. When rates fall, bond prices rise.</strong></p><p><strong>Why this happens:</strong> Imagine you own a R10 000 bond paying 8% (R800/year). Interest rates then rise to 10%. New bonds now pay R1 000/year on the same R10 000. Your 8% bond is less attractive, who would pay R10 000 for it when they can get R1 000/year from a new bond? Your bond's market price must drop until its yield matches the new market rate.</p><p>This matters for bond ETFs and unit trusts, they hold bonds that are marked to market. During SA's 2022–2024 rate hike cycle, bond funds lost value even though the underlying coupons were still being paid.</p>",
      },
      {
        type: "mcq",
        question:
          "The SARB cuts the repo rate unexpectedly by 0.75%. What typically happens to the price of existing government bonds?",
        options: [
          "They fall, lower rates mean less income",
          "They rise, existing higher-rate bonds become more valuable",
          "They stay the same, only new bonds are affected",
          "They become illiquid and can't be traded",
        ],
        correct: 1,
        feedback: {
          correct:
            "When rates fall, existing bonds paying higher coupons become more valuable, investors bid up their price. Bond ETFs and bond funds gain capital value during rate cut cycles.",
          incorrect:
            "Rate cuts = bond price appreciation. Your existing 10% bond becomes more valuable when new bonds only offer 9.25%. Bond investors benefit from rate cut cycles through capital gains on top of coupon income.",
        },
      },
      {
        type: "info",
        title: "Duration: Your Sensitivity Measure",
        content:
          "<p><strong>Duration</strong> measures how sensitive a bond's price is to interest rate changes. A bond with a duration of 5 years will change in price by approximately 5% for every 1% change in interest rates.</p><p>Long-duration bonds (10–20 years) are more sensitive to rate changes. Short-duration bonds (1–3 years) are less sensitive.</p><p><strong>SA context:</strong></p><ul><li>RSA Retail Bonds: no duration risk, you hold to maturity and the price is locked. Perfect for risk-averse investors.</li><li>Bond ETFs (Satrix Bond ETF, NewFunds GOVI ETF): hold a mix of government bonds. Have duration risk but also capital gain potential when rates fall.</li></ul><p>For a buy-and-hold investor, duration risk is mainly psychological. For investors who need to sell before maturity, it's a real risk.</p>",
      },
      {
        type: "true-false",
        statement:
          "An investor who holds an RSA Retail Bond to its maturity date is not exposed to interest rate risk.",
        correct: true,
        feedback: {
          correct:
            "Correct. RSA Retail Bonds are held to maturity. You receive your coupon payments and principal back regardless of what happens to interest rates. No mark-to-market. This is why RSA Retail Bonds are ideal for conservative investors or those approaching retirement.",
          incorrect:
            "This is true. RSA Retail Bonds are not traded on the secondary market. You buy, earn coupons, and receive your principal at maturity. The rate paid at purchase is locked in, rising rates elsewhere don't affect you.",
        },
      },
      {
        type: "scenario",
        question:
          "Thembi has R100 000 she needs in exactly 3 years (for a house deposit). She is considering a Satrix Bond ETF (current yield 9.5%, but price fluctuates with rates) vs an RSA 3-Year Retail Bond (9.2%, locked). Which is more appropriate for her need?",
        options: [
          "The Satrix Bond ETF, higher yield means more money at the end",
          "The RSA 3-Year Retail Bond, she needs certainty of the full amount in 3 years",
          "Split 50/50 to balance yield and certainty",
          "Neither, she should keep it in a savings account",
        ],
        correct: 1,
        feedback: {
          correct:
            "With a specific 3-year need and no tolerance for uncertainty, the RSA Retail Bond is correct. The ETF could be worth less than R100 000 in 3 years if rates rise. The 0.3% yield difference is irrelevant compared to the certainty of having R100 000 available at the exact date she needs it.",
          incorrect:
            "When you have a fixed future need and timeline, capital certainty beats yield optimization. The RSA Retail Bond guarantees her R100 000 back in 3 years. The ETF doesn't, its price could be lower if rates rise.",
        },
      },
    ] satisfies LessonStep[],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// 4. CREDIT SCORE — DEEPER DIVE
// Target: credit-debt → unit-1 (Understanding Credit)
// ─────────────────────────────────────────────────────────────────────────────

export const CREDIT_SCORE_DEEP_LESSONS: Lesson[] = [
  {
    id: "lesson-credit-score-mechanics",
    title: "How Your Credit Score Is Calculated",
    steps: [
      {
        type: "info",
        title: "The Five Pillars of Your Credit Score",
        content:
          "<p>Your credit score (300–850 in SA) is calculated from five weighted factors. Understanding each gives you a blueprint to build or rebuild your score:</p><ul><li><strong>Payment History (~35%):</strong> The single biggest factor. Every on-time payment improves it. Every missed or late payment damages it, and stays on record for up to 7 years.</li><li><strong>Credit Utilisation (~30%):</strong> How much of your available credit you use. Using R9 000 of a R10 000 credit card limit = 90% utilisation. This signals financial stress to lenders. Keep utilisation below 30%, ideally below 10%.</li><li><strong>Length of Credit History (~15%):</strong> Older accounts improve your score. Don't close your oldest credit card even if unused, length of history matters.</li><li><strong>Credit Mix (~10%):</strong> Having different types of credit (home loan, credit card, store card) shows you can manage complexity. But don't open accounts just for mix.</li><li><strong>New Applications (~10%):</strong> Each credit application triggers a 'hard inquiry' which slightly drops your score. Multiple applications in a short period signals desperation.</li></ul>",
      },
      {
        type: "mcq",
        question:
          "You have a R20 000 credit card limit and currently owe R16 000. What is your credit utilisation rate and how does this affect your score?",
        options: [
          "80%, this is fine, you're still under the limit",
          "80%, this significantly damages your score, lenders see this as financial stress",
          "20%, most of the limit is unused",
          "0%, the balance is less than the limit so it doesn't count",
        ],
        correct: 1,
        feedback: {
          correct:
            "80% utilisation is a major red flag for lenders. It signals you are using most of your available credit, a stress indicator. Target: pay down to below R6 000 (30% utilisation) to see a significant score improvement.",
          incorrect:
            "Utilisation = balance ÷ limit = R16 000 ÷ R20 000 = 80%. Anything above 30% starts damaging your score. Above 50% is a serious red flag. Pay down the balance to improve your score and reduce interest costs.",
        },
      },
      {
        type: "info",
        title: "Reading Your SA Credit Report",
        content:
          "<p>You are entitled to <strong>one free credit report per year</strong> from each credit bureau under the National Credit Act. SA credit bureaus: <strong>TransUnion, Experian, Compuscan</strong> (now Experian), and XDS.</p><p>Free checks: <strong>ClearScore</strong> (free monthly updates, Experian data) and <strong>annualcreditreport.co.za</strong>.</p><p><strong>What to look for on your report:</strong></p><ul><li>Payment history on each account, any missed payments?</li><li>Adverse listings (judgements, defaults, debt review status)</li><li>Accounts you don't recognise, potential fraud</li><li>Enquiries, who has searched your credit in the last 12 months?</li><li>Balances and limits on all credit accounts</li></ul><p><strong>Dispute errors:</strong> Creditors must remove incorrect adverse information within 20 business days of being notified. One incorrect listing can suppress your score for years.</p>",
      },
      {
        type: "true-false",
        statement:
          "Closing a credit card you no longer use always improves your credit score.",
        correct: false,
        feedback: {
          correct:
            "Correct, closing a card can actually hurt your score. It reduces your total available credit (increasing utilisation rate on remaining cards) and may shorten your credit history. Keeping unused cards open (with zero balance and no annual fee) often maintains a better score.",
          incorrect:
            "Counterintuitively, closing a credit card can hurt your score. It reduces total available credit (pushing utilisation higher on remaining cards) and can shorten your credit history. Unless there's an annual fee, keeping an old card open with zero balance is often better for your score.",
        },
      },
      {
        type: "fill-blank",
        title: "Utilisation Calculation",
        prompt:
          "You have three credit cards with limits of R8 000, R12 000, and R15 000. Combined balances are R14 000. Your total credit utilisation rate is ___% (round to nearest whole number).",
        correct: 40,
        explanation:
          "Total limit = R35 000. Total balance = R14 000. Utilisation = 14 000 ÷ 35 000 = 40%. This is above the ideal 30% threshold. Paying down R3 500 would bring you to 30% utilisation, typically a meaningful score improvement.",
        feedback: {
          correct:
            "R14 000 ÷ R35 000 = 40% utilisation. Lenders prefer below 30%. Pay down to R10 500 (30%) for a meaningful improvement. Score improvement from reducing utilisation is often visible within one billing cycle.",
          incorrect:
            "Total limit = R8k + R12k + R15k = R35 000. Total balance = R14 000. R14 000 ÷ R35 000 = 40%. Target under 30% = keep balance below R10 500.",
        },
      },
    ] satisfies LessonStep[],
  },

  {
    id: "lesson-rebuild-credit-score",
    title: "Rebuilding a Damaged Credit Score",
    steps: [
      {
        type: "info",
        title: "The Rebuild Timeline",
        content:
          "<p>Credit repair is not instant, but it is systematic. Here is what SA credit bureaus retain and when it falls off your record:</p><ul><li><strong>Late payments:</strong> 1–2 years (on most bureau records)</li><li><strong>Defaults:</strong> 1–2 years after account is settled</li><li><strong>Debt review/administration:</strong> Removed within 5 business days of clearance certificate</li><li><strong>Judgements:</strong> 5 years or until rescinded, whichever is sooner</li><li><strong>Enquiries (hard checks):</strong> 12 months</li></ul><p>The fastest path from a damaged score to a good score (620+): clear all defaults, pay everything on time from this moment, reduce utilisation, and wait. Most people see significant improvement within 12–18 months of consistent behaviour.</p>",
      },
      {
        type: "info",
        title: "The Credit Rebuild Sequence",
        content:
          "<p>If your score is below 550 (poor), follow this sequence:</p><ol><li><strong>Check your report for errors first.</strong> A significant percentage of SA credit reports contain inaccurate adverse information. Dispute anything incorrect immediately.</li><li><strong>Clear all outstanding defaults.</strong> Contact creditors directly, many accept settlements below the full amount. Get a settlement letter in writing and follow up to confirm bureau removal.</li><li><strong>Never miss another payment.</strong> One missed payment undoes months of rebuild. Set payment reminders or automate every account.</li><li><strong>Reduce utilisation below 30%.</strong> Pay down balances aggressively before applying for anything new.</li><li><strong>Do not apply for new credit.</strong> Each hard inquiry lowers your score. Wait until you've stabilised before seeking new credit.</li><li><strong>Consider a secured credit card.</strong> A retail bank account with a R2 000 temporary overdraft used and repaid monthly shows positive payment behaviour if your history is thin.</li></ol>",
      },
      {
        type: "mcq",
        question:
          "Precious has a default listed from 3 years ago that is now fully settled. She also has a current credit card she has never missed a payment on. Her score is 540. What will have the most impact on improving her score in the next 6 months?",
        options: [
          "Apply for three new credit accounts to show credit-worthiness",
          "Pay the credit card down to below 30% utilisation and verify the default is correctly marked 'settled' on the bureau",
          "Close all credit accounts and start fresh",
          "Apply for a home loan, this shows lenders you're serious about credit",
        ],
        correct: 1,
        feedback: {
          correct:
            "Reducing utilisation and ensuring settled defaults are correctly recorded are the two highest-impact, fastest actions available. Multiple new applications would further lower her score. Closing accounts reduces available credit.",
          incorrect:
            "The fastest score improvements come from: (1) correcting bureau records on settled defaults, and (2) lowering utilisation. New applications create hard inquiries and lower the score. Closing accounts reduces total available credit.",
        },
      },
      {
        type: "info",
        title: "The Real Cost of a Bad Credit Score",
        content:
          "<p>A credit score of 550 vs 720 is not just a number, it translates directly into rands over a lifetime:</p><p><strong>Home loan example (R1 000 000, 20 years):</strong></p><ul><li>Score 720+ → prime – 0.5% → 10.75% → monthly repayment: R9 800, total repaid: R2 352 000</li><li>Score 550 → prime + 1.5% → 12.75% → monthly repayment: R11 400, total repaid: R2 736 000</li><li><strong>Difference: R384 000</strong> over 20 years, purely due to credit score</li></ul><p>A good credit score is worth more than most investment accounts for many South Africans. Building it is as important as building savings.</p>",
      },
      {
        type: "action",
        title: "Credit Audit This Week",
        instruction:
          "Check your credit report for free on ClearScore (South Africa) this week. Look for: (1) any accounts you don't recognise, (2) any defaults or adverse listings, (3) your current utilisation rate. Write down one thing you will change to improve your score.",
        tip: "ClearScore updates monthly and is free permanently. Set a monthly calendar reminder to check your score, monitoring is itself a good habit that keeps you aware of your credit health.",
      },
    ] satisfies LessonStep[],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// 5. PORTFOLIO CONSTRUCTION
// Target: sa-investing → add as a new unit or append to existing unit
// ─────────────────────────────────────────────────────────────────────────────

export const PORTFOLIO_CONSTRUCTION_LESSONS: Lesson[] = [
  {
    id: "lesson-asset-allocation",
    title: "Asset Allocation: The Most Important Investment Decision",
    steps: [
      {
        type: "info",
        title: "What Asset Allocation Means",
        content:
          "<p>Research by Brinson, Hood, and Beebower found that over 90% of long-term portfolio return variability is explained by <strong>asset allocation</strong>, the split between asset classes, not by which specific shares or funds you pick.</p><p>The five main asset classes in a SA investor's toolkit:</p><ul><li><strong>Equities (shares):</strong> Highest long-term return, highest short-term volatility. JSE, global shares.</li><li><strong>Bonds (fixed income):</strong> Moderate return, lower volatility. Government and corporate bonds.</li><li><strong>Property (REITs):</strong> Income + capital growth. Retail, office, industrial property.</li><li><strong>Cash:</strong> Lowest return, zero volatility. Money market, fixed deposits.</li><li><strong>Alternatives:</strong> Commodities, hedge funds (generally inaccessible to retail investors).</li></ul><p>The right allocation depends on your time horizon and risk tolerance, not on market conditions today.</p>",
      },
      {
        type: "info",
        title: "The Time Horizon Rule",
        content:
          "<p>The most important factor in asset allocation is <strong>how long until you need the money</strong>.</p><table style='width:100%;border-collapse:collapse;font-size:14px;'><tr style='background:#f5f5f5;'><td style='padding:8px;border:1px solid #e5e7eb;'><strong>Time Horizon</strong></td><td style='padding:8px;border:1px solid #e5e7eb;'><strong>Suggested Equity Allocation</strong></td><td style='padding:8px;border:1px solid #e5e7eb;'><strong>Why</strong></td></tr><tr><td style='padding:8px;border:1px solid #e5e7eb;'>Under 3 years</td><td style='padding:8px;border:1px solid #e5e7eb;'>0–20%</td><td style='padding:8px;border:1px solid #e5e7eb;'>Not enough time to recover from a market crash</td></tr><tr><td style='padding:8px;border:1px solid #e5e7eb;'>3–7 years</td><td style='padding:8px;border:1px solid #e5e7eb;'>20–50%</td><td style='padding:8px;border:1px solid #e5e7eb;'>Balanced growth with some stability</td></tr><tr><td style='padding:8px;border:1px solid #e5e7eb;'>7–15 years</td><td style='padding:8px;border:1px solid #e5e7eb;'>50–75%</td><td style='padding:8px;border:1px solid #e5e7eb;'>Time to ride volatility and capture equity premium</td></tr><tr><td style='padding:8px;border:1px solid #e5e7eb;'>15+ years</td><td style='padding:8px;border:1px solid #e5e7eb;'>70–100%</td><td style='padding:8px;border:1px solid #e5e7eb;'>Maximise compounding; short-term crashes are irrelevant</td></tr></table><p>A 28-year-old investing for retirement has a 37-year horizon. They should be heavily in equities. A 55-year-old retiring in 5 years should be predominantly in bonds and cash.</p>",
      },
      {
        type: "mcq",
        question:
          "Siphamandla is 32 years old, investing for retirement at 65. He has an emergency fund, no high-interest debt, and a stable income. What approximate equity allocation is most appropriate?",
        options: [
          "20% equities, 80% bonds and cash, to avoid losses",
          "50% equities, 50% bonds, a balanced approach",
          "75–85% equities, balance in bonds and cash",
          "100% in SA cash, risk-free until he's closer to retirement",
        ],
        correct: 2,
        feedback: {
          correct:
            "With a 33-year horizon, Siphamandla can tolerate significant equity volatility. Short-term crashes are irrelevant, he won't need the money for decades. Higher equity allocation maximises the compounding potential over 33 years.",
          incorrect:
            "With 33 years until retirement, Siphamandla's biggest risk is NOT having enough money, not volatility. High equity allocation (75–85%) is appropriate. Cash and bonds earn too little over 33 years to fund retirement.",
        },
      },
      {
        type: "info",
        title: "A Practical SA Starter Portfolio",
        content:
          "<p>For a 25–35 year old SA investor with a 25+ year horizon and moderate-to-high risk tolerance:</p><ul><li><strong>35% SA Equities:</strong> Satrix ALSI ETF or Satrix Capped SWIX ETF</li><li><strong>35% Global Equities:</strong> Satrix MSCI World ETF or Sygnia Itrix S&P 500</li><li><strong>10% SA Bonds:</strong> NewFunds GOVI Bond ETF or RSA Retail Bond</li><li><strong>10% SA Listed Property (REITs):</strong> Satrix Property ETF</li><li><strong>10% Cash:</strong> Money market fund (emergency buffer within portfolio)</li></ul><p>This portfolio: diversifies across geographies, asset classes, and sectors. Uses low-cost ETFs (annual fees 0.1–0.35%). Provides rand hedging through global equity exposure. Total estimated annual cost: under 0.5% in fees.</p><p>This is not financial advice. It's an illustrative example. Adjust based on your own situation.</p>",
      },
    ] satisfies LessonStep[],
  },

  {
    id: "lesson-rebalancing",
    title: "Rebalancing and Portfolio Management",
    steps: [
      {
        type: "info",
        title: "Why Portfolios Drift, and Why It Matters",
        content:
          "<p>Imagine you start with 60% equities and 40% bonds. After a great year, equities return 25% and bonds return 5%. Your portfolio is now approximately 65% equities and 35% bonds, you've drifted from your target allocation and taken on more risk than intended.</p><p><strong>Rebalancing</strong> means selling the outperformers and buying the underperformers to return to your target allocation. It feels counterintuitive, you're selling what's working, but it enforces the discipline of buy-low, sell-high.</p><p><strong>How often to rebalance:</strong> Most evidence suggests annual rebalancing is sufficient. More frequent rebalancing generates unnecessary transaction costs and tax events.</p>",
      },
      {
        type: "mcq",
        question:
          "Your target allocation is 70% equities, 30% bonds. After a strong equity year, your portfolio has drifted to 80% equities, 20% bonds. What should you do?",
        options: [
          "Do nothing, your equities are performing well, let them run",
          "Sell enough equities and buy bonds to restore the 70/30 split",
          "Increase your equity target to 80% since it's clearly working",
          "Move entirely to cash to protect the gains",
        ],
        correct: 1,
        feedback: {
          correct:
            "Rebalancing to 70/30 means selling equities at high prices and buying bonds at relatively lower prices, enforcing buy-low-sell-high behaviour automatically. It also restores your intended risk level.",
          incorrect:
            "Letting drift continue means your portfolio becomes riskier than intended. When equities eventually fall, you lose more than your target allowed. Rebalancing annually returns you to your risk comfort zone and enforces sell-high-buy-low.",
        },
      },
      {
        type: "info",
        title: "Tax-Smart Rebalancing in SA",
        content:
          "<p>In South Africa, selling assets to rebalance can trigger <strong>Capital Gains Tax (CGT)</strong>. Tax-smart rebalancing minimises this:</p><ul><li><strong>Rebalance with new contributions:</strong> Instead of selling, direct new monthly investments into underweight asset classes. No sale = no CGT.</li><li><strong>Use tax-advantaged accounts first:</strong> Rebalancing inside a Tax-Free Savings Account (TFSA) generates no CGT. Use TFSAs for your most active rebalancing.</li><li><strong>Annual exclusion:</strong> Each individual has a R40 000 annual capital gain exclusion. Small rebalancing sales may fall within this exclusion.</li><li><strong>Hold periods:</strong> Assets held over 3 years in a RA (Retirement Annuity) have no CGT on withdrawal, ideal for equity holdings.</li></ul>",
      },
      {
        type: "true-false",
        statement:
          "Selling an ETF that has risen significantly in price to rebalance your portfolio always triggers an immediate CGT bill.",
        correct: false,
        feedback: {
          correct:
            "Not always. If the gain is within your R40 000 annual exclusion, no CGT is owed. If it's inside a TFSA, never any CGT. Inside an RA, no CGT on growth. Tax-smart investors use these wrappers to rebalance without tax costs.",
          incorrect:
            "CGT is only triggered on gains above the R50 000 annual exclusion. Inside a TFSA or RA, there is no CGT at all on rebalancing. Strategic use of tax wrappers makes rebalancing cost-free from a tax perspective.",
        },
      },
      {
        type: "info",
        title: "The Two Questions Every Portfolio Decision Needs",
        content:
          "<p>When making any portfolio change, ask two questions before acting:</p><p><strong>1. Does this move me toward or away from my target allocation?</strong><br>Any change should serve your stated strategy. 'This share looks interesting' is not a portfolio reason.</p><p><strong>2. What is the after-tax, after-cost return of this decision?</strong><br>A 12% fund with 2.5% annual fee nets 9.5%. A 10.5% fund with 0.3% fee nets 10.2%. High-cost products can only justify their fees if they consistently outperform by more than the fee difference, which very few active funds do.</p><p><strong>Fee compounding works against you:</strong> R100 000 at 10% over 30 years = R1 745 000. At 9% (1% higher fee) = R1 327 000. That 1% fee difference costs R418 000 over 30 years.</p>",
      },
      {
        type: "scenario",
        question:
          "Zanele has a R200 000 portfolio in an actively managed SA equity fund charging 2.5% annual fees, returning an average of 13% before fees (net: 10.5%). She is considering switching to a Satrix ALSI ETF charging 0.1% fees with a long-term average of 12% before fees (net: 11.9%). Over 20 years, which performs better and by how much approximately?",
        options: [
          "The active fund, professional managers beat the index",
          "The ETF, approximately R130 000 more after 20 years on R200 000",
          "They're identical, the market return is the same regardless",
          "The active fund, it returns 1% more before fees",
        ],
        correct: 1,
        feedback: {
          correct:
            "R200 000 at 11.9% for 20 years ≈ R1 940 000. At 10.5% ≈ R1 415 000. The ETF generates approximately R525 000 more, from just 1.4% fee difference. Low-cost index investing is the single most powerful long-term portfolio improvement available to most investors.",
          incorrect:
            "R200 000 at 11.9% (ETF) over 20 years ≈ R1 940 000 vs R200 000 at 10.5% (active fund) ≈ R1 415 000. Difference: ~R525 000. A 1.4% fee advantage compounds to a massive wealth gap. This is why fee minimisation is non-negotiable for long-term investors.",
        },
      },
      {
        type: "action",
        title: "Build Your Target Allocation",
        instruction:
          "Write down your investment goal, the year you need the money, and your current age. Calculate your time horizon (years until you need the money). Using the time horizon table from this lesson, determine your target equity allocation. Then list the ETFs or funds you would use for each allocation. This is your personal investment policy statement.",
        tip: "Keep it simple. A portfolio of 2–3 ETFs (SA equity, global equity, and one bond/cash) is more effective than 12 different funds. Complexity costs fees and creates decision paralysis.",
      },
    ] satisfies LessonStep[],
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// MERGE GUIDE
// ═══════════════════════════════════════════════════════════════════════════════
/*
1. REPO RATE LESSONS, add to rand-economy course, unit-1 (The Rand Explained):
   Push REPO_RATE_LESSONS into the lessons array after the existing 'why-rand-weakens' lesson.

2. BEHAVIORAL FINANCE LESSONS, add to money-psychology course, unit-1 (Behavioral Biases):
   Push BEHAVIORAL_FINANCE_LESSONS into the lessons array after existing lesson-3 (Herd Mentality).

3. BONDS DEEP LESSONS, add to investing-basics course:
   Create a new unit: { id: "unit-bonds-deep", title: "Bonds In Depth", description: "..." }
   Push BONDS_DEEP_LESSONS as the lessons for this unit.

4. CREDIT SCORE DEEP LESSONS, add to credit-debt course, unit-1 (Understanding Credit):
   Push CREDIT_SCORE_DEEP_LESSONS into the lessons array after existing lesson-1 (What is a Credit Score?).

5. PORTFOLIO CONSTRUCTION LESSONS, add to sa-investing course:
   Create a new unit: { id: "unit-portfolio", title: "Building Your Portfolio", description: "..." }
   Push PORTFOLIO_CONSTRUCTION_LESSONS as the lessons for this unit.

All lessons use `satisfies LessonStep[]` and exactly match the Lesson/LessonStep types.
*/

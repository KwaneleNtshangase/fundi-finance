/**
 * fundi-patch-10.js — Content expansion + new courses + fill-blank type
 * Run from project root: node scripts/fundi-patch-10.js
 */

const fs = require("fs");
const path = require("path");

const CONTENT = path.join(__dirname, "../src/data/content.ts");
let content = fs.readFileSync(CONTENT, "utf8");

let changed = 0;
function rep(from, to, label) {
  if (!content.includes(from)) { console.warn("⚠️  NOT FOUND: " + label); return; }
  content = content.replace(from, to); changed++;
  console.log("✅  " + label);
}

// ─── 1. Add fill-blank to LessonStep type ────────────────────────────────────
rep(
  `  | {
      type: "true-false";
      statement: string;
      correct: boolean;
      feedback: { correct: string; incorrect: string };
    };`,
  `  | {
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
    };`,
  "add fill-blank to LessonStep type"
);

// ─── 2. Inject new courses before closing bracket ────────────────────────────
const NEW_COURSES = `
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
                { type: "info", title: "The Biggest Retirement Change in 30 Years", content: "<p>From 1 September 2024, every rand you contribute to a pension, provident, or retirement annuity fund is split into two pots. This affects every formal employee in South Africa — roughly 7 million people.</p>" },
                { type: "info", title: "The Two Pots Explained", content: "<p><strong>Savings Pot (1/3):</strong> Access once per tax year (minimum R2,000 withdrawal). Taxed as income when withdrawn. Emergency provision only.</p><p><strong>Retirement Pot (2/3):</strong> Completely locked until retirement age. No exceptions.</p><p><strong>Vested Pot:</strong> Everything before 1 September 2024 — old rules still apply.</p>" },
                { type: "mcq", question: "You contribute R3,000/month to your RA. How much goes into the Savings Pot monthly?", options: ["R3,000", "R1,000", "R2,000", "R1,500"], correct: 1, feedback: { correct: "R3,000 ÷ 3 = R1,000 to the Savings Pot. R2,000 to the Retirement Pot.", incorrect: "One third goes to the Savings Pot. R3,000 ÷ 3 = R1,000." } },
                { type: "info", title: "The Tax Catch", content: "<p>Withdrawing from your Savings Pot is taxed as income in that year. If you earn R420,000/year and withdraw R50,000, SARS taxes you on R470,000 — costing roughly R15,000–R18,000 in additional tax. This is a last resort, not a bonus account.</p>" },
                { type: "true-false", statement: "You can withdraw from your Savings Pot every month if needed.", correct: false, feedback: { correct: "Only once per tax year, minimum R2,000. It was designed as an emergency provision.", incorrect: "Once per tax year maximum, with a R2,000 minimum withdrawal." } },
                { type: "mcq", question: "Why was the two-pot system introduced?", options: ["To increase government tax revenue", "To stop people from cashing out all retirement savings on resignation", "To force people to invest in government bonds", "To simplify pension fund administration"], correct: 1, feedback: { correct: "90%+ of South Africans previously cashed out their entire retirement savings on resignation. The two-pot protects the Retirement Pot while giving emergency access through the Savings Pot.", incorrect: "The two-pot system protects retirement savings. Previously, 90%+ of people cashed out everything when changing jobs — arriving at retirement with nothing." } },
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
                { type: "true-false", statement: "Starting to save 15% of salary at 25 gives a better retirement outcome than saving 30% starting at 40.", correct: true, feedback: { correct: "Correct — 15 extra years of compounding at 15% beats doubling the contribution rate starting 15 years later. Time is the most powerful retirement tool.", incorrect: "Starting at 25 with 15% typically beats starting at 40 with 30%. The 15-year compounding advantage is more powerful than doubling the contribution rate." } },
                { type: "scenario", question: "Nombuso is 42, earns R45,000/month, and has saved nothing. She starts contributing 15% (R6,750/month) at 10% annual return until 65. Approximately what will she have?", options: ["R2.8 million", "R6.8 million", "R14 million", "R1.2 million"], correct: 1, feedback: { correct: "R6,750/month for 23 years at 10% ≈ R6.8 million. At 4% withdrawal that's R272,000/year (R22,667/month). Better than nothing — but starting earlier would have been transformative.", incorrect: "R6,750/month × 23 years at 10% ≈ R6.8 million. This illustrates the cost of starting late — and why every year of delay is expensive." } },
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
                { type: "info", title: "A Volatile Emerging Market Currency", content: "<p>The rand is one of the most traded and most volatile emerging market currencies. When global investors get nervous, they sell 'risky' assets — including rand — and buy 'safe' assets like the US dollar. This happens even when nothing has changed inside South Africa.</p>" },
                { type: "info", title: "What Drives Rand Weakness", content: "<ul><li><strong>Load shedding:</strong> Destroys growth forecasts, scares investors</li><li><strong>Political uncertainty:</strong> Unpredictable policy = capital flight</li><li><strong>US Fed rate hikes:</strong> Money moves from SA to USD for better yields</li><li><strong>Trade deficit:</strong> SA imports more than it exports</li><li><strong>FATF greylisting:</strong> Increased friction for foreign investment</li></ul>" },
                { type: "mcq", question: "The US Federal Reserve raises interest rates sharply. What typically happens to the rand?", options: ["Rand strengthens — US growth is good for trade", "Rand weakens — capital flows to USD for better yields", "No effect — markets are independent", "Rand strengthens — investors seek diversification"], correct: 1, feedback: { correct: "Rising US rates pull global capital toward USD. Money exits SA, rand demand drops, and the rand weakens — this is called capital flight.", incorrect: "Rising US rates make USD assets more attractive. Capital leaves SA, reducing rand demand. The rand weakens." } },
                { type: "info", title: "How Rand Weakness Hits Your Budget", content: "<p>Every R1 weakening against the dollar adds roughly R0.20–R0.30 per litre of petrol (crude oil is dollar-priced). Electronics, imported food, flights, and medicine all become more expensive.</p><p>A weaker rand helps SA exporters (mining, agriculture, tourism) but hurts consumers and importers.</p>" },
                { type: "true-false", statement: "A weaker rand is always bad for all South Africans.", correct: false, feedback: { correct: "A weaker rand benefits exporters — SA's mining sector earns dollars and pays costs in rand. A weaker rand increases their rand revenue and employment in mining communities.", incorrect: "A weaker rand hurts importers and consumers but benefits exporters (mining, agriculture, tourism) who earn foreign currency." } },
                { type: "scenario", question: "You invested R100,000 in a Satrix S&P 500 ETF when the rand was R17/$. The rand weakens to R20/$, but US shares didn't move. Your investment is now worth approximately:", options: ["R100,000", "R117,647", "R85,000", "R70,000"], correct: 1, feedback: { correct: "R100,000 ÷ R17 = $5,882. At R20/$: $5,882 × R20 = R117,647. Rand weakness created a 17.6% gain from currency alone — this is why offshore investments hedge against rand depreciation.", incorrect: "R100,000 at R17/$ = $5,882. At R20/$: $5,882 × R20 = R117,647. The rand's weakness boosted rand returns by 17.6% even without any share price movement." } },
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
                { type: "info", title: "The Technology", content: "<p>Cryptocurrency is digital money secured by cryptography and recorded on a blockchain — a shared public ledger maintained by thousands of computers. No single bank, government, or company controls it.</p><p>Bitcoin (2009) was the first. There are now thousands of cryptocurrencies. Most are worthless. Bitcoin and Ethereum have the longest track records.</p>" },
                { type: "info", title: "What Crypto Is and Isn't", content: "<p><strong>It IS:</strong> A speculative asset class with real (but volatile) historical returns. Taxable in SA — SARS takes its cut.</p><p><strong>It ISN'T:</strong> A guaranteed investment. Anonymous — blockchain is traceable. A replacement for the rand for everyday purchases.</p>" },
                { type: "mcq", question: "Bitcoin has dropped 70–80% in price three times historically, then recovered to new highs each time. This shows:", options: ["Bitcoin is a Ponzi scheme", "High volatility is normal for this asset class — not evidence of fraud", "The blockchain technology failed", "Government manipulation caused each crash"], correct: 1, feedback: { correct: "Large drawdowns are historically normal for Bitcoin (2011, 2014, 2018, 2022) and it has recovered each time. Extreme volatility is the defining characteristic — investors must be prepared for it.", incorrect: "Bitcoin has dropped 70–85% three times and recovered each time. Volatility is the defining feature of the asset class, not evidence of fraud or failure." } },
                { type: "info", title: "SARS and Crypto Tax", content: "<p>SARS is explicit: crypto is a taxable asset. <strong>Capital Gains Tax</strong> applies if you hold and sell (40% of gain included in income). <strong>Income tax</strong> applies if you trade actively. Keep records of every transaction: date, rand value at purchase, rand value at sale. SA exchanges (Luno, VALR) share data with SARS.</p>" },
                { type: "true-false", statement: "Crypto transactions are anonymous, so SARS can't know about your gains.", correct: false, feedback: { correct: "Blockchain is pseudonymous, not anonymous. SA exchanges share transaction data with SARS. Non-disclosure is tax evasion with criminal consequences.", incorrect: "Blockchain is NOT anonymous. SA crypto exchanges (Luno, VALR) share data with SARS. Attempting to hide crypto gains is tax evasion." } },
                { type: "info", title: "SA Crypto Scam Red Flags", content: "<p>South Africa lost over R60 billion to crypto scams. MTI (Mirror Trading International) defrauded over R9 billion. Africrypt took R54 billion. Red flags:</p><ul><li>Any guaranteed monthly returns</li><li>Returns paid in crypto you can't withdraw as rand</li><li>No explanation of trading strategy</li><li>Recruited through church/family groups</li><li>No FSCA licence</li></ul>" },
                { type: "mcq", question: "An investment promises 15% monthly returns in Bitcoin with no explanation of the strategy. This is:", options: ["A legitimate arbitrage desk", "Almost certainly a Ponzi scheme (15% monthly = 435% annually — impossible)", "High risk but potentially legitimate", "Fine if you can verify the Bitcoin payments"], correct: 1, feedback: { correct: "(1.15)^12 = 435% annual return. No legitimate strategy achieves this. This matches the exact promise of MTI — South Africa's largest crypto fraud at R9 billion.", incorrect: "15% monthly compounds to 435% annually. No legitimate investment achieves this. This is the exact profile of every major SA crypto Ponzi scheme." } },
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
              title: "Separate Your Money — Always",
              steps: [
                { type: "info", title: "The Number One Entrepreneur Mistake", content: "<p>Using one bank account for personal and business money is the most common and costly financial mistake SA entrepreneurs make. You can't see if the business is profitable. SARS can claim personal assets for business tax debt. You can't access business loans without separate financials.</p>" },
                { type: "info", title: "Business Account Basics", content: "<p>From day one: open a separate business bank account. Pay yourself a salary from it — don't dip in randomly. Every business expense from the business account. Keep every invoice and receipt — SARS can audit 5 years back.</p>" },
                { type: "true-false", statement: "If your business makes R50,000 profit, you can spend it all as personal income immediately.", correct: false, feedback: { correct: "Business profit belongs to the business until properly distributed as salary or dividend. Random withdrawals create tax complications and make profitability impossible to track.", incorrect: "Business profit is not personal money until properly paid as salary or dividend. Random withdrawals create SARS complications and hide the business's real financial health." } },
                { type: "info", title: "VAT — When You Must Register", content: "<p>VAT registration is mandatory when annual taxable turnover exceeds <strong>R1 million</strong>. You add 15% VAT to invoices, claim back VAT on business expenses, and pay SARS the net amount bi-monthly. The net formula: VAT collected − VAT paid on expenses = amount owed to SARS.</p>" },
                { type: "fill-blank", title: "VAT Calculation", prompt: "You invoice R80,000 (ex-VAT) and paid R6,000 VAT on business expenses. VAT collected = R12,000. You owe SARS R___.", correct: 6000, feedback: { correct: "R12,000 VAT collected − R6,000 VAT paid = R6,000 net to SARS. VAT is a passthrough — you collect and net it.", incorrect: "VAT owed = VAT collected − VAT paid on inputs. R12,000 − R6,000 = R6,000." } },
                { type: "info", title: "Provisional Tax", content: "<p>Self-employed people pay tax twice yearly: end of August and end of February. Under-estimate by more than 20% and SARS charges penalties plus interest.</p><p><strong>Rule of thumb:</strong> Set aside 25–35% of every payment received. This is your future tax bill.</p>" },
                { type: "scenario", question: "Thabo earns R80,000/month consulting (R960,000/year) and spends everything. At year end SARS bills him R280,000. What should he have done?", options: ["Nothing — SARS shouldn't tax self-employed people", "Set aside ~30% monthly (≈R24,000) and paid provisional tax twice yearly", "Registered as a company to avoid tax", "Kept earnings below R95,750 tax threshold"], correct: 1, feedback: { correct: "R960,000 × 30% ≈ R288,000 — very close to the actual bill. Provisional tax requires self-employed people to pay estimated tax bi-annually. R80,000/month × 30% = R24,000 set aside monthly.", incorrect: "Self-employed people must pay provisional tax twice yearly. 30% of each payment set aside prevents the catastrophic year-end surprise." } },
              ] satisfies LessonStep[],
            },
          ],
        },
      ],
    },
`;

rep(
  `  ],
};`,
  `    // ── NEW COURSES (PATCH 10) ──────────────────────────────────────────────
${NEW_COURSES}
  ],
};`,
  "inject new courses at end of CONTENT_DATA"
);

fs.writeFileSync(CONTENT, content);
console.log(`\n${changed} changes to content.ts`);
console.log("Now run: npm run build");

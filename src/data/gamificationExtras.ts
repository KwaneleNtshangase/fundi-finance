export const COURSE_BADGES: Record<
  string,
  { id: string; name: string; emoji: string; description: string; color: string }
> = {
  "money-basics": {
    id: "badge-money-basics",
    name: "Budget Boss",
    emoji: "",
    description: "Mastered the fundamentals of money management",
    color: "#007A4D",
  },
  "salary-payslip": {
    id: "badge-salary-payslip",
    name: "Payslip Pro",
    emoji: "",
    description: "Understands every line on a South African payslip",
    color: "#007A4D",
  },
  "banking-debit": {
    id: "badge-banking-debit",
    name: "Banking Guru",
    emoji: "",
    description: "Controls debit orders, fees, and digital banking like a pro",
    color: "#007A4D",
  },
  "credit-debt": {
    id: "badge-credit-debt",
    name: "Debt Destroyer",
    emoji: "",
    description: "Conquered credit scores, interest, and debt repayment strategies",
    color: "#E03C31",
  },
  "emergency-fund": {
    id: "badge-emergency-fund",
    name: "Safety Builder",
    emoji: "",
    description: "Built a financial safety net and manages risk like a professional",
    color: "#007A4D",
  },
  insurance: {
    id: "badge-insurance",
    name: "Risk Manager",
    emoji: "",
    description: "Protected against life's biggest financial surprises",
    color: "#007A4D",
  },
  "investing-basics": {
    id: "badge-investing-basics",
    name: "Market Maker",
    emoji: "",
    description: "Understands risk, return, diversification, and investment vehicles",
    color: "#007A4D",
  },
  "sa-investing": {
    id: "badge-sa-investing",
    name: "TFSA Titan",
    emoji: "",
    description: "Maximising tax-free savings and retirement annuities",
    color: "#007A4D",
  },
  property: {
    id: "badge-property",
    name: "Property Pilot",
    emoji: "",
    description: "Navigates home loans, deposits, and the rent vs buy decision",
    color: "#007A4D",
  },
  taxes: {
    id: "badge-taxes",
    name: "SARS Savvy",
    emoji: "",
    description: "Files returns confidently and minimises tax legally",
    color: "#FFB612",
  },
  "scams-fraud": {
    id: "badge-scams-fraud",
    name: "Fraud Fighter",
    emoji: "",
    description: "Can spot and avoid South Africa's most dangerous financial scams",
    color: "#E03C31",
  },
  "bible-money": {
    id: "badge-bible-money",
    name: "Faithful Steward",
    emoji: "",
    description: "Integrates biblical wisdom with practical financial management",
    color: "#007A4D",
  },
  "money-psychology": {
    id: "badge-money-psychology",
    name: "Mind Master",
    emoji: "",
    description: "Recognises and overcomes behavioural biases that destroy wealth",
    color: "#007A4D",
  },
  retirement: {
    id: "badge-retirement",
    name: "Retirement Ready",
    emoji: "",
    description: "Plans for retirement with the two-pot system and sustainable drawdown",
    color: "#007A4D",
  },
  "rand-economy": {
    id: "badge-rand-economy",
    name: "Rand Ranger",
    emoji: "",
    description: "Understands the rand, offshore investing, and SA economic forces",
    color: "#007A4D",
  },
  "crypto-basics": {
    id: "badge-crypto-basics",
    name: "Crypto Conscious",
    emoji: "",
    description: "Understands blockchain, SA exchanges, and SARS crypto tax obligations",
    color: "#007A4D",
  },
  "business-finance": {
    id: "badge-business-finance",
    name: "Entrepreneur Edge",
    emoji: "",
    description: "Runs business finances with VAT, cash flow, and CIPC knowledge",
    color: "#007A4D",
  },
};

export const INVESTOR_PROFILE_STYLES: Record<
  string,
  { emoji: string; color: string; bg: string; darkBg: string }
> = {
  Conservative: {
    emoji: "",
    color: "text-blue-700 dark:text-blue-300",
    bg: "bg-blue-50",
    darkBg: "dark:bg-blue-900/30",
  },
  "Moderately Conservative": {
    emoji: "",
    color: "text-purple-700 dark:text-purple-300",
    bg: "bg-purple-50",
    darkBg: "dark:bg-purple-900/30",
  },
  Moderate: {
    emoji: "",
    color: "text-yellow-700 dark:text-yellow-300",
    bg: "bg-yellow-50",
    darkBg: "dark:bg-yellow-900/30",
  },
  "Moderately Aggressive": {
    emoji: "",
    color: "text-green-700 dark:text-green-300",
    bg: "bg-green-50",
    darkBg: "dark:bg-green-900/30",
  },
  Aggressive: {
    emoji: "",
    color: "text-red-700 dark:text-red-300",
    bg: "bg-red-50",
    darkBg: "dark:bg-red-900/30",
  },
};

export const INVESTOR_QUIZ_QUESTIONS = [
  {
    id: 1,
    question: "If your investment dropped 20% in one month, you would:",
    options: [
      { text: "Sell everything immediately", score: 1 },
      { text: "Sell some to reduce risk", score: 2 },
      { text: "Hold and wait for recovery", score: 3 },
      { text: "Buy more at the lower price", score: 4 },
      { text: "Significantly increase your investment", score: 5 },
    ],
  },
  {
    id: 2,
    question: "Your investment time horizon is:",
    options: [
      { text: "Less than 1 year", score: 1 },
      { text: "1–3 years", score: 2 },
      { text: "3–7 years", score: 3 },
      { text: "7–15 years", score: 4 },
      { text: "15+ years", score: 5 },
    ],
  },
  {
    id: 3,
    question: "Your primary investment goal is:",
    options: [
      { text: "Protect my money from loss above everything", score: 1 },
      { text: "Earn slightly more than a bank account", score: 2 },
      { text: "Grow steadily over time", score: 3 },
      { text: "Significantly grow wealth over the long term", score: 4 },
      { text: "Maximum long-term growth, I can handle large swings", score: 5 },
    ],
  },
  {
    id: 4,
    question: "You have R50,000 to invest. You choose:",
    options: [
      { text: "Fixed deposit at the bank", score: 1 },
      { text: "A low-risk unit trust (mostly bonds)", score: 2 },
      { text: "A balanced fund (mix of shares and bonds)", score: 3 },
      { text: "A South African equity ETF", score: 4 },
      { text: "A global equity ETF or individual shares", score: 5 },
    ],
  },
  {
    id: 5,
    question: "How stable is your monthly income?",
    options: [
      { text: "Very unstable — irregular freelance or seasonal", score: 1 },
      { text: "Somewhat variable with a commission component", score: 2 },
      { text: "Mostly stable with occasional variation", score: 3 },
      { text: "Stable salaried employment", score: 4 },
      { text: "Very stable with multiple income streams", score: 5 },
    ],
  },
  {
    id: 6,
    question: "When you think about risk, you feel:",
    options: [
      { text: "Very anxious — I avoid risk at all costs", score: 1 },
      { text: "Somewhat anxious — I prefer caution", score: 2 },
      { text: "Neutral — I accept some risk for some reward", score: 3 },
      { text: "Comfortable — risk is part of building wealth", score: 4 },
      { text: "Excited — higher risk means higher potential returns", score: 5 },
    ],
  },
  {
    id: 7,
    question: "How much of your monthly income do you currently save or invest?",
    options: [
      { text: "Nothing at the moment", score: 1 },
      { text: "Less than 5%", score: 2 },
      { text: "5–15%", score: 3 },
      { text: "15–30%", score: 4 },
      { text: "More than 30%", score: 5 },
    ],
  },
  {
    id: 8,
    question: "Your emergency fund covers how many months of expenses?",
    options: [
      { text: "I don't have one", score: 1 },
      { text: "About 1 month", score: 2 },
      { text: "2–3 months", score: 3 },
      { text: "4–6 months", score: 4 },
      { text: "6+ months", score: 5 },
    ],
  },
  {
    id: 9,
    question: "How do you feel about investing in shares directly?",
    options: [
      { text: "I would never invest in shares", score: 1 },
      { text: "Only in very large, safe companies", score: 2 },
      { text: "In a diversified ETF tracking the whole market", score: 3 },
      { text: "A mix of ETFs and some individual shares", score: 4 },
      { text: "Individual shares, global ETFs, and alternative assets", score: 5 },
    ],
  },
  {
    id: 10,
    question: "If your investment went up 40% in a year, you would:",
    options: [
      { text: "Sell everything to lock in the profit", score: 1 },
      { text: "Sell half and keep the rest", score: 2 },
      { text: "Hold and review your allocation", score: 3 },
      { text: "Stay invested and add more", score: 4 },
      { text: "Reinvest all gains and increase contributions", score: 5 },
    ],
  },
] as const;

export function getInvestorProfile(totalScore: number) {
  if (totalScore <= 15)
    return {
      profile: "Conservative",
      emoji: "",
      color: "#3B82F6",
      description:
        "You prioritise protecting your capital above all else. You prefer certainty over high returns and low-risk products like money market funds, fixed deposits, and RSA Retail Bonds are most suitable for you.",
      allocation: "70% Cash/Money Market • 25% Bonds • 5% Equities",
      products: ["RSA Retail Bonds", "TymeBank GoalSave", "Capitec Money Market", "32-day Notice Account"],
    };
  if (totalScore <= 24)
    return {
      profile: "Moderately Conservative",
      emoji: "",
      color: "#8B5CF6",
      description:
        "You want your money to grow slightly faster than inflation but are uncomfortable with large swings. A blend of income assets with a small equity component suits your temperament.",
      allocation: "40% Cash/Bonds • 35% Balanced Fund • 25% Equities",
      products: ["Allan Gray Stable Fund", "Satrix Bond ETF", "Coronation Capital Plus", "RSA Retail Bonds"],
    };
  if (totalScore <= 33)
    return {
      profile: "Moderate",
      emoji: "",
      color: "#F59E0B",
      description:
        "You are comfortable with a balanced approach — accepting some volatility in exchange for meaningful long-term growth. A blend of local and global assets in a balanced fund is ideal.",
      allocation: "20% Cash • 30% Bonds • 50% Equities",
      products: ["Satrix Balanced Index Fund", "Allan Gray Balanced Fund", "Coronation Balanced Plus", "Sygnia Skeleton Balanced 70"],
    };
  if (totalScore <= 42)
    return {
      profile: "Moderately Aggressive",
      emoji: "",
      color: "#10B981",
      description:
        "You are growth-focused with a long time horizon and can stomach market volatility. You understand that short-term drops are normal and focus on long-term compounding.",
      allocation: "10% Cash • 15% Bonds • 75% Equities (SA + Global)",
      products: ["Satrix MSCI World ETF", "Satrix 40 ETF", "Sygnia Itrix S&P 500", "EasyEquities TFSA"],
    };
  return {
    profile: "Aggressive",
    emoji: "",
    color: "#EF4444",
    description:
      "You are a long-term, maximum-growth investor who accepts significant short-term volatility as the price of outstanding long-term returns. You have a strong financial foundation and a long time horizon.",
    allocation: "5% Cash • 95% Equities (Global-heavy)",
    products: ["Satrix MSCI World ETF", "Sygnia Itrix S&P 500", "Individual JSE shares via EasyEquities", "VALR/Luno for crypto (max 3–5%)"],
  };
}

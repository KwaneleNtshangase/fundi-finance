export type GrowthInputs = {
  principal: number;
  monthly: number;
  rate: number;
  years: number;
  escalation: number;
  frequency: "monthly" | "annually" | "once-off";
};

export function calculateGrowth(inputs: GrowthInputs) {
  const { principal, monthly, rate, years, escalation, frequency } = inputs;
  const data: { year: number; value: number; contributions: number; interest: number }[] = [];
  let balance = principal;
  let currentMonthly = monthly;
  let totalContributions = principal;
  const monthlyRate = rate / 100 / 12;

  for (let year = 0; year <= years; year++) {
    data.push({
      year,
      value: Math.round(balance),
      contributions: Math.round(totalContributions),
      interest: Math.round(balance - totalContributions),
    });
    if (year >= years) continue;

    if (frequency === "monthly") {
      for (let m = 0; m < 12; m++) {
        balance = balance * (1 + monthlyRate) + currentMonthly;
        totalContributions += currentMonthly;
      }
      currentMonthly *= 1 + escalation / 100;
      continue;
    }

    if (frequency === "annually") {
      // Treat annual mode as a yearly lump sum, but still apply monthly compounding.
      for (let m = 0; m < 12; m++) {
        balance = balance * (1 + monthlyRate);
      }
      const annualContribution = currentMonthly * 12;
      balance += annualContribution;
      totalContributions += annualContribution;
      currentMonthly *= 1 + escalation / 100;
      continue;
    }

    for (let m = 0; m < 12; m++) {
      balance = balance * (1 + monthlyRate);
    }
  }

  return data;
}

export function calculateCompoundInterest(principal: number, annualRatePercent: number, years: number, compoundsPerYear: number) {
  const r = annualRatePercent / 100;
  const n = compoundsPerYear;
  return principal * Math.pow(1 + r / n, n * years);
}

export function calculateLoanMonthlyPayment(principal: number, annualRatePercent: number, months: number) {
  if (months <= 0) return 0;
  const monthlyRate = annualRatePercent / 100 / 12;
  if (monthlyRate === 0) return principal / months;
  return (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months));
}

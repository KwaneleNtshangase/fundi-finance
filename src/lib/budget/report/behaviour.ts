/**
 * Behavioural pattern detection - "people change patterns, not pie charts".
 *
 * Same design constraints as insights.ts (POPIA + FAIS): pure functions,
 * every number computed locally, educational only, no product advice.
 *
 * Every detector is CONFIDENCE-GATED: with thin data it returns nothing
 * rather than speculating. The money personality only appears once at least
 * three complete months support it, and always ships with its evidence.
 */

import { formatZarCurrency } from "@/lib/currency";
import { resolveCategoryMeta } from "./categories";
import { firstDayOfMonthYear, lastDayOfMonthYear } from "./period";
import { merchantKey, cleanMerchantName } from "./merchants";
import type {
  BehaviourPattern,
  BudgetEntryInput,
  CategoryMeta,
  MoneyPersonality,
  ReportBehaviour,
} from "./types";

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function rand(cents: number): string {
  return formatZarCurrency(Math.round(cents / 100), { decimals: 0 });
}

function median(xs: number[]): number {
  if (xs.length === 0) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function mean(xs: number[]): number {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
}

/** Population coefficient of variation; 0 when the mean is 0. */
function cv(xs: number[]): number {
  const m = mean(xs);
  if (m === 0) return 0;
  const variance = mean(xs.map((x) => (x - m) ** 2));
  return Math.sqrt(variance) / m;
}

/** Pearson correlation; 0 when either series has no variance. */
function pearson(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length < 2) return 0;
  const ma = mean(a);
  const mb = mean(b);
  let num = 0;
  let da = 0;
  let db = 0;
  for (let i = 0; i < a.length; i++) {
    num += (a[i] - ma) * (b[i] - mb);
    da += (a[i] - ma) ** 2;
    db += (b[i] - mb) ** 2;
  }
  if (da === 0 || db === 0) return 0;
  return num / Math.sqrt(da * db);
}

function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86400000);
}

function weekdayOf(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

const BUSINESS_INCOME = /\b(business|side ?hustle|trading|resale|spaza)\b/i;
const TRANSPORT_CAT = /\b(transport|taxi|fuel|petrol|uber|bolt)\b/i;

type MonthStats = {
  monthYear: string;
  incomeCents: number;
  setAsideCents: number;
  consumptionCents: number;
  totalExpenseCents: number;
  wantsCents: number;
  goalsCents: number;
  businessIncomeCents: number;
  transportCents: number;
  incomeSourceIds: Set<string>;
  topIncomeShare: number;
  firstIncomeDate: string | null;
  /** Days from first income to the first set-aside on/after it; null if n/a. */
  saveGapDays: number | null;
};

export type BehaviourOptions = {
  /** Start of the data window; months cut off by it are treated as partial. */
  windowStart?: string;
};

export function computeBehaviour(
  entries: BudgetEntryInput[],
  categories: CategoryMeta[],
  endDate: string,
  options: BehaviourOptions = {}
): ReportBehaviour {
  const metaCache = new Map<string, ReturnType<typeof resolveCategoryMeta>>();
  const metaOf = (id: string) => {
    let m = metaCache.get(id);
    if (!m) {
      m = resolveCategoryMeta(id, categories);
      metaCache.set(id, m);
    }
    return m;
  };

  const usable = entries.filter((e) => !e.is_transfer && e.entry_date <= endDate);
  const windowStart =
    options.windowStart ?? usable.reduce((min, e) => (e.entry_date < min ? e.entry_date : min), endDate);

  // A month is COMPLETE when the data window covers it fully - the window
  // starting mid-month or ending before month-end truncates it.
  const monthsWithData = [...new Set(usable.map((e) => e.entry_date.slice(0, 7)))].sort();
  const completeMonths = monthsWithData.filter(
    (m) => firstDayOfMonthYear(m) >= windowStart && lastDayOfMonthYear(m) <= endDate
  );
  const completeSet = new Set(completeMonths);
  const monthsAnalysed = completeMonths.length;

  const inComplete = usable.filter((e) => completeSet.has(e.entry_date.slice(0, 7)));
  const expenses = inComplete.filter((e) => e.type === "expense");
  const incomes = inComplete.filter((e) => e.type === "income");
  const cents = (amount: number) => Math.round(amount * 100);

  // ── Per-month stats ──────────────────────────────────────────────────────
  const stats = new Map<string, MonthStats>();
  for (const m of completeMonths) {
    stats.set(m, {
      monthYear: m,
      incomeCents: 0,
      setAsideCents: 0,
      consumptionCents: 0,
      totalExpenseCents: 0,
      wantsCents: 0,
      goalsCents: 0,
      businessIncomeCents: 0,
      transportCents: 0,
      incomeSourceIds: new Set(),
      topIncomeShare: 0,
      firstIncomeDate: null,
      saveGapDays: null,
    });
  }
  const incomeByCatByMonth = new Map<string, Map<string, number>>();
  for (const e of incomes) {
    const s = stats.get(e.entry_date.slice(0, 7));
    if (!s) continue;
    const c = cents(e.amount);
    s.incomeCents += c;
    s.incomeSourceIds.add(e.category);
    if (s.firstIncomeDate === null || e.entry_date < s.firstIncomeDate) s.firstIncomeDate = e.entry_date;
    const meta = metaOf(e.category);
    if (BUSINESS_INCOME.test(`${e.category} ${meta.name}`)) s.businessIncomeCents += c;
    let byCat = incomeByCatByMonth.get(s.monthYear);
    if (!byCat) {
      byCat = new Map();
      incomeByCatByMonth.set(s.monthYear, byCat);
    }
    byCat.set(e.category, (byCat.get(e.category) ?? 0) + c);
  }
  for (const e of expenses) {
    const s = stats.get(e.entry_date.slice(0, 7));
    if (!s) continue;
    const c = cents(e.amount);
    const meta = metaOf(e.category);
    s.totalExpenseCents += c;
    if (meta.isSavingsVehicle) {
      s.setAsideCents += c;
    } else {
      s.consumptionCents += c;
      if (meta.group === "wants") s.wantsCents += c;
      if (TRANSPORT_CAT.test(`${e.category} ${meta.name}`)) s.transportCents += c;
    }
    if (meta.group === "goals" || meta.isSavingsVehicle) s.goalsCents += c;
  }
  for (const s of stats.values()) {
    const byCat = incomeByCatByMonth.get(s.monthYear);
    if (byCat && s.incomeCents > 0) {
      s.topIncomeShare = Math.max(...byCat.values()) / s.incomeCents;
    }
    if (s.firstIncomeDate && s.setAsideCents > 0) {
      const gaps = expenses
        .filter(
          (e) =>
            e.entry_date.slice(0, 7) === s.monthYear &&
            metaOf(e.category).isSavingsVehicle &&
            e.entry_date >= s.firstIncomeDate!
        )
        .map((e) => daysBetween(s.firstIncomeDate!, e.entry_date));
      if (gaps.length > 0) s.saveGapDays = Math.min(...gaps);
    }
  }
  const monthStats = completeMonths.map((m) => stats.get(m)!);

  const patterns: BehaviourPattern[] = [];

  // ── 1. Weekday concentration ─────────────────────────────────────────────
  // Gate: ≥2 complete months and ≥30 day-to-day transactions.
  const consumptionTxns = expenses.filter((e) => !metaOf(e.category).isSavingsVehicle);
  if (monthsAnalysed >= 2 && consumptionTxns.length >= 30) {
    const byDay = new Array(7).fill(0) as number[];
    const countByDay = new Array(7).fill(0) as number[];
    let total = 0;
    for (const e of consumptionTxns) {
      const d = weekdayOf(e.entry_date);
      const c = cents(e.amount);
      byDay[d] += c;
      countByDay[d] += 1;
      total += c;
    }
    if (total > 0) {
      const topDay = byDay.indexOf(Math.max(...byDay));
      const topShare = byDay[topDay] / total;
      const restAvg = (total - byDay[topDay]) / 6;
      if (topShare >= 0.3 && byDay[topDay] >= restAvg * 1.8) {
        patterns.push({
          id: "weekday",
          tone: "info",
          title: `${WEEKDAYS[topDay]}s are your big spending day`,
          detail: `${Math.round(topShare * 100)}% of your day-to-day spending (${rand(byDay[topDay])} across ${countByDay[topDay]} transactions) happens on ${WEEKDAYS[topDay]}s. If overspending sneaks in, that's when.`,
        });
      }
    }
  }

  // ── 2. Month-end spike ───────────────────────────────────────────────────
  // Gate: ≥2 complete months. Compares daily pace in the last 5 days of the
  // month against the rest.
  if (monthsAnalysed >= 2) {
    let lastCents = 0;
    let lastDays = 0;
    let restCents = 0;
    let restDays = 0;
    for (const m of completeMonths) {
      const monthEnd = lastDayOfMonthYear(m);
      const endDay = Number(monthEnd.slice(8, 10));
      lastDays += 5;
      restDays += endDay - 5;
      for (const e of consumptionTxns) {
        if (e.entry_date.slice(0, 7) !== m) continue;
        const day = Number(e.entry_date.slice(8, 10));
        if (day > endDay - 5) lastCents += cents(e.amount);
        else restCents += cents(e.amount);
      }
    }
    const lastRate = lastDays > 0 ? lastCents / lastDays : 0;
    const restRate = restDays > 0 ? restCents / restDays : 0;
    if (restRate > 0 && lastRate / restRate >= 1.6 && lastCents >= 50000) {
      patterns.push({
        id: "monthend",
        tone: "warn",
        title: "Spending spikes at month-end",
        detail: `In the last 5 days of the month you spend about ${(lastRate / restRate).toFixed(1)}x your normal daily pace (~${rand(lastRate)}/day vs ~${rand(restRate)}/day). A month-end buffer or moving bills earlier can flatten that.`,
      });
    }
  }

  // ── 3. Save-after-payday timing ──────────────────────────────────────────
  // Gate: ≥2 months where both income and a set-aside happened.
  const gapMonths = monthStats.filter((s) => s.saveGapDays !== null);
  if (gapMonths.length >= 2) {
    const gap = median(gapMonths.map((s) => s.saveGapDays!));
    if (gap <= 3) {
      patterns.push({
        id: "payday-saver",
        tone: "good",
        title: "You pay yourself first",
        detail: `In ${gapMonths.length} of your last ${monthsAnalysed} months, money moved to savings within ~${Math.round(gap)} day${Math.round(gap) === 1 ? "" : "s"} of income landing. Saving before spending is the single strongest saving habit - keep it.`,
      });
    } else if (gap >= 15) {
      patterns.push({
        id: "leftover-saver",
        tone: "warn",
        title: "You save what's left, late in the month",
        detail: `Your savings contributions typically happen ~${Math.round(gap)} days after income lands. Saving whatever remains at month-end is fragile - moving it to payday makes the habit automatic.`,
      });
    }
  }

  // ── 4. Category volatility ───────────────────────────────────────────────
  // Gate: ≥3 complete months; category ≥10% of day-to-day spend and material.
  if (monthsAnalysed >= 3) {
    const totalConsumption = monthStats.reduce((s, m) => s + m.consumptionCents, 0);
    const byCat = new Map<string, number[]>();
    for (const e of consumptionTxns) {
      const idx = completeMonths.indexOf(e.entry_date.slice(0, 7));
      if (idx < 0) continue;
      let series = byCat.get(e.category);
      if (!series) {
        series = new Array(completeMonths.length).fill(0);
        byCat.set(e.category, series);
      }
      series[idx] += cents(e.amount);
    }
    let flagged: { id: string; series: number[]; total: number } | null = null;
    for (const [id, series] of byCat) {
      const total = series.reduce((a, b) => a + b, 0);
      if (totalConsumption <= 0 || total / totalConsumption < 0.1) continue;
      if (mean(series) < 30000) continue; // < R300/month: noise, not signal
      if (cv(series) >= 0.6 && (!flagged || total > flagged.total)) flagged = { id, series, total };
    }
    if (flagged) {
      const meta = metaOf(flagged.id);
      const lo = Math.min(...flagged.series);
      const hi = Math.max(...flagged.series);
      patterns.push({
        id: `volatile-${flagged.id}`,
        tone: "warn",
        title: `${meta.name} swings hard month to month`,
        detail: `Across ${monthsAnalysed} months, ${meta.name} ranged from ${rand(lo)} to ${rand(hi)} (average ${rand(mean(flagged.series))}). Volatile categories are where budgets break - a monthly cap with a small buffer absorbs the swings.`,
      });
    }
  }

  // ── 5. Subscription-style recurring wants ────────────────────────────────
  // Gate: ≥3 complete months; ≥2 wants-group merchants recurring with tight
  // amounts. (No growth/"creep" claim: the tight-band gate that makes these
  // reliably subscriptions also caps observable growth below any honest
  // creep threshold - a trend claim here would be noise.)
  if (monthsAnalysed >= 3) {
    type Sub = { name: string; amounts: number[]; months: Set<string>; byMonth: Map<string, number> };
    const subMap = new Map<string, Sub>();
    for (const e of consumptionTxns) {
      const meta = metaOf(e.category);
      if (meta.group !== "wants") continue;
      const key = merchantKey(e.description);
      if (key === "unlabelled") continue;
      let s = subMap.get(key);
      if (!s) {
        s = { name: cleanMerchantName(e.description), amounts: [], months: new Set(), byMonth: new Map() };
        subMap.set(key, s);
      }
      const c = cents(e.amount);
      s.amounts.push(c);
      const m = e.entry_date.slice(0, 7);
      s.months.add(m);
      s.byMonth.set(m, (s.byMonth.get(m) ?? 0) + c);
    }
    const subs = [...subMap.values()].filter((s) => {
      if (s.months.size < 3) return false;
      const lo = Math.min(...s.amounts);
      const hi = Math.max(...s.amounts);
      return lo > 0 && hi / lo <= 1.25;
    });
    if (subs.length >= 2) {
      const monthlyTotal = subs.reduce((sum, s) => sum + median([...s.byMonth.values()]), 0);
      const names = subs.map((s) => s.name).slice(0, 3).join(", ");
      patterns.push({
        id: "subscriptions",
        tone: "info",
        title: `${subs.length} subscription-style payments running`,
        detail: `${names}${subs.length > 3 ? ` and ${subs.length - 3} more` : ""} recur every month at ~${rand(monthlyTotal)} combined - ${rand(monthlyTotal * 12)} a year. Worth a yearly "am I still using this?" pass.`,
      });
    }
  }

  // ── 6. Side-hustle ↔ transport link ──────────────────────────────────────
  // Gate: ≥4 complete months, business income in ≥2 of them, strong r.
  if (monthsAnalysed >= 4) {
    const bizMonths = monthStats.filter((s) => s.businessIncomeCents > 0).length;
    if (bizMonths >= 2) {
      const r = pearson(
        monthStats.map((s) => s.businessIncomeCents),
        monthStats.map((s) => s.transportCents)
      );
      if (r >= 0.7) {
        patterns.push({
          id: "hustle-transport",
          tone: "info",
          title: "Transport tracks your side-hustle",
          detail: `Months with more business income also show more transport spend (correlation ${r.toFixed(2)} over ${monthsAnalysed} months). Part of that transport is likely a business cost - worth separating work trips so the hustle's true profit is visible.`,
        });
      }
    }
  }

  // ── Money personality (≥3 complete months, positive identities first) ────
  const personality = derivePersonality(monthStats, monthsAnalysed);

  return { patterns: patterns.slice(0, 5), personality, monthsAnalysed };
}

function derivePersonality(monthStats: MonthStats[], monthsAnalysed: number): MoneyPersonality | null {
  if (monthsAnalysed < 3) return null;

  const withIncome = monthStats.filter((s) => s.incomeCents > 0);
  const savingsRates = withIncome.map((s) => s.setAsideCents / s.incomeCents);
  const saverMonths = savingsRates.filter((r) => r >= 0.15).length;
  const setAsideMonths = monthStats.filter((s) => s.setAsideCents > 0).length;
  const goalsShares = monthStats
    .filter((s) => s.totalExpenseCents > 0)
    .map((s) => s.goalsCents / s.totalExpenseCents);
  const builderMonths = goalsShares.filter((g) => g >= 0.25).length;
  const consumptionCv = cv(monthStats.map((s) => s.consumptionCents));
  const wantsShares = monthStats
    .filter((s) => s.consumptionCents > 0)
    .map((s) => s.wantsCents / s.consumptionCents);
  const avgSources = mean(monthStats.map((s) => s.incomeSourceIds.size));
  const topShare = median(withIncome.map((s) => s.topIncomeShare));

  // Saver: sets aside 15%+ of income in at least two-thirds of earning months.
  if (withIncome.length >= 3 && saverMonths >= Math.ceil((withIncome.length * 2) / 3)) {
    return {
      id: "saver",
      label: "The Saver",
      evidence: [
        `Set aside 15%+ of income in ${saverMonths} of your last ${withIncome.length} earning months`,
        `Median savings rate: ${Math.round(median(savingsRates) * 100)}% of income`,
      ],
    };
  }
  // Builder: a quarter or more of outflows go to savings + debt payoff.
  if (goalsShares.length >= 3 && builderMonths >= Math.ceil((goalsShares.length * 2) / 3)) {
    return {
      id: "builder",
      label: "The Builder",
      evidence: [
        `25%+ of your money went to savings, stokvel or debt payoff in ${builderMonths} of ${goalsShares.length} months`,
        `Median: ${Math.round(median(goalsShares) * 100)}% of outflows toward future wealth`,
      ],
    };
  }
  // Planner: steady, predictable day-to-day spending with a regular set-aside.
  if (consumptionCv <= 0.22 && setAsideMonths >= Math.ceil((monthsAnalysed * 2) / 3)) {
    return {
      id: "planner",
      label: "The Planner",
      evidence: [
        `Day-to-day spending varies only ~${Math.round(consumptionCv * 100)}% month to month`,
        `Money set aside in ${setAsideMonths} of ${monthsAnalysed} months`,
      ],
    };
  }
  // Income-Maximiser: multiple real income streams, no single point of failure.
  if (withIncome.length >= 3 && avgSources >= 2 && topShare <= 0.75) {
    return {
      id: "maximiser",
      label: "The Income-Maximiser",
      evidence: [
        `Average of ${avgSources.toFixed(1)} income sources per month`,
        `Biggest source is only ${Math.round(topShare * 100)}% of income - the rest is hustle`,
      ],
    };
  }
  // Impulse Spender: lifestyle spend dominates - only claimed when clear.
  if (wantsShares.length >= 3 && median(wantsShares) >= 0.35) {
    return {
      id: "impulse",
      label: "The Impulse Spender",
      evidence: [
        `Lifestyle categories take ${Math.round(median(wantsShares) * 100)}% of your typical month's day-to-day spend`,
        `That's above the ~30% guideline in ${wantsShares.filter((w) => w > 0.3).length} of ${wantsShares.length} months`,
      ],
    };
  }
  return null;
}

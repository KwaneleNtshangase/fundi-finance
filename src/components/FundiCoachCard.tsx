"use client";

/**
 * Fundi Coach — Tier 1 (deterministic, no AI).
 *
 * Self-contained card: fetches the user's current + previous month budget
 * data, runs the pure rules engine (src/lib/coach/insights.ts), and shows
 * the top nudges with links to lessons.
 *
 * Compliance by design:
 *  - All figures are computed locally from the user's own data; nothing is
 *    sent to any AI or third party (POPIA).
 *  - Content is educational and never recommends financial products (FAIS).
 *    A disclaimer renders on every card.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { sastToday } from "@/lib/dates";
import { resolveMonthlyBudget, type BudgetTargetRow } from "@/lib/budget/budgetResolve";
import {
  computeCoachInsights,
  type CoachEntry,
  type CoachInsight,
} from "@/lib/coach/insights";
import { Lightbulb } from "@/components/icons/FundiIcons";

const BUILT_IN_LABELS: Record<string, string> = {
  food: "Food & Groceries",
  transport: "Transport",
  housing: "Housing/Rent",
  debt: "Debt Repayments",
  savings: "Savings",
  entertainment: "Entertainment",
  airtime: "Airtime & Data",
  healthcare: "Healthcare",
  education: "Education",
  other: "Other",
};

const SEVERITY_STYLES: Record<CoachInsight["severity"], { border: string; bg: string; chip: string; chipText: string }> = {
  alert:  { border: "rgba(224,60,49,0.45)",  bg: "rgba(224,60,49,0.06)",  chip: "#E03C31", chipText: "Over budget" },
  warn:   { border: "rgba(255,182,18,0.55)", bg: "rgba(255,182,18,0.07)", chip: "#B8860B", chipText: "Heads up" },
  info:   { border: "var(--color-border)",   bg: "transparent",           chip: "#3B7DD8", chipText: "Tip" },
  praise: { border: "rgba(0,122,77,0.45)",   bg: "rgba(0,122,77,0.06)",   chip: "#007A4D", chipText: "Well done" },
};

function monthKeyOf(isoDay: string): string {
  return isoDay.slice(0, 7);
}

function prevMonthKeyOf(monthKey: string): string {
  const [y, m] = monthKey.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 2, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function daysInMonthOf(monthKey: string): number {
  const [y, m] = monthKey.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

export function FundiCoachCard({
  maxInsights = 3,
  monthYear,
}: {
  maxInsights?: number;
  /** Month to analyse, "YYYY-MM". Defaults to the current SAST month. */
  monthYear?: string;
}) {
  const [insights, setInsights] = useState<CoachInsight[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const today = sastToday(); // YYYY-MM-DD (SAST)
        const currentMonth = monthKeyOf(today);
        // Analyse the month the user is LOOKING AT, not blindly "now".
        const monthKey = monthYear ?? currentMonth;
        const prevMonthKey = prevMonthKeyOf(monthKey);
        const daysInMonth = daysInMonthOf(monthKey);
        // Past months are complete; the current month runs to today's date.
        const dayOfMonth =
          monthKey === currentMonth ? Number(today.slice(8, 10)) : daysInMonth;
        const rangeEnd =
          monthKey === currentMonth
            ? today
            : `${monthKey}-${String(daysInMonth).padStart(2, "0")}`;

        const [entriesRes, targetsRes, catsRes] = await Promise.all([
          supabase
            .from("budget_entries")
            .select("type, category, amount, entry_date, is_transfer")
            .eq("user_id", user.id)
            .gte("entry_date", `${prevMonthKey}-01`)
            .lte("entry_date", rangeEnd),
          supabase
            .from("budget_targets")
            .select("category, monthly_limit, month_year")
            .eq("user_id", user.id),
          supabase
            .from("custom_budget_categories")
            .select("id, name")
            .eq("user_id", user.id),
        ]);

        const entries = (entriesRes.data ?? []) as CoachEntry[];
        const targetRows = (targetsRes.data ?? []) as BudgetTargetRow[];

        const budgets: Record<string, number> = {};
        for (const c of new Set(targetRows.map((r) => r.category))) {
          const limit = resolveMonthlyBudget(targetRows, c, monthKey);
          if (limit > 0) budgets[c] = limit;
        }

        const categoryLabels: Record<string, string> = { ...BUILT_IN_LABELS };
        for (const c of (catsRes.data ?? []) as { id: string; name: string }[]) {
          categoryLabels[c.id] = c.name;
        }

        const result = computeCoachInsights({
          monthKey,
          prevMonthKey,
          entries,
          budgets,
          categoryLabels,
          dayOfMonth,
          daysInMonth,
        });

        if (!cancelled) setInsights(result.slice(0, maxInsights));
      } catch {
        if (!cancelled) setInsights([]);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [maxInsights, monthYear]);

  // The card (and its chat) is always available; the insights list simply
  // stays empty until the rules engine has something worth saying.
  const showInsights = !!insights && insights.length > 0;

  return (
    <section
      aria-label="Fundi Coach insights"
      style={{
        border: "1.5px solid var(--color-border)",
        borderRadius: 16,
        padding: "16px 18px",
        marginBottom: 20,
        background: "var(--color-surface, transparent)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <Lightbulb size={18} style={{ color: "var(--color-accent, #FFB612)" }} />
        <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>Fundi Coach</h3>
        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-secondary)", marginLeft: "auto" }}>
          Based on your own numbers
        </span>
      </div>

      {!showInsights && (
        <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: 0 }}>
          No nudges right now. Add entries or import a bank statement and Fundi
          will spot what&apos;s worth a look.
        </p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {(insights ?? []).map((i) => {
          const s = SEVERITY_STYLES[i.severity];
          return (
            <div
              key={i.id}
              style={{
                border: `1.5px solid ${s.border}`,
                background: s.bg,
                borderRadius: 12,
                padding: "12px 14px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{
                  fontSize: 10, fontWeight: 800, textTransform: "uppercase",
                  letterSpacing: "0.06em", color: "#fff", background: s.chip,
                  borderRadius: 8, padding: "2px 8px",
                }}>
                  {s.chipText}
                </span>
                <span style={{ fontSize: 14, fontWeight: 700 }}>{i.title}</span>
              </div>
              <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: "6px 0 0" }}>
                {i.body}
              </p>
              {i.lesson && (
                <Link
                  href={`/lesson/${i.lesson.courseId}/${i.lesson.lessonId}`}
                  style={{
                    display: "inline-block", marginTop: 8, fontSize: 13, fontWeight: 700,
                    color: "var(--color-primary)", textDecoration: "none",
                  }}
                >
                  Lesson: {i.lesson.title} →
                </Link>
              )}
            </div>
          );
        })}
      </div>

      <p style={{ fontSize: 11, color: "var(--color-text-secondary)", margin: "12px 0 0" }}>
        Educational information based on your budget data, not financial advice.
        Fundi Finance is not a registered financial services provider.
      </p>
    </section>
  );
}

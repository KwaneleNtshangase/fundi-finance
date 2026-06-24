import React from "react";
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  Svg,
  Path,
  Rect,
  G,
} from "@react-pdf/renderer";
import { formatZarCurrency } from "@/lib/currency";
import { formatPeriodLabel } from "./period";
import type { ExpenseCategoryRow, ReportModel } from "./types";

const BRAND = {
  primary: "#007A4D",
  expense: "#E03C31",
  accent: "#FFB612",
  muted: "#6B7280",
  border: "#E5E7EB",
  text: "#111827",
};

const styles = StyleSheet.create({
  page: { padding: 40, paddingBottom: 56, fontFamily: "Helvetica", fontSize: 10, color: BRAND.text },
  brandBar: { height: 6, backgroundColor: BRAND.primary, marginBottom: 24, borderRadius: 2 },
  title: { fontSize: 22, fontWeight: 700, color: BRAND.primary, marginBottom: 4 },
  subtitle: { fontSize: 11, color: BRAND.muted, marginBottom: 20 },
  sectionTitle: { fontSize: 13, fontWeight: 700, marginBottom: 10, color: BRAND.text },
  cardRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  card: {
    flex: 1,
    border: `1px solid ${BRAND.border}`,
    borderRadius: 6,
    padding: 10,
    backgroundColor: "#FAFAFA",
  },
  cardLabel: { fontSize: 8, color: BRAND.muted, textTransform: "uppercase", marginBottom: 4 },
  cardValue: { fontSize: 14, fontWeight: 700 },
  band: {
    border: `1px solid ${BRAND.border}`,
    borderRadius: 6,
    padding: 12,
    marginBottom: 16,
    backgroundColor: "#F9FAFB",
  },
  bandRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  badge: {
    fontSize: 7,
    fontWeight: 700,
    color: BRAND.accent,
    backgroundColor: "#FFF8E6",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: "flex-start",
    marginBottom: 6,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottom: `1px solid ${BRAND.border}`,
    paddingBottom: 6,
    marginBottom: 4,
    fontWeight: 700,
    fontSize: 8,
    color: BRAND.muted,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 5,
    borderBottom: `1px solid ${BRAND.border}`,
    fontSize: 9,
    alignItems: "center",
  },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    fontSize: 8,
    color: BRAND.muted,
    textAlign: "center",
    borderTop: `1px solid ${BRAND.border}`,
    paddingTop: 8,
  },
  chartWrap: { marginTop: 8, marginBottom: 16, alignItems: "center" },
  insightItem: { marginBottom: 6, fontSize: 9 },
});

function zar(cents: number): string {
  return formatZarCurrency(cents / 100, { decimals: 2 });
}

function varianceColor(varianceCents: number, overBudget: boolean): string {
  if (overBudget) return BRAND.expense;
  if (varianceCents < 0) return BRAND.primary;
  return BRAND.text;
}

function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
}

function describeDonutSlice(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  startAngle: number,
  endAngle: number
): string {
  const startOuter = polarToCartesian(cx, cy, outerR, startAngle);
  const endOuter = polarToCartesian(cx, cy, outerR, endAngle);
  const startInner = polarToCartesian(cx, cy, innerR, endAngle);
  const endInner = polarToCartesian(cx, cy, innerR, startAngle);
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
  return [
    `M ${startOuter.x} ${startOuter.y}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${endOuter.x} ${endOuter.y}`,
    `L ${startInner.x} ${startInner.y}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${endInner.x} ${endInner.y}`,
    "Z",
  ].join(" ");
}

function DonutChart({
  rows,
  size = 160,
}: {
  rows: { value: number; color: string }[];
  size?: number;
}) {
  const total = rows.reduce((s, r) => s + r.value, 0);
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - 4;
  const innerR = outerR * 0.55;
  let angle = -Math.PI / 2;
  const slices = rows.filter((r) => r.value > 0).map((r) => {
    const slice = total > 0 ? (r.value / total) * 2 * Math.PI : 0;
    const path = describeDonutSlice(cx, cy, outerR, innerR, angle, angle + slice);
    angle += slice;
    return { path, color: r.color };
  });
  if (total === 0) {
    return (
      <Svg width={size} height={size}>
        <Path
          d={describeDonutSlice(cx, cy, outerR, innerR, 0, 2 * Math.PI)}
          fill={BRAND.border}
        />
      </Svg>
    );
  }
  return (
    <Svg width={size} height={size}>
      <G>
        {slices.map((s, i) => (
          <Path key={i} d={s.path} fill={s.color} />
        ))}
      </G>
    </Svg>
  );
}

function MonthlyBarChart({
  data,
  width = 480,
  height = 120,
}: {
  data: { label: string; value: number }[];
  width?: number;
  height?: number;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const barW = Math.min(36, (width - 40) / Math.max(data.length, 1) - 8);
  const chartH = height - 8;
  const gap = (width - 40 - barW * data.length) / Math.max(data.length + 1, 1);
  return (
    <View>
      <Svg width={width} height={height}>
        {data.map((d, i) => {
          const barH = (d.value / max) * chartH;
          const x = 20 + gap + i * (barW + gap);
          const y = chartH - barH;
          return <Rect key={i} x={x} y={y} width={barW} height={barH} fill={BRAND.expense} rx={2} />;
        })}
      </Svg>
      <View style={{ flexDirection: "row", paddingLeft: 20, marginTop: 4 }}>
        {data.map((d, i) => (
          <Text key={i} style={{ fontSize: 7, color: BRAND.muted, width: barW + gap, textAlign: "center" }}>
            {d.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

function GroupedBarChart({
  rows,
  width = 480,
  height = 140,
}: {
  rows: ExpenseCategoryRow[];
  width?: number;
  height?: number;
}) {
  const top = rows.filter((r) => r.budgetedCents > 0 || r.actualCents > 0).slice(0, 8);
  const max = Math.max(...top.flatMap((r) => [r.budgetedCents, r.actualCents]), 1);
  const groupW = Math.min(48, (width - 40) / Math.max(top.length, 1) - 6);
  const barW = groupW / 2 - 2;
  const chartH = height - 8;
  const gap = (width - 40 - groupW * top.length) / Math.max(top.length + 1, 1);
  return (
    <View>
      <Svg width={width} height={height}>
        {top.map((r, i) => {
          const budgetH = (r.budgetedCents / max) * chartH;
          const actualH = (r.actualCents / max) * chartH;
          const x = 20 + gap + i * (groupW + gap);
          return (
            <G key={r.categoryId}>
              <Rect x={x} y={chartH - budgetH} width={barW} height={budgetH} fill={BRAND.accent} rx={1} />
              <Rect
                x={x + barW + 2}
                y={chartH - actualH}
                width={barW}
                height={actualH}
                fill={r.overBudget ? BRAND.expense : BRAND.primary}
                rx={1}
              />
            </G>
          );
        })}
      </Svg>
      <View style={{ flexDirection: "row", paddingLeft: 20, marginTop: 4 }}>
        {top.map((r) => (
          <Text
            key={r.categoryId}
            style={{ fontSize: 6, color: BRAND.muted, width: groupW + gap, textAlign: "center" }}
          >
            {r.categoryName.slice(0, 8)}
          </Text>
        ))}
      </View>
    </View>
  );
}

function Footer() {
  return (
    <Text
      style={styles.footer}
      fixed
      render={({ pageNumber, totalPages }) =>
        `Figures are based on data you entered or imported · Page ${pageNumber} of ${totalPages}`
      }
    />
  );
}

function ExpenseTable({ rows }: { rows: ExpenseCategoryRow[] }) {
  if (rows.length === 0) {
    return <Text style={{ fontSize: 9, color: BRAND.muted }}>No expense data for this period.</Text>;
  }
  return (
    <View>
      <View style={styles.tableHeader}>
        <Text style={{ width: "28%" }}>Category</Text>
        <Text style={{ width: "14%", textAlign: "right" }}>Budgeted</Text>
        <Text style={{ width: "14%", textAlign: "right" }}>Actual</Text>
        <Text style={{ width: "14%", textAlign: "right" }}>Var R</Text>
        <Text style={{ width: "12%", textAlign: "right" }}>Var %</Text>
        <Text style={{ width: "10%", textAlign: "right" }}>Share</Text>
      </View>
      {rows.map((r) => (
        <View key={r.categoryId} style={styles.tableRow}>
          <View style={{ width: "28%", flexDirection: "row", alignItems: "center" }}>
            <View style={[styles.dot, { backgroundColor: r.color }]} />
            <Text>{r.categoryName}</Text>
          </View>
          <Text style={{ width: "14%", textAlign: "right" }}>
            {r.budgetedCents > 0 ? zar(r.budgetedCents) : "—"}
          </Text>
          <Text style={{ width: "14%", textAlign: "right" }}>{zar(r.actualCents)}</Text>
          <Text
            style={{
              width: "14%",
              textAlign: "right",
              color: varianceColor(r.varianceCents, r.overBudget),
            }}
          >
            {r.budgetedCents > 0 || r.actualCents > 0
              ? `${r.varianceCents >= 0 ? "+" : ""}${zar(r.varianceCents)}`
              : "—"}
          </Text>
          <Text
            style={{
              width: "12%",
              textAlign: "right",
              color: varianceColor(r.varianceCents, r.overBudget),
            }}
          >
            {r.variancePct != null ? `${r.variancePct}%` : "—"}
          </Text>
          <Text style={{ width: "10%", textAlign: "right" }}>{r.sharePct}%</Text>
        </View>
      ))}
    </View>
  );
}

export function BudgetReportDocument({ model }: { model: ReportModel }) {
  const periodLabel = formatPeriodLabel(model.periodStart, model.periodEnd);
  const generated = new Date(model.generatedAt).toLocaleString("en-ZA", {
    timeZone: "Africa/Johannesburg",
    dateStyle: "medium",
    timeStyle: "short",
  });

  const donutData = model.expenseCategories.map((r) => ({
    value: r.actualCents,
    color: r.color,
  }));

  return (
    <Document title="Fundi Budget Report" author="Fundi Finance">
      {/* Page 1 — Cover + summary */}
      <Page size="A4" style={styles.page}>
        <View style={styles.brandBar} />
        <Text style={styles.title}>Budget Report</Text>
        <Text style={styles.subtitle}>Prepared for {model.displayName}</Text>
        <Text style={{ fontSize: 10, marginBottom: 4 }}>{periodLabel} (SAST)</Text>
        <Text style={{ fontSize: 9, color: BRAND.muted, marginBottom: 20 }}>
          Generated {generated}
        </Text>

        <View style={styles.cardRow}>
          {[
            { label: "Income", value: zar(model.totalIncomeCents), color: BRAND.primary },
            { label: "Expenses", value: zar(model.totalExpenseCents), color: BRAND.expense },
            {
              label: "Net",
              value: `${model.netCents >= 0 ? "+" : ""}${zar(model.netCents)}`,
              color: model.netCents >= 0 ? BRAND.primary : BRAND.expense,
            },
            {
              label: "Savings rate",
              value: `${model.savingsRatePct}%`,
              color: model.savingsRatePct >= 10 ? BRAND.primary : BRAND.expense,
            },
          ].map((c) => (
            <View key={c.label} style={styles.card}>
              <Text style={styles.cardLabel}>{c.label}</Text>
              <Text style={[styles.cardValue, { color: c.color }]}>{c.value}</Text>
            </View>
          ))}
        </View>

        <View style={styles.band}>
          <Text style={styles.sectionTitle}>Budget vs actual</Text>
          {model.budgetIsEstimate && <Text style={styles.badge}>Estimate</Text>}
          <View style={styles.bandRow}>
            <Text>Budgeted</Text>
            <Text style={{ fontWeight: 700 }}>
              {model.totalBudgetedExpenseCents > 0 ? zar(model.totalBudgetedExpenseCents) : "—"}
            </Text>
          </View>
          <View style={styles.bandRow}>
            <Text>Actual</Text>
            <Text style={{ fontWeight: 700, color: BRAND.expense }}>
              {zar(model.totalExpenseCents)}
            </Text>
          </View>
          <View style={styles.bandRow}>
            <Text>Variance</Text>
            <Text
              style={{
                fontWeight: 700,
                color: model.budgetVarianceCents > 0 ? BRAND.expense : BRAND.primary,
              }}
            >
              {model.totalBudgetedExpenseCents > 0
                ? `${model.budgetVarianceCents >= 0 ? "+" : ""}${zar(model.budgetVarianceCents)}`
                : "—"}
            </Text>
          </View>
          <View style={styles.bandRow}>
            <Text>% used</Text>
            <Text style={{ fontWeight: 700 }}>
              {model.budgetUsedPct != null ? `${model.budgetUsedPct}%` : "—"}
            </Text>
          </View>
        </View>
        <Footer />
      </Page>

      {/* Page 2 — Category tables */}
      <Page size="A4" style={styles.page}>
        <View style={styles.brandBar} />
        <Text style={styles.sectionTitle}>Expenses by category</Text>
        <ExpenseTable rows={model.expenseCategories} />

        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Income by category</Text>
        {model.incomeCategories.length === 0 ? (
          <Text style={{ fontSize: 9, color: BRAND.muted }}>No income data for this period.</Text>
        ) : (
          <View>
            <View style={styles.tableHeader}>
              <Text style={{ width: "50%" }}>Category</Text>
              <Text style={{ width: "25%", textAlign: "right" }}>Actual</Text>
              <Text style={{ width: "25%", textAlign: "right" }}>Share of income</Text>
            </View>
            {model.incomeCategories.map((r) => (
              <View key={r.categoryId} style={styles.tableRow}>
                <Text style={{ width: "50%" }}>{r.categoryName}</Text>
                <Text style={{ width: "25%", textAlign: "right" }}>{zar(r.actualCents)}</Text>
                <Text style={{ width: "25%", textAlign: "right" }}>{r.sharePct}%</Text>
              </View>
            ))}
          </View>
        )}
        <Footer />
      </Page>

      {/* Page 3 — Charts */}
      <Page size="A4" style={styles.page}>
        <View style={styles.brandBar} />
        <Text style={styles.sectionTitle}>Expense breakdown</Text>
        <View style={styles.chartWrap}>
          <DonutChart rows={donutData} />
        </View>

        <Text style={styles.sectionTitle}>Monthly spend</Text>
        <View style={styles.chartWrap}>
          <MonthlyBarChart
            data={model.monthlySpend.map((m) => ({ label: m.label, value: m.expenseCents }))}
          />
        </View>

        <Text style={styles.sectionTitle}>Budget vs actual by category</Text>
        <Text style={{ fontSize: 8, color: BRAND.muted, marginBottom: 4 }}>
          Gold = budgeted · Green/red = actual
        </Text>
        <View style={styles.chartWrap}>
          <GroupedBarChart rows={model.expenseCategories} />
        </View>
        <Footer />
      </Page>

      {/* Page 4 — Insights */}
      <Page size="A4" style={styles.page}>
        <View style={styles.brandBar} />
        <Text style={styles.sectionTitle}>Top merchants by spend</Text>
        {model.topMerchants.length === 0 ? (
          <Text style={{ fontSize: 9, color: BRAND.muted, marginBottom: 12 }}>No merchants.</Text>
        ) : (
          model.topMerchants.map((m, i) => (
            <Text key={i} style={styles.insightItem}>
              {i + 1}. {m.description} — {zar(m.totalCents)}
            </Text>
          ))
        )}

        <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Largest transactions</Text>
        {model.largestTransactions.length === 0 ? (
          <Text style={{ fontSize: 9, color: BRAND.muted, marginBottom: 12 }}>None.</Text>
        ) : (
          model.largestTransactions.map((t, i) => (
            <Text key={i} style={styles.insightItem}>
              {i + 1}. {t.description} ({t.categoryName}) — {zar(t.cents)} · {t.date}
            </Text>
          ))
        )}

        <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Over-budget categories</Text>
        {model.topOverBudget.length === 0 ? (
          <Text style={{ fontSize: 9, color: BRAND.muted, marginBottom: 12 }}>None.</Text>
        ) : (
          model.topOverBudget.map((r, i) => (
            <Text key={r.categoryId} style={[styles.insightItem, { color: BRAND.expense }]}>
              {i + 1}. {r.categoryName} — +{zar(r.varianceCents)} ({r.variancePct}% of budget)
            </Text>
          ))
        )}

        <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Under-budget categories</Text>
        {model.topUnderBudget.length === 0 ? (
          <Text style={{ fontSize: 9, color: BRAND.muted }}>None.</Text>
        ) : (
          model.topUnderBudget.map((r, i) => (
            <Text key={r.categoryId} style={[styles.insightItem, { color: BRAND.primary }]}>
              {i + 1}. {r.categoryName} — {zar(r.varianceCents)} ({r.variancePct}% of budget)
            </Text>
          ))
        )}
        <Footer />
      </Page>
    </Document>
  );
}

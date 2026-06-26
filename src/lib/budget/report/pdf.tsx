import React from "react";
import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
  Svg,
  Path,
  Rect,
  Circle,
  Line,
  Polyline,
  G,
} from "@react-pdf/renderer";
import { formatZarCurrency } from "@/lib/currency";
import { formatPeriodLabel } from "./period";
import type { ExpenseCategoryRow, MonthlySpend, ReportModel } from "./types";

// Brand palette — from the Fundi Finance pitch deck (navy / gold / teal).
const C = {
  navy: "#15294B",
  navyDeep: "#0E1C38",
  card: "#1E335A",
  gold: "#E6B84C",
  goldSoft: "#C9A14A",
  teal: "#2AA39A",
  expense: "#E0584E",
  white: "#FFFFFF",
  onNavyMuted: "#9AA7BD",
  text: "#1F2937",
  textMuted: "#6B7280",
  border: "#E6E9EF",
  rowAlt: "#F6F8FB",
  lightBg: "#FFFFFF",
};

const styles = StyleSheet.create({
  // Light body pages
  page: {
    paddingTop: 78,
    paddingBottom: 56,
    paddingHorizontal: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: C.text,
  },
  // Cover (navy)
  cover: { fontFamily: "Helvetica", color: C.white, backgroundColor: C.navy, padding: 0 },
  sectionTitle: { fontSize: 13, fontWeight: 700, marginBottom: 10, color: C.navy },
  sectionSub: { fontSize: 8, color: C.textMuted, marginBottom: 8 },

  // Per-page branded header band
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 50,
    backgroundColor: C.navy,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 40,
  },
  headerBrand: { flexDirection: "row", alignItems: "center" },
  headerWordmark: { color: C.white, fontSize: 12, fontWeight: 700, marginLeft: 8 },
  headerTitle: { color: C.gold, fontSize: 10, fontWeight: 700 },
  headerAccent: {
    position: "absolute",
    top: 50,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: C.gold,
  },

  footer: {
    position: "absolute",
    bottom: 22,
    left: 40,
    right: 40,
    fontSize: 8,
    color: C.textMuted,
    textAlign: "center",
    borderTop: `1px solid ${C.border}`,
    paddingTop: 8,
  },

  statCard: {
    flex: 1,
    backgroundColor: C.card,
    borderRadius: 10,
    padding: 12,
    borderLeft: `3px solid ${C.gold}`,
  },
  statLabel: { fontSize: 8, color: C.onNavyMuted, textTransform: "uppercase", marginBottom: 5, letterSpacing: 0.5 },
  statValue: { fontSize: 16, fontWeight: 700 },

  // Tables
  tableHeader: {
    flexDirection: "row",
    backgroundColor: C.navy,
    paddingVertical: 6,
    paddingHorizontal: 6,
    fontWeight: 700,
    fontSize: 8,
    color: C.white,
    borderRadius: 4,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 6,
    borderBottom: `1px solid ${C.border}`,
    fontSize: 9,
    alignItems: "center",
  },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },

  insightCard: {
    backgroundColor: C.rowAlt,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeft: `3px solid ${C.teal}`,
  },
  insightItem: { marginBottom: 5, fontSize: 9 },
  badge: {
    fontSize: 7,
    fontWeight: 700,
    color: C.navy,
    backgroundColor: C.gold,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
});

function zar(cents: number): string {
  return formatZarCurrency(cents / 100, { decimals: 2 });
}
function zarShort(cents: number): string {
  const r = cents / 100;
  if (Math.abs(r) >= 1000) return `R${Math.round(r / 1000)}k`;
  return `R${Math.round(r)}`;
}
function varianceColor(varianceCents: number, overBudget: boolean): string {
  if (overBudget) return C.expense;
  if (varianceCents < 0) return C.teal;
  return C.text;
}

// ── Branding ───────────────────────────────────────────────────────────────
function Logo({ uri, size }: { uri?: string; size: number }) {
  if (!uri) return null;
  return <Image src={uri} style={{ width: size, height: size }} />;
}

function PageHeader({ uri, title }: { uri?: string; title: string }) {
  return (
    <View fixed>
      <View style={styles.header}>
        <View style={styles.headerBrand}>
          <Logo uri={uri} size={26} />
          <Text style={styles.headerWordmark}>Fundi Finance</Text>
        </View>
        <Text style={styles.headerTitle}>{title}</Text>
      </View>
      <View style={styles.headerAccent} />
    </View>
  );
}

function Footer() {
  return (
    <Text
      style={styles.footer}
      fixed
      render={({ pageNumber, totalPages }) =>
        `Fundi Finance · Master Your Money   |   Figures based on data you entered or imported   |   Page ${pageNumber} of ${totalPages}`
      }
    />
  );
}

// ── Charts ───────────────────────────────────────────────────────────────
function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
}
function describeDonutSlice(cx: number, cy: number, outerR: number, innerR: number, a0: number, a1: number): string {
  const so = polarToCartesian(cx, cy, outerR, a0);
  const eo = polarToCartesian(cx, cy, outerR, a1);
  const si = polarToCartesian(cx, cy, innerR, a1);
  const ei = polarToCartesian(cx, cy, innerR, a0);
  const large = a1 - a0 > Math.PI ? 1 : 0;
  return [
    `M ${so.x} ${so.y}`,
    `A ${outerR} ${outerR} 0 ${large} 1 ${eo.x} ${eo.y}`,
    `L ${si.x} ${si.y}`,
    `A ${innerR} ${innerR} 0 ${large} 0 ${ei.x} ${ei.y}`,
    "Z",
  ].join(" ");
}
function DonutChart({ rows, size = 150 }: { rows: { value: number; color: string }[]; size?: number }) {
  const total = rows.reduce((s, r) => s + r.value, 0);
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - 4;
  const innerR = outerR * 0.58;
  let angle = -Math.PI / 2;
  if (total === 0) {
    return (
      <Svg width={size} height={size}>
        <Path d={describeDonutSlice(cx, cy, outerR, innerR, 0, 2 * Math.PI)} fill={C.border} />
      </Svg>
    );
  }
  const slices = rows
    .filter((r) => r.value > 0)
    .map((r) => {
      const slice = (r.value / total) * 2 * Math.PI;
      const path = describeDonutSlice(cx, cy, outerR, innerR, angle, angle + slice);
      angle += slice;
      return { path, color: r.color };
    });
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

/** Income vs Expenses line chart over the months in the period. */
function LineChart({ data, width = 515, height = 150 }: { data: MonthlySpend[]; width?: number; height?: number }) {
  const leftPad = 42;
  const plotW = width - leftPad - 8;
  const plotH = height;
  const max = Math.max(...data.flatMap((d) => [d.incomeCents, d.expenseCents]), 1);
  const n = data.length;
  const xAt = (i: number) => (n <= 1 ? plotW / 2 : (i / (n - 1)) * plotW);
  const yAt = (v: number) => plotH - (v / max) * plotH;
  const ptStr = (key: "incomeCents" | "expenseCents") =>
    data.map((d, i) => `${xAt(i)},${yAt(d[key])}`).join(" ");

  return (
    <View>
      {/* legend */}
      <View style={{ flexDirection: "row", marginBottom: 6, gap: 16 }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View style={{ width: 12, height: 3, backgroundColor: C.teal, marginRight: 5 }} />
          <Text style={{ fontSize: 8, color: C.textMuted }}>Income</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View style={{ width: 12, height: 3, backgroundColor: C.expense, marginRight: 5 }} />
          <Text style={{ fontSize: 8, color: C.textMuted }}>Expenses</Text>
        </View>
      </View>
      <View style={{ flexDirection: "row" }}>
        <View style={{ width: leftPad, height: plotH, justifyContent: "space-between", paddingRight: 6 }}>
          <Text style={{ fontSize: 7, color: C.textMuted, textAlign: "right" }}>{zarShort(max)}</Text>
          <Text style={{ fontSize: 7, color: C.textMuted, textAlign: "right" }}>{zarShort(max / 2)}</Text>
          <Text style={{ fontSize: 7, color: C.textMuted, textAlign: "right" }}>R0</Text>
        </View>
        <Svg width={plotW} height={plotH}>
          {/* gridlines */}
          <Line x1={0} y1={0} x2={plotW} y2={0} stroke={C.border} strokeWidth={1} />
          <Line x1={0} y1={plotH / 2} x2={plotW} y2={plotH / 2} stroke={C.border} strokeWidth={1} />
          <Line x1={0} y1={plotH - 1} x2={plotW} y2={plotH - 1} stroke={C.border} strokeWidth={1} />
          {/* expense line */}
          <Polyline points={ptStr("expenseCents")} fill="none" stroke={C.expense} strokeWidth={1.6} />
          {/* income line */}
          <Polyline points={ptStr("incomeCents")} fill="none" stroke={C.teal} strokeWidth={1.6} />
          {data.map((d, i) => (
            <G key={i}>
              <Circle cx={xAt(i)} cy={yAt(d.expenseCents)} r={2} fill={C.expense} />
              <Circle cx={xAt(i)} cy={yAt(d.incomeCents)} r={2} fill={C.teal} />
            </G>
          ))}
        </Svg>
      </View>
      <View style={{ flexDirection: "row", paddingLeft: leftPad, marginTop: 4 }}>
        {data.map((d, i) => (
          <Text key={i} style={{ fontSize: 7, color: C.textMuted, width: plotW / Math.max(n, 1), textAlign: "center" }}>
            {d.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

function GroupedBarChart({ rows, width = 515, height = 130 }: { rows: ExpenseCategoryRow[]; width?: number; height?: number }) {
  const top = rows.filter((r) => r.budgetedCents > 0 || r.actualCents > 0).slice(0, 8);
  const max = Math.max(...top.flatMap((r) => [r.budgetedCents, r.actualCents]), 1);
  const groupW = Math.min(48, (width - 20) / Math.max(top.length, 1) - 6);
  const barW = groupW / 2 - 2;
  const chartH = height - 8;
  const gap = (width - 20 - groupW * top.length) / Math.max(top.length + 1, 1);
  return (
    <View>
      <Svg width={width} height={height}>
        <Line x1={0} y1={chartH} x2={width} y2={chartH} stroke={C.border} strokeWidth={1} />
        {top.map((r, i) => {
          const budgetH = (r.budgetedCents / max) * chartH;
          const actualH = (r.actualCents / max) * chartH;
          const x = gap + i * (groupW + gap);
          return (
            <G key={r.categoryId}>
              <Rect x={x} y={chartH - budgetH} width={barW} height={budgetH} fill={C.gold} rx={1} />
              <Rect
                x={x + barW + 2}
                y={chartH - actualH}
                width={barW}
                height={actualH}
                fill={r.overBudget ? C.expense : C.teal}
                rx={1}
              />
            </G>
          );
        })}
      </Svg>
      <View style={{ flexDirection: "row", marginTop: 4 }}>
        {top.map((r) => (
          <Text key={r.categoryId} style={{ fontSize: 6, color: C.textMuted, width: groupW + gap, textAlign: "center" }}>
            {r.categoryName.slice(0, 9)}
          </Text>
        ))}
      </View>
    </View>
  );
}

function ExpenseTable({ rows }: { rows: ExpenseCategoryRow[] }) {
  if (rows.length === 0) return <Text style={{ fontSize: 9, color: C.textMuted }}>No expense data for this period.</Text>;
  return (
    <View>
      <View style={styles.tableHeader}>
        <Text style={{ width: "28%" }}>Category</Text>
        <Text style={{ width: "16%", textAlign: "right" }}>Budgeted</Text>
        <Text style={{ width: "16%", textAlign: "right" }}>Actual</Text>
        <Text style={{ width: "16%", textAlign: "right" }}>Variance</Text>
        <Text style={{ width: "12%", textAlign: "right" }}>Var %</Text>
        <Text style={{ width: "12%", textAlign: "right" }}>Share</Text>
      </View>
      {rows.map((r, idx) => (
        <View key={r.categoryId} style={[styles.tableRow, idx % 2 === 1 ? { backgroundColor: C.rowAlt } : {}]}>
          <View style={{ width: "28%", flexDirection: "row", alignItems: "center" }}>
            <View style={[styles.dot, { backgroundColor: r.color }]} />
            <Text>{r.categoryName}</Text>
          </View>
          <Text style={{ width: "16%", textAlign: "right" }}>{r.budgetedCents > 0 ? zar(r.budgetedCents) : "—"}</Text>
          <Text style={{ width: "16%", textAlign: "right" }}>{zar(r.actualCents)}</Text>
          <Text style={{ width: "16%", textAlign: "right", color: varianceColor(r.varianceCents, r.overBudget) }}>
            {r.budgetedCents > 0 || r.actualCents > 0 ? `${r.varianceCents >= 0 ? "+" : ""}${zar(r.varianceCents)}` : "—"}
          </Text>
          <Text style={{ width: "12%", textAlign: "right", color: varianceColor(r.varianceCents, r.overBudget) }}>
            {r.variancePct != null ? `${r.variancePct}%` : "—"}
          </Text>
          <Text style={{ width: "12%", textAlign: "right" }}>{r.sharePct}%</Text>
        </View>
      ))}
    </View>
  );
}

export function BudgetReportDocument({ model, logoDataUri }: { model: ReportModel; logoDataUri?: string }) {
  const periodLabel = formatPeriodLabel(model.periodStart, model.periodEnd);
  const generated = new Date(model.generatedAt).toLocaleString("en-ZA", {
    timeZone: "Africa/Johannesburg",
    dateStyle: "medium",
    timeStyle: "short",
  });
  const donutData = model.expenseCategories.map((r) => ({ value: r.actualCents, color: r.color }));
  const topDonut = model.expenseCategories.slice(0, 6);

  return (
    <Document title="Fundi Finance — Budget Report" author="Fundi Finance">
      {/* ── Page 1 — Cover ────────────────────────────────────────────── */}
      <Page size="A4" style={styles.cover}>
        {/* faint watermark logo */}
        {logoDataUri && (
          <Image
            src={logoDataUri}
            style={{ position: "absolute", width: 320, height: 320, bottom: -40, right: -50, opacity: 0.06 }}
          />
        )}
        <View style={{ height: 6, backgroundColor: C.gold }} />
        <View style={{ paddingHorizontal: 48, paddingTop: 54 }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 60 }}>
            <Logo uri={logoDataUri} size={42} />
            <View style={{ marginLeft: 10 }}>
              <Text style={{ fontSize: 17, fontWeight: 700, color: C.white }}>Fundi Finance</Text>
              <Text style={{ fontSize: 9, color: C.teal, fontWeight: 700 }}>Master Your Money</Text>
            </View>
          </View>

          <Text style={{ fontSize: 12, color: C.gold, fontWeight: 700, letterSpacing: 1, marginBottom: 6 }}>
            BUDGET REPORT
          </Text>
          <Text style={{ fontSize: 30, fontWeight: 700, color: C.white, marginBottom: 18 }}>
            {periodLabel}
          </Text>
          <Text style={{ fontSize: 12, color: C.onNavyMuted }}>Prepared for</Text>
          <Text style={{ fontSize: 20, fontWeight: 700, color: C.teal, marginBottom: 4 }}>{model.displayName}</Text>
          <Text style={{ fontSize: 9, color: C.onNavyMuted, marginBottom: 36 }}>Generated {generated} (SAST)</Text>

          <View style={{ flexDirection: "row", gap: 10, marginBottom: 12 }}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Income</Text>
              <Text style={[styles.statValue, { color: C.teal }]}>{zar(model.totalIncomeCents)}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Expenses</Text>
              <Text style={[styles.statValue, { color: C.expense }]}>{zar(model.totalExpenseCents)}</Text>
            </View>
          </View>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Net</Text>
              <Text style={[styles.statValue, { color: model.netCents >= 0 ? C.teal : C.expense }]}>
                {model.netCents >= 0 ? "+" : ""}
                {zar(model.netCents)}
              </Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Savings rate</Text>
              <Text style={[styles.statValue, { color: C.gold }]}>{model.savingsRatePct}%</Text>
            </View>
          </View>
        </View>
      </Page>

      {/* ── Page 2 — Overview: budget vs actual + line chart ──────────── */}
      <Page size="A4" style={styles.page}>
        <PageHeader uri={logoDataUri} title="Overview" />
        <Text style={styles.sectionTitle}>Budget vs actual</Text>
        {model.budgetIsEstimate && <Text style={styles.badge}>Budget figures prorated — estimate</Text>}
        <View
          style={{
            flexDirection: "row",
            backgroundColor: C.rowAlt,
            borderRadius: 8,
            padding: 14,
            marginBottom: 22,
            justifyContent: "space-between",
          }}
        >
          {[
            { label: "Budgeted", value: model.totalBudgetedExpenseCents > 0 ? zar(model.totalBudgetedExpenseCents) : "—", color: C.text },
            { label: "Actual", value: zar(model.totalExpenseCents), color: C.expense },
            {
              label: "Variance",
              value:
                model.totalBudgetedExpenseCents > 0
                  ? `${model.budgetVarianceCents >= 0 ? "+" : ""}${zar(model.budgetVarianceCents)}`
                  : "—",
              color: model.budgetVarianceCents > 0 ? C.expense : C.teal,
            },
            { label: "% used", value: model.budgetUsedPct != null ? `${model.budgetUsedPct}%` : "—", color: C.navy },
          ].map((c) => (
            <View key={c.label}>
              <Text style={{ fontSize: 8, color: C.textMuted, textTransform: "uppercase", marginBottom: 4 }}>{c.label}</Text>
              <Text style={{ fontSize: 13, fontWeight: 700, color: c.color }}>{c.value}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Income vs expenses over time</Text>
        <View style={{ marginBottom: 22 }}>
          <LineChart data={model.monthlySpend} />
        </View>

        <Text style={styles.sectionTitle}>Budget vs actual by category</Text>
        <Text style={styles.sectionSub}>Gold = budgeted · Teal = actual (within budget) · Red = over budget</Text>
        <GroupedBarChart rows={model.expenseCategories} />
        <Footer />
      </Page>

      {/* ── Page 3 — Where the money went ─────────────────────────────── */}
      <Page size="A4" style={styles.page}>
        <PageHeader uri={logoDataUri} title="Where the money went" />
        <Text style={styles.sectionTitle}>Expense breakdown</Text>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
          <DonutChart rows={donutData} />
          <View style={{ flex: 1, paddingLeft: 24 }}>
            {topDonut.map((r) => (
              <View key={r.categoryId} style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
                <View style={[styles.dot, { backgroundColor: r.color }]} />
                <Text style={{ fontSize: 9, flex: 1 }}>{r.categoryName}</Text>
                <Text style={{ fontSize: 9, fontWeight: 700 }}>{zar(r.actualCents)}</Text>
                <Text style={{ fontSize: 8, color: C.textMuted, width: 36, textAlign: "right" }}>{r.sharePct}%</Text>
              </View>
            ))}
          </View>
        </View>

        <Text style={styles.sectionTitle}>Expenses by category</Text>
        <ExpenseTable rows={model.expenseCategories} />
        <Footer />
      </Page>

      {/* ── Page 4 — Income + insights ────────────────────────────────── */}
      <Page size="A4" style={styles.page}>
        <PageHeader uri={logoDataUri} title="Income & insights" />
        <Text style={styles.sectionTitle}>Income by category</Text>
        {model.incomeCategories.length === 0 ? (
          <Text style={{ fontSize: 9, color: C.textMuted, marginBottom: 16 }}>No income data for this period.</Text>
        ) : (
          <View style={{ marginBottom: 18 }}>
            <View style={styles.tableHeader}>
              <Text style={{ width: "55%" }}>Category</Text>
              <Text style={{ width: "25%", textAlign: "right" }}>Amount</Text>
              <Text style={{ width: "20%", textAlign: "right" }}>Share</Text>
            </View>
            {model.incomeCategories.map((r, idx) => (
              <View key={r.categoryId} style={[styles.tableRow, idx % 2 === 1 ? { backgroundColor: C.rowAlt } : {}]}>
                <Text style={{ width: "55%" }}>{r.categoryName}</Text>
                <Text style={{ width: "25%", textAlign: "right", color: C.teal }}>{zar(r.actualCents)}</Text>
                <Text style={{ width: "20%", textAlign: "right" }}>{r.sharePct}%</Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Top merchants</Text>
            <View style={styles.insightCard}>
              {model.topMerchants.length === 0 ? (
                <Text style={{ fontSize: 9, color: C.textMuted }}>No merchants.</Text>
              ) : (
                model.topMerchants.map((m, i) => (
                  <View key={i} style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 5 }}>
                    <Text style={{ fontSize: 8, flex: 1, marginRight: 6 }}>
                      {i + 1}. {m.description.slice(0, 28)}
                    </Text>
                    <Text style={{ fontSize: 8, fontWeight: 700 }}>{zar(m.totalCents)}</Text>
                  </View>
                ))
              )}
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Largest transactions</Text>
            <View style={styles.insightCard}>
              {model.largestTransactions.length === 0 ? (
                <Text style={{ fontSize: 9, color: C.textMuted }}>None.</Text>
              ) : (
                model.largestTransactions.map((t, i) => (
                  <View key={i} style={{ marginBottom: 5 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <Text style={{ fontSize: 8, flex: 1, marginRight: 6 }}>
                        {i + 1}. {t.description.slice(0, 24)}
                      </Text>
                      <Text style={{ fontSize: 8, fontWeight: 700 }}>{zar(t.cents)}</Text>
                    </View>
                    <Text style={{ fontSize: 7, color: C.textMuted }}>
                      {t.categoryName} · {t.date}
                    </Text>
                  </View>
                ))
              )}
            </View>
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Over budget</Text>
            {model.topOverBudget.length === 0 ? (
              <Text style={{ fontSize: 9, color: C.textMuted }}>None — nicely done.</Text>
            ) : (
              model.topOverBudget.map((r) => (
                <Text key={r.categoryId} style={[styles.insightItem, { color: C.expense }]}>
                  {r.categoryName} +{zar(r.varianceCents)} ({r.variancePct}%)
                </Text>
              ))
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Under budget</Text>
            {model.topUnderBudget.length === 0 ? (
              <Text style={{ fontSize: 9, color: C.textMuted }}>None.</Text>
            ) : (
              model.topUnderBudget.map((r) => (
                <Text key={r.categoryId} style={[styles.insightItem, { color: C.teal }]}>
                  {r.categoryName} {zar(r.varianceCents)} ({r.variancePct}%)
                </Text>
              ))
            )}
          </View>
        </View>
        <Footer />
      </Page>
    </Document>
  );
}

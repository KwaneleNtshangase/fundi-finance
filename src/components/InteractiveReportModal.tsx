"use client";

/**
 * Interactive in-app budget report.
 *
 * Renders the SAME report model the PDF is built from, but live and
 * explorable: hover a chart slice for details, tap a category to drill into
 * its transactions. The PDF stays as the static "download & share" export.
 */
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from "recharts";
import { supabase } from "@/lib/supabaseClient";
import { formatRand } from "@/lib/viewHelpers";
import { X, FileText, Lightbulb } from "@/components/icons/FundiIcons";
import type { ReportModel, InsightTone } from "@/lib/budget/report/types";

type LightEntry = {
  category: string;
  type: "income" | "expense";
  amount: number;
  description: string | null;
  entry_date: string;
};

type ReportData = { model: ReportModel; entries: LightEntry[] };

const TONE: Record<InsightTone, string> = {
  good: "#00A97A",
  warn: "#F0A030",
  bad: "#DE6B62",
  info: "#3B7DD8",
};

function zar(cents: number): string {
  return "R" + formatRand(Math.round(cents / 100));
}
function zarSigned(cents: number): string {
  return (cents < 0 ? "-R" : "+R") + formatRand(Math.abs(Math.round(cents / 100)));
}

export function InteractiveReportModal({
  open,
  onClose,
  periodStart,
  periodEnd,
  periodLabel,
  onDownloadPdf,
  downloadingPdf,
}: {
  open: boolean;
  onClose: () => void;
  periodStart: string;
  periodEnd: string;
  periodLabel: string;
  onDownloadPdf: () => void;
  downloadingPdf?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ReportData | null>(null);
  const [drill, setDrill] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      setDrill(null);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) { setError("Please sign in again."); setLoading(false); return; }
        const res = await fetch("/api/budget/report", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ periodStart, periodEnd, format: "json" }),
        });
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok || !json.ok) { setError(json.error || "Could not build the report."); }
        else setData({ model: json.model, entries: json.entries ?? [] });
      } catch {
        if (!cancelled) setError("Could not build the report.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, periodStart, periodEnd]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const model = data?.model;

  const consumptionRows = useMemo(
    () => (model?.expenseCategories ?? []).filter((r) => !r.isSavingsVehicle && r.actualCents > 0),
    [model]
  );
  const setAsideRows = useMemo(
    () => (model?.expenseCategories ?? []).filter((r) => r.isSavingsVehicle && r.actualCents > 0),
    [model]
  );
  const drillTxns = useMemo(() => {
    if (!drill || !data) return [];
    return data.entries
      .filter((e) => e.type === "expense" && e.category === drill)
      .sort((a, b) => b.amount - a.amount);
  }, [drill, data]);

  if (!open) return null;

  const bandColor = model
    ? model.insights.healthScore >= 60 ? TONE.good : model.insights.healthScore >= 40 ? TONE.warn : TONE.bad
    : TONE.info;

  return (
    <div className="fixed inset-0 z-[500] flex items-start justify-center" style={{ background: "rgba(0,0,0,0.6)", overflowY: "auto" }} role="dialog" aria-modal="true" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: "var(--color-bg)", width: "100%", maxWidth: 720, minHeight: "100%", boxShadow: "0 0 40px rgba(0,0,0,0.4)" }}
      >
        {/* Sticky header */}
        <div style={{ position: "sticky", top: 0, zIndex: 2, background: "var(--color-surface)", borderBottom: "1px solid var(--color-border)", padding: "14px 18px", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 900, fontSize: 16 }}>Budget report</div>
            <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{periodLabel}</div>
          </div>
          <button type="button" onClick={onDownloadPdf} disabled={downloadingPdf}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", borderRadius: 10, border: "1px solid var(--color-border)", background: "var(--color-bg)", color: "var(--color-text-primary)", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
            <FileText size={15} /> {downloadingPdf ? "..." : "PDF"}
          </button>
          <button type="button" onClick={onClose} aria-label="Close"
            style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)", borderRadius: 999, cursor: "pointer", padding: 7, display: "flex" }}>
            <X size={18} style={{ color: "var(--color-text-secondary)" }} />
          </button>
        </div>

        <div style={{ padding: "16px 18px 40px" }}>
          {loading && <div style={{ padding: 40, textAlign: "center", color: "var(--color-text-secondary)" }}>Building your report…</div>}
          {error && !loading && <div style={{ padding: 24, textAlign: "center", color: TONE.bad, fontWeight: 600 }}>{error}</div>}

          {model && !loading && (
            <>
              {/* Health hero */}
              <div style={{ background: "linear-gradient(135deg, #15294B, #0E1C38)", borderRadius: 16, padding: 18, marginBottom: 14, color: "#fff" }}>
                <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 0.6, color: "#9AA7BD" }}>Financial health</div>
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 4 }}>
                      <span style={{ fontSize: 40, fontWeight: 900, color: bandColor, lineHeight: 1 }}>{model.insights.healthScore}</span>
                      <span style={{ fontSize: 14, color: "#9AA7BD", marginBottom: 4 }}>/100</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: bandColor }}>{model.insights.healthBand}</div>
                </div>
                <div style={{ height: 7, background: "#0A1526", borderRadius: 4, marginBottom: 12, overflow: "hidden" }}>
                  <div style={{ width: `${model.insights.healthScore}%`, height: "100%", background: bandColor, borderRadius: 4 }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {model.insights.healthComponents.map((c) => (
                    <div key={c.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 7, height: 7, borderRadius: 4, background: TONE[c.tone], flexShrink: 0 }} />
                      <span style={{ fontSize: 12, fontWeight: 700, width: 120, flexShrink: 0 }}>{c.label} {c.score}/{c.max}</span>
                      <span style={{ fontSize: 11, color: "#9AA7BD", flex: 1 }}>{c.note}</span>
                    </div>
                  ))}
                </div>
                {model.insights.healthCapNote && (
                  <div style={{ fontSize: 11, color: "#E6B84C", marginTop: 8 }}>{model.insights.healthCapNote}</div>
                )}
              </div>

              {/* Key stats */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                <Stat label="Income" value={zar(model.totalIncomeCents)} color={TONE.good} delta={model.comparison?.incomeDeltaPct ?? null} goodWhenUp />
                <Stat label="Day-to-day spending" value={zar(model.consumptionCents)} color={TONE.bad} delta={model.comparison?.expenseDeltaPct ?? null} goodWhenUp={false} />
                <Stat label="Set aside" value={zar(model.setAsideCents)} color="#E6B84C" sub={`${model.savingsRatePct}% of income · aim 20%`} />
                <Stat label={model.netCents >= 0 ? "Surplus" : "Shortfall"} value={zarSigned(model.netCents)} color={model.netCents >= 0 ? TONE.good : TONE.bad} />
              </div>

              {/* At a glance */}
              {model.insights.highlights.length > 0 && (
                <Section title="At a glance">
                  {model.insights.highlights.map((h, i) => <ToneRow key={i} tone={h.tone} text={h.text} />)}
                </Section>
              )}

              {model.insights.dataQualityAlert && (
                <div style={{ background: "rgba(222,107,98,0.08)", border: "1px solid rgba(222,107,98,0.3)", borderRadius: 12, padding: 12, marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: TONE.bad, marginBottom: 3, textTransform: "uppercase" }}>Data quality</div>
                  <div style={{ fontSize: 13, lineHeight: 1.4 }}>{model.insights.dataQualityAlert}</div>
                </div>
              )}

              {/* Coach */}
              {model.insights.coachParagraphs.length > 0 && (
                <Section title="Fundi Coach" icon={<Lightbulb size={16} style={{ color: "#E6B84C" }} />}>
                  {model.insights.coachParagraphs.map((p, i) => (
                    <p key={i} style={{ fontSize: 13.5, lineHeight: 1.5, margin: i === 0 ? 0 : "8px 0 0" }}>{p}</p>
                  ))}
                </Section>
              )}

              {/* Wins / Risks */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                <div>
                  <h4 style={{ fontSize: 13, fontWeight: 800, margin: "0 0 8px" }}>Wins</h4>
                  {model.insights.wins.length ? model.insights.wins.map((w, i) => <ToneRow key={i} tone="good" text={w} small />) : <Muted>None this period.</Muted>}
                </div>
                <div>
                  <h4 style={{ fontSize: 13, fontWeight: 800, margin: "0 0 8px" }}>Risks</h4>
                  {model.insights.risks.length ? model.insights.risks.map((r, i) => <ToneRow key={i} tone="bad" text={r} small />) : <Muted>Nothing flagged.</Muted>}
                </div>
              </div>

              {/* Actions */}
              {model.insights.actions.length > 0 && (
                <Section title="Your next moves">
                  {model.insights.actions.map((a, i) => (
                    <div key={i} style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)", borderLeft: `3px solid ${a.isTopPriority ? TONE.bad : "#E6B84C"}`, borderRadius: 10, padding: 10, marginBottom: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                        <span style={{ fontWeight: 800, fontSize: 13.5, flex: 1 }}>{i + 1}. {a.title}</span>
                        {a.isTopPriority && <span style={{ fontSize: 9, fontWeight: 800, color: "#fff", background: TONE.bad, padding: "2px 6px", borderRadius: 4 }}>DO THIS FIRST</span>}
                      </div>
                      <div style={{ fontSize: 12.5, lineHeight: 1.4, color: "var(--color-text-secondary)" }}>{a.detail}</div>
                      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 5 }}>
                        {a.impact && <span style={{ fontSize: 11, fontWeight: 700, color: TONE.good }}>Impact: {a.impact}</span>}
                        {a.lesson && <Link href={`/lesson/${a.lesson.courseId}/${a.lesson.lessonId}`} style={{ fontSize: 11, fontWeight: 700, color: "var(--color-primary)", textDecoration: "none" }}>Lesson: {a.lesson.title} →</Link>}
                      </div>
                    </div>
                  ))}
                </Section>
              )}

              {/* Interactive spending donut */}
              <Section title="Where every rand went">
                <div style={{ fontSize: 11.5, color: "var(--color-text-secondary)", marginBottom: 8 }}>
                  Hover a slice for detail. Tap a category to see its transactions. Money set aside is listed separately.
                </div>
                {consumptionRows.length > 0 ? (
                  <div style={{ height: 240 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={consumptionRows.map((r) => ({ name: r.categoryName, value: r.actualCents / 100, id: r.categoryId, color: r.color }))}
                          dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={1}
                          onClick={(d: unknown) => { const p = d as { id?: string }; if (p?.id) setDrill((cur) => cur === p.id ? null : p.id!); }}
                        >
                          {consumptionRows.map((r) => (
                            <Cell key={r.categoryId} fill={r.color} style={{ cursor: "pointer", outline: "none", opacity: drill && drill !== r.categoryId ? 0.4 : 1 }} />
                          ))}
                        </Pie>
                        <Tooltip content={<SpendTooltip total={model.consumptionCents} />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : <Muted>No day-to-day spending recorded.</Muted>}

                {/* Category list (tap to drill) */}
                <div style={{ marginTop: 6 }}>
                  {consumptionRows.map((r) => (
                    <div key={r.categoryId}>
                      <button type="button" onClick={() => setDrill((cur) => cur === r.categoryId ? null : r.categoryId)}
                        style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "7px 4px", background: drill === r.categoryId ? "var(--color-surface)" : "transparent", border: "none", borderBottom: "1px solid var(--color-border)", cursor: "pointer", textAlign: "left", color: "var(--color-text-primary)" }}>
                        <div style={{ width: 9, height: 9, borderRadius: "50%", background: r.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>{r.categoryName}</span>
                        <span style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>{r.sharePct}%</span>
                        <span style={{ fontSize: 13, fontWeight: 800, width: 78, textAlign: "right" }}>{zar(r.actualCents)}</span>
                      </button>
                      {drill === r.categoryId && (
                        <div style={{ padding: "6px 4px 10px 24px", background: "var(--color-surface)" }}>
                          {drillTxns.length ? drillTxns.slice(0, 20).map((t, i) => (
                            <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 12, padding: "3px 0", color: "var(--color-text-secondary)" }}>
                              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.entry_date} · {t.description || "—"}</span>
                              <span style={{ fontWeight: 700, flexShrink: 0, color: "var(--color-text-primary)" }}>{zar(Math.round(t.amount * 100))}</span>
                            </div>
                          )) : <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>No itemised transactions.</div>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {setAsideRows.length > 0 && (
                  <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px dashed var(--color-border)" }}>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--color-text-secondary)", marginBottom: 4 }}>Money set aside (not spent)</div>
                    {setAsideRows.map((r) => (
                      <div key={r.categoryId} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 4px" }}>
                        <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#E6B84C", flexShrink: 0 }} />
                        <span style={{ fontSize: 13, flex: 1 }}>{r.categoryName}</span>
                        <span style={{ fontSize: 13, fontWeight: 800 }}>{zar(r.actualCents)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Section>

              {/* Monthly performance */}
              {model.monthlySpend.length >= 2 && (
                <Section title="Month by month">
                  <div style={{ height: 220 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={model.monthlySpend.map((m) => ({ name: m.label + (m.isPartial ? "*" : ""), Income: Math.round(m.incomeCents / 100), "Day-to-day": Math.round(m.consumptionCents / 100), "Set aside": Math.round(m.setAsideCents / 100) }))} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 10 }} tickFormatter={(v: number) => v >= 1000 ? `${Math.round(v / 1000)}k` : String(v)} />
                        <Tooltip formatter={(v) => "R" + formatRand(Number(v))} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Bar dataKey="Income" fill="#00A97A" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="Day-to-day" fill="#DE6B62" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="Set aside" fill="#E6B84C" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Section>
              )}

              {/* Benchmarks */}
              {model.insights.benchmarks.length > 0 && (
                <Section title="How you compare to guidelines">
                  {model.insights.benchmarks.map((b) => (
                    <div key={b.label} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid var(--color-border)" }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: TONE[b.tone], flexShrink: 0 }} />
                      <span style={{ fontSize: 12.5, flex: 1 }}>{b.label}</span>
                      <span style={{ fontSize: 12.5, fontWeight: 800, color: TONE[b.tone] }}>{b.value}</span>
                      <span style={{ fontSize: 11, color: "var(--color-text-secondary)", width: 110, textAlign: "right" }}>{b.target}</span>
                    </div>
                  ))}
                </Section>
              )}

              {/* Recurring */}
              {model.recurringCommitments.length > 0 && (
                <Section title="Recurring commitments">
                  {model.recurringCommitments.map((r) => (
                    <div key={r.description} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid var(--color-border)" }}>
                      <span style={{ fontSize: 13, flex: 1 }}>{r.description}<span style={{ fontSize: 11, color: "var(--color-text-secondary)" }}> · {r.categoryName}</span></span>
                      <span style={{ fontSize: 13, fontWeight: 800 }}>{zar(r.typicalCents)}<span style={{ fontSize: 10, color: "var(--color-text-secondary)", fontWeight: 600 }}>/mo</span></span>
                    </div>
                  ))}
                </Section>
              )}

              <p style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 8 }}>
                Educational insights based on your own data - not financial advice. Fundi Finance is not a registered financial services provider.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, color, sub, delta, goodWhenUp }: { label: string; value: string; color: string; sub?: string; delta?: number | null; goodWhenUp?: boolean }) {
  return (
    <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 12, padding: 12 }}>
      <div style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: 0.4, color: "var(--color-text-secondary)", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 900, color }}>{value}</div>
      {sub && <div style={{ fontSize: 10.5, color: "var(--color-text-secondary)", marginTop: 2 }}>{sub}</div>}
      {delta != null && (
        <div style={{ fontSize: 10.5, marginTop: 3, color: (delta >= 0) === !!goodWhenUp ? TONE.good : TONE.bad }}>
          {delta >= 0 ? "▲" : "▼"} {Math.abs(delta)}% vs previous
        </div>
      )}
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
        {icon}
        <h3 style={{ fontSize: 14, fontWeight: 800, margin: 0 }}>{title}</h3>
      </div>
      <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 12, padding: 12 }}>{children}</div>
    </div>
  );
}

function ToneRow({ tone, text, small }: { tone: InsightTone; text: string; small?: boolean }) {
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
      <div style={{ width: 7, height: 7, borderRadius: 4, background: TONE[tone], marginTop: 5, flexShrink: 0 }} />
      <span style={{ fontSize: small ? 12 : 13, lineHeight: 1.4 }}>{text}</span>
    </div>
  );
}

function Muted({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 12.5, color: "var(--color-text-secondary)" }}>{children}</div>;
}

function SpendTooltip({ active, payload, total }: { active?: boolean; payload?: Array<{ payload: { name: string; value: number; color: string } }>; total?: number }) {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0].payload;
  const pct = total && total > 0 ? Math.round((p.value * 100) / (total / 100)) : 0;
  return (
    <div style={{ background: "#15294B", color: "#fff", borderRadius: 8, padding: "8px 10px", fontSize: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: p.color }} />{p.name}
      </div>
      <div style={{ marginTop: 2 }}>R{formatRand(p.value)} · {pct}%</div>
    </div>
  );
}

export default InteractiveReportModal;

"use client";

import React, { useState } from "react";
import { AlertTriangle, CheckCircle2, FileUp, Shield, Upload, X } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { formatRand } from "@/lib/viewHelpers";
import type { PreviewTxn } from "@/lib/budget/types";
import { normaliseDescription } from "@/lib/budget/dedupe";

type PreviewRow = PreviewTxn & {
  categoryEdited?: boolean;
  rememberMerchant?: boolean;
};

type ParseResponse = {
  ok: boolean;
  bankHint?: string;
  fileType?: string;
  reconciliation?: {
    ok: boolean;
    warnings: string[];
    parsedCount: number;
  };
  statementReconciliation?: {
    ok: boolean;
    warnings: string[];
    parsedCount: number;
    parsedSignedSumCents: number;
  };
  transactions?: PreviewTxn[];
  importedCount?: number;
  skippedCount?: number;
  error?: string;
};

const EXPENSE_CATS = [
  { id: "food", label: "Food & Groceries" },
  { id: "transport", label: "Transport" },
  { id: "housing", label: "Housing/Rent" },
  { id: "debt", label: "Debt" },
  { id: "savings", label: "Savings" },
  { id: "entertainment", label: "Entertainment" },
  { id: "airtime", label: "Airtime & Data" },
  { id: "healthcare", label: "Healthcare" },
  { id: "education", label: "Education" },
  { id: "other", label: "Other" },
];

const INCOME_CATS = [
  { id: "salary", label: "Salary" },
  { id: "freelance", label: "Freelance" },
  { id: "business", label: "Business" },
  { id: "other-income", label: "Other Income" },
];

export function BudgetImportPanel({ onImported }: { onImported: () => void }) {
  const [open, setOpen] = useState(false);
  const [consent, setConsent] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<PreviewRow[]>([]);
  const [meta, setMeta] = useState<ParseResponse | null>(null);
  const [committing, setCommitting] = useState(false);

  const reset = () => {
    setFile(null);
    setRows([]);
    setMeta(null);
    setError(null);
    setConsent(false);
  };

  const handleParse = async () => {
    if (!file || !consent) return;
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        setError("Please sign in to import statements.");
        return;
      }
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/budget/import/parse", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const json = (await res.json()) as ParseResponse;
      if (!res.ok) {
        setError(json.error ?? "Parse failed");
        return;
      }
      setMeta(json);
      setRows(json.transactions ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Parse failed");
    } finally {
      setLoading(false);
    }
  };

  const handleCommit = async () => {
    setCommitting(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return;

      const commitRows = rows.map((r) => ({
        date: r.date,
        description: r.description,
        amountZAR: r.amountZAR,
        category: r.categorisation.category,
        type: r.categorisation.type,
        dedupeHash: r.dedupeHash,
        skipReason: r.skipReason,
        rememberMerchant: r.rememberMerchant,
        merchantPattern: r.rememberMerchant
          ? normaliseDescription(r.rawMerchant || r.description)
          : undefined,
      }));

      const res = await fetch("/api/budget/import/commit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fileName: file?.name,
          fileType: meta?.fileType,
          reconciled: meta?.reconciliation?.ok ?? false,
          reconciliationNote: meta?.reconciliation?.warnings?.join(" ") ?? null,
          statementReconciliation: meta?.statementReconciliation,
          allTransactions: rows.map((r) => ({
            date: r.date,
            description: r.description,
            amountZAR: r.amountZAR,
            rawMerchant: r.rawMerchant,
            lineIndex: r.lineIndex,
            balanceAfter: r.balanceAfter,
            externalId: r.externalId,
          })),
          rows: commitRows,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Import failed");
        return;
      }
      setOpen(false);
      reset();
      onImported();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed");
    } finally {
      setCommitting(false);
    }
  };

  const updateRow = (id: string, patch: Partial<PreviewRow>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const handleCategoryChange = (row: PreviewRow, category: string) => {
    updateRow(row.id, {
      categorisation: { ...row.categorisation, category },
      categoryEdited: true,
      rememberMerchant: true,
    });
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          background: "var(--color-surface)", color: "var(--color-primary)",
          border: "1.5px solid var(--color-primary)", borderRadius: 10,
          padding: "8px 14px", fontWeight: 700, fontSize: 14, cursor: "pointer",
        }}
      >
        <Upload size={16} aria-hidden /> Import statement
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[450] flex items-end justify-center bg-black/60" role="dialog" aria-modal="true">
      <div style={{
        background: "var(--color-surface)", borderRadius: "20px 20px 0 0",
        padding: "24px 20px 36px", width: "100%", maxWidth: 720, maxHeight: "92vh", overflowY: "auto",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h3 style={{ fontWeight: 900, fontSize: 18 }}>Import bank statement</h3>
          <button type="button" onClick={() => { setOpen(false); reset(); }} style={{ background: "none", border: "none", cursor: "pointer" }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 16, fontSize: 13, color: "var(--color-text-secondary)" }}>
          <Shield size={16} style={{ flexShrink: 0, marginTop: 2 }} />
          <span>Your statement is processed securely and the file is <strong>not stored</strong>. Only categorised transactions are saved.</span>
        </div>

        <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, fontSize: 13 }}>
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
          I consent to processing this statement for budget tracking (POPIA).
        </label>

        {rows.length === 0 ? (
          <>
            <label style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
              padding: 24, border: "2px dashed var(--color-border)", borderRadius: 12, cursor: "pointer", marginBottom: 16,
            }}>
              <FileUp size={32} style={{ color: "var(--color-text-secondary)" }} />
              <span style={{ fontWeight: 600 }}>{file ? file.name : "Choose CSV or OFX file"}</span>
              <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>Max 5 MB</span>
              <input type="file" accept=".csv,.ofx,.qfx" style={{ display: "none" }}
                onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </label>
            {error && <p style={{ color: "#E03C31", fontSize: 13, marginBottom: 12 }}>{error}</p>}
            <button type="button" className="btn btn-primary" style={{ width: "100%" }}
              disabled={!file || !consent || loading} onClick={handleParse}>
              {loading ? "Parsing…" : "Preview transactions"}
            </button>
          </>
        ) : (
          <>
            {rows.some((r) => r.refundLike && !r.skipReason) && (
              <div style={{ background: "rgba(33,150,243,0.08)", border: "1px solid rgba(33,150,243,0.25)", borderRadius: 10, padding: 12, marginBottom: 12, fontSize: 12, color: "var(--color-text-secondary)" }}>
                Credits and refunds import as <strong>income</strong> by default. Re-categorise refund lines if they should offset an expense instead.
              </div>
            )}
            {meta?.reconciliation && !meta.reconciliation.ok && (
              <div style={{ background: "rgba(255,152,0,0.1)", border: "1px solid rgba(255,152,0,0.3)", borderRadius: 10, padding: 12, marginBottom: 12, fontSize: 13 }}>
                <div style={{ display: "flex", gap: 8, fontWeight: 700, color: "#F57C00", marginBottom: 4 }}>
                  <AlertTriangle size={16} /> Reconciliation warning
                </div>
                {meta.reconciliation.warnings.map((w) => <div key={w}>{w}</div>)}
              </div>
            )}
            {meta?.bankHint && (
              <p style={{ fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 8 }}>
                Detected format: {meta.bankHint} · {meta.importedCount} to import
                {meta.skippedCount ? ` · ${meta.skippedCount} skipped (already imported)` : ""}
              </p>
            )}
            <div style={{ overflowX: "auto", marginBottom: 16 }}>
              <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ textAlign: "left", borderBottom: "1px solid var(--color-border)" }}>
                    <th style={{ padding: 8 }}>Date</th>
                    <th style={{ padding: 8 }}>Description</th>
                    <th style={{ padding: 8 }}>Amount</th>
                    <th style={{ padding: 8 }}>Category</th>
                    <th style={{ padding: 8 }}>Remember</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} style={{ opacity: r.skipReason ? 0.5 : 1 }}>
                      <td style={{ padding: 8 }}>{r.date}</td>
                      <td style={{ padding: 8, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis" }}>
                        {r.description}
                        {r.skipReason === "existing_import" && <span style={{ display: "block", fontSize: 10, color: "#9E9E9E" }}>Already imported</span>}
                        {r.refundLike && !r.skipReason && (
                          <span style={{ display: "block", fontSize: 10, color: "#1976D2" }}>Refund/credit — imports as income</span>
                        )}
                      </td>
                      <td style={{ padding: 8, fontWeight: 700 }}>{formatRand(Math.abs(r.amountZAR))}</td>
                      <td style={{ padding: 8 }}>
                        {!r.skipReason && (
                          <select
                            value={r.categorisation.category}
                            onChange={(e) => handleCategoryChange(r, e.target.value)}
                            style={{ fontSize: 12, padding: 4, borderRadius: 6, maxWidth: 140 }}
                          >
                            {(r.categorisation.type === "income" ? INCOME_CATS : EXPENSE_CATS).map((c) => (
                              <option key={c.id} value={c.id}>{c.label}</option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td style={{ padding: 8, textAlign: "center" }}>
                        {!r.skipReason && r.categoryEdited && (
                          <input
                            type="checkbox"
                            checked={r.rememberMerchant ?? false}
                            onChange={(e) => updateRow(r.id, { rememberMerchant: e.target.checked })}
                            title={`Remember "${r.rawMerchant || r.description}" for future imports`}
                            aria-label={`Remember merchant for ${r.description}`}
                          />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {error && <p style={{ color: "#E03C31", fontSize: 13, marginBottom: 12 }}>{error}</p>}
            <div style={{ display: "flex", gap: 10 }}>
              <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={reset}>Back</button>
              <button type="button" className="btn btn-primary" style={{ flex: 2 }}
                disabled={
                  committing
                  || rows.filter((r) => !r.skipReason).length === 0
                  || meta?.reconciliation?.ok === false
                }
                onClick={handleCommit}>
                {committing ? "Importing…" : (
                  <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                    <CheckCircle2 size={16} /> Import {rows.filter((r) => !r.skipReason).length} transactions
                  </span>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

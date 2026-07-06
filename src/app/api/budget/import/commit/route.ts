import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/apiAuth";
import { createServiceSupabase } from "@/lib/supabaseServer";
import { reconcileAfterImportSkips } from "@/lib/budget/reconciliation";
import { txnToBudgetEntryFields } from "@/lib/budget/types";
import type { NormalizedTxn, ReconciliationResult } from "@/lib/budget/types";

type CommitRow = {
  date: string;
  description: string;
  amountZAR: number;
  category: string;
  type: "income" | "expense";
  dedupeHash: string;
  skip?: boolean;
  skipReason?: "existing_import" | "user_removed";
  rememberMerchant?: boolean;
  merchantPattern?: string;
  accountLabel?: string;
  isTransfer?: boolean;
};

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as {
    fileName?: string;
    fileType?: "csv" | "ofx" | "pdf";
    accountLabel?: string;
    reconciled?: boolean;
    reconciliationNote?: string;
    statementReconciliation?: ReconciliationResult;
    allTransactions?: NormalizedTxn[];
    rows?: CommitRow[];
  };

  const allRows = body.rows ?? [];
  const admin = createServiceSupabase();

  const { data: existingRows } = await admin
    .from("budget_entries")
    .select("dedupe_hash")
    .eq("user_id", user.id)
    .not("dedupe_hash", "is", null);

  const existingHashes = new Set(
    (existingRows ?? []).map((r) => r.dedupe_hash as string).filter(Boolean)
  );

  const rowsToInsert = allRows.filter(
    (r) => !r.skip && !r.skipReason && !existingHashes.has(r.dedupeHash)
  );

  if (rowsToInsert.length === 0) {
    return NextResponse.json({ error: "No new transactions to import" }, { status: 400 });
  }

  if (body.statementReconciliation && body.allTransactions) {
    const postDedupe = reconcileAfterImportSkips(
      body.allTransactions,
      allRows,
      body.statementReconciliation
    );
    if (!postDedupe.ok) {
      return NextResponse.json(
        {
          error: "Reconciliation failed after dedupe - import blocked.",
          reconciliation: postDedupe,
        },
        { status: 409 }
      );
    }
  }

  // Block PDF import when statement reconciliation failed
  if (body.fileType === "pdf" && body.statementReconciliation && !body.statementReconciliation.ok) {
    return NextResponse.json(
      {
        error: "PDF statement failed reconciliation - review and fix before importing.",
        reconciliation: body.statementReconciliation,
      },
      { status: 409 }
    );
  }

  const { data: batch, error: batchError } = await admin
    .from("budget_import_batches")
    .insert({
      user_id: user.id,
      file_name: body.fileName ?? null,
      file_type: body.fileType ?? "csv",
      account_label: body.accountLabel ?? null,
      txn_count: allRows.length,
      imported_count: 0,
      skipped_count: allRows.length - rowsToInsert.length,
      reconciled: body.reconciled ?? false,
      reconciliation_note: body.reconciliationNote ?? null,
    })
    .select("id")
    .single();

  if (batchError || !batch) {
    return NextResponse.json({ error: batchError?.message ?? "Failed to create batch" }, { status: 500 });
  }

  // Account attribution handling
  let accountId: string | null = null;
  const institutionName = body.accountLabel || "Unknown Bank";
  
  if (institutionName) {
    // 1. Try to find an existing bank account by name
    const { data: bankAccounts, error: findError } = await admin
      .from("bank_accounts")
      .select("id")
      .eq("user_id", user.id)
      .eq("institution_name", institutionName)
      .limit(1);

    if (findError) {
      console.error("Error finding bank account:", findError);
    }

    if (bankAccounts && bankAccounts.length > 0) {
      accountId = bankAccounts[0].id;
    } else {
      // 2. If it doesn't exist, create it
      const { data: newBank, error: createError } = await admin
        .from("bank_accounts")
        .insert({
          user_id: user.id,
          institution_name: institutionName,
          custom_label: body.accountLabel ?? null,
        })
        .select("id")
        .single();
        
      if (createError) {
        console.error("Error creating bank account:", createError);
      } else if (newBank) {
        accountId = newBank.id;
      }
    }
  }

  const inserts = rowsToInsert.map((row) => {
    const { type, amount } = txnToBudgetEntryFields({ amountZAR: row.amountZAR });
    return {
      user_id: user.id,
      type: row.type ?? type,
      category: row.category,
      amount,
      description: row.description,
      entry_date: row.date,
      source: "import",
      import_batch_id: batch.id,
      dedupe_hash: row.dedupeHash,
      account_label: row.accountLabel ?? body.accountLabel ?? null,
      is_transfer: row.isTransfer ?? false,
      account_id: accountId,
      entry_method: "imported",
    };
  });

  const { error: insertError } = await admin.from("budget_entries").insert(inserts);
  if (insertError) {
    const isDuplicate =
      insertError.code === "23505" ||
      insertError.message.toLowerCase().includes("duplicate");
    return NextResponse.json(
      {
        error: isDuplicate
          ? "A transaction in this import already exists (dedupe conflict). Re-upload to refresh skips."
          : insertError.message,
      },
      { status: isDuplicate ? 409 : 500 }
    );
  }

  const merchantRules = rowsToInsert
    .filter((r) => r.rememberMerchant && r.merchantPattern?.trim() && !r.isTransfer)
    .map((r) => {
      const { type } = txnToBudgetEntryFields({ amountZAR: r.amountZAR });
      return {
        user_id: user.id,
        merchant_pattern: r.merchantPattern!.trim().toLowerCase(),
        category: r.category,
        type: r.type ?? type,
      };
    });

  if (merchantRules.length > 0) {
    const { error: rulesError } = await admin
      .from("user_merchant_rules")
      .upsert(merchantRules, { onConflict: "user_id,merchant_pattern" });
    if (rulesError) {
      return NextResponse.json({ error: rulesError.message }, { status: 500 });
    }
  }

  await admin
    .from("budget_import_batches")
    .update({ imported_count: rowsToInsert.length })
    .eq("id", batch.id);

  return NextResponse.json({
    ok: true,
    batchId: batch.id,
    importedCount: rowsToInsert.length,
    skippedCount: allRows.length - rowsToInsert.length,
  });
}

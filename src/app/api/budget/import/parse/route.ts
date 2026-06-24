import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/apiAuth";
import { createServiceSupabase } from "@/lib/supabaseServer";
import { parseStatement, inferFileType } from "@/lib/budget/parsers";
import { assignDedupeHashes, applyExistingImportSkips } from "@/lib/budget/dedupe";
import { reconcileAfterImportSkips } from "@/lib/budget/reconciliation";
import { isRefundLikeCredit } from "@/lib/budget/refunds";
import { categorise } from "@/lib/categorisation";
import type { PreviewTxn } from "@/lib/budget/types";

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: "File too large (max 5 MB)" }, { status: 400 });
    }

    const fileType = inferFileType(file.name, file.type);
    if (!fileType || fileType === "pdf") {
      return NextResponse.json({ error: "Unsupported file type. Use CSV or OFX." }, { status: 400 });
    }

    const text = await file.text();
    const parsed = parseStatement(text, fileType);

    const admin = createServiceSupabase();

    const { data: userRules } = await admin
      .from("user_merchant_rules")
      .select("merchant_pattern, category, type")
      .eq("user_id", user.id);

    const { data: existingRows } = await admin
      .from("budget_entries")
      .select("dedupe_hash")
      .eq("user_id", user.id)
      .not("dedupe_hash", "is", null);

    const existingHashes = new Set(
      (existingRows ?? []).map((r) => r.dedupe_hash as string).filter(Boolean)
    );

    const dedupeHashes = assignDedupeHashes(parsed.transactions);

    let preview: PreviewTxn[] = parsed.transactions.map((txn, i) => {
      const cat = categorise(txn, userRules ?? []);
      return {
        ...txn,
        id: `preview-${i}`,
        dedupeHash: dedupeHashes[i],
        categorisation: cat,
        refundLike: isRefundLikeCredit(txn),
      };
    });

    preview = applyExistingImportSkips(preview, existingHashes);

    const reconciliation = reconcileAfterImportSkips(
      parsed.transactions,
      preview,
      parsed.reconciliation
    );

    return NextResponse.json({
      ok: true,
      bankHint: parsed.bankHint,
      fileType: parsed.fileType,
      reconciliation,
      statementReconciliation: parsed.reconciliation,
      transactions: preview,
      importedCount: preview.filter((t) => !t.skipReason).length,
      skippedCount: preview.filter((t) => t.skipReason === "existing_import").length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

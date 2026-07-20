import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/apiAuth";
import { createServiceSupabase } from "@/lib/supabaseServer";

export const runtime = "nodejs";

/**
 * POPIA "right to be forgotten": self-service account + data deletion.
 * The signed-in user deletes their OWN account only (verified via their
 * session). We remove their app rows, then the auth user. This is
 * irreversible, so the UI must confirm before calling it.
 */
export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createServiceSupabase();

  // Remove app data first (best-effort; some tables cascade from the auth user).
  const tables = ["stokvel_contributions", "stokvel_members", "user_progress", "profiles"];
  for (const t of tables) {
    try {
      await admin.from(t).delete().eq("user_id", user.id);
    } catch {
      /* table may not exist or already cascaded; keep going */
    }
  }

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    return NextResponse.json({ error: `Could not delete account: ${error.message}` }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

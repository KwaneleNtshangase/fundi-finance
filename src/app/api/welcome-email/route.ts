import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/apiAuth";
import { createServiceSupabase } from "@/lib/supabaseServer";
import { buildWelcome, sendEmail, type EmailProfile } from "@/lib/emails/lifecycle";

export const runtime = "nodejs";

/**
 * Sends the welcome email on signup. Called from the onboarding flow with the
 * user's session token. Derives the recipient + name server-side (first name
 * or username, never a generic label) and only sends once per user.
 */
export async function POST(req: NextRequest) {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return NextResponse.json({ ok: true, skipped: "no-resend" });

  const user = await getUserFromRequest(req);
  if (!user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createServiceSupabase();
  const { data: profile } = await admin
    .from("profiles")
    .select("retention_fired, username, full_name, goal")
    .eq("user_id", user.id)
    .maybeSingle();

  const fired = String((profile as { retention_fired?: string } | null)?.retention_fired ?? "")
    .split(",").map((s) => s.trim()).filter(Boolean);
  if (fired.includes("welcome")) {
    return NextResponse.json({ ok: true, skipped: "already-sent" });
  }

  const email = buildWelcome((profile ?? {}) as EmailProfile);
  const res = await sendEmail(resendKey, user.email, email);
  if (!res.ok) return NextResponse.json({ error: res.detail }, { status: 500 });

  await admin.from("profiles").update({ retention_fired: [...fired, "welcome"].join(",") }).eq("user_id", user.id);
  return NextResponse.json({ ok: true });
}

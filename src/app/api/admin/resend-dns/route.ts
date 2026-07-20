import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getUserFromRequest } from "@/lib/apiAuth";
import { isAdminEmail, isAdminUser } from "@/lib/admin";

/** Admin-only: returns the exact DNS records Resend needs for the domain,
 *  read straight from the Resend API (so values aren't truncated). */
export async function GET(req: NextRequest) {
  // Build admin client first - needed for the DB-flag check.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const svcKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !svcKey) return NextResponse.json({ error: "Missing config" }, { status: 500 });
  const admin = createClient(url, svcKey);

  const user = await getUserFromRequest(req).catch(() => null);
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // DB flag is authoritative; ADMIN_EMAILS env var is a secondary fallback.
  const dbAdmin  = await isAdminUser(admin, user.id);
  const envAdmin = isAdminEmail(user.email);
  if (!dbAdmin && !envAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const key = process.env.RESEND_API_KEY;
  if (!key) return NextResponse.json({ error: "RESEND_API_KEY not set" }, { status: 500 });

  const id = req.nextUrl.searchParams.get("id");
  const resendUrl = id ? `https://api.resend.com/domains/${id}` : "https://api.resend.com/domains";
  const r = await fetch(resendUrl, { headers: { Authorization: `Bearer ${key}` } });
  const body = await r.json().catch(() => null);
  return NextResponse.json({ status: r.status, body });
}

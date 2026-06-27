import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/apiAuth";
import { isAdminEmail } from "@/lib/admin";

/** Admin-only: returns the exact DNS records Resend needs for the domain,
 *  read straight from the Resend API (so values aren't truncated). */
export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req).catch(() => null);
  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const key = process.env.RESEND_API_KEY;
  if (!key) return NextResponse.json({ error: "RESEND_API_KEY not set" }, { status: 500 });

  const id = req.nextUrl.searchParams.get("id");
  const url = id ? `https://api.resend.com/domains/${id}` : "https://api.resend.com/domains";
  const r = await fetch(url, { headers: { Authorization: `Bearer ${key}` } });
  const body = await r.json().catch(() => null);
  return NextResponse.json({ status: r.status, body });
}

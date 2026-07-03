import { NextRequest, NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getUserFromRequest } from "@/lib/apiAuth";
import { isAdminEmail } from "@/lib/admin";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Admin-only announcement broadcast.
 *
 * POST /api/admin/broadcast
 *   body: { dryRun?: boolean; confirm?: boolean; scheduledAt?: string }
 *
 * - dryRun (default true): returns the recipient count without sending.
 * - confirm: must be true for a real send.
 * - scheduledAt: ISO 8601. Defaults to 6 July 2026 08:00 SAST (06:00 UTC).
 *
 * Uses Resend's scheduled_at so delivery is handled by Resend at the set time.
 */

const DEFAULT_SCHEDULED_AT = "2026-07-06T06:00:00.000Z"; // 08:00 SAST (UTC+2)
const FROM = "Fundi Finance <hello@fundiapp.co.za>";
const SUBJECT = "New: build your budget by importing your bank statement";
const MAX_RECIPIENTS = 20000;

function adminClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

async function requireAdmin(req: NextRequest) {
  const user = await getUserFromRequest(req).catch(() => null);
  if (!user || !isAdminEmail(user.email)) return null;
  return user;
}

/** Enumerate every confirmed auth user's email, de-duplicated. */
async function listAllEmails(admin: SupabaseClient): Promise<string[]> {
  const seen = new Set<string>();
  const perPage = 1000;
  for (let page = 1; page <= 200; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(error.message);
    const users = data?.users ?? [];
    for (const u of users) {
      const email = (u.email ?? "").trim().toLowerCase();
      if (!email) continue;
      // Only people who confirmed their address and aren't banned.
      if (!u.email_confirmed_at && !u.confirmed_at) continue;
      const banned = (u as { banned_until?: string | null }).banned_until;
      if (banned && new Date(banned).getTime() > Date.now()) continue;
      seen.add(email);
    }
    if (users.length < perPage) break;
  }
  return [...seen];
}

function buildHtml(): string {
  return `
  <div style="margin:0;padding:0;background:#f4f5f7">
    <div style="max-width:560px;margin:0 auto;padding:24px 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#111827;line-height:1.6">
      <div style="text-align:center;padding:8px 0 20px">
        <span style="font-size:20px;font-weight:800;color:#007A4D">Fundi Finance</span>
      </div>
      <div style="background:#ffffff;border-radius:16px;padding:28px 24px">
        <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;color:#111827">Budgeting just got a whole lot easier</h1>
        <p style="margin:0 0 16px;font-size:15px;color:#374151">
          You no longer have to type in every transaction. Head to the <strong>Budget</strong> tab and import your bank statement, and Fundi builds your budget for you.
        </p>
        <div style="background:#EAF3EF;border-radius:12px;padding:16px 18px;margin:0 0 20px">
          <p style="margin:0 0 10px;font-size:14px;font-weight:700;color:#007A4D">What you can do now</p>
          <p style="margin:0 0 8px;font-size:14px;color:#374151">Import a statement (PDF or CSV) from SA banks like Capitec, FNB and Standard Bank, and see your money sorted automatically.</p>
          <p style="margin:0 0 8px;font-size:14px;color:#374151">Get a clear view of your income, expenses and savings rate for the month.</p>
          <p style="margin:0;font-size:14px;color:#374151">Export a clean report to keep or share.</p>
        </div>
        <div style="text-align:center;margin:0 0 8px">
          <a href="https://fundiapp.co.za/?tab=budget" style="display:inline-block;padding:13px 22px;background:#007A4D;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:700;font-size:15px">Try it now</a>
        </div>
        <p style="margin:18px 0 0;font-size:14px;color:#374151">Small steps, real progress. Team Fundi.</p>
      </div>
      <p style="text-align:center;margin:18px 0 0;font-size:11px;color:#9AA0A6">
        You're receiving this because you have a Fundi Finance account.<br/>
        Educational content only, not financial advice.
      </p>
    </div>
  </div>`;
}

function buildText(): string {
  return [
    "Budgeting just got a whole lot easier.",
    "",
    "You no longer have to type in every transaction. Head to the Budget tab and import your bank statement, and Fundi builds your budget for you.",
    "",
    "What you can do now:",
    "- Import a statement (PDF or CSV) from SA banks like Capitec, FNB and Standard Bank, and see your money sorted automatically.",
    "- Get a clear view of your income, expenses and savings rate for the month.",
    "- Export a clean report to keep or share.",
    "",
    "Try it now: https://fundiapp.co.za/?tab=budget",
    "",
    "Small steps, real progress. Team Fundi.",
    "",
    "You're receiving this because you have a Fundi Finance account. Educational content only, not financial advice.",
  ].join("\n");
}

async function scheduleOne(resendKey: string, to: string, scheduledAt: string) {
  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM,
      to: [to],
      subject: SUBJECT,
      html: buildHtml(),
      text: buildText(),
      scheduled_at: scheduledAt,
    }),
  });
  if (!resp.ok) {
    const detail = await resp.text();
    return { ok: false as const, detail: detail.slice(0, 200) };
  }
  return { ok: true as const };
}

export async function POST(req: NextRequest) {
  const user = await requireAdmin(req);
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = adminClient();
  if (!admin) return NextResponse.json({ error: "Supabase server credentials missing" }, { status: 500 });

  const body = (await req.json().catch(() => ({}))) as {
    dryRun?: boolean;
    confirm?: boolean;
    scheduledAt?: string;
  };
  const dryRun = body.dryRun !== false; // default true; must explicitly pass false
  const scheduledAt = body.scheduledAt || DEFAULT_SCHEDULED_AT;

  let emails: string[];
  try {
    emails = await listAllEmails(admin);
  } catch (e) {
    return NextResponse.json({ error: `Failed to list users: ${(e as Error).message}` }, { status: 500 });
  }

  if (emails.length > MAX_RECIPIENTS) {
    return NextResponse.json(
      { error: `Recipient count ${emails.length} exceeds safety cap ${MAX_RECIPIENTS}.` },
      { status: 400 }
    );
  }

  if (dryRun) {
    return NextResponse.json({
      dryRun: true,
      recipients: emails.length,
      scheduledAt,
      sample: emails.slice(0, 5),
    });
  }

  if (!body.confirm) {
    return NextResponse.json({ error: "confirm:true required for a real send" }, { status: 400 });
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return NextResponse.json({ error: "RESEND_API_KEY not configured" }, { status: 500 });

  let scheduled = 0;
  const errors: { to: string; detail: string }[] = [];
  const CHUNK = 8;
  for (let i = 0; i < emails.length; i += CHUNK) {
    const chunk = emails.slice(i, i + CHUNK);
    const results = await Promise.all(chunk.map((to) => scheduleOne(resendKey, to, scheduledAt)));
    results.forEach((r, idx) => {
      if (r.ok) scheduled++;
      else errors.push({ to: chunk[idx], detail: r.detail });
    });
    // small pause to stay well under Resend rate limits
    if (i + CHUNK < emails.length) await new Promise((res) => setTimeout(res, 600));
  }

  return NextResponse.json({
    dryRun: false,
    scheduledAt,
    totalRecipients: emails.length,
    scheduled,
    failed: errors.length,
    errors: errors.slice(0, 20),
  });
}

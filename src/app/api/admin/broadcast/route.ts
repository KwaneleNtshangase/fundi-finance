import { NextRequest, NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getUserFromRequest } from "@/lib/apiAuth";
import { isAdminEmail, isAdminUser } from "@/lib/admin";

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

async function requireAdmin(req: NextRequest, admin: SupabaseClient) {
  const user = await getUserFromRequest(req).catch(() => null);
  if (!user) return null;
  // DB flag is authoritative; ADMIN_EMAILS env var is a secondary fallback.
  const dbAdmin = await isAdminUser(admin, user.id);
  const envAdmin = isAdminEmail(user.email);
  if (!dbAdmin && !envAdmin) return null;
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
  const row = (text: string) =>
    `<tr>
        <td style="vertical-align:top;padding:0 10px 10px 0;color:#007A4D;font-size:15px;font-weight:800;line-height:1.5">&bull;</td>
        <td style="padding:0 0 10px;font-size:14px;color:#374151;line-height:1.5">${text}</td>
      </tr>`;
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;margin:0;padding:0">
    <tr><td align="center" style="padding:24px 12px">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif">
        <!-- Header band -->
        <tr><td style="background:#007A4D;border-radius:16px 16px 0 0;padding:30px 28px">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
            <td style="vertical-align:middle;padding-right:14px">
              <img src="https://fundiapp.co.za/Fundi_Finance_logo.png" width="44" height="44" alt="Fundi Finance" style="display:block;border:0;outline:none;text-decoration:none" />
            </td>
            <td style="vertical-align:middle">
              <div style="font-size:19px;font-weight:800;color:#ffffff;line-height:1.25">Fundi Finance</div>
              <div style="font-size:12px;color:#BFE6D4;letter-spacing:0.04em;padding-top:3px">Master Your Money</div>
            </td>
          </tr></table>
        </td></tr>
        <!-- Body box -->
        <tr><td style="background:#ffffff;border-radius:0 0 16px 16px;padding:30px 26px;color:#111827;line-height:1.6">
          <h1 style="margin:0 0 14px;font-size:22px;line-height:1.3;color:#111827;font-weight:800">Budgeting just got a whole lot easier</h1>
          <p style="margin:0 0 18px;font-size:15px;color:#374151">You no longer have to type in every transaction. Head to the <strong>Budget</strong> tab and import your bank statement, and Fundi builds your budget for you.</p>
          <p style="margin:0 0 10px;font-size:15px;font-weight:700;color:#111827">What you can do now</p>
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px">
            ${row("Import a statement (PDF or CSV) from SA banks like Capitec, FNB and Standard Bank, and see your money sorted automatically.")}
            ${row("Get a clear view of your income, expenses and savings rate for the month.")}
            ${row("Export a clean report to keep or share.")}
          </table>
          <div style="margin:0 0 6px">
            <a href="https://fundiapp.co.za" style="display:inline-block;padding:13px 24px;background:#007A4D;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:700;font-size:15px">Try it now</a>
          </div>
          <p style="margin:24px 0 0;font-size:15px;color:#374151">Small steps, real progress.<br/>Team Fundi</p>
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:16px 26px 0;text-align:center;font-size:11px;color:#9AA0A6;line-height:1.6">
          You're getting this because you have a Fundi Finance account.<br/>
          Educational content only, not financial advice.
        </td></tr>
      </table>
    </td></tr>
  </table>`;
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

async function scheduleOne(resendKey: string, to: string, scheduledAt?: string) {
  const payload: Record<string, unknown> = {
    from: FROM,
    to: [to],
    subject: scheduledAt ? SUBJECT : `[TEST] ${SUBJECT}`,
    html: buildHtml(),
    text: buildText(),
  };
  if (scheduledAt) payload.scheduled_at = scheduledAt;
  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!resp.ok) {
    const detail = await resp.text();
    return { ok: false as const, detail: detail.slice(0, 200) };
  }
  return { ok: true as const };
}

/** GET ?preview=1 returns the rendered email HTML (marketing copy, not sensitive). */
export async function GET(req: NextRequest) {
  const preview = new URL(req.url).searchParams.get("preview");
  if (!preview) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return new NextResponse(buildHtml(), { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

export async function POST(req: NextRequest) {
  const admin = adminClient();
  if (!admin) return NextResponse.json({ error: "Supabase server credentials missing" }, { status: 500 });
  const user = await requireAdmin(req, admin);
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as {
    dryRun?: boolean;
    confirm?: boolean;
    scheduledAt?: string;
    test?: boolean;
    testEmail?: string;
  };

  // Test send: deliver a single copy immediately to the admin (or a given address).
  if (body.test) {
    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) return NextResponse.json({ error: "RESEND_API_KEY not configured" }, { status: 500 });
    const to = (body.testEmail || user.email || "").trim();
    if (!to) return NextResponse.json({ error: "No test address available" }, { status: 400 });
    const r = await scheduleOne(resendKey, to); // no scheduledAt = send now
    if (!r.ok) return NextResponse.json({ error: `Test send failed: ${r.detail}` }, { status: 500 });
    return NextResponse.json({ test: true, sentTo: to });
  }

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

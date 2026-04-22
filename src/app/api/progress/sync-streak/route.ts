import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/** Returns SAST (UTC+2) date string YYYY-MM-DD */
function sastDate(offsetDays = 0): string {
  const d = new Date();
  // South Africa Standard Time is UTC+2 (no DST)
  d.setTime(d.getTime() + (2 * 60 + offsetDays * 24 * 60) * 60 * 1000);
  return d.toISOString().split("T")[0];
}

function isoToday() {
  return sastDate(0);
}

function isoYesterday() {
  return sastDate(-1);
}

export async function POST(req: NextRequest) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceKey || !url) {
    return NextResponse.json({ ok: false, error: "Missing Supabase server credentials." }, { status: 500 });
  }
  const admin = createClient(url, serviceKey);
  const { userId } = (await req.json()) as { userId?: string };
  if (!userId) return NextResponse.json({ ok: false, error: "Missing userId" }, { status: 400 });

  const { data } = await admin
    .from("user_progress")
    .select("streak,last_activity_date,freeze_count")
    .eq("user_id", userId)
    .maybeSingle();
  const today = isoToday();
  const yesterday = isoYesterday();
  // Normalise to "YYYY-MM-DD" — last_activity_date is a DATE column so this is a no-op,
  // but guards against any future schema changes.
  const lastActive = data?.last_activity_date
    ? String(data.last_activity_date).slice(0, 10)
    : null;
  const current = Number(data?.streak ?? 0);
  const freezeCount = Math.max(0, Number(data?.freeze_count ?? 0));

  let nextStreak = current;
  let nextFreezeCount = freezeCount;
  if (!lastActive) nextStreak = 1;          // first ever lesson → day 1
  else if (lastActive === today) nextStreak = Math.max(1, current);
  else if (lastActive === yesterday) nextStreak = Math.max(1, current) + 1;
  else if (freezeCount > 0) {
    nextStreak = current;
    nextFreezeCount = freezeCount - 1;
    console.info("[sync-streak] Consumed streak freeze", {
      userId,
      previousStreak: current,
      remainingFreezes: nextFreezeCount,
    });
  } else {
    // Streak lapsed (gap > 1 day, no freeze available).
    // Calling this endpoint means the user IS doing a lesson right now,
    // so today counts as day 1 of a fresh streak — never drop to 0.
    nextStreak = 1;
  }

  const { error: upsertError } = await admin.from("user_progress").upsert({
    user_id: userId,
    streak: nextStreak,
    freeze_count: nextFreezeCount,
    last_activity_date: today,
  }, { onConflict: "user_id" });

  if (upsertError) {
    console.error("[sync-streak] upsert failed:", upsertError);
    return NextResponse.json({ ok: false, error: upsertError.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    streak: nextStreak,
    lastActivityDate: today,
    freezeCount: nextFreezeCount,
  });
}

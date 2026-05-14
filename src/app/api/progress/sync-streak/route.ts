import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// South Africa Standard Time is UTC+2 with no daylight saving.
// All streak dates must be computed in SAST — not UTC — or a lesson done
// between 22:00 and 23:59 SA time gets stamped with the next UTC date,
// causing false streak gaps or frozen counts the following day.
function sastDate(offsetDays = 0): string {
  const SAST_OFFSET_MS = 2 * 60 * 60 * 1000; // UTC+2, no DST
  const d = new Date(Date.now() + SAST_OFFSET_MS + offsetDays * 24 * 60 * 60 * 1000);
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

  const { data, error } = await admin
    .from("user_progress")
    .select("streak,last_activity_date,streak_freeze_count,longest_streak")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("[sync-streak] DB read error:", error.message);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const today = isoToday();
  const yesterday = isoYesterday();
  const lastActive = data?.last_activity_date ? String(data.last_activity_date) : null;
  const current = Number(data?.streak ?? 0);
  const freezeCount = Math.max(0, Number(data?.streak_freeze_count ?? 0));
  const prevLongest = Number(data?.longest_streak ?? 0);

  let nextStreak = current;
  let nextFreezeCount = freezeCount;

  if (!lastActive) {
    // First ever lesson — start streak at 1
    nextStreak = 1;
  } else if (lastActive === today) {
    // Already did a lesson today — keep streak (at least 1)
    nextStreak = Math.max(current, 1);
  } else if (lastActive === yesterday) {
    // Consecutive day — increment
    nextStreak = current + 1;
  } else if (freezeCount > 0) {
    // Missed a day but has a freeze — consume it and keep streak
    nextStreak = current;
    nextFreezeCount = freezeCount - 1;
    console.info("[sync-streak] Consumed streak freeze", {
      userId,
      previousStreak: current,
      remainingFreezes: nextFreezeCount,
    });
  } else {
    // Missed one or more days with no freeze — start a new streak from today
    nextStreak = 1;
  }

  const nextLongest = Math.max(nextStreak, prevLongest);

  const { error: upsertError } = await admin.from("user_progress").upsert({
    user_id: userId,
    streak: nextStreak,
    streak_freeze_count: nextFreezeCount,
    longest_streak: nextLongest,
    last_activity_date: today,
  }, { onConflict: "user_id" });

  if (upsertError) {
    console.error("[sync-streak] DB write error:", upsertError.message);
    return NextResponse.json({ ok: false, error: upsertError.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    streak: nextStreak,
    longestStreak: nextLongest,
    lastActivityDate: today,
    freezeCount: nextFreezeCount,
  });
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/** Returns SAST (UTC+2) date string YYYY-MM-DD */
function sastDate(offsetDays = 0): string {
  const d = new Date();
  d.setTime(d.getTime() + (2 * 60 + offsetDays * 24 * 60) * 60 * 1000);
  return d.toISOString().split("T")[0];
}

function isoToday() {
  return sastDate(0);
}

function isoYesterday() {
  return sastDate(-1);
}

/**
 * Walk back from `startDate` through `history` counting consecutive days
 * that have XP > 0. Does NOT include `startDate` itself — caller adds today.
 * Handles streak freezes: if a 1-day gap is encountered and a freeze is
 * available, the gap is bridged and the freeze consumed.
 */
function countConsecutiveDays(
  history: Record<string, number>,
  startDate: string,
  maxFreezes: number
): { days: number; freezesUsed: number } {
  let days = 0;
  let freezesUsed = 0;
  const d = new Date(startDate + "T12:00:00Z");

  while (true) {
    const key = d.toISOString().slice(0, 10);
    if (history[key] && Number(history[key]) > 0) {
      days++;
      d.setUTCDate(d.getUTCDate() - 1);
    } else if (freezesUsed < maxFreezes) {
      // Check if there's an active day one step further back — if so, bridge the gap
      const nextD = new Date(d);
      nextD.setUTCDate(nextD.getUTCDate() - 1);
      const nextKey = nextD.toISOString().slice(0, 10);
      if (history[nextKey] && Number(history[nextKey]) > 0) {
        freezesUsed++;
        days++; // the frozen (skipped) day still counts toward streak
        d.setUTCDate(d.getUTCDate() - 1); // move past the gap
        // Next iteration will check the day before the gap
      } else {
        break;
      }
    } else {
      break;
    }
  }
  return { days, freezesUsed };
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
    .select("streak,last_activity_date,freeze_count,daily_xp_history")
    .eq("user_id", userId)
    .maybeSingle();

  const today = isoToday();
  const yesterday = isoYesterday();
  const lastActive = data?.last_activity_date
    ? String(data.last_activity_date).slice(0, 10)
    : null;
  const storedStreak = Number(data?.streak ?? 0);
  const storedFreeze = Math.max(0, Number(data?.freeze_count ?? 0));
  // daily_xp_history is written by finalizeCurrentLesson (keyed by UTC date).
  // It may or may not have today's entry yet — that is fine: we always count
  // today as active (user is calling this endpoint because they finished a lesson).
  const history = (data?.daily_xp_history ?? {}) as Record<string, number>;
  const hasHistory = Object.keys(history).length > 0;

  let nextStreak: number;
  let nextFreezeCount = storedFreeze;

  if (lastActive === today) {
    // User already completed a lesson today — don't re-count.
    // Keep the streak that was set on the first lesson of the day.
    nextStreak = Math.max(1, storedStreak);
  } else if (hasHistory) {
    // Recompute from ground-truth daily_xp_history.
    // Walk back from yesterday; add 1 for today (user is here right now).
    const { days: daysBeforeToday, freezesUsed } = countConsecutiveDays(
      history,
      yesterday,
      storedFreeze
    );
    nextStreak = daysBeforeToday + 1;
    nextFreezeCount = storedFreeze - freezesUsed;
  } else {
    // No history yet (brand-new user or history not yet populated).
    // Fall back to the classic incremental logic so first-time users get a
    // correct streak without needing historical data.
    if (!lastActive) nextStreak = 1;
    else if (lastActive === yesterday) nextStreak = Math.max(1, storedStreak) + 1;
    else if (storedFreeze > 0) {
      nextStreak = storedStreak;
      nextFreezeCount = storedFreeze - 1;
      console.info("[sync-streak] Consumed streak freeze (no-history path)", {
        userId,
        streak: nextStreak,
        remainingFreezes: nextFreezeCount,
      });
    } else {
      nextStreak = 1;
    }
  }

  nextStreak = Math.max(1, nextStreak);

  const { error: upsertError } = await admin.from("user_progress").upsert(
    {
      user_id: userId,
      streak: nextStreak,
      freeze_count: nextFreezeCount,
      last_activity_date: today,
    },
    { onConflict: "user_id" }
  );

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

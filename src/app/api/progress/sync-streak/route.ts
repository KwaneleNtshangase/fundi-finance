import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function isoToday() {
  return new Date().toISOString().split("T")[0];
}

function isoYesterday() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
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
    .select("streak,last_activity_date,freeze_count,streak_freezes")
    .eq("user_id", userId)
    .maybeSingle();
  const today = isoToday();
  const yesterday = isoYesterday();
  const lastActive = data?.last_activity_date ? String(data.last_activity_date) : null;
  const current = Number(data?.streak ?? 0);
  const freezeCount = Math.max(
    0,
    Number((data as any)?.streak_freezes ?? (data as any)?.freeze_count ?? 0)
  );

  let nextStreak = current;
  let nextFreezeCount = freezeCount;
  if (!lastActive) nextStreak = 0;
  else if (lastActive === today) nextStreak = current;
  else if (lastActive === yesterday) nextStreak = current + 1;
  else if (freezeCount > 0) {
    nextStreak = current;
    nextFreezeCount = freezeCount - 1;
    console.info("[sync-streak] Consumed streak freeze", {
      userId,
      previousStreak: current,
      remainingFreezes: nextFreezeCount,
    });
  } else {
    nextStreak = 0;
  }

  await admin.from("user_progress").upsert({
    user_id: userId,
    streak: nextStreak,
    freeze_count: nextFreezeCount,
    streak_freezes: nextFreezeCount,
    last_activity_date: today,
  }, { onConflict: "user_id" });

  return NextResponse.json({
    ok: true,
    streak: nextStreak,
    lastActivityDate: today,
    freezeCount: nextFreezeCount,
  });
}

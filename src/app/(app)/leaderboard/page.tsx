"use client";

import { LeaderboardView } from "@/components/LeaderboardView";
import { useFundi } from "@/context/FundiContext";

export default function LeaderboardPage() {
  const { userData, weeklyXp } = useFundi();

  return (
    <LeaderboardView
      xp={userData?.xp ?? 0}
      weeklyXp={weeklyXp}
      currentUserId={undefined} // Matches what was in pageViews.tsx
    />
  );
}

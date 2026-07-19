"use client";

import { LeaderboardView } from "@/components/LeaderboardView";
import { useNotho } from "@/context/NothoContext";

export default function LeaderboardPage() {
  const { userData, weeklyXp } = useNotho();

  return (
    <LeaderboardView
      xp={userData?.xp ?? 0}
      weeklyXp={weeklyXp}
      currentUserId={undefined} // Matches what was in pageViews.tsx
    />
  );
}

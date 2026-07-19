"use client";

import React from "react";
import { QuestsView } from "@/components/views/QuestsView";
import { useNotho } from "@/context/NothoContext";

export default function QuestsPage() {
  const {
    dailyXP,
    dailyGoal,
    weeklyChallenge,
    weeklyProgress,
    challengeProgress,
    challengeComplete,
    challengeRewardClaimed,
    claimChallengeReward,
    addXP,
    userData,
  } = useNotho();

  return (
    <QuestsView
      dailyXP={dailyXP}
      dailyGoal={dailyGoal}
      weeklyChallenge={weeklyChallenge}
      weeklyProgress={weeklyProgress}
      challengeProgress={challengeProgress}
      challengeComplete={challengeComplete}
      challengeRewardClaimed={challengeRewardClaimed}
      claimChallengeReward={claimChallengeReward}
      streak={userData?.streak ?? 0}
      addXP={addXP}
    />
  );
}

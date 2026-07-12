"use client";

import React from "react";
import { FundiProvider, useFundi } from "@/context/FundiContext";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { DesktopSidebar } from "@/components/DesktopSidebar";
import {
  FundiLearn,
  FundiCalculate,
  FundiBudget,
  FundiGoals,
  FundiProgress,
  FundiProfile,
} from "@/components/icons/FundiIcons";
import { usePathname } from "next/navigation";
import { StatsPanel } from "@/components/StatsPanel";

function AppNavigation() {
  const { setRoute } = useFundi();
  const pathname = usePathname() || "/";
  const is = (p: string) => pathname.startsWith(p);

  const handleNav = (name: string) => {
    // We just dispatch setRoute; the FundiContext will do router.push()
    setRoute({ name: name as never });
  };

  return (
    <MobileBottomNav
      items={[
        {
          key: "learn",
          label: "Learn",
          icon: <FundiLearn size={24} className="text-current" />,
          isActive: is("/learn") || is("/course") || is("/lesson") || pathname === "/",
          onClick: () => handleNav("learn"),
          order: "order-1",
        },
        {
          key: "calculator",
          label: "Calculate",
          icon: <FundiCalculate size={24} className="text-current" />,
          isActive: is("/calculator"),
          onClick: () => handleNav("calculator"),
          order: "order-2",
        },
        {
          key: "budget",
          label: "Budget",
          icon: <FundiBudget size={24} className="text-current" />,
          isActive: is("/budget"),
          onClick: () => handleNav("budget"),
          order: "order-3",
        },
        {
          key: "quests",
          label: "Goals",
          icon: <FundiGoals size={24} className="text-current" />,
          isActive: is("/quests"),
          onClick: () => handleNav("quests"),
          order: "order-4",
        },
        {
          key: "progress",
          label: "Leaderboard",
          icon: <FundiProgress size={24} className="text-current" />,
          isActive: is("/leaderboard"),
          onClick: () => handleNav("leaderboard"),
          order: "order-5",
        },
        {
          key: "profile",
          label: "Profile",
          icon: <FundiProfile size={24} className="text-current" />,
          isActive: is("/profile"),
          onClick: () => handleNav("profile"),
          order: "order-6",
        },
      ]}
    />
  );
}

import { AuthGate } from "@/components/AuthGate";
import { NotificationOptIn } from "@/components/NotificationOptIn";
import { StreakRepairBanner } from "@/components/StreakRepairBanner";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <FundiProvider>
      <AuthGate>
        <div className="app-container">
          <DesktopSidebar />
          <div 
            className={`main-content ${(pathname === "/learn" || pathname === "/") ? "main-with-stats" : ""}`}
            style={{ display: 'flex', flexDirection: 'column' }}
          >
            <div style={{ paddingBottom: "70px", flex: 1, display: 'flex', flexDirection: 'column' }}>{children}</div>
          </div>
          {(pathname === "/learn" || pathname === "/") && (
            <StatsPanelWrapper />
          )}
        </div>
        <AppNavigation />
        <NotificationOptIn />
        <StreakRepairBanner />
      </AuthGate>
    </FundiProvider>
  );
}

function StatsPanelWrapper() {
  const { userData, hearts, maxHearts, freezeCount, buyStreakFreeze, useFreeze } = useFundi();
  
  if (!userData) return null;

  const handleBuyFreeze = () => buyStreakFreeze();
  const handleUseFreeze = () => useFreeze();
  const freezeUsedToday = userData.lessonsToday > 0 && freezeCount > 0;

  return (
    <StatsPanel
      userData={userData}
      hearts={hearts}
      maxHearts={maxHearts}
      freezeCount={freezeCount}
      onBuyFreeze={handleBuyFreeze}
      onUseFreeze={handleUseFreeze}
      freezeUsedToday={freezeUsedToday}
    />
  );
}

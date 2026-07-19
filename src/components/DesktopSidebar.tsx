"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { useNotho } from "@/context/NothoContext";
import {
  NothoLearn,
  NothoCalculate,
  NothoBudget,
  NothoGoals,
  NothoProgress as NothoLeaderboard,
  NothoProfile,
} from "@/components/icons/NothoIcons";

/** Which nav item should be highlighted, derived from the real URL. */
function activeKeyFromPath(pathname: string): string {
  if (pathname.startsWith("/budget")) return "budget";
  if (pathname.startsWith("/calculator")) return "calculator";
  if (pathname.startsWith("/quests")) return "quests";
  if (pathname.startsWith("/leaderboard")) return "leaderboard";
  if (pathname.startsWith("/profile")) return "profile";
  // learn, course, lesson and the root all live under "Learn"
  return "learn";
}

export function DesktopSidebar() {
  const { setRoute } = useNotho();
  const pathname = usePathname() || "/";
  const active = activeKeyFromPath(pathname);

  const handleNav = (name: string) => {
    setRoute({ name: name as never });
  };

  return (
    <nav className="sidebar" style={{ background: "var(--color-bg)", border: "none" }}>
      {/* Branded sidebar header */}
      <div style={{
        padding: "20px 20px 16px",
        borderBottom: "1px solid var(--color-border)",
        marginBottom: 8,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <img
            src="/notho-logo.png"
            alt="Notho"
            width={36}
            height={36}
            style={{ borderRadius: 8, flexShrink: 0, objectFit: "contain" }}
          />
          <div>
            <div style={{ fontSize: 16, fontWeight: 900, color: "var(--color-text-primary)", lineHeight: 1.1 }}>
              Notho
            </div>
            <div style={{ fontSize: 11, color: "var(--color-text-secondary)", letterSpacing: "0.04em" }}>
              Master Your Money
            </div>
          </div>
        </div>
      </div>
      <ul className="nav-menu">
        <li className="nav-item">
          <button
            className={`nav-link ${active ==="learn" ? "active" : ""}`}
            style={active !=="learn" ? { color: "var(--nav-link-color)" } : {}}
            onClick={() => handleNav("learn")}
          >
            <span className="nav-icon">
              <NothoLearn size={20} className="text-current" />
            </span>
            Learn
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${active ==="calculator" ? "active" : ""}`}
            style={active !=="calculator" ? { color: "var(--nav-link-color)" } : {}}
            onClick={() => handleNav("calculator")}
          >
            <span className="nav-icon">
              <NothoCalculate size={20} className="text-current" />
            </span>
            Calculate
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${active ==="budget" ? "active" : ""}`}
            style={active !=="budget" ? { color: "var(--nav-link-color)" } : {}}
            onClick={() => handleNav("budget")}
          >
            <span className="nav-icon">
              <NothoBudget size={20} className="text-current" />
            </span>
            Budget
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${active ==="quests" ? "active" : ""}`}
            style={active !=="quests" ? { color: "var(--nav-link-color)" } : {}}
            onClick={() => handleNav("quests")}
          >
            <span className="nav-icon">
              <NothoGoals size={20} className="text-current" />
            </span>
            Goals
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${active ==="leaderboard" ? "active" : ""}`}
            style={active !=="leaderboard" ? { color: "var(--nav-link-color)" } : {}}
            onClick={() => handleNav("leaderboard")}
          >
            <span className="nav-icon">
              <NothoLeaderboard size={20} className="text-current" />
            </span>
            Leaderboard
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${active ==="profile" ? "active" : ""}`}
            style={active !=="profile" ? { color: "var(--nav-link-color)" } : {}}
            onClick={() => handleNav("profile")}
          >
            <span className="nav-icon">
              <NothoProfile size={20} className="text-current" />
            </span>
            Profile
          </button>
        </li>
      </ul>
    </nav>
  );
}

"use client";

import React from "react";
import { useFundi } from "@/context/FundiContext";
import {
  FundiLearn,
  FundiCalculate,
  FundiBudget,
  FundiGoals,
  FundiProgress as FundiLeaderboard,
  FundiProfile,
} from "@/components/icons/FundiIcons";

export function DesktopSidebar() {
  const { route, setRoute } = useFundi();

  const handleNav = (name: string) => {
    setRoute({ name: name as any });
  };

  return (
    <nav className="sidebar" style={{ background: "var(--sidebar-bg)", borderRightColor: "var(--color-border)" }}>
      {/* Branded sidebar header */}
      <div style={{
        padding: "20px 20px 16px",
        borderBottom: "1px solid var(--color-border)",
        marginBottom: 8,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <img
            src="/fundi-logo.png"
            alt="Fundi Finance"
            width={36}
            height={36}
            style={{ borderRadius: 8, flexShrink: 0, objectFit: "contain" }}
          />
          <div>
            <div style={{ fontSize: 16, fontWeight: 900, color: "var(--color-text-primary)", lineHeight: 1.1 }}>
              Fundi Finance
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
            className={`nav-link ${route.name === "learn" ? "active" : ""}`}
            style={route.name !== "learn" ? { color: "var(--nav-link-color)" } : {}}
            onClick={() => handleNav("learn")}
          >
            <span className="nav-icon">
              <FundiLearn size={20} className="text-current" />
            </span>
            Learn
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${route.name === "calculator" ? "active" : ""}`}
            style={route.name !== "calculator" ? { color: "var(--nav-link-color)" } : {}}
            onClick={() => handleNav("calculator")}
          >
            <span className="nav-icon">
              <FundiCalculate size={20} className="text-current" />
            </span>
            Calculate
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${route.name === "budget" ? "active" : ""}`}
            style={route.name !== "budget" ? { color: "var(--nav-link-color)" } : {}}
            onClick={() => handleNav("budget")}
          >
            <span className="nav-icon">
              <FundiBudget size={20} className="text-current" />
            </span>
            Budget
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${route.name === "quests" ? "active" : ""}`}
            style={route.name !== "quests" ? { color: "var(--nav-link-color)" } : {}}
            onClick={() => handleNav("quests")}
          >
            <span className="nav-icon">
              <FundiGoals size={20} className="text-current" />
            </span>
            Goals
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${route.name === "leaderboard" ? "active" : ""}`}
            style={route.name !== "leaderboard" ? { color: "var(--nav-link-color)" } : {}}
            onClick={() => handleNav("leaderboard")}
          >
            <span className="nav-icon">
              <FundiLeaderboard size={20} className="text-current" />
            </span>
            Progress
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${route.name === "profile" ? "active" : ""}`}
            style={route.name !== "profile" ? { color: "var(--nav-link-color)" } : {}}
            onClick={() => handleNav("profile")}
          >
            <span className="nav-icon">
              <FundiProfile size={20} className="text-current" />
            </span>
            Profile
          </button>
        </li>
      </ul>
    </nav>
  );
}

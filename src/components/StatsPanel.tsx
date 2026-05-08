"use client";

import { Flame, Heart, Shield, Target, Zap, Share2 } from "lucide-react";
import { formatWithSpaces } from "@/lib/formatters";
import { generateShareText, type UserData } from "@/app/pageViews.types";

export function StatsPanel({
  userData,
  hearts = 5,
  maxHearts = 5,
  freezeCount = 0,
  onBuyFreeze,
  onUseFreeze,
  freezeUsedToday = false,
}: {
  userData: UserData;
  hearts?: number;
  maxHearts?: number;
  freezeCount?: number;
  onBuyFreeze?: () => void;
  onUseFreeze?: () => void;
  freezeUsedToday?: boolean;
}) {
  // If the user already did a lesson today their streak is already safe
  const streakSafeToday = userData.lessonsToday > 0;
  const goalProgress = Math.min(
    (userData.dailyXP / userData.dailyGoal) * 100,
    100
  );

  return (
    <aside className="stats-panel" id="statsPanel">
      <div className="stats-section">
        <h3>My Stats</h3>
        <div className="stat-item" style={{ position: "relative" }}>
          <div className="stat-icon" style={{ position: "relative" }}>
            <Flame
              size={28}
              style={{
                color: userData.lessonsToday > 0 ? "#FF9500" : undefined,
                filter: userData.lessonsToday > 0 ? "none" : "grayscale(1) opacity(0.4)",
                transition: "filter 0.3s, color 0.3s",
              }}
            />
          </div>
          <div className="stat-content" style={{ flex: 1 }}>
            <div
              className="stat-label"
              style={{ color: userData.lessonsToday > 0 ? undefined : "var(--text-muted, #888)" }}
            >
              Day Streak
            </div>
            <div
              className="stat-value"
              id="streakValue"
              style={{ color: userData.lessonsToday > 0 ? undefined : "var(--text-muted, #888)" }}
            >
              {userData.streak}
            </div>
          </div>
          <button
            type="button"
            onClick={async () => {
              const text = generateShareText("streak", { streakDays: userData.streak });
              if (typeof navigator !== "undefined" && navigator.share) {
                try {
                  await navigator.share({ text });
                  return;
                } catch {
                  /* ignore */
                }
              }
              window.open(
                `https://wa.me/?text=${encodeURIComponent(text)}`,
                "_blank",
                "noopener,noreferrer"
              );
            }}
            className="text-orange-400 hover:text-orange-600"
            title="Share your streak"
            aria-label="Share your streak"
            style={{ background: "none", border: "none", cursor: "pointer", padding: 4, flexShrink: 0 }}
          >
            <Share2 size={18} aria-hidden />
          </button>
        </div>

        <div className="stat-item">
          <div className="stat-icon">
            <Zap size={28} className="text-current" />
          </div>
          <div className="stat-content">
            <div className="stat-label">Total XP</div>
            <div className="stat-value" id="xpValue">
              {formatWithSpaces(userData.xp)}
            </div>
          </div>
        </div>

        <div className="stat-item">
          <div className="stat-icon">
            <Heart size={28} className="text-current" style={{ color: "#E03C31" }} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Hearts</div>
            <div className="stat-value" id="heartsValue">
              {hearts}/{maxHearts}
            </div>
          </div>
        </div>

        {/* Streak Freeze */}
        <div className="stat-item" style={{ alignItems: "flex-start" }}>
          <div className="stat-icon" style={{ color: "#3B82F6" }}>
            <Shield size={28} />
          </div>
          <div className="stat-content" style={{ flex: 1 }}>
            <div className="stat-label">Streak Freezes</div>
            <div className="stat-value" style={{ color: freezeCount > 0 ? "#3B82F6" : "var(--color-text-secondary)" }}>
              {freezeCount}
            </div>
            {streakSafeToday && (
              <div style={{ fontSize: 11, color: "#22C55E", marginTop: 4, fontWeight: 600 }}>
                ✓ Lesson done. Streak safe!
              </div>
            )}
            {!streakSafeToday && freezeUsedToday && (
              <div style={{ fontSize: 11, color: "#3B82F6", marginTop: 4, fontWeight: 600 }}>
                ✓ Streak protected today
              </div>
            )}
            {!streakSafeToday && !freezeUsedToday && freezeCount > 0 && onUseFreeze && (
              <button
                type="button"
                onClick={onUseFreeze}
                style={{
                  marginTop: 6,
                  background: "#3B82F6",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "5px 12px",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  width: "100%",
                }}
                title="Protect your streak for today if you can't do a lesson"
              >
                🛡️ Use Freeze
              </button>
            )}
            {!streakSafeToday && freezeCount === 0 && !freezeUsedToday && (
              <div style={{ fontSize: 10, color: "var(--color-text-secondary)", marginTop: 2 }}>
                Resets every Monday
              </div>
            )}
          </div>
        </div>

        <div className="stat-item">
          <div className="stat-icon">
            <Target size={28} className="text-current" />
          </div>
          <div className="stat-content">
            <div className="stat-label">Level</div>
            <div className="stat-value" id="levelValue">
              {userData.level}
            </div>
            <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 4 }}>
              {(() => {
                const levels = [
                  { min: 0, max: 499 },
                  { min: 500, max: 1499 },
                  { min: 1500, max: 2999 },
                  { min: 3000, max: 4999 },
                  { min: 5000, max: Infinity },
                ];
                const currentLevel = userData.level - 1;
                if (currentLevel < 0 || currentLevel >= levels.length) return null;
                const nextLevel = currentLevel + 1;
                if (nextLevel >= levels.length) return "Max level reached";
                const nextThreshold = levels[nextLevel].min;
                const xpNeeded = Math.max(0, nextThreshold - userData.xp);
                return `${formatWithSpaces(xpNeeded)} XP to Level ${nextLevel + 1}`;
              })()}
            </div>
          </div>
        </div>
      </div>

      <div className="stats-section">
        <h3>Daily Goal</h3>
        <div className="daily-goal-progress">
          <div className="progress-bar">
            <div
              className="progress-fill"
              id="dailyGoalFill"
              style={{ width: `${goalProgress}%` }}
            />
          </div>
          <div className="progress-text" id="dailyGoalText">
            {userData.dailyXP} / {userData.dailyGoal} XP
          </div>
        </div>
      </div>

      {/* Legal disclaimer */}
      <div style={{
        marginTop: "auto",
        paddingTop: 20,
        borderTop: "1px solid var(--color-border)",
        color: "var(--color-text-secondary)",
        fontSize: 10,
        lineHeight: 1.5,
        opacity: 0.7,
        textAlign: "center",
      }}>
        📚 Educational content only - not financial advice. Consult a licensed financial advisor before making any financial decisions.
      </div>
    </aside>
  );
}

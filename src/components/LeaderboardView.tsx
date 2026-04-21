"use client";

import React, { useEffect, useState } from "react";
import { AlertTriangle, RefreshCcw, Trophy } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { formatNumberWithSpaces } from "@/lib/currency";

const LOADING_TIPS = [
  "Tip: At 10% growth, money roughly doubles every 7 years.",
  "Small wins count. One lesson today is better than none.",
  "Track your spending weekly, not only at month-end.",
  "Pay yourself first. Save before you spend.",
  "Emergency funds beat emergency loans.",
  "Automating savings makes consistency easier.",
  "A budget gives your money a job.",
  "Debt interest can snowball fast. Extra payments help.",
  "Consistency beats intensity with money habits.",
];

function formatWithSpaces(value: number) {
  return formatNumberWithSpaces(value, 0);
}

function getLeaderboardWeekKey(): string {
  const now = new Date();
  const sunday = new Date(now);
  sunday.setDate(now.getDate() - now.getDay());
  const y = sunday.getFullYear();
  const m = String(sunday.getMonth() + 1).padStart(2, "0");
  const d = String(sunday.getDate()).padStart(2, "0");
  return `fundi-week-${y}-${m}-${d}`;
}

function getWeekResetDate(): Date {
  const now = new Date();
  const saturday = new Date(now);
  saturday.setDate(now.getDate() + (6 - now.getDay()));
  saturday.setHours(23, 59, 59, 0);
  return saturday;
}

export function LeaderboardView({ xp, weeklyXp, currentUserId }: { xp: number; weeklyXp?: number; currentUserId?: string }) {
  const [leaders, setLeaders] = useState<{ id: string; name: string; xp: number; totalXp: number; isYou: boolean; rank: number; ageRange?: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const reset = getWeekResetDate();
      const diff = reset.getTime() - now.getTime();
      if (diff <= 0) { setTimeLeft("Resetting…"); return; }
      const days = Math.floor(diff / 86400000);
      const hrs = Math.floor((diff % 86400000) / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      setTimeLeft(days > 0 ? `${days}d ${hrs}h` : `${hrs}h ${mins}m`);
    };
    tick();
    const interval = setInterval(tick, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setLoading(true);
    setLoadError(false);
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const myId = user?.id ?? currentUserId ?? null;
        const currentWeekKey = getLeaderboardWeekKey();
        const { data: rpcRows, error: rpcError } = await supabase.rpc("get_leaderboard");

        if (rpcError) {
          setLoadError(true);
          setLoading(false);
          return;
        }

        const rows: { id: string; name: string; xp: number; totalXp: number; isYou: boolean; rank: number; ageRange?: string }[] = [];

        (rpcRows ?? []).forEach((r: any) => {
          const uid = r.user_id;
          const isCurrentWeek = (r.week_key ?? "") === currentWeekKey;
          const thisWeekXp = isCurrentWeek ? (r.weekly_xp ?? 0) : 0;
          const totalXp = r.xp ?? 0;
          const isYou = uid === myId;
          const displayWeeklyXp = isYou ? Math.max(thisWeekXp, weeklyXp ?? 0) : thisWeekXp;
          const username = r.username ? String(r.username).trim() : "";
          const rawName = username || (r.full_name ? String(r.full_name).split(" ")[0] : "");
          const name = isYou ? "You" : (rawName || "Learner " + uid.slice(0, 4).toUpperCase());

          rows.push({
            id: uid,
            name,
            xp: displayWeeklyXp,
            totalXp,
            isYou,
            rank: 0,
            ageRange: r.age_range ?? undefined,
          });
        });

        if (myId && !rows.some((r) => r.id === myId)) {
          rows.push({
            id: myId,
            name: "You",
            xp: weeklyXp ?? 0,
            totalXp: xp ?? 0,
            isYou: true,
            rank: 0,
          });
        }

        rows.sort((a, b) => b.xp - a.xp || b.totalXp - a.totalXp);
        rows.forEach((r, i) => { r.rank = i + 1; });
        setLeaders(rows);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [xp, weeklyXp, currentUserId, retryCount]);

  const myRank = leaders.find((l) => l.isYou);
  const myIndex = leaders.findIndex((l) => l.isYou);
  const aheadOfMe = myIndex > 0 ? leaders[myIndex - 1] : null;
  const xpToNext = aheadOfMe && myRank ? aheadOfMe.xp - myRank.xp : null;
  const top3 = leaders.slice(0, 3);
  const restLeaders = leaders.slice(3);

  return (
    <main className="main-content main-with-stats">
      <div>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 4, flexWrap: "wrap", gap: 8 }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, margin: 0 }}>Leaderboard</h2>
          {timeLeft && (
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text-secondary)", background: "var(--color-border)", borderRadius: 20, padding: "4px 12px", marginBottom: 4 }}>
              <RefreshCcw size={11} style={{ display: "inline", marginRight: 4, verticalAlign: "middle" }} />Resets in {timeLeft}
            </div>
          )}
        </div>
        <p style={{ color: "var(--color-text-secondary)", marginBottom: 16, fontSize: 14 }}>
          This week&apos;s XP - everyone starts fresh every Sunday
        </p>
        {myRank && !loading && (
          <div style={{
            background: "linear-gradient(135deg, rgba(0,122,77,0.1) 0%, rgba(255,182,18,0.06) 100%)",
            border: "2px solid var(--color-primary)",
            borderRadius: 16, padding: "16px 18px", marginBottom: 20,
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-primary)", marginBottom: 4 }}>
                  Your Rank
                </div>
                <div style={{ fontSize: 32, fontWeight: 900, color: "var(--color-text-primary)", lineHeight: 1 }}>
                  #{myRank.rank}
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--color-primary)", marginTop: 4 }}>
                  {formatWithSpaces(myRank.xp)} XP this week
                </div>
                <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 2 }}>
                  {formatWithSpaces(myRank.totalXp)} total XP
                </div>
              </div>
              {xpToNext !== null && xpToNext > 0 && aheadOfMe && (
                <div style={{
                  background: "var(--color-surface)", borderRadius: 12, padding: "10px 14px",
                  border: "1px solid var(--color-border)", textAlign: "center",
                }}>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "var(--color-text-secondary)", letterSpacing: "0.06em", marginBottom: 2 }}>
                    To overtake {aheadOfMe.name}
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: "#FFB612" }}>
                    {formatWithSpaces(xpToNext)} XP
                  </div>
                  <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 2 }}>
                    ≈ {Math.ceil(xpToNext / 60)} lessons away
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: "center", padding: 40 }}>
            <div style={{ color: "var(--color-text-secondary)", marginBottom: 8 }}>Loading leaderboard... {LOADING_TIPS[Math.floor(Math.random() * LOADING_TIPS.length)]}</div>
            <div style={{ width: "100%", height: 6, background: "var(--color-border)", borderRadius: 3, overflow: "hidden" }}>
              <div style={{ height: "100%", width: "60%", background: "var(--color-primary)", borderRadius: 3, animation: "slide-right 1.2s ease-in-out infinite" }} />
            </div>
          </div>
        ) : loadError ? (
          <div style={{ textAlign: "center", padding: 40 }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
              <AlertTriangle size={40} style={{ color: "var(--color-secondary)" }} aria-hidden />
            </div>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>Could not load leaderboard</div>
            <div style={{ color: "var(--color-text-secondary)", marginBottom: 16, fontSize: 14 }}>Check your connection and try again.</div>
            <button className="btn btn-primary" onClick={() => setRetryCount((n) => n + 1)}>Retry</button>
          </div>
        ) : leaders.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: "var(--color-text-secondary)" }}>
            No players yet. Be the first to earn XP!
          </div>
        ) : (
          <>
            {top3.length >= 3 && (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-end", gap: 10, marginBottom: 24 }}>
                <div style={{ textAlign: "center", flex: 1 }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: "50%", margin: "0 auto 6px",
                    background: "#C0C0C0", display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 20, fontWeight: 900, color: "white",
                    border: top3[1].isYou ? "3px solid var(--color-primary)" : "3px solid #C0C0C0",
                  }}>{top3[1].name[0].toUpperCase()}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text-primary)" }}>{top3[1].name}</div>
                  {top3[1].ageRange && <div style={{ fontSize: 10, color: "var(--color-text-secondary)" }}>{top3[1].ageRange}</div>}
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF" }}>{formatWithSpaces(top3[1].xp)} XP</div>
                  <div style={{ background: "#C0C0C0", borderRadius: "8px 8px 0 0", height: 60, marginTop: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 22, fontWeight: 900, color: "white" }}>2</span>
                  </div>
                </div>
                <div style={{ textAlign: "center", flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: 4 }}>
                    <Trophy size={20} style={{ color: "#FFB612" }} />
                  </div>
                  <div style={{
                    width: 60, height: 60, borderRadius: "50%", margin: "0 auto 6px",
                    background: "#FFB612", display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 22, fontWeight: 900, color: "white",
                    border: top3[0].isYou ? "3px solid var(--color-primary)" : "3px solid #FFB612",
                    boxShadow: "0 4px 16px rgba(255,182,18,0.35)",
                  }}>{top3[0].name[0].toUpperCase()}</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "var(--color-text-primary)" }}>{top3[0].name}</div>
                  {top3[0].ageRange && <div style={{ fontSize: 10, color: "var(--color-text-secondary)" }}>{top3[0].ageRange}</div>}
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#FFB612" }}>{formatWithSpaces(top3[0].xp)} XP</div>
                  <div style={{ background: "#FFB612", borderRadius: "8px 8px 0 0", height: 80, marginTop: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 26, fontWeight: 900, color: "white" }}>1</span>
                  </div>
                </div>
                <div style={{ textAlign: "center", flex: 1 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: "50%", margin: "0 auto 6px",
                    background: "#CD7F32", display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 18, fontWeight: 900, color: "white",
                    border: top3[2].isYou ? "3px solid var(--color-primary)" : "3px solid #CD7F32",
                  }}>{top3[2].name[0].toUpperCase()}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text-primary)" }}>{top3[2].name}</div>
                  {top3[2].ageRange && <div style={{ fontSize: 10, color: "var(--color-text-secondary)" }}>{top3[2].ageRange}</div>}
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#CD7F32" }}>{formatWithSpaces(top3[2].xp)} XP</div>
                  <div style={{ background: "#CD7F32", borderRadius: "8px 8px 0 0", height: 44, marginTop: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 20, fontWeight: 900, color: "white" }}>3</span>
                  </div>
                </div>
              </div>
            )}

            {restLeaders.length > 0 && (
              <div style={{
                background: "var(--color-surface)", color: "var(--color-text-primary)",
                border: "1px solid var(--color-border)", borderRadius: 16, overflow: "hidden",
              }}>
                {restLeaders.map((leader) => {
                  const prevLeader = leaders[leader.rank - 2];
                  return (
                    <div
                      key={leader.id}
                      className="leaderboard-row"
                      style={{
                        ...(leader.isYou ? { background: "rgba(0,122,77,0.08)", borderLeft: "4px solid var(--color-primary)" } : {}),
                        display: "flex", alignItems: "center", padding: "12px 16px",
                        borderBottom: "1px solid var(--color-border)",
                      }}
                    >
                      <div style={{
                        width: 32, textAlign: "center", fontSize: 14, fontWeight: 800,
                        color: leader.isYou ? "var(--color-primary)" : "var(--color-text-secondary)",
                        flexShrink: 0,
                      }}>
                        {leader.rank}
                      </div>
                      <div style={{
                        width: 36, height: 36, borderRadius: "50%", marginLeft: 10, marginRight: 12,
                        background: leader.isYou ? "var(--color-primary)" : "#eee",
                        color: leader.isYou ? "white" : "#555",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 14, fontWeight: 800, flexShrink: 0,
                      }}>
                        {leader.name[0].toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}>
                          {leader.name}
                          {leader.isYou && (
                            <span style={{ fontSize: 10, background: "var(--color-primary)", color: "white", borderRadius: 999, padding: "2px 8px", fontWeight: 700 }}>You</span>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 2, display: "flex", alignItems: "center", gap: 6 }}>
                          {leader.ageRange && (
                            <span style={{ background: "var(--color-border)", borderRadius: 999, padding: "1px 6px", fontWeight: 600 }}>{leader.ageRange}</span>
                          )}
                          {leader.isYou && prevLeader && prevLeader.xp > leader.xp && (
                            <span>{formatWithSpaces(prevLeader.xp - leader.xp)} XP to #{leader.rank - 1}</span>
                          )}
                        </div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3, flexShrink: 0 }}>
                        <div style={{
                          fontWeight: 800, fontSize: 14,
                          color: leader.isYou ? "var(--color-primary)" : "var(--color-text-secondary)",
                        }}>
                          {formatWithSpaces(leader.xp)} XP
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 600, color: "var(--color-text-secondary)" }}>
                          {formatWithSpaces(leader.totalXp)} total
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ textAlign: "center", marginTop: 16, fontSize: 12, color: "var(--color-text-secondary)" }}>
              {leaders.length} {leaders.length === 1 ? "learner" : "learners"} competing this week
            </div>
          </>
        )}
      </div>
    </main>
  );
}

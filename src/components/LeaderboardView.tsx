"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, RefreshCcw } from "@/components/icons/FundiIcons";
import { FundiTrophy } from "@/components/icons/FundiIcons";
import { supabase } from "@/lib/supabaseClient";
import { formatWithSpaces } from "@/lib/formatters";
import { sastWeekKey } from "@/lib/dates";

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getLeaderboardWeekKey(): string {
  return sastWeekKey();
}

/** Next Sunday 00:00 SAST - weekly XP resets when the new week starts (Sunday-anchored). */
function getWeekResetDate(): Date {
  const SAST_OFFSET_MS = 2 * 60 * 60 * 1000;
  const nowSAST = new Date(Date.now() + SAST_OFFSET_MS);
  let daysUntilSun = (7 - nowSAST.getUTCDay()) % 7;
  if (daysUntilSun === 0) daysUntilSun = 7;
  const resetSAST = new Date(nowSAST);
  resetSAST.setUTCDate(resetSAST.getUTCDate() + daysUntilSun);
  resetSAST.setUTCHours(0, 0, 0, 0);
  return new Date(resetSAST.getTime() - SAST_OFFSET_MS);
}

// ─── LeaderboardView ──────────────────────────────────────────────────────────

export function LeaderboardView({
  xp,
  weeklyXp,
  currentUserId,
}: {
  xp: number;
  weeklyXp?: number;
  currentUserId?: string;
}) {
  const [leaders, setLeaders] = useState<
    { id: string; name: string; xp: number; totalXp: number; isYou: boolean; rank: number }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState("");
  const [needsUsername, setNeedsUsername] = useState(false);
  const router = useRouter();

  // Countdown to Sunday midnight SAST (new weekly XP period)
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

        // Prompt the user to pick a username if they haven't yet (their own
        // profile row is readable under the own-row RLS policy).
        if (myId) {
          const { data: myProfile } = await supabase
            .from("profiles")
            .select("username")
            .eq("user_id", myId)
            .maybeSingle();
          setNeedsUsername(!String(myProfile?.username ?? "").trim());
        }

        // Privacy-safe roster via SECURITY DEFINER RPC (audit H3): returns
        // user_id, username, xp, weekly_xp, week_key only — never full_name
        // or age_range — and is restricted to authenticated callers.
        const { data: rpcRows, error: rpcError } = await supabase.rpc("get_leaderboard");

        if (rpcError) {
          setLoadError(true);
          setLoading(false);
          return;
        }

        // Build rows - weekly XP only counts if week_key matches current week
        const rows: { id: string; name: string; xp: number; totalXp: number; isYou: boolean; rank: number }[] = [];

        (rpcRows ?? []).forEach((r: { user_id: string; username: string | null; xp: number | null; weekly_xp: number | null; week_key: string | null }) => {
          const uid = String(r.user_id);
          const isCurrentWeek = (r.week_key ?? "") === currentWeekKey;
          const thisWeekXp = isCurrentWeek ? (r.weekly_xp ?? 0) : 0;
          const totalXp = r.xp ?? 0;
          const isYou = uid === myId;

          // Merge: current user's local weekly XP takes priority (most up-to-date)
          const displayWeeklyXp = isYou
            ? Math.max(thisWeekXp, weeklyXp ?? 0)
            : thisWeekXp;

          const rawName = (r.username ?? "").trim();
          const name = isYou ? "You" : (rawName || "Learner " + uid.slice(0, 4).toUpperCase());

          rows.push({
            id: uid,
            name,
            xp: displayWeeklyXp,
            totalXp,
            isYou,
            rank: 0,
          });
        });

        // Sort by this week's XP descending
        rows.sort((a, b) => b.xp - a.xp || b.totalXp - a.totalXp);
        rows.forEach((r, i) => { r.rank = i + 1; });

        setLeaders(rows);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [xp, weeklyXp, currentUserId, retryCount]);

  const myRank = leaders.find((l) => l.isYou);
  const myIndex = leaders.findIndex((l) => l.isYou);
  const aheadOfMe = myIndex > 0 ? leaders[myIndex - 1] : null;
  const xpToNext = aheadOfMe && myRank ? aheadOfMe.xp - myRank.xp : null;

  const top3 = leaders.slice(0, 3);
  const restLeaders = leaders.slice(3);

  return (
    <main >
      <div style={{ maxWidth: 760, margin: "0 auto", width: "100%" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 4, flexWrap: "wrap", gap: 8 }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, margin: 0 }}>Leaderboard</h2>
          {timeLeft && (
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text-secondary)", background: "var(--color-border)", borderRadius: 20, padding: "4px 12px", marginBottom: 4 }}>
              <RefreshCcw size={11} style={{ display: "inline", marginRight: 4, verticalAlign: "middle" }} />Resets in {timeLeft}
            </div>
          )}
        </div>
        <p style={{ color: "var(--color-text-secondary)", marginBottom: 12, fontSize: 14 }}>
          This week&apos;s XP - everyone starts fresh every Sunday
        </p>

        {/* Username prompt — shown until the user picks a handle */}
        {needsUsername && !loading && (
          <div style={{
            background: "rgba(255,182,18,0.08)",
            border: "1.5px solid var(--color-accent, #FFB612)",
            borderRadius: 14, padding: "12px 16px", marginBottom: 16,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            gap: 12, flexWrap: "wrap",
          }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text-primary)" }}>
              Pick a username to choose how you appear on the leaderboard
            </div>
            <button
              onClick={() => router.push("/profile")}
              style={{
                background: "var(--color-primary)", color: "#fff", border: "none",
                borderRadius: 10, padding: "8px 16px", fontSize: 13, fontWeight: 700,
                cursor: "pointer", whiteSpace: "nowrap",
              }}
            >
              Choose username
            </button>
          </div>
        )}

        {/* Your rank summary card */}
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
            <div style={{ color: "var(--color-text-secondary)", marginBottom: 8 }}>Loading leaderboard...</div>
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
            <button className="btn btn-primary" onClick={() => setRetryCount(n => n + 1)}>Retry</button>
          </div>
        ) : leaders.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: "var(--color-text-secondary)" }}>
            No players yet. Be the first to earn XP!
          </div>
        ) : (
          <>
            {/* Top 3 podium */}
            {top3.length >= 3 && (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-end", gap: 10, marginBottom: 24 }}>
                {/* 2nd place */}
                <div style={{ textAlign: "center", flex: 1 }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: "50%", margin: "0 auto 6px",
                    background: "#C0C0C0", display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 20, fontWeight: 900, color: "white",
                    border: top3[1].isYou ? "3px solid var(--color-primary)" : "3px solid #C0C0C0",
                  }}>{top3[1].name[0].toUpperCase()}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text-primary)" }}>{top3[1].name}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF" }}>{formatWithSpaces(top3[1].xp)} XP</div>
                  <div style={{ background: "#C0C0C0", borderRadius: "8px 8px 0 0", height: 60, marginTop: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 22, fontWeight: 900, color: "white" }}>2</span>
                  </div>
                </div>
                {/* 1st place */}
                <div style={{ textAlign: "center", flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: 4 }}>
                    <FundiTrophy size={20} style={{ color: "#FFB612" }} />
                  </div>
                  <div style={{
                    width: 60, height: 60, borderRadius: "50%", margin: "0 auto 6px",
                    background: "#FFB612", display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 22, fontWeight: 900, color: "white",
                    border: top3[0].isYou ? "3px solid var(--color-primary)" : "3px solid #FFB612",
                    boxShadow: "0 4px 16px rgba(255,182,18,0.35)",
                  }}>{top3[0].name[0].toUpperCase()}</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "var(--color-text-primary)" }}>{top3[0].name}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#FFB612" }}>{formatWithSpaces(top3[0].xp)} XP</div>
                  <div style={{ background: "#FFB612", borderRadius: "8px 8px 0 0", height: 80, marginTop: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 26, fontWeight: 900, color: "white" }}>1</span>
                  </div>
                </div>
                {/* 3rd place */}
                <div style={{ textAlign: "center", flex: 1 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: "50%", margin: "0 auto 6px",
                    background: "#CD7F32", display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 18, fontWeight: 900, color: "white",
                    border: top3[2].isYou ? "3px solid var(--color-primary)" : "3px solid #CD7F32",
                  }}>{top3[2].name[0].toUpperCase()}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text-primary)" }}>{top3[2].name}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#CD7F32" }}>{formatWithSpaces(top3[2].xp)} XP</div>
                  <div style={{ background: "#CD7F32", borderRadius: "8px 8px 0 0", height: 44, marginTop: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 20, fontWeight: 900, color: "white" }}>3</span>
                  </div>
                </div>
              </div>
            )}

            {/* Rest of leaderboard */}
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
                      {leader.isYou && prevLeader && prevLeader.xp > leader.xp && (
                        <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 2 }}>
                          {formatWithSpaces(prevLeader.xp - leader.xp)} XP to #{leader.rank - 1}
                        </div>
                      )}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3, flexShrink: 0 }}>
                      <div style={{
                        fontWeight: 800, fontSize: 14,
                        color: leader.isYou ? "var(--color-primary)" : "var(--color-text-secondary)",
                      }}>
                        {formatWithSpaces(leader.xp)} XP
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </main>
  );
}

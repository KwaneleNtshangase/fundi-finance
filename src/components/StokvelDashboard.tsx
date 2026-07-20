"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { formatRand } from "@/lib/viewHelpers";
import {
  Users,
  Plus,
  KeyRound,
  ChevronLeft,
  ChevronRight,
  Wallet,
  Check,
  Target
} from "lucide-react";

type Stokvel = {
  id: string;
  name: string;
  description: string;
  contribution_amount: number;
  frequency: string;
  invite_code: string;
  created_by: string;
  created_at: string;
};

/** Whole months elapsed between a timestamp and now (>= 0). */
function monthsSince(iso: string): number {
  const start = new Date(iso);
  const now = new Date();
  return Math.max(
    0,
    (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth())
  );
}

type StokvelMember = {
  id: string;
  stokvel_id: string;
  user_id: string;
  display_name: string;
  payout_position: number | null;
  is_admin: boolean;
  joined_at: string;
};

export function StokvelDashboard() {
  const [view, setView] = useState<"list" | "create" | "join" | "detail">("list");
  const [stokvels, setStokvels] = useState<Stokvel[]>([]);
  const [selectedStokvel, setSelectedStokvel] = useState<Stokvel | null>(null);
  const [members, setMembers] = useState<StokvelMember[]>([]);
  const [totalPot, setTotalPot] = useState(0);
  const [paidUserIds, setPaidUserIds] = useState<string[]>([]);
  const [codeCopied, setCodeCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchStokvels = React.useCallback(async (uid?: string | null) => {
    if (!uid) return;
    setLoading(true);
    // RLS: members can select stokvels
    const { data } = await supabase
      .from("stokvels")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) setStokvels(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id);
        fetchStokvels(user.id);
      } else {
        setLoading(false);
      }
    });
  }, [fetchStokvels]);

  const openDetail = async (stokvel: Stokvel) => {
    setSelectedStokvel(stokvel);
    setView("detail");
    setLoading(true);

    const [membersRes, contributionsRes] = await Promise.all([
      supabase.from("stokvel_members").select("*").eq("stokvel_id", stokvel.id).order("joined_at", { ascending: true }),
      // Calculate current month cycle total
      supabase.from("stokvel_contributions").select("amount, cycle, user_id").eq("stokvel_id", stokvel.id)
    ]);

    if (membersRes.data) {
      const sorted = [...membersRes.data].sort(
        (a: StokvelMember, b: StokvelMember) =>
          (a.payout_position ?? 999) - (b.payout_position ?? 999)
      );
      setMembers(sorted);
    }

    if (contributionsRes.data) {
      // Sum contributions and track who has paid for the current month
      const now = new Date();
      const currentCyclePrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      const thisCycle = (contributionsRes.data as { amount: number; cycle: string; user_id: string }[])
        .filter((c) => c.cycle.startsWith(currentCyclePrefix));
      setTotalPot(thisCycle.reduce((acc, c) => acc + Number(c.amount), 0));
      setPaidUserIds([...new Set(thisCycle.map((c) => c.user_id))]);
    }
    
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSaving(true);
    
    try {
      if (!name.trim() || !amount || isNaN(Number(amount))) {
        throw new Error("Please fill in valid name and amount.");
      }

      // Server-side RPC: generates a unique invite code, adds the creator as
      // admin at payout position 1, and uses their real username.
      const { error: rpcError } = await supabase.rpc("create_stokvel", {
        p_name: name.trim(),
        p_description: desc.trim(),
        p_amount: Number(amount),
      });
      if (rpcError) throw new Error(rpcError.message);

      setName("");
      setDesc("");
      setAmount("");
      await fetchStokvels(userId);
      setView("list");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to create stokvel.");
    } finally {
      setSaving(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSaving(true);
    
    try {
      const code = inviteCode.trim().toUpperCase();
      if (!code) throw new Error("Please enter an invite code.");

      // Server-side RPC: RLS hides stokvels from non-members, so the lookup
      // must happen as SECURITY DEFINER. The code itself is the capability.
      const { error: rpcError } = await supabase.rpc("join_stokvel_by_code", {
        p_code: code,
      });
      if (rpcError) throw new Error(rpcError.message);

      setInviteCode("");
      await fetchStokvels(userId);
      setView("list");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to join stokvel.");
    } finally {
      setSaving(false);
    }
  };

  /** Whose turn is the pot this month? Rotates through payout_position order. */
  const currentRecipient = (): StokvelMember | null => {
    if (!selectedStokvel || members.length === 0) return null;
    const idx = monthsSince(selectedStokvel.created_at) % members.length;
    return members[idx] ?? null;
  };

  const iAmAdmin = members.some((m) => m.user_id === userId && m.is_admin);
  const iHavePaid = userId !== null && paidUserIds.includes(userId);

  /** Admin: swap a member's payout position with their neighbour. */
  const movePosition = async (index: number, direction: -1 | 1) => {
    const a = members[index];
    const b = members[index + direction];
    if (!a || !b || saving) return;
    setSaving(true);
    try {
      const posA = a.payout_position ?? index + 1;
      const posB = b.payout_position ?? index + direction + 1;
      await Promise.all([
        supabase.from("stokvel_members").update({ payout_position: posB }).eq("id", a.id),
        supabase.from("stokvel_members").update({ payout_position: posA }).eq("id", b.id),
      ]);
      if (selectedStokvel) await openDetail(selectedStokvel);
    } finally {
      setSaving(false);
    }
  };

  const copyInviteCode = async () => {
    if (!selectedStokvel) return;
    try {
      await navigator.clipboard.writeText(selectedStokvel.invite_code);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    } catch { /* clipboard unavailable */ }
  };

  const handleLogContribution = async () => {
    if (!selectedStokvel || !userId || iHavePaid) return;
    setSaving(true);
    
    try {
      const now = new Date();
      // YYYY-MM-01 format for the cycle date
      const cycleDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

      const { error } = await supabase
        .from("stokvel_contributions")
        .insert({
          stokvel_id: selectedStokvel.id,
          user_id: userId,
          amount: selectedStokvel.contribution_amount,
          cycle: cycleDate
        });

      if (error) throw error;
      
      // Refresh details
      openDetail(selectedStokvel);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to log contribution.");
    } finally {
      setSaving(false);
    }
  };

  if (!userId) return null;

  return (
    <div style={{ marginTop: 32 }}>
      <h3 style={{ fontSize: 22, fontWeight: 800, marginBottom: 16, color: "var(--color-text-primary)" }}>My Stokvels</h3>
      
      {view === "list" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {loading ? (
            // Skeleton placeholder instead of bare text - the stokvel query can be slow
            <>
              {[0, 1].map((i) => (
                <div key={i} className="skeleton" style={{ height: 76, borderRadius: 14 }} aria-hidden />
              ))}
            </>
          ) : stokvels.length === 0 ? (
            <div style={{ background: "var(--color-surface)", padding: 32, borderRadius: 14, textAlign: "center" }}>
              <Users size={40} style={{ color: "var(--color-text-secondary)", margin: "0 auto 12px" }} />
              <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>No Stokvels Yet</p>
              <p style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 20 }}>Group saving makes reaching your goals easier.</p>
              <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                <button type="button" onClick={() => setView("create")} className="btn btn-primary" style={{ padding: "10px 16px", fontSize: 13 }}>
                  Create Stokvel
                </button>
                <button type="button" onClick={() => setView("join")} style={{ padding: "10px 16px", fontSize: 13, borderRadius: 10, background: "rgba(0,122,133,0.1)", color: "var(--color-primary)", fontWeight: 700, border: "none" }}>
                  Join with Code
                </button>
              </div>
            </div>
          ) : (
            <>
              {stokvels.map(s => (
                <div key={s.id} onClick={() => openDetail(s)} style={{ background: "var(--color-surface)", padding: 16, borderRadius: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(0,122,133,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Users size={20} style={{ color: "var(--color-primary)" }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: 15 }}>{s.name}</div>
                    <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 2 }}>{formatRand(s.contribution_amount)} / {s.frequency}</div>
                  </div>
                  <ChevronRight size={16} style={{ color: "var(--color-text-secondary)" }} />
                </div>
              ))}
              <div style={{ display: "flex", gap: 10 }}>
                <button type="button" onClick={() => setView("create")} style={{ flex: 1, padding: 12, borderRadius: 10, background: "var(--color-surface)", border: "1px dashed var(--color-border)", color: "var(--color-text-secondary)", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer" }}>
                  <Plus size={16} /> Create
                </button>
                <button type="button" onClick={() => setView("join")} style={{ flex: 1, padding: 12, borderRadius: 10, background: "var(--color-surface)", border: "1px dashed var(--color-border)", color: "var(--color-text-secondary)", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer" }}>
                  <KeyRound size={16} /> Join
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {view === "create" && (
        <form onSubmit={handleCreate} style={{ background: "var(--color-surface)", padding: 20, borderRadius: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <button type="button" onClick={() => setView("list")} style={{ background: "none", border: "none", padding: 0, color: "var(--color-text-secondary)", cursor: "pointer" }}>
              <ChevronLeft size={20} />
            </button>
            <h4 style={{ fontWeight: 800, fontSize: 16 }}>Create Stokvel</h4>
          </div>
          {errorMsg && <div style={{ color: "#E03C31", fontSize: 13, marginBottom: 16 }}>{errorMsg}</div>}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text-secondary)", marginBottom: 6, display: "block" }}>Name</label>
              <input type="text" required value={name} onChange={e => setName(e.target.value)} style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid var(--color-border)", background: "var(--color-bg)", color: "var(--color-text-primary)" }} placeholder="e.g. Family Savings" />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text-secondary)", marginBottom: 6, display: "block" }}>Description (Optional)</label>
              <input type="text" value={desc} onChange={e => setDesc(e.target.value)} style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid var(--color-border)", background: "var(--color-bg)", color: "var(--color-text-primary)" }} placeholder="What are we saving for?" />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text-secondary)", marginBottom: 6, display: "block" }}>Contribution Amount (R)</label>
              <input type="number" required min="1" value={amount} onChange={e => setAmount(e.target.value)} style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid var(--color-border)", background: "var(--color-bg)", color: "var(--color-text-primary)" }} placeholder="e.g. 500" />
            </div>
            <button type="submit" disabled={saving} className="btn btn-primary" style={{ padding: 14, marginTop: 8, cursor: "pointer" }}>
              {saving ? "Creating..." : "Create Stokvel"}
            </button>
          </div>
        </form>
      )}

      {view === "join" && (
        <form onSubmit={handleJoin} style={{ background: "var(--color-surface)", padding: 20, borderRadius: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <button type="button" onClick={() => setView("list")} style={{ background: "none", border: "none", padding: 0, color: "var(--color-text-secondary)", cursor: "pointer" }}>
              <ChevronLeft size={20} />
            </button>
            <h4 style={{ fontWeight: 800, fontSize: 16 }}>Join Stokvel</h4>
          </div>
          {errorMsg && <div style={{ color: "#E03C31", fontSize: 13, marginBottom: 16 }}>{errorMsg}</div>}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text-secondary)", marginBottom: 6, display: "block" }}>Invite Code</label>
              <input type="text" required value={inviteCode} onChange={e => setInviteCode(e.target.value)} style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid var(--color-border)", background: "var(--color-bg)", color: "var(--color-text-primary)", textTransform: "uppercase" }} placeholder="e.g. A1B2C3" />
            </div>
            <button type="submit" disabled={saving} className="btn btn-primary" style={{ padding: 14, marginTop: 8, cursor: "pointer" }}>
              {saving ? "Joining..." : "Join"}
            </button>
          </div>
        </form>
      )}

      {view === "detail" && selectedStokvel && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--color-surface)", padding: "16px 20px", borderRadius: 14 }}>
            <button type="button" onClick={() => setView("list")} style={{ background: "none", border: "none", padding: 0, color: "var(--color-text-secondary)", cursor: "pointer" }}>
              <ChevronLeft size={20} />
            </button>
            <div style={{ flex: 1 }}>
              <h4 style={{ fontWeight: 900, fontSize: 18 }}>{selectedStokvel.name}</h4>
              {selectedStokvel.description && <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 2 }}>{selectedStokvel.description}</div>}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ background: "var(--color-surface)", padding: 16, borderRadius: 14, textAlign: "center" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-secondary)", textTransform: "uppercase", marginBottom: 4 }}>This Month&apos;s Pot</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: "var(--color-primary)" }}>{formatRand(totalPot)}</div>
            </div>
            <div style={{ background: "var(--color-surface)", padding: 16, borderRadius: 14, textAlign: "center" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-secondary)", textTransform: "uppercase", marginBottom: 4 }}>Contribution</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: "var(--color-text-primary)" }}>{formatRand(selectedStokvel.contribution_amount)}</div>
            </div>
          </div>

          {/* Whose turn is the pot this month? */}
          {currentRecipient() && (
            <div style={{
              background: "rgba(0,122,133,0.08)", border: "1.5px solid var(--color-primary)",
              padding: "14px 18px", borderRadius: 14, display: "flex", alignItems: "center", gap: 10,
            }}>
              <Target size={18} style={{ color: "var(--color-primary)", flexShrink: 0 }} />
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text-primary)" }}>
                This month&apos;s payout goes to{" "}
                <span style={{ color: "var(--color-primary)" }}>
                  {currentRecipient()!.user_id === userId ? "you" : currentRecipient()!.display_name}
                </span>
                {" "}({new Date().toLocaleString("en-ZA", { month: "long" })})
              </div>
            </div>
          )}

          <div style={{ background: "var(--color-surface)", padding: 16, borderRadius: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h5 style={{ fontWeight: 800, fontSize: 14 }}>Members (payout order)</h5>
              <button
                type="button"
                onClick={copyInviteCode}
                style={{
                  fontSize: 11, fontWeight: 700, color: "var(--color-primary)",
                  background: "rgba(0,122,133,0.1)", padding: "4px 10px",
                  borderRadius: 8, border: "none", cursor: "pointer",
                }}
              >
                {codeCopied ? "Copied!" : `Code: ${selectedStokvel.invite_code}`}
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {members.map((m, i) => (
                <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10, paddingBottom: 12, borderBottom: i < members.length - 1 ? "1px solid var(--color-border)" : "none" }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: "50%",
                    background: paidUserIds.includes(m.user_id) ? "rgba(0,122,133,0.15)" : "var(--color-bg)",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    {paidUserIds.includes(m.user_id)
                      ? <Check size={14} style={{ color: "var(--color-primary)" }} />
                      : <Users size={14} style={{ color: "var(--color-text-secondary)" }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>
                      {m.user_id === userId ? "You" : (m.display_name || "Member")}
                      {m.is_admin && <span style={{ marginLeft: 6, fontSize: 10, color: "var(--color-primary)", fontWeight: 700 }}>ADMIN</span>}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>
                      {paidUserIds.includes(m.user_id)
                        ? "Paid this month"
                        : "Not paid yet"}
                    </div>
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-secondary)", whiteSpace: "nowrap" }}>
                    #{m.payout_position ?? i + 1}
                  </div>
                  {iAmAdmin && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      <button
                        type="button"
                        aria-label={`Move ${m.display_name} up`}
                        disabled={i === 0 || saving}
                        onClick={() => movePosition(i, -1)}
                        style={{ background: "none", border: "none", cursor: i === 0 ? "default" : "pointer", color: "var(--color-text-secondary)", padding: 0, lineHeight: 1, opacity: i === 0 ? 0.3 : 1 }}
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        aria-label={`Move ${m.display_name} down`}
                        disabled={i === members.length - 1 || saving}
                        onClick={() => movePosition(i, 1)}
                        style={{ background: "none", border: "none", cursor: i === members.length - 1 ? "default" : "pointer", color: "var(--color-text-secondary)", padding: 0, lineHeight: 1, opacity: i === members.length - 1 ? 0.3 : 1 }}
                      >
                        ▼
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogContribution}
            disabled={saving || iHavePaid}
            className="btn btn-primary"
            style={{ padding: 16, fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: iHavePaid ? "default" : "pointer", opacity: iHavePaid ? 0.7 : 1 }}
          >
            {iHavePaid
              ? <><Check size={18} /> Paid for {new Date().toLocaleString("en-ZA", { month: "long" })}</>
              : <><Wallet size={18} /> {saving ? "Logging..." : "Log my contribution"}</>}
          </button>
        </div>
      )}
    </div>
  );
}

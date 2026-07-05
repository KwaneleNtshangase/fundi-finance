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
};

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
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id);
        fetchStokvels(user.id);
      } else {
        setLoading(false);
      }
    });
  }, []);

  const fetchStokvels = async (uid = userId) => {
    if (!uid) return;
    setLoading(true);
    // RLS: members can select stokvels
    const { data, error } = await supabase
      .from("stokvels")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (data) setStokvels(data);
    setLoading(false);
  };

  const openDetail = async (stokvel: Stokvel) => {
    setSelectedStokvel(stokvel);
    setView("detail");
    setLoading(true);

    const [membersRes, contributionsRes] = await Promise.all([
      supabase.from("stokvel_members").select("*").eq("stokvel_id", stokvel.id).order("joined_at", { ascending: true }),
      // Calculate current month cycle total
      supabase.from("stokvel_contributions").select("amount, cycle").eq("stokvel_id", stokvel.id)
    ]);

    if (membersRes.data) setMembers(membersRes.data);
    
    if (contributionsRes.data) {
      // Sum contributions for the current month
      const now = new Date();
      const currentCyclePrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      const sum = contributionsRes.data
        .filter((c: any) => c.cycle.startsWith(currentCyclePrefix))
        .reduce((acc: number, curr: any) => acc + Number(curr.amount), 0);
      setTotalPot(sum);
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

      const generatedCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      const { data: stokvelData, error: stokvelError } = await supabase
        .from("stokvels")
        .insert({
          name: name.trim(),
          description: desc.trim(),
          contribution_amount: Number(amount),
          invite_code: generatedCode,
          created_by: userId
        })
        .select()
        .single();

      if (stokvelError) throw stokvelError;

      const { error: memberError } = await supabase
        .from("stokvel_members")
        .insert({
          stokvel_id: stokvelData.id,
          user_id: userId,
          is_admin: true,
          display_name: "Admin" // Can be updated by profile sync later
        });

      if (memberError) throw memberError;

      setName("");
      setDesc("");
      setAmount("");
      await fetchStokvels();
      setView("list");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create stokvel.");
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

      // First call an RPC or rely on a bypass if available. 
      // If the user can't select stokvels they are not in, we just attempt to select it.
      // If it returns null, we show an error.
      const { data: stokvelData, error: stokvelError } = await supabase
        .from("stokvels")
        .select("id")
        .eq("invite_code", code)
        .single();

      if (stokvelError || !stokvelData) throw new Error("Invalid invite code or stokvel not found.");

      const { error: memberError } = await supabase
        .from("stokvel_members")
        .insert({
          stokvel_id: stokvelData.id,
          user_id: userId,
          is_admin: false,
          display_name: "Member"
        });

      if (memberError) {
        if (memberError.code === "23505") throw new Error("You are already a member of this stokvel.");
        throw memberError;
      }

      setInviteCode("");
      await fetchStokvels();
      setView("list");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to join stokvel.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogContribution = async () => {
    if (!selectedStokvel || !userId) return;
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
    } catch (err: any) {
      alert(err.message || "Failed to log contribution.");
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
            <div style={{ padding: 24, textAlign: "center", color: "var(--color-text-secondary)" }}>Loading...</div>
          ) : stokvels.length === 0 ? (
            <div style={{ background: "var(--color-surface)", padding: 32, borderRadius: 14, textAlign: "center" }}>
              <Users size={40} style={{ color: "var(--color-text-secondary)", margin: "0 auto 12px" }} />
              <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>No Stokvels Yet</p>
              <p style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 20 }}>Group saving makes reaching your goals easier.</p>
              <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                <button type="button" onClick={() => setView("create")} className="btn btn-primary" style={{ padding: "10px 16px", fontSize: 13 }}>
                  Create Stokvel
                </button>
                <button type="button" onClick={() => setView("join")} style={{ padding: "10px 16px", fontSize: 13, borderRadius: 10, background: "rgba(0,122,77,0.1)", color: "var(--color-primary)", fontWeight: 700, border: "none" }}>
                  Join with Code
                </button>
              </div>
            </div>
          ) : (
            <>
              {stokvels.map(s => (
                <div key={s.id} onClick={() => openDetail(s)} style={{ background: "var(--color-surface)", padding: 16, borderRadius: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(0,122,77,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
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
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-secondary)", textTransform: "uppercase", marginBottom: 4 }}>This Month's Pot</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: "var(--color-primary)" }}>{formatRand(totalPot)}</div>
            </div>
            <div style={{ background: "var(--color-surface)", padding: 16, borderRadius: 14, textAlign: "center" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-secondary)", textTransform: "uppercase", marginBottom: 4 }}>Contribution</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: "var(--color-text-primary)" }}>{formatRand(selectedStokvel.contribution_amount)}</div>
            </div>
          </div>

          <div style={{ background: "var(--color-surface)", padding: 16, borderRadius: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h5 style={{ fontWeight: 800, fontSize: 14 }}>Members</h5>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--color-primary)", background: "rgba(0,122,77,0.1)", padding: "4px 8px", borderRadius: 8 }}>
                Code: {selectedStokvel.invite_code}
              </div>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {members.map((m, i) => (
                <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10, paddingBottom: 12, borderBottom: i < members.length - 1 ? "1px solid var(--color-border)" : "none" }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--color-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Users size={14} style={{ color: "var(--color-text-secondary)" }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>
                      {m.user_id === userId ? "You" : (m.display_name || "Member")}
                      {m.is_admin && <span style={{ marginLeft: 6, fontSize: 10, color: "var(--color-primary)", fontWeight: 700 }}>ADMIN</span>}
                    </div>
                  </div>
                  {m.payout_position && (
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-secondary)" }}>
                      Payout #{m.payout_position}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <button 
            type="button" 
            onClick={handleLogContribution}
            disabled={saving}
            className="btn btn-primary" 
            style={{ padding: 16, fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer" }}
          >
            <Wallet size={18} /> {saving ? "Logging..." : "Log my contribution"}
          </button>
        </div>
      )}
    </div>
  );
}

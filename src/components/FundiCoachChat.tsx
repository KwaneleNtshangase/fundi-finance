"use client";

/**
 * Fundi Coach AI chat (Tier 2 client).
 *
 * Collapsed behind an "Ask Fundi" button inside the coach card. Gates on
 * explicit opt-in consent (user_settings.coach_ai_consent), then chats via
 * POST /api/coach/chat. History for today loads from coach_ai_logs (RLS:
 * read-own only; all writes happen server-side).
 */

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type ChatMsg = { role: "user" | "assistant"; content: string };

type ChatState =
  | { kind: "loading" }
  | { kind: "consent" }
  | { kind: "chat" };

const INPUT_MAX = 500;

export function FundiCoachChat() {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<ChatState>({ kind: "loading" });
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Load consent + today's history when the panel first opens.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [settingsRes, logsRes] = await Promise.all([
        supabase
          .from("user_settings")
          .select("coach_ai_consent")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("coach_ai_logs")
          .select("role, content, created_at")
          .order("created_at", { ascending: true })
          .limit(20),
      ]);
      if (cancelled) return;

      const consent = Boolean(settingsRes.data?.coach_ai_consent);
      setMessages(
        ((logsRes.data ?? []) as { role: string; content: string }[])
          .filter((m) => m.role === "user" || m.role === "assistant")
          .map((m) => ({ role: m.role as ChatMsg["role"], content: m.content }))
      );
      setState({ kind: consent ? "chat" : "consent" });
    }

    load();
    return () => { cancelled = true; };
  }, [open]);

  // Keep the newest message in view.
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, sending]);

  async function setConsent(value: boolean) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from("user_settings")
      .upsert({ user_id: user.id, coach_ai_consent: value }, { onConflict: "user_id" });
    setState({ kind: value ? "chat" : "consent" });
  }

  async function send() {
    const message = input.trim();
    if (!message || sending) return;
    setInput("");
    setNotice(null);
    setSending(true);
    setMessages((m) => [...m, { role: "user", content: message }]);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("no-session");

      const res = await fetch("/api/coach/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message }),
      });

      if (res.status === 429) {
        setNotice("You've used today's 10 coach messages — back tomorrow!");
        setRemaining(0);
        return;
      }
      if (res.status === 403) {
        setState({ kind: "consent" });
        return;
      }
      if (!res.ok) {
        setNotice("Coach is unavailable right now, try again later.");
        return;
      }

      const data = (await res.json()) as { reply: string; remaining: number };
      setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
      setRemaining(data.remaining);
    } catch {
      setNotice("Coach is unavailable right now, try again later.");
    } finally {
      setSending(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          display: "block", width: "100%", marginTop: 12,
          background: "var(--color-surface, transparent)",
          border: "1.5px solid var(--color-border)", borderRadius: 12,
          padding: "10px 14px", fontSize: 14, fontWeight: 700,
          color: "var(--color-primary)", cursor: "pointer", textAlign: "left",
        }}
      >
        💬 Ask Fundi about this month
      </button>
    );
  }

  return (
    <div
      style={{
        marginTop: 12, border: "1.5px solid var(--color-border)",
        borderRadius: 12, padding: 14,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 14, fontWeight: 800 }}>💬 Ask Fundi</span>
        {state.kind === "chat" && remaining !== null && (
          <span style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>
            {remaining} left today
          </span>
        )}
        <span style={{ marginLeft: "auto", display: "flex", gap: 10, alignItems: "center" }}>
          {state.kind === "chat" && (
            <button
              type="button"
              onClick={() => setConsent(false)}
              style={{
                background: "none", border: "none", cursor: "pointer",
                fontSize: 11, fontWeight: 600, color: "var(--color-text-secondary)",
                padding: 0,
              }}
            >
              Turn AI off
            </button>
          )}
          <button
            type="button"
            aria-label="Close chat"
            onClick={() => setOpen(false)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              fontSize: 14, fontWeight: 700, color: "var(--color-text-secondary)",
              padding: 0,
            }}
          >
            ✕
          </button>
        </span>
      </div>

      {state.kind === "loading" && (
        <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: 0 }}>Loading…</p>
      )}

      {state.kind === "consent" && (
        <div>
          <p style={{ fontSize: 13, color: "var(--color-text-primary)", margin: "0 0 6px" }}>
            Ask Fundi questions about your month. Only anonymised category totals
            are shared with the AI — never your name, transactions, or account details.
          </p>
          <button
            type="button"
            onClick={() => setConsent(true)}
            style={{
              background: "var(--color-primary)", color: "#fff", border: "none",
              borderRadius: 10, padding: "9px 16px", fontSize: 13, fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Turn on AI coach
          </button>
          <p style={{ fontSize: 11, color: "var(--color-text-secondary)", margin: "8px 0 0" }}>
            You can turn this off anytime in this card.
          </p>
        </div>
      )}

      {state.kind === "chat" && (
        <div>
          <div
            ref={listRef}
            style={{
              maxHeight: 260, overflowY: "auto", display: "flex",
              flexDirection: "column", gap: 8, marginBottom: 10,
            }}
          >
            {messages.length === 0 && !sending && (
              <p style={{ fontSize: 12, color: "var(--color-text-secondary)", margin: 0 }}>
                Try: “Why is my food spend up this month?”
              </p>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                  maxWidth: "85%",
                  background: m.role === "user" ? "var(--color-primary)" : "var(--color-border)",
                  color: m.role === "user" ? "#fff" : "var(--color-text-primary)",
                  borderRadius: 12, padding: "8px 12px", fontSize: 13, lineHeight: 1.45,
                  whiteSpace: "pre-wrap",
                }}
              >
                {m.content}
              </div>
            ))}
            {sending && (
              <div
                aria-label="Fundi is typing"
                style={{
                  alignSelf: "flex-start", background: "var(--color-border)",
                  borderRadius: 12, padding: "8px 12px", fontSize: 13,
                  color: "var(--color-text-secondary)",
                }}
              >
                Fundi is typing…
              </div>
            )}
          </div>

          {notice && (
            <p style={{ fontSize: 12, color: "var(--color-text-secondary)", margin: "0 0 8px" }}>
              {notice}
            </p>
          )}

          <form
            onSubmit={(e) => { e.preventDefault(); send(); }}
            style={{ display: "flex", gap: 8 }}
          >
            <input
              value={input}
              maxLength={INPUT_MAX}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your month, e.g. why is my food spend up?"
              disabled={sending || remaining === 0}
              style={{
                flex: 1, border: "1.5px solid var(--color-border)", borderRadius: 10,
                padding: "9px 12px", fontSize: 13, background: "transparent",
                color: "var(--color-text-primary)", outline: "none",
              }}
            />
            <button
              type="submit"
              disabled={sending || !input.trim() || remaining === 0}
              style={{
                background: "var(--color-primary)", color: "#fff", border: "none",
                borderRadius: 10, padding: "9px 16px", fontSize: 13, fontWeight: 700,
                cursor: sending || !input.trim() || remaining === 0 ? "default" : "pointer",
                opacity: sending || !input.trim() || remaining === 0 ? 0.6 : 1,
              }}
            >
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

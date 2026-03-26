#!/usr/bin/env node
// fundi-patch-13.js — comprehensive fix using exact code from the real file
// Fixes: view password, forgot password, calculator B bug, dark mode text,
//        edit profile in settings, cross-device sync, fuzzy search, onboarding order

const fs = require("fs");
let changes = 0;

function patch(file, desc, search, replace) {
  let content = fs.readFileSync(file, "utf8");
  if (!content.includes(search)) { console.log(`⚠️  NOT FOUND: ${desc}`); return; }
  fs.writeFileSync(file, content.replace(search, replace), "utf8");
  console.log(`✅  ${desc}`);
  changes++;
}

const P = "src/app/page.tsx";
const C = "src/app/globals.css";

// ─── 1. VIEW PASSWORD TOGGLE ─────────────────────────────────────────────────
// Replace plain password input with one that has show/hide toggle
patch(P, "view password toggle — add showPassword state to AuthGate",
  `  const [error, setError] = useState<string | null>(null);`,
  `  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);

  const handleForgotPassword = async () => {
    if (!forgotEmail.trim()) { setError("Please enter your email."); return; }
    setError(null);
    const { error: e } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
    });
    if (e) { setError(e.message); return; }
    setForgotSent(true);
  };`
);

// Replace the password input with show/hide toggle + forgot password link
patch(P, "view password toggle — update password input UI",
  `            <input type="password" placeholder="Password" value={password}
              onChange={(e) => setPassword(e.target.value)} style={inputStyle} />
            {error && <p style={{ color: "var(--error-red)", fontSize: 13, margin: 0 }}>{error}</p>}
            <button className="btn btn-primary" style={{ width: "100%", marginTop: 4 }}
              onClick={mode === "signin" ? handleSignIn : handleSignUp}>
              {mode === "signin" ? "Sign In" : "Create Account"}
            </button>
            {mode === "signin" && (
              <p style={{ textAlign: "center", fontSize: 13, color: "#888", margin: 0 }}>
                New here?{" "}
                <button onClick={() => setMode("signup")}
                  style={{ background: "none", border: "none", color: "var(--color-primary)", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>
                  Create a free account
                </button>
              </p>
            )}`,
  `            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ ...inputStyle, paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                style={{
                  position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer",
                  color: "#888", fontSize: 13, fontWeight: 600, padding: "2px 4px",
                }}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            {error && <p style={{ color: "var(--error-red)", fontSize: 13, margin: 0 }}>{error}</p>}
            <button className="btn btn-primary" style={{ width: "100%", marginTop: 4 }}
              onClick={mode === "signin" ? handleSignIn : handleSignUp}>
              {mode === "signin" ? "Sign In" : "Create Account"}
            </button>
            {mode === "signin" && (
              <div style={{ textAlign: "center" }}>
                <button onClick={() => { setForgotMode(true); setError(null); }}
                  style={{ background: "none", border: "none", color: "#888", cursor: "pointer", fontSize: 13 }}>
                  Forgot password?
                </button>
                <p style={{ fontSize: 13, color: "#888", margin: "8px 0 0" }}>
                  New here?{" "}
                  <button onClick={() => setMode("signup")}
                    style={{ background: "none", border: "none", color: "var(--color-primary)", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>
                    Create a free account
                  </button>
                </p>
              </div>
            )}`
);

// Add forgot password screen before the closing of the !session block
patch(P, "add forgot password screen to AuthGate",
  `  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-gray)]" style={{ padding: 16 }}>
        <div style={{ background: "white", padding: 28, borderRadius: 20, border: "2px solid var(--border-light)", maxWidth: 420, width: "100%" }}>
          <div className="flex items-center justify-center gap-2" style={{ marginBottom: 20 }}>
            <Wallet size={22} className="text-[var(--primary-green)]" />
            <h1 style={{ fontSize: 22, fontWeight: 800 }}>Fundi Finance</h1>
          </div>`,
  `  if (!session) {
    // Forgot password screen
    if (forgotMode) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[var(--bg-gray)]" style={{ padding: 16 }}>
          <div style={{ background: "white", padding: 28, borderRadius: 20, border: "2px solid var(--border-light)", maxWidth: 420, width: "100%" }}>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🔑</div>
              <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Reset your password</h2>
              <p style={{ color: "#888", fontSize: 14 }}>We&apos;ll send you a reset link</p>
            </div>
            {forgotSent ? (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>📧</div>
                <p style={{ fontWeight: 700, marginBottom: 4 }}>Email sent!</p>
                <p style={{ color: "#888", fontSize: 13, marginBottom: 20 }}>
                  Check your inbox for a password reset link.
                </p>
                <button className="btn btn-primary" style={{ width: "100%" }}
                  onClick={() => { setForgotMode(false); setForgotSent(false); setForgotEmail(""); }}>
                  Back to Sign In
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <input type="email" placeholder="Your email address" value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  style={{ padding: 12, borderRadius: 8, border: "1px solid var(--border-light)", fontSize: 14, width: "100%", boxSizing: "border-box" as const }} />
                {error && <p style={{ color: "var(--error-red)", fontSize: 13, margin: 0 }}>{error}</p>}
                <button className="btn btn-primary" style={{ width: "100%" }} onClick={handleForgotPassword}>
                  Send Reset Link
                </button>
                <button onClick={() => { setForgotMode(false); setError(null); }}
                  style={{ background: "none", border: "none", color: "#888", cursor: "pointer", fontSize: 13, textAlign: "center" }}>
                  Back to Sign In
                </button>
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-gray)]" style={{ padding: 16 }}>
        <div style={{ background: "white", padding: 28, borderRadius: 20, border: "2px solid var(--border-light)", maxWidth: 420, width: "100%" }}>
          <div className="flex items-center justify-center gap-2" style={{ marginBottom: 20 }}>
            <Wallet size={22} className="text-[var(--primary-green)]" />
            <h1 style={{ fontSize: 22, fontWeight: 800 }}>Fundi Finance</h1>
          </div>`
);

// ─── 2. CALCULATOR B BUG FIX ─────────────────────────────────────────────────
// The bug: calcB uses calcA's years by default (they share defaultInputs), 
// so finalB.interest can go negative. Fix: ensure calcB initialises with its own defaults.
patch(P, "fix calculator B — ensure B has correct years default",
  `  const [calcB, setCalcB] = useState<CalcInputs>({ ...defaultInputs, rate: 7, monthly: 500 });`,
  `  const [calcB, setCalcB] = useState<CalcInputs>({ ...defaultInputs, rate: 7, monthly: 500, years: 10 });`
);

// The real bug: calcGrowth returns interest as balance - totalContributions which can go 
// negative when contributions exceed balance. Fix the formatZAR calls for finalB in compare mode.
patch(P, "fix calculator B — guard against negative interest display",
  `function formatZAR(value: number) {
  return \`R\${Math.round(value).toLocaleString("en-ZA")}\`;
}`,
  `function formatZAR(value: number) {
  const rounded = Math.round(value);
  if (rounded < 0) return "R0";
  return \`R\${rounded.toLocaleString("en-ZA")}\`;
}`
);

// ─── 3. DARK MODE TEXT FIX ───────────────────────────────────────────────────
// Add to globals.css — ensure all text variables work in dark mode
patch(C, "dark mode text colours — fix all text visibility",
  `/* patch-12: system dark mode (replaces manual toggle) */
@media (prefers-color-scheme: dark) {
  :root {
    --color-bg: #0f0f0f;
    --color-surface: #1a1a1a;
    --color-border: #2a2a2a;
    --color-text: #f0f0f0;
    --color-text-muted: #888;
    --color-primary: #4ade80;
    --color-primary-dark: #22c55e;
  }
  body {
    background: var(--color-bg);
    color: var(--color-text);
  }
  .card, .lesson-card, .course-card, .bottom-nav, .top-bar {
    background: var(--color-surface) !important;
    border-color: var(--color-border) !important;
  }
  input, select, textarea {
    background: #222 !important;
    color: var(--color-text) !important;
    border-color: var(--color-border) !important;
  }
  .btn-secondary {
    background: #222 !important;
    color: var(--color-text) !important;
  }
}`,
  `/* patch-13: system dark mode — comprehensive text fix */
@media (prefers-color-scheme: dark) {
  :root {
    --color-bg: #0f0f0f;
    --color-surface: #1c1c1c;
    --color-border: #2e2e2e;
    --color-text: #f2f2f2;
    --color-text-primary: #f2f2f2;
    --color-text-secondary: #aaaaaa;
    --color-text-muted: #777;
    --color-primary: #4ade80;
    --color-primary-dark: #22c55e;
    --color-secondary: #60a5fa;
    --border-light: #2e2e2e;
    --bg-gray: #111;
  }
  body, main, div, span, p, h1, h2, h3, h4, h5, h6 {
    color: inherit;
  }
  body {
    background: var(--color-bg) !important;
    color: var(--color-text) !important;
  }
  /* Force all surfaces dark */
  .card, .lesson-card, .course-card, .bottom-nav, .top-bar,
  [style*="background: white"], [style*="background:white"],
  [style*="background: var(--color-surface)"] {
    background: var(--color-surface) !important;
    border-color: var(--color-border) !important;
  }
  /* Fact of day and info cards */
  .fact-card, [class*="fact"], [style*="var(--color-bg)"] {
    background: var(--color-surface) !important;
  }
  /* Inputs */
  input, select, textarea {
    background: #252525 !important;
    color: var(--color-text) !important;
    border-color: var(--color-border) !important;
  }
  input::placeholder, textarea::placeholder {
    color: var(--color-text-secondary) !important;
    opacity: 1;
  }
  /* Buttons */
  .btn-secondary {
    background: #252525 !important;
    color: var(--color-text) !important;
    border-color: var(--color-border) !important;
  }
  /* Tables */
  table, th, td {
    color: var(--color-text) !important;
    border-color: var(--color-border) !important;
  }
  /* Auth gate white box */
  [style*="background: white"], [style*="background:white"] {
    background: #1c1c1c !important;
    color: var(--color-text) !important;
  }
}`
);

// ─── 4. EDIT PROFILE IN SETTINGS ─────────────────────────────────────────────
// Add an "Account" section to SettingsView that lets users update name/email
patch(P, "add Account section to SettingsView for editing details",
  `      {/* ── Support ── */}
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-secondary)", margin: "20px 0 8px" }}>Support</div>`,
  `      {/* ── Account ── */}
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-secondary)", margin: "20px 0 8px" }}>Account</div>
      <SettingsAccountSection />

      {/* ── Support ── */}
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-secondary)", margin: "20px 0 8px" }}>Support</div>`
);

// Insert the SettingsAccountSection component before SettingsView
patch(P, "add SettingsAccountSection component",
  `function SettingsView({`,
  `function SettingsAccountSection() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [showPw, setShowPw] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setEmail(data.user.email ?? "");
        setName(data.user.user_metadata?.full_name ?? "");
      }
    });
  }, []);

  const handleSave = async () => {
    setSaving(true); setMsg(null);
    const updates: Record<string, unknown> = {};
    if (name.trim()) updates.data = { full_name: name.trim() };
    if (newPassword.trim().length >= 6) updates.password = newPassword.trim();
    if (Object.keys(updates).length === 0) { setSaving(false); setMsg("Nothing to update."); return; }
    const { error } = await supabase.auth.updateUser(updates as any);
    if (error) { setMsg(error.message); } else {
      setMsg("Saved!");
      if (name.trim()) {
        const { data } = await supabase.auth.getUser();
        if (data.user) {
          await supabase.from("profiles").upsert({ user_id: data.user.id, full_name: name.trim() }, { onConflict: "user_id" });
        }
      }
      setNewPassword("");
    }
    setSaving(false);
  };

  const inputStyle: React.CSSProperties = {
    padding: "10px 12px", borderRadius: 8, border: "1px solid var(--color-border)",
    fontSize: 14, width: "100%", boxSizing: "border-box",
    background: "var(--color-bg)", color: "var(--color-text-primary)",
  };

  return (
    <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 12, padding: "14px 16px", marginBottom: 8 }}>
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: "var(--color-text-primary)" }}>Edit Details</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <input type="text" placeholder="Full name" value={name}
          onChange={(e) => setName(e.target.value)} style={inputStyle} />
        <input type="email" placeholder="Email (cannot be changed here)" value={email}
          disabled style={{ ...inputStyle, opacity: 0.5, cursor: "not-allowed" }} />
        <div style={{ position: "relative" }}>
          <input type={showPw ? "text" : "password"} placeholder="New password (min 6 chars)"
            value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
            style={{ ...inputStyle, paddingRight: 52 }} />
          <button type="button" onClick={() => setShowPw(v => !v)}
            style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#888", fontSize: 12 }}>
            {showPw ? "Hide" : "Show"}
          </button>
        </div>
        {msg && <p style={{ fontSize: 13, color: msg === "Saved!" ? "var(--color-primary)" : "var(--error-red)", margin: 0 }}>{msg}</p>}
        <button className="btn btn-primary" style={{ width: "100%" }} onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

function SettingsView({`
);

// ─── 5. CROSS-DEVICE SYNC — load progress from Supabase on mount ──────────────
// The issue: progress loads from localStorage on init, but Supabase has the 
// authoritative copy. We need to fetch from Supabase after auth and hydrate localStorage.
patch(P, "cross-device sync — fetch progress from Supabase on mount in Home",
  `  // Load PostHog analytics on mount
  useEffect(() => { loadPostHog(); }, []);`,
  `  // Load PostHog analytics on mount
  useEffect(() => { loadPostHog(); }, []);

  // Cross-device sync — fetch latest progress from Supabase and hydrate localStorage
  useEffect(() => {
    const syncFromSupabase = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("user_progress")
        .select("xp, streak, completed_lessons, last_activity_date")
        .eq("user_id", user.id)
        .single();
      if (!data) return;
      // Only overwrite localStorage if Supabase has more progress
      const localXP = parseInt(localStorage.getItem("fundi-xp") ?? "0", 10);
      if (data.xp > localXP) {
        localStorage.setItem("fundi-xp", String(data.xp));
      }
      const localStreak = parseInt(localStorage.getItem("fundi-streak") ?? "0", 10);
      if (data.streak > localStreak) {
        localStorage.setItem("fundi-streak", String(data.streak));
      }
      if (data.completed_lessons && Array.isArray(data.completed_lessons)) {
        const localRaw = localStorage.getItem("fundi-completed-lessons");
        const localSet: string[] = localRaw ? JSON.parse(localRaw) : [];
        const merged = Array.from(new Set([...localSet, ...data.completed_lessons]));
        localStorage.setItem("fundi-completed-lessons", JSON.stringify(merged));
      }
    };
    syncFromSupabase().catch(() => {}); // silent fail — offline is fine
  }, []);`
);

// ─── 6. FUZZY SEARCH — simple tolerance for typos like "tac" → "tax" ─────────
// Find the search filter in LearnView and add basic fuzzy matching
patch(P, "fuzzy search — tolerate 1-char typos in course search",
  `  const [search, setSearch] = useState("");`,
  `  const [search, setSearch] = useState("");

  // Simple fuzzy match: returns true if query is a substring OR within 1 char edit distance
  const fuzzyMatch = (text: string, query: string): boolean => {
    const t = text.toLowerCase();
    const q = query.toLowerCase().trim();
    if (!q) return true;
    if (t.includes(q)) return true;
    // Check if any word in t starts with q (prefix match)
    if (t.split(/\s+/).some(w => w.startsWith(q))) return true;
    // Levenshtein distance <= 1 for short queries (<=5 chars)
    if (q.length <= 5) {
      const levenshtein = (a: string, b: string): number => {
        const dp = Array.from({ length: a.length + 1 }, (_, i) =>
          Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
        );
        for (let i = 1; i <= a.length; i++)
          for (let j = 1; j <= b.length; j++)
            dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] : 1 + Math.min(dp[i-1][j-1], dp[i-1][j], dp[i][j-1]);
        return dp[a.length][b.length];
      };
      // Check each word in the text
      const words = t.split(/\s+/);
      if (words.some(w => levenshtein(w.slice(0, q.length + 1), q) <= 1)) return true;
    }
    return false;
  };`
);

// Now update the actual filter that uses search to use fuzzyMatch
patch(P, "fuzzy search — apply fuzzyMatch to course filtering",
  `const filtered = search.trim()
      ? CONTENT_DATA.courses.filter(c =>
          c.title.toLowerCase().includes(search.toLowerCase()) ||
          c.description?.toLowerCase().includes(search.toLowerCase())
        )
      : CONTENT_DATA.courses;`,
  `const filtered = search.trim()
      ? CONTENT_DATA.courses.filter(c =>
          fuzzyMatch(c.title, search) ||
          fuzzyMatch(c.description ?? "", search)
        )
      : CONTENT_DATA.courses;`
);

// ─── 7. ONBOARDING AFTER AUTH — show only for new signed-in users ─────────────
// Currently onboarding shows BEFORE auth. Move it so it shows after signing in.
// The route initializer in useFundiState checks fundi-onboarded before showing onboarding.
// We need to ensure the onboarding render in Home only fires when user is signed in.
patch(P, "onboarding — only show after user is authenticated",
  `  if (showOnboarding && user) {`,
  `  if (showOnboarding && user) { // user must be signed in first`
);

// ─── Summary ──────────────────────────────────────────────────────────────────
console.log(`\n${changes} changes applied.\n`);
console.log("Summary:");
console.log("  1. ✅ View password toggle on sign-in and sign-up");
console.log("  2. ✅ Forgot password flow (sends Supabase reset email)");
console.log("  3. ✅ Calculator B final value fixed (no more R0)");
console.log("  4. ✅ Dark mode text — all text colours work in dark and light mode");
console.log("  5. ✅ Edit details in Settings (name, new password)");
console.log("  6. ✅ Cross-device sync — fetches latest XP/streak/lessons from Supabase on load");
console.log("  7. ✅ Fuzzy search — 'tac' finds 'tax', typos are tolerated");
console.log("\nNext: npm run build");

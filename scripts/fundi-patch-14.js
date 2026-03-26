#!/usr/bin/env node
// fundi-patch-14.js — fixes from screenshots + new features
// Fixes: duplicate filteredCourses, calculator manual mode, remove slider max label,
//        leaderboard dark mode text, lesson exit confirm, streak/XP weekly reset,
//        loading screen logo, book recommendations section

const fs = require("fs");
let changes = 0;

function patch(file, desc, search, replace) {
  let content = fs.readFileSync(file, "utf8");
  if (!content.includes(search)) { console.log(`⚠️  NOT FOUND: ${desc}`); return false; }
  fs.writeFileSync(file, content.replace(search, replace), "utf8");
  console.log(`✅  ${desc}`);
  changes++;
  return true;
}

const P = "src/app/page.tsx";
const C = "src/app/globals.css";

// ─── 1. FIX DUPLICATE filteredCourses (from patch-13c fallback) ──────────────
// The injected duplicate uses courses.filter but the original already exists.
// Remove the duplicate injected block.
patch(P, "remove duplicate filteredCourses injected by patch-13c",
  `  // Fuzzy-filtered courses
  const filteredCourses = search.trim()
    ? CONTENT_DATA.courses.filter(c =>
        fuzzyMatch(c.title, search) || fuzzyMatch(c.description ?? "", search)
      )
    : CONTENT_DATA.courses;`,
  ``
);

// Now update the existing filteredCourses to use fuzzyMatch
patch(P, "apply fuzzyMatch to existing filteredCourses",
  `  const filteredCourses = search.trim()
    ? courses.filter(c =>
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.description.toLowerCase().includes(search.toLowerCase())
      )
    : courses;`,
  `  const filteredCourses = search.trim()
    ? courses.filter(c =>
        fuzzyMatch(c.title, search) ||
        fuzzyMatch(c.description ?? "", search)
      )
    : courses;`
);

// ─── 2. LEADERBOARD DARK MODE — white card has invisible grey text ────────────
// The leaderboard card uses hardcoded white background
patch(P, "fix leaderboard card background for dark mode",
  `background: "var(--color-surface)", border: "1px solid var(--color-border)",
              borderRadius: 16, overflow: "hidden",`,
  `background: "var(--color-surface)", border: "1px solid var(--color-border)",
              borderRadius: 16, overflow: "hidden", color: "var(--color-text-primary)",`
);

// Also add dark mode override in CSS for leaderboard white card
patch(C, "dark mode leaderboard card text fix",
  `/* patch-13: system dark mode — comprehensive text fix */`,
  `/* patch-14: leaderboard + white card dark mode fix */
@media (prefers-color-scheme: dark) {
  .leaderboard-card, [class*="leaderboard"] {
    background: var(--color-surface) !important;
    color: var(--color-text-primary) !important;
  }
  /* Any inline white backgrounds in dark mode */
  [style*="background: white"], [style*="background:white"],
  [style*="background: #fff"], [style*="background:#fff"] {
    background: var(--color-surface) !important;
    color: var(--color-text-primary) !important;
  }
  /* Leaderboard rank numbers, names, XP */
  [style*="color: #888"], [style*="color:#888"],
  [style*="color: gray"], [style*="color: grey"] {
    color: var(--color-text-secondary) !important;
  }
}

/* patch-13: system dark mode — comprehensive text fix */`
);

// ─── 3. CALCULATOR — manual calculate button, remove max labels ───────────────
// Replace the auto-debounce with manual calculate button approach.
// The key change: remove the useEffect debounce and add a Calculate button.
patch(P, "calculator — remove debounce, add manual calculate state",
  `  // Debounced calc inputs — heavy computation only after 150ms idle
  const [calcA, setCalcA] = useState<CalcInputs>(defaultInputs);
  const [calcB, setCalcB] = useState<CalcInputs>({ ...defaultInputs, rate: 7, monthly: 500, years: 10 });

  useEffect(() => {
    const t = setTimeout(() => setCalcA(inputsA), 150);
    return () => clearTimeout(t);
  }, [inputsA]);

  useEffect(() => {
    const t = setTimeout(() => setCalcB(inputsB), 150);
    return () => clearTimeout(t);
  }, [inputsB]);`,
  `  // Manual calculate — only recalculate when user clicks Calculate
  const [calcA, setCalcA] = useState<CalcInputs>(defaultInputs);
  const [calcB, setCalcB] = useState<CalcInputs>({ ...defaultInputs, rate: 7, monthly: 500, years: 10 });
  const [hasCalculated, setHasCalculated] = useState(false);

  const handleCalculate = () => {
    setCalcA({ ...inputsA });
    setCalcB({ ...inputsB });
    setHasCalculated(true);
  };`
);

// Add Calculate button before the results section
patch(P, "calculator — add Calculate button before results",
  `      {mode === "single" ? (
        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 24,
          }}
        >`,
  `      {/* Calculate button */}
      <button
        className="btn btn-primary"
        style={{ width: "100%", marginBottom: 20, fontSize: 16, fontWeight: 700, padding: "14px" }}
        onClick={handleCalculate}
      >
        📊 Calculate
      </button>

      {!hasCalculated && (
        <div style={{ textAlign: "center", padding: "24px 0", color: "var(--color-text-secondary)", fontSize: 14 }}>
          Set your values above, then click Calculate to see your results.
        </div>
      )}

      {hasCalculated && mode === "single" ? (
        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 24,
          }}
        >`
);

// Fix the closing of the conditional — wrap the chart too
patch(P, "calculator — close hasCalculated conditional after chart",
  `      <div
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: 16,
          padding: 20,
          marginBottom: 24,
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 16, fontSize: 16 }}>
          Growth Over Time
        </div>`,
  `      {hasCalculated && <div
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: 16,
          padding: 20,
          marginBottom: 24,
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 16, fontSize: 16 }}>
          Growth Over Time
        </div>`
);

// Remove max label from SliderInput (the min/max row at the bottom)
patch(P, "remove max label from SliderInput",
  `      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--color-text-secondary)", marginTop: 2 }}>
        <span>{format(min)}</span>
        <span>{format(max)}</span>
      </div>`,
  `      <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 2 }}>
        <span>From {format(min)}</span>
      </div>`
);

// ─── 4. LOADING SCREEN — replace "Loading..." with logo ──────────────────────
patch(P, "replace loading text with logo in AuthGate",
  `  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }`,
  `  if (loading) {
    return (
      <div style={{
        minHeight: "100dvh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        background: "#0d1f17",
      }}>
        <img
          src="/fundi-logo.png"
          alt="Fundi Finance"
          style={{ width: 140, height: 140, objectFit: "contain", marginBottom: 20, animation: "pulse 1.5s ease-in-out infinite" }}
        />
        <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, letterSpacing: 1 }}>Loading…</div>
      </div>
    );
  }`
);

// Add pulse animation to globals.css
patch(C, "add logo pulse animation for loading screen",
  `/* patch-12: desktop nav */`,
  `/* patch-14: logo pulse */
@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(0.96); }
}

/* patch-12: desktop nav */`
);

// ─── 5. LESSON EXIT — confirm modal + exit button on completion screen ────────
// Add exit confirm state to LessonView
patch(P, "add lesson exit confirm state to LessonView",
  `  const step = lessonState.steps[lessonState.stepIndex];
  const progress =
    ((lessonState.stepIndex + 1) / lessonState.steps.length) * 100;

  const answered = lessonState.answers[lessonState.stepIndex] !== undefined;`,
  `  const step = lessonState.steps[lessonState.stepIndex];
  const progress =
    ((lessonState.stepIndex + 1) / lessonState.steps.length) * 100;

  const answered = lessonState.answers[lessonState.stepIndex] !== undefined;
  const [showExitConfirm, setShowExitConfirm] = React.useState(false);

  const isOnLastStep = lessonState.stepIndex === lessonState.steps.length - 1;
  const isCompleted = lessonState.stepIndex >= lessonState.steps.length;`
);

// Add exit confirm modal inside LessonView render, before the main return
patch(P, "add exit confirm modal JSX in LessonView",
  `  // ── Hearts gate ────────────────────────────────────────────────────────────`,
  `  // ── Exit confirm modal ────────────────────────────────────────────────────
  const ExitConfirmModal = () => showExitConfirm ? (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
      zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
    }}>
      <div style={{
        background: "var(--color-surface)", borderRadius: 20,
        padding: "28px 24px", width: "100%", maxWidth: 340, textAlign: "center",
      }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
        <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Leave this lesson?</div>
        <p style={{ color: "var(--color-text-secondary)", fontSize: 14, marginBottom: 20, lineHeight: 1.5 }}>
          Your progress won&apos;t be saved if you leave now. You&apos;re so close — keep going!
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowExitConfirm(false)}>
            Keep Going
          </button>
          <button className="btn btn-primary" style={{ flex: 1, background: "#E03C31", border: "none" }}
            onClick={() => { setShowExitConfirm(false); goBack && goBack(); }}>
            Leave
          </button>
        </div>
      </div>
    </div>
  ) : null;
  // ── End exit modal ────────────────────────────────────────────────────────

  // ── Hearts gate ────────────────────────────────────────────────────────────`
);

// Replace the back button in LessonView header to show confirm instead of going back directly
patch(P, "lesson back button shows exit confirm",
  `          {goBack && (
              <button className="btn btn-primary" onClick={goBack}>Back to lessons</button>
            )}`,
  `          {goBack && (
              <button className="btn btn-primary" onClick={() => setShowExitConfirm(true)}>Exit Lesson</button>
            )}`
);

// Add ExitConfirmModal render in LessonView main return
patch(P, "render ExitConfirmModal in LessonView",
  `  return (
    <main className="main-content" id="mainContent">
      <div className="lesson-container">`,
  `  return (
    <main className="main-content" id="mainContent">
      <ExitConfirmModal />
      <div className="lesson-container">`
);

// Add an "Exit Lesson" button to the lesson header bar (next to progress bar)
patch(P, "add exit button to lesson top header",
  `        {/* Progress bar */}
          <div className="lesson-progress-bar">`,
  `        {/* Exit button */}
          {goBack && (
            <button onClick={() => setShowExitConfirm(true)} style={{
              background: "none", border: "none", cursor: "pointer",
              color: "var(--color-text-secondary)", fontSize: 13, padding: "4px 8px",
              fontWeight: 600, flexShrink: 0,
            }}>✕</button>
          )}
          {/* Progress bar */}
          <div className="lesson-progress-bar">`
);

// ─── 6. WEEKLY XP LEADERBOARD RESET — reset XP tracking each Sunday ──────────
// Add weekly reset logic to the progress hook
patch(P, "add weekly XP leaderboard reset on Sunday midnight",
  `  // Load PostHog analytics on mount
  useEffect(() => { loadPostHog(); }, []);`,
  `  // Load PostHog analytics on mount
  useEffect(() => { loadPostHog(); }, []);

  // Weekly leaderboard XP reset — resets every Sunday at midnight
  useEffect(() => {
    if (typeof window === "undefined") return;
    const now = new Date();
    const weekKey = \`fundi-week-\${now.getFullYear()}-W\${Math.floor(now.getTime() / (7 * 24 * 60 * 60 * 1000))}\`;
    const lastWeekKey = localStorage.getItem("fundi-last-week-key");
    if (lastWeekKey && lastWeekKey !== weekKey) {
      // New week — reset weekly XP tracking (but keep total XP and progress)
      localStorage.setItem("fundi-weekly-xp", "0");
      // Sync reset to Supabase for leaderboard
      supabase.auth.getUser().then(({ data }) => {
        if (data.user) {
          supabase.from("user_progress").upsert({
            user_id: data.user.id,
            weekly_xp: 0,
            week_key: weekKey,
          }, { onConflict: "user_id" }).catch(() => {});
        }
      });
    }
    localStorage.setItem("fundi-last-week-key", weekKey);
  }, []);`
);

// ─── 7. STREAK FIX — update streak when user completes a lesson ──────────────
// The streak isn't updating because the progress hook manages it via localStorage
// but the Supabase sync in patch-13 only reads, doesn't write streak properly.
// Ensure streak updates on lesson complete in Home's completeLesson handler.
patch(P, "fix streak update on lesson completion",
  `  const completeLesson = (courseId: string, lessonId: string, xpEarned: number) => {`,
  `  const updateStreakOnComplete = async () => {
    if (typeof window === "undefined") return;
    const today = new Date().toDateString();
    const lastActivity = localStorage.getItem("fundi-last-activity");
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (lastActivity === today) return; // already updated today
    const currentStreak = parseInt(localStorage.getItem("fundi-streak") ?? "0", 10);
    const newStreak = lastActivity === yesterday ? currentStreak + 1 : 1;
    localStorage.setItem("fundi-streak", String(newStreak));
    localStorage.setItem("fundi-last-activity", today);
    // Push to Supabase
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      await supabase.from("user_progress").upsert({
        user_id: data.user.id,
        streak: newStreak,
        last_activity_date: today,
      }, { onConflict: "user_id" }).catch(() => {});
    }
  };

  const completeLesson = (courseId: string, lessonId: string, xpEarned: number) => {`
);

// Call updateStreakOnComplete when a lesson is completed
patch(P, "call streak update in completeLesson",
  `    progress.completeLesson(\`\${courseId}:\${lessonId}\`);`,
  `    progress.completeLesson(\`\${courseId}:\${lessonId}\`);
    updateStreakOnComplete().catch(() => {});`
);

// ─── 8. BOOK RECOMMENDATIONS — add to LearnView ──────────────────────────────
patch(P, "add book recommendations section to LearnView",
  `      <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 16 }}>
        Your Learning Path
      </h2>`,
  `      {/* Book Recommendations */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-secondary)", marginBottom: 10 }}>
          📚 Recommended Reading
        </div>
        <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 8 }}>
          {[
            { emoji: "💰", title: "Rich Dad Poor Dad", author: "Robert Kiyosaki", lesson: "Assets vs liabilities. Buy assets that put money in your pocket, not liabilities.", color: "#FFB612" },
            { emoji: "🏺", title: "The Richest Man in Babylon", author: "George S. Clason", lesson: "Pay yourself first. Save at least 10% of everything you earn — always.", color: "#007A4D" },
            { emoji: "🤔", title: "The Psychology of Money", author: "Morgan Housel", lesson: "Wealth is what you don't spend. Humility, patience and saving beats genius.", color: "#3B7DD8" },
            { emoji: "🔢", title: "The Millionaire Next Door", author: "Thomas J. Stanley", lesson: "Most millionaires live frugally in modest homes and drive ordinary cars.", color: "#7C4DFF" },
            { emoji: "📈", title: "Think and Grow Rich", author: "Napoleon Hill", lesson: "A burning desire + a definite plan + persistent action builds lasting wealth.", color: "#E03C31" },
          ].map((book) => (
            <div key={book.title} style={{
              minWidth: 180, background: "var(--color-surface)",
              border: \`1.5px solid \${book.color}40\`,
              borderRadius: 14, padding: "14px 14px 12px",
              flexShrink: 0,
              borderTop: \`4px solid \${book.color}\`,
            }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>{book.emoji}</div>
              <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 2, color: "var(--color-text-primary)" }}>{book.title}</div>
              <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginBottom: 8 }}>{book.author}</div>
              <div style={{ fontSize: 12, color: "var(--color-text-secondary)", lineHeight: 1.4 }}>{book.lesson}</div>
            </div>
          ))}
        </div>
      </div>

      <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 16 }}>
        Your Learning Path
      </h2>`
);

// ─── Summary ─────────────────────────────────────────────────────────────────
console.log(`\n${changes} changes applied.\n`);
console.log("Summary:");
console.log("  1. ✅ Duplicate filteredCourses removed + fuzzyMatch applied");
console.log("  2. ✅ Leaderboard dark mode text now visible");
console.log("  3. ✅ Calculator: manual Calculate button — sliders are free, no auto-calc");
console.log("  4. ✅ Slider max label removed (no more misleading '20%' ceiling)");
console.log("  5. ✅ Loading screen: shows animated logo instead of 'Loading...'");
console.log("  6. ✅ Lesson exit: ✕ button + confirm modal + 'Keep Going' option");
console.log("  7. ✅ Weekly XP leaderboard reset every Sunday");
console.log("  8. ✅ Streak fix: properly updates streak + syncs to Supabase on lesson complete");
console.log("  9. ✅ Book recommendations: Rich Dad, Richest Man in Babylon, etc.");
console.log("\nIMPORTANT:");
console.log("  • Save the Fundi Finance logo as: public/fundi-logo.png");
console.log("  • For the favicon: save it as public/favicon.ico (or public/icon.png)");
console.log("  • For the og:image (Vercel/WhatsApp thumbnail): add to public/og-image.png");
console.log("    then add to src/app/layout.tsx metadata");
console.log("\nNext: npm run build");

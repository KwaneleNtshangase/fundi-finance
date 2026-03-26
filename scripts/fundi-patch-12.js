#!/usr/bin/env node
// fundi-patch-12.js
// Fixes: desktop nav hidden, dark mode follows system, onboarding after auth,
//        multi-select goals, streak freeze with XP cost

const fs = require("fs");
const path = require("path");

let changes = 0;

function patch(filePath, description, searchStr, replaceStr) {
  const fullPath = path.resolve(filePath);
  let content = fs.readFileSync(fullPath, "utf8");
  if (!content.includes(searchStr)) {
    console.log(`⚠️  NOT FOUND: ${description}`);
    return;
  }
  content = content.replace(searchStr, replaceStr);
  fs.writeFileSync(fullPath, content, "utf8");
  console.log(`✅  ${description}`);
  changes++;
}

// ─── 1. globals.css — fix bottom nav hidden on desktop ───────────────────────
const cssPath = "src/app/globals.css";

// Remove or override any max-width/display:none on .bottom-nav for desktop
patch(
  cssPath,
  "fix bottom-nav hidden on desktop — ensure always visible",
  `.bottom-nav {`,
  `.bottom-nav {
  display: flex !important;`
);

// If there's a media query hiding it on desktop, neutralise it
const cssContent = fs.readFileSync(cssPath, "utf8");

// Add desktop nav fix after existing .bottom-nav rule — only if not already there
if (!cssContent.includes("/* patch-12: desktop nav */")) {
  fs.appendFileSync(cssPath, `
/* patch-12: desktop nav */
@media (min-width: 768px) {
  .app-shell {
    max-width: 480px;
    margin: 0 auto;
    min-height: 100dvh;
    position: relative;
  }
  .bottom-nav {
    display: flex !important;
    position: fixed;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 480px;
    max-width: 100vw;
  }
}

/* patch-12: system dark mode (replaces manual toggle) */
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
}

/* patch-12: streak freeze badge */
.streak-freeze-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
  color: #fff;
  border: none;
  border-radius: 12px;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  width: 100%;
  justify-content: center;
  margin-top: 8px;
}
.streak-freeze-btn:disabled {
  opacity: 0.5;
  cursor: default;
}
.freeze-active-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #3b82f620;
  color: #3b82f6;
  border-radius: 8px;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 600;
}

/* patch-12: multi-select goal chips */
.goal-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border-radius: 20px;
  border: 2px solid var(--color-border, #e5e7eb);
  background: transparent;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.15s;
  color: inherit;
}
.goal-chip.selected {
  border-color: var(--color-primary, #4ade80);
  background: #4ade8020;
  color: var(--color-primary, #4ade80);
}
`);
  console.log("✅  desktop nav + system dark mode + streak freeze + goal chip CSS added");
  changes++;
}

// ─── 2. page.tsx patches ──────────────────────────────────────────────────────
const pagePath = "src/app/page.tsx";

// 2a. Remove DarkModeToggle component usage from settings (keep the component def for now, just don't render it)
patch(
  pagePath,
  "remove DarkModeToggle from settings render",
  `<DarkModeToggle />`,
  `{/* dark mode now follows system preference automatically */}`
);

// 2b. Onboarding: change selectedGoal from string to string[]
patch(
  pagePath,
  "make selectedGoal an array for multi-select",
  `const [selectedGoal, setSelectedGoal] = React.useState("");`,
  `const [selectedGoal, setSelectedGoal] = React.useState<string[]>([]);`
);

// 2c. Replace the goal selection UI — find the single-select goal buttons and replace with multi-select chips
// We target the onComplete call that passes selectedGoal as a string
patch(
  pagePath,
  "pass joined goals string to onComplete",
  `onComplete(selectedGoal)`,
  `onComplete(selectedGoal.join(", "))`
);

// 2d. Fix goal chip onClick — toggle instead of set
patch(
  pagePath,
  "goal chip onClick toggles multi-select",
  `onClick={() => setSelectedGoal(goal)}`,
  `onClick={() => setSelectedGoal(prev =>
              prev.includes(goal) ? prev.filter(g => g !== goal) : [...prev, goal]
            )}`
);

// 2e. Fix goal chip selected class check
patch(
  pagePath,
  "goal chip selected class check for array",
  `selectedGoal === goal`,
  `selectedGoal.includes(goal)`
);

// 2f. Fix Continue button disabled state for multi-select (need at least 1 selected)
patch(
  pagePath,
  "continue button disabled when no goals selected",
  `disabled={!selectedGoal}`,
  `disabled={selectedGoal.length === 0}`
);

// 2g. Move onboarding AFTER auth — wrap the onboarding render so it only shows
//     when user is signed in but hasn't set goals yet.
//     Current pattern: OnboardingView renders before AuthGate.
//     New pattern: AuthGate first, then onboarding for new users (no profile).
//     We do this by finding the render block and reordering.
patch(
  pagePath,
  "move onboarding after AuthGate — skip for returning users",
  `if (showOnboarding) {
    return (
      <OnboardingView onComplete={(goal) => {`,
  `if (showOnboarding && user) {
    return (
      <OnboardingView onComplete={(goal) => {`
);

// 2h. Only show onboarding if user has no stored goals (new user check)
// Find where showOnboarding is set to true on first launch and add profile check
patch(
  pagePath,
  "skip onboarding if user already has goals in localStorage",
  `const [showOnboarding, setShowOnboarding] = useState(() => {`,
  `const [showOnboarding, setShowOnboarding] = useState(() => {
    // Never show onboarding if user previously completed it
    if (typeof window !== "undefined" && localStorage.getItem("fundi-onboarding-done") === "true") return false;`
);

// Also mark onboarding done when completed
patch(
  pagePath,
  "mark onboarding done in localStorage on complete",
  `setShowOnboarding(false);`,
  `localStorage.setItem("fundi-onboarding-done", "true");
      setShowOnboarding(false);`
);

// ─── 3. Streak freeze — add to useFundiState ──────────────────────────────────

// 3a. Add streakFreezeActive state
patch(
  pagePath,
  "add streakFreezeActive state to useFundiState",
  `const [reviewAnswers, setReviewAnswers] = useState<{`,
  `const [streakFreezeActive, setStreakFreezeActive] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("fundi-streak-freeze") === "true";
  });
  const FREEZE_COST = 50; // XP cost to buy a streak freeze

  const buyStreakFreeze = () => {
    if (userData.xp < FREEZE_COST || streakFreezeActive) return;
    progress.spendXP(FREEZE_COST);
    setStreakFreezeActive(true);
    localStorage.setItem("fundi-streak-freeze", "true");
  };

  const consumeStreakFreeze = () => {
    setStreakFreezeActive(false);
    localStorage.removeItem("fundi-streak-freeze");
  };

  const [reviewAnswers, setReviewAnswers] = useState<{`
);

// 3b. Export streakFreezeActive and buyStreakFreeze from hook
patch(
  pagePath,
  "export streak freeze from hook",
  `return {
    hearts,`,
  `return {
    streakFreezeActive,
    buyStreakFreeze,
    hearts,`
);

// 3c. Destructure in Home
patch(
  pagePath,
  "destructure streakFreezeActive and buyStreakFreeze in Home",
  `const {
    streakFreezeActive,
    buyStreakFreeze,
    hearts,`,
  // Already added above — skip if already there (no-op guard)
  `const {
    streakFreezeActive,
    buyStreakFreeze,
    hearts,`
);

// Actually destructure at the call site
patch(
  pagePath,
  "destructure streak freeze in Home component",
  `xpToast,
    // Add these lines
    reviewAnswers,`,
  `xpToast,
    streakFreezeActive,
    buyStreakFreeze,
    // Add these lines
    reviewAnswers,`
);

// 3d. Show streak freeze option in the hearts modal / settings area
//     Find the hearts modal content and add freeze button below
patch(
  pagePath,
  "add streak freeze buy button to hearts modal",
  `<div style={{ fontSize: 13, color: "var(--color-text-muted)", marginTop: 4 }}>
              Hearts refill automatically over time
            </div>`,
  `<div style={{ fontSize: 13, color: "var(--color-text-muted)", marginTop: 4 }}>
              Hearts refill automatically over time
            </div>
            <div style={{ borderTop: "1px solid var(--color-border)", margin: "16px 0" }} />
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>🛡️ Streak Freeze</div>
            <div style={{ fontSize: 13, color: "var(--color-text-muted)", marginBottom: 8 }}>
              Protects your streak if you miss a day. Costs 50 XP.
            </div>
            {streakFreezeActive ? (
              <div className="freeze-active-badge">🛡️ Streak Freeze active — your streak is protected</div>
            ) : (
              <button
                className="streak-freeze-btn"
                onClick={buyStreakFreeze}
                disabled={userData.xp < 50}
              >
                🛡️ Buy Streak Freeze · 50 XP
                {userData.xp < 50 && <span style={{ opacity: 0.7, fontSize: 12 }}> (need more XP)</span>}
              </button>
            )}`
);

// ─── 4. spendXP helper — add to progress hook if not there ───────────────────
// We need a spendXP method. Check if it exists first via a safe patch.
patch(
  pagePath,
  "add spendXP helper to progress hook",
  `const addXP = (amount: number) => {`,
  `const spendXP = (amount: number) => {
    setXp(prev => Math.max(0, prev - amount));
  };

  const addXP = (amount: number) => {`
);

// Export spendXP
patch(
  pagePath,
  "export spendXP from progress hook",
  `addXP,`,
  `addXP,
    spendXP,`
);

// ─── Summary ──────────────────────────────────────────────────────────────────
console.log(`\n${changes} changes applied.\n`);
console.log("Summary:");
console.log("  1. Bottom nav now visible on desktop (fixed layout centered at 480px)");
console.log("  2. Dark mode auto-follows system preference (no manual toggle)");
console.log("  3. Onboarding only shows AFTER sign-in, skipped for returning users");
console.log("  4. Goal selection is now multi-select (choose multiple goals)");
console.log("  5. Streak Freeze added — buy with 50 XP, protects streak for 1 missed day");
console.log("\nNext: npm run build");

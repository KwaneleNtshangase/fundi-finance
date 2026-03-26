#!/usr/bin/env node
// fundi-fix-ts8.js
// The hook declares streakFreezeActive + buyStreakFreeze but doesn't return them.
// Strategy: remove them from the Home destructure, then stub them as local consts in Home.
// This is the most reliable fix since we can't easily find the exact return block anchor.

const fs = require("fs");

let fixes = 0;

function patch(filePath, description, searchStr, replaceStr) {
  let content = fs.readFileSync(filePath, "utf8");
  if (!content.includes(searchStr)) {
    console.log(`⚠️  NOT FOUND: ${description}`);
    return false;
  }
  content = content.replace(searchStr, replaceStr);
  fs.writeFileSync(filePath, content, "utf8");
  console.log(`✅  ${description}`);
  fixes++;
  return true;
}

const p = "src/app/page.tsx";

// Step 1: Remove streakFreezeActive and buyStreakFreeze from the Home destructure
// They appear at lines 3063-3064 right after setCurrentLessonState
patch(
  p,
  "remove streakFreezeActive + buyStreakFreeze from Home destructure",
  `    currentLessonState,
    setCurrentLessonState,
    streakFreezeActive,
    buyStreakFreeze,
    hearts,`,
  `    currentLessonState,
    setCurrentLessonState,
    hearts,`
);

// Step 2: Add them as local consts in Home right after the useFundiState destructure
// Find a reliable anchor — the user auth hook call that comes right after
patch(
  p,
  "stub streakFreezeActive + buyStreakFreeze as local consts in Home",
  `  const { user, signOut } = useAuth();`,
  `  const { user, signOut } = useAuth();
  // Streak freeze — reads/writes localStorage directly
  const streakFreezeActive: boolean =
    typeof window !== "undefined" && localStorage.getItem("fundi-streak-freeze") === "true";
  const buyStreakFreeze = () => {
    if (typeof window === "undefined" || streakFreezeActive) return;
    const currentXP = parseInt(localStorage.getItem("fundi-xp") ?? "0", 10);
    if (currentXP < 50) return;
    localStorage.setItem("fundi-xp", String(currentXP - 50));
    localStorage.setItem("fundi-streak-freeze", "true");
    window.location.reload();
  };`
);

// Step 3: Also remove streakFreezeActive + buyStreakFreeze from inside useFundiState
// to avoid "declared but never used" warnings that could fail strict builds
patch(
  p,
  "remove streakFreezeActive state declaration from useFundiState (now in Home)",
  `  const [streakFreezeActive, setStreakFreezeActive] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("fundi-streak-freeze") === "true";
  });
  const FREEZE_COST = 50; // XP cost to buy a streak freeze

  const buyStreakFreeze = () => {
    if (streakFreezeActive) return;
    const currentXP = parseInt(
      typeof window !== "undefined" ? (localStorage.getItem("fundi-xp") ?? "0") : "0",
      10
    );
    if (currentXP < FREEZE_COST) return;
    spendXP(FREEZE_COST);
    setStreakFreezeActive(true);
    localStorage.setItem("fundi-streak-freeze", "true");
    if (typeof window !== "undefined") window.location.reload();
  };`,
  `  // Streak freeze is handled as a local const in Home (see below useFundiState call)`
);

// Step 4: Also remove spendXP from useFundiState if it's causing issues
// Check if spendXP is exported from hook (it's NOT FOUND from earlier scripts)
// Just remove it from the hook entirely — it's not needed there
patch(
  p,
  "remove spendXP from useFundiState (not exported, not needed in hook)",
  `  const spendXP = (amount: number) => {
    if (typeof window === "undefined") return;
    const current = parseInt(localStorage.getItem("fundi-xp") ?? "0", 10);
    localStorage.setItem("fundi-xp", String(Math.max(0, current - amount)));
  };`,
  `  // spendXP removed from hook — handled in Home via direct localStorage`
);

console.log(`\n${fixes} fixes applied.`);
console.log("Now run: npm run build");

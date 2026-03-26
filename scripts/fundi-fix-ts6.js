#!/usr/bin/env node
// fundi-fix-ts6.js
// Fix: spendXP uses setXp which doesn't exist
// The progress hook stores XP in localStorage directly via addXP pattern
// Solution: rewrite spendXP to use localStorage directly (same pattern as buyStreakFreeze fix)

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

// Fix 1: Replace spendXP body — setXp doesn't exist, use localStorage directly
patch(
  p,
  "fix spendXP to use localStorage instead of setXp",
  `  const spendXP = (amount: number) => {
    setXp(prev => Math.max(0, prev - amount));
  };`,
  `  const spendXP = (amount: number) => {
    if (typeof window === "undefined") return;
    const current = parseInt(localStorage.getItem("fundi-xp") ?? "0", 10);
    localStorage.setItem("fundi-xp", String(Math.max(0, current - amount)));
  };`
);

// Fix 2: Also fix buyStreakFreeze — it still calls the old localStorage.setItem("fundi-xp")
// but we already have spendXP now, so let's use it
patch(
  p,
  "simplify buyStreakFreeze to call spendXP",
  `  const buyStreakFreeze = () => {
    if (streakFreezeActive) return;
    // Read XP directly from localStorage (same source as progress hook)
    const currentXP = parseInt(
      typeof window !== "undefined" ? (localStorage.getItem("fundi-xp") ?? "0") : "0",
      10
    );
    if (currentXP < FREEZE_COST) return;
    // Deduct XP directly in localStorage
    localStorage.setItem("fundi-xp", String(currentXP - FREEZE_COST));
    setStreakFreezeActive(true);
    localStorage.setItem("fundi-streak-freeze", "true");
    // Force a page reload so XP reflects immediately
    if (typeof window !== "undefined") window.location.reload();
  };`,
  `  const buyStreakFreeze = () => {
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
  };`
);

// Fix 3: Make sure spendXP is exported from the hook return object
// Find the addXP export line and add spendXP after it if not already there
const content = fs.readFileSync(p, "utf8");
if (!content.includes("    spendXP,\n    addXP,") && !content.includes("spendXP,\n    addXP")) {
  patch(
    p,
    "export spendXP from hook return",
    `    addXP,`,
    `    spendXP,
    addXP,`
  );
}

console.log(`\n${fixes} fixes applied.`);
console.log("Now run: npm run build");
